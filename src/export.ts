import { FieldDefinition, Member, formatValue } from './model'
import { Translator, excelDateFormat, isGerman } from './i18n'

export interface ExportOptions {
  title: string
  fields: FieldDefinition[]
  members: Member[]
  /** Base file name without extension */
  fileName: string
  translator: Translator
}

const today = (language: string) =>
  new Date().toLocaleDateString(isGerman(language) ? 'de-CH' : 'en-GB')

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const toDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  // UTC midnight so Excel shows the same calendar day regardless of time zone
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

export const exportExcel = async ({
  title,
  fields,
  members,
  fileName,
  translator
}: ExportOptions) => {
  // loaded on demand to keep the app entry small
  const { default: writeXlsxFile } = await import('write-excel-file/browser')

  const header = fields.map((field) => ({
    value: field.label,
    fontWeight: 'bold' as const,
    backgroundColor: '#E5E7EB'
  }))

  const rows = members.map((member) =>
    fields.map((field) => {
      const value = member.values[field.id]
      if (value === undefined || value === '') {
        return null
      }
      if (field.type === 'date' && typeof value === 'string') {
        const date = toDate(value)
        if (date) {
          return { value: date, type: Date, format: excelDateFormat(translator.language) }
        }
      }
      if (field.type === 'number') {
        const num = Number(String(value).replace(',', '.'))
        if (!Number.isNaN(num)) {
          return { value: num, type: Number }
        }
      }
      if (field.type === 'checkbox') {
        return { value: formatValue(field, value, translator), type: String }
      }
      // '@' keeps Excel from turning postal codes or phone numbers into numbers
      return { value: String(value), type: String, format: '@' }
    })
  )

  const columns = fields.map((field) => {
    const longest = Math.max(
      field.label.length,
      ...members.map((m) => formatValue(field, m.values[field.id], translator).length)
    )
    return { width: Math.min(Math.max(longest + 2, 8), 50) }
  })

  const blob = await writeXlsxFile([header, ...rows] as never, {
    columns,
    sheet: title.slice(0, 31).replace(/[\\/?*[\]:]/g, ' ') || translator.t('Members'),
    stickyRowsCount: 1
  }).toBlob()
  downloadBlob(blob, `${fileName}.xlsx`)
}

export const exportPdf = async ({
  title,
  fields,
  members,
  fileName,
  translator
}: ExportOptions) => {
  const { t, tn } = translator
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new jsPDF({
    orientation: fields.length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  doc.setFontSize(16)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(
    [
      t('As of %{date}', { date: today(translator.language) }),
      tn('%{count} member', '%{count} members', members.length, { count: members.length })
    ].join(' · '),
    14,
    22
  )

  autoTable(doc, {
    startY: 27,
    head: [fields.map((f) => f.label)],
    body: members.map((member) =>
      fields.map((f) => formatValue(f, member.values[f.id], translator))
    ),
    styles: { fontSize: fields.length > 10 ? 7 : 8, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pageSize = doc.internal.pageSize
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(
        t('Page %{page}', { page: doc.getCurrentPageInfo().pageNumber }),
        pageSize.getWidth() - 14,
        pageSize.getHeight() - 8,
        { align: 'right' }
      )
    }
  })

  downloadBlob(doc.output('blob'), `${fileName}.pdf`)
}

const csvEscape = (value: string) =>
  /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

export const exportCsv = ({ fields, members, fileName, translator }: ExportOptions) => {
  // semicolon + BOM so Excel with German/Swiss regional settings opens it correctly
  const lines = [
    fields.map((f) => csvEscape(f.label)).join(';'),
    ...members.map((member) =>
      fields.map((f) => csvEscape(formatValue(f, member.values[f.id], translator))).join(';')
    )
  ]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${fileName}.csv`)
}
