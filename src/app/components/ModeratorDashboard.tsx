import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle, XCircle, FileText, Clock, LayoutGrid, ShieldCheck, Lightbulb, BarChart3, Users, Handshake, Loader2, User as UserIcon } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { FloatingNavbar } from '@/app/components/ui/FloatingNavbar';
import { Input } from '@/app/components/ui/input';
import { UserProfile } from '@/app/components/UserProfile';

interface ModeratorDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  onNavigate: (page: any) => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
  moderatorTier: 1 | 2 | 3;
}

interface GeoKelurahan {
  id: number;
  name: string;
  kodepos: string[];
}

interface GeoKecamatan {
  id: number;
  name: string;
  kelurahan: GeoKelurahan[];
}

export function ModeratorDashboard({ user, authToken, onLogout, onNavigate, currentView, onViewChange, moderatorTier }: ModeratorDashboardProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [geoOptions, setGeoOptions] = useState<GeoKecamatan[]>([]);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    pillar: '1',
    scopeType: 'kelurahan',
    kecamatanId: '',
    kelurahanId: '',
    date: '',
    time: '',
    location: '',
    quota: 0
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState<string>('overview');

  useEffect(() => {
    fetchData();
  }, [moderatorTier]);

  useEffect(() => {
    const next = moderatorTier === 1 ? "monitor" : moderatorTier === 2 ? "verify" : "aggregate";
    setActivePage(next);
  }, [moderatorTier]);

  useEffect(() => {
    if (!geoOptions.length || eventForm.kecamatanId) {
      return;
    }
    const kecamatanByName = geoOptions.find((k) => k.name === user?.kecamatan);
    if (!kecamatanByName) {
      return;
    }
    const kelurahanByName = kecamatanByName.kelurahan.find((k) => k.name === user?.kelurahan);
    setEventForm((prev) => ({
      ...prev,
      kecamatanId: String(kecamatanByName.id),
      kelurahanId: kelurahanByName ? String(kelurahanByName.id) : ''
    }));
  }, [geoOptions, user?.kecamatan, user?.kelurahan, eventForm.kecamatanId]);

  const requireToken = () => {
    if (authToken) {
      return true;
    }
    toast.error('Sesi tidak valid. Silakan login ulang.');
    onLogout();
    return false;
  };

  const fetchData = async () => {
    if (!requireToken()) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all([fetchReports(), fetchUsers(), fetchEvents(), fetchGeoOptions(), fetchCollaborationRequests()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborationRequests = async () => {
    if (!authToken || moderatorTier !== 2) {
      setCollaborationRequests([]);
      return;
    }
    try {
      const data = await apiGet('/collaboration-requests', authToken);
      setCollaborationRequests(data.requests || []);
    } catch {
      toast.error('Data kolaborasi belum bisa dimuat.');
    }
  };

  const fetchGeoOptions = async () => {
    if (!authToken) return;
    try {
      const data = await apiGet('/geo/options', authToken);
      setGeoOptions(data.kecamatan || []);
    } catch {
      toast.error('Data kecamatan/kelurahan belum termuat.');
    }
  };

  const fetchReports = async () => {
    if (!authToken) return;
    try {
      const data = await apiGet('/reports', authToken);
      setReports(data.reports || []);
    } catch { /* handled globally */ }
  };

  const fetchUsers = async () => {
    if (!authToken) return;
    try {
      const params = new URLSearchParams();
      // Moderator dashboard "Relawan Terpantau" must only include relawan/KSH.
      params.set('role', 'user');
      if (moderatorTier === 1 && user?.kampungId) {
        params.set('kampungId', String(user.kampungId));
      }
      const filter = params.toString() ? `?${params.toString()}` : '';
      const data = await apiGet(`/users${filter}`, authToken);
      setUsers(data.users || []);
    } catch { /* handled globally */ }
  };

  const fetchEvents = async () => {
    if (!authToken) return;
    try {
      const data = await apiGet('/events', authToken);
      setEvents(data.events || []);
    } catch { /* handled globally */ }
  };

  const handleVerifyReport = async (reportId: string, approved: boolean) => {
    if (!requireToken()) return;
    try {
      await apiPost(`/reports/${reportId}/verify`, { approved, points: approved ? 50 : 0 }, authToken);
      toast.success(approved ? 'Laporan disetujui' : 'Laporan ditolak');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi laporan');
    }
  };

  const handleEventApproval = async (eventId: string, approved: boolean) => {
    if (!requireToken()) return;
    try {
      await apiPost(`/events/${eventId}/approval`, { approved }, authToken);
      toast.success(approved ? 'Event disetujui' : 'Event ditolak');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses approval');
    }
  };

  const handleCollaborationApproval = async (requestId: string, approved: boolean) => {
    if (!requireToken()) return;
    try {
      await apiPost(`/collaboration-requests/${requestId}/approval`, { approved }, authToken);
      toast.success(approved ? 'Kolaborasi disetujui' : 'Kolaborasi ditolak');
      fetchCollaborationRequests();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    }
  };

  const handleCreateTier1Event = async () => {
    if (!requireToken()) return;
    if (!eventForm.title.trim() || !eventForm.date) {
      toast.error('Judul dan tanggal wajib diisi');
      return;
    }
    if (!eventForm.kecamatanId) {
      toast.error('Kecamatan wajib dipilih');
      return;
    }
    if (eventForm.scopeType === 'kelurahan' && !eventForm.kelurahanId) {
      toast.error('Untuk skala kelurahan, kelurahan wajib dipilih');
      return;
    }
    setSubmittingEvent(true);
    try {
      await apiPost('/events', {
        title: eventForm.title,
        description: eventForm.description,
        pillar: parseInt(eventForm.pillar, 10),
        scopeType: eventForm.scopeType,
        kecamatanId: Number(eventForm.kecamatanId),
        kelurahanId: eventForm.scopeType === 'kelurahan' ? Number(eventForm.kelurahanId) : null,
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.location,
        quota: eventForm.quota,
      }, authToken);
      toast.success('Kegiatan draft berhasil dibuat');
      setEventForm({
        title: '',
        description: '',
        pillar: '1',
        scopeType: 'kelurahan',
        kecamatanId: '',
        kelurahanId: '',
        date: '',
        time: '',
        location: '',
        quota: 0,
      });
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmittingEvent(false);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const verifiedReports = reports.filter(r => r.status === 'verified');
  const draftEvents = events.filter((e) => e.status === 'draft');
  const pendingCollaborationRequests = collaborationRequests.filter((item) => item.status === 'pending');
  const selectedKecamatan = geoOptions.find((k) => String(k.id) === eventForm.kecamatanId);
  const kelurahanOptions = selectedKecamatan?.kelurahan || [];
  const visibleUsers = moderatorTier === 1
    ? users.filter((u) => u.kampungId && u.kampungId === user?.kampungId)
    : moderatorTier === 2
      ? (user?.tier2Badge === 'lurah'
          ? users.filter((u) => u.kampungId === user?.kampungId)
          : users.filter((u) => u.kecamatan === user?.kecamatan))
      : users;

  return (
    <div className="size-full flex flex-col bg-white">
      <FloatingNavbar
        user={user}
        activePage={activePage}
        onLogout={onLogout}
        onNavigate={(page) => setActivePage(page)}
        userMode="relawan"
        onModeChange={() => {}}
        currentView={currentView}
        onViewChange={onViewChange}
        moderatorTier={moderatorTier}
        onModeratorTierChange={() => {}}
        theme="moderator"
        navItems={
          moderatorTier === 1
            ? [
                { key: "monitor", label: "Monitoring", icon: BarChart3 },
                { key: "rekom", label: "Input", icon: Lightbulb },
                { key: "overview", label: "Ringkas", icon: LayoutGrid },
                { key: "profile", label: "Profil", icon: UserIcon }
              ]
            : moderatorTier === 2
            ? [
                { key: "verify", label: "Verifikasi", icon: ShieldCheck },
                { key: "events", label: "Kegiatan", icon: FileText },
                { key: "collab", label: "Kolab", icon: Handshake },
                { key: "overview", label: "Ringkas", icon: LayoutGrid },
                { key: "profile", label: "Profil", icon: UserIcon }
              ]
            : [
                { key: "aggregate", label: "Agregat", icon: BarChart3 },
                { key: "insight", label: "Insight", icon: Lightbulb },
                { key: "overview", label: "Ringkas", icon: LayoutGrid },
                { key: "profile", label: "Profil", icon: UserIcon }
              ]
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 pt-24 space-y-4">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-500 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Moderator Dashboard</h1>
              <p className="text-sm text-cyan-100">
                Tier {moderatorTier}{moderatorTier === 2 && user?.tier2Badge ? ` - ${String(user.tier2Badge).toUpperCase()}` : ''}
              </p>
            </div>
            <Badge className="bg-white/20 text-white">{user?.name}</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-cyan-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {moderatorTier === 2 ? 'Menunggu Proses' : 'Menunggu Verifikasi'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-700">
                {moderatorTier === 2 ? pendingReports.length + pendingCollaborationRequests.length : pendingReports.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Terverifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{verifiedReports.length}</div>
            </CardContent>
          </Card>

          <Card className="border-cyan-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{reports.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-cyan-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              Relawan & KSH Terpantau
            </CardTitle>
            <CardDescription>
              {moderatorTier === 1
                ? 'Kampung binaan'
                : moderatorTier === 2
                  ? (user?.tier2Badge === 'lurah' ? 'Wilayah kelurahan (Lurah)' : 'Wilayah kecamatan (Camat)')
                  : 'Seluruh kota'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visibleUsers.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada data relawan.</div>
            ) : (
              <div className="space-y-2">
                {visibleUsers.slice(0, 8).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                    <div>
                      <div className="font-semibold text-sm">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.kelurahan} - {u.kecamatan}</div>
                    </div>
                    <Badge className="bg-cyan-600 text-white">{u.points || 0} XP</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {activePage === "verify" && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Laporan Menunggu Verifikasi
            </CardTitle>
            <CardDescription>
              {pendingReports.length} laporan perlu ditinjau
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada laporan yang menunggu verifikasi
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReports.map((report) => {
                  const reporter = users.find(u => u.id === report.userId);
                  
                  return (
                    <div key={report.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold">{reporter?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <Badge className="bg-yellow-500">Pending</Badge>
                      </div>

                      {report.photoUrl && (
                        <img
                          src={report.photoUrl}
                          alt="Bukti Kegiatan"
                          className="w-full h-64 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Peserta:</span>
                          <span>{report.participants} orang</span>
                        </div>

                        {report.outcomeTags?.length > 0 && (
                          <div>
                            <span className="font-semibold">Dampak:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {report.outcomeTags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag === 'resolved' ? 'Masalah Teratasi' :
                                   tag === 'followup' ? 'Butuh Tindak Lanjut' :
                                   tag === 'economic' ? 'Transaksi Ekonomi' :
                                   tag === 'participation' ? 'Partisipasi Meningkat' :
                                   tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVerifyReport(report.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Setujui (+50 poin)
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleVerifyReport(report.id, false)}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Tolak
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          </Card>
        )}

        {activePage === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Ringkasan Moderator
              </CardTitle>
              <CardDescription>Ringkasan data sesuai tier.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Gunakan menu atas untuk fitur sesuai tier.</div>
            </CardContent>
          </Card>
        )}

        {activePage === "monitor" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monitoring Kampung Binaan
              </CardTitle>
              <CardDescription>Tier 1 fokus monitoring dan input kegiatan draft.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Data monitoring kampung akan muncul di sini.</div>
            </CardContent>
          </Card>
        )}

        {activePage === "rekom" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Input Kegiatan Tier 1
              </CardTitle>
              <CardDescription>ASN Pendamping hanya bisa input kegiatan sebagai draft.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Judul</label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Contoh: Kerja Bakti RW 05"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Deskripsi</label>
                    <Input
                      value={eventForm.description}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Deskripsi singkat kegiatan"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Pilar</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { id: '1', label: 'Lingkungan' },
                        { id: '2', label: 'Ekonomi' },
                        { id: '3', label: 'Kemasyarakatan' },
                        { id: '4', label: 'Sosial Budaya' }
                      ].map((pillar) => (
                        <Button
                          key={pillar.id}
                          type="button"
                          variant={eventForm.pillar === pillar.id ? 'default' : 'outline'}
                          className={eventForm.pillar === pillar.id ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                          onClick={() => setEventForm(prev => ({ ...prev, pillar: pillar.id }))}
                        >
                          {pillar.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Skala Kegiatan</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        type="button"
                        variant={eventForm.scopeType === 'kelurahan' ? 'default' : 'outline'}
                        className={eventForm.scopeType === 'kelurahan' ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                        onClick={() => setEventForm(prev => ({ ...prev, scopeType: 'kelurahan' }))}
                      >
                        Kelurahan
                      </Button>
                      <Button
                        type="button"
                        variant={eventForm.scopeType === 'kecamatan' ? 'default' : 'outline'}
                        className={eventForm.scopeType === 'kecamatan' ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                        onClick={() => setEventForm(prev => ({ ...prev, scopeType: 'kecamatan', kelurahanId: '' }))}
                      >
                        Kecamatan
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Kecamatan</label>
                      <select
                        className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3 text-sm"
                        value={eventForm.kecamatanId}
                        onChange={(e) => setEventForm(prev => ({ ...prev, kecamatanId: e.target.value, kelurahanId: '' }))}
                      >
                        <option value="">Pilih kecamatan</option>
                        {geoOptions.map((kecamatan) => (
                          <option key={kecamatan.id} value={String(kecamatan.id)}>
                            {kecamatan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {eventForm.scopeType === 'kelurahan' && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Kelurahan</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3 text-sm"
                          value={eventForm.kelurahanId}
                          onChange={(e) => setEventForm(prev => ({ ...prev, kelurahanId: e.target.value }))}
                        >
                          <option value="">Pilih kelurahan</option>
                          {kelurahanOptions.map((kelurahan: GeoKelurahan) => (
                            <option key={kelurahan.id} value={String(kelurahan.id)}>
                              {kelurahan.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Tanggal</label>
                      <Input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Waktu</label>
                      <Input
                        value={eventForm.time}
                        onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                        placeholder="07:00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Lokasi</label>
                    <Input
                      value={eventForm.location}
                      onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Balai RW / aula kampung"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Kuota</label>
                    <Input
                      type="number"
                      min={0}
                      value={String(eventForm.quota)}
                      onChange={(e) => setEventForm(prev => ({ ...prev, quota: Number(e.target.value || 0) }))}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    onClick={handleCreateTier1Event}
                    disabled={submittingEvent}
                    className="bg-cyan-600 text-white hover:bg-cyan-700"
                  >
                    {submittingEvent ? 'Menyimpan...' : 'Simpan Draft Kegiatan'}
                  </Button>
                </div>

                <div className="space-y-2">
                  {draftEvents.length === 0 ? (
                    <div className="text-sm text-gray-500">Belum ada draft kegiatan terbaru.</div>
                  ) : (
                    draftEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="p-3 rounded-lg bg-cyan-50">
                        <div className="font-semibold text-sm">{event.title}</div>
                        <div className="text-xs text-gray-600">
                          {event.scopeType === 'kecamatan' ? 'Skala Kecamatan' : 'Skala Kelurahan'} - {event.kecamatan}{event.kelurahan ? ` / ${event.kelurahan}` : ''}
                        </div>
                        <div className="text-xs text-gray-600">{event.date || 'Tanggal belum diatur'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activePage === "events" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Kegiatan & Approval
              </CardTitle>
              <CardDescription>Tier 2 memverifikasi kegiatan.</CardDescription>
            </CardHeader>
            <CardContent>
              {draftEvents.length === 0 ? (
                <div className="text-sm text-gray-500">Tidak ada kegiatan menunggu approval.</div>
              ) : (
                <div className="space-y-3">
                  {draftEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-xs text-gray-500">
                            {event.scopeType === 'kecamatan' ? 'Skala Kecamatan' : 'Skala Kelurahan'} - {event.kecamatan}{event.kelurahan ? ` / ${event.kelurahan}` : ''}
                          </div>
                          <div className="text-xs text-gray-500">{event.date}</div>
                        </div>
                        <Badge className="bg-yellow-400 text-black">Draft</Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleEventApproval(event.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleEventApproval(event.id, false)}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activePage === "collab" && moderatorTier === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="w-5 h-5" />
                Permintaan Kolaborasi
              </CardTitle>
              <CardDescription>
                Sponsor Submit - collaboration_request - Tier 2 review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCollaborationRequests.length === 0 ? (
                <div className="text-sm text-gray-500">Tidak ada permintaan kolaborasi pending.</div>
              ) : (
                <div className="space-y-3">
                  {pendingCollaborationRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{request.organizationName}</div>
                          <div className="text-xs text-gray-500">PIC: {request.picName} - {request.email}</div>
                        </div>
                        <Badge className="bg-yellow-400 text-black">Pending</Badge>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        <span className="font-semibold">Jenis Dukungan:</span>{" "}
                        {request.supportType === 'media_partner' ? 'Media partner' : request.supportType}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-semibold">Skala:</span>{" "}
                        {request.contributionScope === "kota"
                          ? "Kota"
                          : request.contributionScope === "kecamatan"
                            ? `Kecamatan${request.scopeKecamatanName ? ` - ${request.scopeKecamatanName}` : ""}`
                            : `Kelurahan${request.scopeKelurahanName ? ` - ${request.scopeKelurahanName}` : ""}${
                                request.scopeKecamatanName ? ` (${request.scopeKecamatanName})` : ""
                              }`}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{request.supportDescription}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() => handleCollaborationApproval(request.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleCollaborationApproval(request.id, false)}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activePage === "aggregate" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Agregat Kota
              </CardTitle>
              <CardDescription>Tier 3 monitoring agregat kota.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Data agregat kota akan muncul di sini.</div>
            </CardContent>
          </Card>
        )}

        {activePage === "insight" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Insight Program
              </CardTitle>
              <CardDescription>Analisis tren pilar dan rekomendasi kebijakan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Belum ada insight terbaru.</div>
            </CardContent>
          </Card>
        )}

        {moderatorTier === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Laporan Terverifikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verifiedReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada laporan terverifikasi
                </div>
              ) : (
                <div className="space-y-3">
                  {verifiedReports.slice(0, 10).map((report) => {
                    const reporter = users.find(u => u.id === report.userId);
                    
                    return (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{reporter?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500">Verified</Badge>
                          <div className="text-xs text-gray-500 mt-1">{report.points} poin</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Profile Tab */}
        {activePage === 'profile' && (
          <div className="pt-2">
             <UserProfile user={user} reports={reports} onLogout={onLogout} moderatorTier={moderatorTier} />
          </div>
        )}
      </div>
    </div>
  );
}
