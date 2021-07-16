import { IList, is, SourceItem, Span } from "./common";
import { Bool, Identifier, Keyword, Num, Str } from "./Token";

export type Ast =
  | Str
  | Bool
  | Num
  | Keyword
  | Identifier
  | List
  | Vector
  | Obj
  | Quoted;

export class List<
  Items extends readonly Ast[] = readonly Ast[]
> extends SourceItem {
  readonly type = "List";
  constructor(span: Span, readonly items: Items) {
    super(span);
  }

  equals(other: Ast): other is this {
    return other instanceof this.constructor;
  }
}

export class Quoted extends SourceItem {
  readonly type = "Quoted";
  constructor(span: Span, readonly item: Ast) {
    super(span);
  }
}

export class Vector extends SourceItem {
  readonly type = "Vector";
  constructor(span: Span, readonly items: readonly Ast[]) {
    super(span);
  }
}

export class Obj extends SourceItem {
  readonly type = "Obj";
  constructor(span: Span, readonly items: readonly [Ast, Ast][]) {
    super(span);
  }
}
