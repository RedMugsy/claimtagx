import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LogOut, MailOpen, ShieldCheck } from "lucide-react";
import { fetchMyInvitations } from "@/lib/api";
import { InvitationsInbox } from "@/components/handler/InvitationsInbox";
import { useStore } from "@/lib/store";

// Standalone page shown to a signed-in handler who has no venue memberships
// yet but does have at least one pending email invitation. We deliberately
// do NOT hang this off the venue picker — invited users should land directly
// here, accept, and be dropped into the venue without a picker step.
export default function Invitations() {
  const { signOut, session } = useStore();
  const invitations = useQuery({
    queryKey: ["my-invitations"],
    queryFn: fetchMyInvitations,
  });

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
              <ShieldCheck className="w-3 h-3" /> Pending invitations
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-1">
              You're invited
            </h1>
            <p className="text-sm text-slate">
              {session?.email
                ? <>Signed in as <span className="text-white font-mono">{session.email}</span>. Accept an invitation to start a shift.</>
                : <>Accept an invitation from your venue manager to start a shift.</>}
            </p>
          </div>

          {invitations.isLoading ? (
            <div className="text-sm text-slate font-mono">Loading…</div>
          ) : (
            <InvitationsInbox variant="inline" />
          )}

          {!invitations.isLoading && (invitations.data ?? []).length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-6 text-center">
              <MailOpen className="w-6 h-6 text-slate mx-auto mb-2" />
              <div className="text-sm text-white font-semibold">No invitations yet</div>
              <div className="text-xs text-slate mt-1">
                Ask your venue owner to invite you by email.
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => void signOut()}
          className="mt-6 mx-auto flex items-center gap-2 text-xs font-mono text-slate hover:text-white"
          data-testid="button-signout-invitations"
        >
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </motion.div>
    </div>
  );
}
