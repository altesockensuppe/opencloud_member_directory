<template>
  <base-dialog :title="t('Edit fields')" wide @close="emit('close')">
    <p class="ext:mt-0 ext:text-sm ext:text-role-on-surface-variant">
      {{
        t(
          'Define which details are recorded for each member. %{inList} controls which fields are shown as columns in the overview. All fields are visible in the detail dialog.',
          { inList: `“${t('In list')}”` }
        )
      }}
    </p>

    <ul class="ext:m-0 ext:flex ext:list-none ext:flex-col ext:gap-2 ext:p-0">
      <li
        v-for="(field, index) in draft"
        :key="field.id"
        class="ext:flex ext:flex-wrap ext:items-end ext:gap-2 ext:rounded ext:border ext:border-role-outline-variant ext:p-2"
      >
        <div class="ext:flex ext:flex-col">
          <oc-button
            appearance="raw"
            size="small"
            :disabled="index === 0"
            :aria-label="t('Move up')"
            @click="move(index, -1)"
          >
            <oc-icon name="arrow-up-s" size="small" />
          </oc-button>
          <oc-button
            appearance="raw"
            size="small"
            :disabled="index === draft.length - 1"
            :aria-label="t('Move down')"
            @click="move(index, 1)"
          >
            <oc-icon name="arrow-down-s" size="small" />
          </oc-button>
        </div>

        <label class="ext:flex ext:min-w-40 ext:flex-1 ext:flex-col ext:gap-1 ext:text-sm">
          {{ t('Label') }}
          <input v-model="field.label" :class="inputClass" />
        </label>

        <label class="ext:flex ext:flex-col ext:gap-1 ext:text-sm">
          {{ t('Type') }}
          <select v-model="field.type" :class="inputClass" @change="onTypeChange(field)">
            <option v-for="type in FIELD_TYPES" :key="type" :value="type">
              {{ fieldTypeLabel(type, translator) }}
            </option>
          </select>
        </label>

        <label
          v-if="field.type === 'select'"
          class="ext:flex ext:min-w-48 ext:flex-1 ext:flex-col ext:gap-1 ext:text-sm"
        >
          {{ t('Options (separated by commas)') }}
          <input
            :value="(field.options || []).join(', ')"
            :class="inputClass"
            @change="setOptions(field, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="ext:flex ext:items-center ext:gap-1 ext:pb-2 ext:text-sm">
          <input v-model="field.showInList" type="checkbox" class="ext:size-4" />
          {{ t('In list') }}
        </label>

        <oc-button
          appearance="raw"
          color-role="secondary"
          class="ext:pb-2"
          :aria-label="t('Delete field %{label}', { label: field.label })"
          @click="remove(index)"
        >
          <oc-icon name="delete-bin" />
        </oc-button>
      </li>
    </ul>

    <oc-button appearance="outline" class="ext:mt-3" @click="add">
      <oc-icon name="add" />
      {{ t('Add field') }}
    </oc-button>

    <p
      v-if="removedWithData.length"
      class="ext:mb-0 ext:mt-3 ext:rounded ext:bg-role-error-container ext:p-2 ext:text-sm ext:text-role-on-error-container"
    >
      {{
        t(
          'Warning: applying will delete the values of the following fields for all members: %{fields}',
          { fields: removedWithData.join(', ') }
        )
      }}
    </p>
    <p v-if="hasEmptyLabel" class="ext:mb-0 ext:mt-3 ext:text-sm ext:text-role-error">
      {{ t('Every field needs a label.') }}
    </p>

    <template #footer>
      <oc-button appearance="outline" @click="emit('close')">{{ t('Cancel') }}</oc-button>
      <oc-button appearance="filled" :disabled="hasEmptyLabel" @click="submit">
        {{ t('Apply') }}
      </oc-button>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { FIELD_TYPES, FieldDefinition, Member, fieldIdFromLabel, fieldTypeLabel } from '../model'
import { useTranslator } from '../i18n'

const { fields, members } = defineProps<{
  fields: FieldDefinition[]
  members: Member[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', fields: FieldDefinition[]): void
}>()

const translator = useTranslator()
const { t } = translator

const inputClass =
  'ext:rounded ext:border ext:border-role-outline ext:bg-role-surface ext:px-2 ext:py-1.5 ext:text-role-on-surface ext:focus:border-role-primary ext:focus:outline-none'

const draft = ref<FieldDefinition[]>(
  fields.map((f) => ({ ...f, ...(f.options && { options: [...f.options] }) }))
)

const hasEmptyLabel = computed(() => draft.value.some((f) => !f.label.trim()))

const removedWithData = computed(() => {
  const remaining = new Set(draft.value.map((f) => f.id))
  return fields
    .filter((f) => !remaining.has(f.id))
    .filter((f) => members.some((m) => m.values[f.id] !== undefined && m.values[f.id] !== ''))
    .map((f) => f.label)
})

const move = (index: number, offset: number) => {
  const list = draft.value
  const [item] = list.splice(index, 1)
  list.splice(index + offset, 0, item)
}

const remove = (index: number) => {
  draft.value.splice(index, 1)
}

const add = () => {
  const existing = [...fields.map((f) => f.id), ...draft.value.map((f) => f.id)]
  draft.value.push({
    id: fieldIdFromLabel(t('New field'), existing),
    label: t('New field'),
    type: 'text',
    showInList: true
  })
}

const setOptions = (field: FieldDefinition, value: string) => {
  field.options = value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

const onTypeChange = (field: FieldDefinition) => {
  if (field.type === 'select' && !field.options) {
    field.options = []
  }
  if (field.type !== 'select') {
    delete field.options
  }
}

const submit = () => {
  emit(
    'submit',
    draft.value.map((f) => ({ ...f, label: f.label.trim() }))
  )
}
</script>
