<template>
  <div v-if="clientId" ref="buttonHost" class="google-signin" :class="{ 'google-signin--busy': loading }" />
  <v-alert v-else type="warning" variant="tonal" density="compact" class="google-signin__unconfigured">
    Google sign-in is not configured.
  </v-alert>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { loadGoogleIdentity, type GoogleCredentialResponse } from '@/utils/google'

defineProps<{ loading?: boolean }>()

const emit = defineEmits<{
  (e: 'credential', credential: string): void
  (e: 'error', message: string): void
}>()

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const themeStore = useThemeStore()
const buttonHost = ref<HTMLElement | null>(null)

onMounted(async () => {
  if (!clientId || !buttonHost.value) return

  try {
    const googleId = await loadGoogleIdentity()

    googleId.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        if (response?.credential) {
          emit('credential', response.credential)
        }
      },
      cancel_on_tap_outside: true,
    })

    googleId.renderButton(buttonHost.value, {
      type: 'standard',
      theme: themeStore.isDark ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'center',
    })
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Google sign-in failed to load')
  }
})
</script>

<style scoped lang="scss">
.google-signin {
  display: flex;
  justify-content: center;
  min-height: 44px;
}

.google-signin--busy {
  opacity: 0.6;
  pointer-events: none;
}

.google-signin__unconfigured {
  margin-top: 4px;
}
</style>
