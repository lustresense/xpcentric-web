import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { apiGet } from '@/lib/api';

interface PillarRadarChartProps {
  authToken: string | null;
  kampungId?: number | string | null;
}

type PillarPayload = {
  lingkungan: number;
  ekonomi: number;
  kemasyarakatan: number;
  sosialBudaya: number;
};

const EMPTY_PILLARS: PillarPayload = {
  lingkungan: 0,
  ekonomi: 0,
  kemasyarakatan: 0,
  sosialBudaya: 0,
};

export function PillarRadarChart({ authToken, kampungId }: PillarRadarChartProps) {
  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState<PillarPayload>(EMPTY_PILLARS);

  useEffect(() => {
    const fetchPillars = async () => {
      if (!kampungId) {
        setPillars(EMPTY_PILLARS);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await apiGet(`/kampung/${kampungId}/pillars`, authToken);
        setPillars({
          lingkungan: Number(data?.pillars?.lingkungan || 0),
          ekonomi: Number(data?.pillars?.ekonomi || 0),
          kemasyarakatan: Number(data?.pillars?.kemasyarakatan || 0),
          sosialBudaya: Number(data?.pillars?.sosialBudaya || 0),
        });
      } catch {
        setPillars(EMPTY_PILLARS);
      } finally {
        setLoading(false);
      }
    };

    fetchPillars();
  }, [authToken, kampungId]);

  const chartData = [
    { subject: 'Lingkungan', value: pillars.lingkungan },
    { subject: 'Ekonomi', value: pillars.ekonomi },
    { subject: 'Kemasyarakatan', value: pillars.kemasyarakatan },
    { subject: 'Sosial Budaya', value: pillars.sosialBudaya },
  ];
  const maxValue = Math.max(...chartData.map((item) => item.value), 100);
  const hasData = chartData.some((item) => item.value > 0);

  return (
    <Card className="border border-green-100">
      <CardHeader>
        <CardTitle className="text-lg text-green-800">Radar Empat Pilar</CardTitle>
        <CardDescription>Distribusi XP kampung per pilar program.</CardDescription>
      </CardHeader>
      <CardContent>
        {!kampungId ? (
          <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">Belum ada data kampung untuk ditampilkan.</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Memuat data pilar...</span>
          </div>
        ) : !hasData ? (
          <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">Belum ada data pilar.</div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#d1d5db" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#374151' }} />
                <PolarRadiusAxis domain={[0, maxValue]} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Radar dataKey="value" stroke="#0f6a43" fill="#22c55e" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
