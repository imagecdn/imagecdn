import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";

import { bodyOf, useService } from "../helpers/service.js";

const ctx = useService();

const metadataOf = async (res) => sharp(await bodyOf(res)).metadata();

test("resizes a JPEG by width and keeps the aspect ratio", async () => {
  const res = await ctx.image("/photo.jpg", { width: 400 });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/jpeg");

  const { format, width, height } = await metadataOf(res);
  assert.deepEqual({ format, width, height }, {
    format: "jpeg",
    width: 400,
    height: 300,
  });
});

test("resizes to exact dimensions with fit=cover", async () => {
  const res = await ctx.image("/photo.jpg", {
    width: 200,
    height: 200,
    fit: "cover",
  });
  const { width, height } = await metadataOf(res);
  assert.deepEqual({ width, height }, { width: 200, height: 200 });
});

test("keeps a PNG source as PNG", async () => {
  const res = await ctx.image("/photo.png", { width: 400 });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.equal((await metadataOf(res)).format, "png");
});

test("serves a WebP source as JPEG to clients that do not accept WebP", async () => {
  const res = await ctx.image("/photo.webp", {}, { headers: { accept: "*/*" } });
  assert.equal(res.status, 200);
  assert.equal((await metadataOf(res)).format, "jpeg");
});

test("serves a JPEG source as WebP to clients that accept WebP", async () => {
  const res = await ctx.image(
    "/photo.jpg",
    {},
    { headers: { accept: "image/webp,*/*" } },
  );
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/webp");
  assert.equal((await metadataOf(res)).format, "webp");
});

test("converts to the format given in the query string", async () => {
  const res = await ctx.image("/photo.jpg", { format: "png" });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.equal((await metadataOf(res)).format, "png");
});

test("rasterises an SVG source when a format is given", async () => {
  const res = await ctx.image("/icon.svg", { format: "png", width: 200 });
  assert.equal(res.status, 200);
  const { format, width, height } = await metadataOf(res);
  assert.deepEqual({ format, width, height }, {
    format: "png",
    width: 200,
    height: 100,
  });
});

test(
  "accepts an SVG source without a format",
  { todo: "phase 2: SVG without format" },
  async () => {
    const res = await ctx.image("/icon.svg", { width: 200 });
    assert.equal(res.status, 200);
  },
);

test(
  "multiplies the dimensions by dpr",
  { todo: "phase 2: dpr is not implemented" },
  async () => {
    const res = await ctx.image("/photo.jpg", { width: 200, dpr: 2 });
    assert.equal((await metadataOf(res)).width, 400);
  },
);
