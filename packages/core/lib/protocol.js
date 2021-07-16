const $extend = Symbol('extend');

export const extend = (target, protocol, methods) => protocol[$extend](target, methods);
export const satisfies = (protocol, target) => target[protocol.tag] === true;

export class Protocol {
  constructor(tag, symbols) {
    this.tag = tag;
    this.symbols = symbols;
  }

  [$extend](target, methods) {
    target.prototype[this.tag] = true;
    Object.entries(this.symbols).forEach(([key, sym]) => {
      const method = methods[key];
      if (!method) {
        throw Error(`Protocol method "${key}" missing`);
      }
      target.prototype[sym] = method;
    });
  }
}
