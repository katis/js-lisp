import { addObjectEquals } from './lib/common';

export { Keyword, isKeyword, Identifier, isIdentifier, identifier, keyword } from './lib/core';
export { vec, vecLiteral, isVec, EMPTY as EMPTY_VEC } from './lib/vec';
export { extend, satisfies, Protocol } from './lib/protocol'
export { equals, Eq } from './lib/common'

// TODO: serde-wasm-bindgen doesn't support serializing nulls
export const NULL = null;

export const str = (...args) => args.join('');

export const obj = (o) => addObjectEquals(o)

export const merge = (a, b) => ({ ...a, ...b })