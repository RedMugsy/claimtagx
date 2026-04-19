import { LogOut, Palette, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MODES, MODE_ICONS } from "@/lib/modes";

export default function Settings() {
  const { session, mode, setMode, signOut } = useStore();

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
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Venue</div>
              <div className="text-white font-semibold">{session?.venueName}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Venue code</div>
              <div className="text-white font-mono">{session?.venueCode}</div>
            </div>
          </div>
        </section>

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
            <div className="text-sm text-slate">Sign out and return to the venue picker.</div>
          </div>
          <Button
            variant="secondary"
            onClick={signOut}
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
