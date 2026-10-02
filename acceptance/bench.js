import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { photoLike, startOrigin } from "./fixtures/origin.js";
import { startService } from "./helpers/service.js";

const runs = Number(process.env.BENCH_RUNS || 20);
const width = 1200;
const formats = ["jpg", "webp", "png"];
const imagesDir = fileURLToPath(new URL("./bench-images/", import.meta.url));

async function loadImages() {
  const names = (await readdir(imagesDir).catch(() => [])).filter((name) =>
    /\.(jpe?g|png|webp)$/i.test(name),
  );
  if (names.length === 0) {
    console.log("images: generated (add real photos to acceptance/bench-images/)");
    return {
      "/generated-3000x2000.jpg": [
        "image/jpeg",
        await photoLike(3000, 2000).jpeg({ quality: 90 }).toBuffer(),
      ],
    };
  }

  console.log(`images: ${names.length} from acceptance/bench-images/`);
  const files = {};
  for (const name of names) {
    files[`/${name}`] = [
      "application/octet-stream",
      await readFile(path.join(imagesDir, name)),
    ];
  }
  return files;
}

const percentile = (sorted, p) => sorted[Math.ceil(sorted.length * p) - 1];

const images = await loadImages();
const origin = await startOrigin(images);
const service = await startService({ SSRF_ALLOW_ORIGINS: origin.url });

console.log(`service: ${process.env.SERVICE_CMD || "node server.js"}`);
console.log(`runs: ${runs} per row, sequential, width=${width}\n`);
console.log(
  ["image", "format", "p50 ms", "p95 ms", "bytes"]
    .map((heading, i) => (i === 0 ? heading.padEnd(28) : heading.padStart(8)))
    .join(" "),
);

try {
  for (const pathname of Object.keys(images)) {
    for (const format of formats) {
      const source = encodeURIComponent(`${origin.url}${pathname}`);
      const url = `${service.url}/v2/image/${source}?width=${width}&format=${format}`;

      const timings = [];
      let bytes;
      // The first request also fills the origin cache, so it is not measured.
      for (let run = 0; run <= runs; run++) {
        const started = performance.now();
        const res = await fetch(url);
        bytes = (await res.arrayBuffer()).byteLength;
        if (!res.ok) throw new Error(`${url} returned ${res.status}`);
        if (run > 0) timings.push(performance.now() - started);
      }
      timings.sort((a, b) => a - b);

      console.log(
        [
          pathname.slice(1).padEnd(28),
          format.padStart(8),
          percentile(timings, 0.5).toFixed(0).padStart(8),
          percentile(timings, 0.95).toFixed(0).padStart(8),
          String(bytes).padStart(8),
        ].join(" "),
      );
    }
  }
} finally {
  await service.stop();
  await origin.stop();
}
