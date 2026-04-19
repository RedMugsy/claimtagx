import type { FieldDef } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  def: FieldDef;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean | undefined) => void;
}

export function ModeField({ def, value, onChange }: Props) {
  const id = `field-${def.key}`;
  const monoCls = def.mono ? "font-mono tracking-wide" : "";
  const v = value ?? (def.type === "checkbox" ? false : def.type === "number" ? "" : "");

  if (def.type === "checkbox") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian/40 px-4 py-3">
        <Label htmlFor={id} className="text-sm text-white">
          {def.label}
        </Label>
        <Checkbox
          id={id}
          checked={Boolean(v)}
          onCheckedChange={(c) => onChange(Boolean(c))}
          data-testid={`input-${def.key}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-mono uppercase tracking-wide text-slate">
        {def.label}
        {def.required && <span className="text-lime ml-1">*</span>}
      </Label>
      {def.type === "select" ? (
        <Select value={v ? String(v) : ""} onValueChange={(s) => onChange(s)}>
          <SelectTrigger id={id} className={`bg-obsidian/40 border-white/10 text-white ${monoCls}`} data-testid={`input-${def.key}`}>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            {def.options?.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : def.type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={def.placeholder}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-obsidian/40 border-white/10 text-white placeholder:text-slate ${monoCls}`}
          rows={3}
          data-testid={`input-${def.key}`}
        />
      ) : (
        <Input
          id={id}
          type={def.type === "number" ? "number" : "text"}
          inputMode={def.type === "number" ? "numeric" : undefined}
          min={def.type === "number" ? 0 : undefined}
          placeholder={def.placeholder}
          value={v === undefined || v === null ? "" : String(v)}
          onChange={(e) => {
            const raw = e.target.value;
            if (def.type === "number") {
              if (raw === "") {
                onChange(undefined);
              } else {
                const n = Number(raw);
                onChange(Number.isFinite(n) ? n : undefined);
              }
            } else {
              onChange(raw);
            }
          }}
          className={`bg-obsidian/40 border-white/10 text-white placeholder:text-slate ${monoCls}`}
          data-testid={`input-${def.key}`}
        />
      )}
    </div>
  );
}
