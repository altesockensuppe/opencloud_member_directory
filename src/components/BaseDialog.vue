<template>
  <div
    class="ext:fixed ext:inset-0 ext:z-[9999] ext:flex ext:items-center ext:justify-center ext:bg-black/40 ext:p-4"
    @mousedown.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <div
      ref="dialogEl"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
      class="ext:flex ext:max-h-full ext:w-full ext:flex-col ext:rounded-lg ext:bg-role-surface ext:text-role-on-surface ext:shadow-xl ext:outline-none"
      :class="wide ? 'ext:max-w-4xl' : 'ext:max-w-2xl'"
    >
      <header
        class="ext:flex ext:items-center ext:justify-between ext:border-b ext:border-role-outline-variant ext:px-5 ext:py-3"
      >
        <h2 class="ext:m-0 ext:text-lg ext:font-semibold">{{ title }}</h2>
        <oc-button appearance="raw" :aria-label="t('Close')" @click="emit('close')">
          <oc-icon name="close" />
        </oc-button>
      </header>
      <div class="ext:overflow-y-auto ext:px-5 ext:py-4">
        <slot />
      </div>
      <footer
        v-if="$slots.footer"
        class="ext:flex ext:justify-end ext:gap-2 ext:border-t ext:border-role-outline-variant ext:px-5 ext:py-3"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTranslator } from '../i18n'

defineProps<{ title: string; wide?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const { t } = useTranslator()

const dialogEl = ref<HTMLElement>()

onMounted(() => {
  const firstInput = dialogEl.value?.querySelector<HTMLElement>('input, textarea, select')
  ;(firstInput || dialogEl.value)?.focus()
})
</script>
