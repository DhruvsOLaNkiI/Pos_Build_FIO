import { Link } from 'react-router-dom';

const categories = [
    { id: '1', name: 'SNAP EBT', icon: '💳' },
    { id: '2', name: 'Fresh Grocery', icon: '🥬' },
    { id: '3', name: 'Price Drops', icon: '↓' },
    { id: '4', name: 'Alcohol', icon: '🍺' },
    { id: '5', name: 'Smoke Shop', icon: '💨' },
    { id: '6', name: 'HSA FSA', icon: '🏥' },
    { id: '7', name: 'Wellness Shop', icon: '🧘' },
    { id: '8', name: 'Snacks', icon: '🥨' },
    { id: '9', name: 'Drinks', icon: '🥤' },
    { id: '10', name: 'Deals', icon: '🏷️' },
    { id: '11', name: 'Ice Cream', icon: '🍦' },
    { id: '12', name: 'Personal Care', icon: '🧴' },
];

const CategoryIconStrip = () => {
    return (
        <div className="w-full bg-white border-b border-border py-4 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2 relative">
                    {categories.map((cat) => (
                        <Link key={cat.id} to={`/category/${cat.id}`} className="flex flex-col items-center gap-3 flex-shrink-0 group min-w-[72px]">
                            {/* Icon Circle */}
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl shadow-sm border border-border group-hover:shadow-md transition-all group-hover:-translate-y-1 relative bg-gradient-to-br from-white to-gray-100">
                                {cat.name === 'Price Drops' && (
                                    <div className="absolute inset-0 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs leading-tight text-center p-2 transform -rotate-12 outline outline-2 outline-white">
                                        NEW LOW PRICING
                                    </div>
                                )}
                                {cat.name !== 'Price Drops' && <span>{cat.icon}</span>}
                            </div>
                            {/* Text Label */}
                            <span className="text-[11px] font-bold text-foreground text-center leading-tight">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryIconStrip;
