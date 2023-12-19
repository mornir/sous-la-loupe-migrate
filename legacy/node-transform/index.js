const fs = require("node:fs/promises");
console.log("hello");
async function example() {
  try {
    const data = await fs.readFile("german.json", { encoding: "utf8" });
    console.log(data);
  } catch (err) {
    console.log(err);
  }
}
example();

