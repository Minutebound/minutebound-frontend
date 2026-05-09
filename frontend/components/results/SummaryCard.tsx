import React from "react";

export default function SummaryCard({ data }: { data: any }) {
  const rawDest = data?.rawParams?.destination;
  const destination = typeof rawDest === 'object' ? rawDest.name : rawDest || "Your Destination";
  const description = data?.destinationInfo?.description || "Get ready for an unforgettable journey. Here is a quick snapshot of the local atmosphere, top sights, and everything you need to know.";
  const funFact = data?.destinationInfo?.fun_fact || `${destination} is full of hidden gems, vibrant local culture, and incredible landmarks waiting to be discovered.`;
  const attractions = data?.attractions || [];
  
  const placeholderImage = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop";
  const cityImage = data?.destinationInfo?.image_url || data?.destinationInfo?.photo || data?.destinationInfo?.image || attractions?.[0]?.photo || attractions?.[0]?.image_url || placeholderImage;

  const weather = data?.weather;
  const firstDay = weather?.days?.[0];
  const temp = firstDay?.max_temp ?? weather?.current?.temp_f ?? weather?.main?.temp ?? weather?.currentConditions?.temp ?? weather?.temperature ?? weather?.temp ?? "--";
  const condition = firstDay?.weather ?? weather?.current?.condition?.text ?? weather?.weather?.[0]?.description ?? weather?.currentConditions?.conditions ?? weather?.condition ?? "Awaiting Forecast";
  const idealMonth = weather?.ideal_month ?? data?.destinationInfo?.ideal_month ?? "September";

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LABELS OUTSIDE */}
      <div className="flex flex-col w-full gap-1.5">
        <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60 px-4">Overview</label>
        <div className="p-6 md:p-8 bg-theme-text rounded-[2rem] border-[1.5px] border-theme-surface shadow-sm flex flex-col md:flex-row gap-6 md:gap-10 items-stretch">
          <div className="flex-1 flex flex-col justify-center gap-4">
            <h2 className="text-4xl md:text-5xl font-black text-theme-bg tracking-tight capitalize">
              {destination}
            </h2>
            <p className="text-theme-bg/70 font-medium text-sm md:text-[15px] leading-relaxed max-w-xl">
              {description}
            </p>
            <div className="mt-2 p-5 bg-theme-bg/10 rounded-[1.5rem] border-[1.5px] border-theme-bg/20 inline-flex flex-col gap-2 self-start max-w-xl">
              <span className="text-[10px] uppercase font-black tracking-widest text-theme-bg/60 flex items-center gap-1.5">
                💡 Fun Fact
              </span>
              <span className="text-theme-bg text-[13px] font-bold leading-snug">
                {funFact}
              </span>
            </div>
          </div>
          <div className="w-full md:w-[40%] h-64 md:h-auto min-h-[220px] flex-shrink-0 relative rounded-[1.5rem] overflow-hidden shadow-md border-4 border-theme-bg/20">
            <img src={cityImage} alt={destination} className="w-full h-full object-cover absolute inset-0 hover:scale-105 transition-transform duration-700" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col w-full gap-1.5 md:col-span-1">
          <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60 px-4">Atmosphere</label>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-theme-text to-theme-secondary border-[1.5px] border-theme-surface p-6 md:p-8 shadow-xl h-full flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
              <span className="text-[150px]">☁️</span>
            </div>
            <div className="flex items-end gap-3 relative z-10 mb-6">
              <div className="text-5xl md:text-6xl font-black text-theme-bg tracking-tighter">
                {typeof temp === "number" ? Math.round(temp) : temp}°
              </div>
              <div className="pb-1 text-theme-bg/70 font-bold text-sm md:text-base capitalize">{condition}</div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] bg-theme-bg/10 text-theme-bg text-[11px] font-black border border-theme-bg/20 backdrop-blur-md uppercase tracking-widest w-fit">
              Best Month: {idealMonth}
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full gap-1.5 md:col-span-2">
          <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60 px-4">Must-See Sights</label>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar scroll-smooth h-full items-center">
            {attractions.length > 0 ? (
              attractions.map((attr: any, i: number) => {
                const image = attr.photo || attr.thumbnail || attr.image_url;
                const name = attr.name || attr.tags?.name || 'Interesting Place';
                const attrDescription = attr.description || (attr.category || attr.tags?.tourism || 'Popular Attraction').replace(/_/g, " ");

                return (
                  <div key={i} className="min-w-[240px] max-w-[240px] snap-center bg-theme-bg border-[1.5px] border-theme-surface rounded-[1.5rem] p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-grab">
                    <div className="w-full h-32 bg-theme-surface rounded-xl mb-3 overflow-hidden relative flex-shrink-0">
                      {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎡</div>
                      )}
                    </div>
                    <h4 className="font-bold text-theme-text truncate text-[14px]">{name}</h4>
                    <p className="text-[12px] text-theme-muted mt-1 line-clamp-2 capitalize font-medium">{attrDescription}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-[11px] text-theme-muted font-black tracking-widest uppercase p-8 border-[1.5px] border-theme-surface border-dashed rounded-[2rem] w-full text-center">
                No top attractions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}