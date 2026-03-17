const GopuffBottomHeroGrid = () => (
    <div className="max-w-[1440px] mx-auto px-4 py-12 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
        <div className="relative rounded-3xl overflow-hidden group cursor-pointer border border-gray-100 shadow-xl">
          <img src="https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=1000&auto=format&fit=crop" alt="Hero 1" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <h2 className="absolute bottom-8 left-8 text-white font-black italic text-4xl tracking-tighter w-1/2 leading-none uppercase">
            POWERED BY TECH.<br/><span className="text-blue-400">PERFECTED FOR VALUE.</span>
          </h2>
        </div>
        <div className="grid grid-rows-2 gap-4">
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop" alt="Hero 2" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <h2 className="absolute bottom-5 left-5 text-white font-black italic text-3xl tracking-tighter leading-none uppercase">
              DIRECT FROM US.<br/>STRAIGHT TO YOU.
            </h2>
          </div>
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" alt="Hero 3" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <h2 className="absolute bottom-5 left-5 text-white font-black italic text-3xl tracking-tighter leading-none uppercase">
              NO MARKUPS,<br/>NO HIDDEN FEES.
            </h2>
          </div>
        </div>
      </div>
    </div>
  );

export default GopuffBottomHeroGrid;
