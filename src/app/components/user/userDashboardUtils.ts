import type { DashboardReport, ReportTimelineItem, UserParticipation } from './types';

export function formatDate(value?: string) {
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
}

export function safePoints(value: unknown) {
  return Math.max(0, Number(value) || 0);
}

export function getParticipationLabel(status?: string) {
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
}

export function getReportStatusLabel(status?: string) {
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
}

export function getReportStatusClass(status?: string) {
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
}

export function findReportForParticipation(
  participation: UserParticipation,
  reports: DashboardReport[],
) {
  return reports.find((report) => (
    (participation.reportId && report.id === participation.reportId) || report.eventId === participation.eventId
  ));
}

export function buildReportTimeline(
  report: DashboardReport,
  participation?: UserParticipation,
): ReportTimelineItem[] {
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
}
