const GopuffHeroGrid = ({ onBannerClick }) => (
  <div className="max-w-[1440px] mx-auto px-4 pb-12">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
      {/* Large Hero */}
      <div 
        className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100"
        onClick={() => onBannerClick && onBannerClick('deals')}
      >
        <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop" alt="Hero 1" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-8 left-8">
            <h2 className="text-white font-black italic text-4xl md:text-5xl tracking-tighter w-full max-w-sm leading-none uppercase">
            THE FUTURE OF SHOPPING IS INSTANT.
            </h2>
        </div>
      </div>

      {/* Grid of 3 */}
      <div className="grid grid-rows-2 gap-4">
        <div 
            className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100"
            onClick={() => onBannerClick && onBannerClick('offers')}
        >
          <img src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1000&auto=format&fit=crop" alt="Hero 2" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <h2 className="absolute bottom-6 left-6 text-white font-black italic text-3xl md:text-4xl tracking-tighter w-3/4 leading-none uppercase">
            OPEN LATE. ALWAYS ON.
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100"
            onClick={() => onBannerClick && onBannerClick('all-products')}
          >
            <img src="https://images.unsplash.com/photo-1601598851547-4302969d0614?q=80&w=1000&auto=format&fit=crop" alt="Hero 3" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <h2 className="absolute bottom-5 left-5 text-white font-black italic text-xl tracking-tighter leading-none uppercase">
              5000+ PRODUCTS
            </h2>
          </div>
          <div 
            className="relative rounded-2xl overflow-hidden group cursor-pointer border border-gray-100"
            onClick={() => onBannerClick && onBannerClick('deals')}
          >
            <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1000&auto=format&fit=crop" alt="Hero 4" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <h2 className="absolute bottom-5 left-5 text-white font-black italic text-xl tracking-tighter leading-none uppercase">
              BUILT FOR SPEED.
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default GopuffHeroGrid;
