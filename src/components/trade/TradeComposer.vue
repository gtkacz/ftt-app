<template>
  <v-container fluid class="trade-composer pa-0">
    <v-row>
      <!-- Team Selection -->
      <v-col cols="12">
        <TeamSelector
          :teams="allTeams"
          :selected-team-ids="tradeStore.draftTrade.teams"
          :proposing-team-id="tradeStore.draftTrade.proposing_team || undefined"
          @add-team="handleAddTeam"
          @remove-team="handleRemoveTeam"
        />
      </v-col>

      <!-- Asset Management -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon icon="swap_horiz" class="mr-2" />
            Trade Assets
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-tabs v-model="activeTeamTab" grow>
              <v-tab
                v-for="teamId in tradeStore.draftTrade.teams"
                :key="teamId"
                :value="teamId"
              >
                {{ getTeamName(teamId) }}
              </v-tab>
            </v-tabs>

            <v-window v-model="activeTeamTab" class="mt-4">
              <v-window-item
                v-for="teamId in tradeStore.draftTrade.teams"
                :key="teamId"
                :value="teamId"
              >
                <v-row>
                  <!-- Giving Column -->
                  <v-col cols="12" md="6">
                    <div class="asset-column">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <h3 class="text-h6">
                          <v-icon icon="arrow_forward" color="error" class="mr-2" />
                          Giving Up
                        </h3>
                        <v-menu>
                          <template #activator="{ props: menuProps }">
                            <v-btn
                              v-bind="menuProps"
                              icon="add"
                              size="small"
                              variant="tonal"
                              color="primary"
                            />
                          </template>
                          <v-list>
                            <v-list-item @click="openPlayerSelector(teamId, 'giving')">
                              <template #prepend>
                                <v-icon icon="person" />
                              </template>
                              <v-list-item-title>Add Player</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="openPickSelector(teamId, 'giving')">
                              <template #prepend>
                                <v-icon icon="emoji_events" />
                              </template>
                              <v-list-item-title>Add Pick</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </div>

                      <div v-if="getGivingAssets(teamId).length === 0" class="empty-state">
                        <v-icon icon="inventory_2" size="48" class="mb-2 text-medium-emphasis" />
                        <div class="text-caption text-medium-emphasis">No assets added</div>
                      </div>

                      <div v-else class="asset-list">
                        <TradeAssetCard
                          v-for="(asset, index) in getGivingAssets(teamId)"
                          :key="`giving-${index}`"
                          :asset="asset"
                          removable
                          class="mb-2"
                          @remove="removeAsset(getGivingAssets(teamId), index)"
                        />
                      </div>
                    </div>
                  </v-col>

                  <!-- Receiving Column -->
                  <v-col cols="12" md="6">
                    <div class="asset-column">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <h3 class="text-h6">
                          <v-icon icon="arrow_back" color="success" class="mr-2" />
                          Receiving
                        </h3>
                      </div>

                      <div v-if="getReceivingAssets(teamId).length === 0" class="empty-state">
                        <v-icon icon="inventory_2" size="48" class="mb-2 text-medium-emphasis" />
                        <div class="text-caption text-medium-emphasis">No assets added</div>
                      </div>

                      <div v-else class="asset-list">
                        <TradeAssetCard
                          v-for="(asset, index) in getReceivingAssets(teamId)"
                          :key="`receiving-${index}`"
                          :asset="asset"
                          class="mb-2"
                        />
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Validation Display -->
      <v-col v-if="tradeStore.validationResult" cols="12">
        <TradeValidationDisplay
          :validation="tradeStore.validationResult"
          :teams="allTeams"
        />
      </v-col>

      <!-- Trade Notes -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text>
            <v-textarea
              v-model="tradeStore.draftTrade.notes"
              label="Trade Notes (Optional)"
              variant="outlined"
              rows="3"
              placeholder="Add any notes or comments about this trade..."
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Actions -->
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-actions class="pa-4">
            <v-btn
              variant="text"
              @click="clearDraft"
            >
              Clear All
            </v-btn>

            <v-spacer />

            <v-btn
              variant="outlined"
              :loading="tradeStore.isLoading"
              :disabled="!canSaveDraft"
              @click="saveDraft"
            >
              Save Draft
            </v-btn>

            <v-btn
              color="primary"
              variant="flat"
              :loading="tradeStore.isLoading"
              :disabled="!canPropose"
              @click="proposeTrade"
            >
              Propose Trade
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Player Selector Dialog -->
    <v-dialog v-model="playerSelectorDialog" max-width="1600" scrollable>
      <v-card>
        <v-card-title>
          Select Player to {{ selectedAssetType === 'giving' ? 'Trade Away' : 'Acquire' }}
          <v-btn variant="text" icon @click="playerSelectorDialog = false" class="float-right">
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
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
      <PickSelector
        v-if="selectedAssetTeam"
        :team-id="selectedAssetTeam"
        :all-teams="allTeams"
        @close="pickSelectorDialog = false"
        @pick-selected="onPickSelected"
      />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import type { Team, TradeAsset, Pick, Player } from '@/types/trade';
