import { Button } from "@/app/components/ui/button";
import { Building2, Megaphone, Handshake } from "lucide-react";

interface CollaborationSectionProps {
  onCollaborate: () => void;
}

export function CollaborationSection({ onCollaborate }: CollaborationSectionProps) {
  return (
    <section className="border-y border-[#e5ece7] bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5f3f]/70">Jadi Mitra</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#14201a] md:text-4xl">Kolaborasi Mitra Kampung</h2>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#4f5d56] md:text-base">
          Perusahaan, komunitas, dan institusi dapat berkolaborasi dalam penyelenggaraan kegiatan kampung melalui mekanisme
          resmi pemerintah. Kolaborasi dapat berupa dukungan kegiatan, fasilitas, atau bentuk kerja sama lain yang
          memperkuat program Kampung Pancasila.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#d8e2db] bg-[#f7fbf8] p-4">
            <Building2 className="h-5 w-5 text-[#0f5f3f]" />
            <p className="mt-2 text-sm font-semibold text-[#1b2a23]">Perusahaan</p>
            <p className="mt-1 text-xs text-[#5c6a63]">Dukungan logistik, fasilitas, atau program sosial.</p>
          </div>
          <div className="rounded-2xl border border-[#d8e2db] bg-[#f7fbf8] p-4">
            <Megaphone className="h-5 w-5 text-[#0f5f3f]" />
            <p className="mt-2 text-sm font-semibold text-[#1b2a23]">Media & Komunitas</p>
            <p className="mt-1 text-xs text-[#5c6a63]">Dukungan publikasi, kampanye, dan penguatan partisipasi warga.</p>
          </div>
          <div className="rounded-2xl border border-[#d8e2db] bg-[#f7fbf8] p-4">
            <Handshake className="h-5 w-5 text-[#0f5f3f]" />
            <p className="mt-2 text-sm font-semibold text-[#1b2a23]">Institusi</p>
            <p className="mt-1 text-xs text-[#5c6a63]">Kolaborasi lintas sektor dengan jalur resmi pemerintah.</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onCollaborate}
          className="mt-8 h-11 rounded-full bg-[#FFC107] px-7 text-sm font-semibold text-[#191919] hover:bg-[#ffcf3f]"
        >
          Jadi Mitra
        </Button>
      </div>
    </section>
  );
}
