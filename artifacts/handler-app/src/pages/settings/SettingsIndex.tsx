import { Link } from "wouter";
import {
  BarChart3,
  CalendarClock,
  ChevronRight,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

interface Row {
  to: string;
  Icon: LucideIcon;
  label: string;
  description: string;
  testId: string;
}

const rows: Row[] = [
  {
    to: "/settings/profile",
    Icon: User,
    label: "Profile",
    description: "Photo, name, department, certificates",
    testId: "settings-row-profile",
  },
  {
    to: "/settings/attendance",
    Icon: CalendarClock,
    label: "Attendance overview",
    description: "Upcoming and past shifts, with trends",
    testId: "settings-row-attendance",
  },
  {
    to: "/settings/performance",
    Icon: BarChart3,
    label: "Performance overview",
    description: "Your handled-vehicle ratio over time",
    testId: "settings-row-performance",
  },
  {
    to: "/settings/security",
    Icon: ShieldCheck,
    label: "Security",
    description: "Sign-in, devices, sessions",
    testId: "settings-row-security",
  },
];

export default function SettingsIndex() {
  const { signOut } = useStore();
  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">Handler</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.to}>
            <Link
              href={r.to}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-steel/40 p-4 hover-elevate"
              data-testid={r.testId}
            >
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-obsidian/40 flex items-center justify-center">
                <r.Icon className="w-5 h-5 text-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{r.label}</div>
                <div className="text-xs text-slate truncate">{r.description}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-white/10 bg-steel/40 p-4 flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">Sign out</div>
          <div className="text-xs text-slate">Log out of the handler app on this device.</div>
        </div>
        <Button
          variant="secondary"
          onClick={() => void signOut()}
          data-testid="button-signout"
          className="border-red-500/30 text-red-300 hover:text-red-200"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
