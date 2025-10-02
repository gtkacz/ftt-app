import { defineStore } from 'pinia';
import { TradeService } from '@/api/trade';
import type {
  Trade,
  TradeOffer,
  TradeAsset,
  Pick,
  CreateTradeData,
  CreateTradeAssetData,
  TradeValidationResponse,
  TradeListFilters,
  Team,
} from '@/types/trade';

interface TradeState {
  // Trade lists
  activeTrades: Trade[];
  sentTrades: Trade[];
  tradeHistory: Trade[];

  // Current trade being composed/viewed
  currentTrade: Trade | null;

  // Draft trade being composed
  draftTrade: {
    proposing_team: number | null;
    teams: number[];
    assets: CreateTradeAssetData[];
    notes: string;
  };

  // Validation state
  validationResult: TradeValidationResponse | null;
  isValidating: boolean;

  // Available picks for trading
  availablePicks: Pick[];

  // Loading states
  isLoading: boolean;
  isLoadingTrades: boolean;
  isLoadingPicks: boolean;

  // Trade offers
  tradeOffers: TradeOffer[];
}

export const useTradeStore = defineStore('trade', {
  state: (): TradeState => ({
    activeTrades: [],
    sentTrades: [],
    tradeHistory: [],
    currentTrade: null,
    draftTrade: {
      proposing_team: null,
      teams: [],
      assets: [],
      notes: '',
    },
    validationResult: null,
    isValidating: false,
    availablePicks: [],
    isLoading: false,
    isLoadingTrades: false,
    isLoadingPicks: false,
    tradeOffers: [],
  }),

  getters: {
    // Get active trades where current team needs to respond
    pendingTrades(): Trade[] {
      return this.activeTrades.filter(trade =>
        trade.status === 'proposed' &&
        trade.offers?.some(offer => offer.status === 'pending')
      );
    },

    // Get trades sent by current team
    proposedByMe(): Trade[] {
      return this.sentTrades.filter(trade =>
        trade.status === 'proposed' || trade.status === 'waiting_approval'
      );
    },

    // Get draft assets by team
    assetsByTeam(): (teamId: number) => { giving: CreateTradeAssetData[]; receiving: CreateTradeAssetData[] } {
      return (teamId: number) => ({
        giving: this.draftTrade.assets.filter(a => a.giving_team === teamId),
        receiving: this.draftTrade.assets.filter(a => a.receiving_team === teamId),
      });
    },

    // Check if draft trade is valid for proposing
    canProposeTrade(): boolean {
      if (!this.draftTrade.proposing_team || this.draftTrade.teams.length < 2) {
        return false;
      }

      // Each team must give and receive at least one asset
      const allTeams = [this.draftTrade.proposing_team, ...this.draftTrade.teams.filter(t => t !== this.draftTrade.proposing_team)];
      return allTeams.every(teamId => {
        const { giving, receiving } = this.assetsByTeam(teamId);
        return giving.length > 0 && receiving.length > 0;
      });
    },

    // Get validation impact for specific team
    teamImpact(): (teamId: number) => any {
      return (teamId: number) => {
        return this.validationResult?.team_impacts[teamId] || null;
      };
    },
  },

  actions: {
    // Load trades
    async loadTrades(filters?: TradeListFilters) {
      this.isLoadingTrades = true;
      try {
        const response = await TradeService.listTrades(filters);

        // Categorize trades
        this.activeTrades = response.results.filter(t =>
          t.status === 'proposed' || t.status === 'waiting_approval'
        );
        this.sentTrades = response.results.filter(t =>
          t.status === 'proposed' || t.status === 'waiting_approval'
        );
        this.tradeHistory = response.results.filter(t =>
          ['accepted', 'rejected', 'cancelled', 'completed', 'vetoed'].includes(t.status)
        );
      } catch (error) {
        console.error('Failed to load trades:', error);
        throw error;
      } finally {
        this.isLoadingTrades = false;
      }
    },

    // Load specific trade
    async loadTrade(id: number) {
      this.isLoading = true;
      try {
        this.currentTrade = await TradeService.getTrade(id);
      } catch (error) {
        console.error('Failed to load trade:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Load available picks
    async loadAvailablePicks(teamId: number) {
      this.isLoadingPicks = true;
      try {
        this.availablePicks = await TradeService.listPicks({ team: teamId });
      } catch (error) {
        console.error('Failed to load picks:', error);
        throw error;
      } finally {
        this.isLoadingPicks = false;
      }
    },

    // Initialize draft trade
    initDraftTrade(proposingTeamId: number) {
      this.draftTrade = {
        proposing_team: proposingTeamId,
        teams: [proposingTeamId],
        assets: [],
        notes: '',
      };
      this.validationResult = null;
    },

    // Add team to draft trade
    addTeamToDraft(teamId: number) {
      if (!this.draftTrade.teams.includes(teamId)) {
        this.draftTrade.teams.push(teamId);
      }
    },

    // Remove team from draft trade
    removeTeamFromDraft(teamId: number) {
      if (teamId !== this.draftTrade.proposing_team) {
        this.draftTrade.teams = this.draftTrade.teams.filter(t => t !== teamId);
        // Remove all assets involving this team
        this.draftTrade.assets = this.draftTrade.assets.filter(
          a => a.giving_team !== teamId && a.receiving_team !== teamId
        );
      }
    },

    // Add asset to draft trade
    addAssetToDraft(asset: CreateTradeAssetData) {
      this.draftTrade.assets.push(asset);
    },

    // Remove asset from draft trade
    removeAssetFromDraft(index: number) {
      this.draftTrade.assets.splice(index, 1);
    },

    // Update asset in draft trade
    updateAssetInDraft(index: number, asset: Partial<CreateTradeAssetData>) {
      this.draftTrade.assets[index] = { ...this.draftTrade.assets[index], ...asset };
    },

    // Validate current draft trade
    async validateDraftTrade() {
      if (this.draftTrade.assets.length === 0) {
        this.validationResult = null;
        return;
      }

      this.isValidating = true;
      try {
        this.validationResult = await TradeService.validateTrade({
          teams: this.draftTrade.teams,
          assets: this.draftTrade.assets,
        });
      } catch (error) {
        console.error('Validation failed:', error);
        this.validationResult = null;
        throw error;
      } finally {
        this.isValidating = false;
      }
    },

    // Create and save draft trade
    async saveDraftTrade() {
      if (!this.draftTrade.proposing_team) {
        throw new Error('No proposing team selected');
      }

      this.isLoading = true;
      try {
        const tradeData: CreateTradeData = {
          proposing_team: this.draftTrade.proposing_team,
          teams: this.draftTrade.teams,
          notes: this.draftTrade.notes,
          status: 'draft',
        };

        const trade = await TradeService.createTrade(tradeData);

        // Add all assets
        for (const asset of this.draftTrade.assets) {
          await TradeService.addAsset({ ...asset, trade: trade.id });
        }

        this.currentTrade = await TradeService.getTrade(trade.id);
        return this.currentTrade;
      } catch (error) {
        console.error('Failed to save draft trade:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Propose trade
    async proposeTrade(tradeId?: number) {
      const id = tradeId || this.currentTrade?.id;
      if (!id) {
        // If no existing trade, create and propose
        const trade = await this.saveDraftTrade();
        return await TradeService.proposeTrade(trade.id);
      }

      this.isLoading = true;
      try {
        this.currentTrade = await TradeService.proposeTrade(id);
        await this.loadTrades();
        return this.currentTrade;
      } catch (error) {
        console.error('Failed to propose trade:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Accept trade offer
    async acceptOffer(offerId: number, message?: string) {
      this.isLoading = true;
      try {
        await TradeService.acceptOffer(offerId, { message });
        await this.loadTrades();
        if (this.currentTrade) {
          await this.loadTrade(this.currentTrade.id);
        }
      } catch (error) {
        console.error('Failed to accept offer:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Reject trade offer
    async rejectOffer(offerId: number, message?: string) {
      this.isLoading = true;
      try {
        await TradeService.rejectOffer(offerId, { message });
        await this.loadTrades();
        if (this.currentTrade) {
          await this.loadTrade(this.currentTrade.id);
        }
      } catch (error) {
        console.error('Failed to reject offer:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Cancel trade
    async cancelTrade(tradeId: number) {
      this.isLoading = true;
      try {
        await TradeService.cancelTrade(tradeId);
        await this.loadTrades();
      } catch (error) {
        console.error('Failed to cancel trade:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Delete draft trade
    async deleteDraftTrade(tradeId: number) {
      this.isLoading = true;
      try {
        await TradeService.deleteTrade(tradeId);
        await this.loadTrades();
      } catch (error) {
        console.error('Failed to delete trade:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Clear draft
    clearDraft() {
      this.draftTrade = {
        proposing_team: null,
        teams: [],
        assets: [],
        notes: '',
      };
      this.validationResult = null;
    },
  },
});
