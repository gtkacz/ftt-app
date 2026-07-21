<template>
  <div class="nav-logo-content" :class="{ expanded }">
    <app-logo class="logo-icon" :reactive="false" />
    <transition name="fade">
      <span v-if="expanded" class="logo-label">{{ label }}</span>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  expanded: boolean
}>()
</script>

<style scoped lang="scss">
.nav-logo-content {
  position: relative;
  width: $navigation-rail-width;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  overflow: visible;

  &.expanded {
    width: 240px;
    justify-content: flex-start;
    padding-left: 16px;
  }
}

.logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.logo-label {
  position: absolute;
  left: 66px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: bolder;
  white-space: nowrap;
  font-size: 1rem;
  line-height: 40px;
  opacity: 1;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
