import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import router from './router'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Custom styles
import './styles/main.scss'

const pinia = createPinia()

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
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
        },
      },
      dark: {
        colors: {
          primary: '#0F183E',
          secondary: '#FF9000',
          accent: '#FF9000',
          background: '#121212',
          surface: '#1E1E1E',
          'surface-variant': '#2E2E2E',
          'on-surface': '#FFFFFF',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .mount('#app')