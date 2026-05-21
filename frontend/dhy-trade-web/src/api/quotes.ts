import client from './client';

export interface QuoteResult {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  change: number;
  changePct: number;
  quoteTime: string;
}

export const getQuote = (stockCode: string) =>
  client.get<QuoteResult>(`/quotes/${stockCode}`);

export const batchQuote = (stockCodes: string[]) =>
  client.post<QuoteResult[]>('/quotes/batch', { stockCodes });
