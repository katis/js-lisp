use js_sys::{JsString, Object};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(raw_module = "../std/core.js")]
extern "C" {
    #[wasm_bindgen(extends = Object, is_type_of = is_keyword)]
    #[derive(Clone, Debug, PartialEq, Eq)]
    pub type Keyword;

    #[wasm_bindgen(method, getter, structural)]
    pub fn module(this: &Keyword) -> String;

    #[wasm_bindgen(method, getter, structural)]
    pub fn name(this: &Keyword) -> String;

    #[wasm_bindgen(js_name = fullName, method, getter, structural)]
    pub fn full_name(this: &Keyword) -> String;

    #[wasm_bindgen(js_name = hashCode, method, getter, structural)]
    pub fn hash_code(this: &Keyword) -> f64;
}

#[wasm_bindgen(raw_module = "../std/core.js")]
extern "C" {
    #[wasm_bindgen(js_name = isKeyword)]
    fn is_keyword(value: &JsValue) -> bool;
}

#[wasm_bindgen(raw_module = "../std/core.js")]
extern "C" {
    #[wasm_bindgen(extends = Object, is_type_of = is_identifier)]
    #[derive(Clone, Debug, PartialEq, Eq)]
    pub type Identifier;

    #[wasm_bindgen(method, getter, structural)]
    pub fn identifier(this: &Identifier) -> String;

    #[wasm_bindgen(js_name = hashCode, method, getter, structural)]
    pub fn hash_code(this: &Identifier) -> f64;
}

#[wasm_bindgen(raw_module = "../std/core.js")]
extern "C" {
    #[wasm_bindgen(js_name = isIdentifier)]
    fn is_identifier(value: &JsValue) -> bool;

    #[wasm_bindgen(js_name = hashCyrb53)]
    fn hash_cyrb53(str: JsString) -> f64;
}
