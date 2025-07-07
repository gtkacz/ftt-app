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
      :class="{ active: linkIsActive && to.name !== '404', expanded }"
    >
      <v-icon class="nav-icon" :icon="icon" theme="outlined" />
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
    return route.path === props.to && route.path !== '/404'
  }
  if (props.to.name) {
    return route.name === props.to.name && route.name !== '404' && props.to.name !== '404'
  }
  return false
})
</script>

<style lang="scss" scoped>
.nav-item {
  text-decoration: none;
  color: inherit;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.nav-item-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 224px;
  padding: 10px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);
  position: relative;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255);
  }
  
  &.active {
    background-color: rgba(var(--v-theme-secondary), 0.2);
    color: rgb(var(--v-theme-secondary));
    
    &:hover {
      background-color: rgba(var(--v-theme-secondary), 0.3);
    }
  }
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  min-width: 48px;
  font-size: 24px;
}

.nav-item-label {
  position: absolute;
  left: 56px;
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