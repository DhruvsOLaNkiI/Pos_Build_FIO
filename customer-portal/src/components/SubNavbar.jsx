import { ChevronDown, MapPin } from 'lucide-react';

const SubNavbar = () => {
    return (
        <div className="bg-white border-b border-border z-40 relative hidden md:block">
            <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-sm font-bold text-foreground">
                
                {/* Left Side Links */}
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        Shop Categories
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        Deals
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Delivery Info - Right Side */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Arrives In</span>
                        <span className="text-primary font-black italic">17 MINS</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>1230 CAROLINE ST NE</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SubNavbar;
