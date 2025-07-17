<template>
  <div class="nav-item">
    <div class="nav-item-content">
      <app-logo />
      <transition name="fade">
        <span v-if="expanded" class="nav-item-label">{{ label }}</span>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  expanded: boolean
}

const props = defineProps<Props>()
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
  border-radius: 8px;
  color: var(--v-theme-on-primary);
  position: relative;
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
  left: 48px;
  font-size: 16px;
  font-weight: bolder;
  white-space: nowrap;
  cursor: default;
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