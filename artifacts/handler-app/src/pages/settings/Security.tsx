import { ShieldCheck } from "lucide-react";
import { SettingsCard, SettingsSubHeader } from "./_chrome";

export default function SettingsSecurity() {
  return (
    <div>
      <SettingsSubHeader title="Security" Icon={ShieldCheck} description="Sign-in, devices, sessions" />
      <SettingsCard>
        <div className="text-sm text-slate leading-relaxed">
          Security controls — password, two-factor, trusted devices and active sessions — will live here once
          the platform endpoint is exposed.
        </div>
      </SettingsCard>
    </div>
  );
}
