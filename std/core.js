import { extendProtocol } from './protocol';
import { Eq } from './common';

/**
 * Returns a hash code for a string
 * @param {string} str
 * @param {number} seed
 * @returns number
 */
export const hashCyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export class Keyword {
  /**
   * @param {string} module
   * @param {string} name
   * @param {number} hashCode
   * @param {string} [fullName]
   */
  constructor(module, name, hashCode, fullName = `:${module}/${name}`) {
    this.module = module;
    this.name = name;
    this.hashCode = hashCode;
    this.fullName = fullName;
  }

  [Symbol.toStringTag]() {
    return this.fullName;
  }
}

extendProtocol(Keyword, Eq, {
  equals(other) {
    return other instanceof Keyword && this.hashCode === other.hashCode;
  },
});

/**
 * @param {any} value
 * @returns {value is Keyword}
 */
export const isKeyword = value => value instanceof Keyword;

/**
 * @param {string} module
 * @param {string} name
 * @returns
 */
export const keyword = (module, name) => {
  const fullName = `:${module}/${name}`;
  const hashCode = hashCyrb53(fullName);
  return new Keyword(module, name, hashCode, fullName);
};

export class Identifier {
  /**
   * @param {string} name
   * @param {number} hashCode
   */
  constructor(name, hashCode) {
    this.identifier = name;
    this.hashCode = hashCode;
  }

  [Symbol.toStringTag]() {
    return this.identifier;
  }
}

extendProtocol(Identifier, Eq, {
  equals(other) {
    return other instanceof Identifier && this.hashCode === other.hashCode;
  },
});

/**
 * @param {string} name
 * @returns Identifier
 */
export const identifier = name => {
  const hashCode = hashCyrb53(name);
  return new Identifier(name, hashCode);
};

/**
 * @param {any} value
 * @returns {value is Identifier}
 */
export const isIdentifier = value => value instanceof Identifier;
