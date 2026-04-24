import { Link } from "wouter";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingsSubHeader({
  title,
  Icon,
  description,
}: {
  title: string;
  Icon: LucideIcon;
  description?: string;
}) {
  return (
    <header className="mb-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-0.5 mb-3"
        data-testid="link-back-to-settings"
      >
        <ChevronLeft className="w-3 h-3" /> Settings
      </Link>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-lime" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <div className="text-xs text-slate truncate">{description}</div>
          )}
        </div>
      </div>
    </header>
  );
}

export function SettingsCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-steel/40 p-5 ${className}`}>
      {children}
    </section>
  );
}
