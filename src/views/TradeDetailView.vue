<template>
  <v-container fluid class="trade-detail-view">
    <!-- Loading State -->
    <div v-if="loading.currentTrade" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-medium-emphasis mt-4">Loading trade details...</p>
    </div>

    <!-- Trade Content -->
    <template v-else-if="currentTrade">
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-btn icon variant="text" @click="handleBack">
                <v-icon>arrow_back</v-icon>
              </v-btn>
              <span class="ml-2">Trade #{{ currentTrade.id }}</span>
              <v-spacer />
              <v-chip
                v-if="isReadOnly"
                color="grey"
                variant="tonal"
                size="small"
                class="mr-2"
              >
                <v-icon start size="small">visibility</v-icon>
                View Only
              </v-chip>
              <v-chip :color="getStatusColor(computedStatus)" variant="flat">
                {{ getStatusDisplay(computedStatus) || 'Unknown' }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle v-if="currentTrade.created_at" class="pt-2">
              Created {{ formatDate(currentTrade.created_at) }}
              by {{ getTeamName(currentTrade.proposing_team || currentTrade.sender?.id) }}
              <span v-if="currentTrade.parent" class="ml-2">
                <v-chip size="x-small" color="warning" variant="tonal">
                  Counteroffer
                </v-chip>
              </span>
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <!-- Trade Assets Display (Read-Only) -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon start>swap_horiz</v-icon>
              Trade Details
            </v-card-title>
            <v-divider />
            <v-card-text>
              <TradeSummaryPanel
                :teams="displayTeams"
                :assets="transformedAssets"
                :validation="null"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Status Information (for read-only trades) -->
      <v-row v-if="isReadOnly && currentTrade">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon start>info</v-icon>
              Trade Status
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="status-info">
                <div v-if="currentTrade.done" class="status-item">
                  <v-icon color="success" size="small" class="mr-2">done_all</v-icon>
                  <span>This trade has been finalized</span>
                </div>
                <div v-else-if="computedStatus === 'rejected'" class="status-item">
                  <v-icon color="error" size="small" class="mr-2">cancel</v-icon>
                  <span>This trade was rejected</span>
                </div>
                <div v-else-if="computedStatus === 'vetoed'" class="status-item">
                  <v-icon color="error" size="small" class="mr-2">gavel</v-icon>
                  <span>This trade was vetoed by commissioners</span>
                </div>
                <div v-else-if="computedStatus === 'accepted'" class="status-item">
                  <v-icon color="warning" size="small" class="mr-2">schedule</v-icon>
                  <span>Waiting for commissioner approval</span>
                </div>
                <div v-else-if="computedStatus === 'waiting_acceptance'" class="status-item">
                  <v-icon color="info" size="small" class="mr-2">schedule</v-icon>
                  <span>Waiting for other participants to respond</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Notes -->
      <v-row v-if="currentTrade.notes">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon start>note</v-icon>
              Notes
            </v-card-title>
            <v-divider />
            <v-card-text>
              <p>{{ currentTrade.notes }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Commissioner Approval Section (if waiting_approval) -->
      <v-row v-if="currentTrade.status === 'waiting_approval'">
        <v-col cols="12">
          <CommissionerApprovalSection
            :trade="currentTrade"
            :approval-status="currentTrade.approval_status"
            :approvals="currentTrade.approvals"
            @vote="handleVote"
          />
        </v-col>
      </v-row>

      <!-- Trade Timeline -->
      <v-row>
        <v-col cols="12">
          <TradeTimeline
            :trade-id="currentTrade.id"
            :history="displayedTimeline"
            :loading="loadingTimeline"
          />
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row v-if="showActions">
        <v-col cols="12">
          <v-card>
            <v-card-text class="d-flex gap-2">
              <!-- Recipient Actions (for proposed trades) -->
              <template v-if="currentTrade.status === 'proposed' && canRespond">
                <v-btn
                  color="success"
                  size="large"
                  :loading="responding"
                  @click="handleAccept"
                >
                  <v-icon start>check</v-icon>
                  Accept Trade
                </v-btn>
                <v-btn
                  color="warning"
                  size="large"
                  variant="outlined"
                  @click="handleCounter"
                >
                  <v-icon start>edit</v-icon>
                  Counter Offer
                </v-btn>
                <v-btn
                  color="error"
                  size="large"
                  variant="outlined"
                  :loading="responding"
                  @click="handleReject"
                >
                  <v-icon start>close</v-icon>
                  Reject Trade
                </v-btn>
              </template>

              <!-- Admin Execute Action (for approved trades) -->
              <template v-if="currentTrade.status === 'approved' && isAdmin">
                <v-btn
                  color="primary"
                  size="large"
                  :loading="executing"
                  @click="handleExecute"
                >
                  <v-icon start>done_all</v-icon>
                  Execute Trade
                </v-btn>
              </template>

              <v-spacer />

              <!-- Back Button -->
              <v-btn
                variant="text"
                size="large"
                @click="handleBack"
              >
                Back to Overview
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Error State -->
    <div v-else class="text-center pa-8">
      <v-icon size="64" color="error">error</v-icon>
      <p class="text-h6 text-medium-emphasis mt-4">Trade not found</p>
      <v-btn class="mt-4" @click="handleBack">Back to Overview</v-btn>
    </div>

    <!-- Response Dialog -->
    <v-dialog v-model="responseDialog.show" max-width="500px">
      <v-card>
        <v-card-title>
          {{ responseDialog.title }}
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="responseDialog.message"
            label="Message (optional)"
            variant="outlined"
            rows="3"
            placeholder="Add a message..."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeResponseDialog">Cancel</v-btn>
          <v-btn
            :color="responseDialog.color"
            :loading="responding"
            @click="confirmResponse"
          >
            Confirm
          </v-btn>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { VoteType, TradeHistoryEntry, TradeDisplayStatus } from '@/types/trade';
import { getTradeDisplayStatus } from '@/types/trade';
import { TradeService } from '@/api/trade';

import TradeSummaryPanel from '@/components/trade/TradeSummaryPanel.vue';
import TradeTimeline from '@/components/trade/TradeTimeline.vue';
import CommissionerApprovalSection from '@/components/trade/CommissionerApprovalSection.vue';

const router = useRouter();
const route = useRoute();
const tradeStore = useTradeStore();
const authStore = useAuthStore();

const { currentTrade, loading } = storeToRefs(tradeStore);

// Component state
const responding = ref(false);
const executing = ref(false);
const timelineHistory = ref<TradeHistoryEntry[]>([]);
const loadingTimeline = ref(false);
const responseDialog = ref({
  show: false,
  type: '' as 'accept' | 'reject' | '',
  title: '',
  color: 'primary',
  message: '',
});
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Get trade ID from route
const tradeId = computed(() => parseInt(route.params.id as string));

// Get teams for display (ensure it's an array of team objects)
const displayTeams = computed(() => {
  if (!currentTrade.value) return [];
  const teams = currentTrade.value.teams_detail || currentTrade.value.participants || [];
  return teams;
});

// Display timeline - use timeline from trade response
const displayedTimeline = computed(() => {
  if (currentTrade.value?.timeline && Array.isArray(currentTrade.value.timeline) && currentTrade.value.timeline.length > 0) {
    return currentTrade.value.timeline;
  }
  // Fallback to history alias for compatibility
  if (currentTrade.value?.history && Array.isArray(currentTrade.value.history) && currentTrade.value.history.length > 0) {
    return currentTrade.value.history;
  }
  // Fallback to fetched timeline
  if (timelineHistory.value.length > 0) {
    return timelineHistory.value;
  }
  return [];
});

// Compute status from trade object
const computedStatus = computed(() => {
  if (!currentTrade.value) return 'unknown';
  
  // Use displayStatus if available (from getTradeDisplayStatus in API)
  if (currentTrade.value.displayStatus) {
    return currentTrade.value.displayStatus;
  }
  
  // If status is an object (backend format), compute display status
  if (currentTrade.value.status && typeof currentTrade.value.status === 'object') {
    return getTradeDisplayStatus(currentTrade.value);
  }
  
  // Fallback to status as string
  return currentTrade.value.status || 'unknown';
});

// Transform backend assets format to frontend format for TradeSummaryPanel
const transformedAssets = computed(() => {
  if (!currentTrade.value) {
    return [];
  }
  
  // If assets is already an array (legacy format), return as-is
  if (Array.isArray(currentTrade.value.assets)) {
    return currentTrade.value.assets;
  }
  
  // Transform backend format { players: [], picks: [] } to array format
  if (currentTrade.value.assets && typeof currentTrade.value.assets === 'object' && !Array.isArray(currentTrade.value.assets)) {
    const backendAssets = currentTrade.value.assets as { players?: any[]; picks?: any[] };
    const participants = currentTrade.value.participants || currentTrade.value.teams_detail || [];
    const participantIds = participants.map((t: any) => typeof t === 'object' ? t.id : t);
    const transformed: any[] = [];
    
    // Process players
    if (backendAssets.players && Array.isArray(backendAssets.players)) {
      backendAssets.players.forEach((playerData: any, index: number) => {
        if (typeof playerData !== 'object') {
          console.warn(`[TradeDetailView] Player ${index} is not an object:`, playerData);
          return;
        }
        
        // Get contract ID - SimplePlayerSerializer includes contract with id
        // The contract might be an object with id, or just an id
        let contractId: number | undefined;
        if (playerData.contract) {
          contractId = typeof playerData.contract === 'object' ? playerData.contract.id : playerData.contract;
        }
        if (!contractId) {
          console.warn(`[TradeDetailView] Player ${index} has no contract.id:`, playerData);
          return;
        }
        
        // Get team from team field (SimplePlayerSerializer.get_team returns contract.team)
        // The contract object excludes team, but there's a separate team field
        // team field is the team object (via get_team method)
        let givingTeamId: number | undefined;
        if (playerData.team) {
          // team is a SerializerMethodField that returns contract.team
          givingTeamId = typeof playerData.team === 'object' ? playerData.team.id : playerData.team;
        }
        
        if (!givingTeamId) {
          console.warn(`[TradeDetailView] Player ${index} has no team:`, playerData);
          return;
        }
        
        // Find receiving team (other participant)
        if (participantIds.includes(givingTeamId)) {
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
          } else {
            console.warn(`[TradeDetailView] Could not find receiving team for player ${index}`);
          }
        } else {
          console.warn(`[TradeDetailView] Player ${index} team ${givingTeamId} not in participants`);
        }
      });
    }
    
    // Process picks
    if (backendAssets.picks && Array.isArray(backendAssets.picks)) {
      backendAssets.picks.forEach((pickData: any, index: number) => {
        if (typeof pickData !== 'object') {
          console.warn(`[TradeDetailView] Pick ${index} is not an object:`, pickData);
          return;
        }
        
        const pickId = pickData.id;
        if (!pickId) {
          console.warn(`[TradeDetailView] Pick ${index} has no id:`, pickData);
          return;
        }
        
        // PickSerializer includes current_team field (via current_team_name and current_team)
        // current_team might be an object with id, or just an id
        let givingTeamId: number | undefined;
        if (pickData.current_team) {
          givingTeamId = typeof pickData.current_team === 'object' ? pickData.current_team.id : pickData.current_team;
        }
        
        // If current_team is not available, try to get from pick's team field
        if (!givingTeamId && pickData.team) {
          givingTeamId = typeof pickData.team === 'object' ? pickData.team.id : pickData.team;
        }
        
        if (!givingTeamId) {
          console.warn(`[TradeDetailView] Pick ${index} has no current_team:`, pickData);
          return;
        }
        
        const protection = pickData.protection || pickData.protection_type || 'unprotected';
        const protectionValue = pickData.protection_value || pickData.value;
        
        // Find receiving team (other participant)
        if (participantIds.includes(givingTeamId)) {
          const receivingTeamId = participantIds.find((id: number) => id !== givingTeamId);
          
          if (receivingTeamId) {
            transformed.push({
              id: `pick-${pickId}`,
              asset_type: 'pick',
              giving_team: givingTeamId,
              receiving_team: receivingTeamId,
              pick: pickId,
              pick_detail: {
                ...pickData,
                protection_type: protection,
                protection_value: protectionValue,
              },
            });
          } else {
            console.warn(`[TradeDetailView] Could not find receiving team for pick ${index}`);
          }
        } else {
          console.warn(`[TradeDetailView] Pick ${index} team ${givingTeamId} not in participants`);
        }
      });
    }
    
    return transformed;
  }
  
  return [];
});

// Check if user can respond (is a recipient, not proposer)
const canRespond = computed(() => {
  if (!currentTrade.value) return false;
  const userTeamId = authStore.user?.team?.id;
  if (!userTeamId) return false;

  return (
    currentTrade.value.teams.includes(userTeamId) &&
    currentTrade.value.proposing_team !== userTeamId
  );
});

// Check if user is admin
const isAdmin = computed(() => {
  return authStore.user?.is_superuser || false;
});

// Check if user is commissioner
const isCommissioner = computed(() => {
  return authStore.user?.is_staff || authStore.user?.is_superuser || false;
});

// Check if trade is read-only (non-actionable)
const isReadOnly = computed(() => {
  if (!currentTrade.value) return true;
  
  const status = computedStatus.value as TradeDisplayStatus;
  const userTeamId = authStore.user?.team?.id;
  
  // Trade is read-only if:
  // 1. Trade is completed
  if (status === 'completed' || currentTrade.value.done) return true;
  
  // 2. Trade is rejected
  if (status === 'rejected') return true;
  
  // 3. Trade is vetoed
  if (status === 'vetoed') return true;
  
  // 4. Trade is accepted but user is not commissioner (waiting for approval)
  if (status === 'accepted' && !isCommissioner.value) return true;
  
  // 5. User has already responded (waiting for others)
  // Check if user's team has already accepted/rejected
  if (status === 'waiting_acceptance' && userTeamId) {
    // If user is the proposer, they can't respond
    if (currentTrade.value.proposing_team === userTeamId) return true;
    
    // Check if user has already responded (would need to check status)
    // For now, if status is waiting_acceptance and user can't respond, it's read-only
    if (!canRespond.value) return true;
  }
  
  // 6. Trade is approved but user is not admin (can't execute)
  if (status === 'approved' && !isAdmin.value) return true;
  
  return false;
});

// Show action buttons
const showActions = computed(() => {
  if (!currentTrade.value || isReadOnly.value) return false;
  if (currentTrade.value.status === 'proposed' && canRespond.value) return true;
  if (currentTrade.value.status === 'approved' && isAdmin.value) return true;
  return false;
});

// Get status color
function getStatusColor(status: string | TradeDisplayStatus): string {
  const statusStr = typeof status === 'string' ? status : status;
  const colors: Record<string, string> = {
    draft: 'grey',
    proposed: 'info',
    waiting_approval: 'warning',
    waiting_acceptance: 'info',
    accepted: 'warning',
    approved: 'success',
    vetoed: 'error',
    rejected: 'error',
    completed: 'success',
    unknown: 'grey',
  };
  return colors[statusStr] || 'grey';
}

// Get status display text
function getStatusDisplay(status: string | TradeDisplayStatus): string {
  const statusStr = typeof status === 'string' ? status : status;
  const displays: Record<string, string> = {
    draft: 'Draft',
    proposed: 'Proposed',
    waiting_approval: 'Pending Approval',
    waiting_acceptance: 'Waiting Response',
    accepted: 'Accepted',
    approved: 'Approved',
    vetoed: 'Vetoed',
    rejected: 'Rejected',
    completed: 'Completed',
    unknown: 'Unknown',
  };
  return displays[statusStr] || String(statusStr);
}

// Get team name
function getTeamName(teamId: number): string {
  if (!currentTrade.value) return `Team ${teamId}`;
  const team = currentTrade.value.teams_detail.find((t) => t.id === teamId);
  return team?.name || currentTrade.value.proposing_team_detail?.name || `Team ${teamId}`;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Action handlers
function handleAccept() {
  responseDialog.value = {
    show: true,
    type: 'accept',
    title: 'Accept Trade',
    color: 'success',
    message: '',
  };
}

function handleReject() {
  responseDialog.value = {
    show: true,
    type: 'reject',
    title: 'Reject Trade',
    color: 'error',
    message: '',
  };
}

async function handleCounter() {
  if (!currentTrade.value) return;

  try {
    // Navigate to create page with counteroffer query param
    router.push({ 
      name: 'trade-create', 
      query: { counterofferId: currentTrade.value.id.toString() } 
    });
  } catch (error: any) {
    console.error('Counter error:', error);
    showSnackbar(error.message || 'Failed to navigate to counteroffer', 'error');
  }
}

async function confirmResponse() {
  if (!currentTrade.value || !responseDialog.value.type) return;

  try {
    responding.value = true;
    
    // Find the TradeOffer for the user's team
    const userTeamId = authStore.user?.team?.id;
    if (!userTeamId) {
      showSnackbar('Unable to determine your team', 'error');
      return;
    }

    const userOffer = currentTrade.value.offers.find(
      (offer) => offer.team === userTeamId && !offer.is_proposer
    );

    if (!userOffer) {
      showSnackbar('Trade offer not found for your team', 'error');
      return;
    }

    await tradeStore.respondToTrade(
      userOffer.id,
      responseDialog.value.type,
      responseDialog.value.message || undefined
    );

    showSnackbar(
      `Trade ${responseDialog.value.type === 'accept' ? 'accepted' : 'rejected'} successfully`,
      'success'
    );
    closeResponseDialog();

    // Reload trade details and timeline
    await tradeStore.fetchTradeById(tradeId.value);
    await fetchTimeline();
  } catch (error: any) {
    console.error('Response error:', error);
    showSnackbar(error.message || 'Failed to respond to trade', 'error');
  } finally {
    responding.value = false;
  }
}

function closeResponseDialog() {
  responseDialog.value = {
    show: false,
    type: '',
    title: '',
    color: 'primary',
    message: '',
  };
}

async function handleVote(payload: { vote: VoteType; notes?: string }) {
  if (!currentTrade.value) return;

  try {
    await tradeStore.voteOnTrade(currentTrade.value.id, payload.vote, payload.notes);
    showSnackbar('Vote submitted successfully', 'success');

    // Reload trade details and timeline
    await tradeStore.fetchTradeById(tradeId.value);
    await fetchTimeline();
  } catch (error: any) {
    console.error('Vote error:', error);
    showSnackbar(error.message || 'Failed to submit vote', 'error');
  }
}

async function handleExecute() {
  if (!currentTrade.value) return;

  if (!confirm('Are you sure you want to execute this trade? This action cannot be undone.')) {
    return;
  }

  try {
    executing.value = true;
    await tradeStore.executeTrade(currentTrade.value.id);
    showSnackbar('Trade executed successfully', 'success');

    // Reload trade details and timeline
    await tradeStore.fetchTradeById(tradeId.value);
    await fetchTimeline();
  } catch (error: any) {
    console.error('Execute error:', error);
    showSnackbar(error.message || 'Failed to execute trade', 'error');
  } finally {
    executing.value = false;
  }
}

function handleBack() {
  router.push({ name: 'trade-overview' });
}

function showSnackbar(message: string, color: 'success' | 'error' | 'warning' | 'info') {
  snackbar.value = { show: true, message, color };
}

// Fetch timeline if not included in trade response (fallback only)
async function fetchTimeline() {
  if (!tradeId.value) {
    return;
  }
  
  // Timeline should come from trade response, but fetch separately as fallback if missing
  if (currentTrade.value?.timeline && Array.isArray(currentTrade.value.timeline) && currentTrade.value.timeline.length > 0) {
    return;
  }
  
  // Fallback: fetch timeline separately (if endpoint exists)
  loadingTimeline.value = true;
  try {
    const history = await TradeService.getTimeline(tradeId.value);
    timelineHistory.value = history;
  } catch (error: any) {
    // Handle 404 (endpoint doesn't exist) gracefully
    if (error.response?.status === 404) {
      timelineHistory.value = [];
    } else {
      console.error('[TradeDetailView] Failed to load trade timeline:', error);
      // Don't show error snackbar - timeline is optional
      timelineHistory.value = [];
    }
  } finally {
    loadingTimeline.value = false;
  }
}

// Watch for trade ID changes (e.g., from notification redirects)
watch(tradeId, async (newId) => {
  if (newId) {
    try {
      await tradeStore.fetchTradeById(newId);
      await fetchTimeline();
    } catch (error) {
      console.error('Failed to load trade:', error);
      showSnackbar('Failed to load trade details', 'error');
    }
  }
});

// Load data on mount
onMounted(async () => {
  try {
    await tradeStore.fetchTradeById(tradeId.value);
    // Fetch timeline after trade is loaded
    await fetchTimeline();
  } catch (error) {
    console.error('Failed to load trade:', error);
    showSnackbar('Failed to load trade details', 'error');
  }
});
</script>

<style scoped>
.trade-detail-view {
  padding-bottom: 50px;
}

.gap-2 {
  gap: 8px;
}

.status-info {
  .status-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }
}
</style>
