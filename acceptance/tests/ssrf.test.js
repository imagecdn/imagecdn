import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

// The canary is on loopback but not in SSRF_ALLOW_ORIGINS, so it stands in for
// any internal service. It must never receive a request.
const ctx = useService();
const todo = "phase 2: SSRF filtering";

test("does not fetch from an origin that is not allowed", { todo }, async () => {
  const res = await ctx.image(`${ctx.origin.canaryUrl}/secret.jpg`);
  assert.equal(res.status, 400);
  assert.equal(ctx.origin.canaryHits(), 0);
});

test("does not follow a redirect to a blocked origin", { todo }, async () => {
  const hitsBefore = ctx.origin.canaryHits();
  const res = await ctx.image("/redirect-to-canary");
  assert.equal(res.status, 400);
  assert.equal(ctx.origin.canaryHits(), hitsBefore);
});

test("rejects the cloud metadata address without waiting", { todo }, async () => {
  const res = await ctx.image(
    "http://169.254.169.254/",
    {},
    { signal: AbortSignal.timeout(2000) },
  );
  assert.equal(res.status, 400);
});
