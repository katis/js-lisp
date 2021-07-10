import { generate } from 'astring';
import * as jasp from './lib/jasp.js';

await jasp.default();
jasp.start();

export const parse = source => jasp.parse(source);

export const compile = source => generate(parse(source));

export const compileAst = programAst => generate(jasp.compile(programAst));

export const evaluate = source => {
  const blob = new Blob([source], {
    type: 'text/javascript',
  });
  const url = URL.createObjectURL(blob);
  return import(url);
};
