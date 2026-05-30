// SIMRP frontend types aligned with the active Python/SQLite backend payloads.

export type UserRole = 'user' | 'moderator' | 'admin';
export type RoleCode = 'user' | 'ksh' | 'moderator_t1' | 'moderator_t2' | 'moderator_t3' | 'admin';
export type ModeratorTier = 1 | 2 | 3;
export type Tier2Badge = 'lurah' | 'camat';

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type?: 'achievement' | 'role' | 'special' | 'temporary' | string;
  earnedAt?: string;
  expiresAt?: string;
  grantedBy?: string;
}

export interface KampungSummary {
  id: number;
  name: string;
  kecamatan: string;
  xp: number;
  volunteers: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleCode: RoleCode;
  isKsh: boolean;
  moderatorTier?: ModeratorTier | null;
  tier2Badge?: Tier2Badge | string | null;
  kelurahan?: string | null;
  kecamatan?: string | null;
  kampungId?: number | null;
  kampung?: KampungSummary | null;
  points: number;
  badges: Badge[];
  hasPendingReport?: boolean;
  developerNote?: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleCode: RoleCode;
  isKsh: boolean;
  moderatorTier?: ModeratorTier | null;
  tier2Badge?: Tier2Badge | string | null;
  kecamatan?: string | null;
  kelurahan?: string | null;
  kampungId?: number | null;
  points: number;
}

export type EventStatus = 'draft' | 'approved' | 'published' | 'completed';
export type ScopeType = 'kelurahan' | 'kecamatan';
export type PillarId = 1 | 2 | 3 | 4;

export interface Event {
  id: string;
  title: string;
  description: string;
  pillar: PillarId;
  date: string;
  time: string;
  location: string;
  quota: number;
  scopeType: ScopeType;
  kecamatanId?: number | null;
  kelurahanId?: number | null;
  createdByUserId?: string;
  status: EventStatus | string;
  kelurahan?: string | null;
  kecamatan?: string | null;
  participants: string[];
}

export type ParticipationStatus = 'registered' | 'attended' | 'reported';
export type ReportStatus = 'pending' | 'under_review' | 'verified' | 'rejected';

export interface UserParticipation {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStatus: EventStatus | string;
  status: ParticipationStatus | string;
  checklistDone: boolean;
  joinedAt: string;
  updatedAt: string;
  reported: boolean;
  reportId?: string | null;
  reportStatus?: ReportStatus | string | null;
}

export interface Report {
  id: string;
  eventId: string;
  userId: string;
  participants: number;
  outcomeTags: string[];
  photoUrl?: string;
  status: ReportStatus | string;
  rejectReason?: string;
  points: number;
  createdAt: string;
  verifiedAt?: string;
}

export interface Certificate {
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

export interface CertificateVerifyResponse {
  valid: boolean;
  certificate?: Pick<Certificate, 'id' | 'userName' | 'eventTitle' | 'eventDate' | 'hash' | 'issuedAt'>;
  error?: string;
}

export interface RewardVoucher {
  id: string;
  name: string;
  description: string;
  xpCost: number;
  stock: number;
  isActive: boolean;
}

export interface VoucherRedemption {
  id: string;
  voucherId: string;
  voucherName: string;
  voucherCode: string;
  xpSpent: number;
  expiresAt: string;
  remainingPoints: number;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface GeoKelurahan {
  id: number;
  name: string;
  kodepos: string[];
}

export interface GeoKecamatan {
  id: number;
  name: string;
  kelurahan: GeoKelurahan[];
}

export interface KampungLeaderboardItem {
  id: number;
  name: string;
  kecamatan: string;
  xp: number;
}

export interface PillarXp {
  lingkungan: number;
  ekonomi: number;
  kemasyarakatan: number;
  sosialBudaya: number;
}

export interface CollaborationRequest {
  id: string;
  organizationName: string;
  picName: string;
  email: string;
  supportType: 'dana' | 'konsumsi' | 'peralatan' | 'media_partner' | 'lainnya' | string;
  supportDescription: string;
  scopeType: ScopeType | string;
  kecamatan?: string | null;
  kelurahan?: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  reviewedByUserId?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface TemporaryAdjustment {
  id: string;
  userId: string;
  userName?: string;
  type: 'points' | 'badge' | 'level' | string;
  value: unknown;
  reason: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string;
  isExpired?: boolean;
}

export interface ApiSuccess {
  success: true;
}

export interface AuthResponse extends ApiSuccess {
  token: string;
  user: User;
}

export interface UsersResponse {
  users: DirectoryUser[];
}

export interface EventsResponse {
  events: Event[];
}

export interface ReportsResponse {
  reports: Report[];
}

export interface ParticipationsResponse {
  participations: UserParticipation[];
}

export interface CertificatesResponse {
  certificates: Certificate[];
}

export interface RewardCatalogResponse {
  catalog: RewardVoucher[];
}

export interface RewardRedeemResponse extends ApiSuccess {
  redemption: VoucherRedemption;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
}

export interface NotificationCountResponse {
  unread: number;
}

export interface GeoOptionsResponse {
  kecamatan: GeoKecamatan[];
}

export interface KampungResponse {
  kampung: KampungLeaderboardItem[];
}

export interface PillarsResponse {
  pillars: PillarXp;
}
