import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { EventList } from '@/app/components/EventList';
import type { DashboardEvent, UserMode } from './types';

interface UserEventsProps {
  authToken: string | null;
  events: DashboardEvent[];
  pendingReport: boolean;
  reportableEventCount: number;
  userMode: UserMode;
  upcomingEvents: DashboardEvent[];
  onOpenReportingWizard: () => void;
  onEventJoined: () => void;
  onOpenAttendanceModal: (event: DashboardEvent) => void;
}

export function UserEvents({
  authToken,
  events,
  pendingReport,
  reportableEventCount,
  userMode,
  upcomingEvents,
  onOpenReportingWizard,
  onEventJoined,
  onOpenAttendanceModal,
}: UserEventsProps) {
  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Daftar Kegiatan</h2>
        <Button
          onClick={onOpenReportingWizard}
          disabled={reportableEventCount === 0}
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
        onEventJoined={onEventJoined}
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
                      onClick={() => onOpenAttendanceModal(event)}
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
  );
}
