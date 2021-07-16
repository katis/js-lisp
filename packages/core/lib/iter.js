import { vec } from './vec.js';

const isIterable = value => Boolean(value && value[Symbol.iterator]);

const getIterator = value =>
    typeof value.next === 'function' ? value : value[Symbol.iterator]();

const done = { done: true, value: undefined };

class IterableTransformer {
  /** @param {Iterable} iterable */
  constructor(iterable) {
    this.iterable = iterable;
    this._iterator = null;
    this._result = null;
  }

  result(value) {
    if (!this._result) {
      this._result = { done: false, value: undefined };
    }
    this._result.value = value;
    return this._result;
  }

  get iterator() {
    if (!this._iterator) {
      this._iterator = getIterator(this.iterable);
    }
    return this._iterator;
  }
}

class MapIterator extends IterableTransformer {
  /**
   * @param {Iterable} iterable
   * @param {Function} fn
   */
  constructor(iterable, fn) {
    super(iterable);
    this.fn = fn;
  }

  [Symbol.iterator]() {
    return new MapIterator(this.iterable, this.fn);
  }

  next() {
    const result = this.iterator.next();
    if (result.done) {
      return result;
    }
    return this.result(this.fn(result.value));
  }
}

class FilterIterator extends IterableTransformer {
  /**
   * @param {Iterable} iterable
   * @param {Function} predicate
   */
  constructor(iterable, predicate) {
    super(iterable);
    this.predicate = predicate;
  }

  [Symbol.iterator]() {
    return new FilterIterator(this.iterable, this.predicate);
  }

  next() {
    while (true) {
      const result = this.iterator.next();
      if (result.done || this.predicate(result.value)) {
        return result;
      }
    }
  }
}

class FlatMapIterator extends IterableTransformer {
  /**
   * @param {Iterable} iterable
   * @param {Function} fn
   */
  constructor(iterable, fn) {
    super(iterable);
    this.fn = fn;
    this.current = null;
  }

  [Symbol.iterator]() {
    return new FlatMapIterator(this.iterable, this.fn);
  }

  next() {
    while (true) {
      if (!this.current) {
        const result = this.iterator.next();
        if (result.done) {
          return result;
        } else {
          const value = this.fn(result.value);
          if (isIterable(value)) {
            this.current = value[Symbol.iterator]();
          } else {
            return this.result(value);
          }
        }
      }

      const result = this.current.next();
      if (result.done) {
        this.current = null;
      } else {
        return result;
      }
    }
  }
}

class Take extends IterableTransformer {
  constructor(iterable, count) {
    super(iterable);
    this.n = 0;
    this.count = count;
  }

  [Symbol.iterator]() {
    return new Take(this.iterable, this.count);
  }

  next() {
    if (this.n++ >= this.count) {
      return done;
    }
    return this.iterator.next();
  }
}

export const reduce = (iterable, init, fn) => {
  const iterator = iterable[Symbol.iterator]();
  let previous = init;
  let result;
  while ((result = iterator.next()), !result.done) {
    previous = fn(previous, result.value);
  }
  return previous;
};

export const map = (iterable, fn) => new MapIterator(iterable, fn);
export const filter = (iterable, predicate) => new FilterIterator(iterable, predicate);
export const flatMap = (iterable, fn) => new FlatMapIterator(iterable, fn);
export const take = (iterable, count) => new Take(iterable, count);
