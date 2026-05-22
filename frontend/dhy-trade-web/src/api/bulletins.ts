import client from './client';

export interface BulletinDto {
  id: string;
  title: string;
  content: string;
  authorName: string;
  isPinned: boolean;
  createdAt: string;
}

export interface CreateBulletinRequest {
  title: string;
  content: string;
  isPinned: boolean;
}

export const getBulletins = () =>
  client.get<BulletinDto[]>('/bulletins');

export const createBulletin = (data: CreateBulletinRequest) =>
  client.post<BulletinDto>('/bulletins', data);

export const updateBulletin = (id: string, data: CreateBulletinRequest) =>
  client.put(`/bulletins/${id}`, data);

export const deleteBulletin = (id: string) =>
  client.delete(`/bulletins/${id}`);
