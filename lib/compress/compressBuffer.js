import pngquant from "./pngquant.js";
import mozjpeg from "./mozjpeg.js";
import cwebp from "./cwebp.js";

const compressors = [cwebp, pngquant, mozjpeg];

export default (parameters = {}) =>
  async (buffer) => {
    for (const compressor of compressors) {
      buffer = await compressor(parameters)(buffer);
    }
    return buffer;
  };
