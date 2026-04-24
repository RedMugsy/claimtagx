import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Radio,
  Mic,
  Users,
  PhoneOff,
  Check,
  Volume2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getListIntercomPresenceQueryKey,
  getListIntercomTransmissionsQueryKey,
  joinIntercom,
  leaveIntercom,
  listIntercomPresence,
  listIntercomTransmissions,
  transmitIntercom,
  type IntercomTransmission,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const i = result.indexOf(",");
      resolve(i >= 0 ? result.slice(i + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function pickSupportedMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      // ignore
    }
  }
  return "audio/webm";
}

// Special sentinel for "broadcast to entire station". When this is the only
// selected target the channel behaves as an open walkie-talkie.
const TARGET_STATION = "__station__";

export default function IntercomPage() {
  const { activeVenue } = useStore();
  const venueCode = activeVenue?.code ?? "";
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [targets, setTargets] = useState<Set<string>>(
    () => new Set([TARGET_STATION]),
  );
  const [lastHeard, setLastHeard] = useState<IntercomTransmission | null>(null);
  const [nowTalking, setNowTalking] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);
  const lastSeenRef = useRef<number>(Date.now());
  const playedIdsRef = useRef<Set<string>>(new Set());
  const nowTalkingTimerRef = useRef<number | null>(null);

  const presence = useQuery({
    queryKey: getListIntercomPresenceQueryKey(venueCode),
    queryFn: () => listIntercomPresence(venueCode),
    enabled: Boolean(venueCode) && joined,
    refetchInterval: 8_000,
  });

  const transmissions = useQuery({
    queryKey: getListIntercomTransmissionsQueryKey(venueCode, {
      excludeSelf: true,
    }),
    queryFn: () =>
      listIntercomTransmissions(venueCode, {
        since: lastSeenRef.current,
        excludeSelf: true,
      }),
    enabled: Boolean(venueCode) && joined,
    refetchInterval: 3_000,
  });

  // Join on mount, heartbeat every 60s, leave on unmount.
  useEffect(() => {
    if (!venueCode) return;
    let cancelled = false;
    (async () => {
      try {
        await joinIntercom(venueCode);
        if (!cancelled) {
          setJoined(true);
          lastSeenRef.current = Date.now() - 30_000;
          queryClient.invalidateQueries({
            queryKey: getListIntercomPresenceQueryKey(venueCode),
          });
        }
      } catch (e: unknown) {
        const err = e as Error;
        toast({
          title: "Could not join intercom",
          description: err.message,
          variant: "destructive",
        });
      }
    })();
    const hb = window.setInterval(() => {
      joinIntercom(venueCode).catch(() => {});
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(hb);
      leaveIntercom(venueCode).catch(() => {});
      try {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
        streamRef.current = null;
      }
    };
  }, [venueCode, queryClient]);

  // Auto-play new transmissions and surface "now talking" indicator.
  useEffect(() => {
    const list = transmissions.data ?? [];
    if (list.length === 0) return;
    let lastTs = lastSeenRef.current;
    let latest: IntercomTransmission | null = null;
    for (const tx of list) {
      if (tx.createdAt > lastTs) lastTs = tx.createdAt;
      if (playedIdsRef.current.has(tx.id)) continue;
      playedIdsRef.current.add(tx.id);
      try {
        const audio = new Audio(`data:${tx.mimeType};base64,${tx.audioBase64}`);
        audio.play().catch(() => {});
      } catch {
        // ignore decode failures
      }
      if (!latest || tx.createdAt > latest.createdAt) latest = tx;
    }
    if (latest) {
      setLastHeard(latest);
      setNowTalking(latest.senderName);
      if (nowTalkingTimerRef.current) window.clearTimeout(nowTalkingTimerRef.current);
      const clearAfter = Math.max(1500, (latest.durationMs || 1500) + 800);
      nowTalkingTimerRef.current = window.setTimeout(() => {
        setNowTalking(null);
      }, clearAfter);
    }
    lastSeenRef.current = lastTs;
  }, [transmissions.data]);

  useEffect(() => {
    return () => {
      if (nowTalkingTimerRef.current) window.clearTimeout(nowTalkingTimerRef.current);
    };
  }, []);

  const transmitMut = useMutation({
    mutationFn: ({
      audioBase64,
      mimeType,
      durationMs,
      targetUserIds,
    }: {
      audioBase64: string;
      mimeType: string;
      durationMs: number;
      targetUserIds: string[] | null;
    }) =>
      // NOTE: The backend currently broadcasts to all handlers on the channel.
      // `targetUserIds` is forwarded for forward-compatibility once the API
      // supports targeted PTT; it is silently ignored today.
      transmitIntercom(venueCode, {
        audioBase64,
        mimeType,
        durationMs,
        ...(targetUserIds && targetUserIds.length > 0
          ? ({ targetUserIds } as unknown as Record<string, unknown>)
          : {}),
      } as Parameters<typeof transmitIntercom>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getListIntercomTransmissionsQueryKey(venueCode, {
          excludeSelf: true,
        }),
      });
    },
    onError: (e: Error) =>
      toast({
        title: "Transmission failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  async function startRecording() {
    setRecordError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecordError("Microphone not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickSupportedMime();
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const durationMs = Math.max(
          0,
          Math.min(15_000, Date.now() - recordStartRef.current),
        );
        const stopTracks = () => {
          if (streamRef.current) {
            for (const t of streamRef.current.getTracks()) t.stop();
            streamRef.current = null;
          }
        };
        try {
          if (chunksRef.current.length === 0) {
            stopTracks();
            return;
          }
          const blob = new Blob(chunksRef.current, { type: mime });
          if (blob.size < 200) {
            stopTracks();
            return;
          }
          const audioBase64 = await blobToBase64(blob);
          const stationOnly = targets.has(TARGET_STATION) || targets.size === 0;
          const targetUserIds = stationOnly
            ? null
            : Array.from(targets).filter((t) => t !== TARGET_STATION);
          transmitMut.mutate({
            audioBase64,
            mimeType: mime,
            durationMs,
            targetUserIds,
          });
        } finally {
          stopTracks();
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      recordStartRef.current = Date.now();
      setRecording(true);
      window.setTimeout(() => {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
          setRecording(false);
        }
      }, 15_000);
    } catch (e: unknown) {
      const err = e as Error;
      setRecordError(err.message || "Could not access microphone");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function toggleTarget(id: string) {
    setTargets((prev) => {
      const next = new Set(prev);
      if (id === TARGET_STATION) {
        return new Set([TARGET_STATION]);
      }
      next.delete(TARGET_STATION);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) next.add(TARGET_STATION);
      return next;
    });
  }

  const presenceList = presence.data ?? [];
  const stationSelected = targets.has(TARGET_STATION);
  const individualCount = stationSelected
    ? 0
    : Array.from(targets).filter((t) => t !== TARGET_STATION).length;

  const targetSummary = useMemo(() => {
    if (stationSelected) return "Whole station";
    if (individualCount === 1) {
      const id = Array.from(targets)[0];
      const p = presenceList.find((x) => x.handlerUserId === id);
      return p?.handlerName ?? "1 handler";
    }
    return `${individualCount} handlers`;
  }, [stationSelected, individualCount, targets, presenceList]);

  return (
    <div className="space-y-4 pb-44 sm:pb-40" data-testid="page-intercom">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Command Center
        </Link>
        <button
          type="button"
          onClick={() => {
            leaveIntercom(venueCode)
              .catch(() => {})
              .finally(() => {
                setJoined(false);
                window.history.back();
              });
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-obsidian/40 text-slate px-3 py-1.5 text-xs font-semibold hover-elevate"
          data-testid="button-leave-intercom"
        >
          <PhoneOff className="w-3.5 h-3.5" /> Leave channel
        </button>
      </div>

      {/* Channel header */}
      <div className="rounded-3xl border border-white/10 bg-steel/40 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
              joined
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                : "bg-steel/30 border-white/10 text-slate"
            }`}
          >
            <Radio className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
              {joined ? "Channel live" : "Joining channel…"}
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight truncate">
              {activeVenue?.name ?? "Venue"} intercom
            </h1>
          </div>
        </div>
      </div>

      {/* Now-talking + last-heard ticker — replaces the voicemail-style list. */}
      <div
        className={`rounded-2xl border p-3 flex items-center gap-3 ${
          nowTalking
            ? "border-amber-400/40 bg-amber-500/10"
            : "border-white/10 bg-steel/30"
        }`}
        data-testid="card-channel-status"
      >
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            nowTalking
              ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
              : "border-white/10 bg-obsidian/40 text-slate"
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          {nowTalking ? (
            <>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-200">
                Now talking
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {nowTalking}
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
                Channel quiet
              </div>
              <div className="text-xs text-slate truncate">
                {lastHeard
                  ? `Last heard: ${lastHeard.senderName} at ${new Date(
                      lastHeard.createdAt,
                    ).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}`
                  : "No traffic since you joined."}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Target selector */}
      <section
        className="rounded-3xl border border-white/10 bg-steel/30 p-4"
        data-testid="card-targets"
      >
        <div className="flex items-center gap-2 mb-3 text-[11px] font-mono uppercase tracking-wider text-slate">
          <Users className="w-3.5 h-3.5 text-emerald-300" /> Talk to
          <span className="ml-auto text-paper">{targetSummary}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <TargetChip
            label="Whole station"
            active={stationSelected}
            onClick={() => toggleTarget(TARGET_STATION)}
            testId="chip-target-station"
          />
          {presenceList.map((p) => (
            <TargetChip
              key={p.handlerUserId}
              label={p.handlerName}
              active={targets.has(p.handlerUserId)}
              onClick={() => toggleTarget(p.handlerUserId)}
              testId={`chip-target-${p.handlerUserId}`}
            />
          ))}
          {presenceList.length === 0 && (
            <div className="text-xs text-slate">
              No other handlers on the channel yet.
            </div>
          )}
        </div>
        {!stationSelected && (
          <div
            className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100/90 leading-relaxed"
            data-testid="note-targeting-broadcast"
          >
            Targeted PTT is queued for backend support — for now your message
            still reaches everyone on this channel. The selected handlers will
            be marked as the intended recipients once the API is updated.
          </div>
        )}
      </section>

      {/* Sticky bottom PTT zone — ergonomic thumb-reach. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gradient-to-t from-obsidian via-obsidian/95 to-obsidian/70 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        data-testid="bar-ptt"
      >
        <div className="mx-auto max-w-md flex flex-col items-center">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-2">
            Hold to talk · max 15 s ·{" "}
            <span className="text-paper">{targetSummary}</span>
          </div>
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={() => recording && stopRecording()}
            onTouchStart={(e) => {
              e.preventDefault();
              startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopRecording();
            }}
            disabled={!joined}
            aria-label="Push to talk"
            title="Hold to talk"
            className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-transform select-none shadow-lg shadow-black/40 ${
              recording
                ? "bg-rose-500/40 border-rose-400 text-rose-50 scale-105"
                : "bg-emerald-500/20 border-emerald-400/60 text-emerald-100 active:scale-95"
            } disabled:opacity-50`}
            data-testid="button-ptt"
          >
            <Mic className="w-10 h-10" />
          </button>
          <div className="mt-2 text-xs text-slate" data-testid="text-ptt-status">
            {recording
              ? "Recording…"
              : transmitMut.isPending
                ? "Sending…"
                : "Ready"}
          </div>
          {recordError && (
            <div
              className="mt-1 text-xs text-rose-300"
              data-testid="text-record-error"
            >
              {recordError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TargetChip({
  label,
  active,
  onClick,
  testId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover-elevate ${
        active
          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
          : "border-white/10 bg-obsidian/40 text-slate"
      }`}
      data-testid={testId}
    >
      {active && <Check className="w-3.5 h-3.5" />}
      <span className="truncate max-w-[10rem]">{label}</span>
    </button>
  );
}
