use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::convert::TryFrom;

use wasm_bindgen::JsValue;

use crate::{map, set};
use crate::ast::Ast;
use crate::es::{BinaryOp, Es, SourceType, UnaryOp};

static STD: &'static str = "στδ";

#[derive(Debug)]
pub enum Error {
    SyntaxError { message: Cow<'static, str> },
    NotDefined { identifier: Cow<'static, str> },
    AstError(crate::ast::Error),
}

impl From<crate::ast::Error> for Error {
    fn from(err: crate::ast::Error) -> Self {
        Error::AstError(err)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

pub struct Compiler {
    special_forms: HashSet<&'static str>,
    env: HashMap<Cow<'static, str>, Cow<'static, str>>,
}

enum IdentifierType {
    Special,
    Std,
    Module(String),
}

impl Compiler {
    pub fn new() -> Compiler {
        Compiler {
            special_forms: set!["vec", "quote"],
            env: map! {
                "vec".into() => STD.into(),
                "str".into() => STD.into()
            },
        }
    }

    pub fn compile_ast(&mut self, lines: Vec<Ast>) -> Result<Es> {
        self.program(lines)
    }

    pub fn compile(&mut self, value: &JsValue) -> Result<Es> {
        match Ast::try_from(value)? {
            Ast::List(lines) => self.program(lines),
            _ => todo!(),
        }
    }

    fn add_env(
        &mut self,
        module: impl Into<Cow<'static, str>>,
        name: impl Into<Cow<'static, str>>,
    ) {
        self.env.insert(name.into(), module.into());
    }

    fn env_contains(&mut self, identifier_name: &str) -> bool {
        self.env.contains_key(identifier_name.into())
    }

    fn program(&mut self, lines: Vec<Ast>) -> Result<Es> {
        let mut body = vec![Es::import_as(STD, "../std/std.js")];
        for line in lines.iter() {
            let expr = self.expr(line)?;
            body.push(expr.into_statement());
        }

        Ok(Es::Program {
            source_type: SourceType::Module,
            body,
        })
    }

    fn expr(&mut self, ast: &Ast) -> Result<Es> {
        match ast {
            Ast::Null => Ok(Es::null()),
            Ast::Undefined => Ok(Es::undefined()),
            Ast::Int(int) => Ok(Es::float_literal(*int as f64)),
            Ast::Float(float) => Ok(Es::float_literal(*float)),
            Ast::String(string) => Ok(Es::string_literal(string)),
            Ast::Keyword {
                module,
                name,
                full_name,
                hash_code,
            } => Ok(Es::new_expr(
                Es::member_expr(Es::identifier(STD), Es::identifier("Keyword")),
                vec![
                    Es::string_literal(module),
                    Es::string_literal(name),
                    Es::int_literal(*hash_code),
                    Es::string_literal(full_name),
                ],
            )),
            Ast::Identifier { name, hash_code } => Ok(Es::new_expr(
                Es::member_expr(Es::identifier("Σ"), Es::identifier("Identifier")),
                vec![Es::string_literal(name), Es::int_literal(*hash_code)],
            )),
            Ast::List(items) => self.list(items.as_slice()),
        }
    }

    fn list(&mut self, items: &[Ast]) -> Result<Es> {
        if items.len() == 0 {
            return Ok(Es::ArrayExpression {
                elements: Vec::new(),
            });
        }

        match split_first_identifier(items) {
            Some(("+", [])) | Some(("-", [])) => Ok(Es::int_literal(0)),
            Some(("+", [arg])) => Ok(Es::unary_expr(UnaryOp::Plus, self.expr(arg)?)),
            Some(("+", [first, rest @ ..])) => self.binary_multi_call(BinaryOp::Plus, first, rest),
            Some(("-", [arg])) => Ok(Es::unary_expr(UnaryOp::Minus, self.expr(arg)?)),
            Some(("-", [first, rest @ ..])) => self.binary_multi_call(BinaryOp::Minus, first, rest),
            Some((ident, args)) if self.env_contains(ident) => {
                let arguments = self.expr_vec(args)?;
                let module = self.env[ident].as_ref();
                if module == STD {
                    self.std_call(ident, args)
                } else {
                    Ok(Es::call_expr(
                        Es::member_expr(Es::identifier(module.to_string()), Es::identifier(ident)),
                        arguments,
                    ))
                }
            }
            Some((name, _)) => Err(Error::NotDefined {
                identifier: String::from(name).into(),
            }),
            None => Ok(Es::CallExpression {
                callee: Box::new(self.expr(&items[0])?),
                arguments: self.expr_vec(&items[1..])?,
            }),
        }
    }

    fn std_call(&mut self, ident: &str, args: &[Ast]) -> Result<Es> {
        match (ident, args) {
            ("vec", []) => Ok(Es::call_expr(
                Es::member_expr(Es::identifier(STD), Es::identifier("vecLiteral")),
                Vec::new(),
            )),
            ("vec", args) => Ok(Es::call_expr(
                Es::member_expr(Es::identifier(STD), Es::identifier("vecLiteral")),
                vec![Es::ArrayExpression {
                    elements: self.expr_vec(args)?,
                }],
            )),
            (ident, args) => Ok(Es::call_expr(
                Es::member_expr(Es::identifier(STD.to_string()), Es::identifier(ident)),
                self.expr_vec(args)?,
            )),
        }
    }

    fn binary_multi_call(&mut self, op: BinaryOp, first: &Ast, rest: &[Ast]) -> Result<Es> {
        rest.iter().try_fold(self.expr(first)?, |left, right| {
            Ok(Es::binary_expr(op, left, self.expr(right)?))
        })
    }

    fn expr_vec(&mut self, exprs: &[Ast]) -> Result<Vec<Es>> {
        exprs.iter().map(|ast| self.expr(ast)).collect()
    }
}

fn split_first_identifier(list: &[Ast]) -> Option<(&str, &[Ast])> {
    if let Some(Ast::Identifier { name, .. }) = list.get(0) {
        Some((name.as_str(), &list[1..]))
    } else {
        None
    }
}
