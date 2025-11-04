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
            <span class="ml-2">
              {{ isCounterMode ? `Counter Offer for Trade #${tradeId}` : isEditMode ? `Edit Trade #${tradeId}` : 'Create New Trade' }}
            </span>
            <v-spacer />
            <v-chip v-if="currentTrade" :color="getStatusColor(currentTrade.status)" variant="flat">
              {{ currentTrade.status }}
            </v-chip>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Counter Offer Info Banner -->
    <v-row v-if="isCounterMode">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          prominent
          border="start"
        >
          <template #prepend>
            <v-icon>info</v-icon>
          </template>
          <div class="text-subtitle-1 font-weight-medium">
            You're making a counter offer
          </div>
          <div class="text-body-2 mt-1">
            Modify the trade below by adding/removing teams, players, or picks. When you send the counter offer,
            it will replace the original proposal and reset approvals from all teams.
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Team Grid (Horizontal Scrollable) -->
    <v-row>
      <v-col cols="12">
        <div class="team-grid-container">
          <div class="team-grid">
            <!-- Team Cards -->
            <TeamTradeCard
              v-for="teamId in draftTrade.teams"
              :key="teamId"
              :team-id="teamId"
              :team="getTeam(teamId)"
              :assets="draftTrade.assets"
              :available-teams="selectedTeams"
              :is-own-team="teamId === draftTrade.proposing_team"
              :impact="validationResult?.team_impacts[teamId]"
              @add-asset="handleAddAsset"
              @remove-asset="handleRemoveAsset"
              @update-destination="handleUpdateDestination"
              @remove-team="handleRemoveTeam"
            />

            <!-- Add Team Button -->
            <v-card class="add-team-card" elevation="2">
              <v-card-text class="d-flex flex-column align-center justify-center fill-height">
                <v-btn
                  size="large"
                  color="primary"
                  variant="outlined"
                  @click="showTeamSelector = true"
                >
                  <v-icon start>add</v-icon>
                  Add Team
                </v-btn>
                <p class="text-caption text-medium-emphasis mt-2">
                  Add more teams to the trade
                </p>
              </v-card-text>
            </v-card>
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
    <v-row>
      <v-col cols="12">
        <TradeSummaryPanel
          :teams="selectedTeams"
          :assets="draftTrade.assets"
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
              :loading="loading.validation || loading.currentTrade"
              :disabled="!canPropose"
              @click="handlePropose"
            >
              <v-icon start>send</v-icon>
              {{ isCounterMode ? 'Send Counter Offer' : 'Propose Trade' }}
            </v-btn>
            <v-btn
              variant="outlined"
              size="large"
              :loading="loading.currentTrade"
              :disabled="draftTrade.assets.length === 0"
              @click="handleSaveDraft"
            >
              <v-icon start>save</v-icon>
              Save Draft
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
              :loading="loading.validation"
              :disabled="draftTrade.assets.length === 0"
              @click="validateTrade"
            >
              <v-icon start>check_circle</v-icon>
              Validate
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Asset Selector Dialog -->
    <AssetSelector
      v-model="assetSelectorOpen"
      :asset-type="assetSelectorType"
      :giving-team="assetSelectorTeam"
      :available-teams="selectedTeams"
      :available-players="getAvailablePlayers(assetSelectorTeam?.id)"
      :available-picks="getAvailablePicks(assetSelectorTeam?.id)"
      @asset-selected="handleAssetSelected"
    />

    <!-- Team Selector Dialog -->
    <TeamSelector
      v-model="showTeamSelector"
      :selected-teams="draftTrade.teams"
      :available-teams="allTeams"
      @team-selected="handleTeamSelected"
    />

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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { Team, Player, Pick, AssetSelectionData } from '@/types/trade';

import TeamTradeCard from '@/components/trade/TeamTradeCard.vue';
import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue';
import AssetSelector from '@/components/trade/AssetSelector.vue';
import TeamSelector from '@/components/trade/TeamSelector.vue';
import TradeValidationDisplay from '@/components/trade/TradeValidationDisplay.vue';

const router = useRouter();
const route = useRoute();
const tradeStore = useTradeStore();
const authStore = useAuthStore();

const {
  draftTrade,
  currentTrade,
  validationResult,
  loading,
  availablePlayersByTeam,
  availablePicksByTeam,
} = storeToRefs(tradeStore);

// Component state
const assetSelectorOpen = ref(false);
const assetSelectorType = ref<'player' | 'pick'>('player');
const assetSelectorTeam = ref<Team | null>(null);
const showTeamSelector = ref(false);
const allTeams = ref<Team[]>([]);
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Check if edit mode or counter mode
const isEditMode = computed(() => !!route.params.id);
const isCounterMode = computed(() => route.query.mode === 'counter');
const tradeId = computed(() => route.params.id ? parseInt(route.params.id as string) : null);

// Get selected teams as Team objects
const selectedTeams = computed(() => {
  return allTeams.value.filter((t) => draftTrade.value.teams.includes(t.id));
});

