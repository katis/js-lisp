use serde::Serialize;

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum Es {
    Program {
        #[serde(rename = "source_type")]
        source_type: SourceType,
        body: Vec<Es>,
    },
    ImportDeclaration {
        specifiers: Vec<ImportSpecifier>,
        source: Box<Es>,
    },
    ExpressionStatement {
        expression: Box<Es>,
    },
    Identifier {
        name: String,
    },
    Literal {
        value: Value,
    },
    NewExpression {
        callee: Box<Es>,
        arguments: Vec<Es>,
    },
    CallExpression {
        callee: Box<Es>,
        arguments: Vec<Es>,
    },
    MemberExpression {
        object: Box<Es>,
        property: Box<Es>,
        computed: bool,
        optional: bool,
    },
    UnaryExpression {
        operator: UnaryOp,
        argument: Box<Es>,
    },
    BinaryExpression {
        operator: BinaryOp,
        left: Box<Es>,
        right: Box<Es>,
    },
    ArrayExpression {
        elements: Vec<Es>,
    },
}

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum ImportSpecifier {
    #[serde(rename = "ImportNameSpecifier")]
    Named { local: Es },
}

#[derive(Serialize, Clone, Copy)]
pub enum UnaryOp {
    #[serde(rename = "+")]
    Plus,
    #[serde(rename = "-")]
    Minus,
    #[serde(rename = "void")]
    Void,
}

#[derive(Serialize, Clone, Copy)]
pub enum BinaryOp {
    #[serde(rename = "+")]
    Plus,
    #[serde(rename = "-")]
    Minus,
}

impl Es {
    pub fn is_expression(&self) -> bool {
        match self {
            Es::Identifier { .. }
            | Es::Literal { .. }
            | Es::NewExpression { .. }
            | Es::MemberExpression { .. }
            | Es::ArrayExpression { .. }
            | Es::CallExpression { .. }
            | Es::BinaryExpression { .. }
            | Es::UnaryExpression { .. } => true,
            Es::Program { .. } | Es::ImportDeclaration { .. } | Es::ExpressionStatement { .. } => {
                false
            }
        }
    }

    pub fn into_statement(self) -> Es {
        if self.is_expression() {
            Es::ExpressionStatement {
                expression: Box::new(self),
            }
        } else {
            self
        }
    }

    pub fn null() -> Es {
        // TODO: serde-wasm-bindgen doesn't support serializing nulls
        Es::MemberExpression {
            object: Box::new(Es::Identifier { name: "std".into() }),
            property: Box::new(Es::Identifier {
                name: "NULL".into(),
            }),
            computed: false,
            optional: false,
        }
    }

    pub fn undefined() -> Es {
        Es::UnaryExpression {
            operator: UnaryOp::Void,
            argument: Box::new(Es::int_literal(0)),
        }
    }

    pub fn identifier(name: impl Into<String>) -> Es {
        Es::Identifier { name: name.into() }
    }

    pub fn float_literal(num: f64) -> Es {
        Es::Literal {
            value: Value::Float(num),
        }
    }

    pub fn int_literal(int: i64) -> Es {
        Es::Literal {
            value: Value::Integer(int),
        }
    }

    pub fn string_literal(str: impl Into<String>) -> Es {
        Es::Literal {
            value: Value::String(str.into()),
        }
    }

    pub fn new_expr(callee: Es, arguments: Vec<Es>) -> Es {
        Es::NewExpression {
            callee: Box::new(callee),
            arguments,
        }
    }

    pub fn call_expr(callee: Es, arguments: Vec<Es>) -> Es {
        Es::CallExpression {
            callee: Box::new(callee),
            arguments,
        }
    }

    pub fn member_expr(object: Es, property: Es) -> Es {
        Es::MemberExpression {
            object: Box::new(object),
            property: Box::new(property),
            computed: false,
            optional: false,
        }
    }

    pub fn unary_expr(operator: UnaryOp, argument: Es) -> Es {
        Es::UnaryExpression {
            operator,
            argument: Box::new(argument),
        }
    }

    pub fn binary_expr(operator: BinaryOp, left: Es, right: Es) -> Es {
        Es::BinaryExpression {
            operator,
            left: Box::new(left),
            right: Box::new(right),
        }
    }

    pub fn import_as(name: &str, source: &str) -> Es {
        Es::ImportDeclaration {
            specifiers: vec![ImportSpecifier::Named {
                local: Es::identifier(name),
            }],
            source: Box::new(Es::string_literal(source)),
        }
    }
}

#[derive(Serialize)]
pub enum SourceType {
    #[serde(rename = "module")]
    Module,
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum Value {
    Float(f64),
    Integer(i64),
    String(String),
}
