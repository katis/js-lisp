import { extend } from './protocol';
import { Eq } from './common';

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

extend(Keyword, Eq, {
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

extend(Identifier, Eq, {
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
