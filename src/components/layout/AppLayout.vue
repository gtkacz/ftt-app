<template>
  <div class="app-layout">
    <!-- Main Navigation -->
    <AppNavigation />
    
    <!-- Top Bar -->
    <AppTopBar />
    
    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Notification Overlay -->
    <NotificationOverlay />
  </div>
</template>

<script setup lang="ts">
import AppNavigation from './AppNavigation.vue'
import AppTopBar from './AppTopBar.vue'
import NotificationOverlay from '../overlays/NotificationOverlay.vue'
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
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
}
</style>