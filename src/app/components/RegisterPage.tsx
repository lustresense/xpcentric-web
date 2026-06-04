import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { apiPublicGet, apiPublicPost } from '@/lib/api';

interface RegisterPageProps {
  onNavigate: (page: 'landing' | 'login') => void;
  onRegister: (user: any, token: string) => void;
}

export function RegisterPage({ onNavigate, onRegister }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nik: '',
    kodepos: '',
    kecamatan: '',
    kelurahan: '',
    rw: ''
  });

  const [kodeposValid, setKodeposValid] = useState<boolean | null>(null);
  const [kelurahanOptions, setKelurahanOptions] = useState<Array<{ kelurahan: string; kecamatan: string }>>([]);
  const [kodeposHints, setKodeposHints] = useState<string[]>([]);
  const [kelurahanSearch, setKelurahanSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadKodeposHints = async () => {
      try {
        const data = await apiPublicGet<any>('/geo/options');
        const kodeposSet = new Set<string>();
        for (const kecamatan of data?.kecamatan || []) {
          for (const kelurahan of kecamatan?.kelurahan || []) {
            for (const code of kelurahan?.kodepos || []) {
              if (typeof code === 'string') {
                kodeposSet.add(code);
              }
            }
          }
        }
        setKodeposHints(Array.from(kodeposSet).sort());
      } catch {
        // Ignore hint loading error
      }
    };
    loadKodeposHints();
  }, []);

  // Auto-fill kecamatan dan kelurahan based on kodepos
  useEffect(() => {
    const loadKodepos = async () => {
      if (formData.kodepos.length !== 5) {
        setKodeposValid(null);
        setKelurahanOptions([]);
        setFormData(prev => ({
          ...prev,
          kecamatan: '',
          kelurahan: ''
        }));
        return;
      }

      try {
        const data = await apiPublicGet<any>(`/kodepos/${formData.kodepos}`);
        const list = (data?.kelurahan || []).map((k: any) => ({
          kelurahan: k.kelurahan,
          kecamatan: k.kecamatan
        }));
        setKelurahanOptions(list);
        setKelurahanSearch('');
        if (list.length === 1) {
          setFormData(prev => ({
            ...prev,
            kecamatan: list[0].kecamatan,
            kelurahan: list[0].kelurahan
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            kecamatan: '',
            kelurahan: ''
          }));
        }
        setKodeposValid(list.length > 0);
      } catch (err) {
        setKodeposValid(false);
        setKelurahanOptions([]);
        setFormData(prev => ({ ...prev, kecamatan: '', kelurahan: '' }));
      }
    };

    loadKodepos();
  }, [formData.kodepos]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nama lengkap wajib diisi');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Email tidak valid');
      return false;
    }
    if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      setError('Password minimal 8 karakter, harus mengandung huruf dan angka');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }
    if (formData.kodepos.length !== 5) {
      setError('Kode pos harus 5 digit');
      return false;
    }
    if (!kodeposValid) {
      setError('Kode pos tidak valid untuk wilayah Surabaya');
      return false;
    }
    if (!formData.kecamatan || !formData.kelurahan) {
      setError('Pilih kelurahan sesuai kode pos');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await apiPublicPost<any>('/auth/signup', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        nik: formData.nik,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        kodepos: formData.kodepos,
        rw: formData.rw
      });

      if (data.success) {
        setSuccess('Pendaftaran berhasil! Mengalihkan...');
        
        // Auto-login after successful registration using real session token.
        setTimeout(() => {
          onRegister(data.user, data.token);
        }, 1500);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const filteredKelurahanOptions = kelurahanOptions.filter((item) => {
    const q = kelurahanSearch.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return (
      item.kelurahan.toLowerCase().includes(q) ||
      item.kecamatan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#FFC107] selection:text-black flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#FFC107] rounded-lg flex items-center justify-center font-bold text-xl">
              SR
            </div>
          </div>
        </div>
      </header>

      {/* Registration Form */}
      <div className="container mx-auto px-4 py-8 flex items-center justify-center flex-1">
        <Card className="w-full max-w-2xl border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold mb-2">
              Daftar Relawan
            </CardTitle>
            <CardDescription>
              Bergabung dengan Kampung Pancasila Surabaya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Ahmad Suryadi"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    disabled={loading}
                    className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nik" className="font-semibold">NIK (Opsional)</Label>
                  <Input
                    id="nik"
                    placeholder="16 digit NIK"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 8 karakter (huruf & angka)"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    disabled={loading}
                    className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    disabled={loading}
                    className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">!</span>
                  Informasi Wilayah
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kodepos" className="font-semibold">
                      Kode Pos <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="kodepos"
                        placeholder="60xxx"
                        maxLength={5}
                        list="kodepos-surabaya-list"
                        value={formData.kodepos}
                        onChange={(e) => handleChange('kodepos', e.target.value.replace(/\D/g, ''))}
                        required
                        disabled={loading}
                        className={`rounded-xl pr-10 ${
                          kodeposValid === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500' :
                          kodeposValid === false ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                          'border-gray-300 focus:border-black focus:ring-black'
                        }`}
                      />
                      {kodeposValid === true && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                      {kodeposValid === false && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {kodeposValid === false && (
                      <p className="text-xs text-red-500 font-medium">Kode pos tidak valid untuk Surabaya</p>
                    )}
                    <datalist id="kodepos-surabaya-list">
                      {kodeposHints.map((code) => (
                        <option key={code} value={code} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rw" className="font-semibold">RW (Opsional)</Label>
                    <Input
                      id="rw"
                      placeholder="Contoh: 001"
                      maxLength={3}
                      value={formData.rw}
                      onChange={(e) => handleChange('rw', e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="kecamatan" className="text-gray-500">
                      Kecamatan
                    </Label>
                    <Input
                      id="kecamatan"
                      placeholder="-"
                      value={formData.kecamatan}
                      disabled
                      className="bg-gray-50 border-gray-200 font-medium text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kelurahan" className="text-gray-500">
                      Kelurahan
                    </Label>
                    {kelurahanOptions.length > 1 ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Cari kelurahan..."
                          value={kelurahanSearch}
                          onChange={(e) => setKelurahanSearch(e.target.value)}
                          disabled={loading}
                          className="border-gray-300 focus:border-black focus:ring-black rounded-xl"
                        />
                        <Select
                          value={formData.kelurahan}
                          onValueChange={(value) => {
                            const selected = kelurahanOptions.find((k) => k.kelurahan === value);
                            setFormData((prev) => ({
                              ...prev,
                              kelurahan: value,
                              kecamatan: selected?.kecamatan || ''
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-white border-gray-300 rounded-xl">
                            <SelectValue placeholder="Pilih kelurahan" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredKelurahanOptions.map((k) => (
                              <SelectItem key={`${k.kelurahan}-${k.kecamatan}`} value={k.kelurahan}>
                                {k.kelurahan} - {k.kecamatan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <Input
                        id="kelurahan"
                        placeholder="-"
                        value={formData.kelurahan}
                        disabled
                        className="bg-gray-50 border-gray-200 font-medium text-black"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#FFC107] text-black hover:bg-[#FFD54F] text-lg font-bold h-14 rounded-xl shadow-sm mt-6"
                disabled={loading || !kodeposValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </Button>

              <div className="text-center text-sm">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-black font-bold hover:underline"
                >
                  Masuk di sini
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

