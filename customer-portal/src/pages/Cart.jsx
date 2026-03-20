import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import API from '../services/api';
import { Trash2, ArrowLeft, Receipt, Sparkles, Coins, ChevronRight } from 'lucide-react';
import AddToCartButton from '../components/AddToCartButton';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const Cart = () => {
    const { cart, totalItems, subtotal } = useCart();
    useAuth();
    const { trackPageVisit } = useCustomerActivityTracking();
    const navigate = useNavigate();

    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [pointValue, setPointValue] = useState(1);
    const [loyaltySettings, setLoyaltySettings] = useState(null);

    const fetchLoyaltyData = async () => {
        try {
            const customerRes = await API.get('/auth/me');
            if (customerRes.data.success) {
                setLoyaltyPoints(customerRes.data.data.loyaltyPoints || 0);
            }

            const settingsRes = await API.get('/loyalty-settings');
            if (settingsRes.data.success && settingsRes.data.data) {
                setLoyaltySettings(settingsRes.data.data);
                const settings = settingsRes.data.data;
                if (settings.pointsRequired && settings.redeemValue) {
                    setPointValue(settings.redeemValue / settings.pointsRequired);
                }
            }
        } catch (err) {
            console.error('Failed to fetch loyalty data', err);
        }
    };

    useEffect(() => {
        trackPageVisit('/cart');
        fetchLoyaltyData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePointsChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        const maxPoints = Math.min(loyaltyPoints, Math.floor(subtotal / pointValue));
        setPointsToRedeem(Math.min(value, maxPoints));
    };

    const taxAmount = subtotal * 0.05;
    const pointDiscount = pointsToRedeem * pointValue;
    const grandTotal = Math.max(0, subtotal + taxAmount - pointDiscount);
    const pointsToEarn = Math.floor(subtotal * (loyaltySettings?.earnRate || 0.1));

    const handleProceedToCheckout = () => {
        navigate('/checkout', {
            state: {
                pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : 0,
                pointDiscount: pointsToRedeem > 0 ? pointDiscount : 0,
            }
        });
    };

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
            </div>

            {/* Sticky Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">To Pay</p>
                        <p className="font-bold text-lg text-blue-600 mt-0.5">{formatCurrency(grandTotal)}</p>
                    </div>
                    {pointsToEarn > 0 && (
                        <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                            +{pointsToEarn} pts earned
                        </div>
                    )}
                </div>
                <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 outline-none transition-all active:scale-[0.98] flex justify-center items-center gap-2 h-14 uppercase tracking-widest"
                >
                    PROCEED TO CHECKOUT <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Cart;
