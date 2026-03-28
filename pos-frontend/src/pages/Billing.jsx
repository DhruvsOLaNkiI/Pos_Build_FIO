import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    QrCode,
    Printer,
    ChevronRight,
    X,
    LayoutGrid,
    Headphones,
    Smartphone,
    Shirt,
    Coffee,
    Utensils,
    MonitorSmartphone,
    Watch,
    Pause,
    ClipboardList,
    Clock,
    RotateCcw,
    AlertTriangle,
    Monitor,
    Loader2,
    ArrowLeftRight,
    User
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

const Billing = () => {
    const { user, activeStore } = useAuth();
    const { toast } = useToast();

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // Wait 300ms
    const [cart, setCart] = useState([]);
    const [cartGstPercent, setCartGstPercent] = useState(0); // Cart-level GST
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [processing, setProcessing] = useState(false);
    const [cashGiven, setCashGiven] = useState('');

    // Session & Register State
    const [activeRegister, setActiveRegister] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [allRegisters, setAllRegisters] = useState([]);
    const [isSelectRegisterOpen, setIsSelectRegisterOpen] = useState(false);
    const [openingBalanceInput, setOpeningBalanceInput] = useState('');
    const [pendingRegister, setPendingRegister] = useState(null); // register waiting for opening balance
    const [switchingRegister, setSwitchingRegister] = useState(false);

    // Filter & Order State
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [orderId, setOrderId] = useState(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);

    // Offers & Discounts State
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);

    // Variant Selection State
    const [selectedVariantGroup, setSelectedVariantGroup] = useState(null);

    // Invoice state
    const [lastSale, setLastSale] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const invoiceRef = useRef(null);

    // Held Orders state
    const [heldOrders, setHeldOrders] = useState([]);
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [holdNote, setHoldNote] = useState('');

    const searchInputRef = useRef(null);

    useEffect(() => {
        if (activeStore) {
            checkActiveSession();
        }
        fetchProducts();
        fetchHeldOrders();
        fetchOffers();
        searchInputRef.current?.focus();
    }, [activeStore]);

    const checkActiveSession = async () => {
        setCheckingSession(true);
        try {
            const { data } = await API.get(`/registers?storeId=${activeStore}`);
            if (data.success && data.data) {
                setAllRegisters(data.data);
                // Find if this user has an active session
                const activeReg = data.data.find(r => 
                    r.activeSession && 
                    r.activeSession.cashierId._id === user._id
                );
                setActiveRegister(activeReg || null);
                // If no active session, auto-prompt register selection
                if (!activeReg && data.data.length > 0) {
                    setIsSelectRegisterOpen(true);
                }
            }
        } catch (error) {
            console.error('Failed to check register session', error);
        } finally {
            setCheckingSession(false);
        }
    };

    const handleSelectRegister = (reg) => {
        if (reg.activeSession && reg.activeSession.cashierId._id !== user._id) {
            toast({ title: 'Counter In Use', description: `This counter is currently used by ${reg.activeSession.cashierId.name}`, variant: 'destructive' });
            return;
        }
        if (reg.activeSession && reg.activeSession.cashierId._id === user._id) {
            // Already this user's session, just switch to it
            setActiveRegister(reg);
            setIsSelectRegisterOpen(false);
            setPendingRegister(null);
            toast({ title: 'Counter Selected', description: `Now billing on ${reg.name}` });
            return;
        }
        // No active session — ask for opening balance
        setPendingRegister(reg);
        setOpeningBalanceInput('');
    };

    const handleOpenSession = async () => {
        if (!pendingRegister) return;
        setSwitchingRegister(true);
        try {
            await API.post(`/registers/${pendingRegister._id}/open-session`, {
                openingBalance: Number(openingBalanceInput) || 0,
                deviceInfo: navigator.userAgent
            });
            toast({ title: 'Session Opened', description: `${pendingRegister.name} is now active with ₹${Number(openingBalanceInput) || 0} opening balance` });
            setPendingRegister(null);
            setIsSelectRegisterOpen(false);
            setOpeningBalanceInput('');
            // Refresh registers
            await checkActiveSession();
        } catch (error) {
            toast({ title: 'Failed', description: error.response?.data?.message || 'Could not open session', variant: 'destructive' });
        } finally {
            setSwitchingRegister(false);
        }
    };

    const fetchOffers = async () => {
        try {
            const { data } = await API.get('/loyalty/offers');
            // Store active offers
            setOffers(data.data.filter(o => o.isActive));
        } catch (error) {
            console.error('Failed to fetch offers', error);
        }
    };

    const fetchHeldOrders = async () => {
        try {
            const { data } = await API.get('/held-orders');
            setHeldOrders(data.data);
        } catch (error) {
            console.error('Failed to fetch held orders', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await API.get('/products');
            setProducts(data.data);
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find((item) => item._id === product._id);
        if (existingItem) {
            if (existingItem.quantity >= product.stockQty) {
                toast({ title: 'Out of stock', description: 'Cannot add more than available stock', variant: 'destructive' });
                return;
            }
            setCart(
                cart.map((item) =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            if (product.stockQty <= 0) {
                toast({ title: 'Out of stock', description: 'This product is currently unavailable', variant: 'destructive' });
                return;
            }
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setSearchTerm('');
    };

    const updateQuantity = (id, delta) => {
        setCart(
            cart.map((item) => {
                if (item._id === id) {
                    const newQty = item.quantity + delta;
                    const product = products.find(p => p._id === id);
                    if (newQty > product.stockQty) {
                        toast({ title: 'Stock limit', description: 'Reached maximum available stock', variant: 'destructive' });
                        return item;
                    }
                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            })
        );
    };

    const removeFromCart = (id) => {
        setCart(cart.filter((item) => item._id !== id));
    };

    const calculateSubtotal = () => {
        return cart.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * (cartGstPercent / 100);
    };

    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const rawTotal = subtotal + tax;

    // Auto-calculate discount if an offer is selected
    useEffect(() => {
        if (!selectedOffer) {
            setDiscount(0);
            return;
        }

        // Check if criteria still met
        if (rawTotal < selectedOffer.minPurchaseAmount) {
            setDiscount(0);
            setSelectedOffer(null);
            toast({
                title: 'Offer Removed',
                description: `Cart total dropped below ₹${selectedOffer.minPurchaseAmount}`,
                variant: 'destructive',
            });
            return;
        }

        let calcDiscount = 0;
        if (selectedOffer.type === 'percentage') {
            calcDiscount = (rawTotal * selectedOffer.discountValue) / 100;
            if (selectedOffer.maxDiscountAmount) {
                calcDiscount = Math.min(calcDiscount, selectedOffer.maxDiscountAmount);
            }
        } else {
            calcDiscount = selectedOffer.discountValue;
        }

        setDiscount(calcDiscount);
    }, [selectedOffer, rawTotal]);

    const total = Math.max(0, rawTotal - (Number(discount) || 0));

    const handleCheckout = async () => {
        try {
            setProcessing(true);
            
            const finalCashGiven = Number(cashGiven) || 0;
            const changeGiven = paymentMethod === 'cash' ? Math.max(0, finalCashGiven - total) : 0;
            
            const payload = {
                items: cart.map((item) => ({
                    productId: item._id,
                    quantity: item.quantity,
                })),
                paymentMethods: [{ method: paymentMethod, amount: total }],
                discount: (Number(discount) || 0),
                cartGstPercent: (Number(cartGstPercent) || 0),
                customerName,
                customerPhone,
                registerId: activeRegister ? activeRegister._id : undefined,
                cashGiven: finalCashGiven,
                changeGiven
            };

            const { data } = await API.post('/sales', payload);

            toast({
                title: 'Success',
                description: `Sale completed! Invoice: ${data.data.invoiceNo}`,
            });

            setLastSale({
                ...data.data,
                customerName: customerName || 'Walk-in Customer',
                customerPhone: customerPhone || '-',
                paymentMethod: paymentMethod,
                cashGiven: finalCashGiven,
                changeGiven,
            });
            setIsCheckoutOpen(false);
            setIsInvoiceOpen(true);
            fetchProducts();
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Transaction failed';
            if (errMsg.includes('duplicate key') && errMsg.includes('mobile')) {
                toast({
                    title: 'Error',
                    description: 'Customer with this number already exists but has different details. Please verify.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Error',
                    description: errMsg,
                    variant: 'destructive',
                });
            }
        } finally {
            setProcessing(false);
        }
    };

    const closeInvoice = () => {
        setIsInvoiceOpen(false);
        setLastSale(null);
        setCart([]);
        setCartGstPercent(0);
        setDiscount(0);
        setSelectedOffer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCashGiven('');
        setOrderId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
    };

    const handleHoldOrder = async () => {
        if (cart.length === 0) {
            toast({ title: 'Cart Empty', description: 'Cannot hold an empty cart', variant: 'destructive' });
            return;
        }

        try {
            setProcessing(true);
            const payload = {
                cart,
                subtotal,
                discount,
                tax,
                cartGstPercent,
                total,
                customer: null, // Note: We could attach a selected customer here if we implemented complex customer selection
                note: holdNote
            };

            await API.post('/held-orders', payload);
            toast({ title: 'Order Held', description: 'Cart saved successfully' });

            // Clear current screen for next customer
            setCart([]);
            setCartGstPercent(0);
            setDiscount(0);
            setCustomerName('');
            setCustomerPhone('');
            setHoldNote('');
            setIsHoldModalOpen(false);
            setOrderId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);

            // Refresh held orders list
            fetchHeldOrders();
        } catch (error) {
            toast({ title: 'Hold Failed', description: error.response?.data?.message || 'Failed to hold order', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const handleRecallOrder = async (order) => {
        if (cart.length > 0) {
            if (!confirm('You have items in your current cart. Recalling a held order will overwrite them. Proceed?')) return;
        }

        try {
            setProcessing(true);
            setCart(order.cart);
            setCartGstPercent(order.cartGstPercent || 0);
            setDiscount(order.discount || 0);

            // Optional: If you had customer info in the held order, restore it
            if (order.customer?.name) setCustomerName(order.customer.name);
            if (order.customer?.phone) setCustomerPhone(order.customer.phone);

            // Delete it from the DB since it's now active
            await API.delete(`/held-orders/${order._id}`);
            setIsRecallModalOpen(false);

            toast({ title: 'Order Recalled', description: 'Cart restored successfully' });
            fetchHeldOrders(); // Refresh list
        } catch (error) {
            toast({ title: 'Recall Failed', description: 'Could not restore the held order', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteHeldOrder = async (id) => {
        if (!confirm('Are you sure you want to discard this held order?')) return;
        try {
            await API.delete(`/held-orders/${id}`);
            toast({ title: 'Deleted', description: 'Held order removed' });
            fetchHeldOrders();
        } catch (error) {
            toast({ title: 'Delete Failed', description: 'Could not remove held order', variant: 'destructive' });
        }
    };

    const handlePrintInvoice = () => {
        if (!lastSale) return;
        const printWindow = window.open('', '_blank');

        const itemsHtml = lastSale.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${item.price.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">${item.total.toFixed(2)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Order ${lastSale.invoiceNo}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 320px; margin: 0 auto; color: #000; font-size: 12px; }
                    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
                    .header h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
                    .header p { font-size: 12px; font-weight: bold; }
                    .info { margin-bottom: 12px; }
                    .info div { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .info span:first-child { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                    th { text-align: left; border-bottom: 1px dashed #000; border-top: 1px dashed #000; padding: 6px 0; font-size: 12px; font-weight: 900; }
                    td { padding: 6px 0; font-size: 12px; vertical-align: top; }
                    .totals { border-top: 1px dashed #000; padding-top: 8px; }
                    .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .grand-total { font-size: 18px; font-weight: 900; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #000; }
                    .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 12px; font-size: 12px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>POS System</h1>
                    <p>Tax Invoice / Receipt</p>
                </div>
                <div class="info">
                    <div><span>Order ID:</span> <span>${lastSale.invoiceNo}</span></div>
                    <div><span>Date:</span> <span>${new Date(lastSale.createdAt).toLocaleDateString('en-IN')} ${new Date(lastSale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div><span>Cashier:</span> <span>${user?.name || '-'}</span></div>
                    <div><span>Customer:</span> <span>${lastSale.customerName || 'Walk-in'}</span></div>
                    <div><span>Phone:</span> <span>${lastSale.customerPhone || '-'}</span></div>
                    <div><span>Payment:</span> <span style="text-transform: uppercase;">${lastSale.paymentMethod}</span></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div class="totals">
                    <div><span>Subtotal</span> <span>${lastSale.subtotal.toFixed(2)}</span></div>
                    <div><span>GST/Tax</span> <span>${lastSale.totalGST.toFixed(2)}</span></div>
                    ${lastSale.discount > 0 ? `<div><span>Discount / Offer Applied</span> <span>-${lastSale.discount.toFixed(2)}</span></div>` : ''}
                    <div class="grand-total"><span>Grand Total</span> <span>Rs. ${lastSale.grandTotal.toFixed(2)}</span></div>
                </div>
                <div class="footer">
                    <p>Thank you for your purchase!</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        // Tiny delay to ensure styles render before print dialogue
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 200);
    };

    const filteredProducts = debouncedSearchTerm
        ? products.filter(
            (p) =>
                p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                p.barcode?.includes(debouncedSearchTerm)
        )
        : [];

    // Group products for the quick access grid
    const groupedProducts = (() => {
        const groups = {};
        products.forEach(p => {
            if (selectedCategory !== 'All' && p.category !== selectedCategory) return;
            const key = (p.name || 'Unnamed Product').trim().toLowerCase();
            if (!groups[key]) {
                groups[key] = {
                    key,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    imageUrl: p.imageUrl,
                    items: [],
                    totalStock: 0,
                    minPrice: p.sellingPrice,
                    maxPrice: p.sellingPrice,
                };
            }
            groups[key].items.push(p);
            groups[key].totalStock += p.stockQty;
            if (p.sellingPrice < groups[key].minPrice) groups[key].minPrice = p.sellingPrice;
            if (p.sellingPrice > groups[key].maxPrice) groups[key].maxPrice = p.sellingPrice;

            if (p.brand && groups[key].brand && groups[key].brand !== p.brand && groups[key].brand !== 'Multiple Brands') {
                groups[key].brand = 'Multiple Brands';
            } else if (!groups[key].brand && p.brand) {
                groups[key].brand = p.brand;
            }
        });
        return Object.values(groups).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    })();

    const handleProductClick = (group) => {
        if (group.items.length === 1) {
            addToCart(group.items[0]);
        } else {
            setSelectedVariantGroup(group);
        }
    };

    // React-driven hover state (no CSS transitions = no flicker)
    const [hoveredKey, setHoveredKey] = useState(null);

    // Category color mapping for visual distinction
    const getCategoryColor = (cat) => {
        const colors = {
            dairy: '#3b82f6', beverages: '#f59e0b', biscuits: '#ec4899',
            staples: '#8b5cf6', noodles: '#ef4444', grocery: '#10b981',
            chocolates: '#a855f7', electronics: '#06b6d4', household: '#64748b',
            'home care': '#14b8a6', default: '#6b7280'
        };
        return colors[(cat || '').toLowerCase()] || colors.default;
    };

    // Extract unique categories for sidebar
    const uniqueCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))].sort();

    // Map categories to icons
    const getCategoryIcon = (cat) => {
        const c = cat.toLowerCase();
        if (c === 'all') return <LayoutGrid className="w-5 h-5 mb-1" />;
        if (c.includes('headset') || c.includes('audio') || c.includes('ear')) return <Headphones className="w-5 h-5 mb-1" />;
        if (c.includes('mobile') || c.includes('phone')) return <Smartphone className="w-5 h-5 mb-1" />;
        if (c.includes('shoe') || c.includes('cloth') || c.includes('apparel')) return <Shirt className="w-5 h-5 mb-1" />;
        if (c.includes('watch') || c.includes('wearable')) return <Watch className="w-5 h-5 mb-1" />;
        if (c.includes('coffee') || c.includes('drink') || c.includes('beverage')) return <Coffee className="w-5 h-5 mb-1" />;
        if (c.includes('food') || c.includes('grocery') || c.includes('dairy')) return <Utensils className="w-5 h-5 mb-1" />;
        if (c.includes('electron') || c.includes('laptop') || c.includes('tv')) return <MonitorSmartphone className="w-5 h-5 mb-1" />;

        // Default icon
        return <LayoutGrid className="w-5 h-5 mb-1" />;
    };

    return (
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

            {/* FAR-LEFT - Category Sidebar */}
            <div style={{
                width: '100px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
                paddingRight: '6px'
            }} className="category-scrollbar-hide">
                {uniqueCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '16px 8px', borderRadius: '12px', border: '1px solid hsl(var(--border))',
                            background: selectedCategory === cat ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                            color: selectedCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: selectedCategory === cat ? 700 : 500,
                            boxShadow: selectedCategory === cat ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}
                        className="hover:bg-muted"
                    >
                        {getCategoryIcon(cat)}
                        <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.2' }}>{cat}</span>
                    </button>
                ))}
            </div>

            {/* MIDDLE - Products */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>POS Terminal</h1>
                        {activeRegister ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
                                    <Monitor className="w-3.5 h-3.5" />
                                    {activeRegister.name}
                                </span>
                                <span className="text-[11px] font-medium px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1.5 border border-blue-100">
                                    <User className="w-3.5 h-3.5" />
                                    {user?.name}
                                </span>
                                <button
                                    onClick={() => { setPendingRegister(null); setIsSelectRegisterOpen(true); }}
                                    className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1.5 hover:bg-slate-200 transition-colors border border-slate-200"
                                >
                                    <ArrowLeftRight className="w-3.5 h-3.5" /> Switch
                                </button>
                            </div>
                        ) : !checkingSession ? (
                            <button
                                onClick={() => setIsSelectRegisterOpen(true)}
                                className="text-[11px] font-bold uppercase px-3 py-1.5 bg-red-100 text-red-800 rounded-full flex items-center gap-1.5 shadow-sm border border-red-200 hover:bg-red-200 transition-colors cursor-pointer"
                            >
                                <AlertTriangle className="w-3 h-3" />
                                No Counter Selected — Click to Select
                            </button>
                        ) : null}
                        {heldOrders.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 font-bold"
                                onClick={() => setIsRecallModalOpen(true)}
                            >
                                <ClipboardList className="w-4 h-4" />
                                Recall Orders ({heldOrders.length})
                            </Button>
                        )}
                    </div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.5, fontWeight: 600 }}>
                        Operator: {user?.name}
                    </span>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', opacity: 0.4 }} />
                    <input
                        ref={searchInputRef}
                        placeholder="Search by name or barcode (Press / to focus)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '14px 14px 14px 44px', fontSize: '15px',
                            border: '1px solid hsl(var(--border))', borderRadius: '12px',
                            background: 'hsl(var(--card))', color: 'inherit', outline: 'none',
                        }}
                    />

                    {/* Search Dropdown */}
                    {searchTerm && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                            borderRadius: '12px', zIndex: 50, maxHeight: '350px', overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}>
                            {filteredProducts.length > 0 ? (
                                <div style={{ padding: '6px' }}>
                                    {filteredProducts.map((p) => (
                                        <button
                                            key={p._id}
                                            onClick={() => addToCart(p)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent',
                                                color: 'inherit', cursor: 'pointer', textAlign: 'left',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '14px' }}>
                                                    {p.name}
                                                    {p.variant && (
                                                        <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontWeight: 700 }}>
                                                            {p.variant}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>{p.category} • {p.barcode}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: '16px' }}>₹{p.sellingPrice}</div>
                                                <div style={{ fontSize: '11px', opacity: 0.5 }}>Stock: {p.stockQty}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.4 }}>
                                    No products found for "{searchTerm}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Product Grid */}
                {!searchTerm && (
                    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                            {groupedProducts.map((group) => {
                                const isHovered = hoveredKey === group.key;
                                const catColor = getCategoryColor(group.category);
                                return (
                                    <button
                                        key={group.key}
                                        onClick={() => handleProductClick(group)}
                                        onMouseEnter={() => setHoveredKey(group.key)}
                                        onMouseLeave={() => setHoveredKey(null)}
                                        style={{
                                            display: 'flex', alignItems: 'stretch', position: 'relative',
                                            border: `1.5px solid ${isHovered ? catColor : 'hsl(var(--border))'}`,
                                            borderRadius: '10px', overflow: 'hidden',
                                            background: isHovered ? `${catColor}10` : 'hsl(var(--card))',
                                            cursor: 'pointer', textAlign: 'left', color: 'inherit',
                                            padding: 0, minHeight: '80px',
                                        }}
                                    >
                                        {/* Variant badge - top right of tile */}
                                        {group.items.length > 1 && (
                                            <span style={{
                                                position: 'absolute', top: '6px', right: '6px', zIndex: 2,
                                                fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                                                borderRadius: '4px', background: `${catColor}20`, color: catColor,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {group.items.length}V
                                            </span>
                                        )}

                                        {/* Color stripe always visible */}
                                        <div style={{ width: '5px', background: catColor, flexShrink: 0 }} />

                                        {/* Optional Image */}
                                        {group.imageUrl && (
                                            <div style={{ width: '70px', flexShrink: 0 }}>
                                                <img
                                                    src={group.imageUrl.startsWith('http') ? group.imageUrl : `http://localhost:5001${group.imageUrl}`}
                                                    alt={group.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: '1.3', flex: 1, paddingRight: group.items.length > 1 ? '30px' : '0' }}>
                                                    {group.name}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '10px', opacity: 0.45, textTransform: 'capitalize' }}>
                                                {group.category}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                                <span style={{ fontWeight: 800, fontSize: '15px' }}>
                                                    ₹{group.minPrice}{group.minPrice !== group.maxPrice ? ` - ${group.maxPrice}` : ''}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 600, padding: '1px 7px',
                                                    borderRadius: '99px',
                                                    background: group.totalStock <= 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                                                    color: group.totalStock <= 0 ? '#ef4444' : '#22c55e',
                                                }}>
                                                    {group.totalStock}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT - Cart */}
            <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    border: '1px solid hsl(var(--border))', borderRadius: '14px',
                    background: 'hsl(var(--card))',
                }}>
                    {/* Cart Header */}
                    <div style={{
                        padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '16px' }}>
                            <ShoppingCart style={{ width: '18px', height: '18px' }} />
                            Order List
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 800, padding: '3px 8px', letterSpacing: '0.5px',
                                borderRadius: '6px', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'
                            }}>
                                #{orderId}
                            </span>
                            <button
                                aria-label="Clear Cart"
                                onClick={() => setCart([])}
                                style={{
                                    border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                                    borderRadius: '6px'
                                }}
                                className="hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                                <Trash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                        {cart.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                <ShoppingCart style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
                                <p>Empty</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item._id} style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border) / 0.3)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: '1.3' }}>
                                            {item.name}
                                            {item.variant && (
                                                <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontWeight: 700 }}>
                                                    {item.variant}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>₹{item.sellingPrice} each</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
                                        <button onClick={() => updateQuantity(item._id, -1)} style={{ padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit' }}>
                                            <Minus style={{ width: '12px', height: '12px' }} />
                                        </button>
                                        <span style={{ width: '28px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, 1)} style={{ padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit' }}>
                                            <Plus style={{ width: '12px', height: '12px' }} />
                                        </button>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '13px', minWidth: '60px', textAlign: 'right' }}>
                                        ₹{(item.sellingPrice * item.quantity).toFixed(0)}
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item._id)}
                                        style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#ef4444', borderRadius: '6px' }}
                                    >
                                        <Trash2 style={{ width: '14px', height: '14px' }} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals */}
                    <div style={{ padding: '14px 16px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                            <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.6, marginBottom: '4px', alignItems: 'center' }}>
                            <span>GST</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select
                                    value={cartGstPercent}
                                    onChange={(e) => setCartGstPercent(Number(e.target.value))}
                                    style={{ padding: '2px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                                >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                </select>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.6, marginBottom: '8px', alignItems: 'center' }}>
                            <span>Discount / Offer</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select
                                    value={selectedOffer?._id || ''}
                                    onChange={(e) => {
                                        const offerId = e.target.value;
                                        if (!offerId) {
                                            setSelectedOffer(null);
                                        } else {
                                            const offer = offers.find(o => o._id === offerId);
                                            setSelectedOffer(offer || null);
                                        }
                                    }}
                                    style={{
                                        fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
                                        border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                        color: 'inherit', outline: 'none', maxWidth: '140px'
                                    }}
                                >
                                    <option value="">No Offer</option>
                                    {offers.map(offer => {
                                        const isDisabled = rawTotal < offer.minPurchaseAmount;
                                        return (
                                            <option key={offer._id} value={offer._id} disabled={isDisabled}>
                                                {offer.name} {isDisabled ? `(Min ₹${offer.minPurchaseAmount})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <span style={{ fontWeight: 700, minWidth: '40px', textAlign: 'right', color: discount > 0 ? '#10b981' : 'inherit' }}>
                                    - ₹{discount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid hsl(var(--border))', paddingTop: '10px', fontWeight: 900 }}>
                            <span style={{ fontSize: '16px' }}>Total</span>
                            <span style={{ fontSize: '26px', color: 'hsl(var(--primary))' }}>₹{total.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <Button
                                variant="outline"
                                className="h-12 w-14 rounded-xl shrink-0 text-amber-600 border-amber-200 hover:bg-amber-50"
                                disabled={cart.length === 0}
                                onClick={() => setIsHoldModalOpen(true)}
                                title="Hold Order"
                            >
                                <Pause className="w-5 h-5" />
                            </Button>
                            <Button
                                className="flex-1 h-12 text-lg font-bold rounded-xl"
                                disabled={cart.length === 0}
                                onClick={() => setIsCheckoutOpen(true)}
                            >
                                Checkout <ChevronRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hold Order Modal */}
            <Dialog open={isHoldModalOpen} onOpenChange={setIsHoldModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hold Order</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Pause this transaction to serve another customer. The cart will be cleared and saved.
                        </p>
                        <div className="space-y-2">
                            <Label>Reference Note (Optional)</Label>
                            <Input
                                placeholder="e.g., Man in blue shirt, grab wallet"
                                value={holdNote}
                                onChange={(e) => setHoldNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsHoldModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleHoldOrder} disabled={processing}>Confirm Hold</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Recall Order Modal */}
            <Dialog open={isRecallModalOpen} onOpenChange={setIsRecallModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Recall Held Orders</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 max-h-[60vh] overflow-y-auto">
                        {heldOrders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                                <ClipboardList className="w-12 h-12 mb-2 opacity-20" />
                                <p>No held orders currently.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {heldOrders.map((order) => (
                                    <div key={order._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg">₹{order.total.toFixed(2)}</h4>
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{order.cart.length} items</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {order.note && <span className="italic">"{order.note}"</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteHeldOrder(order._id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button className="gap-2" onClick={() => handleRecallOrder(order)} disabled={processing}>
                                                <RotateCcw className="w-4 h-4" /> Resume
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Modal */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Finalize Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="bg-primary/5 p-6 rounded-2xl text-center border border-primary/10">
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Payable Amount</p>
                            <h2 className="text-5xl font-black text-primary mt-2">₹{total.toFixed(2)}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Customer Phone</Label>
                                <Input
                                    placeholder="Enter mobile number"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Customer Name</Label>
                                <Input
                                    placeholder="Enter name (optional)"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Payment Method</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 ${paymentMethod === 'cash'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <Banknote className="mb-2 w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">Cash</span>
                                </button>
                                <button
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 ${paymentMethod === 'card'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <CreditCard className="mb-2 w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">Card</span>
                                </button>
                                <button
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 ${paymentMethod === 'upi'
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground'
                                        }`}
                                    onClick={() => setPaymentMethod('upi')}
                                >
                                    <QrCode className="mb-2 w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">UPI</span>
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="bg-slate-50 border p-4 rounded-xl space-y-3 mt-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cash Given By Customer</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={cashGiven}
                                            onChange={(e) => setCashGiven(e.target.value)}
                                            className="w-full h-12 pl-8 pr-4 rounded-lg border-slate-300 font-bold text-lg"
                                            placeholder="0"
                                            min={total}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm pt-2">
                                    <span className="font-semibold text-slate-600">Change to Return:</span>
                                    <span className={`font-black text-xl ${cashGiven && Number(cashGiven) >= total ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        ₹{cashGiven && Number(cashGiven) >= total ? (Number(cashGiven) - total).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-3 sm:flex-col sm:space-x-0">
                        {!activeRegister && (
                            <div className="bg-red-50 text-red-800 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 border border-red-200 w-full mb-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <p>You do not have an open register session. Sales cannot be securely tracked. Please assign a register first.</p>
                            </div>
                        )}
                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-bold gap-2"
                            onClick={handleCheckout}
                            disabled={processing || (!activeRegister && user?.role !== 'owner')} // Allow owners to bypass restrict
                        >
                            <Printer className="w-5 h-5" /> {processing ? 'Processing...' : 'Complete & Print'}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full rounded-xl"
                            onClick={() => setIsCheckoutOpen(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice/Receipt Dialog */}
            <Dialog open={isInvoiceOpen} onOpenChange={(open) => { if (!open) closeInvoice(); }}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="w-5 h-5" /> Invoice Receipt
                        </DialogTitle>
                    </DialogHeader>

                    {lastSale && (
                        <div ref={invoiceRef} className="space-y-4">
                            <div className="text-center border-b border-dashed border-border pb-4">
                                <h2 className="text-2xl font-black">POS System</h2>
                                <p className="text-xs text-muted-foreground">Tax Invoice / Receipt</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Order ID: </span>
                                    <span className="font-mono font-bold">{lastSale.invoiceNo}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground">Date: </span>
                                    <span className="font-mono">{new Date(lastSale.createdAt).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Cashier: </span>
                                    <span className="font-medium">{user?.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground">Payment: </span>
                                    <span className="font-medium uppercase">{lastSale.paymentMethod}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Customer: </span>
                                    <span className="font-medium">{lastSale.customerName}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground">Phone: </span>
                                    <span className="font-mono">{lastSale.customerPhone}</span>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted text-xs">
                                            <th className="text-left p-2 font-bold">Item</th>
                                            <th className="text-center p-2 font-bold">Qty</th>
                                            <th className="text-right p-2 font-bold">Price</th>
                                            <th className="text-right p-2 font-bold">GST%</th>
                                            <th className="text-right p-2 font-bold">GST Amt</th>
                                            <th className="text-right p-2 font-bold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lastSale.items.map((item, i) => {
                                            const baseAmount = item.price * item.quantity;
                                            const gstAmount = baseAmount * ((item.gstPercent || 0) / 100);
                                            return (
                                                <tr key={i} className="border-t border-border/50">
                                                    <td className="p-2 font-medium">{item.name}</td>
                                                    <td className="p-2 text-center">{item.quantity}</td>
                                                    <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                                                    <td className="p-2 text-right">{item.gstPercent || 0}%</td>
                                                    <td className="p-2 text-right">₹{gstAmount.toFixed(2)}</td>
                                                    <td className="p-2 text-right font-bold">₹{item.total.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2 border-t border-dashed border-border pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{lastSale.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total GST</span>
                                    <span>₹{lastSale.totalGST.toFixed(2)}</span>
                                </div>
                                {lastSale.paymentMethod === 'cash' && lastSale.cashGiven && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Cash Given</span>
                                            <span>₹{lastSale.cashGiven.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                            <span>Change Returned</span>
                                            <span>₹{lastSale.changeGiven.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                                {lastSale.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            Discount / Offer Applied
                                        </span>
                                        <span className="text-green-500 font-bold">-₹{lastSale.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-baseline pt-2 border-t border-border font-black">
                                    <span className="text-lg">Grand Total</span>
                                    <span className="text-2xl text-primary">₹{lastSale.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="text-center border-t border-dashed border-border pt-4">
                                <p className="text-sm font-bold">Thank you for your purchase!</p>
                                <p className="text-xs text-muted-foreground mt-1">This is a computer-generated invoice</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:flex-row">
                        <Button variant="outline" className="flex-1 gap-2" onClick={closeInvoice}>
                            <X className="w-4 h-4" /> Close
                        </Button>
                        <Button className="flex-1 gap-2" onClick={handlePrintInvoice}>
                            <Printer className="w-4 h-4" /> Print Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Variant Selection Dialog */}
            <Dialog open={!!selectedVariantGroup} onOpenChange={() => setSelectedVariantGroup(null)}>
                <DialogContent className="max-w-md sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{selectedVariantGroup?.name}</DialogTitle>
                        <p className="text-muted-foreground text-sm">Select a variant to add to cart</p>
                    </DialogHeader>

                    <div className="py-2 max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                        {selectedVariantGroup?.items.map((variant) => (
                            <div
                                key={variant._id}
                                className={`p-4 border rounded-xl flex items-center justify-between ${variant.stockQty > 0
                                    ? 'cursor-pointer'
                                    : 'opacity-60 bg-muted/30 cursor-not-allowed'
                                    }`}
                                onClick={() => {
                                    if (variant.stockQty > 0) {
                                        addToCart(variant);
                                        setSelectedVariantGroup(null);
                                    }
                                }}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold">{variant.variant || 'Default'}</span>
                                        {variant.stockQty <= variant.minStockLevel && variant.stockQty > 0 && (
                                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
                                                Low Stock
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Barcode: {variant.barcode || 'N/A'}</div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <div>
                                        <div className="font-bold text-lg">₹{variant.sellingPrice}</div>
                                        <div className={`text-xs font-medium ${variant.stockQty > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {variant.stockQty} left
                                        </div>
                                    </div>
                                    {variant.stockQty > 0 ? (
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                    ) : (
                                        <div className="bg-destructive/10 p-2 rounded-lg text-destructive">
                                            <span className="text-xs font-bold uppercase tracking-wider">Out</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Register Selection Dialog */}
            <Dialog open={isSelectRegisterOpen} onOpenChange={(open) => { if (!open) { setPendingRegister(null); } setIsSelectRegisterOpen(open); }}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Monitor className="w-5 h-5" /> Select Cash Counter
                        </DialogTitle>
                        <DialogDescription>Choose which register to bill from. If the counter is closed, you'll be asked to provide an opening balance.</DialogDescription>
                    </DialogHeader>

                    {!pendingRegister ? (
                        /* Step 1: List of Registers */
                        <div className="space-y-2 py-2">
                            {allRegisters.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <Monitor className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                    <p className="font-bold">No Registers Found</p>
                                    <p className="text-sm mt-1">Ask your admin to create counters from the Registers page.</p>
                                </div>
                            ) : allRegisters.map(reg => {
                                const isInUseByOther = reg.activeSession && reg.activeSession.cashierId._id !== user._id;
                                const isMySession = reg.activeSession && reg.activeSession.cashierId._id === user._id;
                                return (
                                    <button
                                        key={reg._id}
                                        onClick={() => handleSelectRegister(reg)}
                                        disabled={isInUseByOther}
                                        className={`w-full text-left p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                                            isMySession
                                                ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                                                : isInUseByOther
                                                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                isMySession ? 'bg-emerald-200 text-emerald-700' : isInUseByOther ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                <Monitor className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{reg.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {isMySession ? `Your session • ₹${reg.activeSession.expectedBalance || 0} balance`
                                                        : isInUseByOther ? `In use by ${reg.activeSession.cashierId.name}`
                                                            : reg.assignedCashier ? `Assigned: ${reg.assignedCashier.name}` : 'Unassigned • Available'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {isMySession ? (
                                                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full">✓ Active</span>
                                            ) : isInUseByOther ? (
                                                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-red-100 text-red-600 rounded-full">Busy</span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-blue-100 text-blue-600 rounded-full">Open</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* Step 2: Opening Balance for selected register */
                        <div className="space-y-4 py-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-blue-900">{pendingRegister.name}</p>
                                    <p className="text-xs text-blue-600">Enter opening cash to start this session</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opening Cash Balance</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">₹</span>
                                    <input
                                        type="number"
                                        value={openingBalanceInput}
                                        onChange={(e) => setOpeningBalanceInput(e.target.value)}
                                        className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-slate-200 font-bold text-2xl focus:border-blue-400 focus:outline-none transition-colors"
                                        placeholder="0"
                                        min="0"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setPendingRegister(null)}>Back</Button>
                                <Button onClick={handleOpenSession} disabled={switchingRegister} className="bg-emerald-600 hover:bg-emerald-700">
                                    {switchingRegister && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Open Session with ₹{Number(openingBalanceInput) || 0}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Billing;
