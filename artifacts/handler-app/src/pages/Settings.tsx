import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Check,
  LogOut,
  Palette,
  Plus,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { MODES, MODE_ICONS } from "@/lib/modes";
import { fetchAvailableVenues } from "@/lib/api";
import type { AvailableVenue } from "@/lib/types";
import { InvitationsInbox } from "@/components/handler/InvitationsInbox";
import { VenueAdminPanel } from "@/components/handler/VenueAdminPanel";

const OWNER_ROLES = new Set(["owner", "supervisor"]);

export default function Settings() {
  const {
    session,
    mode,
    setMode,
    signOut,
    venues,
    activeVenue,
    setActiveVenue,
    joinVenue,
    leaveVenue,
  } = useStore();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useQuery({
    queryKey: ["available-venues"],
    queryFn: fetchAvailableVenues,
    staleTime: 5 * 60_000,
  });

  const knownCodes = new Set(venues.map((v) => v.code));
  const presets: AvailableVenue[] = (available.data ?? []).filter(
    (v) => !knownCodes.has(v.code),
  );
  const ownedVenues = venues.filter((v) => OWNER_ROLES.has(v.role ?? ""));

  const onAdd = async (inviteToken: string) => {
    setBusy(true);
    setError(null);
    try {
      await joinVenue(inviteToken);
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem invite");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    void onAdd(token.trim());
  };

  const onLeave = async (leaveCode: string) => {
    setBusy(true);
    try {
      await leaveVenue(leaveCode);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">Shift</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <InvitationsInbox />

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-4">Handler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Name</div>
              <div className="text-white font-semibold">{session?.handlerName}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Email</div>
              <div className="text-white font-mono">{session?.email}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Active venue</div>
              <div className="text-white font-semibold">{session?.venueName}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Venue code</div>
              <div className="text-white font-mono">{session?.venueCode}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Venues
          </h2>

          <div className="space-y-2 mb-5">
            {venues.map((v) => {
              const active = v.code === activeVenue?.code;
              return (
                <div
                  key={v.code}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                    active
                      ? "border-lime/40 bg-lime/10"
                      : "border-white/10 bg-obsidian/40"
                  }`}
                  data-testid={`venue-row-${v.code}`}
                >
                  <button
                    onClick={() => setActiveVenue(v.code)}
                    className="flex items-center gap-3 text-left min-w-0"
                  >
                    <div className="w-9 h-9 rounded-xl bg-lime/15 border border-lime/30 flex items-center justify-center text-lime shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{v.name}</div>
                      <div className="text-xs font-mono text-slate">
                        {v.code} · {v.role ?? "handler"}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {active ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-lime flex items-center gap-1">
                        <Check className="w-3 h-3" /> active
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveVenue(v.code)}
                        data-testid={`button-activate-${v.code}`}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onLeave(v.code)}
                      className="text-red-300 hover:text-red-200"
                      data-testid={`button-leave-${v.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {venues.length === 0 && (
              <div className="text-sm text-slate">You aren't a member of any venue yet.</div>
            )}
          </div>

          {presets.length > 0 && (
            <div className="mb-4">
              <Label className="text-xs font-mono uppercase tracking-wide text-slate mb-2 block">
                Demo venues to join
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((v) => (
                  <button
                    key={v.code}
                    onClick={() => void onAdd(v.inviteToken)}
                    disabled={busy}
                    className="text-left flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-3 hover-elevate disabled:opacity-50"
                    data-testid={`button-join-${v.code}`}
                  >
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{v.name}</div>
                      <div className="text-xs font-mono text-slate">{v.code}</div>
                    </div>
                    <Plus className="w-4 h-4 text-slate" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-token" className="text-xs font-mono uppercase tracking-wide text-slate">
                Add venue by invite token
              </Label>
              <Input
                id="invite-token"
                placeholder="invite-xxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate font-mono"
                data-testid="input-add-invite-token"
              />
            </div>
            <Button
              type="submit"
              disabled={busy || !token.trim()}
              className="bg-lime text-obsidian hover:bg-lime-hover font-bold"
              data-testid="button-redeem-invite-settings"
            >
              <Plus className="w-4 h-4" /> Redeem
            </Button>
          </form>
          {error && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
        </section>

        {ownedVenues.map((v) => (
          <VenueAdminPanel key={v.code} venue={v} />
        ))}

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-4">Asset mode</h2>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((m) => {
              const Icon = MODE_ICONS[m.id];
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`text-left rounded-2xl border p-4 hover-elevate transition-colors ${
                    active
                      ? "border-lime/40 bg-lime/10"
                      : "border-white/10 bg-obsidian/40"
                  }`}
                  data-testid={`button-mode-${m.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${active ? "text-lime" : "text-slate"}`} />
                    <span className="font-bold text-white">{m.label}</span>
                  </div>
                  <div className="text-xs text-slate">{m.blurb}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Theme
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Obsidian", hex: "#0B0F19" },
              { name: "Lime", hex: "#C6F24E" },
              { name: "Steel", hex: "#1F2937" },
              { name: "Slate", hex: "#64748B" },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/10 bg-obsidian/40 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl border border-white/10" style={{ background: c.hex }} />
                <div>
                  <div className="text-sm text-white font-semibold">{c.name}</div>
                  <div className="text-xs text-slate font-mono">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate font-mono">
            Inter · JetBrains Mono · radius 16px · matches the marketing site
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6 flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">End shift</div>
            <div className="text-sm text-slate">Sign out and return to the login screen.</div>
          </div>
          <Button
            variant="secondary"
            onClick={() => void signOut()}
            data-testid="button-signout"
            className="border-red-500/30 text-red-300 hover:text-red-200"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}
