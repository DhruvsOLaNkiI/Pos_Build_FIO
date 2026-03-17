import { NavLink } from 'react-router-dom';
import { Home, Sparkles, User, Gift } from 'lucide-react';
import clsx from 'clsx';

const BottomNav = () => {
    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Gift, label: 'Offers', path: '/offers' },
        { icon: Sparkles, label: 'My Points', path: '/loyalty' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe md:hidden">
            <div className="flex justify-around items-center h-16 w-full px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                            isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={clsx(
                                    "p-1.5 rounded-full transition-all duration-300",
                                    isActive ? "bg-primary/10" : "bg-transparent"
                                )}>
                                    <item.icon className={clsx("w-5 h-5", isActive && "animate-pulse")} />
                                </div>
                                <span className="text-[10px] tracking-wide">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
