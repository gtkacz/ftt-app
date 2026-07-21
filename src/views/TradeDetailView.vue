<template>
  <v-container fluid class="trade-detail-view page-view pa-0">
    <!-- Loading State -->
    <div v-if="loading.currentTrade" class="state-panel surface-card w-100">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-medium-emphasis mt-4">{{ t('tradeDetailView.loading') }}</p>
      </div>
    </div>

    <!-- Trade Content -->
    <template v-else-if="currentTrade">
      <div class="w-100 mw-1200 mx-auto">
        <!-- Header Section -->
        <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between mb-6 gap-4">
          <div>
            <v-btn
              variant="text"
              prepend-icon="arrow_back"
              class="trade-detail-back px-0 mb-2"
              :ripple="false"
              @click="handleBack"
            >
              {{ t('tradeDetailView.backToOverview') }}
            </v-btn>

            <div class="trade-detail-heading d-flex align-center flex-wrap gap-3">
              <h1 class="page-title">{{ t('tradeDetailView.header.tradeNumber', { id: currentTrade.id }) }}</h1>

              <v-chip
                :color="getStatusColor(computedStatus)"
                variant="flat"
                label
                class="font-weight-bold text-uppercase"
              >
                {{ getStatusDisplay(computedStatus) || t('tradeDetailView.status.unknown') }}
              </v-chip>

              <v-chip
                v-if="currentTrade.parent"
                color="warning"
                variant="tonal"
                size="small"
                label
              >
                {{ t('tradeDetailView.status.counteroffer') }}
              </v-chip>

              <v-chip
                v-if="isReadOnly"
                color="grey"
                variant="outlined"
                size="small"
              >
                <v-icon start size="small">visibility</v-icon>
                {{ t('tradeDetailView.status.viewOnly') }}
              </v-chip>
            </div>

            <div class="text-subtitle-1 text-medium-emphasis mt-1">
              {{ t('tradeDetailView.header.proposedBy') }} <strong class="text-high-emphasis">{{ getTeamName(currentTrade.proposing_team || currentTrade.sender?.id) }}</strong>
              {{ t('tradeDetailView.header.onDate', { date: formatDate(currentTrade.created_at) }) }}
            </div>
          </div>

          <!-- Desktop Actions -->
          <div v-if="showActions" class="d-none d-md-flex align-center gap-2">
            <!-- Recipient Actions -->
            <template v-if="currentTrade.status === 'proposed' && canRespond">
               <v-btn
                color="error"
                variant="outlined"
                size="large"
                prepend-icon="close"
                :loading="responding"
                @click="handleReject"
              >
                {{ t('tradeDetailView.actions.reject') }}
              </v-btn>
              <v-btn
                color="warning"
                variant="outlined"
                size="large"
                prepend-icon="edit"
                @click="handleCounter"
              >
                {{ t('tradeDetailView.actions.counter') }}
              </v-btn>
              <v-btn
                color="success"
                variant="flat"
                size="large"
                prepend-icon="check"
                elevation="2"
                :loading="responding"
                @click="handleAccept"
              >
                {{ t('tradeDetailView.actions.acceptTrade') }}
              </v-btn>
            </template>

            <!-- Admin Actions -->
            <template v-if="currentTrade.status === 'approved' && isAdmin">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="done_all"
                elevation="2"
                :loading="executing"
                @click="handleExecute"
              >
                {{ t('tradeDetailView.actions.executeTrade') }}
              </v-btn>
            </template>
          </div>
        </div>

        <!-- Mobile Actions (Sticky Bottom or just inline) -->
        <div v-if="showActions" class="d-flex d-md-none flex-column gap-2 mb-6">
           <template v-if="currentTrade.status === 'proposed' && canRespond">
              <v-btn block color="success" size="large" prepend-icon="check" @click="handleAccept" :loading="responding">{{ t('tradeDetailView.actions.acceptTrade') }}</v-btn>
              <div class="d-flex gap-2">
                <v-btn class="flex-grow-1" color="warning" variant="outlined" prepend-icon="edit" @click="handleCounter">{{ t('tradeDetailView.actions.counter') }}</v-btn>
                <v-btn class="flex-grow-1" color="error" variant="outlined" prepend-icon="close" @click="handleReject" :loading="responding">{{ t('tradeDetailView.actions.reject') }}</v-btn>
              </div>
           </template>
           <template v-if="currentTrade.status === 'approved' && isAdmin">
              <v-btn block color="primary" size="large" prepend-icon="done_all" @click="handleExecute" :loading="executing">{{ t('tradeDetailView.actions.executeTrade') }}</v-btn>
           </template>
        </div>

        <!-- Main Trade Summary Panel -->
        <div class="mb-6">
          <TradeSummaryPanel
            :teams="displayTeams"
            :assets="transformedAssets"
            :validation="null"
          />
        </div>

        <!-- Secondary Info Grid -->
        <v-row>
          <!-- Details Column -->
          <v-col cols="12" lg="5">
            <div class="d-flex flex-column gap-4">
              
              <!-- Status & Info Card -->
              <v-card class="trade-detail-card" variant="flat">
                <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold">
                  <v-icon start color="info" size="small">info</v-icon>
                  {{ t('tradeDetailView.statusDetails.title') }}
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="status-info">
                    <div v-if="currentTrade.done" class="d-flex align-center text-success">
                      <v-icon size="small" class="mr-2">done_all</v-icon>
                      <span>{{ t('tradeDetailView.statusDetails.finalized') }}</span>
                    </div>
                    <div v-else-if="computedStatus === 'rejected'" class="d-flex align-center text-error">
                      <v-icon size="small" class="mr-2">cancel</v-icon>
                      <span>{{ t('tradeDetailView.statusDetails.rejected') }}</span>
                    </div>
                    <div v-else-if="computedStatus === 'vetoed'" class="d-flex align-center text-error">
                      <v-icon size="small" class="mr-2">gavel</v-icon>
                      <span>{{ t('tradeDetailView.statusDetails.vetoed') }}</span>
                    </div>
                    <div v-else-if="computedStatus === 'accepted'" class="d-flex align-center text-warning">
                      <v-icon size="small" class="mr-2">schedule</v-icon>
                      <span>{{ t('tradeDetailView.statusDetails.waitingApproval') }}</span>
                    </div>
                    <div v-else-if="computedStatus === 'waiting_acceptance'" class="d-flex align-center text-info">
                      <v-icon size="small" class="mr-2">schedule</v-icon>
                      <span>{{ t('tradeDetailView.statusDetails.waitingAcceptance') }}</span>
                    </div>

                    <!-- Notes Section inside Status Card -->
                    <div v-if="currentTrade.notes" class="mt-4 pt-4 border-t">
                      <div class="text-caption text-medium-emphasis font-weight-bold mb-1">{{ t('tradeDetailView.statusDetails.notesLabel') }}</div>
                      <p class="text-body-2">{{ currentTrade.notes }}</p>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Commissioner Approval Section -->
              <div v-if="currentTrade.status === 'waiting_approval'">
                <CommissionerApprovalSection
                  :trade="currentTrade"
                  :approval-status="currentTrade.approval_status"
                  :approvals="currentTrade.approvals"
                  @vote="handleVote"
                />
              </div>
            </div>
          </v-col>

          <!-- Timeline Column -->
          <v-col cols="12" lg="7">
             <v-card variant="flat" class="trade-detail-card h-100">
               <TradeTimeline
                  :trade-id="currentTrade.id"
                  :history="displayedTimeline"
                  :loading="loadingTimeline"
               />
             </v-card>
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- Error State -->
    <div v-else class="trade-detail-empty surface-card w-100">
      <div class="text-center">
        <v-icon size="64" color="error" class="mb-4">error_outline</v-icon>
        <h3 class="text-h5 mb-2">{{ t('tradeDetailView.notFound.title') }}</h3>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ t('tradeDetailView.notFound.message') }}</p>
        <v-btn color="secondary" variant="flat" @click="handleBack">{{ t('tradeDetailView.backToOverview') }}</v-btn>
      </div>
    </div>

    <!-- Response Dialog -->
    <v-dialog v-model="responseDialog.show" max-width="500px">
      <v-card>
        <v-card-title class="pt-4 px-4">
          {{ responseDialog.title }}
        </v-card-title>
        <v-card-text class="px-4">
          <p class="mb-4 text-body-2 text-medium-emphasis">
             {{ t('tradeDetailView.responseDialog.confirmMessage', { action: responseDialog.type === 'accept' ? t('tradeDetailView.responseDialog.actionAccept') : t('tradeDetailView.responseDialog.actionReject') }) }}
          </p>
          <v-textarea
            v-model="responseDialog.message"
            :label="t('tradeDetailView.responseDialog.messageLabel')"
            variant="outlined"
            rows="3"
            :placeholder="t('tradeDetailView.responseDialog.messagePlaceholder')"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="p-4">
          <v-spacer />
          <v-btn variant="text" @click="closeResponseDialog">{{ t('tradeDetailView.actions.cancel') }}</v-btn>
          <v-btn
            :color="responseDialog.color"
            variant="flat"
            :loading="responding"
            @click="confirmResponse"
          >
            {{ responseDialog.type === 'accept' ? t('tradeDetailView.responseDialog.confirmAcceptance') : t('tradeDetailView.responseDialog.confirmRejection') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">{{ t('tradeDetailView.actions.close') }}</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
const { t } = useI18n();
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
    draft: t('tradeDetailView.status.draft'),
    proposed: t('tradeDetailView.status.proposed'),
    waiting_approval: t('tradeDetailView.status.waitingApproval'),
    waiting_acceptance: t('tradeDetailView.status.waitingAcceptance'),
    accepted: t('tradeDetailView.status.accepted'),
    approved: t('tradeDetailView.status.approved'),
    vetoed: t('tradeDetailView.status.vetoed'),
    rejected: t('tradeDetailView.status.rejected'),
    completed: t('tradeDetailView.status.completed'),
    unknown: t('tradeDetailView.status.unknown'),
  };
  return displays[statusStr] || String(statusStr);
}

