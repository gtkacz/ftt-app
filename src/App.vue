<template>
  <v-app>
    <AppLayout />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRouter, useRoute } from "vue-router";
import AppLayout from './components/layout/AppLayout.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

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