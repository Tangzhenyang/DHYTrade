import client from './client';

export const getInvites = () => client.get('/invites');

export const createInvite = (expiresAt?: string) =>
  client.post('/invites', { expiresAt });
