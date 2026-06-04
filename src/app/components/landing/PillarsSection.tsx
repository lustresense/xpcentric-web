import { useEffect, useMemo, useRef, useState } from "react";
import { HandCoins, HeartHandshake, Leaf, Shield } from "lucide-react";

const PILLARS = [
  {
    title: "Lingkungan",
    icon: Leaf,
    description:
      "Warga diajak peduli terhadap ruang hidup melalui pengelolaan sampah, konservasi lokal, kebersihan umum, dan inisiatif ramah lingkungan.",
  },
  {
    title: "Ekonomi",
    icon: HandCoins,
    description:
      "Mendorong kemandirian ekonomi warga lewat pengembangan UMKM, pelatihan keterampilan, dan pemberdayaan usaha mikro.",
  },
  {
    title: "Sosial Budaya",
    icon: HeartHandshake,
    description:
      "Menjaga kebersamaan, toleransi, serta tradisi positif antarwarga agar komunitas makin harmonis dan inklusif.",
  },
  {
    title: "Kemasyarakatan",
    icon: Shield,
    description:
      "Fokus pada penyelesaian persoalan sosial dan keamanan lingkungan melalui gotong royong, siskamling aktif, dan solusi bersama.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function PillarsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activePillar, setActivePillar] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) {
          return;
        }
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const travel = rect.height + vh;
        const raw = (vh - rect.top) / travel;
        setProgress(clamp(raw, 0, 1));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const spread = useMemo(() => {
    const value = 1 - Math.abs(progress * 2 - 1) * 1.35;
    return clamp(value, 0, 1);
  }, [progress]);

  const collapsed = [
    { x: 0, y: 0, rot: 0, z: 40 },
    { x: -28, y: -12, rot: -8, z: 30 },
    { x: 16, y: -18, rot: 5, z: 20 },
    { x: 44, y: -6, rot: 9, z: 10 },
  ];

  const openedDesktop = [
    { x: -306, y: 0, rot: -2, z: 40 },
    { x: -102, y: 0, rot: -0.5, z: 30 },
    { x: 102, y: 0, rot: 0.5, z: 20 },
    { x: 306, y: 0, rot: 2, z: 10 },
  ];

  const openedMobile = [
    { x: -94, y: -76, rot: -1, z: 40 },
    { x: 94, y: -76, rot: 1, z: 30 },
    { x: -94, y: 76, rot: -1, z: 20 },
    { x: 94, y: 76, rot: 1, z: 10 },
  ];

  const opened = isMobile ? openedMobile : openedDesktop;

  return (
    <section id="pilar" ref={sectionRef} className="mx-auto max-w-5xl px-4 py-20 md:py-28">
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5f3f]/70">Program Kampung Pancasila</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#132018] md:text-4xl">Tentang Program Kampung Pancasila</h2>
        <p className="mt-5 text-sm leading-relaxed text-[#4d5d55] md:text-base">
          Kampung Pancasila adalah inisiatif Pemerintah Kota Surabaya untuk membumikan nilai Pancasila langsung dalam
          kehidupan warga sehari-hari. Targetnya jelas: kampung yang guyub, saling bantu, dan mandiri.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#4d5d55] md:text-base">
          Program ini bukan sekadar slogan, tapi gabungan kegiatan sosial lintas bidang yang sebelumnya berdiri sendiri,
          lalu disatukan dalam pendekatan komunitas yang lebih holistik.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-[1.35fr,0.65fr] md:items-start">
        <div className="relative h-[320px] rounded-3xl border border-[#d7e2da] bg-[#f4faf6] md:h-[260px]">
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.16),transparent_60%)]" />
          {PILLARS.map((pillar, index) => {
            const from = collapsed[index];
            const to = opened[index];
            const tx = lerp(from.x, to.x, spread);
            const ty = lerp(from.y, to.y, spread);
            const rotation = lerp(from.rot, to.rot, spread);
            const scale = lerp(0.96, 1, spread);
            const isActive = activePillar === index;

            return (
              <button
                key={pillar.title}
                type="button"
                onMouseEnter={() => setActivePillar(index)}
                onFocus={() => setActivePillar(index)}
                onClick={() => setActivePillar(index)}
                className="absolute left-1/2 top-1/2 w-[148px] rounded-2xl border bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,45,31,0.12)] transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:w-[176px]"
                style={{
                  transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg) scale(${scale})`,
                  borderColor: isActive ? "#f1b900" : "#d3ddd6",
                  boxShadow: isActive
                    ? "0 14px 26px rgba(13,45,30,0.17)"
                    : "0 10px 24px rgba(15,45,31,0.12)",
                  zIndex: from.z,
                }}
                aria-pressed={isActive}
              >
                <span className="inline-flex rounded-lg bg-[#e8f3ed] p-2 text-[#0f5f3f]">
                  <pillar.icon className="h-4 w-4 md:h-5 md:w-5" />
                </span>
                <span className="mt-2 block text-sm font-semibold text-[#1a3026]">{pillar.title}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#d8e2db] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f5f3f]/70">Pilar Aktif</p>
          <h3 className="mt-2 text-lg font-semibold text-[#17251d]">{PILLARS[activePillar].title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#53625a]">{PILLARS[activePillar].description}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {PILLARS.map((pillar, index) => (
          <article key={pillar.title} className="rounded-2xl border border-[#d8e2db] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#0f5f3f]/70">{index + 1}. {pillar.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#56655e]">{pillar.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
