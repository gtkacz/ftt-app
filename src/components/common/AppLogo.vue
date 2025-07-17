<template>
  <img src="https://a.espncdn.com/combiner/i?img=/i/fantasy/fba.png&w=288&h=288&transparent=true"
    alt="Fantasy Trash Talk" :class="{ 'app-logo' : isReactive }" :style="{ width: logoSize, height: logoSize }" />
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  size?: string;
  reactive?: boolean;
}>();

const logoSize = props.size || '32px';
const isReactive = props.reactive || true;
</script>

<style lang="scss" scoped>
.app-logo {
  transition: transform 0.3s ease;
  z-index: 2;

  &:hover {
    transform: scale(1.1);
  }
}
</style>