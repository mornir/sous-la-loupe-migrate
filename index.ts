const slugify = require('slug')
slugify.setLocale('de')

import vedettes from './data/german.json'
import translations from './data/french.json'
import examples from './data/examples.json'
import links from './data/links.json'


function sortFn(a: number, b: number) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function cleanup(str: string) {
  return str.replace(/(<((?!\/?b|\/?i)[^>]+)>)/gi, '').trim()
}

const linksEnhanced = links.map((l) => {

  const vedette = vedettes.find(v => v.id_term === l.id_term_linked)?.term
  if (!vedette) return null
  const slug = slugify(vedette)

  return {
    id_source: l.id_term,
    id_cible: l.id_term_linked,
    type: l.relation_type,
    position: l.display_order,
    vedette,
    slug
  }
}).filter(Boolean).sort((a, b) => {
  // https://github.com/microsoft/TypeScript/issues/16655
  // @ts-ignore
  return sortFn(a.position, b.position)
})

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
        de: cleanup(e2.term_expression),
        fr: cleanup(e2.trans_expression),
        position: e2.display_order
      }
    }).sort((a, b) => sortFn(a.position, b.position))

    // https://github.com/microsoft/TypeScript/issues/16655
    // @ts-ignore
    const liens = linksEnhanced.filter((l) => l.id_source === v.id_term)

    const vedette = v.term.trim()
    const slug = slugify(vedette)

    return {
      id: v.id_term,
      vedette,
      slug,
      notes: v.notes.replace(/(<([^>]+)>)/gi, '').trim(),
      traductions,
      exemples,
      liens
    }
  })
  .filter(Boolean)

// @ts-ignore
const vedettesListe = data.map(v => ({ id: v.id, vedette: v.vedette, slug: v.slug }))

const output = JSON.stringify(data)
const output2 = JSON.stringify(vedettesListe)

await Bun.write('./output/fiches.json', output)
await Bun.write('./output/vedettes.json', output2)
