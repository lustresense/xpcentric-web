import { Calendar, Crown, MapPin, TrendingUp } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { PillarRadarChart } from '@/app/components/PillarRadarChart';
import { RankCard } from '@/app/components/RankCard';
import type { KampungLeaderboardItem, UserDashboardPage, UserMode } from './types';

interface UserHomeProps {
  user: any;
  authToken: string | null;
  userMode: UserMode;
  kampungName: string;
  kampungXp: number;
  kampungRelawan: number;
  safeCurrentPoints: number;
  topKampung: KampungLeaderboardItem[];
  leaderboardCount: number;
  reportableEventCount: number;
  onNavigate: (page: UserDashboardPage) => void;
  onOpenReportingWizard: () => void;
}

export function UserHome({
  user,
  authToken,
  userMode,
  kampungName,
  kampungXp,
  kampungRelawan,
  safeCurrentPoints,
  topKampung,
  leaderboardCount,
  reportableEventCount,
  onNavigate,
  onOpenReportingWizard,
}: UserHomeProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0b5d3b] via-[#0f6a43] to-[#14824f] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,214,79,0.35) 0 20%, transparent 22%), radial-gradient(circle at 80% 30%, rgba(255,214,79,0.25) 0 16%, transparent 18%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.18) 0 18%, transparent 20%)',
          }}
        />
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full blur-[70px] opacity-25 -mr-16 -mt-12" />
        <div className="relative z-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-green-100 text-xs uppercase tracking-wide mb-1">Kampung Kamu</p>
            <h2 className="text-2xl font-bold">{kampungName}</h2>
            {userMode === 'ksh' && (
              <Badge className="mt-2 bg-yellow-400 text-black w-fit">KSH Verified</Badge>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-green-100">
              <MapPin className="w-4 h-4" />
              <span>{user?.kecamatan || 'Kecamatan belum terdata'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-xs">XP Kampung</p>
            <div className="text-3xl font-extrabold text-yellow-300">{kampungXp}</div>
            <div className="text-xs text-green-100">Relawan: {kampungRelawan}</div>
          </div>
        </div>
      </div>

      <RankCard role="user" points={safeCurrentPoints} title="Rank Kamu" compact />

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => onNavigate('events')}
          className="h-auto aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-white border border-green-100 shadow-sm hover:shadow-md hover:bg-green-50 text-black rounded-2xl"
        >
          <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="font-semibold">Cari Event</span>
        </Button>
        <Button
          onClick={onOpenReportingWizard}
          disabled={reportableEventCount === 0}
          className="h-auto aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-white border border-yellow-100 shadow-sm hover:shadow-md hover:bg-yellow-50 text-black rounded-2xl"
        >
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="font-semibold">Lapor Kegiatan</span>
          {reportableEventCount === 0 && (
            <span className="text-[11px] text-gray-500 font-normal">Aktif setelah event selesai</span>
          )}
        </Button>
      </div>

      <Card className="border border-green-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <Crown className="w-5 h-5 text-yellow-500" />
                Leaderboard Kampung
              </CardTitle>
              <CardDescription>Peringkat berbasis performa kampung (Top 5)</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => onNavigate('leaderboards')}
            >
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboardCount === 0 ? (
            <p className="text-sm text-gray-500">Belum ada data leaderboard.</p>
          ) : (
            topKampung.map((item, idx) => (
              <div key={`${item.id || item.name}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-green-200 flex items-center justify-center font-bold text-green-700">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.kecamatan}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-green-700">{item.xp} XP</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <PillarRadarChart authToken={authToken} kampungId={user?.kampungId} />
    </div>
  );
}
