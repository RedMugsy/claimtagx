import { User, Camera } from "lucide-react";
import { useStore } from "@/lib/store";
import { SettingsCard, SettingsSubHeader } from "./_chrome";

export default function SettingsProfile() {
  const { session, activeVenue } = useStore();
  const initial = (session?.handlerName ?? "H").slice(0, 1).toUpperCase();

  // Profile shape per spec — most fields are not yet wired to backend.
  // Render as read-only placeholders pending platform integration.
  const fields: Array<{ label: string; value: string }> = [
    { label: "First name", value: (session?.handlerName ?? "").split(" ")[0] || "—" },
    { label: "Last name", value: (session?.handlerName ?? "").split(" ").slice(1).join(" ") || "—" },
    { label: "Email", value: session?.email ?? "—" },
    { label: "Date of joining", value: "—" },
    { label: "Department", value: activeVenue?.venueType ?? "—" },
    { label: "Job title", value: activeVenue?.role ?? "Handler" },
  ];

  return (
    <div>
      <SettingsSubHeader title="Profile" Icon={User} description="Your handler identity" />
      <div className="space-y-4">
        <SettingsCard>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center text-lime text-3xl font-extrabold">
                {initial}
              </div>
              <button
                type="button"
                disabled
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-obsidian border border-white/15 flex items-center justify-center text-slate"
                data-testid="button-upload-photo"
                aria-label="Change photo"
                title="Photo upload coming soon"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-white truncate">{session?.handlerName ?? "Handler"}</div>
              <div className="text-xs font-mono text-slate truncate">{session?.email}</div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard>
          <div className="text-xs font-mono uppercase tracking-wider text-slate mb-3">
            Personal details
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/10 bg-obsidian/40 p-3">
                <dt className="text-[10px] font-mono uppercase tracking-wider text-slate">
                  {f.label}
                </dt>
                <dd className="mt-1 text-sm text-white font-semibold truncate" data-testid={`profile-${f.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </SettingsCard>

        <SettingsCard>
          <div className="text-xs font-mono uppercase tracking-wider text-slate mb-2">
            Certificates
          </div>
          <div className="text-sm text-slate">
            No certificates uploaded yet. Upload-and-verify flow will arrive when the platform endpoint is exposed.
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
