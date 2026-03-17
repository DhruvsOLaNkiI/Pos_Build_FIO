import { useState, useEffect } from 'react';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    Package,
    Clock,
    XCircle,
    CreditCard,
    Users,
    Loader2,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from 'lucide-react';

const Alerts = () => {
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({
        lowStock: true,
        expiringSoon: true,
        expired: false,
        pendingPayments: false,
        creditAlerts: false,
    });

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await API.get('/alerts');
            setAlerts(res.data.data);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const toggleSection = (key) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <div className="animate-fade-in flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!alerts) {
        return (
            <div className="animate-fade-in text-center py-20 text-muted-foreground">
                Failed to load alerts
            </div>
        );
    }

    const { summary } = alerts;

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
                    <p className="text-muted-foreground mt-1">Monitor stock levels, expiry dates, and payments</p>
                </div>
                <Button variant="outline" onClick={fetchAlerts}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <SummaryCard
                    title="Low Stock"
                    count={summary.lowStock}
                    icon={Package}
                    color={summary.lowStock > 0 ? 'text-red-400' : 'text-green-400'}
                    bgColor={summary.lowStock > 0 ? 'bg-red-900/20' : 'bg-green-900/20'}
                />
                <SummaryCard
                    title="Expiring Soon"
                    count={summary.expiringSoon}
                    icon={Clock}
                    color={summary.expiringSoon > 0 ? 'text-yellow-400' : 'text-green-400'}
                    bgColor={summary.expiringSoon > 0 ? 'bg-yellow-900/20' : 'bg-green-900/20'}
                />
                <SummaryCard
                    title="Expired"
                    count={summary.expired}
                    icon={XCircle}
                    color={summary.expired > 0 ? 'text-red-400' : 'text-green-400'}
                    bgColor={summary.expired > 0 ? 'bg-red-900/20' : 'bg-green-900/20'}
                />
                <SummaryCard
                    title="Pending Payments"
                    count={summary.pendingPayments}
                    icon={CreditCard}
                    color={summary.pendingPayments > 0 ? 'text-orange-400' : 'text-green-400'}
                    bgColor={summary.pendingPayments > 0 ? 'bg-orange-900/20' : 'bg-green-900/20'}
                />
                <SummaryCard
                    title="Credit Due"
                    count={summary.creditAlerts}
                    icon={Users}
                    color={summary.creditAlerts > 0 ? 'text-purple-400' : 'text-green-400'}
                    bgColor={summary.creditAlerts > 0 ? 'bg-purple-900/20' : 'bg-green-900/20'}
                />
            </div>

            {/* Low Stock Section */}
            <AlertSection
                title="Low Stock Products"
                icon={Package}
                count={summary.lowStock}
                color="text-red-400"
                expanded={expanded.lowStock}
                onToggle={() => toggleSection('lowStock')}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Current Stock</TableHead>
                            <TableHead className="text-right">Min Level</TableHead>
                            <TableHead className="text-right">Shortage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.lowStockProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    ✅ All products are well-stocked
                                </TableCell>
                            </TableRow>
                        ) : (
                            alerts.lowStockProducts.map((p) => (
                                <TableRow key={p._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.category}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-semibold ${p.stockQty === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {p.stockQty}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{p.minStockLevel}</TableCell>
                                    <TableCell className="text-right text-red-400 font-semibold">
                                        {p.minStockLevel - p.stockQty}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </AlertSection>

            {/* Expiring Soon Section */}
            <AlertSection
                title="Expiring Soon (30 Days)"
                icon={Clock}
                count={summary.expiringSoon}
                color="text-yellow-400"
                expanded={expanded.expiringSoon}
                onToggle={() => toggleSection('expiringSoon')}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Expiry Date</TableHead>
                            <TableHead className="text-right">Days Left</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.expiringSoon.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    ✅ No products expiring within 30 days
                                </TableCell>
                            </TableRow>
                        ) : (
                            alerts.expiringSoon.map((p) => (
                                <TableRow key={p._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.category}</TableCell>
                                    <TableCell className="text-right">{p.stockQty}</TableCell>
                                    <TableCell className="text-right">{formatDate(p.expiryDate)}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-semibold ${p.daysRemaining <= 7 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {p.daysRemaining} days
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </AlertSection>

            {/* Expired Section */}
            <AlertSection
                title="Expired Products"
                icon={XCircle}
                count={summary.expired}
                color="text-red-400"
                expanded={expanded.expired}
                onToggle={() => toggleSection('expired')}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Expired On</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.expired.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                    ✅ No expired products
                                </TableCell>
                            </TableRow>
                        ) : (
                            alerts.expired.map((p) => (
                                <TableRow key={p._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.category}</TableCell>
                                    <TableCell className="text-right">{p.stockQty}</TableCell>
                                    <TableCell className="text-right text-red-400">{formatDate(p.expiryDate)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </AlertSection>

            {/* Pending Payments Section */}
            <AlertSection
                title="Pending Supplier Payments"
                icon={CreditCard}
                count={summary.pendingPayments}
                color="text-orange-400"
                expanded={expanded.pendingPayments}
                onToggle={() => toggleSection('pendingPayments')}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.pendingPayments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    ✅ All payments up to date
                                </TableCell>
                            </TableRow>
                        ) : (
                            alerts.pendingPayments.map((p) => (
                                <TableRow key={p._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{p.supplier?.name || 'Unknown'}</TableCell>
                                    <TableCell className="text-right font-semibold text-orange-400">
                                        {formatCurrency(p.totalAmount)}
                                    </TableCell>
                                    <TableCell className="text-right">{formatDate(p.createdAt)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </AlertSection>

            {/* Credit Alerts Section */}
            <AlertSection
                title="Customer Credit Due"
                icon={Users}
                count={summary.creditAlerts}
                color="text-purple-400"
                expanded={expanded.creditAlerts}
                onToggle={() => toggleSection('creditAlerts')}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Customer</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Credit Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alerts.creditAlerts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    ✅ No outstanding credits
                                </TableCell>
                            </TableRow>
                        ) : (
                            alerts.creditAlerts.map((c) => (
                                <TableRow key={c._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{c.phone || '—'}</TableCell>
                                    <TableCell className="text-right font-semibold text-purple-400">
                                        {formatCurrency(c.creditBalance)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </AlertSection>
        </div>
    );
};

// Summary Card Component
function SummaryCard({ title, count, icon: Icon, color, bgColor }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className={`text-2xl font-bold mt-1 ${color}`}>{count}</p>
                    </div>
                    <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Collapsible Alert Section Component
function AlertSection({ title, icon: Icon, count, color, expanded, onToggle, children }) {
    return (
        <Card>
            <CardHeader
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color} bg-muted`}>
                            {count}
                        </span>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </CardHeader>
            {expanded && (
                <CardContent className="pt-0">
                    <div className="rounded-md border border-border overflow-hidden">
                        {children}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default Alerts;
