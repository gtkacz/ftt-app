// Trade System TypeScript Types

export type TradeStatus =
  | 'draft'
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'waiting_approval'
  | 'approved'
  | 'completed'
  | 'vetoed';

export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered';

export type AssetType = 'player' | 'pick';

export type PickProtectionType =
  | 'none'
  | 'swap_best'
  | 'swap_worst'
  | 'doesnt_convey';

export type TradeTimelineEventType =
  | 'created'
  | 'proposed'
  | 'team_accepted'
  | 'team_rejected'
  | 'team_countered'
  | 'cancelled'
  | 'commissioner_approved'
  | 'commissioner_vetoed'
  | 'completed';

export interface Team {
  id: number;
  name: string;
  logo?: string;
  owner_id: number;
  owner_username?: string;
  total_salary: number;
  total_players: number;
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
  original_team: Team;
  current_team: Team;
  draft_year: number;
  round_number: number;
  protection_type: PickProtectionType;
  protection_range_start?: number;
  protection_range_end?: number;
  swap_target_pick?: Pick | number;
  rollover_year?: number;
  actual_pick_number?: number;
  is_conveyed?: boolean;
  display_name?: string;
}

export interface TradeAsset {
  id?: number;
  trade?: number;
  asset_type: AssetType;
  giving_team: Team | number;
  receiving_team: Team | number;
  player?: Player | number;
  pick?: Pick | number;
  pick_protection_type?: PickProtectionType;
  pick_protection_range_start?: number;
  pick_protection_range_end?: number;
  pick_swap_target?: Pick | number;
  pick_rollover_year?: number;
}

export interface TradeOffer {
  id: number;
  trade: number;
  team: Team | number;
  status: TradeOfferStatus;
  is_proposer: boolean;
  counter_offer?: TradeOffer | number;
  message?: string;
  responded_at?: string;
}

export interface TradeTimelineEvent {
  id: number;
  trade: number;
  event_type: TradeTimelineEventType;
  actor_team?: Team | number;
  actor_user?: number;
  actor_username?: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface Trade {
  id: number;
  proposing_team: Team | number;
  teams: (Team | number)[];
  status: TradeStatus;
  notes?: string;
  created_at: string;
  proposed_at?: string;
  completed_at?: string;
  approved_at?: string;
  approved_by?: number;
  approved_by_username?: string;
  veto_reason?: string;
  assets?: TradeAsset[];
  offers?: TradeOffer[];
  timeline?: TradeTimelineEvent[];
}

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

export interface CreateTradeData {
  proposing_team: number;
  teams: number[];
  notes?: string;
  status?: 'draft' | 'proposed';
}

export interface CreateTradeAssetData {
  trade?: number;  // Optional for draft trades
  asset_type: AssetType;
  giving_team: number;
  receiving_team: number;
  player?: number;
  pick?: number;
  pick_protection_type?: PickProtectionType;
  pick_protection_range_start?: number;
  pick_protection_range_end?: number;
  pick_swap_target?: number;
  pick_rollover_year?: number;
  // Client-side enrichment for display
  player_detail?: Player;
  pick_detail?: Pick;
}

export interface RespondToTradeOfferData {
  message?: string;
}

export interface ValidateTradeData {
  teams: number[];
  assets: CreateTradeAssetData[];
}

export interface TradeListFilters {
  status?: TradeStatus;
  team?: number;
  page?: number;
  page_size?: number;
}

export interface CommissionerApprovalData {
  notes?: string;
}

export interface CommissionerVetoData {
  reason: string;
}

export interface TradeNotification {
  id: number;
  type: 'trade_proposed' | 'trade_accepted' | 'trade_rejected' | 'trade_countered' | 'trade_completed' | 'trade_approved' | 'trade_vetoed';
  trade_id: number;
  message: string;
  created_at: string;
  read: boolean;
}

export interface TradeParticipant {
  team: Team;
  status: 'pending' | 'accepted' | 'rejected';
  responded_at?: string;
  is_proposer: boolean;
}
