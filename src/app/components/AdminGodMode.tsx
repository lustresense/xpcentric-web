import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Clock,
  Loader2,
  Plus,
  Shield,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { apiGet, apiPost } from '@/lib/api';
import { getAvailableBadgesForArea } from '@/data/validatedBadges';

interface AdminGodModeProps {
  adminUser: any;
  authToken: string | null;
}

interface TemporaryAdjustment {
  id: string;
  type: 'points' | 'badge';
  value: any;
  reason: string;
  grantedAt: string;
  expiresAt: string;
  targetUserName: string;
}

export function AdminGodMode({ adminUser, authToken }: AdminGodModeProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [temporaryAdjustments, setTemporaryAdjustments] = useState<TemporaryAdjustment[]>([]);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [reason, setReason] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');

  const managedUsers = useMemo(
    () => users.filter((user) => user.roleCode !== 'admin' && user.role !== 'admin'),
    [users],
  );
  const adjustableUsers = useMemo(
    () => users.filter((user) => user.roleCode === 'user' || user.roleCode === 'ksh' || user.role === 'user'),
    [users],
  );
  const availableBadges = selectedUser
    ? getAvailableBadgesForArea(selectedUser.kecamatan, selectedUser.kelurahan, selectedUser.rw)
    : [];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>('/users', authToken);
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemporaryAdjustments = async () => {
    try {
      const data = await apiGet<any>('/admin/temporary-adjustments', authToken);
      setTemporaryAdjustments(data.adjustments || []);
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTemporaryAdjustments();
  }, []);

  const handleAssignModeratorRole = async (userId: string, tier2Badge: 'lurah' | 'camat') => {
    const label = tier2Badge === 'lurah' ? 'Lurah' : 'Camat';
    if (!confirm(`Jadikan pengguna ini sebagai moderator ${label}? Akses ini memberi kewenangan verifikasi sesuai wilayah.`)) {
      return;
    }
    try {
      await apiPost('/admin/assign-role', { userId, role: 'moderator', tier2Badge, reason: 'Assigned by admin' }, authToken);
      toast.success(`Role moderator ${label} diterapkan`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah role');
    }
  };

  const handleRemoveModeratorRole = async (userId: string) => {
    if (!confirm('Cabut role moderator? Pengguna akan kehilangan kewenangan verifikasi.')) {
      return;
    }
    try {
      await apiPost('/admin/remove-role', { userId, role: 'moderator' }, authToken);
      toast.success('Role moderator dicabut');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencabut role');
    }
  };

  const handleAddTemporaryPoints = async () => {
    if (!selectedUser || !pointsToAdd || !reason.trim()) {
      toast.error('Lengkapi pengguna, poin, dan alasan');
      return;
    }
    const points = Number.parseInt(pointsToAdd, 10);
    if (Number.isNaN(points) || points <= 0 || points > 500) {
      toast.error('Poin harus 1-500');
      return;
    }
    try {
      await apiPost('/admin/add-temporary-points', { userId: selectedUser.id, points, reason }, authToken);
      toast.success(`+${points} poin ditambahkan sementara`);
      setPointsToAdd('');
      setReason('');
      fetchUsers();
      fetchTemporaryAdjustments();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah poin');
    }
  };

  const handleAddTemporaryBadge = async () => {
    if (!selectedUser || !selectedBadgeId || !reason.trim()) {
      toast.error('Pilih badge dan tulis alasan');
      return;
    }
    try {
      await apiPost('/admin/add-temporary-badge', { userId: selectedUser.id, badgeId: selectedBadgeId, reason }, authToken);
      toast.success('Badge sementara ditambahkan');
      setSelectedBadgeId('');
      setReason('');
      fetchUsers();
      fetchTemporaryAdjustments();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah badge');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-amber-500 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-amber-700" />
            <div>
              <div className="mb-1 font-bold text-amber-950">Kontrol Admin - gunakan sesuai audit</div>
              <div className="text-sm text-amber-900">
                Semua manual adjustment bersifat temporary dan expire dalam 24 jam. Aksi role, poin, dan badge
                tercatat di audit trail untuk mencegah penyalahgunaan.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            Role
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            <Zap className="mr-2 h-4 w-4" />
            Penyesuaian
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Role ASN</CardTitle>
              <CardDescription>
                Tetapkan kewenangan moderator wilayah untuk akun ASN yang sudah terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memuat pengguna...
                </div>
              ) : (
                <div className="space-y-3">
                  {managedUsers.map((user) => (
                    <div key={user.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          user.role === 'moderator' ? 'bg-blue-100' : 'bg-gray-200'
                        }`}>
                          {user.role === 'moderator' ? (
                            <Shield className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Users className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.kelurahan || '-'} - {user.kecamatan || '-'} - {user.points || 0} poin
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={user.role === 'moderator' ? 'bg-blue-600' : 'bg-gray-500'}>
                          {String(user.roleCode || user.role).toUpperCase()}
                        </Badge>
                        {user.role === 'user' && (
                          <>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAssignModeratorRole(user.id, 'lurah')}>
                              <UserCheck className="mr-1 h-4 w-4" />
                              Lurah
                            </Button>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => handleAssignModeratorRole(user.id, 'camat')}>
                              <UserCheck className="mr-1 h-4 w-4" />
                              Camat
                            </Button>
                          </>
                        )}
                        {user.role === 'moderator' && (
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveModeratorRole(user.id)}>
                            <UserMinus className="mr-1 h-4 w-4" />
                            Cabut
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle>Penyesuaian Sementara (24 Jam)</CardTitle>
              <CardDescription>
                Tambah poin atau badge sementara untuk relawan/KSH. Semua tercatat di audit trail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Pilih Relawan/KSH</label>
                  <Select onValueChange={(value) => setSelectedUser(adjustableUsers.find((user) => user.id === value) || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pengguna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {adjustableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.roleCode || user.role} ({user.points} poin)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <>
                    <Card className="border-2 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <TrendingUp className="h-4 w-4" />
                          Tambah Poin Sementara
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input type="number" placeholder="Poin (1-500)" value={pointsToAdd} onChange={(event) => setPointsToAdd(event.target.value)} max={500} />
                        <Input placeholder="Alasan wajib" value={reason} onChange={(event) => setReason(event.target.value)} />
                        <Button onClick={handleAddTemporaryPoints} className="w-full bg-green-600 hover:bg-green-700">
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Poin Sementara
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Award className="h-4 w-4" />
                          Tambah Badge Sementara
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Select onValueChange={setSelectedBadgeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih badge..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBadges.map((badge) => (
                              <SelectItem key={badge.id} value={badge.id}>
                                {badge.icon} {badge.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input placeholder="Alasan wajib" value={reason} onChange={(event) => setReason(event.target.value)} />
                        <Button onClick={handleAddTemporaryBadge} className="w-full bg-purple-600 hover:bg-purple-700">
                          <Award className="mr-2 h-4 w-4" />
                          Tambah Badge Sementara
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penyesuaian Aktif</CardTitle>
              <CardDescription>Otomatis kedaluwarsa setelah 24 jam.</CardDescription>
            </CardHeader>
            <CardContent>
              {temporaryAdjustments.length === 0 ? (
                <div className="py-8 text-center text-gray-500">Belum ada penyesuaian aktif</div>
              ) : (
                <div className="space-y-3">
                  {temporaryAdjustments.map((adjustment) => {
                    const hoursLeft = Math.max(0, Math.round((new Date(adjustment.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                    return (
                      <div key={adjustment.id} className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{adjustment.targetUserName}</div>
                            <div className="text-sm text-gray-600">{adjustment.reason}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            {hoursLeft} jam
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {adjustment.type === 'points' && `+${adjustment.value} poin`}
                          {adjustment.type === 'badge' && `Badge: ${adjustment.value}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
