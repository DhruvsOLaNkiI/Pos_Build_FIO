import { useState, useEffect } from 'react';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Search,
    Truck,
    Package,
    CheckCircle2,
    Clock,
    CalendarDays,
    ArrowRight,
    Loader2,
    PackageCheck,
} from 'lucide-react';

const DELIVERY_STATUSES = [
    { key: 'ordered', label: 'Ordered', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
];

const OrderTracking = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('ordered');
    const [updating, setUpdating] = useState(null);

    // Edit dialog
    const [editOrder, setEditOrder] = useState(null);
    const [editExpectedDate, setEditExpectedDate] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/purchases/tracking');
            setOrders(data.data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const updateDeliveryStatus = async (orderId, newStatus) => {
        try {
            setUpdating(orderId);
            await API.put(`/purchases/${orderId}`, { deliveryStatus: newStatus });
            toast({
                title: newStatus === 'delivered' ? '📦 Order Delivered!' : '🚚 Order Dispatched!',
                description: newStatus === 'delivered'
                    ? 'Warehouse inventory has been updated.'
                    : 'Order is now out for delivery.',
            });
            fetchOrders();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update status',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const updateExpectedDate = async () => {
        if (!editOrder) return;
        try {
            await API.put(`/purchases/${editOrder._id}`, { expectedDeliveryDate: editExpectedDate });
            toast({ title: 'Updated', description: 'Expected delivery date updated.' });
            setEditOrder(null);
            fetchOrders();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update date', variant: 'destructive' });
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesTab = order.deliveryStatus === activeTab;
        if (!search) return matchesTab;
        const s = search.toLowerCase();
        return matchesTab && (
            order.invoiceNumber?.toLowerCase().includes(s) ||
            order.supplier?.name?.toLowerCase().includes(s)
        );
    });

    const ordersByStatus = {
        ordered: orders.filter(o => o.deliveryStatus === 'ordered'),
        delivered: orders.filter(o => o.deliveryStatus === 'delivered'),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Truck className="w-8 h-8" /> Order Tracking
                </h1>
                <p className="text-muted-foreground mt-1">
                    Track purchase orders from placement to delivery. Inventory updates only when orders are delivered.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DELIVERY_STATUSES.map(status => {
                    const count = ordersByStatus[status.key]?.length || 0;
                    const Icon = status.icon;
                    return (
                        <Card
                            key={status.key}
                            className={`cursor-pointer transition-all hover:shadow-lg ${activeTab === status.key ? `ring-2 ring-offset-2 ring-offset-background ${status.border.replace('border-', 'ring-')}` : ''}`}
                            onClick={() => setActiveTab(status.key)}
                        >
                            <CardContent className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{status.label}</p>
                                    <h3 className="text-3xl font-black mt-1">{count}</h3>
                                </div>
                                <div className={`p-3 rounded-full ${status.bg}`}>
                                    <Icon className={`w-6 h-6 ${status.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by PO Number or Supplier..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Status Tab Buttons */}
            <div className="flex gap-2 border-b border-border pb-2">
                {DELIVERY_STATUSES.map(status => {
                    const Icon = status.icon;
                    return (
                        <button
                            key={status.key}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === status.key
                                ? `${status.bg} ${status.color} border-b-2 ${status.border}`
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            onClick={() => setActiveTab(status.key)}
                        >
                            <Icon className="w-4 h-4" />
                            {status.label} ({ordersByStatus[status.key]?.length || 0})
                        </button>
                    );
                })}
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <PackageCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No {activeTab} orders</p>
                        <p className="text-sm">
                            {activeTab === 'ordered' && 'Create a new purchase order to get started.'}
                            {activeTab === 'delivered' && 'No delivered orders found.'}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <Card key={order._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Left: Order Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-mono font-bold text-sm">{order.invoiceNumber}</span>
                                            <Badge variant="secondary">{order.supplier?.name || 'Unknown'}</Badge>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${order.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                                                order.status === 'partial' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        {/* Items Summary */}
                                        <div className="text-xs text-muted-foreground">
                                            {order.items.map((item, idx) => (
                                                <span key={idx}>
                                                    {item.name} ×{item.quantity}
                                                    {idx < order.items.length - 1 && ', '}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Dates */}
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                Ordered: {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                            {order.expectedDeliveryDate && (
                                                <span className="flex items-center gap-1 text-blue-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Expected: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {order.deliveredAt && (
                                                <span className="flex items-center gap-1 text-green-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Amount + Actions */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹{order.totalAmount.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {order.deliveryStatus !== 'delivered' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditOrder(order);
                                                        setEditExpectedDate(order.expectedDeliveryDate
                                                            ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
                                                            : ''
                                                        );
                                                    }}
                                                    className="text-xs gap-1"
                                                >
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    Set Date
                                                </Button>
                                            )}

                                            {order.deliveryStatus === 'ordered' && (
                                                <Button
                                                    size="sm"
                                                    disabled={updating === order._id}
                                                    onClick={() => updateDeliveryStatus(order._id, 'delivered')}
                                                    className="text-xs gap-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    {updating === order._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    Delivered
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Expected Date Dialog */}
            <Dialog open={!!editOrder} onOpenChange={() => setEditOrder(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Set Expected Delivery Date</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            PO: <span className="font-mono font-bold text-foreground">{editOrder?.invoiceNumber}</span>
                        </p>
                        <div className="space-y-2">
                            <Label>Expected Delivery Date</Label>
                            <Input
                                type="date"
                                value={editExpectedDate}
                                onChange={(e) => setEditExpectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
                        <Button onClick={updateExpectedDate}>Save Date</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrderTracking;
