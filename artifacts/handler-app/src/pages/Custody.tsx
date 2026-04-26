import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Search,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  SlidersHorizontal,
  Check,
  History as HistoryIcon,
  LayoutGrid,
  List as ListIcon,
  Images,
  ImageOff,
  Star,
  MessageSquare,
  Mic,
  Square,
  Play,
  Volume2,
  QrCode,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import {
  DEFAULT_TA_POLICY,
  MODE_BY_ID,
  MODE_ICONS,
  VENUE_AGING_BANDS,
  VENUE_ASSET_NOUN,
  VENUE_COPY,
  classifyAge,
  formatBandThreshold,
  type AgingBand,
} from "@/lib/modes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QrTag } from "@/components/handler/QrTag";
import { TamperAlerts } from "@/components/handler/TamperAlerts";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CustodyAsset } from "@/lib/types";

function fmtAge(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m ago`;
}

type CustodyEventNote = {
  id: string;
  kind: "text" | "voice";
  body?: string;
  audioDataUrl?: string;
  mimeType?: string;
  durationMs?: number;
  createdAt: number;
  author: string;
};

type CustodyView = "cards" | "list" | "gallery";
type SheetPage = "main" | "notes" | "damage" | "history";

type AssetTimelineEntry = {
  id: string;
  at: number;
  title: string;
  actor: string;
  description: string;
};

const CUSTODY_NOTES_STORAGE_KEY = "handler.custody.event-notes.v1";
const CUSTODY_VIEW_STORAGE_KEY = "handler.custody.view.v1";
const INTERACTIVE_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/50 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian";
const INTERACTIVE_PRESS = "transition-all duration-200 ease-out active:scale-[0.98]";

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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function readStoredEventNotes(): Record<string, CustodyEventNote[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTODY_NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CustodyEventNote[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function makeCustodyViewKey(email?: string, venueCode?: string, mode?: string) {
  return [CUSTODY_VIEW_STORAGE_KEY, email ?? "anon", venueCode ?? "no-venue", mode ?? "no-mode"].join(":");
}

function readStoredCustodyView(key: string): CustodyView {
  if (typeof window === "undefined") return "cards";
  try {
    const raw = localStorage.getItem(key);
    return raw === "list" || raw === "gallery" || raw === "cards" ? raw : "cards";
  } catch {
    return "cards";
  }
}

function readAssetFieldString(
  fields: Record<string, string | number | boolean>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickPolicyValue(values: string[] | undefined, seed: string, fallback: string | null = null) {
  if (!values || values.length === 0) return fallback;
  return values[hashString(seed) % values.length] ?? fallback;
}

function getAssetServiceClass(asset: CustodyAsset): string | null {
  const direct = readAssetFieldString(asset.fields, ["serviceClass", "service_class", "class", "tier"]);
  if (direct) return direct;
  const vip = asset.fields.vip;
  if (vip === true) return "VIP";
  return pickPolicyValue(DEFAULT_TA_POLICY.serviceClasses, asset.ticketId, "Regular");
}

function getAssetPatronType(asset: CustodyAsset): string | null {
  return (
    readAssetFieldString(asset.fields, ["patronType", "patron_type", "guestType", "visitorType"])
    ?? pickPolicyValue(DEFAULT_TA_POLICY.patronTypes, asset.id || asset.ticketId, "Guest")
  );
}

function getServiceClassTone(serviceClass: string | null) {
  if (!serviceClass) return "border-white/10 bg-white/5 text-slate";
  if (/vip|premium|elite|priority/i.test(serviceClass)) {
    return "border-amber-300/40 bg-amber-500/15 text-amber-200";
  }
  if (/regular|normal|standard|basic|general/i.test(serviceClass)) {
    return "border-white/10 bg-white/5 text-slate";
  }
  return "border-indigo-300/40 bg-indigo-500/15 text-indigo-200";
}

function isPriorityServiceClass(serviceClass: string | null) {
  return !!serviceClass && /vip|premium|elite|priority/i.test(serviceClass);
}

function getDamageEntries(asset: CustodyAsset) {
  const captured = Object.entries(asset.fields).filter(([key, value]) => {
    if (value == null || value === "") return false;
    return /damage|condition|scratch|dent|scuff|diagram|mark|tear/i.test(key);
  });
  if (captured.length > 0) return captured;

  return [
    [
      "damageReport",
      asset.mode === "vehicles"
        ? "Placeholder layout: diagram pins, panel notes, and valet walkaround comments will appear here."
        : "Placeholder layout: condition notes, diagram markup, and damage media will appear here.",
    ],
  ];
}

function buildAssetTimeline(asset: CustodyAsset, notes: CustodyEventNote[]): AssetTimelineEntry[] {
  const cfg = MODE_BY_ID[asset.mode];
  const primarySummary = cfg.columns
    .slice(0, 2)
    .map((column) => String(asset.fields[column.key] ?? "—"))
    .join(" · ");

  const entries: AssetTimelineEntry[] = [
    {
      id: `${asset.id}-intake`,
      at: asset.intakeAt,
      title: "Checked in",
      actor: asset.handler,
      description: primarySummary,
    },
  ];

  for (const note of notes) {
    entries.push({
      id: `timeline-${note.id}`,
      at: note.createdAt,
      title: note.kind === "voice" ? "Voice note added" : "Message added",
      actor: note.author,
      description:
        note.kind === "voice"
          ? note.durationMs
            ? `Voice clip · ${Math.max(1, Math.round(note.durationMs / 1000))}s`
            : "Voice clip"
          : note.body?.trim() || "Text note",
    });
  }

  if (asset.releasedAt) {
    entries.push({
      id: `${asset.id}-release`,
      at: asset.releasedAt,
      title: "Released",
      actor: asset.releasedBy ?? "Handler",
      description: `Returned to ${asset.patron.name}`,
    });
  }

  return entries.sort((a, b) => b.at - a.at);
}

function groupTimelineByDate(entries: AssetTimelineEntry[]) {
  const buckets = new Map<string, { label: string; items: AssetTimelineEntry[] }>();
  for (const entry of entries) {
    const dt = new Date(entry.at);
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    const label = dt.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.items.push(entry);
    } else {
      buckets.set(key, { label, items: [entry] });
    }
  }
  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    items: bucket.items.sort((a, b) => b.at - a.at),
  }));
}

export default function Custody() {
  const { mode, assets, session, activeVenue, venues, setActiveVenue, canAccessMode } = useStore();
  // Owner-targeted tamper-spike alert emails link to /custody?venue=<code>.
  // Honour that query param so the owner lands on the right venue's feed
  // instead of whichever venue they had selected last.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("venue")?.toUpperCase();
    if (!requested) return;
    if (activeVenue?.code === requested) return;
    if (!venues.some((v) => v.code === requested)) return;
    setActiveVenue(requested);
  }, [activeVenue?.code, venues, setActiveVenue]);
  const cfg = MODE_BY_ID[mode];
  const ModeIcon = MODE_ICONS[mode];
  // Aging bands and headings come from the venue's classification, not from
  // a global "<1h vs ≥1h" rule — a valet stand cares about minutes, a hotel
  // baggage room cares about hours.
  const venueType = activeVenue?.venueType ?? "other";
  const bands = VENUE_AGING_BANDS[venueType];
  const copy = VENUE_COPY[venueType];
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustodyAsset | null>(null);
  const [ageFilter, setAgeFilter] = useState<"all" | AgingBand>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [kpiWindow, setKpiWindow] = useState<"today" | "week" | "month">("today");
  const viewStorageKey = makeCustodyViewKey(session?.email, activeVenue?.code, mode);
  const [view, setView] = useState<CustodyView>("cards");
  const [notesByAsset, setNotesByAsset] = useState<Record<string, CustodyEventNote[]>>(
    () => readStoredEventNotes(),
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [sheetPage, setSheetPage] = useState<SheetPage>("main");
  const [qrPopoverOpen, setQrPopoverOpen] = useState(false);
  const [heroCarouselApi, setHeroCarouselApi] = useState<CarouselApi>();
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const recordAssetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(t);
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CUSTODY_NOTES_STORAGE_KEY, JSON.stringify(notesByAsset));
    } catch {
      // ignore persistence errors
    }
  }, [notesByAsset]);

  useEffect(() => {
    setView(readStoredCustodyView(viewStorageKey));
  }, [viewStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(viewStorageKey, view);
    } catch {
      // ignore persistence errors
    }
  }, [viewStorageKey, view]);

  useEffect(() => {
    setNoteDraft("");
    setSheetPage("main");
    setQrPopoverOpen(false);
    setHeroSlideIndex(0);
    heroCarouselApi?.scrollTo(0);
  }, [selected?.id, heroCarouselApi]);

  useEffect(() => {
    if (!heroCarouselApi) return;
    const sync = () => setHeroSlideIndex(heroCarouselApi.selectedScrollSnap());
    sync();
    heroCarouselApi.on("select", sync);
    heroCarouselApi.on("reInit", sync);
    return () => {
      heroCarouselApi.off("select", sync);
      heroCarouselApi.off("reInit", sync);
    };
  }, [heroCarouselApi]);

  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const list = useMemo(() => {
    let active = assets.filter((a) => a.mode === mode && a.status === "active");
    if (ageFilter !== "all") {
      const now = Date.now();
      active = active.filter(
        (a) => classifyAge(a.intakeAt, bands, now) === ageFilter,
      );
    }
    if (q.trim()) {
      const needle = q.toLowerCase();
      active = active.filter((a) => {
        if (a.ticketId.toLowerCase().includes(needle)) return true;
        if (a.patron.name.toLowerCase().includes(needle)) return true;
        return Object.values(a.fields).some((v) => String(v).toLowerCase().includes(needle));
      });
    }
    active = [...active].sort((a, b) =>
      sort === "newest" ? b.intakeAt - a.intakeAt : a.intakeAt - b.intakeAt
    );
    return active;
  }, [assets, mode, q, ageFilter, sort, bands]);

  const allActive = useMemo(
    () => assets.filter((a) => a.mode === mode && a.status === "active"),
    [assets, mode]
  );
  const bandCounts = useMemo(() => {
    const now = Date.now();
    const c = { fresh: 0, watch: 0, overdue: 0 };
    for (const a of allActive) c[classifyAge(a.intakeAt, bands, now)] += 1;
    return c;
  }, [allActive, bands]);

  const windowStart = useMemo(() => {
    const now = new Date();
    if (kpiWindow === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
    if (kpiWindow === "week") {
      return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }, [kpiWindow]);

  const kpis = useMemo(() => {
    const base = assets.filter((a) => a.mode === mode);
    const inRange = base.filter((a) => a.intakeAt >= windowStart);
    const myName = (session?.handlerName ?? "").trim().toLowerCase();
    const myEmail = (session?.email ?? "").trim().toLowerCase();

    const handlerCheckIns = inRange.filter(
      (a) => a.handler.trim().toLowerCase() === myName,
    ).length;

    const checkOuts = base.filter(
      (a) => a.releasedAt != null && a.releasedAt >= windowStart,
    );
    const handlerCheckOuts = checkOuts.filter((a) => {
      const releasedBy = (a.releasedBy ?? "").trim().toLowerCase();
      if (!releasedBy) return false;
      return releasedBy === myName || releasedBy === myEmail;
    }).length;

    const stationHandled = inRange.length;
    const totalProcessed = stationHandled + checkOuts.length;
    const handlerProcessed = handlerCheckIns + handlerCheckOuts;

    return {
      inCustody: allActive.length,
      handlerHandled: handlerCheckIns,
      stationHandled,
      checkIns: inRange.length,
      checkOuts: checkOuts.length,
      handlerCheckOuts,
      totalProcessed,
      handlerProcessed,
      othersProcessed: Math.max(0, totalProcessed - handlerProcessed),
      contribution:
        stationHandled > 0 ? Math.round((handlerCheckIns / stationHandled) * 100) : 0,
    };
  }, [assets, mode, windowStart, session?.handlerName, session?.email, allActive.length]);

  // Traffic-over-time buckets — hourly for "today", daily otherwise.
  const trafficSeries = useMemo(() => {
    const now = Date.now();
    const isToday = kpiWindow === "today";
    const buckets: { key: number; label: string; in: number; out: number }[] = [];

    if (isToday) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const t = startOfDay.getTime() + h * 3600_000;
        if (t > now + 3600_000) break;
        buckets.push({
          key: t,
          label: `${String(h).padStart(2, "0")}:00`,
          in: 0,
          out: 0,
        });
      }
    } else {
      const days = kpiWindow === "week" ? 7 : 30;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      for (let d = days - 1; d >= 0; d--) {
        const dt = new Date(startOfDay);
        dt.setDate(startOfDay.getDate() - d);
        buckets.push({
          key: dt.getTime(),
          label: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          in: 0,
          out: 0,
        });
      }
    }

    const bucketMs = isToday ? 3600_000 : 86400_000;
    const findBucket = (ts: number) => {
      for (let i = buckets.length - 1; i >= 0; i--) {
        if (ts >= buckets[i].key && ts < buckets[i].key + bucketMs) return buckets[i];
      }
      return null;
    };

    const base = assets.filter((a) => a.mode === mode);
    for (const a of base) {
      if (a.intakeAt >= windowStart) {
        const b = findBucket(a.intakeAt);
        if (b) b.in += 1;
      }
      if (a.releasedAt != null && a.releasedAt >= windowStart) {
        const b = findBucket(a.releasedAt);
        if (b) b.out += 1;
      }
    }
    return buckets;
  }, [assets, mode, kpiWindow, windowStart]);

  // Occupancy is mocked off the venue type until the API exposes capacity.
  const capacity = useMemo(() => {
    const type = activeVenue?.venueType ?? "other";
    if (type === "valet") return 50;
    if (type === "baggage") return 200;
    if (type === "cloakroom") return 120;
    if (type === "retail") return 100;
    return 100;
  }, [activeVenue?.venueType]);
  const occupied = Math.min(kpis.inCustody, capacity);
  const vacant = Math.max(0, capacity - occupied);
  const occupancyPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

  const searchPlaceholder = `Search ${cfg.label.toLowerCase()} by ticket, plate or patron…`;
  const filtersActive = ageFilter !== "all" || sort !== "newest";
  const ageFilterOptions = [
    { id: "all", label: "All", count: allActive.length, tone: "" },
    {
      id: "fresh",
      label: `Fresh · <${formatBandThreshold(bands.watchAfterMin)}`,
      count: bandCounts.fresh,
      tone: "lime",
    },
    {
      id: "watch",
      label: `Watch · ${formatBandThreshold(bands.watchAfterMin)}+`,
      count: bandCounts.watch,
      tone: "amber",
    },
    {
      id: "overdue",
      label: `Overdue · ${formatBandThreshold(bands.overdueAfterMin)}+`,
      count: bandCounts.overdue,
      tone: "rose",
    },
  ] as const;

  const selectedEventNotes = useMemo<CustodyEventNote[]>(() => {
    if (!selected) return [];
    const seededFieldNotes: CustodyEventNote[] = Object.entries(selected.fields)
      .filter(([key, value]) => {
        if (typeof value !== "string") return false;
        const k = key.toLowerCase();
        return ["notes", "note", "contents", "accessories"].includes(k) && value.trim().length > 0;
      })
      .map(([key, value], idx) => ({
        id: `seed-${selected.id}-${key}-${idx}`,
        kind: "text",
        body: String(value),
        createdAt: selected.intakeAt,
        author: selected.handler,
      }));

    const custom = notesByAsset[selected.id] ?? [];
    return [...seededFieldNotes, ...custom].sort((a, b) => b.createdAt - a.createdAt);
  }, [selected, notesByAsset]);

  const selectedEventTimeline = useMemo(() => {
    if (!selected) return [];
    return buildAssetTimeline(selected, selectedEventNotes);
  }, [selected, selectedEventNotes]);

  const addTextNote = (assetId: string) => {
    const body = noteDraft.trim();
    if (!body) return;
    const note: CustodyEventNote = {
      id: `${assetId}-text-${Date.now()}`,
      kind: "text",
      body,
      createdAt: Date.now(),
      author: session?.handlerName ?? "Handler",
    };
    setNotesByAsset((prev) => ({
      ...prev,
      [assetId]: [note, ...(prev[assetId] ?? [])],
    }));
    setNoteDraft("");
  };

  const speakTextNote = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  const startVoiceNote = async (assetId: string) => {
    if (recording || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickSupportedMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      streamRef.current = stream;
      chunksRef.current = [];
      recordStartRef.current = Date.now();
      recordAssetIdRef.current = assetId;

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        try {
          const targetAssetId = recordAssetIdRef.current;
          if (!targetAssetId) return;
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
          if (blob.size < 1) return;
          const dataUrl = await blobToDataUrl(blob);
          const note: CustodyEventNote = {
            id: `${targetAssetId}-voice-${Date.now()}`,
            kind: "voice",
            audioDataUrl: dataUrl,
            mimeType: blob.type || mimeType,
            durationMs: Math.max(1000, Date.now() - recordStartRef.current),
            createdAt: Date.now(),
            author: session?.handlerName ?? "Handler",
          };
          setNotesByAsset((prev) => ({
            ...prev,
            [targetAssetId]: [note, ...(prev[targetAssetId] ?? [])],
          }));
        } finally {
          chunksRef.current = [];
          recordAssetIdRef.current = null;
          setRecording(false);
          if (streamRef.current) {
            for (const t of streamRef.current.getTracks()) t.stop();
            streamRef.current = null;
          }
        }
      };

      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopVoiceNote = () => {
    try {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    } catch {
      setRecording(false);
    }
  };

  if (!canAccessMode(mode)) {
    return (
      <section className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5" data-testid="panel-authorization-denied-custody">
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-200">Authorization</div>
        <h1 className="text-xl font-extrabold text-white tracking-tight mt-1">Custody view is not enabled for your authorization</h1>
        <p className="mt-2 text-sm text-amber-100/90 leading-relaxed">
          Your handler authorization does not include this station mode at the moment.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/station" className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate">
            Open station details
          </Link>
          <Link href="/" className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate">
            Back to Command Center
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <header className="mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <ModeIcon className="w-5 h-5 text-lime" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono uppercase tracking-wider text-slate">Active custody</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
              {copy.custodyHeading}
            </h1>
          </div>
        </div>
        {activeVenue ? (
          <div className="mt-2 flex items-center justify-end">
            <TamperAlerts
              venueCode={activeVenue.code}
              canAcknowledge={activeVenue.role === "owner"}
            />
          </div>
        ) : null}
      </header>

      <section className="mb-5 rounded-3xl border border-white/10 bg-steel/40 px-4 py-3 sm:px-5 sm:py-4" data-testid="card-custody-kpis">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            Custody analytics
          </div>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-0.5">
            {([
              { id: "today", label: "Today" },
              { id: "week", label: "7D" },
              { id: "month", label: "30D" },
            ] as const).map((w) => (
              <button
                key={w.id}
                onClick={() => setKpiWindow(w.id)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider hover-elevate ${
                  kpiWindow === w.id ? "bg-lime/15 text-lime" : "text-slate"
                }`}
                data-testid={`kpi-window-${w.id}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-around gap-3 sm:gap-5 flex-nowrap">
          <ProcessedDonut
            total={kpis.totalProcessed}
            handler={kpis.handlerProcessed}
            others={kpis.othersProcessed}
            noun={VENUE_ASSET_NOUN[venueType]}
          />
          <TrafficTotals
            totalIn={trafficSeries.reduce((s, b) => s + b.in, 0)}
            totalOut={trafficSeries.reduce((s, b) => s + b.out, 0)}
          />
          <OccupancyCard
            occupied={occupied}
            vacant={vacant}
            capacity={capacity}
            pct={occupancyPct}
            noun={VENUE_ASSET_NOUN[venueType]}
          />
        </div>
      </section>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 bg-steel/40 border-white/10 text-white placeholder:text-slate"
            data-testid="input-search"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 220);
          }}
          className={`w-10 h-10 shrink-0 rounded-xl border border-white/10 bg-steel/40 flex items-center justify-center text-slate hover:text-paper hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
          aria-label="Refresh list"
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`relative w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING} ${
                filtersActive
                  ? "border-lime/40 bg-lime/15 text-lime"
                  : "border-white/10 bg-steel/40 text-slate hover:text-paper"
              }`}
              aria-label="Open filters"
              data-testid="button-filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {filtersActive ? (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-lime border border-obsidian" />
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 bg-obsidian border-white/10 text-paper p-3"
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-2">
              Aging
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ageFilterOptions.map((f) => {
                const active = ageFilter === f.id;
                const activeTone =
                  f.tone === "amber"
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    : f.tone === "rose"
                      ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                      : "border-lime/40 bg-lime/15 text-lime";
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAgeFilter(f.id as "all" | AgingBand)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING} ${
                      active ? activeTone : "border-white/10 bg-steel/40 text-slate"
                    }`}
                    data-testid={`filter-age-${f.id}`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-80">{f.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-2">
              Sort
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-steel/40 p-1 w-fit">
              {(["newest", "oldest"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING} ${
                    sort === s ? "bg-lime/15 text-lime" : "text-slate"
                  }`}
                  data-testid={`sort-${s}`}
                >
                  {sort === s ? <Check className="w-3 h-3" /> : null}
                  {s}
                </button>
              ))}
            </div>

            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setAgeFilter("all");
                  setSort("newest");
                }}
                className={`mt-4 w-full rounded-xl border border-white/10 bg-steel/40 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                data-testid="button-filters-reset"
              >
                Reset filters
              </button>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      {!loading && list.length > 0 ? (
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
            {list.length} {list.length === 1 ? "item" : "items"}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-steel/40 p-1">
            {(
              [
                { id: "cards" as const, Icon: LayoutGrid, label: "Cards" },
                { id: "list" as const, Icon: ListIcon, label: "List" },
                { id: "gallery" as const, Icon: Images, label: "Gallery" },
              ]
            ).map(({ id, Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-label={label}
                className={`flex items-center justify-center w-8 h-8 rounded-full hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING} ${
                  view === id ? "bg-lime/15 text-lime" : "text-slate hover:text-paper"
                }`}
                data-testid={`view-${id}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="custody-skeleton">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-steel/40 p-4 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-4 w-12 rounded bg-white/10" />
              </div>
              <div className="h-4 w-32 rounded bg-white/10 mb-3" />
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[0, 1, 2].map((j) => (
                  <div key={j}>
                    <div className="h-2 w-10 rounded bg-white/5 mb-1" />
                    <div className="h-3 w-16 rounded bg-white/10" />
                  </div>
                ))}
              </div>
              <div className="h-3 w-24 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-steel/40 flex items-center justify-center mx-auto mb-3">
            <ModeIcon className="w-5 h-5 text-slate" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Nothing in custody</h2>
          <p className="text-sm text-slate">
            {q ? "No matches for that search." : `Issue a ${cfg.label.toLowerCase()} tag to see it here.`}
          </p>
        </div>
      ) : (
        <div
          className={
            view === "list"
              ? "flex flex-col gap-2"
              : view === "gallery"
                ? "grid grid-cols-2 sm:grid-cols-3 gap-3"
                : "grid grid-cols-1 md:grid-cols-2 gap-3"
          }
        >
          {list.map((a, i) => {
            const band = classifyAge(a.intakeAt, bands);
            const serviceClass = getAssetServiceClass(a);
            const patronType = getAssetPatronType(a);
            const isPriority = isPriorityServiceClass(serviceClass);
            const cardBorder =
              band === "overdue"
                ? "border-rose-400/40 bg-rose-500/5"
                : band === "watch"
                  ? "border-amber-400/40 bg-amber-500/5"
                  : "border-white/10 bg-steel/40";
            const priorityChrome = isPriority
              ? "shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_10px_30px_rgba(245,158,11,0.08)]"
              : "";
            const priorityBanner = isPriority
              ? "from-amber-500/12 to-transparent"
              : "from-indigo-500/8 to-transparent";
            const badgeCls =
              band === "overdue"
                ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                : band === "watch"
                  ? "bg-amber-500/15 text-amber-200 border border-amber-400/30"
                  : "bg-lime/10 text-lime border border-lime/20";
            const badgeLabel =
              band === "overdue"
                ? "OVERDUE"
                : band === "watch"
                  ? "WATCH"
                  : "FRESH";

            if (view === "list") {
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.992 }}
                  transition={{ duration: 0.15, delay: i * 0.015 }}
                  onClick={() => setSelected(a)}
                  className={`relative overflow-hidden flex items-center gap-3 text-left rounded-xl border px-3 py-2.5 hover-elevate ${INTERACTIVE_FOCUS_RING} ${cardBorder} ${priorityChrome}`}
                  data-testid={`row-asset-${a.ticketId}`}
                  data-band={band}
                >
                  {isPriority ? <div className="absolute inset-y-0 left-0 w-1 bg-amber-300/80" /> : null}
                  <div className={`absolute inset-x-0 top-0 h-10 bg-gradient-to-b ${priorityBanner} pointer-events-none`} />
                  <div className="font-mono text-xs text-lime tracking-wider w-20 shrink-0 truncate">{a.ticketId}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white font-semibold truncate">{a.patron.name}</div>
                    <div className="text-[11px] text-slate font-mono truncate">
                      {cfg.columns.slice(0, 2).map((c) => String(a.fields[c.key] ?? "—")).join(" · ")}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {serviceClass ? (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${getServiceClassTone(serviceClass)}`}>
                          {isPriority ? <Star className="w-2.5 h-2.5" /> : null}
                          {serviceClass}
                        </span>
                      ) : null}
                      {patronType ? (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate">{patronType}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate font-mono shrink-0">
                    <Clock className="w-3 h-3" /> {fmtAge(a.intakeAt)}
                  </div>
                  <Badge variant="secondary" className={`font-mono text-[10px] shrink-0 ${badgeCls}`}>
                    {badgeLabel}
                  </Badge>
                </motion.button>
              );
            }

            if (view === "gallery") {
              const photo = a.photos?.[0];
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.988 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  onClick={() => setSelected(a)}
                  className={`relative text-left rounded-2xl border overflow-hidden hover-elevate ${INTERACTIVE_FOCUS_RING} ${cardBorder} ${priorityChrome}`}
                  data-testid={`tile-asset-${a.ticketId}`}
                  data-band={band}
                >
                  {isPriority ? <div className="absolute inset-x-0 top-0 h-1 bg-amber-300/80 z-10" /> : null}
                  <div className="relative aspect-[4/5] bg-obsidian/60 flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt={a.ticketId} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-6 h-6 text-slate" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/20 to-transparent" />
                    <Badge
                      variant="secondary"
                      className={`absolute top-2 right-2 font-mono text-[10px] ${badgeCls}`}
                    >
                      {badgeLabel}
                    </Badge>
                    <div className="absolute left-2.5 right-2.5 bottom-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-xs text-lime tracking-wider truncate">{a.ticketId}</div>
                        {serviceClass ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider ${getServiceClassTone(serviceClass)}`}>
                            {isPriority ? <Star className="w-2.5 h-2.5" /> : null}
                            {serviceClass}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm text-white font-semibold truncate mt-1">{a.patron.name}</div>
                      {patronType ? (
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate mt-1 truncate">
                          {patronType}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-2.5 pt-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate font-mono mt-1">
                      <Clock className="w-3 h-3" /> {fmtAge(a.intakeAt)}
                    </div>
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => setSelected(a)}
                className={`relative overflow-hidden text-left rounded-2xl border p-4 hover-elevate ${INTERACTIVE_FOCUS_RING} ${cardBorder} ${priorityChrome}`}
                data-testid={`card-asset-${a.ticketId}`}
                data-band={band}
              >
                {isPriority ? <div className="absolute inset-x-0 top-0 h-1 bg-amber-300/80" /> : null}
                <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${priorityBanner} pointer-events-none`} />
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm text-lime tracking-wider">{a.ticketId}</div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {serviceClass ? (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${getServiceClassTone(serviceClass)}`}>
                        {isPriority ? <Star className="w-3 h-3" /> : null}
                        {serviceClass}
                      </span>
                    ) : null}
                    <Badge variant="secondary" className={`font-mono text-[10px] ${badgeCls}`}>
                      {badgeLabel}
                    </Badge>
                  </div>
                </div>
                <div className={`text-white ${isPriority ? "text-[15px] font-bold" : "font-semibold"} mb-1`}>{a.patron.name}</div>
                {patronType ? (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-2">{patronType}</div>
                ) : null}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {cfg.columns.slice(0, 3).map((c) => (
                    <div key={c.key}>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate">{c.label}</div>
                      <div className={`text-sm text-white truncate ${c.mono ? "font-mono" : ""}`}>
                        {String(a.fields[c.key] ?? "—")}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate font-mono">
                  <Clock className="w-3 h-3" /> {fmtAge(a.intakeAt)} · {a.handler}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setSheetPage("main"); setQrPopoverOpen(false); } }}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-obsidian border-l border-white/10 text-white p-0 overflow-hidden flex flex-col">
          {selected && (() => {
            const band = classifyAge(selected.intakeAt, bands);
            const cfg = MODE_BY_ID[selected.mode];
            const ModeIcon = MODE_ICONS[selected.mode];
            const serviceClass = getAssetServiceClass(selected);
            const patronType = getAssetPatronType(selected);
            const damageEntries = getDamageEntries(selected);
            const timelineGroups = groupTimelineByDate(selectedEventTimeline);
            const isPriority = isPriorityServiceClass(serviceClass);
            const damageIsPlaceholder = damageEntries.length === 1 && damageEntries[0]?.[0] === "damageReport";
            const historyIsLight = selectedEventTimeline.length <= 1;
            const heroMedia = selected.photos.length > 0 ? selected.photos : [null];
            const bandColor =
              band === "overdue" ? "text-rose-300 border-rose-400/40 bg-rose-500/10"
              : band === "watch" ? "text-amber-300 border-amber-400/40 bg-amber-500/10"
              : "text-lime border-lime/30 bg-lime/10";
            const bandLabel = band === "overdue" ? "OVERDUE" : band === "watch" ? "WATCH" : "FRESH";
            const eventNotes = selectedEventNotes;
            const hasNotes = eventNotes.length > 0;
            const subpageTitle =
              sheetPage === "notes" ? "Event notes"
              : sheetPage === "damage" ? "Damage report"
              : "Handling history";

            if (sheetPage !== "main") {
              return (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSheetPage("main")}
                      className={`w-8 h-8 rounded-xl border border-white/10 bg-steel/40 flex items-center justify-center text-slate hover:text-paper hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                      aria-label="Back to event"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate">{subpageTitle}</div>
                      <div className="text-sm font-semibold text-white font-mono truncate">{selected.ticketId}</div>
                    </div>
                    <Badge variant="secondary" className={`font-mono text-[10px] border ${bandColor}`}>{bandLabel}</Badge>
                  </div>

                  {sheetPage === "notes" ? (
                    <>
                      <div className="px-4 py-3 border-b border-white/10 shrink-0 space-y-2">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Add a text note for this custody event…"
                          className="w-full min-h-[68px] rounded-xl border border-white/10 bg-steel/40 px-3 py-2 text-sm text-white placeholder:text-slate focus:outline-none focus:ring-1 focus:ring-lime/40 resize-none"
                          data-testid="input-custody-note"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addTextNote(selected.id)}
                            disabled={!noteDraft.trim()}
                            className={`rounded-xl border border-lime/30 bg-lime/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-lime hover-elevate disabled:opacity-40 ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                            data-testid="button-add-text-note"
                          >
                            Add note
                          </button>
                          <button
                            type="button"
                            onClick={() => (recording ? stopVoiceNote() : startVoiceNote(selected.id))}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING} ${
                              recording
                                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                                : "border-white/10 bg-steel/40 text-paper"
                            }`}
                            data-testid="button-toggle-voice-note"
                          >
                            {recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            {recording ? "Stop" : "Voice note"}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" data-testid="custody-event-notes-list">
                        {eventNotes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                            <MessageSquare className="w-8 h-8 text-slate/50" />
                            <p className="text-xs text-slate">No notes yet. Start by typing above or recording a voice note.</p>
                          </div>
                        ) : (
                          eventNotes.map((note) => (
                            <div key={note.id} className="rounded-xl border border-white/10 bg-steel/25 p-3">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate">
                                  {note.kind === "voice" ? <Mic className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                  {note.author}
                                </div>
                                <div className="text-[10px] font-mono text-slate">
                                  {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                              {note.kind === "voice" ? (
                                <div className="space-y-1">
                                  {note.audioDataUrl ? (
                                    <audio controls src={note.audioDataUrl} className="w-full h-8" />
                                  ) : (
                                    <div className="inline-flex items-center gap-1 text-xs text-slate">
                                      <Volume2 className="w-3.5 h-3.5" />
                                      Voice clip
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-sm text-paper leading-relaxed">{note.body}</p>
                                  <button
                                    type="button"
                                    onClick={() => speakTextNote(note.body ?? "")}
                                    className={`inline-flex items-center gap-1 rounded-lg border border-white/10 bg-steel/40 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                                    data-testid={`button-listen-note-${note.id}`}
                                  >
                                    <Play className="w-3 h-3" />
                                    Listen
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : sheetPage === "damage" ? (
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid="custody-event-damage-report">
                      <div className={`rounded-2xl border p-4 ${damageIsPlaceholder ? "border-dashed border-amber-300/30 bg-amber-500/5" : "border-white/10 bg-steel/25"}`}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Damage fields</div>
                          {damageIsPlaceholder ? (
                            <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-200">
                              Preview
                            </span>
                          ) : null}
                        </div>
                        {damageEntries.length > 0 ? (
                          <div className="space-y-3">
                            {damageEntries.map(([key, value]) => (
                              <div key={key}>
                                <div className="text-[10px] font-mono uppercase tracking-wide text-slate">{key.replace(/([A-Z])/g, " $1")}</div>
                                <div className="text-sm text-white mt-0.5 break-words">{String(value)}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-slate">
                            <AlertTriangle className="w-4 h-4 text-slate" />
                            No explicit damage notes or diagram metadata were captured for this asset.
                          </div>
                        )}
                        {damageIsPlaceholder ? (
                          <div className="mt-4 rounded-xl border border-white/10 bg-obsidian/30 p-3">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-1">Planned layout</div>
                            <ul className="list-disc pl-4 space-y-1 text-sm text-slate">
                              <li>Annotated diagram or body-map image</li>
                              <li>Panel-by-panel notes and severity markers</li>
                              <li>Reference photos tied to each marked issue</li>
                            </ul>
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-steel/25 p-4">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-3">Attached media</div>
                        {selected.photos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {selected.photos.map((p, i) => (
                              <img key={i} src={p} alt={`Asset media ${i + 1}`} className="rounded-xl border border-white/10 aspect-square object-cover" />
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate">No photos or diagrams attached.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid="custody-event-history-list">
                      {historyIsLight ? (
                        <div className="rounded-2xl border border-dashed border-indigo-300/30 bg-indigo-500/5 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate">History preview</div>
                            <span className="inline-flex items-center rounded-full border border-indigo-300/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-indigo-200">
                              Scaffold
                            </span>
                          </div>
                          <p className="text-sm text-paper leading-relaxed">
                            This timeline is ready for release events, staff handoffs, damage updates, and patron messages. As actions accumulate, they’ll stack under date headers exactly like a shift log.
                          </p>
                        </div>
                      ) : null}
                      {timelineGroups.map((group) => (
                        <div key={group.label} className="space-y-1.5">
                          <div className="inline-flex items-center rounded-full border border-white/10 bg-steel/30 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate">
                            {group.label}
                          </div>
                          <ul className="space-y-1.5 list-disc pl-4">
                            {group.items.map((entry) => (
                              <li key={entry.id} className="rounded-lg border border-white/10 bg-steel/25 px-2.5 py-2 list-item">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-white leading-tight truncate">
                                      {entry.title}
                                      <span className="text-slate/80 font-medium"> · {entry.actor}</span>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-mono text-slate">
                                    {new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                                <div className="text-xs text-paper/90 leading-snug mt-1">{entry.description}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── MAIN EVENT PAGE ── */
            return (
              <div className="flex flex-col h-full">
                <div className="relative shrink-0">
                  {isPriority ? <div className="absolute inset-x-0 top-0 h-1 bg-amber-300/80 z-20" /> : null}
                  <Carousel setApi={setHeroCarouselApi} className="w-full">
                    <CarouselContent className="ml-0">
                      {heroMedia.map((photo, index) => (
                        <CarouselItem key={`${selected.id}-hero-${index}`} className="pl-0">
                          {photo ? (
                            <img src={photo} alt={`${selected.ticketId} ${index + 1}`} className="w-full h-56 object-cover" />
                          ) : (
                            <div className="w-full h-56 bg-gradient-to-b from-steel/60 to-obsidian flex flex-col items-center justify-center gap-2">
                              <ModeIcon className="w-14 h-14 text-lime/30" />
                              <div className="text-[10px] font-mono uppercase tracking-wider text-slate">No photo on file</div>
                            </div>
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>

                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/15 to-transparent pointer-events-none" />
                  {isPriority ? <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent pointer-events-none" /> : null}

                  <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`font-mono text-[10px] border bg-obsidian/70 text-paper border-white/10`}>
                      {selected.ticketId}
                    </Badge>
                    {serviceClass ? (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${getServiceClassTone(serviceClass)}`}>
                        {isPriority ? <Star className="w-3 h-3" /> : null}
                        {serviceClass}
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute top-3 right-12">
                    <Badge variant="secondary" className={`font-mono text-[10px] border ${bandColor}`}>{bandLabel}</Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-obsidian/60 border border-white/10 flex items-center justify-center text-slate hover:text-paper hover-elevate ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                    aria-label="Close"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate/80">{cfg.label}</div>
                    <div className="text-2xl font-extrabold font-mono text-white tracking-tight">{cfg.short}</div>
                    {isPriority ? (
                      <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-amber-200">Priority handling</div>
                    ) : null}
                    {heroMedia.length > 1 ? (
                      <div className="mt-2 inline-flex items-center gap-1.5">
                        {heroMedia.map((_, index) => (
                          <span
                            key={`${selected.id}-dot-${index}`}
                            className={`w-1.5 h-1.5 rounded-full ${index === heroSlideIndex ? "bg-lime" : "bg-white/25"}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {(serviceClass || patronType) ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {serviceClass ? (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${getServiceClassTone(serviceClass)}`}>
                          {serviceClass}
                        </span>
                      ) : null}
                      {patronType ? (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate">
                          {patronType}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-steel/30 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-mono uppercase tracking-wide text-slate mb-0.5">Intake</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {new Date(selected.intakeAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-steel/30 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-mono uppercase tracking-wide text-slate mb-0.5">Age</div>
                      <div className="text-sm font-bold font-mono text-white">{fmtAge(selected.intakeAt)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-steel/30 px-3 py-2.5 text-center">
                      <div className="text-[10px] font-mono uppercase tracking-wide text-slate mb-0.5">By</div>
                      <div className="text-sm font-bold text-white truncate">{selected.handler.split(" ")[0]}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-steel/25 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-3">Asset details</div>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                      {MODE_BY_ID[selected.mode].fields.map((f) => (
                        <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                          <div className="text-[10px] font-mono uppercase tracking-wide text-slate">{f.label}</div>
                          <div className={`text-sm text-white mt-0.5 ${f.mono ? "font-mono" : "font-medium"}`}>
                            {f.type === "checkbox"
                              ? selected.fields[f.key] ? "Yes" : "No"
                              : String(selected.fields[f.key] ?? "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-steel/25 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-3">Patron</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate/20 border border-white/10 flex items-center justify-center shrink-0 text-sm font-bold text-white">
                        {selected.patron.name.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{selected.patron.name}</div>
                        {patronType ? (
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate mt-0.5">{patronType}</div>
                        ) : null}
                        {selected.patron.phone ? (
                          <div className="text-xs text-slate font-mono mt-0.5">{selected.patron.phone}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setSheetPage("notes")}
                      className={`relative inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-steel/40 px-3 py-2 text-sm font-medium text-paper hover-elevate whitespace-nowrap ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                      data-testid="button-open-notes"
                    >
                      <MessageSquare className="w-4 h-4 text-lime" />
                      Notes
                      {hasNotes ? (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-lime text-obsidian text-[10px] font-bold font-mono px-1">
                          {eventNotes.length}
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full border border-white/20 bg-transparent" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSheetPage("damage")}
                      className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-steel/40 px-3 py-2 text-sm font-medium text-paper hover-elevate whitespace-nowrap ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                      data-testid="button-open-damage-report"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                      Damage
                      <span className="text-[10px] font-mono text-slate">{damageEntries.length || selected.photos.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSheetPage("history")}
                      className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-steel/40 px-3 py-2 text-sm font-medium text-paper hover-elevate whitespace-nowrap ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                      data-testid="button-open-history"
                    >
                      <HistoryIcon className="w-4 h-4 text-indigo-200" />
                      History
                    </button>
                  </div>

                  <Popover open={qrPopoverOpen} onOpenChange={setQrPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`relative w-11 h-11 rounded-2xl border border-white/10 bg-steel/40 flex items-center justify-center text-slate hover:text-paper hover-elevate shrink-0 ${INTERACTIVE_PRESS} ${INTERACTIVE_FOCUS_RING}`}
                        aria-label="Show QR Code"
                        data-testid="button-show-qr"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="end"
                      className="w-auto bg-obsidian border-white/10 p-3"
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-2 text-center">{selected.ticketId}</div>
                      <QrTag ticketId={selected.ticketId} signature={selected.signature} size={180} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProcessedDonut({
  total,
  handler,
  others,
  noun,
}: {
  total: number;
  handler: number;
  others: number;
  noun: string;
}) {
  const data =
    total > 0
      ? [
          { name: "You", value: handler },
          { name: "Team", value: others },
        ]
      : [{ name: "Empty", value: 1 }];
  const colors = total > 0 ? ["#a3e635", "#475569"] : ["#1f2937"];
  const handlerPct = total > 0 ? Math.round((handler / total) * 100) : 0;
  return (
    <div
      className="flex items-center"
      data-testid="card-processed-donut"
      title={`${noun}s processed: ${total} (you ${handler}, team ${others}) — ${handlerPct}% by you`}
    >
      <div className="relative w-20 h-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={26}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-base font-extrabold font-mono tracking-tight text-white tabular-nums">
            {total}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrafficTotals({
  totalIn,
  totalOut,
}: {
  totalIn: number;
  totalOut: number;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      data-testid="card-traffic-totals"
      title={`Traffic — in ${totalIn}, out ${totalOut}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full border border-lime/30 bg-lime/10 flex items-center justify-center">
          <ArrowDownToLine className="w-4 h-4 text-lime" />
        </div>
        <div className="text-base font-extrabold font-mono tabular-nums text-paper w-6 text-left">
          {totalIn}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full border border-amber-300/30 bg-amber-500/10 flex items-center justify-center">
          <ArrowUpFromLine className="w-4 h-4 text-amber-300" />
        </div>
        <div className="text-base font-extrabold font-mono tabular-nums text-paper w-6 text-left">
          {totalOut}
        </div>
      </div>
    </div>
  );
}

function OccupancyCard({
  occupied,
  vacant,
  capacity,
  pct,
  noun,
}: {
  occupied: number;
  vacant: number;
  capacity: number;
  pct: number;
  noun: string;
}) {
  const tone =
    pct >= 90
      ? { text: "text-rose-300" }
      : pct >= 70
      ? { text: "text-amber-300" }
      : { text: "text-lime" };
  const radius = 56;
  const circ = Math.PI * radius;
  const dash = (pct / 100) * circ;
  return (
    <div
      className="flex items-center"
      data-testid="card-occupancy"
      title={`Occupancy: ${occupied}/${capacity} (${vacant} ${noun}s vacant) — ${pct}%`}
    >
      <div className="relative w-24 h-14 shrink-0">
        <svg viewBox="0 0 140 80" className="w-full h-full">
          <path
            d="M 14 70 A 56 56 0 0 1 126 70"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d="M 14 70 A 56 56 0 0 1 126 70"
            fill="none"
            stroke="currentColor"
            className={tone.text}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center">
          <div className={`text-sm font-extrabold font-mono tabular-nums ${tone.text}`}>
            {pct}%
          </div>
        </div>
      </div>
    </div>
  );
}
