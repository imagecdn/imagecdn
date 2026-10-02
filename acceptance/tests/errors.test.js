import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

const ctx = useService();
const todo = "phase 1: error codes";

test("returns 404 when the origin returns 404", { todo }, async () => {
  const res = await ctx.image("/missing");
  assert.equal(res.status, 404);
});

test("returns 400 for a source that is not a URL", { todo }, async () => {
  const res = await ctx.get("/v2/image/not-a-url");
  assert.equal(res.status, 400);
});

test("returns 415 for a source that is not an image", { todo }, async () => {
  const res = await ctx.image("/text");
  assert.equal(res.status, 415);
});
