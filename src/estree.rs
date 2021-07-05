use crate::parser::Ast;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum Js {
    Program {
        body: Vec<Js>,
        source_type: SourceType,
    },
    ExpressionStatement {
        expression: Box<Js>,
    },
    Literal {
        value: Value,
    },
    Identifier {
        name: String,
    },
    UnaryExpression {
        operator: UnaryOperator,
        prefix: bool,
        argument: Box<Js>,
    },
    BinaryExpression {
        operator: BinaryOperator,
        left: Box<Js>,
        right: Box<Js>,
    },
    NewExpression {
        callee: Box<Js>,
        arguments: Vec<Js>,
    },
    ArrayExpression {
        elements: Vec<Js>,
    },
    ObjectExpression {
        properties: Vec<Js>,
    },
    Property {
        method: bool,
        shorthand: bool,
        computed: bool,
        key: Box<Js>,
        value: Box<Js>,
        kind: PropertyKind,
    },
    VariableDeclaration {
        kind: VariableKind,
        declarations: Vec<Js>,
    },
    VariableDeclarator {
        id: Box<Js>,
        init: Option<Box<Js>>,
    },
    ConditionalExpression {
        test: Box<Js>,
        alternate: Box<Js>,
        consequent: Box<Js>,
    },
}

#[derive(Debug, Serialize)]
pub enum SourceType {
    #[serde(rename = "module")]
    Module,
}

#[derive(Debug, Serialize)]
pub enum VariableKind {
    #[serde(rename = "var")]
    Var,
    #[serde(rename = "let")]
    Let,
    #[serde(rename = "const")]
    Const,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum Value {
    Int(i64),
    Float(f64),
    String(String),
}

#[derive(Debug, Serialize)]
pub enum UnaryOperator {
    #[serde(rename = "void")]
    Void,
    #[serde(rename = "+")]
    Plus,
    #[serde(rename = "-")]
    Minus,
    #[serde(rename = "!")]
    Negation,
    #[serde(rename = "~")]
    BitwiseNot,
    #[serde(rename = "typeof")]
    Typeof,
    #[serde(rename = "delete")]
    Delete,
}

impl UnaryOperator {
    pub fn is(s: &str) -> bool {
        match s {
            "void" | "+" | "-" | "!" | "~" | "typeof" | "delete" => true,
            _ => false,
        }
    }

    pub fn from(s: &str) -> Self {
        match s {
            "void" => UnaryOperator::Void,
            "+" => UnaryOperator::Plus,
            "-" => UnaryOperator::Minus,
            "!" => UnaryOperator::Negation,
            "~" => UnaryOperator::BitwiseNot,
            "typeof" => UnaryOperator::Typeof,
            "delete" => UnaryOperator::Delete,
            s => panic!("Expected valid unary operator string, got {}", s),
        }
    }
}

#[derive(Debug, Serialize, Clone, Copy)]
pub enum BinaryOperator {
    #[serde(rename = "+")]
    Plus,
    #[serde(rename = "-")]
    Minus,
    #[serde(rename = "*")]
    Multiply,
    #[serde(rename = "/")]
    Divide,
    #[serde(rename = "%")]
    Modulus,
    #[serde(rename = "==")]
    LegacyEquals,
    #[serde(rename = "!=")]
    LegacyNotEquals,
    #[serde(rename = "===")]
    Equals,
    #[serde(rename = "!==")]
    NotEquals,
    #[serde(rename = "<")]
    LessThan,
    #[serde(rename = ">")]
    MoreThan,
    #[serde(rename = "<=")]
    LessEq,
    #[serde(rename = ">=")]
    MoreEq,

    #[serde(rename = "<<")]
    LeftShift,
    #[serde(rename = ">>")]
    SignedRightShift,
    #[serde(rename = ">>>")]
    RightShift,
    #[serde(rename = "&")]
    And,
    #[serde(rename = "|")]
    Or,
    #[serde(rename = "^")]
    Xor,
    #[serde(rename = "~")]
    Not,
    // #[serde(rename = "in")]
    // In,
    // #[serde(rename = "instanceof")]
    // Instanceof,
}

impl BinaryOperator {
    pub fn is(s: &str) -> bool {
        match s {
            "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | ">>>" | "+"
            | "-" | "*" | "/" | "%" | "|" | "^" | "&" /* | "in" | "instanceof" */ => true,
            _ => false,
        }
    }

