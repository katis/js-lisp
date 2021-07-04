use ordered_float::OrderedFloat;
use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write;
use std::{borrow::Cow, collections::HashMap, fmt::Display};

use crate::parser::Ast;

type Procedure<'a> = Box<dyn Fn(Vec<Expr<'a>>) -> Result<Expr<'a>>>;

type Result<T> = std::result::Result<T, EvalError>;

#[derive(Debug)]
pub enum EvalError {
    ArityError {
        proc_name: String,
        expected: usize,
        received: usize,
    },
    TypeError(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Expr<'a> {
    Nil,
    Integer(i64),
    Float(OrderedFloat<f64>),
    String(Cow<'a, str>),
    Atom(&'a str),
    Vector(Vec<Expr<'a>>),
    Set(BTreeSet<Expr<'a>>),
    Map(BTreeMap<Expr<'a>, Expr<'a>>),
    Procedure {
        id: usize,
        name: &'a str,
        min_arity: usize,
    },
}

impl<'a> Display for Expr<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Expr::Nil => write!(f, "()"),
            Expr::Integer(n) => write!(f, "{}", n),
            Expr::Float(OrderedFloat(n)) => write!(f, "{:.}", n),
            Expr::String(str) => write!(f, "{}", &str),
            Expr::Atom(name) => write!(f, ":{}", name),
            Expr::Procedure {
                id,
                name,
                min_arity,
            } => write!(f, "(fn {}@{} [{}] ..)", name, id, min_arity),
            Expr::Vector(items) => {
                write!(f, "[")?;
                for (i, item) in items.iter().enumerate() {
                    if i == 0 {
                        write!(f, "{}", item)?;
                    } else {
                        write!(f, " {}", item)?;
                    }
                }
                write!(f, "]")
            }
            Expr::Set(set) => {
                write!(f, "#{{")?;
                for (i, v) in set.iter().enumerate() {
                    if i == 0 {
                        write!(f, "{}", v)?;
                    } else {
                        write!(f, " {} ", v)?;
                    }
                }
                write!(f, "}}")
            }
            Expr::Map(map) => {
                write!(f, "{{")?;
                for (i, (k, v)) in map.iter().enumerate() {
                    if i == 0 {
                        write!(f, "{} {}", k, v)?;
                    } else {
                        write!(f, " {} {}", k, v)?;
                    }
                }
                write!(f, "}}")
            }
        }
    }
}

pub struct Eval<'a> {
    procs: Vec<Procedure<'a>>,
    defs: HashMap<&'a str, Expr<'a>>,
}

impl<'a> Eval<'a> {
    pub fn new() -> Self {
        let mut eval = Eval {
            procs: Vec::new(),
            defs: HashMap::new(),
        };
        eval.def_named_proc("+", 1, Box::new(plus));
        eval.def_named_proc("-", 1, Box::new(minus));
        eval.def_named_proc("str", 0, Box::new(str));
        eval
    }

    fn def_named_proc(&mut self, name: &'a str, min_arity: usize, proc: Procedure<'a>) {
        let id = self.procs.len();
        self.procs.push(proc);
        self.defs.insert(
            name,
            Expr::Procedure {
                id,
                name,
                min_arity,
            },
        );
    }

    pub fn eval(&mut self, ast: &'a Ast<'a>) -> Result<Expr<'a>> {
        match ast {
            Ast::Float(f) => Ok(Expr::Float(OrderedFloat(*f))),
            Ast::Integer(n) => Ok(Expr::Integer(*n)),
            Ast::String(str) => Ok(Expr::String(Cow::from(*str))),
            Ast::Atom(str) => Ok(Expr::Atom(str)),
            Ast::Symbol(name) => Ok(self.defs[name].clone()),
            Ast::List(parts) => match &parts[..] {
                [Ast::Symbol("def"), Ast::Symbol(name), body] => {
                    let body = self.eval(body)?;
                    self.defs.insert(name, body);
                    Ok(Expr::Nil)
                }
                [Ast::Symbol("if"), test, then, otherwise] => {
                    let test = self.eval(test)?;
                    let expr = if to_bool(test) { then } else { otherwise };
                    self.eval(expr)
                }
                [] => Ok(Expr::Nil),
                list => {
                    if let Some((proc, args)) = list.split_first() {
                        let proc = self.eval(proc)?;
                        let eval_args = args
                            .iter()
                            .map(|arg| self.eval(arg))
                            .collect::<Result<Vec<_>>>()?;
                        self.call(proc, eval_args)
                    } else {
                        unreachable!()
                    }
                }
            },
            Ast::Vector(items) => {
                let items = items
                    .iter()
                    .map(|item| self.eval(item))
                    .collect::<Result<Vec<_>>>()?;
                Ok(Expr::Vector(items))
            }
            Ast::Set(set) => {
                let set = set
                    .iter()
                    .map(|item| self.eval(item))
                    .collect::<Result<BTreeSet<_>>>()?;
                Ok(Expr::Set(set))
            }
            Ast::Map(map) => {
                let mut result = BTreeMap::new();
                for (k, v) in map.iter() {
                    let k = self.eval(k)?;
                    let v = self.eval(v)?;
                    result.insert(k, v);
                }
                Ok(Expr::Map(result))
            }
            ast => todo!("{:?}", ast),
        }
    }

