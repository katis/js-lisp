use estree::lisp_to_js;
use parser::{JaspParser, Rule};
use pest_consume::Parser;

mod estree;
mod eval;
mod parser;

fn main() {
    let source = r#"
        (def a (+ 1 2))

        (def b (+ a 1))

        (def c
            {:ab (if (=== a b) a b)})
    "#;

    let module = JaspParser::parse(Rule::module, &source)
        .expect("module parsing failed")
        .next()
        .unwrap();

    let statements = JaspParser::module(module).expect("failed to parse module");

    let tree = lisp_to_js(statements);

    let str = serde_json::to_string_pretty(&tree).unwrap();

    println!("{}", str);
}
