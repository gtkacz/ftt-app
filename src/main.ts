import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
import router from './router'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'

// Custom styles
import './styles/main.scss'

const pinia = createPinia()

// Detect user's system theme preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const vuetify = createVuetify({
  theme: {
    defaultTheme: prefersDark ? 'dark' : 'light',
    themes: {
      light: {
        colors: {
          primary: '#0F183E',
          secondary: '#FF9000',
          accent: '#FF9000',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-variant': '#F5F5F5',
          'on-surface': '#0F183E',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'danger': '#E53935',
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
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
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

app.mount('#app')