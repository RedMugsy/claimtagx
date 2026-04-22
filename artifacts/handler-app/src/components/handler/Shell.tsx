import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { VENUE_TYPE_ICON, VENUE_TYPE_LABEL } from "@/lib/modes";
import { ChevronDown, ClipboardList, ScanLine, Settings, LogOut, Building2, Plus, Check, History as HistoryIcon, LayoutGrid, WifiOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";

type StreamStatus = "idle" | "connecting" | "connected" | "disconnected";

function StreamStatusDot({ status }: { status: StreamStatus }) {
  const meta: Record<StreamStatus, { label: string; dot: string; ring: string; pulse: boolean }> = {
    connected: { label: "Live", dot: "bg-lime", ring: "bg-lime/40", pulse: true },
    connecting: { label: "Reconnecting…", dot: "bg-amber-400", ring: "bg-amber-400/40", pulse: true },
    disconnected: { label: "Reconnecting…", dot: "bg-amber-400", ring: "bg-amber-400/40", pulse: true },
    idle: { label: "Paused", dot: "bg-slate", ring: "bg-slate/30", pulse: false },
  };
  const { label, dot, ring, pulse } = meta[status];
  return (
    <span
      className="relative inline-flex items-center justify-center w-6 h-6 shrink-0"
      title={label}
      aria-label={`Live updates: ${label}`}
      data-testid="indicator-stream-status"
      data-status={status}
    >
      {pulse && (
        <span className={`absolute inline-flex h-3 w-3 rounded-full opacity-60 animate-ping ${ring}`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dot}`} />
    </span>
  );
}

const tabs = [
  { path: "/", label: "Home", icon: LayoutGrid, exact: true },
  { path: "/custody", label: "Custody", icon: ClipboardList },
  { path: "/release", label: "Scan", icon: ScanLine },
  { path: "/history", label: "History", icon: HistoryIcon },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: ReactNode }) {
  const { session, mode, signOut, assets, venues, activeVenue, setActiveVenue, streamStatus } = useStore();
  const [location, navigate] = useLocation();
  // The header chip used to be a dropdown letting handlers pick an asset
  // mode. The mode now follows the venue's classification — set by the
  // owner once in settings — so the chip becomes a passive label that
  // tells handlers what kind of venue they're working in and how many
  // items are currently in custody.
  const venueType = activeVenue?.venueType ?? "other";
  const venueTypeLabel = VENUE_TYPE_LABEL[venueType];
  const VenueTypeIcon = VENUE_TYPE_ICON[venueType];
  const activeCount = assets.filter((a) => a.status === "active" && a.mode === mode).length;

  return (
    <div className="min-h-screen w-full flex flex-col bg-obsidian text-paper font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-obsidian/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-1 group shrink-0">
            <span className="font-extrabold text-lg tracking-tight text-white">Claim</span>
            <span className="font-extrabold text-lg tracking-tight text-lime">TagX</span>
            <span className="ml-2 text-xs font-mono uppercase tracking-wider text-slate">handler</span>
          </Link>

          <StreamStatusDot status={streamStatus} />

          <div
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-steel/40 px-3 py-1.5 text-sm"
            data-testid="badge-venue-type"
            title={`Venue type: ${venueTypeLabel}`}
          >
            <VenueTypeIcon className="w-4 h-4 text-lime" />
            <span className="font-semibold text-white">{venueTypeLabel}</span>
            <span className="font-mono text-xs text-slate">{activeCount}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-steel/40 px-3 py-1.5 hover-elevate text-sm"
                data-testid="button-venue-switcher"
              >
                <Building2 className="w-4 h-4 text-lime" />
                <span className="font-semibold text-white truncate max-w-[10rem]">
                  {activeVenue?.name ?? "Pick venue"}
                </span>
                <span className="font-mono text-xs text-slate">{activeVenue?.code ?? ""}</span>
                <ChevronDown className="w-4 h-4 text-slate" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch venue</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {venues.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate">No venues yet</div>
              )}
              {venues.map((v) => {
                const active = v.code === activeVenue?.code;
                return (
                  <DropdownMenuItem
                    key={v.code}
                    onSelect={() => setActiveVenue(v.code)}
                    data-testid={`menuitem-venue-${v.code}`}
                  >
                    <Building2 className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{v.name}</div>
                      <div className="text-[10px] font-mono text-slate">{v.code}</div>
                    </div>
                    {active && <Check className="w-4 h-4 text-lime" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigate("/settings")}
                data-testid="menuitem-add-venue"
              >
                <Plus className="w-4 h-4" /> Manage venues
              </DropdownMenuItem>
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
              <DropdownMenuItem
                onSelect={() => navigate("/settings")}
                data-testid="menuitem-settings"
              >
                <Settings className="w-4 h-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => void signOut()}
                data-testid="menuitem-signout"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {streamStatus === "disconnected" && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-500/15 border-b border-amber-500/40 text-amber-200"
          data-testid="banner-stream-disconnected"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 text-xs sm:text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Live updates paused — reconnecting. Your list may be out of date until the connection comes back.
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-10">
        {children}
      </main>

      {/* Bottom tab nav (mobile-first, also visible on desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-obsidian/95 backdrop-blur-md sm:static sm:border-t sm:bg-transparent">
        <div className="max-w-5xl mx-auto px-2 sm:px-6 py-2 grid grid-cols-5 gap-1 sm:flex sm:justify-center sm:gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = t.exact ? location === t.path : location.startsWith(t.path);
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
