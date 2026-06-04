export function AboutSection() {
  return (
    <section className="border-y border-[#dce7df] bg-[#f3f8f4] px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5f3f]/70">Tentang SIMREKAP</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#14201a] md:text-4xl">
          Sistem Informasi Manajemen Relawan Kampung Pancasila
        </h2>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#4f5d56] md:text-base">
          SIMREKAP adalah platform yang mencatat, memverifikasi, dan mengukur kontribusi kegiatan kampung secara terstruktur.
          Sistem ini memastikan setiap partisipasi warga jadi data yang bisa dipakai untuk keputusan kelurahan, kecamatan,
          sampai kota.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#d8e2db] bg-white px-4 py-4 text-sm text-[#233028]">
            XP milik kampung.
          </div>
          <div className="rounded-xl border border-[#d8e2db] bg-white px-4 py-4 text-sm text-[#233028]">
            Relawan berkontribusi.
          </div>
          <div className="rounded-xl border border-[#d8e2db] bg-white px-4 py-4 text-sm text-[#233028]">
            Kelurahan memverifikasi.
          </div>
          <div className="rounded-xl border border-[#d8e2db] bg-white px-4 py-4 text-sm text-[#233028]">
            Data menjadi dasar kebijakan.
          </div>
        </div>
      </div>
    </section>
  );
}
