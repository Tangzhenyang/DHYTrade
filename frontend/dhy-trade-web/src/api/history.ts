import client from './client';

export interface StockPnlSummary {
  stockCode: string;
  stockName: string;
  totalRealizedPnl: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  tradeCount: number;
}

export interface MatchedBuy {
  boughtAt: string;
  shares: number;
  avgCost: number;
}

export interface PnlItem {
  tradeId: string;
  tradedAt: string;
  shares: number;
  price: number;
  revenue: number;
  matchedCost: number;
  pnl: number;
  matchedBuys: MatchedBuy[];
}

export interface StockPnlDetail {
  stockCode: string;
  stockName: string;
  totalRealizedPnl: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  tradeCount: number;
  pnlItems: PnlItem[];
}

export const getAllStocksPnl = () =>
  client.get<StockPnlSummary[]>('/history');

export const getStockPnlDetail = (stockCode: string) =>
  client.get<StockPnlDetail>(`/history/${stockCode}`);
