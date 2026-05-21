import client from './client';

export interface TradeRecordDto {
  id: string;
  stockCode: string;
  stockName: string;
  type: 'Buy' | 'Sell';
  lots: number;
  shares: number;
  price: number;
  amount: number;
  commission: number;
  totalCost: number;
  operatorName: string | null;
  note: string | null;
  tradedAt: string;
  createdAt: string;
}

export interface AddTradeRequest {
  stockCode: string;
  stockName: string;
  type: 'Buy' | 'Sell';
  lots: number;
  price?: number;
  note?: string;
  tradedAt?: string;
}

export const getTrades = (params?: {
  stockCode?: string;
  from?: string;
  to?: string;
  page?: number;
}) => client.get<TradeRecordDto[]>('/trades', { params });

export const addTrade = (data: AddTradeRequest) =>
  client.post<TradeRecordDto>('/trades', data);

export const deleteTrade = (id: string) =>
  client.delete(`/trades/${id}`);
