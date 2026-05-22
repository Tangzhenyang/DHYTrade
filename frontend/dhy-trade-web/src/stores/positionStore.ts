import { create } from 'zustand';
import { getPositions } from '../api/positions';
import { getConfigs } from '../api/config';
import type { PositionDto } from '../api/positions';

interface PositionState {
  positions: PositionDto[];
  loading: boolean;
  configMap: Record<string, number>;
  refresh: () => Promise<void>;
}

export const usePositionStore = create<PositionState>((set) => ({
  positions: [],
  loading: false,
  configMap: {},

  refresh: async () => {
    set({ loading: true });
    try {
      const [posRes, cfgRes] = await Promise.all([getPositions(), getConfigs()]);
      const positions = posRes.data;
      const configs = cfgRes.data;
      const configMap = Object.fromEntries(
        configs.map((config) => [config.key, Number(config.value)])
      );

      set({
        positions,
        configMap,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
