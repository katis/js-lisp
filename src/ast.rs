use std::convert::TryFrom;

use js_sys::{Array, Number};
use wasm_bindgen::{JsCast, JsValue};

use crate::api::log_value;
use crate::js_types::{Identifier, Keyword};
use crate::util::hash_cyrb53;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    UnknownData(JsValue),
}

#[derive(Debug)]
pub enum Ast {
    Undefined,
    Null,
    Int(i64),
    Float(f64),
    String(String),
    List(Vec<Ast>),
    Keyword {
        module: String,
        name: String,
        full_name: String,
        hash_code: i64,
    },
    Identifier {
        name: String,
        hash_code: i64,
    },
}

impl Ast {
    pub fn identifier(name: &str) -> Ast {
        Ast::Identifier {
            name: name.into(),
            hash_code: hash_cyrb53(name),
        }
    }

    pub fn keyword(module: impl Into<String>, name: impl Into<String>) -> Ast {
        let module = module.into();
        let name = name.into();
        let full_name = if module.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", &module, &name)
        };
        let hash_code = hash_cyrb53(&full_name);
        Ast::Keyword {
            module,
            name,
            full_name,
            hash_code,
        }
    }
}

impl TryFrom<&JsValue> for Ast {
    type Error = Error;

    fn try_from(value: &JsValue) -> Result<Self> {
        log_value("Try AST", value);
        if value.is_null() {
            Ok(Ast::Null)
        } else if value.is_undefined() {
            Ok(Ast::Undefined)
        } else if Number::is_safe_integer(value) {
            Ok(Ast::Int(value.as_f64().unwrap() as i64))
        } else if let Some(f) = value.as_f64() {
            Ok(Ast::Float(f))
        } else if let Some(s) = value.as_string() {
            Ok(Ast::String(s))
        } else if let Some(arr) = value.dyn_ref::<Array>() {
            Ok(Ast::List(array_to_ast(arr)?))
        } else if let Some(kw) = value.dyn_ref::<Keyword>() {
            Ok(Ast::Keyword {
                module: kw.module(),
                name: kw.name(),
                full_name: kw.full_name(),
                hash_code: kw.hash_code() as i64,
            })
        } else if let Some(id) = value.dyn_ref::<Identifier>() {
            Ok(Ast::Identifier {
                name: id.identifier(),
                hash_code: id.hash_code() as i64,
            })
        } else {
            Err(Error::UnknownData(value.clone()))
        }
    }
}

fn array_to_ast(arr: &Array) -> Result<Vec<Ast>> {
    let mut vector = vec![];
    for item in arr.iter() {
        match Ast::try_from(&item) {
            Ok(ast) => vector.push(ast),
            Err(err) => return Err(err),
        }
    }
    Ok(vector)
}
