import { useGettext } from 'vue3-gettext'

export type Params = Record<string, string | number>

/**
 * Thin wrapper around vue3-gettext, so that model, import and export code can be
 * translated without depending on Vue (and be unit tested with a plain translator).
 */
export interface Translator {
  t: (msgid: string, params?: Params) => string
  tn: (singular: string, plural: string, n: number, params?: Params) => string
  /** Language code of the user's profile setting, e.g. "de" or "en" */
  readonly language: string
}

const stringify = (params?: Params) =>
  params && Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))

/**
 * Translator bound to OpenCloud's gettext instance, which follows the language
 * of the user's profile. Must be called from a component's setup.
 */
export const useTranslator = (): Translator => {
  const gettext = useGettext()
  // Vue escapes text interpolation itself, so gettext must not escape parameters a second time
  return {
    t: (msgid, params) => gettext.$gettext(msgid, stringify(params), true),
    tn: (singular, plural, n, params) =>
      gettext.$ngettext(singular, plural, n, stringify(params), true),
    get language() {
      return gettext.current
    }
  }
}

const interpolate = (text: string, params?: Params) =>
  params ? text.replace(/%\{\s*(\w+)\s*\}/g, (match, key) => String(params[key] ?? match)) : text

/** Translator without Vue, used in tests */
export const createTranslator = (
  language = 'en',
  translations: Record<string, string | string[]> = {}
): Translator => ({
  t: (msgid, params) => {
    const translation = translations[msgid]
    return interpolate(typeof translation === 'string' ? translation : msgid, params)
  },
  tn: (singular, plural, n, params) => {
    const translation = translations[singular]
    const forms = Array.isArray(translation) ? translation : [singular, plural]
    return interpolate(n === 1 ? forms[0] : forms[1], params)
  },
  language
})

export const isGerman = (language: string) => language.toLowerCase().startsWith('de')

/** Formats an ISO date (yyyy-mm-dd) as 07.03.1985 (German) or 07/03/1985 (other languages) */
export const formatIsoDate = (iso: string, language: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) {
    return null
  }
  const separator = isGerman(language) ? '.' : '/'
  return [match[3], match[2], match[1]].join(separator)
}

/** Date format for Excel cells, matching {@link formatIsoDate} */
export const excelDateFormat = (language: string) =>
  isGerman(language) ? 'dd.mm.yyyy' : 'dd/mm/yyyy'
