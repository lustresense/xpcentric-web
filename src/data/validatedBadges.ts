// VALIDATED BADGES SYSTEM - PREVENT FRAUD
// Badge RT/RW dibatasi sesuai data real Surabaya

import { geographicData } from './geographicData';

export interface ValidatedBadge {
  id: string;
  name: string;
  type: 'rt' | 'rw' | 'lurah' | 'camat' | 'kader' | 'custom';
  kecamatan?: string;
  kelurahan?: string;
  rw?: string;
  rt?: string;
  maxAssignments: number;
  icon: string;
  description: string;
  requiresNIK?: boolean;
}

// Generate RT badges (assume 10-20 RT per kelurahan)
export const generateRTBadges = (): ValidatedBadge[] => {
  const badges: ValidatedBadge[] = [];
  
  geographicData.kecamatan.forEach(kec => {
    kec.kelurahan.forEach(kel => {
      // Assume setiap RW punya 10-15 RT
      for (let rw = 1; rw <= 5; rw++) { // 5 RW per kelurahan
        for (let rt = 1; rt <= 12; rt++) { // 12 RT per RW
          badges.push({
            id: `rt-${kec.kode}-${kel.kode}-${String(rw).padStart(2, '0')}-${String(rt).padStart(3, '0')}`,
            name: `Ketua RT ${String(rt).padStart(3, '0')}/RW ${String(rw).padStart(2, '0')}`,
            type: 'rt',
            kecamatan: kec.nama,
            kelurahan: kel.nama,
            rw: String(rw).padStart(2, '0'),
            rt: String(rt).padStart(3, '0'),
            maxAssignments: 1, // HANYA 1 orang bisa jadi ketua RT
            icon: '🏘️',
            description: `Ketua RT ${String(rt).padStart(3, '0')}/RW ${String(rw).padStart(2, '0')}, ${kel.nama}, ${kec.nama}`,
            requiresNIK: true
          });
        }
      }
    });
  });
  
  return badges;
};

// Generate RW badges
export const generateRWBadges = (): ValidatedBadge[] => {
  const badges: ValidatedBadge[] = [];
  
  geographicData.kecamatan.forEach(kec => {
    kec.kelurahan.forEach(kel => {
      for (let rw = 1; rw <= 5; rw++) {
        badges.push({
          id: `rw-${kec.kode}-${kel.kode}-${String(rw).padStart(2, '0')}`,
          name: `Ketua RW ${String(rw).padStart(2, '0')}`,
          type: 'rw',
          kecamatan: kec.nama,
          kelurahan: kel.nama,
          rw: String(rw).padStart(2, '0'),
          maxAssignments: 1, // HANYA 1 orang bisa jadi ketua RW
          icon: '🏛️',
          description: `Ketua RW ${String(rw).padStart(2, '0')}, ${kel.nama}, ${kec.nama}`,
          requiresNIK: true
        });
      }
    });
  });
  
  return badges;
};

// Generate Lurah badges
export const generateLurahBadges = (): ValidatedBadge[] => {
  const badges: ValidatedBadge[] = [];
  
  geographicData.kecamatan.forEach(kec => {
    kec.kelurahan.forEach(kel => {
      badges.push({
        id: `lurah-${kel.kode}`,
        name: `Lurah ${kel.nama}`,
        type: 'lurah',
        kecamatan: kec.nama,
        kelurahan: kel.nama,
        maxAssignments: 1,
        icon: '👔',
        description: `Lurah Kelurahan ${kel.nama}, Kecamatan ${kec.nama}`,
        requiresNIK: true
      });
    });
  });
  
  return badges;
};

// Generate Camat badges
export const generateCamatBadges = (): ValidatedBadge[] => {
  const badges: ValidatedBadge[] = [];
  
  geographicData.kecamatan.forEach(kec => {
    badges.push({
      id: `camat-${kec.kode}`,
      name: `Camat ${kec.nama}`,
      type: 'camat',
      kecamatan: kec.nama,
      maxAssignments: 1,
      icon: '🎖️',
      description: `Camat Kecamatan ${kec.nama}`,
      requiresNIK: true
    });
  });
  
  return badges;
};

