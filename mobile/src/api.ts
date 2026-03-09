import { API_BASE_URL } from './config';

export type MatchStatus = 'inprogress' | 'upcoming' | 'finished';

export async function getMatches(params: { date: string; status: MatchStatus }) {
  const url = `${API_BASE_URL}/v1/matches?date=${encodeURIComponent(params.date)}&status=${encodeURIComponent(params.status)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getMatchDetail(matchId: string) {
  const url = `${API_BASE_URL}/v1/matches/${encodeURIComponent(matchId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getMatchDeep(matchId: string, deepType: string) {
  const url = `${API_BASE_URL}/v1/matches/${encodeURIComponent(matchId)}/deep/${encodeURIComponent(deepType)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
