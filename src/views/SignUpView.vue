<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card rounded="xl" class="pa-8" color="primary" variant="tonal">
          <v-card-title class="text-h4 text-center pb-2">
            <v-row align="center" justify="center" no-gutters>
              <app-logo size="3ch" />
            </v-row>
            <v-row align="center" justify="center">Create Account</v-row>
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">
            Sign up to get started
          </v-card-subtitle>

          <v-form @submit.prevent="handleSignup" v-model="formValid" disabled>
            <v-text-field rounded v-model="username" label="Username" variant="outlined" append-inner-icon="account_box"
              :rules="[rules.required]" class="mb-3" color="secondary" />

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field rounded v-model="firstName" label="First Name" variant="outlined" append-inner-icon="face"
                  :rules="[rules.required]" class="mb-3" color="secondary" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field rounded v-model="lastName" label="Last Name" variant="outlined"
                  append-inner-icon="fingerprint" :rules="[rules.required]" class="mb-3" color="secondary" />
              </v-col>
            </v-row>

            <v-text-field rounded v-model="email" label="Email" type="email" variant="outlined"
              append-inner-icon="email" :rules="[rules.required, rules.email]" class="mb-3" color="secondary" />

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field rounded v-model="password" :type="showPassword ? 'text' : 'password'" label="Password"
                  variant="outlined" :append-inner-icon="showPassword ? 'visibility' : 'visibility_off'"
                  @click:append-inner="showPassword = !showPassword" :rules="[rules.required, rules.min(8)]"
                  class="mb-3" color="secondary" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field rounded v-model="passwordConfirm" :type="showPassword ? 'text' : 'password'"
                  label="Confirm Password" variant="outlined" append-inner-icon="lock"
                  :rules="[rules.required, rules.passwordMatch]" class="mb-6" color="secondary" />
              </v-col>
            </v-row>

            <v-btn type="submit" block size="large" :loading="authStore.isLoading"
              :disabled="!formValid || authStore.isLoading" color="secondary" rounded="xl" class="mb-4">
              Sign Up
            </v-btn>

            <v-divider class="mb-4" />

            <div class="text-center mt-4">
              <span class="text-on-surface">
                Already have an account?
                <router-link to="login">Login</router-link>
              </span>
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

// New: control visibility of password fields
const showPassword = ref(false);

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

<style lang="scss" scoped></style>
