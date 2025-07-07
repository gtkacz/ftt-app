import { App } from 'vue'
import { errorSnackbar, showError } from '@/services/errorSnackbar'

export default {
  install(app: App) {
    app.config.globalProperties.$errorSnackbar = errorSnackbar
    app.config.globalProperties.$showError      = showError
  }
}