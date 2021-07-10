use std::panic;

use js_sys::Array;
use wasm_bindgen::prelude::*;

use crate::compiler::Compiler;

mod api;
mod ast;
mod compiler;
mod es;
mod jasp_parser;
mod js_types;
mod util;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn start() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub fn parse(source: String) -> JsValue {
    let lines = jasp_parser::parse(&source).expect("compilation failed");
    let mut compiler = Compiler::new();
    let estree = compiler.compile_ast(lines).expect("compilation failed");
    serde_wasm_bindgen::to_value(&estree).expect("could not convert estree to JsValue")
}

#[wasm_bindgen]
pub fn compile(array: Array) -> JsValue {
    let mut compiler = Compiler::new();
    let estree = compiler.compile(&array.into()).expect("compilation failed");
    serde_wasm_bindgen::to_value(&estree).expect("could not convert estree to JsValue")
}
