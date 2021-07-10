export { Keyword, isKeyword, Identifier, isIdentifier } from './core';
export { vec, vecLiteral, isVec, EMPTY as EMPTY_VEC } from './vec';

// TODO: serde-wasm-bindgen doesn't support serializing nulls
export const NULL = null;

export const str = (...args) => args.join('');
