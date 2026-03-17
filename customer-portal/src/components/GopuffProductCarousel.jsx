import { ChevronRight } from 'lucide-react';
import GopuffProductCard from './GopuffProductCard';

const GopuffProductCarousel = ({ title, products, totalItems, onMoreClick }) => (
  <div className="max-w-[1440px] mx-auto px-4 py-8">
    <div className="flex items-end justify-between mb-6">
      <h2 className="font-black italic text-3xl md:text-4xl tracking-tighter uppercase leading-none">{title}</h2>
      <button 
        onClick={onMoreClick} 
        className="text-[11px] font-black text-gray-500 hover:text-black flex items-center gap-1 uppercase tracking-tighter transition-colors"
      >
        {totalItems ? `${totalItems} ITEMS` : 'MORE ITEMS'} 
        <ChevronRight className="w-3 h-3" strokeWidth={3} />
      </button>
    </div>
    <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 scroll-smooth">
      {products.map(p => (
        <GopuffProductCard 
            key={p._id || p.id} 
            product={p} 
            className="min-w-[160px] max-w-[160px] md:min-w-[180px] md:max-w-[180px]" 
        />
      ))}
    </div>
  </div>
);

export default GopuffProductCarousel;
