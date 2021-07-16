import { generate } from 'astring';
import * as runo from './lib/jasp.js';
import * as fs from 'fs/promises';

const wasm = await fs.readFile('./lib/jasp_bg.wasm');
await runo.default(wasm.buffer);
runo.start()

export const evaluate = js => {
  const dataUrl = `data:text/javascript,${js}`
  return import(dataUrl)
};
