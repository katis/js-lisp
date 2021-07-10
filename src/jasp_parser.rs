use pest_consume::{match_nodes, Parser};

use crate::ast::Ast;
use crate::util::hash_cyrb53;

pub type Result<T> = std::result::Result<T, pest_consume::Error<Rule>>;
pub type Node<'i> = pest_consume::Node<'i, Rule, ()>;

pub fn parse(source: &str) -> Result<Vec<Ast>> {
    if let Some(module) = JaspParser::parse(Rule::module, source)?.next() {
        JaspParser::module(module)
    } else {
        Ok(Vec::new())
    }
}

#[derive(Parser)]
#[grammar = "jasp.pest"]
pub struct JaspParser;

#[pest_consume::parser]
impl JaspParser {
    pub fn module(input: Node) -> Result<Vec<Ast>> {
        let lines: Vec<_> = match_nodes!(input.into_children();
            [expr(exprs).., EOI(_)] => exprs.collect());
        Ok(lines)
    }

    fn EOI(_node: Node) -> Result<()> {
        Ok(())
    }

    pub fn integer(input: Node) -> Result<Ast> {
        input
            .as_str()
            .parse::<i64>()
            .map(Ast::Int)
            .map_err(|e| input.error(e))
    }

    pub fn float(input: Node) -> Result<Ast> {
        input
            .as_str()
            .parse::<f64>()
            .map(Ast::Float)
            .map_err(|e| input.error(e))
    }

    fn string(input: Node) -> Result<Ast> {
        let str = input.children().single()?.as_str();
        Ok(Ast::String(str.into()))
    }

    fn symbol(input: Node) -> Result<Ast> {
        let name = input.as_str();
        Ok(Ast::identifier(name))
    }

    fn keyword(input: Node) -> Result<Ast> {
        let name = input.children().single()?.as_str();
        Ok(Ast::Keyword {
            module: "".into(),
            full_name: name.into(),
            name: name.into(),
            hash_code: hash_cyrb53(name),
        })
    }

    fn list(input: Node) -> Result<Ast> {
        let exprs: Vec<_> = match_nodes!(input.children();
            [expr(exprs)..] => exprs.collect());
        Ok(Ast::List(exprs))
    }

    fn vector(input: Node) -> Result<Ast> {
        match_nodes!(input.into_children();
            [expr(exprs)..] => Ok(to_call("vec", exprs)))
    }

    fn object(input: Node) -> Result<Ast> {
        match_nodes!(input.children();
            [expr(exprs)..] => Ok(to_call("object", exprs)))
    }

    fn quoted(input: Node) -> Result<Ast> {
        let expr = JaspParser::expr(input.into_children().single()?)?;
        Ok(Ast::List(vec![Ast::identifier("quote"), expr]))
    }

    fn expr(input: Node) -> Result<Ast> {
        let child = input.children().single()?;
        match child.as_rule() {
            Rule::float => JaspParser::float(child),
            Rule::integer => JaspParser::integer(child),
            Rule::string => JaspParser::string(child),
            Rule::keyword => JaspParser::keyword(child),
            Rule::symbol => JaspParser::symbol(child),
            Rule::list => JaspParser::list(child),
            Rule::vector => JaspParser::vector(child),
            Rule::object => JaspParser::object(child),
            Rule::quoted => JaspParser::quoted(child),
            _ => unreachable!("ASDFASDF"),
        }
    }
}

fn to_call(identifier: &str, children: impl Iterator<Item=Ast>) -> Ast {
    let mut list = vec![Ast::identifier(identifier)];
    list.extend(children);
    Ast::List(list)
}
