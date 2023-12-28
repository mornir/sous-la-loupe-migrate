import vedettes from './data/german.json'
import translations from './data/french.json'

const data = vedettes
  .map((v) => {
    if (!v.term) return null

    const traductions = translations
      .filter((t) => v.id_term === t.id_term)
      .map((t2) => {
        return {
          id: t2.id_translation,
          terme: t2.term_translation.replace(/(<([^>]+)>)/gi, '').trim(),
          groupe: t2.display_order,
          position: t2.display_order1,
          sens: t2.id_subject_field,
        }
      })

    traductions.sort((a, b) => {
      // Sort by groups
      if (a.groupe < b.groupe) return -1
      if (a.groupe > b.groupe) return 1
      // Then sort by position
      if (a.position < b.position) return -1
      if (a.position > b.position) return 1
      // Both idential, return 0
      return 0
    })

    return {
      id: v.id_term,
      term: v.term.trim(),
      traductions,
    }
  })
  .filter(Boolean)

const output = JSON.stringify(data)

await Bun.write('fichier.json', output)
