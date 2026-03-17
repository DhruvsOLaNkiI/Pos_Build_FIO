import { Zap } from 'lucide-react';

const GopuffMarquee = () => {
    return (
      <div className="w-full overflow-hidden bg-white border-y-2 border-blue-500 py-6 flex whitespace-nowrap mb-12">
        <div className="flex animate-marquee text-blue-500 font-black italic text-4xl md:text-6xl tracking-tighter uppercase whitespace-nowrap">
          <span className="mx-10 flex items-center">FROM OUR SHELVES TO YOUR DOOR. <Zap className="mx-8 w-10 h-10 md:w-16 md:h-16" fill="currentColor" /> OPEN LATE FOR YOUR COZY NIGHT IN.</span>
          <span className="mx-10 flex items-center">FROM OUR SHELVES TO YOUR DOOR. <Zap className="mx-8 w-10 h-10 md:w-16 md:h-16" fill="currentColor" /> OPEN LATE FOR YOUR COZY NIGHT IN.</span>
          <span className="mx-10 flex items-center">FROM OUR SHELVES TO YOUR DOOR. <Zap className="mx-8 w-10 h-10 md:w-16 md:h-16" fill="currentColor" /> OPEN LATE FOR YOUR COZY NIGHT IN.</span>
        </div>
      </div>
    );
  };

export default GopuffMarquee;
