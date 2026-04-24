import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { SettingsCard, SettingsSubHeader } from "./_chrome";

type Window = "day" | "week" | "month" | "year";

function getWindowStart(window: Window) {
  const now = Date.now();
  if (window === "day") return now - 24 * 60 * 60 * 1000;
  if (window === "week") return now - 7 * 24 * 60 * 60 * 1000;
  if (window === "month") return now - 30 * 24 * 60 * 60 * 1000;
  return now - 365 * 24 * 60 * 60 * 1000;
}

export default function SettingsPerformance() {
  const { assets, mode, session } = useStore();
  const [window, setWindow] = useState<Window>("week");

  const data = useMemo(() => {
    const start = getWindowStart(window);
    const myName = (session?.handlerName ?? "").trim().toLowerCase();
    const myEmail = (session?.email ?? "").trim().toLowerCase();
    const scoped = assets.filter((a) => a.mode === mode);
    const totalCars = scoped.filter((a) => a.intakeAt >= start).length;
    const handledByMe = scoped.filter((a) => {
      if (a.intakeAt < start) return false;
      const h = (a.handler ?? "").trim().toLowerCase();
      const r = (a.releasedBy ?? "").trim().toLowerCase();
      return h === myName || r === myName || r === myEmail;
    }).length;
    return { totalCars, handledByMe, others: Math.max(0, totalCars - handledByMe) };
  }, [assets, mode, session, window]);

  const total = Math.max(1, data.totalCars);
  const myPct = Math.round((data.handledByMe / total) * 100);

  return (
    <div>
      <SettingsSubHeader
        title="Performance overview"
        Icon={BarChart3}
        description="Your share of vehicles handled at this station"
      />

      <SettingsCard className="mb-4">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-1">
          {(["day", "week", "month", "year"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider hover-elevate ${
                window === w ? "bg-lime/15 text-lime" : "text-slate"
              }`}
              data-testid={`performance-window-${w}`}
            >
              {w}
            </button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-center">
          <Pie handled={data.handledByMe} total={data.totalCars} />
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate mb-2">Breakdown</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-paper">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-lime" />
                  Handled by you
                </span>
                <span className="font-mono text-white" data-testid="perf-mine">
                  {data.handledByMe}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-white/20" />
                  Other handlers
                </span>
                <span className="font-mono text-white" data-testid="perf-others">
                  {data.others}
                </span>
              </li>
              <li className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-paper font-semibold">Total</span>
                <span className="font-mono text-white" data-testid="perf-total">
                  {data.totalCars}
                </span>
              </li>
            </ul>
            <div className="mt-3 text-[11px] font-mono uppercase tracking-wider text-slate">
              Your share: <span className="text-lime">{myPct}%</span>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

function Pie({ handled, total }: { handled: number; total: number }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const t = Math.max(1, total);
  const len = (handled / t) * c;
  const dash = `${len} ${c - len}`;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" data-testid="performance-pie">
      <circle cx="70" cy="70" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="20" fill="none" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        strokeWidth="20"
        stroke="currentColor"
        className="text-lime"
        strokeDasharray={dash}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="68" textAnchor="middle" className="fill-white" fontSize="20" fontWeight="800">
        {handled}
      </text>
      <text x="70" y="86" textAnchor="middle" className="fill-slate" fontSize="10" fontFamily="monospace">
        of {total}
      </text>
    </svg>
  );
}
