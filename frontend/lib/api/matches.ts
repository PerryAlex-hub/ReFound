import { apiClient } from './client';
import { MatchResponse } from '../types';

export async function getMyMatches(): Promise<MatchResponse[]> {
  const res = await apiClient.get<MatchResponse[]>('/matches/mine');
  return res.data;
}

export async function getMatchesForItem(lostItemId: string): Promise<MatchResponse[]> {
  const res = await apiClient.get<MatchResponse[]>(`/matches/for-item/${lostItemId}`);
  return res.data;
}

export async function dismissMatch(id: string): Promise<void> {
  await apiClient.post(`/matches/${id}/dismiss`);
}
