import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react';

interface PendingReportReviewProps {
  pendingReports: any[];
  users: any[];
  onVerifyReport: (reportId: string, approved: boolean) => void;
}

interface VerifiedReportListProps {
  verifiedReports: any[];
  users: any[];
}

const formatOutcomeTag = (tag: string) => {
  if (tag === 'resolved') return 'Masalah Teratasi';
  if (tag === 'followup') return 'Butuh Tindak Lanjut';
  if (tag === 'economic') return 'Transaksi Ekonomi';
  if (tag === 'participation') return 'Partisipasi Meningkat';
  return tag;
};

export function PendingReportReview({ pendingReports, users, onVerifyReport }: PendingReportReviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Laporan Menunggu Verifikasi
        </CardTitle>
        <CardDescription>{pendingReports.length} laporan perlu ditinjau</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Tidak ada laporan yang menunggu verifikasi
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReports.map((report) => {
              const reporter = users.find((user) => user.id === report.userId);

              return (
                <div key={report.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{reporter?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <Badge className="bg-yellow-500">Pending</Badge>
                  </div>

                  {report.photoUrl && (
                    <img
                      src={report.photoUrl}
                      alt="Bukti Kegiatan"
                      className="w-full h-64 object-cover rounded-lg mb-3"
                    />
                  )}

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Peserta:</span>
                      <span>{report.participants} orang</span>
                    </div>

                    {report.outcomeTags?.length > 0 && (
                      <div>
                        <span className="font-semibold">Dampak:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.outcomeTags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {formatOutcomeTag(tag)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => onVerifyReport(report.id, true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Setujui (+50 poin)
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onVerifyReport(report.id, false)}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VerifiedReportList({ verifiedReports, users }: VerifiedReportListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Laporan Terverifikasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verifiedReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada laporan terverifikasi
          </div>
        ) : (
          <div className="space-y-3">
            {verifiedReports.slice(0, 10).map((report) => {
              const reporter = users.find((user) => user.id === report.userId);

              return (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{reporter?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">Verified</Badge>
                    <div className="text-xs text-gray-500 mt-1">{report.points} poin</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
