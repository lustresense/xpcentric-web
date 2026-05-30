import { apiDownload, apiGet, apiPost } from '@/lib/api';
import type {
  CertificateRecord,
  DashboardEvent,
  DashboardReport,
  KampungLeaderboardItem,
  RewardVoucher,
  UserParticipation,
} from './types';

export async function fetchUserEvents(token: string | null) {
  const data = await apiGet<{ events: DashboardEvent[] }>('/events', token);
  return data.events || [];
}

export async function fetchUserReports(userId: string | undefined, token: string | null) {
  const data = await apiGet<{ reports: DashboardReport[] }>(`/reports?userId=${userId || ''}`, token);
  return data.reports || [];
}

export async function fetchUserParticipations(token: string | null) {
  const data = await apiGet<{ participations: UserParticipation[] }>('/users/me/participations', token);
  return data.participations || [];
}

export async function fetchKampungLeaderboard(token: string | null) {
  const data = await apiGet<{ kampung: KampungLeaderboardItem[] }>('/kampung', token);
  return data.kampung || [];
}

export async function fetchCertificates(token: string | null) {
  const data = await apiGet<{ certificates: CertificateRecord[] }>('/certificates', token);
  return data.certificates || [];
}

export async function fetchRewardCatalog(token: string | null) {
  const data = await apiGet<{ catalog: RewardVoucher[] }>('/rewards/catalog', token);
  return data.catalog || [];
}

export async function fetchUserDirectory(token: string | null) {
  const data = await apiGet<{ users: Array<{ id: string; name: string }> }>('/users?role=user', token);
  const next: Record<string, string> = {};
  (data.users || []).forEach((item) => {
    next[item.id] = item.name;
  });
  return next;
}

export async function submitAttendanceAndComplete(
  eventId: string,
  userIds: string[],
  outputSummary: string,
  token: string | null,
) {
  await apiPost(`/events/${eventId}/attendance`, { userIds }, token);
  await apiPost(`/events/${eventId}/complete`, { outputSummary }, token);
}

export async function redeemVoucher(voucherId: string, token: string | null) {
  return apiPost<{
    redemption?: {
      voucherCode?: string;
      remainingPoints?: number;
    };
  }>('/rewards/redeem', { voucherId }, token);
}

export function downloadCertificateFile(certificateId: string, token: string | null) {
  return apiDownload(`/certificates/${certificateId}/download`, token);
}
