<template>
  <header class="app-top-bar" :class="{ 'with-navigation': withNavigation }">
    <div class="top-bar-content">
      <router-link :to="{ name: 'home' }" class="top-bar-brand d-md-none">
        <app-logo size="28px" :reactive="false" />
        <span class="top-bar-brand__name">FTT</span>
      </router-link>

      <div class="top-bar-context d-none d-md-flex">
        <span class="top-bar-context__eyebrow">League workspace</span>
        <span class="top-bar-context__title">{{ teamName }}</span>
      </div>

      <div class="spacer"></div>

      <div class="user-actions">
        <theme-changer />
        <notification-menu />
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn icon variant="text" v-bind="props" class="action-btn" aria-label="Open account menu">
              <v-avatar size="32" color="secondary">
                <span class="avatar-initials">{{ initials }}</span>
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

defineProps<{
  withNavigation?: boolean
}>()

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const teamName = computed(() => user.value?.team?.name || 'Fantasy Trash Talk')

const initials = computed(() => {
  const parts = [user.value?.first_name, user.value?.last_name].filter(Boolean) as string[]
  if (parts.length === 0) {
    return user.value?.username?.slice(0, 2).toUpperCase() || '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts.at(-1)![0]).toUpperCase()
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
  height: calc(#{$top-bar-height} + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  background-color: rgba(var(--v-theme-background), 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  z-index: 1000;

  &.with-navigation {
    left: $navigation-rail-width;
  }

  @media (max-width: #{$breakpoint-md - 1px}) {
    height: calc(#{$top-bar-height-mobile} + env(safe-area-inset-top));
  }
}

.top-bar-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 clamp(16px, 2.5vw, 32px);
  padding-left: max(clamp(16px, 2.5vw, 32px), env(safe-area-inset-left));
  padding-right: max(clamp(16px, 2.5vw, 32px), env(safe-area-inset-right));
}

.top-bar-context {
  flex-direction: column;
  justify-content: center;
  min-width: 0;

  &__eyebrow {
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    line-height: 1.1;
    text-transform: uppercase;
  }

  &__title {
    overflow: hidden;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.95rem;
    font-weight: 650;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.top-bar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;

  &__name {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: rgb(var(--v-theme-on-surface));
  }
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

.avatar-initials {
  color: rgb(var(--v-theme-on-secondary));
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
</style>
