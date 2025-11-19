<template>
  <v-container fluid class="trade-overview-view">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>swap_horiz</v-icon>
            Trade Center
            <v-spacer />
            <v-btn
              color="primary"
              @click="createNewTrade"
            >
              <v-icon start>add</v-icon>
              Create New Trade
            </v-btn>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Status Tabs -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-tabs
            v-model="activeTab"
            color="primary"
            align-tabs="center"
            show-arrows
          >
            <v-tab value="waiting_acceptance">
              <v-icon start>schedule</v-icon>
              Waiting Response
              <v-chip
                v-if="getCountByStatus('waiting_acceptance') > 0"
                size="x-small"
                class="ml-2"
                color="info"
              >
                {{ getCountByStatus('waiting_acceptance') }}
              </v-chip>
            </v-tab>
            <v-tab value="rejected">
              <v-icon start>cancel</v-icon>
              Rejected
              <v-chip
                v-if="getCountByStatus('rejected') > 0"
                size="x-small"
                class="ml-2"
                color="error"
              >
                {{ getCountByStatus('rejected') }}
              </v-chip>
            </v-tab>
            <v-tab value="accepted">
              <v-icon start>check_circle</v-icon>
              Accepted
              <v-chip
                v-if="getCountByStatus('accepted') > 0"
                size="x-small"
                class="ml-2"
                color="warning"
              >
                {{ getCountByStatus('accepted') }}
              </v-chip>
            </v-tab>
            <v-tab v-if="isCommissioner" value="pending_approval">
              <v-icon start>gavel</v-icon>
              Pending Approval
              <v-chip
                v-if="getPendingApprovalTrades().length > 0"
                size="x-small"
                class="ml-2"
                color="warning"
              >
                {{ getPendingApprovalTrades().length }}
              </v-chip>
            </v-tab>
            <v-tab value="vetoed">
              <v-icon start>block</v-icon>
              Vetoed
              <v-chip
                v-if="getCountByStatus('vetoed') > 0"
                size="x-small"
                class="ml-2"
                color="error"
              >
                {{ getCountByStatus('vetoed') }}
              </v-chip>
            </v-tab>
            <v-tab value="completed">
              <v-icon start>done_all</v-icon>
              Completed
              <v-chip
                v-if="getCountByStatus('completed') > 0"
                size="x-small"
                class="ml-2"
                color="success"
              >
                {{ getCountByStatus('completed') }}
              </v-chip>
            </v-tab>
          </v-tabs>

          <v-divider />

          <v-card-text>
            <v-window v-model="activeTab">
              <!-- Waiting Acceptance Tab -->
              <v-window-item value="waiting_acceptance">
                <TradeList
                  :trades="tradesByStatus('waiting_acceptance')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                  @respond-trade="handleRespondTrade"
                />
              </v-window-item>

              <!-- Rejected Tab -->
              <v-window-item value="rejected">
                <TradeList
                  :trades="tradesByStatus('rejected')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Accepted Tab -->
              <v-window-item value="accepted">
                <TradeList
                  :trades="tradesByStatus('accepted')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Pending Approval Tab (Commissioners Only) -->
              <v-window-item v-if="isCommissioner" value="pending_approval">
                <CommissionerTradeList
                  :trades="getPendingApprovalTrades()"
                  :loading="loading.trades"
                  :voting-trade-id="votingTradeId"
                  @trade-click="handleTradeClick"
                  @approve="handleApprove"
                  @veto="handleVeto"
                />
              </v-window-item>

              <!-- Vetoed Tab -->
              <v-window-item value="vetoed">
                <TradeList
                  :trades="tradesByStatus('vetoed')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>

              <!-- Completed Tab -->
              <v-window-item value="completed">
                <TradeList
                  :trades="tradesByStatus('completed')"
                  :loading="loading.trades"
                  @trade-click="handleTradeClick"
                />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FAB for mobile -->
    <v-btn
      class="fab-create"
      color="primary"
      size="large"
      icon
      elevation="8"
      @click="createNewTrade"
    >
      <v-icon>add</v-icon>
    </v-btn>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Approve Confirmation Dialog -->
    <v-dialog v-model="approveDialog.show" max-width="700px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="success" class="mr-2">check_circle</v-icon>
          Approve Trade
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            Please review the trade details below before approving.
          </v-alert>
          
          <!-- Trade Summary -->
          <div v-if="approveDialog.trade" class="trade-summary-dialog">
            <TradeSummaryPanel
              :teams="approveDialog.trade.teams_detail || approveDialog.trade.participants || []"
              :assets="getTransformedAssetsForDialog(approveDialog.trade)"
              :validation="null"
            />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeApproveDialog">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="votingTradeId === approveDialog.trade?.id"
            @click="confirmApprove"
          >
            <v-icon start>check_circle</v-icon>
            Confirm Approval
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Veto Confirmation Dialog -->
    <v-dialog v-model="vetoDialog.show" max-width="700px" persistent scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">gavel</v-icon>
          Veto Trade
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            Are you sure you want to veto this trade? This action cannot be undone.
          </v-alert>
          
          <!-- Trade Summary -->
          <div v-if="vetoDialog.trade" class="trade-summary-dialog mb-4">
            <TradeSummaryPanel
              :teams="vetoDialog.trade.teams_detail || vetoDialog.trade.participants || []"
              :assets="getTransformedAssetsForDialog(vetoDialog.trade)"
              :validation="null"
            />
          </div>
          
          <v-textarea
            v-model="vetoDialog.reason"
            label="Reason (optional)"
            variant="outlined"
            rows="3"
            placeholder="Provide a reason for vetoing this trade..."
            hint="Optional: Add a note explaining why this trade is being vetoed"
            persistent-hint
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeVetoDialog">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="votingTradeId === vetoDialog.trade?.id"
            @click="confirmVeto"
          >
            <v-icon start>block</v-icon>
            Confirm Veto
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { Trade, TradeDisplayStatus } from '@/types/trade';
import { getTradeDisplayStatus } from '@/types/trade';
import TradeList from '@/components/trade/TradeList.vue';
import CommissionerTradeList from '@/components/trade/CommissionerTradeList.vue';
import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue';