    fn call(&self, proc: Expr<'a>, args: Vec<Expr<'a>>) -> Result<Expr<'a>> {
        if let Expr::Procedure {
            id,
            name,
            min_arity,
        } = proc
        {
            if args.len() < min_arity {
                return Err(EvalError::ArityError {
                    proc_name: name.into(),
                    expected: min_arity,
                    received: args.len(),
                });
            }
            let proc = &self.procs[id];
            (proc)(args)
        } else {
            Err(EvalError::TypeError(format!(
                "expected a function, not {:?}",
                proc
            )))
        }
    }
}

fn plus(values: Vec<Expr>) -> Result<Expr> {
    match values.split_first() {
        Some((Expr::Integer(n), [])) => Ok(Expr::Integer(*n)),
        Some((Expr::Float(n), [])) => Ok(Expr::Float(*n)),
        Some((first, rest)) => {
            rest.iter()
                .try_fold(first.clone(), |result, arg| match (result, arg) {
                    (Expr::Integer(result), Expr::Integer(arg)) => Ok(Expr::Integer(result + arg)),
                    (Expr::Float(result), Expr::Integer(arg)) => {
                        Ok(Expr::Float(OrderedFloat(result.0 + *arg as f64)))
                    }
                    (Expr::Float(result), Expr::Float(arg)) => {
                        Ok(Expr::Float(OrderedFloat(result.0 + arg.0)))
                    }
                    (Expr::Integer(result), Expr::Float(arg)) => {
                        Ok(Expr::Float(OrderedFloat(result as f64 + arg.0)))
                    }
                    _ => Err(EvalError::TypeError("can only add numbers".into())),
                })
        }
        None => Err(EvalError::TypeError("can only add numbers".into())),
    }
}

fn minus(values: Vec<Expr>) -> Result<Expr> {
    match values.split_first() {
        Some((Expr::Integer(n), [])) => Ok(Expr::Integer(-n)),
        Some((Expr::Float(f), [])) => Ok(Expr::Float(-f)),
        Some((first, rest)) => {
            rest.iter()
                .try_fold(first.clone(), |result, arg| match (result, arg) {
                    (Expr::Integer(result), Expr::Integer(arg)) => Ok(Expr::Integer(result - arg)),
                    (Expr::Float(result), Expr::Integer(arg)) => {
                        Ok(Expr::Float(result - *arg as f64))
                    }
                    (Expr::Float(result), Expr::Float(arg)) => Ok(Expr::Float(result - arg)),
                    (Expr::Integer(result), Expr::Float(arg)) => {
                        Ok(Expr::Float(OrderedFloat(result as f64 - arg.0)))
                    }
                    _ => Err(EvalError::TypeError("can only subtract numbers".into())),
                })
        }
        None => Err(EvalError::TypeError("invalid argument types for -".into())),
    }
}

fn to_bool(expr: Expr) -> bool {
    match expr {
        Expr::String(s) => !s.is_empty(),
        Expr::Nil | Expr::Integer(0) => false,
        Expr::Float(f) if f == 0.0 => false,
        _ => true,
    }
}

fn str(args: Vec<Expr>) -> Result<Expr> {
    let mut output = String::new();
    for arg in args.iter() {
        write!(output, "{}", arg).unwrap();
    }
    Ok(Expr::String(Cow::from(output)))
}
