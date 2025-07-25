<template>
  <div class="nav-logo-content" :class="{ expanded }">
    <app-logo class="logo-icon" />
    <transition name="fade">
      <span v-if="expanded" class="logo-label">{{ label }}</span>
    </transition>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  expanded: boolean
}
const props = defineProps<Props>()
const { label, expanded } = props
</script>

<style scoped lang="scss">
.nav-logo-content {
  position: relative;
  width: 64px;
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
  left: 64px;
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
