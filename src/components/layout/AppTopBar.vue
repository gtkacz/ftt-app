<template>
  <header class="app-top-bar">
    <div class="top-bar-content">
      <!-- Spacer -->
      <div class="spacer"></div>

      <!-- User Actions -->
      <div class="user-actions">
        <!-- Theme Toggle -->
        <theme-changer />

        <!-- Notifications -->
        <v-btn icon variant="text" @click="toggleNotifications" class="action-btn">
          <v-icon icon="notifications" />
          <v-badge v-if="notificationCount > 0" :content="notificationCount" color="secondary"
            class="notification-badge" />
        </v-btn>

        <!-- User Profile Menu -->
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn icon variant="text" v-bind="props" class="action-btn">
              <v-avatar size="32" color="secondary">
                <span class="text-h7">{{ initials }}</span>
              </v-avatar>
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click="navigateToProfile">
              <template v-slot:prepend>
                <v-icon icon="person" />
              </template>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleLogout">
              <template v-slot:prepend>
                <v-icon icon="logout" />
              </template>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const navigationStore = useNavigationStore()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const notificationCount = computed(() => 3) // Mock notification count

const initials = computed(() => {
  const name = user.value ? user.value.first_name + ' ' + user.value.last_name : '';
  if (!user || name.length < 2) {
    return '?'
  }
  let splitted = name.split(' ')
  if (splitted.length == 1) {
    return splitted[0][0].toUpperCase() + splitted[0][1].toLowerCase()
  }
  return (splitted[0][0] + splitted[splitted.length - 1][0]).toUpperCase()
})

const toggleNotifications = () => {
  navigationStore.toggleNotifications()
}

const navigateToProfile = () => {
  router.push({ name: 'profile' })
}

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.app-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 65px;
  background-color: transparent;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  z-index: 1000;

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