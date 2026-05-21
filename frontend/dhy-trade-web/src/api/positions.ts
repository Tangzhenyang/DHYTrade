import client from './client';

export interface PositionDto {
  id: string;
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

export const getPositions = () =>
  client.get<PositionDto[]>('/positions');

export const getClosedPositions = () =>
  client.get<PositionDto[]>('/positions/closed');
