import client from './client';

export const getConfigs = () =>
  client.get<{ key: string; value: string }[]>('/config');

export const setBaseCapital = (value: number) =>
  client.put('/config/baseCapital', { value });
