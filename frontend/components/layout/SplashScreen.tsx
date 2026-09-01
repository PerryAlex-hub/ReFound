import { Search } from 'lucide-react';

/** Branded loading state shown while auth resolves — see (app)/layout.tsx and admin/layout.tsx. */
export function SplashScreen() {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[#FB923C] to-[#EA580C] px-6">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center">
          <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-lg">
            <Search size={30} className="text-[#F97316]" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ReFound</h1>
          <p className="text-sm font-medium text-white/90 mt-1">Reuniting you with what matters.</p>
        </div>
      </div>

      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-0.5">
        <p className="text-xs text-white/70">Campus Lost &amp; Found Platform</p>
        <p className="text-[11px] text-white/50">v1.0.2</p>
      </div>
    </div>
  );
}
