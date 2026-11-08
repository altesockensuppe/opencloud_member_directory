<template>
  <base-dialog :title="title" wide @close="emit('close')">
    <form
      id="member-form"
      class="ext:grid ext:grid-cols-1 ext:gap-4 ext:md:grid-cols-2"
      @submit.prevent="submit"
    >
      <field-input
        v-for="field in fields"
        :key="field.id"
        v-model="values[field.id]"
        :field="field"
        :read-only="readOnly"
        id-prefix="member"
        :class="field.type === 'textarea' ? 'ext:md:col-span-2' : ''"
      />
    </form>
    <template #footer>
      <oc-button appearance="outline" @click="emit('close')">
        {{ readOnly ? t('Close') : t('Cancel') }}
      </oc-button>
      <oc-button v-if="!readOnly" appearance="filled" submit="submit" form="member-form">
        {{ t('Apply') }}
      </oc-button>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import BaseDialog from './BaseDialog.vue'
import FieldInput from './FieldInput.vue'
import { FieldDefinition, MemberValues } from '../model'
import { useTranslator } from '../i18n'

const {
  initialValues,
  fields,
  title,
  readOnly = false
} = defineProps<{
  title: string
  fields: FieldDefinition[]
  initialValues: MemberValues
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', values: MemberValues): void
}>()

const { t } = useTranslator()

// edit a copy so that "Cancel" discards changes
const values = reactive<MemberValues>({ ...initialValues })

const submit = () => {
  const cleaned: MemberValues = {}
  for (const [key, value] of Object.entries(values)) {
    if (value !== '' && value !== undefined) {
      cleaned[key] = typeof value === 'string' ? value.trim() : value
    }
  }
  emit('submit', cleaned)
}
</script>
