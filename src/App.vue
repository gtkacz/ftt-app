<template>
  <v-app>
    <AppLayout />

    <v-snackbar v-model="errorSnackbar.show" :timeout="errorSnackbar.timeout" color="danger" location="top" multi-line>
      <v-icon icon="dangerous" class="mr-2" size="large" />
      <span class="text-on-error">Error:</span>
      {{ errorSnackbar.message }}

      <template v-slot:actions>
        <v-btn icon variant="text" @click="errorSnackbar.show = false">
          <v-icon icon="close" />
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import axios from 'axios';
import { getCurrentInstance, onErrorCaptured, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from './components/layout/AppLayout.vue';
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const { proxy } = getCurrentInstance()!
const errorSnackbar = proxy!.$errorSnackbar

const showError = (message: string) => {
  errorSnackbar.value = {
    show: true,
    message,
    timeout: 6000
  };
};

// Global error handler for Vue errors
onErrorCaptured((error: Error) => {
  console.error('Global error caught:', error);
  showError(error.message || 'An unexpected error occurred');

  // Return false to propagate the error
  return false;
});

// Axios interceptor for HTTP errors
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);

    let message = 'An unexpected error occurred';

    if (error.response) {
      // Server responded with error status
      message = error.response.data?.message ||
        error.response.data?.error ||
        `Error: ${error.response.status} ${error.response.statusText}`;
    } else if (error.request) {
      // Request made but no response
      message = 'Network error: No response from server';
    } else {
      // Something else happened
      message = error.message || message;
    }

    showError(message);

    // Re-throw the error so it can be handled by calling code
    return Promise.reject(error);
  }
);

// Watch for authentication state changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated && route.name !== 'login') {
    router.push({
      name: 'login',
      query: { redirect: route.fullPath }
    });
  }
});

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await authStore.refreshAccessToken();
    } catch (error) {
      authStore.logout();
      router.push({
        name: 'login',
        query: { redirect: route.fullPath }
      });
    }
  }
});
</script>