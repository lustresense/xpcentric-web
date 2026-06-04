import { useState, useEffect } from 'react';
import { Home, Calendar, User as UserIcon, Menu, X, LogOut, BadgeCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface DesktopNavbarProps {
  user: any;
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

export function DesktopNavbar({
  user,
  activePage,
  onLogout,
  onNavigate,
  userMode,
  onModeChange,
  currentView,
  onViewChange,
  moderatorTier,
  onModeratorTierChange,
  theme = 'user',
  navItems,
}: DesktopNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isModerator = theme === 'moderator';

  const palette = isModerator
    ? {
        border: 'border-cyan-200',
        active: 'bg-cyan-600 text-white',
        inactive: 'text-cyan-900 hover:bg-cyan-50',
        menu: 'bg-cyan-700 hover:bg-cyan-800',
        ksh: 'bg-cyan-200 text-cyan-900',
      }
    : {
        border: 'border-green-200',
        active: 'bg-green-600 text-white',
        inactive: 'text-green-800 hover:bg-green-50',
        menu: 'bg-green-700 hover:bg-green-800',
        ksh: 'bg-yellow-400 text-black',
      };

  const items = navItems || [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'events', label: 'Event', icon: Calendar },
    { key: 'profile', label: 'Profil', icon: UserIcon },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-3 left-0 right-0 z-50">
      <div className="mx-auto flex w-max justify-center items-center px-4">
        {/* Pill Nav */}
        <div
          className={`flex items-center gap-2 rounded-full border bg-white/95 p-1.5 pr-2 shadow-lg backdrop-blur ${
            isScrolled ? 'shadow-xl' : ''
          } ${palette.border}`}
        >
          <div className="flex items-center gap-1 pl-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? palette.active : palette.inactive
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Menu Button + Dropdown */}
          <div className="relative flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition ${palette.menu}`}
            >
              {isMenuOpen ? <X className="h-4 w-4 shrink-0" /> : <Menu className="h-4 w-4 shrink-0" />}
            </button>

            {/* Dropdown */}
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-full mt-3 w-72 origin-top-right rounded-2xl border bg-white shadow-xl ${palette.border}`}
              >
              {/* User Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white ${
                    isModerator ? 'bg-cyan-700' : 'bg-green-700'
                  }`}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{user?.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>{user?.role}</span>
                    {userMode === 'ksh' && (
                      <Badge className={`${palette.ksh} shrink-0 px-1.5 py-0 text-[9px]`}>
                        <BadgeCheck className="mr-0.5 h-2.5 w-2.5" />
                        KSH
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin POV */}
              {user?.role === 'admin' && (
                <div className="space-y-3 border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase text-gray-400">Kategori</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        variant={currentView === 'user' && userMode === 'relawan' ? 'default' : 'outline'}
                        onClick={() => {
                          onModeChange('relawan');
                          onViewChange('user');
                        }}
                        className={`h-7 text-xs ${
                          currentView === 'user' && userMode === 'relawan'
                            ? isModerator
                              ? 'bg-cyan-600 text-white'
                              : 'bg-green-600 text-white'
                            : ''
                        }`}
                      >
                        Relawan
                      </Button>
                      <Button
                        size="sm"
                        variant={currentView === 'user' && userMode === 'ksh' ? 'default' : 'outline'}
                        onClick={() => {
                          onModeChange('ksh');
                          onViewChange('user');
                        }}
                        className={`h-7 text-xs ${
                          currentView === 'user' && userMode === 'ksh'
                            ? isModerator
                              ? 'bg-cyan-200 text-cyan-900'
                              : 'bg-yellow-400 text-black'
                            : ''
                        }`}
                      >
                        KSH
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase text-gray-400">Mod Tier</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([1, 2, 3] as const).map((tier) => (
                        <Button
                          key={tier}
                          size="sm"
                          variant={currentView === 'moderator' && moderatorTier === tier ? 'default' : 'outline'}
                          onClick={() => {
                            onModeratorTierChange(tier);
                            onViewChange('moderator');
                          }}
                          className={`h-7 text-xs ${
                            currentView === 'moderator' && moderatorTier === tier ? 'bg-cyan-600 text-white' : ''
                          }`}
                        >
                          Tier {tier}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase text-gray-400">View</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        variant={currentView === 'user' ? 'default' : 'outline'}
                        onClick={() => onViewChange('user')}
                        className={`h-7 text-xs ${
                          currentView === 'user'
                            ? isModerator
                              ? 'bg-cyan-700 text-white'
                              : 'bg-green-700 text-white'
                            : ''
                        }`}
                      >
                        User
                      </Button>
                      <Button
                        size="sm"
                        variant={currentView === 'admin' ? 'default' : 'outline'}
                        onClick={() => onViewChange('admin')}
                        className={`h-7 text-xs ${currentView === 'admin' ? 'bg-black text-white' : ''}`}
                      >
                        Admin
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="space-y-0.5 p-2">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="h-4 w-4 shrink-0" />
                  Profil Saya
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Keluar
                </button>
              </div>
            </motion.div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
