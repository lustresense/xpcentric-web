import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, MapPin, Crown, Users, Home, User as UserIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { EventList } from '@/app/components/EventList';
import { ReportingWizard } from '@/app/components/ReportingWizard';
import { UserProfile } from '@/app/components/UserProfile';
import { apiGet, apiPost } from '@/lib/api';
import { FloatingNavbar } from '@/app/components/ui/FloatingNavbar';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface UserDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
  moderatorTier: 1 | 2 | 3;
  onModeratorTierChange: (tier: 1 | 2 | 3) => void;
}

export function UserDashboard({
  user,
  authToken,
  onLogout,
  currentView,
  onViewChange,
  moderatorTier,
  onModeratorTierChange
}: UserDashboardProps) {
  const [activePage, setActivePage] = useState<'home' | 'events' | 'leaderboards' | 'profile'>('home');
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [userMode, setUserMode] = useState<'relawan' | 'ksh'>(user?.isKsh ? 'ksh' : 'relawan');
  const [reports, setReports] = useState<any[]>([]);
  const [kampungLeaderboard, setKampungLeaderboard] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    setDataLoading(true);
    Promise.all([fetchEvents(), fetchReports(), fetchKampungLeaderboard()])
      .finally(() => setDataLoading(false));
  }, [userMode]);

  const fetchEvents = async () => {
    try {
      const data = await apiGet('/events', authToken);
      setEvents(data.events || []);
    } catch {
      toast.error('Gagal memuat event');
    }
  };

  const fetchReports = async () => {
    try {
      const data = await apiGet(`/reports?userId=${user?.id}`, authToken);
      setReports(data.reports || []);
    } catch {
      toast.error('Gagal memuat laporan');
    }
  };

  const fetchKampungLeaderboard = async () => {
    try {
      const data = await apiGet('/kampung', authToken);
      setKampungLeaderboard(data.kampung || []);
    } catch {
      // silent — leaderboard is non-critical
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    const outputSummary = window.prompt('Masukkan ringkasan output kegiatan');
    if (!outputSummary || !outputSummary.trim()) {
      toast.error('Ringkasan output wajib diisi.');
      return;
    }
    try {
      await apiPost(`/events/${eventId}/complete`, { outputSummary: outputSummary.trim() }, authToken);
      toast.success('Event ditandai selesai');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menandai event selesai');
    }
  };

  const kampungName = user?.kampung?.name || user?.kampungName || user?.kelurahan || 'Belum Terdata';
  const kampungXp = user?.kampung?.xp ?? 0;
  const kampungRelawan = user?.kampung?.volunteers ?? 0;
  const kampungDibantu = user?.kampungDibantu || [];
  const kampungPernahBantu = user?.kampungPernahBantu || [];
  const pendingReport = user?.hasPendingReport || reports.some((r: any) => r.status === 'pending');
  const upcomingEvents = events.filter((event) => event.status === 'published');
  const reportableEvents = events.filter(
    (event) => event.status === 'completed' && Array.isArray(event.participants) && event.participants.includes(user?.id)
  );
  const topKampung = kampungLeaderboard.slice(0, 5);

  const openReportingWizard = () => {
    if (reportableEvents.length === 0) {
      toast.info('Laporan aktif setelah kamu mengikuti event yang sudah selesai.');
      setActivePage('events');
      return;
    }
    setIsReportWizardOpen(true);
  };

  return (
    <div className="size-full flex flex-col bg-white">
      <FloatingNavbar
        user={user}
        activePage={activePage}
        onLogout={onLogout}
        onNavigate={(page) => setActivePage(page)}
        userMode={userMode}
        onModeChange={setUserMode}
        currentView={currentView}
        onViewChange={onViewChange}
        moderatorTier={moderatorTier}
        onModeratorTierChange={onModeratorTierChange}
        theme="user"
        navItems={[
          { key: 'home', label: 'Home', icon: Home },
          { key: 'events', label: 'Event', icon: Calendar },
          { key: 'leaderboards', label: 'Leaderboards', icon: Crown },
          { key: 'profile', label: 'Profil', icon: UserIcon }
        ]}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-4 pt-24 pb-8">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
            <span className="ml-3 text-gray-500">Memuat data...</span>
          </div>
        ) : (
        <>
        {/* Home Tab */}
        {activePage === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#0b5d3b] via-[#0f6a43] to-[#14824f] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,214,79,0.35) 0 20%, transparent 22%), radial-gradient(circle at 80% 30%, rgba(255,214,79,0.25) 0 16%, transparent 18%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.18) 0 18%, transparent 20%)'
              }} />
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full blur-[70px] opacity-25 -mr-16 -mt-12"></div>
              <div className="relative z-10 flex items-end justify-between gap-6">
                <div>
                  <p className="text-green-100 text-xs uppercase tracking-wide mb-1">Kampung Kamu</p>
                  <h2 className="text-2xl font-bold">{kampungName}</h2>
                  {userMode === 'ksh' && (
                    <Badge className="mt-2 bg-yellow-400 text-black w-fit">KSH Verified</Badge>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-100">
                    <MapPin className="w-4 h-4" />
                    <span>{user?.kecamatan || 'Kecamatan belum terdata'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-xs">XP Kampung</p>
                  <div className="text-3xl font-extrabold text-yellow-300">{kampungXp}</div>
                  <div className="text-xs text-green-100">Relawan: {kampungRelawan}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setActivePage('events')}
                className="h-auto aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-white border border-green-100 shadow-sm hover:shadow-md hover:bg-green-50 text-black rounded-2xl"
              >
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="font-semibold">Cari Event</span>
              </Button>
              <Button
                onClick={openReportingWizard}
                disabled={reportableEvents.length === 0}
                className="h-auto aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-white border border-yellow-100 shadow-sm hover:shadow-md hover:bg-yellow-50 text-black rounded-2xl"
              >
                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-semibold">Lapor Kegiatan</span>
                {reportableEvents.length === 0 && (
                  <span className="text-[11px] text-gray-500 font-normal">Aktif setelah event selesai</span>
                )}
              </Button>
            </div>

            <Card className="border border-green-100">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Leaderboard Kampung
                    </CardTitle>
                    <CardDescription>Peringkat berbasis performa kampung (Top 5)</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => setActivePage('leaderboards')}
                  >
                    See All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {kampungLeaderboard.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada data leaderboard.</p>
                ) : (
                  topKampung.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-green-200 flex items-center justify-center font-bold text-green-700">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.kecamatan}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-green-700">{item.xp} XP</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboards Tab */}
        {activePage === 'leaderboards' && (
          <div className="space-y-4 pt-2">
            <Card className="border border-green-100">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Leaderboards Kampung
                </CardTitle>
                <CardDescription>Peringkat lengkap performa kampung se-kota.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {kampungLeaderboard.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada data leaderboard.</p>
                ) : (
                  kampungLeaderboard.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-green-200 flex items-center justify-center font-bold text-green-700">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.kecamatan}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-green-700">{item.xp} XP</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-yellow-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                  <Users className="w-5 h-5 text-yellow-500" />
                  Kampung Pernah Dibantu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {kampungPernahBantu.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada riwayat kampung yang kamu bantu.</p>
                ) : (
                  kampungPernahBantu.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-yellow-50">
                      <div>
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.kecamatan}</div>
                      </div>
                      <Badge className="bg-yellow-400 text-black">{item.xp} XP</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-green-100">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Kampung Kamu Pernah Dibantu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {kampungDibantu.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada data kampung yang pernah membantu.</p>
                ) : (
                  kampungDibantu.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                      <div>
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.kecamatan}</div>
                      </div>
                      <Badge className="bg-green-600 text-white">{item.xp} XP</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events Tab */}
        {activePage === 'events' && (
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Daftar Kegiatan</h2>
              <Button
                onClick={openReportingWizard}
                disabled={reportableEvents.length === 0}
                className="bg-[#FFC107] text-black hover:bg-[#FFD54F] font-semibold"
              >
                Lapor Kegiatan
              </Button>
            </div>

            {pendingReport && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-3 text-sm text-yellow-800">
                  Selesaikan laporan kegiatan sebelumnya sebelum mendaftar event baru.
                </CardContent>
              </Card>
            )}

            <EventList 
              events={events}
              authToken={authToken}
              onEventJoined={fetchEvents}
              canJoin={!pendingReport}
            />

            {userMode === 'ksh' && (
              <Card className="border-green-100">
                <CardHeader>
                  <CardTitle className="text-lg">Kelola Kegiatan Area KSH</CardTitle>
                  <CardDescription>Tandai selesai untuk event yang sudah terlaksana di area kamu.</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada event terpublish di area kamu.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <div className="font-semibold text-sm">{event.title}</div>
                            <div className="text-xs text-gray-500">{event.kecamatan}{event.kelurahan ? ` / ${event.kelurahan}` : ''}</div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-700 text-white hover:bg-green-800"
                            onClick={() => handleCompleteEvent(event.id)}
                          >
                            Tandai Selesai
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activePage === 'profile' && (
          <div className="pt-2">
             <UserProfile user={user} reports={reports} onLogout={onLogout} />
          </div>
        )}
        </>
        )}
      </div>

      {/* Reporting Wizard Modal */}
        {isReportWizardOpen && (
          <ReportingWizard
            authToken={authToken}
            userId={user?.id}
            events={reportableEvents}
            onClose={() => {
              setIsReportWizardOpen(false);
              fetchEvents();
              fetchReports();
            }}
          />
        )}
    </div>
  );
}
