export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-cockpit-gradient" />
      <div className="absolute inset-0 bg-amber-glow" />

      {/* Animated horizon line */}
      <div className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-600/30 to-transparent" />
      <div className="absolute bottom-1/3 translate-y-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      {/* Corner HUD elements */}
      <div className="absolute top-8 left-8 flex items-center gap-2 opacity-40">
        <div className="w-8 h-px bg-amber-500" />
        <span className="text-amber-500 font-mono text-xs tracking-widest">SYS:ONLINE</span>
      </div>
      <div className="absolute top-8 right-8 flex items-center gap-2 opacity-40">
        <span className="text-sky-400 font-mono text-xs tracking-widest">v1.0.0</span>
        <div className="w-8 h-px bg-sky-400" />
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-30">
        <div className="flex items-center gap-6 text-xs font-mono text-sky-400 tracking-widest">
          <span>ALT: 35,000 FT</span>
          <span className="w-px h-3 bg-sky-400/50" />
          <span>HDG: 270°</span>
          <span className="w-px h-3 bg-sky-400/50" />
          <span>AIRSPEED: 480 KTS</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
