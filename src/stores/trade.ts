import { defineStore } from 'pinia';
import { TradeService } from '@/api/trade';
import type {
  Trade,
  TradeAsset,
  CreateTradeAssetData,
  TradeValidationResponse,
  TradeListFilters,
  Team,
  Player,
  Pick,
  CommissionerVoteData,
  VoteResultData,
  TradeTeamSummary,
  TeamImpact,
} from '@/types/trade';

interface TradeState {
  // All trades grouped by status
  trades: Trade[];

  // Current trade being edited/viewed
  currentTrade: Trade | null;

  // Available teams in league
  availableTeams: Team[];

  // Available players per team (cached)
  availablePlayersByTeam: Record<number, Player[]>;

  // Available picks per team (cached)
  availablePicksByTeam: Record<number, Pick[]>;

  // Draft trade being composed
  draftTrade: {
    proposing_team: number | null;
    teams: number[];
    assets: CreateTradeAssetData[];
    notes: string;
  };

  // Validation results
  validationResult: TradeValidationResponse | null;

  // Loading states
  loading: {
    trades: boolean;
    currentTrade: boolean;
    validation: boolean;
    teams: boolean;
    players: boolean;
    picks: boolean;
  };
}

export const useTradeStore = defineStore('trade', {
  state: (): TradeState => ({
    trades: [],
    currentTrade: null,
    availableTeams: [],
    availablePlayersByTeam: {},
    availablePicksByTeam: {},
    draftTrade: {
      proposing_team: null,
      teams: [],
      assets: [],
      notes: '',
    },
    validationResult: null,
    loading: {
      trades: false,
      currentTrade: false,
      validation: false,
      teams: false,
      players: false,
      picks: false,
    },
  }),

  getters: {
    // Get trades by status
    tradesByStatus: (state) => (status: string) => {
      return state.trades.filter((trade) => trade.status === status);
    },

    // Get draft trades
    draftTrades(): Trade[] {
      return this.tradesByStatus('draft');
    },

    // Get proposed trades
    proposedTrades(): Trade[] {
      return this.tradesByStatus('proposed');
    },

    // Get trades waiting for approval
    waitingApprovalTrades(): Trade[] {
      return this.tradesByStatus('waiting_approval');
    },

    // Get approved trades
    approvedTrades(): Trade[] {
      return this.tradesByStatus('approved');
    },

    // Get completed trades
    completedTrades(): Trade[] {
      return this.tradesByStatus('completed');
    },

    // Get vetoed trades
    vetoedTrades(): Trade[] {
      return this.tradesByStatus('vetoed');
    },

    // Get rejected trades
    rejectedTrades(): Trade[] {
      return this.tradesByStatus('rejected');
    },

    // Get assets by team for draft trade
    draftAssetsByTeam: (state) => (teamId: number) => {
      return {
        giving: state.draftTrade.assets.filter((a) => a.giving_team === teamId),
        receiving: state.draftTrade.assets.filter((a) => a.receiving_team === teamId),
      };
    },

    // Get team summary for current trade
    getTeamSummary: (state) => (teamId: number): TradeTeamSummary | null => {
      if (!state.currentTrade) return null;

      const team = state.currentTrade.teams_detail.find((t) => t.id === teamId);
      if (!team) return null;

      const receiving = state.currentTrade.assets.filter((a) => a.receiving_team === teamId);
      const giving = state.currentTrade.assets.filter((a) => a.giving_team === teamId);

      const impact = state.validationResult?.team_impacts[teamId];

      return {
        teamId,
        team,
        receiving,
        giving,
        netSalary: impact?.net_salary || 0,
        netPlayers: impact?.net_players || 0,
        impact,
      };
    },

    // Check if current user can vote (for commissioner approval)
    canVote: (state) => (userId: number): boolean => {
      if (!state.currentTrade || state.currentTrade.status !== 'waiting_approval') {
        return false;
      }
      // Check if user already voted
      return !state.currentTrade.approvals.some((a) => a.commissioner === userId);
    },

    // Get user's vote if they voted
    userVote: (state) => (userId: number) => {
      if (!state.currentTrade) return null;
      return state.currentTrade.approvals.find((a) => a.commissioner === userId);
    },
  },

  actions: {
    // ===== Load Trades =====
    async fetchUserTrades(filters?: TradeListFilters) {
      this.loading.trades = true;
      try {
        const response = await TradeService.listTrades(filters);
        // Handle both paginated response (with results) and array response
        if (Array.isArray(response)) {
          this.trades = response;
        } else {
          this.trades = response.results || [];
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        throw error;
      } finally {
        this.loading.trades = false;
      }
    },

    async fetchTradeById(id: number) {
      this.loading.currentTrade = true;
      try {
        this.currentTrade = await TradeService.getTrade(id);
      } catch (error) {
        console.error('Failed to fetch trade:', error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },

    // ===== Load Available Resources =====
    async loadAvailableTeams() {
      this.loading.teams = true;
      try {
        this.availableTeams = await TradeService.listTeams();
      } catch (error) {
        console.error('Failed to load teams:', error);
        throw error;
      } finally {
        this.loading.teams = false;
      }
    },

    async loadAvailablePlayers(teamId: number) {
      if (this.availablePlayersByTeam[teamId]) {
        return; // Already cached
      }

      this.loading.players = true;
      try {
        const players = await TradeService.listPlayers({ team: teamId });
        this.availablePlayersByTeam[teamId] = players;
      } catch (error) {
        console.error('Failed to load players:', error);
        throw error;
      } finally {
        this.loading.players = false;
      }
    },

    async loadAvailablePicks(teamId: number) {
      if (this.availablePicksByTeam[teamId]) {
        return; // Already cached
      }

      this.loading.picks = true;
      try {
        const picks = await TradeService.listPicks({ team: teamId });
        this.availablePicksByTeam[teamId] = picks;
      } catch (error) {
        console.error('Failed to load picks:', error);
        throw error;
      } finally {
        this.loading.picks = false;
      }
    },

    // ===== Draft Trade Management =====
    createDraftTrade(proposingTeamId: number) {
      this.draftTrade = {
        proposing_team: proposingTeamId,
        teams: [proposingTeamId],
        assets: [],
        notes: '',
      };
      this.validationResult = null;
    },

    addTeamToTrade(teamId: number) {
      if (!this.draftTrade.teams.includes(teamId)) {
        this.draftTrade.teams.push(teamId);
      }
    },

    removeTeamFromTrade(teamId: number) {
      if (teamId === this.draftTrade.proposing_team) {
        return; // Cannot remove own team
      }
      this.draftTrade.teams = this.draftTrade.teams.filter((t) => t !== teamId);
      // Remove all assets involving this team
      this.draftTrade.assets = this.draftTrade.assets.filter(
        (a) => a.giving_team !== teamId && a.receiving_team !== teamId
      );
    },

    addAsset(asset: CreateTradeAssetData) {
      this.draftTrade.assets.push(asset);
    },

    removeAsset(index: number) {
      this.draftTrade.assets.splice(index, 1);
    },

    updateAssetDestination(index: number, receivingTeam: number) {
      if (this.draftTrade.assets[index]) {
        this.draftTrade.assets[index].receiving_team = receivingTeam;
      }
    },

    clearDraft() {
      this.draftTrade = {
        proposing_team: null,
        teams: [],
        assets: [],
        notes: '',
      };
      this.validationResult = null;
    },

    // ===== Validation =====
    async validateTrade() {
      if (this.draftTrade.assets.length === 0) {
        this.validationResult = null;
        return;
      }

      this.loading.validation = true;
      try {
        // Strip client-side enrichment fields
        const assetsForValidation = this.draftTrade.assets.map((asset) => {
          const { player_detail, pick_detail, ...cleanAsset } = asset;
          return cleanAsset;
        });

        this.validationResult = await TradeService.validateTrade({
          teams: this.draftTrade.teams,
          assets: assetsForValidation,
        });
      } catch (error) {
        console.error('Validation failed:', error);
        this.validationResult = null;
        throw error;
      } finally {
        this.loading.validation = false;
      }
    },

    // ===== Trade Operations =====
    async saveDraftTrade() {
      if (!this.draftTrade.proposing_team) {
        throw new Error('No proposing team selected');
      }

      this.loading.currentTrade = true;
      try {
        // Create trade
        const trade = await TradeService.createTrade({
          proposing_team: this.draftTrade.proposing_team,
          teams: this.draftTrade.teams,
          notes: this.draftTrade.notes,
        });

        // Add assets
        for (const asset of this.draftTrade.assets) {
          const { player_detail, pick_detail, ...cleanAsset } = asset;
          await TradeService.addAsset({ ...cleanAsset, trade: trade.id });
        }

        // Reload trade with all data
        this.currentTrade = await TradeService.getTrade(trade.id);
        return this.currentTrade;
      } catch (error) {
        console.error('Failed to save draft trade:', error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },

    async proposeTrade(tradeId?: number) {
      const id = tradeId || this.currentTrade?.id;

      if (!id) {
        // Create and propose
        const trade = await this.saveDraftTrade();
        return await TradeService.proposeTrade(trade.id);
      }

      this.loading.currentTrade = true;
      try {
        this.currentTrade = await TradeService.proposeTrade(id);
        await this.fetchUserTrades();
        return this.currentTrade;
      } catch (error) {
        console.error('Failed to propose trade:', error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },

    // ===== Trade Responses =====
    async respondToTrade(offerId: number, response: 'accept' | 'reject' | 'counter', message?: string) {
      this.loading.currentTrade = true;
      try {
        let result: Trade | TradeOffer | null = null;
        switch (response) {
          case 'accept':
            result = await TradeService.acceptOffer(offerId, { message });
            // After accepting, we need to reload the trade to get updated status
            // The acceptOffer returns a TradeOffer, so we need to get the trade
            if (result && 'trade' in result) {
              await this.fetchTradeById(result.trade);
            }
            break;
          case 'reject':
            result = await TradeService.rejectOffer(offerId, { message });
            // After rejecting, reload the trade
            if (result && 'trade' in result) {
              await this.fetchTradeById(result.trade);
            }
            break;
          case 'counter':
            // Counter creates a new draft trade
            result = await TradeService.counterOffer(offerId, { message });
            // Counter returns a Trade (the new draft), set it as current
            if (result && 'id' in result) {
              this.currentTrade = result as Trade;
            }
            break;
        }

        await this.fetchUserTrades();

        return result;
      } catch (error) {
        console.error(`Failed to ${response} trade:`, error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },

    // ===== Commissioner Actions =====
    async voteOnTrade(tradeId: number, vote: 'approve' | 'veto', notes?: string) {
      this.loading.currentTrade = true;
      try {
        const voteData: CommissionerVoteData = { vote, notes: notes || '' };
        const response = await TradeService.voteOnTrade(tradeId, voteData);

        // Update current trade with new vote data
        if (response.trade) {
          this.currentTrade = response.trade;
        }

        await this.fetchUserTrades();
        return response.vote_result;
      } catch (error) {
        console.error('Failed to vote on trade:', error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },

    async executeTrade(tradeId: number) {
      this.loading.currentTrade = true;
      try {
        this.currentTrade = await TradeService.executeTrade(tradeId);
        await this.fetchUserTrades();
        return this.currentTrade;
      } catch (error) {
        console.error('Failed to execute trade:', error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },

    // ===== Utility Actions =====
    async cancelTrade(tradeId: number) {
      this.loading.currentTrade = true;
      try {
        await TradeService.cancelTrade(tradeId);
        await this.fetchUserTrades();
      } catch (error) {
        console.error('Failed to cancel trade:', error);
        throw error;
      } finally {
        this.loading.currentTrade = false;
      }
    },
  },
});
