import { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  MapPin,
  Crown,
  Users,
  Home,
  User as UserIcon,
  Gift,
  FileCheck2,
  Download,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Circle,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { EventList } from '@/app/components/EventList';
import { ReportingWizard } from '@/app/components/ReportingWizard';
import { UserProfile } from '@/app/components/UserProfile';
import { RankCard } from '@/app/components/RankCard';
import { apiDownload, apiGet, apiPost } from '@/lib/api';
import { FloatingNavbar } from '@/app/components/ui/FloatingNavbar';
import { toast } from 'sonner';
import { PillarRadarChart } from '@/app/components/PillarRadarChart';

interface UserDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
  moderatorTier: 1 | 2 | 3;
  onModeratorTierChange: (tier: 1 | 2 | 3) => void;
}

type UserDashboardPage =
  | 'home'
  | 'events'
  | 'my-events'
  | 'leaderboards'
  | 'certificates'
  | 'rewards'
  | 'profile';

interface UserParticipation {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStatus: string;
  status: string;
  checklistDone: boolean;
  joinedAt: string;
  updatedAt: string;
  reported: boolean;
  reportId?: string;
  reportStatus?: string;
}

interface ReportTimelineItem {
  title: string;
  description: string;
  date?: string;
  state: 'done' | 'active' | 'waiting' | 'blocked';
}

