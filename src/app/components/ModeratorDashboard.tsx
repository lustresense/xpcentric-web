import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { FileText, LayoutGrid, ShieldCheck, Lightbulb, BarChart3, Users, Handshake, User as UserIcon } from 'lucide-react';
import { FloatingNavbar } from '@/app/components/ui/FloatingNavbar';
import { UserProfile } from '@/app/components/UserProfile';
import { ModeratorCollaborationReview } from '@/app/components/moderator/ModeratorCollaborationReview';
import { EventApprovalQueue, Tier1EventInput } from '@/app/components/moderator/ModeratorEventManagement';
import { PendingReportReview, VerifiedReportList } from '@/app/components/moderator/ModeratorReportReview';
import { useModeratorDashboardData } from '@/app/components/moderator/useModeratorDashboardData';

interface ModeratorDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  onNavigate: (page: any) => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
  moderatorTier: 1 | 2 | 3;
}

export function ModeratorDashboard({ user, authToken, onLogout, onNavigate, currentView, onViewChange, moderatorTier }: ModeratorDashboardProps) {
  const [activePage, setActivePage] = useState<string>('overview');

  useEffect(() => {
    const next = moderatorTier === 1 ? "monitor" : moderatorTier === 2 ? "verify" : "aggregate";
    setActivePage(next);
  }, [moderatorTier]);

  const {
    reports,
    users,
    eventForm,
    setEventForm,
    submittingEvent,
    editingEventId,
    geoOptions,
    kelurahanOptions,
    pendingReports,
    verifiedReports,
    draftEvents,
    approvedEvents,
    pendingCollaborationRequests,
    visibleUsers,
    handleVerifyReport,
    handleEventApproval,
    handleEventPublish,
    handleCollaborationApproval,
    handleCreateTier1Event,
    handleEditDraftEvent,
    resetEventForm,
  } = useModeratorDashboardData({
    user,
    authToken,
    onLogout,
    moderatorTier,
    onEditDraftEvent: () => setActivePage('rekom'),
  });

  return (
    <div className="size-full flex flex-col bg-white">
      <FloatingNavbar
        user={user}
        authToken={authToken}
        activePage={activePage}
        onLogout={onLogout}
        onNavigate={(page) => setActivePage(page)}
        userMode="relawan"
        onModeChange={() => {}}
        currentView={currentView}
        onViewChange={onViewChange}
        moderatorTier={moderatorTier}
        onModeratorTierChange={() => {}}
        theme="moderator"
        navItems={
          moderatorTier === 1
            ? [
                { key: "monitor", label: "Monitoring", icon: BarChart3 },
                { key: "rekom", label: "Input", icon: Lightbulb },
                { key: "overview", label: "Ringkas", icon: LayoutGrid },
                { key: "profile", label: "Profil", icon: UserIcon }
              ]
            : moderatorTier === 2
            ? [
                { key: "verify", label: "Verifikasi", icon: ShieldCheck },
                { key: "events", label: "Kegiatan", icon: FileText },
                { key: "collab", label: "Kolab", icon: Handshake },
                { key: "overview", label: "Ringkas", icon: LayoutGrid },
                { key: "profile", label: "Profil", icon: UserIcon }
              ]
            : [
                { key: "aggregate", label: "Agregat", icon: BarChart3 },
                { key: "insight", label: "Insight", icon: Lightbulb },
                { key: "overview", label: "Ringkas", icon: LayoutGrid },
                { key: "profile", label: "Profil", icon: UserIcon }
              ]
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 pt-24 space-y-4">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-500 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Moderator Dashboard</h1>
              <p className="text-sm text-cyan-100">
                Tier {moderatorTier}{moderatorTier === 2 && user?.tier2Badge ? ` - ${String(user.tier2Badge).toUpperCase()}` : ''}
              </p>
            </div>
            <Badge className="bg-white/20 text-white">{user?.name}</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-cyan-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {moderatorTier === 2 ? 'Menunggu Proses' : 'Menunggu Verifikasi'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-700">
                {moderatorTier === 2 ? pendingReports.length + pendingCollaborationRequests.length : pendingReports.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Terverifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{verifiedReports.length}</div>
            </CardContent>
          </Card>

          <Card className="border-cyan-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{reports.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-cyan-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              Relawan & KSH Terpantau
            </CardTitle>
            <CardDescription>
              {moderatorTier === 1
                ? 'Kampung binaan'
                : moderatorTier === 2
                  ? (user?.tier2Badge === 'lurah' ? 'Wilayah kelurahan (Lurah)' : 'Wilayah kecamatan (Camat)')
                  : 'Seluruh kota'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visibleUsers.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada data relawan.</div>
            ) : (
              <div className="space-y-2">
                {visibleUsers.slice(0, 8).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                    <div>
                      <div className="font-semibold text-sm">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.kelurahan} - {u.kecamatan}</div>
                    </div>
                    <Badge className="bg-cyan-600 text-white">{u.points || 0} XP</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {activePage === "verify" && (
          <PendingReportReview
            pendingReports={pendingReports}
            users={users}
            onVerifyReport={handleVerifyReport}
          />
        )}

        {activePage === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Ringkasan Moderator
              </CardTitle>
              <CardDescription>Ringkasan data sesuai tier.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Gunakan menu atas untuk fitur sesuai tier.</div>
            </CardContent>
          </Card>
        )}

        {activePage === "monitor" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monitoring Kampung Binaan
              </CardTitle>
              <CardDescription>Tier 1 fokus monitoring dan input kegiatan draft.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Data monitoring kampung akan muncul di sini.</div>
            </CardContent>
          </Card>
        )}

        {activePage === "rekom" && (
          <Tier1EventInput
            eventForm={eventForm}
            setEventForm={setEventForm}
            geoOptions={geoOptions}
            kelurahanOptions={kelurahanOptions}
            draftEvents={draftEvents}
            user={user}
            submittingEvent={submittingEvent}
            editingEventId={editingEventId}
            onSubmit={handleCreateTier1Event}
            onEditDraftEvent={handleEditDraftEvent}
            onCancelEdit={resetEventForm}
          />
        )}

        {activePage === "events" && (
          <EventApprovalQueue
            draftEvents={draftEvents}
            approvedEvents={approvedEvents}
            onEventApproval={handleEventApproval}
            onEventPublish={handleEventPublish}
          />
        )}

        {activePage === "collab" && moderatorTier === 2 && (
          <ModeratorCollaborationReview
            pendingCollaborationRequests={pendingCollaborationRequests}
            onCollaborationApproval={handleCollaborationApproval}
          />
        )}

        {activePage === "aggregate" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Agregat Kota
              </CardTitle>
              <CardDescription>Tier 3 monitoring agregat kota.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Data agregat kota akan muncul di sini.</div>
            </CardContent>
          </Card>
        )}

        {activePage === "insight" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Insight Program
              </CardTitle>
              <CardDescription>Analisis tren pilar dan rekomendasi kebijakan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Belum ada insight terbaru.</div>
            </CardContent>
          </Card>
        )}

        {moderatorTier === 2 && (
          <VerifiedReportList verifiedReports={verifiedReports} users={users} />
        )}
        {/* Profile Tab */}
        {activePage === 'profile' && (
          <div className="pt-2">
             <UserProfile user={user} reports={reports} onLogout={onLogout} moderatorTier={moderatorTier} />
          </div>
        )}
      </div>
    </div>
  );
}
