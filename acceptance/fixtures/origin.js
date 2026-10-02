import http from "node:http";
import sharp from "sharp";

// Deterministic, so sizes and benchmark results are comparable between runs.
// The channels share one brightness pattern, as in a real photo: with
// independent channels pngquant cannot reach its quality target and gives up.
export function photoLike(width, height) {
  let seed = 1;
  const noise = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32 - 0.5;
  };

  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const light = Math.sin(x / 40) * Math.cos(y / 55);
      for (let channel = 0; channel < 3; channel++) {
        const tint = Math.sin(x / (300 + channel * 90) + y / (400 - channel * 70));
        pixels[(y * width + x) * 3 + channel] =
          128 + 70 * light + 30 * tint + 6 * noise();
      }
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } });
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="#c33"/></svg>`;

const listen = (handler) =>
  new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });

const urlOf = (server) => `http://127.0.0.1:${server.address().port}`;

const close = (server) =>
  new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  });

export async function startOrigin(extraFiles = {}) {
  const photo = () => photoLike(800, 600);
  const files = {
    "/photo.jpg": ["image/jpeg", await photo().jpeg({ quality: 95 }).toBuffer()],
    "/photo.png": ["image/png", await photo().png().toBuffer()],
    "/photo.webp": ["image/webp", await photo().webp({ quality: 95 }).toBuffer()],
    "/exif.jpg": [
      "image/jpeg",
      await photo()
        .withExif({ IFD0: { Copyright: "acceptance fixture" } })
        .jpeg()
        .toBuffer(),
    ],
    "/icon.svg": ["image/svg+xml", Buffer.from(svg)],
    "/text": ["text/plain", Buffer.from("not an image")],
    ...extraFiles,
  };

  let canaryHits = 0;
  const canary = await listen((req, res) => {
    canaryHits++;
    res.setHeader("Content-Type", "image/jpeg");
    res.end(files["/photo.jpg"][1]);
  });

  const origin = await listen((req, res) => {
    const { pathname } = new URL(req.url, "http://origin");
    const [type, body] = files[pathname] || files["/photo.jpg"];

    switch (pathname) {
      case "/missing":
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html");
        return res.end("<html>Not Found</html>");

      case "/redirect-to-canary":
        res.statusCode = 302;
        res.setHeader("Location", `${urlOf(canary)}/secret.jpg`);
        return res.end();

      case "/slow.jpg":
        return setTimeout(() => {
          res.setHeader("Content-Type", type);
          res.end(body);
        }, 3000);

      // No Content-Length, so a size limit has to count the bytes it reads.
      case "/chunked.jpg":
        res.setHeader("Content-Type", type);
        res.write(body.subarray(0, 1024));
        return res.end(body.subarray(1024));

      default:
        if (!files[pathname]) {
          res.statusCode = 404;
          return res.end();
        }
        res.setHeader("Content-Type", type);
        res.setHeader("Content-Length", body.byteLength);
        return res.end(body);
    }
  });

  return {
    url: urlOf(origin),
    canaryUrl: urlOf(canary),
    canaryHits: () => canaryHits,
    file: (pathname) => files[pathname][1],
    stop: () => Promise.all([close(origin), close(canary)]),
  };
}
