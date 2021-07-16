// @ts-check

import { satisfies, Protocol, extend } from './protocol.js';

const $Eq = Symbol('Eq');
const $equals = Symbol('Eq.equals');

export const Eq = new (class Eq extends Protocol {
  constructor() {
    super($Eq, { equals: $equals });
  }

  equals(a, b) {
    return a[this.symbols.equals](b);
  }
})();

const hasOwnProperty = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

function objectEquals(other) {
  for (const key in this) {
    if (
      hasOwnProperty(this, key) &&
      (!hasOwnProperty(other, key) || !equals(this[key], other[key]))
    ) {
      return false;
    }
  }
  for (const key in other) {
    if (hasOwnProperty(other, key) && !hasOwnProperty(this, key)) {
      return false;
    }
  }
  return true;
}

export const addObjectEquals = o => {
  o[$Eq] = true;
  o[$equals] = objectEquals;
  return o;
};

const arrayEquals = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!equals(a[i], b[i])) return false;
  }
  return true;
};

export const equals = (a, b) => {
  if (a === b || (a == null && b == null)) {
    return true;
  } else if (Array.isArray(a) && Array.isArray(b)) {
    return arrayEquals(a, b);
  } else if (satisfies(Eq, a)) {
    return Eq.equals(a, b);
  } else {
    return false;
  }
};
