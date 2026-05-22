import client from './client';
import type { UserDto } from './auth';

export const getProfile = () => client.get<UserDto>('/profile');

export const updateEmail = (email: string, currentPassword: string) =>
  client.put<UserDto>('/profile/email', { email, currentPassword });

export const updatePassword = (currentPassword: string, newPassword: string) =>
  client.put('/profile/password', { currentPassword, newPassword });