<template>
  <div class="nav-item">
    <div class="nav-item-content" :class="{ expanded }">
      <app-logo />
      <transition name="fade">
        <span
          v-if="expanded"
          class="nav-item-label text-secondary"
        >
          {{ label }}
        </span>
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

<style scoped lang="scss">
.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0 8px;
  min-width: 0;
  justify-content: center;

  &.expanded {
    justify-content: flex-start;
    padding-left: 16px;
  }
}

.nav-item-label {
  font-weight: bolder;
  white-space: nowrap;
  max-width: 140px;
  font-size: clamp(0.65rem, 1.5vw, 1rem);
}
</style>
