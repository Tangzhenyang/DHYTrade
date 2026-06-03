import client from './client';

export interface QuoteResult {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  change: number;
  changePct: number;
  quoteTime: string;
}

export interface QuoteSearchResult {
  stockCode: string;
  stockName: string;
  marketType: 'AShare' | 'HongKong';
}

export const getQuote = (stockCode: string) =>
  client.get<QuoteResult>(`/quotes/${stockCode}`);

export const searchQuotes = (keyword: string, marketType?: 'AShare' | 'HongKong') =>
  client.get<QuoteSearchResult[]>('/quotes/search', { params: { keyword, marketType } });

export const batchQuote = (stockCodes: string[]) =>
  client.post<QuoteResult[]>('/quotes/batch', { stockCodes });
