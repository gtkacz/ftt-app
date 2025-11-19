// Trade System TypeScript Types - Updated for new architecture

export type TradeStatus =
  | 'draft'
  | 'proposed'
  | 'waiting_approval'
  | 'approved'
  | 'vetoed'
  | 'rejected'
  | 'completed';

export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected';

export type AssetType = 'player' | 'pick';

export type PickProtectionType = 'none' | 'top_x' | 'swap_best' | 'swap_worst';

export type TradeHistoryEventType =
  | 'created'
  | 'modified'
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'cancelled'
  | 'approval_requested'
  | 'commissioner_voted'
  | 'approved'
  | 'vetoed'
  | 'executed';

export type VoteType = 'approve' | 'veto';

// ===== Core Models =====

export interface Team {
  id: number;
  name: string;
  logo?: string;
  owner: number;
  owner_username?: string;
  // Cap and roster info from validation
  total_salary?: number;
  total_players?: number;
  salary_cap?: number;
  max_player_cap?: number;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  nba_team: string;
  jersey_number?: string;
  photo_url?: string;
  contract?: Contract; // Contract info for trade creation
}

export interface Contract {
  id: number;
  player: Player;
  team: Team;
  start_year: number;
  duration: number;
  salary: number;
  is_rfa: boolean;
  is_to: boolean;
  years_remaining?: number;
}

export interface Pick {
  id: number;
  year: number;
  round: number;
  original_team: number;
  current_team: number;
  protection_type?: PickProtectionType;
  protection_value?: number; // For top_x protection
  display_name?: string;
}

// ===== Trade Asset Models =====

export interface TradeAsset {
  id: number;
  trade: number;
  asset_type: AssetType;

  // Asset references (one will be null based on asset_type)
  player: number | null;
  pick: number | null;

  // Denormalized details
  player_detail: Player | null;
  pick_detail: Pick | null;

  // Transfer details
  giving_team: number;
  receiving_team: number;

  // Denormalized team details
  giving_team_detail: Team;
  receiving_team_detail: Team;

  created_at: string;
}

export interface CreateTradeAssetData {
  trade?: number; // Optional for draft trades
  asset_type: AssetType;
  giving_team: number;
  receiving_team: number;
  player?: number;
  pick?: number;

  // Client-side enrichment for display (stripped before API calls)
  player_detail?: Player;
  pick_detail?: Pick;
}

// ===== Trade Offer Models =====

export interface TradeOffer {
  id: number;
  trade: number;
  team: number;
  team_detail: Team;
  status: TradeOfferStatus;
  is_proposer: boolean;
  message?: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Trade History Models =====

export interface TradeHistoryEntry {
  id: number;
  trade: number;

  event_type: TradeHistoryEventType;
  event_display: string;

  actor: number | null;
  actor_username: string | null;
  actor_display: string;

  team: number | null;
  team_name: string | null;

  message: string;

  assets_snapshot: any | null;
  has_snapshot: boolean;
  snapshot_summary: string;

  created_at: string;
}

// ===== Commissioner Approval Models =====

export interface TradeApproval {
  id: number;
  trade: number;

  commissioner: number;
  commissioner_username: string;

  vote: VoteType;
  vote_display: string;
  vote_summary: string;

  is_admin_vote: boolean;
  is_approve: boolean;
  is_veto: boolean;

  notes: string;
  voted_at: string;
}

export interface ApprovalStatus {
  total_commissioners: number;
  approve_votes: number;
  veto_votes: number;
  majority_needed: number;
  votes_remaining: number;
}

// ===== Backend Trade Status Structure =====

export interface BackendTradeStatus {
  participants: Record<number, any>; // Team ID -> status object
  commissioners: Record<number, any>; // Team ID -> status object
}

// ===== Backend Trade Assets Structure =====

export interface BackendTradeAssets {
  players: any[]; // Serialized player contracts
  picks: any[]; // Serialized draft picks
}

// ===== Backend Trade Model (from API) =====

export interface BackendTrade {
  id: number;
  sender: Team;
  participants: Team[];
  parent: number | null; // For counteroffers
  done: boolean;
  assets: BackendTradeAssets;
  status: BackendTradeStatus;
  created_at: string;
  updated_at: string;
}

// ===== Display Status Type =====

export type TradeDisplayStatus =
  | 'waiting_acceptance'
  | 'accepted'
  | 'approved'
  | 'completed'
  | 'rejected'
  | 'vetoed'
  | 'unknown';

// ===== Main Trade Model (for frontend use) =====

export interface Trade {
  id: number;
  status: TradeStatus | TradeDisplayStatus; // Can be either old or new status
  displayStatus?: TradeDisplayStatus; // Computed display status from backend
  notes?: string;

  // Team relationships (backend structure)
  sender?: Team; // Backend uses 'sender'
  participants?: Team[]; // Backend uses 'participants'
  parent?: number | null; // For counteroffers
  done?: boolean; // Backend flag

  // Legacy frontend structure (for compatibility)
  proposing_team?: number;
  teams?: number[];
  proposing_team_detail?: Team;
  teams_detail?: Team[];

  // Trade components
  assets: TradeAsset[] | BackendTradeAssets; // Can be either structure
  offers?: TradeOffer[];

  // Workflow data
  history?: TradeHistoryEntry[];
  timeline?: TradeHistoryEntry[];
  approvals?: TradeApproval[];
  approval_status?: ApprovalStatus | null;

