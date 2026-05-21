import client from './client';

export interface CopyResultItem {
  stockCode: string;
  stockName: string;
  targetRatio: number;
  targetAmount: number;
  price: number;
  suggestLots: number;
  actualAmount: number;
}

export interface CopyCalculateResponse {
  totalCapital: number;
  totalActualAmount: number;
  items: CopyResultItem[];
}

export const calculateCopy = (ownCapital: number) =>
  client.post<CopyCalculateResponse>('/copy/calculate', { ownCapital });
