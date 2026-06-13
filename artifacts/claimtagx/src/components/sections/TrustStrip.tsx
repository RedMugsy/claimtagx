export default function TrustStrip() {
  const items = [
    "PHOTO PROOF AT INTAKE",
    "QR · NFC · BLE · SMS · WHATSAPP · EMAIL · PUSH",
    "OFFLINE-FIRST",
    "NO PATRON APP",
    "FULL AUDIT TRAIL",
    "60-SECOND SETUP",
    "ZERO HARDWARE",
    "INSURANCE-READY RECORDS",
  ];

  return (
    <div className="py-10 bg-obsidian border-t border-white/5 overflow-hidden flex flex-col items-center justify-center">
      <p className="text-sm text-slate mb-6 uppercase tracking-widest font-semibold">
        One custody OS — anywhere items change hands
      </p>

      <div className="w-full relative flex overflow-x-hidden group">
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap">
          {/* Double the items for seamless loop */}
          {[...items, ...items].map((item, index) => (
            <div
              key={index}
              className="mx-8 text-xl font-bold text-white/20 hover:text-lime/70 transition-colors duration-300 select-none font-mono flex items-center gap-8"
            >
              {item}
              <span className="text-lime/30 text-sm">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
