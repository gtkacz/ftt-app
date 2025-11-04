<template>
  <v-dialog v-model="internalDialog" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>{{ assetType === 'player' ? 'mdi-account' : 'mdi-calendar-star' }}</v-icon>
        Select {{ assetType === 'player' ? 'Player' : 'Pick' }}
        <v-spacer />
        <v-btn icon variant="text" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
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
              label="Send to Team"
              prepend-inner-icon="mdi-arrow-right-bold"
              variant="outlined"
              :rules="[v => !!v || 'Destination team is required']"
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
            prepend-inner-icon="mdi-magnify"
            label="Search players"
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
                <v-icon size="48" color="grey-lighten-1">mdi-account-off</v-icon>
                <p class="text-h6 text-medium-emphasis mt-2">No players available</p>
                <p class="text-caption">This team has no available players to trade</p>
              </div>
            </template>
          </v-data-table>
        </div>

        <!-- Pick Selection -->
        <div v-else-if="assetType === 'pick'">
          <v-data-table
            v-model:model-value="selectedPicks"
            :headers="pickTableHeaders"
            :items="availablePicks"
            item-value="id"
            show-select
            :single-select="true"
            density="comfortable"
            :height="300"
            fixed-header
          >
            <template #[`item.pick`]="{ item }">
              <div class="font-weight-medium">{{ item.year }} Round {{ item.round }}</div>
              <div class="text-caption text-medium-emphasis">
                Originally {{ getTeamName(item.original_team) }}
              </div>
            </template>

            <template #[`item.protection`]="{ item }">
              <PickProtectionBadge
                v-if="item.protection_type && item.protection_type !== 'none'"
                :protection="item.protection_type"
                :value="item.protection_value"
              />
              <span v-else class="text-caption text-medium-emphasis">Unprotected</span>
            </template>

            <template #no-data>
              <div class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-1">mdi-calendar-remove</v-icon>
                <p class="text-h6 text-medium-emphasis mt-2">No picks available</p>
                <p class="text-caption">This team has no available draft picks to trade</p>
              </div>
            </template>
          </v-data-table>

          <!-- Pick Protection Configuration (if pick selected) -->
          <v-expand-transition>
            <div v-if="selectedPicks.length > 0" class="mt-4">
              <v-divider class="mb-4" />
              <h4 class="text-subtitle-1 mb-3">
                <v-icon start>mdi-shield-check</v-icon>
                Pick Protection (Optional)
              </h4>

              <v-radio-group v-model="pickProtection" hide-details class="protection-radio-group">
                <v-radio value="none">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>No Protection</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">mdi-information</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">No Protection</div>
                          <div class="text-caption">
                            The pick conveys regardless of where it lands. The receiving team gets the pick no matter what.
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="top_x">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>Top X Protected</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">mdi-information</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">Top X Protected</div>
                          <div class="text-caption mb-2">
                            If the pick lands in the top X positions, it doesn't convey and the giving team keeps it.
                          </div>
                          <div class="text-caption font-weight-medium mb-1">Example:</div>
                          <div class="text-caption">
                            Top 5 Protected: If the pick is #1-5, the giving team keeps it. If it's #6 or later, it conveys to the receiving team.
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="swap_best">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>Swap Best</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">mdi-information</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">Swap Best (Pick Swap Rights)</div>
                          <div class="text-caption mb-2">
                            The two teams compare their picks, and the receiving team gets whichever pick is better (lower number).
                          </div>
                          <div class="text-caption font-weight-medium mb-1">Example:</div>
                          <div class="text-caption">
                            Team A has pick #3, Team B has pick #10. With swap best, Team B gets pick #3 (the better pick), and Team A gets pick #10.
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="swap_worst">
                  <template #label>
                    <div class="d-flex align-center">
                      <span>Swap Worst</span>
                      <v-tooltip location="end" max-width="350">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" size="small" class="ml-2" color="grey">mdi-information</v-icon>
                        </template>
                        <div class="tooltip-content">
                          <div class="font-weight-bold mb-1">Swap Worst (Reverse Pick Swap)</div>
                          <div class="text-caption mb-2">
                            The two teams compare their picks, and the receiving team gets whichever pick is worse (higher number).
                          </div>
                          <div class="text-caption font-weight-medium mb-1">Example:</div>
                          <div class="text-caption">
                            Team A has pick #3, Team B has pick #10. With swap worst, Team B gets pick #10 (the worse pick), and Team A gets pick #3. This protects Team A from losing their best pick.
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
                  label="Protection Value"
                  hint="E.g., Top 5 Protected"
                  persistent-hint
                  variant="outlined"
                  class="mt-3"
                  :min="1"
                  :max="30"
                />
              </v-expand-transition>

              <v-alert v-if="pickProtection !== 'none'" type="info" variant="tonal" class="mt-3" prominent>
                <template #prepend>
                  <v-icon>mdi-shield-check</v-icon>
                </template>
                <template v-if="pickProtection === 'top_x'">
                  <div class="text-subtitle-2 mb-2">Top {{ protectionValue || 'X' }} Protected Pick</div>
                  <div class="text-body-2">
                    If this pick lands in positions #1 through #{{ protectionValue || 'X' }}, the <strong>giving team keeps it</strong> and the receiving team does not get it.
                    The pick may roll over to future years depending on the protection terms.
                  </div>
                  <div class="mt-2">
                    <v-chip size="small" color="success" variant="outlined" class="mr-2">
                      <v-icon start size="small">mdi-check</v-icon>
                      Conveys: #{{ (protectionValue || 0) + 1 }}+
                    </v-chip>
                    <v-chip size="small" color="error" variant="outlined">
                      <v-icon start size="small">mdi-close</v-icon>
                      Protected: #1-{{ protectionValue || 'X' }}
                    </v-chip>
                  </div>
                </template>
                <template v-else-if="pickProtection === 'swap_best'">
                  <div class="text-subtitle-2 mb-2">Swap Best (Pick Swap Rights)</div>
                  <div class="text-body-2">
                    Both teams compare their draft picks for this year. The <strong>receiving team gets the better pick</strong> (lower draft position = higher pick),
                    and the giving team gets the worse pick. This is typically used when teams want to secure a higher draft position.
                  </div>
                  <div class="mt-2 text-caption">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    Common in deals where one team wants lottery protection
                  </div>
                </template>
                <template v-else-if="pickProtection === 'swap_worst'">
                  <div class="text-subtitle-2 mb-2">Swap Worst (Reverse Pick Swap)</div>
                  <div class="text-body-2">
                    Both teams compare their draft picks for this year. The <strong>receiving team gets the worse pick</strong> (higher draft position = lower pick),
                    and the giving team gets the better pick. This protects the giving team from giving up their best draft position.
                  </div>
                  <div class="mt-2 text-caption">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    Rarely used; ensures the giving team maintains their higher pick
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
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" :disabled="!canConfirm" @click="confirmSelection">
          Add to Trade
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Player, Pick, Team, PickProtectionType } from '@/types/trade';
import PickProtectionBadge from './PickProtectionBadge.vue';

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
    assetType: 'player' | 'pick';
    assetId: number;
    givingTeam: number;
    receivingTeam: number;
    asset: Player | Pick;
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
  if (!playerSearch.value) return props.availablePlayers;
  const search = playerSearch.value.toLowerCase();
  return props.availablePlayers.filter((p) =>
    p.full_name.toLowerCase().includes(search) ||
    p.position.toLowerCase().includes(search) ||
    p.nba_team.toLowerCase().includes(search)
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
const playerTableHeaders = [
  { title: 'Player', key: 'name', sortable: false },
  { title: 'Position', key: 'position', sortable: true },
  { title: 'NBA Team', key: 'nba_team', sortable: true },
];

const pickTableHeaders = [
  { title: 'Pick', key: 'pick', sortable: false },
  { title: 'Protection', key: 'protection', sortable: false },
];

// Helper to get team name
function getTeamName(teamId: number): string {
  const team = props.availableTeams.find((t) => t.id === teamId);
  return team?.name || 'Unknown';
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
        assetType: 'player',
        assetId: player.id,
        givingTeam: props.givingTeam.id,
        receivingTeam: selectedDestination.value,
        asset: player,
      });
    }
  } else if (props.assetType === 'pick' && selectedPicks.value.length > 0) {
    const pick = props.availablePicks.find((p) => p.id === selectedPicks.value[0]);
    if (pick) {
      emit('asset-selected', {
        assetType: 'pick',
        assetId: pick.id,
        givingTeam: props.givingTeam.id,
        receivingTeam: selectedDestination.value,
        asset: pick,
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
