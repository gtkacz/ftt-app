<template>
  <!-- TODO: REMOVE FALSE CHECK -->
  <span class="nav-item-content disabled" v-if="disabled && !(user && user.is_superuser && false)">
    <v-icon class="nav-icon" :icon="icon" theme="outlined" />
    <span v-if="expanded" class="nav-item-label">{{ label }}</span>
  </span>
  <router-link :to="to" class="nav-item" :class="{ active: isActive }" custom
    v-slot="{ navigate, isActive: linkIsActive }" v-else-if="!commission_only || (user && user.is_staff)">
    <div class="nav-item-content" @click="navigate" :class="{ active: linkIsActive && to.name !== '404', expanded }">
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
  expanded: boolean,
  commission_only?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()
const route = useRoute()

const user = computed(() => localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null)

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
</style>