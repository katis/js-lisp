use inflector::Inflector;

pub fn js_identifier(s: String) -> String {
    s.to_camel_case()
        .replace("!", "ǃ")
        .replace("?", "ʔ")
        .replace(".", "·")
}

pub fn lisp_identifier(s: String) -> String {
    s.to_kebab_case()
        .replace("ǃ", "!")
        .replace("ʔ", "?")
        .replace("·", ".")
}
