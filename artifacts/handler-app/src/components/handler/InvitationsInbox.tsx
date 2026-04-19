import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MailOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  acceptInvitation,
  declineInvitation,
  fetchMyInvitations,
} from "@/lib/api";
import { useStore } from "@/lib/store";

interface Props {
  variant?: "card" | "inline";
}

export function InvitationsInbox({ variant = "card" }: Props) {
  const qc = useQueryClient();
  const { refreshMe, setActiveVenue } = useStore();

  const invitations = useQuery({
    queryKey: ["my-invitations"],
    queryFn: fetchMyInvitations,
    refetchOnWindowFocus: true,
  });

  const accept = useMutation({
    mutationFn: (id: string) => acceptInvitation(id),
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ["my-invitations"] });
      await refreshMe();
      if (data?.venue?.code) setActiveVenue(data.venue.code);
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => declineInvitation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["my-invitations"] }),
  });

  const list = invitations.data ?? [];
  if (list.length === 0) {
    if (variant === "inline") return null;
    return null;
  }

  const Wrapper = variant === "card" ? "section" : "div";
  const wrapperClass =
    variant === "card"
      ? "rounded-3xl border border-white/10 bg-steel/40 p-6"
      : "rounded-3xl border border-lime/30 bg-lime/5 p-5";

  return (
    <Wrapper className={wrapperClass} data-testid="invitations-inbox">
      <Label className="text-xs font-mono uppercase tracking-wide text-slate mb-3 flex items-center gap-2">
        <MailOpen className="w-3 h-3" /> Invitations
      </Label>
      <div className="space-y-2">
        {list.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-obsidian/40 px-4 py-3"
            data-testid={`invitation-${inv.id}`}
          >
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">
                {inv.venueName}
              </div>
              <div className="text-xs font-mono text-slate truncate">
                {inv.venueCode} · {inv.role}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                disabled={accept.isPending}
                onClick={() => accept.mutate(inv.id)}
                className="bg-lime text-obsidian hover:bg-lime-hover font-bold"
                data-testid={`button-accept-invite-${inv.id}`}
              >
                <Check className="w-4 h-4" /> Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={decline.isPending}
                onClick={() => decline.mutate(inv.id)}
                className="text-slate hover:text-white"
                data-testid={`button-decline-invite-${inv.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
