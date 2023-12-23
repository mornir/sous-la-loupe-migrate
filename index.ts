const path = "./data/german.json";
const path2 = "./data/french.json";
const file = Bun.file(path);
const file2 = Bun.file(path2);

const vedettes = await file.json();

const translations = await file2.json();

const data = vedettes
  .map((v) => {
    if (!v.term) return null;

    const traductions = translations.filter((t) => v.id_term === t.id_term).map(t2 => {
      return {
        id: t2.id_translation,
        terme: t2.term_translation.trim(),
        groupe: t2.display_order
      }
    });

    return {
      id: v.id_term,
      term: v.term.trim(),
      traductions
    };
  })
  .filter(Boolean);

const output = JSON.stringify(data);

await Bun.write("fichier.json", output);
