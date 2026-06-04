import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Award, MapPin, Calendar, TrendingUp, CheckCircle, Clock, XCircle, LogOut } from 'lucide-react';

interface UserProfileProps {
  user: any;
  reports?: any[];
  onLogout?: () => void;
  moderatorTier?: number;
}

export function UserProfile({ user, reports = [], onLogout, moderatorTier }: UserProfileProps) {

  const verifiedReports = reports.filter(r => r.status === 'verified').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const rejectedReports = reports.filter(r => r.status === 'rejected').length;

  const isMod = user?.role === 'admin' || user?.role === 'moderator';

  // Theme variables based on role
  const theme = {
    gradient: isMod ? 'from-cyan-700 to-cyan-600' : 'from-green-700 to-green-600',
    textMain: isMod ? 'text-cyan-700' : 'text-green-700',
    textSub: isMod ? 'text-cyan-100' : 'text-green-100',
    bgLight: isMod ? 'bg-cyan-50' : 'bg-green-50',
    iconColor: isMod ? 'text-cyan-600' : 'text-green-700'
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <Card className={`bg-gradient-to-r ${theme.gradient} text-white`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
            <p className={`${theme.textSub} mb-4`}>{user?.email}</p>
            
            {!isMod && (
              <div className="flex gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{user.points || 0}</div>
                  <div className="text-sm text-green-100">Total Poin</div>
                </div>
                <div className="w-px bg-white/30" />
                <div className="text-center">
                  <div className="text-3xl font-bold">{reports.length}</div>
                  <div className="text-sm text-green-100">Laporan</div>
                </div>
              </div>
            )}

            {isMod ? (
              <Badge className="bg-white text-cyan-900 text-lg px-4 py-1">
                {user?.role === 'admin' ? 'Administrator' : `Moderator Tier ${moderatorTier || user?.moderatorTier || 1}`}
              </Badge>
            ) : (
              <Badge className="bg-[#FDB913] text-black text-lg px-4 py-1">
                Poin Relawan
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-yellow-500" />
            Informasi Wilayah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Kelurahan:</span>
            <span className="font-semibold">{user?.kelurahan || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Kecamatan:</span>
            <span className="font-semibold">{user?.kecamatan || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Kode Pos:</span>
            <span className="font-semibold">{user?.kodepos || '-'}</span>
          </div>
          {user?.rw && (
            <div className="flex justify-between">
              <span className="text-gray-600">RW:</span>
              <span className="font-semibold">{user.rw}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Badge Saya {isMod ? '' : `(${user?.badges?.length || 0})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMod ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-br from-cyan-300 to-cyan-500 p-4 rounded-lg text-center text-cyan-950 shadow-sm">
                <div className="text-3xl mb-2">🛡️</div>
                <div className="font-bold text-sm">
                  {user?.role === 'admin' ? 'Akses Penuh Admin' : `Sistem Moderator Tier ${moderatorTier || user?.moderatorTier || 1}`}
                </div>
                <div className="text-xs text-cyan-900/70 mt-1">
                 {user?.tier2Badge ? `Hak Akses: ${String(user.tier2Badge).toUpperCase()}` : "Terverifikasi sebagai Tim Manajemen"}
                </div>
              </div>
            </div>
          ) : (
            (user?.isKsh || (user?.badges && user?.badges.length > 0)) ? (
              <div className="grid grid-cols-2 gap-3">
                {user?.isKsh && (
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-4 rounded-lg text-center text-black">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="font-bold text-sm">KSH Verified</div>
                    <div className="text-xs text-black/70 mt-1">Badge Kader Surabaya Hebat</div>
                  </div>
                )}
                {(user?.badges || []).map((badge: any, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-[#FDB913] to-[#F59E0B] p-4 rounded-lg text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="font-bold text-sm text-black">
                      {badge.name || badge}
                    </div>
                    {badge.awardedAt && (
                      <div className="text-xs text-black/70 mt-1">
                        {new Date(badge.awardedAt).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Belum ada badge. Ikuti lebih banyak kegiatan untuk mendapatkan badge!
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Activity Stats: Only for Normal Users */}
      {!isMod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              Statistik Aktivitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
                <div className="text-2xl font-bold text-green-700">{verifiedReports}</div>
                <div className="text-xs text-gray-600">Terverifikasi</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{pendingReports}</div>
                <div className="text-xs text-gray-600">Menunggu</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{rejectedReports}</div>
                <div className="text-xs text-gray-600">Ditolak</div>
              </div>
            </div>

            {reports.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Riwayat Laporan Terbaru</h4>
                <div className="space-y-2">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          Laporan Kegiatan
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <Badge
                        className={
                          report.status === 'verified' ? 'bg-green-600' :
                          report.status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }
                      >
                        {report.status === 'verified' ? '✓' :
                         report.status === 'rejected' ? '✗' :
                         '⏱'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member Since */}
      <Card>
        <CardContent className="text-center py-6">
          <div className="text-sm text-gray-500 mb-1">Bergabung sejak</div>
          <div className={`font-semibold ${theme.textMain}`}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) : '-'}
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      {onLogout && (
        <Button
          onClick={onLogout}
          className="w-full bg-red-100 text-red-600 hover:bg-red-200 mt-6 flex items-center justify-center gap-2 shadow-sm"
          size="lg"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-base">Keluar</span>
        </Button>
      )}
    </div>
  );
}
