import { Translator, formatIsoDate } from './i18n'

export const FILE_EXTENSION = 'mitglieder'
export const SCHEMA_VERSION = 1

export type FieldType =
  'text' | 'textarea' | 'number' | 'date' | 'email' | 'tel' | 'select' | 'checkbox'

export const FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'email',
  'tel',
  'select',
  'checkbox'
]

export const fieldTypeLabel = (type: FieldType, { t }: Translator): string => {
  switch (type) {
    case 'text':
      return t('Text')
    case 'textarea':
      return t('Multi-line text')
    case 'number':
      return t('Number')
    case 'date':
      return t('Date')
    case 'email':
      return t('Email')
    case 'tel':
      return t('Phone')
    case 'select':
      return t('Selection list')
    case 'checkbox':
      return t('Yes/No')
  }
}

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  /** Only used by `select` fields */
  options?: string[]
  /** Whether the field is shown as a column in the member list */
  showInList: boolean
}

export type FieldValue = string | boolean
export type MemberValues = Record<string, FieldValue>

export interface Member {
  id: string
  values: MemberValues
}

export interface MemberDirectory {
  version: number
  title: string
  fields: FieldDefinition[]
  members: Member[]
}

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * The default fields are created in the language of the person creating the directory.
 * Labels and options are data from then on, so they are not translated again later.
 */
export const defaultFields = ({ t }: Translator): FieldDefinition[] => [
  { id: 'nummer', label: t('Member no.'), type: 'text', showInList: true },
  {
    id: 'anrede',
    label: t('Salutation'),
    type: 'select',
    options: [t('Ms'), t('Mr'), t('Diverse')],
    showInList: false
  },
  { id: 'vorname', label: t('First name'), type: 'text', showInList: true },
  { id: 'nachname', label: t('Last name'), type: 'text', showInList: true },
  { id: 'strasse', label: t('Street / No.'), type: 'text', showInList: true },
  { id: 'plz', label: t('Postcode'), type: 'text', showInList: true },
  { id: 'ort', label: t('City'), type: 'text', showInList: true },
  { id: 'land', label: t('Country'), type: 'text', showInList: false },
  { id: 'geburtsdatum', label: t('Date of birth'), type: 'date', showInList: true },
  { id: 'email', label: t('Email'), type: 'email', showInList: true },
  { id: 'telefon', label: t('Phone'), type: 'tel', showInList: false },
  { id: 'mobile', label: t('Mobile'), type: 'tel', showInList: true },
  { id: 'eintritt', label: t('Date joined'), type: 'date', showInList: false },
  { id: 'austritt', label: t('Date left'), type: 'date', showInList: false },
  {
    id: 'status',
    label: t('Status'),
    type: 'select',
    options: [t('Active'), t('Passive'), t('Honorary member'), t('Resigned')],
    showInList: true
  },
  { id: 'bemerkungen', label: t('Notes'), type: 'textarea', showInList: false }
]

export const createDirectory = (translator: Translator, title?: string): MemberDirectory => ({
  version: SCHEMA_VERSION,
  title: title || translator.t('Member directory'),
  fields: defaultFields(translator),
  members: []
})

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeField = (raw: unknown): FieldDefinition | null => {
  if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id) {
    return null
  }
  const type = FIELD_TYPES.includes(raw.type as FieldType) ? (raw.type as FieldType) : 'text'
  return {
    id: raw.id,
    label: typeof raw.label === 'string' ? raw.label : raw.id,
    type,
    ...(type === 'select' && {
      options: Array.isArray(raw.options) ? raw.options.map(String) : []
    }),
    showInList: raw.showInList !== false
  }
}

const normalizeMember = (raw: unknown): Member | null => {
  if (!isObject(raw)) {
    return null
  }
  const values: MemberValues = {}
  if (isObject(raw.values)) {
    for (const [key, value] of Object.entries(raw.values)) {
      if (typeof value === 'boolean') {
        values[key] = value
      } else if (value !== null && value !== undefined) {
        values[key] = String(value)
      }
    }
  }
  return { id: typeof raw.id === 'string' && raw.id ? raw.id : generateId(), values }
}

