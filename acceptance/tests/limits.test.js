import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

const ctx = useService({
  FETCH_TIMEOUT_MS: "500",
  MAX_SOURCE_BYTES: "10000",
  MAX_DIMENSION: "4000",
});
const todo = "phase 1: resource limits";

test("serves a source below the size limit", async () => {
  const res = await ctx.image("/icon.svg", { format: "png" });
  assert.equal(res.status, 200);
});

test("gives up on an origin that is slower than the timeout", { todo }, async () => {
  const started = Date.now();
  const res = await ctx.image("/slow.jpg");
  assert.equal(res.status, 504);
  assert.ok(Date.now() - started < 2000, "did not time out early");
});

test("rejects a source above the size limit", { todo }, async () => {
  const res = await ctx.image("/photo.jpg");
  assert.equal(res.status, 413);
});

test("rejects a source above the size limit sent without a length", { todo }, async () => {
  const res = await ctx.image("/chunked.jpg");
  assert.equal(res.status, 413);
});

for (const dimension of ["width", "height"]) {
  test(`rejects a ${dimension} above the limit`, { todo }, async () => {
    const res = await ctx.image("/icon.svg", { format: "png", [dimension]: 4001 });
    assert.equal(res.status, 400);
  });
}
