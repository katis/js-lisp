(import "foo.js" []
        "bar.js" bar
        "baz.js" baz)

(foo bar :baz "foobar" (add foo) (add))

(import "foo.js")
