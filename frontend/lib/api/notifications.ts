import { apiClient } from './client';
import { NotificationResponse, PageResponse } from '../types';

export async function getNotifications(query: { page?: number; size?: number } = {}): Promise<PageResponse<NotificationResponse>> {
  const res = await apiClient.get<PageResponse<NotificationResponse>>('/notifications', { params: query });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<{ unread: number }>('/notifications/unread-count');
  return res.data.unread;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}
