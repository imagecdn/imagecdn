import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";

import { bodyOf, useService } from "../helpers/service.js";

const ctx = useService();

const formats = ["jpg", "webp", "png"];

const pixelsOf = (image) =>
  sharp(image).removeAlpha().toColourspace("srgb").raw().toBuffer();

// Peak signal-to-noise ratio in dB. Higher is closer to the source.
async function psnr(image, reference) {
  const [a, b] = await Promise.all([pixelsOf(image), pixelsOf(reference)]);
  assert.equal(a.length, b.length, "images differ in dimensions");

  let squaredError = 0;
  for (let i = 0; i < a.length; i++) {
    squaredError += (a[i] - b[i]) ** 2;
  }
  return 10 * Math.log10(255 ** 2 / (squaredError / a.length));
}

const sizeOf = async (source, query) => {
  const res = await ctx.image(source, query);
  assert.equal(res.status, 200);
  return (await bodyOf(res)).byteLength;
};

for (const format of formats) {
  test(`${format}: output is smaller than the source`, async () => {
    const source = `/photo.${format}`;
    const size = await sizeOf(source, { format });
    assert.ok(
      size < ctx.origin.file(source).byteLength,
      `${size} bytes is not smaller than the source`,
    );
  });
}

for (const format of formats) {
  test(
    `${format}: a lower quality gives a smaller file`,
    format === "webp" && { todo: "phase 2: WebP low and medium are identical" },
    async () => {
      const [low, medium, high] = await Promise.all(
        ["low", "medium", "high"].map((quality) =>
          sizeOf("/photo.png", { format, quality }),
        ),
      );
      assert.ok(low < medium, `low (${low}) is not below medium (${medium})`);
      assert.ok(medium < high, `medium (${medium}) is not below high (${high})`);
    },
  );
}

for (const format of formats) {
  test(`${format}: default quality stays close to the source`, async () => {
    const res = await ctx.image("/photo.png", { format });
    const fidelity = await psnr(await bodyOf(res), ctx.origin.file("/photo.png"));
    assert.ok(fidelity >= 38, `PSNR is ${fidelity.toFixed(1)} dB`);
  });
}

for (const format of ["png", "webp"]) {
  test(
    `${format}: quality=lossless keeps every pixel`,
    { todo: "phase 2: lossless output is lossy" },
    async () => {
      const res = await ctx.image("/photo.png", { format, quality: "lossless" });
      assert.equal(res.status, 200);
      const [output, source] = await Promise.all([
        pixelsOf(await bodyOf(res)),
        pixelsOf(ctx.origin.file("/photo.png")),
      ]);
      assert.ok(output.equals(source), "pixels differ from the source");
    },
  );
}

test("strips metadata from the output", async () => {
  assert.ok((await sharp(ctx.origin.file("/exif.jpg")).metadata()).exif);

  const res = await ctx.image("/exif.jpg");
  assert.equal(res.status, 200);
  assert.equal((await sharp(await bodyOf(res)).metadata()).exif, undefined);
});
