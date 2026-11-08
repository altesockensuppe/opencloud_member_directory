import { createDirectory } from '../../src/model'
import {
  IGNORE,
  NEW_FIELD,
  buildImport,
  decodeCsvBytes,
  detectDelimiter,
  guessMapping,
  parseCsv,
  parseDate
} from '../../src/import'
import { createTranslator } from '../../src/i18n'

const en = createTranslator('en')

describe('import', () => {
  it('detects the delimiter', () => {
    expect(detectDelimiter('Vorname;Nachname;Ort\nA;B;C')).toBe(';')
    expect(detectDelimiter('Vorname,Nachname\nA,B')).toBe(',')
    expect(detectDelimiter('Vorname\tNachname\nA\tB')).toBe('\t')
  })

  it('parses quoted values with delimiters, quotes and line breaks', () => {
    const table = parseCsv(
      'Name;Bemerkung\r\n"Muster; Hans";"sagt ""Hallo""\nzweite Zeile"\r\n;\r\n'
    )
    expect(table.headers).toEqual(['Name', 'Bemerkung'])
    expect(table.rows).toEqual([['Muster; Hans', 'sagt "Hallo"\nzweite Zeile']])
  })

  it('pads short rows and names empty headers', () => {
    const table = parseCsv('A;;C\n1')
    expect(table.headers).toEqual(['A', 'Column 2', 'C'])
    expect(table.rows).toEqual([['1', '', '']])
  })

  it('decodes UTF-8 with BOM and falls back to Windows-1252', () => {
    const utf8 = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Zürich')])
    expect(decodeCsvBytes(utf8.buffer)).toBe('Zürich')
    const ansi = new Uint8Array([0x5a, 0xfc, 0x72, 0x69, 0x63, 0x68]) // "Zürich" in Windows-1252
    expect(decodeCsvBytes(ansi.buffer)).toBe('Zürich')
  })

  it('parses Swiss/German dates', () => {
    expect(parseDate('7.3.1985')).toBe('1985-03-07')
    expect(parseDate('07.03.85')).toBe('1985-03-07')
    expect(parseDate('1985-03-07')).toBe('1985-03-07')
    expect(parseDate('31.02.2000')).toBeNull()
    expect(parseDate('1985')).toBeNull()
  })

  it('maps English column names', () => {
    const { fields } = createDirectory(en)
    expect(
      guessMapping(['First Name', 'Surname', 'ZIP Code', 'Date of Birth', 'E-Mail'], fields)
    ).toEqual(['vorname', 'nachname', 'plz', 'geburtsdatum', 'email'])
  })

  it('maps known column names, including synonyms', () => {
    const { fields } = createDirectory(en)
    expect(
      guessMapping(['Vorname', 'Name', 'Natel', 'Geburtstag', 'Lieblingsfarbe'], fields)
    ).toEqual(['vorname', 'nachname', 'mobile', 'geburtsdatum', NEW_FIELD])
  })

  it('builds members, new fields and select options', () => {
    const { fields } = createDirectory(en)
    const table = parseCsv(
      'Vorname;Status;Geburtsdatum;Eintritt;Strasse;Nr;Intern\n' +
        'Anna;Vorstand;7.3.1985;2010;Hauptstr.;5;x\n' +
        ';;;;;;\n'
    )
    const mapping = ['vorname', 'status', 'geburtsdatum', NEW_FIELD, 'strasse', 'strasse', IGNORE]
    const result = buildImport(table, mapping, fields)

    expect(result.members).toHaveLength(1)
    expect(result.members[0].values).toEqual({
      vorname: 'Anna',
      status: 'Vorstand',
      geburtsdatum: '1985-03-07',
      eintritt_2: '2010',
      strasse: 'Hauptstr. 5'
    })
    expect(result.fields.find((f) => f.id === 'status')?.options).toContain('Vorstand')
    expect(result.fields.find((f) => f.id === 'eintritt_2')).toMatchObject({
      label: 'Eintritt',
      type: 'text'
    })
    // the original field definitions are not mutated
    expect(fields.find((f) => f.id === 'status')?.options).not.toContain('Vorstand')
    expect(result.invalidDates).toBe(0)
  })

  it('keeps unrecognized dates as text and counts them', () => {
    const { fields } = createDirectory(en)
    const result = buildImport(parseCsv('Geburtsdatum\n1985\n'), ['geburtsdatum'], fields)
    expect(result.members[0].values.geburtsdatum).toBe('1985')
    expect(result.invalidDates).toBe(1)
  })
})
