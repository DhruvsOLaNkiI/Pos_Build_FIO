import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../services/api';
import {
    CheckCircle, MapPin, CreditCard, Package, Clock, Store as StoreIcon,
    Loader2, ArrowRight, Home, Star, ChevronRight
} from 'lucide-react';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const PAYMENT_LABELS = {
    cash: 'Cash on Delivery',
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Credit / Debit Card',
    pay_at_store: 'Pay at Store',
};

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // From navigation state (right after placing order)
    const navState = location.state || {};
    const pointsEarned = navState.pointsEarned || 0;
    const pointsRedeemed = navState.pointsRedeemed || 0;

    useEffect(() => {
        if (navState.order) {
            setOrder(navState.order);
            setLoading(false);
        } else {
            fetchOrder();
        }
    }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchOrder = async () => {
        try {
            const { data } = await API.get(`/auth/orders/${orderId}`);
            if (data.success) {
                setOrder(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch order', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] italic text-sm">LOADING ORDER...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-black uppercase tracking-wider text-lg">ORDER NOT FOUND</p>
                <Link to="/" className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                    Go Home
                </Link>
            </div>
        );
    }

    const paymentMethod = order.paymentMethods?.[0]?.method || 'cash';
    const payLabel = PAYMENT_LABELS[paymentMethod] || paymentMethod;
    const storeName = order.store?.name || order.storeName || '';
    const deliveryAddr = order.deliveryAddress || {};

    return (
        <div className="min-h-screen bg-gray-50 animate-fade-in pb-32">
            {/* Success Header */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white px-4 py-10 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="inline-block mb-4"
                >
                    <div className="bg-white rounded-full p-3">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                    </div>
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-black italic uppercase tracking-tight"
                >
                    ORDER PLACED!
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-blue-200 text-sm font-bold mt-2"
                >
                    Your order has been received and is being prepared
                </motion.p>

                {pointsEarned > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 px-4 py-2 rounded-full mt-4 text-xs font-black"
                    >
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        +{pointsEarned} loyalty points earned!
                    </motion.div>
                )}
            </div>

            <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
                {/* Invoice Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Invoice No</p>
                            <p className="font-black text-sm mt-0.5">{order.invoiceNo}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
                            <p className="font-bold text-sm mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="font-black text-xs uppercase text-amber-700 tracking-wider">
                            STATUS: {order.status}
                        </span>
                    </div>

                    {/* Items */}
                    <div className="p-5">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Items</p>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 uppercase text-xs">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">
                                            {formatCurrency(item.price)} x {item.quantity}
                                            {item.gstPercent > 0 && ` · GST ${item.gstPercent}%`}
                                        </p>
                                    </div>
                                    <p className="font-bold shrink-0">{formatCurrency(item.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="p-5 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-bold">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.totalGST > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">GST</span>
                                <span className="font-bold">{formatCurrency(order.totalGST)}</span>
                            </div>
                        )}
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-amber-600">
                                <span>Discount</span>
                                <span className="font-bold">-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        {pointsRedeemed > 0 && (
                            <div className="flex justify-between text-sm text-amber-600">
                                <span>Points Redeemed</span>
                                <span className="font-bold">-{pointsRedeemed} pts</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-base pt-3 border-t border-gray-100">
                            <span>GRAND TOTAL</span>
                            <span className="text-blue-600">{formatCurrency(order.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                {deliveryAddr.street && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivering To</span>
                        </div>
                        <p className="font-bold text-sm">{deliveryAddr.fullName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {deliveryAddr.street}, {deliveryAddr.city}, {deliveryAddr.state} - {deliveryAddr.pincode}
                        </p>
                        {deliveryAddr.landmark && (
                            <p className="text-xs text-gray-400 mt-0.5">Landmark: {deliveryAddr.landmark}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{deliveryAddr.mobile}</p>
                    </div>
                )}

                {/* Payment & Store */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <CreditCard className="w-4 h-4 text-blue-600 mb-2" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Payment</p>
                        <p className="font-bold text-sm mt-1">{payLabel}</p>
                    </div>
                    {storeName && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <StoreIcon className="w-4 h-4 text-blue-600 mb-2" />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Store</p>
                            <p className="font-bold text-sm mt-1">{storeName}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                    <Link
                        to="/"
                        className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        CONTINUE SHOPPING <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        to="/"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/', { state: { view: 'account', tab: 'orders' } });
                        }}
                        className="w-full border-2 border-gray-200 text-gray-600 font-black uppercase tracking-widest py-4 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        VIEW ALL ORDERS <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
