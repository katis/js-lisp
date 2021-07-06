import {generate} from "astring";
import * as jasp from "./lib/jasp.js";

await jasp.default();

export function parse(source) {
  const astString = jasp.transpile(source);
  return JSON.parse(astString);
}

export function transpile(source) {
  return generate(parse(source));
}

export function evaluate(source) {
  const jsSrc = transpile(source);
  return evaluateJs(jsSrc);
}

export function evaluateJs(source) {
  const blob = new Blob([source], {
    type: "text/javascript",
  });
  const url = URL.createObjectURL(blob);
  return import(/* @vite-ignore */ url);
}

export function serialize(ast) {
  jasp.serialize(ast);
}
