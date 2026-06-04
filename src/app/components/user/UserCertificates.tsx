import { Download, FileCheck2, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { CertificateRecord } from './types';

interface UserCertificatesProps {
  certificates: CertificateRecord[];
  downloadingCertificateId: string | null;
  onSelectCertificate: (certificate: CertificateRecord) => void;
  onDownloadCertificate: (certificate: CertificateRecord) => void;
}

export function UserCertificates({
  certificates,
  downloadingCertificateId,
  onSelectCertificate,
  onDownloadCertificate,
}: UserCertificatesProps) {
  return (
    <div className="space-y-4 pt-2">
      <Card className="border border-green-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-green-800">
            <FileCheck2 className="w-5 h-5 text-green-700" />
            Sertifikat Digital
          </CardTitle>
          <CardDescription>Sertifikat terbit otomatis saat laporan kegiatan disetujui.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {certificates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-4 text-sm text-green-900">
              Belum ada sertifikat. Sertifikat akan terbit otomatis setelah laporan kegiatan kamu disetujui.
            </div>
          ) : (
            certificates.map((cert) => (
              <div key={cert.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{cert.eventTitle}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(cert.eventDate).toLocaleDateString('id-ID')} - Hash {cert.hash}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onSelectCertificate(cert)}>
                      Lihat
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-700 text-white hover:bg-green-800"
                      disabled={downloadingCertificateId === cert.id}
                      onClick={() => onDownloadCertificate(cert)}
                    >
                      {downloadingCertificateId === cert.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengunduh
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
