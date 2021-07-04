use pest_consume::{match_nodes, Parser};

pub type Result<T> = std::result::Result<T, pest_consume::Error<Rule>>;
pub type Node<'i> = pest_consume::Node<'i, Rule, ()>;

#[derive(Parser)]
#[grammar = "grammar2.pest"]
pub struct LispParser;

#[pest_consume::parser]
impl LispParser {
    pub fn module(input: Node) -> Result<Vec<Ast>> {
        let statements = match_nodes!(input.into_children();
            [list(lists).., EOI(_)] => lists.collect());
        Ok(statements)
    }

    fn EOI(input: Node) -> Result<()> {
        Ok(())
    }

    fn integer(input: Node) -> Result<Ast> {
        input
            .as_str()
            .parse::<i64>()
            .map(Ast::Integer)
            .map_err(|e| input.error(e))
    }

    fn float(input: Node) -> Result<Ast> {
        input
            .as_str()
            .parse::<f64>()
            .map(Ast::Float)
            .map_err(|e| input.error(e))
    }

    fn string(input: Node) -> Result<Ast> {
        Ok(Ast::String(input.children().single()?.as_str()))
    }

    fn symbol(input: Node) -> Result<Ast> {
        Ok(Ast::Symbol(input.as_str()))
    }

    fn atom(input: Node) -> Result<Ast> {
        Ok(Ast::Atom(input.children().single()?.as_str()))
    }

    fn expr(input: Node) -> Result<Ast> {
        let child = input.children().single()?;
        match child.as_rule() {
            Rule::float => LispParser::float(child),
            Rule::integer => LispParser::integer(child),
            Rule::string => LispParser::string(child),
            Rule::atom => LispParser::atom(child),
            Rule::symbol => LispParser::symbol(child),
            Rule::list => LispParser::list(child),
            Rule::vector => LispParser::vector(child),
            Rule::map => LispParser::map(child),
            Rule::quoted => LispParser::quoted(child),
            _ => unreachable!(),
        }
    }

    fn list(input: Node) -> Result<Ast> {
        let exprs = match_nodes!(input.into_children();
            [expr(exprs)..] => exprs.collect());
        Ok(Ast::List(exprs))
    }

    fn vector(input: Node) -> Result<Ast> {
        let exprs = match_nodes!(input.into_children();
            [expr(exprs)..] => exprs.collect());
        Ok(Ast::Vector(exprs))
    }

    fn map(input: Node) -> Result<Ast> {
        let mut kvs = vec![];

        let mut exprs = match_nodes!(input.into_children();
            [expr(exprs)..] => exprs);

        while let (Some(k), Some(v)) = (exprs.next(), exprs.next()) {
            kvs.push((k, v));
        }

        Ok(Ast::Map(kvs))
    }

    fn set(input: Node) -> Result<Ast> {
        let exprs = match_nodes!(input.into_children();
            [expr(exprs)..] => exprs.collect());
        Ok(Ast::Set(exprs))
    }

    fn quoted(input: Node) -> Result<Ast> {
        let expr = LispParser::expr(input.into_children().single()?)?;
        Ok(Ast::Quoted(Box::new(expr)))
    }
}

type Procedure<'a> = Box<dyn Fn(Vec<Ast<'a>>) -> Ast<'a>>;

#[derive(Debug, PartialEq, Clone)]
pub enum Ast<'a> {
    Integer(i64),
    Float(f64),
    String(&'a str),
    Atom(&'a str),
    Symbol(&'a str),
    List(Vec<Ast<'a>>),
    Vector(Vec<Ast<'a>>),
    Map(Vec<(Ast<'a>, Ast<'a>)>),
    Set(Vec<Ast<'a>>),
    Quoted(Box<Ast<'a>>),
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(rule: Rule, input_str: &str, map: impl Fn(Node) -> Result<Ast>) -> Result<Ast> {
        let inputs = LispParser::parse(rule, input_str).unwrap();
        // There should be a single root node in the parsed tree
        map(inputs.single().unwrap())
    }

    macro_rules! parse_as {
        ($i:ident, $input:expr) => {
            parse(Rule::$i, $input, LispParser::$i)
        };
    }

    #[test]
    fn test_integer() {
        let result = parse_as!(integer, "1234");
        assert_eq!(result, Ok(Ast::Integer(1234)))
    }

    #[test]
    fn test_float() {
        let result = parse_as!(float, "1234.1234");
        assert_eq!(result, Ok(Ast::Float(1234.1234)))
    }

    #[test]
    fn test_string() {
        let result = parse_as!(string, "\"foo bar? foo.\"");
        assert_eq!(result, Ok(Ast::String("foo bar? foo.")))
    }

    #[test]
    fn test_symbol() {
        let result = parse_as!(symbol, "foo-bar?");
        assert_eq!(result, Ok(Ast::Symbol("foo-bar?")))
    }

    #[test]
    fn test_atom() {
        let result = parse_as!(atom, ":foo-bar?");
        assert_eq!(result, Ok(Ast::Atom("foo-bar?")))
    }

    #[test]
    fn test_expr() {
        let result = parse_as!(expr, ":foo-bar?");
        assert_eq!(result, Ok(Ast::Atom("foo-bar?")))
    }

    #[test]
    fn test_list() {
        let result = parse_as!(list, "(foo :bar \"baz\")");
        assert_eq!(
            result,
            Ok(Ast::List(vec![
                Ast::Symbol("foo"),
                Ast::Atom("bar"),
                Ast::String("baz"),
            ]))
        )
    }

    #[test]
    fn test_vector() {
        let result = parse_as!(vector, "[foo :bar \"baz\"]");
        assert_eq!(
            result,
            Ok(Ast::Vector(vec![
                Ast::Symbol("foo"),
                Ast::Atom("bar"),
                Ast::String("baz"),
            ]))
        )
    }

    #[test]
    fn test_map() {
        let result = parse_as!(map, "{:foo :bar}");
        assert_eq!(
            result,
            Ok(Ast::Map(vec![(Ast::Atom("foo"), Ast::Atom("bar"))]))
        )
    }

    #[test]
    fn test_set() {
        let result = parse_as!(set, "#{:foo :bar}");
        assert_eq!(
            result,
            Ok(Ast::Set(vec![Ast::Atom("foo"), Ast::Atom("bar")]))
        )
    }

    #[test]
    fn test_module() {
        let result = parse_as!(module, r#"(import :default "foo.js" foo)"#);
        assert_eq!(
            result,
            Ok(Ast::List(vec![Ast::List(vec![
                Ast::Symbol("import"),
                Ast::Atom("default"),
                Ast::String("foo.js"),
                Ast::Symbol("foo")
            ])]))
        )
    }
}
