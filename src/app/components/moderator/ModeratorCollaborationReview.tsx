import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { CheckCircle, Handshake, XCircle } from 'lucide-react';

interface ModeratorCollaborationReviewProps {
  pendingCollaborationRequests: any[];
  onCollaborationApproval: (requestId: string, approved: boolean) => void;
}

export function ModeratorCollaborationReview({
  pendingCollaborationRequests,
  onCollaborationApproval,
}: ModeratorCollaborationReviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="w-5 h-5" />
          Permintaan Kolaborasi
        </CardTitle>
        <CardDescription>
          Sponsor Submit - collaboration_request - Tier 2 review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingCollaborationRequests.length === 0 ? (
          <div className="text-sm text-gray-500">Tidak ada permintaan kolaborasi pending.</div>
        ) : (
          <div className="space-y-3">
            {pendingCollaborationRequests.map((request) => (
              <div key={request.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{request.organizationName}</div>
                    <div className="text-xs text-gray-500">PIC: {request.picName} - {request.email}</div>
                  </div>
                  <Badge className="bg-yellow-400 text-black">Pending</Badge>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <span className="font-semibold">Jenis Dukungan:</span>{' '}
                  {request.supportType === 'media_partner' ? 'Media partner' : request.supportType}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  <span className="font-semibold">Skala:</span>{' '}
                  {request.contributionScope === 'kota'
                    ? 'Kota'
                    : request.contributionScope === 'kecamatan'
                      ? `Kecamatan${request.scopeKecamatanName ? ` - ${request.scopeKecamatanName}` : ''}`
                      : `Kelurahan${request.scopeKelurahanName ? ` - ${request.scopeKelurahanName}` : ''}${
                          request.scopeKecamatanName ? ` (${request.scopeKecamatanName})` : ''
                        }`}
                </div>
                <p className="mt-1 text-sm text-gray-700">{request.supportDescription}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => onCollaborationApproval(request.id, true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onCollaborationApproval(request.id, false)}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
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