const router = useRouter();
const tradeStore = useTradeStore();
const authStore = useAuthStore();

const { loading } = storeToRefs(tradeStore);

// Component state
const activeTab = ref<string>('waiting_acceptance');
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});
const votingTradeId = ref<number | null>(null);
const approveDialog = ref({
  show: false,
  trade: null as Trade | null,
});
const vetoDialog = ref({
  show: false,
  trade: null as Trade | null,
  reason: '',
});

// Check if user is commissioner/admin
const isCommissioner = computed(() => {
  return authStore.user?.is_staff || authStore.user?.is_superuser || false;
});

// Get trades by display status
function tradesByStatus(status: TradeDisplayStatus): Trade[] {
  const allTrades = tradeStore.tradesByDisplayStatus(status);
  
  // For "waiting_acceptance" (waiting response), filter to only show trades where user is a participant
  // Staff users can see all trades, but "waiting response" should only show their own trades
  // The "pending_approval" tab (for commissioners) will show all accepted trades
  if (status === 'waiting_acceptance') {
    const userTeamId = authStore.user?.team?.id;
    if (userTeamId) {
      return allTrades.filter((trade) => {
        const participantIds = trade.teams_detail?.map((t: any) => t.id) || 
                               trade.participants?.map((t: any) => typeof t === 'object' ? t.id : t) ||
                               trade.teams || [];
        return participantIds.includes(userTeamId);
      });
    }
    return [];
  }
  
  // For other statuses, show all trades (staff can see all, regular users already filtered by backend)
  return allTrades;
}

// Get count by status
function getCountByStatus(status: TradeDisplayStatus): number {
  return tradesByStatus(status).length;
}

