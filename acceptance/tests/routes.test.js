import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

const ctx = useService();

test("health check reports OK and is not cacheable", async () => {
  const res = await ctx.get("/v2/health");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control"), /no-store/);
  assert.equal((await res.json()).status, "OK");
});

test("redirects v1 image URLs to v2", async () => {
  const source = encodeURIComponent(`${ctx.origin.url}/photo.jpg`);
  const res = await ctx.get(`/v1/images/${source}?width=100&fill=cover`, {
    redirect: "manual",
  });
  assert.equal(res.status, 301);
  assert.equal(
    res.headers.get("location"),
    `/v2/image/${source}?width=100&fit=cover`,
  );
});
