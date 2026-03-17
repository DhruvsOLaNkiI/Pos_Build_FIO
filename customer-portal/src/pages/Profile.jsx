import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { LogOut, User, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Profile = () => {
    const { customer, logout } = useAuth();
    const { trackPageVisit } = useCustomerActivityTracking();
    const navigate = useNavigate();

    useEffect(() => {
        trackPageVisit('/profile');
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background p-4 animate-fade-in pb-24">
            <header className="mb-6 pt-2">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Profile
                </h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">
                    Manage your account
                </p>
            </header>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50 flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="font-bold text-xl leading-tight">{customer?.name || 'Guest User'}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{customer?.mobile}</p>
                    <div className="mt-2 text-xs font-mono bg-muted inline-block px-2 py-0.5 rounded text-muted-foreground border border-border">
                        ID: {customer?.customerId}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-sm font-medium">Orders</span>
                    </div>
                    <div className="text-2xl font-bold">{customer?.totalPurchases || 0}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">Spent</span>
                    </div>
                    <div className="text-xl font-bold">₹{(customer?.totalSpent || 0).toLocaleString()}</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border/50">
                    <span className="font-medium text-sm">Terms & Conditions</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-sm">Privacy Policy</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            <button
                onClick={handleLogout}
                className="w-full mt-6 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white h-14 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    );
};

export default Profile;
