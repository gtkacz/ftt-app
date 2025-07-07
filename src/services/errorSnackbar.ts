import { reactive } from 'vue'

interface SnackbarState {
  show: boolean
  message: string
  timeout: number
}

export const errorSnackbar = reactive<SnackbarState>({
  show: false,
  message: '',
  timeout: 6_000
})

/**
 * Show an error message in the global error snackbar.
 * @param message — the message to display (if null, shows a generic message)
 */
export function showError(message: string | null) {
  errorSnackbar.show    = true
  errorSnackbar.message = message ?? 'An unexpected error occurred'
  errorSnackbar.timeout = 6_000
}
