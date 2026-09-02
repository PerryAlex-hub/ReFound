import { apiClient } from './client';
import { ClaimDetailResponse, ClaimSummaryResponse, PageResponse } from '../types';

export async function createClaim(data: {
  foundItemId: string;
  lostItemId?: string;
  description: string;
  lostContext?: string;
}): Promise<ClaimDetailResponse> {
  const res = await apiClient.post<ClaimDetailResponse>('/claims', data);
  return res.data;
}

// No `status` parameter: GET /claims/mine does not support one. Filter the
// returned page client-side, or add the parameter to the API first.
export async function getMyClaims(query: { page?: number; size?: number } = {}): Promise<PageResponse<ClaimSummaryResponse>> {
  const res = await apiClient.get<PageResponse<ClaimSummaryResponse>>('/claims/mine', { params: query });
  return res.data;
}

export async function getClaim(id: string): Promise<ClaimDetailResponse> {
  const res = await apiClient.get<ClaimDetailResponse>(`/claims/${id}`);
  return res.data;
}

export async function respondToClaim(id: string, answer: string): Promise<ClaimDetailResponse> {
  const res = await apiClient.post<ClaimDetailResponse>(`/claims/${id}/respond`, { answer });
  return res.data;
}

export async function withdrawClaim(id: string): Promise<void> {
  await apiClient.post(`/claims/${id}/withdraw`);
}

export async function confirmHandover(id: string): Promise<ClaimDetailResponse> {
  const res = await apiClient.post<ClaimDetailResponse>(`/claims/${id}/confirm-handover`);
  return res.data;
}
