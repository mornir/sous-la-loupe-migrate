const slugify = require('slug')
import vedettes from './data/german.json'
import translations from './data/french.json'
import examples from './data/examples.json'

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

    const exemples = examples.filter((e) => e.id_term === v.id_term).map((e2) => {
      return {
        id: e2.id_term,
        de: e2.term_expression.replace(/(<([^>]+)>)/gi, '').trim().replace(/\n|\r/g, ''),
        fr: e2.trans_expression.replace(/(<([^>]+)>)/gi, '').trim().replace(/\n|\r/g, ''),
        position: e2.display_order
      }
    }).sort((a, b) => {
      // Sort by position
      if (a.position < b.position) return -1
      if (a.position > b.position) return 1
      // Both idential, return 0
      return 0
    })

    const vedette = v.term.trim()
    const slug = slugify(vedette, { locale: 'de' })


    return {
      id: v.id_term,
      vedette,
      slug,
      notes: v.notes.replace(/(<([^>]+)>)/gi, '').trim(),
      traductions,
      exemples,
    }
  })
  .filter(Boolean)

const output = JSON.stringify(data)

await Bun.write('fiches.json', output)
