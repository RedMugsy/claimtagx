import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Radio,
  Mic,
  Volume2,
  Users,
  PhoneOff,
  Loader2,
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
      // result looks like "data:audio/webm;base64,XXX"
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

export default function IntercomPage() {
  const { activeVenue, session } = useStore();
  const venueCode = activeVenue?.code ?? "";
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);
  const lastSeenRef = useRef<number>(Date.now());
  const playedIdsRef = useRef<Set<string>>(new Set());

  const presence = useQuery({
    queryKey: getListIntercomPresenceQueryKey(venueCode),
    queryFn: () => listIntercomPresence(venueCode),
    enabled: Boolean(venueCode) && joined,
    refetchInterval: 8_000,
  });

  const transmissions = useQuery({
    queryKey: getListIntercomTransmissionsQueryKey(venueCode),
    queryFn: () =>
      listIntercomTransmissions(venueCode, { since: lastSeenRef.current }),
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
      // Best-effort leave
      leaveIntercom(venueCode).catch(() => {});
      // Stop any in-flight recording / mic
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

  // Auto-play new transmissions. Skip ones authored by this handler so they
  // don't hear themselves echoed back.
  useEffect(() => {
    const list = transmissions.data ?? [];
    if (list.length === 0) return;
    let lastTs = lastSeenRef.current;
    for (const tx of list) {
      if (tx.createdAt > lastTs) lastTs = tx.createdAt;
      if (playedIdsRef.current.has(tx.id)) continue;
      playedIdsRef.current.add(tx.id);
      // Heuristic: skip our own. The server tags by Clerk user id and we
      // don't have that on the client, so fall back to display-name match.
      if (tx.senderName === (session?.handlerName ?? "")) continue;
      try {
        const audio = new Audio(`data:${tx.mimeType};base64,${tx.audioBase64}`);
        audio.play().catch(() => {
          // Autoplay can be blocked until first user gesture; OK to swallow.
        });
      } catch {
        // ignore decode failures
      }
    }
    lastSeenRef.current = lastTs;
  }, [transmissions.data, session?.handlerName]);

  const transmitMut = useMutation({
    mutationFn: ({
      audioBase64,
      mimeType,
      durationMs,
    }: {
      audioBase64: string;
      mimeType: string;
      durationMs: number;
    }) =>
      transmitIntercom(venueCode, {
        audioBase64,
        mimeType,
        durationMs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getListIntercomTransmissionsQueryKey(venueCode),
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
          transmitMut.mutate({ audioBase64, mimeType: mime, durationMs });
        } finally {
          stopTracks();
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      recordStartRef.current = Date.now();
      setRecording(true);
      // Hard cap: stop after 15s no matter what to bound payload size.
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

  const presenceList = presence.data ?? [];
  const recent = (transmissions.data ?? []).slice().reverse().slice(0, 8);

  return (
    <div className="space-y-4" data-testid="page-intercom">
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
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
              {joined ? "Channel live" : "Joining channel…"}
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {activeVenue?.name ?? "Venue"} intercom
            </h1>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-steel/40 p-5 flex flex-col items-center">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-3">
          Hold to talk · max 15 seconds
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
          className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-transform select-none ${
            recording
              ? "bg-rose-500/30 border-rose-400 text-rose-100 scale-105"
              : "bg-emerald-500/20 border-emerald-400/60 text-emerald-100 hover:scale-105"
          } disabled:opacity-50`}
          data-testid="button-ptt"
        >
          <Mic className="w-12 h-12" />
        </button>
        <div className="mt-3 text-xs text-slate" data-testid="text-ptt-status">
          {recording
            ? "Recording…"
            : transmitMut.isPending
            ? "Sending…"
            : "Ready"}
        </div>
        {recordError && (
          <div className="mt-2 text-xs text-rose-300" data-testid="text-record-error">
            {recordError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <section
          className="rounded-3xl border border-white/10 bg-steel/30 p-4"
          data-testid="card-presence"
        >
          <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-wider text-slate">
            <Users className="w-3.5 h-3.5 text-emerald-300" /> On channel ({presenceList.length})
          </div>
          {presenceList.length === 0 ? (
            <div className="text-sm text-slate">Just you so far.</div>
          ) : (
            <ul className="space-y-1">
              {presenceList.map((p) => (
                <li
                  key={p.handlerUserId}
                  className="text-sm text-paper flex items-center justify-between"
                  data-testid={`row-presence-${p.handlerUserId}`}
                >
                  <span>{p.handlerName}</span>
                  <span className="text-[10px] font-mono text-slate">
                    on since {new Date(p.joinedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="rounded-3xl border border-white/10 bg-steel/30 p-4"
          data-testid="card-recent-transmissions"
        >
          <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-wider text-slate">
            <Volume2 className="w-3.5 h-3.5 text-emerald-300" /> Recent chatter
            {transmissions.isFetching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate" />
            )}
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-slate">No chatter yet.</div>
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <TransmissionRow key={t.id} tx={t} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function TransmissionRow({ tx }: { tx: IntercomTransmission }) {
  return (
    <li
      className="rounded-xl border border-white/10 bg-obsidian/50 p-2 flex items-center justify-between gap-2"
      data-testid={`row-tx-${tx.id}`}
    >
      <div className="min-w-0">
        <div className="text-sm text-paper font-semibold truncate">
          {tx.senderName}
        </div>
        <div className="text-[10px] font-mono text-slate">
          {new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {Math.max(1, Math.round((tx.durationMs || 0) / 1000))}s
        </div>
      </div>
      <audio
        controls
        src={`data:${tx.mimeType};base64,${tx.audioBase64}`}
        className="h-8"
      />
    </li>
  );
}
