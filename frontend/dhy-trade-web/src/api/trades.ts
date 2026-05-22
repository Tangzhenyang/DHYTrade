import client from './client';
import type { MarketType } from '../constants/markets';

export interface TradeRecordDto {
  id: string;
  marketType: MarketType;
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
  marketType: MarketType;
  stockCode: string;
  stockName: string;
  type: 'Buy' | 'Sell';
  lots: number;
  price?: number;
  note?: string;
  tradedAt?: string;
}

export type UpdateTradeRequest = AddTradeRequest;

export const getTrades = (params?: {
  stockCode?: string;
  from?: string;
  to?: string;
  page?: number;
}) => client.get<TradeRecordDto[]>('/trades', { params });

export const addTrade = (data: AddTradeRequest) =>
  client.post<TradeRecordDto>('/trades', data);

export const updateTrade = (id: string, data: UpdateTradeRequest) =>
  client.put<TradeRecordDto>(`/trades/${id}`, data);

export const deleteTrade = (id: string) =>
  client.delete(`/trades/${id}`);
