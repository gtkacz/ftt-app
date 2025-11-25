<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card v-if="pick">
      <v-card-title class="d-flex align-center py-3 px-4 bg-surface-light border-b">
        <v-icon start color="primary">shield</v-icon>
        Configure Protection
      </v-card-title>

      <v-card-text class="pt-4 pb-2">
        <div class="text-subtitle-1 font-weight-bold mb-1">
          {{ pick.draft_year }} Round {{ pick.round_number || pick.round }}
        </div>
        <div class="text-caption text-medium-emphasis mb-4">
           Originally via {{ getOriginalTeamName(pick) }}
        </div>

        <!-- Protection Type Selection -->
        <div class="mb-4">
          <label class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2 d-block">Protection Type</label>
          
          <v-item-group v-model="selectedType" mandatory class="d-flex flex-column gap-2">
            <!-- Unprotected -->
            <v-item v-slot="{ isSelected, toggle }" value="unprotected">
              <v-card
                border
                :color="isSelected ? 'primary-lighten-5' : undefined"
                :class="['d-flex align-center px-3 py-2 cursor-pointer', isSelected ? 'border-primary' : '']"
                variant="outlined"
                @click="toggle"
              >
                <v-icon :color="isSelected ? 'primary' : 'grey'" class="mr-3">
                  {{ isSelected ? 'radio_button_checked' : 'radio_button_unchecked' }}
                </v-icon>
                <div>
                  <div class="font-weight-bold text-body-2">Unprotected</div>
                  <div class="text-caption text-medium-emphasis">Pick conveys regardless of position</div>
                </div>
              </v-card>
            </v-item>

            <!-- Top X Protected -->
            <v-item v-slot="{ isSelected, toggle }" value="top_x">
              <v-card
                border
                 :color="isSelected ? 'primary-lighten-5' : undefined"
                :class="['d-flex align-center px-3 py-2 cursor-pointer', isSelected ? 'border-primary' : '']"
                variant="outlined"
                @click="toggle"
              >
                 <v-icon :color="isSelected ? 'primary' : 'grey'" class="mr-3">
                  {{ isSelected ? 'radio_button_checked' : 'radio_button_unchecked' }}
                </v-icon>
                <div>
                  <div class="font-weight-bold text-body-2">Top X Protected</div>
                  <div class="text-caption text-medium-emphasis">Protects pick if it falls within top N selections</div>
                </div>
              </v-card>
            </v-item>

             <!-- Lottery Protected -->
            <v-item v-slot="{ isSelected, toggle }" value="lottery">
              <v-card
                border
                 :color="isSelected ? 'primary-lighten-5' : undefined"
                :class="['d-flex align-center px-3 py-2 cursor-pointer', isSelected ? 'border-primary' : '']"
                variant="outlined"
                @click="toggle"
              >
                 <v-icon :color="isSelected ? 'primary' : 'grey'" class="mr-3">
                  {{ isSelected ? 'radio_button_checked' : 'radio_button_unchecked' }}
                </v-icon>
                <div>
                  <div class="font-weight-bold text-body-2">Lottery Protected</div>
                  <div class="text-caption text-medium-emphasis">Protects picks 1-14 (Non-playoff teams)</div>
                </div>
              </v-card>
            </v-item>
          </v-item-group>
        </div>

        <!-- Configuration for Top X -->
        <v-expand-transition>
          <div v-if="selectedType === 'top_x'" class="mb-4 px-1">
             <div class="d-flex align-center justify-space-between mb-2">
               <span class="text-body-2 font-weight-medium">Protected Range: 1 - {{ topXValue }}</span>
             </div>
             <v-slider
               v-model="topXValue"
               :min="1"
               :max="59"
               :step="1"
               thumb-label
               color="primary"
               track-color="grey-lighten-2"
               hide-details
             >
               <template #append>
                  <v-text-field
                    v-model.number="topXValue"
                    type="number"
                    style="width: 80px"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
               </template>
             </v-slider>
             <div class="text-caption text-medium-emphasis mt-2">
               <v-icon size="x-small" class="mr-1">info</v-icon>
               Pick stays with original team if it lands between 1 and {{ topXValue }}. Otherwise, it conveys.
             </div>
          </div>
        </v-expand-transition>

      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveProtection">
          Save Protection
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Pick } from '@/types/trade';

interface Props {
  modelValue: boolean;
  pick: Pick | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', protection: { type: string; value?: number }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedType = ref('unprotected');
const topXValue = ref(10);

// Initialize from pick when opened
watch(() => props.pick, (newPick) => {
  if (newPick) {
    if (newPick.protection_type === 'top_x') {
       selectedType.value = 'top_x';
       topXValue.value = newPick.protection_value || 10;
    } else if (newPick.protection_type === 'lottery') {
       selectedType.value = 'lottery';
    } else {
       selectedType.value = 'unprotected';
    }
  }
}, { immediate: true });

function saveProtection() {
  const result: { type: string; value?: number } = {
    type: selectedType.value,
  };

  if (selectedType.value === 'top_x') {
    result.value = topXValue.value;
  } else if (selectedType.value === 'lottery') {
    // Backend might treat lottery as a type or as top_x 14
    // For now, we treat it as a distinct type, but could map to top_x 14 if needed
    // result.type = 'top_x';
    // result.value = 14;
  }

  emit('save', result);
}

function getOriginalTeamName(pickDetail: any): string {
  if (pickDetail.original_team_name) return pickDetail.original_team_name;
  if (pickDetail.original_team && typeof pickDetail.original_team === 'object') return pickDetail.original_team.name;
  return `Team ${typeof pickDetail.original_team === 'object' ? pickDetail.original_team.id : pickDetail.original_team}`;
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}
</style>
