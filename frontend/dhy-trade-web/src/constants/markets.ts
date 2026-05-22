export type MarketType = 'AShare' | 'HongKong';

export const marketOptions: Array<{ label: string; value: MarketType }> = [
  { label: 'A股', value: 'AShare' },
  { label: '港股', value: 'HongKong' },
];

export const marketLabels: Record<MarketType, string> = {
  AShare: 'A股',
  HongKong: '港股',
};

export const marketCurrencySymbols: Record<MarketType, string> = {
  AShare: '¥',
  HongKong: 'HK$',
};

export const marketCurrencyUnits: Record<MarketType, string> = {
  AShare: '人民币',
  HongKong: '港元',
};

export const marketConfigKeys: Record<MarketType, string> = {
  AShare: 'BaseCapital:AShare',
  HongKong: 'BaseCapital:HongKong',
};