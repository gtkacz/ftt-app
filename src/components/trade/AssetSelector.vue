<template>
  <v-dialog v-model="internalDialog" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>{{ assetType === 'player' ? 'person' : 'star' }}</v-icon>
        {{ assetType === 'player' ? t('assetSelector.dialogTitle.player') : t('assetSelector.dialogTitle.pick') }}
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- Destination Team Selection -->
        <v-row>
          <v-col cols="12">
            <v-select
              v-model="selectedDestination"
              :items="destinationTeams"
              item-title="name"
              item-value="id"
              :label="t('assetSelector.destination.label')"
              prepend-inner-icon="arrow_forward"
              variant="outlined"
              :rules="[v => !!v || t('assetSelector.destination.required')]"
            >
              <template #selection="{ item }">
                <div class="d-flex align-center">
                  <v-avatar v-if="item.raw.logo" size="24" class="mr-2">
                    <v-img :src="item.raw.logo" />
                  </v-avatar>
                  <span>{{ item.raw.name }}</span>
                </div>
              </template>
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template #prepend>
                    <v-avatar v-if="item.raw.logo" size="32">
                      <v-img :src="item.raw.logo" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <!-- Player Selection -->
        <div v-if="assetType === 'player'">
          <v-text-field
            v-model="playerSearch"
            prepend-inner-icon="search"
            :label="t('assetSelector.player.searchLabel')"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            class="mb-3"
          />

          <v-data-table
            v-model:model-value="selectedPlayers"
            :headers="playerTableHeaders"
            :items="filteredPlayers"
            :search="playerSearch"
            item-value="id"
            show-select
            :single-select="true"
            density="comfortable"
            :height="400"
            fixed-header
          >
            <template #[`item.name`]="{ item }">
              <div class="d-flex align-center py-2">
                <v-avatar v-if="item.photo_url" size="32" class="mr-3">
                  <v-img :src="item.photo_url" />
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.full_name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.position }} - {{ item.nba_team }}
                  </div>
                </div>
              </div>
            </template>

            <template #no-data>
              <div class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-1">person_off</v-icon>
                <p class="text-h6 text-medium-emphasis mt-2">{{ t('assetSelector.player.empty.title') }}</p>
                <p class="text-caption">{{ t('assetSelector.player.empty.subtitle') }}</p>
              </div>
            </template>
          </v-data-table>
        </div>

        <!-- Pick Selection -->
        <div v-else-if="assetType === 'pick'">
          <v-data-table
            v-model:model-value="selectedPicks"
            :headers="pickTableHeaders"
            :items="props.availablePicks || []"
            item-value="id"
            show-select
            :single-select="true"
            density="comfortable"
            :height="300"
            fixed-header
          >
            <template #[`item.pick`]="{ item }">
              <div class="font-weight-medium">{{ t('assetSelector.pick.yearRound', { year: item.year, round: item.round }) }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ t('assetSelector.pick.via', { team: getTeamName(item.original_team) }) }}
              </div>
            </template>

            <template #[`item.protection`]="{ item }">
              <PickProtectionBadge
                v-if="item.protection_type && item.protection_type !== 'none'"
                :protection="item.protection_type"
                :value="item.protection_value"
              />
              <span v-else class="text-caption text-medium-emphasis">{{ t('assetSelector.pick.unprotected') }}</span>
            </template>

            <template #no-data>
              <div class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-1">event_busy</v-icon>
                <p class="text-h6 text-medium-emphasis mt-2">{{ t('assetSelector.pick.empty.title') }}</p>
                <p class="text-caption">{{ t('assetSelector.pick.empty.subtitle') }}</p>
              </div>
            </template>
          </v-data-table>

          <!-- Pick Protection Configuration (if pick selected) -->
          <v-expand-transition>
            <div v-if="selectedPicks.length > 0" class="mt-4">
              <v-divider class="mb-4" />
              <h4 class="text-subtitle-1 mb-3">
                <v-icon start>verified_user</v-icon>
                {{ t('assetSelector.protection.heading') }}
              </h4>

              <v-radio-group v-model="pickProtection" hide-details class="protection-radio-group">
                <v-radio value="none">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>{{ t('assetSelector.protection.options.none') }}</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">info</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">{{ t('assetSelector.protection.tooltips.none.title') }}</div>
                          <div class="text-caption">
                            {{ t('assetSelector.protection.tooltips.none.body') }}
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="top_x">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>{{ t('assetSelector.protection.options.topX') }}</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">info</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">{{ t('assetSelector.protection.tooltips.topX.title') }}</div>
                          <div class="text-caption mb-2">
                            {{ t('assetSelector.protection.tooltips.topX.body') }}
                          </div>
                          <div class="text-caption font-weight-medium mb-1">{{ t('assetSelector.protection.tooltips.topX.exampleLabel') }}</div>
                          <div class="text-caption">
                            {{ t('assetSelector.protection.tooltips.topX.example') }}
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="swap_best">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>{{ t('assetSelector.protection.options.swapBest') }}</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">info</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">{{ t('assetSelector.protection.tooltips.swapBest.title') }}</div>
                          <div class="text-caption mb-2">
                            {{ t('assetSelector.protection.tooltips.swapBest.body') }}
                          </div>
                          <div class="text-caption font-weight-medium mb-1">{{ t('assetSelector.protection.tooltips.swapBest.exampleLabel') }}</div>
                          <div class="text-caption">
                            {{ t('assetSelector.protection.tooltips.swapBest.example') }}
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="swap_worst">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>{{ t('assetSelector.protection.options.swapWorst') }}</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">info</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">{{ t('assetSelector.protection.tooltips.swapWorst.title') }}</div>
                          <div class="text-caption mb-2">
                            {{ t('assetSelector.protection.tooltips.swapWorst.body') }}
                          </div>
                          <div class="text-caption font-weight-medium mb-1">{{ t('assetSelector.protection.tooltips.swapWorst.exampleLabel') }}</div>
                          <div class="text-caption">
                            {{ t('assetSelector.protection.tooltips.swapWorst.example') }}
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-expand-transition>
                <v-text-field
                  v-if="pickProtection === 'top_x'"
                  v-model.number="protectionValue"
                  type="number"
                  :label="t('assetSelector.protection.valueField.label')"
                  :hint="t('assetSelector.protection.valueField.hint')"
                  persistent-hint
                  variant="outlined"
                  class="mt-3"
                  :min="1"
                  :max="30"
                />
              </v-expand-transition>

              <v-alert v-if="pickProtection !== 'none'" type="info" variant="tonal" class="mt-3" prominent>
                <template #prepend>
                  <v-icon>verified_user</v-icon>
                </template>
                <template v-if="pickProtection === 'top_x'">
                  <div class="text-subtitle-2 mb-2">{{ t('assetSelector.protection.summary.topX.title', { value: protectionValue || 'X' }) }}</div>
                  <div class="text-body-2">
                    {{ t('assetSelector.protection.summary.topX.prefix', { value: protectionValue || 'X' }) }}
                    <strong>{{ t('assetSelector.protection.summary.topX.strong') }}</strong>
                    {{ t('assetSelector.protection.summary.topX.suffix') }}
                  </div>
                  <div class="mt-2">
                    <v-chip size="small" color="success" variant="outlined" class="mr-2">
                      <v-icon start size="small">check</v-icon>
                      {{ t('assetSelector.protection.summary.topX.conveys', { value: (protectionValue || 0) + 1 }) }}
                    </v-chip>
                    <v-chip size="small" color="error" variant="outlined">
                      <v-icon start size="small">close</v-icon>
                      {{ t('assetSelector.protection.summary.topX.protectedRange', { value: protectionValue || 'X' }) }}
                    </v-chip>
                  </div>
                </template>
                <template v-else-if="pickProtection === 'swap_best'">
                  <div class="text-subtitle-2 mb-2">{{ t('assetSelector.protection.tooltips.swapBest.title') }}</div>
                  <div class="text-body-2">
                    {{ t('assetSelector.protection.summary.swapBest.prefix') }}
                    <strong>{{ t('assetSelector.protection.summary.swapBest.strong') }}</strong>
                    {{ t('assetSelector.protection.summary.swapBest.suffix') }}
                  </div>
                  <div class="mt-2 text-caption">
                    <v-icon size="small" class="mr-1">info</v-icon>
                    {{ t('assetSelector.protection.summary.swapBest.note') }}
                  </div>
                </template>
                <template v-else-if="pickProtection === 'swap_worst'">
                  <div class="text-subtitle-2 mb-2">{{ t('assetSelector.protection.tooltips.swapWorst.title') }}</div>
                  <div class="text-body-2">
                    {{ t('assetSelector.protection.summary.swapWorst.prefix') }}
                    <strong>{{ t('assetSelector.protection.summary.swapWorst.strong') }}</strong>
                    {{ t('assetSelector.protection.summary.swapWorst.suffix') }}
                  </div>
                  <div class="mt-2 text-caption">
                    <v-icon size="small" class="mr-1">info</v-icon>
                    {{ t('assetSelector.protection.summary.swapWorst.note') }}
                  </div>
                </template>
              </v-alert>
            </div>
          </v-expand-transition>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">{{ t('assetSelector.actions.cancel') }}</v-btn>
        <v-btn color="primary" :disabled="!canConfirm" @click="confirmSelection">
          {{ t('assetSelector.actions.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Player, Pick, Team, PickProtectionType } from '@/types/trade';
import PickProtectionBadge from './PickProtectionBadge.vue';

const { t } = useI18n();

interface Props {
  modelValue: boolean;
  assetType: 'player' | 'pick';
  givingTeam: Team;
  availableTeams: Team[];
  availablePlayers?: Player[];
  availablePicks?: Pick[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'asset-selected', payload: {
    asset_type: 'player' | 'pick';
    asset_id: number;
    giving_team: number;
    receiving_team: number;
    player?: Player;
    pick?: Pick;
    protection?: { type: PickProtectionType; value?: number };
  }): void;
}

const props = withDefaults(defineProps<Props>(), {
  availablePlayers: () => [],
  availablePicks: () => [],
});

const emit = defineEmits<Emits>();

// Dialog state
const internalDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Selection state
const selectedDestination = ref<number | null>(null);
const selectedPlayers = ref<number[]>([]);
const selectedPicks = ref<number[]>([]);
const playerSearch = ref('');
const pickProtection = ref<PickProtectionType>('none');
const protectionValue = ref<number>(5);

// Available destination teams (all except giving team)
const destinationTeams = computed(() => {
  return props.availableTeams.filter((t) => t.id !== props.givingTeam.id);
});

// Filtered players based on search
const filteredPlayers = computed(() => {
  if (!playerSearch.value) return props.availablePlayers || [];
  const search = playerSearch.value.toLowerCase();
  return (props.availablePlayers || []).filter((p) =>
    (p.full_name || '').toLowerCase().includes(search) ||
    (p.position || '').toLowerCase().includes(search) ||
    (p.nba_team || '').toLowerCase().includes(search)
  );
});

// Check if can confirm
const canConfirm = computed(() => {
  if (!selectedDestination.value) return false;
  if (props.assetType === 'player') {
    return selectedPlayers.value.length > 0;
  } else {
    return selectedPicks.value.length > 0;
  }
});

// Table headers
const playerTableHeaders = computed(() => [
  { title: t('assetSelector.player.table.name'), key: 'name', sortable: false },
  { title: t('assetSelector.player.table.position'), key: 'position', sortable: true },
  { title: t('assetSelector.player.table.team'), key: 'nba_team', sortable: true },
]);

const pickTableHeaders = computed(() => [
  { title: t('assetSelector.pick.table.pick'), key: 'pick', sortable: false },
  { title: t('assetSelector.pick.table.protection'), key: 'protection', sortable: false },
]);

// Helper to get team name
function getTeamName(teamId: number): string {
  const team = props.availableTeams.find((t) => t.id === teamId);
  return team?.name || t('assetSelector.unknownTeam');
}

// Close dialog
function closeDialog() {
  internalDialog.value = false;
  resetState();
}

// Reset state
function resetState() {
  selectedDestination.value = null;
  selectedPlayers.value = [];
  selectedPicks.value = [];
  playerSearch.value = '';
  pickProtection.value = 'none';
  protectionValue.value = 5;
}

// Confirm selection
function confirmSelection() {
  if (!selectedDestination.value) return;

  if (props.assetType === 'player' && selectedPlayers.value.length > 0) {
    const player = props.availablePlayers.find((p) => p.id === selectedPlayers.value[0]);
    if (player) {
      emit('asset-selected', {
        asset_type: 'player',
        asset_id: player.id,
        giving_team: props.givingTeam.id,
        receiving_team: selectedDestination.value,
        player: player,
      });
    }
  } else if (props.assetType === 'pick' && selectedPicks.value.length > 0) {
    const pick = props.availablePicks.find((p) => p.id === selectedPicks.value[0]);
    if (pick) {
      emit('asset-selected', {
        asset_type: 'pick',
        asset_id: pick.id,
        giving_team: props.givingTeam.id,
        receiving_team: selectedDestination.value,
        pick: pick,
        protection: pickProtection.value !== 'none'
          ? { type: pickProtection.value, value: pickProtection.value === 'top_x' ? protectionValue.value : undefined }
          : undefined,
      });
    }
  }

  closeDialog();
}

// Watch dialog open to reset state
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetState();
  }
});
</script>

<style scoped>
.protection-radio-group :deep(.v-selection-control) {
  margin-bottom: 12px;
}

.tooltip-content {
  padding: 4px;
}
</style>
