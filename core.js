class Keyword {
  constructor(fqName) {
    function keyword(map) {
      return keyword.__call(map);
    }

    keyword.fqName = fqName;
    return Object.setPrototypeOf(keyword, new.target.prototype);
  }

  __call(map) {
    return get(map, this);
  }

  toString() {
    return this.fqName;
  }
}

class List {
  constructor(items = []) {
    this.items = items;
  }

  map(fn) {
  }

  toJSON() {
    return {type: "List", items: this.items};
  }
}

export function get(map, key) {
  if (map instanceof Map) {
    return map.get(key);
  } else {
    return map[key];
  }
}

export const keywordCache = new Map();

export const keywordFinalizers = new FinalizationRegistry((fqName) => {
  keywordCache.delete(fqName);
});

export const list = (items = []) => ({type: "List", items});

export const isList = (list) => list.type === "List";

export function keyword(fqName) {
  const ref = keywordCache.get(fqName);
  let keyword = ref && ref.deref();
  if (!keyword) {
    keyword = new Keyword(fqName);
    keywordCache.set(fqName, new WeakRef(keyword));
    keywordFinalizers.register(keyword, fqName);
  }
  return keyword;
}

export function map(target, fn) {
  if (Array.isArray(target)) {
    return target.map(fn);
  } else {
    return Object.keys(target).reduce((obj, [k, v]) => {
      obj[k] = fn(v, k);
      return obj;
    }, {});
  }
}

export function update(target, key, fn) {
  if (Array.isArray(target)) {
    const copy = target.slice();
    copy[key] = fn(target[key], key);
    return copy;
  } else if (target instanceof Map) {
    const copy = new Map(target);
    return copy.set(key, fn(copy.get(key), key));
  } else {
    return {...target, [key]: fn(target[key], key)};
  }
}
