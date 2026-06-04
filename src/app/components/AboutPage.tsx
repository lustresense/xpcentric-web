import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface AboutPageProps {
  onNavigate: (page: "landing" | "login" | "collaboration") => void;
}

const pillars = [
  {
    title: "Lingkungan",
    text: "Warga diajak peduli terhadap ruang hidup melalui pengelolaan sampah, konservasi alam setempat, kebersihan umum, dan inisiatif ramah lingkungan.",
  },
  {
    title: "Ekonomi",
    text: "Mendorong kemandirian ekonomi warga dengan pengembangan UMKM, pelatihan keterampilan, dan pemberdayaan usaha mikro.",
  },
  {
    title: "Sosial Budaya",
    text: "Menjaga nilai kebersamaan, toleransi, dan tradisi positif antarwarga agar komunitas makin harmonis dan inklusif.",
  },
  {
    title: "Kemasyarakatan",
    text: "Fokus pada penyelesaian persoalan sosial dan keamanan lingkungan melalui gotong royong, siskamling aktif, dan solusi bersama.",
  },
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#f1f7f3] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1b3529] hover:text-[#0f5f3f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Landing
        </button>

        <section className="rounded-3xl border border-[#d5e0d9] bg-white p-6 md:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#15231c] md:text-4xl">Tentang Program SIMREKAP</h1>
          <p className="mt-5 text-sm leading-relaxed text-[#4f6058] md:text-base">
            Kampung Pancasila adalah inisiatif Pemerintah Kota Surabaya yang membumikan nilai-nilai Pancasila langsung di
            kehidupan warga sehari-hari. Program ini bertujuan menciptakan kampung yang guyub, saling tolong-menolong,
            dan mandiri.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#4f6058] md:text-base">
            Implementasinya tidak berhenti di slogan. Program ini dijalankan di banyak RW sebagai ruang nyata untuk
            menjaga kerukunan, menguatkan gotong royong, dan mendorong solusi sosial lokal.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#4f6058] md:text-base">
            Kampung Pancasila juga menyatukan berbagai inisiatif sosial yang sebelumnya terpisah agar pendekatan
            pemberdayaan komunitas menjadi lebih holistik.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-[#d5e0d9] bg-white p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-[#15231c] md:text-3xl">Empat Pilar Utama</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {pillars.map((pillar, index) => (
              <article key={pillar.title} className="rounded-2xl border border-[#d8e2db] bg-[#f7fbf8] p-4">
                <p className="text-sm font-semibold text-[#123325]">
                  {index + 1}. {pillar.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#52635b]">{pillar.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#d5e0d9] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-[#15231c] md:text-2xl">Akses Cepat</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2db] bg-white px-4 py-2 text-sm font-medium text-[#1c3228] hover:bg-[#eef5f0]"
            >
              <CheckCircle2 className="h-4 w-4 text-[#0f5f3f]" />
              Masuk
            </button>
            <button
              type="button"
              onClick={() => onNavigate("collaboration")}
              className="rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#ffd34d]"
            >
              Jadi Mitra
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
