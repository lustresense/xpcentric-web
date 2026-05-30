import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';

interface UseAdminDashboardDataParams {
  authToken: string | null;
}

export function useAdminDashboardData({ authToken }: UseAdminDashboardDataParams) {
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    const data = await apiGet('/users', authToken);
    setUsers(data.users || []);
  }, [authToken]);

  const fetchEvents = useCallback(async () => {
    const data = await apiGet('/events', authToken);
    setEvents(data.events || []);
  }, [authToken]);

  const fetchReports = useCallback(async () => {
    const data = await apiGet('/reports', authToken);
    setReports(data.reports || []);
  }, [authToken]);

  const fetchCollaborationRequests = useCallback(async () => {
    const data = await apiGet('/collaboration-requests', authToken);
    setCollaborationRequests(data.requests || []);
  }, [authToken]);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchEvents(), fetchReports(), fetchCollaborationRequests()]);
    } catch {
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  }, [fetchCollaborationRequests, fetchEvents, fetchReports, fetchUsers]);

  const handleVerifyReport = useCallback(async (reportId: string, approved: boolean) => {
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
      await Promise.all([fetchReports(), fetchUsers()]);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memverifikasi laporan');
    }
  }, [authToken, fetchReports, fetchUsers]);

  const handleCollaborationApproval = useCallback(async (requestId: string, approved: boolean) => {
    try {
      await apiPost(`/collaboration-requests/${requestId}/approval`, { approved }, authToken);
      toast.success(approved ? 'Kolaborasi disetujui' : 'Kolaborasi ditolak');
      await fetchCollaborationRequests();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses kolaborasi');
    }
  }, [authToken, fetchCollaborationRequests]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  return {
    users,
    events,
    reports,
    collaborationRequests,
    loading,
    refreshAllData,
    handleVerifyReport,
    handleCollaborationApproval,
  };
}
