<template>
  <div class="trade-overview-view page-view">
    <header class="trade-header page-header">
      <div>
        <p class="eyebrow">{{ t('tradeOverviewView.header.eyebrow') }}</p>
        <h1 class="page-title">{{ t('tradeOverviewView.header.title') }}</h1>
        <p class="page-subtitle">{{ t('tradeOverviewView.header.subtitle') }}</p>
      </div>
      <v-btn class="trade-header__create" color="secondary" size="large" prepend-icon="add"
        @click="createNewTrade">
        {{ t('tradeOverviewView.header.createTrade') }}
      </v-btn>
    </header>

    <section class="trade-workspace surface-card">
          <v-tabs
            v-model="activeTab"
            color="secondary"
            align-tabs="start"
            show-arrows
            class="trade-tabs"
          >
            <v-tab value="waiting_acceptance">
              <v-icon start>schedule</v-icon>
              {{ t('tradeOverviewView.tabs.waitingResponse') }}
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
              {{ t('tradeOverviewView.tabs.rejected') }}
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
              {{ t('tradeOverviewView.tabs.accepted') }}
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
              {{ t('tradeOverviewView.tabs.pendingApproval') }}
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
              {{ t('tradeOverviewView.tabs.vetoed') }}
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
              {{ t('tradeOverviewView.tabs.completed') }}
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

          <v-card-text class="trade-window-container">
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
    </section>

    <!-- FAB for mobile -->
    <v-btn
      class="fab-create"
      color="secondary"
      size="large"
      icon
      elevation="8"
      :aria-label="t('tradeOverviewView.fab.createTradeAriaLabel')"
      @click="createNewTrade"
    >
      <v-icon>add</v-icon>
    </v-btn>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">{{ t('tradeOverviewView.snackbar.close') }}</v-btn>
      </template>
    </v-snackbar>

    <!-- Approve Confirmation Dialog -->
    <v-dialog 
      v-model="approveDialog.show" 
      max-width="800px" 
      persistent 
      scrollable
      class="approve-dialog"
    >
      <v-card class="dialog-card">
        <v-card-title class="dialog-header dialog-header--success">
          <div class="d-flex align-center">
            <v-avatar size="40" color="success" class="mr-3">
              <v-icon color="white" size="24">check_circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ t('tradeOverviewView.dialogs.approve.title') }}</div>
              <div class="text-caption text-medium-emphasis">{{ t('tradeOverviewView.dialogs.approve.subtitle') }}</div>
            </div>
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="dialog-content">
          <v-alert
            type="info"
            variant="tonal"
            density="comfortable"
            class="mb-4 info-alert"
            border="start"
            border-color="info"
          >
            <p>
              <div class="font-weight-medium mb-1">{{ t('tradeOverviewView.dialogs.approve.reviewTitle') }}</div>
              <div class="text-caption">{{ t('tradeOverviewView.dialogs.approve.reviewText') }}</div>
            </p>
          </v-alert>

          <!-- Trade Summary -->
          <div v-if="approveDialog.trade" class="trade-summary-dialog">
            <div class="summary-header mb-3">
              <v-icon color="primary" class="mr-2">swap_horiz</v-icon>
              <span class="text-subtitle-1 font-weight-bold">{{ t('tradeOverviewView.dialogs.tradeNumber', { id: approveDialog.trade.id }) }}</span>
            </div>
            <TradeSummaryPanel
              :teams="approveDialog.trade.teams_detail || approveDialog.trade.participants || []"
              :assets="getTransformedAssetsForDialog(approveDialog.trade)"
              :validation="null"
            />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn 
            variant="outlined" 
            color="grey"
            class="action-btn"
            @click="closeApproveDialog"
          >
            {{ t('tradeOverviewView.dialogs.approve.cancel') }}
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            class="action-btn action-btn--success"
            prepend-icon="check_circle"
            :loading="votingTradeId === approveDialog.trade?.id"
            @click="confirmApprove"
          >
            {{ t('tradeOverviewView.dialogs.approve.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Veto Confirmation Dialog -->
    <v-dialog 
      v-model="vetoDialog.show" 
      max-width="800px" 
      persistent 
      scrollable
      class="veto-dialog"
    >
      <v-card class="dialog-card">
        <v-card-title class="dialog-header dialog-header--error">
          <div class="d-flex align-center">
            <v-avatar size="40" color="error" class="mr-3">
              <v-icon color="white" size="24">gavel</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ t('tradeOverviewView.dialogs.veto.title') }}</div>
              <div class="text-caption text-medium-emphasis">{{ t('tradeOverviewView.dialogs.veto.subtitle') }}</div>
            </div>
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="dialog-content">
          <v-alert
            type="warning"
            variant="tonal"
            density="comfortable"
            class="mb-4 warning-alert"
            border="start"
            border-color="error"
          >
            <div class="d-flex align-center">
              <p>
                <div class="font-weight-medium mb-1">{{ t('tradeOverviewView.dialogs.veto.confirmText') }}</div>
                <div class="text-caption">{{ t('tradeOverviewView.dialogs.veto.warningText') }}</div>
              </p>
            </div>
          </v-alert>

          <!-- Trade Summary -->
          <div v-if="vetoDialog.trade" class="trade-summary-dialog mb-4">
            <div class="summary-header mb-3">
              <v-icon color="primary" class="mr-2">swap_horiz</v-icon>
              <span class="text-subtitle-1 font-weight-bold">{{ t('tradeOverviewView.dialogs.tradeNumber', { id: vetoDialog.trade.id }) }}</span>
            </div>
            <TradeSummaryPanel
              :teams="vetoDialog.trade.teams_detail || vetoDialog.trade.participants || []"
              :assets="getTransformedAssetsForDialog(vetoDialog.trade)"
              :validation="null"
            />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn 
            variant="outlined" 
            color="grey"
            class="action-btn"
            @click="closeVetoDialog"
          >
            {{ t('tradeOverviewView.dialogs.veto.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            class="action-btn action-btn--error"
            prepend-icon="block"
            :loading="votingTradeId === vetoDialog.trade?.id"
            @click="confirmVeto"
          >
            {{ t('tradeOverviewView.dialogs.veto.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { Trade, TradeDisplayStatus } from '@/types/trade';
import { getTradeDisplayStatus } from '@/types/trade';
import TradeList from '@/components/trade/TradeList.vue';
import CommissionerTradeList from '@/components/trade/CommissionerTradeList.vue';
import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue';

const router = useRouter();
const { t } = useI18n();
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
      return allTrades.filter((trade: Trade) => {
        const participantIds = trade.teams_detail?.map((t: any) => t.id) || 
                               trade.participants?.map((t: any) => typeof t === 'object' ? t.id : t) ||
                               trade.teams || [];
        return participantIds.includes(userTeamId);
      });
    }
    return [];
  }
  
  // For "vetoed" tab, only show trades that are actually vetoed (majority or admin)
  if (status === 'vetoed') {
    return allTrades.filter((trade: Trade) => isTradeActuallyVetoed(trade));
  }
  
  // For other statuses, show all trades (staff can see all, regular users already filtered by backend)
  return allTrades;
}

// Get count by status
function getCountByStatus(status: TradeDisplayStatus): number {
  return tradesByStatus(status).length;
}

// Check if trade is actually vetoed (only if done=true)
function isTradeActuallyVetoed(trade: Trade): boolean {
  // Trade is only definitively vetoed if done=true
  if (!trade.done) {
    return false;
  }
  
  const displayStatus = trade.displayStatus || getTradeDisplayStatus(trade);
  return displayStatus === 'vetoed';
}

// Get trades pending approval (for commissioners)
// Includes: accepted trades and approved trades that aren't finalized (done=false)
function getPendingApprovalTrades(): Trade[] {
  const allTrades = tradeStore.trades || [];
  
  return allTrades.filter((trade: Trade) => {
    // Only include trades that are not finalized (done=false)
    // A trade is only definitively vetoed/approved if done=true
    if (trade.done) {
      return false;
    }
    
    const displayStatus = trade.displayStatus || getTradeDisplayStatus(trade);
    
    // Include trades that are accepted (waiting for first approval)
    if (displayStatus === 'accepted') {
      return true;
    }
    
    // Include trades that are approved but not finalized (done=false)
    // This allows commissioners to still vote even if others have already approved
    if (displayStatus === 'approved') {
      return true;
    }
    
    // Include trades that have commissioner votes (status shows 'vetoed' or 'approved' but done=false)
    // This includes trades where someone voted to veto/approve but trade isn't finalized yet
    const status = trade.backendStatus || (trade as any).status;
    if (status?.commissioners && Object.keys(status.commissioners).length > 0) {
      // Has commissioner votes and trade is not done, so it's still pending
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

    showSnackbar(
      response === 'accept'
        ? t('tradeOverviewView.messages.tradeAcceptedSuccess')
        : t('tradeOverviewView.messages.tradeRejectedSuccess'),
      'success'
    );
    await loadTrades();
  } catch (error: any) {
    console.error('Trade action error:', error);
    const fallbackMessage = response === 'accept'
      ? t('tradeOverviewView.messages.failedToAcceptTrade')
      : t('tradeOverviewView.messages.failedToRejectTrade');
    const errorMessage = error.response?.data?.detail || error.message || fallbackMessage;
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
    showSnackbar(t('tradeOverviewView.messages.failedToLoadTrades'), 'error');
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
    showSnackbar(t('tradeOverviewView.messages.alreadyVoted'), 'warning');
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
    showSnackbar(t('tradeOverviewView.messages.tradeApprovedSuccess'), 'success');
    closeApproveDialog();
    await loadTrades();
  } catch (error: any) {
    console.error('Approve error:', error);
    const errorMessage = error.response?.data?.detail || error.message || t('tradeOverviewView.messages.failedToApproveTrade');
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
    showSnackbar(t('tradeOverviewView.messages.alreadyVoted'), 'warning');
    return;
  }
  vetoDialog.value = {
    show: true,
    trade: trade,
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
    showSnackbar(t('tradeOverviewView.messages.tradeVetoedSuccess'), 'success');
    closeVetoDialog();
    await loadTrades();
  } catch (error: any) {
    console.error('Veto error:', error);
    const errorMessage = error.response?.data?.detail || error.message || t('tradeOverviewView.messages.failedToVetoTrade');
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

<style lang="scss" scoped>
.trade-overview-view {
  display: grid;
  gap: 20px;
}

.trade-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 4px;
}

.trade-workspace {
  overflow: hidden;
}

.trade-tabs {
  border-bottom: 1px solid var(--surface-border);
  background: rgba(var(--v-theme-on-surface), 0.018);

  :deep(.v-tab) {
    min-height: 54px;
    font-size: 0.78rem;
    font-weight: 680;
    letter-spacing: 0;
    text-transform: none;
  }

  :deep(.v-slide-group__content) {
    min-width: max-content;
  }
}

.fab-create {
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  bottom: calc(#{$bottom-nav-height} + 18px + env(safe-area-inset-bottom));
  z-index: 1004;
  box-shadow: 0 12px 28px rgba(var(--v-theme-secondary), 0.28) !important;
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
  padding: 8px;
}

.trade-window-container {
  overflow: visible !important;
  padding: clamp(14px, 2vw, 24px) !important;
}

.trade-window-container :deep(.v-window) {
  overflow: visible !important;
}

.trade-window-container :deep(.v-window-item) {
  overflow: visible !important;
}

.summary-header {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

/* Dialog Styles */
.dialog-card {
  border-radius: $border-radius-lg;
  overflow: hidden;
}

.dialog-header {
  padding: 24px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
}

.dialog-header--success {
  border-bottom: 3px solid rgb(var(--v-theme-success));
}

.dialog-header--error {
  border-bottom: 3px solid rgb(var(--v-theme-error));
}

.dialog-content {
  padding: 24px;
}

.info-alert,
.warning-alert {
  border-radius: $border-radius-md;
}

.dialog-actions {
  padding: 16px 24px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.action-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.3px;
  min-width: 120px;
  transition: transform $transition-fast, box-shadow $transition-fast;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn--success {
  box-shadow: 0 2px 4px rgba(var(--v-theme-success), 0.3);
}

.action-btn--error {
  box-shadow: 0 2px 4px rgba(var(--v-theme-error), 0.3);
}

.action-btn--error:hover {
  box-shadow: 0 4px 8px rgba(var(--v-theme-error), 0.4);
}

.veto-textarea :deep(.v-field) {
  background-color: rgba(var(--v-theme-surface), 0.8);
}

.veto-textarea :deep(.v-field__input) {
  min-height: 100px;
}

/* Dialog Animations */
.approve-dialog :deep(.v-overlay__content),
.veto-dialog :deep(.v-overlay__content) {
  animation: dialogSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: #{$breakpoint-md - 1px}) {
  .trade-header {
    display: block;
  }

  .trade-header__create {
    display: none;
  }

  .trade-tabs :deep(.v-tab) {
    min-width: auto;
    padding: 0 14px;
  }

  .dialog-header,
  .dialog-content {
    padding: 18px;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px 18px calc(14px + env(safe-area-inset-bottom));

    .v-spacer {
      display: none;
    }

    .action-btn {
      width: 100%;
      min-width: 0;
      margin: 0 !important;
    }
  }
}

@media (max-width: $breakpoint-xs) {
  .trade-tabs :deep(.v-tab) {
    min-height: 50px;
    padding: 0 12px;
    font-size: 0.72rem;
  }

  .trade-window-container {
    padding: 12px !important;
  }

  .dialog-header {
    padding: 16px;

    .v-avatar {
      display: none;
    }
  }

  .dialog-content {
    padding: 14px;
  }

  .dialog-actions {
    grid-template-columns: 1fr;
  }
}
</style>
