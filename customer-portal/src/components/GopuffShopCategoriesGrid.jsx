const GopuffShopCategoriesGrid = ({ onCategoryClick }) => {
  const categories = [
    { name: 'ALCOHOL', displayName: 'ALCOHOL.', bg: "from-purple-900/40", img: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?q=80&w=500&auto=format&fit=crop' },
    { name: 'SNACKS', displayName: 'SNACKS.', bg: "from-orange-900/40", img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=500&auto=format&fit=crop' },
    { name: 'DRINKS', displayName: 'DRINKS.', bg: "from-blue-900/40", img: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=500&auto=format&fit=crop' },
    { name: 'FROZEN', displayName: 'FROZEN.', bg: "from-cyan-900/40", img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=500&auto=format&fit=crop' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-12">
      <h2 className="font-black italic text-3xl md:text-4xl tracking-tighter uppercase mb-8">SHOP CATEGORIES.</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <div 
            key={i} 
            onClick={() => onCategoryClick?.(cat.name)}
            className="relative rounded-2xl overflow-hidden aspect-[4/3] group cursor-pointer border border-gray-100"
          >
            <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className={`absolute inset-0 bg-gradient-to-t ${cat.bg} via-black/20 to-transparent group-hover:bg-black/40 transition-colors`}></div>
            <h3 className="absolute bottom-5 left-5 text-white font-black italic text-4xl tracking-tighter uppercase">
              {cat.displayName}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GopuffShopCategoriesGrid;
