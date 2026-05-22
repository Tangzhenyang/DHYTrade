import client from './client';
import type { UserDto } from './auth';

export const getUsers = () => client.get<UserDto[]>('/users');

export const updateUserRole = (id: string, role: string) =>
  client.put(`/users/${id}/role`, { role });

export const toggleUserActive = (id: string, isActive: boolean) =>
  client.put(`/users/${id}/active`, { isActive });
