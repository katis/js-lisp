const { generate } = require("astring");

process.stdin.on("data", (data) => {
  const node = JSON.parse(data.toString());
  const str = generate(node);
  console.log(str);
  process.exit();
});
