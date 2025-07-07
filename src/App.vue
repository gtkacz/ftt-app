<template>
  <v-app>
    <AppLayout />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRouter } from "vue-router";
import AppLayout from './components/layout/AppLayout.vue';

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await authStore.refreshAccessToken();
    } catch (error) {
      authStore.logout();
      router.push("/login");
    }
  }
});
</script>