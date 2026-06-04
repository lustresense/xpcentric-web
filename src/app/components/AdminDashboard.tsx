import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import {
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  Award,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  Loader2
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { POVSwitcher } from '@/app/components/POVSwitcher';
import { AdminGodMode } from '@/app/components/AdminGodMode';
import { getLevelByRole, getProgressToNextLevel } from '@/data/levelingSystem';

interface AdminDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  onNavigate: (page: any) => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
}

export function AdminDashboard({ user, authToken, onLogout, onNavigate, currentView, onViewChange }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate admin level
  const adminLevel = getLevelByRole('admin', user?.points || 0);
  const levelProgress = getProgressToNextLevel('admin', user?.points || 0);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchEvents(),
        fetchReports()
      ]);
    } catch {
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const data = await apiGet('/users', authToken);
    setUsers(data.users || []);
  };

  const fetchEvents = async () => {
    const data = await apiGet('/events', authToken);
    setEvents(data.events || []);
  };

  const fetchReports = async () => {
    const data = await apiGet('/reports', authToken);
    setReports(data.reports || []);
  };

  const handleVerifyReport = async (reportId: string, approved: boolean) => {
    try {
      await apiPost(`/reports/${reportId}/verify`, { approved, points: approved ? 50 : 0 }, authToken);
      toast.success(approved ? 'Laporan disetujui' : 'Laporan ditolak');
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi laporan');
    }
  };

  const getPillarName = (pillar: number) => {
    const pillars = ['Lingkungan', 'Gotong Royong', 'Ekonomi Kreatif', 'Keamanan'];
    return pillars[pillar - 1] || 'Umum';
  };

  const getPillarColor = (pillar: number) => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
    return colors[pillar - 1] || '#6B7280';
  };

  // Statistics
  const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
  const pendingReports = reports.filter(r => r.status === 'pending');
  const verifiedReports = reports.filter(r => r.status === 'verified');
  const upcomingEvents = events.filter(e => e.status === 'published');

  return (
    <div className="size-full flex flex-col bg-black text-white dark">
      {/* Admin Header */}
      <header className="bg-black text-white px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                Admin Dashboard
                <Badge className="bg-white/10 text-white text-xs">
                  {adminLevel.badge} {adminLevel.name}
                </Badge>
              </h1>
              <p className="text-sm text-white/60">{user?.points || 0} poin • {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <POVSwitcher
              currentRole={user.role}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto mb-6 bg-neutral-900 border border-neutral-800 gap-1 p-1">
            <TabsTrigger value="overview" className="flex-shrink-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-sm">Overview</TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-sm">Pengguna</TabsTrigger>
            <TabsTrigger value="events" className="flex-shrink-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-sm">Event</TabsTrigger>
            <TabsTrigger value="reports" className="flex-shrink-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 text-sm">Laporan</TabsTrigger>
            <TabsTrigger value="godmode" className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700 data-[state=active]:to-pink-700 text-sm">
              <Crown className="w-4 h-4 mr-1" />
              God Mode
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#0B6E4F]" />
                <span className="ml-3 text-gray-400">Memuat data...</span>
              </div>
            ) : (
            <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-neutral-900 text-white border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Relawan</CardTitle>
                  <Users className="h-4 w-4 text-[#0B6E4F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0B6E4F]">{users.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Pengguna terdaftar</p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 text-white border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#FDB913]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#FDB913]">{totalPoints}</div>
                  <p className="text-xs text-gray-500 mt-1">Poin terdistribusi</p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 text-white border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Event Aktif</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{upcomingEvents.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Event mendatang</p>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 text-white border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Laporan Pending</CardTitle>
                  <FileText className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{pendingReports.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Menunggu verifikasi</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <Card className="bg-neutral-900 text-white border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Distribusi Aktivitas per Pilar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((pillar) => {
                    const pillarEvents = events.filter(e => e.pillar === pillar);
                    const percentage = events.length > 0 ? (pillarEvents.length / events.length) * 100 : 0;
                    
                    return (
                      <div key={pillar}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{getPillarName(pillar)}</span>
                          <span className="text-sm text-gray-500">{pillarEvents.length} event</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getPillarColor(pillar)
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card className="bg-neutral-900 text-white border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top 10 Relawan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .slice(0, 10)
                    .map((u, idx) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-black text-white dark rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-[#FDB913]' :
                            idx === 1 ? 'bg-gray-300' :
                            idx === 2 ? 'bg-orange-300' :
                            'bg-gray-200'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.levelName || 'Pendatang Baru'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#0B6E4F]">{u.points || 0}</div>
                          <div className="text-xs text-gray-500">poin</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-neutral-900 text-white border-neutral-800">
              <CardHeader>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Total {users.length} pengguna terdaftar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge className="bg-[#0B6E4F]">Level {u.level || 1}</Badge>
                          <Badge variant="outline">{u.points || 0} poin</Badge>
                          <Badge variant="outline">{u.kecamatan || 'N/A'}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="bg-neutral-900 text-white border-neutral-800">
              <CardHeader>
                <CardTitle>Manajemen Event</CardTitle>
                <CardDescription>Total {events.length} event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        </div>
                        <Badge
                          style={{ backgroundColor: getPillarColor(event.pillar) }}
                          className="text-white"
                        >
                          {getPillarName(event.pillar)}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>📅 {new Date(event.date).toLocaleDateString('id-ID')}</span>
                        <span>⭐ {event.basePoints || 10} poin</span>
                        <span>👥 {event.participants?.length || 0} peserta</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-neutral-900 text-white border-neutral-800">
              <CardHeader>
                <CardTitle>Verifikasi Laporan</CardTitle>
                <CardDescription>
                  {pendingReports.length} laporan menunggu verifikasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => {
                    const reporter = users.find(u => u.id === report.userId);
                    
                    return (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold">{reporter?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(report.createdAt).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                          <Badge
                            className={
                              report.status === 'verified' ? 'bg-green-500' :
                              report.status === 'rejected' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }
                          >
                            {report.status === 'verified' ? 'Terverifikasi' :
                             report.status === 'rejected' ? 'Ditolak' :
                             'Pending'}
                          </Badge>
                        </div>

                        {report.photoUrl && (
                          <img
                            src={report.photoUrl}
                            alt="Report"
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}

                        <div className="text-sm mb-3">
                          <p><strong>Peserta:</strong> {report.participants} orang</p>
                          {report.outcomeTags?.length > 0 && (
                            <div className="mt-2">
                              <strong>Dampak:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {report.outcomeTags.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {report.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyReport(report.id, true)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVerifyReport(report.id, false)}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* God Mode Tab */}
          <TabsContent value="godmode" className="space-y-4">
            <AdminGodMode adminUser={user} authToken={authToken} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
