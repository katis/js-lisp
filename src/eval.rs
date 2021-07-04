use std::collections::HashMap;

use crate::{eval, parser::Ast};

type Procedure<'a> = Box<dyn Fn(Vec<Ast<'a>>) -> Ast<'a>>;

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

pub struct Eval<'a> {
    procs: Vec<Procedure<'a>>,
    defs: HashMap<&'a str, Ast<'a>>,
}

impl<'a> Eval<'a> {
    pub fn new() -> Self {
        let mut eval = Eval {
            procs: Vec::new(),
            defs: HashMap::new(),
        };
        eval.def_named_proc("+", 1, Box::new(plus));
        eval.def_named_proc("-", 1, Box::new(minus));
        eval
    }

    fn def_named_proc(&mut self, name: &'a str, min_arity: usize, proc: Procedure<'a>) {
        let id = self.procs.len();
        self.procs.push(proc);
        self.defs.insert(
            name,
            Ast::Procedure {
                id,
                name,
                min_arity,
            },
        );
    }

    pub fn eval(&mut self, ast: &'a Ast<'a>) -> Result<Ast<'a>> {
        match ast {
            Ast::Nil | Ast::Float(_) | Ast::Integer(_) | Ast::String(_) | Ast::Atom(_) => {
                Ok(ast.clone())
            }
            Ast::Symbol(name) => Ok(self.defs[name].clone()),
            Ast::List(parts) => match &parts[..] {
                [Ast::Symbol("def"), Ast::Symbol(name), body] => {
                    let body = self.eval(body)?;
                    self.defs.insert(name, body);
                    Ok(Ast::Nil)
                }
                [Ast::Symbol("if"), test, then, otherwise] => {
                    let test = self.eval(test)?;
                    let expr = if to_bool(test) { then } else { otherwise };
                    self.eval(expr)
                }
                [] => Ok(Ast::Nil),
                list => {
                    if let Some((proc, args)) = list.split_first() {
                        let proc = self.eval(proc)?;
                        let mut eval_args = args
                            .iter()
                            .map(|arg| self.eval(arg))
                            .collect::<Result<Vec<_>>>()?;
                        self.call(proc, eval_args)
                    } else {
                        unreachable!()
                    }
                }
            },
            ast => Ok(ast.clone()),
        }
    }

    fn call(&self, proc: Ast<'a>, args: Vec<Ast<'a>>) -> Result<Ast<'a>> {
        if let Ast::Procedure {
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
            Ok((proc)(args))
        } else {
            Err(EvalError::TypeError(format!(
                "expected a function, not {:?}",
                proc
            )))
        }
    }
}

fn plus(values: Vec<Ast>) -> Ast {
    match values.split_first() {
        Some((Ast::Integer(n), [])) => Ast::Integer(*n),
        Some((Ast::Float(n), [])) => Ast::Float(*n),
        Some((first, rest)) => rest
            .iter()
            .fold(first.clone(), |result, arg| match (result, arg) {
                (Ast::Integer(result), Ast::Integer(arg)) => Ast::Integer(result + arg),
                (Ast::Float(result), Ast::Integer(arg)) => Ast::Float(result + *arg as f64),
                (Ast::Float(result), Ast::Float(arg)) => Ast::Float(result + arg),
                (Ast::Integer(result), Ast::Float(arg)) => Ast::Float(result as f64 + arg),
                _ => panic!("can only add numbers"),
            }),
        None => unreachable!(),
    }
}

fn minus(values: Vec<Ast>) -> Ast {
    match values.split_first() {
        Some((Ast::Integer(n), [])) => Ast::Integer(-n),
        Some((Ast::Float(f), [])) => Ast::Float(-f),
        Some((first, rest)) => rest
            .iter()
            .fold(first.clone(), |result, arg| match (result, arg) {
                (Ast::Integer(result), Ast::Integer(arg)) => Ast::Integer(result - arg),
                (Ast::Float(result), Ast::Integer(arg)) => Ast::Float(result - *arg as f64),
                (Ast::Float(result), Ast::Float(arg)) => Ast::Float(result - arg),
                (Ast::Integer(result), Ast::Float(arg)) => Ast::Float(result as f64 - arg),
                _ => panic!("can only subtract numbers"),
            }),
        None => unreachable!(),
    }
}

fn to_bool(ast: Ast) -> bool {
    match ast {
        Ast::Nil | Ast::Integer(0) | Ast::String("") => false,
        Ast::Float(f) if f == 0.0 => false,
        _ => true,
    }
}
