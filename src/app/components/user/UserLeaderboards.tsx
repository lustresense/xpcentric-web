import { Crown, Users } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { KampungLeaderboardItem } from './types';

interface UserLeaderboardsProps {
  kampungLeaderboard: KampungLeaderboardItem[];
  kampungPernahBantu: any[];
  kampungDibantu: any[];
}

export function UserLeaderboards({
  kampungLeaderboard,
  kampungPernahBantu,
  kampungDibantu,
}: UserLeaderboardsProps) {
  return (
    <div className="space-y-4 pt-2">
      <Card className="border border-green-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-green-800">
            <Crown className="w-6 h-6 text-yellow-500" />
            Leaderboards Kampung
          </CardTitle>
          <CardDescription>Peringkat lengkap performa kampung se-kota.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {kampungLeaderboard.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada data leaderboard.</p>
          ) : (
            kampungLeaderboard.map((item, idx) => (
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

      <Card className="border border-yellow-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
            <Users className="w-5 h-5 text-yellow-500" />
            Kampung Pernah Dibantu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {kampungPernahBantu.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat kampung yang kamu bantu.</p>
          ) : (
            kampungPernahBantu.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-yellow-50">
                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.kecamatan}</div>
                </div>
                <Badge className="bg-yellow-400 text-black">{item.xp} XP</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-green-100">
        <CardHeader>
          <CardTitle className="text-lg text-green-800">Kampung Kamu Pernah Dibantu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {kampungDibantu.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada data kampung yang pernah membantu.</p>
          ) : (
            kampungDibantu.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.kecamatan}</div>
                </div>
                <Badge className="bg-green-600 text-white">{item.xp} XP</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
