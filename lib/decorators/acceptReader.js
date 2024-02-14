import fp from "fastify-plugin";

async function acceptReader(fastify) {
  fastify.decorateRequest("alternativeFormats");
  fastify.addHook("preHandler", (req, res, next) => {
    req.alternativeFormats = new Map();

    // Cloudflare do not support Vary on headers other than Accept-Encoding.
    // Therefore we disable this behaviour when we detect that we're on Cloudflare.
    if (req.headers["cf-ray"]) {
      res.header("ICDN-Accept", "skipped");
      return next();
    }

    // This is a _very_ broad cache-key. Reduce if possible.
    if (req.headers.accept) {
      res.header("Vary", "Accept");
      res.header("ICDN-Accept", req.headers.accept);
      if (req.headers.accept.includes("image/webp")) {
        req.alternativeFormats.set("jpg", "webp");
      }
    }

    return next();
  });
}

export default fp(acceptReader);
