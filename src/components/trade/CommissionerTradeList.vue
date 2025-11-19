<template>
  <div class="commissioner-trade-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-medium-emphasis mt-4">Loading trades...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="trades.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">gavel</v-icon>
      <p class="text-h6 text-medium-emphasis mt-4">No trades pending approval</p>
      <p class="text-caption">Trades waiting for commissioner approval will appear here</p>
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
          class="commissioner-trade-card"
          :class="{ 
            'voting': votingTradeId === trade.id,
            'user-voted': hasUserVoted(trade)
          }"
        >
          <!-- Status Accent Border -->
          <div class="commissioner-card__accent"></div>

          <!-- Card Header -->
          <v-card-title class="commissioner-card__header">
            <div class="d-flex align-center">
              <v-chip 
                color="warning" 
                size="small" 
                variant="flat"
                class="status-chip"
              >
                <v-icon start size="small">gavel</v-icon>
                Pending Approval
              </v-chip>
            </div>
            <v-spacer />
            <span class="text-caption text-medium-emphasis trade-id">#{{ trade.id }}</span>
          </v-card-title>

          <v-divider class="mx-4" />

          <!-- Trade Teams -->
          <v-card-subtitle class="commissioner-card__teams pt-3 pb-2">
            <div class="d-flex flex-wrap align-center gap-2">
              <div
                v-for="team in getTeams(trade)"
                :key="team.id"
                class="team-chip"
              >
                <v-avatar v-if="team.logo" size="20" class="mr-1">
                  <v-img :src="team.logo" />
                </v-avatar>
                <v-chip
                  size="small"
                  variant="outlined"
                  class="team-chip__content"
                >
                  {{ team.name }}
                </v-chip>
              </div>
            </div>
          </v-card-subtitle>

          <!-- Trade Summary -->
          <v-card-text class="commissioner-card__content">
            <!-- Asset Count Summary -->
            <div class="asset-summary-badges mb-4">
              <v-chip
                v-if="getPlayerCount(trade) > 0"
                size="small"
                color="primary"
                variant="flat"
                class="asset-badge"
              >
                <v-icon start size="small">person</v-icon>
                {{ getPlayerCount(trade) }} player{{ getPlayerCount(trade) !== 1 ? 's' : '' }}
              </v-chip>
              <v-chip
                v-if="getPickCount(trade) > 0"
                size="small"
                color="secondary"
                variant="flat"
                class="asset-badge"
              >
                <v-icon start size="small">star</v-icon>
                {{ getPickCount(trade) }} pick{{ getPickCount(trade) !== 1 ? 's' : '' }}
              </v-chip>
            </div>

            <!-- Approval Status -->
            <div v-if="trade.approval_status" class="approval-status-card mb-4">
              <div class="approval-status-header">
                <div class="d-flex align-center">
                  <v-icon size="small" color="warning" class="mr-2">how_to_vote</v-icon>
                  <span class="text-subtitle-2 font-weight-medium">Voting Status</span>
                </div>
                <v-chip
                  :color="getApprovalStatusColor(trade.approval_status)"
                  size="small"
                  variant="flat"
                  class="status-badge"
                >
                  {{ getApprovalStatusText(trade.approval_status) }}
                </v-chip>
              </div>
              
              <div class="approval-progress mt-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption text-medium-emphasis">Progress</span>
                  <span class="text-caption font-weight-medium">
                    {{ trade.approval_status.approve_votes + trade.approval_status.veto_votes }} / {{ trade.approval_status.total_commissioners }} votes
                  </span>
                </div>
                <v-progress-linear
                  :model-value="getApprovalProgress(trade.approval_status)"
                  :color="getApprovalProgressColor(trade.approval_status)"
                  height="8"
                  rounded
                  class="progress-bar"
                />
                <div class="vote-counts mt-2">
                  <div class="vote-count-item">
                    <v-icon size="x-small" color="success" class="mr-1">check_circle</v-icon>
                    <span class="text-caption">{{ trade.approval_status.approve_votes }} approve</span>
                  </div>
                  <div class="vote-count-item">
                    <v-icon size="x-small" color="error" class="mr-1">block</v-icon>
                    <span class="text-caption">{{ trade.approval_status.veto_votes }} veto</span>
                  </div>
                  <div class="vote-count-item">
                    <v-icon size="x-small" color="warning" class="mr-1">schedule</v-icon>
                    <span class="text-caption">{{ trade.approval_status.majority_needed }} needed</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- User Vote Indicator -->
            <div v-if="hasUserVoted(trade)" class="user-vote-indicator mb-4">
              <v-alert
                :type="getUserVote(trade) === 'approve' ? 'success' : 'error'"
                variant="tonal"
                density="compact"
                class="vote-alert"
              >
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-2">
                    {{ getUserVote(trade) === 'approve' ? 'check_circle' : 'block' }}
                  </v-icon>
                  <span class="text-caption font-weight-medium">
                    You {{ getUserVote(trade) === 'approve' ? 'approved' : 'vetoed' }} this trade
                  </span>
                </div>
              </v-alert>
            </div>
          </v-card-text>

          <!-- Card Actions -->
          <v-card-actions class="commissioner-card__actions">
            <v-btn
              size="small"
              variant="outlined"
              color="primary"
              class="view-btn"
              @click="$emit('trade-click', trade)"
            >
              <v-icon start size="small">visibility</v-icon>
              View Details
            </v-btn>
            <v-spacer />
            <!-- Show action buttons if user hasn't voted -->
            <template v-if="!hasUserVoted(trade)">
              <v-btn
                size="small"
                color="error"
                variant="outlined"
                class="action-btn action-btn--veto"
                :loading="votingTradeId === trade.id"
                :disabled="votingTradeId !== null"
                @click="$emit('veto', trade)"
              >
                <v-icon start size="small">block</v-icon>
                Veto
              </v-btn>
              <v-btn
                size="small"
                color="success"
                variant="flat"
                class="action-btn action-btn--approve"
                :loading="votingTradeId === trade.id"
                :disabled="votingTradeId !== null"
                @click="$emit('approve', trade)"
              >
                <v-icon start size="small">check_circle</v-icon>
                Approve
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
import type { Trade, BackendTradeAssets, ApprovalStatus, TradeAsset } from '@/types/trade';

