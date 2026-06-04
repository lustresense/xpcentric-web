import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { LandingPage } from '@/app/components/LandingPage';
import { LoginPage } from '@/app/components/LoginPage';
import { RegisterPage } from '@/app/components/RegisterPage';
import { UserDashboard } from '@/app/components/UserDashboard';
import { AdminDashboard } from '@/app/components/AdminDashboard';
import { ModeratorDashboard } from '@/app/components/ModeratorDashboard';
import { AdminLoginPage } from '@/app/components/AdminLoginPage';
import { CollaborationPage } from '@/app/components/CollaborationPage';
import { AboutPage } from '@/app/components/AboutPage';
import { FaqPage } from '@/app/components/FaqPage';
import { Toaster } from 'sonner';
import { setOnUnauthorized, apiGet } from '@/lib/api';

type Page = 'landing' | 'login' | 'register' | 'collaboration' | 'about' | 'faq' | 'admin-login' | 'dashboard';

interface User {
  id?: string;
  username?: string;
  email?: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
  level?: number;
  levelName?: string;
  points?: number;
  badges?: any[];
  kecamatan?: string;
  kelurahan?: string;
  kodepos?: string;
  rw?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // POV Switcher State - Admin can switch views
  const [currentView, setCurrentView] = useState<'admin' | 'moderator' | 'user'>('user');
  const [moderatorTier, setModeratorTier] = useState<1 | 2 | 3>(1);

  // Seed database with sample data

  // Check for existing session on mount — validate with server
  useEffect(() => {
    const token = localStorage.getItem('simrp_auth_token');
    const savedView = localStorage.getItem('simrp_current_view') as 'admin' | 'moderator' | 'user' | null;
    const savedTier = localStorage.getItem('simrp_moderator_tier');

    if (!token) {
      setLoading(false);
      return;
    }

    // Validate token against backend instead of trusting localStorage user object
    apiGet('/auth/me', token)
      .then((data) => {
        const user = data.user;
        setAuthToken(token);
        setCurrentUser(user);

        // Sync user back to localStorage (server is truth source)
        localStorage.setItem('simrp_user', JSON.stringify(user));

        if (savedView && canAccessView(user.role, savedView)) {
          setCurrentView(savedView);
        } else {
          setCurrentView(user.role);
        }
        if (savedTier === '1' || savedTier === '2' || savedTier === '3') {
          setModeratorTier(parseInt(savedTier, 10) as 1 | 2 | 3);
        }

        setCurrentPage('dashboard');
      })
      .catch(() => {
        // Token expired or invalid — clear everything
        localStorage.removeItem('simrp_auth_token');
        localStorage.removeItem('simrp_user');
        localStorage.removeItem('simrp_current_view');
        localStorage.removeItem('simrp_moderator_tier');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        if (currentUser?.role === 'admin') {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('admin-login');
        }
        return;
      }
      if (path === '/login') {
        setCurrentPage('login');
        return;
      }
      if (path === '/register') {
        setCurrentPage('register');
        return;
      }
      if (path === '/kolaborasi' || path === '/collaboration') {
        setCurrentPage('collaboration');
        return;
      }
      if (path === '/about') {
        setCurrentPage('about');
        return;
      }
      if (path === '/faq') {
        setCurrentPage('faq');
        return;
      }
      if (path === '/app') {
        if (currentUser) {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('login');
        }
        return;
      }
      setCurrentPage('landing');
    };

    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [currentUser]);

  // Check if user can access a view
  const canAccessView = (userRole: string, view: 'admin' | 'moderator' | 'user'): boolean => {
    if (view === 'user') return true;
    if (view === 'moderator') return userRole === 'moderator' || userRole === 'admin';
    if (view === 'admin') return userRole === 'admin';
    return false;
  };

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('simrp_auth_token', token);
    localStorage.setItem('simrp_user', JSON.stringify(user));
    
    // Set initial view based on role
    const initialView = user.role;
    setCurrentView(initialView);
    localStorage.setItem('simrp_current_view', initialView);
    
    setCurrentPage('dashboard');
    window.history.pushState({}, '', '/app');
  };

