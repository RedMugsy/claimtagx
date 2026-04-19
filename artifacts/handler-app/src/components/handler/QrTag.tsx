import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  value: string;
  size?: number;
}

export function QrTag({ value, size = 180 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
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
  }, [value, size]);

  return (
    <div className="inline-block bg-white p-3 rounded-2xl">
      {dataUrl ? (
        <img
          src={dataUrl}
          width={size}
          height={size}
          alt={`QR tag for ${value}`}
          className="block"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="bg-white animate-pulse rounded"
          aria-label={`QR tag for ${value}`}
        />
      )}
    </div>
  );
}
