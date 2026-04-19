import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useClerk, useUser } from "@clerk/react";
import {
  createAsset,
  getAssetByTicket,
  getListAssetsQueryKey,
  listAssets,
  releaseAsset,
  type CustodyAsset as ApiCustodyAsset,
} from "@workspace/api-client-react";
import type {
  AssetModeId,
  CustodyAsset,
  HandlerSession,
  VenueMembership,
} from "./types";
import { MODES } from "./modes";
import {
  fetchMe,
  joinVenue as apiJoinVenue,
  leaveVenue as apiLeaveVenue,
} from "./api";

const ACTIVE_VENUE_KEY = "ctx_active_venue";
const MODE_KEY = "ctx_handler_mode";

function toLocal(a: ApiCustodyAsset): CustodyAsset {
  return {
    id: a.id,
    ticketId: a.ticketId,
    mode: a.mode as AssetModeId,
    patron: { name: a.patron.name, phone: a.patron.phone },
    fields: (a.fields ?? {}) as Record<string, string | number | boolean>,
    photos: (a.photos ?? []) as string[],
    intakeAt: a.intakeAt,
    handler: a.handler,
    status: a.status as "active" | "released",
    releasedAt: a.releasedAt ?? undefined,
  };
}

interface StoreCtx {
  ready: boolean;
  signedIn: boolean;
  session: HandlerSession | null;
  venues: VenueMembership[];
  activeVenue: VenueMembership | null;
  setActiveVenue: (code: string) => void;
  joinVenue: (inviteToken: string) => Promise<VenueMembership[]>;
  leaveVenue: (code: string) => Promise<VenueMembership[]>;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
  mode: AssetModeId;
  setMode: (m: AssetModeId) => void;
  assets: CustodyAsset[];
  loading: boolean;
  intake: (
    a: Omit<CustodyAsset, "id" | "ticketId" | "intakeAt" | "handler" | "status">,
  ) => Promise<CustodyAsset>;
  release: (ticketId: string) => Promise<CustodyAsset | null>;
  findByTicket: (ticketId: string) => Promise<CustodyAsset | undefined>;
}

const Ctx = createContext<StoreCtx | null>(null);

