import { Gift } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { safePoints } from './userDashboardUtils';
import type { RewardVoucher } from './types';

interface UserRewardsProps {
  rewardCatalog: RewardVoucher[];
  safeCurrentPoints: number;
  onRedeemVoucher: (voucher: RewardVoucher) => void;
}

export function UserRewards({
  rewardCatalog,
  safeCurrentPoints,
  onRedeemVoucher,
}: UserRewardsProps) {
  return (
    <div className="space-y-4 pt-2">
      <Card className="border border-green-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-green-800">
            <Gift className="w-5 h-5 text-yellow-600" />
            Reward Voucher
          </CardTitle>
          <CardDescription>
            Tukar XP menjadi voucher transportasi yang bisa ditukarkan di aplikasi GoBis untuk akses Suroboyo Bus dan layanan terkait.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-100 p-3">
            <p className="text-xs text-green-700">XP Kamu Saat Ini</p>
            <p className="text-2xl font-extrabold text-green-800">{safeCurrentPoints}</p>
          </div>
          {rewardCatalog.length === 0 ? (
            <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-4 text-sm text-green-900">
              Belum ada voucher aktif. Voucher akan muncul setelah admin mengaktifkan katalog dan stok penukaran.
            </div>
          ) : (
            rewardCatalog.map((voucher) => {
              const xpCost = safePoints(voucher.xpCost);
              const disabled = voucher.stock <= 0 || safeCurrentPoints < xpCost;
              const voucherName = String(voucher.name || '').includes('GoBis')
                ? voucher.name
                : String(voucher.name || '').replace('Voucher ', 'Voucher GoBis ');
              const voucherDescription = String(voucher.description || '').toLowerCase().includes('demo')
                ? 'Kode voucher transportasi untuk ditukarkan di aplikasi GoBis sebagai akses tiket Suroboyo Bus dan layanan angkutan publik terkait.'
                : voucher.description;
              return (
                <div key={voucher.id} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm">{voucherName}</div>
                      <div className="text-xs text-gray-500 mt-1">{voucherDescription}</div>
                      <div className="text-xs text-gray-500 mt-1">Stok: {voucher.stock}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-700">{xpCost} XP</div>
                      <Button
                        size="sm"
                        className="mt-2 bg-green-700 text-white hover:bg-green-800"
                        disabled={disabled}
                        onClick={() => onRedeemVoucher(voucher)}
                      >
                        {voucher.stock <= 0 ? 'Habis' : safeCurrentPoints < xpCost ? 'XP Kurang' : 'Tukar'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
