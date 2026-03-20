import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DollarSign,
    ShoppingBag,
    Users,
    Building2,
    CalendarDays,
    Settings,
    Warehouse,
    Store,
    Globe,
    Monitor,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis,
    Legend
} from 'recharts';

const RANGE_OPTIONS = [
    { key: '1d', label: '1D' },
    { key: '7d', label: '1W' },
    { key: '30d', label: '1M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1Y' },
];

const SOURCE_OPTIONS = [
    { key: 'all', label: 'All Sales', icon: DollarSign },
    { key: 'instore', label: 'In-Store', icon: Monitor },
    { key: 'online', label: 'Online', icon: Globe },
];

const COLORS = ['#F97316', '#1E3A8A', '#0EA5E9', '#8B5CF6']; // Orange, Dark Blue, Light Blue, Purple
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = ['12 Am', '2 Am', '4 Am', '6 Am', '8 Am', '10 Am', '12 Pm', '2 Pm', '4 Pm', '6 Pm', '8 Pm', '10 Pm'];

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todaySales: 0,
        todayPurchases: 0,
        todayOrders: 0,
        lowStockCount: 0,
        totalProducts: 0,
        avgDailySales: 0,
        salesAndPurchaseTrend: [],
        topProducts: [],
        topCategories: [],
        orderStats: [],
        overall: { suppliers: 0, customers: 0, orders: 0 },
        customerOverview: { firstTime: 0, returning: 0, firstTimePercent: 0, returningPercent: 0 },
        periodLabel: '1M'
    });
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30d');
    const [source, setSource] = useState('all');

    const [inventoryStock, setInventoryStock] = useState([]);
    const [shopStock, setShopStock] = useState([]);

    const fetchStats = async (selectedRange, selectedSource) => {
        try {
            setLoading(true);
            const { data } = await API.get(`/dashboard?range=${selectedRange}&source=${selectedSource}`);
            setStats(data.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStockData = async () => {
        try {
            const [invRes, shopRes] = await Promise.all([
                API.get('/inventory'),
                API.get('/products'),
            ]);
            if (invRes.data?.data) setInventoryStock(invRes.data.data.sort((a, b) => b.stockQty - a.stockQty).slice(0, 8));
            if (shopRes.data?.data) setShopStock(shopRes.data.data.sort((a, b) => b.stockQty - a.stockQty).slice(0, 8));
        } catch (error) {
            console.error('Failed to fetch stock data', error);
        }
    };

    useEffect(() => {
        fetchStats(range, source);
        fetchStockData();
    }, [range, source]);

    // Custom Heatmap Data formatting
    const HEATMAP_Y_LABELS = ['6 PM', '4 PM', '2 PM', '12 PM', '10 AM', '8 AM', '6 AM', '4 AM', '2 AM'];
    const HEATMAP_X_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmapGrid = Array(7).fill(null).map(() => Array(9).fill(0));
    let maxOrderCount = 0;

    if (stats.orderStats && stats.orderStats.length > 0) {
        stats.orderStats.forEach(stat => {
            const d = stat._id.day; // 1=Sun...7=Sat
            const h = stat._id.hour; // 0..23

            // Map day to col: Mon=0, Sun=6
            const col = d === 1 ? 6 : d - 2;

            // map hour to row
            let row;
            if (h >= 18) row = 0;
            else if (h >= 16) row = 1;
            else if (h >= 14) row = 2;
            else if (h >= 12) row = 3;
            else if (h >= 10) row = 4;
            else if (h >= 8) row = 5;
            else if (h >= 6) row = 6;
            else if (h >= 4) row = 7;
            else row = 8;

            heatmapGrid[col][row] += stat.count;
            if (heatmapGrid[col][row] > maxOrderCount) maxOrderCount = heatmapGrid[col][row];
        });
    }

    const getCubeStyle = (val, max) => {
        if (val === 0) return { background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.3)' };
        const ratio = val / (max || 1);
        if (ratio <= 0.25) return { background: 'rgba(251, 191, 36, 0.35)', border: '1px solid rgba(251, 191, 36, 0.15)' };    // amber glow
        if (ratio <= 0.5) return { background: 'rgba(251, 146, 60, 0.55)', border: '1px solid rgba(251, 146, 60, 0.2)' };      // orange
        if (ratio <= 0.75) return { background: 'rgba(249, 115, 22, 0.75)', border: '1px solid rgba(249, 115, 22, 0.25)' };     // deeper orange
        return { background: 'rgba(234, 88, 12, 0.9)', border: '1px solid rgba(234, 88, 12, 0.3)', boxShadow: '0 0 8px rgba(234, 88, 12, 0.3)' }; // hot orange glow
    };

    if (loading && stats.salesAndPurchaseTrend.length === 0) {
        return <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-[calc(100vh-100px)]">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header / Stat Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-muted-foreground">Today's Revenue</CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500"><DollarSign className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600">₹{stats.todaySales.toLocaleString()}</div>
                        <p className="text-xs font-semibold text-emerald-500/80 mt-1">{stats.todayOrders} Orders Today</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-muted-foreground">Total Products</CardTitle>
                        <div className="p-2 bg-orange-500/10 rounded-full text-orange-500"><ShoppingBag className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.totalProducts}</div>
                        <p className="text-xs font-semibold text-orange-500 mt-1">{stats.lowStockCount} Low Stock Alerts</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-muted-foreground">Avg Daily Sales</CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-full text-purple-500"><DollarSign className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">₹{stats.avgDailySales.toFixed(0)}</div>
                        <p className="text-xs font-semibold text-purple-500/80 mt-1">{stats.periodLabel} Average</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Grid: Sales Chart */}
            <div className="grid grid-cols-1 gap-6">

                {/* Sales Bar Chart */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-md text-primary"><ShoppingBag className="w-4 h-4" /></div>
                                <CardTitle className="text-lg font-bold">Sales Overview</CardTitle>
                            </div>

                            {/* Source Filter */}
                            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                {SOURCE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setSource(opt.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${source === opt.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <opt.icon className="w-3.5 h-3.5" />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Time Range Toggle */}
                            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                {RANGE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setRange(opt.key)}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${range === opt.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4 pt-2">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    <div className="w-2 h-2 rounded-full bg-[#E8DCCA]"></div> Total Sales
                                </div>
                                <div className="text-2xl font-black">₹{stats.totalSalesInPeriod >= 1000 ? (stats.totalSalesInPeriod / 1000).toFixed(1) + 'K' : stats.totalSalesInPeriod.toFixed(0)}</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.salesAndPurchaseTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                                        tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                                    />
                                    <Bar dataKey="sales" name="sales" fill="#E8DCCA" radius={[4, 4, 0, 0]} barSize={range === '30d' ? 16 : 36} />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} iconType="circle" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Grid: Top Categories & Order Statistics Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">

                {/* Top Categories Pie Chart */}
                <Card className="xl:col-span-2 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between pb-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-500/10 rounded-md text-orange-600"><ShoppingBag className="w-4 h-4" /></div>
                            <CardTitle className="text-lg font-bold">Top Categories</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold"><CalendarDays className="w-3 h-3 mr-2" /> {stats.periodLabel}</Button>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                        <div className="w-[300px] h-[300px]">
                            {stats.topCategories.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.topCategories}
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="count"
                                            stroke="none"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = outerRadius * 1.25;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                return (
                                                    <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={600}>
                                                        {stats.topCategories[index].name} ({value})
                                                    </text>
                                                );
                                            }}
                                            labelLine={false}
                                        >
                                            {stats.topCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value, name, props) => [`${value} Products`, props.payload.name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center border-4 border-muted rounded-full">
                                    <span className="text-xs text-muted-foreground font-semibold">No Data</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Statistics Heatmap */}
                <Card className="xl:col-span-3 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-500/10 rounded-md text-purple-600"><CalendarDays className="w-4 h-4" /></div>
                            <CardTitle className="text-lg font-bold">Order Statistics</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold"><Settings className="w-3 h-3 mr-2" /> {stats.periodLabel}</Button>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        {/* Heatmap Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gridTemplateRows: `repeat(9, 1fr) auto`, gap: '6px', height: '320px' }}>
                            {HEATMAP_Y_LABELS.map((lbl, rowIndex) => (
                                <>
                                    {/* Y-axis label */}
                                    <div key={`y-${rowIndex}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px', fontSize: '11px', fontWeight: 600, opacity: 0.5 }}>
                                        {lbl}
                                    </div>
                                    {/* Cells for this row */}
                                    {HEATMAP_X_LABELS.map((_, colIndex) => {
                                        const val = heatmapGrid[colIndex][rowIndex];
                                        const cellStyle = getCubeStyle(val, maxOrderCount);
                                        return (
                                            <div
                                                key={`${colIndex}-${rowIndex}`}
                                                title={val > 0 ? `${val} order${val > 1 ? 's' : ''} · ${HEATMAP_X_LABELS[colIndex]} ${HEATMAP_Y_LABELS[rowIndex]}` : `No orders · ${HEATMAP_X_LABELS[colIndex]} ${HEATMAP_Y_LABELS[rowIndex]}`}
                                                style={{
                                                    ...cellStyle,
                                                    borderRadius: '8px',
                                                    transition: 'all 0.2s ease',
                                                    cursor: val > 0 ? 'pointer' : 'default',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    color: val > 0 ? 'rgba(255,255,255,0.9)' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => { if (val > 0) e.currentTarget.style.transform = 'scale(1.08)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                            >
                                                {val > 0 ? val : ''}
                                            </div>
                                        );
                                    })}
                                </>
                            ))}
                            {/* X-axis labels */}
                            <div /> {/* empty cell for y-axis column */}
                            {HEATMAP_X_LABELS.map((lbl, i) => (
                                <div key={`x-${i}`} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, opacity: 0.5, paddingTop: '4px' }}>
                                    {lbl}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.5 }}>Less</span>
                            {[
                                'hsl(var(--muted) / 0.4)',
                                'rgba(251, 191, 36, 0.35)',
                                'rgba(251, 146, 60, 0.55)',
                                'rgba(249, 115, 22, 0.75)',
                                'rgba(234, 88, 12, 0.9)',
                            ].map((bg, i) => (
                                <div key={i} style={{ width: '14px', height: '14px', borderRadius: '4px', background: bg }} />
                            ))}
                            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.5 }}>More</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Selling Products List */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-rose-500/10 rounded-md text-rose-600"><ShoppingBag className="w-4 h-4" /></div>
                        <CardTitle className="text-lg font-bold">Top Selling Products ({stats.periodLabel})</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {stats.topProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stats.topProducts.map((p, i) => {
                                const maxQty = stats.topProducts[0]?.qty || 1;
                                const barWidth = Math.max((p.qty / maxQty) * 100, 8);
                                return (
                                    <div key={i} className="flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center auto-cols-min gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-sm font-black shadow-sm ${i === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                    i === 1 ? 'bg-gray-300 text-gray-800' :
                                                        i === 2 ? 'bg-amber-600 text-amber-100' :
                                                            'bg-primary/20 text-primary'
                                                    }`}>
                                                    #{i + 1}
                                                </div>
                                                <span className="font-bold text-base truncate pr-2">{p.name}</span>
                                            </div>
                                            <span className="font-black text-lg bg-background px-3 py-1 rounded-lg shadow-sm border border-border whitespace-nowrap">{p.qty}</span>
                                        </div>
                                        <div className="mt-2 h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-500' : 'bg-primary'
                                                    }`}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</span>
                                            <span className="text-sm font-bold text-primary">₹{p.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground font-semibold py-8 border-2 border-dashed border-border rounded-xl">No sales data found for {stats.periodLabel}</div>
                    )}
                </CardContent>
            </Card>

            {/* Inventory Stock & Shop Stock Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory (Warehouse) Stock */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-500"><Warehouse className="w-4 h-4" /></div>
                            <CardTitle className="text-lg font-bold">Inventory Stock</CardTitle>
                            <span className="ml-auto text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full font-bold">Warehouse</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left p-3 font-semibold text-muted-foreground">Product</th>
                                    <th className="text-center p-3 font-semibold text-muted-foreground">Stock</th>
                                    <th className="text-right p-3 font-semibold text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryStock.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center text-muted-foreground py-8">No inventory data</td></tr>
                                ) : (
                                    inventoryStock.map((item, i) => (
                                        <tr key={item._id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-medium">{item.name}</td>
                                            <td className="p-3 text-center font-bold">{item.stockQty}</td>
                                            <td className="p-3 text-right">
                                                {item.stockQty <= (item.minStockLevel || 10) ? (
                                                    <span className="text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded">Low</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded">In Stock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Shop Stock */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-500"><Store className="w-4 h-4" /></div>
                            <CardTitle className="text-lg font-bold">Shop Stock</CardTitle>
                            <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">Retail</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left p-3 font-semibold text-muted-foreground">Product</th>
                                    <th className="text-center p-3 font-semibold text-muted-foreground">Stock</th>
                                    <th className="text-center p-3 font-semibold text-muted-foreground">Category</th>
                                    <th className="text-right p-3 font-semibold text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shopStock.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center text-muted-foreground py-8">No shop data</td></tr>
                                ) : (
                                    shopStock.map((item, i) => (
                                        <tr key={item._id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-medium">
                                                {item.name}
                                                {item.variant && <span className="ml-1 text-[10px] font-bold px-1 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20">{item.variant}</span>}
                                            </td>
                                            <td className="p-3 text-center font-bold">{item.stockQty}</td>
                                            <td className="p-3 text-center">
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded border border-border">{item.category || '-'}</span>
                                            </td>
                                            <td className="p-3 text-right">
                                                {item.stockQty <= (item.minStockLevel || 10) ? (
                                                    <span className="text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded">Low</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded">In Stock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
