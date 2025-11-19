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
          :class="{ 'voting': votingTradeId === trade.id }"
        >
          <!-- Card Header -->
          <v-card-title class="d-flex align-center pb-2">
            <v-chip color="warning" size="small" variant="flat">
              <v-icon start size="small">schedule</v-icon>
              Pending Approval
            </v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">#{{ trade.id }}</span>
          </v-card-title>

          <!-- Trade Teams -->
          <v-card-subtitle class="pt-1 pb-2">
            <div class="d-flex flex-wrap align-center gap-1">
              <v-chip
                v-for="team in getTeams(trade)"
                :key="team.id"
                size="small"
                variant="outlined"
              >
                {{ team.name }}
              </v-chip>
            </div>
          </v-card-subtitle>

          <!-- Trade Summary -->
          <v-card-text class="pt-2">
            <!-- Full Trade Details -->
            <div class="trade-assets-summary">
              <div v-for="team in getTeams(trade)" :key="team.id" class="team-assets mb-3">
                <div class="team-header mb-2">
                  <v-chip size="small" variant="flat" color="primary">
                    {{ team.name }}
                  </v-chip>
                </div>
                
                <!-- Receiving -->
                <div v-if="getReceivingAssets(trade, team.id).length > 0" class="asset-group mb-2">
                  <div class="text-caption text-medium-emphasis mb-1">
                    <v-icon size="x-small" color="success" class="mr-1">arrow_downward</v-icon>
                    Receiving
                  </div>
                  <v-list density="compact" class="asset-list">
                    <v-list-item
                      v-for="asset in getReceivingAssets(trade, team.id)"
                      :key="`rec-${asset.id || asset.asset_type}-${asset.player || asset.pick}`"
                      class="px-2 py-1"
                    >
                      <template #prepend>
                        <v-icon size="small" :color="asset.asset_type === 'player' ? 'primary' : 'secondary'">
                          {{ asset.asset_type === 'player' ? 'person' : 'star' }}
                        </v-icon>
                      </template>
                      <v-list-item-title class="text-caption">
                        <span v-if="asset.asset_type === 'player' && asset.player_detail">
                          {{ getPlayerName(asset.player_detail) }}
                        </span>
                        <span v-else-if="asset.asset_type === 'pick' && asset.pick_detail">
                          {{ getPickDisplay(asset.pick_detail) }}
                        </span>
                      </v-list-item-title>
                      <v-list-item-subtitle v-if="asset.asset_type === 'player' && asset.player_detail" class="text-caption">
                        {{ asset.player_detail.position || '' }} - {{ asset.player_detail.nba_team || '' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>

                <!-- Giving -->
                <div v-if="getGivingAssets(trade, team.id).length > 0" class="asset-group">
                  <div class="text-caption text-medium-emphasis mb-1">
                    <v-icon size="x-small" color="warning" class="mr-1">arrow_upward</v-icon>
                    Giving
                  </div>
                  <v-list density="compact" class="asset-list">
                    <v-list-item
                      v-for="asset in getGivingAssets(trade, team.id)"
                      :key="`giv-${asset.id || asset.asset_type}-${asset.player || asset.pick}`"
                      class="px-2 py-1"
                    >
                      <template #prepend>
                        <v-icon size="small" :color="asset.asset_type === 'player' ? 'primary' : 'secondary'">
                          {{ asset.asset_type === 'player' ? 'person' : 'star' }}
                        </v-icon>
                      </template>
                      <v-list-item-title class="text-caption">
                        <span v-if="asset.asset_type === 'player' && asset.player_detail">
                          {{ getPlayerName(asset.player_detail) }}
                        </span>
                        <span v-else-if="asset.asset_type === 'pick' && asset.pick_detail">
                          {{ getPickDisplay(asset.pick_detail) }}
                        </span>
                      </v-list-item-title>
                      <v-list-item-subtitle v-if="asset.asset_type === 'player' && asset.player_detail" class="text-caption">
                        {{ asset.player_detail.position || '' }} - {{ asset.player_detail.nba_team || '' }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>
              </div>
            </div>

            <!-- Approval Status -->
            <div v-if="trade.approval_status" class="mt-3">
              <v-divider class="mb-2" />
              <div class="approval-status">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-caption text-medium-emphasis">Approval Status</span>
                  <v-chip
                    :color="getApprovalStatusColor(trade.approval_status)"
                    size="x-small"
                    variant="flat"
                  >
                    {{ getApprovalStatusText(trade.approval_status) }}
                  </v-chip>
                </div>
                <v-progress-linear
                  :model-value="getApprovalProgress(trade.approval_status)"
                  :color="getApprovalProgressColor(trade.approval_status)"
                  height="6"
                  rounded
                  class="mt-1"
                />
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ trade.approval_status.approve_votes }} approve,
                  {{ trade.approval_status.veto_votes }} veto
                  ({{ trade.approval_status.majority_needed }} needed)
                </div>
              </div>
            </div>
          </v-card-text>

          <!-- Card Actions -->
          <v-card-actions class="pa-3">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="$emit('trade-click', trade)"
            >
              <v-icon start size="small">visibility</v-icon>
              View Details
            </v-btn>
            <v-spacer />
            <!-- Show user's vote if they've already voted -->
            <template v-if="hasUserVoted(trade)">
              <v-chip
                :color="getUserVote(trade) === 'approve' ? 'success' : 'error'"
                size="small"
                variant="flat"
                class="mr-2"
              >
                <v-icon start size="small">
                  {{ getUserVote(trade) === 'approve' ? 'check_circle' : 'block' }}
                </v-icon>
                You {{ getUserVote(trade) === 'approve' ? 'Approved' : 'Vetoed' }}
              </v-chip>
            </template>
            <!-- Show action buttons if user hasn't voted -->
            <template v-else>
              <v-btn
                size="small"
                variant="text"
                color="error"
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
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 3px solid rgb(var(--v-theme-warning));
}

.commissioner-trade-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.commissioner-trade-card.voting {
  opacity: 0.7;
  pointer-events: none;
}

.trade-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  align-items: center;
}

.approval-status {
  padding: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
}

.trade-assets-summary {
  max-height: 400px;
  overflow-y: auto;
}

.team-assets {
  padding: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 4px;
  border-left: 2px solid rgb(var(--v-theme-primary));
}

.team-header {
  display: flex;
  align-items: center;
}

.asset-group {
  margin-left: 8px;
}

.asset-list {
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 4px;
}

.gap-1 {
  gap: 4px;
}
</style>

