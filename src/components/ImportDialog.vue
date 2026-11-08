<template>
  <base-dialog :title="t('Import members from CSV')" wide @close="emit('close')">
    <div class="ext:flex ext:flex-col ext:gap-4">
      <div>
        <label for="import-file" class="ext:mb-1 ext:block ext:font-medium">{{
          t('CSV file')
        }}</label>
        <input id="import-file" type="file" accept=".csv,.txt,text/csv" @change="onFile" />
        <p class="ext:mb-0 ext:mt-1 ext:text-sm ext:text-role-on-surface-variant">
          {{
            t(
              'The first line must contain the column names. The delimiter (semicolon, comma, tab) and character encoding are detected automatically.'
            )
          }}
        </p>
      </div>

      <p v-if="error" class="ext:m-0 ext:text-sm ext:text-role-error">{{ error }}</p>

      <template v-if="table">
        <p class="ext:m-0">
          {{
            tn(
              '%{count} row found in %{file} (delimiter: %{delimiter}).',
              '%{count} rows found in %{file} (delimiter: %{delimiter}).',
              table.rows.length,
              { count: table.rows.length, file: fileName, delimiter: delimiterLabel }
            )
          }}
        </p>

        <div class="ext:overflow-x-auto">
          <table class="ext:w-full ext:border-collapse ext:text-sm">
            <thead>
              <tr class="ext:text-left">
                <th class="ext:border-b ext:border-role-outline-variant ext:p-2">
                  {{ t('Column in CSV') }}
                </th>
                <th class="ext:border-b ext:border-role-outline-variant ext:p-2">
                  {{ t('Import as') }}
                </th>
                <th class="ext:border-b ext:border-role-outline-variant ext:p-2">
                  {{ t('Example') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(header, column) in table.headers"
                :key="column"
                class="ext:border-b ext:border-role-outline-variant"
              >
                <td class="ext:p-2 ext:font-medium">{{ header }}</td>
                <td class="ext:p-2">
                  <select
                    v-model="mapping[column]"
                    :aria-label="t('Mapping for column %{column}', { column: header })"
                    class="ext:w-full ext:rounded ext:border ext:border-role-outline ext:bg-role-surface ext:px-2 ext:py-1 ext:text-role-on-surface"
                  >
                    <option :value="NEW_FIELD">
                      + {{ t('New field %{label}', { label: `“${header}”` }) }}
                    </option>
                    <option :value="IGNORE">– {{ t('do not import') }} –</option>
                    <option v-for="field in fields" :key="field.id" :value="field.id">
                      {{ field.label }}
                    </option>
                  </select>
                </td>
                <td
                  class="ext:max-w-60 ext:truncate ext:p-2 ext:text-role-on-surface-variant"
                  :title="example(column)"
                >
                  {{ example(column) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <fieldset class="ext:m-0 ext:border-0 ext:p-0">
          <legend class="ext:mb-1 ext:font-medium">
            {{ t('Existing members (%{count})', { count: memberCount }) }}
          </legend>
          <label class="ext:flex ext:items-center ext:gap-2">
            <input v-model="mode" type="radio" value="append" />
            {{ t('Add imported members') }}
          </label>
          <label class="ext:flex ext:items-center ext:gap-2">
            <input v-model="mode" type="radio" value="replace" :disabled="!memberCount" />
            {{ t('Replace all existing members') }}
          </label>
        </fieldset>

        <div
          v-if="result"
          class="ext:rounded ext:bg-role-surface-container ext:p-3 ext:text-sm"
          aria-live="polite"
        >
          <strong>
            {{
              tn(
                '%{count} member will be imported.',
                '%{count} members will be imported.',
                result.members.length,
                { count: result.members.length }
              )
            }}
          </strong>
          <template v-if="newFieldLabels.length">
            {{ t('New fields: %{fields}.', { fields: newFieldLabels.join(', ') }) }}
          </template>
          <template v-if="duplicateTargets.length">
            {{
              t('Several columns are joined into: %{fields}.', {
                fields: duplicateTargets.join(', ')
              })
            }}
          </template>
          <p class="ext:mb-0 ext:mt-1">
            {{
              t('Dates are read with the day before the month, e.g. %{examples}.', {
                examples: dateExamples
              })
            }}
          </p>
          <p v-if="result.invalidDates" class="ext:mb-0 ext:mt-1 ext:text-role-error">
            {{
              tn(
                '%{count} date was not recognized and is imported as text.',
                '%{count} dates were not recognized and are imported as text.',
                result.invalidDates,
                { count: result.invalidDates }
              )
            }}
          </p>
        </div>
      </template>
    </div>

    <template #footer>
      <oc-button appearance="outline" @click="emit('close')">{{ t('Cancel') }}</oc-button>
      <oc-button appearance="filled" :disabled="!result?.members.length" @click="submit">
        {{ t('Import') }}
      </oc-button>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { FieldDefinition, Member } from '../model'
import {
  CsvTable,
  IGNORE,
  NEW_FIELD,
  buildImport,
  decodeCsvBytes,
  guessMapping,
  parseCsv
} from '../import'
import { isGerman, useTranslator } from '../i18n'

const { fields, memberCount } = defineProps<{
  fields: FieldDefinition[]
  memberCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', value: { fields: FieldDefinition[]; members: Member[]; replace: boolean }): void
}>()

const { t, tn, language } = useTranslator()

const dateExamples = isGerman(language)
  ? '07.03.1985, 7.3.85, 1985-03-07'
  : '07/03/1985, 7.3.85, 1985-03-07'

const table = ref<CsvTable | null>(null)
const fileName = ref('')
const mapping = ref<string[]>([])
const mode = ref<'append' | 'replace'>('append')
const error = ref('')

const delimiterLabel = computed(() => {
  switch (table.value?.delimiter) {
    case ';':
      return t('semicolon')
    case ',':
      return t('comma')
    case '\t':
      return t('tab')
    default:
      return `“${table.value?.delimiter}”`
  }
})

const onFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  error.value = ''
  table.value = null
  if (!file) {
    return
  }
  try {
    const parsed = parseCsv(decodeCsvBytes(await file.arrayBuffer()), {
      emptyHeader: (column) => t('Column %{column}', { column })
    })
    if (!parsed.headers.length || !parsed.rows.length) {
      error.value = t('The file contains no data below the header line.')
      return
    }
    fileName.value = file.name
    mapping.value = guessMapping(parsed.headers, fields)
    table.value = parsed
  } catch (e) {
    console.error(e)
    error.value = t('The file could not be read.')
  }
}

const example = (column: number) =>
  table.value?.rows.find((row) => row[column] !== '')?.[column] ?? ''

const result = computed(() =>
  table.value ? buildImport(table.value, mapping.value, fields) : null
)

const newFieldLabels = computed(() => {
  const existing = new Set(fields.map((f) => f.id))
  return result.value?.fields.filter((f) => !existing.has(f.id)).map((f) => f.label) ?? []
})

const duplicateTargets = computed(() => {
  const targets = mapping.value.filter((m) => m !== IGNORE && m !== NEW_FIELD)
  const duplicates = new Set(targets.filter((t, i) => targets.indexOf(t) !== i))
  return fields.filter((f) => duplicates.has(f.id)).map((f) => f.label)
})

const submit = () => {
  if (!result.value) {
    return
  }
  if (
    mode.value === 'replace' &&
    !window.confirm(
      tn(
        'Really replace the %{count} existing member?',
        'Really replace all %{count} existing members?',
        memberCount,
        { count: memberCount }
      )
    )
  ) {
    return
  }
  emit('submit', {
    fields: result.value.fields,
    members: result.value.members,
    replace: mode.value === 'replace'
  })
}
</script>
