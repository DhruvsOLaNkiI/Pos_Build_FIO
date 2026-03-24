import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import API from '../services/api';
import {
    ArrowLeft, MapPin, CreditCard, Truck, Check, Loader2,
    Plus, Minus, X, Home, Building2, MoreHorizontal,
    Banknote, Smartphone, Wallet, Store as StoreIcon
} from 'lucide-react';
import MapLocationPicker from '../components/MapLocationPicker';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const PAYMENT_OPTIONS = [
    { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when your order arrives' },
    { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { id: 'pay_at_store', label: 'Pay at Store', icon: StoreIcon, desc: 'Pay when you pick up' },
];

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, subtotal, clearCart } = useCart();
    const { customer } = useAuth();
    const { trackPurchase } = useCustomerActivityTracking();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [error, setError] = useState('');

    // Loyalty points from navigation state
    const loyaltyState = location.state || {};
    const pointsToRedeem = loyaltyState.pointsToRedeem || 0;
    const pointDiscount = loyaltyState.pointDiscount || 0;

    // Address form state
    const [addrForm, setAddrForm] = useState({
        label: 'Home', fullName: customer?.name || '', mobile: customer?.mobile || '',
        street: '', city: '', state: '', pincode: '', landmark: '', isDefault: false,
    });
    const [savingAddress, setSavingAddress] = useState(false);

    useEffect(() => {
        if (cart.length === 0) {
            navigate('/');
            return;
        }
        fetchAddresses();
    }, [cart.length, navigate]);

    const fetchAddresses = async () => {
        try {
            const { data } = await API.get('/auth/addresses');
            if (data.success) {
                setAddresses(data.data);
                if (data.data.length === 0) {
                    setShowAddressForm(true);
                } else {
                    const def = data.data.find(a => a.isDefault);
                    setSelectedAddressId(def?._id || data.data[0]._id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch addresses', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        setError('');
        try {
            const { data } = await API.post('/auth/addresses', addrForm);
            if (data.success) {
                setAddresses(prev => [...prev, data.data]);
                setSelectedAddressId(data.data._id);
                setShowAddressForm(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save address');
        } finally {
            setSavingAddress(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId && !showAddressForm) {
            setError('Please select a delivery address');
            return;
        }
        if (addresses.length === 0 && !showAddressForm) {
            setError('Please add a delivery address');
            return;
        }

        setPlacingOrder(true);
        setError('');

        try {
            const selectedAddr = addresses.find(a => a._id === selectedAddressId);

            // If form is shown but no saved address selected, save the form address first
            let deliveryAddr = selectedAddr;
            if (!deliveryAddr && showAddressForm) {
                const addrRes = await API.post('/auth/addresses', addrForm);
                if (addrRes.data.success) {
                    deliveryAddr = addrRes.data.data;
                } else {
                    throw new Error('Failed to save address');
                }
            }

            const items = cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
            }));

            const orderData = {
                items,
                deliveryAddress: {
                    label: deliveryAddr.label,
                    fullName: deliveryAddr.fullName,
                    mobile: deliveryAddr.mobile,
                    street: deliveryAddr.street,
                    city: deliveryAddr.city,
                    state: deliveryAddr.state,
                    pincode: deliveryAddr.pincode,
                    landmark: deliveryAddr.landmark,
                },
                paymentMethod: selectedPayment,
                pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
                pointDiscount: pointsToRedeem > 0 ? pointDiscount : undefined,
            };

            const { data } = await API.post('/orders', orderData);

            if (data.success) {
                trackPurchase(data.data._id, data.data.grandTotal);
                clearCart();
                navigate(`/order-confirmation/${data.data._id}`, {
                    state: {
                        order: data.data,
                        pointsEarned: data.pointsEarned,
                        pointsRedeemed: data.pointsRedeemed,
                    }
                });
            }
        } catch (err) {
            console.error('Failed to place order:', err);
            setError(err.response?.data?.message || err.message || 'Order failed. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    const taxAmount = subtotal * 0.05;
    const grandTotal = Math.max(0, subtotal + taxAmount - pointDiscount);

    const labelIcons = { Home: Home, Office: Building2, Other: MoreHorizontal };

    if (loadingAddresses) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] italic text-sm">LOADING CHECKOUT...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white animate-fade-in pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-black italic uppercase tracking-tight">CHECKOUT</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Section 1: Delivery Address */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-black text-sm uppercase tracking-widest text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            DELIVERY ADDRESS
                        </h2>
                        {!showAddressForm && (
                            <button
                                onClick={() => setShowAddressForm(true)}
                                className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:text-blue-800"
                            >
                                <Plus className="w-3 h-3" /> ADD NEW
                            </button>
                        )}
                    </div>

                    {/* Address Form */}
                    {showAddressForm && (
                        <form onSubmit={handleSaveAddress} className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">NEW ADDRESS</h3>
                                {addresses.length > 0 && (
                                    <button type="button" onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Label Selector */}
                            <div className="flex gap-2 mb-4">
                                {['Home', 'Office', 'Other'].map(lbl => {
                                    const Icon = labelIcons[lbl];
                                    return (
                                        <button
                                            key={lbl}
                                            type="button"
                                            onClick={() => setAddrForm(f => ({ ...f, label: lbl }))}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase border-2 transition-all ${addrForm.label === lbl
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" /> {lbl}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text" placeholder="Full Name *" value={addrForm.fullName}
                                    onChange={e => setAddrForm(f => ({ ...f, fullName: e.target.value }))}
                                    required className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="tel" placeholder="Mobile Number *" value={addrForm.mobile}
                                    onChange={e => setAddrForm(f => ({ ...f, mobile: e.target.value }))}
                                    required className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="text" placeholder="Street / Area / House No *" value={addrForm.street}
                                    onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))}
                                    required className="col-span-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="text" placeholder="City *" value={addrForm.city}
                                    onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))}
                                    required className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="text" placeholder="State *" value={addrForm.state}
                                    onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))}
                                    required className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="text" placeholder="Pincode *" value={addrForm.pincode}
                                    onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    required className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input
                                    type="text" placeholder="Landmark (optional)" value={addrForm.landmark}
                                    onChange={e => setAddrForm(f => ({ ...f, landmark: e.target.value }))}
                                    className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Map Location Picker */}
                            <div className="mt-4">
                                <MapLocationPicker
                                    latitude={addrForm.latitude || 0}
                                    longitude={addrForm.longitude || 0}
                                    onLocationChange={(lat, lng) => setAddrForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                                    label="Pin Location on Map (Optional)"
                                />
                            </div>

                            <label className="flex items-center gap-2 mt-4 cursor-pointer">
                                <input
                                    type="checkbox" checked={addrForm.isDefault}
                                    onChange={e => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-xs font-bold text-gray-600 uppercase">Set as default address</span>
                            </label>

                            {addresses.length === 0 && (
                                <button
                                    type="submit"
                                    disabled={savingAddress}
                                    className="w-full mt-4 bg-blue-600 text-white font-black uppercase tracking-widest py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE ADDRESS'}
                                </button>
                            )}
                        </form>
                    )}

                    {/* Address List */}
                    {!showAddressForm && addresses.length > 0 && (
                        <div className="space-y-2">
                            {addresses.map(addr => {
                                const Icon = labelIcons[addr.label] || MoreHorizontal;
                                return (
                                    <button
                                        key={addr._id}
                                        onClick={() => setSelectedAddressId(addr._id)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedAddressId === addr._id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-full ${selectedAddressId === addr._id ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}>
                                                <Icon className={`w-4 h-4 ${selectedAddressId === addr._id ? 'text-blue-600' : 'text-gray-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-sm uppercase">{addr.label}</span>
                                                    {addr.isDefault && (
                                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase">DEFAULT</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-gray-700 mt-0.5">{addr.fullName}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">{addr.mobile}</p>
                                            </div>
                                            {selectedAddressId === addr._id && (
                                                <Check className="w-5 h-5 text-blue-600 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 2: Payment Method */}
                <section>
                    <h2 className="font-black text-sm uppercase tracking-widest text-gray-900 flex items-center gap-2 mb-4">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        PAYMENT METHOD
                    </h2>
                    <div className="space-y-2">
                        {PAYMENT_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setSelectedPayment(opt.id)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${selectedPayment === opt.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${selectedPayment === opt.id ? 'bg-blue-100' : 'bg-gray-100'
                                        }`}>
                                        <Icon className={`w-5 h-5 ${selectedPayment === opt.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{opt.label}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{opt.desc}</p>
                                    </div>
                                    {selectedPayment === opt.id && (
                                        <Check className="w-5 h-5 text-blue-600 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Section 3: Order Summary */}
                <section className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                    <h2 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        ORDER SUMMARY
                    </h2>
                    <div className="space-y-2 mb-4">
                        {cart.map(item => (
                            <div key={item.product._id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-bold truncate flex-1 mr-2">
                                    {item.product.name} <span className="text-gray-400">x{item.quantity}</span>
                                </span>
                                <span className="font-bold shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-bold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Taxes (5%)</span>
                            <span className="font-bold">{formatCurrency(taxAmount)}</span>
                        </div>
                        {pointDiscount > 0 && (
                            <div className="flex justify-between text-amber-600">
                                <span>Points Discount</span>
                                <span className="font-bold">-{formatCurrency(pointDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-base pt-2 border-t border-gray-200">
                            <span>TOTAL</span>
                            <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-2xl text-center border border-red-100">
                        {error}
                    </div>
                )}
            </div>

            {/* Sticky Place Order Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3 text-sm">
                        <span className="text-gray-500 font-bold">
                            {PAYMENT_OPTIONS.find(p => p.id === selectedPayment)?.label}
                        </span>
                        <span className="font-black text-lg text-blue-600">{formatCurrency(grandTotal)}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={placingOrder}
                        className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {placingOrder ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            `PLACE ORDER`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
