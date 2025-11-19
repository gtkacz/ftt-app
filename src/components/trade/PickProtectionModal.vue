<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="shield" class="mr-2" />
        Pick Protection
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-select
          v-model="localProtection.type"
          label="Protection Type"
          :items="protectionTypes"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          @update:model-value="onProtectionTypeChange"
        >
          <template #item="{ item, props: itemProps }">
            <v-list-item v-bind="itemProps">
              <template #prepend>
                <v-icon :icon="item.raw.icon" size="small" />
              </template>
              <v-list-item-title>{{ item.raw.label }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ item.raw.description }}
              </v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-select>

        <!-- Top X Protection Configuration -->
        <div v-if="localProtection.type === 'top_x'" class="mt-4">
          <v-text-field
            v-model.number="localProtection.value"
            label="Top X (Protected Range)"
            type="number"
            min="1"
            max="30"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required, rules.range]"
            hint="Pick is protected if it falls within top X picks"
            persistent-hint
          />
        </div>

        <!-- Protection Summary -->
        <v-alert
          v-if="localProtection.type !== 'unprotected'"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          <div class="text-caption">
            <strong>{{ getProtectionLabel(localProtection.type) }}:</strong>
            {{ getProtectionDescription(localProtection.type) }}
          </div>
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!isValid"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Pick } from '@/types/trade';

interface Props {
  modelValue: boolean;
  pick: Pick | null;
}

interface Protection {
  type: 'unprotected' | 'top_x' | 'swap_best' | 'swap_worst';
  value?: number; // For top_x
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'save': [protection: Protection];
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const localProtection = ref<Protection>({
  type: 'unprotected',
  value: undefined,
});

const protectionTypes = [
  {
    value: 'unprotected',
    label: 'Unprotected',
    description: 'Pick transfers normally',
    icon: 'cancel',
  },
  {
    value: 'top_x',
    label: 'Top X Protected',
    description: 'Pick is protected if it falls within top X picks',
    icon: 'shield',
  },
  {
    value: 'swap_best',
    label: 'Swap if Best',
    description: 'Swap with receiving team if this pick is better',
    icon: 'swap_vert',
  },
  {
    value: 'swap_worst',
    label: 'Swap if Worst',
    description: 'Swap with receiving team if this pick is worse',
    icon: 'swap_vert',
  },
];

const rules = {
  required: (v: any) => !!v || 'This field is required',
  range: (v: number) => (v >= 1 && v <= 30) || 'Must be between 1 and 30',
};

const isValid = computed(() => {
  if (localProtection.value.type === 'unprotected') return true;
  if (localProtection.value.type === 'top_x') {
    return localProtection.value.value !== undefined && 
           localProtection.value.value >= 1 && 
           localProtection.value.value <= 30;
  }
  // swap_best and swap_worst don't need additional values
  return true;
});

function onProtectionTypeChange() {
  // Reset value when protection type changes
  localProtection.value.value = undefined;
  
  // Set default for top_x
  if (localProtection.value.type === 'top_x') {
    localProtection.value.value = 5; // Default to top 5
  }
}

function getProtectionLabel(type: string): string {
  const protection = protectionTypes.find(p => p.value === type);
  return protection?.label || type;
}

function getProtectionDescription(type: string): string {
  if (type === 'top_x' && localProtection.value.value) {
    return `This pick is protected if it falls within the top ${localProtection.value.value} picks.`;
  }
  const protection = protectionTypes.find(p => p.value === type);
  return protection?.description || '';
}

function save() {
  if (!isValid.value) return;
  emit('save', { ...localProtection.value });
  dialog.value = false;
}

function cancel() {
  dialog.value = false;
}

// Initialize with pick's current protection
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.pick) {
    // Get protection from asset if available, otherwise from pick
    const protectionType = (props.pick as any).protection_type || 
                          (props.pick as any).pick_detail?.protection_type || 
                          'unprotected';
    const protectionValue = (props.pick as any).protection_value || 
                           (props.pick as any).pick_detail?.protection_value;
    
    localProtection.value = {
      type: protectionType as any,
      value: protectionValue,
    };
    
    // Set default for top_x if needed
    if (localProtection.value.type === 'top_x' && !localProtection.value.value) {
      localProtection.value.value = 5;
    }
  } else if (!newValue) {
    // Reset when dialog closes
    localProtection.value = {
      type: 'unprotected',
      value: undefined,
    };
  }
});
</script>

