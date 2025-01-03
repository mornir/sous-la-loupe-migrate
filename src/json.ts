import { slugifyWithCounter } from '@sindresorhus/slugify';

import vedettes from '../data/german.json'
import translations from '../data/french.json'
import examples from '../data/examples.json'
import links from '../data/links.json'
import genders from '../data/genders.json'
import fields from '../data/fields.json'
import defs from '../data/definitions.json'
import dictionaries from '../data/dictionaries.json'

// With counters because of words like Abseits et abseits which would result in the same slug
const slugify = slugifyWithCounter();

const slugs = vedettes.map(v => {
  return {
    id: v.id_term,
    slug: slugify(v.term, { decamelize: false })
  }
})

// https://github.com/microsoft/TypeScript/pull/29955#issuecomment-470062531
function BooleanFix<T>(value: T): value is Exclude<T, false | null | undefined | '' | 0> {
  return Boolean(value);
}

function sortFn(a: number, b: number) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function cleanup(str: string): string {

  const rules = [{
    desc: 'Remove all HTML tags, except <b>, <i> and self-closing tags like <br>',
    regex: /(<((?!\/?b|\/?i)[^>]+)>)/gi,
    replace: ''
  },
  {
    desc: 'Remove all HTML attributes',
    regex: /<([a-z][a-z0-9]*)[^>]*?(\/?)>/g,
    replace: '<$1$2>'
  },
  {
    desc: 'Remove non-breaking spaces',
    regex: /\u00A0|&nbsp;/g,
    replace: ' ',
  },
  {
    desc: 'Remove soft hyphens',
    regex: /\u00AD/g,
    replace: '',
  },
  {
    desc: 'replace <br>',
    regex: '<br>',
    replace: '\r\n',
  },
  {
    desc: '<RemoveDoubleCarriageReturn>',
    regex: /\r\n<br>/g,
    replace: '\r\n',
  },
  {
    desc: 'RemoveDoubleCarriageReturn',
    regex: '\r\n\r\n',
    replace: '\r\n',
  },
  {
    // TODO: remove empty br tags?
    desc: 'Remove empty b and i tags',
    regex: /<i>\s*<\/i>|<b>\s*<\/b>/g,
    replace: '',
  },
  {
    desc: 'Remove <b>\r\n</b>',
    regex: '<b>\r\n</b>',
    replace: '',
  }
  ]

  let cleanString = str

  rules.forEach(rule => {
    cleanString = cleanString.replaceAll(rule.regex, rule.replace)
  })

  return cleanString.trim()
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
  const slug = slugs.find(s => s.id === l.id_term_linked)?.slug

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
        const sens = fields.find(field => field.id_subject_field === t2.id_subject_field)?.name_subject_field || ''
        return {
          id: t2.id_translation,
          terme: t2.term_translation.replace(/(<([^>]+)>)/gi, '').replace(/\u00A0|&nbsp;/g, ' ').trim(),
          groupe: t2.display_order,
          position: t2.display_order1,
          sens
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
    const slug = slugs.find(s => s.id === v.id_term)?.slug

    const genre = genders.find(gender => gender.id_gtype === v.id_gtype)?.name_gtype || ''

    const definitions = defs.filter(d => d.id_term === v.id_term).map(def => ({
      definition: cleanup(def.definition),
      source: dictionaries.find(dic => dic.id === def.id_dictionary)?.name || def.id_dictionary
    }))

    return {
      id: v.id_term,
      vedette,
      definitions,
      genre,
      slug,
      notes: cleanup(v.notes),
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

console.info('Export Sucessful!')
