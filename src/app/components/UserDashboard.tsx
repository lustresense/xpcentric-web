import { useState } from 'react';
import { Calendar, ClipboardList, Crown, FileCheck2, Gift, Home, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingNavbar } from '@/app/components/ui/FloatingNavbar';
import { ReportingWizard } from '@/app/components/ReportingWizard';
import { UserProfile } from '@/app/components/UserProfile';
import {
  AttendanceModal,
  CertificatePreviewModal,
  ReportDetailModal,
  UserCertificates,
  UserEvents,
  UserHome,
  UserLeaderboards,
  UserReports,
  UserRewards,
  type UserDashboardPage,
  useUserDashboardData,
} from '@/app/components/user';

interface UserDashboardProps {
  user: any;
  authToken: string | null;
  onLogout: () => void;
  currentView: 'admin' | 'moderator' | 'user';
  onViewChange: (view: 'admin' | 'moderator' | 'user') => void;
  moderatorTier: 1 | 2 | 3;
  onModeratorTierChange: (tier: 1 | 2 | 3) => void;
}

const navItems = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'events', label: 'Event', icon: Calendar },
  { key: 'my-events', label: 'Event Saya', icon: ClipboardList },
  { key: 'leaderboards', label: 'Leaderboard', icon: Crown },
  { key: 'certificates', label: 'Sertifikat', icon: FileCheck2 },
  { key: 'rewards', label: 'Reward', icon: Gift },
  { key: 'profile', label: 'Profil', icon: UserIcon },
];

export function UserDashboard({
  user,
  authToken,
  onLogout,
  currentView,
  onViewChange,
  moderatorTier,
  onModeratorTierChange,
}: UserDashboardProps) {
  const [activePage, setActivePage] = useState<UserDashboardPage>('home');
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);

  const dashboard = useUserDashboardData({ user, authToken });

  const openReportingWizard = () => {
    if (dashboard.reportableEvents.length === 0) {
      toast.info('Laporan aktif setelah kamu mengikuti event yang sudah selesai.');
      setActivePage('events');
      return;
    }
    setIsReportWizardOpen(true);
  };

  const refreshAfterReport = () => {
    setIsReportWizardOpen(false);
    dashboard.refreshEvents();
    dashboard.refreshReports();
    dashboard.refreshParticipations();
  };

  return (
    <div className="size-full flex flex-col bg-white">
      <FloatingNavbar
        user={user}
        authToken={authToken}
        activePage={activePage}
        onLogout={onLogout}
        onNavigate={(page) => setActivePage(page)}
        userMode={dashboard.userMode}
        onModeChange={dashboard.setUserMode}
        currentView={currentView}
        onViewChange={onViewChange}
        moderatorTier={moderatorTier}
        onModeratorTierChange={onModeratorTierChange}
        theme="user"
        navItems={navItems}
      />

      <div className="flex-1 overflow-auto px-4 pt-24 pb-8">
        {dashboard.dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
            <span className="ml-3 text-gray-500">Memuat data...</span>
          </div>
        ) : (
          <>
            {activePage === 'home' && (
              <UserHome
                user={user}
                authToken={authToken}
                userMode={dashboard.userMode}
                kampungName={dashboard.kampungName}
                kampungXp={dashboard.kampungXp}
                kampungRelawan={dashboard.kampungRelawan}
                safeCurrentPoints={dashboard.safeCurrentPoints}
                topKampung={dashboard.topKampung}
                leaderboardCount={dashboard.kampungLeaderboard.length}
                reportableEventCount={dashboard.reportableEvents.length}
                onNavigate={setActivePage}
                onOpenReportingWizard={openReportingWizard}
              />
            )}

            {activePage === 'leaderboards' && (
              <UserLeaderboards
                kampungLeaderboard={dashboard.kampungLeaderboard}
                kampungPernahBantu={dashboard.kampungPernahBantu}
                kampungDibantu={dashboard.kampungDibantu}
              />
            )}

            {activePage === 'events' && (
              <UserEvents
                authToken={authToken}
                events={dashboard.events}
                pendingReport={dashboard.pendingReport}
                reportableEventCount={dashboard.reportableEvents.length}
                userMode={dashboard.userMode}
                upcomingEvents={dashboard.upcomingEvents}
                onOpenReportingWizard={openReportingWizard}
                onEventJoined={() => {
                  dashboard.refreshEvents();
                  dashboard.refreshParticipations();
                }}
                onOpenAttendanceModal={dashboard.openAttendanceModal}
              />
            )}

            {activePage === 'my-events' && (
              <UserReports
                participations={dashboard.participations}
                participationStats={dashboard.participationStats}
                reportableEventCount={dashboard.reportableEvents.length}
                findReportForParticipation={dashboard.findReportForParticipation}
                onOpenReportingWizard={openReportingWizard}
                onSelectReport={dashboard.setSelectedReportContext}
              />
            )}

            {activePage === 'certificates' && (
              <UserCertificates
                certificates={dashboard.certificates}
                downloadingCertificateId={dashboard.downloadingCertificateId}
                onSelectCertificate={dashboard.setSelectedCertificate}
                onDownloadCertificate={dashboard.handleDownloadCertificate}
              />
            )}

            {activePage === 'rewards' && (
              <UserRewards
                rewardCatalog={dashboard.rewardCatalog}
                safeCurrentPoints={dashboard.safeCurrentPoints}
                onRedeemVoucher={dashboard.handleRedeemVoucher}
              />
            )}

            {activePage === 'profile' && (
              <div className="pt-2">
                <UserProfile user={user} reports={dashboard.reports} onLogout={onLogout} />
              </div>
            )}
          </>
        )}
      </div>

      {isReportWizardOpen && (
        <ReportingWizard
          authToken={authToken}
          userId={user?.id}
          events={dashboard.reportableEvents}
          onClose={refreshAfterReport}
        />
      )}

      {dashboard.attendanceEvent && (
        <AttendanceModal
          event={dashboard.attendanceEvent}
          participants={dashboard.attendanceParticipants}
          selectedUserIds={dashboard.attendanceSelectedUserIds}
          summary={dashboard.attendanceSummary}
          submitting={dashboard.attendanceSubmitting}
          onSummaryChange={dashboard.setAttendanceSummary}
          onToggleUser={dashboard.toggleAttendanceUser}
          onClose={dashboard.closeAttendanceModal}
          onSubmit={dashboard.handleSubmitAttendanceAndComplete}
        />
      )}

      {dashboard.selectedCertificate && (
        <CertificatePreviewModal
          certificate={dashboard.selectedCertificate}
          downloadingCertificateId={dashboard.downloadingCertificateId}
          onClose={() => dashboard.setSelectedCertificate(null)}
          onDownload={dashboard.handleDownloadCertificate}
        />
      )}

      {dashboard.selectedReportContext && (
        <ReportDetailModal
          context={dashboard.selectedReportContext}
          onClose={() => dashboard.setSelectedReportContext(null)}
        />
      )}
    </div>
  );
}
