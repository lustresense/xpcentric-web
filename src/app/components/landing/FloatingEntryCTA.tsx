import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

interface FloatingEntryCTAProps {
  onJoin: () => void;
  onCollaborate: () => void;
}

const labels = ["Jadi Relawan", "Jadi Mitra"];

export function FloatingEntryCTA({ onJoin, onCollaborate }: FloatingEntryCTAProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [labelIndex, setLabelIndex] = useState(0);
  const lastY = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % labels.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 8) {
        setIsVisible(true);
      } else if (y > lastY.current + 6) {
        setIsVisible(true);
      } else if (y < lastY.current - 6) {
        setIsVisible(false);
        setExpanded(false);
      }
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  return (
    <>
      {expanded && (
        <button
          type="button"
          className="fixed inset-0 z-[54] bg-black/24 backdrop-blur-[5px] transition-opacity duration-300"
          onClick={() => setExpanded(false)}
          aria-label="Tutup pilihan"
        />
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-[56] px-4 pb-5 pt-4 transition-transform duration-300 ease-out"
        style={{ transform: isVisible ? "translateY(0)" : "translateY(120%)" }}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          {expanded && (
            <div className="cta-panel-enter w-full space-y-2 rounded-3xl border border-[#d6e0d9] bg-white p-4 shadow-[0_22px_40px_rgba(0,0,0,0.22)]">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#d6e0d9] text-[#203229] transition hover:bg-[#eef4f0]"
                  aria-label="Tutup panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onJoin}
                  className="rounded-2xl border border-[#d5e0d9] bg-[#f6faf7] px-3 py-4 text-left transition hover:-translate-y-0.5 hover:border-[#0f5f3f]/45 hover:bg-[#edf6f0]"
                >
                  <span className="block text-sm font-semibold text-[#13241c]">Jadi Relawan</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#596860]">
                    Gabung sebagai relawan untuk ikut aksi kampung yang terverifikasi secara resmi.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onCollaborate}
                  className="rounded-2xl border border-[#d5e0d9] bg-[#f6faf7] px-3 py-4 text-left transition hover:-translate-y-0.5 hover:border-[#0f5f3f]/45 hover:bg-[#edf6f0]"
                >
                  <span className="block text-sm font-semibold text-[#13241c]">Jadi Mitra</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#596860]">
                    Buka kolaborasi lintas bentuk untuk memperkuat kegiatan kampung bersama pemerintah.
                  </span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center rounded-full border border-[#d6e0d9] bg-white p-1 shadow-[0_14px_28px_rgba(17,38,28,0.24)] transition"
            aria-label="Buka pilihan akses cepat"
          >
            <span className="relative h-[46px] min-w-[136px] overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-[#16241c]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={labels[labelIndex]}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {labels[labelIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0f5f3f] text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>
          <p className="text-center text-[11px] text-[#3f4f47] md:text-xs">Akses cepat relawan dan mitra program.</p>
        </div>
      </div>
    </>
  );
}
