<template>
  <AuthShell>
    <div class="auth-form">
      <div class="auth-form__status">
        <v-icon icon="lock" size="18" />
        Invite only
      </div>
      <p class="eyebrow">Join the league</p>
      <h2>Create your account</h2>
      <p class="auth-form__intro">Your commissioner will approve the account before you enter the league.</p>

      <v-alert class="mt-5" color="info" variant="tonal" icon="info" density="comfortable">
        New registrations are temporarily paused. Ask your commissioner for access.
      </v-alert>

      <v-form v-model="formValid" class="auth-form__fields" disabled @submit.prevent="handleSignup">
        <v-text-field v-model="username" label="Username" autocomplete="username" append-inner-icon="account_box"
          :rules="[rules.required]" hide-details="auto" />

        <div class="auth-form__row">
          <v-text-field v-model="firstName" label="First name" autocomplete="given-name" append-inner-icon="face"
            :rules="[rules.required]" hide-details="auto" />
          <v-text-field v-model="lastName" label="Last name" autocomplete="family-name"
            append-inner-icon="fingerprint" :rules="[rules.required]" hide-details="auto" />
        </div>

        <v-text-field v-model="email" label="Email" type="email" autocomplete="email" append-inner-icon="email"
          :rules="[rules.required, rules.email]" hide-details="auto" />

        <div class="auth-form__row">
          <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" label="Password"
            autocomplete="new-password" :append-inner-icon="showPassword ? 'visibility' : 'visibility_off'"
            :rules="[rules.required, rules.min(8)]" hide-details="auto"
            @click:append-inner="showPassword = !showPassword" />
          <v-text-field v-model="passwordConfirm" :type="showPassword ? 'text' : 'password'" label="Confirm password"
            autocomplete="new-password" append-inner-icon="lock" :rules="[rules.required, rules.passwordMatch]"
            hide-details="auto" />
        </div>

        <v-btn type="submit" block size="large" height="52" :loading="authStore.isLoading"
          :disabled="!formValid || authStore.isLoading" color="secondary">
          Registration unavailable
        </v-btn>
      </v-form>

      <div class="auth-form__footer">
        <span>Already have an account?</span>
        <router-link :to="{ name: 'login' }">Sign in</router-link>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const formValid = ref(false)
const showPassword = ref(false)

const rules = {
  required: (value: string) => !!value || 'This field is required',
  email: (value: string) => /\S+@\S+\.\S+/.test(value) || 'Must be a valid email',
  min: (length: number) => (value: string) => value.length >= length || `Minimum ${length} characters`,
  passwordMatch: (value: string) => value === password.value || 'Passwords must match',
}

async function handleSignup() {
  if (!formValid.value) return

  const success = await authStore.register({
    username: username.value,
    first_name: firstName.value,
    last_name: lastName.value,
    email: email.value,
    password: password.value,
    password_confirm: passwordConfirm.value,
  })
  if (!success) return

  const loginSuccess = await authStore.login({ username: username.value, password: password.value })
  if (loginSuccess) await router.push('/')
}
</script>

<style lang="scss" scoped>
.auth-form__status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  float: right;
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-form h2 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(1.85rem, 3.5vw, 2.35rem);
  font-weight: 760;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.auth-form__intro {
  margin: 12px 0 0;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.55;
}

.auth-form__fields {
  display: grid;
  gap: 16px;
  margin-top: 22px;
}

.auth-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.auth-form__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
  padding-top: 20px;
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

@media (max-width: $breakpoint-xs) {
  .auth-form__status {
    float: none;
    margin-bottom: 18px;
  }

  .auth-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
