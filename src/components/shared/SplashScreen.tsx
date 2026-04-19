type SplashScreenProps = {
  title?: string;
  subtitle?: string;
};

export function SplashScreen({
  title = "Smart Exam Scheduling",
  subtitle = "Initializing secure session",
}: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.96),rgba(15,23,42,0.82)_40%,rgba(30,41,59,0.96)_100%)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.08)_35%,transparent_50%)] opacity-60 animate-[pulse_3.5s_ease-in-out_infinite]" />
      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border border-white/15 bg-white/5 backdrop-blur-md" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-300 border-r-cyan-200 animate-spin shadow-[0_0_80px_rgba(103,232,249,0.35)]" />
          <div className="absolute inset-4 rounded-full border border-white/10 bg-white/10" />
          <div className="absolute inset-7 rounded-full bg-cyan-300/20 blur-md" />
        </div>
        <div>
          <p className="font-heading text-xs uppercase tracking-[0.5em] text-cyan-100/90">Welcome</p>
          <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-white/70">{subtitle}</p>
        </div>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-linear-to-r from-cyan-300 via-white to-cyan-300 animate-[loading-bar_1.6s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
