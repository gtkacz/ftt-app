<template>
  <div class="trade-machine">
    <v-row class="ma-0">
      <!-- Team Columns Container -->
      <v-col cols="12" lg="9" class="teams-container pa-0">
        <div class="teams-scroll">
          <div class="teams-grid">
            <div
              v-for="teamId in tradeStore.draftTrade.teams"
              :key="teamId"
              class="team-column"
            >
              <v-card elevation="2" class="team-card">
                <!-- Team Header -->
                <v-card-title class="team-header">
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="d-flex align-center">
                      <v-avatar size="40" class="mr-2">
                        <v-img v-if="getTeam(teamId)?.logo" :src="getTeam(teamId)?.logo" />
                        <span v-else>{{ getTeamInitials(teamId) }}</span>
                      </v-avatar>
                      <div>
                        <div class="text-h6">{{ getTeamName(teamId) }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ getTeam(teamId)?.owner_username }}
                        </div>
                      </div>
                    </div>
                    <v-btn
                      v-if="!isProposingTeam(teamId) && editable"
                      icon="close"
                      size="small"
                      variant="text"
                      @click="handleRemoveTeam(teamId)"
                    />
                  </div>
                </v-card-title>

                <v-divider />

                <!-- Sending Section -->
                <div class="asset-section sending-section">
                  <div class="section-header">
                    <v-icon icon="arrow_upward" size="small" color="error" />
                    <span class="text-subtitle-2 ml-1">Sending</span>
                    <v-spacer />
                    <v-menu v-if="editable">
                      <template #activator="{ props: menuProps }">
                        <v-btn
                          v-bind="menuProps"
                          icon="add"
                          size="x-small"
                          variant="text"
                        />
                      </template>
                      <v-list density="compact">
                        <v-list-item @click="openPlayerSelector(teamId, 'giving')">
                          <template #prepend>
                            <v-icon icon="person" size="small" />
                          </template>
                          <v-list-item-title>Add Player</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openPickSelector(teamId, 'giving')">
                          <template #prepend>
                            <v-icon icon="emoji_events" size="small" />
                          </template>
                          <v-list-item-title>Add Pick</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>

                  <div v-if="getSendingAssets(teamId).length === 0" class="empty-placeholder">
                    <v-icon icon="inventory_2" size="large" class="text-medium-emphasis" />
                    <span class="text-caption text-medium-emphasis">No assets</span>
                  </div>

                  <div v-else class="assets-list">
                    <TradeAssetCard
                      v-for="(asset, index) in getSendingAssets(teamId)"
                      :key="`send-${index}`"
                      :asset="asset"
                      :removable="editable"
                      size="compact"
                      @remove="removeAsset(asset)"
                    />
                  </div>
                </div>

                <v-divider />

                <!-- Receiving Section -->
                <div class="asset-section receiving-section">
                  <div class="section-header">
                    <v-icon icon="arrow_downward" size="small" color="success" />
                    <span class="text-subtitle-2 ml-1">Receiving</span>
                  </div>

                  <div v-if="getReceivingAssets(teamId).length === 0" class="empty-placeholder">
                    <v-icon icon="inventory_2" size="large" class="text-medium-emphasis" />
                    <span class="text-caption text-medium-emphasis">No assets</span>
                  </div>

                  <div v-else class="assets-list">
                    <TradeAssetCard
                      v-for="(asset, index) in getReceivingAssets(teamId)"
                      :key="`receive-${index}`"
                      :asset="asset"
                      size="compact"
                    />
                  </div>
                </div>

                <v-divider />

                <!-- Team Impact Summary -->
                <div class="team-impact">
                  <div class="impact-row">
                    <span class="text-caption">Salary:</span>
                    <span class="text-caption font-weight-medium">
                      {{ formatSalaryImpact(teamId) }}
                    </span>
                  </div>
                  <div class="impact-row">
                    <span class="text-caption">Roster:</span>
                    <span class="text-caption font-weight-medium">
                      {{ formatRosterImpact(teamId) }}
                    </span>
                  </div>
                </div>
              </v-card>
            </div>

            <!-- Add Team Button -->
            <div v-if="editable && canAddTeam" class="team-column add-team-column">
              <v-card
                variant="outlined"
                class="add-team-card"
                @click="showTeamSelector = true"
              >
                <div class="add-team-content">
                  <v-icon icon="add_circle" size="large" color="primary" />
                  <span class="text-subtitle-1 mt-2">Add Team</span>
                  <span class="text-caption text-medium-emphasis">Multi-team trade</span>
                </div>
              </v-card>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Validation Sidebar -->
      <v-col cols="12" lg="3" class="validation-sidebar pa-0">
        <v-card elevation="2" class="sticky-sidebar">
          <v-card-title class="validation-header">
            <v-icon icon="check_circle" class="mr-2" />
            Validation
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-3">
            <div v-if="!tradeStore.validationResult" class="text-center text-medium-emphasis">
              <v-icon icon="info" size="large" class="mb-2" />
              <div class="text-caption">Add assets to see validation</div>
            </div>

            <div v-else>
              <!-- Overall Status -->
              <v-alert
                :type="tradeStore.validationResult.valid ? 'success' : 'error'"
                density="compact"
                class="mb-3"
              >
                <div class="text-subtitle-2">
                  {{ tradeStore.validationResult.valid ? 'Trade is valid' : 'Trade has errors' }}
                </div>
              </v-alert>

              <!-- Errors -->
              <div v-if="tradeStore.validationResult.errors.length > 0" class="mb-3">
                <div class="text-subtitle-2 mb-1 text-error">Errors</div>
                <v-alert
                  v-for="(error, index) in tradeStore.validationResult.errors"
                  :key="`error-${index}`"
                  type="error"
                  density="compact"
                  class="mb-1 text-caption"
                >
                  {{ error }}
                </v-alert>
              </div>

              <!-- Warnings -->
              <div v-if="tradeStore.validationResult.warnings.length > 0" class="mb-3">
                <div class="text-subtitle-2 mb-1 text-warning">Warnings</div>
                <v-alert
                  v-for="(warning, index) in tradeStore.validationResult.warnings"
                  :key="`warning-${index}`"
                  type="warning"
                  density="compact"
                  class="mb-1 text-caption"
                >
                  {{ warning }}
                </v-alert>
              </div>

              <!-- Team Impacts -->
              <div class="team-impacts">
                <div class="text-subtitle-2 mb-2">Team Impacts</div>
                <div
                  v-for="teamId in tradeStore.draftTrade.teams"
                  :key="`impact-${teamId}`"
                  class="team-impact-card mb-2"
                >
                  <div class="text-caption font-weight-medium mb-1">
                    {{ getTeamName(teamId) }}
                  </div>
                  <div class="impact-details">
                    <div class="impact-line">
                      <span>Salary:</span>
                      <span>{{ formatDetailedSalary(teamId) }}</span>
                    </div>
                    <div class="impact-line">
                      <span>Roster:</span>
                      <span>{{ formatDetailedRoster(teamId) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>

          <!-- Actions -->
          <v-card-actions v-if="editable" class="pa-3">
            <v-btn
              variant="text"
              size="small"
              @click="clearAll"
            >
              Clear
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              :disabled="!canPropose"
              :loading="tradeStore.isLoading"
              @click="proposeTrade"
            >
              Propose
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Team Selector Dialog -->
    <v-dialog v-model="showTeamSelector" max-width="600">
      <v-card>
        <v-card-title>Add Team to Trade</v-card-title>
        <v-divider />
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="team in availableTeams"
              :key="team.id"
              @click="handleAddTeam(team.id)"
            >
              <template #prepend>
                <v-avatar size="32">
                  <v-img v-if="team.logo" :src="team.logo" />
                  <span v-else>{{ getTeamInitials(team.id) }}</span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ team.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ team.owner_username }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Player Selector Dialog -->
    <v-dialog v-model="playerSelectorDialog" max-width="1600" scrollable>
      <v-card>
        <v-card-title>
          Select Player
          <v-btn variant="text" icon @click="playerSelectorDialog = false" class="float-right">
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />

        <!-- Receiving Team Selector (only for 3+ team trades) -->
        <v-card-text v-if="needsReceivingTeamSelection" class="pb-0">
          <v-alert type="info" density="compact" class="mb-3">
            <div class="d-flex align-center">
              <v-icon icon="info" class="mr-2" />
              <span class="text-body-2">Multi-team trade: Select which team receives this asset</span>
            </div>
          </v-alert>
          <v-select
            v-model="selectedReceivingTeam"
            :items="receivingTeamOptions"
            item-title="name"
            item-value="id"
            label="Receiving Team"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="arrow_forward"
          >
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon icon="arrow_forward" size="small" class="mr-2" color="success" />
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>
        </v-card-text>

        <v-card-text>
          <PlayersTable
            :players="filteredPlayers"
            @player-selected="onPlayerSelected"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Pick Selector Dialog -->
    <v-dialog v-model="pickSelectorDialog" max-width="900" scrollable>
      <v-card v-if="selectedAssetTeam">
        <v-card-title>
          Select Pick
          <v-btn variant="text" icon @click="pickSelectorDialog = false" class="float-right">
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />

        <!-- Receiving Team Selector (only for 3+ team trades) -->
        <v-card-text v-if="needsReceivingTeamSelection" class="pb-0">
          <v-alert type="info" density="compact" class="mb-3">
            <div class="d-flex align-center">
              <v-icon icon="info" class="mr-2" />
              <span class="text-body-2">Multi-team trade: Select which team receives this pick</span>
            </div>
          </v-alert>
          <v-select
            v-model="selectedReceivingTeam"
            :items="receivingTeamOptions"
            item-title="name"
            item-value="id"
            label="Receiving Team"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="arrow_forward"
          >
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon icon="arrow_forward" size="small" class="mr-2" color="success" />
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>
        </v-card-text>

        <v-card-text>
          <PickSelector
            :team-id="selectedAssetTeam"
            :all-teams="allTeams"
            @close="pickSelectorDialog = false"
            @pick-selected="onPickSelected"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import type { Team, CreateTradeAssetData, Pick } from '@/types/trade';
import TradeAssetCard from './TradeAssetCard.vue';
import PlayersTable from '@/components/core/PlayersTable.vue';
import PickSelector from './PickSelector.vue';
import api from '@/api/axios';

interface Props {
  allTeams: Team[];
  currentTeamId: number;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
});

