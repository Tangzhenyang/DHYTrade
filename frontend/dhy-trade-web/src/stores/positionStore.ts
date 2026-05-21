import { create } from 'zustand';
import { getPositions } from '../api/positions';
import type { PositionDto } from '../api/positions';

interface PositionState {
  positions: PositionDto[];
  loading: boolean;
  totalCost: number;
  totalMarketValue: number;
  totalPnl: number;
  refresh: () => Promise<void>;
}

export const usePositionStore = create<PositionState>((set) => ({
  positions: [],
  loading: false,
  totalCost: 0,
  totalMarketValue: 0,
  totalPnl: 0,

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await getPositions();
      const positions = res.data;
      set({
        positions,
        totalCost: positions.reduce((s, p) => s + p.totalCost, 0),
        totalMarketValue: positions.reduce((s, p) => s + p.marketValue, 0),
        totalPnl: positions.reduce((s, p) => s + p.unrealizedPnl, 0),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
