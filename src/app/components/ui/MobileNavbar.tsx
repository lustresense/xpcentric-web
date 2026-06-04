import { useState, useEffect } from 'react';
import { Home, Calendar, User as UserIcon, Menu, X, LogOut, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface MobileNavbarProps {
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

const SPRING = { type: 'spring' as const, stiffness: 250, damping: 25 };
const FADE_TRANSITION = { duration: 0.1 };

export function MobileNavbar({
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
}: MobileNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
      <div className="mx-auto flex w-full max-w-md flex-col px-4 relative">
        {/* Closed Pill container */}
        <div
          className={`flex w-full items-center justify-between rounded-full border bg-white/95 px-5 py-2 shadow-lg backdrop-blur ${
            isScrolled ? 'shadow-xl' : ''
          } ${palette.border}`}
        >
          {/* Left part: Greeting */}
          <div className="flex items-center gap-2 font-bold">
            <span className={`text-sm ${isModerator ? 'text-cyan-900' : 'text-green-900'}`}>
              Halo, {user?.name?.split(' ')[0] || user?.name || ''}
            </span>
          </div>

          {/* Right part: Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition ${palette.menu}`}
          >
            {isOpen ? <X className="h-4 w-4 shrink-0" /> : <Menu className="h-4 w-4 shrink-0" />}
          </button>
        </div>

        {/* Dropdown menu overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className={`absolute left-4 right-4 top-full mt-3 overflow-hidden rounded-2xl border bg-white shadow-xl ${palette.border}`}
            >
              {/* Admin POV Controls */}
              {user?.role === 'admin' && (
                <div className="space-y-3 p-4 bg-gray-50/50 border-b border-gray-100">
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

              {/* Nav Links */}
              <div className="p-2 space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive ? palette.active : 'text-gray-700 hover:bg-gray-100/60'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
