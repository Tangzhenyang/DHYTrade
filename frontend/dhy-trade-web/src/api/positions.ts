import client from './client';
import type { MarketType } from '../constants/markets';

export interface PositionDto {
  id: string;
  marketType: MarketType;
  stockCode: string;
  stockName: string;
  shares: number;
  totalCost: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  ratioPct: number;
  holdDays: number;
  firstBoughtAt: string | null;
  lastTradedAt: string | null;
  isActive: boolean;
}

export interface ExchangeRateDto {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  quoteTime: string;
}

export const getPositions = () =>
  client.get<PositionDto[]>('/positions');

export const getClosedPositions = () =>
  client.get<PositionDto[]>('/positions/closed');

export const getExchangeRate = () =>
  client.get<ExchangeRateDto>('/positions/exchange-rate');

export const refreshPositions = () =>
  client.post<{ message: string; updated: number; exchangeRate?: ExchangeRateDto }>('/positions/refresh');
