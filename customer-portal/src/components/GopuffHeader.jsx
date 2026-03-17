import { Search, User, ShoppingBag, ChevronDown, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

const GopuffHeader = ({ onViewHome, onViewAccount }) => {
    const { customer } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
            <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between gap-6">
                <button onClick={onViewHome} className="text-blue-600 font-extrabold italic text-4xl tracking-tighter shrink-0">
                    Click<span className="text-black">mE</span>
                </button>

                <div className="flex-1 max-w-2xl relative hidden md:block">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Gopuff..."
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-2 border-transparent rounded-full font-bold text-sm focus:bg-white focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 placeholder:font-bold italic"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Link to="/loyalty" className="hidden sm:flex items-center gap-1.5 bg-yellow-400/10 text-yellow-700 px-3 py-2 rounded-full font-black text-[11px] border border-yellow-200 hover:bg-yellow-400/20 transition-colors uppercase tracking-tight">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        {customer?.loyaltyPoints || 0} POINTS
                    </Link>

                    <button onClick={onViewAccount} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-full font-black text-xs transition-colors tracking-tight uppercase">
                        <User className="h-5 w-5" />
                        <span className="hidden lg:inline">{customer?.name?.split(' ')[0] || 'SIGN IN'}</span>
                    </button>

                    <Link to="/cart" className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-full font-black text-xs hover:bg-gray-800 transition-colors tracking-tight uppercase">
                        <ShoppingBag className="h-5 w-5" />
                        {totalItems}
                    </Link>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center justify-between text-[11px] font-black tracking-widest uppercase border-t border-gray-100 italic">
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        Shop Categories <ChevronDown className="h-3 w-3" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        Deals <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-900">ARRIVES IN <span className="text-blue-600">23 MINS</span></span>
                    <span className="text-gray-200 mx-1">•</span>
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        1230 CAROLINE ST NE <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default GopuffHeader;
