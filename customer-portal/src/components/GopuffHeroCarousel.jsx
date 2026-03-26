import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "THE FUTURE OF SHOPPING IS INSTANT.",
    subtitle: "Get everything you need in minutes.",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1500&auto=format&fit=crop",
    type: "deals",
    gradient: "from-violet-900/90 via-violet-900/50 to-transparent"
  },
  {
    id: 2,
    title: "OPEN LATE. ALWAYS ON.",
    subtitle: "Late night cravings? We got you.",
    img: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1500&auto=format&fit=crop",
    type: "offers",
    gradient: "from-blue-900/90 via-blue-900/50 to-transparent"
  },
  {
    id: 3,
    title: "5000+ PRODUCTS",
    subtitle: "From snacks to electronics.",
    img: "https://images.unsplash.com/photo-1601598851547-4302969d0614?q=80&w=1500&auto=format&fit=crop",
    type: "all-products",
    gradient: "from-emerald-900/90 via-emerald-900/50 to-transparent"
  },
  {
    id: 4,
    title: "BUILT FOR SPEED.",
    subtitle: "Delivered to your door in under 30 min.",
    img: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1500&auto=format&fit=crop",
    type: "deals",
    gradient: "from-rose-900/90 via-rose-900/50 to-transparent"
  }
];

const GopuffHeroCarousel = ({ onBannerClick }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector('[data-carousel-card]');
    if (!card) return;
    const scrollAmount = card.offsetWidth + 16; // card width + gap
    scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 pb-12 relative group">
      {/* Scroll Buttons */}
      <button 
        onClick={() => scroll('left')} 
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={() => scroll('right')} 
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Scrollable Cards */}
      <div 
        ref={scrollRef} 
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {slides.map(slide => (
          <div
            key={slide.id}
            data-carousel-card
            className="relative min-w-[320px] md:min-w-[420px] h-[320px] md:h-[400px] rounded-2xl overflow-hidden cursor-pointer snap-start shrink-0 border border-gray-100 group/card"
            onClick={() => onBannerClick && onBannerClick(slide.type)}
          >
            <img 
              src={slide.img} 
              alt={slide.title} 
              className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" 
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradient}`} />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h2 className="text-white font-black italic text-2xl md:text-3xl tracking-tighter leading-none uppercase mb-2">
                {slide.title}
              </h2>
              <p className="text-gray-200 text-sm md:text-base font-medium">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GopuffHeroCarousel;
