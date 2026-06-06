import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  downloadCertificateFile,
  fetchCertificates,
  fetchKampungLeaderboard,
  fetchRewardCatalog,
  fetchUserDirectory,
  fetchUserEvents,
  fetchUserParticipations,
  fetchUserReports,
  redeemVoucher,
  submitAttendanceAndComplete,
} from './userDashboardApi';
import { findReportForParticipation, safePoints } from './userDashboardUtils';
import type {
  CertificateRecord,
  DashboardEvent,
  DashboardReport,
  RewardVoucher,
  SelectedReportContext,
  UserMode,
  UserParticipation,
} from './types';

interface UseUserDashboardDataParams {
  user: any;
  authToken: string | null;
}

export function useUserDashboardData({ user, authToken }: UseUserDashboardDataParams) {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [userMode, setUserMode] = useState<UserMode>(user?.isKsh ? 'ksh' : 'relawan');
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [participations, setParticipations] = useState<UserParticipation[]>([]);
  const [selectedReportContext, setSelectedReportContext] = useState<SelectedReportContext | null>(null);
  const [kampungLeaderboard, setKampungLeaderboard] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateRecord | null>(null);
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<string | null>(null);
  const [rewardCatalog, setRewardCatalog] = useState<RewardVoucher[]>([]);
  const [currentPoints, setCurrentPoints] = useState<number>(safePoints(user?.points));
  const [userDirectory, setUserDirectory] = useState<Record<string, string>>({});
  const [attendanceEvent, setAttendanceEvent] = useState<DashboardEvent | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState('');
  const [attendanceSelectedUserIds, setAttendanceSelectedUserIds] = useState<string[]>([]);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const safeCurrentPoints = safePoints(currentPoints);

  const refreshEvents = useCallback(async () => {
    try {
      setEvents(await fetchUserEvents(authToken));
    } catch {
      toast.error('Gagal memuat event');
    }
  }, [authToken]);

  const refreshReports = useCallback(async () => {
    try {
      setReports(await fetchUserReports(user?.id, authToken));
    } catch {
      toast.error('Gagal memuat laporan');
    }
  }, [authToken, user?.id]);

  const refreshParticipations = useCallback(async () => {
    try {
      setParticipations(await fetchUserParticipations(authToken));
    } catch {
      toast.error('Gagal memuat riwayat event');
    }
  }, [authToken]);

  const refreshKampungLeaderboard = useCallback(async () => {
    try {
      setKampungLeaderboard(await fetchKampungLeaderboard(authToken));
    } catch {
      // non-critical
    }
  }, [authToken]);

  const refreshCertificates = useCallback(async () => {
    try {
      setCertificates(await fetchCertificates(authToken));
    } catch {
      // non-critical
    }
  }, [authToken]);

  const refreshRewardCatalog = useCallback(async () => {
    try {
      setRewardCatalog(await fetchRewardCatalog(authToken));
    } catch {
      // non-critical
    }
  }, [authToken]);

  const refreshUserDirectory = useCallback(async () => {
    if (userMode !== 'ksh') {
      setUserDirectory({});
      return;
    }
    try {
      setUserDirectory(await fetchUserDirectory(authToken));
    } catch {
      // non-critical
    }
  }, [authToken, userMode]);

  const refreshAll = useCallback(async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        refreshEvents(),
        refreshReports(),
        refreshParticipations(),
        refreshKampungLeaderboard(),
        refreshCertificates(),
        refreshRewardCatalog(),
        refreshUserDirectory(),
      ]);
    } finally {
      setDataLoading(false);
    }
  }, [
    refreshCertificates,
    refreshEvents,
    refreshKampungLeaderboard,
    refreshParticipations,
    refreshReports,
    refreshRewardCatalog,
    refreshUserDirectory,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setCurrentPoints(safePoints(user?.points));
  }, [user?.points]);

  const openAttendanceModal = useCallback((event: DashboardEvent) => {
    setAttendanceEvent(event);
    setAttendanceSummary('');
    setAttendanceSelectedUserIds(Array.isArray(event.participants) ? [...event.participants] : []);
  }, []);

  const closeAttendanceModal = useCallback(() => {
    setAttendanceEvent(null);
    setAttendanceSummary('');
    setAttendanceSelectedUserIds([]);
    setAttendanceSubmitting(false);
  }, []);

  const toggleAttendanceUser = useCallback((userId: string) => {
    setAttendanceSelectedUserIds((prev) => (
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    ));
  }, []);

  const handleSubmitAttendanceAndComplete = useCallback(async () => {
    if (!attendanceEvent) {
      return;
    }
    if (!attendanceSummary.trim()) {
      toast.error('Ringkasan output wajib diisi.');
      return;
    }
    setAttendanceSubmitting(true);
    try {
      await submitAttendanceAndComplete(
        attendanceEvent.id,
        attendanceSelectedUserIds,
        attendanceSummary.trim(),
        authToken,
      );
      toast.success('Event ditandai selesai');
      closeAttendanceModal();
      refreshEvents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menandai event selesai');
    } finally {
      setAttendanceSubmitting(false);
    }
  }, [
    attendanceEvent,
    attendanceSelectedUserIds,
    attendanceSummary,
    authToken,
    closeAttendanceModal,
    refreshEvents,
  ]);

  const handleRedeemVoucher = useCallback(async (voucher: RewardVoucher) => {
    const xpCost = safePoints(voucher.xpCost);
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
      const data = await redeemVoucher(voucher.id, authToken);
      const code = data?.redemption?.voucherCode || '-';
      const remainingPoints = safePoints(data?.redemption?.remainingPoints ?? safeCurrentPoints);
      setCurrentPoints(remainingPoints);
      toast.success(`Voucher GoBis berhasil ditukar. Kode: ${code}`);
      refreshRewardCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menukar voucher');
    }
  }, [authToken, refreshRewardCatalog, safeCurrentPoints]);

  const handleDownloadCertificate = useCallback(async (cert: CertificateRecord) => {
    if (!cert?.id) {
      toast.error('Sertifikat tidak valid');
      return;
    }
    setDownloadingCertificateId(cert.id);
    try {
      const { blob, filename } = await downloadCertificateFile(cert.id, authToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `sertifikat-simrekap-${cert.id}.html`;
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
  }, [authToken]);

  const kampungName = user?.kampung?.name || user?.kampungName || user?.kelurahan || 'Belum Terdata';
  const kampungXp = user?.kampung?.xp ?? 0;
  const kampungRelawan = user?.kampung?.volunteers ?? 0;
  const kampungDibantu = user?.kampungDibantu || [];
  const kampungPernahBantu = user?.kampungPernahBantu || [];
  const pendingReport = user?.hasPendingReport || reports.some((r) => r.status === 'pending');
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
  const topKampung = kampungLeaderboard.slice(0, 5);
  const attendanceParticipants = useMemo(
    () => (
      Array.isArray(attendanceEvent?.participants)
        ? attendanceEvent.participants.map((id) => ({ id, name: userDirectory[id] || id }))
        : []
    ),
    [attendanceEvent?.participants, userDirectory],
  );

  return {
    events,
    userMode,
    setUserMode,
    reports,
    participations,
    selectedReportContext,
    setSelectedReportContext,
    kampungLeaderboard,
    certificates,
    selectedCertificate,
    setSelectedCertificate,
    downloadingCertificateId,
    rewardCatalog,
    safeCurrentPoints,
    attendanceEvent,
    attendanceSummary,
    setAttendanceSummary,
    attendanceSelectedUserIds,
    attendanceSubmitting,
    dataLoading,
    kampungName,
    kampungXp,
    kampungRelawan,
    kampungDibantu,
    kampungPernahBantu,
    pendingReport,
    upcomingEvents,
    reportableEvents,
    participationStats,
    topKampung,
    attendanceParticipants,
    refreshEvents,
    refreshReports,
    refreshParticipations,
    refreshAll,
    openAttendanceModal,
    closeAttendanceModal,
    toggleAttendanceUser,
    handleSubmitAttendanceAndComplete,
    handleRedeemVoucher,
    handleDownloadCertificate,
    findReportForParticipation: (participation: UserParticipation) => findReportForParticipation(participation, reports),
  };
}
