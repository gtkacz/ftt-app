<template>
  <header class="app-top-bar">
    <div class="top-bar-content">
      <!-- Mobile Menu Button -->
      <v-btn
        icon
        variant="text"
        class="mobile-menu-btn d-sm-none"
        @click="toggleMobileNav"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      
      <!-- Spacer -->
      <div class="spacer"></div>
      
      <!-- User Actions -->
      <div class="user-actions">
        <!-- Theme Toggle -->
        <v-btn
          icon
          variant="text"
          @click="toggleTheme"
          class="action-btn"
        >
          <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
        
        <!-- Notifications -->
        <v-btn
          icon
          variant="text"
          @click="toggleNotifications"
          class="action-btn"
        >
          <v-icon>mdi-bell</v-icon>
          <v-badge
            v-if="notificationCount > 0"
            :content="notificationCount"
            color="secondary"
            class="notification-badge"
          />
        </v-btn>
        
        <!-- User Profile -->
        <v-btn
          icon
          variant="text"
          @click="navigateToProfile"
          class="action-btn"
        >
          <v-avatar size="32" color="secondary">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
        </v-btn>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useThemeStore } from '../../stores/theme'
import { useNavigationStore } from '../../stores/navigation'

const router = useRouter()
const theme = useTheme()
const themeStore = useThemeStore()
const navigationStore = useNavigationStore()

const isDark = computed(() => theme.global.current.value.dark)
const notificationCount = computed(() => 3) // Mock notification count

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  themeStore.toggleTheme()
}

const toggleNotifications = () => {
  navigationStore.toggleNotifications()
}

const toggleMobileNav = () => {
  navigationStore.toggleNavigation()
}

const navigateToProfile = () => {
  router.push({ name: 'User' })
}
</script>

<style lang="scss" scoped>
.app-top-bar {
  position: fixed;
  top: 0;
  left: 64px;
  right: 0;
  height: 64px;
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  z-index: 999;
  
  @media (max-width: 768px) {
    left: 0;
  }
}

.top-bar-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
}

.mobile-menu-btn {
  margin-right: 16px;
}

.spacer {
  flex: 1;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  position: relative;
  
  &:hover {
    background-color: rgba(var(--v-theme-secondary), 0.1);
  }
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>