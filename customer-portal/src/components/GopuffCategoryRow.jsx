const categories = [
  { name: 'SNAP EBT', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop' },
  { name: 'Fresh Grocery', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop' },
  { name: 'Price Drops', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&h=100&fit=crop' },
  { name: 'Alcohol', img: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?w=100&h=100&fit=crop' },
  { name: 'Smoke Shop', img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&h=100&fit=crop' },
  { name: 'HSA FSA', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop', badge: 'NEW' },
  { name: 'Wellness', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop' },
  { name: 'Snacks', img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=100&h=100&fit=crop' },
  { name: 'Drinks', img: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=100&h=100&fit=crop' },
  { name: 'Deals', img: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=100&h=100&fit=crop' },
  { name: 'Ice Cream', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop' },
  { name: 'Hemp THC', img: 'https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=100&h=100&fit=crop', badge: 'NEW' },
  { name: 'Personal Care', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&h=100&fit=crop' },
];

const GopuffCategoryRow = () => (
  <div className="max-w-[1440px] mx-auto px-4 py-8">
    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2">
      {categories.map((cat, i) => (
        <div key={i} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
          <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all shadow-sm">
            <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
            {cat.badge && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-sm">
                {cat.badge}
              </div>
            )}
          </div>
          <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap uppercase tracking-tight text-gray-800">{cat.name}</span>
        </div>
      ))}
    </div>
  </div>
);

export default GopuffCategoryRow;