import TeamSelector from './TeamSelector.vue';
import TradeAssetCard from './TradeAssetCard.vue';
import TradeValidationDisplay from './TradeValidationDisplay.vue';
import PlayersTable from '@/components/core/PlayersTable.vue';
import PickSelector from './PickSelector.vue';
import api from '@/api/axios';

interface Props {
  allTeams: Team[];
  currentTeamId: number;
}

const props = defineProps<Props>();
const router = useRouter();
const tradeStore = useTradeStore();

// UI State
const activeTeamTab = ref<number | null>(null);
const playerSelectorDialog = ref(false);
const pickSelectorDialog = ref(false);
const playerSearch = ref('');
const selectedAssetTeam = ref<number | null>(null);
const selectedAssetType = ref<'giving' | 'receiving'>('giving');
const allPlayers = ref<any[]>([]);

// Initialize draft trade
tradeStore.initDraftTrade(props.currentTeamId);

// Fetch all players on mount
onMounted(async () => {
  try {
    const response = await api.get('/players/?limit=10000');
    allPlayers.value = response.data.results || [];
  } catch (error) {
    console.error('Failed to load players:', error);
  }
});

// Watch for team changes and set active tab
watch(() => tradeStore.draftTrade.teams, (teams) => {
  if (teams.length > 0 && !activeTeamTab.value) {
    activeTeamTab.value = teams[0];
  }
}, { immediate: true });

// Watch for asset changes and trigger validation
watch(() => tradeStore.draftTrade.assets, () => {
  if (tradeStore.draftTrade.assets.length > 0) {
    debouncedValidation();
  }
}, { deep: true });

const canSaveDraft = computed(() => {
  return tradeStore.draftTrade.teams.length >= 2 &&
    tradeStore.draftTrade.assets.length > 0;
});

const canPropose = computed(() => {
  return canSaveDraft.value &&
    tradeStore.canProposeTrade &&
    tradeStore.validationResult?.valid;
});

const filteredPlayers = computed(() => {
  if (!selectedAssetTeam.value) return allPlayers.value;

  // When giving away players, only show players from the giving team
  if (selectedAssetType.value === 'giving') {
    const team = props.allTeams.find(t => t.id === selectedAssetTeam.value);
    if (!team) return allPlayers.value;

    return allPlayers.value.filter(player => {
      return player.team && player.team.id === selectedAssetTeam.value;
    });
  }

  // When acquiring players, show all players not on the receiving team
  return allPlayers.value.filter(player => {
    return !player.team || player.team.id !== selectedAssetTeam.value;
  });
});

function getTeamName(teamId: number): string {
  const team = props.allTeams.find(t => t.id === teamId);
  return team?.name || `Team ${teamId}`;
}

function getGivingAssets(teamId: number): TradeAsset[] {
  return tradeStore.draftTrade.assets.filter(a => a.giving_team === teamId);
}

