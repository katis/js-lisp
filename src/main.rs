use eval::Eval;
use parser::{LispParser, Rule};
use pest_consume::Parser;

mod eval;
mod parser;

fn main() {
    let module = LispParser::parse(Rule::module, r#"(if 0 "ok" "err")"#)
        .expect("failed to parse file")
        .next()
        .unwrap();

    let ast_list = LispParser::module(module).expect("failed to parse module");

    let mut eval = Eval::new();

    for ast in ast_list.iter() {
        let evaled = eval.eval(&ast);
        println!("{:?}", evaled);
    }
}
