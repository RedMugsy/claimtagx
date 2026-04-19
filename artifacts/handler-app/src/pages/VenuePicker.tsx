import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, LogOut, Building2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fetchAvailableVenues } from "@/lib/api";
import type { AvailableVenue } from "@/lib/types";

export default function VenuePicker() {
  const { venues, joinVenue, signOut, session } = useStore();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useQuery({
    queryKey: ["available-venues"],
    queryFn: fetchAvailableVenues,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (venues.length > 0) setError(null);
  }, [venues.length]);

  const join = async (inviteToken: string) => {
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
    void join(token.trim());
  };

  const presets: AvailableVenue[] = available.data ?? [];
  const knownCodes = new Set(venues.map((v) => v.code));
  const unjoinedPresets = presets.filter((v) => !knownCodes.has(v.code));

  return (
    <div className="min-h-screen w-full bg-obsidian text-paper font-sans bg-gradient-mesh flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-lg"
      >
        <div className="flex items-center gap-1 justify-center mb-6">
          <span className="font-extrabold text-3xl tracking-tight text-white">Claim</span>
          <span className="font-extrabold text-3xl tracking-tight text-lime">TagX</span>
          <span className="ml-3 text-sm font-mono uppercase tracking-wider text-slate">handler</span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-steel/40 backdrop-blur-md p-8 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-lime mb-4">
              <ShieldCheck className="w-3 h-3" /> Pick a venue
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-1">
              {venues.length === 0 ? "Join your first venue" : "Open a venue"}
            </h1>
            <p className="text-sm text-slate">
              {session?.email ? (
                <>Signed in as <span className="text-white font-mono">{session.email}</span>.</>
              ) : (
                <>Redeem an invite from your venue manager to get started.</>
              )}
            </p>
          </div>

          {unjoinedPresets.length > 0 && (
            <div className="mb-6">
              <Label className="text-xs font-mono uppercase tracking-wide text-slate mb-2 block">
                Demo venues (open invites)
              </Label>
              <div className="space-y-2">
                {unjoinedPresets.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => void join(v.inviteToken)}
                    disabled={busy}
                    className="w-full text-left flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-3 hover-elevate disabled:opacity-50"
                    data-testid={`button-join-${v.code}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-lime/15 border border-lime/30 flex items-center justify-center text-lime shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{v.name}</div>
                        <div className="text-xs font-mono text-slate">{v.code}</div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite" className="text-xs font-mono uppercase tracking-wide text-slate">
                Have an invite token?
              </Label>
              <Input
                id="invite"
                placeholder="invite-xxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate font-mono tracking-wider"
                data-testid="input-invite-token"
              />
            </div>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={busy || !token.trim()}
              className="w-full bg-lime text-obsidian hover:bg-lime-hover font-bold py-3 rounded-xl text-base"
              data-testid="button-redeem-invite"
            >
              Redeem invite <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {venues.length > 0 && (
            <div className="mt-6">
              <Label className="text-xs font-mono uppercase tracking-wide text-slate mb-2 block">
                Your venues
              </Label>
              <div className="space-y-2">
                {venues.map((v) => (
                  <div
                    key={v.code}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{v.name}</div>
                      <div className="text-xs font-mono text-slate">{v.code}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-lime">
                      {v.role ?? "member"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => void signOut()}
          className="mt-6 mx-auto flex items-center gap-2 text-xs font-mono text-slate hover:text-white"
          data-testid="button-signout-picker"
        >
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </motion.div>
    </div>
  );
}
