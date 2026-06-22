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

const adminPanelCard = 'border-white/10 bg-neutral-950 text-white shadow-none';
const adminPanelHeader = 'border-b border-white/10';
const adminInput =
  'border-white/15 bg-black/60 text-white placeholder:text-white/35 focus-visible:border-emerald-400/70 focus-visible:ring-emerald-400/20';
const adminSelectContent = 'border-white/15 bg-neutral-950 text-white shadow-2xl';
const adminSelectItem = 'focus:bg-white/10 focus:text-white';

function roleCodeOf(user: any) {
  return String(user?.roleCode || user?.role || 'user').toUpperCase();
}

function roleIsModerator(user: any) {
  const role = String(user?.role || '').toLowerCase();
  const roleCode = String(user?.roleCode || '').toLowerCase();
  return role === 'moderator' || roleCode.startsWith('moderator');
}

function userCanReceiveModeratorRole(user: any) {
  const role = String(user?.role || '').toLowerCase();
  const roleCode = String(user?.roleCode || '').toLowerCase();
  return role === 'user' || roleCode === 'user' || roleCode === 'ksh';
}

function displayNameOf(user: any) {
  return user?.name || user?.email || 'Pengguna tanpa nama';
}

function roleBadgeClass(roleCode: string) {
  if (roleCode === 'KSH') {
    return 'border border-emerald-300/35 bg-emerald-400/15 text-emerald-100';
  }
  if (roleCode.startsWith('MODERATOR')) {
    return 'border border-blue-300/35 bg-blue-500/20 text-blue-100';
  }
  return 'border border-white/15 bg-white/10 text-white/75';
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
    <div className="space-y-4 text-white">
      <Card className="border-amber-300/25 bg-amber-500/10 text-amber-50 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-amber-200" />
            <div>
              <div className="mb-1 font-bold text-amber-50">Kontrol Admin - gunakan sesuai audit</div>
              <div className="text-sm text-amber-100/80">
                Semua manual adjustment bersifat temporary dan expire dalam 24 jam. Aksi role, poin, dan badge
                tercatat di audit trail untuk mencegah penyalahgunaan.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 border border-white/15 bg-neutral-900 p-1">
          <TabsTrigger
            value="roles"
            className="text-white/70 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Shield className="mr-2 h-4 w-4" />
            Role
          </TabsTrigger>
          <TabsTrigger
            value="adjustments"
            className="text-white/70 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Zap className="mr-2 h-4 w-4" />
            Penyesuaian
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-white/70 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black"
          >
            <Clock className="mr-2 h-4 w-4" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card className={adminPanelCard}>
            <CardHeader className={adminPanelHeader}>
              <CardTitle>Manajemen Role ASN</CardTitle>
              <CardDescription className="text-white/60">
                Tetapkan kewenangan moderator wilayah untuk akun ASN yang sudah terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-white/60">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-300" />
                  Memuat pengguna...
                </div>
              ) : managedUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/55">
                  Belum ada akun non-admin yang bisa dikelola.
                </div>
              ) : (
                <div className="space-y-3">
                  {managedUsers.map((user) => {
                    const roleCode = roleCodeOf(user);
                    const isModerator = roleIsModerator(user);
                    const canAssignModerator = userCanReceiveModeratorRole(user);

                    return (
                      <div
                        key={user.id}
                        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/65 p-4 transition hover:border-emerald-400/30 hover:bg-white/[0.04] md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                              isModerator
                                ? 'border-blue-300/30 bg-blue-500/15 text-blue-200'
                                : 'border-white/10 bg-white/10 text-white/60'
                            }`}
                          >
                            {isModerator ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white">{displayNameOf(user)}</div>
                            <div className="truncate text-xs text-white/55">
                              {user.email || 'Email belum tercatat'}
                            </div>
                            <div className="truncate text-xs text-white/45">
                              {user.kelurahan || '-'} - {user.kecamatan || '-'} - {Math.max(0, Number(user.points || 0))} poin
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Badge className={roleBadgeClass(roleCode)}>{roleCode}</Badge>
                          {canAssignModerator && (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-600 text-white hover:bg-blue-500"
                                onClick={() => handleAssignModeratorRole(user.id, 'lurah')}
                              >
                                <UserCheck className="mr-1 h-4 w-4" />
                                Lurah
                              </Button>
                              <Button
                                size="sm"
                                className="bg-teal-600 text-white hover:bg-teal-500"
                                onClick={() => handleAssignModeratorRole(user.id, 'camat')}
                              >
                                <UserCheck className="mr-1 h-4 w-4" />
                                Camat
                              </Button>
                            </>
                          )}
                          {isModerator && (
                            <Button
                              size="sm"
                              className="border border-red-300/25 bg-red-700 text-white hover:bg-red-600"
                              onClick={() => handleRemoveModeratorRole(user.id)}
                            >
                              <UserMinus className="mr-1 h-4 w-4" />
                              Cabut
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card className={adminPanelCard}>
            <CardHeader className={adminPanelHeader}>
              <CardTitle>Penyesuaian Sementara (24 Jam)</CardTitle>
              <CardDescription className="text-white/60">
                Tambah poin atau badge sementara untuk relawan/KSH. Semua tercatat di audit trail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">Pilih Relawan/KSH</label>
                  <Select onValueChange={(value) => setSelectedUser(adjustableUsers.find((user) => user.id === value) || null)}>
                    <SelectTrigger className={adminInput}>
                      <SelectValue placeholder="Pilih pengguna..." />
                    </SelectTrigger>
                    <SelectContent className={adminSelectContent}>
                      {adjustableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id} className={adminSelectItem}>
                          {displayNameOf(user)} - {roleCodeOf(user)} ({Math.max(0, Number(user.points || 0))} poin)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-emerald-400/25 bg-emerald-500/10 text-white shadow-none">
                      <CardHeader className="border-b border-emerald-300/15 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <TrendingUp className="h-4 w-4 text-emerald-200" />
                          Tambah Poin Sementara
                        </CardTitle>
                        <CardDescription className="text-emerald-100/65">
                          Batas demo 1-500 poin dan otomatis kedaluwarsa.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          type="number"
                          placeholder="Poin (1-500)"
                          value={pointsToAdd}
                          onChange={(event) => setPointsToAdd(event.target.value)}
                          max={500}
                          className={adminInput}
                        />
                        <Input
                          placeholder="Alasan wajib"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          className={adminInput}
                        />
                        <Button onClick={handleAddTemporaryPoints} className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Poin Sementara
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-fuchsia-300/25 bg-fuchsia-500/10 text-white shadow-none">
                      <CardHeader className="border-b border-fuchsia-300/15 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Award className="h-4 w-4 text-fuchsia-200" />
                          Tambah Badge Sementara
                        </CardTitle>
                        <CardDescription className="text-fuchsia-100/65">
                          Badge mengikuti area pengguna yang dipilih.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Select onValueChange={setSelectedBadgeId}>
                          <SelectTrigger className={adminInput}>
                            <SelectValue placeholder="Pilih badge..." />
                          </SelectTrigger>
                          <SelectContent className={adminSelectContent}>
                            {availableBadges.map((badge) => (
                              <SelectItem key={badge.id} value={badge.id} className={adminSelectItem}>
                                {badge.icon} {badge.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Alasan wajib"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          className={adminInput}
                        />
                        <Button onClick={handleAddTemporaryBadge} className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                          <Award className="mr-2 h-4 w-4" />
                          Tambah Badge Sementara
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className={adminPanelCard}>
            <CardHeader className={adminPanelHeader}>
              <CardTitle>Riwayat Penyesuaian Aktif</CardTitle>
              <CardDescription className="text-white/60">Otomatis kedaluwarsa setelah 24 jam.</CardDescription>
            </CardHeader>
            <CardContent>
              {temporaryAdjustments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] py-8 text-center text-white/55">
                  Belum ada penyesuaian aktif
                </div>
              ) : (
                <div className="space-y-3">
                  {temporaryAdjustments.map((adjustment) => {
                    const hoursLeft = Math.max(0, Math.round((new Date(adjustment.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                    return (
                      <div key={adjustment.id} className="rounded-xl border border-white/10 bg-black/65 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{adjustment.targetUserName}</div>
                            <div className="text-sm text-white/60">{adjustment.reason}</div>
                          </div>
                          <Badge className="border border-amber-300/30 bg-amber-300/15 text-xs text-amber-100">
                            <Clock className="mr-1 h-3 w-3" />
                            {hoursLeft} jam
                          </Badge>
                        </div>
                        <div className="text-xs text-white/55">
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
