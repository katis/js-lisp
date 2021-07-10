const $protocol = Symbol('protocol');

const getMethodNames = target =>
  Object.getOwnPropertyNames(target.prototype).filter(
    key => key !== 'constructor',
  );

export const defProtocol = protocolDef => {
  const methodNames = getMethodNames(protocolDef);
  const protocolName = protocolDef.name;
  const id = Symbol(`Π:${protocolName}`);

  const methodSymbols = methodNames.reduce((symbolMap, name) => {
    const symbol = Symbol(`Π:${protocolName}.${name}`);
    symbolMap[name] = symbol;
    return symbolMap;
  }, {});

  const prototype = methodNames.reduce(
    (prototype, name) => {
      const symbol = prototype[$protocol].methodSymbols[name];
      prototype[name] = (target, ...args) => target[symbol](...args);
      return prototype;
    },
    {
      [$protocol]: { id, methodSymbols },
      get [Symbol.toStringTag]() {
        return protocolName;
      },
    },
  );

  return Object.create(prototype, {
    name: { value: protocolName, enumerable: true },
  });
};

export const extendProtocol = (target, protocol, fns) => {
  target.prototype[protocol[$protocol].id] = true;
  Object.entries(fns).forEach(([key, fn]) => {
    const symbol = protocol[$protocol].methodSymbols[key];
    target.prototype[symbol] = fn;
  });
};

export const satisfies = (protocol, value) =>
  value[protocol[$protocol].id] === true;
