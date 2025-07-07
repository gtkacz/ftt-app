<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card rounded="lg" class="pa-8 signup-card">
          <v-card-title class="text-h4 text-center pb-2">
            <v-row align="center" justify="center" no-gutters>
              <img src="https://a.espncdn.com/combiner/i?img=/i/fantasy/fba.png&w=288&h=288&transparent=true" alt="ftt"
                class="logo" />
            </v-row>
            <v-row align="center" justify="center">Create Account</v-row>
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">
            Sign up to get started
          </v-card-subtitle>

          <v-form @submit.prevent="handleSignup" v-model="formValid">
            <v-text-field v-model="username" label="Username" variant="outlined" prepend-inner-icon="account_box"
              :rules="[rules.required]" class="mb-3" color="secondary" />

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="firstName" label="First Name" variant="outlined" prepend-inner-icon="face"
                  :rules="[rules.required]" class="mb-3" color="secondary" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="lastName" label="Last Name" variant="outlined" prepend-inner-icon="fingerprint"
                  :rules="[rules.required]" class="mb-3" color="secondary" />
              </v-col>
            </v-row>

            <v-text-field v-model="email" label="Email" type="email" variant="outlined" prepend-inner-icon="email"
              :rules="[rules.required, rules.email]" class="mb-3" color="secondary" />

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="password" label="Password" type="password" variant="outlined"
                  prepend-inner-icon="lock" :rules="[rules.required, rules.min(8)]" class="mb-3" color="secondary" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="passwordConfirm" label="Confirm Password" type="password" variant="outlined"
                  prepend-inner-icon="lock" :rules="[rules.required, rules.passwordMatch]" class="mb-6"
                  color="secondary" />
              </v-col>
            </v-row>

            <v-btn type="submit" block size="large" :loading="authStore.isLoading"
              :disabled="!formValid || authStore.isLoading" color="secondary" rounded="lg" class="mb-4">
              Sign Up
            </v-btn>

            <v-divider class="mb-4" />

            <div class="text-center mt-4">
              <span class="text-on-surface">Already have an account? <router-link to="login">Login</router-link></span>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const formValid = ref(false);

const rules = {
  required: (value: string) => !!value || 'This field is required',
  email: (value: string) => /\S+@\S+\.\S+/.test(value) || 'Must be a valid email',
  min: (length: number) => (value: string) => value.length >= length || `Minimum ${length} characters`,
  passwordMatch: (value: string) => value === password.value || 'Passwords must match',
};

const handleSignup = async () => {
  if (!formValid.value) return;

  const payload = {
    username: username.value,
    first_name: firstName.value,
    last_name: lastName.value,
    email: email.value,
    password: password.value,
    password_confirm: passwordConfirm.value,
  };

  const success = await authStore.register(payload);
  if (!success) return;
  const loginSuccess = await authStore.login({
    username: username.value,
    password: password.value,
  });
  if (loginSuccess) {
    router.push('/');
  }
};
</script>

<style lang="scss" scoped>
.signup-card {
  background-color: transparent;
  border: 1px solid rgb(var(--v-theme-on-surface));
}

.logo {
  width: 3ch;
  height: auto;
  aspect-ratio: 1;
  transition: transform 0.3s ease;
  z-index: 2;

  &:hover {
    transform: scale(1.1);
  }
}
</style>