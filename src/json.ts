const slugify = require('slug')
slugify.setLocale('de')

import vedettes from '../data/german.json'
import translations from '../data/french.json'
import examples from '../data/examples.json'
import links from '../data/links.json'

// https://github.com/microsoft/TypeScript/pull/29955#issuecomment-470062531
function BooleanFix<T>(value: T): value is Exclude<T, false | null | undefined | '' | 0> {
  return Boolean(value);
}

function sortFn(a: number, b: number) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function cleanup(str: string) {
  // remove all html tags, except <b> and <i>
  const stripHtml = /(<((?!\/?b|\/?i)[^>]+)>)/gi
  const stripNonBreakingSpaces = /\u00A0|&nbsp;/g

  // Remove attributes from <b>
  const cleanBoldTags = /<b(?:\s+[^>]+)?\s*>/g

  const removeEmptyTags = /<i><\/i>|<b><\/b>/g

  const removeDoubleCarriageReturn = /\r\n<br>/g

  // U+00ad
  const removeSoftHyphen = /\u00AD/g

  return str.replace(stripHtml, '').replace(stripNonBreakingSpaces, ' ').replace(cleanBoldTags, '<b>').replace(removeEmptyTags, '').replace(removeDoubleCarriageReturn, '\r\n').replaceAll('<br>', '\r\n').replace(removeSoftHyphen, '').trim()
}

function removeDuplicates(arr: Array<{
  id_source: number;
  id_cible: number;
  type: number;
  position: number;
  vedette: string;
  slug: any;
}>) {
  return Array.from(new Set(arr.map(a => a.slug)))
    .map(slug => {
      return arr.find(a => a.slug === slug)
    })
}

const linksWithSlugs = links.map((l) => {

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
}).filter(BooleanFix).sort((a, b) => {
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
          terme: t2.term_translation.replace(/(<([^>]+)>)/gi, '').replace(/\u00A0|&nbsp;/g, ' ').trim(),
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

    const liens2 = linksWithSlugs.filter((l) => l.id_source === v.id_term)
    const liens = removeDuplicates(liens2)

    const vedette = v.term.trim()
    const slug = slugify(vedette)

    return {
      id: v.id_term,
      vedette,
      slug,
      /* notes: v.notes.replace(/(<([^>]+)>)/gi, '').trim(), */
      traductions,
      exemples,
      liens
    }
  })
  .filter(BooleanFix).filter(f => !f.vedette.startsWith('-1'))

const vedettesListe = data.map(v => ({ id: v.id, vedette: v.vedette, slug: v.slug }))

const nuage = data.map(fiche => {
  const exemplesCount = fiche.exemples.length
  const text = fiche.vedette
  // Exclude vedettes with parenthesis and slashes (looks ugly in cloud)
  if (text.includes('(')) return null
  if (text.includes('/')) return null
  return {
    text,
    size: Math.max(exemplesCount, 1),
    href: fiche.slug
  }
}).filter(BooleanFix).sort((a, b) => {
  return sortFn(b.size, a.size)
})

const output = JSON.stringify(data)
const output2 = JSON.stringify(vedettesListe)
const output3 = JSON.stringify(nuage)

await Bun.write('./output/fiches.json', output)
await Bun.write('./output/vedettes.json', output2)
await Bun.write('./output/nuage.json', output3)
