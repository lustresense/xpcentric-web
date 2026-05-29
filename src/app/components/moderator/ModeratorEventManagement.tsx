import { Dispatch, SetStateAction } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { CheckCircle, FileText, Lightbulb, ShieldCheck, XCircle } from 'lucide-react';
import { GeoKecamatan, GeoKelurahan, ModeratorEventForm } from './useModeratorDashboardData';

interface Tier1EventInputProps {
  eventForm: ModeratorEventForm;
  setEventForm: Dispatch<SetStateAction<ModeratorEventForm>>;
  geoOptions: GeoKecamatan[];
  kelurahanOptions: GeoKelurahan[];
  draftEvents: any[];
  user: any;
  submittingEvent: boolean;
  editingEventId: string | null;
  onSubmit: () => void;
  onEditDraftEvent: (event: any) => void;
  onCancelEdit: () => void;
}

interface EventApprovalQueueProps {
  draftEvents: any[];
  approvedEvents: any[];
  onEventApproval: (eventId: string, approved: boolean) => void;
  onEventPublish: (eventId: string) => void;
}

export function Tier1EventInput({
  eventForm,
  setEventForm,
  geoOptions,
  kelurahanOptions,
  draftEvents,
  user,
  submittingEvent,
  editingEventId,
  onSubmit,
  onEditDraftEvent,
  onCancelEdit,
}: Tier1EventInputProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Input Kegiatan Tier 1
        </CardTitle>
        <CardDescription>ASN Pendamping hanya bisa input kegiatan sebagai draft.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">Judul</label>
              <Input
                value={eventForm.title}
                onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Contoh: Kerja Bakti RW 05"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Deskripsi</label>
              <Input
                value={eventForm.description}
                onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Deskripsi singkat kegiatan"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Pilar</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: '1', label: 'Lingkungan' },
                  { id: '2', label: 'Ekonomi' },
                  { id: '3', label: 'Kemasyarakatan' },
                  { id: '4', label: 'Sosial Budaya' },
                ].map((pillar) => (
                  <Button
                    key={pillar.id}
                    type="button"
                    variant={eventForm.pillar === pillar.id ? 'default' : 'outline'}
                    className={eventForm.pillar === pillar.id ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                    onClick={() => setEventForm((prev) => ({ ...prev, pillar: pillar.id }))}
                  >
                    {pillar.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Skala Kegiatan</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  type="button"
                  variant={eventForm.scopeType === 'kelurahan' ? 'default' : 'outline'}
                  className={eventForm.scopeType === 'kelurahan' ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                  onClick={() => setEventForm((prev) => ({ ...prev, scopeType: 'kelurahan' }))}
                >
                  Kelurahan
                </Button>
                <Button
                  type="button"
                  variant={eventForm.scopeType === 'kecamatan' ? 'default' : 'outline'}
                  className={eventForm.scopeType === 'kecamatan' ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                  onClick={() => setEventForm((prev) => ({ ...prev, scopeType: 'kecamatan', kelurahanId: '' }))}
                >
                  Kecamatan
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Kecamatan</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3 text-sm"
                  value={eventForm.kecamatanId}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, kecamatanId: event.target.value, kelurahanId: '' }))}
                >
                  <option value="">Pilih kecamatan</option>
                  {geoOptions.map((kecamatan) => (
                    <option key={kecamatan.id} value={String(kecamatan.id)}>
                      {kecamatan.name}
                    </option>
                  ))}
                </select>
              </div>
              {eventForm.scopeType === 'kelurahan' && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Kelurahan</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3 text-sm"
                    value={eventForm.kelurahanId}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, kelurahanId: event.target.value }))}
                  >
                    <option value="">Pilih kelurahan</option>
                    {kelurahanOptions.map((kelurahan) => (
                      <option key={kelurahan.id} value={String(kelurahan.id)}>
                        {kelurahan.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Tanggal</label>
                <Input
                  type="date"
                  value={eventForm.date}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, date: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Waktu</label>
                <Input
                  value={eventForm.time}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, time: event.target.value }))}
                  placeholder="07:00"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Lokasi</label>
              <Input
                value={eventForm.location}
                onChange={(event) => setEventForm((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="Balai RW / aula kampung"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Kuota</label>
              <Input
                type="number"
                min={0}
                value={String(eventForm.quota)}
                onChange={(event) => setEventForm((prev) => ({ ...prev, quota: Number(event.target.value || 0) }))}
                placeholder="0"
              />
            </div>
            <Button
              onClick={onSubmit}
              disabled={submittingEvent}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {submittingEvent ? 'Menyimpan...' : editingEventId ? 'Update Draft Kegiatan' : 'Simpan Draft Kegiatan'}
            </Button>
            {editingEventId && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Batal Edit
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {draftEvents.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada draft kegiatan terbaru.</div>
            ) : (
              draftEvents.slice(0, 5).map((eventItem) => (
                <div key={eventItem.id} className="p-3 rounded-lg bg-cyan-50">
                  <div className="font-semibold text-sm">{eventItem.title}</div>
                  <div className="text-xs text-gray-600">
                    {eventItem.scopeType === 'kecamatan' ? 'Skala Kecamatan' : 'Skala Kelurahan'} - {eventItem.kecamatan}
                    {eventItem.kelurahan ? ` / ${eventItem.kelurahan}` : ''}
                  </div>
                  <div className="text-xs text-gray-600">{eventItem.date || 'Tanggal belum diatur'}</div>
                  {(eventItem.createdByUserId === user?.id || user?.role === 'admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onEditDraftEvent(eventItem)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventApprovalQueue({
  draftEvents,
  approvedEvents,
  onEventApproval,
  onEventPublish,
}: EventApprovalQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Kegiatan & Approval
        </CardTitle>
        <CardDescription>Tier 2 memverifikasi kegiatan.</CardDescription>
      </CardHeader>
      <CardContent>
        {draftEvents.length === 0 && approvedEvents.length === 0 ? (
          <div className="text-sm text-gray-500">Tidak ada kegiatan menunggu approval atau publish.</div>
        ) : (
          <div className="space-y-4">
            {draftEvents.length > 0 && (
              <div className="space-y-3">
                {draftEvents.map((eventItem) => (
                  <div key={eventItem.id} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{eventItem.title}</div>
                        <div className="text-xs text-gray-500">
                          {eventItem.scopeType === 'kecamatan' ? 'Skala Kecamatan' : 'Skala Kelurahan'} - {eventItem.kecamatan}
                          {eventItem.kelurahan ? ` / ${eventItem.kelurahan}` : ''}
                        </div>
                        <div className="text-xs text-gray-500">{eventItem.date}</div>
                      </div>
                      <Badge className="bg-yellow-400 text-black">Draft</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => onEventApproval(eventItem.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => onEventApproval(eventItem.id, false)}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {approvedEvents.length > 0 && (
              <div className="space-y-3">
                {approvedEvents.map((eventItem) => (
                  <div key={eventItem.id} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{eventItem.title}</div>
                        <div className="text-xs text-gray-500">
                          {eventItem.scopeType === 'kecamatan' ? 'Skala Kecamatan' : 'Skala Kelurahan'} - {eventItem.kecamatan}
                          {eventItem.kelurahan ? ` / ${eventItem.kelurahan}` : ''}
                        </div>
                        <div className="text-xs text-gray-500">{eventItem.date}</div>
                      </div>
                      <Badge className="bg-emerald-500 text-white">Approved</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => onEventPublish(eventItem.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Publish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