const router = useRouter();
const tradeStore = useTradeStore();

const showTeamSelector = ref(false);
const playerSelectorDialog = ref(false);
const pickSelectorDialog = ref(false);
const selectedAssetTeam = ref<number | null>(null);
const selectedAssetType = ref<'giving' | 'receiving'>('giving');
const selectedReceivingTeam = ref<number | null>(null);
const allPlayers = ref<any[]>([]);

tradeStore.initDraftTrade(props.currentTeamId);

onMounted(async () => {
  try {
    const response = await api.get('/players/?limit=10000');
    allPlayers.value = response.data.results || [];
  } catch (error) {
    console.error('Failed to load players:', error);
  }
});

watch(() => tradeStore.draftTrade.assets, () => {
  if (tradeStore.draftTrade.assets.length > 0) {
    debouncedValidation();
  }
}, { deep: true });

const canAddTeam = computed(() => tradeStore.draftTrade.teams.length < 5);

const canPropose = computed(() => {
  return tradeStore.draftTrade.teams.length >= 2 &&
    tradeStore.draftTrade.assets.length > 0 &&
    tradeStore.validationResult?.valid === true;
});

const availableTeams = computed(() => {
  return props.allTeams.filter(team => !tradeStore.draftTrade.teams.includes(team.id));
});

