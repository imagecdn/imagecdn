import os from "os";
import throng from "throng";
import makeFetchHappen from "make-fetch-happen";

import Fastify from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyReplyFrom from "@fastify/reply-from";

import Parameters from "./lib/parameters.js";
import mime from "mime-types";
import { fileTypeFromBuffer } from "file-type";

import acceptReader from "./lib/decorators/acceptReader.js";
import transformBuffer from "./lib/transform/transformBuffer.js";
import compressBuffer from "./lib/compress/compressBuffer.js";

const port = process.env.PORT || 3000;
const workers = process.env.WEB_CONCURRENCY || 1;
const logLevel = process.env.LOG_LEVEL || "info";
const imageRateLimitMax = Number(process.env.IMAGE_RATELIMIT_MAX || 10);
const imageRateLimitWindow = Number(process.env.IMAGE_RATELIMIT_WINDOW || 1000);

const fetch = makeFetchHappen.defaults({
  cacheManager: os.tmpdir(),
});

const fastify = Fastify({
  logger: {
    level: logLevel,
  },
  maxParamLength: 1024,
});
await fastify.register(acceptReader);
await fastify.register(fastifyRateLimit, {});
await fastify.register(fastifyReplyFrom, {
  base: "https://imagecdn.github.io",
});

const proxyHandler = () => (request, reply) => {
  const { path } = request;
  return reply.from(path, {
    rewriteRequestHeaders: function (request, headers) {
      headers["host"] = "imagecdn.app";
      return headers;
    },
  });
};
fastify.get("/getting-started", proxyHandler());
fastify.get("/docs", proxyHandler());
fastify.get("/about", proxyHandler());
fastify.get("/js/*", proxyHandler());
fastify.get("/images/*", proxyHandler());
fastify.get("/", proxyHandler());

fastify.get("/v2/health", function (request, reply) {
  reply.header(
    "Cache-Control",
    ["private", "max-age=0", "no-cache", "no-store", "must-revalidate"].join(
      ", ",
    ),
  );
  reply.header("Expires", new Date(Date.now() - 1000).toUTCString());
  return reply.send({
    status: "OK",
    latestCheck: Date.now(),
  });
});
fastify.get(
  "/v2/image/:imageUri",
  {
    config: {
      rateLimit: {
        max: imageRateLimitMax,
        window: imageRateLimitWindow,

        // restrict unknown origins
        keyGenerator: function (request) {
          const { imageUri } = request.params;
          const { origin } = new URL(imageUri);
          return origin;
        },

        errorResponseBuilder: function (request, context) {
          return {
            statusCode: 429,
            error: "Too Many Requests",
            message: `This origin has exceeded our generous fair usage allowance. To increase your quota, please email imagecdn.support@imagecdn.app`,
            date: Date.now(),
            expiresIn: context.ttl,
          };
        },
      },
    },
  },
  async function imageV2(request, reply) {
    const { imageUri } = request.params;

    const parameters = new Parameters(
      Object.assign(
        {
          uri: imageUri,
        },
        request.query,
      ),
    );

    return (
      fetch(parameters.uri, {
        cache: "force-cache",
      })
        .catch((err) => {
          request.log.error(err);
          reply.status(404);
          return reply.send({
            error: "Image not found.",
          });
        })

        .then((res) => res.buffer())
        .then(async (buffer) => {
          if (!parameters.format) {
            const { ext } = await fileTypeFromBuffer(buffer);

            // We treat WebP and JPG as one and the same.
            // This allows older browsers to be served the right image format.
            if (ext === "jpg" || ext === "webp") {
              parameters.format = "jpg";
              if (request.alternativeFormats.has("jpg")) {
                parameters.format = request.alternativeFormats.get("jpg");
              }

              //
            } else if (ext === "png") {
              parameters.format = "png";
            }
          }
          return buffer;
        })
        .then((buffer) => transformBuffer(parameters)(buffer))
        .then((buffer) => compressBuffer(parameters)(buffer))
        .then((image) => {
          reply.header("Content-Length", image.byteLength);
          reply.header("Content-Type", mime.contentType(parameters.format));
          reply.header("ICDN-Format", parameters.format);

          // Instruct upstream proxies to cache this for a month.
          const cacheTtl = 60 * 60 * 24 * 30;
          reply.header(
            "Cache-Control",
            `public, max-age=${cacheTtl} s-maxage=${cacheTtl}`,
          );
          reply.header(
            "Expires",
            new Date(Date.now() + cacheTtl * 1000).toUTCString(),
          );

          // Allow CORS from everywhere for more advanced image use-cases.
          reply.header("Access-Control-Allow-Origin", "*");

          return reply.send(image);
        })

        // Generic error handling.
        .catch((err) => {
          request.log.error(err);
          reply.status(503);
          return reply.send({
            error:
              "An unexpected error occurred, if the issue persists please get in touch with imagecdn.support@imagecdn.app",
          });
        })
    );
  },
);
// Handle redirects from /v1/ service to /v2/
fastify.get("/v1/images/*", (request, reply) => {
  reply.header(
    "Location",
    request.originalUrl
      // Endpoint is now singular.
      .replace("/v1/images/", "/v2/image/")
      // Fill is now Fit to reflect common terminology.
      .replace("fill=", "fit="),
  );
  reply.status(301);
  return reply.send();
});

async function main() {
  fastify.log.info("Server starting");
  try {
    await fastify.listen({ port, host: "::" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

throng({
  workers,
  lifetime: Infinity,
  worker: main,
});
