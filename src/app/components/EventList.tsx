import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Calendar, MapPin, Users, Star, Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';

interface EventListProps {
  events: any[];
  authToken: string | null;
  onEventJoined: () => void;
  canJoin?: boolean;
}

export function EventList({ events, authToken, onEventJoined, canJoin = true }: EventListProps) {
  const [selectedPillar, setSelectedPillar] = useState<number | null>(null);
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);

  const getPillarName = (pillar: number) => {
    const pillars = ['Lingkungan', 'Gotong Royong', 'Ekonomi Kreatif', 'Keamanan'];
    return pillars[pillar - 1] || 'Umum';
  };

  const getPillarColor = (pillar: number) => {
    // Colors updated to match main theme logic if needed, but keeping distinct colors for pillars is good.
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
    return colors[pillar - 1] || '#6B7280';
  };

  const getPillarCode = (pillar: number) => {
    return `P${pillar}`;
  };

  const handleJoinEvent = async (eventId: string) => {
    setJoiningEventId(eventId);
    
    try {
      await apiPost(`/events/${eventId}/join`, {}, authToken);
      toast.success('Berhasil ikut kegiatan.');
      onEventJoined();
    } catch (err: any) {
      toast.error(err.message || 'Gagal ikut kegiatan');
    } finally {
      setJoiningEventId(null);
    }
  };

  const filteredEvents = selectedPillar 
    ? events.filter(e => e.pillar === selectedPillar)
    : events;

  const upcomingEvents = filteredEvents.filter(e => e.status === 'published');
  const completedEvents = filteredEvents.filter(e => e.status === 'completed');

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Kegiatan Kampung</h2>
        <p className="text-gray-500">Pilih kegiatan di wilayah kamu, lalu kumpulkan XP setelah hadir dan melapor.</p>
      </div>

      {/* Pillar Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          size="sm"
          variant={selectedPillar === null ? 'default' : 'outline'}
          onClick={() => setSelectedPillar(null)}
          className={selectedPillar === null ? 'bg-black text-[#FFC107] font-bold border-black' : 'border-gray-300 text-gray-600'}
        >
          Semua
        </Button>
        {[1, 2, 3, 4].map((pillar) => (
          <Button
            key={pillar}
            size="sm"
            variant={selectedPillar === pillar ? 'default' : 'outline'}
            onClick={() => setSelectedPillar(pillar)}
            style={{
              backgroundColor: selectedPillar === pillar ? getPillarColor(pillar) : undefined,
              borderColor: getPillarColor(pillar)
            }}
          >
            {getPillarCode(pillar)} {getPillarName(pillar)}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                Belum ada kegiatan mendatang
                {selectedPillar && ` untuk pilar ${getPillarName(selectedPillar)}`}. Cek lagi setelah ASN atau admin menerbitkan kegiatan baru.
              </CardContent>
            </Card>
          ) : (
            upcomingEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                      <Badge 
                        style={{ backgroundColor: getPillarColor(event.pillar) }}
                        className="text-white"
                      >
                        {getPillarCode(event.pillar)} {getPillarName(event.pillar)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[#FDB913] font-bold">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="text-lg">{event.basePoints || 10}</span>
                      </div>
                      <div className="text-xs text-gray-500">poin</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {event.time && ` - ${event.time}`}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                     {event.participants && (
                       <div className="flex items-center gap-2 text-gray-600">
                         <Users className="w-4 h-4" />
                         <span>
                           {event.participants.length} peserta
                           {event.quota ? ` / ${event.quota}` : ''}
                         </span>
                       </div>
                     )}
                  </div>

                   <Button
                     onClick={() => handleJoinEvent(event.id)}
                     disabled={joiningEventId === event.id || !canJoin || (event.quota > 0 && event.participants?.length >= event.quota)}
                     className="w-full bg-[#FFC107] text-black hover:bg-[#FFD54F] font-bold"
                   >
                     {event.quota > 0 && event.participants?.length >= event.quota
                       ? 'Kuota penuh'
                       : joiningEventId === event.id ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Mendaftarkan...
                         </>
                       ) : (
                         'Ikut Kegiatan'
                       )}
                   </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                Belum ada kegiatan selesai
                {selectedPillar && ` untuk pilar ${getPillarName(selectedPillar)}`}. Kegiatan selesai akan muncul setelah KSH/ASN menutup daftar hadir.
              </CardContent>
            </Card>
          ) : (
            completedEvents.map((event) => (
              <Card key={event.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                      <Badge 
                        style={{ backgroundColor: getPillarColor(event.pillar) }}
                        className="text-white"
                      >
                        {getPillarCode(event.pillar)} {getPillarName(event.pillar)}
                      </Badge>
                    </div>
                    <Badge variant="secondary">Selesai</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  
                  {event.participants && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.participants.length} peserta</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
