import {
  AppMenuItemExtension,
  AppWrapperRoute,
  ApplicationInformation,
  Extension,
  defineWebApplication,
  useAppsStore
} from '@opencloud-eu/web-pkg'
import { urlJoin } from '@opencloud-eu/web-client'
import './styles.css'
import { RouteRecordRaw } from 'vue-router'
import { computed, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import App from './App.vue'
import StartPage from './views/StartPage.vue'
import { FILE_EXTENSION } from './model'
import translations from './translations'

const appId = 'mitgliederverzeichnis'

export default defineWebApplication({
  setup() {
    const gettext = useGettext()
    // labels are functions, so they are translated whenever they are shown
    const appName = () => gettext.$gettext('Member directory')

    const appInfo: ApplicationInformation = {
      id: appId,
      name: appName(),
      icon: 'team',
      color: '#2563eb',
      defaultExtension: FILE_EXTENSION,
      extensions: [
        {
          extension: FILE_EXTENSION,
          label: appName,
          icon: 'team',
          hasPriority: true,
          newFileMenu: {
            menuTitle: appName
          }
        }
      ]
    }

    // OpenCloud sets up apps before it knows the user's language and copies the app name
    // once when registering, so the name is updated whenever the language changes.
    // This relies on OpenCloud internals, so a failure must not break the app.
    try {
      const appsStore = useAppsStore()
      watch(
        () => gettext.current,
        () => {
          const app = appsStore.apps[appId]
          if (app) {
            app.name = appName()
          }
        }
      )
    } catch (e) {
      console.warn('Mitgliederverzeichnis: app name will not follow the language setting', e)
    }

    const routes: RouteRecordRaw[] = [
      {
        // landing page for the app switcher entry, which has no file to open
        path: '/start',
        name: `${appId}-start`,
        component: StartPage,
        meta: {
          authContext: 'user',
          title: appName()
        }
      },
      {
        // the file to edit is encoded in the path, e.g. /mitgliederverzeichnis/personal/admin/Mitglieder.mitglieder
        path: '/:driveAliasAndItem(.*)?',
        name: appId,
        component: AppWrapperRoute(App, {
          applicationId: appId,
          // the file is saved explicitly (Ctrl+S / save button) or by the global autosave setting
          disableAutoSave: false
        }),
        meta: {
          authContext: 'hybrid',
          title: appName(),
          patchCleanPath: true
        }
      }
    ]

    const extensions = computed<Extension[]>(() => {
      const menuItems: AppMenuItemExtension[] = [
        {
          // registers a menu item for the app switcher
          id: `app.${appId}.menuItem`,
          type: 'appMenuItem',
          label: appName,
          color: appInfo.color,
          icon: appInfo.icon,
          path: urlJoin(appId, 'start')
        }
      ]
      return [...menuItems]
    })

    return {
      appInfo,
      routes,
      extensions,
      translations
    }
  }
})
