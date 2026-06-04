export interface FloatingNavbarProps {
  user: any;
  authToken?: string | null;
  activePage: string;
  onLogout: () => void;
  onNavigate: (page: any) => void;
  userMode: 'relawan' | 'ksh';
  onModeChange: (mode: 'relawan' | 'ksh') => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
  moderatorTier: 1 | 2 | 3;
  onModeratorTierChange: (tier: 1 | 2 | 3) => void;
  theme?: 'user' | 'moderator';
  navItems?: Array<{ key: string; label: string; icon: any }>;
}
