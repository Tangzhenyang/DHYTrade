import client from './client';
import type { MarketType } from '../constants/markets';

export interface TradeFeeSettings {
  ratePerTenThousand: number;
  waiveMinimumCommission: boolean;
}

export const getConfigs = () =>
  client.get<{ key: string; value: string }[]>('/config');

export const setBaseCapital = (marketType: MarketType, value: number) =>
  client.put('/config/baseCapital', { marketType, value });

export const getTradeFeeSettings = () =>
  client.get<TradeFeeSettings>('/config/tradeFee');

export const setTradeFeeSettings = (ratePerTenThousand: number, waiveMinimumCommission: boolean) =>
  client.put<TradeFeeSettings>('/config/tradeFee', { ratePerTenThousand, waiveMinimumCommission });
