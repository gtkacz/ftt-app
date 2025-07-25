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
        <notification-menu />

        <!-- User Profile Menu -->
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn icon variant="text" v-bind="props" class="action-btn">
              <v-avatar size="32" color="secondary">
                <span class="text-h7">{{ initials }}</span>
              </v-avatar>
            </v-btn>
          </template>

          <v-list>
            <v-list-item>
              <v-list-item-title class="text-caption ma-0">
                <p class="d-flex align-center flex-column flex-wrap">
                  Logged in as:
                  <span class="font-weight-bold">{{ user?.first_name }} {{ user?.last_name }}</span>
                </p>
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="navigateToProfile">
              <template #prepend>
                <v-icon icon="person" />
              </template>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleLogout">
              <template #prepend>
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
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import NotificationMenu from '@/components/core/NotificationMenu.vue'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

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
</style>