import { execa } from "execa";
import mozjpeg from "mozjpeg";

export default (parameters = {}) =>
  async (buffer) => {
    if (parameters.format !== "jpg") {
      return buffer;
    }

    const args = [];

    switch (parameters.quality || "") {
      case "lossless":
        break;

      case "low":
        args.push("-quant-table", 2);
        args.push("-quality", 20);
        args.push("-optimise");
        break;

      case "medium":
        args.push("-quant-table", 2);
        args.push("-quality", 50);
        args.push("-optimise");
        break;

      case "high":
      default:
        args.push("-quant-table", 2);
        args.push("-quality", 70);
        args.push("-optimise");
    }

    try {
      const { stdout } = await execa(mozjpeg, args, {
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
