import { Ast, List, Obj, Quoted, Vector } from "./Ast";
import { is, isOneOf, pairs } from "./common";
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
      throw Error("syntax error");
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
    for (const token of this.tokens) {
      if (isOneOf(token, invalidListClosing)) {
        throw Error("Invalid list");
      } else if (is(token, "RParen")) {
        return new List(start.spanTo(token), items);
      } else {
        items.push(this.expr(token));
      }
    }
    throw Error("unexpected end of list");
  }

  vector(start: LBracket): Vector {
    const items: Ast[] = [];
    for (const token of this.tokens) {
      if (isOneOf(token, invalidVectorClosing)) {
        throw Error("Invalid vector");
      } else if (is(token, "RBracket")) {
        return new Vector(start.spanTo(token), items);
      } else {
        items.push(this.expr(token));
      }
    }
    throw Error("unexpected end of vector");
  }

  obj(start: LBrace): Obj {
    const items: Ast[] = [];
    for (const token of this.tokens) {
      if (is(token, "RBrace")) {
        const kvs = pairs(items);
        if (!kvs) {
          throw Error("missing object property value");
        }
        return new Obj(start.spanTo(token), kvs);
      } else if (isOneOf(token, invalidObjClosing)) {
        throw Error("Invalid object");
      } else {
        items.push(this.expr(token));
      }
    }
    throw Error("unexpected end of object");
  }

  quoted(start: Quote): Quoted {
    const token = this.tokens.next();
    if (token.done) {
      throw Error("missing quoted item");
    }
    return new Quoted(start, this.expr(token.value));
  }
}
