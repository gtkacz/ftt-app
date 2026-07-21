<template>
  <img src="@/assets/logo.png" :width="size" :height="size" alt="Fantasy Trash Talk"
    :class="{ 'app-logo--reactive': reactive }" :style="{ width: size, height: size }" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: string;
  reactive?: boolean;
}>(), {
  size: '32px',
  reactive: true,
});
</script>

<style lang="scss" scoped>
.app-logo--reactive {
  transition: transform 0.3s ease;
  z-index: 2;

  &:hover {
    transform: scale(1.1);
  }
}

@media (hover: none) {
  .app-logo--reactive:hover {
    transform: none;
  }
}
</style>