function readStoredVenue(): string | null {
  try {
    return localStorage.getItem(ACTIVE_VENUE_KEY);
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const [mode, setModeState] = useState<AssetModeId>(() => {
    try {
      const raw = localStorage.getItem(MODE_KEY);
      if (raw && MODES.some((m) => m.id === raw)) return raw as AssetModeId;
    } catch {}
    return "vehicles";
  });
  const [activeVenueCode, setActiveVenueCodeState] = useState<string | null>(
    () => readStoredVenue(),
  );

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    try {
      if (activeVenueCode) localStorage.setItem(ACTIVE_VENUE_KEY, activeVenueCode);
      else localStorage.removeItem(ACTIVE_VENUE_KEY);
    } catch {}
  }, [activeVenueCode]);

  // Pull membership info from server. /api/me reads memberships from the
  // handler_venues table (server-authoritative), not from client state.
  const meQuery = useQuery({
    queryKey: ["me", user?.id ?? null],
    queryFn: fetchMe,
    enabled: Boolean(authLoaded && isSignedIn),
    staleTime: 30_000,
  });

  const venues = meQuery.data?.venues ?? [];
  const email = meQuery.data?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const handlerName =
    meQuery.data?.name ??
    ([user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username ||
      email.split("@")[0] ||
      "Handler");

  // Reconcile active venue with the membership list.
  useEffect(() => {
    if (!isSignedIn) {
      setActiveVenueCodeState(null);
      return;
    }
    if (!meQuery.data) return;
    if (venues.length === 0) {
      setActiveVenueCodeState(null);
      return;
    }
    const matches = activeVenueCode
      ? venues.find((v) => v.code === activeVenueCode)
      : null;
    if (!matches) setActiveVenueCodeState(venues[0].code);
  }, [isSignedIn, meQuery.data, venues, activeVenueCode]);

  const activeVenue = useMemo<VenueMembership | null>(
    () => venues.find((v) => v.code === activeVenueCode) ?? null,
    [venues, activeVenueCode],
  );

  const session = useMemo<HandlerSession | null>(() => {
    if (!isSignedIn || !activeVenue || !email) return null;
    return {
      email,
      handlerName,
      venueCode: activeVenue.code,
      venueName: activeVenue.name,
    };
  }, [isSignedIn, activeVenue, email, handlerName]);

  const venueCode = activeVenue?.code ?? "";

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: getListAssetsQueryKey(venueCode),
    queryFn: () => listAssets(venueCode).then((rows) => rows.map(toLocal)),
    enabled: Boolean(venueCode),
  });

  const invalidate = useCallback(() => {
    if (!venueCode) return;
    queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(venueCode) });
  }, [queryClient, venueCode]);

  const intake = useCallback<StoreCtx["intake"]>(
    async (a) => {
      if (!session) throw new Error("Not signed in");
      const created = await createAsset(session.venueCode, {
        mode: a.mode,
        patron: a.patron,
        fields: a.fields,
        photos: a.photos,
        handlerEmail: session.email,
        handlerName: session.handlerName,
        venueName: session.venueName,
      });
      const local = toLocal(created);
      queryClient.setQueryData<CustodyAsset[] | undefined>(
        getListAssetsQueryKey(session.venueCode),
        (prev) => (prev ? [local, ...prev] : [local]),
      );
      invalidate();
      return local;
    },
    [session, queryClient, invalidate],
  );

  const release = useCallback<StoreCtx["release"]>(
    async (ticketId) => {
      if (!session) return null;
      try {
        const updated = await releaseAsset(session.venueCode, ticketId, {
          handlerEmail: session.email,
          handlerName: session.handlerName,
        });
        const local = toLocal(updated);
        queryClient.setQueryData<CustodyAsset[] | undefined>(
          getListAssetsQueryKey(session.venueCode),
          (prev) =>
            prev?.map((row) => (row.ticketId === local.ticketId ? local : row)) ??
            prev,
        );
        invalidate();
        return local;
      } catch {
        return null;
      }
    },
    [session, queryClient, invalidate],
  );

  const findByTicket = useCallback<StoreCtx["findByTicket"]>(
    async (ticketId) => {
      if (!session) return undefined;
      try {
        const found = await getAssetByTicket(session.venueCode, ticketId.trim());
        return toLocal(found);
      } catch {
        return undefined;
      }
    },
    [session],
  );

  const refreshMe = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    await meQuery.refetch();
  }, [queryClient, meQuery]);

  const join: StoreCtx["joinVenue"] = useCallback(
    async (inviteToken) => {
      const { venues: next, joined } = await apiJoinVenue(inviteToken);
      queryClient.setQueryData(
        ["me", user?.id ?? null],
        (prev: typeof meQuery.data) => (prev ? { ...prev, venues: next } : prev),
      );
      if (joined?.code) setActiveVenueCodeState(joined.code.toUpperCase());
      return next;
    },
    [queryClient, user?.id, meQuery.data],
  );

  const leave: StoreCtx["leaveVenue"] = useCallback(
    async (code) => {
      const { venues: next } = await apiLeaveVenue(code);
      queryClient.setQueryData(
        ["me", user?.id ?? null],
        (prev: typeof meQuery.data) => (prev ? { ...prev, venues: next } : prev),
      );
      setActiveVenueCodeState((cur) => (cur === code ? next[0]?.code ?? null : cur));
      return next;
    },
    [queryClient, user?.id, meQuery.data],
  );

  const setActiveVenue = useCallback((code: string) => {
    setActiveVenueCodeState(code.toUpperCase());
  }, []);

  const signOutFn = useCallback(async () => {
    queryClient.clear();
    setActiveVenueCodeState(null);
    try {
      localStorage.removeItem(ACTIVE_VENUE_KEY);
    } catch {}
    await clerk.signOut();
  }, [clerk, queryClient]);

  const ready =
    Boolean(authLoaded) &&
    (!isSignedIn || (meQuery.isFetched && !meQuery.isLoading));

  const value = useMemo<StoreCtx>(
    () => ({
      ready,
      signedIn: Boolean(isSignedIn),
      session,
      venues,
      activeVenue,
      setActiveVenue,
      joinVenue: join,
      leaveVenue: leave,
      refreshMe,
      signOut: signOutFn,
      mode,
      setMode: (m) => setModeState(m),
      assets,
      loading: assetsLoading,
      intake,
      release,
      findByTicket,
    }),
    [
      ready,
      isSignedIn,
      session,
      venues,
      activeVenue,
      setActiveVenue,
      join,
      leave,
      refreshMe,
      signOutFn,
      mode,
      assets,
      assetsLoading,
      intake,
      release,
      findByTicket,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
