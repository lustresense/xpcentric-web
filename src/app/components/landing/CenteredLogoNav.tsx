import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import type { LandingNavigatePage } from "@/app/components/landing/types";

interface CenteredLogoNavProps {
  onNavigate: (page: LandingNavigatePage) => void;
  onHomeClick: () => void;
}

const spring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.95,
} as const;

const mobileSpring = {
  type: "spring",
  stiffness: 250,
  damping: 25,
} as const;

const mobileDropdownTransition = {
  duration: 0.15,
} as const;

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
} as const;

export function CenteredLogoNav({ onNavigate, onHomeClick }: CenteredLogoNavProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const collapsedWidth = useMemo(() => (isMobile ? "min(94vw, 360px)" : "360px"), [isMobile]);
  const expandedWidth = useMemo(
    () => (isMobile ? "calc(100vw - 1.25rem)" : "min(780px, calc(100vw - 2rem))"),
    [isMobile],
  );

  const go = (page: LandingNavigatePage) => {
    setOpen(false);
    onNavigate(page);
  };

  return (
    <>
      <AnimatePresence>
        {open && !isMobile && (
          <motion.button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-40 bg-black/22 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <header className="fixed left-0 right-0 top-4 z-50 px-2 sm:px-4">
        <div className="mx-auto flex max-w-6xl justify-center">
          <div className="relative flex w-full justify-center">
          <motion.nav
            initial={false}
            animate={{
              width: isMobile ? collapsedWidth : open ? expandedWidth : collapsedWidth,
              borderRadius: isMobile ? 999 : open ? 24 : 999,
              paddingTop: isMobile ? 8 : open ? 14 : 8,
              paddingBottom: isMobile ? 8 : open ? 14 : 8,
              paddingLeft: isMobile ? 12 : open ? 14 : 12,
              paddingRight: isMobile ? 12 : open ? 14 : 12,
            }}
            transition={isMobile ? mobileSpring : spring}
            className="relative border border-white/65 bg-[#f3f6f5]/95 shadow-[0_16px_36px_rgba(12,33,24,0.17)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(130deg,rgba(255,255,255,0.9),rgba(255,255,255,0.58))]" />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onHomeClick}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#115E59] text-xs font-semibold text-[#FBBF24]"
                aria-label="Kembali ke atas"
              >
                SR
              </button>

              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-[0.2em] text-[#12443a]">
                SIMREKAP
              </span>

              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="group grid h-9 w-9 place-items-center rounded-full border border-[#d6dfda] bg-white/72 text-[#173127] transition hover:bg-white"
                aria-label={open ? "Tutup menu" : "Buka menu"}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {open ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, rotate: -80, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 80, scale: 0.8 }}
                      transition={{ duration: 0.16 }}
                    >
                      <X className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, rotate: 80, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -80, scale: 0.8 }}
                      transition={{ duration: 0.16 }}
                    >
                      <Menu className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {!isMobile && (
              <motion.div
                initial={false}
                animate={{
                  height: open ? "auto" : 0,
                  opacity: open ? 1 : 0,
                  marginTop: open ? 12 : 0,
                }}
                transition={{
                  height: spring,
                  opacity: { duration: 0.16 },
                  marginTop: { duration: 0.2 },
                }}
                style={{ overflow: "hidden" }}
                className="relative z-10"
              >
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate={open ? "visible" : "hidden"}
                  className="space-y-3"
                >
                  <motion.nav variants={listVariants} className="flex flex-wrap items-center gap-2">
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("login")}
                      className="rounded-xl border border-[#d7e1db] bg-white px-4 py-2 text-sm font-medium text-[#1b2f25] transition hover:border-[#8fb7a7]"
                    >
                      Masuk
                    </motion.button>
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("about")}
                      className="rounded-xl border border-[#d7e1db] bg-white px-4 py-2 text-sm font-medium text-[#1b2f25] transition hover:border-[#8fb7a7]"
                    >
                      About
                    </motion.button>
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("faq")}
                      className="rounded-xl border border-[#d7e1db] bg-white px-4 py-2 text-sm font-medium text-[#1b2f25] transition hover:border-[#8fb7a7]"
                    >
                      FAQ
                    </motion.button>
                  </motion.nav>

                  <motion.div variants={listVariants} className="flex flex-wrap items-center gap-2">
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("login")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FBBF24] px-4 py-2 text-sm font-semibold text-[#182117] transition hover:brightness-105"
                    >
                      Jadi Relawan
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("collaboration")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7e1db] bg-white px-4 py-2 text-sm font-medium text-[#1b2f25] transition hover:border-[#8fb7a7]"
                    >
                      Jadi Mitra
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </motion.nav>

          <AnimatePresence>
            {open && isMobile && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={mobileDropdownTransition}
                className="absolute left-2 right-2 top-full mt-3 overflow-hidden rounded-2xl border border-[#d7e1db] bg-white/95 shadow-xl backdrop-blur-xl"
              >
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-2 p-2"
                >
                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => go("login")}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#1b2f25] transition hover:bg-[#eff5f1]"
                  >
                    Masuk
                  </motion.button>
                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => go("about")}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#1b2f25] transition hover:bg-[#eff5f1]"
                  >
                    About
                  </motion.button>
                  <motion.button
                    variants={itemVariants}
                    type="button"
                    onClick={() => go("faq")}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#1b2f25] transition hover:bg-[#eff5f1]"
                  >
                    FAQ
                  </motion.button>
                  <div className="grid gap-2 border-t border-[#d7e1db] p-2">
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("login")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FBBF24] px-4 py-3 text-sm font-semibold text-[#182117] transition hover:brightness-105"
                    >
                      Jadi Relawan
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      variants={itemVariants}
                      type="button"
                      onClick={() => go("collaboration")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7e1db] bg-white px-4 py-3 text-sm font-semibold text-[#1b2f25] transition hover:bg-[#eff5f1]"
                    >
                      Jadi Mitra
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
}
