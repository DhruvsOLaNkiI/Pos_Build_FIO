import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "THE FUTURE OF SHOPPING IS INSTANT.",
    subtitle: "Get everything you need in minutes.",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1500&auto=format&fit=crop",
    type: "deals"
  },
  {
    id: 2,
    title: "OPEN LATE. ALWAYS ON.",
    subtitle: "Late night cravings? We got you.",
    img: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1500&auto=format&fit=crop",
    type: "offers"
  },
  {
    id: 3,
    title: "5000+ PRODUCTS",
    subtitle: "From snacks to electronics.",
    img: "https://images.unsplash.com/photo-1601598851547-4302969d0614?q=80&w=1500&auto=format&fit=crop",
    type: "all-products"
  }
];

const GopuffHeroSlider = ({ onBannerClick }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 pb-12">
      <div 
        className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden cursor-pointer border border-gray-100 group"
        onClick={() => onBannerClick && onBannerClick(slides[current].type)}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img src={slide.img} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-16 md:w-2/3">
              <h2 className="text-white font-black italic text-4xl md:text-6xl tracking-tighter mb-4 uppercase">
                {slide.title}
              </h2>
              <p className="text-gray-200 text-lg md:text-xl font-medium">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
        
        {/* Navigation Arrows */}
        <button 
          onClick={handlePrev} 
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={handleNext} 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(index);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === current ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GopuffHeroSlider;
