// MULTI-TIER LEVELING SYSTEM - Semua Role Punya Level Sendiri!

export interface LevelTier {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  perks: string[];
  badge?: string;
}

// USER LEVELS (7 Levels) - Relawan Biasa
export const USER_LEVELS: LevelTier[] = [
  {
    level: 1,
    name: 'Pendatang Baru',
    minPoints: 0,
    maxPoints: 50,
    perks: ['Akses dasar', 'Join event', 'Buat laporan'],
    badge: '🌱'
  },
  {
    level: 2,
    name: 'Tetangga Baik',
    minPoints: 51,
    maxPoints: 150,
    perks: ['Semua perk Level 1', 'Badge perdana', 'Prioritas moderate'],
    badge: '🏘️'
  },
  {
    level: 3,
    name: 'Warga Aktif',
    minPoints: 151,
    maxPoints: 300,
    perks: ['Semua perk Level 2', 'Bisa ajukan proposal event', 'Bonus poin 1.1x'],
    badge: '⭐'
  },
  {
    level: 4,
    name: 'Tokoh Masyarakat',
    minPoints: 301,
    maxPoints: 600,
    perks: ['Semua perk Level 3', 'Featured di leaderboard', 'Bonus poin 1.2x'],
    badge: '🎖️'
  },
  {
    level: 5,
    name: 'Pahlawan Kampung',
    minPoints: 601,
    maxPoints: 1000,
    perks: ['Semua perk Level 4', 'Priority support', 'Event eksklusif', 'Bonus 1.3x'],
    badge: '🦸'
  },
  {
    level: 6,
    name: 'Sesepuh Digital',
    minPoints: 1001,
    maxPoints: 2000,
    perks: ['Semua perk Level 5', 'Mentor untuk newbie', 'Sertifikat Perunggu'],
    badge: '👴'
  },
  {
    level: 7,
    name: 'Legend Kampung',
    minPoints: 2001,
    maxPoints: 999999,
    perks: ['ALL ACCESS', 'Sertifikat Emas dari Kadis', 'Hall of Fame', 'Bonus 1.5x'],
    badge: '🏆'
  }
];

// MODERATOR LEVELS (5 Levels) - Validator
export const MODERATOR_LEVELS: LevelTier[] = [
  {
    level: 1,
    name: 'Mod Magang',
    minPoints: 0,
    maxPoints: 100,
    perks: ['Verifikasi laporan', 'Max 20 laporan/hari'],
    badge: '🛡️'
  },
  {
    level: 2,
    name: 'Mod Junior',
    minPoints: 101,
    maxPoints: 500,
    perks: ['Semua perk Level 1', 'Max 50 laporan/hari', 'Edit event'],
    badge: '🛡️⭐'
  },
  {
    level: 3,
    name: 'Mod Senior',
    minPoints: 501,
    maxPoints: 1500,
    perks: ['Semua perk Level 2', 'Unlimited verifikasi', 'Buat event'],
    badge: '🛡️⭐⭐'
  },
  {
    level: 4,
    name: 'Mod Expert',
    minPoints: 1501,
    maxPoints: 3000,
    perks: ['Semua perk Level 3', 'Akses analytics', 'Ban/Unban user'],
    badge: '🛡️⭐⭐⭐'
  },
  {
    level: 5,
    name: 'Mod Legend',
    minPoints: 3001,
    maxPoints: 999999,
    perks: ['ALL ACCESS', 'Recommend admin', 'Sertifikat Moderator Teladan'],
    badge: '🛡️👑'
  }
];

