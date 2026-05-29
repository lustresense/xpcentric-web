import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { DatabaseShell, EmptyState, RoleBadge, SearchBox, SortButton, Toolbar, ViewButton } from './AdminDatabaseShared';
import {
  areaLabel,
  compareNumber,
  compareText,
  isAdminUser,
  isStaffUser,
  isVolunteerUser,
  normalize,
  roleBucket,
  roleLabel,
  safePoints,
  selectClassName,
  type SortDirection,
  userRoleCode,
} from './adminDashboardUtils';

type UserView = 'volunteers' | 'staff' | 'admins' | 'all';
type UserSortKey = 'name' | 'role' | 'area' | 'points';

interface AdminUsersDatabaseProps {
  users: any[];
}

export function AdminUsersDatabase({ users }: AdminUsersDatabaseProps) {
  const [view, setView] = useState<UserView>('volunteers');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<'role' | 'area' | 'none'>('role');
  const [sortKey, setSortKey] = useState<UserSortKey>('points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const areas = useMemo(() => {
    return Array.from(new Set(users.map(areaLabel))).sort((a, b) => a.localeCompare(b, 'id-ID'));
  }, [users]);

  const rows = useMemo(() => {
    return users
      .filter((user) => {
        if (view === 'volunteers') return isVolunteerUser(user);
        if (view === 'staff') return isStaffUser(user);
        if (view === 'admins') return isAdminUser(user);
        return true;
      })
      .filter((user) => {
        if (roleFilter === 'all') return true;
        if (roleFilter === 'relawan') return userRoleCode(user) === 'user';
        if (roleFilter === 'ksh') return userRoleCode(user) === 'ksh' || Boolean(user?.isKsh);
        if (roleFilter === 'moderator') return isStaffUser(user);
        if (roleFilter === 'admin') return isAdminUser(user);
        return true;
      })
      .filter((user) => areaFilter === 'all' || areaLabel(user) === areaFilter)
      .filter((user) => {
        if (!query.trim()) return true;
        const haystack = [
          user.name,
          user.email,
          roleLabel(user),
          roleBucket(user),
          user.kecamatan,
          user.kelurahan,
          user.kodepos,
        ]
          .map(normalize)
          .join(' ');
        return haystack.includes(normalize(query));
      })
      .sort((a, b) => {
        if (sortKey === 'points') return compareNumber(safePoints(a.points), safePoints(b.points), sortDirection);
        if (sortKey === 'area') return compareText(areaLabel(a), areaLabel(b), sortDirection);
        if (sortKey === 'role') return compareText(roleLabel(a), roleLabel(b), sortDirection);
        return compareText(a.name, b.name, sortDirection);
      });
  }, [areaFilter, query, roleFilter, sortDirection, sortKey, users, view]);

  const groupedRows = useMemo(() => {
    if (groupBy === 'none') return [['Semua data', rows]] as Array<[string, any[]]>;

    const grouped = new Map<string, any[]>();
    for (const user of rows) {
      const key = groupBy === 'role' ? roleBucket(user) : areaLabel(user);
      grouped.set(key, [...(grouped.get(key) || []), user]);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b, 'id-ID'));
  }, [groupBy, rows]);

  const volunteerCount = users.filter(isVolunteerUser).length;
  const staffCount = users.filter(isStaffUser).length;
  const adminCount = users.filter(isAdminUser).length;

  return (
    <DatabaseShell
      title="Database Pengguna"
      description={`${rows.length} baris tampil dari ${users.length} akun. Relawan, ASN/moderator, dan admin tidak dicampur.`}
    >
      <div className="flex flex-wrap gap-2">
        <ViewButton active={view === 'volunteers'} onClick={() => setView('volunteers')} label="Relawan" count={volunteerCount} />
        <ViewButton active={view === 'staff'} onClick={() => setView('staff')} label="ASN/Moderator" count={staffCount} />
        <ViewButton active={view === 'admins'} onClick={() => setView('admins')} label="Admin" count={adminCount} />
        <ViewButton active={view === 'all'} onClick={() => setView('all')} label="Semua" count={users.length} />
      </div>

      <Toolbar>
        <SearchBox value={query} onChange={setQuery} placeholder="Cari nama, email, role, atau wilayah" />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={selectClassName('lg:w-[170px]')}>
          <option value="all">Semua role</option>
          <option value="relawan">Relawan</option>
          <option value="ksh">KSH</option>
          <option value="moderator">ASN/Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className={selectClassName('lg:w-[180px]')}>
          <option value="all">Semua wilayah</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        <select value={groupBy} onChange={(event) => setGroupBy(event.target.value as 'role' | 'area' | 'none')} className={selectClassName('lg:w-[170px]')}>
          <option value="role">Group: role</option>
          <option value="area">Group: wilayah</option>
          <option value="none">Tanpa group</option>
        </select>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as UserSortKey)} className={selectClassName('lg:w-[160px]')}>
          <option value="points">Sort: poin</option>
          <option value="name">Sort: nama</option>
          <option value="role">Sort: role</option>
          <option value="area">Sort: wilayah</option>
        </select>
        <SortButton direction={sortDirection} onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} />
      </Toolbar>

      {rows.length === 0 ? (
        <EmptyState title="Data tidak ditemukan" description="Ubah pencarian, filter, atau view database." />
      ) : (
        <div className="space-y-4">
          {groupedRows.map(([groupName, groupRows]) => (
            <div key={groupName} className="overflow-hidden rounded-lg border border-white/15">
              <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.05] px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <SlidersHorizontal className="h-4 w-4 text-emerald-300" />
                  {groupName}
                </div>
                <span className="text-xs text-white/65">{groupRows.length} akun</span>
              </div>
              <Table>
                <TableHeader className="bg-black">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="min-w-[260px] text-white/70">Nama</TableHead>
                    <TableHead className="text-white/70">Role</TableHead>
                    <TableHead className="text-white/70">Wilayah</TableHead>
                    <TableHead className="text-white/70">Level</TableHead>
                    <TableHead className="text-right text-white/70">Poin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupRows.map((user) => (
                    <TableRow key={user.id || user.email} className="border-white/10 hover:bg-white/[0.04]">
                      <TableCell>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-white/55">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge user={user} />
                      </TableCell>
                      <TableCell className="text-white/80">
                        <div>{areaLabel(user)}</div>
                        {user.kecamatan && user.kelurahan && (
                          <div className="text-xs text-white/55">{user.kecamatan}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-white/80">Level {user.level || 1}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-400">{safePoints(user.points)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </DatabaseShell>
  );
}
