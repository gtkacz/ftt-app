<template>
  <nav class="app-navigation" :class="{ 'expanded': isHovered }" @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave">
    <div class="nav-logo" :class="{ 'expanded': isHovered }">
      <img src="https://a.espncdn.com/combiner/i?img=/i/fantasy/fba.png&w=288&h=288&transparent=true" alt="ftt">
      <div class="nav-title-wrapper">
        <div class="nav-title" :class="{ 'hovered': isHovered }">Fantasy Trash Talk</div>
      </div>
    </div>

    <div class="nav-items">
      <div v-for="(group, index) in navigationGroups" :key="index" class="nav-group">
        <div class="nav-group-header" :class="{ 'expanded': isHovered }">
          <div v-if="isHovered" class="nav-group-title" :class="{ 'hovered': isHovered }">{{ group.title }}</div>
          <div class="nav-divider" :class="{ 'expanded': isHovered }"></div>
        </div>

        <NavItem v-for="item in group.items" :key="item.name" :icon="item.icon" :label="item.label"
          :to="{ name: item.name }" :expanded="isHovered" />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NavItem from '../navigation/NavItem.vue'

const isHovered = ref(false)

// Navigation structure data
const navigationGroups = [
  {
    title: 'Main',
    items: [
      {
        icon: 'home',
        label: 'Home',
        name: 'Home'
      },
      {
        icon: 'workspaces',
        label: 'Dashboard',
        name: 'dashboard'
      },
      {
        icon: 'sports_basketball',
        label: 'My Team',
        name: 'team'
      },
    ]
  },
  {
    title: 'Free Agency',
    items: [
      {
        icon: 'people_alt',
        label: 'Free Agents',
        name: 'free-agency'
      },
      {
        icon: 'contacts',
        label: 'League',
        name: 'league'
      },
    ]
  },
  {
    title: 'Draft',
    items: [
      {
        icon: 'checklist',
        label: 'Draft',
        name: 'Draft'
      },
      {
        icon: 'dashboard',
        label: 'Big Board',
        name: 'BigBoard'
      }
    ]
  },
  {
    title: 'Account',
    items: [
      {
        icon: 'manage_accounts',
        label: 'Admin',
        name: 'admin',
        admin_only: true
      },
      {
        icon: 'settings',
        label: 'Settings',
        name: 'Settings'
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
.app-navigation {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 64px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  justify-content: center;

  &>* {
    width: 100%;
  }


  &.expanded {
    animation: expandFromLeft 0.3s ease forwards;
  }

  &:not(.expanded) {
    animation: shrinkToLeft 0.3s ease forwards;
  }

  @media (max-width: 768px) {
    transform: translateX(-100%);

    &.expanded {
      transform: translateX(0);
    }
  }
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  padding: 16px 8px;
  position: relative;
  justify-content: center;
  
  img {
    position: absolute;
    width: 32px;
    height: 32px;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 2;

    &:hover {
      transform: scale(1.1);
    }
  }

  .nav-title-wrapper {
    position: absolute;
    left: 64px;
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
  background-color: var(--primary-color);
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
</style>