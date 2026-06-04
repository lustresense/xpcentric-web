import { useEffect, useState } from "react";
import { apiPublicGet } from "@/lib/api";
import { CenteredLogoNav } from "@/app/components/landing/CenteredLogoNav";
import { HeroSection } from "@/app/components/landing/HeroSection";
import { PillarsSection } from "@/app/components/landing/PillarsSection";
import { LeaderboardSection } from "@/app/components/landing/LeaderboardSection";
import { AboutSection } from "@/app/components/landing/AboutSection";
import { HowItWorksSection } from "@/app/components/landing/HowItWorksSection";
import { CollaborationSection } from "@/app/components/landing/CollaborationSection";
import { FinalCTASection } from "@/app/components/landing/FinalCTASection";
import { FloatingEntryCTA } from "@/app/components/landing/FloatingEntryCTA";
import { FeatureHighlightsSection } from "@/app/components/landing/FeatureHighlightsSection";
import { LandingSplash } from "@/app/components/landing/LandingSplash";
import type { LandingNavigatePage, LeaderboardEntry } from "@/app/components/landing/types";

interface LandingPageProps {
  onNavigate: (page: LandingNavigatePage) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [geoStats, setGeoStats] = useState({ kelurahan: 154, kodepos: 128 });
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const raw = window.localStorage.getItem("simrekap_splash_last_at");
    const lastAt = raw ? Number(raw) : 0;
    const intervalMs = 15 * 60 * 1000;
    return !lastAt || Number.isNaN(lastAt) || Date.now() - lastAt >= intervalMs;
  });
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await apiPublicGet('/landing/leaderboard');
        setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      } catch {
        // Landing leaderboard is non-critical
      }
    };
    const fetchGeoStats = async () => {
      try {
        const data = await apiPublicGet<any>('/geo/stats');
        const stats = data?.stats || {};
        if (typeof stats.kelurahan === "number" && typeof stats.kodepos === "number") {
          setGeoStats({ kelurahan: stats.kelurahan, kodepos: stats.kodepos });
        }
      } catch {
        // Non-critical for landing
      }
    };
    fetchLeaderboard();
    fetchGeoStats();
  }, []);

  useEffect(() => {
    if (!showSplash) {
      return;
    }
    setShowSplash(true);
    const timer = window.setTimeout(() => {
      setShowSplash(false);
      window.localStorage.setItem("simrekap_splash_last_at", String(Date.now()));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [showSplash]);

  const navigateSmooth = (page: LandingNavigatePage) => {
    if (isLeaving) {
      return;
    }
    setIsLeaving(true);
    window.setTimeout(() => onNavigate(page), 190);
  };

  return (
    <div
      className="min-h-screen bg-[#f2f7f3] text-[#16221c] selection:bg-[#FFC107] selection:text-[#171717] transition-opacity duration-300"
      style={{ opacity: isLeaving ? 0 : 1 }}
    >
      <LandingSplash visible={showSplash} />
      <CenteredLogoNav
        onHomeClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onNavigate={(page) => navigateSmooth(page)}
      />
      <main className="pb-24">
        <HeroSection
          totalKelurahan={geoStats.kelurahan}
          totalKodepos={geoStats.kodepos}
          onExplore={() => document.getElementById("pilar")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
        <PillarsSection />
        <AboutSection />
        <FeatureHighlightsSection />
        <HowItWorksSection />
        <LeaderboardSection entries={leaderboard} onOpenFull={() => navigateSmooth("login")} />
        <CollaborationSection onCollaborate={() => navigateSmooth("collaboration")} />
        <FinalCTASection />
      </main>

      <footer className="border-t border-[#c7d7cc] bg-[#0f5f3f] px-4 py-10 text-white">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFC107] text-sm font-bold text-[#173025]">SR</span>
              <span className="text-sm font-semibold">SIMREKAP</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/82">
              Sistem Informasi Manajemen RElawan KAmpung Pancasila berbasis data terverifikasi.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/76">Navigasi</p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/86">
              <li>Kampung Pancasila</li>
              <li>Empat Pilar</li>
              <li>Kampung TOP Surabaya</li>
              <li>Kolaborasi</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/76">Instansi</p>
            <p className="mt-3 text-sm text-white/86">Dinas Komunikasi dan Informatika Kota Surabaya</p>
            <p className="mt-1 text-xs text-white/70">SIMREKAP v1.0 - The Pillar-Balance & Maturity Engine</p>
          </div>
        </div>
      </footer>

      <FloatingEntryCTA onJoin={() => navigateSmooth("login")} onCollaborate={() => navigateSmooth("collaboration")} />
    </div>
  );
}
