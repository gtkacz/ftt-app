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
              <v-chip :color="getStatusColor(currentTrade.status)" variant="flat">
                {{ getStatusDisplay(currentTrade.status) }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle v-if="currentTrade.created_at" class="pt-2">
              Created {{ formatDate(currentTrade.created_at) }}
              by {{ getTeamName(currentTrade.proposing_team) }}
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
                :teams="currentTrade.teams_detail"
                :assets="currentTrade.assets"
                :validation="null"
              />
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
            :history="currentTrade.history"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTradeStore } from '@/stores/trade';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { VoteType } from '@/types/trade';

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

// Show action buttons
const showActions = computed(() => {
  if (!currentTrade.value) return false;
  if (currentTrade.value.status === 'proposed' && canRespond.value) return true;
  if (currentTrade.value.status === 'approved' && isAdmin.value) return true;
  return false;
});

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

// Get status display text
function getStatusDisplay(status: string): string {
  const displays: Record<string, string> = {
    draft: 'Draft',
    proposed: 'Proposed',
    waiting_approval: 'Pending Approval',
    approved: 'Approved',
    vetoed: 'Vetoed',
    rejected: 'Rejected',
    completed: 'Completed',
  };
  return displays[status] || status;
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

    // Counter creates a new draft trade
    const newTrade = await tradeStore.respondToTrade(
      userOffer.id,
      'counter',
      undefined
    );

    showSnackbar('Counter-offer created. You can now edit it.', 'success');

    // Navigate to the new trade edit page
    if (newTrade && newTrade.id) {
      router.push({
        name: 'trade-edit',
        params: { id: newTrade.id },
        query: { mode: 'counter' }
      });
    }
  } catch (error: any) {
    console.error('Counter error:', error);
    showSnackbar(error.message || 'Failed to create counter-offer', 'error');
  } finally {
    responding.value = false;
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

    // Reload trade details
    await tradeStore.fetchTradeById(tradeId.value);
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

    // Reload trade details
    await tradeStore.fetchTradeById(tradeId.value);
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

    // Reload trade details
    await tradeStore.fetchTradeById(tradeId.value);
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

// Load data on mount
onMounted(async () => {
  try {
    await tradeStore.fetchTradeById(tradeId.value);
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
</style>
