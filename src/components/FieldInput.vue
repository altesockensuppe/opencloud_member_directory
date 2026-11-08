<template>
  <label
    v-if="field.type === 'checkbox'"
    class="ext:flex ext:items-center ext:gap-2"
    :class="compact ? 'ext:justify-center' : ''"
  >
    <input
      :id="inputId"
      type="checkbox"
      class="ext:size-4"
      :checked="modelValue === true"
      :disabled="readOnly"
      :aria-label="compact ? field.label : undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span v-if="!compact">{{ field.label }}</span>
  </label>

  <div v-else :class="compact ? '' : 'ext:flex ext:flex-col ext:gap-1'">
    <label v-if="!compact" :for="inputId" class="ext:text-sm ext:font-medium">
      {{ field.label }}
    </label>

    <select
      v-if="field.type === 'select'"
      :id="inputId"
      :class="inputClass"
      :value="stringValue"
      :disabled="readOnly"
      :aria-label="compact ? field.label : undefined"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">–</option>
      <option v-for="option in selectOptions" :key="option" :value="option">{{ option }}</option>
    </select>

    <textarea
      v-else-if="field.type === 'textarea' && !compact"
      :id="inputId"
      :class="inputClass"
      rows="3"
      :value="stringValue"
      :readonly="readOnly"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <input
      v-else
      :id="inputId"
      :type="htmlType"
      :class="inputClass"
      :value="stringValue"
      :readonly="readOnly"
      :aria-label="compact ? field.label : undefined"
      :inputmode="field.type === 'number' ? 'decimal' : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FieldDefinition, FieldValue } from '../model'

const {
  field,
  modelValue,
  compact = false,
  readOnly = false,
  idPrefix = 'field'
} = defineProps<{
  field: FieldDefinition
  modelValue: FieldValue | undefined
  compact?: boolean
  readOnly?: boolean
  idPrefix?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: FieldValue): void }>()

const inputId = computed(() => `${idPrefix}-${field.id}`)

const stringValue = computed(() =>
  typeof modelValue === 'string' ? modelValue : modelValue === undefined ? '' : String(modelValue)
)

// keep values that are no longer part of the options selectable instead of silently dropping them
const selectOptions = computed(() => {
  const options = field.options || []
  return stringValue.value && !options.includes(stringValue.value)
    ? [...options, stringValue.value]
    : options
})

const htmlType = computed(() => {
  switch (field.type) {
    case 'date':
    case 'email':
    case 'tel':
      return field.type
    // number fields are stored as text so that "1'000" or "12,50" survive
    default:
      return 'text'
  }
})

const inputClass = computed(() =>
  compact
    ? 'ext:w-full ext:min-w-24 ext:rounded ext:border ext:border-transparent ext:bg-transparent ext:px-1.5 ext:py-1 ext:text-sm ext:text-role-on-surface ext:hover:border-role-outline-variant ext:focus:border-role-primary ext:focus:bg-role-surface ext:focus:outline-none'
    : 'ext:w-full ext:rounded ext:border ext:border-role-outline ext:bg-role-surface ext:px-2 ext:py-1.5 ext:text-role-on-surface ext:focus:border-role-primary ext:focus:outline-none'
)
</script>
