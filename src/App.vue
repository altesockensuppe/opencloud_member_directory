<template>
  <div
    class="ext:flex ext:size-full ext:flex-col ext:overflow-hidden ext:bg-role-surface ext:text-role-on-surface"
  >
    <div v-if="parseError" class="ext:p-6">
      <h2>{{ t('The file cannot be opened') }}</h2>
      <p>{{ t('The file is not a valid member directory.') }}</p>
      <p class="ext:text-sm ext:text-role-on-surface-variant">{{ parseError }}</p>
    </div>

    <template v-else-if="directory">
      <header
        class="ext:flex ext:flex-wrap ext:items-center ext:gap-3 ext:border-b ext:border-role-outline-variant ext:px-4 ext:py-3"
      >
        <div class="ext:flex ext:min-w-60 ext:flex-1 ext:flex-col">
          <input
            v-if="!isReadOnly"
            v-model="directory.title"
            :aria-label="t('Title of the directory')"
            class="ext:rounded ext:border ext:border-transparent ext:bg-transparent ext:px-1 ext:text-xl ext:font-semibold ext:text-role-on-surface ext:hover:border-role-outline-variant ext:focus:border-role-primary ext:focus:outline-none"
          />
          <h1 v-else class="ext:m-0 ext:px-1 ext:text-xl ext:font-semibold">
            {{ directory.title }}
          </h1>
          <span class="ext:px-1 ext:text-sm ext:text-role-on-surface-variant">
            {{
              tn('%{count} member', '%{count} members', directory.members.length, {
                count: directory.members.length
              })
            }}
            <template v-if="visibleMembers.length !== directory.members.length">
              · {{ t('%{count} shown', { count: visibleMembers.length }) }}
            </template>
            <template v-if="isReadOnly"> · {{ t('read-only') }}</template>
          </span>
        </div>

        <div class="ext:relative">
          <oc-icon
            name="search"
            size="small"
            class="ext:pointer-events-none ext:absolute ext:left-2 ext:top-1/2 ext:-translate-y-1/2"
          />
          <input
            v-model="search"
            type="search"
            :placeholder="t('Search…')"
            :aria-label="t('Search members')"
            class="ext:w-56 ext:rounded ext:border ext:border-role-outline ext:bg-role-surface ext:py-1.5 ext:pl-8 ext:pr-2 ext:text-role-on-surface ext:focus:border-role-primary ext:focus:outline-none"
          />
        </div>

        <oc-button v-if="!isReadOnly" appearance="outline" @click="showFields = true">
          <oc-icon name="settings-3" />
          {{ t('Fields') }}
        </oc-button>
        <oc-button v-if="!isReadOnly" appearance="outline" @click="showImport = true">
          <oc-icon name="upload-2" />
          {{ t('Import') }}
        </oc-button>
        <oc-button
          appearance="outline"
          :disabled="!directory.members.length"
          @click="showExport = true"
        >
          <oc-icon name="download-2" />
          {{ t('Export') }}
        </oc-button>
        <oc-button v-if="!isReadOnly" appearance="filled" @click="openNewMember">
          <oc-icon name="user-add" />
          {{ t('Add member') }}
        </oc-button>
      </header>

      <div class="ext:flex-1 ext:overflow-auto">
        <table v-if="directory.members.length" class="ext:w-full ext:border-collapse ext:text-sm">
          <thead class="ext:sticky ext:top-0 ext:z-10 ext:bg-role-surface-container">
            <tr>
              <th
                v-for="field in listFields"
                :key="field.id"
                scope="col"
                class="ext:whitespace-nowrap ext:border-b ext:border-role-outline-variant ext:px-2 ext:py-2 ext:text-left ext:font-semibold"
                :aria-sort="
                  sortField === field.id
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
              >
                <button
                  type="button"
                  class="ext:flex ext:cursor-pointer ext:items-center ext:gap-1 ext:border-0 ext:bg-transparent ext:p-0 ext:font-semibold ext:text-role-on-surface"
                  @click="toggleSort(field.id)"
                >
                  {{ field.label }}
                  <oc-icon
                    v-if="sortField === field.id"
                    :name="sortDirection === 'asc' ? 'arrow-up-s' : 'arrow-down-s'"
                    size="small"
                  />
                </button>
              </th>
              <th
                scope="col"
                class="ext:w-20 ext:border-b ext:border-role-outline-variant ext:px-2 ext:py-2"
              >
                <span class="ext:sr-only">{{ t('Actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="member in visibleMembers"
              :key="member.id"
              class="ext:border-b ext:border-role-outline-variant ext:hover:bg-role-surface-container-low"
            >
              <td v-for="field in listFields" :key="field.id" class="ext:px-1 ext:py-0.5">
                <field-input
                  v-if="!isReadOnly"
                  :field="field"
                  :model-value="member.values[field.id]"
                  compact
                  :id-prefix="`cell-${member.id}`"
                  @update:model-value="setValue(member, field.id, $event)"
                />
                <span v-else class="ext:block ext:px-1.5 ext:py-1">
                  {{ formatValue(field, member.values[field.id], translator) }}
                </span>
              </td>
              <td class="ext:whitespace-nowrap ext:px-2 ext:text-right">
                <oc-button
                  appearance="raw"
                  :aria-label="isReadOnly ? t('Show details') : t('Edit all details')"
                  @click="openMember(member)"
                >
                  <oc-icon :name="isReadOnly ? 'eye' : 'pencil'" size="small" />
                </oc-button>
                <oc-button
                  v-if="!isReadOnly"
                  appearance="raw"
                  :aria-label="t('Delete member')"
                  class="ext:ml-2"
                  @click="deleteMember(member)"
                >
                  <oc-icon name="delete-bin" size="small" />
                </oc-button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="directory.members.length && !visibleMembers.length"
          class="ext:p-6 ext:text-center ext:text-role-on-surface-variant"
        >
          {{ t('No members found.') }}
        </div>

        <div
          v-if="!directory.members.length"
          class="ext:flex ext:flex-col ext:items-center ext:gap-3 ext:p-12 ext:text-center"
        >
          <oc-icon name="team" size="xlarge" />
          <p class="ext:m-0 ext:text-lg">{{ t('No members recorded yet.') }}</p>
          <div v-if="!isReadOnly" class="ext:flex ext:flex-wrap ext:justify-center ext:gap-2">
            <oc-button appearance="filled" @click="openNewMember">
              <oc-icon name="user-add" />
              {{ t('Add first member') }}
            </oc-button>
            <oc-button appearance="outline" @click="showImport = true">
              <oc-icon name="upload-2" />
              {{ t('Import from CSV') }}
            </oc-button>
          </div>
        </div>
      </div>
    </template>

    <member-dialog
      v-if="editing && directory"
      :title="editingTitle"
      :fields="directory.fields"
      :initial-values="editing.values"
      :read-only="isReadOnly"
      @close="editing = null"
      @submit="saveMember"
    />
    <fields-dialog
      v-if="showFields && directory"
      :fields="directory.fields"
      :members="directory.members"
      @close="showFields = false"
      @submit="saveFields"
    />
    <export-dialog
      v-if="showExport && directory"
      :title="directory.title"
      :fields="directory.fields"
      :all-members="sortedMembers"
      :filtered-members="visibleMembers"
      :file-name="exportFileName"
      @close="showExport = false"
    />
    <import-dialog
      v-if="showImport && directory"
      :fields="directory.fields"
      :member-count="directory.members.length"
      @close="showImport = false"
      @submit="applyImport"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Resource } from '@opencloud-eu/web-client'
import FieldInput from './components/FieldInput.vue'
import MemberDialog from './components/MemberDialog.vue'
import FieldsDialog from './components/FieldsDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import ImportDialog from './components/ImportDialog.vue'
import {
  FieldDefinition,
  FieldValue,
  Member,
  MemberDirectory,
  MemberValues,
  compareMembers,
  formatValue,
  generateId,
  matchesSearch,
  nextMemberNumber,
  parseDirectory,
  serializeDirectory
} from './model'
import { useTranslator } from './i18n'

// AppWrapper only loads what is declared here; declaring currentContent makes it fetch the file
const { resource, currentContent, isReadOnly } = defineProps<{
  resource: Resource
  currentContent: string
  isReadOnly: boolean
}>()

const emit = defineEmits<{
  (e: 'update:currentContent', value: string): void
}>()

const translator = useTranslator()
const { t, tn } = translator

const baseName = computed(() => resource.name.replace(/\.[^.]+$/, ''))

const directory = ref<MemberDirectory | null>(null)
const parseError = ref('')

// AppWrapper remounts this component when another file is opened, so parsing once is enough
try {
  directory.value = parseDirectory(currentContent, translator, baseName.value)
} catch (e) {
  parseError.value = e instanceof Error ? e.message : String(e)
}

// a freshly created (empty) file gets the default structure written on the next save
if (directory.value && !currentContent.trim() && !isReadOnly) {
  emit('update:currentContent', serializeDirectory(directory.value))
}

watch(
  directory,
  (value) => {
    if (value && !isReadOnly) {
      emit('update:currentContent', serializeDirectory(value))
    }
  },
  { deep: true }
)

const search = ref('')
const sortField = ref<string>('last_name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const listFields = computed(() => directory.value?.fields.filter((f) => f.showInList) ?? [])

const sortedMembers = computed<Member[]>(() => {
  if (!directory.value) {
    return []
  }
  const field = directory.value.fields.find((f) => f.id === sortField.value)
  const members = [...directory.value.members]
  return field ? members.sort((a, b) => compareMembers(a, b, field, sortDirection.value)) : members
})

// Members being edited inline must not jump around while typing, so the order is
// only recomputed when sort settings, search or the member set change.
const memberOrder = ref<string[]>([])
watch(
  () => [
    sortField.value,
    sortDirection.value,
    search.value,
    directory.value?.members.map((m) => m.id).join(','),
    directory.value?.fields.map((f) => f.id).join(',')
  ],
  () => {
    const fields = directory.value?.fields ?? []
    memberOrder.value = sortedMembers.value
      .filter((m) => matchesSearch(m, fields, search.value, translator))
      .map((m) => m.id)
  },
  { immediate: true }
)

const visibleMembers = computed<Member[]>(() => {
  const byId = new Map(directory.value?.members.map((m) => [m.id, m]) ?? [])
  return memberOrder.value.map((id) => byId.get(id)).filter((m): m is Member => !!m)
})

const toggleSort = (fieldId: string) => {
  if (sortField.value === fieldId) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = fieldId
    sortDirection.value = 'asc'
  }
}

const setValue = (member: Member, fieldId: string, value: FieldValue) => {
  if (value === '' || value === false) {
    delete member.values[fieldId]
  } else {
    member.values[fieldId] = value
  }
}

// --- member dialog ---
const editing = ref<{ id: string | null; values: MemberValues } | null>(null)

const editingTitle = computed(() => {
  if (!editing.value?.id) {
    return t('New member')
  }
  const { first_name: firstName, last_name: lastName } = editing.value.values
  const name = [firstName, lastName].filter((v) => typeof v === 'string' && v).join(' ')
  return name || t('Member')
})

const openNewMember = () => {
  const values: MemberValues = {}
  const memberNo = directory.value && nextMemberNumber(directory.value)
  if (memberNo) {
    values.member_no = memberNo
  }
  // the first status option is the default ("Active" in a new directory)
  const defaultStatus = directory.value?.fields.find((f) => f.id === 'status')?.options?.[0]
  if (defaultStatus) {
    values.status = defaultStatus
  }
  if (directory.value?.fields.some((f) => f.id === 'date_joined')) {
    values.date_joined = new Date().toISOString().slice(0, 10)
  }
  editing.value = { id: null, values }
}

const openMember = (member: Member) => {
  editing.value = { id: member.id, values: { ...member.values } }
}

const saveMember = (values: MemberValues) => {
  if (!directory.value || !editing.value) {
    return
  }
  if (editing.value.id) {
    const member = directory.value.members.find((m) => m.id === editing.value?.id)
    if (member) {
      member.values = values
    }
  } else {
    directory.value.members.push({ id: generateId(), values })
    // make sure the new member is visible even if a search is active
    search.value = ''
  }
  editing.value = null
}

const deleteMember = (member: Member) => {
  if (!directory.value) {
    return
  }
  const name = [member.values.first_name, member.values.last_name].filter(Boolean).join(' ')
  const question = name
    ? t('Really delete member %{name}?', { name: `“${name}”` })
    : t('Really delete this member?')
  if (!window.confirm(question)) {
    return
  }
  directory.value.members = directory.value.members.filter((m) => m.id !== member.id)
}

// --- fields dialog ---
const showFields = ref(false)

const saveFields = (fields: FieldDefinition[]) => {
  if (!directory.value) {
    return
  }
  const remaining = new Set(fields.map((f) => f.id))
  for (const member of directory.value.members) {
    for (const key of Object.keys(member.values)) {
      if (!remaining.has(key)) {
        delete member.values[key]
      }
    }
  }
  directory.value.fields = fields
  if (!remaining.has(sortField.value)) {
    sortField.value = fields[0]?.id ?? ''
  }
  showFields.value = false
}

// --- export ---
const showExport = ref(false)
const exportFileName = computed(() => `${baseName.value}_${new Date().toISOString().slice(0, 10)}`)

// --- import ---
const showImport = ref(false)

const applyImport = ({
  fields,
  members,
  replace
}: {
  fields: FieldDefinition[]
  members: Member[]
  replace: boolean
}) => {
  if (!directory.value) {
    return
  }
  directory.value.fields = fields
  directory.value.members = replace ? members : [...directory.value.members, ...members]
  search.value = ''
  showImport.value = false
}
</script>
