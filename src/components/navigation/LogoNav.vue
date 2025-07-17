<template>
  <div class="nav-item">
    <div class="nav-item-content">
      <app-logo />
      <transition name="fade">
        <span v-if="expanded" class="nav-item-label text-secondary">{{ label }}</span>
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
</style>