import {
  FieldDefinition,
  FieldType,
  FieldValue,
  Member,
  MemberValues,
  fieldIdFromLabel,
  generateId
} from './model'

export interface CsvTable {
  headers: string[]
  rows: string[][]
  delimiter: string
}

/**
 * Decodes a file's bytes. Excel on Windows often saves CSV as Windows-1252 ("ANSI"),
 * so anything that is not valid UTF-8 is read as Windows-1252 instead.
 */
export const decodeCsvBytes = (bytes: ArrayBuffer): string => {
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    text = new TextDecoder('windows-1252').decode(bytes)
  }
  return text.replace(/^﻿/, '')
}

/** Picks the delimiter that occurs most often in the header line (outside of quotes) */
export const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r?\n/, 1)[0].replace(/"[^"]*"/g, '')
  const candidates = [';', ',', '\t', '|']
  let best = ';'
  let bestCount = 0
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1
    if (count > bestCount) {
      best = candidate
      bestCount = count
    }
  }
  return best
}

/** RFC 4180 parser: quoted values may contain delimiters, line breaks and "" escapes */
export const parseCsv = (
  text: string,
  {
    delimiter = detectDelimiter(text),
    emptyHeader = (column: number) => `Column ${column}`
  }: { delimiter?: string; emptyHeader?: (column: number) => string } = {}
): CsvTable => {
  const records: string[][] = []
  let record: string[] = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        value += char
      }
    } else if (char === '"' && value === '') {
      inQuotes = true
    } else if (char === delimiter) {
      record.push(value)
      value = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i++
      }
      record.push(value)
      records.push(record)
      record = []
      value = ''
    } else {
      value += char
    }
  }
  if (value !== '' || record.length) {
    record.push(value)
    records.push(record)
  }

  const nonEmpty = records.filter((r) => r.some((v) => v.trim() !== ''))
  const [headerRow = [], ...rows] = nonEmpty
  const headers = headerRow.map((h, i) => h.trim() || emptyHeader(i + 1))
  return {
    headers,
    rows: rows.map((r) => headers.map((_, i) => (r[i] ?? '').trim())),
    delimiter
  }
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')

/** Common alternative column names (German and English), keyed by the default field ids */
const SYNONYMS: Record<string, string[]> = {
  member_no: [
    'nr',
    'mitgliedernr',
    'mitgliedernummer',
    'mitgliednr',
    'id',
    'nummer',
    'no',
    'number',
    'memberno',
    'membernumber',
    'memberid'
  ],
  salutation: ['anrede', 'salutation', 'title'],
  first_name: ['vorname', 'firstname', 'givenname', 'forename', 'prenom'],
  last_name: ['nachname', 'name', 'familienname', 'lastname', 'surname', 'familyname', 'nom'],
  street: [
    'strasse',
    'str',
    'adresse',
    'strassenr',
    'strassenummer',
    'address',
    'street',
    'streetno',
    'addressline1'
  ],
  postcode: ['plz', 'postleitzahl', 'zip', 'zipcode', 'postcode', 'postalcode'],
  city: ['ort', 'wohnort', 'stadt', 'city', 'town', 'place'],
  country: ['land', 'country'],
  birth_date: [
    'geburtsdatum',
    'geburtstag',
    'gebdatum',
    'geboren',
    'birthday',
    'birthdate',
    'dateofbirth',
    'dob'
  ],
  email: ['email', 'mail', 'emailadresse', 'emailaddress'],
  phone: ['telefon', 'tel', 'telefonprivat', 'festnetz', 'phone', 'telephone', 'landline'],
  mobile: ['mobile', 'mobil', 'natel', 'handy', 'mobiltelefon', 'mobilephone', 'cell', 'cellphone'],
  date_joined: [
    'eintritt',
    'eintrittsdatum',
    'mitgliedseit',
    'beitritt',
    'datejoined',
    'joined',
    'membersince'
  ],
  date_left: ['austritt', 'austrittsdatum', 'dateleft', 'left', 'resigned'],
  status: ['status', 'mitgliedschaft', 'membership', 'membershiptype'],
  notes: [
    'bemerkungen',
    'bemerkung',
    'notizen',
    'notiz',
    'kommentar',
    'notes',
    'note',
    'comment',
    'comments',
    'remarks'
  ]
}

