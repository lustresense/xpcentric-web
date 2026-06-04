import { Loader2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { AttendanceParticipant, DashboardEvent } from './types';

interface AttendanceModalProps {
  event: DashboardEvent;
  participants: AttendanceParticipant[];
  selectedUserIds: string[];
  summary: string;
  submitting: boolean;
  onSummaryChange: (value: string) => void;
  onToggleUser: (userId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function AttendanceModal({
  event,
  participants,
  selectedUserIds,
  summary,
  submitting,
  onSummaryChange,
  onToggleUser,
  onClose,
  onSubmit,
}: AttendanceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Checklist Kehadiran</CardTitle>
            <CardDescription>{event.title}</CardDescription>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {participants.length === 0 ? (
            <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-500">Belum ada peserta terdaftar untuk event ini.</div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <label key={participant.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(participant.id)}
                    onChange={() => onToggleUser(participant.id)}
                  />
                  <span className="text-sm">{participant.name}</span>
                </label>
              ))}
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-gray-700">Ringkasan output kegiatan</label>
            <textarea
              value={summary}
              onChange={(event) => onSummaryChange(event.target.value)}
              className="mt-1 w-full min-h-28 rounded-md border border-gray-300 p-3 text-sm"
              placeholder="Contoh: kerja bakti selesai, 2 titik drainase dibersihkan, 24 warga hadir"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Batal</Button>
            <Button
              className="bg-green-700 text-white hover:bg-green-800"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
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
  );
}
