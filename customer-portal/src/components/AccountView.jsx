import { useState, useEffect } from 'react';
import { User, Wallet, ChevronRight, Package, HeadphonesIcon, Users, MapPin, LogOut, ChevronLeft, Loader2, Clock, CheckCircle, Truck, X, Plus, Home, Building2, MoreHorizontal, Store as StoreIcon, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const STATUS_COLORS = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
    preparing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Package },
    ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: X },
};

const PAYMENT_LABELS = {
    cash: 'Cash on Delivery',
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Card',
    pay_at_store: 'Pay at Store',
};

const labelIcons = { Home: Home, Office: Building2, Other: MoreHorizontal };

const AccountView = ({ onViewHome }) => {
    const { customer, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('orders');

    // Orders state
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);

    // Addresses state
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddrForm, setShowAddrForm] = useState(false);
    const [editingAddr, setEditingAddr] = useState(null);
    const [addrForm, setAddrForm] = useState({
        label: 'Home', fullName: customer?.name || '', mobile: customer?.mobile || '',
        street: '', city: '', state: '', pincode: '', landmark: '', isDefault: false,
    });
    const [savingAddr, setSavingAddr] = useState(false);

    const tabs = [
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'support', label: 'Customer Support', icon: HeadphonesIcon },
        { id: 'referrals', label: 'Manage Referrals', icon: Users },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'addresses') fetchAddresses();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const { data } = await API.get('/auth/orders');
            if (data.success) setOrders(data.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
            const { data } = await API.get('/auth/addresses');
            if (data.success) setAddresses(data.data);
        } catch (err) {
            console.error('Failed to fetch addresses', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddr(true);
        try {
            if (editingAddr) {
                const { data } = await API.put(`/auth/addresses/${editingAddr}`, addrForm);
                if (data.success) {
                    setAddresses(prev => prev.map(a => a._id === editingAddr ? data.data : a));
                }
            } else {
                const { data } = await API.post('/auth/addresses', addrForm);
                if (data.success) setAddresses(prev => [...prev, data.data]);
            }
            setShowAddrForm(false);
            setEditingAddr(null);
            resetAddrForm();
        } catch (err) {
            console.error('Failed to save address', err);
        } finally {
            setSavingAddr(false);
        }
    };

    const handleEditAddr = (addr) => {
        setAddrForm({
            label: addr.label, fullName: addr.fullName, mobile: addr.mobile,
            street: addr.street, city: addr.city, state: addr.state,
            pincode: addr.pincode, landmark: addr.landmark, isDefault: addr.isDefault,
        });
        setEditingAddr(addr._id);
        setShowAddrForm(true);
    };

    const handleDeleteAddr = async (id) => {
        try {
            await API.delete(`/auth/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a._id !== id));
        } catch (err) {
            console.error('Failed to delete address', err);
        }
    };

    const handleSetDefault = async (id) => {
        try {
            const { data } = await API.put(`/auth/addresses/${id}/default`);
            if (data.success) {
                setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
            }
        } catch (err) {
            console.error('Failed to set default', err);
        }
    };

    const resetAddrForm = () => {
        setAddrForm({
            label: 'Home', fullName: customer?.name || '', mobile: customer?.mobile || '',
            street: '', city: '', state: '', pincode: '', landmark: '', isDefault: false,
        });
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const renderContent = () => {
        // ORDERS TAB
        if (activeTab === 'orders') {
            if (loadingOrders) {
                return (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                );
            }

            if (orders.length === 0) {
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto text-center p-12">
                        <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-10 mx-auto relative group">
                            <Package className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                            <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                0
                            </div>
                        </div>
                        <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase mb-3">No orders found.</h3>
                        <p className="text-gray-400 font-bold text-sm leading-relaxed mb-10 opacity-80 uppercase tracking-tighter">
                            Looks like your pantry is empty! Start your first order now.
                        </p>
                        <button
                            onClick={onViewHome}
                            className="bg-blue-600 text-white font-black px-10 py-5 rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-xs active:scale-95"
                        >
                            Browse Menu
                        </button>
                    </div>
                );
            }

            return (
                <div className="p-6 space-y-4 overflow-y-auto">
                    {orders.map(order => {
                        const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                        const StatusIcon = statusInfo.icon;
                        const isExpanded = expandedOrder === order._id;
                        const payMethod = order.paymentMethods?.[0]?.method || 'cash';

                        return (
                            <div key={order._id} className="bg-[#f8f9fa] rounded-2xl border border-gray-100 overflow-hidden">
                                {/* Order Header */}
                                <button
                                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-black text-sm">{order.invoiceNo}</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                            {order.storeName && (
                                                <p className="text-[10px] text-blue-600 font-bold mt-0.5 flex items-center gap-1">
                                                    <StoreIcon className="w-3 h-3" /> {order.storeName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-blue-600">{formatCurrency(order.grandTotal)}</p>
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase mt-1 ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}>
                                                <StatusIcon className="w-3 h-3" /> {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                                        <span>{PAYMENT_LABELS[payMethod] || payMethod}</span>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                </button>

                                {/* Expanded Invoice */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 p-4 space-y-3 animate-in fade-in duration-200">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="font-bold text-gray-700 flex-1">
                                                    {item.name} <span className="text-gray-400">x{item.quantity}</span>
                                                </span>
                                                <span className="font-bold">{formatCurrency(item.total)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span className="font-bold">{formatCurrency(order.subtotal)}</span>
                                            </div>
                                            {order.totalGST > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">GST</span>
                                                    <span className="font-bold">{formatCurrency(order.totalGST)}</span>
                                                </div>
                                            )}
                                            {order.discount > 0 && (
                                                <div className="flex justify-between text-amber-600">
                                                    <span>Discount</span>
                                                    <span className="font-bold">-{formatCurrency(order.discount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-200">
                                                <span>TOTAL</span>
                                                <span className="text-blue-600">{formatCurrency(order.grandTotal)}</span>
                                            </div>
                                        </div>
                                        {order.deliveryAddress?.street && (
                                            <div className="bg-white rounded-xl p-3 border border-gray-100 mt-2">
                                                <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                    <MapPin className="w-3 h-3" /> DELIVERED TO
                                                </div>
                                                <p className="font-bold text-xs">{order.deliveryAddress.fullName}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        // ADDRESSES TAB
        if (activeTab === 'addresses') {
            if (loadingAddresses) {
                return (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                );
            }

            return (
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Add Address Button */}
                    {!showAddrForm && (
                        <button
                            onClick={() => { resetAddrForm(); setEditingAddr(null); setShowAddrForm(true); }}
                            className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                            <Plus className="w-4 h-4" /> ADD NEW ADDRESS
                        </button>
                    )}

                    {/* Address Form */}
                    {showAddrForm && (
                        <form onSubmit={handleSaveAddress} className="bg-white rounded-2xl p-5 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                                    {editingAddr ? 'EDIT ADDRESS' : 'NEW ADDRESS'}
                                </h3>
                                <button type="button" onClick={() => { setShowAddrForm(false); setEditingAddr(null); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
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
                                <input type="text" placeholder="Full Name *" value={addrForm.fullName}
                                    onChange={e => setAddrForm(f => ({ ...f, fullName: e.target.value }))} required
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input type="tel" placeholder="Mobile *" value={addrForm.mobile}
                                    onChange={e => setAddrForm(f => ({ ...f, mobile: e.target.value }))} required
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input type="text" placeholder="Street / Area *" value={addrForm.street}
                                    onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))} required
                                    className="col-span-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input type="text" placeholder="City *" value={addrForm.city}
                                    onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} required
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input type="text" placeholder="State *" value={addrForm.state}
                                    onChange={e => setAddrForm(f => ({ ...f, state: e.target.value }))} required
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input type="text" placeholder="Pincode *" value={addrForm.pincode}
                                    onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} required
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                                <input type="text" placeholder="Landmark" value={addrForm.landmark}
                                    onChange={e => setAddrForm(f => ({ ...f, landmark: e.target.value }))}
                                    className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                />
                            </div>

                            <label className="flex items-center gap-2 mt-4 cursor-pointer">
                                <input type="checkbox" checked={addrForm.isDefault}
                                    onChange={e => setAddrForm(f => ({ ...f, isDefault: e.target.checked }))}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-xs font-bold text-gray-600 uppercase">Set as default</span>
                            </label>

                            <button
                                type="submit"
                                disabled={savingAddr}
                                className="w-full mt-4 bg-blue-600 text-white font-black uppercase tracking-widest py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {savingAddr ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAddr ? 'UPDATE ADDRESS' : 'SAVE ADDRESS')}
                            </button>
                        </form>
                    )}

                    {/* Address List */}
                    {addresses.length === 0 && !showAddrForm ? (
                        <div className="text-center py-12">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-black text-sm uppercase">No addresses saved</p>
                            <p className="text-gray-400 text-xs font-bold mt-1">Add your delivery address to get started</p>
                        </div>
                    ) : (
                        addresses.map(addr => {
                            const Icon = labelIcons[addr.label] || MoreHorizontal;
                            return (
                                <div key={addr._id} className="bg-white rounded-2xl p-4 border border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-full">
                                            <Icon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-xs uppercase">{addr.label}</span>
                                                {addr.isDefault && (
                                                    <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black uppercase">DEFAULT</span>
                                                )}
                                            </div>
                                            <p className="font-bold text-sm mt-0.5">{addr.fullName}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                            </p>
                                            <p className="text-xs text-gray-400">{addr.mobile}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                        <button onClick={() => handleEditAddr(addr)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                                            Edit
                                        </button>
                                        <span className="text-gray-200">|</span>
                                        {!addr.isDefault && (
                                            <>
                                                <button onClick={() => handleSetDefault(addr._id)}
                                                    className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider">
                                                    Set Default
                                                </button>
                                                <span className="text-gray-200">|</span>
                                            </>
                                        )}
                                        <button onClick={() => handleDeleteAddr(addr._id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            );
        }

        // PLACEHOLDER TABS
        const tab = tabs.find(t => t.id === activeTab);
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="flex flex-col items-center opacity-40">
                    <tab.icon className="w-16 h-16 mb-6" />
                    <p className="font-black italic text-gray-400 uppercase tracking-widest">
                        {tab?.label} CONTENT IS COMING SOON...
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#f4f6f8] min-h-screen pb-24 pt-6 animate-fade-in">
            <div className="max-w-[1240px] mx-auto px-4 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-[320px] flex-shrink-0 flex flex-col gap-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">
                                    {customer?.name?.split(' ')[0] || 'GUEST'}
                                </h2>
                                <p className="text-gray-400 text-xs font-bold tracking-widest">{customer?.mobile || 'No Mobile'}</p>
                            </div>
                        </div>

                        <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-800 uppercase tracking-tighter">
                                    <Wallet className="w-4 h-4 text-blue-600" />
                                    Gopuff Cash
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                    Balance: <span className="font-black text-gray-900 ml-1">₹0.00</span>
                                </div>
                                <button className="bg-black text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-widest">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden py-4 hidden md:block border border-gray-100">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-8 py-5 text-xs font-black transition-all uppercase tracking-widest italic group ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-600 border-l-[6px] border-blue-600'
                                    : 'text-gray-500 hover:bg-gray-50 border-l-[6px] border-transparent'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 opacity-60'}`} />
                                {tab.label}
                            </button>
                        ))}
                        <div className="px-8 py-6 mt-4 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full text-red-500 font-black text-[10px] border-2 border-red-100 rounded-2xl px-6 py-3 hover:bg-red-50 hover:border-red-200 transition-all uppercase tracking-[0.2em]"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm min-h-[600px] flex flex-col border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
                        <button onClick={onViewHome} className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden">
                            <ChevronLeft className="w-6 h-6 text-gray-900" />
                        </button>
                        <h1 className="text-xl font-black italic tracking-tighter text-gray-900 uppercase">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountView;
