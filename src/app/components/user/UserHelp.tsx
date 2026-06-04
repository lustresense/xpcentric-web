import { AlertTriangle, CheckCircle2, FileText, Gift, HelpCircle, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { UserDashboardPage } from './types';

interface UserHelpProps {
  user: any;
  onNavigate: (page: UserDashboardPage) => void;
}

const supportTopics = [
  {
    title: 'Masalah login',
    description: 'Pastikan email benar, kata sandi tidak typo, dan backend sedang aktif. Jika lupa sandi, hubungi admin wilayah untuk reset manual demo/pilot.',
    icon: ShieldCheck,
  },
  {
    title: 'Belum bisa lapor kegiatan',
    description: 'Laporan baru bisa dibuat setelah kamu ikut kegiatan, ditandai hadir, dan kegiatan sudah selesai.',
    icon: FileText,
  },
  {
    title: 'Sertifikat belum muncul',
    description: 'Sertifikat terbit otomatis setelah laporan disetujui moderator/admin. Cek menu Event Saya untuk melihat status laporan.',
    icon: CheckCircle2,
  },
  {
    title: 'Voucher tidak bisa ditukar',
    description: 'Pastikan XP cukup dan stok voucher masih tersedia. Voucher GoBis di prototype ini masih simulasi untuk kebutuhan demo.',
    icon: Gift,
  },
];

export function UserHelp({ user, onNavigate }: UserHelpProps) {
  const area = [user?.kelurahan, user?.kecamatan].filter(Boolean).join(', ') || 'Wilayah belum terdata';
  const adminHint = user?.role === 'ksh'
    ? 'Koordinasikan kendala relawan area kamu ke admin atau ASN pendamping.'
    : 'Hubungi KSH, ASN pendamping, atau admin wilayah saat butuh bantuan akun dan laporan.';

  return (
    <div className="space-y-4 pt-2">
      <Card className="border border-green-100 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-green-900">
            <HelpCircle className="h-5 w-5 text-green-700" />
            Pusat Bantuan
          </CardTitle>
          <CardDescription>
            Panduan singkat saat akun, laporan, sertifikat, atau voucher perlu dicek.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-green-950">
          <div className="rounded-xl border border-green-100 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-green-700">Kontak wilayah</div>
            <div className="mt-1 font-semibold">{area}</div>
            <p className="mt-2 text-green-800">{adminHint}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Jangan kirim password melalui chat umum. Untuk demo/pilot, reset akun dilakukan manual oleh operator yang berwenang.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {supportTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card key={topic.title} className="border border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-green-900">
                  <Icon className="h-4 w-4 text-green-700" />
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {topic.description}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-green-900">
            <Mail className="h-5 w-5 text-green-700" />
            Langkah cepat
          </CardTitle>
          <CardDescription>Pilih menu yang sesuai dengan masalah kamu.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="justify-start border-green-200 text-green-800 hover:bg-green-50" onClick={() => onNavigate('events')}>
            Cari kegiatan
          </Button>
          <Button variant="outline" className="justify-start border-green-200 text-green-800 hover:bg-green-50" onClick={() => onNavigate('my-events')}>
            Cek laporan saya
          </Button>
          <Button variant="outline" className="justify-start border-green-200 text-green-800 hover:bg-green-50" onClick={() => onNavigate('certificates')}>
            Lihat sertifikat
          </Button>
          <Button variant="outline" className="justify-start border-green-200 text-green-800 hover:bg-green-50" onClick={() => onNavigate('rewards')}>
            Cek voucher
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