  // Backend status structure
  backendStatus?: BackendTradeStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
  proposed_at?: string | null;
  completed_at?: string | null;
  approved_at?: string | null;

  // Approval info
  approved_by?: number | null;
}

// ===== Helper function to compute display status from backend trade =====

export function getTradeDisplayStatus(trade: BackendTrade | Trade): TradeDisplayStatus {
  // Get status object (backend structure)
  const status = trade.backendStatus || (trade as any).status;
  
  // Check if this is a counteroffer (has parent)
  const isCounteroffer = trade.parent !== null && trade.parent !== undefined;
  
  // If trade is done, check final state
  if (trade.done) {
    // Check if vetoed (commissioner status)
    if (status?.commissioners) {
      const commissionerStatuses = Object.values(status.commissioners);
      if (commissionerStatuses.some((s: any) => s?.status === 'vetoed')) {
        return 'vetoed';
      }
      // If done and has approved status, it's completed
      if (commissionerStatuses.some((s: any) => s?.status === 'approved')) {
        return 'completed';
      }
    }
    // If done but no commissioner status, might be rejected
    if (status?.participants) {
      const participantStatuses = Object.values(status.participants);
      if (participantStatuses.some((s: any) => s?.status === 'rejected')) {
        return 'rejected';
      }
    }
    // Default to completed if done
    return 'completed';
  }

  // Trade is not done, check current status
  if (status) {
    // Check commissioner statuses first (higher priority)
    if (status.commissioners) {
      const commissionerStatuses = Object.values(status.commissioners);
      if (commissionerStatuses.some((s: any) => s?.status === 'vetoed')) {
        return 'vetoed';
      }
      if (commissionerStatuses.some((s: any) => s?.status === 'approved')) {
        return 'approved';
      }
    }
    
    // Check participant statuses
    if (status.participants) {
      const participantStatuses = Object.values(status.participants);
      
      // Check if any participant rejected
      if (participantStatuses.some((s: any) => s?.status === 'rejected')) {
        return 'rejected';
      }
      
      // Check if all participants (except sender) have accepted
      // The sender doesn't need to accept their own trade
      const senderId = (trade as any).sender?.id || (trade as any).proposing_team;
      const participantIds = Object.keys(status.participants || {}).map(Number);
      const nonSenderParticipantIds = senderId 
        ? participantIds.filter(id => id !== senderId)
        : participantIds;
      
      if (nonSenderParticipantIds.length > 0) {
        const nonSenderStatuses = nonSenderParticipantIds
          .map(id => status.participants[id])
          .filter(Boolean);
        
        if (nonSenderStatuses.length > 0) {
          const allAccepted = nonSenderStatuses.every((s: any) => s?.status === 'accepted');
          if (allAccepted) {
            return 'accepted';
          }
        }
      }
      
      // Check if waiting (has sent status or is a counteroffer)
      // Counteroffers should show as waiting_acceptance
      if (isCounteroffer) {
        return 'waiting_acceptance';
      }
      
      // Check for sent status
      if (participantStatuses.some((s: any) => s?.status === 'sent' || s?.status === 'counteroffer')) {
        return 'waiting_acceptance';
      }
    }
  }

  // If it's a counteroffer but no status info, it's waiting
  if (isCounteroffer) {
    return 'waiting_acceptance';
  }

  // Fallback: if no status info, check done flag
  if (trade.done) {
    return 'completed';
  }

  return 'unknown';
}

// ===== Validation Models =====

export interface TeamImpact {
  net_salary: number;
  net_players: number;
  under_salary_cap: boolean;
  under_player_cap: boolean;
  new_salary: number;
  new_player_count: number;
  current_salary: number;
  current_player_count: number;
  salary_cap: number;
  max_player_cap: number;
}

export interface TradeValidationResponse {
  valid: boolean;
  warnings: string[];
  errors: string[];
  team_impacts: {
    [teamId: number]: TeamImpact;
  };
}

// ===== Request/Response Data Models =====

export interface CreateTradeData {
  proposing_team: number;
  teams: number[];
  notes?: string;
}

export interface ValidateTradeData {
  teams: number[];
  assets: Omit<CreateTradeAssetData, 'player_detail' | 'pick_detail'>[];
}

export interface RespondToTradeOfferData {
  message?: string;
}

export interface CommissionerVoteData {
  vote: VoteType;
  notes?: string;
}

export interface VoteResultData {
  decision_made: boolean;
  final_status: TradeStatus;
  votes_needed: number;
  approve_count: number;
  veto_count: number;
  total_commissioners: number;
}

export interface TradeListFilters {
  status?: TradeStatus | TradeDisplayStatus;
  team?: number;
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

export interface TradeActionRequest {
  action: 'accept' | 'reject' | 'counteroffer' | 'approved' | 'vetoed';
  trade_id: number;
  offer?: any; // For counteroffer, the new trade offer
}

// ===== UI Helper Types =====

export interface TradeTeamSummary {
  teamId: number;
  team: Team;
  receiving: TradeAsset[];
  giving: TradeAsset[];
  netSalary: number;
  netPlayers: number;
  impact?: TeamImpact;
}

export interface AssetSelectionData {
  asset_type: AssetType;
  asset_id: number;
  giving_team: number;
  receiving_team: number;
  protection?: {
    type: PickProtectionType;
    value?: number;
  };
  // Full objects for display
  player?: Player;
  pick?: Pick;
}
