<template>
  <div class="app-layout">
    <!-- Development Mode Warning -->
    <v-snackbar v-if="isDev" color="warning" v-model="isDev" timeout="5000" location="top" multi-line>
      <v-icon icon="warning" class="mr-2" size="large" />
      <span>App is running in dev mode</span>
    </v-snackbar>

    <!-- Main Navigation (apenas quando autenticado) -->
    <AppNavigation v-if="isAuthenticated && isApproved && hasTeam" />

    <!-- Top Bar -->
    <AppTopBar v-if="isAuthenticated" />
    <theme-changer v-else />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'full-width': !isAuthenticated }">
      <router-view />
    </main>

    <!-- Notification Overlay -->
    <NotificationOverlay />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import AppTopBar from '@/components/layout/AppTopBar.vue';
import NotificationOverlay from '@/components/overlays/NotificationOverlay.vue';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isApproved = computed(() => authStore.isApproved);
const hasTeam = computed(() => !!authStore.user.team);
const isDev = ref(import.meta.env.DEV);
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  margin-left: 64px; // Space for collapsed nav
  margin-top: 64px; // Space for top bar
  overflow-y: auto;
  padding: 24px;
  background-color: rgb(var(--v-theme-background));
  transition: margin-left 0.3s ease;

  &.full-width {
    margin-left: 0;
  }

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
}
</style>