import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

const ctx = useService();
const todo = "phase 1: parameter allowlist";

test("ignores a uri in the query string", { todo }, async () => {
  const res = await ctx.image("/photo.jpg", {
    uri: `${ctx.origin.canaryUrl}/secret.jpg`,
  });
  assert.equal(res.status, 200);
  assert.equal(ctx.origin.canaryHits(), 0);
});

for (const [name, value] of [
  ["format", "html"],
  ["format", "bogus"],
  ["fit", "bogus"],
  ["quality", "bogus"],
]) {
  test(`rejects ${name}=${value}`, { todo }, async () => {
    const res = await ctx.image("/photo.jpg", { [name]: value });
    assert.equal(res.status, 400);
  });
}
