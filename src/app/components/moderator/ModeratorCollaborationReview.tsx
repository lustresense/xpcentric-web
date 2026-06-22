import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { CheckCircle, Handshake, XCircle } from 'lucide-react';

interface ModeratorCollaborationReviewProps {
  pendingCollaborationRequests: any[];
  onCollaborationApproval: (requestId: string, approved: boolean) => void;
  variant?: 'light' | 'dark';
}

export function ModeratorCollaborationReview({
  pendingCollaborationRequests,
  onCollaborationApproval,
  variant = 'light',
}: ModeratorCollaborationReviewProps) {
  const isDark = variant === 'dark';

  return (
    <Card className={isDark ? 'border-white/10 bg-neutral-950 text-white shadow-none' : undefined}>
      <CardHeader className={isDark ? 'border-b border-white/10' : undefined}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="w-5 h-5" />
          Permintaan Kolaborasi
        </CardTitle>
        <CardDescription className={isDark ? 'text-white/60' : undefined}>
          Tinjau pengajuan dukungan mitra sesuai kewenangan wilayah.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingCollaborationRequests.length === 0 ? (
          <div
            className={
              isDark
                ? 'rounded-lg border border-dashed border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100'
                : 'rounded-lg border border-dashed border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900'
            }
          >
            Tidak ada permintaan kolaborasi yang menunggu peninjauan. Pengajuan mitra baru akan muncul di sini.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCollaborationRequests.map((request) => (
              <div
                key={request.id}
                className={
                  isDark
                    ? 'rounded-xl border border-white/10 bg-black/70 p-4 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
                    : 'rounded-lg border bg-white p-3'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{request.organizationName || 'Organisasi tanpa nama'}</div>
                    <div className={isDark ? 'text-xs text-white/55' : 'text-xs text-gray-500'}>
                      PIC: {request.picName || '-'} - {request.email || '-'}
                    </div>
                  </div>
                  <Badge className="border border-amber-300/35 bg-amber-300 text-black">Menunggu</Badge>
                </div>
                <div className={isDark ? 'mt-3 text-sm text-white/75' : 'mt-3 text-sm text-gray-700'}>
                  <span className="font-semibold">Jenis Dukungan:</span>{' '}
                  {request.supportType === 'media_partner' ? 'Media partner' : request.supportType}
                </div>
                <div className={isDark ? 'mt-1 text-sm text-white/75' : 'mt-1 text-sm text-gray-700'}>
                  <span className="font-semibold">Skala:</span>{' '}
                  {request.contributionScope === 'kota'
                    ? 'Kota'
                    : request.contributionScope === 'kecamatan'
                      ? `Kecamatan${request.scopeKecamatanName ? ` - ${request.scopeKecamatanName}` : ''}`
                      : `Kelurahan${request.scopeKelurahanName ? ` - ${request.scopeKelurahanName}` : ''}${
                          request.scopeKecamatanName ? ` (${request.scopeKecamatanName})` : ''
                        }`}
                </div>
                <p className={isDark ? 'mt-1 text-sm text-white/70' : 'mt-1 text-sm text-gray-700'}>
                  {request.supportDescription || 'Tidak ada deskripsi dukungan.'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => onCollaborationApproval(request.id, true)}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onCollaborationApproval(request.id, false)}
                    className="flex-1 bg-red-700 text-white hover:bg-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
