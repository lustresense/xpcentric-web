import { useEffect, useMemo, useRef, useState } from "react";
import type { LeaderboardEntry } from "@/app/components/landing/types";

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  onOpenFull: () => void;
}

const FALLBACK: LeaderboardEntry[] = [
  { rank: 1, kelurahan: "Wonokromo", kecamatan: "Wonokromo", xp: 12 },
  { rank: 2, kelurahan: "Rungkut", kecamatan: "Rungkut", xp: 10 },
  { rank: 3, kelurahan: "Sukolilo", kecamatan: "Sukolilo", xp: 9 },
  { rank: 4, kelurahan: "Tegalsari", kecamatan: "Tegalsari", xp: 8 },
  { rank: 5, kelurahan: "Sawahan", kecamatan: "Sawahan", xp: 7 },
  { rank: 6, kelurahan: "Gubeng", kecamatan: "Gubeng", xp: 7 },
  { rank: 7, kelurahan: "Kenjeran", kecamatan: "Kenjeran", xp: 6 },
];

export function LeaderboardSection({ entries, onOpenFull }: LeaderboardSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [cardStyle, setCardStyle] = useState({ translateY: 80, opacity: 0.6 });
  const resolved = useMemo(() => (entries.length >= 5 ? entries : FALLBACK), [entries]);
  const topFive = resolved.slice(0, 5);
  const teaser = resolved.slice(5, 7);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = vh * 0.5;
      const enterStart = vh * 0.92;

      if (rect.top >= center) {
        const progress = Math.min(1, Math.max(0, (enterStart - rect.top) / (enterStart - center)));
        setCardStyle({
          translateY: 80 * (1 - progress),
          opacity: 0.6 + progress * 0.4,
        });
        return;
      }

      const overshoot = Math.min(1, Math.max(0, (center - rect.top) / (vh * 0.9)));
      setCardStyle({
        translateY: -160 * overshoot,
        opacity: 1,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="mx-auto max-w-5xl px-4 py-20 md:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5f3f]/70">Leaderboard Kampung</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#14201a] md:text-4xl">Kampung TOP Surabaya Saat Ini</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#516057]">
          Posisi ini dihitung dari keseimbangan empat pilar dan kegiatan yang sudah tervalidasi di sistem.
        </p>
      </div>

      <div
        className="mt-10 rounded-2xl border border-[#d8e2db] bg-white p-5 shadow-[0_12px_30px_rgba(11,50,34,0.11)] md:p-7"
        style={{
          transform: `translateY(${cardStyle.translateY}px)`,
          opacity: cardStyle.opacity,
          transition: "transform 460ms cubic-bezier(0.2,0.8,0.2,1), opacity 460ms cubic-bezier(0.2,0.8,0.2,1)",
          willChange: "transform, opacity",
        }}
      >
        <h3 className="text-xl font-semibold text-[#15211b]">Top 5 Progres Kampung</h3>
        <div className="mt-5 divide-y divide-[#eef2ee]">
          {topFive.map((item) => (
            <button
              key={`${item.rank}-${item.kelurahan}`}
              type="button"
              onClick={onOpenFull}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[#f5f8f6]"
            >
              <span className="w-8 text-base font-semibold text-[#0f5f3f]">#{item.rank}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#1e2b24]">{item.kelurahan}</span>
                <span className="block truncate text-xs text-[#75847c]">{item.kecamatan}</span>
              </span>
              <span className="text-xs font-medium text-[#5a6962] transition group-hover:font-semibold group-hover:text-[#1e2b24]">
                {item.xp} XP
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 space-y-2">
          {teaser.map((item) => (
            <div
              key={`${item.rank}-${item.kelurahan}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 opacity-45 blur-[5px]"
              aria-hidden="true"
            >
              <span className="w-8 text-sm font-semibold text-[#0f5f3f]">#{item.rank}</span>
              <span className="min-w-0 flex-1 text-sm text-[#2b3832]">{item.kelurahan}</span>
              <span className="text-xs text-[#5a6962]">{item.xp} XP</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenFull}
          className="mt-5 text-xs font-medium text-[#0f5f3f] underline-offset-4 transition hover:underline"
        >
          Lihat Leaderboard Lengkap
        </button>
      </div>
    </section>
  );
}
