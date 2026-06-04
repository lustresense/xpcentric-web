import { useMemo, useState } from 'react';
import { Badge } from '@/app/components/ui/badge';
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
  eventParticipants,
  formatDate,
  getPillarColor,
  getPillarName,
  normalize,
  selectClassName,
  type SortDirection,
} from './adminDashboardUtils';

type EventSortKey = 'date' | 'participants' | 'points' | 'title';

interface AdminEventsDatabaseProps {
  events: any[];
}

export function AdminEventsDatabase({ events }: AdminEventsDatabaseProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [sortKey, setSortKey] = useState<EventSortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const rows = useMemo(() => {
    return events
      .filter((event) => statusFilter === 'all' || normalize(event.status) === statusFilter)
      .filter((event) => pillarFilter === 'all' || String(event.pillar) === pillarFilter)
      .filter((event) => {
        if (!query.trim()) return true;
        const haystack = [
          event.title,
          event.description,
          event.status,
          event.location,
          event.kecamatan,
          event.kelurahan,
          getPillarName(Number(event.pillar)),
        ]
          .map(normalize)
          .join(' ');
        return haystack.includes(normalize(query));
      })
      .sort((a, b) => {
        if (sortKey === 'date') return compareNumber(dateValue(a.date), dateValue(b.date), sortDirection);
        if (sortKey === 'participants') return compareNumber(eventParticipants(a), eventParticipants(b), sortDirection);
        if (sortKey === 'points') return compareNumber(Number(a.basePoints || 0), Number(b.basePoints || 0), sortDirection);
        return compareText(a.title, b.title, sortDirection);
      });
  }, [events, pillarFilter, query, sortDirection, sortKey, statusFilter]);

  return (
    <DatabaseShell title="Database Event" description={`${rows.length} event tampil dari ${events.length} total event.`}>
      <Toolbar>
        <SearchBox value={query} onChange={setQuery} placeholder="Cari judul, pilar, lokasi, atau status" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClassName('lg:w-[170px]')}>
          <option value="all">Semua status</option>
          <option value="draft">Draft</option>
          <option value="published">Terbit</option>
          <option value="upcoming">Mendatang</option>
          <option value="completed">Selesai</option>
        </select>
        <select value={pillarFilter} onChange={(event) => setPillarFilter(event.target.value)} className={selectClassName('lg:w-[180px]')}>
          <option value="all">Semua pilar</option>
          {[1, 2, 3, 4].map((pillar) => (
            <option key={pillar} value={String(pillar)}>
              {getPillarName(pillar)}
            </option>
          ))}
        </select>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as EventSortKey)} className={selectClassName('lg:w-[170px]')}>
          <option value="date">Sort: tanggal</option>
          <option value="participants">Sort: peserta</option>
          <option value="points">Sort: poin</option>
          <option value="title">Sort: judul</option>
        </select>
        <SortButton direction={sortDirection} onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} />
      </Toolbar>

      {rows.length === 0 ? (
        <EmptyState title="Event tidak ditemukan" description="Ubah pencarian atau filter database event." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/15">
          <Table>
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="min-w-[300px] text-white/70">Event</TableHead>
                <TableHead className="text-white/70">Pilar</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70">Tanggal</TableHead>
                <TableHead className="text-white/70">Lokasi</TableHead>
                <TableHead className="text-right text-white/70">Peserta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((event) => (
                <TableRow key={event.id} className="border-white/10 hover:bg-white/[0.04]">
                  <TableCell>
                    <div className="font-medium text-white">{event.title}</div>
                    <div className="max-w-[460px] truncate text-xs text-white/55">{event.description || 'Tanpa deskripsi'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: getPillarColor(Number(event.pillar)) }} className="border-0 text-white">
                      {getPillarName(Number(event.pillar))}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-white/80">{formatDate(event.date)}</TableCell>
                  <TableCell className="text-white/80">
                    <div>{event.location || event.kelurahan || 'Belum diisi'}</div>
                    {event.kecamatan && <div className="text-xs text-white/55">{event.kecamatan}</div>}
                  </TableCell>
                  <TableCell className="text-right text-white/85">
                    {eventParticipants(event)}
                    {event.quota ? <span className="text-white/55"> / {event.quota}</span> : null}
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
