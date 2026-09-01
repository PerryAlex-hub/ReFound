import { apiClient } from './client';
import {
  AdminClaimReviewResponse,
  AdminStatsResponse,
  AdminUserResponse,
  ClaimStatus,
  ClaimSummaryResponse,
  PageResponse,
  Role,
  UserStatus,
} from '../types';

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await apiClient.get<AdminStatsResponse>('/admin/stats');
  return res.data;
}

export async function getAdminClaims(query: { status?: ClaimStatus; page?: number; size?: number } = {}): Promise<PageResponse<ClaimSummaryResponse>> {
  const res = await apiClient.get<PageResponse<ClaimSummaryResponse>>('/admin/claims', { params: query });
  return res.data;
}

export async function getAdminClaim(id: string): Promise<AdminClaimReviewResponse> {
  const res = await apiClient.get<AdminClaimReviewResponse>(`/admin/claims/${id}`);
  return res.data;
}

export async function requestClaimInfo(id: string, question: string): Promise<AdminClaimReviewResponse> {
  const res = await apiClient.post<AdminClaimReviewResponse>(`/admin/claims/${id}/request-info`, { question });
  return res.data;
}

export async function approveClaim(id: string, reason: string): Promise<AdminClaimReviewResponse> {
  const res = await apiClient.post<AdminClaimReviewResponse>(`/admin/claims/${id}/approve`, { reason });
  return res.data;
}

export async function rejectClaim(id: string, reason: string): Promise<AdminClaimReviewResponse> {
  const res = await apiClient.post<AdminClaimReviewResponse>(`/admin/claims/${id}/reject`, { reason });
  return res.data;
}

export async function getAdminUsers(query: { q?: string; role?: Role; status?: UserStatus; page?: number; size?: number } = {}): Promise<PageResponse<AdminUserResponse>> {
  const res = await apiClient.get<PageResponse<AdminUserResponse>>('/admin/users', { params: query });
  return res.data;
}

export async function suspendUser(id: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/users/${id}/suspend`, { reason });
}

export async function reactivateUser(id: string): Promise<void> {
  await apiClient.post(`/admin/users/${id}/reactivate`);
}

export async function promoteUser(id: string): Promise<void> {
  await apiClient.post(`/admin/users/${id}/promote`);
}

export async function demoteUser(id: string): Promise<void> {
  await apiClient.post(`/admin/users/${id}/demote`);
}

export async function hideItem(id: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/items/${id}/hide`, { reason });
}

export async function unhideItem(id: string): Promise<void> {
  await apiClient.post(`/admin/items/${id}/unhide`);
}
