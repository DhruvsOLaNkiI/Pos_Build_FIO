import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Search, Trash2, Check, ChevronDown, ChevronUp, Loader2, BarChart3, Printer } from 'lucide-react';

const Purchases = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [purchases, setPurchases] = useState([]);
    const [poSearch, setPoSearch] = useState(''); // New search state for purchase orders
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [editStatus, setEditStatus] = useState('pending');
    const [editDeliveryStatus, setEditDeliveryStatus] = useState('ordered');
    const [editPaidAmount, setEditPaidAmount] = useState(0);
    const [editNotes, setEditNotes] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Purchase Form State
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [openSupplierDropdown, setOpenSupplierDropdown] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [expandedVariantGroups, setExpandedVariantGroups] = useState({});

    const [cartItems, setCartItems] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [status, setStatus] = useState('pending');
    const [deliveryStatus, setDeliveryStatus] = useState('ordered');
    const [paidAmount, setPaidAmount] = useState(0);
    const [notes, setNotes] = useState('');

    // Price Comparison State
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [compBrandFilter, setCompBrandFilter] = useState('all');
    const [compSearch, setCompSearch] = useState('');
    const [expandedProduct, setExpandedProduct] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [purchaseRes, supplierRes, productRes, compRes, warehouseRes] = await Promise.all([
                API.get('/purchases'),
                API.get('/suppliers'),
                API.get('/products'),
                API.get('/purchases/price-comparison'),
                API.get('/warehouses') // Added warehouses fetch
            ]);
            setPurchases(purchaseRes.data.data);
            setSuppliers(supplierRes.data.data);
            setProducts(productRes.data.data);
            setComparisonData(compRes.data.data);

            // Filter only active warehouses and set default
            const activeWarehouses = warehouseRes.data.data.filter(w => w.isActive !== false);
            setWarehouses(activeWarehouses);
            const defaultWh = activeWarehouses.find(w => w.isDefault);
            if (defaultWh) {
                setSelectedWarehouse(defaultWh._id);
            } else if (activeWarehouses.length > 0) {
                setSelectedWarehouse(activeWarehouses[0]._id);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComparison = async () => {
        try {
            setComparisonLoading(true);
            const { data } = await API.get('/purchases/price-comparison');
            setComparisonData(data.data);
        } catch (error) {
            console.error("Error fetching comparison", error);
        } finally {
            setComparisonLoading(false);
        }
    };

    const toggleComparison = () => {
        setShowComparison(!showComparison);
    };

    const addToCart = (product, targetPrice = null) => {
        const existing = cartItems.find(item => item.productId === product._id);
        if (existing) {
            toast({ title: 'Item already added', description: 'Update quantity below', variant: "warning" });
            return;
        }

        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
        const autoBatch = `BATCH-${dateStr}-${String(cartItems.length + 1).padStart(3, '0')}`;

        setCartItems([...cartItems, {
            productId: product._id,
            name: product.name,
            variant: product.variant || '',
            quantity: 1,
            unitPrice: targetPrice !== null ? targetPrice : product.purchasePrice,
            batchNumber: autoBatch
        }]);
        setProductSearch('');
    };

    const addAllToCart = (productsList) => {
        const newItems = [];
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
        let startIndex = cartItems.length + 1;

        productsList.forEach(product => {
            const existing = cartItems.find(item => item.productId === product._id);
            if (!existing) {
                newItems.push({
                    productId: product._id,
                    name: product.name,
                    variant: product.variant || '',
                    quantity: 1,
                    unitPrice: product.purchasePrice,
                    batchNumber: `BATCH-${dateStr}-${String(startIndex++).padStart(3, '0')}`
                });
            }
        });

        if (newItems.length > 0) {
            setCartItems([...cartItems, ...newItems]);
            toast({ title: 'Added Variants', description: `Added ${newItems.length} items to order` });
        } else {
            toast({ title: 'Items already added', description: 'All these variants are already in the order', variant: "warning" });
        }
        setProductSearch('');
    };

    const updateCartItem = (id, field, value) => {
        setCartItems(cartItems.map(item => {
            if (item.productId !== id) return item;
            let finalValue = value;
            if (field === 'quantity' || field === 'unitPrice') {
                finalValue = Number(value);
            }
            return { ...item, [field]: finalValue };
        }));
    };

    const removeCartItem = (id) => {
        setCartItems(cartItems.filter(item => item.productId !== id));
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const handleSubmit = async () => {
        if (!selectedSupplier) {
            toast({ title: 'Select Supplier', description: 'Please select a supplier first', variant: 'destructive' });
            return;
        }
        if (cartItems.length === 0) {
            toast({ title: 'Empty Cart', description: 'Add at least one product', variant: 'destructive' });
            return;
        }
        if (!selectedWarehouse) {
            toast({ title: 'Select Warehouse', description: 'Please select a destination warehouse', variant: 'destructive' });
            return;
        }

        try {
            const payload = {
                supplier: selectedSupplier._id,
                destinationWarehouseId: selectedWarehouse,
                items: cartItems,
                totalAmount,
                paidAmount: Number(paidAmount),
                status,
                deliveryStatus,
                notes
            };

            await API.post('/purchases', payload);
            toast({
                title: 'Success',
                description: deliveryStatus === 'delivered' ? 'Purchase created & Stock added to warehouse' : 'Purchase Order created successfully'
            });
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create purchase',
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setSelectedSupplier(null);
        setCartItems([]);
        setPaidAmount(0);
        setStatus('pending');
        setDeliveryStatus('ordered');
        setNotes('');
        setSupplierSearch('');
        setOpenSupplierDropdown(false);
        setExpandedVariantGroups({});
    };

    const openEditDialog = (purchase) => {
        setEditingPurchase(purchase);
        setEditStatus(purchase.status);
        setEditDeliveryStatus(purchase.deliveryStatus || 'ordered');
        setEditPaidAmount(purchase.paidAmount || 0);
        setEditNotes(purchase.notes || '');
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingPurchase) return;
        try {
            setEditLoading(true);
            await API.put(`/purchases/${editingPurchase._id}`, {
                status: editStatus,
                deliveryStatus: editDeliveryStatus,
                paidAmount: Number(editPaidAmount),
                notes: editNotes,
            });
            toast({ title: 'Updated', description: editDeliveryStatus === 'delivered' ? 'Purchase delivered and stock added!' : 'Purchase order updated successfully' });
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update',
                variant: 'destructive',
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this purchase order? Stock will be rolled back.')) return;
        try {
            await API.delete(`/purchases/${id}`);
            toast({ title: 'Deleted', description: 'Purchase deleted & stock rolled back' });
            fetchData();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete',
                variant: 'destructive',
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredProductSearch = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    // Group product search results by name to handle variants
    const groupedProductSearch = (() => {
        const groups = {};
        filteredProductSearch.forEach(p => {
            const key = p.name.trim().toLowerCase();
            if (!groups[key]) {
                groups[key] = {
                    key,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    items: []
                };
            }
            groups[key].items.push(p);

            if (p.brand && groups[key].brand && groups[key].brand !== p.brand && groups[key].brand !== 'Multiple Brands') {
                groups[key].brand = 'Multiple Brands';
            } else if (!groups[key].brand && p.brand) {
                groups[key].brand = p.brand;
            }
        });
        return Object.values(groups);
    })();

    // Derive suggested products based on selected supplier
    const suggestedProducts = selectedSupplier ? comparisonData
        .filter(p => p.suppliers.some(s => s.supplierId === selectedSupplier._id))
        .filter(p => products.some(prod => prod._id === p.productId)) // Exclude deleted products
        .map(p => {
            const sData = p.suppliers.find(s => s.supplierId === selectedSupplier._id);
            return {
                _id: p.productId,
                name: p.productName,
                variant: products.find(prod => prod._id === p.productId)?.variant || '',
                latestPrice: sData.latestPrice,
                lastDate: sData.lastDate,
                stockQty: products.find(prod => prod._id === p.productId)?.stockQty || 0
            };
        })
        .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate))
        : [];

    // Comparison filters
    const compBrands = [...new Set(comparisonData.map(p => p.brand).filter(Boolean))].sort();
    const filteredComparison = comparisonData.filter(p => {
        const matchesBrand = compBrandFilter === 'all' || p.brand === compBrandFilter;
        const matchesSearch = !compSearch ||
            p.productName.toLowerCase().includes(compSearch.toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(compSearch.toLowerCase());
        return matchesBrand && matchesSearch;
    });

    // ------------------------------------------------------------------------
    // NEW: Filter Purchases list based on poSearch (PO Number or Supplier Name)
    // ------------------------------------------------------------------------
    const filteredPurchases = purchases.filter(purchase => {
        if (!poSearch) return true;

        const searchLower = poSearch.toLowerCase();
        const matchesPO = purchase.invoiceNumber?.toLowerCase().includes(searchLower);
        const matchesSupplier = purchase.supplier?.name?.toLowerCase().includes(searchLower);
        // Also allow searching by Date string (e.g. "26/02/2026")
        const matchesDate = new Date(purchase.createdAt).toLocaleDateString().includes(searchLower);

        return matchesPO || matchesSupplier || matchesDate;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground mt-1">Record supplier purchases and update inventory</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={toggleComparison} className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {showComparison ? 'Hide Comparison' : 'Price Comparison'}
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> New Purchase
                    </Button>
                </div>
            </div>

            {/* ===== Supplier Price Comparison Section ===== */}
            {showComparison && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Supplier Price Comparison
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search product..."
                                    className="pl-8 h-8 w-[180px] text-xs"
                                    value={compSearch}
                                    onChange={(e) => setCompSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                value={compBrandFilter}
                                onChange={(e) => setCompBrandFilter(e.target.value)}
                            >
                                <option value="all">All Brands</option>
                                {compBrands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {comparisonLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredComparison.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No purchase data found. Create purchase orders to see price comparisons.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredComparison.map((product) => {
                                    const isExpanded = expandedProduct === product.productId;
                                    return (
                                        <div key={product.productId} className="border border-border rounded-lg overflow-hidden">
                                            {/* Product Header Row */}
                                            <button
                                                className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                                                onClick={() => setExpandedProduct(isExpanded ? null : product.productId)}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm">{product.productName}</span>
                                                            {product.brand && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                                                    {product.brand}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {product.supplierCount} supplier{product.supplierCount > 1 ? 's' : ''} • {product.category || 'Uncategorized'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {product.supplierCount > 1 ? (
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-muted-foreground">Best Price</div>
                                                            <div className="text-sm font-bold text-green-400">₹{product.cheapestPrice?.toFixed(2)}</div>
                                                            <div className="text-[10px] text-green-400/80">{product.cheapestSupplier}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold">₹{product.cheapestPrice?.toFixed(2)}</div>
                                                            <div className="text-[10px] text-muted-foreground">{product.cheapestSupplier}</div>
                                                        </div>
                                                    )}
                                                    {isExpanded
                                                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                                                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    }
                                                </div>
                                            </button>

                                            {/* Expanded — Supplier Details */}
                                            {isExpanded && (
                                                <div className="border-t border-border bg-card">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-muted/30 text-xs">
                                                                <TableHead>Supplier</TableHead>
                                                                <TableHead className="text-right">Latest Price</TableHead>
                                                                <TableHead className="text-right">Avg Price</TableHead>
                                                                <TableHead className="text-right">Total Qty</TableHead>
                                                                <TableHead className="text-right">Orders</TableHead>
                                                                <TableHead className="text-right">Last Purchase</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {product.suppliers.map((s, idx) => {
                                                                const isCheapest = s.latestPrice === product.cheapestPrice && product.supplierCount > 1;
                                                                return (
                                                                    <TableRow key={idx} className={isCheapest ? 'bg-green-500/5' : 'hover:bg-muted/20'}>
                                                                        <TableCell className="font-medium text-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                {s.supplierName}
                                                                                {isCheapest && (
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 font-bold">
                                                                                        CHEAPEST
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className={`text-right font-bold ${isCheapest ? 'text-green-400' : ''}`}>
                                                                            ₹{s.latestPrice?.toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-muted-foreground">
                                                                            ₹{s.avgPrice?.toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">{s.totalQty}</TableCell>
                                                                        <TableCell className="text-right">{s.purchaseCount}</TableCell>
                                                                        <TableCell className="text-right text-xs text-muted-foreground">
                                                                            {s.lastDate ? new Date(s.lastDate).toLocaleDateString() : '—'}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ===== Purchases List Table ===== */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by PO Number, Supplier, or Date..."
                        className="pl-9 h-10"
                        value={poSearch}
                        onChange={(e) => setPoSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Destination Warehouse</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead className="text-center">Payment</TableHead>
                            <TableHead className="text-center">Delivery</TableHead>
                            <TableHead className="text-right">Created By</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPurchases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    No purchase orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPurchases.map((purchase) => (
                                <TableRow key={purchase._id} className="hover:bg-muted cursor-pointer" onClick={() => openEditDialog(purchase)}>
                                    <TableCell className="font-mono text-xs">
                                        {new Date(purchase.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-medium">{purchase.supplier?.name || 'Unknown'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{purchase.invoiceNumber}</TableCell>
                                    <TableCell>
                                        {purchase.destinationWarehouseId?.name ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {purchase.destinationWarehouseId.name}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">₹{purchase.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
                                            ${purchase.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                                                purchase.status === 'partial' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'}`}>
                                            {purchase.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
                                            ${purchase.deliveryStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                                                purchase.deliveryStatus === 'dispatched' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-amber-500/10 text-amber-500'}`}>
                                            {purchase.deliveryStatus || 'ordered'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {purchase.createdBy?.name}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(purchase._id, e)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ===== Create Purchase Modal ===== */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Purchase Order</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* 1. Select Supplier & Warehouse */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Supplier</Label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setOpenSupplierDropdown(!openSupplierDropdown)}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <span className={selectedSupplier ? '' : 'text-muted-foreground'}>
                                            {selectedSupplier ? selectedSupplier.name : 'Select supplier...'}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </button>
                                    {openSupplierDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                                            <div className="p-2 border-b border-border">
                                                <div className="flex items-center gap-2 px-2">
                                                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search supplier..."
                                                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                                        value={supplierSearch}
                                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto p-1">
                                                {suppliers
                                                    .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                                                    .map((supplier) => (
                                                        <div
                                                            key={supplier._id}
                                                            className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                            onClick={() => {
                                                                setSelectedSupplier(supplier);
                                                                setOpenSupplierDropdown(false);
                                                                setSupplierSearch('');
                                                            }}
                                                        >
                                                            <Check className={`h-4 w-4 shrink-0 ${selectedSupplier?._id === supplier._id ? 'opacity-100' : 'opacity-0'}`} />
                                                            {supplier.name}
                                                        </div>
                                                    ))}
                                                {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && (
                                                    <div className="px-2 py-4 text-sm text-center text-muted-foreground">No supplier found.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Destination Warehouse</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                >
                                    <option value="" disabled>Select warehouse...</option>
                                    {warehouses.map(w => (
                                        <option key={w._id} value={w._id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 2. Add Products */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Add Products to Order</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Type to search products..."
                                        className="pl-9"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                    {productSearch && (
                                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[350px] overflow-auto custom-scrollbar">
                                            {groupedProductSearch.map(group => {
                                                const groupKey = group.key;
                                                const isExpanded = expandedVariantGroups[groupKey];

                                                return (
                                                    <div key={groupKey} className="border-b last:border-0 border-border/40 pb-2 mb-2 last:mb-0 last:pb-0 pt-2 px-1">
                                                        {group.items.length > 1 ? (
                                                            <>
                                                                <div
                                                                    className="flex justify-between items-center mb-1 px-2 bg-muted/20 hover:bg-muted/40 transition-colors py-2 rounded cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedVariantGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                                                        <span className="text-sm font-semibold text-foreground">
                                                                            {group.name}
                                                                            <span className="ml-2 text-[10px] font-normal text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                                                                                {group.items.length} variants
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded shadow-sm font-semibold transition-colors"
                                                                        onClick={(e) => { e.stopPropagation(); addAllToCart(group.items); }}
                                                                    >
                                                                        + Add All
                                                                    </button>
                                                                </div>

                                                                {isExpanded && (
                                                                    <div className="space-y-1 mt-2 pl-2 border-l-2 border-primary/20 ml-2">
                                                                        {group.items.map(p => {
                                                                            const compProduct = comparisonData.find(c => c.productId === p._id);
                                                                            const prevSuppliers = compProduct?.suppliers?.length > 0
                                                                                ? compProduct.suppliers.map(s => s.supplierName).join(', ')
                                                                                : null;

                                                                            return (
                                                                                <div
                                                                                    key={p._id}
                                                                                    className="p-2 mx-1 hover:bg-muted cursor-pointer flex justify-between items-start bg-card rounded transition-colors border border-transparent hover:border-border/50"
                                                                                    onClick={() => addToCart(p)}
                                                                                >
                                                                                    {/* Same layout for inner variants */}
                                                                                    <div className="flex flex-col gap-1.5">
                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                            <span className="font-medium text-sm">
                                                                                                {p.variant || 'Default Variant'}
                                                                                            </span>
                                                                                            <span className="text-[10px] w-fit font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                                                                Variant
                                                                                            </span>
                                                                                        </div>
                                                                                        {prevSuppliers && (
                                                                                            <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded w-fit">
                                                                                                <span className="font-medium">Suppliers:</span> {prevSuppliers}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-1">
                                                                                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">Stock: {p.stockQty}</span>
                                                                                        <span className="text-[10px] text-muted-foreground">₹{p.purchasePrice} / unit</span>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                {group.items.map(p => {
                                                                    const compProduct = comparisonData.find(c => c.productId === p._id);
                                                                    const prevSuppliers = compProduct?.suppliers?.length > 0
                                                                        ? compProduct.suppliers.map(s => s.supplierName).join(', ')
                                                                        : null;

                                                                    return (
                                                                        <div
                                                                            key={p._id}
                                                                            className="p-3 mx-1 hover:bg-muted cursor-pointer flex justify-between items-start bg-card rounded transition-colors border border-transparent hover:border-border/50"
                                                                            onClick={() => addToCart(p)}
                                                                        >
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <span className="font-medium text-sm">
                                                                                        {group.items.length > 1 ? (p.variant || 'Default Variant') : p.name}
                                                                                    </span>
                                                                                    {group.items.length === 1 && p.variant && (
                                                                                        <span className="text-[10px] w-fit font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                                                            {p.variant}
                                                                                        </span>
                                                                                    )}
                                                                                    {group.items.length > 1 && (
                                                                                        <span className="text-[10px] w-fit font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                                                            Variant
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {prevSuppliers && (
                                                                                    <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded w-fit">
                                                                                        <span className="font-medium">Suppliers:</span> {prevSuppliers}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col items-end gap-1">
                                                                                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">Stock: {p.stockQty}</span>
                                                                                <span className="text-[10px] text-muted-foreground">₹{p.purchasePrice} / unit</span>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {filteredProductSearch.length === 0 && <div className="p-3 text-sm text-center text-muted-foreground">No products found</div>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Suggested Products from this Supplier */}
                            {selectedSupplier && suggestedProducts.length > 0 && (
                                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                        Previously bought from {selectedSupplier.name}
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedProducts.map(sp => (
                                            <button
                                                key={sp._id}
                                                type="button"
                                                onClick={() => addToCart(sp, sp.latestPrice)}
                                                className="px-3 py-1.5 rounded-full bg-background hover:bg-muted text-foreground text-xs font-medium border border-border flex items-center gap-2 transition-colors shadow-sm"
                                            >
                                                <span>
                                                    {sp.name} {sp.variant && <span className="opacity-70 text-[10px]">({sp.variant})</span>}
                                                </span>
                                                <span className="text-muted-foreground border-l border-border/50 pl-2">
                                                    ₹{sp.latestPrice?.toFixed(2)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Items List */}
                        <div className="border rounded-md min-h-[150px] p-0 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead className="min-w-[200px]">Product</TableHead>
                                        <TableHead className="w-[140px]">Batch #</TableHead>
                                        <TableHead className="w-[80px]">Qty</TableHead>
                                        <TableHead className="w-[100px]">Unit Cost</TableHead>
                                        <TableHead className="text-right w-[100px]">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cartItems.map((item) => (
                                        <TableRow key={item.productId}>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-sm">{item.name}</span>
                                                    {item.variant && (
                                                        <span className="text-[10px] w-fit font-semibold px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                            {item.variant}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Input
                                                    type="text"
                                                    className="h-10 text-xs px-2 font-mono"
                                                    value={item.batchNumber || ''}
                                                    onChange={(e) => updateCartItem(item.productId, 'batchNumber', e.target.value)}
                                                    placeholder="Batch No"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Input
                                                    type="number"
                                                    className="h-10 text-sm px-2 w-16"
                                                    value={item.quantity}
                                                    onChange={(e) => updateCartItem(item.productId, 'quantity', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Input
                                                    type="number"
                                                    className="h-10 text-sm px-2 w-20"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateCartItem(item.productId, 'unitPrice', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-3 text-right font-medium">
                                                ₹{(item.quantity * item.unitPrice).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeCartItem(item.productId)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {cartItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                                                Search and add products above
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* 4. Payment & Totals */}
                        <div className="flex flex-col gap-4 border-t pt-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total Amount:</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Delivery Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={deliveryStatus}
                                        onChange={(e) => setDeliveryStatus(e.target.value)}
                                    >
                                        <option value="ordered">Ordered</option>
                                        <option value="dispatched">Dispatched</option>
                                        <option value="delivered">Delivered (Add Stock)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={status}
                                        onChange={(e) => {
                                            setStatus(e.target.value);
                                            if (e.target.value === 'paid') setPaidAmount(totalAmount);
                                        }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Paid Amount</Label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        disabled={status === 'paid'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes (Optional)</Label>
                                    <Input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Invoice details, payment instructions, etc."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Create Purchase Order</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Edit Purchase Dialog ===== */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Purchase Order Details</DialogTitle>
                    </DialogHeader>

                    {editingPurchase && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Supplier</p>
                                    <p className="font-medium">{editingPurchase.supplier?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">PO Number</p>
                                    <p className="font-medium">{editingPurchase.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p className="font-medium">{new Date(editingPurchase.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Amount</p>
                                    <p className="font-bold text-lg">₹{editingPurchase.totalAmount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted">
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Unit Cost</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editingPurchase.items.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{item.name || item.product?.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.unitPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-medium">₹{item.total.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="border-t pt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Delivery Status</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            value={editDeliveryStatus}
                                            onChange={(e) => setEditDeliveryStatus(e.target.value)}
                                            disabled={editingPurchase.deliveryStatus === 'delivered'}
                                        >
                                            <option value="ordered">Ordered</option>
                                            <option value="dispatched">Dispatched</option>
                                            <option value="delivered">Delivered (Add Stock)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Status</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            value={editStatus}
                                            onChange={(e) => {
                                                setEditStatus(e.target.value);
                                                if (e.target.value === 'paid') setEditPaidAmount(editingPurchase.totalAmount);
                                            }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Paid Amount</Label>
                                        <Input
                                            type="number"
                                            value={editPaidAmount}
                                            onChange={(e) => setEditPaidAmount(e.target.value)}
                                            disabled={editStatus === 'paid'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Input
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            placeholder="Payment notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={editLoading}>
                                {editLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Update Purchase
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Hidden Print Layout ===== */}
            {editingPurchase && typeof document !== 'undefined' && createPortal(
                <div id="print-invoice-content" className="hidden print:block fixed inset-0 bg-white print:bg-white !bg-white text-black print:text-black !text-black z-[9999] p-8">
                    {/* Header */}
                    <div className="text-center mb-8 pb-4 border-b-2 border-slate-200">
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">Purchase Invoice</h1>
                        <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Supplier</h3>
                            <p className="font-medium text-slate-700">{editingPurchase.supplier?.name}</p>
                            {editingPurchase.supplier?.email && <p className="text-slate-600 text-sm">{editingPurchase.supplier.email}</p>}
                            {editingPurchase.supplier?.phone && <p className="text-slate-600 text-sm">{editingPurchase.supplier.phone}</p>}
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className="font-bold text-slate-800">PO Number: </span>
                                <span className="text-slate-700">{editingPurchase.invoiceNumber}</span>
                            </div>
                            <div className="mb-2">
                                <span className="font-bold text-slate-800">Date: </span>
                                <span className="text-slate-700">{new Date(editingPurchase.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-800">Status: </span>
                                <span className="uppercase text-slate-700 font-semibold">{editingPurchase.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left mb-8 border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-800">
                                <th className="py-3 font-bold text-slate-800">Product Description</th>
                                <th className="py-3 font-bold text-slate-800 text-right">Quantity</th>
                                <th className="py-3 font-bold text-slate-800 text-right">Unit Price</th>
                                <th className="py-3 font-bold text-slate-800 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editingPurchase.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-200">
                                    <td className="py-3 text-slate-700">
                                        {item.name || item.product?.name}
                                        {item.variant && <span className="text-xs text-slate-500 block">{item.variant}</span>}
                                    </td>
                                    <td className="py-3 text-right text-slate-700">{item.quantity}</td>
                                    <td className="py-3 text-right text-slate-700">₹{item.unitPrice.toFixed(2)}</td>
                                    <td className="py-3 text-right font-medium text-slate-800">₹{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end pt-4">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-slate-700 border-b border-slate-200 pb-2">
                                <span>Paid Amount:</span>
                                <span>₹{(editingPurchase.paidAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-800 text-xl font-bold">
                                <span>Total Amount:</span>
                                <span>₹{editingPurchase.totalAmount.toFixed(2)}</span>
                            </div>
                            {(editingPurchase.totalAmount - (editingPurchase.paidAmount || 0)) > 0 && (
                                <div className="flex justify-between text-red-600 font-semibold pt-2">
                                    <span>Balance Due:</span>
                                    <span>₹{(editingPurchase.totalAmount - (editingPurchase.paidAmount || 0)).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes/Footer */}
                    {editingPurchase.notes && (
                        <div className="mt-12 pt-4 border-t border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-2">Notes</h4>
                            <p className="text-slate-600 whitespace-pre-wrap">{editingPurchase.notes}</p>
                        </div>
                    )}

                    <div className="mt-24 text-center text-sm text-slate-500">
                        <p>This is a computer generated document. No signature is required.</p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Purchases;
