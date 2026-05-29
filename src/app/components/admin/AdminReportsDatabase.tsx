import { useMemo, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { DatabaseShell, EmptyState, SearchBox, SortButton, StatusBadge, Toolbar } from './AdminDatabaseShared';
import {
  compareNumber,
  compareText,
  dateValue,
  formatDate,
  getPillarName,
  normalize,
  safePoints,
  selectClassName,
  type SortDirection,
} from './adminDashboardUtils';

type ReportSortKey = 'createdAt' | 'status' | 'participants' | 'points';

interface AdminReportsDatabaseProps {
  reports: any[];
  users: any[];
  events: any[];
  onVerifyReport: (reportId: string, approved: boolean) => void;
}

export function AdminReportsDatabase({ reports, users, events, onVerifyReport }: AdminReportsDatabaseProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<ReportSortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const rows = useMemo(() => {
    return reports
      .map((report) => ({
        report,
        reporter: userMap.get(report.userId),
        event: eventMap.get(report.eventId),
      }))
      .filter(({ report }) => statusFilter === 'all' || normalize(report.status) === statusFilter)
      .filter(({ report, reporter, event }) => {
        if (!query.trim()) return true;
        const haystack = [
          reporter?.name,
          reporter?.email,
          event?.title,
          report.eventId,
          report.status,
          report.createdAt,
        ]
          .map(normalize)
          .join(' ');
        return haystack.includes(normalize(query));
      })
      .sort((a, b) => {
        if (sortKey === 'createdAt') return compareNumber(dateValue(a.report.createdAt), dateValue(b.report.createdAt), sortDirection);
        if (sortKey === 'participants') return compareNumber(Number(a.report.participants || 0), Number(b.report.participants || 0), sortDirection);
        if (sortKey === 'points') return compareNumber(safePoints(a.report.points), safePoints(b.report.points), sortDirection);
        return compareText(a.report.status, b.report.status, sortDirection);
      });
  }, [eventMap, query, reports, sortDirection, sortKey, statusFilter, userMap]);

  const pendingCount = reports.filter((report) => report.status === 'pending').length;

  return (
    <DatabaseShell
      title="Database Laporan"
      description={`${pendingCount} laporan menunggu verifikasi. Area kosong tetap gelap dan tidak pecah ke background putih.`}
    >
      <Toolbar>
        <SearchBox value={query} onChange={setQuery} placeholder="Cari pelapor, event, status, atau ID event" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClassName('lg:w-[170px]')}>
          <option value="all">Semua status</option>
          <option value="pending">Pending</option>
          <option value="verified">Terverifikasi</option>
          <option value="rejected">Ditolak</option>
        </select>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as ReportSortKey)} className={selectClassName('lg:w-[170px]')}>
          <option value="createdAt">Sort: tanggal</option>
          <option value="status">Sort: status</option>
          <option value="participants">Sort: peserta</option>
          <option value="points">Sort: poin</option>
        </select>
        <SortButton direction={sortDirection} onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} />
      </Toolbar>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada laporan pada view ini" description="Data akan muncul setelah relawan mengirim laporan kegiatan." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/15">
          <Table>
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="min-w-[220px] text-white/70">Pelapor</TableHead>
                <TableHead className="min-w-[240px] text-white/70">Event</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70">Tanggal</TableHead>
                <TableHead className="text-right text-white/70">Peserta</TableHead>
                <TableHead className="text-right text-white/70">Poin</TableHead>
                <TableHead className="text-right text-white/70">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ report, reporter, event }) => (
                <TableRow key={report.id} className="border-white/10 hover:bg-white/[0.04]">
                  <TableCell>
                    <div className="font-medium text-white">{reporter?.name || 'Unknown'}</div>
                    <div className="text-xs text-white/55">{reporter?.email || report.userId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white">{event?.title || report.eventId}</div>
                    <div className="text-xs text-white/55">{event ? getPillarName(Number(event.pillar)) : 'Event tidak ditemukan'}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-white/80">{formatDate(report.createdAt)}</TableCell>
                  <TableCell className="text-right text-white/85">{Number(report.participants || 0)}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-400">{safePoints(report.points)}</TableCell>
                  <TableCell>
                    {report.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => onVerifyReport(report.id, true)}
                          className="h-8 border border-emerald-300/40 bg-emerald-500 text-white hover:bg-emerald-400 hover:text-black"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onVerifyReport(report.id, false)}
                          className="h-8 border border-red-300/40 bg-red-600 text-white hover:bg-red-500"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-white/60">Selesai</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DatabaseShell>
  );
}
