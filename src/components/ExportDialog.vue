<template>
  <base-dialog :title="t('Export list')" @close="emit('close')">
    <fieldset class="ext:m-0 ext:border-0 ext:p-0">
      <legend class="ext:mb-2 ext:font-medium">{{ t('Members') }}</legend>
      <label class="ext:flex ext:items-center ext:gap-2">
        <input v-model="scope" type="radio" value="all" />
        {{ t('All members (%{count})', { count: totalCount }) }}
      </label>
      <label class="ext:flex ext:items-center ext:gap-2">
        <input v-model="scope" type="radio" value="filtered" :disabled="!isFiltered" />
        {{ t('Only current search (%{count})', { count: filteredCount }) }}
      </label>
    </fieldset>

    <fieldset class="ext:m-0 ext:mt-4 ext:border-0 ext:p-0">
      <legend class="ext:mb-2 ext:font-medium">{{ t('Columns') }}</legend>
      <div class="ext:mb-2 ext:flex ext:gap-3 ext:text-sm">
        <oc-button appearance="raw" size="small" @click="selectAll">{{ t('All') }}</oc-button>
        <oc-button appearance="raw" size="small" @click="selectListFields">
          {{ t('As in the list') }}
        </oc-button>
      </div>
      <div class="ext:grid ext:grid-cols-2 ext:gap-1 ext:md:grid-cols-3">
        <label v-for="field in fields" :key="field.id" class="ext:flex ext:items-center ext:gap-2">
          <input v-model="selected" type="checkbox" :value="field.id" />
          {{ field.label }}
        </label>
      </div>
    </fieldset>

    <p v-if="error" class="ext:mb-0 ext:mt-3 ext:text-sm ext:text-role-error">{{ error }}</p>

    <template #footer>
      <oc-button appearance="outline" @click="emit('close')">{{ t('Cancel') }}</oc-button>
      <oc-button
        appearance="outline"
        :disabled="!selected.length || !!busy"
        :show-spinner="busy === 'csv'"
        @click="run('csv')"
      >
        <oc-icon name="file-text" />
        CSV
      </oc-button>
      <oc-button
        appearance="filled"
        :disabled="!selected.length || !!busy"
        :show-spinner="busy === 'pdf'"
        @click="run('pdf')"
      >
        <oc-icon name="file-pdf-2" />
        PDF
      </oc-button>
      <oc-button
        appearance="filled"
        :disabled="!selected.length || !!busy"
        :show-spinner="busy === 'xlsx'"
        @click="run('xlsx')"
      >
        <oc-icon name="file-excel-2" />
        Excel
      </oc-button>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { FieldDefinition, Member } from '../model'
import { exportCsv, exportExcel, exportPdf } from '../export'
import { useTranslator } from '../i18n'

const { title, fields, allMembers, filteredMembers, fileName } = defineProps<{
  title: string
  fields: FieldDefinition[]
  allMembers: Member[]
  filteredMembers: Member[]
  fileName: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const translator = useTranslator()
const { t } = translator

const totalCount = computed(() => allMembers.length)
const filteredCount = computed(() => filteredMembers.length)
const isFiltered = computed(() => filteredMembers.length !== allMembers.length)

const scope = ref<'all' | 'filtered'>(isFiltered.value ? 'filtered' : 'all')
const selected = ref<string[]>(fields.filter((f) => f.showInList).map((f) => f.id))
const busy = ref<'' | 'xlsx' | 'pdf' | 'csv'>('')
const error = ref('')

const selectAll = () => {
  selected.value = fields.map((f) => f.id)
}
const selectListFields = () => {
  selected.value = fields.filter((f) => f.showInList).map((f) => f.id)
}

const run = async (format: 'xlsx' | 'pdf' | 'csv') => {
  error.value = ''
  busy.value = format
  try {
    const options = {
      title,
      fileName,
      translator,
      // keep the configured field order, not the click order
      fields: fields.filter((f) => selected.value.includes(f.id)),
      // the "all" scope still follows the current sort order
      members: scope.value === 'filtered' ? filteredMembers : allMembers
    }
    if (format === 'xlsx') {
      await exportExcel(options)
    } else if (format === 'pdf') {
      await exportPdf(options)
    } else {
      exportCsv(options)
    }
    emit('close')
  } catch (e) {
    console.error('Export failed', e)
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
    error.value = t('The export failed (%{detail}).', { detail })
  } finally {
    busy.value = ''
  }
}
</script>
