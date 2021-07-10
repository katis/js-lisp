// @ts-check

import { Eq, equals } from './common';
import { extendProtocol } from './protocol';

const WIDTH_BITS = 5,
  NODE_WIDTH = 1 << WIDTH_BITS,
  LEVEL_MASK = NODE_WIDTH - 1;

const $root = Symbol('vec.Vec.root'),
  $depth = Symbol('vec.Vec.depth'),
  $shift = Symbol('vec.Vec.shift'),
  $size = Symbol('vec.Vec.size');

class Node {
  /** @param {Array} items */
  constructor(items) {
    this.items = items;
  }
}

class Vec {
  /**
   * @param {number} depth
   * @param {number} size
   * @param {Node} node
   */
  constructor(depth, size, node) {
    this[$root] = node;
    this[$depth] = depth | 0;
    this[$shift] = (WIDTH_BITS * (depth - 1)) | 0;
    this[$size] = size | 0;
  }

  get size() {
    return this[$size];
  }

  get [Symbol.toStringTag]() {
    return 'Vec';
  }

  [Symbol.iterator]() {
    return new VecIterator(this);
  }
}

extendProtocol(Vec, Eq, {
  equals(other) {
    if (!other[$root] || this[$size] !== other.size) return false;

    for (let i = 0; i < this[$size]; i++) {
      if (!equals(get(this, i), get(other, i))) {
        return false;
      }
    }
    return true;
  },
});

/**
 * @param {Vec} value
 * @returns {value is Vec}
 */
export const isVec = value => value instanceof Vec;

const done = { done: true, value: undefined };

class VecIterator {
  /** @param {Vec} vec */
  constructor(vec) {
    this.vec = vec;
    this.i = 0;
    this.result = { done: false, value: undefined };
  }

  [Symbol.iterator]() {
    return new VecIterator(this.vec);
  }

  next() {
    if (this.i >= this.vec[$size]) return done;

    this.result.value = get(this.vec, this.i++);
    return this.result;
  }
}

const logWidth = Math.log(NODE_WIDTH);
const lengthToDepth = length =>
  length === 0 ? 0 : Math.ceil(Math.log(length) / logWidth);

/**
 * @param {Array} [items]
 * @returns {Vec}
 */
export const vec = (...items) =>
  items.length === 0 ? vecLiteral() : vecLiteral(items);

/**
 * @param {any[]} [items]
 * @returns {Vec}
 */
export const vecLiteral = items => {
  if (!items) {
    return EMPTY;
  } else if (items.length <= NODE_WIDTH) {
    return new Vec(1, items.length, new Node(items));
  } else {
    const depth = lengthToDepth(items.length);
    const node = createTree(items, depth);
    return new Vec(depth, items.length, node);
  }
};

export const EMPTY = vec([]);

/**
 * @param {Array} items
 * @param {number} maxDepth
 * @param {number} [depth=1]
 * @param {number} [parentIdx=0]
 * @returns {Node | undefined}
 */
const createTree = (items, maxDepth, depth = 1, parentIdx = 0) => {
  if (depth < maxDepth) {
    return generate(NODE_WIDTH, i =>
      createTree(items, maxDepth, depth + 1, parentIdx * NODE_WIDTH + i),
    );
  } else {
    const start = NODE_WIDTH * parentIdx;
    const end = Math.min(items.length, start + NODE_WIDTH);
    if (start >= end) return undefined;
    return new Node(items.slice(start, end));
  }
};

/**
 * @param {number} len
 * @param {(i: number) => any} fn
 * @returns {Node | undefined}
 */
const generate = (len, fn) => {
  let node = undefined;
  for (let i = 0; i < len; i++) {
    const v = fn(i);
    if (v === undefined) {
      return node;
    }
    if (node) {
      node.items.push(v);
    } else {
      node = new Node([v]);
    }
  }
  return node;
};

/**
 * @param {Vec} vec
 * @param {number} key
 */
export const get = (vec, key) => {
  const idx = key | 0;
  if (idx >= vec[$size] || idx < 0) {
    return undefined;
  }

  let node = vec[$root];
  for (let level = vec[$shift]; level > 0; level -= WIDTH_BITS) {
    node = node.items[(idx >>> level) & LEVEL_MASK];
    if (node === undefined) return undefined;
  }

  return node.items[idx & LEVEL_MASK];
};

/**
 * @param {Vec} vec
 * @returns {any | undefined}
 */
export const first = vec => get(vec, 0);

/** @param {Node} node */
const copyNode = node => new Node(node.items.slice());

/**
 * @param {Vec} vec
 * @param {number} key
 * @param {(value: any, index: number) => any} updateFn
 * @returns {Vec}
 */
export const update = (vec, key, updateFn) => {
  const idx = key | 0;
  if (idx >= vec[$size] || idx < 0) {
    return undefined;
  }

  const rootCopy = copyNode(vec[$root]);
  let node = rootCopy;

  for (let level = vec[$shift]; level > 0; level -= WIDTH_BITS) {
    let i = (idx >>> level) & LEVEL_MASK;
    const child = node.items[i];
    if (child === undefined) return undefined;
    const copy = copyNode(child);
    node.items[i] = copy;
    node = copy;
  }

  const i = idx & LEVEL_MASK;
  const value = node.items[i];
  node.items[i] = updateFn(value, key);
  return new Vec(vec[$depth], vec[$size], rootCopy);
};

/**
 * @param {Vec} root
 * @param {number} key
 * @returns {Vec}
 */
export const set = (root, key, value) => update(root, key, () => value);
