import { generate } from "astring";
import * as jasp from "./lib/jasp.js";
import * as fs from "fs/promises";

const wasm = await fs.readFile("./lib/jasp_bg.wasm");
await jasp.default(wasm.buffer);

export function transpile(source) {
  const astString = jasp.transpile(source);
  const ast = JSON.parse(astString);
  return generate(ast);
}
