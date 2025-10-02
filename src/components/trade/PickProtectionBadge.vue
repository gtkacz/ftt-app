<template>
  <v-tooltip :text="tooltipText" location="top">
    <template #activator="{ props }">
      <v-chip
        v-if="protectionType !== 'none'"
        v-bind="props"
        :color="chipColor"
        size="small"
        variant="flat"
        :prepend-icon="chipIcon"
        class="pick-protection-badge"
      >
        {{ chipText }}
      </v-chip>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PickProtectionType } from '@/types/trade';

interface Props {
  protectionType: PickProtectionType;
  rangeStart?: number;
  rangeEnd?: number;
  rolloverYear?: number;
}

const props = defineProps<Props>();

const chipColor = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return 'info';
    case 'swap_worst':
      return 'warning';
    case 'doesnt_convey':
      return 'primary';
    default:
      return 'default';
  }
});

const chipIcon = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return 'swap_vert';
    case 'swap_worst':
      return 'swap_vert';
    case 'doesnt_convey':
      return 'shield';
    default:
      return '';
  }
});

const chipText = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return 'Swap ↑';
    case 'swap_worst':
      return 'Swap ↓';
    case 'doesnt_convey':
      if (props.rangeStart && props.rangeEnd) {
        return `Top-${props.rangeEnd} Protected`;
      }
      return 'Protected';
    default:
      return '';
  }
});

const tooltipText = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return 'Swaps with target pick if this pick is better (lower number)';
    case 'swap_worst':
      return 'Swaps with target pick if this pick is worse (higher number)';
    case 'doesnt_convey':
      if (props.rangeStart && props.rangeEnd && props.rolloverYear) {
        return `If pick falls between #${props.rangeStart}-${props.rangeEnd}, it stays with original team and rolls to ${props.rolloverYear}`;
      }
      return 'Pick has protection conditions';
    default:
      return '';
  }
});
</script>

<style scoped lang="scss">
.pick-protection-badge {
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
