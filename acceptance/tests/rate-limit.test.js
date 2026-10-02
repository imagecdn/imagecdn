import assert from "node:assert/strict";
import { test } from "node:test";

import { useService } from "../helpers/service.js";

const ctx = useService({
  IMAGE_RATELIMIT_MAX: "3",
  IMAGE_RATELIMIT_WINDOW: "1000",
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const statusOf = async (res) => {
  await res.arrayBuffer();
  return res.status;
};

test("limits requests above the maximum", async () => {
  const statuses = [];
  for (let i = 0; i < 4; i++) {
    statuses.push(await statusOf(await ctx.image("/photo.jpg", { width: 10 + i })));
  }
  assert.deepEqual(statuses, [200, 200, 200, 429]);
});

test(
  "allows requests again after the window",
  { todo: "phase 1: rate-limit config" },
  async () => {
    await sleep(1200);
    assert.equal(await statusOf(await ctx.image("/photo.jpg")), 200);
  },
);

test(
  "does not limit the health check",
  { todo: "phase 1: rate-limit config" },
  async () => {
    const statuses = new Set();
    for (let batch = 0; batch < 22; batch++) {
      const responses = await Promise.all(
        Array.from({ length: 50 }, () => ctx.get("/v2/health").then(statusOf)),
      );
      responses.forEach((status) => statuses.add(status));
    }
    assert.deepEqual([...statuses], [200]);
  },
);