// Get trades pending approval (for commissioners)
// Includes: accepted trades and approved trades that aren't finalized yet
function getPendingApprovalTrades(): Trade[] {
  const allTrades = tradeStore.trades || [];
  
  return allTrades.filter((trade) => {
    const displayStatus = trade.displayStatus || getTradeDisplayStatus(trade);
    
    // Include trades that are accepted (waiting for first approval)
    if (displayStatus === 'accepted') {
      return true;
    }
    
    // Include trades that are approved but not finalized (done=false)
    // This allows commissioners to still vote even if others have already approved
    if (displayStatus === 'approved' && !trade.done) {
      return true;
    }
    
    return false;
  });
}

// Navigation handlers
function createNewTrade() {
  router.push({ name: 'trade-create' });
}

function handleTradeClick(trade: Trade) {
  router.push({ name: 'trade-detail', params: { id: trade.id } });
}

async function handleRespondTrade(payload: { trade: Trade; response: 'accept' | 'reject' | 'counter' }) {
  const { trade, response } = payload;
  
  try {
    if (response === 'counter') {
      // Navigate to create page with counteroffer query param
      router.push({ 
        name: 'trade-create', 
        query: { counterofferId: trade.id.toString() } 
      });
      return;
    }

    // Use the backend trade action endpoint
    const { TradeService } = await import('@/api/trade');
    await TradeService.performTradeAction({
      action: response === 'accept' ? 'accepted' : 'rejected',
      trade_id: trade.id,
    });

    showSnackbar(`Trade ${response === 'accept' ? 'accepted' : 'rejected'} successfully`, 'success');
    await loadTrades();
  } catch (error: any) {
    console.error('Trade action error:', error);
    const errorMessage = error.response?.data?.detail || error.message || `Failed to ${response} trade`;
    showSnackbar(errorMessage, 'error');
  }
}

function showSnackbar(message: string, color: 'success' | 'error' | 'warning' | 'info') {
  snackbar.value = { show: true, message, color };
}

// Load trades on mount
async function loadTrades() {
  try {
    await tradeStore.fetchUserTrades();
  } catch (error) {
    console.error('Failed to load trades:', error);
    showSnackbar('Failed to load trades', 'error');
  }
}

// Check if user has already voted on a trade
function hasUserVoted(trade: Trade): boolean {
  const userTeamId = authStore.user?.team?.id;
  if (!userTeamId) return false;
  
  // Check commissioner statuses: status.commissioners[teamId].status
  const status = trade.backendStatus || (trade as any).status;
  if (status?.commissioners && status.commissioners[userTeamId]) {
    const commissionerStatus = status.commissioners[userTeamId];
    const voteStatus = commissionerStatus?.status;
    return voteStatus === 'approved' || voteStatus === 'vetoed';
  }
  
  return false;
}

// Handle approve action (opens dialog first)
function handleApprove(trade: Trade) {
  if (!trade.id) return;
  // Prevent voting if user has already voted
  if (hasUserVoted(trade)) {
    showSnackbar('You have already voted on this trade', 'warning');
    return;
  }
  approveDialog.value = {
    show: true,
    trade: trade,
  };
}

