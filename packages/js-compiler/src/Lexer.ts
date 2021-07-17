import { Span } from "./common";

export type NewToken<Token> = new (span: Span, str: string) => Token;

export type LexerState<Token> = (
  lexer: Lexer<Token>
) => LexerState<Token> | undefined;

const done = { done: true, value: undefined } as const;

export class Lexer<Token> implements IterableIterator<Token> {
  private start: number = 0;
  private end: number = 0;
  private width: number = 0;
  private readonly tokens: Token[] = [];
  private state?: LexerState<Token>;
  private readonly result: IteratorResult<any, undefined> = {
    done: false,
    value: undefined,
  };

  constructor(readonly input: string, state: LexerState<Token>) {
    this.state = state;
  }

  private get remaining() {
    return this.input.slice(this.end);
  }

  get span(): Span {
    return new Span(this.start, this.end);
  }

  private get current() {
    const codep = this.input.codePointAt(this.end);
    if (codep === undefined) return "";
    return String.fromCodePoint(codep);
  }

  accept(): string {
    const c = this.current;
    this.width = c.length;
    this.end += this.width;
    return c;
  }

  backup(): void {
    this.end -= this.width;
    this.width = 0;
  }

  peek(): string {
    const c = this.accept();
    this.backup();
    return c;
  }

  ignore(): void {
    this.start = this.end;
  }

  acceptOneOf(tokens: ReadonlySet<string>): boolean {
    const remaining = this.remaining;
    for (const key of tokens) {
      if (remaining.startsWith(key)) {
        this.width = key.length;
        this.end += this.width;
        return true;
      }
    }
    return true;
  }

  acceptMatch(regexp: RegExp): boolean {
    const match = this.remaining.match(regexp);
    if (!match?.[0]) return false;

    this.width = match[0].length;
    this.end += this.width;
    return true;
  }

  ignoreMatch(regexp: RegExp): boolean {
    if (this.acceptMatch(regexp)) {
      this.ignore();
      return true;
    }
    return false;
  }

  emit(ctor: new (span: Span, slice: string) => Token): void {
    const slice = this.input.slice(this.start, this.end);
    const span = new Span(this.start, this.end);
    this.ignore();
    this.tokens.push(new ctor(span, slice));
  }

  [Symbol.iterator](): IterableIterator<Token> {
    return this;
  }

  next(): IteratorResult<Token, undefined> {
    const token = this.tokens.shift();
    if (token) {
      this.result.value = token;
      return this.result;
    }
    if (!this.state) {
      this.result.value = undefined;
      return done;
    }
    this.state = this.state(this);
    return this.next();
  }
}
