import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

interface Props {
  ticketId: string;
  signature?: string;
  size?: number;
}

export function QrTag({ ticketId, signature, size = 180 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (signature) {
      return JSON.stringify({ t: ticketId, v: 1, sig: signature });
    }
    return ticketId;
  }, [ticketId, signature]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: size,
      color: { dark: "#0B0F19", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload, size]);

  return (
    <div className="inline-block bg-white p-3 rounded-2xl">
      {dataUrl ? (
        <img
          src={dataUrl}
          width={size}
          height={size}
          alt={`QR tag for ${ticketId}`}
          className="block"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="bg-white animate-pulse rounded"
          aria-label={`QR tag for ${ticketId}`}
        />
      )}
    </div>
  );
}
