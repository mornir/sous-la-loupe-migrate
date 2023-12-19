const path = "./data/german.json";
const file = Bun.file(path);

const vedettes = await file.json();

const data = vedettes.map((v) => {
  if(!v.term) return null
  return {
    id: v.id_term,
    term: v.term.trim()
  }
}).filter(Boolean)

const output = JSON.stringify(data)

await Bun.write("fichier.json", output);