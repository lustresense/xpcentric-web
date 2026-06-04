interface LandingSplashProps {
  visible: boolean;
}

export function LandingSplash({ visible }: LandingSplashProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f5f3f] px-6 pb-[22vh] text-center text-white transition-opacity duration-700 md:items-center md:pb-0"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      aria-hidden={!visible}
    >
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">SIMREKAP Surabaya</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] md:text-5xl">
          <span className="block">Selamat datang,</span>
          <span className="block">Warga Surabaya!</span>
        </h2>
      </div>
    </div>
  );
}
