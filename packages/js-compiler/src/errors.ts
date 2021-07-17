import { Span } from "./common";
import { Token } from "./Token";

export type CompilerError =
  | InvalidCharacter
  | InvalidToken
  | UnexpectedEndOfInput;

abstract class SourceError extends Error {
  constructor(message: string, readonly span: Span) {
    super(`{span}: ${message}`);
  }
}

export class InvalidCharacter extends SourceError {
  readonly type = "InvalidCharacter";
  constructor(c: string, span: Span) {
    super(`invalid character "${c}"`, span);
  }
}

export class InvalidToken extends SourceError {
  readonly type = "InvalidToken";
  constructor(src: string, span: Span) {
    super(`invalid token "${src}"`, span);
  }
}

export class UnexpectedToken extends SourceError {
  constructor(token: Token) {
    super(`unexpected token ${token}`, token);
  }
}

export class UnexpectedEndOfInput extends SourceError {
  readonly type = "UnexpectedEOI";
  constructor(message: string, span: Span) {
    super(message, span);
  }
}
