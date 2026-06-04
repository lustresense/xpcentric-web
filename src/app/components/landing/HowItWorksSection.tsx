import { ClipboardList, UserCheck, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    text: "Kegiatan dirancang dan diverifikasi oleh kelurahan.",
  },
  {
    icon: UserCheck,
    text: "Relawan berpartisipasi dan menyelesaikan kegiatan.",
  },
  {
    icon: Trophy,
    text: "Kampung mendapatkan progres berdasarkan keseimbangan 4 pilar.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5f3f]/70">Alur Sistem</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#14201a] md:text-4xl">Cara Kerja Sistem</h2>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <div key={step.text} className="rounded-2xl border border-[#d8e2db] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f5f3f]/70">Step {idx + 1}</p>
            <div className="mt-3 inline-flex rounded-lg bg-[#e8f3ed] p-2 text-[#0f5f3f]">
              <step.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#2a372f]">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