const authStore = useAuthStore();

interface Props {
  trades: Trade[];
  loading?: boolean;
  votingTradeId?: number | null;
}

interface Emits {
  (e: 'trade-click', trade: Trade): void;
  (e: 'approve', trade: Trade): void;
  (e: 'veto', trade: Trade): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  votingTradeId: null,
});

defineEmits<Emits>();

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

// Get user's vote for a trade
function getUserVote(trade: Trade): 'approve' | 'veto' | null {
  const userTeamId = authStore.user?.team?.id;
  if (!userTeamId) return null;
  
  // Check commissioner statuses: status.commissioners[teamId].status
  const status = trade.backendStatus || (trade as any).status;
  if (status?.commissioners && status.commissioners[userTeamId]) {
    const commissionerStatus = status.commissioners[userTeamId];
    const voteStatus = commissionerStatus?.status;
    if (voteStatus === 'approved') return 'approve';
    if (voteStatus === 'vetoed') return 'veto';
  }
  
  return null;
}

// Get transformed assets for a trade (handles both backend and legacy structures)
function getTransformedAssets(trade: Trade): TradeAsset[] {
  if (Array.isArray(trade.assets)) {
    // Legacy structure - already in correct format
    return trade.assets as TradeAsset[];
  } else if (trade.assets && typeof trade.assets === 'object') {
    // Backend structure - need to transform
    const backendAssets = trade.assets as BackendTradeAssets;
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

// Get receiving assets for a team
function getReceivingAssets(trade: Trade, teamId: number): TradeAsset[] {
  const assets = getTransformedAssets(trade);
  return assets.filter((a) => a.receiving_team === teamId);
}

// Get giving assets for a team
function getGivingAssets(trade: Trade, teamId: number): TradeAsset[] {
  const assets = getTransformedAssets(trade);
  return assets.filter((a) => a.giving_team === teamId);
}

// Get player name
function getPlayerName(playerDetail: any): string {
  return playerDetail.full_name || 
         playerDetail.name || 
         `${playerDetail.first_name || ''} ${playerDetail.last_name || ''}`.trim() || 
         'Unknown Player';
}

// Get pick display
function getPickDisplay(pickDetail: any): string {
  const year = pickDetail.draft_year || pickDetail.year || '?';
  const round = pickDetail.round_number || pickDetail.round || '?';
  return `${year} Round ${round}`;
}

// Get player count (handles both backend and legacy structures)
function getPlayerCount(trade: Trade): number {
  if (Array.isArray(trade.assets)) {
    return trade.assets.filter((a: any) => a.asset_type === 'player').length;
  } else if (trade.assets && typeof trade.assets === 'object') {
    const backendAssets = trade.assets as BackendTradeAssets;
    return backendAssets.players?.length || 0;
  }
  return 0;
}

// Get pick count (handles both backend and legacy structures)
function getPickCount(trade: Trade): number {
  if (Array.isArray(trade.assets)) {
    return trade.assets.filter((a: any) => a.asset_type === 'pick').length;
  } else if (trade.assets && typeof trade.assets === 'object') {
    const backendAssets = trade.assets as BackendTradeAssets;
    return backendAssets.picks?.length || 0;
  }
  return 0;
}

// Get teams for display (handles both backend and legacy structures)
function getTeams(trade: Trade) {
  return trade.teams_detail || trade.participants || [];
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

// Get approval status color
function getApprovalStatusColor(status: ApprovalStatus | null): string {
  if (!status) return 'grey';
  if (status.approve_votes >= status.majority_needed) return 'success';
  if (status.veto_votes >= status.majority_needed) return 'error';
  return 'warning';
}

// Get approval status text
function getApprovalStatusText(status: ApprovalStatus | null): string {
  if (!status) return 'Pending';
  if (status.approve_votes >= status.majority_needed) return 'Approved';
  if (status.veto_votes >= status.majority_needed) return 'Vetoed';
  return 'In Progress';
}

// Get approval progress percentage
function getApprovalProgress(status: ApprovalStatus | null): number {
  if (!status) return 0;
  const totalVotes = status.approve_votes + status.veto_votes;
  return (totalVotes / status.total_commissioners) * 100;
}

// Get approval progress color
function getApprovalProgressColor(status: ApprovalStatus | null): string {
  if (!status) return 'grey';
  if (status.approve_votes >= status.majority_needed) return 'success';
  if (status.veto_votes >= status.majority_needed) return 'error';
  return 'warning';
}
</script>

<style scoped>
.commissioner-trade-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.commissioner-trade-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.commissioner-trade-card.voting {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.commissioner-trade-card.voting::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.5);
  z-index: 1;
}

.commissioner-trade-card.user-voted {
  border-left-color: rgb(var(--v-theme-success));
  background: linear-gradient(to right, rgba(var(--v-theme-success), 0.05), transparent);
}

.commissioner-card__accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, rgb(var(--v-theme-warning)), rgb(var(--v-theme-warning-lighten-1)));
  transition: width 0.3s;
}

