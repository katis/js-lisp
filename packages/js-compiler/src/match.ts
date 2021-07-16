import type { Ast } from "./Ast";
import { IList, is } from "./common";
import type { Identifier } from "./Token";

export const anyAst = Symbol("Ast");
export type AnyAst = typeof anyAst;

export type Pattern = string | AnyAst | (new (...args: any[]) => Ast);

export type Match<T> = T extends AnyAst
  ? Ast
  : T extends string
  ? Identifier<T>
  : T extends new (...args: any[]) => infer R
  ? R
  : never;

export type Matched<T extends readonly Pattern[]> = {
  [K in keyof T]: Match<T[K]>;
};

export type Tail<T extends IList<any>> = T extends [any, ...infer Rest]
  ? Rest
  : T extends IList<infer I>
  ? IList<I>
  : never;

export function headMatch<Items extends IList<Ast>, P extends Pattern>(
  items: Items,
  pattern: P
  // @ts-expect-error
): items is readonly [Match<P>, ...Tail<Items>] {
  const first = items[0];
  return Boolean(first && match(first, pattern));
}

export function match<T extends Ast, P extends Pattern>(
  value: T | undefined,
  pattern: P
  // @ts-expect-error
): value is Match<T> {
  if (value === undefined) return false;

  if (typeof pattern === "string") {
    return is(value, "Identifier") && value.name === pattern;
  } else if (pattern === anyAst) {
    return true;
  } else {
    return value.constructor === pattern;
  }
}

export function matches<Items extends IList<Ast>, P extends readonly Pattern[]>(
  items: Items,
  pattern: P
  // @ts-expect-error
): items is Matched<P> {
  if (items.length !== pattern.length) return false;
  return items.every((item, i) => match(item, pattern[i]!));
}

export function matchEvery<Items extends IList<Ast>, P extends Pattern>(
  items: Items,
  pattern: P
  // @ts-expect-error
): items is Matched<IList<P>> {
  return items.every((item) => match(item, pattern));
}
