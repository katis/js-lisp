use js_sys::{Array, JsString};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[derive(Clone)]
    pub type Api;

    #[wasm_bindgen(method)]
    pub fn identifier(this: &Api, fq_name: JsString) -> JsValue;

    #[wasm_bindgen(method)]
    pub fn keyword(this: &Api, fq_name: JsString) -> JsValue;

    #[wasm_bindgen(method)]
    pub fn list(this: &Api, items: Array) -> JsValue;

    #[wasm_bindgen(method)]
    pub fn log(this: &Api, msg: JsString);
}

#[wasm_bindgen]
extern "C" {
    #[derive(Clone)]
    pub type ObjectMap;

    #[wasm_bindgen(method, structural, indexing_setter)]
    pub fn set(this: &ObjectMap, name: &JsValue, value: &JsValue);
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: String);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_value(s: &str, value: &JsValue);
}
