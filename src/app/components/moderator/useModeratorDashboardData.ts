import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut } from '@/lib/api';

export interface GeoKelurahan {
  id: number;
  name: string;
  kodepos: string[];
}

export interface GeoKecamatan {
  id: number;
  name: string;
  kelurahan: GeoKelurahan[];
}

export interface ModeratorEventForm {
  title: string;
  description: string;
  pillar: string;
  scopeType: string;
  kecamatanId: string;
  kelurahanId: string;
  date: string;
  time: string;
  location: string;
  quota: number;
}

interface UseModeratorDashboardDataParams {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  moderatorTier: 1 | 2 | 3;
  onEditDraftEvent?: () => void;
}

const emptyEventForm = (): ModeratorEventForm => ({
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

export function useModeratorDashboardData({
  user,
  authToken,
  onLogout,
  moderatorTier,
  onEditDraftEvent,
}: UseModeratorDashboardDataParams) {
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [geoOptions, setGeoOptions] = useState<GeoKecamatan[]>([]);
  const [eventForm, setEventForm] = useState<ModeratorEventForm>(emptyEventForm);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const requireToken = useCallback(() => {
    if (authToken) {
      return true;
    }
    toast.error('Sesi tidak valid. Silakan login ulang.');
    onLogout();
    return false;
  }, [authToken, onLogout]);

  const fetchCollaborationRequests = useCallback(async () => {
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
  }, [authToken, moderatorTier]);

  const fetchGeoOptions = useCallback(async () => {
    if (!authToken) return;
    try {
      const data = await apiGet('/geo/options', authToken);
      setGeoOptions(data.kecamatan || []);
    } catch {
      toast.error('Data kecamatan/kelurahan belum termuat.');
    }
  }, [authToken]);

  const fetchReports = useCallback(async () => {
    if (!authToken) return;
    try {
      const data = await apiGet('/reports', authToken);
      setReports(data.reports || []);
    } catch {
      /* handled globally */
    }
  }, [authToken]);

  const fetchUsers = useCallback(async () => {
    if (!authToken) return;
    try {
      const params = new URLSearchParams();
      params.set('role', 'user');
      if (moderatorTier === 1 && user?.kampungId) {
        params.set('kampungId', String(user.kampungId));
      }
      const filter = params.toString() ? `?${params.toString()}` : '';
      const data = await apiGet(`/users${filter}`, authToken);
      setUsers(data.users || []);
    } catch {
      /* handled globally */
    }
  }, [authToken, moderatorTier, user?.kampungId]);

  const fetchEvents = useCallback(async () => {
    if (!authToken) return;
    try {
      const data = await apiGet('/events', authToken);
      setEvents(data.events || []);
    } catch {
      /* handled globally */
    }
  }, [authToken]);

  const fetchData = useCallback(async () => {
    if (!requireToken()) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        fetchReports(),
        fetchUsers(),
        fetchEvents(),
        fetchGeoOptions(),
        fetchCollaborationRequests(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCollaborationRequests, fetchEvents, fetchGeoOptions, fetchReports, fetchUsers, requireToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      kelurahanId: kelurahanByName ? String(kelurahanByName.id) : '',
    }));
  }, [geoOptions, user?.kecamatan, user?.kelurahan, eventForm.kecamatanId]);

  const handleVerifyReport = useCallback(async (reportId: string, approved: boolean) => {
    if (!requireToken()) return;
    try {
      let reason = '';
      if (!approved) {
        reason = (window.prompt('Masukkan alasan penolakan laporan') || '').trim();
        if (!reason) {
          toast.error('Alasan penolakan wajib diisi');
          return;
        }
      }
      await apiPost(`/reports/${reportId}/verify`, { approved, points: approved ? 50 : 0, reason }, authToken);
      toast.success(approved ? 'Laporan disetujui' : 'Laporan ditolak');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi laporan');
    }
  }, [authToken, fetchData, requireToken]);

  const handleEventApproval = useCallback(async (eventId: string, approved: boolean) => {
    if (!requireToken()) return;
    try {
      await apiPost(`/events/${eventId}/approval`, { approved }, authToken);
      toast.success(approved ? 'Event disetujui' : 'Event ditolak');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses approval');
    }
  }, [authToken, fetchEvents, requireToken]);

  const handleEventPublish = useCallback(async (eventId: string) => {
    if (!requireToken()) return;
    try {
      await apiPost(`/events/${eventId}/publish`, {}, authToken);
      toast.success('Event berhasil dipublish');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal publish event');
    }
  }, [authToken, fetchEvents, requireToken]);

  const handleCollaborationApproval = useCallback(async (requestId: string, approved: boolean) => {
    if (!requireToken()) return;
    try {
      await apiPost(`/collaboration-requests/${requestId}/approval`, { approved }, authToken);
      toast.success(approved ? 'Kolaborasi disetujui' : 'Kolaborasi ditolak');
      fetchCollaborationRequests();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    }
  }, [authToken, fetchCollaborationRequests, requireToken]);

  const resetEventForm = useCallback(() => {
    setEventForm(emptyEventForm());
    setEditingEventId(null);
  }, []);

  const handleCreateTier1Event = useCallback(async () => {
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
      const payload = {
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
      };
      if (editingEventId) {
        await apiPut(`/events/${editingEventId}`, payload, authToken);
        toast.success('Draft kegiatan berhasil diperbarui');
      } else {
        await apiPost('/events', payload, authToken);
        toast.success('Kegiatan draft berhasil dibuat');
      }
      resetEventForm();
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmittingEvent(false);
    }
  }, [authToken, editingEventId, eventForm, fetchEvents, requireToken, resetEventForm]);

  const handleEditDraftEvent = useCallback((event: any) => {
    setEditingEventId(event.id);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      pillar: String(event.pillar || 1),
      scopeType: event.scopeType || 'kelurahan',
      kecamatanId: event.kecamatanId ? String(event.kecamatanId) : '',
      kelurahanId: event.kelurahanId ? String(event.kelurahanId) : '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      quota: Number(event.quota || 0),
    });
    onEditDraftEvent?.();
  }, [onEditDraftEvent]);

  const pendingReports = useMemo(() => reports.filter((report) => report.status === 'pending'), [reports]);
  const verifiedReports = useMemo(() => reports.filter((report) => report.status === 'verified'), [reports]);
  const draftEvents = useMemo(() => events.filter((event) => event.status === 'draft'), [events]);
  const approvedEvents = useMemo(() => events.filter((event) => event.status === 'approved'), [events]);
  const pendingCollaborationRequests = useMemo(
    () => collaborationRequests.filter((item) => item.status === 'pending'),
    [collaborationRequests],
  );
  const selectedKecamatan = useMemo(
    () => geoOptions.find((kecamatan) => String(kecamatan.id) === eventForm.kecamatanId),
    [eventForm.kecamatanId, geoOptions],
  );
  const kelurahanOptions = selectedKecamatan?.kelurahan || [];
  const visibleUsers = useMemo(() => {
    if (moderatorTier === 1) {
      return users.filter((item) => item.kampungId && item.kampungId === user?.kampungId);
    }
    if (moderatorTier === 2) {
      return user?.tier2Badge === 'lurah'
        ? users.filter((item) => item.kampungId === user?.kampungId)
        : users.filter((item) => item.kecamatan === user?.kecamatan);
    }
    return users;
  }, [moderatorTier, user?.kampungId, user?.kecamatan, user?.tier2Badge, users]);

  return {
    reports,
    users,
    eventForm,
    setEventForm: setEventForm as Dispatch<SetStateAction<ModeratorEventForm>>,
    submittingEvent,
    loading,
    editingEventId,
    geoOptions,
    kelurahanOptions,
    pendingReports,
    verifiedReports,
    draftEvents,
    approvedEvents,
    pendingCollaborationRequests,
    visibleUsers,
    handleVerifyReport,
    handleEventApproval,
    handleEventPublish,
    handleCollaborationApproval,
    handleCreateTier1Event,
    handleEditDraftEvent,
    resetEventForm,
    refreshData: fetchData,
  };
}
