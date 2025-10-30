import api from './axios';
import type {
  Trade,
  TradeOffer,
  TradeAsset,
  Pick,
  CreateTradeData,
  CreateTradeAssetData,
  RespondToTradeOfferData,
  ValidateTradeData,
  TradeValidationResponse,
  TradeListFilters,
  TradeTimelineEvent,
  CommissionerApprovalData,
  CommissionerVetoData,
} from '@/types/trade';

export class TradeService {
  // Trade CRUD operations
  static async listTrades(filters?: TradeListFilters): Promise<{ results: Trade[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.team) params.append('team', filters.team.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await api.get<{ results: Trade[]; count: number }>('/trades/', { params });
    return response.data;
  }

  static async getTrade(id: number): Promise<Trade> {
    const response = await api.get<Trade>(`/trades/${id}/`);
    return response.data;
  }

  static async createTrade(data: CreateTradeData): Promise<Trade> {
    const response = await api.post<Trade>('/trades/', data);
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

  static async counterOffer(id: number, data: CreateTradeData): Promise<Trade> {
    const response = await api.post<Trade>(`/trade-offers/${id}/counter/`, data);
    return response.data;
  }

  // Picks
  static async listPicks(filters?: { team?: number; year?: number }): Promise<Pick[]> {
    const params = new URLSearchParams();
    if (filters?.team) params.append('team', filters.team.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    const response = await api.get<Pick[]>('/picks/', { params });
    return response.data;
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

  // Timeline
  static async getTimeline(id: number): Promise<TradeTimelineEvent[]> {
    const response = await api.get<TradeTimelineEvent[]>(`/trades/${id}/timeline/`);
    return response.data;
  }

  // Commissioner Actions
  static async listPendingApproval(): Promise<{ results: Trade[]; count: number }> {
    const response = await api.get<{ results: Trade[]; count: number }>('/trades/pending-approval/');
    return response.data;
  }

  static async approveTrade(id: number, data?: CommissionerApprovalData): Promise<Trade> {
    const response = await api.post<Trade>(`/trades/${id}/approve/`, data || {});
    return response.data;
  }

  static async vetoTrade(id: number, data: CommissionerVetoData): Promise<Trade> {
    const response = await api.post<Trade>(`/trades/${id}/veto/`, data);
    return response.data;
  }
}
