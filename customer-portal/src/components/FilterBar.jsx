import { Search, SlidersHorizontal, Flame, CreditCard, Leaf, ChevronDown } from 'lucide-react';

const FilterButton = ({ children, icon: Icon, hasDropdown }) => (
  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-black text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap uppercase tracking-tighter">
    {Icon && <Icon className="w-4 h-4 text-gray-400" />}
    {children}
    {hasDropdown && <ChevronDown className="w-3 h-3 ml-1 text-gray-400" strokeWidth={3} />}
  </button>
);

const FilterBar = () => (
  <div className="w-full bg-gray-50/80 backdrop-blur-sm py-4 border-b border-gray-200 sticky top-[138px] z-40 overflow-hidden">
    <div className="max-w-[1440px] mx-auto px-4 flex gap-3 overflow-x-auto hide-scrollbar">
      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
        <SlidersHorizontal className="w-4 h-4" />
        <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
      </button>
      <FilterButton icon={Flame}>Deals</FilterButton>
      <FilterButton hasDropdown>Sort By</FilterButton>
      <FilterButton icon={CreditCard}>SNAP EBT</FilterButton>
      <FilterButton icon={Leaf}>Organic</FilterButton>
      <FilterButton hasDropdown>Category</FilterButton>
      <FilterButton hasDropdown>Brands</FilterButton>
      <FilterButton>Show in Stock</FilterButton>
    </div>
  </div>
);

export default FilterBar;
