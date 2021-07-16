import { addObjectEquals } from './lib/common';

export {
  Keyword,
  isKeyword,
  Identifier,
  isIdentifier,
  identifier,
  keyword,
} from './lib/core';
export { vec, __vecLiteral, isVec, EMPTY as EMPTY_VEC } from './lib/vec';
export { extend, satisfies, Protocol } from './lib/protocol';
export { equals, Eq } from './lib/common';

export const str = (...args) => args.join('');

export const obj = addObjectEquals;

export const merge = (a, b) => ({ ...a, ...b });

/*

(def foo 12)
=
export const foo = 12

----

(defn add [a b] (+ a b))
=
export function add(a, b) {
  return a + b;
}

----

(fn ([a b] (+ a b))
    ([a b c] (+ a b c))
    ([a b c d] (+ a b c d))
    ([a b c d e] (+ a b c d e)))
    ([a b c d e, ...rest] (apply + a b c d e rest)))
    
=

(a, b, c, d, e, ...rest) => {
  if (c === void 0) {
    return a + b
  } else if (d === void 0) {
    return a + b + c
  } else if (e === void 0) {
    return a + b + c + d
  } else if (rest.length === 0) {
    return a + b + c + d + e
  } else {
    return std.plus(a, b, c, d, e, ...rest)
  }
}

----

(fn add [& args] (+ & rest))
=
function add (a, ...rest) {
  return add(a, ...rest)
}

---

(apply f a b '(c d))
=
fn(a b, ...[c d])


*/
