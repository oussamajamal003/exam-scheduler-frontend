import { Building2, CalendarClock, GraduationCap, ShieldCheck, Users } from 'lucide-react';

type SplashScreenProps = {
  title?: string;
  subtitle?: string;
};

export function SplashScreen({
  title = "SIS Exam Operations",
  subtitle = "Syncing student records, rooms, proctors and exam windows",
}: SplashScreenProps) {
  const metrics = [
    { label: 'Students', value: '2.4k', icon: Users, tone: 'text-cyan-200' },
    { label: 'Rooms', value: '48', icon: Building2, tone: 'text-emerald-200' },
    { label: 'Slots', value: '126', icon: CalendarClock, tone: 'text-amber-200' },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,47,73,0.48)_0%,rgba(9,9,11,0.96)_42%,rgba(20,83,45,0.34)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[42px_42px] opacity-45" />
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/40 to-transparent" />

      <div className="relative flex w-full max-w-3xl flex-col items-center gap-7 px-6 text-center">
        <div className="grid w-full max-w-xl grid-cols-3 gap-2 rounded-none border border-white/10 bg-white/6 p-2 shadow-2xl shadow-black/35 backdrop-blur-xl">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="min-w-0 border border-white/10 bg-zinc-950/45 px-3 py-2 text-left">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                <Icon className={`size-3.5 ${tone}`} />
                <span className="truncate">{label}</span>
              </div>
              <div className="mt-1 font-heading text-lg font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>

        <div className="relative flex size-24 items-center justify-center rounded-none border border-cyan-200/25 bg-zinc-950/60 shadow-[0_18px_80px_-32px_rgba(34,211,238,0.85)] backdrop-blur-xl">
          <div className="absolute inset-2 border border-white/10" />
          <div className="absolute inset-0 border-2 border-transparent border-t-cyan-200 border-r-emerald-200 animate-spin" />
          <GraduationCap className="size-10 text-cyan-100" />
          <ShieldCheck className="absolute -right-2 -bottom-2 size-7 rounded-none border border-emerald-200/40 bg-emerald-950 p-1 text-emerald-200" />
        </div>

        <div>
          <p className="font-heading text-xs uppercase tracking-[0.42em] text-cyan-100/85">Secure University Portal</p>
          <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/70">{subtitle}</p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <span>Loading SIS</span>
            <span>Verified</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-linear-to-r from-cyan-300 via-emerald-200 to-amber-200 animate-[loading-bar_1.6s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}
