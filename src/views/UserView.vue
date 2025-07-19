<template>
  <div class="page-view">
    <v-snackbar v-model="notificationSnackbar.show" :timeout="notificationSnackbar.timeout"
      :color="notificationSnackbar.color" location="top" multi-line>
      <v-icon icon="dangerous" class="mr-2" size="large" />
      <span class="text-on-error">{{ notificationSnackbar.message }}</span>

      <template v-slot:actions>
        <v-btn icon variant="text" @click="notificationSnackbar.show = false">
          <v-icon icon="close" />
        </v-btn>
      </template>
    </v-snackbar>

    <div class="page-header">
      <h1 class="page-title">{{ user.first_name }} {{ user.last_name }}</h1>
      <p class="page-subtitle">Update your profile information</p>
    </div>

    <div class="coming-soon">
      <v-container fluid class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="18" sm="12" md="9" lg="6">
            <v-card rounded="xl" class="pa-8 text-on-secondary" variant="tonal" color="primary">
              <v-form @submit.prevent="handleSignup" v-model="formValid">
                <v-text-field rounded v-model="username" label="Username" variant="outlined"
                  append-inner-icon="account_box" :rules="[rules.required]" class="mb-3" color="secondary" />

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field rounded v-model="firstName" label="First Name" variant="outlined"
                      append-inner-icon="face" :rules="[rules.required]" class="mb-3" color="secondary" />
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
                    <v-text-field rounded v-model="password" label="Password" type="password" variant="outlined"
                      append-inner-icon="lock" :rules="[rules.required, rules.min(8)]" class="mb-3" color="secondary" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field rounded v-model="passwordConfirm" label="Confirm Password" type="password"
                      variant="outlined" append-inner-icon="lock" :rules="[rules.required, rules.passwordMatch]"
                      class="mb-6" color="secondary" />
                  </v-col>
                </v-row>

                <v-btn v-confirm type="submit" block size="large" :loading="loading"
                  :disabled="!formValid || authStore.isLoading" color="secondary" rounded="xl" class="mb-4">
                  Update
                </v-btn>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import api from '@/api/axios';

const authStore = useAuthStore();
const user = ref(authStore.user);

const username = ref(user.value.username);
const firstName = ref(user.value.first_name);
const lastName = ref(user.value.last_name);
const email = ref(user.value.email);
const password = ref('');
const passwordConfirm = ref('');
const formValid = ref(false);
const loading = ref(false);
const notificationSnackbar = ref({
  show: false,
  message: '',
  timeout: 6000,
  color: 'success'
});

const rules = {
  required: (value: string) => !!value || 'This field is required',
  email: (value: string) => /\S+@\S+\.\S+/.test(value) || 'Must be a valid email',
  min: (length: number) => (value: string) => value.length >= length || `Minimum ${length} characters`,
  passwordMatch: (value: string) => value === password.value || 'Passwords must match',
};

const handleSignup = async () => {
  if (!formValid.value) return;
  loading.value = true;

  const payload = {
    username: username.value,
    first_name: firstName.value,
    last_name: lastName.value,
    email: email.value,
    password: password.value,
    password_confirm: passwordConfirm.value,
  };

  await api.put(`/users/${user.value.id}/`, payload);

  notificationSnackbar.value = {
    show: true,
    message: 'Profile updated successfully!',
    timeout: 6000,
    color: 'success'
  };
  loading.value = false;
};
</script>

<style lang="scss" scoped></style>