// Check if can propose
const canPropose = computed(() => {
  if (draftTrade.value.teams.length < 2) return false;
  if (draftTrade.value.assets.length === 0) return false;

  // Each team must give and receive at least one asset
  return draftTrade.value.teams.every((teamId) => {
    const giving = draftTrade.value.assets.filter((a) => a.giving_team === teamId);
    const receiving = draftTrade.value.assets.filter((a) => a.receiving_team === teamId);
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

// Get available players for team
function getAvailablePlayers(teamId: number | undefined): Player[] {
  if (!teamId) return [];
  return availablePlayersByTeam.value[teamId] || [];
}

// Get available picks for team
function getAvailablePicks(teamId: number | undefined): Pick[] {
  if (!teamId) return [];
  return availablePicksByTeam.value[teamId] || [];
}

// Get status color
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'grey',
    proposed: 'info',
    waiting_approval: 'warning',
    approved: 'success',
    vetoed: 'error',
    rejected: 'error',
    completed: 'success',
  };
  return colors[status] || 'grey';
}

// Handlers
function handleAddAsset(payload: { teamId: number; assetType: 'player' | 'pick' }) {
  assetSelectorType.value = payload.assetType;
  assetSelectorTeam.value = getTeam(payload.teamId);
  assetSelectorOpen.value = true;
}

function handleAssetSelected(selection: AssetSelectionData) {
  const asset = {
    asset_type: selection.asset_type,
    giving_team: selection.giving_team,
    receiving_team: selection.receiving_team,
    ...(selection.asset_type === 'player'
      ? {
          player: selection.asset_id,
          player_detail: selection.player as Player,
        }
      : {
          pick: selection.asset_id,
          pick_detail: {
            ...(selection.pick as Pick),
            protection_type: selection.protection?.type,
            protection_value: selection.protection?.value,
          },
        }),
  };

  tradeStore.addAsset(asset);

  // Auto-validate after adding asset
  if (draftTrade.value.assets.length > 0) {
    validateTrade();
  }

  showSnackbar('Asset added to trade', 'success');
}

function handleRemoveAsset(asset: any) {
  const index = draftTrade.value.assets.findIndex((a) =>
    a.asset_type === asset.asset_type &&
    ((a.player && a.player === asset.player) || (a.pick && a.pick === asset.pick))
  );

  if (index !== -1) {
    tradeStore.removeAsset(index);
    validateTrade();
    showSnackbar('Asset removed from trade', 'info');
  }
}

function handleUpdateDestination(payload: { asset: any; receivingTeam: number }) {
  const index = draftTrade.value.assets.findIndex((a) =>
    a.asset_type === payload.asset.asset_type &&
    ((a.player && a.player === payload.asset.player) || (a.pick && a.pick === payload.asset.pick))
  );

  if (index !== -1) {
    tradeStore.updateAssetDestination(index, payload.receivingTeam);
    validateTrade();
    showSnackbar('Destination updated', 'success');
  }
}

function handleRemoveTeam(teamId: number) {
  tradeStore.removeTeamFromTrade(teamId);
  validateTrade();
  showSnackbar('Team removed from trade', 'info');
}

function handleTeamSelected(teamId: number) {
  tradeStore.addTeamToTrade(teamId);
  showSnackbar('Team added to trade', 'success');
}

async function validateTrade() {
  try {
    await tradeStore.validateTrade();
  } catch (error) {
    console.error('Validation error:', error);
    showSnackbar('Failed to validate trade', 'error');
  }
}

async function handleSaveDraft() {
  try {
    await tradeStore.saveDraftTrade();
    showSnackbar('Draft saved successfully', 'success');
    router.push({ name: 'trade-overview' });
  } catch (error: any) {
    console.error('Save draft error:', error);
    showSnackbar(error.message || 'Failed to save draft', 'error');
  }
}

async function handlePropose() {
  if (!canPropose.value) {
    showSnackbar('Cannot propose: each team must give and receive at least one asset', 'warning');
    return;
  }

  // Validate first
  await validateTrade();

  if (validationResult.value && !validationResult.value.valid) {
    showSnackbar('Cannot propose: trade validation failed', 'error');
    return;
  }

  try {
    await tradeStore.proposeTrade();
    const message = isCounterMode.value
      ? 'Counter offer sent successfully!'
      : 'Trade proposed successfully!';
    showSnackbar(message, 'success');
    router.push({ name: 'trade-overview' });
  } catch (error: any) {
    console.error('Propose error:', error);
    const errorMessage = isCounterMode.value
      ? 'Failed to send counter offer'
      : 'Failed to propose trade';
    showSnackbar(error.message || errorMessage, 'error');
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
    // TODO: Load all teams from API
    // For now, using mock data structure
    // allTeams.value = await TeamService.listTeams();

    if (isEditMode.value && tradeId.value) {
      // Load existing trade
      await tradeStore.fetchTradeById(tradeId.value);

      if (currentTrade.value && currentTrade.value.status === 'draft') {
        // Initialize draft from existing trade
        tradeStore.draftTrade.proposing_team = currentTrade.value.proposing_team;
        tradeStore.draftTrade.teams = currentTrade.value.teams;
        tradeStore.draftTrade.notes = currentTrade.value.notes || '';
        // TODO: Convert assets to draft format
      } else {
        showSnackbar('Can only edit draft trades', 'error');
        router.push({ name: 'trade-overview' });
      }
    } else {
      // Create new trade - need to get user's team
      const userTeamId = authStore.user?.team?.id;

      if (!userTeamId) {
        showSnackbar('You must be on a team to create trades', 'error');
        router.push({ name: 'trade-overview' });
        return;
      }

      tradeStore.createDraftTrade(userTeamId);
    }
  } catch (error) {
    console.error('Failed to load trade:', error);
    showSnackbar('Failed to load trade data', 'error');
  }
});

// Watch for asset changes to auto-validate
watch(
  () => draftTrade.value.assets.length,
  (newLength, oldLength) => {
    if (newLength > 0 && newLength !== oldLength) {
      // Debounce validation
      setTimeout(() => validateTrade(), 500);
    }
  }
);
</script>

<style scoped>
.trade-editor-view {
  padding-bottom: 100px; /* Space for summary panel */
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

.add-team-card {
  min-width: 350px;
  max-width: 500px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gap-2 {
  gap: 8px;
}
</style>
