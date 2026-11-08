import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import translations from '../../src/translations'

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      return sourceFiles(path)
    }
    return /\.(ts|vue)$/.test(name) && name !== 'translations.ts' ? [path] : []
  })

/** All texts passed to t(), tn() and $gettext() in the source code */
const collectMsgids = () => {
  const singular = new Set<string>()
  const plural = new Set<string>()
  for (const file of sourceFiles(join(__dirname, '../../src'))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/\btn\(\s*'([^']*)',\s*'[^']*'/g)) {
      plural.add(match[1])
    }
    for (const match of source.matchAll(/\b(?:t|\$gettext)\(\s*'([^']*)'/g)) {
      singular.add(match[1])
    }
  }
  return { singular, plural }
}

const placeholders = (text: string) =>
  [...text.matchAll(/%\{\s*(\w+)\s*\}/g)].map((m) => m[1]).sort()

describe('translations', () => {
  const { singular, plural } = collectMsgids()
  const de = translations.de

  it('finds the texts in the source code', () => {
    expect(singular.size).toBeGreaterThan(50)
    expect(plural.size).toBeGreaterThan(3)
  })

  it.each([...singular])('has a German translation for "%s"', (msgid) => {
    expect(typeof de[msgid]).toBe('string')
    expect(placeholders(de[msgid] as string)).toEqual(placeholders(msgid))
  })

  it.each([...plural])('has German singular and plural forms for "%s"', (msgid) => {
    const forms = de[msgid]
    expect(Array.isArray(forms) && forms.length === 2).toBe(true)
    for (const form of forms as string[]) {
      expect(placeholders(form)).toEqual(placeholders(msgid))
    }
  })

  it('has no unused translations', () => {
    const unused = Object.keys(de).filter((msgid) => !singular.has(msgid) && !plural.has(msgid))
    expect(unused).toEqual([])
  })
})
