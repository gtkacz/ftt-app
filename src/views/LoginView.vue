<template>
  <AuthShell>
    <div class="auth-form">
      <p class="eyebrow">League access</p>
      <h2>Welcome back</h2>
      <p class="auth-form__intro">Sign in to get back to your roster and league activity.</p>

      <v-form v-model="formValid" class="auth-form__fields" @submit.prevent="handleLogin">
        <v-text-field v-model="username" label="Username" autocomplete="username" append-inner-icon="account_box"
          :rules="[rules.required]" hide-details="auto" />

        <v-text-field v-model="password" label="Password" autocomplete="current-password"
          :type="showPassword ? 'text' : 'password'" :rules="[rules.required]" hide-details="auto">
          <template #append-inner>
            <v-btn class="password-toggle" variant="text" icon
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword">
              <v-icon :icon="showPassword ? 'visibility' : 'visibility_off'" />
            </v-btn>
          </template>
        </v-text-field>

        <v-btn type="submit" block size="large" height="52" :loading="authStore.isLoading"
          :disabled="!formValid || authStore.isLoading" color="secondary">
          Sign in
          <v-icon icon="arrow_forward" end />
        </v-btn>
      </v-form>

      <div class="auth-form__divider" role="separator" aria-label="or">
        <span>or</span>
      </div>

      <GoogleSignInButton :loading="authStore.isLoading" @credential="handleGoogleCredential"
        @error="handleGoogleError" />

      <div class="auth-form__footer">
        <span>New to the league?</span>
        <router-link :to="{ name: 'signup' }">Create an account</router-link>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue'
import { useAuthStore } from '@/stores/auth'
import { showError } from '@/services/errorSnackbar'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const formValid = ref(false)
const showPassword = ref(false)

const rules = {
  required: (value: string) => !!value || 'This field is required',
}

async function handleLogin() {
  if (!formValid.value) return

  const success = await authStore.login({
    username: username.value,
    password: password.value,
  })

  if (success) {
    const redirectPath = router.currentRoute.value.query.redirect || '/'
    await router.push(redirectPath as string)
  }
}

async function handleGoogleCredential(credential: string) {
  try {
    const success = await authStore.loginWithGoogle(credential)

    if (success) {
      const redirectPath = router.currentRoute.value.query.redirect || '/'
      await router.push(redirectPath as string)
    }
  } catch (error) {
    showError('Google sign-in failed.', error instanceof Error ? error : null)
  }
}

function handleGoogleError(message: string) {
  showError(message)
}
</script>

<style lang="scss" scoped>
.auth-form h2 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.auth-form__intro {
  margin: 12px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.6;
}

.auth-form__fields {
  display: grid;
  gap: 20px;
  margin-top: 30px;
}

.auth-form__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.85rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--surface-border);
  }
}

.auth-form__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--surface-border);
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.9rem;

  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 700;
  }
}

.password-toggle {
  width: 44px;
  height: 44px;
}

</style>
