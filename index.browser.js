import { generate } from "astring";
import * as jasp from "./lib/jasp.js";

await jasp.default();

export function transpile(source) {
  const astString = jasp.transpile(source);
  console.log("AST", astString);
  const ast = JSON.parse(astString);
  return generate(ast);
}
