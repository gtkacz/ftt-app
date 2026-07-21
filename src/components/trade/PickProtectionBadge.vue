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
import { useI18n } from 'vue-i18n';
import type { PickProtectionType } from '@/types/trade';

const { t } = useI18n();

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
      return t('pickProtectionBadge.chip.swapBest');
    case 'swap_worst':
      return t('pickProtectionBadge.chip.swapWorst');
    case 'doesnt_convey':
      if (props.rangeStart && props.rangeEnd) {
        return t('pickProtectionBadge.chip.topProtected', { range: props.rangeEnd });
      }
      return t('pickProtectionBadge.chip.protected');
    default:
      return '';
  }
});

const tooltipText = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return t('pickProtectionBadge.tooltip.swapBest');
    case 'swap_worst':
      return t('pickProtectionBadge.tooltip.swapWorst');
    case 'doesnt_convey':
      if (props.rangeStart && props.rangeEnd && props.rolloverYear) {
        return t('pickProtectionBadge.tooltip.doesntConvey', {
          start: props.rangeStart,
          end: props.rangeEnd,
          year: props.rolloverYear,
        });
      }
      return t('pickProtectionBadge.tooltip.protectionConditions');
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
