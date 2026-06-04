import { useState } from 'react';
import { ArrowLeft, AlertCircle, Loader2, Info, Eye, EyeOff, Users, Shield } from 'lucide-react';
import { apiPublicPost } from '@/lib/api';

interface LoginPageProps {
  onNavigate: (page: 'landing' | 'register') => void;
  onLogin: (user: any, token: string) => void;
}

// Color themes
const themes = {
  relawan: {
    primary: '#004d28',
    primaryContainer: '#066738',
    primaryFixed: '#a0f5b8',
    primaryFixedDim: '#85d89e',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#8fe3a7',
    onPrimaryFixed: '#00210e',
    onPrimaryFixedVariant: '#00522b',
    secondaryContainer: '#fdc003',
    surface: '#f4faff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#e6f6ff',
    onSurface: '#001f2a',
    onSurfaceVariant: '#3f4941',
    outline: '#6f7a70',
    outlineVariant: '#bfc9be',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
    background: '#f4faff',
    onBackground: '#001f2a',
    inverseSurface: '#163440',
    inverseOnSurface: '#e0f4ff',
    inversePrimary: '#85d89e',
  },
  moderator: {
    primary: '#006C6C',
    primaryContainer: '#0D9488',
    primaryFixed: '#99F6E4',
    primaryFixedDim: '#5EEAD4',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#B2DFDB',
    onPrimaryFixed: '#002B2B',
    onPrimaryFixedVariant: '#004D4D',
    secondaryContainer: '#06B6D4',
    surface: '#F0FDFA',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#E0F2FE',
    onSurface: '#042F2E',
    onSurfaceVariant: '#3F4941',
    outline: '#6F7A70',
    outlineVariant: '#BFC9BE',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
    background: '#F0FDFA',
    onBackground: '#042F2E',
    inverseSurface: '#0F766E',
    inverseOnSurface: '#CCFBF1',
    inversePrimary: '#5EEAD4',
  },
};

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const showDemoCredentials = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true';
  const [mode, setMode] = useState<'relawan' | 'moderator'>('relawan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const theme = themes[mode];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPublicPost('/auth/login', { email, password });

      if (data.user?.role) {
        if (mode === 'relawan' && data.user.role !== 'user') {
          throw new Error('Akun ini bukan relawan');
        }
        if (mode === 'moderator' && data.user.role !== 'moderator' && data.user.role !== 'admin') {
          throw new Error('Akun ini bukan moderator');
        }
      }

      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'relawan' ? 'moderator' : 'relawan');
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden" style={{ backgroundColor: theme.background }}>
      {/* LEFT SIDE: Branding Panel */}
      <section 
        className="hidden lg:flex lg:w-1/2 relative p-16 flex-col justify-between items-start"
        style={{ backgroundColor: theme.primaryContainer }}
      >
        {/* Minimalist Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: `${theme.onPrimary}1A` }}>
          <span 
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: theme.onPrimary }}
          >
            {mode === 'relawan' ? 'PORTAL RELAWAN' : 'PORTAL MODERATOR'}
          </span>
        </div>

        {/* Hero Text */}
        <div className="max-w-md">
          <h1 
            className="text-6xl font-black tracking-tighter leading-[0.95] mb-6"
            style={{ color: theme.onPrimary }}
          >
            {mode === 'relawan' ? (
              <>Bersama<br/>Mengawal<br/>Demokrasi</>
            ) : (
              <>Koordinasi<br/>Pengawasan<br/>Transparan</>
            )}
          </h1>
          <p 
            className="text-lg leading-relaxed font-medium"
            style={{ color: `${theme.onPrimary}CC` }}
          >
            {mode === 'relawan' 
              ? 'Platform pengawasan dan koordinasi mandiri untuk masa depan bangsa yang lebih transparan.'
              : 'Sistem manajemen dan verifikasi kegiatan relawan untuk pengawasan yang efektif.'}
          </p>
        </div>

        {/* Sub-footer Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-[2px]" style={{ backgroundColor: theme.secondaryContainer }}></div>
          <span 
            className="font-medium text-sm"
            style={{ color: `${theme.onPrimary}CC` }}
          >
            Surabaya Platform v2.4
          </span>
        </div>

        {/* Absolute Decorative Overlay */}
        <div 
          className="absolute bottom-0 right-0 w-64 h-64 rounded-tl-full blur-3xl -z-10"
          style={{ backgroundColor: `${theme.primary}33` }}
        ></div>
      </section>

      {/* RIGHT SIDE: Login Form */}
      <section 
        className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 overflow-y-auto relative"
        style={{ backgroundColor: theme.surfaceContainerLowest }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile Header */}
          <div className="lg:hidden mb-12">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: `${theme.primaryContainer}1A` }}
            >
              <span 
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: theme.primary }}
              >
                {mode === 'relawan' ? 'PORTAL RELAWAN' : 'PORTAL MODERATOR'}
              </span>
            </div>
            <h2 
              className="text-3xl font-black tracking-tight"
              style={{ color: theme.primary }}
            >
              Masuk ke Portal
            </h2>
          </div>

          {/* Desktop Header */}
          <div className="mb-10 hidden lg:block">
            <h2 
              className="text-4xl font-black tracking-tight mb-2"
              style={{ color: theme.onSurface }}
            >
              Selamat Datang
            </h2>
            <p 
              className="font-medium"
              style={{ color: theme.onSurfaceVariant }}
            >
              Masukkan kredensial Anda untuk melanjutkan.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div 
                className="p-4 rounded-xl flex items-start gap-3"
                style={{ backgroundColor: theme.errorContainer, color: theme.onErrorContainer }}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2 group">
              <label 
                className="block text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ color: theme.onSurfaceVariant }}
              >
                Email atau Username
              </label>
              <div className="relative">
                <input
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 focus:ring-0 font-medium transition-all"
                  style={{ 
                    borderColor: theme.outlineVariant,
                    color: theme.onSurface,
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.outlineVariant}
                  id="identity"
                  name="identity"
                  placeholder={mode === 'relawan' ? 'nama@email.com' : 'asn@email.com'}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label 
                  className="block text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{ color: theme.onSurfaceVariant }}
                >
                  Kata Sandi
                </label>
                <button 
                  type="button"
                  className="text-xs font-bold transition-colors tracking-tight"
                  style={{ color: theme.primary }}
                  onClick={() => {}}
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 focus:ring-0 font-medium transition-all pr-10"
                  style={{ 
                    borderColor: theme.outlineVariant,
                    color: theme.onSurface,
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.outlineVariant}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: theme.outline }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Demo Credentials */}
            {showDemoCredentials && (
              <div 
                className="p-3 rounded-lg flex items-start gap-3 border"
                style={{ 
                  backgroundColor: `${theme.primary}0D`,
                  borderColor: `${theme.primary}1A`,
                  color: theme.primary,
                }}
              >
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">
                    {mode === 'relawan' ? 'Akun Demo Relawan:' : 'Akun Demo Moderator:'}
                  </p>
                  <p>
                    Email: <code className="px-1 rounded" style={{ backgroundColor: `${theme.primary}1A` }}>
                      {mode === 'relawan' ? 'relawan.demo@simrp.app' : 'moderator1.demo@simrp.app'}
                    </code>
                  </p>
                  <p>
                    Pass: <code className="px-1 rounded" style={{ backgroundColor: `${theme.primary}1A` }}>password123</code>
                  </p>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-4">
              <button 
                type="submit"
                className="w-full font-bold py-4 px-6 rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: theme.primaryContainer,
                  color: theme.onPrimary,
                  boxShadow: `0 20px 25px -5px ${theme.primaryContainer}33`,
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Memuat...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'relawan' ? 'Masuk ke Dashboard' : 'Masuk sebagai Moderator'}</span>
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-12 text-center">
            <p 
              className="text-sm font-medium"
              style={{ color: theme.onSurfaceVariant }}
            >
              {mode === 'relawan' ? 'Belum terdaftar sebagai relawan?' : 'Butuh akses moderator?'}
              <button 
                type="button"
                onClick={() => onNavigate(mode === 'relawan' ? 'register' : 'landing')}
                className="font-bold hover:underline underline-offset-4 ml-1 transition-colors"
                style={{ color: theme.primary }}
              >
                {mode === 'relawan' ? 'Daftar Relawan Baru' : 'Hubungi Admin'}
              </button>
            </p>
          </div>

          {/* Footer Legal */}
          <div 
            className="mt-24 pt-8 border-t flex flex-col gap-2"
            style={{ borderColor: `${theme.outlineVariant}66`, borderStyle: 'dashed' }}
          >
            <div 
              className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase"
              style={{ color: theme.outline }}
            >
              <span>Data Terenskripsi</span>
              <span>v2.4.0-STABLE</span>
            </div>
            <p 
              className="text-[10px] leading-relaxed"
              style={{ color: theme.outline }}
            >
              Akses ini terbatas hanya untuk {mode === 'relawan' ? 'relawan resmi yang terverifikasi' : 'moderator dan admin resmi'}. 
              Penggunaan tidak sah akan diproses sesuai hukum yang berlaku.
            </p>
          </div>
        </div>

        {/* MODE TOGGLE - Bottom Right Corner */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleMode}
            className="flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ 
              backgroundColor: theme.surfaceContainerLowest,
              border: `2px solid ${theme.primary}`,
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.primary }}
            >
              {mode === 'relawan' ? (
                <Users className="w-5 h-5" style={{ color: theme.onPrimary }} />
              ) : (
                <Shield className="w-5 h-5" style={{ color: theme.onPrimary }} />
              )}
            </div>
            <div className="text-left">
              <p 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: theme.onSurface }}
              >
                Mode: {mode === 'relawan' ? 'Relawan' : 'Moderator'}
              </p>
              <p 
                className="text-[10px]"
                style={{ color: theme.onSurfaceVariant }}
              >
                Klik untuk beralih
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
