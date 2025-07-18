<template>
  <v-container fluid class="fill-height ">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card rounded="xl" class="pa-8" color="primary" variant="tonal">
          <v-card-title class="text-h4 text-center pb-2">
            <v-row align="center" justify="center" no-gutters><app-logo size="3ch" /></v-row>
            <v-row align="center" justify="center">Welcome Back</v-row>
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">
            Sign in to continue
          </v-card-subtitle>

          <v-form @submit.prevent="handleLogin" v-model="formValid">
            <v-text-field rounded v-model="username" label="Username" variant="outlined" append-inner-icon="account_box"
              :rules="[rules.required]" class="mb-3" color="secondary" />

            <v-text-field rounded v-model="password" label="Password" type="password" variant="outlined"
              append-inner-icon="lock" :rules="[rules.required]" class="mb-6" color="secondary" />

            <v-btn type="submit" block size="large" :loading="authStore.isLoading"
              :disabled="!formValid || authStore.isLoading" color="secondary" rounded="xl" class="mb-4">
              Sign In
            </v-btn>

            <v-divider class="mb-4" />

            <div class="text-center">
              <v-btn variant="text" color="secondary" size="small">
                Forgot Password?
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <div class="text-center mt-4">
          <span class="text-on-surface">Don't have an account? <router-link to="signup">Sign Up</router-link></span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const formValid = ref(false);

const rules = {
  required: (value: string) => !!value || 'This field is required',
};

const handleLogin = async () => {
  if (!formValid.value) return;

  const success = await authStore.login({
    username: username.value,
    password: password.value,
  });

  if (success) {
    const redirectPath = router.currentRoute.value.query.redirect || '/';
    router.push(redirectPath as string);
  }
};
</script>

<style lang="scss" scoped>
</style>