<template>
  <v-app>
    <AppLayout />

    <v-snackbar v-model="errorSnackbar.show" :timeout="errorSnackbar.timeout" color="danger" location="top" multi-line>
      <v-icon icon="dangerous" class="mr-2" size="large" />
      <span class="text-on-error">{{ errorSnackbar.message }}</span>

      <template #actions>
        <v-btn icon variant="text" @click="errorSnackbar.show = false">
          <v-icon icon="close" />
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { onErrorCaptured, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from '@/components/layout/AppLayout.vue';
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const errorSnackbar = ref({
  show: false,
  message: '',
  timeout: 6000
});

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
      await Promise.all([
        authStore.refreshAccessToken(),
        authStore.fetchUser(),
      ]);
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