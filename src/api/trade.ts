import api from './axios';
import type {
  Trade,
  BackendTrade,
  TradeOffer,
  TradeAsset,
  Pick,
  Team,
  Player,
  CreateTradeData,
  CreateTradeAssetData,
  RespondToTradeOfferData,
  ValidateTradeData,
  TradeValidationResponse,
  TradeListFilters,
  TradeHistoryEntry,
  CommissionerVoteData,
  VoteResultData,
  TradeActionRequest,
  TradeDisplayStatus,
} from '@/types/trade';
import { getTradeDisplayStatus } from '@/types/trade';

export class TradeService {
  // Trade CRUD operations
  static async listTrades(filters?: TradeListFilters): Promise<Trade[] | { results: Trade[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.team) params.append('team', filters.team.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<BackendTrade[] | { results: BackendTrade[]; count: number }>('/trades/', { params });
    
    // Transform backend trades to frontend format
    const transformTrade = (trade: BackendTrade): Trade => {
      const displayStatus = getTradeDisplayStatus(trade);
      return {
        ...trade,
        displayStatus,
        status: displayStatus,
        backendStatus: trade.status,
        sender: trade.sender,
        participants: trade.participants,
        // Map backend structure to legacy frontend structure for compatibility
        proposing_team: trade.sender?.id,
        teams: trade.participants?.map(p => p.id) || [],
        proposing_team_detail: trade.sender,
        teams_detail: trade.participants || [],
        // Assets are already in BackendTradeAssets format
        assets: trade.assets,
      };
    };

    if (Array.isArray(response.data)) {
      return response.data.map(transformTrade);
    } else {
      return {
        results: response.data.results.map(transformTrade),
        count: response.data.count,
      };
    }
  }

  static async getTrade(id: number): Promise<Trade> {
    const response = await api.get<BackendTrade>(`/trades/${id}/`);
    const trade = response.data;
    const displayStatus = getTradeDisplayStatus(trade);
    return {
      ...trade,
      displayStatus,
      status: displayStatus,
      backendStatus: trade.status,
      sender: trade.sender,
      participants: trade.participants,
      // Map backend structure to legacy frontend structure for compatibility
      proposing_team: trade.sender?.id,
      teams: trade.participants?.map(p => p.id) || [],
      proposing_team_detail: trade.sender,
      teams_detail: trade.participants || [],
      assets: trade.assets,
    };
  }

  static async createTrade(data: CreateTradeData | any[]): Promise<any> {
    // Backend expects array of AssetPayload objects
    // Format: [{ receiver: teamId, assets: { players: [contractIds], picks: [{id, protection}] } }]
    const response = await api.post<any>('/trades/', data);
    return response.data;
  }

  static async updateTrade(id: number, data: Partial<CreateTradeData>): Promise<Trade> {
    const response = await api.patch<Trade>(`/trades/${id}/`, data);
    return response.data;
  }

  static async deleteTrade(id: number): Promise<void> {
    await api.delete(`/trades/${id}/`);
  }

  static async proposeTrade(id: number): Promise<Trade> {
    const response = await api.post<Trade>(`/trades/${id}/propose/`);
    return response.data;
  }

  static async executeTrade(id: number): Promise<Trade> {
    const response = await api.post<Trade>(`/trades/${id}/execute/`);
    return response.data;
  }

  static async cancelTrade(id: number): Promise<Trade> {
    const response = await api.post<Trade>(`/trades/${id}/cancel/`);
    return response.data;
  }

  // Trade Assets
  static async addAsset(data: CreateTradeAssetData): Promise<TradeAsset> {
    const response = await api.post<TradeAsset>(`/trades/${data.trade}/assets/`, data);
    return response.data;
  }

  static async updateAsset(id: number, data: Partial<CreateTradeAssetData>): Promise<TradeAsset> {
    const response = await api.patch<TradeAsset>(`/trade-assets/${id}/`, data);
    return response.data;
  }

  static async removeAsset(id: number): Promise<void> {
    await api.delete(`/trade-assets/${id}/`);
  }

  // Trade Offers
  static async listOffers(filters?: { team?: number; status?: string }): Promise<TradeOffer[]> {
    const params = new URLSearchParams();
    if (filters?.team) params.append('team', filters.team.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<TradeOffer[]>('/trade-offers/', { params });
    return response.data;
  }

  static async getOffer(id: number): Promise<TradeOffer> {
    const response = await api.get<TradeOffer>(`/trade-offers/${id}/`);
    return response.data;
  }

  static async acceptOffer(id: number, data?: RespondToTradeOfferData): Promise<TradeOffer> {
    const response = await api.post<TradeOffer>(`/trade-offers/${id}/accept/`, data || {});
    return response.data;
  }

  static async rejectOffer(id: number, data?: RespondToTradeOfferData): Promise<TradeOffer> {
    const response = await api.post<TradeOffer>(`/trade-offers/${id}/reject/`, data || {});
    return response.data;
  }

  static async counterOffer(id: number, data?: RespondToTradeOfferData): Promise<Trade> {
    const response = await api.post<Trade>(`/trade-offers/${id}/counter/`, data || {});
    return response.data;
  }

  // Teams
  static async listTeams(): Promise<Team[]> {
    const response = await api.get<{ results: Team[]; count: number } | Team[]>('/teams/', {
      params: { page_size: 1000 }, // Get all teams
    });
    // Handle both paginated and array responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  }

  static async getTeam(id: number): Promise<Team> {
    const response = await api.get<Team>(`/teams/${id}/`);
    return response.data;
  }

  // Players
  static async listPlayers(filters?: { team?: number; position?: string; is_rfa?: boolean }): Promise<Player[]> {
    const params = new URLSearchParams();
    if (filters?.team) params.append('team', filters.team.toString());
    if (filters?.position) params.append('position', filters.position);
    if (filters?.is_rfa !== undefined) params.append('is_rfa', filters.is_rfa.toString());
    params.append('limit', '10000'); // Get all players

    const response = await api.get<{ results: any[]; count: number } | any[]>('/players/', { params });
    // Handle both paginated and array responses
    let players: any[];
    if (Array.isArray(response.data)) {
      players = response.data;
    } else {
      players = response.data.results || [];
    }

    // Transform API response to match Player type
    let transformedPlayers = players.map((p: any) => ({
      id: p.id,
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      full_name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Player',
      position: p.position || p.primary_position || 'N/A',
      nba_team: p.nba_team || p.real_team?.abbreviation || p.real_team?.name || 'N/A',
      jersey_number: p.jersey_number,
      photo_url: p.photo_url || p.photo,
      // Keep contract info - needed for trade creation (contract ID)
      contract: p.contract ? {
        id: p.contract.id,
        player: p.contract.player || p.id,
        team: typeof p.contract.team === 'object' ? p.contract.team?.id : p.contract.team,
        start_year: p.contract.start_year,
        duration: p.contract.duration,
        salary: p.contract.salary,
        is_rfa: p.contract.is_rfa,
        is_to: p.contract.is_to,
      } : undefined,
      // Keep for filtering
      _contract: p.contract,
      _team: p.team,
      _team_id: p.team_id,
    }));

    // If team filter is provided but API didn't filter correctly, filter client-side
    if (filters?.team) {
      transformedPlayers = transformedPlayers.filter((p: any) => {
        // Check multiple possible team fields
        const playerTeam = p._contract?.team || p._team || p._team_id || 
                          (typeof p._contract?.team === 'object' ? p._contract?.team?.id : null) ||
                          null;
        // Convert to number for comparison
        const teamId = typeof playerTeam === 'number' ? playerTeam : 
                      (typeof playerTeam === 'object' && playerTeam?.id ? playerTeam.id : null);
        return teamId === filters.team;
      });
    }

    // Remove internal fields before returning, but keep contract
    return transformedPlayers.map(({ _contract, _team, _team_id, ...p }) => p);
  }

  static async getPlayer(id: number): Promise<Player> {
    const response = await api.get<Player>(`/players/${id}/`);
    return response.data;
  }

  // Picks
  static async listPicks(filters?: { team?: number; year?: number }): Promise<Pick[]> {
    const params = new URLSearchParams();
    params.append('limit', '10000');
    params.append('is_from_league_draft', 'false'); // Get all picks
    if (filters?.team) params.append('current_team', filters.team.toString());
    if (filters?.year) params.append('draft_year', filters.year.toString());

    const response = await api.get<{ results: any[]; count: number } | any[]>('/picks/', { params });
    // Handle both paginated and array responses
    let picks: any[];
    if (Array.isArray(response.data)) {
      picks = response.data;
    } else {
      picks = response.data.results || [];
    }

    // Transform API response to match Pick type
    return picks.map((p: any) => ({
      id: p.id,
      year: p.year || p.draft_year || new Date().getFullYear(),
      round: p.round || p.round_number || 1,
      original_team: p.original_team,
      current_team: p.current_team,
      protection_type: p.protection_type || (p.protections ? 'top_x' : undefined),
      protection_value: p.protection_value,
      display_name: p.display_name || `${p.year || p.draft_year || '?'} Round ${p.round || p.round_number || '?'}`,
    }));
  }

  static async getPick(id: number): Promise<Pick> {
    const response = await api.get<Pick>(`/picks/${id}/`);
    return response.data;
  }

  // Validation
  static async validateTrade(data: ValidateTradeData): Promise<TradeValidationResponse> {
    const response = await api.post<TradeValidationResponse>('/trades/validate/', data);
    return response.data;
  }

  // Timeline (now included in trade detail response as 'history')
  static async getTimeline(id: number): Promise<TradeHistoryEntry[]> {
    const response = await api.get<{ history: TradeHistoryEntry[] }>(`/trades/${id}/history/`);
    return response.data.history;
  }

  // Commissioner Actions
  static async listPendingApproval(): Promise<{ results: Trade[]; count: number }> {
    const response = await api.get<{ results: Trade[]; count: number }>('/trades/pending-approval/');
    return response.data;
  }

  // Primary voting endpoint (replaces approve/veto)
  static async voteOnTrade(
    id: number,
    data: CommissionerVoteData
  ): Promise<{ trade: Trade; vote_result: VoteResultData }> {
    const response = await api.post<{ trade: Trade; vote_result: VoteResultData }>(
      `/trades/${id}/vote/`,
      data
    );
    return response.data;
  }

  // Deprecated: Use voteOnTrade with vote: 'approve' instead
  static async approveTrade(id: number, notes?: string): Promise<Trade> {
    const response = await this.voteOnTrade(id, { vote: 'approve', notes });
    return response.trade;
  }

  // Deprecated: Use voteOnTrade with vote: 'veto' instead
  static async vetoTrade(id: number, reason: string): Promise<Trade> {
    const response = await this.voteOnTrade(id, { vote: 'veto', notes: reason });
    return response.trade;
  }

  // ===== Trade Actions (Backend endpoint) =====
  static async performTradeAction(data: TradeActionRequest): Promise<{ detail: string }> {
    const payload: any = {
      action: data.action.toLowerCase(),
      trade_id: data.trade_id,
    };
    
    // For counteroffer, include the offer
    if (data.action === 'counteroffer' && data.offer) {
      payload.offer = data.offer;
    }
    
    const response = await api.post<{ detail: string }>('/trades/actions/', payload);
    return response.data;
  }
}
