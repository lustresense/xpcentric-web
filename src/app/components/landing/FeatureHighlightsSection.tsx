import { BellRing, Gift, LayoutGrid, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Kampung-Centric Dashboard",
    description: "Progres kampung dipantau per kelurahan, jadi arah tindak lanjut lebih presisi.",
  },
  {
    icon: ShieldCheck,
    title: "Verifikasi Berjenjang",
    description: "Status draft, approval, publish, sampai selesai tercatat sesuai kewenangan tiap tier.",
  },
  {
    icon: BellRing,
    title: "Alur Aksi Lebih Ringkas",
    description: "Relawan dan moderator fokus ke aksi lapangan tanpa alur yang bikin ribet.",
  },
  {
    icon: Gift,
    title: "Reward Tetap Proporsional",
    description: "Poin relawan tetap ada sebagai apresiasi, tanpa menggeser fokus dari progres kampung.",
  },
];

export function FeatureHighlightsSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5f3f]/70">Fitur Utama</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#14201a] md:text-4xl">Fitur Inti SIMREKAP</h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#516057]">
        Tampilan dibuat tetap bersih, tapi fitur pentingnya langsung kebaca.
      </p>

      <div className="mt-10 grid gap-3 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="group rounded-2xl border border-[#d8e2db] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0f5f3f]/35 hover:shadow-[0_12px_24px_rgba(16,43,31,0.08)]"
          >
            <div className="mb-4 inline-flex rounded-xl bg-[#e8f3ed] p-2 text-[#0f5f3f] transition-colors group-hover:bg-[#dff0e7]">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-[#16241d]">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#56645d]">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