  const handleLogout = useCallback(() => {
    // Attempt server-side session invalidation (fire-and-forget)
    const token = authToken || localStorage.getItem('simrp_auth_token');
    if (token) {
      fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/make-server-32aa5c5c'}/auth/logout`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}',
        },
      ).catch(() => { /* ignore network errors during logout */ });
    }
    setCurrentUser(null);
    setAuthToken(null);
    setCurrentView('user');
    localStorage.removeItem('simrp_auth_token');
    localStorage.removeItem('simrp_user');
    localStorage.removeItem('simrp_current_view');
    localStorage.removeItem('simrp_moderator_tier');
    setCurrentPage('landing');
    window.history.pushState({}, '', '/');
  }, [authToken]);

  // Wire global 401 handler so any apiRequest(…) auto-logs-out
  useEffect(() => {
    setOnUnauthorized(handleLogout);
  }, [handleLogout]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    if (page === 'admin-login') {
      window.history.pushState({}, '', '/admin');
    } else if (page === 'login') {
      window.history.pushState({}, '', '/login');
    } else if (page === 'register') {
      window.history.pushState({}, '', '/register');
    } else if (page === 'collaboration') {
      window.history.pushState({}, '', '/kolaborasi');
    } else if (page === 'about') {
      window.history.pushState({}, '', '/about');
    } else if (page === 'faq') {
      window.history.pushState({}, '', '/faq');
    } else if (page === 'landing') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleViewChange = (view: 'admin' | 'moderator' | 'user') => {
    if (currentUser && canAccessView(currentUser.role, view)) {
      setCurrentView(view);
      localStorage.setItem('simrp_current_view', view);
    }
  };

  const handleModeratorTierChange = (tier: 1 | 2 | 3) => {
    setModeratorTier(tier);
    localStorage.setItem('simrp_moderator_tier', String(tier));
  };

  const withTransition = (node: ReactNode) => (
    <div className="page-enter">{node}</div>
  );

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#FFC107] rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-black text-xl font-bold tracking-tight">SIMREKAP</div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full">
      <Toaster position="top-center" richColors />
      
      {currentPage === 'landing' && (
        withTransition(<LandingPage onNavigate={navigateTo} />)
      )}
      
      {currentPage === 'login' && (
        withTransition(<LoginPage 
          onNavigate={navigateTo} 
          onLogin={handleLogin}
        />)
      )}

      {currentPage === 'admin-login' && (
        withTransition(<AdminLoginPage
          onNavigate={navigateTo}
          onLogin={handleLogin}
        />)
      )}
      
      {currentPage === 'register' && (
        withTransition(<RegisterPage 
          onNavigate={navigateTo}
          onRegister={handleLogin}
        />)
      )}

      {currentPage === 'collaboration' && (
        withTransition(<CollaborationPage onNavigate={navigateTo} />)
      )}

      {currentPage === 'about' && (
        withTransition(<AboutPage onNavigate={navigateTo} />)
      )}

      {currentPage === 'faq' && (
        withTransition(<FaqPage onNavigate={navigateTo} />)
      )}
      
      {currentPage === 'dashboard' && currentUser && (
        <>
          {/* Render based on CURRENT VIEW, not user role */}
          {currentView === 'user' && (
            <UserDashboard 
              user={currentUser}
              authToken={authToken}
              onLogout={handleLogout}
              currentView={currentView}
              onViewChange={handleViewChange}
              moderatorTier={moderatorTier}
              onModeratorTierChange={handleModeratorTierChange}
            />
          )}
          
          {currentView === 'moderator' && (
            <ModeratorDashboard 
              user={currentUser}
              authToken={authToken}
              onLogout={handleLogout}
              onNavigate={navigateTo}
              currentView={currentView}
              onViewChange={handleViewChange}
              moderatorTier={moderatorTier}
            />
          )}
          
          {currentView === 'admin' && (
            <AdminDashboard 
              user={currentUser}
              authToken={authToken}
              onLogout={handleLogout}
              onNavigate={navigateTo}
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          )}
        </>
      )}
    </div>
  );
}