/** Column mapping: an existing field id, NEW_FIELD to create one, or IGNORE */
export const NEW_FIELD = '__new__'
export const IGNORE = '__ignore__'

export const guessMapping = (headers: string[], fields: FieldDefinition[]): string[] => {
  const used = new Set<string>()
  return headers.map((header) => {
    const key = normalize(header)
    const match =
      fields.find((f) => !used.has(f.id) && (normalize(f.label) === key || f.id === key)) ||
      fields.find((f) => !used.has(f.id) && SYNONYMS[f.id]?.includes(key))
    if (match) {
      used.add(match.id)
      return match.id
    }
    return NEW_FIELD
  })
}

/** Converts 7.3.1985, 07.03.85, 1985-03-07 or 07/03/1985 to 1985-03-07 */
export const parseDate = (value: string): string | null => {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/.exec(value)
  let year: number, month: number, day: number
  if (iso) {
    ;[year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  } else if (dmy) {
    ;[day, month, year] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])]
    if (dmy[3].length === 2) {
      // two-digit years: anything later than the current year belongs to the last century
      const currentYear = new Date().getFullYear() % 100
      year += year > currentYear ? 1900 : 2000
    }
  } else {
    return null
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const TRUE_VALUES = ['ja', 'j', 'yes', 'y', 'x', '1', 'true', 'wahr', 'oui']

export const convertValue = (field: FieldDefinition, raw: string): FieldValue | undefined => {
  if (raw === '') {
    return undefined
  }
  if (field.type === 'checkbox') {
    return TRUE_VALUES.includes(raw.toLowerCase()) ? true : undefined
  }
  if (field.type === 'date') {
    // unrecognized dates are kept as text so nothing gets lost
    return parseDate(raw) ?? raw
  }
  return raw
}

const guessFieldType = (values: string[]): FieldType => {
  const filled = values.filter(Boolean)
  if (filled.length && filled.every((v) => parseDate(v) !== null)) {
    return 'date'
  }
  return 'text'
}

export interface ImportResult {
  fields: FieldDefinition[]
  members: Member[]
  /** Dates in date fields that could not be recognized and were kept as text */
  invalidDates: number
}

/**
 * Builds the member list from the table. Unmapped columns become new text/date fields,
 * unknown values of select fields are added to their options.
 */
export const buildImport = (
  table: CsvTable,
  mapping: string[],
  existingFields: FieldDefinition[]
): ImportResult => {
  const fields: FieldDefinition[] = existingFields.map((f) => ({
    ...f,
    ...(f.options && { options: [...f.options] })
  }))
  const columnFields: (FieldDefinition | null)[] = mapping.map((target, column) => {
    if (target === IGNORE) {
      return null
    }
    if (target === NEW_FIELD) {
      const label = table.headers[column]
      const field: FieldDefinition = {
        id: fieldIdFromLabel(
          label,
          fields.map((f) => f.id)
        ),
        label,
        type: guessFieldType(table.rows.map((r) => r[column])),
        showInList: true
      }
      fields.push(field)
      return field
    }
    return fields.find((f) => f.id === target) ?? null
  })

  let invalidDates = 0
  const members: Member[] = []
  for (const row of table.rows) {
    const values: MemberValues = {}
    columnFields.forEach((field, column) => {
      if (!field) {
        return
      }
      const value = convertValue(field, row[column])
      if (value === undefined) {
        return
      }
      if (field.type === 'date' && value === row[column] && parseDate(row[column]) === null) {
        invalidDates++
      }
      if (field.type === 'select' && typeof value === 'string' && !field.options?.includes(value)) {
        field.options = [...(field.options ?? []), value]
      }
      // two columns mapped to the same field (e.g. "Street" and "House number") are joined
      const previous = values[field.id]
      values[field.id] =
        typeof previous === 'string' && typeof value === 'string' ? `${previous} ${value}` : value
    })
    if (Object.keys(values).length) {
      members.push({ id: generateId(), values })
    }
  }
  return { fields, members, invalidDates }
}
