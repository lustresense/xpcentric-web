import { ArrowLeft } from "lucide-react";

interface FaqPageProps {
  onNavigate: (page: "landing" | "login" | "collaboration") => void;
}

const FAQ_ITEMS = [
  {
    q: "Apa itu SIMREKAP?",
    a: "SIMREKAP adalah sistem informasi untuk mencatat, memverifikasi, dan memonitor kontribusi kegiatan Kampung Pancasila berbasis data.",
  },
  {
    q: "Siapa yang bisa jadi relawan?",
    a: "Warga yang sudah registrasi akun dan melengkapi profil dasar dapat mengikuti kegiatan yang berstatus published.",
  },
  {
    q: "Apa beda relawan dan mitra?",
    a: "Relawan berpartisipasi langsung di kegiatan kampung. Mitra mendukung kegiatan melalui dukungan lintas bentuk seperti peralatan, media, konsumsi, atau bentuk kolaborasi lain.",
  },
  {
    q: "Bagaimana alur kolaborasi mitra?",
    a: "Mitra submit form kolaborasi, lalu masuk sebagai collaboration request, kemudian diproses oleh Moderator Tier 2 untuk approval.",
  },
  {
    q: "Apakah ada leaderboard individu?",
    a: "Tidak. Fokus SIMREKAP adalah progres kampung per kelurahan agar kolaborasi tetap sehat dan tidak kompetitif antar relawan.",
  },
];

export function FaqPage({ onNavigate }: FaqPageProps) {
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
          <h1 className="text-3xl font-semibold tracking-tight text-[#15231c] md:text-4xl">FAQ SIMREKAP</h1>
          <p className="mt-3 text-sm text-[#506158] md:text-base">
            Pertanyaan yang paling sering ditanyakan terkait relawan, verifikasi kegiatan, dan kolaborasi mitra.
          </p>

          <div className="mt-6 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <article key={item.q} className="rounded-2xl border border-[#d8e2db] bg-[#f7fbf8] p-4">
                <h2 className="text-sm font-semibold text-[#193026] md:text-base">{item.q}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#51635a]">{item.a}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="rounded-xl border border-[#d8e2db] bg-white px-4 py-2 text-sm font-medium text-[#1b3025] hover:bg-[#eef5f0]"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => onNavigate("collaboration")}
              className="rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-semibold text-[#181818] hover:bg-[#ffd347]"
            >
              Jadi Mitra
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
