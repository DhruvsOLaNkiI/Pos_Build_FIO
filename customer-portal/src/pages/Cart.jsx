import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import API from '../services/api';
import { Trash2, ArrowLeft, Receipt, CheckCircle, Loader2, Sparkles, Coins } from 'lucide-react';
import AddToCartButton from '../components/AddToCartButton';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const Cart = () => {
    const { cart, totalItems, subtotal, clearCart, removeFromCart } = useCart();
    const { customer } = useAuth();
    const { trackPageVisit, trackPurchase } = useCustomerActivityTracking();
    const navigate = useNavigate();

    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [error, setError] = useState('');
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [pointValue, setPointValue] = useState(1); // 1 point = ₹1 default
    const [loyaltySettings, setLoyaltySettings] = useState(null);

    useEffect(() => {
        trackPageVisit('/cart');
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            // Fetch customer's current points
            const customerRes = await API.get('/auth/me');
            if (customerRes.data.success) {
                setLoyaltyPoints(customerRes.data.data.loyaltyPoints || 0);
            }

            // Fetch loyalty settings for point value
            const settingsRes = await API.get('/loyalty-settings');
            if (settingsRes.data.success && settingsRes.data.data) {
                setLoyaltySettings(settingsRes.data.data);
                // Calculate point value (redeemValue / pointsRequired)
                const settings = settingsRes.data.data;
                if (settings.pointsRequired && settings.redeemValue) {
                    setPointValue(settings.redeemValue / settings.pointsRequired);
                }
            }
        } catch (error) {
            console.error('Failed to fetch loyalty data', error);
        }
    };

    const handlePointsChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        const maxPoints = Math.min(loyaltyPoints, Math.floor(subtotal / pointValue));
        setPointsToRedeem(Math.min(value, maxPoints));
    };

    const taxAmount = subtotal * 0.05; // 5% GST assumption
    const pointDiscount = pointsToRedeem * pointValue;
    const grandTotal = Math.max(0, subtotal + taxAmount - pointDiscount);
    const pointsToEarn = Math.floor(subtotal * (loyaltySettings?.earnRate || 0.1)); // Default 10% earn rate

    const handlePlaceOrder = async () => {
        setPlacingOrder(true);
        setError('');

        try {
            // Map cart items for backend
            const items = cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.price
            }));

            const orderData = {
                items,
                pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
                pointDiscount: pointsToRedeem > 0 ? pointDiscount : undefined
            };

            await API.post('/auth/orders', orderData);

            // Track purchase
            trackPurchase(null, grandTotal);

            setOrderPlaced(true);
            setTimeout(() => {
                clearCart();
                navigate('/');
            }, 3000);

        } catch (err) {
            console.error('Failed to place order:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Order failed. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                    <CheckCircle className="w-24 h-24 text-emerald-500 mb-6" />
                </motion.div>
                <h1 className="text-3xl font-bold text-center mb-2">Order Received!</h1>
                <p className="text-muted-foreground text-center">Your items will be prepared shortly.</p>
                <p className="text-xs text-muted-foreground mt-8 animate-pulse">Redirecting to home...</p>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-background p-4 flex flex-col pt-safe">
                <header className="flex items-center gap-3 mb-6 relative">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted/50 rounded-full transition-colors absolute">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold w-full text-center">Your Cart</h1>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                    <Receipt className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-lg font-bold">Your cart is empty</h2>
                    <p className="text-sm text-muted-foreground mt-1">Looks like you haven't added anything yet.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest text-sm"
                    >
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-background flex flex-col pb-[120px] animate-fade-in relative">
            <header className="bg-white px-4 py-3 pb-4 sticky top-0 z-10 shadow-sm border-b border-border/50">
                <div className="flex items-center gap-3 relative justify-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 absolute left-0 hover:bg-muted/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold">Review Order</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

                {/* Items List */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-border/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pl-1">Items ({totalItems})</h3>
                    <div className="space-y-4">
                        <AnimatePresence>
                            {cart.map((item) => (
                                <motion.div
                                    key={item.product._id}
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex gap-4 items-center"
                                >
                                    <div className="w-16 h-16 bg-muted/30 rounded-2xl overflow-hidden shrink-0">
                                        {item.product.imageUrls?.[0] ? (
                                            <img src={`http://localhost:5001${item.product.imageUrls[0]}`} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                                                {item.product.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{item.product.name}</h4>
                                        <div className="font-bold text-primary mt-1 text-sm">{formatCurrency(item.price)}</div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <AddToCartButton product={item.product} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-border/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-dashed border-border pb-3">Bill Details</h3>

                    {/* Loyalty Points Redemption */}
                    {loyaltyPoints > 0 && (
                        <div className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs uppercase font-bold tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" /> Redeem Your Points
                                </label>
                                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                                    {loyaltyPoints} pts available
                                </span>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="number"
                                    min="0"
                                    max={Math.min(loyaltyPoints, Math.floor(subtotal / pointValue))}
                                    value={pointsToRedeem}
                                    onChange={handlePointsChange}
                                    placeholder="Enter points"
                                    className="flex-1 px-4 py-2.5 bg-white text-gray-900 border-0 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                                <button
                                    onClick={() => setPointsToRedeem(Math.min(loyaltyPoints, Math.floor(subtotal / pointValue)))}
                                    className="px-4 py-2.5 bg-white text-amber-600 font-bold rounded-xl text-sm hover:bg-white/90 transition-colors"
                                >
                                    Max
                                </button>
                            </div>
                            {pointsToRedeem > 0 && (
                                <div className="bg-white/20 rounded-lg p-2 text-center">
                                    <p className="text-xs opacity-90">You'll save</p>
                                    <p className="text-xl font-bold">{formatCurrency(pointDiscount)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Points to Earn */}
                    {pointsToEarn > 0 && (
                        <div className="mb-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/50">
                            <Coins className="w-4 h-4" />
                            <span>You'll earn <strong>{pointsToEarn} points</strong> from this order!</span>
                        </div>
                    )}

                    {/* Coupon Code Input */}
                    <div className="mb-4">
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Coupon Code</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter code (e.g., SAVE20)"
                                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors">
                                Apply
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Item Total</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxes (5%)</span>
                            <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                        </div>
                        {pointDiscount > 0 && (
                            <div className="flex justify-between text-amber-600">
                                <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Points Discount
                                </span>
                                <span className="font-semibold">-{formatCurrency(pointDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base pt-3 border-t border-dashed border-border">
                            <span>To Pay</span>
                            <span className="text-primary">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm font-medium p-4 rounded-2xl text-center">
                        {error}
                    </div>
                )}
            </div>

            {/* Sticky Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pay Using</p>
                        <p className="font-semibold mt-0.5">Pay at Store</p>
                    </div>
                </div>
                <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 outline-none transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-14"
                >
                    {placingOrder ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        `Place Order • ${formatCurrency(grandTotal)}`
                    )}
                </button>
            </div>
        </div>
    );
};

export default Cart;
