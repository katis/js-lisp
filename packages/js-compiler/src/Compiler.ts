import { generate } from "astring";
import { Ast, List, Vector } from "./Ast";
import { anyAst, headMatch, matches, matchEvery } from "./match";
import { Identifier } from "./Token";
import * as Es from "./Es/Es";
import { IList, is, isOneOf, pairs } from "./common";
import { Parser } from "./Parser";
import { Tokenizer } from "./Tokenizer";

export class Compiler {
  compile(ast: IList<Ast>): Es.Program {
    const body = ast.map((a) => this.statement(a));
    return new Es.Program(body);
  }

  node(ast: Ast): Es.Node {
    if (is(ast, "List")) {
      return this.list(ast);
    } else if (
      isOneOf(ast, ["Bool", "Str", "Num", "Identifier", "Keyword"] as const)
    ) {
      return ast.estree;
    } else {
      throw Error("todo node()");
    }
  }

  expression(ast: Ast): Es.Expression {
    const node = this.node(ast);
    if (!Es.isExpression(node)) {
      throw Error("expected an expression");
    }
    return node;
  }

  statement(ast: Ast): Es.Statement {
    const node = this.node(ast);
    if (Es.isExpression(node)) {
      return new Es.ExpressionStatement(node);
    }
    return node;
  }

  list(list: List): Es.Node {
    if (list.items.length === 0) {
      return new Es.ArrayExpression([]);
    } else if (headMatch(list.items, Identifier)) {
      const name = list.items[0].name;
      const args = list.items.slice(1);
      return this.call(name, args);
    } else {
      return new Es.CallExpression(
        this.expression(list.items[0]!),
        list.items.slice(1).map((item) => this.expression(item))
      );
    }
  }

  call(name: string, args: readonly Ast[]) {
    switch (name) {
      case "def": {
        if (matches(args, [Identifier, anyAst] as const)) {
          return new Es.VariableDeclaration("const", [
            new Es.VariableDeclarator(args[0].estree, this.expression(args[1])),
          ]);
        }
        break;
      }
      case "let": {
        if (matches(args, [Vector, anyAst] as const)) {
          const [decls, body] = args;
          return new Es.BlockStatement([
            new Es.VariableDeclaration(
              "const",
              this.variableDeclarators(decls.items)
            ),
            this.statement(body),
          ]);
        }
        break;
      }
      case "fn": {
        if (matches(args, [Vector, anyAst] as const)) {
          const [params, body] = args;
          if (matchEvery(params.items, Identifier)) {
            return new Es.FunctionExpression(
              null,
              params.items.map((p) => p.estree),
              this.fnBody(body)
            );
          }
        }
        break;
      }
      case "if": {
        if (matches(args, [anyAst, anyAst, anyAst] as const)) {
          const [test, consequent, alternative] = args;
          return new Es.IfStatement(
            this.expression(test),
            this.statement(consequent),
            this.statement(alternative)
          );
        } else if (matches(args, [anyAst, anyAst] as const)) {
          const [test, consequent] = args;
          return new Es.IfStatement(
            this.expression(test),
            this.statement(consequent),
            null
          );
        }
        break;
      }
      default: {
        return new Es.CallExpression(
          new Es.Identifier(name),
          args.map((arg) => this.expression(arg))
        );
      }
    }
    throw Error(`invalid arity ${args.length} for ${name} form`);
  }

  fnBody(body: Ast): Es.BlockStatement {
    return new Es.BlockStatement([this.statement(body)]).returning();
  }

  variableDeclarators(decls: IList<Ast>): IList<Es.VariableDeclarator> {
    const declPairs = pairs(decls);
    if (!declPairs)
      throw Error("let bindings require even number of arguments");

    return declPairs.map((pair) => {
      if (matches(pair, [Identifier, anyAst] as const)) {
        return new Es.VariableDeclarator(pair[0], this.expression(pair[1]));
      } else {
        throw Error("let binding name must be an identifier");
      }
    });
  }
}

const input = "(def foo (fn [] (if 1 2 4)))";
const ast = new Parser(new Tokenizer(input)).parse();
const js = generate(new Compiler().compile(ast));

console.log("INPUT:");
console.log(input);
console.log("\nAST:");
console.log(ast);
console.log("\nJS:");
console.log(js);
