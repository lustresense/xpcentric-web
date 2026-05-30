import { ClipboardList } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  formatDate,
  getParticipationLabel,
  getReportStatusClass,
  getReportStatusLabel,
} from './userDashboardUtils';
import type { DashboardReport, ParticipationStats, SelectedReportContext, UserParticipation } from './types';

interface UserReportsProps {
  participations: UserParticipation[];
  participationStats: ParticipationStats;
  reportableEventCount: number;
  findReportForParticipation: (participation: UserParticipation) => DashboardReport | undefined;
  onOpenReportingWizard: () => void;
  onSelectReport: (context: SelectedReportContext) => void;
}

export function UserReports({
  participations,
  participationStats,
  reportableEventCount,
  findReportForParticipation,
  onOpenReportingWizard,
  onSelectReport,
}: UserReportsProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Saya</h2>
          <p className="text-sm text-gray-500">Riwayat pendaftaran, kehadiran, dan laporan kegiatan.</p>
        </div>
        <Button
          onClick={onOpenReportingWizard}
          disabled={reportableEventCount === 0}
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
                        {formatDate(item.eventDate)} - Bergabung {formatDate(item.joinedAt)}
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
                          onClick={() => onSelectReport({ report, participation: item })}
                        >
                          Detail Laporan
                        </Button>
                      )}
                      {canReport && (
                        <Button
                          size="sm"
                          className="bg-green-700 text-white hover:bg-green-800"
                          onClick={onOpenReportingWizard}
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
  );
}
