use eval::Eval;
use parser::{LispParser, Rule};
use pest_consume::Parser;

mod eval;
mod parser;

fn main() {
    let module = LispParser::parse(Rule::module, "(def foo (+ 1 2 3)) (def bar 4)  (- foo bar)")
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
