import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
import router from './router'
import App from './App.vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// Vuetify
import 'vuetify/styles'

// Custom styles
import './styles/main.scss'

// Custom plugins
import errorSnackbarPlugin from '@/plugins/errorSnackbar'

// Custom components
import AppLogo from '@/components/common/AppLogo.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Detect user's system theme preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const vuetify = createVuetify({
  theme: {
    defaultTheme: prefersDark ? 'dark' : 'light',
    themes: {
      options: { customProperties: true },
      light: {
        colors: {
          primary: '#0F183E',
          secondary: '#FF9000',
          accent: '#FF9000',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-variant': '#F5F5F5',
          'on-surface': '#0F183E',
          'on-surface-variant': '#0F183E',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'subtle': '#191970',
          'danger': '#E53935',
          'gray': '#36454F',
          'grey': '#36454F',
        },
      },
      dark: {
        colors: {
          primary: '#0F183E',
          secondary: '#FF9000',
          accent: '#FF9000',
          background: '#000012',
          surface: '#00001f',
          'surface-variant': '#000017',
          'on-surface': '#FFFFFF',
          'on-surface-variant': '#FFFFFF',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'subtle': '#7DF9FF',
          'danger': '#E53935',
        },
      },
    },
  },
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md,
    },
  },
})

const app = createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .use(errorSnackbarPlugin)
  .component('AppLogo', AppLogo)

app.mount('#app')