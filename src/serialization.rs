use js_sys::{Map, Set};
use wasm_bindgen::{JsCast, prelude::*};

#[wasm_bindgen]
pub fn serialize(tree: JsValue) -> String {
    let mut serializer = Serializer::new();
    serializer.serialize(tree)
}

pub struct Serializer {
    buf: String,
}

impl Serializer {
    pub fn new() -> Self {
        Serializer { buf: String::new() }
    }

    pub fn serialize(mut self, value: JsValue) -> String {
        self.serialize_value(&value);
        self.buf
    }

    fn serialize_value(&mut self, value: &JsValue) {
        if let Some(map) = value.dyn_ref::<Map>() {
            map.for_each(&mut |value, key| {
                self.serialize_value(&value);
            });
        } else if let Some(set) = value.dyn_ref::<Set>() {
            set.for_each(&mut |value, _, _| {
                self.serialize_value(&value);
            });
        }
    }
}
