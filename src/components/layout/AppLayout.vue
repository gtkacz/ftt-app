<template>
  <div class="app-layout">
    <!-- Main Navigation (apenas quando autenticado) -->
    <AppNavigation v-if="isAuthenticated" />
    
    <!-- Top Bar -->
    <AppTopBar v-if="isAuthenticated" />
    
    <!-- Main Content -->
    <main class="main-content" :class="{ 'full-width': !isAuthenticated }">
      <router-view />
    </main>
    
    <!-- Notification Overlay -->
    <NotificationOverlay />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppNavigation from './AppNavigation.vue';
import AppTopBar from './AppTopBar.vue';
import NotificationOverlay from '../overlays/NotificationOverlay.vue';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
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