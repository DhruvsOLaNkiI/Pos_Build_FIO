import { useState } from 'react';
import { Search, SlidersHorizontal, Flame, CreditCard, Leaf, ChevronDown, X, Check } from 'lucide-react';

const FilterBar = ({ categories = [], brands = [], activeFilters = {}, onFilterChange }) => {
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const { category, brand, inStock, sort } = activeFilters;

    const closeAll = () => {
        setShowCategoryDropdown(false);
        setShowBrandDropdown(false);
        setShowSortDropdown(false);
    };

    const handleCategorySelect = (cat) => {
        closeAll();
        onFilterChange({ ...activeFilters, category: cat === category ? '' : cat });
    };

    const handleBrandSelect = (b) => {
        closeAll();
        onFilterChange({ ...activeFilters, brand: b === brand ? '' : b });
    };

    const handleInStockToggle = () => {
        onFilterChange({ ...activeFilters, inStock: !inStock });
    };

    const handleSortChange = (s) => {
        closeAll();
        onFilterChange({ ...activeFilters, sort: s === sort ? '' : s });
    };

    const clearFilters = () => {
        onFilterChange({ category: '', brand: '', inStock: false, sort: '' });
    };

    const hasActiveFilters = category || brand || inStock || sort;

    return (
        <div className="w-full bg-gray-50/80 backdrop-blur-sm py-4 border-b border-gray-200 sticky top-[138px] z-40 overflow-visible">
            <div className="max-w-[1440px] mx-auto px-4 flex gap-3 overflow-x-auto hide-scrollbar relative">
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
                        onClick={() => { closeAll(); setShowSortDropdown(!showSortDropdown); }}
                        className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-black transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter ${sort ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Sort: {sort || 'Default'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                    </button>
                    {showSortDropdown && (
                        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
                            {['Price: Low to High', 'Price: High to Low', 'Name: A-Z', 'Name: Z-A', 'Newest'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleSortChange(s)}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${sort === s ? 'text-blue-600' : 'text-gray-700'}`}
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
                            onClick={() => { closeAll(); setShowCategoryDropdown(!showCategoryDropdown); }}
                            className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-black transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter ${category ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {category || 'Category'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                        </button>
                        {showCategoryDropdown && (
                            <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] max-h-[300px] overflow-y-auto z-50">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategorySelect(cat)}
                                        className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${category === cat ? 'text-blue-600' : 'text-gray-700'}`}
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
                            onClick={() => { closeAll(); setShowBrandDropdown(!showBrandDropdown); }}
                            className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-black transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter ${brand ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {brand || 'Brands'} <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />
                        </button>
                        {showBrandDropdown && (
                            <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] max-h-[300px] overflow-y-auto z-50">
                                {brands.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => handleBrandSelect(b)}
                                        className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${brand === b ? 'text-blue-600' : 'text-gray-700'}`}
                                    >
                                        {b} {brand === b && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* In Stock Toggle */}
                <button
                    onClick={handleInStockToggle}
                    className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-black transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter ${inStock ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    {inStock && <Check className="w-3.5 h-3.5" />}
                    In Stock
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
