<template>
  <main class="ext:mx-auto ext:flex ext:max-w-2xl ext:flex-col ext:gap-4 ext:p-8">
    <div class="ext:flex ext:items-center ext:gap-3">
      <oc-icon name="team" size="xlarge" />
      <h1 class="ext:m-0">{{ t('Member directory') }}</h1>
    </div>
    <p class="ext:m-0">
      {{
        t(
          'A member directory is a file with the extension %{extension}. It is stored like any other file in OpenCloud and can be shared with others using the regular sharing options.',
          { extension: `.${FILE_EXTENSION}` }
        )
      }}
    </p>
    <ol class="ext:m-0 ext:flex ext:flex-col ext:gap-1 ext:pl-5">
      <li>{{ t('Open the file view and go to the folder or space you want.') }}</li>
      <li>
        {{
          t('Choose %{menu} and enter a name.', { menu: `${t('New')} → ${t('Member directory')}` })
        }}
      </li>
      <li>
        {{
          t('Click an existing %{extension} file to open it.', { extension: `.${FILE_EXTENSION}` })
        }}
      </li>
    </ol>
    <div>
      <oc-button type="router-link" appearance="filled" :to="{ path: '/files' }">
        <oc-icon name="folder" />
        {{ t('Go to files') }}
      </oc-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useTranslator } from '../i18n'
import { FILE_EXTENSION } from '../model'

const { t } = useTranslator()
</script>