// ADMIN LEVELS (3 Levels) - Super User
export const ADMIN_LEVELS: LevelTier[] = [
  {
    level: 1,
    name: 'Admin Junior',
    minPoints: 0,
    maxPoints: 1000,
    perks: ['Full dashboard access', 'User management', 'Event management'],
    badge: '👑'
  },
  {
    level: 2,
    name: 'Admin Senior',
    minPoints: 1001,
    maxPoints: 5000,
    perks: ['Semua perk Level 1', 'System settings', 'Data export', 'Analytics'],
    badge: '👑⭐'
  },
  {
    level: 3,
    name: 'Super Admin',
    minPoints: 5001,
    maxPoints: 999999,
    perks: ['GOD MODE', 'Semua permission', 'Manage admin', 'Audit logs'],
    badge: '👑👑'
  }
];

// Helper Functions
export const calculateUserLevel = (points: number): LevelTier => {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (points >= USER_LEVELS[i].minPoints) {
      return USER_LEVELS[i];
    }
  }
  return USER_LEVELS[0];
};

export const calculateModeratorLevel = (points: number): LevelTier => {
  for (let i = MODERATOR_LEVELS.length - 1; i >= 0; i--) {
    if (points >= MODERATOR_LEVELS[i].minPoints) {
      return MODERATOR_LEVELS[i];
    }
  }
  return MODERATOR_LEVELS[0];
};

export const calculateAdminLevel = (points: number): LevelTier => {
  for (let i = ADMIN_LEVELS.length - 1; i >= 0; i--) {
    if (points >= ADMIN_LEVELS[i].minPoints) {
      return ADMIN_LEVELS[i];
    }
  }
  return ADMIN_LEVELS[0];
};

export const getLevelByRole = (role: 'user' | 'moderator' | 'admin', points: number): LevelTier => {
  switch (role) {
    case 'admin':
      return calculateAdminLevel(points);
    case 'moderator':
      return calculateModeratorLevel(points);
    case 'user':
    default:
      return calculateUserLevel(points);
  }
};

export const getAllLevelsByRole = (role: 'user' | 'moderator' | 'admin'): LevelTier[] => {
  switch (role) {
    case 'admin':
      return ADMIN_LEVELS;
    case 'moderator':
      return MODERATOR_LEVELS;
    case 'user':
    default:
      return USER_LEVELS;
  }
};

export const getProgressToNextLevel = (role: 'user' | 'moderator' | 'admin', points: number): {
  current: LevelTier;
  next: LevelTier | null;
  progress: number;
  pointsNeeded: number;
} => {
  const currentLevel = getLevelByRole(role, points);
  const allLevels = getAllLevelsByRole(role);
  const currentIndex = allLevels.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentIndex < allLevels.length - 1 ? allLevels[currentIndex + 1] : null;
  
  if (!nextLevel) {
    return {
      current: currentLevel,
      next: null,
      progress: 100,
      pointsNeeded: 0
    };
  }
  
  const progress = ((points - currentLevel.minPoints) / (currentLevel.maxPoints - currentLevel.minPoints)) * 100;
  const pointsNeeded = nextLevel.minPoints - points;
  
  return {
    current: currentLevel,
    next: nextLevel,
    progress: Math.min(Math.max(progress, 0), 100),
    pointsNeeded: Math.max(pointsNeeded, 0)
  };
};

// Point multiplier based on level (untuk gamification)
export const getPointMultiplier = (role: 'user' | 'moderator' | 'admin', points: number): number => {
  const level = getLevelByRole(role, points);
  
  // User multipliers
  if (role === 'user') {
    if (level.level >= 7) return 1.5;
    if (level.level >= 5) return 1.3;
    if (level.level >= 4) return 1.2;
    if (level.level >= 3) return 1.1;
    return 1.0;
  }
  
  // Moderator multipliers (untuk poin mereka sendiri)
  if (role === 'moderator') {
    if (level.level >= 5) return 2.0;
    if (level.level >= 4) return 1.5;
    if (level.level >= 3) return 1.3;
    return 1.0;
  }
  
  // Admin multipliers
  if (role === 'admin') {
    if (level.level >= 3) return 3.0;
    if (level.level >= 2) return 2.0;
    return 1.5;
  }
  
  return 1.0;
};