// Confirm approve action
async function confirmApprove() {
  if (!approveDialog.value.trade?.id) return;
  
  try {
    votingTradeId.value = approveDialog.value.trade.id;
    const { TradeService } = await import('@/api/trade');
    await TradeService.performTradeAction({
      action: 'approved',
      trade_id: approveDialog.value.trade.id,
    });
    showSnackbar('Trade approved successfully', 'success');
    closeApproveDialog();
    await loadTrades();
  } catch (error: any) {
    console.error('Approve error:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to approve trade';
    showSnackbar(errorMessage, 'error');
  } finally {
    votingTradeId.value = null;
  }
}

// Close approve dialog
function closeApproveDialog() {
  approveDialog.value = {
    show: false,
    trade: null,
  };
}

// Handle veto action (opens dialog first)
function handleVeto(trade: Trade) {
  if (!trade.id) return;
  // Prevent voting if user has already voted
  if (hasUserVoted(trade)) {
    showSnackbar('You have already voted on this trade', 'warning');
    return;
  }
  vetoDialog.value = {
    show: true,
    trade: trade,
    reason: '',
  };
}

// Confirm veto action
async function confirmVeto() {
  if (!vetoDialog.value.trade?.id) return;
  
  try {
    votingTradeId.value = vetoDialog.value.trade.id;
    const { TradeService } = await import('@/api/trade');
    await TradeService.performTradeAction({
      action: 'vetoed',
      trade_id: vetoDialog.value.trade.id,
    });
    showSnackbar('Trade vetoed successfully', 'success');
    closeVetoDialog();
    await loadTrades();
  } catch (error: any) {
    console.error('Veto error:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to veto trade';
    showSnackbar(errorMessage, 'error');
  } finally {
    votingTradeId.value = null;
  }
}

// Close veto dialog
function closeVetoDialog() {
  vetoDialog.value = {
    show: false,
    trade: null,
    reason: '',
  };
}

// Get transformed assets for display in dialogs
function getTransformedAssetsForDialog(trade: Trade | null): any[] {
  if (!trade) return [];
  
  if (Array.isArray(trade.assets)) {
    return trade.assets;
  } else if (trade.assets && typeof trade.assets === 'object') {
    const backendAssets = trade.assets as any;
    const participants = trade.participants || trade.teams_detail || [];
    const participantIds = participants.map((t: any) => typeof t === 'object' ? t.id : t);
    const transformed: any[] = [];
    
    // Process players
    if (backendAssets.players && Array.isArray(backendAssets.players)) {
      backendAssets.players.forEach((playerData: any) => {
        let contractId: number | undefined;
        if (playerData.contract) {
          contractId = typeof playerData.contract === 'object' ? playerData.contract.id : playerData.contract;
        }
        if (!contractId) return;
        
        let givingTeamId: number | undefined;
        if (playerData.team) {
          givingTeamId = typeof playerData.team === 'object' ? playerData.team.id : playerData.team;
        }
        if (!givingTeamId) return;
        
        const receivingTeamId = participantIds.find((id: number) => id !== givingTeamId);
        if (receivingTeamId) {
          transformed.push({
            id: `player-${contractId}`,
            asset_type: 'player',
            giving_team: givingTeamId,
            receiving_team: receivingTeamId,
            player: contractId,
            player_detail: playerData,
          });
        }
      });
    }
    
    // Process picks
    if (backendAssets.picks && Array.isArray(backendAssets.picks)) {
      backendAssets.picks.forEach((pickData: any) => {
        const pickId = pickData.id;
        if (!pickId) return;
        
        let givingTeamId: number | undefined;
        if (pickData.current_team) {
          givingTeamId = typeof pickData.current_team === 'object' ? pickData.current_team.id : pickData.current_team;
        }
        if (!givingTeamId && pickData.team) {
          givingTeamId = typeof pickData.team === 'object' ? pickData.team.id : pickData.team;
        }
        if (!givingTeamId) return;
        
        const receivingTeamId = participantIds.find((id: number) => id !== givingTeamId);
        if (receivingTeamId) {
          transformed.push({
            id: `pick-${pickId}`,
            asset_type: 'pick',
            giving_team: givingTeamId,
            receiving_team: receivingTeamId,
            pick: pickId,
            pick_detail: pickData,
          });
        }
      });
    }
    
    return transformed;
  }
  return [];
}

onMounted(async () => {
  await loadTrades();
});
</script>

<style scoped>
.trade-overview-view {
  padding-bottom: 100px; /* Space for FAB */
}

.fab-create {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

/* Hide FAB on larger screens where header button is visible */
@media (min-width: 960px) {
  .fab-create {
    display: none;
  }
}

.trade-summary-dialog {
  max-height: 500px;
  overflow-y: auto;
}
</style>
