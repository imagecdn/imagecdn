import { execa } from "execa";
import pngquant from "pngquant-bin";

export default (parameters = {}) =>
  async (buffer) => {
    if (parameters.format !== "png") {
      return buffer;
    }

    const args = ["-"];

    switch (parameters.quality || "") {
      case "lossless":
        break;

      case "low":
        args.push("--quality", "20-60");
        break;

      case "medium":
        args.push("--quality", "60-80");
        break;

      case "high":
      default:
        args.push("--quality", "80-100");
    }

    try {
      const { stdout } = await execa(pngquant, args, {
        encoding: null,
        input: buffer,
        maxBuffer: Infinity,
      });
      buffer = stdout;
    } catch (err) {
      console.warn(err);
    }

    return buffer;
  };
