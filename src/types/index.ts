// COMPLETE TYPE DEFINITIONS - SIMRP FINAL

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
  level: number;
  levelName: string;
  points: number;
  badges: Badge[];
  kecamatan: string;
  kelurahan: string;
  kodepos: string;
  rw: string;
  nik?: string;
  pillarPoints: PillarPoints;
  createdAt: string;
  lastActive?: string;
  // Temporary adjustments (expire after 24h)
  temporaryAdjustments?: TemporaryAdjustment[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  type: 'achievement' | 'role' | 'special' | 'temporary';
  expiresAt?: string; // For temporary badges
  grantedBy?: string; // Admin ID who granted it
}

export interface TemporaryAdjustment {
  id: string;
  type: 'points' | 'badge' | 'level';
  value: any;
  reason: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string; // Always 24 hours from grantedAt
  isExpired: boolean;
}

export interface PillarPoints {
  environment: number;
  community: number;
  economy: number;
  security: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  pillar: 'environment' | 'community' | 'economy' | 'security';
  date: string;
  time: string;
  location: string;
  kecamatan: string;
  maxParticipants: number;
  currentParticipants: number;
  participants?: string[];
  imageUrl?: string;
  points: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

export interface Report {
  id: string;
  userId: string;
  eventId?: string;
  pillar: 'environment' | 'community' | 'economy' | 'security';
  participants: number;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  photoUrl?: string;
  photoData?: string;
  outcomeTags?: string[];
  description?: string;
  isOfflineSubmission: boolean;
  status: 'pending' | 'verified' | 'rejected';
  points: number;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface RoleAssignment {
  userId: string;
  role: 'moderator';
  assignedBy: string;
  assignedAt: string;
  reason?: string;
  isActive: boolean;
}

// Validated Badges (prevent fraud)
export interface ValidatedBadge {
  id: string;
  name: string;
  type: 'rt' | 'rw' | 'lurah' | 'camat' | 'custom';
  kecamatan?: string;
  kelurahan?: string;
  rw?: string;
  rt?: string;
  maxAssignments: number; // How many users can have this badge
  currentAssignments: number;
  icon: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  action: 'add_points' | 'remove_points' | 'assign_badge' | 'remove_badge' | 'assign_role' | 'remove_role' | 'adjust_level';
  details: any;
  isTemporary: boolean;
  expiresAt?: string;
  timestamp: string;
}