.commissioner-trade-card:hover .commissioner-card__accent {
  width: 6px;
}

.commissioner-card__header {
  padding: 16px 16px 12px 20px;
  min-height: 56px;
}

.status-chip {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.trade-id {
  font-family: 'Roboto Mono', monospace;
  font-weight: 500;
}

.commissioner-card__teams {
  padding: 8px 16px 8px 20px;
}

.team-chip {
  display: flex;
  align-items: center;
}

.team-chip__content {
  font-weight: 500;
}

.commissioner-card__content {
  padding: 12px 16px 12px 20px;
}

.asset-summary-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.asset-badge {
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.asset-badge:hover {
  transform: scale(1.05);
}

.approval-status-card {
  padding: 12px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface-variant), 0.4), rgba(var(--v-theme-surface-variant), 0.2));
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-warning), 0.2);
}

.approval-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-badge {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.approval-progress {
  margin-top: 12px;
}

.progress-bar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.vote-counts {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.vote-count-item {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.user-vote-indicator {
  animation: slideIn 0.3s ease-out;
}

.vote-alert {
  border-left: 4px solid;
  border-left-color: inherit;
}

.commissioner-card__actions {
  padding: 12px 16px 12px 20px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.view-btn {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.3px;
}

.action-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.3px;
  transition: all 0.2s;
  margin-left: 8px;
  min-width: 100px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn--approve {
  box-shadow: 0 2px 4px rgba(var(--v-theme-success), 0.3);
}

.action-btn--veto:hover {
  box-shadow: 0 4px 8px rgba(var(--v-theme-error), 0.3);
}

.gap-2 {
  gap: 8px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

