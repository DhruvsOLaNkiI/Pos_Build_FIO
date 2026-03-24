import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import API from '../services/api';
import { Trash2, ArrowLeft, Receipt, Sparkles, Coins, ChevronRight, ShoppingBag, Minus, Plus, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

/* ──────────────── Compact Quantity Stepper ──────────────── */
const QuantityStepper = ({ product }) => {
    const { getQuantity, addToCart, updateQuantity, removeFromCart } = useCart();
    const { trackAddToCart } = useCustomerActivityTracking();
    const qty = getQuantity(product._id);

    if (qty === 0) {
        return (
            <button
                onClick={() => { addToCart(product); trackAddToCart(product._id, product.name); }}
                className="bg-blue-600 text-white font-bold text-xs px-5 py-2 rounded-full tracking-wide uppercase hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
                + Add
            </button>
        );
    }

    return (
        <div className="flex items-center bg-blue-600 text-white rounded-full h-9 shadow-sm overflow-hidden">
            <button
                className="w-9 h-full flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
                onClick={() => qty === 1 ? removeFromCart(product._id) : updateQuantity(product._id, -1)}
            >
                {qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <span className="font-bold text-sm w-8 text-center select-none">{qty}</span>
            <button
                className="w-9 h-full flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
                onClick={() => updateQuantity(product._id, 1)}
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

/* ──────────────── Cart Item Card ──────────────── */
const CartItemCard = ({ item }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
        className="flex gap-3 items-center py-3 group"
    >
        {/* Image */}
        <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
            {item.product.imageUrls?.[0] ? (
                <img src={`http://localhost:5001${item.product.imageUrls[0]}`} alt={item.product.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold bg-gray-50">
                    {item.product.name.charAt(0)}
                </div>
            )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[13px] text-gray-900 line-clamp-1 leading-snug">{item.product.name}</h4>
            <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-sm text-gray-900">{formatCurrency(item.price)}</span>
                {item.hasOffer && (
                    <>
                        <span className="text-gray-400 text-[11px] line-through">{formatCurrency(item.originalPrice)}</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{item.offerLabel}</span>
                    </>
                )}
            </div>
        </div>

        {/* Quantity Stepper */}
        <div className="shrink-0">
            <QuantityStepper product={item.product} />
        </div>
    </motion.div>
);

const Cart = () => {
    const { cart, totalItems, subtotal } = useCart();
    useAuth();
    const { trackPageVisit } = useCustomerActivityTracking();
    const navigate = useNavigate();

    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [pointValue, setPointValue] = useState(1);
    const [loyaltySettings, setLoyaltySettings] = useState(null);
    const [coupon, setCoupon] = useState('');

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

    /* ──────────── EMPTY STATE ──────────── */
    if (cart.length === 0) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
                <header className="bg-white px-4 py-3 flex items-center gap-3 relative justify-center border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="p-2 absolute left-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-base font-bold text-gray-900">Your Cart</h1>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                        <ShoppingBag className="w-9 h-9 text-gray-300" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Your cart is empty</h2>
                    <p className="text-sm text-gray-500 mt-1 text-center">Looks like you haven't added anything yet.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 bg-blue-600 text-white font-bold px-8 py-3 rounded-full text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    /* ──────────── MAIN CART ──────────── */
    return (
        <div className="min-h-[100dvh] bg-gray-50 flex flex-col pb-[140px] animate-fade-in">

            {/* ── Header ── */}
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-gray-100">
                <div className="max-w-lg mx-auto flex items-center gap-3 relative justify-center">
                    <button onClick={() => navigate(-1)} className="p-2 absolute left-0 hover:bg-gray-50 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-base font-bold text-gray-900">Review Order</h1>
                    <span className="absolute right-0 text-xs text-gray-400 font-medium">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
                </div>
            </header>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

                    {/* ── Items ── */}
                    <div className="bg-white rounded-2xl px-4 shadow-sm border border-gray-100">
                        <AnimatePresence>
                            {cart.map((item, i) => (
                                <div key={item.product._id}>
                                    <CartItemCard item={item} />
                                    {i < cart.length - 1 && <div className="border-b border-dashed border-gray-100" />}
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* ── Loyalty Points ── */}
                    {loyaltyPoints > 0 && (
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs uppercase font-bold tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" /> Redeem Points
                                </span>
                                <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                                    {loyaltyPoints} available
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={Math.min(loyaltyPoints, Math.floor(subtotal / pointValue))}
                                    value={pointsToRedeem}
                                    onChange={handlePointsChange}
                                    placeholder="0"
                                    className="flex-1 px-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/50 border-0"
                                />
                                <button
                                    onClick={() => setPointsToRedeem(Math.min(loyaltyPoints, Math.floor(subtotal / pointValue)))}
                                    className="px-5 py-2.5 bg-white text-amber-600 font-bold rounded-xl text-sm hover:bg-white/90 transition-colors"
                                >
                                    Max
                                </button>
                            </div>
                            {pointsToRedeem > 0 && (
                                <div className="mt-3 bg-white/15 rounded-xl py-2 text-center">
                                    <p className="text-[11px] opacity-80">You'll save</p>
                                    <p className="text-lg font-bold">{formatCurrency(pointDiscount)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Earn points badge ── */}
                    {pointsToEarn > 0 && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                            <Coins className="w-4 h-4 shrink-0" />
                            <span>You'll earn <strong>{pointsToEarn} points</strong> from this order!</span>
                        </div>
                    )}

                    {/* ── Coupon ── */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Coupon Code</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                                placeholder="Enter code (e.g., SAVE20)"
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                            />
                            <button className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-100 transition-colors">
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* ── Bill Summary ── */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-3">Bill Details</h3>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Item Total</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Taxes (5%)</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
                            </div>
                            {pointDiscount > 0 && (
                                <div className="flex justify-between text-amber-600">
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Points Discount
                                    </span>
                                    <span className="font-semibold">-{formatCurrency(pointDiscount)}</span>
                                </div>
                            )}
                            <div className="border-t border-dashed border-gray-200 pt-2.5 mt-1">
                                <div className="flex justify-between font-bold text-base">
                                    <span className="text-gray-900">To Pay</span>
                                    <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sticky Checkout Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="max-w-lg mx-auto px-4 py-3 pb-safe">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</p>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-xl text-gray-900">{formatCurrency(grandTotal)}</span>
                                {pointsToEarn > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                        +{pointsToEarn} pts
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleProceedToCheckout}
                            className="bg-blue-600 text-white font-bold text-sm py-3.5 px-8 rounded-full shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.97] transition-all flex items-center gap-2 uppercase tracking-wider"
                        >
                            Checkout <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
