use estree::lisp_to_js;
use parser::{JaspParser, Rule};
use pest_consume::Parser;
use wasm_bindgen::prelude::*;

mod estree;
mod eval;
mod parser;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn transpile(source: String) -> String {
    let module = JaspParser::parse(Rule::module, &source)
        .expect("module parsing failed")
        .next()
        .unwrap();

    let statements = JaspParser::module(module).expect("failed to parse module");
    let tree = lisp_to_js(statements);

    serde_json::to_string_pretty(&tree).unwrap()
}