    pub fn from(s: &str) -> Self {
        match s {
            "==" => BinaryOperator::LegacyEquals,
            "!=" => BinaryOperator::LegacyNotEquals,
            "===" => BinaryOperator::Equals,
            "!==" => BinaryOperator::NotEquals,
            "<" => BinaryOperator::LessThan,
            "<=" => BinaryOperator::LessEq,
            ">" => BinaryOperator::MoreThan,
            ">=" => BinaryOperator::MoreEq,
            "<<" => BinaryOperator::LeftShift,
            ">>" => BinaryOperator::SignedRightShift,
            ">>>" => BinaryOperator::RightShift,
            "+" => BinaryOperator::Plus,
            "-" => BinaryOperator::Minus,
            "*" => BinaryOperator::Multiply,
            "/" => BinaryOperator::Divide,
            "%" => BinaryOperator::Modulus,
            "|" => BinaryOperator::Or,
            "^" => BinaryOperator::Xor,
            "&" => BinaryOperator::And,
            // "in" => BinaryOperator::In,
            // "instanceof" => BinaryOperator::Instanceof,
            s => panic!("Expected valid binary operator string, got {}", s),
        }
    }
}

#[derive(Debug, Serialize)]
pub enum PropertyKind {
    #[serde(rename = "init")]
    Init,
}

pub fn test_ast() -> Js {
    Js::Program {
        source_type: SourceType::Module,
        body: vec![Js::ExpressionStatement {
            expression: Box::new(Js::BinaryExpression {
                operator: BinaryOperator::Plus,
                left: Box::new(Js::Literal {
                    value: Value::Int(1),
                }),
                right: Box::new(Js::Literal {
                    value: Value::Int(2),
                }),
            }),
        }],
    }
}

pub fn lisp_to_js(module: Vec<Ast>) -> Js {
    Js::Program {
        body: module.iter().map(ast_to_js).collect(),
        source_type: SourceType::Module,
    }
}

fn ast_to_js(ast: &Ast) -> Js {
    match ast {
        Ast::Integer(n) => Js::Literal {
            value: Value::Int(*n),
        },
        Ast::Float(f) => Js::Literal {
            value: Value::Float(*f),
        },
        Ast::String(s) => Js::Literal {
            value: Value::String(s.to_string()),
        },
        Ast::Atom(s) => Js::Literal {
            value: Value::String(s.to_string()),
        },
        Ast::Symbol(name) => Js::Identifier {
            name: name.to_string(),
        },
        Ast::Vector(values) => Js::ArrayExpression {
            elements: values.iter().map(ast_to_js).collect(),
        },
        Ast::Map(kvs) => Js::ObjectExpression {
            properties: kvs
                .iter()
                .map(|(key, value)| Js::Property {
                    kind: PropertyKind::Init,
                    key: Box::new(ast_to_js(key)),
                    value: Box::new(ast_to_js(value)),
                    shorthand: false,
                    method: false,
                    computed: false,
                })
                .collect(),
        },
        Ast::Set(values) => Js::NewExpression {
            callee: Box::new(Js::Identifier {
                name: "Set".to_string(),
            }),
            arguments: vec![Js::ArrayExpression {
                elements: values.iter().map(ast_to_js).collect(),
            }],
        },
        Ast::Quoted(_) => todo!(),
        Ast::List(values) => match &values[..] {
            [] => undefined(),
            [Ast::Symbol("def"), Ast::Symbol(name), expr] => {
                let expr = ast_to_js(&expr);
                Js::VariableDeclaration {
                    kind: VariableKind::Const,
                    declarations: vec![Js::VariableDeclarator {
                        id: Box::new(Js::Identifier {
                            name: name.to_string(),
                        }),
                        init: Some(Box::new(expr)),
                    }],
                }
            }
            [Ast::Symbol("if"), test, then, otherwise] => Js::ConditionalExpression {
                test: Box::new(ast_to_js(test)),
                consequent: Box::new(ast_to_js(then)),
                alternate: Box::new(ast_to_js(otherwise)),
            },
            [Ast::Symbol(op), arg] if UnaryOperator::is(op) => {
                unary_expr(UnaryOperator::from(op), arg)
            }
            [Ast::Symbol(op), first, rest @ ..] if BinaryOperator::is(op) => {
                binary_expr(BinaryOperator::from(op), first, rest)
            }
            _ => todo!(),
        },
    }
}

fn undefined() -> Js {
    Js::ExpressionStatement {
        expression: Box::new(Js::UnaryExpression {
            operator: UnaryOperator::Void,
            prefix: true,
            argument: Box::new(Js::Literal {
                value: Value::Int(0),
            }),
        }),
    }
}

fn unary_expr(operator: UnaryOperator, expr: &Ast) -> Js {
    Js::UnaryExpression {
        prefix: true,
        operator,
        argument: Box::new(ast_to_js(expr)),
    }
}

fn binary_expr(operator: BinaryOperator, first: &Ast, rest: &[Ast]) -> Js {
    rest.iter()
        .map(ast_to_js)
        .fold(ast_to_js(first), |left, right| Js::BinaryExpression {
            operator,
            left: Box::new(left),
            right: Box::new(right),
        })
}
