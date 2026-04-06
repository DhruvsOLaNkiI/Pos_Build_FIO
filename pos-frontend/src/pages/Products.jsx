import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import ProductTable from '@/components/ProductTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import {
    Plus,
    Search,
    Filter,
    TrendingUp,
    Package,
    Trash2,
    Upload,
    Download,
    FileSpreadsheet,
    Loader2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

const Products = () => {
    const { user } = useAuth();
    const isCashier = user?.role === 'cashier';
    const navigate = useNavigate();
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvExporting, setCsvExporting] = useState(false);
    const csvInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        brand: '',
        variant: '',
        unit: '',
        purchasePrice: '',
        sellingPrice: '',
        stockQty: '0',
        minStockLevel: '10',
        barcode: '',
        description: '',
    });

    // Units list
    const [units, setUnits] = useState([]);

    // Filters
    const [selectedBrand, setSelectedBrand] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // New brand / category / name input mode
    const [isNewBrand, setIsNewBrand] = useState(false);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [isNewName, setIsNewName] = useState(false);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/products');
            setProducts(data.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch products',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // Fetch units
        API.get('/units').then(res => setUnits(res.data.data || [])).catch(() => { });
    }, []);

    const handleOpenModal = (product = null) => {
        setIsNewBrand(false);
        setIsNewCategory(false);
        setIsNewName(false);
        if (product) {
            const totalWarehouseStock = product.allocations?.reduce((sum, a) => sum + (a.stockQty || 0), 0) || 0;

            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                brand: product.brand || '',
                variant: product.variant || '',
                unit: product.unit?._id || product.unit || '',
                purchasePrice: product.purchasePrice.toString(),
                sellingPrice: product.sellingPrice.toString(),
                stockQty: product.stockQty.toString(),
                warehouseStock: totalWarehouseStock.toString(),
                transferQty: '',
                minStockLevel: product.minStockLevel.toString(),
                barcode: product.barcode || '',
                description: product.description || '',
                allocations: product.allocations || [],
                sourceWarehouseId: product.allocations?.length > 0 ? product.allocations[0].warehouseId : '',
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: '',
                brand: '',
                variant: '',
                unit: '',
                purchasePrice: '',
                sellingPrice: '',
                stockQty: '0',
                warehouseStock: '0',
                transferQty: '',
                minStockLevel: '10',
                barcode: '',
                description: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleAddVariant = (product) => {
        setEditingProduct(null);
        setFormData({
            name: product.name,
            category: product.category,
            brand: product.brand,
            variant: '', // Blank for new variant entry
            unit: product.unit?._id || product.unit || '',
            purchasePrice: product.purchasePrice.toString(),
            sellingPrice: product.sellingPrice.toString(),
            stockQty: '0',
            warehouseStock: '0',
            transferQty: '',
            minStockLevel: product.minStockLevel ? product.minStockLevel.toString() : '10',
            barcode: '',
            allocations: [],
            sourceWarehouseId: '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                purchasePrice: parseFloat(formData.purchasePrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                stockQty: parseInt(formData.stockQty) || 0,
                minStockLevel: parseInt(formData.minStockLevel) || 10,
            };

            if (editingProduct && formData.transferQty) {
                payload.transferQty = parseInt(formData.transferQty);
                if (formData.sourceWarehouseId) {
                    payload.sourceWarehouseId = formData.sourceWarehouseId;
                }
            }

            // Remove empty barcode to prevent MongoDB unique index errors
            if (!payload.barcode || payload.barcode.trim() === '') {
                delete payload.barcode;
            }

            // Remove empty unit to prevent MongoDB ObjectId cast errors
            if (!payload.unit || payload.unit === '') {
                delete payload.unit;
            }

            if (editingProduct) {
                await API.put(`/products/${editingProduct._id}`, payload);
                toast({ title: 'Success', description: 'Product updated successfully' });
            } else {
                await API.post('/products', payload);
                toast({ title: 'Success', description: 'Product added successfully' });
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Operation failed',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await API.delete(`/products/${id}`);
                toast({ title: 'Success', description: 'Product deleted' });
                fetchProducts();
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
            try {
                await API.delete('/products/bulk', { data: { ids: selectedIds } });
                toast({ title: 'Success', description: `${selectedIds.length} products deleted.` });
                setSelectedIds([]);
                fetchProducts();
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to delete selected products', variant: 'destructive' });
            }
        }
    };

    const handleSelectRow = (id, checked) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    const handleSelectAll = (checked) => {
        setSelectedIds(checked ? filteredProducts.map(p => p._id) : []);
    };

    // Handle image upload success - refresh product list
    const handleImageUpload = (productId, imageUrl) => {
        // Update the product in the local state
        setProducts(prevProducts => 
            prevProducts.map(p => 
                p._id === productId ? { ...p, imageUrl } : p
            )
        );
    };

    // === CSV Import / Export Handlers ===
    const handleExportCsv = async () => {
        try {
            setCsvExporting(true);
            const response = await API.get('/products/export-csv', { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast({ title: 'Success', description: 'Products exported successfully' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to export products', variant: 'destructive' });
        } finally {
            setCsvExporting(false);
        }
    };

    const handleImportCsv = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast({ title: 'Error', description: 'Please select a CSV file', variant: 'destructive' });
            return;
        }

        try {
            setCsvImporting(true);
            const formData = new FormData();
            formData.append('csvFile', file);
            const { data } = await API.post('/products/import-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({
                title: 'Import Complete',
                description: `${data.imported} products imported successfully${data.errors?.length ? ` (${data.errors.length} rows had issues)` : ''}`
            });
            fetchProducts();
        } catch (error) {
            toast({ title: 'Import Failed', description: error.response?.data?.message || 'Failed to import CSV', variant: 'destructive' });
        } finally {
            setCsvImporting(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await API.get('/products/csv-template', { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'product_import_template.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to download template', variant: 'destructive' });
        }
    };

    // Get unique brands & categories for dropdowns (case-insensitive)
    const brandMap = new Map();
    const categoryMap = new Map();

    products.forEach(p => {
        if (p.brand) {
            const lower = p.brand.toLowerCase();
            if (!brandMap.has(lower)) {
                brandMap.set(lower, p.brand); // Store first cased representation
            }
        }
        if (p.category) {
            const lower = p.category.toLowerCase();
            if (!categoryMap.has(lower)) {
                categoryMap.set(lower, p.category);
            }
        }
    });

    const brands = Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b));
    const categories = Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b));

    // Products under currently selected brand (helper in form)
    const brandProducts = formData.brand
        ? products.filter(p => (p.brand || '').toLowerCase() === formData.brand.toLowerCase())
        : [];

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            p.barcode?.includes(debouncedSearchTerm);
        const matchesBrand = selectedBrand === 'all' || (p.brand || '').toLowerCase() === selectedBrand.toLowerCase();
        const matchesCategory = selectedCategory === 'all' || (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesBrand && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground mt-1">Manage your inventory and product catalog</p>
                </div>
                {!isCashier && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedIds.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
                                <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
                            </Button>
                        )}
                        {(user?.role === 'owner' || user?.role === 'staff') && (
                            <>
                                {/* CSV Import/Export Buttons */}
                                <input
                                    type="file"
                                    ref={csvInputRef}
                                    accept=".csv"
                                    onChange={handleImportCsv}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadTemplate}
                                    className="gap-2 text-xs"
                                    title="Download a sample CSV template"
                                >
                                    <FileSpreadsheet className="w-4 h-4" /> Template
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => csvInputRef.current?.click()}
                                    disabled={csvImporting}
                                    className="gap-2"
                                >
                                    {csvImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {csvImporting ? 'Importing...' : 'Import CSV'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExportCsv}
                                    disabled={csvExporting}
                                    className="gap-2"
                                >
                                    {csvExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    {csvExporting ? 'Exporting...' : 'Export CSV'}
                                </Button>
                                <Button onClick={() => navigate('/products/new')} className="gap-2">
                                    <Plus className="w-4 h-4" /> Add Product
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, category, brand or barcode..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                >
                    <option value="all">All Brands ({products.length})</option>
                    {brands.map(b => (
                        <option key={b} value={b}>
                            {b} ({products.filter(p => (p.brand || '').toLowerCase() === b.toLowerCase()).length})
                        </option>
                    ))}
                    <option value="">No Brand</option>
                </select>

                <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map(c => (
                        <option key={c} value={c}>
                            {c} ({products.filter(p => (p.category || '').toLowerCase() === c.toLowerCase()).length})
                        </option>
                    ))}
                    <option value="">No Category</option>
                </select>
            </div>

            <ProductTable
                products={filteredProducts}
                readOnly={isCashier}
                onEdit={isCashier ? undefined : handleOpenModal}
                onDelete={isCashier ? undefined : handleDelete}
                onAddVariant={isCashier ? undefined : handleAddVariant}
                selectedIds={isCashier ? [] : selectedIds}
                onSelect={isCashier ? undefined : handleSelectRow}
                onSelectAll={isCashier ? undefined : handleSelectAll}
                onImageUpload={isCashier ? undefined : handleImageUpload}
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Product Name — Dropdown (filtered by brand) or text input */}
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name">Product Name</Label>
                                {(editingProduct || isNewName || !formData.brand || brandProducts.length === 0) ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="name"
                                            required
                                            placeholder="Type product name"
                                            autoFocus={isNewName}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        {isNewName && formData.brand && brandProducts.length > 0 && (
                                            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs"
                                                onClick={() => { setIsNewName(false); setFormData({ ...formData, name: '' }); }}>
                                                Pick Existing
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <select
                                        id="name"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.name}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewName(true);
                                                setFormData({ ...formData, name: '' });
                                            } else {
                                                // Auto-fill category from the selected existing product
                                                const selected = brandProducts.find(p => p.name === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                    category: selected?.category || formData.category,
                                                });
                                            }
                                        }}
                                    >
                                        <option value="">— Select Product —</option>
                                        {brandProducts.map(p => (
                                            <option key={p._id} value={p.name}>
                                                {p.name} {p.variant ? `(${p.variant})` : ''} (Stock: {p.stockQty})
                                            </option>
                                        ))}
                                        <option value="__new__">+ Add New Product</option>
                                    </select>
                                )}
                            </div>

                            {/* Brand — Dropdown with existing brands */}
                            <div className="space-y-2">
                                <Label htmlFor="brand">Brand / Company</Label>
                                {isNewBrand ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="brand"
                                            placeholder="Type new brand name"
                                            autoFocus
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                        <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs"
                                            onClick={() => { setIsNewBrand(false); setFormData({ ...formData, brand: '' }); }}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <select
                                        id="brand"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.brand}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewBrand(true);
                                                setFormData({ ...formData, brand: '' });
                                            } else {
                                                setFormData({ ...formData, brand: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">— Select Brand —</option>
                                        {brands.map(b => (
                                            <option key={b} value={b}>{b} ({products.filter(p => p.brand === b).length} products)</option>
                                        ))}
                                        <option value="__new__">+ Add New Brand</option>
                                    </select>
                                )}
                            </div>

                            {/* Category — Dropdown with existing categories */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                {isNewCategory ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="category"
                                            placeholder="Type new category"
                                            autoFocus
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                        <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs"
                                            onClick={() => { setIsNewCategory(false); setFormData({ ...formData, category: '' }); }}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <select
                                        id="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewCategory(true);
                                                setFormData({ ...formData, category: '' });
                                            } else {
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">— Select Category —</option>
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        <option value="__new__">+ Add New Category</option>
                                    </select>
                                )}
                            </div>

                            {/* Unit Selection Dropdown */}
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <select
                                    id="unit"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.shortName})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Show existing products under selected brand */}
                            {formData.brand && brandProducts.length > 0 && (
                                <div className="col-span-2 bg-muted/50 rounded-lg p-3 border border-border">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                        Existing {formData.brand} products ({brandProducts.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {brandProducts.map(p => (
                                            <span key={p._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {p.name}
                                                {p.variant && <span className="text-[10px] text-purple-400">({p.variant})</span>}
                                                <span className="text-muted-foreground ml-1">[{p.stockQty}]</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Variant / Flavor optional field */}
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="variant">Variant / Flavor / Type <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                                <Input
                                    id="variant"
                                    placeholder="e.g., Magic Masala, Vanilla, 500ml"
                                    value={formData.variant}
                                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode (Optional)</Label>
                                <Input
                                    id="barcode"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                                <Input
                                    id="purchasePrice"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stockQty">Shop Stock</Label>
                                <Input
                                    id="stockQty"
                                    type="number"
                                    required
                                    value={formData.stockQty}
                                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                                    disabled={!!editingProduct}
                                    className={editingProduct ? "bg-muted cursor-not-allowed" : ""}
                                    title={editingProduct ? "Shop Stock is updated via Warehouse transfers or Sales." : ""}
                                />
                            </div>

                            {editingProduct && (
                                <div className="space-y-2 col-span-1 sm:col-span-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Transfer from Warehouse
                                        </Label>
                                        <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                            Total Warehouse Stock: {formData.warehouseStock}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 items-end">
                                        {formData.allocations && formData.allocations.length > 0 && (
                                            <div className="flex-1">
                                                <select
                                                    className="w-full h-10 rounded-md border border-blue-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={formData.sourceWarehouseId}
                                                    onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                                                >
                                                    <option value="" disabled>Select Source Warehouse</option>
                                                    {formData.allocations.map(alloc => (
                                                        <option key={alloc.warehouseId} value={alloc.warehouseId}>
                                                            {alloc.warehouseName} (Stock: {alloc.stockQty})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                placeholder="Qty to move to shop..."
                                                value={formData.transferQty}
                                                onChange={(e) => setFormData({ ...formData, transferQty: e.target.value })}
                                                min={
                                                    (formData.sourceWarehouseId
                                                        ? formData.allocations.find(a => a.warehouseId === formData.sourceWarehouseId)?.stockQty || 0
                                                        : formData.warehouseStock) > 0 ? "1" : "0"
                                                }
                                                max={
                                                    formData.sourceWarehouseId
                                                        ? formData.allocations.find(a => a.warehouseId === formData.sourceWarehouseId)?.stockQty || 0
                                                        : formData.warehouseStock
                                                }
                                                disabled={
                                                    (formData.sourceWarehouseId
                                                        ? formData.allocations.find(a => a.warehouseId === formData.sourceWarehouseId)?.stockQty || 0
                                                        : formData.warehouseStock) <= 0
                                                }
                                                className="border-blue-200 focus-visible:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">
                                        Enter quantity to subtract from Warehouse and add to Shop stock.
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel">Min Stock Level (for alerts)</Label>
                                <Input
                                    id="minStockLevel"
                                    type="number"
                                    value={formData.minStockLevel}
                                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description">Product Description</Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Enter detailed product description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingProduct ? 'Update Product' : 'Add Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Products;