export function UserDashboard({
  user,
  authToken,
  onLogout,
  currentView,
  onViewChange,
  moderatorTier,
  onModeratorTierChange,
}: UserDashboardProps) {
  const [activePage, setActivePage] = useState<UserDashboardPage>('home');
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [userMode, setUserMode] = useState<'relawan' | 'ksh'>(user?.isKsh ? 'ksh' : 'relawan');
  const [reports, setReports] = useState<any[]>([]);
  const [participations, setParticipations] = useState<UserParticipation[]>([]);
  const [selectedReportContext, setSelectedReportContext] = useState<{
    report: any;
    participation?: UserParticipation;
  } | null>(null);
  const [kampungLeaderboard, setKampungLeaderboard] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<string | null>(null);
  const [rewardCatalog, setRewardCatalog] = useState<any[]>([]);
  const [currentPoints, setCurrentPoints] = useState<number>(Math.max(0, Number(user?.points || 0)));
  const [userDirectory, setUserDirectory] = useState<Record<string, string>>({});
  const [attendanceEvent, setAttendanceEvent] = useState<any | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState('');
  const [attendanceSelectedUserIds, setAttendanceSelectedUserIds] = useState<string[]>([]);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      fetchEvents(),
      fetchReports(),
      fetchParticipations(),
      fetchKampungLeaderboard(),
      fetchCertificates(),
      fetchRewardCatalog(),
      fetchUserDirectory(),
    ]).finally(() => setDataLoading(false));
  }, [userMode, authToken, user?.id]);

  useEffect(() => {
    setCurrentPoints(Math.max(0, Number(user?.points || 0)));
  }, [user?.points]);

  const safeCurrentPoints = Math.max(0, Number(currentPoints) || 0);

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

  const fetchParticipations = async () => {
    try {
      const data = await apiGet('/users/me/participations', authToken);
      setParticipations(data.participations || []);
    } catch {
      toast.error('Gagal memuat riwayat event');
    }
  };

  const fetchKampungLeaderboard = async () => {
    try {
      const data = await apiGet('/kampung', authToken);
      setKampungLeaderboard(data.kampung || []);
    } catch {
      // silent: non-critical
    }
  };

  const fetchCertificates = async () => {
    try {
      const data = await apiGet('/certificates', authToken);
      setCertificates(data.certificates || []);
    } catch {
      // silent: non-critical
    }
  };

  const fetchRewardCatalog = async () => {
    try {
      const data = await apiGet('/rewards/catalog', authToken);
      setRewardCatalog(data.catalog || []);
    } catch {
      // silent: non-critical
    }
  };

  const fetchUserDirectory = async () => {
    if (userMode !== 'ksh') {
      setUserDirectory({});
      return;
    }
    try {
      const data = await apiGet('/users?role=user', authToken);
      const next: Record<string, string> = {};
      (data.users || []).forEach((item: any) => {
        next[item.id] = item.name;
      });
      setUserDirectory(next);
    } catch {
      // silent: non-critical
    }
  };

  const openAttendanceModal = (event: any) => {
    setAttendanceEvent(event);
    setAttendanceSummary('');
    setAttendanceSelectedUserIds(Array.isArray(event.participants) ? [...event.participants] : []);
  };

  const closeAttendanceModal = () => {
    setAttendanceEvent(null);
    setAttendanceSummary('');
    setAttendanceSelectedUserIds([]);
    setAttendanceSubmitting(false);
  };

  const toggleAttendanceUser = (userId: string) => {
    setAttendanceSelectedUserIds((prev) => (
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    ));
  };

  const handleSubmitAttendanceAndComplete = async () => {
    if (!attendanceEvent) {
      return;
    }
    if (!attendanceSummary.trim()) {
      toast.error('Ringkasan output wajib diisi.');
      return;
    }
    setAttendanceSubmitting(true);
    try {
      await apiPost(`/events/${attendanceEvent.id}/attendance`, { userIds: attendanceSelectedUserIds }, authToken);
      await apiPost(`/events/${attendanceEvent.id}/complete`, { outputSummary: attendanceSummary.trim() }, authToken);
      toast.success('Event ditandai selesai');
      closeAttendanceModal();
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menandai event selesai');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleRedeemVoucher = async (voucher: any) => {
    const xpCost = Math.max(0, Number(voucher.xpCost || 0));
    if (safeCurrentPoints < xpCost) {
      toast.error('XP kamu belum cukup untuk menukar voucher ini');
      return;
    }
    const confirmed = window.confirm(
      `Tukar ${voucher.name} seharga ${xpCost} XP untuk voucher transportasi GoBis/Suroboyo Bus?`,
    );
    if (!confirmed) {
      return;
    }
    try {
      const data = await apiPost('/rewards/redeem', { voucherId: voucher.id }, authToken);
      const code = data?.redemption?.voucherCode || '-';
      const remainingPoints = Math.max(0, Number(data?.redemption?.remainingPoints ?? safeCurrentPoints));
      setCurrentPoints(remainingPoints);
      toast.success(`Voucher GoBis berhasil ditukar. Kode: ${code}`);
      fetchRewardCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menukar voucher');
    }
  };

  const handleDownloadCertificate = async (cert: any) => {
    if (!cert?.id) {
      toast.error('Sertifikat tidak valid');
      return;
    }
    setDownloadingCertificateId(cert.id);
    try {
      const { blob, filename } = await apiDownload(`/certificates/${cert.id}/download`, authToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `sertifikat-simrp-${cert.id}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sertifikat berhasil diunduh');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh sertifikat');
    } finally {
      setDownloadingCertificateId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getParticipationLabel = (status?: string) => {
    switch (status) {
      case 'registered':
        return 'Terdaftar';
      case 'attended':
        return 'Hadir';
      case 'reported':
        return 'Sudah Lapor';
      default:
        return status || 'Belum Ada';
    }
  };

  const getReportStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Review';
      case 'under_review':
        return 'Sedang Ditinjau';
      case 'verified':
        return 'Terverifikasi';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Belum Lapor';
    }
  };

  const getReportStatusClass = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'under_review':
        return 'bg-blue-600 text-white';
      case 'pending':
        return 'bg-yellow-400 text-black';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const findReportForParticipation = (participation: UserParticipation) => (
    reports.find((report: any) => (
      (participation.reportId && report.id === participation.reportId) || report.eventId === participation.eventId
    ))
  );

  const buildReportTimeline = (report: any, participation?: UserParticipation): ReportTimelineItem[] => {
    const status = report?.status || participation?.reportStatus;
    return [
      {
        title: 'Laporan dikirim',
        description: 'Data kegiatan dan outcome sudah diterima sistem.',
        date: report?.createdAt,
        state: 'done',
      },
      {
        title: 'Review moderator',
        description:
          status === 'pending'
            ? 'Menunggu moderator wilayah mulai meninjau laporan.'
            : status === 'under_review'
              ? 'Moderator sedang memeriksa isi laporan dan kesesuaian kegiatan.'
              : 'Tahap review moderator sudah selesai.',
        state: status === 'pending' ? 'waiting' : status === 'under_review' ? 'active' : 'done',
      },
      {
        title: status === 'rejected' ? 'Laporan ditolak' : 'Keputusan akhir',
        description:
          status === 'verified'
            ? 'Laporan disetujui. Poin dan sertifikat diproses oleh sistem.'
            : status === 'rejected'
              ? report?.rejectReason || 'Laporan ditolak oleh moderator.'
              : 'Menunggu keputusan akhir dari moderator.',
        date: report?.verifiedAt,
        state: status === 'verified' ? 'done' : status === 'rejected' ? 'blocked' : 'waiting',
      },
    ];
  };

  const kampungName = user?.kampung?.name || user?.kampungName || user?.kelurahan || 'Belum Terdata';
  const kampungXp = user?.kampung?.xp ?? 0;
  const kampungRelawan = user?.kampung?.volunteers ?? 0;
  const kampungDibantu = user?.kampungDibantu || [];
  const kampungPernahBantu = user?.kampungPernahBantu || [];
  const pendingReport = user?.hasPendingReport || reports.some((r: any) => r.status === 'pending');
  const upcomingEvents = events.filter((event) => event.status === 'published');
  const reportableEvents = events.filter(
    (event) => event.status === 'completed' && Array.isArray(event.participants) && event.participants.includes(user?.id),
  );
  const participationStats = {
    total: participations.length,
    registered: participations.filter((item) => item.status === 'registered').length,
    attended: participations.filter((item) => item.status === 'attended' || item.status === 'reported').length,
    reported: participations.filter((item) => item.reported).length,
  };
  const selectedReportTimeline = selectedReportContext
    ? buildReportTimeline(selectedReportContext.report, selectedReportContext.participation)
    : [];
  const topKampung = kampungLeaderboard.slice(0, 5);
  const attendanceParticipants = Array.isArray(attendanceEvent?.participants)
    ? attendanceEvent.participants.map((id: string) => ({ id, name: userDirectory[id] || id }))
    : [];

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
        authToken={authToken}
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
          { key: 'my-events', label: 'Event Saya', icon: ClipboardList },
          { key: 'leaderboards', label: 'Leaderboard', icon: Crown },
          { key: 'certificates', label: 'Sertifikat', icon: FileCheck2 },
          { key: 'rewards', label: 'Reward', icon: Gift },
          { key: 'profile', label: 'Profil', icon: UserIcon },
        ]}
      />

      <div className="flex-1 overflow-auto px-4 pt-24 pb-8">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
            <span className="ml-3 text-gray-500">Memuat data...</span>
          </div>
        ) : (
          <>
            {activePage === 'home' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#0b5d3b] via-[#0f6a43] to-[#14824f] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,214,79,0.35) 0 20%, transparent 22%), radial-gradient(circle at 80% 30%, rgba(255,214,79,0.25) 0 16%, transparent 18%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.18) 0 18%, transparent 20%)',
                    }}
                  />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full blur-[70px] opacity-25 -mr-16 -mt-12" />
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

                <RankCard role="user" points={safeCurrentPoints} title="Rank Kamu" compact />

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

                <PillarRadarChart authToken={authToken} kampungId={user?.kampungId} />
              </div>
            )}

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
                  onEventJoined={() => {
                    fetchEvents();
                    fetchParticipations();
                  }}
                  canJoin={!pendingReport}
                />

                {userMode === 'ksh' && (
                  <Card className="border-green-100">
                    <CardHeader>
                      <CardTitle className="text-lg">Kelola Kegiatan Area KSH</CardTitle>
                      <CardDescription>Pilih daftar hadir peserta sebelum event ditandai selesai.</CardDescription>
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
                                <div className="text-[11px] text-gray-500">{event.participants?.length || 0} pendaftar</div>
                              </div>
                              <Button
                                size="sm"
                                className="bg-green-700 text-white hover:bg-green-800"
                                onClick={() => openAttendanceModal(event)}
                              >
                                Checklist & Selesaikan
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

            {activePage === 'my-events' && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Event Saya</h2>
                    <p className="text-sm text-gray-500">Riwayat pendaftaran, kehadiran, dan laporan kegiatan.</p>
                  </div>
                  <Button
                    onClick={openReportingWizard}
                    disabled={reportableEvents.length === 0}
                    className="bg-[#FFC107] text-black hover:bg-[#FFD54F] font-semibold"
                  >
                    Lapor Kegiatan
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                    <p className="text-xs text-green-700">Total Event</p>
                    <p className="text-2xl font-extrabold text-green-900">{participationStats.total}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">Terdaftar</p>
                    <p className="text-2xl font-extrabold text-blue-900">{participationStats.registered}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Hadir</p>
                    <p className="text-2xl font-extrabold text-emerald-900">{participationStats.attended}</p>
                  </div>
                  <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-700">Laporan</p>
                    <p className="text-2xl font-extrabold text-yellow-900">{participationStats.reported}</p>
                  </div>
                </div>

                <Card className="border border-green-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                      <ClipboardList className="w-5 h-5 text-green-700" />
                      Riwayat Partisipasi
                    </CardTitle>
                    <CardDescription>Status event dan laporan terbaru dari aktivitas kamu.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {participations.length === 0 ? (
                      <p className="text-sm text-gray-500">Belum ada riwayat partisipasi.</p>
                    ) : (
                      participations.map((item) => {
                        const report = findReportForParticipation(item);
                        const canReport = item.eventStatus === 'completed' && item.status === 'attended' && !item.reported;
                        return (
                          <div key={`${item.eventId}-${item.joinedAt}`} className="rounded-xl border bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-gray-900">{item.eventTitle}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {formatDate(item.eventDate)} • Bergabung {formatDate(item.joinedAt)}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    Event {item.eventStatus}
                                  </Badge>
                                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                                    {getParticipationLabel(item.status)}
                                  </Badge>
                                  <Badge className={getReportStatusClass(item.reportStatus)}>
                                    {getReportStatusLabel(item.reportStatus)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                {report && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                    onClick={() => setSelectedReportContext({ report, participation: item })}
                                  >
                                    Detail Laporan
                                  </Button>
                                )}
                                {canReport && (
                                  <Button
                                    size="sm"
                                    className="bg-green-700 text-white hover:bg-green-800"
                                    onClick={openReportingWizard}
                                  >
                                    Buat Laporan
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activePage === 'certificates' && (
              <div className="space-y-4 pt-2">
                <Card className="border border-green-100">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                      <FileCheck2 className="w-5 h-5 text-green-700" />
                      Sertifikat Digital
                    </CardTitle>
                    <CardDescription>Sertifikat terbit otomatis saat laporan kegiatan disetujui.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {certificates.length === 0 ? (
                      <p className="text-sm text-gray-500">Belum ada sertifikat.</p>
                    ) : (
                      certificates.map((cert) => (
                        <div key={cert.id} className="rounded-xl border bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-sm">{cert.eventTitle}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(cert.eventDate).toLocaleDateString('id-ID')} • Hash {cert.hash}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedCertificate(cert)}>
                                Lihat
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-700 text-white hover:bg-green-800"
                                disabled={downloadingCertificateId === cert.id}
                                onClick={() => handleDownloadCertificate(cert)}
                              >
                                {downloadingCertificateId === cert.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mengunduh
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activePage === 'rewards' && (
              <div className="space-y-4 pt-2">
                <Card className="border border-green-100">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                      <Gift className="w-5 h-5 text-yellow-600" />
                      Reward Voucher
                    </CardTitle>
                    <CardDescription>
                      Tukar XP menjadi voucher transportasi yang bisa ditukarkan di aplikasi GoBis untuk akses Suroboyo Bus dan layanan terkait.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                      <p className="text-xs text-green-700">XP Kamu Saat Ini</p>
                      <p className="text-2xl font-extrabold text-green-800">{safeCurrentPoints}</p>
                    </div>
                    {rewardCatalog.length === 0 ? (
                      <p className="text-sm text-gray-500">Belum ada reward aktif.</p>
                    ) : (
                      rewardCatalog.map((voucher) => {
                        const xpCost = Math.max(0, Number(voucher.xpCost || 0));
                        const disabled = voucher.stock <= 0 || safeCurrentPoints < xpCost;
                        const voucherName = String(voucher.name || '').includes('GoBis')
                          ? voucher.name
                          : String(voucher.name || '').replace('Voucher ', 'Voucher GoBis ');
                        const voucherDescription = String(voucher.description || '').toLowerCase().includes('demo')
                          ? 'Kode voucher transportasi untuk ditukarkan di aplikasi GoBis sebagai akses tiket Suroboyo Bus dan layanan angkutan publik terkait.'
                          : voucher.description;
                        return (
                          <div key={voucher.id} className="rounded-xl border bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-sm">{voucherName}</div>
                                <div className="text-xs text-gray-500 mt-1">{voucherDescription}</div>
                                <div className="text-xs text-gray-500 mt-1">Stok: {voucher.stock}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-700">{xpCost} XP</div>
                                <Button
                                  size="sm"
                                  className="mt-2 bg-green-700 text-white hover:bg-green-800"
                                  disabled={disabled}
                                  onClick={() => handleRedeemVoucher(voucher)}
                                >
                                  {voucher.stock <= 0 ? 'Habis' : safeCurrentPoints < xpCost ? 'XP Kurang' : 'Tukar'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activePage === 'profile' && (
              <div className="pt-2">
                <UserProfile user={user} reports={reports} onLogout={onLogout} />
              </div>
            )}
          </>
        )}
      </div>

      {isReportWizardOpen && (
        <ReportingWizard
          authToken={authToken}
          userId={user?.id}
          events={reportableEvents}
          onClose={() => {
            setIsReportWizardOpen(false);
            fetchEvents();
            fetchReports();
            fetchParticipations();
          }}
        />
      )}

      {attendanceEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Checklist Kehadiran</CardTitle>
                <CardDescription>{attendanceEvent.title}</CardDescription>
              </div>
              <button onClick={closeAttendanceModal} className="text-gray-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceParticipants.length === 0 ? (
                <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-500">Belum ada peserta terdaftar untuk event ini.</div>
              ) : (
                <div className="space-y-2">
                  {attendanceParticipants.map((participant) => (
                    <label key={participant.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendanceSelectedUserIds.includes(participant.id)}
                        onChange={() => toggleAttendanceUser(participant.id)}
                      />
                      <span className="text-sm">{participant.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Ringkasan output kegiatan</label>
                <textarea
                  value={attendanceSummary}
                  onChange={(e) => setAttendanceSummary(e.target.value)}
                  className="mt-1 w-full min-h-28 rounded-md border border-gray-300 p-3 text-sm"
                  placeholder="Contoh: kerja bakti selesai, 2 titik drainase dibersihkan, 24 warga hadir"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={closeAttendanceModal} disabled={attendanceSubmitting}>Batal</Button>
                <Button
                  className="bg-green-700 text-white hover:bg-green-800"
                  onClick={handleSubmitAttendanceAndComplete}
                  disabled={attendanceSubmitting}
                >
                  {attendanceSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : 'Simpan & Selesaikan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[92vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview Sertifikat</CardTitle>
              <button onClick={() => setSelectedCertificate(null)} className="text-gray-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border-2 border-green-800 bg-[#fbfaf7] p-3 shadow-inner">
                <div className="rounded-xl border border-green-200 bg-white px-4 py-8 text-center sm:px-10 sm:py-12">
                  <div className="mx-auto flex w-fit items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-green-800 text-white">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <div className="text-left">
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Pemerintah Kota Surabaya</div>
                      <div className="text-lg font-bold text-green-900">SIMRP</div>
                    </div>
                  </div>

                  <div className="mx-auto mt-8 h-0.5 w-24 bg-green-800" />
                  <div className="mt-6 text-xs uppercase tracking-[0.45em] text-gray-500">Sertifikat Partisipasi</div>
                  <h2 className="mt-4 text-3xl font-extrabold text-green-950 sm:text-5xl">Tanda Penghargaan</h2>
                  <div className="mt-8 text-xs uppercase tracking-[0.2em] text-gray-500">Diberikan kepada</div>
                  <div className="mx-auto mt-3 max-w-xl border-b border-gray-300 pb-3 text-3xl text-green-950 sm:text-4xl">
                    {selectedCertificate.userName}
                  </div>
                  <p className="mt-6 text-sm text-gray-700">atas partisipasi aktif dalam kegiatan</p>
                  <div className="mt-2 text-xl font-bold text-green-950">{selectedCertificate.eventTitle}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    Tanggal Kegiatan: {formatDate(selectedCertificate.eventDate)}
                  </div>

                  <div className="mx-auto mt-8 grid h-24 w-24 place-items-center rounded-full bg-green-800 text-white shadow-lg">
                    <div>
                      <CheckCircle2 className="mx-auto h-8 w-8" />
                      <div className="mt-1 text-[10px] font-bold uppercase">Verified</div>
                    </div>
                  </div>

                  <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-green-200 bg-green-50/60 p-4 text-left text-xs text-gray-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>ID Sertifikat</span>
                      <span className="font-mono text-green-950">{selectedCertificate.id}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span>Hash Verifikasi</span>
                      <span className="font-mono text-green-950">{selectedCertificate.hash}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span>Diterbitkan</span>
                      <span>{formatDate(selectedCertificate.issuedAt || selectedCertificate.eventDate)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span>Verifikasi online</span>
                      <span className="font-mono text-green-950">/certificates/{selectedCertificate.id}/verify</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                className="w-full bg-green-700 text-white hover:bg-green-800"
                disabled={downloadingCertificateId === selectedCertificate.id}
                onClick={() => handleDownloadCertificate(selectedCertificate)}
              >
                {downloadingCertificateId === selectedCertificate.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengunduh Sertifikat
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Sertifikat
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReportContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Detail Laporan</CardTitle>
                <CardDescription>
                  {selectedReportContext.participation?.eventTitle || selectedReportContext.report.eventId}
                </CardDescription>
              </div>
              <button onClick={() => setSelectedReportContext(null)} className="text-gray-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={`mt-2 ${getReportStatusClass(selectedReportContext.report.status)}`}>
                    {getReportStatusLabel(selectedReportContext.report.status)}
                  </Badge>
                </div>
                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Peserta Dilaporkan</p>
                  <p className="mt-2 text-lg font-bold text-gray-900">{selectedReportContext.report.participants || 0}</p>
                </div>
                <div className="rounded-xl border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Poin Awarded</p>
                  <p className="mt-2 text-lg font-bold text-green-700">{selectedReportContext.report.points || 0}</p>
                </div>
              </div>

              {Array.isArray(selectedReportContext.report.outcomeTags) && selectedReportContext.report.outcomeTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedReportContext.report.outcomeTags.map((tag: string) => (
                    <Badge key={tag} className="bg-green-100 text-green-800 hover:bg-green-100">{tag}</Badge>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900">Timeline Status</h3>
                <div className="mt-3 space-y-3">
                  {selectedReportTimeline.map((item) => {
                    const Icon =
                      item.state === 'done'
                        ? CheckCircle2
                        : item.state === 'active'
                          ? Clock3
                          : item.state === 'blocked'
                            ? AlertTriangle
                            : Circle;
                    const iconClass =
                      item.state === 'done'
                        ? 'bg-green-100 text-green-700'
                        : item.state === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : item.state === 'blocked'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500';
                    return (
                      <div key={item.title} className="flex gap-3 rounded-xl border bg-white p-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          <p className="mt-1 text-xs text-gray-600">{item.description}</p>
                          {item.date && <p className="mt-1 text-[11px] text-gray-400">{formatDate(item.date)}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedReportContext.report.status === 'rejected' && selectedReportContext.report.rejectReason && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-red-800">
                  <span className="font-semibold">Alasan penolakan:</span> {selectedReportContext.report.rejectReason}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
