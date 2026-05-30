import { useState } from 'react';
import { Crown, Loader2, LogOut, Settings } from 'lucide-react';
import { AdminGodMode } from '@/app/components/AdminGodMode';
import { ModeratorCollaborationReview } from '@/app/components/moderator/ModeratorCollaborationReview';
import {
  AdminEventsDatabase,
  AdminOverview,
  AdminReportsDatabase,
  AdminUsersDatabase,
  safePoints,
  useAdminDashboardData,
} from '@/app/components/admin';
import { POVSwitcher } from '@/app/components/POVSwitcher';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { getLevelByRole } from '@/data/levelingSystem';

interface AdminDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  onNavigate: (page: any) => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
}

export function AdminDashboard({
  user,
  authToken,
  onLogout,
  currentView,
  onViewChange,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    users,
    events,
    reports,
    collaborationRequests,
    loading,
    handleVerifyReport,
    handleCollaborationApproval,
  } = useAdminDashboardData({ authToken });
  const pendingCollaborationRequests = collaborationRequests.filter((item) => item.status === 'pending');

  const adminPoints = safePoints(user?.points);
  const adminLevel = getLevelByRole('admin', adminPoints);

  return (
    <div className="dark flex min-h-screen w-full flex-col bg-black text-white">
      <header className="border-b border-white/15 bg-black px-4 py-4 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/15 text-emerald-200">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold">
                Admin Dashboard
                <Badge className="border border-amber-300/50 bg-amber-300 text-xs text-black">
                  {adminLevel.badge} {adminLevel.name}
                </Badge>
              </h1>
              <p className="text-sm text-white/60">{adminPoints} poin - {user.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <POVSwitcher
              currentRole={user.role}
              currentView={currentView}
              onViewChange={onViewChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-red-400/50 bg-red-500/10 text-red-100 hover:border-red-300 hover:bg-red-500 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto bg-black p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex w-full gap-1 overflow-x-auto border border-white/15 bg-neutral-950 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <TabsTrigger value="overview" className="flex-shrink-0 text-sm text-white/75 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 text-sm text-white/75 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Pengguna
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-shrink-0 text-sm text-white/75 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Event
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-shrink-0 text-sm text-white/75 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Laporan
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex-shrink-0 text-sm text-white/75 hover:bg-white/10 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Kolaborasi
            </TabsTrigger>
            <TabsTrigger
              value="godmode"
              className="flex-shrink-0 border border-fuchsia-300/30 bg-gradient-to-r from-purple-600 to-pink-600 text-sm text-white hover:brightness-110 data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Crown className="mr-1 h-4 w-4" />
              Kontrol Admin
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center rounded-xl border border-emerald-400/25 bg-neutral-950 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-white/55">Memuat data admin...</span>
            </div>
          ) : (
            <>
              <TabsContent value="overview" className="space-y-4">
                <AdminOverview users={users} events={events} reports={reports} />
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <AdminUsersDatabase users={users} />
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <AdminEventsDatabase events={events} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <AdminReportsDatabase
                  reports={reports}
                  users={users}
                  events={events}
                  onVerifyReport={handleVerifyReport}
                />
              </TabsContent>

              <TabsContent value="collaboration" className="space-y-4 text-black">
                <ModeratorCollaborationReview
                  pendingCollaborationRequests={pendingCollaborationRequests}
                  onCollaborationApproval={handleCollaborationApproval}
                />
              </TabsContent>

              <TabsContent value="godmode" className="space-y-4">
                <AdminGodMode adminUser={user} authToken={authToken} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
