import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Warehouse,
    Users,
    UserCog,
    Truck,
    ClipboardList,
    BarChart3,
    Wallet,
    Bell,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Clock,
    PlusSquare,
    Scale,
    PackageSearch,
    AlertTriangle,
    Coffee,
    Building,
    Store,
    Sparkles,
    Globe,
    Activity,
    RefreshCcw,
    LayoutTemplate,
    Image,
    Monitor
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const navItems = [
    // Core Business
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['owner', 'cashier', 'staff'], category: 'Core', permission: 'dashboard' },
    { icon: ShoppingCart, label: 'Billing', path: '/billing', roles: ['owner', 'cashier', 'staff'], category: 'Core', permission: 'billing' },
    { icon: RefreshCcw, label: 'Returns & Exchange', path: '/returns', roles: ['owner', 'cashier'], category: 'Core', permission: 'billing' },
    { icon: Users, label: 'Customers', path: '/customers', roles: ['owner', 'cashier', 'staff'], category: 'Core', permission: 'customers' },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['owner'], category: 'Core', permission: 'reports' },
    { icon: Wallet, label: 'Expenses', path: '/expenses', roles: ['owner'], category: 'Core', permission: 'expenses' },

    // Inventory & Products
    { icon: Package, label: 'Products', path: '/products', roles: ['owner', 'cashier', 'staff'], category: 'Inventory', permission: 'products' },
    { icon: PlusSquare, label: 'Create Product', path: '/products/new', roles: ['owner', 'staff'], category: 'Inventory', permission: 'create_products' },
    { icon: Warehouse, label: 'Warehouse Inventory', path: '/inventory', roles: ['owner', 'cashier', 'staff'], category: 'Inventory', permission: 'warehouse_inventory' },
    { icon: AlertTriangle, label: 'Expire Product', path: '/expired-products', roles: ['owner', 'staff'], category: 'Inventory', permission: 'expired_products' },
    { icon: Scale, label: 'Units', path: '/units', roles: ['owner'], category: 'Inventory', permission: 'units' },
    { icon: Store, label: 'Stores', path: '/stores', roles: ['owner'], category: 'Inventory', permission: 'stores' },
    { icon: Building, label: 'Warehouses', path: '/warehouses', roles: ['owner'], category: 'Inventory', permission: 'warehouses' },

    // Operations & Supply
    { icon: Truck, label: 'Suppliers', path: '/suppliers', roles: ['owner'], category: 'Supply Chain', permission: 'suppliers' },
    { icon: ClipboardList, label: 'Purchases', path: '/purchases', roles: ['owner'], category: 'Supply Chain', permission: 'purchases' },
    { icon: PackageSearch, label: 'Order Tracking', path: '/order-tracking', roles: ['owner'], category: 'Supply Chain', permission: 'order_tracking' },

    // Management
    { icon: Monitor, label: 'Registers (POS)', path: '/registers', roles: ['owner', 'staff'], category: 'Management', permission: 'settings' },
    { icon: UserCog, label: 'People', path: '/employees', roles: ['owner', 'cashier', 'staff'], category: 'Management', permission: 'employees' },
    { icon: Sparkles, label: 'Loyalty & Offers', path: '/loyalty', roles: ['owner'], category: 'Management', permission: 'loyalty' },
    { icon: Globe, label: 'Online Orders', path: '/online-orders', roles: ['owner', 'cashier'], category: 'Management', permission: 'online_orders' },
    { icon: Bell, label: 'Alerts', path: '/alerts', roles: ['owner', 'staff'], category: 'Management', permission: 'alerts' },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['owner'], category: 'Management', permission: 'settings' },
];

const superAdminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin/dashboard', roles: ['super-admin'], category: 'Super Admin' },
    { icon: Globe, label: 'Companies', path: '/super-admin/companies', roles: ['super-admin'], category: 'Super Admin' },
    { icon: LayoutTemplate, label: 'Portal Design', path: '/super-admin/portal-design', roles: ['super-admin'], category: 'Super Admin' },
    { icon: Image, label: 'Banners', path: '/super-admin/banners', roles: ['super-admin'], category: 'Super Admin' },
    { icon: Activity, label: 'API Monitoring', path: '/super-admin/api-monitoring', roles: ['super-admin'], category: 'Super Admin' },
    { icon: Users, label: 'User Activity', path: '/super-admin/user-activity', roles: ['super-admin'], category: 'Super Admin' },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout, activeStore, switchStore, allStores } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [clockLoading, setClockLoading] = useState(false);
    const [clockedIn, setClockedIn] = useState(false);
    const [onBreak, setOnBreak] = useState(false);
    const [breakLoading, setBreakLoading] = useState(false);
    const [breakStartTime, setBreakStartTime] = useState(null);
    const [breakDuration, setBreakDuration] = useState('00:00');

    const isSuperAdmin = user?.role === 'super-admin';

    // Check if user has access to a nav item (role-based OR permission-based)
    const hasAccess = (item) => {
        if (!item) return false;
        // Owner and super-admin have full access
        if (user?.role === 'owner' || user?.role === 'super-admin') return true;

        // For staff/cashier, explicit permissions array is the source of truth
        if (user?.role === 'cashier' || user?.role === 'staff') {
            if (item.permission) {
                if (Array.isArray(user?.permissions)) {
                    return user.permissions.includes(item.permission);
                }
                // Fallback for legacy users without initialized permissions
                return item.roles.includes(user?.role);
            }
            return item.roles.includes(user?.role);
        }

        return item.roles.includes(user?.role);
    };

    const filteredNavItems = isSuperAdmin
        ? superAdminNavItems
        : navItems.filter(item => hasAccess(item));

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const checkStatus = async () => {
        if (!user || user.role === 'owner') return;
        try {
            // Build local start-of-day and end-of-day ISO strings to avoid UTC mismatch
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            const { data } = await API.get(
                `/attendance?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
            );

            if (data.data && data.data.length > 0) {
                const todayRecord = data.data[0];
                if (!todayRecord.clockOut) {
                    setClockedIn(true);
                } else {
                    setClockedIn(false);
                }

                if (todayRecord.breaks && todayRecord.breaks.length > 0) {
                    const lastBreak = todayRecord.breaks[todayRecord.breaks.length - 1];
                    if (!lastBreak.endTime) {
                        setOnBreak(true);
                        setBreakStartTime(new Date(lastBreak.startTime));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch attendance status', error);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    // Live Break Timer
    useEffect(() => {
        let interval;
        if (onBreak && breakStartTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diffMs = now - breakStartTime;

                const totalSeconds = Math.floor(diffMs / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                const hrsStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
                const minStr = minutes.toString().padStart(2, '0');
                const secStr = seconds.toString().padStart(2, '0');

                setBreakDuration(`${hrsStr}${minStr}:${secStr}`);
            }, 1000);
        } else {
            setBreakDuration('00:00');
        }

        return () => clearInterval(interval);
    }, [onBreak, breakStartTime]);

    const handleClockAction = async () => {
        try {
            setClockLoading(true);
            const endpoint = clockedIn ? '/attendance/clock-out' : '/attendance/clock-in';
            await API.post(endpoint);
            setClockedIn(!clockedIn);
            if (clockedIn) setOnBreak(false); // Reset break if clocking out
            toast({
                title: !clockedIn ? 'Clocked In' : 'Clocked Out',
                description: `Successfully clocked ${!clockedIn ? 'in' : 'out'} at ${new Date().toLocaleTimeString()}`
            });
        } catch (error) {
            const errMsg = error.response?.data?.message || '';
            // If backend says "Already clocked in", sync the UI to reflect that
            if (!clockedIn && errMsg.toLowerCase().includes('already clocked in')) {
                setClockedIn(true);
                toast({ title: 'Already Clocked In', description: 'Your shift is already active today.' });
            } else if (clockedIn && errMsg.toLowerCase().includes('already clocked out')) {
                setClockedIn(false);
                setOnBreak(false);
                toast({ title: 'Already Clocked Out', description: 'Your shift already ended today.' });
            } else {
                toast({
                    title: 'Error',
                    description: errMsg || 'Action failed',
                    variant: 'destructive'
                });
            }
        } finally {
            setClockLoading(false);
        }
    };

    const handleBreakAction = async () => {
        try {
            setBreakLoading(true);
            const endpoint = onBreak ? '/attendance/break-end' : '/attendance/break-start';
            const { data } = await API.post(endpoint, { note: 'Lunch / Tea Break' });
            setOnBreak(!onBreak);

            if (!onBreak && data.data) {
                // If we just started a break, capture the exact start time from DB response
                const latestBreak = data.data.breaks[data.data.breaks.length - 1];
                setBreakStartTime(new Date(latestBreak.startTime));
            } else {
                setBreakStartTime(null);
            }

            toast({
                title: !onBreak ? 'Break Started' : 'Break Ended',
                description: `Successfully ${!onBreak ? 'started' : 'ended'} break at ${new Date().toLocaleTimeString()}`
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Break action failed',
                variant: 'destructive'
            });
        } finally {
            setBreakLoading(false);
        }
    };

    return (
        <aside
            className={`${collapsed ? 'w-[72px]' : 'w-64'
                } h-screen bg-sidebar border-r border-border flex flex-col transition-all duration-300 ease-in-out shrink-0`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">POS System</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Store Switcher — shown for owners (all stores) or staff (multiple accessible stores) */}
            {!collapsed && (
                (() => {
                    const rawStoreList = user?.role === 'owner'
                        ? allStores
                        : (user?.accessibleStores || []);

                    // If staff/cashier, only show switcher if they have more than 1 store
                    if (user?.role !== 'owner' && rawStoreList.length <= 1) return null;
                    if (rawStoreList.length === 0) return null;

                    // Ensure we have full store objects even if backend sent IDs
                    const storeList = rawStoreList.map(s => {
                        if (typeof s === 'string') {
                            return allStores.find(store => store._id === s) || { _id: s, name: 'Store' };
                        }
                        return s;
                    });

                    return (
                        <div className="px-4 py-3 border-b border-border bg-muted/20">
                            <Select value={activeStore || ''} onValueChange={(val) => switchStore(val)}>
                                <SelectTrigger className="w-full bg-white text-slate-900 border-border h-8 text-xs font-semibold focus:ring-1 focus:ring-primary">
                                    <SelectValue placeholder="Select Store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {storeList.map((store) => (
                                        <SelectItem key={store._id} value={store._id} className="text-xs">
                                            {store.name}
                                            {store.isDefault && <span className="ml-1 text-[10px] text-muted-foreground">(Default)</span>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    );
                })()
            )}

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                {Object.entries(
                    filteredNavItems.reduce((acc, item) => {
                        const category = item.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(item);
                        return acc;
                    }, {})
                ).map(([category, items]) => (
                    <div key={category} className="space-y-1">
                        {!collapsed && (
                            <h4 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                                {category}
                            </h4>
                        )}
                        {items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                        ? 'bg-white text-[#1f3329] font-bold shadow-sm'
                                        : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* User Info & Clock In/Break */}
            <div className="border-t border-border p-3 space-y-2">
                {!collapsed && user && user.role !== 'owner' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button
                                variant={clockedIn ? "destructive" : "default"}
                                size="sm"
                                className="flex-1 gap-1"
                                onClick={handleClockAction}
                                disabled={clockLoading || onBreak}
                            >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[11px] font-bold">{clockLoading ? 'Wait..' : clockedIn ? 'Clock Out' : 'Clock In'}</span>
                            </Button>
                            {clockedIn && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`flex-1 gap-1 border-amber-200 transition-all ${onBreak ? 'bg-amber-100 text-amber-700 animate-pulse hover:bg-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                    onClick={handleBreakAction}
                                    disabled={breakLoading}
                                >
                                    <Coffee className="w-3.5 h-3.5 shrink-0" />
                                    <span className="text-[11px] font-bold">
                                        {breakLoading ? 'Wait..' : onBreak ? `${breakDuration} • Resume` : 'Take Break'}
                                    </span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {collapsed && user && user.role !== 'owner' && (
                    <div className="flex flex-col gap-2">
                        <Button
                            variant={clockedIn ? "destructive" : "default"}
                            size="icon"
                            className="w-full h-9"
                            onClick={handleClockAction}
                            disabled={clockLoading || onBreak}
                            title={clockedIn ? 'Clock Out' : 'Clock In'}
                        >
                            <Clock className="w-4 h-4" />
                        </Button>
                        {clockedIn && (
                            <Button
                                variant="outline"
                                size="icon"
                                className={`w-full h-9 border-amber-200 transition-all ${onBreak ? 'bg-amber-100 text-amber-700 animate-pulse hover:bg-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                onClick={handleBreakAction}
                                disabled={breakLoading}
                                title={onBreak ? `On Break (${breakDuration}) - Click to Resume` : 'Take Break'}
                            >
                                <Coffee className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}

                <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
                    {!collapsed && (
                        <div className="flex-1 min-w-0 pr-1">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
