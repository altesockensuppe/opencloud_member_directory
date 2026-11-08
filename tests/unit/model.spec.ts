import {
  InvalidDirectoryError,
  compareMembers,
  createDirectory,
  fieldIdFromLabel,
  formatValue,
  matchesSearch,
  nextMemberNumber,
  parseDirectory,
  serializeDirectory
} from '../../src/model'
import { createTranslator } from '../../src/i18n'
import translations from '../../src/translations'

const en = createTranslator('en')
const de = createTranslator('de', translations.de)

describe('model', () => {
  it('creates a default directory from an empty file', () => {
    const dir = parseDirectory('', de, 'Sports club')
    expect(dir.title).toBe('Sports club')
    expect(dir.members).toEqual([])
    expect(dir.fields.map((f) => f.id)).toContain('birth_date')
  })

  it('creates the default fields in the language of the user', () => {
    const german = createDirectory(de)
    const english = createDirectory(en)
    expect(german.title).toBe('Mitgliederverzeichnis')
    expect(english.title).toBe('Member directory')
    expect(german.fields.find((f) => f.id === 'last_name')?.label).toBe('Nachname')
    expect(english.fields.find((f) => f.id === 'last_name')?.label).toBe('Last name')
    expect(german.fields.find((f) => f.id === 'status')?.options?.[0]).toBe('Aktiv')
    expect(english.fields.find((f) => f.id === 'status')?.options?.[0]).toBe('Active')
    // the ids stay the same, so files work in both languages
    expect(german.fields.map((f) => f.id)).toEqual(english.fields.map((f) => f.id))
  })

  it('round-trips through serialize/parse', () => {
    const dir = createDirectory(de, 'Test')
    dir.members.push({ id: 'a', values: { first_name: 'Anna', active: true } })
    expect(parseDirectory(serializeDirectory(dir), en)).toEqual(dir)
  })

  it('rejects invalid content', () => {
    expect(() => parseDirectory('{"foo": 1}', en)).toThrow(InvalidDirectoryError)
    expect(() => parseDirectory('not json', en)).toThrow(InvalidDirectoryError)
  })

  it('formats dates and booleans in the language of the user', () => {
    const date = { id: 'd', label: 'D', type: 'date' as const, showInList: true }
    const checkbox = { id: 'c', label: 'C', type: 'checkbox' as const, showInList: true }
    expect(formatValue(date, '1980-03-07', de)).toBe('07.03.1980')
    expect(formatValue(date, '1980-03-07', en)).toBe('07/03/1980')
    // unrecognized dates (e.g. from an import) are shown as they are
    expect(formatValue(date, '1980', de)).toBe('1980')
    expect(formatValue(checkbox, true, de)).toBe('Ja')
    expect(formatValue(checkbox, true, en)).toBe('Yes')
  })

  it('sorts with empty values last and numbers naturally', () => {
    const field = { id: 'member_no', label: 'Nr', type: 'text' as const, showInList: true }
    const members = [
      { id: '1', values: { member_no: '10' } },
      { id: '2', values: {} },
      { id: '3', values: { member_no: '2' } }
    ]
    const sorted = [...members].sort((a, b) => compareMembers(a, b, field, 'asc'))
    expect(sorted.map((m) => m.id)).toEqual(['3', '1', '2'])
  })

  it('searches across all fields', () => {
    const dir = createDirectory(de)
    const member = {
      id: '1',
      values: { first_name: 'Anna', city: 'Zürich', birth_date: '1985-03-07' }
    }
    expect(matchesSearch(member, dir.fields, 'anna zür', de)).toBe(true)
    expect(matchesSearch(member, dir.fields, 'bern', de)).toBe(false)
    // dates are found the way they are displayed
    expect(matchesSearch(member, dir.fields, '07.03.1985', de)).toBe(true)
    expect(matchesSearch(member, dir.fields, '07/03/1985', en)).toBe(true)
  })

  it('proposes the next member number', () => {
    const dir = createDirectory(en)
    expect(nextMemberNumber(dir)).toBe('1')
    dir.members.push(
      { id: 'a', values: { member_no: '41' } },
      { id: 'b', values: { member_no: 'x' } }
    )
    expect(nextMemberNumber(dir)).toBe('42')
  })

  it('derives unique field ids', () => {
    expect(fieldIdFromLabel('Annual fee paid?', [])).toBe('annual_fee_paid')
    expect(fieldIdFromLabel('Grösse', ['groesse'])).toBe('groesse_2')
  })
})
