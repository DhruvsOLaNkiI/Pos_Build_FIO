import { useState, useEffect } from 'react';
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
import { Search, Plus, Edit2, Trash2, Truck, Phone, Mail, MapPin, Building2, ChevronDown, ChevronUp, BarChart3, Loader2 } from 'lucide-react';

const Suppliers = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    // Catalog State
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [activeSupplierId, setActiveSupplierId] = useState(null);
    const [products, setProducts] = useState([]);
    const [catalogForm, setCatalogForm] = useState({ product: '', price: '' });

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedSupplierHistory, setSelectedSupplierHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeHistorySupplier, setActiveHistorySupplier] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
    });

    // Brand-wise comparison state
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);
    const [compLoading, setCompLoading] = useState(false);
    const [expandedBrand, setExpandedBrand] = useState(null);
    const [brandSearch, setBrandSearch] = useState('');

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/suppliers');
            setSuppliers(data.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch suppliers',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await API.get('/products');
            setProducts(data.data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
        }
    };

    const fetchComparison = async () => {
        try {
            setCompLoading(true);
            const { data } = await API.get('/purchases/price-comparison');
            setComparisonData(data.data);
        } catch (error) {
            console.error("Error fetching comparison", error);
        } finally {
            setCompLoading(false);
        }
    };

    const toggleComparison = () => {
        if (!showComparison && comparisonData.length === 0) {
            fetchComparison();
        }
        setShowComparison(!showComparison);
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                phone: supplier.phone,
                email: supplier.email || '',
                address: supplier.address || '',
                gstNumber: supplier.gstNumber || '',
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                gstNumber: '',
            });
        }
        setIsModalOpen(true);
    };
    const handleOpenHistoryModal = async (supplier) => {
        setActiveHistorySupplier(supplier);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const { data } = await API.get('/purchases');
            // Filter purchases for this supplier
            const supplierPurchases = data.data.filter(
                (p) => p.supplier && p.supplier._id === supplier._id
            );
            setSelectedSupplierHistory(supplierPurchases);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch supplier history.',
                variant: 'destructive',
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleManageCatalog = (supplier) => {
        setActiveSupplierId(supplier._id);
        if (products.length === 0) fetchProducts();
        setIsCatalogModalOpen(true);
    };

    const handleAddToCatalog = async (e) => {
        e.preventDefault();
        if (!catalogForm.product || !catalogForm.price) return;
        try {
            // Handle single ID or comma-separated bulk IDs
            const productPayload = catalogForm.product.includes(',')
                ? catalogForm.product.split(',')
                : catalogForm.product;

            const payload = { product: productPayload, price: Number(catalogForm.price) };
            await API.post(`/suppliers/${activeSupplierId}/catalog`, payload);
            toast({ title: 'Success', description: 'Added to catalog' });
            setCatalogForm({ product: '', price: '' });
            fetchSuppliers(); // Refresh to get updated catalog
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add to catalog', variant: 'destructive' });
        }
    };

    const handleRemoveFromCatalog = async (productId) => {
        try {
            await API.delete(`/suppliers/${activeSupplierId}/catalog/${productId}`);
            toast({ title: 'Success', description: 'Removed from catalog' });
            fetchSuppliers();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to remove from catalog', variant: 'destructive' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await API.put(`/suppliers/${editingSupplier._id}`, formData);
                toast({ title: 'Success', description: 'Supplier updated successfully' });
            } else {
                await API.post('/suppliers', formData);
                toast({ title: 'Success', description: 'Supplier added successfully' });
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Operation failed',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await API.delete(`/suppliers/${id}`);
                toast({ title: 'Success', description: 'Supplier deleted' });
                fetchSuppliers();
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to delete supplier', variant: 'destructive' });
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    // Group comparison data by brand for brand-wise view
    const brandGroups = (() => {
        const groups = {};
        comparisonData.forEach(product => {
            const brand = product.brand || 'No Brand';
            if (!groups[brand]) {
                groups[brand] = { brand, products: [], supplierNames: new Set() };
            }
            groups[brand].products.push(product);
            product.suppliers.forEach(s => groups[brand].supplierNames.add(s.supplierName));
        });
        return Object.values(groups)
            .map(g => ({
                ...g,
                supplierNames: [...g.supplierNames].sort(),
                supplierCount: g.supplierNames.size,
                productCount: g.products.length
            }))
            .filter(g => g.supplierCount >= 1)
            .sort((a, b) => b.supplierCount - a.supplierCount);
    })();

    const filteredBrandGroups = brandGroups.filter(g =>
        !brandSearch ||
        g.brand.toLowerCase().includes(brandSearch.toLowerCase()) ||
        g.supplierNames.some(s => s.toLowerCase().includes(brandSearch.toLowerCase()))
    );

    // Group products for Add Catalog Dropdown (handling variants)
    const groupedProductsForCatalog = (() => {
        const groups = {};
        products.forEach(p => {
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
        // Sort groups alphabetically by name
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    })();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground mt-1">Manage vendor profiles and supply chain</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={toggleComparison} className="gap-2">
                        <Building2 className="w-4 h-4" />
                        {showComparison ? 'Hide Brand View' : 'Brand Price Compare'}
                    </Button>
                    <Button onClick={() => handleOpenModal()} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Supplier
                    </Button>
                </div>
            </div>

            {/* ===== Brand-wise Supplier Price Comparison ===== */}
            {showComparison && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Brand-wise Supplier Comparison
                        </CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search brand or supplier..."
                                className="pl-8 h-8 w-[220px] text-xs"
                                value={brandSearch}
                                onChange={(e) => setBrandSearch(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {compLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredBrandGroups.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No purchase data found. Create purchase orders to see brand-wise comparisons.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredBrandGroups.map((group) => {
                                    const isExpanded = expandedBrand === group.brand;
                                    return (
                                        <div key={group.brand} className="border border-border rounded-lg overflow-hidden">
                                            {/* Brand Header */}
                                            <button
                                                className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                                                onClick={() => setExpandedBrand(isExpanded ? null : group.brand)}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm">{group.brand}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {group.productCount} product{group.productCount > 1 ? 's' : ''} • {group.supplierCount} supplier{group.supplierCount > 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-wrap gap-1 max-w-[300px] justify-end">
                                                        {group.supplierNames.slice(0, 3).map(name => (
                                                            <span key={name} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/20 font-medium">
                                                                {name}
                                                            </span>
                                                        ))}
                                                        {group.supplierNames.length > 3 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-medium">
                                                                +{group.supplierNames.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isExpanded
                                                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                                                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    }
                                                </div>
                                            </button>

                                            {/* Expanded — Products & Their Supplier Prices */}
                                            {isExpanded && (
                                                <div className="border-t border-border">
                                                    {group.products.map((product, pidx) => (
                                                        <div key={product.productId} className={pidx > 0 ? 'border-t border-border/50' : ''}>
                                                            {/* Product name row */}
                                                            <div className="px-4 py-2 bg-card flex items-center justify-between">
                                                                <span className="font-medium text-sm">{product.productName}</span>
                                                                <span className="text-xs text-muted-foreground">{product.category}</span>
                                                            </div>
                                                            {/* Supplier price rows */}
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-muted/20 text-xs">
                                                                        <TableHead className="py-1.5">Supplier</TableHead>
                                                                        <TableHead className="text-right py-1.5">Latest Price</TableHead>
                                                                        <TableHead className="text-right py-1.5">Avg Price</TableHead>
                                                                        <TableHead className="text-right py-1.5">Qty Bought</TableHead>
                                                                        <TableHead className="text-right py-1.5">Orders</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {product.suppliers.map((s, idx) => {
                                                                        const isCheapest = s.latestPrice === product.cheapestPrice && product.supplierCount > 1;
                                                                        return (
                                                                            <TableRow key={idx} className={isCheapest ? 'bg-green-500/5' : ''}>
                                                                                <TableCell className="py-1.5 text-sm">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Truck className="w-3 h-3 text-muted-foreground" />
                                                                                        {s.supplierName}
                                                                                        {isCheapest && (
                                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 font-bold">
                                                                                                BEST
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className={`text-right py-1.5 font-bold ${isCheapest ? 'text-green-400' : ''}`}>
                                                                                    ₹{s.latestPrice?.toFixed(2)}
                                                                                </TableCell>
                                                                                <TableCell className="text-right py-1.5 text-muted-foreground">
                                                                                    ₹{s.avgPrice?.toFixed(2)}
                                                                                </TableCell>
                                                                                <TableCell className="text-right py-1.5">{s.totalQty}</TableCell>
                                                                                <TableCell className="text-right py-1.5">{s.purchaseCount}</TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    ))}
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

            {/* Search */}
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, contact person or phone..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Supplier Table */}
            <div className="rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Supplier Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>GSTIN</TableHead>
                            <TableHead className="text-center">Active Orders</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <TableRow key={supplier._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-primary" />
                                            {supplier.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            {supplier.phone}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {supplier.gstNumber || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => handleOpenHistoryModal(supplier)}
                                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold transition-colors shadow-sm"
                                            title="View Order History"
                                        >
                                            {supplier.totalOrders} Orders
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleManageCatalog(supplier)} title="Manage Catalog">
                                                <Building2 className="w-4 h-4 text-purple-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(supplier)}>
                                                <Edit2 className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier._id)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add / Edit Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name">Supplier / Company Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input
                                    id="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gstNumber">GSTIN (Optional)</Label>
                                <Input
                                    id="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingSupplier ? 'Update' : 'Add Supplier'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Catalog Dialog */}
            <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Manage Supplier Catalog</DialogTitle>
                    </DialogHeader>

                    {/* Add to Catalog Form */}
                    <form onSubmit={handleAddToCatalog} className="flex gap-2 mb-4 shrink-0">
                        <select
                            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={catalogForm.product}
                            onChange={(e) => setCatalogForm({ ...catalogForm, product: e.target.value })}
                            required
                        >
                            <option value="">— Select Product —</option>
                            {groupedProductsForCatalog.map(group => {
                                if (group.items.length === 1) {
                                    // Single item, no variants
                                    const p = group.items[0];
                                    return (
                                        <option key={p._id} value={p._id}>
                                            {p.name} {p.variant ? `(${p.variant})` : ''} - {p.brand}
                                        </option>
                                    );
                                } else {
                                    // Multiple variants, group them
                                    const allVariantIds = group.items.map(i => i._id).join(',');
                                    return (
                                        <optgroup key={group.key} label={`${group.name} - ${group.brand}`}>
                                            <option value={allVariantIds}>+++ ALL VARIANTS ({group.items.length}) +++</option>
                                            {group.items.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    ↳ {p.variant || 'Default'}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                }
                            })}
                        </select>
                        <Input
                            type="number"
                            placeholder="Quoted Price (₹)"
                            className="w-[150px]"
                            value={catalogForm.price}
                            onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                        />
                        <Button type="submit">Add</Button>
                    </form>

                    {/* Catalog List */}
                    <div className="flex-1 overflow-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted">
                                    <TableHead>Product</TableHead>
                                    <TableHead>Brand / Category</TableHead>
                                    <TableHead className="text-right">Quoted Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.find(s => s._id === activeSupplierId)?.catalog?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No products in catalog yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.find(s => s._id === activeSupplierId)?.catalog?.map((item) => {
                                        if (!item.product) return null; // Safe guard
                                        return (
                                            <TableRow key={item._id || item.product._id} className="hover:bg-muted/50">
                                                <TableCell className="py-2">
                                                    <div className="font-medium text-sm">{item.product.name}</div>
                                                    {item.product.variant && (
                                                        <span className="text-[10px] w-fit font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20 mt-0.5 inline-block">
                                                            {item.product.variant}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 text-sm text-muted-foreground">
                                                    {item.product.brand}<br />
                                                    <span className="text-xs">{item.product.category}</span>
                                                </TableCell>
                                                <TableCell className="text-right py-2 font-semibold">
                                                    ₹{item.price.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFromCatalog(item.product._id)} className="h-8 px-2 text-destructive hover:text-destructive">
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Supplier Order History Dialog */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Order History: {activeHistorySupplier?.name}</DialogTitle>
                    </DialogHeader>

                    {historyLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedSupplierHistory.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No past orders found for this supplier.
                        </div>
                    ) : (
                        <div className="overflow-y-auto pr-2 rounded-md border border-border">
                            <Table>
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Items Ordered</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSupplierHistory.map((purchase) => (
                                        <TableRow key={purchase._id} className="hover:bg-muted/50">
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(purchase.createdAt).toLocaleDateString()}
                                                <div className="text-[10px] text-muted-foreground">
                                                    {new Date(purchase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {purchase.items.map((item, i) => (
                                                        <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border">
                                                            {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${purchase.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                                        purchase.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {purchase.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ₹{purchase.totalAmount?.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Suppliers;
