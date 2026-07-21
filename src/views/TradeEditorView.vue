<template>
  <v-container fluid class="trade-editor-view page-view pa-0">
    <!-- Header -->
    <header class="trade-editor-header page-header">
      <v-btn icon variant="tonal" :aria-label="t('tradeEditorView.header.backAriaLabel')" @click="handleCancel">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <div>
        <p class="eyebrow">{{ t('tradeEditorView.header.eyebrow') }}</p>
        <h1 class="page-title">{{ isCounteroffer ? t('tradeEditorView.header.titleCounteroffer') : t('tradeEditorView.header.titleCreate') }}</h1>
        <p class="page-subtitle">{{ t('tradeEditorView.header.subtitle') }}</p>
      </div>
    </header>

    <!-- Team Selection Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="trade-setup-card" variant="flat">
          <v-card-title>{{ t('tradeEditorView.teamsCard.title') }}</v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap gap-2 align-center">
              <v-chip
                v-for="teamId in selectedTeamIds"
                :key="teamId"
                :color="teamId === userTeamId ? 'info' : 'default'"
                :closable="teamId !== userTeamId"
                @click:close="removeTeam(teamId)"
              >
                {{ getTeamName(teamId) }}
                <v-icon v-if="teamId === userTeamId" start size="small">person</v-icon>
              </v-chip>
              <v-btn
                color="secondary"
                variant="outlined"
                class="trade-add-team"
                @click="showTeamSelector = true"
              >
                <v-icon start>add</v-icon>
                {{ t('tradeEditorView.teamsCard.addTeam') }}
              </v-btn>
            </div>
            <v-alert
              v-if="selectedTeamIds.length < 2"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              {{ t('tradeEditorView.teamsCard.minTeamsWarning') }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Team Assets Display (Horizontal Scrollable) -->
    <v-row v-if="selectedTeamIds.length >= 2">
      <v-col cols="12">
        <div class="team-grid-container">
          <div class="team-grid">
            <TeamAssetSelector
              v-for="teamId in selectedTeamIds"
              :key="teamId"
              :team-id="teamId"
              :team="getTeam(teamId)"
              :available-players="getAvailablePlayers(teamId)"
              :available-picks="getAvailablePicks(teamId)"
              :selected-assets="selectedAssets"
              :available-teams="selectedTeams"
              :is-own-team="teamId === userTeamId"
              :impact="validationResult?.team_impacts[teamId]"
              :league-settings="leagueSettings"
              @add-asset="handleAddAsset"
              @remove-asset="handleRemoveAsset"
              @update-asset="handleUpdateAsset"
              @remove-team="removeTeam"
            />
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Validation Errors -->
    <v-row v-if="validationResult && !validationResult.valid">
      <v-col cols="12">
        <TradeValidationDisplay :validation="validationResult" />
      </v-col>
    </v-row>

    <!-- Trade Summary -->
    <v-row v-if="selectedAssets.length > 0">
      <v-col cols="12">
        <TradeSummaryPanel
          :teams="selectedTeams"
          :assets="selectedAssets"
          :validation="validationResult"
        />
      </v-col>
    </v-row>

    <!-- Actions -->
    <v-row>
      <v-col cols="12">
        <v-card class="trade-actions-card" variant="flat">
          <v-card-text class="trade-editor-actions d-flex gap-2">
            <v-btn
              color="secondary"
              size="large"
              :loading="submitting"
              :disabled="!canPropose"
              @click="handlePropose"
            >
              <v-icon start>send</v-icon>
              {{ isCounteroffer ? t('tradeEditorView.actions.proposeCounteroffer') : t('tradeEditorView.actions.proposeTrade') }}
            </v-btn>
            <v-btn
              variant="text"
              size="large"
              @click="handleCancel"
            >
              {{ t('tradeEditorView.actions.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn
              variant="outlined"
              size="large"
              :loading="validating"
              :disabled="selectedAssets.length === 0"
              @click="validateTrade"
            >
              <v-icon start>check_circle</v-icon>
              {{ t('tradeEditorView.actions.validate') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Team Selector Dialog -->
    <v-dialog v-model="showTeamSelector" max-width="700px" scrollable>
      <v-card class="h-100">
        <v-card-title class="d-flex align-center py-3 px-4 border-b">
          <span class="text-h6">{{ t('tradeEditorView.teamSelectorDialog.title') }}</span>
          <v-spacer />
          <v-btn icon variant="text" size="small" :aria-label="t('tradeEditorView.teamSelectorDialog.closeAriaLabel')" @click="showTeamSelector = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <div class="px-4 pt-4 pb-2 sticky-search bg-surface">
            <v-text-field
              v-model="teamSearchQuery"
              :placeholder="t('tradeEditorView.teamSelectorDialog.searchPlaceholder')"
              prepend-inner-icon="search"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-2"
              clearable
            />
          </div>

          <div class="team-list-container px-4 pb-4">
            <div v-if="filteredTeamsToAdd.length > 0" class="team-grid-layout">
              <v-card
                v-for="team in filteredTeamsToAdd"
                :key="team.id"
                class="team-selection-card cursor-pointer"
                variant="outlined"
                @click="addTeam(team.id)"
              >
                <v-card-text class="d-flex align-center pa-3">
                  <v-avatar size="48" class="mr-3 border bg-grey-lighten-5">
                    <v-img v-if="team.logo" :src="team.logo" cover />
                    <span v-else class="text-h6 font-weight-bold text-primary">{{ team.name.charAt(0) }}</span>
                  </v-avatar>
                  
                  <div class="flex-grow-1 min-width-0">
                    <div class="text-subtitle-1 font-weight-bold text-truncate">{{ team.name }}</div>
                    <div class="text-caption text-medium-emphasis d-flex align-center">
                      <v-icon size="x-small" class="mr-1">person</v-icon>
                      {{ team.owner_username || t('tradeEditorView.teamSelectorDialog.unknownOwner') }}
                    </div>
                  </div>

                  <v-icon color="primary" class="ml-2">add_circle_outline</v-icon>
                </v-card-text>
              </v-card>
            </div>

            <div v-else class="text-center py-8">
               <v-icon size="64" color="grey-lighten-1" class="mb-2">search_off</v-icon>
               <div class="text-h6 text-medium-emphasis">{{ t('tradeEditorView.teamSelectorDialog.noTeamsFound') }}</div>
               <p class="text-body-2 text-medium-emphasis">{{ t('tradeEditorView.teamSelectorDialog.noTeamsHint') }}</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">{{ t('tradeEditorView.snackbar.close') }}</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import type { Team, Player, Pick, CreateTradeAssetData, TradeValidationResponse, Trade, BackendTradeAssets, TradeAsset } from '@/types/trade';
import { TradeService } from '@/api/trade';
import { SettingsService } from '@/api/settings';

import TeamAssetSelector from '@/components/trade/TeamAssetSelector.vue';
import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue';
import TradeValidationDisplay from '@/components/trade/TradeValidationDisplay.vue';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const tradeStore = useTradeStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const {
  availablePlayersByTeam,
  availablePicksByTeam,
  validationResult: storeValidationResult,
  loading: storeLoading,
} = storeToRefs(tradeStore);

// Local validation result ref for reactivity
const validationResult = computed(() => storeValidationResult.value);

// Component state
const selectedTeamIds = ref<number[]>([]);
const selectedAssets = ref<CreateTradeAssetData[]>([]);
const allTeams = ref<Team[]>([]);
const leagueSettings = ref<{
  SALARY_CAP: number;
  MIN_PLAYER_CAP: number;
  MAX_PLAYER_CAP: number;
} | null>(null);
const showTeamSelector = ref(false);
const teamSearchQuery = ref('');
const validating = ref(false);
const submitting = ref(false);
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Counteroffer state
const originalTradeId = ref<number | null>(null);
const isCounteroffer = computed(() => originalTradeId.value !== null);

// User's team ID
const userTeamId = computed(() => authStore.user?.team?.id);

// Selected teams as Team objects
const selectedTeams = computed(() => {
  return allTeams.value.filter((t) => selectedTeamIds.value.includes(t.id));
});

// Available teams to add (not already selected)
const availableTeamsToAdd = computed(() => {
  return allTeams.value.filter((t) => !selectedTeamIds.value.includes(t.id));
});

// Filtered available teams based on search
const filteredTeamsToAdd = computed(() => {
  const query = teamSearchQuery.value.toLowerCase().trim();
  if (!query) return availableTeamsToAdd.value;
  
  return availableTeamsToAdd.value.filter(team => 
    team.name.toLowerCase().includes(query) || 
    (team.owner_username && team.owner_username.toLowerCase().includes(query))
  );
});

// Check if can propose
const canPropose = computed(() => {
  if (selectedTeamIds.value.length < 2) return false;
  if (selectedAssets.value.length === 0) return false;
  
  // If validation result exists and is invalid, don't allow propose
  if (validationResult.value && !validationResult.value.valid) return false;

  // Each team must give and receive at least one asset
  const allTeamsValid = selectedTeamIds.value.every((teamId) => {
    const giving = selectedAssets.value.filter((a) => a.giving_team === teamId);
    const receiving = selectedAssets.value.filter((a) => a.receiving_team === teamId);
    return giving.length > 0 && receiving.length > 0;
  });
  
  if (!allTeamsValid) return false;
  
  // If validation endpoint exists and returned a result, require it to be valid
  // Otherwise, allow propose if basic requirements are met
  return true;
});

// Get team by ID
function getTeam(teamId: number): Team {
  return allTeams.value.find((t) => t.id === teamId) || {
    id: teamId,
    name: t('tradeEditorView.unknownTeam'),
    owner: 0,
  };
}

// Get team name
function getTeamName(teamId: number): string {
  return getTeam(teamId).name;
}

// Get available players for team
function getAvailablePlayers(teamId: number): Player[] {
  return availablePlayersByTeam.value[teamId] || [];
}

// Get available picks for team
function getAvailablePicks(teamId: number): Pick[] {
  return availablePicksByTeam.value[teamId] || [];
}

// Handlers
// Debounce validation to avoid too many calls
let validationTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedValidate() {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
  validationTimeout = setTimeout(() => {
    validateTrade();
  }, 500); // Wait 500ms after last change
}

function handleAddAsset(asset: CreateTradeAssetData) {
  selectedAssets.value.push(asset);
  // Debounced validation after adding asset
  debouncedValidate();
}

function handleRemoveAsset(asset: CreateTradeAssetData) {
  const index = selectedAssets.value.findIndex((a) => {
    if (a.asset_type === 'player' && asset.asset_type === 'player') {
      return a.player === asset.player && a.giving_team === asset.giving_team;
    }
    if (a.asset_type === 'pick' && asset.asset_type === 'pick') {
      return a.pick === asset.pick && a.giving_team === asset.giving_team;
    }
    return false;
  });
  if (index !== -1) {
    selectedAssets.value.splice(index, 1);
    // Debounced validation after removing asset
    debouncedValidate();
  }
}

function handleUpdateAsset(asset: CreateTradeAssetData) {
  const index = selectedAssets.value.findIndex((a) => {
    if (a.asset_type === 'player' && asset.asset_type === 'player') {
      return a.player === asset.player && a.giving_team === asset.giving_team;
    }
    if (a.asset_type === 'pick' && asset.asset_type === 'pick') {
      return a.pick === asset.pick && a.giving_team === asset.giving_team;
    }
    return false;
  });
  if (index !== -1) {
    // Merge the update, preserving existing properties
    selectedAssets.value[index] = {
      ...selectedAssets.value[index],
      ...asset,
      // For picks, ensure protection is stored
      pick_detail: asset.pick_detail || selectedAssets.value[index].pick_detail,
    };
    // Debounced validation after updating asset
    debouncedValidate();
  }
}

function addTeam(teamId: number) {
  if (!selectedTeamIds.value.includes(teamId)) {
    selectedTeamIds.value.push(teamId);
    // Load players and picks for the newly added team
    loadTeamAssets(teamId);
    showTeamSelector.value = false;
    teamSearchQuery.value = ''; // Reset search
    showSnackbar(t('tradeEditorView.messages.teamAdded'), 'success');
  }
}

function removeTeam(teamId: number) {
  if (teamId === userTeamId.value) {
    showSnackbar(t('tradeEditorView.messages.cannotRemoveOwnTeam'), 'warning');
    return;
  }
  selectedTeamIds.value = selectedTeamIds.value.filter((id) => id !== teamId);
  // Remove all assets involving this team
  selectedAssets.value = selectedAssets.value.filter(
    (a) => a.giving_team !== teamId && a.receiving_team !== teamId
  );
  showSnackbar(t('tradeEditorView.messages.teamRemoved'), 'info');
  validateTrade();
}

async function loadTeamAssets(teamId: number) {
  try {
    await tradeStore.loadAvailablePlayers(teamId);
    await tradeStore.loadAvailablePicks(teamId);
  } catch (error) {
    console.error('Failed to load team assets:', error);
    showSnackbar(t('tradeEditorView.messages.failedToLoadTeamAssets'), 'error');
  }
}

async function validateTrade() {
  if (selectedAssets.value.length === 0) {
    // Clear validation if no assets
    if (tradeStore.validationResult) {
      tradeStore.validationResult = null;
    }
    return;
  }

  validating.value = true;
  try {
    // Prepare validation payload - match ValidateTradeData type
    const validationPayload = {
      teams: selectedTeamIds.value,
      assets: selectedAssets.value.map((asset) => {
        const cleanAsset: any = {
          asset_type: asset.asset_type,
          giving_team: asset.giving_team,
          receiving_team: asset.receiving_team,
        };
        if (asset.asset_type === 'player' && asset.player) {
          cleanAsset.player = asset.player; // Contract ID
        } else if (asset.asset_type === 'pick' && asset.pick) {
          cleanAsset.pick = asset.pick;
        }
        return cleanAsset;
      }),
    };

    const result = await TradeService.validateTrade(validationPayload);
    // Update store validation result
    tradeStore.validationResult = result;
  } catch (error: any) {
    // Only log error, don't show snackbar for missing endpoint (404) or network issues
    // Only show snackbar for actual validation failures (400/422)
    const status = error.response?.status;
    if (status === 404) {
      // Endpoint doesn't exist - validation is optional
      console.log('Validation endpoint not available, skipping validation');
      tradeStore.validationResult = null;
    } else if (status === 400 || status === 422) {
      // Actual validation failure
      console.error('Validation failed:', error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          t('tradeEditorView.messages.tradeValidationFailed');
      showSnackbar(errorMessage, 'error');
      tradeStore.validationResult = null;
    } else {
      // Other errors (network, etc.) - log but don't show snackbar
      console.error('Validation error:', error);
      tradeStore.validationResult = null;
    }
  } finally {
    validating.value = false;
  }
}

async function handlePropose() {
  if (!canPropose.value) {
    showSnackbar(t('tradeEditorView.messages.cannotProposeIncomplete'), 'warning');
    return;
  }

  submitting.value = true;
  try {
    // Transform assets to backend format
    // Group by receiver, then format as AssetPayload
    const assetsByReceiver = new Map<number, { players: number[]; picks: Array<{ id: number; protection: string; metadata?: { x_value: number } }> }>();

    selectedAssets.value.forEach((asset) => {
      const receiver = asset.receiving_team;
      if (!assetsByReceiver.has(receiver)) {
        assetsByReceiver.set(receiver, { players: [], picks: [] });
      }
      const receiverAssets = assetsByReceiver.get(receiver)!;

      if (asset.asset_type === 'player' && asset.player) {
        receiverAssets.players.push(asset.player); // Contract ID
      } else if (asset.asset_type === 'pick' && asset.pick) {
        // Get protection from asset (stored at top level or in pick_detail)
        const protection = (asset as any).protection_type || 
                          (asset as any).pick_detail?.protection_type || 
                          'unprotected';
        const protectionValue = (asset as any).protection_value || 
                               (asset as any).pick_detail?.protection_value;
        
        const pickPayload: { id: number; protection: string; metadata?: { x_value: number } } = {
          id: asset.pick,
          protection: protection,
        };
        
        // Include metadata with x_value if protection is top_x and value is provided
        if (protection === 'top_x' && protectionValue !== undefined && protectionValue !== null) {
          pickPayload.metadata = { x_value: protectionValue };
        }
        
        receiverAssets.picks.push(pickPayload);
      }
    });

    // Convert to array format expected by backend
    const payload = Array.from(assetsByReceiver.entries()).map(([receiver, assets]) => ({
      receiver,
      assets,
    }));

    // If this is a counteroffer, call the counteroffer action endpoint directly
    // Do NOT create a new trade first
    if (isCounteroffer.value && originalTradeId.value) {
      try {
        await TradeService.performTradeAction({
          action: 'counteroffer',
          trade_id: originalTradeId.value,
          offer: payload, // Pass the AssetPayload array directly
        });
        
        showSnackbar(t('tradeEditorView.messages.counterofferCreated'), 'success');
        router.push({ name: 'trade-overview' });
        return;
      } catch (counterError: any) {
        console.error('Counteroffer action error:', counterError);
        const errorMessage = counterError.response?.data?.detail ||
                           counterError.message ||
                           t('tradeEditorView.messages.failedToCreateCounteroffer');
        showSnackbar(errorMessage, 'error');
        return;
      }
    }

    // For regular trades, create the trade normally
    // Submit trade - backend expects array of AssetPayload
    const createResponse = await TradeService.createTrade(payload as any);

    showSnackbar(t('tradeEditorView.messages.tradeCreated'), 'success');

    router.push({ name: 'trade-overview' });
  } catch (error: any) {
    console.error('Propose error:', error);
    const errorMessage = error.response?.data?.detail ||
                        error.response?.data?.status ||
                        error.message ||
                        t('tradeEditorView.messages.failedToCreateTrade');
    showSnackbar(errorMessage, 'error');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  router.push({ name: 'trade-overview' });
}

function showSnackbar(message: string, color: 'success' | 'error' | 'warning' | 'info') {
  snackbar.value = { show: true, message, color };
}

// Transform trade assets to CreateTradeAssetData format
function transformTradeAssetsToCreateData(trade: Trade): CreateTradeAssetData[] {
  const assets: CreateTradeAssetData[] = [];
  
  // The backend returns assets as BackendTradeAssets { players: [], picks: [] }
  // But we need to get giving_team and receiving_team from the TradeAsset objects
  // We need to fetch the full trade with assets to get this info, or reconstruct from participants
  
  // Handle both BackendTradeAssets and TradeAsset[] formats
  if (Array.isArray(trade.assets)) {
    // TradeAsset[] format - has giving_team and receiving_team directly
    trade.assets.forEach((asset: TradeAsset) => {
      const createAsset: CreateTradeAssetData = {
        asset_type: asset.asset_type,
        giving_team: asset.giving_team,
        receiving_team: asset.receiving_team,
        player_detail: asset.player_detail || undefined,
        pick_detail: asset.pick_detail || undefined,
      };
      
      if (asset.asset_type === 'player' && asset.player) {
        createAsset.player = asset.player;
      } else if (asset.asset_type === 'pick' && asset.pick) {
        createAsset.pick = asset.pick;
        // Extract protection from pick_detail if available
        if (asset.pick_detail) {
          (createAsset as any).protection_type = asset.pick_detail.protection_type || 'unprotected';
          (createAsset as any).protection_value = asset.pick_detail.protection_value;
        }
      }
      
      assets.push(createAsset);
    });
  } else if (trade.assets && typeof trade.assets === 'object') {
    // BackendTradeAssets format { players: [], picks: [] }
    // This format doesn't include giving_team/receiving_team directly
    // We need to infer from the asset's team (contract.team for players, current_team for picks)
    const backendAssets = trade.assets as BackendTradeAssets;
    const participants = trade.participants || trade.teams_detail || [];
    const participantIds = participants.map((t: Team | number) => typeof t === 'object' ? t.id : t);
    
    // Process players - infer giving_team from contract.team
    if (backendAssets.players && Array.isArray(backendAssets.players)) {
      backendAssets.players.forEach((playerData: any) => {
        if (typeof playerData !== 'object') return;
        
        // The backend sends player data, but we need contract ID
        // Try to get contract ID from playerData.contract.id
        // If not available, we'll try to match with loaded players later
        const contractId = playerData.contract?.id;
        const playerTeam = playerData.team || playerData.contract?.team;
        const givingTeamId = typeof playerTeam === 'object' ? playerTeam.id : playerTeam;
        const playerId = playerData.id;
        
        // Find receiving team (other participant)
        if (givingTeamId && participantIds.includes(givingTeamId)) {
          const receivingTeamId = participantIds.find((id: number) => id !== givingTeamId);
          
          if (receivingTeamId) {
            // If we have contract ID, use it directly
            if (contractId) {
              assets.push({
                asset_type: 'player',
                giving_team: givingTeamId,
                receiving_team: receivingTeamId,
                player: contractId,
                player_detail: playerData,
              });
            } else if (playerId) {
              // Try to find contract ID from loaded players
              // This will be matched later when players are loaded
              const teamPlayers = availablePlayersByTeam.value[givingTeamId] || [];
              const matchingPlayer = teamPlayers.find((p: Player) => p.id === playerId);
              
              if (matchingPlayer?.contract?.id) {
                assets.push({
                  asset_type: 'player',
                  giving_team: givingTeamId,
                  receiving_team: receivingTeamId,
                  player: matchingPlayer.contract.id,
                  player_detail: playerData,
                });
              } else {
                // Store player ID temporarily - we'll try to resolve contract ID after players are loaded
                console.warn(`Could not find contract ID for player ${playerId} on team ${givingTeamId}`);
              }
            }
          }
        }
      });
    }
    
    // Process picks - infer giving_team from current_team
    if (backendAssets.picks && Array.isArray(backendAssets.picks)) {
      backendAssets.picks.forEach((pickData: any) => {
        if (typeof pickData !== 'object') return;
        
        const pickId = pickData.id;
        const currentTeam = pickData.current_team || pickData.team;
        const givingTeamId = typeof currentTeam === 'object' ? currentTeam.id : currentTeam;
        const protection = pickData.protection || pickData.protection_type || 'unprotected';
        const protectionValue = pickData.protection_value || pickData.value;
        
        // Find receiving team (other participant)
        if (givingTeamId && participantIds.includes(givingTeamId)) {
          const receivingTeamId = participantIds.find((id: number) => id !== givingTeamId);
          
          if (receivingTeamId && pickId) {
            const createAsset: CreateTradeAssetData = {
              asset_type: 'pick',
              giving_team: givingTeamId,
              receiving_team: receivingTeamId,
              pick: pickId,
              pick_detail: pickData,
            };
            
            (createAsset as any).protection_type = protection;
            (createAsset as any).protection_value = protectionValue;
            
            assets.push(createAsset);
          }
        }
      });
    }
  }
  
  return assets;
}

// Load and pre-fill original trade for counteroffer
async function loadOriginalTradeForCounteroffer(tradeId: number) {
  try {
    const originalTrade = await TradeService.getTrade(tradeId);
    
    // Extract teams from original trade
    const teams = originalTrade.participants || originalTrade.teams_detail || [];
    const teamIds = teams.map((t: Team | number) => typeof t === 'object' ? t.id : t);
    
    if (teamIds.length > 0) {
      // Reorder teams so user's team comes first (for counteroffer)
      const userTeam = userTeamId.value;
      if (userTeam && teamIds.includes(userTeam)) {
        // Move user's team to the front
        const reorderedTeamIds = [userTeam, ...teamIds.filter(id => id !== userTeam)];
        selectedTeamIds.value = reorderedTeamIds;
      } else {
        selectedTeamIds.value = [...teamIds];
      }
      
      // Load assets for all teams
      for (const teamId of selectedTeamIds.value) {
        await loadTeamAssets(teamId);
      }
    }
    
    // Transform and set assets
    // Note: We need players to be loaded first to get contract IDs
    // So we transform after all teams' assets are loaded
    const transformedAssets = transformTradeAssetsToCreateData(originalTrade);
    
    // If some assets couldn't be transformed (missing contract IDs), try again after a short delay
    // to allow players to finish loading
    if (transformedAssets.length === 0 && (originalTrade.assets as any)?.players?.length > 0) {
      // Wait a bit for players to load, then retry
      setTimeout(() => {
        const retryAssets = transformTradeAssetsToCreateData(originalTrade);
        if (retryAssets.length > 0) {
          selectedAssets.value = retryAssets;
          debouncedValidate();
        }
      }, 500);
    } else {
      selectedAssets.value = transformedAssets;
      
      // Auto-validate after loading
      if (transformedAssets.length > 0) {
        debouncedValidate();
      }
    }
  } catch (error) {
    console.error('Failed to load original trade:', error);
    showSnackbar(t('tradeEditorView.messages.failedToLoadOriginalTrade'), 'error');
    // Navigate back if we can't load the trade
    router.push({ name: 'trade-overview' });
  }
}

// Load data on mount
onMounted(async () => {
  try {
    // Check if this is a counteroffer
    const counterofferId = route.query.counterofferId;
    if (counterofferId) {
      originalTradeId.value = parseInt(counterofferId as string, 10);
    }

    // Load league settings
    const settings = await SettingsService.getSettings();
    leagueSettings.value = {
      SALARY_CAP: settings.SALARY_CAP || 130000000,
      MIN_PLAYER_CAP: settings.MIN_PLAYER_CAP || 13,
      MAX_PLAYER_CAP: settings.MAX_PLAYER_CAP || 15,
    };

    // Load all teams
    allTeams.value = await TradeService.listTeams();

    // If counteroffer, load original trade
    if (originalTradeId.value) {
      await loadOriginalTradeForCounteroffer(originalTradeId.value);
    } else {
      // Normal create flow - set user's team as default
      const userTeam = userTeamId.value;
      if (userTeam) {
        selectedTeamIds.value = [userTeam];
        // Load players and picks for user's team
        await loadTeamAssets(userTeam);
      } else {
        showSnackbar(t('tradeEditorView.messages.mustBeOnTeam'), 'error');
        router.push({ name: 'trade-overview' });
      }
    }
  } catch (error) {
    console.error('Failed to load trade data:', error);
    showSnackbar(t('tradeEditorView.messages.failedToLoadTradeData'), 'error');
  }
});
</script>

<style scoped>
.trade-editor-view {
  padding-bottom: 100px;
}

.trade-editor-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  max-width: 850px;

  .eyebrow {
    margin-top: 4px;
  }
}

.trade-setup-card,
.trade-actions-card {
  border: 1px solid var(--surface-border);
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 14px 36px rgba(4, 10, 24, 0.12);
}

.team-grid-container {
  overflow-x: auto;
  overflow-y: visible;
  padding: 16px 0;
  margin: 0 -12px;
  scroll-padding-inline: 12px;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
}

.team-grid {
  display: flex;
  gap: 16px;
  padding: 0 12px;
  min-width: min-content;
}

.team-grid :deep(.team-asset-selector) {
  scroll-snap-align: start;
}

.gap-2 {
  gap: 8px;
}

.trade-add-team {
  min-height: 44px;
}

.sticky-search {
  position: sticky;
  top: 0;
  z-index: 2;
}

.team-grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.team-selection-card {
  transition: all 0.2s;
}

.team-selection-card:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary), 0.05);
}

.min-width-0 {
  min-width: 0;
}

@media (max-width: 600px) {
  .trade-editor-view {
    padding-bottom: 24px;
  }

  .trade-editor-header {
    gap: 11px;
  }

  .trade-editor-actions {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    padding: 16px;

    .v-btn:first-child {
      grid-column: 1 / -1;
    }

    .v-spacer {
      display: none;
    }
  }

  .team-grid-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
