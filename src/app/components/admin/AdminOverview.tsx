import { type ReactNode } from 'react';
import { Award, BarChart3, CalendarDays, FileText, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { EmptyState, RoleBadge, SummaryPill } from './AdminDatabaseShared';
import {
  areaLabel,
  compareText,
  getPillarColor,
  getPillarName,
  isAdminUser,
  isStaffUser,
  isVolunteerUser,
  roleBucket,
  safePoints,
} from './adminDashboardUtils';

interface AdminOverviewProps {
  users: any[];
  events: any[];
  reports: any[];
}

export function AdminOverview({ users, events, reports }: AdminOverviewProps) {
  const volunteers = users.filter(isVolunteerUser);
  const staff = users.filter(isStaffUser);
  const totalVolunteerPoints = volunteers.reduce((sum, volunteer) => sum + safePoints(volunteer.points), 0);
  const pendingReports = reports.filter((report) => report.status === 'pending');
  const upcomingEvents = events.filter((event) => event.status === 'published' || event.status === 'upcoming');
  const topVolunteers = [...volunteers]
    .sort((a, b) => safePoints(b.points) - safePoints(a.points) || compareText(a.name, b.name, 'asc'))
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Relawan Aktif"
          value={volunteers.length}
          helper={`${staff.length} ASN/moderator dipisahkan`}
          tone="text-emerald-500"
          icon={<Users className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard
          title="Poin Relawan"
          value={totalVolunteerPoints}
          helper="Disanitasi agar tidak minus"
          tone="text-amber-400"
          icon={<Award className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Event Aktif"
          value={upcomingEvents.length}
          helper="Status published/upcoming"
          tone="text-blue-500"
          icon={<CalendarDays className="h-4 w-4 text-blue-500" />}
        />
        <MetricCard
          title="Laporan Pending"
          value={pendingReports.length}
          helper="Menunggu verifikasi admin/ASN"
          tone="text-orange-500"
          icon={<FileText className="h-4 w-4 text-orange-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="bg-neutral-950 text-white border-white/15 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-emerald-300" />
              Distribusi Aktivitas per Pilar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((pillar) => {
              const pillarEvents = events.filter((event) => Number(event.pillar) === pillar);
              const percentage = events.length > 0 ? (pillarEvents.length / events.length) * 100 : 0;

              return (
                <div key={pillar}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{getPillarName(pillar)}</span>
                    <span className="text-sm text-white/65">{pillarEvents.length} event</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%`, backgroundColor: getPillarColor(pillar) }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-neutral-950 text-white border-white/15 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-emerald-300" />
              Ringkasan Role
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <SummaryPill label="Relawan" value={volunteers.filter((u) => roleBucket(u) === 'Relawan').length} />
            <SummaryPill label="KSH" value={volunteers.filter((u) => roleBucket(u) === 'KSH').length} />
            <SummaryPill label="ASN/Mod" value={staff.length} />
            <SummaryPill label="Admin" value={users.filter(isAdminUser).length} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-950 text-white border-white/15 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-amber-300" />
            Top 10 Relawan
          </CardTitle>
          <CardDescription className="text-white/65">
            Hanya akun relawan dan KSH yang masuk leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topVolunteers.length === 0 ? (
            <EmptyState title="Belum ada relawan" description="Data relawan akan muncul setelah akun user/KSH tersedia." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/15">
              <Table>
                <TableHeader className="bg-white/[0.03]">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-16 text-white/70">Rank</TableHead>
                    <TableHead className="text-white/70">Nama</TableHead>
                    <TableHead className="text-white/70">Role</TableHead>
                    <TableHead className="text-white/70">Wilayah</TableHead>
                    <TableHead className="text-right text-white/70">Poin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVolunteers.map((volunteer, index) => (
                    <TableRow key={volunteer.id || volunteer.email} className="border-white/10 hover:bg-white/[0.04]">
                      <TableCell className="text-white/80">#{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{volunteer.name}</div>
                        <div className="text-xs text-white/55">{volunteer.email}</div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge user={volunteer} />
                      </TableCell>
                      <TableCell className="text-white/80">{areaLabel(volunteer)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-400">{safePoints(volunteer.points)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  tone,
  icon,
}: {
  title: string;
  value: number;
  helper: string;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <Card className="bg-neutral-950 text-white border-white/15 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${tone}`}>{value}</div>
        <p className="mt-1 text-xs text-white/60">{helper}</p>
      </CardContent>
    </Card>
  );
}
