import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before } from "node:test";

import { startOrigin } from "../fixtures/origin.js";

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startService(env = {}) {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const tmpdir = await mkdtemp(path.join(os.tmpdir(), "imagecdn-acceptance-"));

  const childEnv = {
    ...process.env,
    PORT: String(port),
    TMPDIR: tmpdir,
    LOG_LEVEL: "warn",
    IMAGE_RATELIMIT_MAX: "100000",
    ...env,
  };
  delete childEnv.REDIS_URL;

  const child = spawn(process.env.SERVICE_CMD || "node server.js", {
    shell: true,
    // Own process group, so stop() also reaches the workers the service forks.
    detached: true,
    env: childEnv,
    stdio: process.env.SERVICE_LOGS ? "inherit" : "ignore",
  });
  const exited = new Promise((resolve) => child.once("exit", resolve));

  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      process.kill(-child.pid, "SIGTERM");
    }
    await exited;
    await rm(tmpdir, { recursive: true, force: true });
  };

  const deadline = Date.now() + 15000;
  for (;;) {
    if (child.exitCode !== null) {
      await stop();
      throw new Error(`Service exited with code ${child.exitCode} on startup`);
    }
    const healthy = await fetch(`${url}/v2/health`).then(
      (res) => res.ok,
      () => false,
    );
    if (healthy) break;
    if (Date.now() > deadline) {
      await stop();
      throw new Error("Service did not become healthy within 15s");
    }
    await sleep(100);
  }

  return { url, stop };
}

// Starts a fixture origin and a service that is allowed to fetch from it, for
// the lifetime of the calling test file.
export function useService(env = {}) {
  const context = {
    get(pathname, init = {}) {
      return fetch(`${context.service.url}${pathname}`, {
        signal: AbortSignal.timeout(15000),
        ...init,
      });
    },

    // source is a path on the fixture origin, or an absolute URL.
    image(source, query = {}, init = {}) {
      const uri = source.startsWith("/")
        ? `${context.origin.url}${source}`
        : source;
      const search = new URLSearchParams(query).toString();
      return context.get(
        `/v2/image/${encodeURIComponent(uri)}${search ? `?${search}` : ""}`,
        init,
      );
    },
  };

  before(async () => {
    context.origin = await startOrigin();
    context.service = await startService({
      SSRF_ALLOW_ORIGINS: context.origin.url,
      ...env,
    });
  });

  after(async () => {
    await context.service?.stop();
    await context.origin?.stop();
  });

  return context;
}

export const bodyOf = async (res) => Buffer.from(await res.arrayBuffer());