// Get team name
function getTeamName(teamId: number): string {
  if (!currentTrade.value) return t('tradeDetailView.header.teamFallback', { id: teamId });
  const team = currentTrade.value.teams_detail.find((team) => team.id === teamId);
  return team?.name || currentTrade.value.proposing_team_detail?.name || t('tradeDetailView.header.teamFallback', { id: teamId });
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
    title: t('tradeDetailView.responseDialog.acceptTitle'),
    color: 'success',
    message: '',
  };
}

function handleReject() {
  responseDialog.value = {
    show: true,
    type: 'reject',
    title: t('tradeDetailView.responseDialog.rejectTitle'),
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
    showSnackbar(error.message || t('tradeDetailView.messages.counterNavigationFailed'), 'error');
  }
}

async function confirmResponse() {
  if (!currentTrade.value || !responseDialog.value.type) return;

  try {
    responding.value = true;
    
    // Find the TradeOffer for the user's team
    const userTeamId = authStore.user?.team?.id;
    if (!userTeamId) {
      showSnackbar(t('tradeDetailView.messages.noTeamFound'), 'error');
      return;
    }

    const userOffer = currentTrade.value.offers.find(
      (offer) => offer.team === userTeamId && !offer.is_proposer
    );

    if (!userOffer) {
      showSnackbar(t('tradeDetailView.messages.offerNotFound'), 'error');
      return;
    }

    await tradeStore.respondToTrade(
      userOffer.id,
      responseDialog.value.type,
      responseDialog.value.message || undefined
    );

    showSnackbar(
      responseDialog.value.type === 'accept'
        ? t('tradeDetailView.messages.acceptedSuccess')
        : t('tradeDetailView.messages.rejectedSuccess'),
      'success'
    );
    closeResponseDialog();

    // Reload trade details and timeline
    await tradeStore.fetchTradeById(tradeId.value);
    await fetchTimeline();
  } catch (error: any) {
    console.error('Response error:', error);
    showSnackbar(error.message || t('tradeDetailView.messages.respondFailed'), 'error');
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
    showSnackbar(t('tradeDetailView.messages.voteSuccess'), 'success');

    // Reload trade details and timeline
    await tradeStore.fetchTradeById(tradeId.value);
    await fetchTimeline();
  } catch (error: any) {
    console.error('Vote error:', error);
    showSnackbar(error.message || t('tradeDetailView.messages.voteFailed'), 'error');
  }
}

