export default function TrustStrip() {
  const logos = [
    "APEX VALET", "CRISP & CO.", "NORDIC HOSPITALITY", "ATLAS REPAIR", 
    "ELEVATE EVENTS", "PRIME LAUNDRY", "HORIZON HOTELS", "VERTEX LOGISTICS"
  ];

  return (
    <div className="py-10 bg-obsidian border-t border-white/5 overflow-hidden flex flex-col items-center justify-center">
      <p className="text-sm text-slate mb-6 uppercase tracking-widest font-semibold">Trusted by leading operations</p>
      
      <div className="w-full relative flex overflow-x-hidden group">
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />
        
        <div className="flex animate-marquee whitespace-nowrap">
          {/* Double the logos for seamless loop */}
          {[...logos, ...logos].map((logo, index) => (
            <div 
              key={index} 
              className="mx-8 text-xl font-bold text-white/20 hover:text-white/60 transition-colors duration-300 select-none font-mono"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}