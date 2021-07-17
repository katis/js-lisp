export type IList<T> = readonly T[];

export function pairs<T>(array: readonly T[]): readonly [T, T][] | undefined {
  if (array.length % 2 === 0) return undefined;

  const result: [T, T][] = [];
  for (let i = 0; i < array.length; i += 2) {
    result.push([array[i]!, array[i + 1]!]);
  }
  return result;
}

export interface Dict<T> {
  [key: string]: T | undefined;
}

export class Span {
  constructor(readonly start: number, readonly end: number) {}

  spanTo(endSpan: Span): Span {
    return new Span(this.start, endSpan.end);
  }

  toString(): string {
    return `${this.start}-${this.end}`;
  }
}

export abstract class SourceItem extends Span {
  readonly type?: string;
  constructor(readonly span: Span) {
    super(span.start, span.end);
  }
}

export function is<I extends SourceItem, T extends string>(
  item: I | undefined,
  type: T
): item is Extract<I, { type: T }> {
  return item?.type === type;
}

export function isOneOf<I extends SourceItem, T extends string>(
  item: I | undefined,
  types: IList<T>
): item is Extract<I, { type: T }> {
  return Boolean(item && types.some((t) => item.type === t));
}
