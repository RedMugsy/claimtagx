import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createVenueInvitation,
  fetchVenueInvitations,
  fetchVenueMembers,
  revokeVenueInvitation,
  revokeVenueMember,
} from "@/lib/api";
import type { VenueMembership } from "@/lib/types";

type Role = "handler" | "supervisor" | "owner";

interface Props {
  venue: VenueMembership;
}

export function VenueAdminPanel({ venue }: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("handler");
  const [error, setError] = useState<string | null>(null);

  const invitationsKey = ["venue-invitations", venue.code];
  const membersKey = ["venue-members", venue.code];

  const invitations = useQuery({
    queryKey: invitationsKey,
    queryFn: () => fetchVenueInvitations(venue.code),
  });
  const members = useQuery({
    queryKey: membersKey,
    queryFn: () => fetchVenueMembers(venue.code),
  });

  const inviteMut = useMutation({
    mutationFn: () => createVenueInvitation(venue.code, { email, role }),
    onSuccess: () => {
      setEmail("");
      setError(null);
      qc.invalidateQueries({ queryKey: invitationsKey });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not send invite"),
  });

  const revokeInvite = useMutation({
    mutationFn: (id: string) => revokeVenueInvitation(venue.code, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitationsKey }),
  });

  const revokeAccess = useMutation({
    mutationFn: (userId: string) => revokeVenueMember(venue.code, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMut.mutate();
  };

  return (
    <section
      className="rounded-3xl border border-white/10 bg-steel/40 p-6"
      data-testid={`venue-admin-${venue.code}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono uppercase tracking-wide text-slate flex items-center gap-2">
          <Shield className="w-4 h-4" /> Manage {venue.name}
        </h2>
        <span className="text-[10px] font-mono uppercase tracking-wider text-lime">
          {venue.role}
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end mb-4">
        <div className="space-y-1.5">
          <Label htmlFor={`invite-email-${venue.code}`} className="text-xs font-mono uppercase tracking-wide text-slate">
            Invite handler by email
          </Label>
          <Input
            id={`invite-email-${venue.code}`}
            placeholder="handler@venue.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate font-mono"
            data-testid={`input-invite-email-${venue.code}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-slate">Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-10 rounded-xl bg-obsidian/40 border border-white/10 text-white px-3 text-sm font-mono"
            data-testid={`select-invite-role-${venue.code}`}
          >
            <option value="handler">Handler</option>
            <option value="supervisor">Supervisor</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <Button
          type="submit"
          disabled={inviteMut.isPending || !email.trim()}
          className="bg-lime text-obsidian hover:bg-lime-hover font-bold"
          data-testid={`button-send-invite-${venue.code}`}
        >
          <UserPlus className="w-4 h-4" /> Invite
        </Button>
      </form>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Label className="text-xs font-mono uppercase tracking-wide text-slate mb-2 block flex items-center gap-2">
          <Mail className="w-3 h-3" /> Pending invites
        </Label>
        <div className="space-y-2">
          {invitations.data?.length === 0 && !invitations.isLoading && (
            <div className="text-xs text-slate">No pending invitations.</div>
          )}
          {invitations.data?.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-3"
              data-testid={`pending-invite-${inv.id}`}
            >
              <div className="min-w-0">
                <div className="text-white font-mono text-sm truncate">{inv.email}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
                  {inv.role}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={revokeInvite.isPending}
                onClick={() => revokeInvite.mutate(inv.id)}
                className="text-red-300 hover:text-red-200"
                data-testid={`button-revoke-invite-${inv.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-mono uppercase tracking-wide text-slate mb-2 block">
          Members
        </Label>
        <div className="space-y-2">
          {members.data?.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-3"
              data-testid={`venue-member-${m.userId}`}
            >
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{m.name}</div>
                <div className="text-xs font-mono text-slate truncate">{m.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate">
                  {m.role}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revokeAccess.isPending}
                  onClick={() => revokeAccess.mutate(m.userId)}
                  className="text-red-300 hover:text-red-200"
                  data-testid={`button-revoke-member-${m.userId}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {members.data?.length === 0 && !members.isLoading && (
            <div className="text-xs text-slate">No members yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
