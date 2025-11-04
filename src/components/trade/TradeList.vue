<template>
  <div class="trade-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-medium-emphasis mt-4">Loading trades...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="trades.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">swap_horiz</v-icon>
      <p class="text-h6 text-medium-emphasis mt-4">No trades found</p>
      <p class="text-caption">Trades in this status will appear here</p>
    </div>

    <!-- Trade Cards -->
    <v-row v-else>
      <v-col
        v-for="trade in trades"
        :key="trade.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="2"
          hover
          class="trade-card"
          @click="$emit('trade-click', trade)"
        >
          <!-- Card Header -->
          <v-card-title class="d-flex align-center">
            <v-chip :color="getStatusColor(trade.status)" size="small" variant="flat">
              {{ getStatusDisplay(trade.status) }}
            </v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">#{{ trade.id }}</span>
          </v-card-title>

          <!-- Trade Teams -->
          <v-card-subtitle class="pt-2">
            <div class="d-flex flex-wrap align-center gap-1">
              <v-chip
                v-for="team in trade.teams_detail"
                :key="team.id"
                size="small"
                variant="outlined"
              >
                {{ team.name }}
              </v-chip>
            </div>
          </v-card-subtitle>

          <!-- Trade Summary -->
          <v-card-text>
            <div class="trade-summary">
              <div class="summary-row">
                <v-icon size="small" class="mr-2">person</v-icon>
                <span class="text-caption">{{ getPlayerCount(trade) }} player{{ getPlayerCount(trade) !== 1 ? 's' : '' }}</span>
              </div>
              <div class="summary-row">
                <v-icon size="small" class="mr-2">star</v-icon>
                <span class="text-caption">{{ getPickCount(trade) }} pick{{ getPickCount(trade) !== 1 ? 's' : '' }}</span>
              </div>
              <div v-if="trade.created_at" class="summary-row">
                <v-icon size="small" class="mr-2">schedule</v-icon>
                <span class="text-caption">{{ formatDate(trade.created_at) }}</span>
              </div>
            </div>

            <!-- Proposing Team -->
            <div class="mt-2">
              <span class="text-caption text-medium-emphasis">Proposed by: </span>
              <span class="text-caption font-weight-medium">{{ trade.proposing_team_detail?.name || 'Unknown Team' }}</span>
            </div>

            <!-- Notes Preview (if available) -->
            <div v-if="trade.notes" class="mt-2">
              <p class="text-caption text-medium-emphasis text-truncate">
                {{ trade.notes }}
              </p>
            </div>
          </v-card-text>

          <!-- Card Actions -->
          <v-card-actions v-if="showActions(trade)">
            <v-spacer />

            <!-- Draft Actions -->
            <template v-if="trade.status === 'draft'">
              <v-btn
                size="small"
                variant="text"
                color="primary"
                @click.stop="$emit('edit-trade', trade)"
              >
                <v-icon start>edit</v-icon>
                Edit
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                @click.stop="$emit('delete-trade', trade)"
              >
                <v-icon start>delete</v-icon>
                Delete
              </v-btn>
            </template>

            <!-- Proposed Actions (for recipients) -->
            <template v-if="trade.status === 'proposed' && !isProposer(trade)">
              <v-btn
                size="small"
                variant="text"
                color="success"
                @click.stop="$emit('respond-trade', { trade, response: 'accept' })"
              >
                <v-icon start>check</v-icon>
                Accept
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="warning"
                @click.stop="$emit('respond-trade', { trade, response: 'counter' })"
              >
                <v-icon start>edit</v-icon>
                Counter
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                @click.stop="$emit('respond-trade', { trade, response: 'reject' })"
              >
                <v-icon start>close</v-icon>
                Reject
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Trade } from '@/types/trade';

const authStore = useAuthStore();

interface Props {
  trades: Trade[];
  loading?: boolean;
}

interface Emits {
  (e: 'trade-click', trade: Trade): void;
  (e: 'edit-trade', trade: Trade): void;
  (e: 'delete-trade', trade: Trade): void;
  (e: 'respond-trade', payload: { trade: Trade; response: 'accept' | 'reject' | 'counter' }): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<Emits>();

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

// Get player count
function getPlayerCount(trade: Trade): number {
  return trade.assets.filter((a) => a.asset_type === 'player').length;
}

// Get pick count
function getPickCount(trade: Trade): number {
  return trade.assets.filter((a) => a.asset_type === 'pick').length;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Check if user is proposer
function isProposer(trade: Trade): boolean {
  const userTeamId = authStore.user?.team?.id;
  if (!userTeamId) return false;
  return trade.proposing_team === userTeamId;
}

// Show actions for trade
function showActions(trade: Trade): boolean {
  if (trade.status === 'draft') return true;
  if (trade.status === 'proposed' && !isProposer(trade)) return true;
  return false;
}
</script>

<style scoped>
.trade-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.trade-card:hover {
  transform: translateY(-2px);
}

.trade-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-row {
  display: flex;
  align-items: center;
}

.gap-1 {
  gap: 4px;
}
</style>
