import { useState, useEffect } from 'react';
import API from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Search, Globe, Package, Clock, CheckCircle2, Truck, XCircle,
    Loader2, ChevronRight, MapPin, CreditCard, Phone, User, Eye,
    ChefHat, ArrowRight
} from 'lucide-react';

const STATUSES = [
    { key: 'all', label: 'All Orders', icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' },
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'delivered', label: 'Delivered', icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
];

const PAYMENT_LABELS = {
    cash: 'Cash on Delivery',
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Card',
    pay_at_store: 'Pay at Store',
};

const NEXT_STATUS_MAP = {
    pending: { next: 'preparing', label: 'Start Preparing', icon: ChefHat, color: 'bg-blue-600 hover:bg-blue-700' },
    preparing: { next: 'ready', label: 'Mark Ready', icon: CheckCircle2, color: 'bg-emerald-600 hover:bg-emerald-700' },
    ready: { next: 'delivered', label: 'Mark Delivered', icon: Truck, color: 'bg-green-600 hover:bg-green-700' },
};

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const OnlineOrders = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [updating, setUpdating] = useState(null);
    const [statusCounts, setStatusCounts] = useState({});
    const [viewOrder, setViewOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [activeTab, search]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeTab !== 'all') params.append('status', activeTab);
            if (search) params.append('search', search);

            const { data } = await API.get(`/online-orders?${params.toString()}`);
            if (data.success) {
                setOrders(data.data);
                setStatusCounts(data.statusCounts || {});
            }
        } catch (error) {
            console.error('Failed to fetch online orders', error);
            toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            setUpdating(orderId);
            const { data } = await API.put(`/online-orders/${orderId}/status`, { status: newStatus });
            if (data.success) {
                toast({
                    title: 'Status Updated',
                    description: `Order marked as ${newStatus}`,
                });
                fetchOrders();
            }
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

    const cancelOrder = async (orderId) => {
        try {
            setUpdating(orderId);
            await API.put(`/online-orders/${orderId}/status`, { status: 'cancelled' });
            toast({ title: 'Order Cancelled', description: 'Order has been cancelled' });
            fetchOrders();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Globe className="w-8 h-8 text-blue-600" /> Online Orders
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage orders from the customer portal. Approve, prepare, and track delivery.
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {STATUSES.map(status => {
                    const count = statusCounts[status.key] || 0;
                    const Icon = status.icon;
                    return (
                        <Card
                            key={status.key}
                            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === status.key ? `ring-2 ring-blue-500 ring-offset-2 ring-offset-background` : ''}`}
                            onClick={() => setActiveTab(status.key)}
                        >
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{status.label}</p>
                                    <h3 className="text-2xl font-black mt-0.5">{count}</h3>
                                </div>
                                <div className={`p-2 rounded-full ${status.bg}`}>
                                    <Icon className={`w-5 h-5 ${status.color}`} />
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
                    placeholder="Search by invoice, customer name, mobile..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No {activeTab === 'all' ? '' : activeTab} orders found</p>
                    <p className="text-sm">Online orders from the customer portal will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => {
                        const statusInfo = STATUSES.find(s => s.key === order.status) || STATUSES[0];
                        const StatusIcon = statusInfo.icon;
                        const payMethod = order.paymentMethods?.[0]?.method || 'cash';
                        const nextStatus = NEXT_STATUS_MAP[order.status];

                        return (
                            <Card key={order._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                        {/* Left: Order Info */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-mono font-bold text-sm">{order.invoiceNo}</span>
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusInfo.bg} ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" /> {order.status}
                                                </span>
                                                {order.store?.name && (
                                                    <Badge variant="outline" className="text-[10px]">{order.store.name}</Badge>
                                                )}
                                            </div>

                                            {/* Customer Info */}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                {order.customer && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {order.customer.name}
                                                    </span>
                                                )}
                                                {order.customer?.mobile && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {order.customer.mobile}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <CreditCard className="w-3 h-3" /> {PAYMENT_LABELS[payMethod] || payMethod}
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

                                            {/* Delivery Address */}
                                            {order.deliveryAddress?.street && (
                                                <div className="flex items-start gap-1 text-[10px] text-muted-foreground">
                                                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span>
                                                        {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Date */}
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        {/* Right: Amount + Actions */}
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{formatCurrency(order.grandTotal)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {/* View Details */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setViewOrder(order)}
                                                    className="text-xs gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> View
                                                </Button>

                                                {/* Next Status Action */}
                                                {nextStatus && (
                                                    <Button
                                                        size="sm"
                                                        disabled={updating === order._id}
                                                        onClick={() => updateStatus(order._id, nextStatus.next)}
                                                        className={`text-xs gap-1 text-white ${nextStatus.color}`}
                                                    >
                                                        {updating === order._id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <nextStatus.icon className="w-3 h-3" />
                                                        )}
                                                        {nextStatus.label}
                                                    </Button>
                                                )}

                                                {/* Cancel (only for non-completed orders) */}
                                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={updating === order._id}
                                                        onClick={() => cancelOrder(order._id)}
                                                        className="text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-3 h-3" /> Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Order Detail Dialog */}
            <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {viewOrder?.invoiceNo}
                        </DialogTitle>
                    </DialogHeader>
                    {viewOrder && (
                        <div className="space-y-4 py-2">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const s = STATUSES.find(st => st.key === viewOrder.status) || STATUSES[0];
                                    return (
                                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase ${s.bg} ${s.color}`}>
                                            <s.icon className="w-3.5 h-3.5" /> {viewOrder.status}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Customer */}
                            {viewOrder.customer && (
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Customer</p>
                                    <p className="font-bold text-sm">{viewOrder.customer.name}</p>
                                    <p className="text-xs text-gray-500">{viewOrder.customer.mobile} · ID: {viewOrder.customer.customerId}</p>
                                </div>
                            )}

                            {/* Delivery Address */}
                            {viewOrder.deliveryAddress?.street && (
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Delivery Address</p>
                                    <p className="font-bold text-sm">{viewOrder.deliveryAddress.fullName}</p>
                                    <p className="text-xs text-gray-500">
                                        {viewOrder.deliveryAddress.street}, {viewOrder.deliveryAddress.city}, {viewOrder.deliveryAddress.state} - {viewOrder.deliveryAddress.pincode}
                                    </p>
                                    {viewOrder.deliveryAddress.landmark && (
                                        <p className="text-[10px] text-gray-400">Landmark: {viewOrder.deliveryAddress.landmark}</p>
                                    )}
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Items</p>
                                {viewOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                                        <span className="font-medium">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                                        <span className="font-bold">{formatCurrency(item.total)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bill */}
                            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-bold">{formatCurrency(viewOrder.subtotal)}</span>
                                </div>
                                {viewOrder.totalGST > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">GST</span>
                                        <span className="font-bold">{formatCurrency(viewOrder.totalGST)}</span>
                                    </div>
                                )}
                                {viewOrder.discount > 0 && (
                                    <div className="flex justify-between text-xs text-amber-600">
                                        <span>Discount</span>
                                        <span className="font-bold">-{formatCurrency(viewOrder.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-gray-200">
                                    <span>TOTAL</span>
                                    <span className="text-blue-600">{formatCurrency(viewOrder.grandTotal)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            {NEXT_STATUS_MAP[viewOrder.status] && (
                                <Button
                                    className={`w-full text-white ${NEXT_STATUS_MAP[viewOrder.status].color}`}
                                    onClick={() => {
                                        updateStatus(viewOrder._id, NEXT_STATUS_MAP[viewOrder.status].next);
                                        setViewOrder(null);
                                    }}
                                >
                                    {NEXT_STATUS_MAP[viewOrder.status].label} <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OnlineOrders;
