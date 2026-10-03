import throng from "throng";

// The master only forks. Loading the app here would give it a full copy of
// Fastify, sharp and a Redis connection that it never uses.
throng({
  workers: process.env.WEB_CONCURRENCY || 1,
  lifetime: Infinity,
  worker: () => import("./server.js"),
});
