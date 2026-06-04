import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ArrowLeft, AlertCircle, Loader2, Info } from 'lucide-react';
import { apiPublicPost } from '@/lib/api';

interface AdminLoginPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'admin-login') => void;
  onLogin: (user: any, token: string) => void;
}

export function AdminLoginPage({ onNavigate, onLogin }: AdminLoginPageProps) {
  const showDemoCredentials = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true';
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPublicPost('/auth/admin-login', {
        username: adminUsername,
        password: adminPassword,
      });

      if (data.success && data.token) {
        onLogin(data.user, data.token);
      } else {
        setError('Login admin gagal. Periksa username dan password.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <header className="bg-black border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-bold text-xl">
              SR
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Admin Portal</h2>
            <p className="text-white/70">Akses khusus administrator</p>
          </div>

          <Card className="border-white/10 bg-neutral-950 text-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Masuk Admin</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleAdminLogin} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 text-red-200 border-red-500/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {showDemoCredentials && (
                  <Alert className="bg-white/5 border-white/10 text-white">
                    <Info className="h-4 w-4 text-white" />
                    <AlertDescription className="text-sm">
                      <strong>Akses Admin (Demo):</strong><br/>
                      Username: <code>admin</code><br/>
                      Password: <code>admin</code>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-white/20 bg-black text-white focus:border-white focus:ring-white rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-white/20 bg-black text-white focus:border-white focus:ring-white rounded-xl"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#FFC107] text-black hover:bg-[#FFD54F] h-12 rounded-xl text-lg font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    'Masuk sebagai Admin'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
