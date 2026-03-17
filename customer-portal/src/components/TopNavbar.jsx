import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, UserCircle, ShoppingBag, Menu } from 'lucide-react';

const TopNavbar = () => {
    const { customer } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
                
                {/* Mobile Menu Toggle (hidden on desktop) */}
                <button className="lg:hidden text-foreground">
                    <Menu className="w-6 h-6" />
                </button>

                {/* Logo Area */}
                <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                    <div className="bg-primary text-white font-black text-xl italic px-3 py-1 rounded-md tracking-tighter">
                        gopuff
                    </div>
                </Link>

                {/* Search Bar - Prominent in middle */}
                <div className="flex-1 max-w-3xl hidden md:block">
                    <div className="relative flex items-center w-full">
                        <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search Gopuff..." 
                            className="w-full h-11 pl-12 pr-4 bg-white border-2 border-border rounded-full text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:font-normal placeholder:text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                    {/* Mobile Search Icon */}
                    <button className="md:hidden p-2 text-foreground">
                        <Search className="w-6 h-6" />
                    </button>

                    <Link to="/profile" className="hidden sm:flex items-center gap-2 hover:bg-muted px-4 py-2 rounded-full transition-colors border border-transparent hover:border-border">
                        <UserCircle className="w-5 h-5 text-foreground" />
                        <span className="text-sm font-bold tracking-tight">
                            {customer ? (customer.name || 'Account') : 'SIGN IN'}
                        </span>
                    </Link>

                    <Link to="/cart" className="flex items-center gap-2 bg-white hover:bg-muted border-2 border-border px-4 py-2 rounded-full transition-colors">
                        <ShoppingBag className="w-5 h-5 text-foreground" />
                        <span className="text-sm font-bold">0</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
