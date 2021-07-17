import { Ast, List, Obj, Quoted, Vector } from "./Ast";
import { is, isOneOf, pairs, Span } from "./common";
import { UnexpectedEndOfInput, UnexpectedToken } from "./errors";
import { LBrace, LBracket, LParen, Quote, Token } from "./Token";

const closingBrackets = ["RParen", "RBrace", "RBracket"] as const;
const invalidListClosing = ["RBracket", "RBrace"] as const;
const invalidVectorClosing = ["RParen", "RBrace"] as const;
const invalidObjClosing = ["RParen", "RBracket"] as const;

export class Parser {
  constructor(private readonly tokens: IterableIterator<Token>) {}

  parse(): Ast[] {
    return Array.from(this.tokens, (tok) => this.expr(tok));
  }

  expr(token: Token): Ast {
    if (is(token, "LParen")) {
      return this.list(token);
    } else if (isOneOf(token, closingBrackets)) {
      throw new UnexpectedToken(token);
    } else if (is(token, "Quote")) {
      return this.quoted(token);
    } else if (is(token, "LBracket")) {
      return this.vector(token);
    } else if (is(token, "LBrace")) {
      return this.obj(token);
    }
    return token;
  }

  list(start: LParen): List {
    const items: Ast[] = [];
    let last: Span = start;
    for (const token of this.tokens) {
      last = token;
      if (isOneOf(token, invalidListClosing)) {
        throw new UnexpectedToken(token);
      } else if (is(token, "RParen")) {
        return new List(start.spanTo(token), items);
      } else {
        items.push(this.expr(token));
      }
    }
    throw new UnexpectedEndOfInput("unexpected end of list", last);
  }

  vector(start: LBracket): Vector {
    const items: Ast[] = [];
    let last: Span = start;
    for (const token of this.tokens) {
      last = token;
      if (isOneOf(token, invalidVectorClosing)) {
        throw new UnexpectedToken(token);
      } else if (is(token, "RBracket")) {
        return new Vector(start.spanTo(token), items);
      } else {
        items.push(this.expr(token));
      }
    }
    throw new UnexpectedEndOfInput("unexpected end of vector", last);
  }

  obj(start: LBrace): Obj {
    const items: Ast[] = [];

    let last: Span = start;
    for (const token of this.tokens) {
      last = token;
      if (is(token, "RBrace")) {
        const kvs = pairs(items);
        if (!kvs) {
          throw new UnexpectedToken(token);
        }
        return new Obj(start.spanTo(token), kvs);
      } else if (isOneOf(token, invalidObjClosing)) {
        throw new UnexpectedToken(token);
      } else {
        items.push(this.expr(token));
      }
    }
    throw new UnexpectedEndOfInput("unexpected end of object", last);
  }

  quoted(start: Quote): Quoted {
    const token = this.tokens.next();
    if (token.done) {
      throw new UnexpectedEndOfInput("unexpected end of input", start);
    }
    return new Quoted(start, this.expr(token.value));
  }
}
