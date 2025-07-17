<template>
  <div class="page-view">
    <div v-if="authStore.isStaff" class="admin-container">
      <div class="page-header">
        <h1 class="page-title">Administrative Panel</h1>
      </div>
      <div class="side-submenu-layout">
        <nav class="side-nav-container">
          <v-list density="comfortable" class="pa-0 side-submenu">
            <v-list-item v-for="item in menuItems" :key="item.routeName" :to="{ name: 'commission-' + item.routeName }"
              :prepend-icon="item.icon" :title="item.title" :active="isActive(item.routeName)" class="submenu-item" :class="{ 'text-secondary': isActive(item.routeName) }"
              color="primary" rounded="lg">
            </v-list-item>
          </v-list>
        </nav>
        <main class="submenu-content">
          <router-view />
        </main>
      </div>
    </div>
    <div v-else class="unauthorized-container">
      <v-icon icon="mdi-shield-lock-outline" size="64" color="grey" />
      <h1 class="page-title">Administrative Panel</h1>
      <p class="page-subtitle">Sorry, the page you are looking for is only available to admins.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRoute } from 'vue-router'

const authStore = useAuthStore();

interface MenuItem {
  icon: string
  title: string
  routeName: string
}

const menuItems: MenuItem[] = [
  {
    icon: 'settings',
    title: 'League Settings',
    routeName: 'settings',
  },
  {
    icon: 'account_box',
    title: 'Users',
    routeName: 'users',
  },
  {
    icon: 'contacts',
    title: 'Teams',
    routeName: 'teams',
  },
  {
    icon: 'people_alt',
    title: 'Players',
    routeName: 'players',
  },
]

const route = useRoute()

const isActive = (routeName: string): boolean => {
  return route.name === 'commission-' + routeName
}
</script>

<style lang="scss" scoped>
.page-view {
  height: 100vh;
  overflow: hidden;
}

.admin-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.side-submenu-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

.side-submenu {
  width: 15vw;
  min-width: 260px;
  background-color: rgb(var(--v-theme-surface));
  height: 100%;
  position: sticky;
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }
}

.submenu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 10px 0;
  border-radius: 8px !important;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(0, 0, 0, 0.7);
  position: relative;

  &.disabled {
    cursor: not-allowed;
    color: rgba(0, 0, 0, 0.3);
  }

  &:hover:not(.disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0);
  }

  &.active:not(.disabled) {
    background-color: rgba(var(--v-theme-secondary), 0.2);
    color: rgb(var(--v-theme-secondary));

    &:hover:not(.disabled) {
      background-color: rgba(var(--v-theme-secondary), 0.3);
    }
  }
}

.submenu-content {
  flex: 1;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-background));
}

.unauthorized-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: 16px;

  .page-title {
    font-size: 1.75rem;
    margin-top: 8px;
  }

  .page-subtitle {
    color: rgba(var(--v-theme-on-surface), 0.7);
    font-size: 1.1rem;
    max-width: 400px;
  }
}

// Dark mode adjustments
:root[data-theme="dark"] {
  .side-nav-container {
    background-color: rgba(var(--v-theme-surface), 0.95);
    border-right-color: rgba(var(--v-border-color), 0.08);
  }

  .page-header {
    border-bottom-color: rgba(var(--v-border-color), 0.08);
  }

  .submenu-item:not(.v-list-item--active) {
    background-color: rgba(var(--v-theme-surface-variant), 0.2);
  }
}

// Scrollbar styling
.side-nav-container {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(var(--v-theme-on-surface), 0.2);
    }
  }
}

@media (max-width: 960px) {
  .side-submenu-layout {
    flex-direction: column;
  }

  .side-nav-container {
    width: 100%;
    min-width: unset;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
    padding: 12px;
  }

  .side-submenu {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .submenu-item {
    flex: 1 1 calc(50% - 8px);
    min-width: 160px;
  }

  .submenu-content {
    padding: 16px;
  }

  .page-header {
    padding: 16px 20px;
  }
}

@media (max-width: 600px) {
  .submenu-item {
    flex: 1 1 100%;
  }
}
</style>