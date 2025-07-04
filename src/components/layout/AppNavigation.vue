<template>
  <nav class="app-navigation" :class="{ 'expanded': isHovered }" @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave">
    <!-- Logo -->
    <div class="nav-logo">
      <img src="https://a.espncdn.com/combiner/i?img=/i/fantasy/fba.png&w=288&h=288&transparent=true" alt="">
    </div>

    <!-- Navigation Items -->
    <div class="nav-items">
      <div v-for="(group, index) in navigationGroups" :key="index" class="nav-group">
        <div class="nav-group-header">
          <div class="nav-group-title" :class="{ 'visible': isHovered }">{{ group.title }}</div>
          <div class="nav-divider" :class="{ 'visible': !isHovered }"></div>
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
      }
    ]
  },
  {
    title: 'Draft',
    items: [
      {
        icon: 'description',
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
    title: 'Settings',
    items: [
      {
        icon: 'settings',
        label: 'Settings',
        name: 'Settings'
      }
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

  &.expanded {
    width: 240px;
  }

  @media (max-width: 768px) {
    transform: translateX(-100%);

    &.expanded {
      transform: translateX(0);
    }
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  padding: 8px;

  img {
    width: 4vh;
    height: auto;
    aspect-ratio: 1 / 1;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.1);
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
  height: 32px; // Fixed height to prevent layout shift
  margin-bottom: 4px;
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
  transition: opacity 0.3s ease;
}

.nav-divider {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 1px;
  width: calc(100% - 32px);
  left: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  opacity: 0;
}

.visible {
  opacity: 1;
}
</style>