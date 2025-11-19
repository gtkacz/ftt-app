<template>
  <v-container fluid class="trade-editor-view">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-btn icon variant="text" @click="handleCancel">
              <v-icon>arrow_back</v-icon>
            </v-btn>
            <span class="ml-2">Create New Trade</span>
            <v-spacer />
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Team Selection Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Teams in Trade</v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap gap-2 align-center">
              <v-chip
                v-for="teamId in selectedTeamIds"
                :key="teamId"
                :color="teamId === userTeamId ? 'primary' : 'default'"
                closable
                :disabled="teamId === userTeamId"
                @click:close="removeTeam(teamId)"
              >
                {{ getTeamName(teamId) }}
                <v-icon v-if="teamId === userTeamId" start size="small">person</v-icon>
              </v-chip>
              <v-btn
                color="primary"
                variant="outlined"
                @click="showTeamSelector = true"
              >
                <v-icon start>add</v-icon>
                Add Team
              </v-btn>
            </div>
            <v-alert
              v-if="selectedTeamIds.length < 2"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              You must add at least one other team to create a trade.
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
        <v-card>
          <v-card-text class="d-flex gap-2">
            <v-btn
              color="primary"
              size="large"
              :loading="submitting"
              :disabled="!canPropose"
              @click="handlePropose"
            >
              <v-icon start>send</v-icon>
              Propose Trade
            </v-btn>
            <v-btn
              variant="text"
              size="large"
              @click="handleCancel"
            >
              Cancel
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
              Validate
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Team Selector Dialog -->
    <v-dialog v-model="showTeamSelector" max-width="600px">
      <v-card>
        <v-card-title>Select Team to Add</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="team in availableTeamsToAdd"
              :key="team.id"
              @click="addTeam(team.id)"
            >
              <v-list-item-title>{{ team.name }}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="availableTeamsToAdd.length === 0">
              <v-list-item-title class="text-medium-emphasis">
                No teams available to add
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showTeamSelector = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import type { Team, Player, Pick, CreateTradeAssetData, TradeValidationResponse } from '@/types/trade';
import { TradeService } from '@/api/trade';
import { SettingsService } from '@/api/settings';

import TeamAssetSelector from '@/components/trade/TeamAssetSelector.vue';
import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue';
import TradeValidationDisplay from '@/components/trade/TradeValidationDisplay.vue';

const router = useRouter();
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
const validating = ref(false);
const submitting = ref(false);
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

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

// Check if can propose
const canPropose = computed(() => {
  if (selectedTeamIds.value.length < 2) return false;
  if (selectedAssets.value.length === 0) return false;
  if (!validationResult.value || !validationResult.value.valid) return false;

  // Each team must give and receive at least one asset
  return selectedTeamIds.value.every((teamId) => {
    const giving = selectedAssets.value.filter((a) => a.giving_team === teamId);
    const receiving = selectedAssets.value.filter((a) => a.receiving_team === teamId);
    return giving.length > 0 && receiving.length > 0;
  });
});

// Get team by ID
function getTeam(teamId: number): Team {
  return allTeams.value.find((t) => t.id === teamId) || {
    id: teamId,
    name: 'Unknown Team',
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
function handleAddAsset(asset: CreateTradeAssetData) {
  selectedAssets.value.push(asset);
  // Auto-validate after adding asset
  validateTrade();
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
    // Auto-validate after removing asset
    validateTrade();
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
    // Auto-validate after updating asset
    validateTrade();
  }
}

function addTeam(teamId: number) {
  if (!selectedTeamIds.value.includes(teamId)) {
    selectedTeamIds.value.push(teamId);
    // Load players and picks for the newly added team
    loadTeamAssets(teamId);
    showTeamSelector.value = false;
    showSnackbar('Team added to trade', 'success');
  }
}

function removeTeam(teamId: number) {
  if (teamId === userTeamId.value) {
    showSnackbar('Cannot remove your own team', 'warning');
    return;
  }
  selectedTeamIds.value = selectedTeamIds.value.filter((id) => id !== teamId);
  // Remove all assets involving this team
  selectedAssets.value = selectedAssets.value.filter(
    (a) => a.giving_team !== teamId && a.receiving_team !== teamId
  );
  showSnackbar('Team removed from trade', 'info');
  validateTrade();
}

async function loadTeamAssets(teamId: number) {
  try {
    await tradeStore.loadAvailablePlayers(teamId);
    await tradeStore.loadAvailablePicks(teamId);
  } catch (error) {
    console.error('Failed to load team assets:', error);
    showSnackbar('Failed to load team assets', 'error');
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
  } catch (error) {
    console.error('Validation error:', error);
    showSnackbar('Failed to validate trade', 'error');
    tradeStore.validationResult = null;
  } finally {
    validating.value = false;
  }
}

async function handlePropose() {
  if (!canPropose.value) {
    showSnackbar('Cannot propose: trade validation failed or requirements not met', 'warning');
    return;
  }

  submitting.value = true;
  try {
    // Transform assets to backend format
    // Group by receiver, then format as AssetPayload
    const assetsByReceiver = new Map<number, { players: number[]; picks: Array<{ id: number; protection: string }> }>();

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
        receiverAssets.picks.push({
          id: asset.pick,
          protection: protection,
        });
      }
    });

    // Convert to array format expected by backend
    const payload = Array.from(assetsByReceiver.entries()).map(([receiver, assets]) => ({
      receiver,
      assets,
    }));

    // Submit trade - backend expects array of AssetPayload
    const response = await TradeService.createTrade(payload as any);
    
    showSnackbar('Trade created successfully!', 'success');
    router.push({ name: 'trade-overview' });
  } catch (error: any) {
    console.error('Propose error:', error);
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.status || 
                        error.message || 
                        'Failed to create trade';
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

// Load data on mount
onMounted(async () => {
  try {
    // Load league settings
    const settings = await SettingsService.getSettings();
    leagueSettings.value = {
      SALARY_CAP: settings.SALARY_CAP || 130000000,
      MIN_PLAYER_CAP: settings.MIN_PLAYER_CAP || 13,
      MAX_PLAYER_CAP: settings.MAX_PLAYER_CAP || 15,
    };

    // Load all teams
    allTeams.value = await TradeService.listTeams();

    // Set user's team as default
    const userTeam = userTeamId.value;
    if (userTeam) {
      selectedTeamIds.value = [userTeam];
      // Load players and picks for user's team
      await loadTeamAssets(userTeam);
    } else {
      showSnackbar('You must be on a team to create trades', 'error');
      router.push({ name: 'trade-overview' });
    }
  } catch (error) {
    console.error('Failed to load trade data:', error);
    showSnackbar('Failed to load trade data', 'error');
  }
});
</script>

<style scoped>
.trade-editor-view {
  padding-bottom: 100px;
}

.team-grid-container {
  overflow-x: auto;
  overflow-y: visible;
  padding: 16px 0;
  margin: 0 -12px;
}

.team-grid {
  display: flex;
  gap: 16px;
  padding: 0 12px;
  min-width: min-content;
}

.gap-2 {
  gap: 8px;
}
</style>
