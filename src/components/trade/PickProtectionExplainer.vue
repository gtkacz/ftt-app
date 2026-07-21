<template>
  <v-card v-if="protectionType !== 'none'" flat class="pick-protection-explainer">
    <v-card-text>
      <div class="d-flex align-center mb-2">
        <v-icon :icon="icon" :color="color" size="small" class="mr-2" />
        <span class="text-subtitle-2 font-weight-bold">{{ title }}</span>
      </div>

      <v-alert
        :color="color"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ explanation }}
      </v-alert>

      <div v-if="examples.length" class="examples">
        <div class="text-caption text-medium-emphasis mb-2">{{ t('pickProtectionExplainer.examplesLabel') }}</div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="(example, index) in examples"
            :key="index"
            class="px-0"
            density="compact"
          >
            <template #prepend>
              <v-icon :icon="example.icon" size="x-small" :color="example.color" class="mr-2" />
            </template>
            <v-list-item-title class="text-caption">
              {{ example.text }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
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
  swapTargetName?: string;
}

const props = defineProps<Props>();

const color = computed(() => {
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

const icon = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return 'swap_vert';
    case 'swap_worst':
      return 'swap_vert';
    case 'doesnt_convey':
      return 'shield';
    default:
      return 'info';
  }
});

const title = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return t('pickProtectionExplainer.title.swapBest');
    case 'swap_worst':
      return t('pickProtectionExplainer.title.swapWorst');
    case 'doesnt_convey':
      return t('pickProtectionExplainer.title.doesntConvey');
    default:
      return t('pickProtectionExplainer.title.none');
  }
});

const explanation = computed(() => {
  const target = props.swapTargetName || t('pickProtectionExplainer.explanation.swapTargetDefault');
  switch (props.protectionType) {
    case 'swap_best':
      return t('pickProtectionExplainer.explanation.swapBest', { target });
    case 'swap_worst':
      return t('pickProtectionExplainer.explanation.swapWorst', { target });
    case 'doesnt_convey':
      return t('pickProtectionExplainer.explanation.doesntConvey', {
        start: props.rangeStart,
        end: props.rangeEnd,
        year: props.rolloverYear,
      });
    default:
      return '';
  }
});

const examples = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return [
        {
          icon: 'check_circle',
          color: 'success',
          text: t('pickProtectionExplainer.examples.swapBest.noSwap')
        },
        {
          icon: 'swap_horiz',
          color: 'warning',
          text: t('pickProtectionExplainer.examples.swapBest.swap')
        }
      ];
    case 'swap_worst':
      return [
        {
          icon: 'check_circle',
          color: 'success',
          text: t('pickProtectionExplainer.examples.swapWorst.noSwap')
        },
        {
          icon: 'swap_horiz',
          color: 'warning',
          text: t('pickProtectionExplainer.examples.swapWorst.swap')
        }
      ];
    case 'doesnt_convey':
      return [
        {
          icon: 'shield',
          color: 'primary',
          text: t('pickProtectionExplainer.examples.doesntConvey.inRange', { year: props.rolloverYear })
        },
        {
          icon: 'check_circle',
          color: 'success',
          text: t('pickProtectionExplainer.examples.doesntConvey.outOfRange')
        }
      ];
    default:
      return [];
  }
});
</script>

<style scoped lang="scss">
.pick-protection-explainer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  .examples {
    .v-list-item {
      min-height: auto;
      padding-top: 4px;
      padding-bottom: 4px;
    }
  }
}
</style>
