// @ts-check

import { defProtocol, satisfies } from './protocol';

export const Eq = defProtocol(
    class Eq {
      equals(a, b) {
      }
    },
);

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
  } else if (satisfies(Eq, b)) {
    return Eq.equals(b, a);
  } else {
    return false;
  }
};
