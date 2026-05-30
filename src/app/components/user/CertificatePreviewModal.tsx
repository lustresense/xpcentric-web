import { CheckCircle2, Download, Loader2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { formatDate } from './userDashboardUtils';
import type { CertificateRecord } from './types';

interface CertificatePreviewModalProps {
  certificate: CertificateRecord;
  downloadingCertificateId: string | null;
  onClose: () => void;
  onDownload: (certificate: CertificateRecord) => void;
}

export function CertificatePreviewModal({
  certificate,
  downloadingCertificateId,
  onClose,
  onDownload,
}: CertificatePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[92vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview Sertifikat</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border-2 border-green-800 bg-[#fbfaf7] p-3 shadow-inner">
            <div className="rounded-xl border border-green-200 bg-white px-4 py-8 text-center sm:px-10 sm:py-12">
              <div className="mx-auto flex w-fit items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-green-800 text-white">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <div className="text-left">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Pemerintah Kota Surabaya</div>
                  <div className="text-lg font-bold text-green-900">SIMRP</div>
                </div>
              </div>

              <div className="mx-auto mt-8 h-0.5 w-24 bg-green-800" />
              <div className="mt-6 text-xs uppercase tracking-[0.45em] text-gray-500">Sertifikat Partisipasi</div>
              <h2 className="mt-4 text-3xl font-extrabold text-green-950 sm:text-5xl">Tanda Penghargaan</h2>
              <div className="mt-8 text-xs uppercase tracking-[0.2em] text-gray-500">Diberikan kepada</div>
              <div className="mx-auto mt-3 max-w-xl border-b border-gray-300 pb-3 text-3xl text-green-950 sm:text-4xl">
                {certificate.userName}
              </div>
              <p className="mt-6 text-sm text-gray-700">atas partisipasi aktif dalam kegiatan</p>
              <div className="mt-2 text-xl font-bold text-green-950">{certificate.eventTitle}</div>
              <div className="mt-1 text-sm text-gray-500">
                Tanggal Kegiatan: {formatDate(certificate.eventDate)}
              </div>

              <div className="mx-auto mt-8 grid h-24 w-24 place-items-center rounded-full bg-green-800 text-white shadow-lg">
                <div>
                  <CheckCircle2 className="mx-auto h-8 w-8" />
                  <div className="mt-1 text-[10px] font-bold uppercase">Verified</div>
                </div>
              </div>

              <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-green-200 bg-green-50/60 p-4 text-left text-xs text-gray-600">
                <div className="flex items-center justify-between gap-4">
                  <span>ID Sertifikat</span>
                  <span className="font-mono text-green-950">{certificate.id}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>Hash Verifikasi</span>
                  <span className="font-mono text-green-950">{certificate.hash}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>Diterbitkan</span>
                  <span>{formatDate(certificate.issuedAt || certificate.eventDate)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span>Verifikasi online</span>
                  <span className="font-mono text-green-950">/certificates/{certificate.id}/verify</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            className="w-full bg-green-700 text-white hover:bg-green-800"
            disabled={downloadingCertificateId === certificate.id}
            onClick={() => onDownload(certificate)}
          >
            {downloadingCertificateId === certificate.id ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengunduh Sertifikat
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Sertifikat
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
