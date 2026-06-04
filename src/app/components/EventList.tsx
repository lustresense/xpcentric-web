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
    // 1: Lingkungan, 2: Ekonomi, 3: Kemasyarakatan, 4: Sosial Budaya
    const pillars = ['Lingkungan', 'Ekonomi', 'Kemasyarakatan', 'Sosial Budaya'];
    return pillars[pillar - 1] || 'Umum';
  };

  const getPillarColor = (pillar: number) => {
    // Colors updated to match main theme logic if needed, but keeping distinct colors for pillars is good.
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
    return colors[pillar - 1] || '#6B7280';
  };

  const getPillarEmoji = (pillar: number) => {
    const emojis = ['🌱', '🤝', '💼', '🛡️'];
    return emojis[pillar - 1] || '📌';
  };

  const handleJoinEvent = async (eventId: string) => {
    setJoiningEventId(eventId);
    
    try {
      await apiPost(`/events/${eventId}/join`, {}, authToken);
      toast.success('Berhasil bergabung dengan event!');
      onEventJoined();
    } catch (err: any) {
      toast.error(err.message || 'Gagal bergabung dengan event');
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
        <h2 className="text-2xl font-bold text-black mb-2">Event Kampung</h2>
        <p className="text-gray-500">Ikuti kegiatan dan kumpulkan poin</p>
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
            {getPillarEmoji(pillar)} {getPillarName(pillar)}
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
                Belum ada event mendatang
                {selectedPillar && ` untuk pilar ${getPillarName(selectedPillar)}`}
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
                        {getPillarEmoji(event.pillar)} {getPillarName(event.pillar)}
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
                        {event.time && ` • ${event.time}`}
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
                       ? 'Full'
                       : joiningEventId === event.id ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Bergabung...
                         </>
                       ) : (
                         'Gabung Event'
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
                Belum ada event selesai
                {selectedPillar && ` untuk pilar ${getPillarName(selectedPillar)}`}
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
                        {getPillarEmoji(event.pillar)} {getPillarName(event.pillar)}
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
