import { execa } from "execa";
import cwebp from "cwebp-bin";

export default (parameters = {}) =>
  async (buffer) => {
    if (parameters.format !== "webp") {
      return buffer;
    }

    const args = ["-quiet", "-mt"];

    switch (parameters.quality || "") {
      case "lossless":
        args.push("-lossless");
        break;

      case "low":
        break;

      case "medium":
        break;

      case "high":
      default:
        args.push("-q", "80");
    }

    args.push("-o", "-");
    args.push("--", "-");

    try {
      const { stdout } = await execa(cwebp, args, {
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