function getReceivingAssets(teamId: number): TradeAsset[] {
  return tradeStore.draftTrade.assets.filter(a => a.receiving_team === teamId);
}

function handleAddTeam(teamId: number) {
  tradeStore.addTeamToDraft(teamId);
  activeTeamTab.value = teamId;
}

function handleRemoveTeam(teamId: number) {
  tradeStore.removeTeamFromDraft(teamId);
  if (activeTeamTab.value === teamId) {
    activeTeamTab.value = tradeStore.draftTrade.teams[0] || null;
  }
}

function openPlayerSelector(teamId: number, type: 'giving' | 'receiving') {
  selectedAssetTeam.value = teamId;
  selectedAssetType.value = type;
  playerSelectorDialog.value = true;
}

function openPickSelector(teamId: number, type: 'giving' | 'receiving') {
  selectedAssetTeam.value = teamId;
  selectedAssetType.value = type;
  pickSelectorDialog.value = true;
}

function onPlayerSelected(player: any) {
  if (!selectedAssetTeam.value) return;

  const givingTeam = selectedAssetType.value === 'giving' ? selectedAssetTeam.value : null;
  const receivingTeam = selectedAssetType.value === 'receiving' ? selectedAssetTeam.value : null;

  // Find the other team in the trade
  const otherTeamId = tradeStore.draftTrade.teams.find(t => t !== selectedAssetTeam.value);

  if (!otherTeamId) {
    console.error('No other team found in trade');
    return;
  }

  // Set the correct giving/receiving teams and enrich with player data
  const asset = {
    asset_type: 'player' as const,
    giving_team: givingTeam || otherTeamId,
    receiving_team: receivingTeam || otherTeamId,
    player: player.id,
    player_detail: {
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: `${player.first_name} ${player.last_name}`,
      position: player.primary_position || 'N/A',
      nba_team: player.real_team?.abbreviation || 'FA',
      photo_url: player.photo,
    } as Player,
  };

  // Add contract data if available
  if (player.contract) {
    (asset.player_detail as any).contract = player.contract;
  }

  tradeStore.addAssetToDraft(asset);
  playerSelectorDialog.value = false;
  debouncedValidation();
}

function onPickSelected(pick: Pick) {
  if (!selectedAssetTeam.value) return;

  const givingTeam = selectedAssetType.value === 'giving' ? selectedAssetTeam.value : null;
  const receivingTeam = selectedAssetType.value === 'receiving' ? selectedAssetTeam.value : null;

  // Find the other team in the trade
  const otherTeamId = tradeStore.draftTrade.teams.find(t => t !== selectedAssetTeam.value);

  if (!otherTeamId) {
    console.error('No other team found in trade');
    return;
  }

  // Set the correct giving/receiving teams and enrich with pick data
  const asset = {
    asset_type: 'pick' as const,
    giving_team: givingTeam || otherTeamId,
    receiving_team: receivingTeam || otherTeamId,
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

function removeAsset(assets: TradeAsset[], index: number) {
  const globalIndex = tradeStore.draftTrade.assets.indexOf(assets[index]);
  if (globalIndex !== -1) {
    tradeStore.removeAssetFromDraft(globalIndex);
  }
}

// Debounced validation
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

async function saveDraft() {
  try {
    const trade = await tradeStore.saveDraftTrade();
    router.push(`/trades/${trade.id}`);
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

async function proposeTrade() {
  try {
    const trade = await tradeStore.proposeTrade();
    router.push(`/trades/${trade.id}`);
  } catch (error) {
    console.error('Failed to propose trade:', error);
  }
}

function clearDraft() {
  if (confirm('Are you sure you want to clear all trade data?')) {
    tradeStore.clearDraft();
    activeTeamTab.value = props.currentTeamId;
  }
}
</script>

<style scoped lang="scss">
.trade-composer {
  .asset-column {
    min-height: 200px;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
      border-radius: 8px;
    }

    .asset-list {
      max-height: 500px;
      overflow-y: auto;
    }
  }
}
</style>