async function handleExecute() {
  if (!currentTrade.value) return;

  if (!confirm(t('tradeDetailView.confirmExecute'))) {
    return;
  }

  try {
    executing.value = true;
    await tradeStore.executeTrade(currentTrade.value.id);
    showSnackbar(t('tradeDetailView.messages.executeSuccess'), 'success');

    // Reload trade details and timeline
    await tradeStore.fetchTradeById(tradeId.value);
    await fetchTimeline();
  } catch (error: any) {
    console.error('Execute error:', error);
    showSnackbar(error.message || t('tradeDetailView.messages.executeFailed'), 'error');
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
      showSnackbar(t('tradeDetailView.messages.loadFailed'), 'error');
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
    showSnackbar(t('tradeDetailView.messages.loadFailed'), 'error');
  }
});
</script>

<style scoped>
.trade-detail-view {
  min-height: 100%;
}

.mw-1200 {
  max-width: 1200px;
}

.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.gap-4 {
  gap: 16px;
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.trade-detail-card {
  overflow: hidden;
  border: 1px solid var(--surface-border);
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 10px 30px rgba(4, 10, 24, 0.1);
}

.trade-detail-empty {
  display: grid;
  place-items: center;
  min-height: min(520px, 60dvh);
  padding: 40px 20px;
}

.trade-detail-back {
  min-height: 44px;
}

@media (max-width: 600px) {
  .trade-detail-heading {
    align-items: flex-start !important;
  }

  .trade-detail-view :deep(.v-dialog .v-card-actions) {
    display: grid;
    gap: 8px;
  }

  .trade-detail-view :deep(.v-dialog .v-card-actions .v-spacer) {
    display: none;
  }

  .trade-detail-view :deep(.v-dialog .v-card-actions .v-btn) {
    width: 100%;
  }
}
</style>
