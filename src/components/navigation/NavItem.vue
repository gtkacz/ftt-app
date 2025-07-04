<template>
  <router-link
    :to="to"
    class="nav-item"
    :class="{ active: isActive }"
    custom
    v-slot="{ navigate, isActive: linkIsActive }"
  >
    <div
      class="nav-item-content"
      @click="navigate"
      :class="{ active: linkIsActive, centralize: !expanded }"
    >
      <div class="nav-item-icon">
        <!-- <v-icon :icon="`mdi-${icon}`" size="24" /> -->
        <span class="material-icons-round">{{ icon }}</span>
      </div>
      <transition name="fade">
        <span v-if="expanded" class="nav-item-label">{{ label }}</span>
      </transition>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import 'material-icons/iconfont/material-icons.css';

interface Props {
  icon: string
  label: string
  to: RouteLocationRaw
  expanded: boolean
}

const props = defineProps<Props>()
const route = useRoute()

const isActive = computed(() => {
  if (typeof props.to === 'string') {
    return route.path === props.to
  }
  if (props.to.name) {
    return route.name === props.to.name
  }
  return false
})
</script>

<style lang="scss" scoped>
.nav-item {
  text-decoration: none;
  color: inherit;
}

.nav-item-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);

  &.centralize {
    justify-content: center;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
  
  &.active {
    background-color: rgba(var(--v-theme-secondary), 0.2);
    color: rgb(var(--v-theme-secondary));
    
    &:hover {
      background-color: rgba(var(--v-theme-secondary), 0.3);
    }
  }
}

.nav-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.nav-item-label {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>