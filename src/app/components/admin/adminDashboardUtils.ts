export type SortDirection = 'asc' | 'desc';

export function safePoints(value: unknown): number {
  const points = Number(value);
  if (!Number.isFinite(points)) return 0;
  return Math.max(0, Math.trunc(points));
}

export function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function userRoleCode(user: any): string {
  return normalize(user?.roleCode || user?.role);
}

export function isAdminUser(user: any): boolean {
  return userRoleCode(user) === 'admin';
}

export function isStaffUser(user: any): boolean {
  const code = userRoleCode(user);
  return code === 'moderator' || code.startsWith('moderator_t');
}

export function isVolunteerUser(user: any): boolean {
  const code = userRoleCode(user);
  return code === 'user' || code === 'ksh' || Boolean(user?.isKsh);
}

export function roleLabel(user: any): string {
  const code = userRoleCode(user);
  if (code === 'admin') return 'Admin';
  if (code === 'ksh' || user?.isKsh) return 'KSH';
  if (code === 'moderator_t1') return 'ASN Tier 1';
  if (code === 'moderator_t2') {
    if (normalize(user?.tier2Badge) === 'camat') return 'Camat';
    if (normalize(user?.tier2Badge) === 'lurah') return 'Lurah';
    return 'ASN Tier 2';
  }
  if (code === 'moderator_t3') return 'ASN Tier 3';
  if (code === 'moderator') return 'Moderator';
  return 'Relawan';
}

export function roleBucket(user: any): string {
  if (isAdminUser(user)) return 'Admin';
  if (isStaffUser(user)) return 'ASN/Moderator';
  if (userRoleCode(user) === 'ksh' || user?.isKsh) return 'KSH';
  return 'Relawan';
}

export function areaLabel(row: any): string {
  return row?.kelurahan || row?.kecamatan || row?.kodepos || 'Belum diisi';
}

export function eventParticipants(event: any): number {
  if (Array.isArray(event?.participants)) return event.participants.length;
  const count = Number(event?.currentParticipants ?? event?.participantCount ?? event?.participantsCount ?? 0);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function dateValue(value: unknown): number {
  const parsed = new Date(String(value ?? '')).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDate(value: unknown): string {
  const parsed = new Date(String(value ?? ''));
  if (Number.isNaN(parsed.getTime())) return 'Belum dijadwalkan';
  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getPillarName(pillar: number): string {
  const pillars = ['Lingkungan', 'Gotong Royong', 'Ekonomi Kreatif', 'Keamanan'];
  return pillars[pillar - 1] || 'Umum';
}

export function getPillarColor(pillar: number): string {
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
  return colors[pillar - 1] || '#6B7280';
}

export function compareText(a: unknown, b: unknown, direction: SortDirection): number {
  const result = String(a ?? '').localeCompare(String(b ?? ''), 'id-ID');
  return direction === 'asc' ? result : -result;
}

export function compareNumber(a: number, b: number, direction: SortDirection): number {
  return direction === 'asc' ? a - b : b - a;
}

export function selectClassName(extra = ''): string {
  return [
    'h-9 rounded-md border border-white/20 bg-black px-3 text-sm font-medium text-white outline-none shadow-sm',
    'hover:border-white/35 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25',
    extra,
  ].join(' ');
}
