import { type ReactNode } from 'react';
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle,
  Clock,
  Search,
  TableProperties,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { normalize, roleBucket, roleLabel, type SortDirection } from './adminDashboardUtils';

export function DatabaseShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="bg-neutral-950 text-white border-white/15 shadow-none">
      <CardHeader className="border-b border-white/15">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TableProperties className="h-4 w-4 text-emerald-300" />
              {title}
            </CardTitle>
            <CardDescription className="text-white/65">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">{children}</CardContent>
    </Card>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/15 bg-neutral-900 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex-row lg:items-center">
      {children}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/80" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 border-white/20 bg-black pl-9 text-sm font-medium text-white placeholder:text-white/50 hover:border-white/35 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/25"
      />
    </div>
  );
}

export function SortButton({
  direction,
  onClick,
}: {
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-9 border-emerald-400/45 bg-emerald-500/15 text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500 hover:text-white"
    >
      <ArrowUpDown className="mr-2 h-4 w-4" />
      {direction === 'asc' ? 'Naik' : 'Turun'}
    </Button>
  );
}

export function SummaryPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-white/15 bg-black px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-white/55">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

export function ViewButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-md border px-3 py-2 text-sm transition-colors',
        active
          ? 'border-emerald-300/70 bg-emerald-500 text-white shadow-[0_0_0_1px_rgba(110,231,183,0.18)]'
          : 'border-white/15 bg-neutral-900 text-white/75 hover:border-white/30 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {label}
      <span className={active ? 'ml-2 text-white/80' : 'ml-2 text-white/55'}>{count}</span>
    </button>
  );
}

export function RoleBadge({ user }: { user: any }) {
  const bucket = roleBucket(user);
  const className =
    bucket === 'Admin'
      ? 'border-purple-300/45 bg-purple-500/25 text-purple-100'
      : bucket === 'ASN/Moderator'
        ? 'border-blue-300/45 bg-blue-500/25 text-blue-100'
        : bucket === 'KSH'
          ? 'border-cyan-300/45 bg-cyan-500/25 text-cyan-100'
          : 'border-emerald-300/45 bg-emerald-500/25 text-emerald-100';

  return (
    <Badge variant="outline" className={className}>
      {roleLabel(user)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = normalize(status);
  if (normalized === 'verified' || normalized === 'published' || normalized === 'completed') {
    return (
      <Badge variant="outline" className="border-emerald-300/45 bg-emerald-500/25 text-emerald-100">
        <CheckCircle className="h-3 w-3" />
        {normalized === 'published' ? 'Published' : normalized === 'completed' ? 'Selesai' : 'Terverifikasi'}
      </Badge>
    );
  }
  if (normalized === 'upcoming') {
    return (
      <Badge variant="outline" className="border-blue-300/45 bg-blue-500/25 text-blue-100">
        <CalendarDays className="h-3 w-3" />
        Upcoming
      </Badge>
    );
  }
  if (normalized === 'rejected') {
    return (
      <Badge variant="outline" className="border-red-300/45 bg-red-500/25 text-red-100">
        <XCircle className="h-3 w-3" />
        Ditolak
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-300/45 bg-amber-500/25 text-amber-100">
      <Clock className="h-3 w-3" />
      {normalized === 'draft' ? 'Draft' : 'Pending'}
    </Badge>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/20 bg-black px-4 py-10 text-center">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/60">{description}</div>
    </div>
  );
}
