import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export function CameraCapture({ photos, onChange, max = 5 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [streamOn, setStreamOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (streamOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          setError("Camera unavailable. Use upload instead.");
          setStreamOn(false);
        });
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [streamOn]);

  const snap = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.7);
    onChange([...photos, data].slice(0, max));
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    let pending = files.length;
    Array.from(files).forEach((f) => {
      const r = new FileReader();
      r.onload = () => {
        if (typeof r.result === "string") next.push(r.result);
        pending -= 1;
        if (pending === 0) onChange([...photos, ...next].slice(0, max));
      };
      r.readAsDataURL(f);
    });
  };

  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-wide text-slate">
          Photos · {photos.length}/{max}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setStreamOn((v) => !v)}
            data-testid="button-toggle-camera"
          >
            <Camera className="w-4 h-4" /> {streamOn ? "Stop" : "Camera"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            data-testid="button-upload-photo"
          >
            <ImagePlus className="w-4 h-4" /> Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
      </div>

      {streamOn && (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-obsidian aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <button
            type="button"
            onClick={snap}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-lime border-4 border-white/80 hover:bg-lime-hover transition-colors"
            aria-label="Capture photo"
            data-testid="button-snap"
          />
        </div>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-obsidian">
              <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-obsidian/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !streamOn && (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate flex flex-col items-center gap-2">
          <RotateCcw className="w-5 h-5 text-slate" />
          No photos yet. Capture or upload to attach to the ticket.
        </div>
      )}
    </div>
  );
}
