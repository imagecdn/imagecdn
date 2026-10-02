import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

const ctx = useService();

test(
  "marks images as cacheable by browsers and shared caches",
  { todo: "phase 1: Cache-Control comma" },
  async () => {
    const res = await ctx.image("/photo.jpg");
    const directives = res.headers
      .get("cache-control")
      .split(",")
      .map((directive) => directive.trim());

    assert.ok(directives.includes("public"));
    assert.ok(directives.some((directive) => /^max-age=[1-9]\d*$/.test(directive)));
    assert.ok(directives.some((directive) => /^s-maxage=[1-9]\d*$/.test(directive)));
  },
);

test("allows cross-origin use of images", async () => {
  const res = await ctx.image("/photo.jpg");
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("varies on Accept when the format depends on it", async () => {
  const res = await ctx.image("/photo.jpg", {}, { headers: { accept: "image/webp" } });
  assert.match(res.headers.get("vary"), /accept/i);
});

test(
  "does not vary on Accept when the format is given",
  { todo: "phase 2: CDN cache key" },
  async () => {
    const res = await ctx.image(
      "/photo.jpg",
      { format: "png" },
      { headers: { accept: "image/webp" } },
    );
    assert.equal(res.headers.get("vary"), null);
  },
);
