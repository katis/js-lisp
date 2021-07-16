import { Dict, SourceItem, Span } from "./common";
import * as Es from "./Es/Es";

export type NewToken = new (span: Span, slice: string) => Token;

export type Token =
  | LParen
  | RParen
  | LBracket
  | RBracket
  | RBrace
  | LBrace
  | Quote
  | Bool
  | Num
  | Str
  | Identifier
  | Keyword;

abstract class BaseToken extends SourceItem {
  readonly type?: string;
}

export class LParen extends BaseToken {
  readonly type = "LParen";
}

export class RParen extends BaseToken {
  readonly type = "RParen";
}

export class LBracket extends BaseToken {
  readonly type = "LBracket";
}

export class RBracket extends BaseToken {
  readonly type = "RBracket";
}

export class LBrace extends BaseToken {
  readonly type = "LBrace";
}

export class RBrace extends BaseToken {
  readonly type = "RBrace";
}

export class Quote extends BaseToken {
  readonly type = "Quote";
}

export class Bool extends BaseToken {
  readonly type = "Bool";

  constructor(span: Span, readonly bool: string) {
    super(span);
  }

  equals(other: Token): other is this {
    return other instanceof Bool && this.bool === other.bool;
  }

  get estree(): Es.Literal {
    return new Es.Literal(this.bool === "true");
  }
}

export class Num extends BaseToken {
  readonly type = "Num";

  constructor(span: Span, readonly number: string) {
    super(span);
  }

  equals(other: Token): other is this {
    return other instanceof Num && this.number === other.number;
  }

  get estree(): Es.Literal {
    return new Es.Literal(Number.parseFloat(this.number));
  }
}

export class Str extends BaseToken {
  readonly type = "Str";

  constructor(span: Span, readonly string: string) {
    super(span);
  }

  equals(other: Token): other is this {
    return other instanceof Str && this.string === other.string;
  }

  get estree(): Es.Literal {
    return new Es.Literal(this.string);
  }
}

export class Identifier<Name extends string = string> extends BaseToken {
  readonly type = "Identifier";

  constructor(span: Span, readonly name: Name) {
    super(span);
  }

  equals(other: Token): other is this {
    return other instanceof Identifier && this.name === other.name;
  }

  matchName<T>(cases: Dict<(value: this) => T>): T | undefined {
    const matched = cases[this.name];
    return matched?.(this);
  }

  get estree(): Es.Identifier {
    return new Es.Identifier(this.name);
  }
}

export class Keyword extends BaseToken {
  readonly type = "Keyword";

  constructor(span: Span, readonly name: string) {
    super(span);
  }

  equals(other: Token): other is this {
    return other instanceof Keyword && this.name === other.name;
  }

  get estree(): Es.Literal {
    return new Es.Literal(this.name);
  }
}
