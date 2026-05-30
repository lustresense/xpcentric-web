export type UserMode = 'relawan' | 'ksh';

export type UserDashboardPage =
  | 'home'
  | 'events'
  | 'my-events'
  | 'leaderboards'
  | 'certificates'
  | 'rewards'
  | 'profile';

export type ReportStatus = 'pending' | 'under_review' | 'verified' | 'rejected';

export interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  pillar?: number;
  date?: string;
  time?: string;
  location?: string;
  quota?: number;
  scopeType?: 'kelurahan' | 'kecamatan' | string;
  kecamatanId?: number | null;
  kelurahanId?: number | null;
  createdByUserId?: string;
  status: 'draft' | 'approved' | 'published' | 'completed' | string;
  kelurahan?: string | null;
  kecamatan?: string | null;
  participants?: string[];
}

export interface DashboardReport {
  id: string;
  eventId: string;
  userId: string;
  participants: number;
  outcomeTags?: string[];
  photoUrl?: string;
  status: ReportStatus | string;
  rejectReason?: string;
  points: number;
  createdAt: string;
  verifiedAt?: string;
}

export interface UserParticipation {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStatus: string;
  status: string;
  checklistDone: boolean;
  joinedAt: string;
  updatedAt: string;
  reported: boolean;
  reportId?: string;
  reportStatus?: ReportStatus | string;
}

export interface ParticipationStats {
  total: number;
  registered: number;
  attended: number;
  reported: number;
}

export interface ReportTimelineItem {
  title: string;
  description: string;
  date?: string;
  state: 'done' | 'active' | 'waiting' | 'blocked';
}

export interface KampungLeaderboardItem {
  id?: number;
  name: string;
  kecamatan?: string;
  xp: number;
}

export interface CertificateRecord {
  id: string;
  userId: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reportId: string;
  hash: string;
  issuedAt: string;
}

export interface RewardVoucher {
  id: string;
  name: string;
  description: string;
  xpCost: number;
  stock: number;
  isActive: boolean;
}

export interface AttendanceParticipant {
  id: string;
  name: string;
}

export interface SelectedReportContext {
  report: DashboardReport;
  participation?: UserParticipation;
}
