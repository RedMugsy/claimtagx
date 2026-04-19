import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

const VENUES: Record<string, string> = {
  "VLT-001": "Hotel Meridian — Valet",
  "BAG-002": "Grand Central Left-Luggage",
  "CLK-003": "Théâtre Lumière Cloakroom",
  "RET-004": "Marche Verre Retail Hold",
};

export default function Login() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) return;
    const venueName = VENUES[code.toUpperCase()] ?? "Demo Venue";
    const handlerName =
      email
        .split("@")[0]
        .split(/[._-]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ") || "Handler";
    signIn({
      email: email.trim(),
      venueCode: code.trim().toUpperCase(),
      venueName,
      handlerName,
    });
  };

  return (
    <div className="min-h-screen w-full bg-obsidian text-paper font-sans bg-gradient-mesh flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="flex items-center gap-1 justify-center mb-8">
          <span className="font-extrabold text-3xl tracking-tight text-white">Claim</span>
          <span className="font-extrabold text-3xl tracking-tight text-lime">TagX</span>
          <span className="ml-3 text-sm font-mono uppercase tracking-wider text-slate">handler</span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-steel/40 backdrop-blur-md p-8 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-lime mb-4">
              <ShieldCheck className="w-3 h-3" /> Handler sign-in
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-1">Open your venue</h1>
            <p className="text-sm text-slate">
              Enter your handler email and venue code to start a custody shift.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wide text-slate">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@hotel-meridian.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-mono uppercase tracking-wide text-slate">
                Venue code
              </Label>
              <Input
                id="code"
                placeholder="VLT-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate font-mono tracking-wider uppercase"
                data-testid="input-code"
              />
              <div className="text-[11px] text-slate font-mono">
                Try: VLT-001 · BAG-002 · CLK-003 · RET-004
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-lime text-obsidian hover:bg-lime-hover font-bold py-3 rounded-xl text-base"
              data-testid="button-signin"
            >
              Open shift <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate mt-6 font-mono">
          Placeholder auth · accepts any email + venue code
        </p>
      </motion.div>
    </div>
  );
}