// Kader badges (flexible, multiple per area)
export const KADER_BADGES: ValidatedBadge[] = [
  {
    id: 'kader-lingkungan',
    name: 'Kader Lingkungan',
    type: 'kader',
    maxAssignments: 999,
    icon: '🌿',
    description: 'Kader Pilar Lingkungan',
    requiresNIK: false
  },
  {
    id: 'kader-gotong-royong',
    name: 'Kader Gotong Royong',
    type: 'kader',
    maxAssignments: 999,
    icon: '🤝',
    description: 'Kader Pilar Gotong Royong',
    requiresNIK: false
  },
  {
    id: 'kader-ekonomi',
    name: 'Kader Ekonomi Kreatif',
    type: 'kader',
    maxAssignments: 999,
    icon: '💼',
    description: 'Kader Pilar Ekonomi Kreatif',
    requiresNIK: false
  },
  {
    id: 'kader-keamanan',
    name: 'Kader Keamanan',
    type: 'kader',
    maxAssignments: 999,
    icon: '🛡️',
    description: 'Kader Pilar Keamanan',
    requiresNIK: false
  }
];

// Custom achievement badges (unlimited)
export const ACHIEVEMENT_BADGES = [
  {
    id: 'pioneer',
    name: 'Pioneer',
    icon: '🚀',
    description: 'Early adopter SIMRP',
    type: 'custom' as const,
    maxAssignments: 999
  },
  {
    id: 'champion',
    name: 'Champion',
    icon: '🏆',
    description: 'Event champion',
    type: 'custom' as const,
    maxAssignments: 999
  },
  {
    id: 'mentor',
    name: 'Mentor',
    icon: '🎓',
    description: 'Mentor relawan baru',
    type: 'custom' as const,
    maxAssignments: 999
  }
];

// Get all available badges for a specific area
export const getAvailableBadgesForArea = (kecamatan: string, kelurahan: string, rw: string): ValidatedBadge[] => {
  const allBadges = [
    ...generateRTBadges(),
    ...generateRWBadges(),
    ...generateLurahBadges(),
    ...generateCamatBadges(),
    ...KADER_BADGES,
    ...ACHIEVEMENT_BADGES
  ];
  
  return allBadges.filter(badge => {
    if (badge.type === 'kader' || badge.type === 'custom') return true;
    if (badge.kecamatan && badge.kecamatan !== kecamatan) return false;
    if (badge.kelurahan && badge.kelurahan !== kelurahan) return false;
    if (badge.rw && badge.rw !== rw) return false;
    return true;
  });
};

// Check if badge can be assigned
export const canAssignBadge = (
  badgeId: string,
  currentAssignments: number
): { canAssign: boolean; reason?: string } => {
  const allBadges = [
    ...generateRTBadges(),
    ...generateRWBadges(),
    ...generateLurahBadges(),
    ...generateCamatBadges(),
    ...KADER_BADGES,
    ...ACHIEVEMENT_BADGES
  ];
  
  const badge = allBadges.find(b => b.id === badgeId);
  
  if (!badge) {
    return { canAssign: false, reason: 'Badge tidak ditemukan' };
  }
  
  if (currentAssignments >= badge.maxAssignments) {
    return { 
      canAssign: false, 
      reason: `Badge "${badge.name}" sudah mencapai batas maksimal (${badge.maxAssignments})` 
    };
  }
  
  return { canAssign: true };
};

// Get badge by ID
export const getBadgeById = (badgeId: string): ValidatedBadge | undefined => {
  const allBadges = [
    ...generateRTBadges(),
    ...generateRWBadges(),
    ...generateLurahBadges(),
    ...generateCamatBadges(),
    ...KADER_BADGES,
    ...ACHIEVEMENT_BADGES
  ];
  
  return allBadges.find(b => b.id === badgeId);
};
