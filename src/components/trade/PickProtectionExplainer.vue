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
        <div class="text-caption text-medium-emphasis mb-2">Examples:</div>
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
import type { PickProtectionType } from '@/types/trade';

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
      return 'Swap if Best Protection';
    case 'swap_worst':
      return 'Swap if Worst Protection';
    case 'doesnt_convey':
      return 'Doesn\'t Convey Protection';
    default:
      return 'No Protection';
  }
});

const explanation = computed(() => {
  switch (props.protectionType) {
    case 'swap_best':
      return `If this pick ends up better (lower number) than ${props.swapTargetName || 'the swap target'}, the teams will swap picks. The team receiving this pick gets the worse of the two picks.`;
    case 'swap_worst':
      return `If this pick ends up worse (higher number) than ${props.swapTargetName || 'the swap target'}, the teams will swap picks. The team receiving this pick gets the better of the two picks.`;
    case 'doesnt_convey':
      return `If this pick lands between #${props.rangeStart}-${props.rangeEnd}, it doesn't transfer. The original team keeps it, and a new pick is created for ${props.rolloverYear}.`;
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
          text: `This pick is #15, target is #3 → No swap (15 > 3). Receiver gets #15.`
        },
        {
          icon: 'swap_horiz',
          color: 'warning',
          text: `This pick is #3, target is #15 → Swap! (3 < 15). Receiver gets #15.`
        }
      ];
    case 'swap_worst':
      return [
        {
          icon: 'check_circle',
          color: 'success',
          text: `This pick is #3, target is #15 → No swap (3 < 15). Receiver gets #3.`
        },
        {
          icon: 'swap_horiz',
          color: 'warning',
          text: `This pick is #15, target is #3 → Swap! (15 > 3). Receiver gets #3.`
        }
      ];
    case 'doesnt_convey':
      return [
        {
          icon: 'shield',
          color: 'primary',
          text: `Pick is #3 (in protected range) → Doesn't convey. Original team keeps it, ${props.rolloverYear} pick created.`
        },
        {
          icon: 'check_circle',
          color: 'success',
          text: `Pick is #12 (outside range) → Conveys normally to receiving team.`
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
