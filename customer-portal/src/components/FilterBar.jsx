import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

const FilterBar = ({ categories = [], brands = [], activeFilters = {}, onFilterChange }) => {
    const [openDropdown, setOpenDropdown] = useState(null); // 'sort' | 'category' | 'brand' | null
    const barRef = useRef(null);

    const { category, brand, inStock, sort, priceRange } = activeFilters;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (barRef.current && !barRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggleDropdown = (name) => {
        setOpenDropdown(prev => prev === name ? null : name);
    };

    const handleCategorySelect = (cat) => {
        setOpenDropdown(null);
        onFilterChange({ ...activeFilters, category: cat === category ? '' : cat });
    };

    const handleBrandSelect = (b) => {
        setOpenDropdown(null);
        onFilterChange({ ...activeFilters, brand: b === brand ? '' : b });
    };

    const handleInStockToggle = () => {
        onFilterChange({ ...activeFilters, inStock: !inStock });
    };

    const handleSortChange = (s) => {
        setOpenDropdown(null);
        onFilterChange({ ...activeFilters, sort: s === sort ? '' : s });
    };

    const handlePriceSelect = (range) => {
        setOpenDropdown(null);
        onFilterChange({ ...activeFilters, priceRange: range === priceRange ? '' : range });
    };

    const clearFilters = () => {
        onFilterChange({ category: '', brand: '', inStock: false, sort: '', priceRange: '' });
    };

    const hasActiveFilters = category || brand || inStock || sort || priceRange;

    const PRICE_RANGES = [
        { label: 'Under ₹100', min: 0, max: 100 },
        { label: '₹100 - ₹500', min: 100, max: 500 },
        { label: '₹500 - ₹1000', min: 500, max: 1000 },
        { label: 'Above ₹1000', min: 1000, max: Infinity },
    ];

    const btnBase = "flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-black transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter";
    const btnInactive = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
    const btnActive = "bg-blue-50 border-blue-300 text-blue-700";

    return (
        <div ref={barRef} className="w-full bg-gray-50/80 backdrop-blur-sm py-4 border-b border-gray-200 sticky top-[138px] z-50">
            <div className="max-w-[1440px] mx-auto px-4 flex items-center gap-3 overflow-visible">
                {/* Clear All */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-200 rounded-full text-xs font-black text-red-600 hover:bg-red-100 transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter"
                    >
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>
                )}

                {/* Sort By */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('sort')}
                        className={`${btnBase} ${sort ? btnActive : btnInactive}`}
                    >
                        Sort: {sort || 'Default'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                    </button>
                    {openDropdown === 'sort' && (
                        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px] z-[999]">
                            {['Price: Low to High', 'Price: High to Low', 'Name: A-Z', 'Name: Z-A', 'Newest'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleSortChange(s)}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${sort === s ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                >
                                    {s} {sort === s && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('category')}
                            className={`${btnBase} ${category ? btnActive : btnInactive}`}
                        >
                            {category || 'Category'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                        </button>
                        {openDropdown === 'category' && (
                            <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px] max-h-[300px] overflow-y-auto z-[999]">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategorySelect(cat)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${category === cat ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                    >
                                        {cat} {category === cat && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Brand Filter */}
                {brands.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('brand')}
                            className={`${btnBase} ${brand ? btnActive : btnInactive}`}
                        >
                            {brand || 'Brands'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                        </button>
                        {openDropdown === 'brand' && (
                            <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px] max-h-[300px] overflow-y-auto z-[999]">
                                {brands.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => handleBrandSelect(b)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${brand === b ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                    >
                                        {b} {brand === b && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* In Stock Toggle */}

                {/* Price Filter */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('price')}
                        className={`${btnBase} ${priceRange ? btnActive : btnInactive}`}
                    >
                        {priceRange || 'Price'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                    </button>
                    {openDropdown === 'price' && (
                        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] z-[999]">
                            {PRICE_RANGES.map(r => (
                                <button
                                    key={r.label}
                                    onClick={() => handlePriceSelect(r.label)}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${priceRange === r.label ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                >
                                    {r.label} {priceRange === r.label && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleInStockToggle}
                    className={`${btnBase} ${inStock ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : btnInactive}`}
                >
                    {inStock && <Check className="w-3.5 h-3.5" />}
                    In Stock
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
