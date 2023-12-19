const path = "./data/french.json";
const file = Bun.file(path);

const contents = await file.json();

file.type;

console.log(file.type);