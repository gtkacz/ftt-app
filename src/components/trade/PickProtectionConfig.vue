<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="lock" class="mr-2" />
        {{ t('pickProtectionConfig.title') }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-select
          v-model="localProtection.type"
          :label="t('pickProtectionConfig.protectionTypeLabel')"
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

        <!-- Swap Protection Configuration -->
        <div v-if="localProtection.type === 'swap_best' || localProtection.type === 'swap_worst'" class="mt-4">
          <v-autocomplete
            v-model="localProtection.swapTarget"
            :label="t('pickProtectionConfig.swapTargetLabel')"
            :items="availableSwapTargets"
            item-title="display_name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
            clearable
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <v-list-item-title>{{ item.raw.display_name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ item.raw.current_team.name }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-autocomplete>

          <v-alert v-if="swapError" type="error" variant="tonal" density="compact" class="mt-2">
            {{ swapError }}
          </v-alert>
        </div>

        <!-- Doesn't Convey Protection Configuration -->
        <div v-if="localProtection.type === 'doesnt_convey'" class="mt-4">
          <div class="d-flex gap-3 mb-3">
            <v-text-field
              v-model.number="localProtection.rangeStart"
              :label="t('pickProtectionConfig.rangeStartLabel')"
              type="number"
              min="1"
              max="30"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.range]"
            />
            <v-text-field
              v-model.number="localProtection.rangeEnd"
              :label="t('pickProtectionConfig.rangeEndLabel')"
              type="number"
              min="1"
              max="30"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required, rules.range]"
            />
          </div>

          <v-text-field
            v-model.number="localProtection.rolloverYear"
            :label="t('pickProtectionConfig.rolloverYearLabel')"
            type="number"
            :min="pick.draft_year + 1"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required, rules.futureYear]"
            :hint="t('pickProtectionConfig.rolloverYearHint')"
            persistent-hint
          />

          <v-alert v-if="conveyError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ conveyError }}
          </v-alert>
        </div>

        <!-- Protection Summary -->
        <PickProtectionExplainer
          v-if="localProtection.type !== 'none'"
          class="mt-4"
          :protection-type="localProtection.type"
          :range-start="localProtection.rangeStart"
          :range-end="localProtection.rangeEnd"
          :rollover-year="localProtection.rolloverYear"
          :swap-target-name="selectedSwapTargetName"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancel"
        >
          {{ t('pickProtectionConfig.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!isValid"
          @click="save"
        >
          {{ t('pickProtectionConfig.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Pick, PickProtectionType } from '@/types/trade';
import PickProtectionExplainer from './PickProtectionExplainer.vue';

const { t } = useI18n();

interface Props {
  modelValue: boolean;
  pick: Pick;
  availablePicks?: Pick[];
}

interface Protection {
  type: PickProtectionType;
  swapTarget?: number;
  rangeStart?: number;
  rangeEnd?: number;
  rolloverYear?: number;
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
  type: 'none',
  swapTarget: undefined,
  rangeStart: undefined,
  rangeEnd: undefined,
  rolloverYear: undefined,
});

const protectionTypes = computed(() => [
  {
    value: 'none',
    label: t('pickProtectionConfig.types.none.label'),
    description: t('pickProtectionConfig.types.none.description'),
    icon: 'cancel',
  },
  {
    value: 'swap_best',
    label: t('pickProtectionConfig.types.swapBest.label'),
    description: t('pickProtectionConfig.types.swapBest.description'),
    icon: 'swap_vert',
  },
  {
    value: 'swap_worst',
    label: t('pickProtectionConfig.types.swapWorst.label'),
    description: t('pickProtectionConfig.types.swapWorst.description'),
    icon: 'swap_vert',
  },
  {
    value: 'doesnt_convey',
    label: t('pickProtectionConfig.types.doesntConvey.label'),
    description: t('pickProtectionConfig.types.doesntConvey.description'),
    icon: 'shield',
  },
]);

const availableSwapTargets = computed(() => {
  if (!props.availablePicks) return [];

  return props.availablePicks.filter(
    p => p.id !== props.pick.id &&
    p.draft_year === props.pick.draft_year &&
    p.round_number === props.pick.round_number
  );
});

const selectedSwapTargetName = computed(() => {
  if (!localProtection.value.swapTarget) return '';
  const target = availableSwapTargets.value.find(p => p.id === localProtection.value.swapTarget);
  return target?.display_name || '';
});

const swapError = computed(() => {
  if (!localProtection.value.swapTarget) {
    return t('pickProtectionConfig.errors.swapTargetRequired');
  }
  return null;
});

const conveyError = computed(() => {
  if (!localProtection.value.rangeStart || !localProtection.value.rangeEnd) {
    return t('pickProtectionConfig.errors.rangeRequired');
  }
  if (localProtection.value.rangeStart > localProtection.value.rangeEnd) {
    return t('pickProtectionConfig.errors.rangeOrder');
  }
  if (!localProtection.value.rolloverYear) {
    return t('pickProtectionConfig.errors.rolloverRequired');
  }
  if (localProtection.value.rolloverYear <= props.pick.draft_year) {
    return t('pickProtectionConfig.errors.rolloverFuture');
  }
  return null;
});

const isValid = computed(() => {
  if (localProtection.value.type === 'none') return true;
  if (localProtection.value.type === 'swap_best' || localProtection.value.type === 'swap_worst') {
    return !swapError.value;
  }
  if (localProtection.value.type === 'doesnt_convey') {
    return !conveyError.value;
  }
  return false;
});

const rules = {
  required: (v: any) => !!v || t('pickProtectionConfig.errors.fieldRequired'),
  range: (v: number) => (v >= 1 && v <= 30) || t('pickProtectionConfig.errors.rangeBounds'),
  futureYear: (v: number) => v > props.pick.draft_year || t('pickProtectionConfig.errors.futureYear'),
};

function onProtectionTypeChange() {
  // Reset values when protection type changes
  localProtection.value.swapTarget = undefined;
  localProtection.value.rangeStart = undefined;
  localProtection.value.rangeEnd = undefined;
  localProtection.value.rolloverYear = undefined;

  // Set default values for doesnt_convey
  if (localProtection.value.type === 'doesnt_convey') {
    localProtection.value.rangeStart = 1;
    localProtection.value.rangeEnd = 5;
    localProtection.value.rolloverYear = props.pick.draft_year + 1;
  }
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
  if (newValue) {
    localProtection.value = {
      type: props.pick.protection_type,
      swapTarget: typeof props.pick.swap_target_pick === 'object' ? props.pick.swap_target_pick?.id : props.pick.swap_target_pick,
      rangeStart: props.pick.protection_range_start,
      rangeEnd: props.pick.protection_range_end,
      rolloverYear: props.pick.rollover_year,
    };
  }
});
</script>
