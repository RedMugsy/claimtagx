import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { MODE_BY_ID, MODE_ICONS, MODES } from "@/lib/modes";
import { ChevronDown, ClipboardList, PackagePlus, ScanLine, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

const tabs = [
  { path: "/intake", label: "Intake", icon: PackagePlus },
  { path: "/custody", label: "Custody", icon: ClipboardList },
  { path: "/release", label: "Release", icon: ScanLine },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: ReactNode }) {
  const { session, mode, setMode, signOut, assets } = useStore();
  const [location] = useLocation();
  const cfg = MODE_BY_ID[mode];
  const ModeIcon = MODE_ICONS[mode];
  const activeCount = assets.filter((a) => a.status === "active" && a.mode === mode).length;

  return (
    <div className="min-h-screen w-full flex flex-col bg-obsidian text-paper font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-obsidian/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/intake" className="flex items-center gap-1 group shrink-0">
            <span className="font-extrabold text-lg tracking-tight text-white">Claim</span>
            <span className="font-extrabold text-lg tracking-tight text-lime">TagX</span>
            <span className="ml-2 text-xs font-mono uppercase tracking-wider text-slate">handler</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-steel/40 px-3 py-1.5 hover-elevate text-sm"
                data-testid="button-mode-switcher"
              >
                <ModeIcon className="w-4 h-4 text-lime" />
                <span className="font-semibold text-white">{cfg.label}</span>
                <span className="font-mono text-xs text-slate">{activeCount}</span>
                <ChevronDown className="w-4 h-4 text-slate" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuLabel>Switch asset mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODES.map((m) => {
                const Icon = MODE_ICONS[m.id];
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onSelect={() => setMode(m.id)}
                    data-testid={`menuitem-mode-${m.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{m.label}</span>
                    <span className="ml-auto text-xs text-slate">{m.short}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 text-right hover-elevate rounded-xl px-2 py-1.5"
                data-testid="button-handler-menu"
              >
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-white">{session?.handlerName}</div>
                  <div className="text-xs text-slate font-mono">{session?.venueName}</div>
                </div>
                <div className="sm:hidden leading-tight text-right">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate -mb-0.5">
                    {session?.venueName}
                  </div>
                  <div className="text-xs font-semibold text-white truncate max-w-[7rem]">
                    {session?.handlerName}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center text-lime font-bold shrink-0">
                  {(session?.handlerName ?? "H").slice(0, 1)}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{session?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut} data-testid="menuitem-signout">
                <LogOut className="w-4 h-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-10">
        {children}
      </main>

      {/* Bottom tab nav (mobile-first, also visible on desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-obsidian/95 backdrop-blur-md sm:static sm:border-t sm:bg-transparent">
        <div className="max-w-5xl mx-auto px-2 sm:px-6 py-2 grid grid-cols-4 gap-1 sm:flex sm:justify-center sm:gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = location.startsWith(t.path);
            return (
              <Link
                key={t.path}
                href={t.path}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium transition-colors hover-elevate ${
                  active ? "bg-lime/10 text-lime" : "text-slate hover:text-white"
                }`}
                data-testid={`link-tab-${t.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
