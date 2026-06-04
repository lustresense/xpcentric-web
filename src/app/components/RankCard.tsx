import { Award, TrendingUp } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { getPointMultiplier, getProgressToNextLevel } from '@/data/levelingSystem';

interface RankCardProps {
  role?: 'user' | 'moderator' | 'admin';
  points?: number;
  title?: string;
  compact?: boolean;
}

export function RankCard({ role = 'user', points = 0, title = 'Rank Relawan', compact = false }: RankCardProps) {
  const safePoints = Number.isFinite(Number(points)) ? Math.max(0, Number(points)) : 0;
  const progress = getProgressToNextLevel(role, safePoints);
  const multiplier = getPointMultiplier(role, safePoints);
  const tone = role === 'admin'
    ? {
        border: 'border-slate-200',
        soft: 'bg-slate-50',
        text: 'text-slate-900',
        accent: 'text-slate-700',
        badge: 'bg-slate-900 text-white',
      }
    : role === 'moderator'
      ? {
          border: 'border-cyan-100',
          soft: 'bg-cyan-50',
          text: 'text-cyan-950',
          accent: 'text-cyan-700',
          badge: 'bg-cyan-700 text-white',
        }
      : {
          border: 'border-green-100',
          soft: 'bg-green-50',
          text: 'text-green-950',
          accent: 'text-green-700',
          badge: 'bg-green-700 text-white',
        };

  return (
    <Card className={`${tone.border} ${compact ? '' : 'shadow-sm'}`}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : 'text-lg'} ${tone.text}`}>
          <Award className={`h-5 w-5 ${tone.accent}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-xl ${tone.soft} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Level {progress.current.level}</p>
              <p className={`text-xl font-extrabold ${tone.text}`}>{progress.current.name}</p>
            </div>
            <Badge className={tone.badge}>{safePoints} poin</Badge>
          </div>
          <div className="mt-4">
            <Progress value={progress.progress} className="h-2" />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
              <span>{Math.round(progress.progress)}% menuju level berikutnya</span>
              <span>{progress.next ? `${progress.pointsNeeded} poin lagi` : 'Level maksimum'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-gray-500">Berikutnya</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{progress.next?.name || 'Tertinggi'}</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-gray-500">Multiplier</p>
            <p className={`mt-1 flex items-center gap-1 text-sm font-bold ${tone.accent}`}>
              <TrendingUp className="h-4 w-4" />
              {multiplier.toFixed(1)}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