/**
 * Parses the file content. An empty file (freshly created via the "New" menu)
 * results in a new directory with the default fields.
 * Throws if the content is not a valid member directory.
 */
export class InvalidDirectoryError extends Error {}

export const parseDirectory = (
  content: string,
  translator: Translator,
  fallbackTitle?: string
): MemberDirectory => {
  if (!content || !content.trim()) {
    return createDirectory(translator, fallbackTitle)
  }
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch (e) {
    throw new InvalidDirectoryError(String(e))
  }
  if (!isObject(raw) || !Array.isArray(raw.fields) || !Array.isArray(raw.members)) {
    throw new InvalidDirectoryError('missing fields or members')
  }
  return {
    version: SCHEMA_VERSION,
    title:
      typeof raw.title === 'string' ? raw.title : fallbackTitle || translator.t('Member directory'),
    fields: raw.fields.map(normalizeField).filter((f): f is FieldDefinition => f !== null),
    members: raw.members.map(normalizeMember).filter((m): m is Member => m !== null)
  }
}

export const serializeDirectory = (directory: MemberDirectory): string =>
  JSON.stringify(directory, null, 2) + '\n'

/** Formats a value for display and export: dates and booleans follow the user's language */
export const formatValue = (
  field: FieldDefinition,
  value: FieldValue | undefined,
  translator: Translator
): string => {
  if (value === undefined || value === '') {
    return ''
  }
  if (field.type === 'checkbox') {
    return value === true ? translator.t('Yes') : translator.t('No')
  }
  if (field.type === 'date' && typeof value === 'string') {
    return formatIsoDate(value, translator.language) ?? value
  }
  return String(value)
}

/** Value used for sorting: dates and numbers sort naturally, everything else case-insensitive */
export const sortKey = (field: FieldDefinition, value: FieldValue | undefined): string | number => {
  if (value === undefined || value === '') {
    return ''
  }
  if (field.type === 'checkbox') {
    return value === true ? 1 : 0
  }
  if (field.type === 'number') {
    const num = Number(String(value).replace(',', '.'))
    return Number.isNaN(num) ? String(value) : num
  }
  return String(value).toLocaleLowerCase('de')
}

export const compareMembers = (
  a: Member,
  b: Member,
  field: FieldDefinition,
  direction: 'asc' | 'desc'
): number => {
  const ka = sortKey(field, a.values[field.id])
  const kb = sortKey(field, b.values[field.id])
  // empty values always go last
  if (ka === '' && kb !== '') return 1
  if (kb === '' && ka !== '') return -1
  let result: number
  if (typeof ka === 'number' && typeof kb === 'number') {
    result = ka - kb
  } else {
    result = String(ka).localeCompare(String(kb), 'de', { numeric: true })
  }
  return direction === 'asc' ? result : -result
}

export const matchesSearch = (
  member: Member,
  fields: FieldDefinition[],
  search: string,
  translator: Translator
): boolean => {
  const terms = search.toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
  if (!terms.length) {
    return true
  }
  const haystack = fields
    .map((field) => formatValue(field, member.values[field.id], translator))
    .join(' ')
    .toLocaleLowerCase('de')
  return terms.every((term) => haystack.includes(term))
}

/** Proposes the next member number: highest numeric value + 1 */
export const nextMemberNumber = (directory: MemberDirectory): string | undefined => {
  if (!directory.fields.some((f) => f.id === 'nummer')) {
    return undefined
  }
  const numbers = directory.members
    .map((m) => parseInt(String(m.values.nummer ?? ''), 10))
    .filter((n) => !Number.isNaN(n))
  return String(numbers.length ? Math.max(...numbers) + 1 : 1)
}

/** Derives a stable, unique field id from a label */
export const fieldIdFromLabel = (label: string, existing: string[]): string => {
  const base =
    label
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'field'
  let id = base
  let i = 2
  while (existing.includes(id)) {
    id = `${base}_${i++}`
  }
  return id
}
