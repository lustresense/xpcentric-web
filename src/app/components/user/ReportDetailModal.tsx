import { AlertTriangle, CheckCircle2, Circle, Clock3, X } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  buildReportTimeline,
  formatDate,
  getReportStatusClass,
  getReportStatusLabel,
} from './userDashboardUtils';
import type { SelectedReportContext } from './types';

interface ReportDetailModalProps {
  context: SelectedReportContext;
  onClose: () => void;
}

export function ReportDetailModal({ context, onClose }: ReportDetailModalProps) {
  const timeline = buildReportTimeline(context.report, context.participation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Detail Laporan</CardTitle>
            <CardDescription>
              {context.participation?.eventTitle || context.report.eventId}
            </CardDescription>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Status</p>
              <Badge className={`mt-2 ${getReportStatusClass(context.report.status)}`}>
                {getReportStatusLabel(context.report.status)}
              </Badge>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Peserta Dilaporkan</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{context.report.participants || 0}</p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Poin Awarded</p>
              <p className="mt-2 text-lg font-bold text-green-700">{context.report.points || 0}</p>
            </div>
          </div>

          {Array.isArray(context.report.outcomeTags) && context.report.outcomeTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {context.report.outcomeTags.map((tag) => (
                <Badge key={tag} className="bg-green-100 text-green-800 hover:bg-green-100">{tag}</Badge>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900">Timeline Status</h3>
            <div className="mt-3 space-y-3">
              {timeline.map((item) => {
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

          {context.report.status === 'rejected' && context.report.rejectReason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-red-800">
              <span className="font-semibold">Alasan penolakan:</span> {context.report.rejectReason}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