const filteredPlayers = computed(() => {
  if (!selectedAssetTeam.value) return allPlayers.value;

  if (selectedAssetType.value === 'giving') {
    return allPlayers.value.filter(player => player.team?.id === selectedAssetTeam.value);
  }

  return allPlayers.value.filter(player => player.team?.id !== selectedAssetTeam.value);
});

const receivingTeamOptions = computed(() => {
  if (!selectedAssetTeam.value) return [];

  return tradeStore.draftTrade.teams
    .filter(teamId => teamId !== selectedAssetTeam.value)
    .map(teamId => ({
      id: teamId,
      name: getTeamName(teamId),
    }));
});

const needsReceivingTeamSelection = computed(() => {
  return tradeStore.draftTrade.teams.length > 2;
});

function getTeam(teamId: number): Team | undefined {
  return props.allTeams.find(t => t.id === teamId);
}

function getTeamName(teamId: number): string {
  return getTeam(teamId)?.name || `Team ${teamId}`;
}

function getTeamInitials(teamId: number): string {
  const name = getTeamName(teamId);
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function isProposingTeam(teamId: number): boolean {
  return teamId === tradeStore.draftTrade.proposing_team;
}

function getSendingAssets(teamId: number): CreateTradeAssetData[] {
  return tradeStore.draftTrade.assets.filter(a => a.giving_team === teamId);
}

function getReceivingAssets(teamId: number): CreateTradeAssetData[] {
  return tradeStore.draftTrade.assets.filter(a => a.receiving_team === teamId);
}

function formatSalaryImpact(teamId: number): string {
  const impact = tradeStore.teamImpact(teamId);
  if (!impact) return 'N/A';

  const sign = impact.net_salary >= 0 ? '+' : '';
  return `${sign}$${(impact.net_salary / 1000000).toFixed(1)}M`;
}

function formatRosterImpact(teamId: number): string {
  const impact = tradeStore.teamImpact(teamId);
  if (!impact) return 'N/A';

  const sign = impact.net_players >= 0 ? '+' : '';
  return `${sign}${impact.net_players}`;
}

function formatDetailedSalary(teamId: number): string {
  const impact = tradeStore.teamImpact(teamId);
  if (!impact) return 'N/A';

  const current = (impact.current_salary / 1000000).toFixed(1);
  const projected = (impact.new_salary / 1000000).toFixed(1);
  const cap = (impact.salary_cap / 1000000).toFixed(1);

  return `$${current}M → $${projected}M (Cap: $${cap}M)`;
}

function formatDetailedRoster(teamId: number): string {
  const impact = tradeStore.teamImpact(teamId);
  if (!impact) return 'N/A';

  return `${impact.current_player_count} → ${impact.new_player_count} (Max: ${impact.max_player_cap})`;
}

function handleAddTeam(teamId: number) {
  tradeStore.addTeamToDraft(teamId);
  showTeamSelector.value = false;
}

function handleRemoveTeam(teamId: number) {
  if (confirm(`Remove ${getTeamName(teamId)} from trade?`)) {
    tradeStore.removeTeamFromDraft(teamId);
  }
}

function openPlayerSelector(teamId: number, type: 'giving' | 'receiving') {
  selectedAssetTeam.value = teamId;
  selectedAssetType.value = type;

  if (needsReceivingTeamSelection.value && receivingTeamOptions.value.length > 0) {
    selectedReceivingTeam.value = receivingTeamOptions.value[0].id;
  } else {
    selectedReceivingTeam.value = null;
  }

  playerSelectorDialog.value = true;
}

function openPickSelector(teamId: number, type: 'giving' | 'receiving') {
  selectedAssetTeam.value = teamId;
  selectedAssetType.value = type;

  if (needsReceivingTeamSelection.value && receivingTeamOptions.value.length > 0) {
    selectedReceivingTeam.value = receivingTeamOptions.value[0].id;
  } else {
    selectedReceivingTeam.value = null;
  }

  pickSelectorDialog.value = true;
}

function onPlayerSelected(player: any) {
  if (!selectedAssetTeam.value) return;

  let givingTeam: number;
  let receivingTeam: number;

  if (selectedAssetType.value === 'giving') {
    givingTeam = selectedAssetTeam.value;

    if (needsReceivingTeamSelection.value && selectedReceivingTeam.value) {
      receivingTeam = selectedReceivingTeam.value;
    } else {
      const otherTeamId = tradeStore.draftTrade.teams.find(t => t !== selectedAssetTeam.value);
      if (!otherTeamId) return;
      receivingTeam = otherTeamId;
    }
  } else {
    receivingTeam = selectedAssetTeam.value;

    if (needsReceivingTeamSelection.value && selectedReceivingTeam.value) {
      givingTeam = selectedReceivingTeam.value;
    } else {
      const otherTeamId = tradeStore.draftTrade.teams.find(t => t !== selectedAssetTeam.value);
      if (!otherTeamId) return;
      givingTeam = otherTeamId;
    }
  }

  const asset: CreateTradeAssetData = {
    asset_type: 'player',
    giving_team: givingTeam,
    receiving_team: receivingTeam,
    player: player.id,
    player_detail: {
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: `${player.first_name} ${player.last_name}`,
      position: player.primary_position || 'N/A',
      nba_team: player.real_team?.abbreviation || 'FA',
      photo_url: player.photo,
    },
  };

  tradeStore.addAssetToDraft(asset);
  playerSelectorDialog.value = false;
  debouncedValidation();
}

function onPickSelected(pick: Pick) {
  if (!selectedAssetTeam.value) return;

  let givingTeam: number;
  let receivingTeam: number;

  if (selectedAssetType.value === 'giving') {
    givingTeam = selectedAssetTeam.value;

    if (needsReceivingTeamSelection.value && selectedReceivingTeam.value) {
      receivingTeam = selectedReceivingTeam.value;
    } else {
      const otherTeamId = tradeStore.draftTrade.teams.find(t => t !== selectedAssetTeam.value);
      if (!otherTeamId) return;
      receivingTeam = otherTeamId;
    }
  } else {
    receivingTeam = selectedAssetTeam.value;

    if (needsReceivingTeamSelection.value && selectedReceivingTeam.value) {
      givingTeam = selectedReceivingTeam.value;
    } else {
      const otherTeamId = tradeStore.draftTrade.teams.find(t => t !== selectedAssetTeam.value);
      if (!otherTeamId) return;
      givingTeam = otherTeamId;
    }
  }

  const asset: CreateTradeAssetData = {
    asset_type: 'pick',
    giving_team: givingTeam,
    receiving_team: receivingTeam,
    pick: pick.id,
    pick_detail: pick,
    pick_protection_type: pick.protection_type || 'none',
    pick_protection_range_start: pick.protection_range_start,
    pick_protection_range_end: pick.protection_range_end,
    pick_rollover_year: pick.rollover_year,
  };

  tradeStore.addAssetToDraft(asset);
  pickSelectorDialog.value = false;
  debouncedValidation();
}

function removeAsset(asset: CreateTradeAssetData) {
  const index = tradeStore.draftTrade.assets.indexOf(asset);
  if (index !== -1) {
    tradeStore.removeAssetFromDraft(index);
  }
}

let validationTimeout: number | null = null;
function debouncedValidation() {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
  validationTimeout = window.setTimeout(async () => {
    try {
      await tradeStore.validateDraftTrade();
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, 500);
}

async function proposeTrade() {
  try {
    const trade = await tradeStore.proposeTrade();
    router.push(`/trades/${trade.id}`);
  } catch (error) {
    console.error('Failed to propose trade:', error);
  }
}

function clearAll() {
  if (confirm('Clear all trade data?')) {
    tradeStore.clearDraft();
    tradeStore.initDraftTrade(props.currentTeamId);
  }
}
</script>

<style scoped lang="scss">
.trade-machine {
  .teams-container {
    .teams-scroll {
      overflow-x: auto;
      overflow-y: visible;
      padding: 16px;
    }

    .teams-grid {
      display: flex;
      gap: 16px;
      min-width: min-content;
    }

    .team-column {
      flex: 0 0 320px;
      min-width: 320px;
    }

    .add-team-column {
      flex: 0 0 200px;
      min-width: 200px;
    }

    .team-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .team-header {
      padding: 12px 16px;
      background: rgba(var(--v-theme-surface-variant), 0.3);
    }

    .asset-section {
      padding: 12px;
      min-height: 150px;

      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      .empty-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 8px;
      }

      .assets-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }

    .sending-section {
      border-left: 3px solid rgb(var(--v-theme-error));
    }

    .receiving-section {
      border-left: 3px solid rgb(var(--v-theme-success));
    }

    .team-impact {
      padding: 12px;
      background: rgba(var(--v-theme-surface-variant), 0.2);

      .impact-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
      }
    }

    .add-team-card {
      height: 100%;
      min-height: 400px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: rgb(var(--v-theme-primary));
        transform: translateY(-2px);
      }

      .add-team-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 32px;
        text-align: center;
      }
    }
  }

  .validation-sidebar {
    padding: 16px;

    .sticky-sidebar {
      position: sticky;
      top: 80px;
      max-height: calc(100vh - 96px);
      overflow-y: auto;
    }

    .validation-header {
      padding: 12px 16px;
      background: rgba(var(--v-theme-surface-variant), 0.3);
    }

    .team-impacts {
      .team-impact-card {
        padding: 8px;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 4px;

        .impact-details {
          .impact-line {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            padding: 2px 0;
          }
        }
      }
    }
  }
}
</style>
