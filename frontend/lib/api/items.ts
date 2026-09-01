import { apiClient } from './client';
import { Category, ItemDetailResponse, ItemStatus, ItemSummaryResponse, ItemType, PageResponse } from '../types';

export interface ItemsQuery {
  type?: ItemType;
  status?: ItemStatus;
  category?: Category;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export async function getItems(query: ItemsQuery = {}): Promise<PageResponse<ItemSummaryResponse>> {
  const res = await apiClient.get<PageResponse<ItemSummaryResponse>>('/items', { params: query });
  return res.data;
}

export async function getMyItems(query: ItemsQuery = {}): Promise<PageResponse<ItemSummaryResponse>> {
  const res = await apiClient.get<PageResponse<ItemSummaryResponse>>('/items/mine', { params: query });
  return res.data;
}

export async function getItem(id: string): Promise<ItemDetailResponse> {
  const res = await apiClient.get<ItemDetailResponse>(`/items/${id}`);
  return res.data;
}

export async function createItem(data: {
  type: ItemType;
  category: Category;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  locationDetail?: string;
  occurredOn: string;
  attributes?: Record<string, unknown>;
  verificationAnswer?: string;
}): Promise<ItemDetailResponse> {
  const res = await apiClient.post<ItemDetailResponse>('/items', data);
  return res.data;
}

export async function updateItem(id: string, data: {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  locationDetail?: string;
  occurredOn?: string;
  attributes?: Record<string, unknown>;
  verificationAnswer?: string;
}): Promise<ItemDetailResponse> {
  const res = await apiClient.patch<ItemDetailResponse>(`/items/${id}`, data);
  return res.data;
}

export async function cancelItem(id: string): Promise<void> {
  await apiClient.post(`/items/${id}/cancel`);
}

export async function uploadPhoto(id: string, file: File): Promise<ItemDetailResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<ItemDetailResponse>(`/items/${id}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deletePhoto(itemId: string, photoId: string): Promise<void> {
  await apiClient.delete(`/items/${itemId}/photos/${photoId}`);
}

export async function reportItemAbuse(id: string, reason: string): Promise<void> {
  await apiClient.post(`/items/${id}/report-abuse`, { reason });
}
