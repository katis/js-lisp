import { IList } from "../common";

export type Pattern = Identifier;

const expressionTypes = [
  "Identifier",
  "Literal",
  "UnaryExpression",
  "BinaryExpression",
  "LogicalExpression",
  "ArrayExpression",
  "MemberExpression",
  "CallExpression",
  "NewExpression",
  "SequenceExpression",
  "FunctionExpression",
] as const;

export const isExpression = (node: Node): node is Expression =>
  expressionTypes.includes(node.type as any);

const canReturnTypes = ["BlockStatement", "IfStatement", "ExpressionStatement"];

const canReturn = (
  node: Node
): node is BlockStatement | IfStatement | ExpressionStatement =>
  canReturnTypes.includes(node.type);

export const returning = (stmt: Statement) =>
  canReturn(stmt) ? stmt.returning() : stmt;

export type Expression =
  | Identifier
  | Literal
  | UnaryExpression
  | BinaryExpression
  | LogicalExpression
  | ArrayExpression
  | MemberExpression
  | CallExpression
  | NewExpression
  | SequenceExpression
  | FunctionExpression;

export type Declaration = VariableDeclaration;

export type Statement =
  | Declaration
  | Program
  | ExpressionStatement
  | BlockStatement
  | ReturnStatement
  | IfStatement;

export type Node = Expression | Statement | Pattern;

export class Identifier {
  readonly type = "Identifier";
  constructor(readonly name: string) {}
}

export class Literal {
  readonly type = "Literal";
  constructor(readonly value: string | boolean | null | number | RegExp) {}
}

export class UnaryExpression {
  readonly type = "UnaryExpression";
  constructor(
    readonly operator: "-" | "+" | "!" | "~" | "typeof" | "void" | "delete",
    readonly prefix: boolean,
    readonly argument: Expression
  ) {}
}

export type BinaryOperator =
  | "=="
  | "!="
  | "==="
  | "!=="
  | "<"
  | "<="
  | ">"
  | ">="
  | "<<"
  | ">>"
  | ">>>"
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "|"
  | "^"
  | "&"
  | "in"
  | "instanceof";

export class BinaryExpression {
  readonly type = "BinaryExpression";
  constructor(
    readonly operator: BinaryOperator,
    readonly left: Expression,
    readonly right: Expression
  ) {}
}

export class LogicalExpression {
  readonly type = "LogicalExpression";
  constructor(
    readonly operator: "&&" | "||",
    readonly left: Expression,
    readonly right: Expression
  ) {}
}

export class ArrayExpression {
  readonly type = "ArrayExpression";
  constructor(readonly elements: readonly Expression[]) {}
}

export class MemberExpression {
  readonly type = "MemberExpression";
  constructor(
    readonly object: Expression,
    readonly property: Expression,
    readonly computed: boolean
  ) {}
}

export class CallExpression {
  readonly type = "CallExpression";
  readonly arguments: readonly Expression[];
  constructor(readonly callee: Expression, args: readonly Expression[]) {
    this.arguments = args;
  }
}

export class NewExpression {
  readonly type = "NewExpression";
  readonly arguments: readonly Expression[];
  constructor(readonly callee: Expression, args: readonly Expression[]) {
    this.arguments = args;
  }
}

export abstract class Function {
  constructor(
    readonly id: Identifier | null,
    readonly params: IList<Pattern>,
    readonly body: BlockStatement
  ) {}
}

export class FunctionExpression extends Function {
  readonly type = "FunctionExpression";
}

export class SequenceExpression {
  readonly type = "SequenceExpression";
  constructor(readonly expressions: readonly Expression[]) {}
}

export class Program {
  readonly type = "Program";
  constructor(readonly body: readonly Statement[]) {}
}

export class ExpressionStatement {
  readonly type = "ExpressionStatement";
  constructor(readonly expression: Expression) {}

  returning(): ReturnStatement {
    return new ReturnStatement(this.expression);
  }
}

export class BlockStatement {
  readonly type = "BlockStatement";
  readonly body: readonly Statement[];
  constructor(body: readonly Statement[]) {
    this.body = body.flatMap((stmt) => {
      if (stmt.type === "BlockStatement") {
        return stmt.body;
      }
      return stmt;
    });
  }

  returning(): BlockStatement {
    const i = this.body.length - 1;
    const last = this.body[i];
    if (!last) return this;

    let newLast = last;
    if (canReturn(last)) {
      newLast = last.returning();
    } else {
      return this;
    }

    const body = this.body.slice();
    body[i] = newLast;
    return new BlockStatement(body);
  }
}

export class ReturnStatement {
  readonly type = "ReturnStatement";
  constructor(readonly argument: Expression | null) {}
}

export class IfStatement {
  readonly type = "IfStatement";
  constructor(
    readonly test: Expression,
    readonly consequent: Statement,
    readonly alternate: Statement | null
  ) {}

  returning(): IfStatement {
    const consequent = canReturn(this.consequent)
      ? this.consequent.returning()
      : this.consequent;

    const alternate =
      this.alternate && canReturn(this.alternate)
        ? this.alternate.returning()
        : this.alternate;

    if (consequent === this.consequent && alternate === this.alternate) {
      return this;
    }
    return new IfStatement(this.test, consequent, alternate);
  }
}

export class VariableDeclaration {
  readonly type = "VariableDeclaration";
  constructor(
    readonly kind: "const" | "let" | "var",
    readonly declarations: readonly VariableDeclarator[]
  ) {}
}

export class VariableDeclarator {
  readonly type = "VariableDeclarator";
  constructor(readonly id: Pattern, readonly init: Expression | null) {}
}
