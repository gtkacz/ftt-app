<template>
  <!-- Hamburger menu button for mobile -->
  <v-btn v-if="mobile && !navigationStore.isNavigationExpanded" icon variant="text" color="secondary"
    class="hamburger-menu" @click="navigationStore.toggleNavigation">
    <v-icon icon="menu" />
  </v-btn>

  <!-- Click-outside overlay for mobile -->
  <div v-if="mobile && navigationStore.isNavigationExpanded" class="nav-overlay"
    @click="navigationStore.toggleNavigation"></div>

  <!-- Navigation sidebar -->
  <nav v-if="!mobile || navigationStore.isNavigationExpanded" class="app-navigation" :class="{
    'expanded': isHovered || (mobile && navigationStore.isNavigationExpanded),
    'mobile': mobile,
    'mobile-open': mobile && navigationStore.isNavigationExpanded
  }" @mouseenter="!mobile && handleMouseEnter()" @mouseleave="!mobile && handleMouseLeave()">
    <div class="nav-logo">
      <LogoNav label="Fantasy Trash Talk" :expanded="isHovered || (mobile && navigationStore.isNavigationExpanded)" />
    </div>

    <div class="nav-items">
      <div v-for="(group, index) in navigationGroups" :key="index" class="nav-group">
        <div>
          <div class="nav-group-header"
            :class="{ 'expanded': isHovered || (mobile && navigationStore.isNavigationExpanded) }">
            <div v-if="isHovered || (mobile && navigationStore.isNavigationExpanded)" class="nav-group-title"
              :class="{ 'hovered': isHovered || (mobile && navigationStore.isNavigationExpanded) }">{{ group.title }}
            </div>
            <div class="nav-divider"
              :class="{ 'expanded': isHovered || (mobile && navigationStore.isNavigationExpanded) }"></div>
          </div>

          <NavItem v-for="item in group.items" :key="item.name" :icon="item.icon" :label="item.label"
            :to="{ name: item.routeName, params: item.params || {} }" :expanded="isHovered || (mobile && navigationStore.isNavigationExpanded)"
            :commission_only="item.commission_only ?? false" :disabled="item.disabled ?? false"
            @click="mobile && navigationStore.toggleNavigation()" />
        </div>
      </div>
    </div>
    <div v-if="isHovered || (mobile && navigationStore.isNavigationExpanded)" class="nav-footer">
      <a href="https://github.com/gtkacz/ftt-app" target="_blank">v{{ version }}</a>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useNavigationStore } from '@/stores/navigation'
import NavItem from '@/components/navigation/NavItem.vue'
import LogoNav from '@/components/navigation/LogoNav.vue'

const version = __APP_VERSION__
const { mobile } = useDisplay()
const navigationStore = useNavigationStore()

const isHovered = ref(false)

// Navigation structure data
const navigationGroups = [
  {
    title: 'General',
    items: [
      {
        icon: 'home',
        label: 'Home',
        routeName: 'home'
      },
      {
        icon: 'dashboard',
        label: 'Dashboard',
        routeName: 'dashboard',
      },
      {
        icon: 'person_play',
        label: 'My Team',
        routeName: 'team',
        params: { id: '2' }
      },
    ]
  },
  {
    title: 'Rosters',
    items: [
      {
        icon: 'model_training',
        label: 'League Draft',
        routeName: 'league-draft'
      },
      {
        icon: 'sports_basketball',
        label: 'League',
        routeName: 'league',
        disabled: true
      },
      {
        icon: 'clinical_notes',
        label: 'Players',
        routeName: 'players',
      },
      {
        icon: 'swap_horiz',
        // icon: 'handshake',
        label: 'Trades',
        routeName: 'trades',
        disabled: true
      },
    ]
  },
  {
    title: 'Draft',
    items: [
      {
        icon: 'workspaces',
        label: 'Draft',
        routeName: 'draft',
        disabled: true
      },
      {
        icon: 'interests',
        label: 'Big Board',
        routeName: 'big-board',
        disabled: true
      },
      {
        icon: 'format_list_numbered',
        label: 'Lottery',
        routeName: 'lottery',
        disabled: true
      },
    ]
  },
  {
    title: 'Account',
    items: [
      {
        icon: 'manage_accounts',
        label: 'Commission',
        routeName: 'commission',
        commission_only: true
      },
      {
        icon: 'settings',
        label: 'Settings',
        routeName: 'settings'
      },
    ]
  }
]

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}
</script>

<style lang="scss" scoped>
.hamburger-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 65px;
  width: auto;
  aspect-ratio: 1;
  z-index: 1010;
}

.app-navigation {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 64px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.3s ease;
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  
  &>* {
    width: 100%;
  }
  
  &.mobile {
    z-index: 1999;
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow: auto;
  }

  &.mobile-open {
    transition: transform 0.3s ease;
    transform: translateY(0);
    transform: translateX(0);
  }

  &.expanded:not(.mobile) {
    animation: expandFromLeft 0.3s ease forwards;
  }

  &:not(.expanded):not(.mobile) {
    animation: shrinkToLeft 0.3s ease forwards;
  }
}

.nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  z-index: 900;
}

@keyframes expandFromLeft {
  from {
    width: 64px;
  }

  to {
    width: 240px;
  }
}

@keyframes shrinkToLeft {
  from {
    width: 240px;
  }

  to {
    width: 64px;
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 8px;
  position: relative;
  justify-content: center;
  gap: 16px;

  .nav-title-wrapper {
    width: calc(100% - 64px);
    display: flex;
    align-items: center;
  }

  .nav-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    font-weight: bolder;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.hovered {
      opacity: 1;
    }
  }
}

.nav-items {
  flex: 1;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-header {
  position: relative;
  height: 32px;
  margin-bottom: 4px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;

  &.expanded {
    align-items: inherit;
  }
}

.nav-group-title {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 16px;
  opacity: 0;
  transition: opacity 0.1s ease;
  background-color: rgb(var(--v-theme-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.hovered {
    opacity: 1;
    z-index: 999;
  }
}

.nav-divider {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 1px;
  width: calc(100% - 32px);
  background-color: rgba(255, 255, 255, 0.1);
  transition: width 0.1s ease;

  &.expanded {
    right: 0;
    margin-right: 3px;
  }
}

.nav-footer {
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 1ch;
  padding: 10px 15px;
  display: inline-flex;

  & a {
    text-decoration: none;
    color: inherit;
  }
}
</style>