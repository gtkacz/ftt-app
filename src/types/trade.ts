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

// ===== Main Trade Model =====

export interface Trade {
  id: number;
  status: TradeStatus;
  notes?: string;

  // Team relationships
  proposing_team: number;
  teams: number[];

  // Denormalized team details
  proposing_team_detail: Team;
  teams_detail: Team[];

  // Trade components
  assets: TradeAsset[];
  offers: TradeOffer[];

  // Workflow data
  history: TradeHistoryEntry[];
  approvals: TradeApproval[];
  approval_status: ApprovalStatus | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  proposed_at: string | null;
  completed_at: string | null;
  approved_at: string | null;

  // Approval info
  approved_by: number | null;
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
  status?: TradeStatus;
  team?: number;
  page?: number;
  page_size?: number;
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
