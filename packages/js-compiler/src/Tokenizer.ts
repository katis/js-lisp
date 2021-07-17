import { InvalidCharacter, InvalidToken, UnexpectedEndOfInput } from "./errors";
import { Lexer } from "./Lexer";
import {
  Identifier,
  Keyword,
  LBrace,
  LBracket,
  LParen,
  NewToken,
  Num,
  Quote,
  RBrace,
  RBracket,
  RParen,
  Str,
  Token,
} from "./Token";

export class Tokenizer extends Lexer<Token> {
  constructor(input: string) {
    super(input, lexBody);
  }
}

const singleTokens: ReadonlyMap<string, NewToken> = new Map([
  ["(", LParen],
  [")", RParen],
  ["[", LBracket],
  ["]", RBracket],
  ["{", LBrace],
  ["}", RBrace],
  ["'", Quote],
] as [string, NewToken][]);

const constTokens =
  /^((\*\*)|(<=)|(>=)|(==)|(<)|(>)|(\*)|(\+)|(-)|(\/)|(%)|(=))/;
const wsRe = /^[,\s]+/;
const identRe = /^[$_\p{L}][$_\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}\u200C\u200D]*/u;
const separatorRe = /^[\(\)\[\]\{\}\s,\"]/;
const numRe = /^[-+]?\d+\.?(\d*)?/;

let isSeparator = (c: string) => c == "" || separatorRe.test(c);

function lexBody(this: Tokenizer) {
  this.ignoreMatch(wsRe);

  if (this.acceptMatch(numRe) && isSeparator(this.peek())) {
    this.emit(Num);
    return lexBody;
  }

  if (this.acceptMatch(constTokens)) {
    const c = this.peek();
    if (isSeparator(c)) {
      this.emit(Identifier);
      return lexBody;
    } else {
      throw new InvalidCharacter(`invalid character "${c}"`, this.span);
    }
  }

  const c = this.accept();
  const newSingle = singleTokens.get(c);
  if (newSingle) {
    this.emit(newSingle);
    return lexBody;
  } else if (c === '"') {
    this.ignore();
    return lexString;
  } else if (identRe.test(c)) {
    this.backup();
    return lexIdentifier;
  } else if (c === ":") {
    this.ignore();
    return lexKeyword;
  } else if (c === "") {
    return undefined;
  }
  throw new InvalidCharacter(`invalid character "${c}"`, this.span);
}

function lexString(this: Tokenizer) {
  const c = this.accept();
  if (c === '"') {
    this.emit(Str);
    this.ignore();
    return lexBody;
  } else if (c === "\\") {
    this.accept();
    return lexString;
  } else if (c === "") {
    throw new UnexpectedEndOfInput("unterminated string constant", this.span);
  }
  return lexString;
}

const identifierLexer = (newToken: NewToken) =>
  function (this: Tokenizer) {
    if (this.acceptMatch(identRe) && isSeparator(this.peek())) {
      this.emit(newToken);
      return lexBody;
    } else {
      throw new InvalidToken(newToken.name.toLocaleLowerCase(), this.span);
    }
  };

const lexIdentifier = identifierLexer(Identifier);
const lexKeyword = identifierLexer(Keyword);
