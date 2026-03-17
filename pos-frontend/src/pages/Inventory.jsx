import React, { useState, useEffect } from 'react';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Package, RefreshCw, ArrowUpRight, Warehouse, XCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';

const Inventory = () => {
    const { user } = useAuth();
    const isCashier = user?.role === 'cashier';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, low
    const [brandFilter, setBrandFilter] = useState('all'); // all, or specific brand
    const [categoryFilter, setCategoryFilter] = useState('all'); // all, or specific category
    const [warehouseFilter, setWarehouseFilter] = useState('all'); // all, or specific warehouse ID
    const [warehouses, setWarehouses] = useState([]);
    const [expandedProducts, setExpandedProducts] = useState({}); // track which products have their batches visible
    const { toast } = useToast();

    // Adjustment State
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null); // specific batch being adjusted
    const [adjustmentQty, setAdjustmentQty] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('add'); // add, subtract, set
    const [expiryDateInput, setExpiryDateInput] = useState('');
    const [mfgDateInput, setMfgDateInput] = useState('');

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [warehouseFilter]);

    const fetchWarehouses = async () => {
        try {
            const res = await API.get('/warehouses');
            setWarehouses(res.data.data);
            // Look for store context
            const storeId = localStorage.getItem('activeStore');
            if (storeId) {
                try {
                    const storeRes = await API.get(`/stores/${storeId}`);
                    if (storeRes.data?.data?.defaultWarehouseId) {
                        setWarehouseFilter(storeRes.data.data.defaultWarehouseId);
                    }
                } catch (e) {
                    console.error("Failed to load store context for warehouse default", e);
                }
            }
        } catch (error) {
            console.error('Failed to fetch warehouses', error);
        }
    };

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const endpoint = warehouseFilter === 'all' ? '/inventory' : `/inventory?warehouseId=${warehouseFilter}`;
            const res = await API.get(endpoint);
            setItems(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustOpen = (item, batch = null) => {
        setSelectedItem(item);
        setSelectedBatch(batch);
        setAdjustmentQty('');

        if (batch) {
            setAdjustmentType('set');
            setAdjustmentQty(batch.quantity.toString());
            setExpiryDateInput(batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '');
            setMfgDateInput(batch.manufacturedDate ? new Date(batch.manufacturedDate).toISOString().split('T')[0] : '');
        } else {
            setAdjustmentType('add');
            setExpiryDateInput('');
            setMfgDateInput('');
        }
        setIsAdjustOpen(true);
    };

    const handleStockUpdate = async () => {
        if (!selectedItem) return;
        const qty = parseInt(adjustmentQty) || 0;

        try {
            await API.put(`/inventory/${selectedItem._id}/adjust`, {
                type: adjustmentType, // Always send the explicit type even if quantity was previously empty
                quantity: qty,
                batchNumber: selectedBatch?.batchNumber,
                expiryDate: expiryDateInput || undefined,
                manufacturedDate: mfgDateInput || undefined,
            });

            toast({ title: 'Updated Successfully', description: `${selectedItem.name} has been updated.` });
            setIsAdjustOpen(false);
            fetchInventory();
        } catch (error) {
            toast({ title: 'Update Failed', description: error.response?.data?.message, variant: 'destructive' });
        }
    };

    const handleResetFilters = () => {
        setSearch('');
        setFilter('all');
        setBrandFilter('all');
        setCategoryFilter('all');
        setWarehouseFilter('all');
    };

    const toggleExpand = (id) => {
        setExpandedProducts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredItems = items.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'low' ? p.stockQty <= p.minStockLevel : true;
        const matchesBrand = brandFilter === 'all' ? true : p.brand === brandFilter;
        const matchesCategory = categoryFilter === 'all' ? true : p.category === categoryFilter;
        return matchesSearch && matchesFilter && matchesBrand && matchesCategory;
    });

    const lowStockCount = items.filter(p => p.stockQty <= p.minStockLevel).length;

    // Get unique brands for the filter dropdown
    const uniqueBrands = [...new Set(items.map(p => p.brand).filter(Boolean))].sort();
    // Get unique categories for the filter dropdown
    const uniqueCategories = [...new Set(items.map(p => p.category).filter(Boolean))].sort();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Warehouse className="w-6 h-6 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Warehouse Inventory</h1>
                    </div>
                    <p className="text-muted-foreground mt-1">Manage warehouse stock levels and adjustments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchInventory}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                        <h3 className="text-2xl font-bold">{items.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                        <h3 className="text-2xl font-bold text-orange-600">{lowStockCount}</h3>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                        <h3 className="text-2xl font-bold">
                            ₹{items.reduce((acc, p) => acc + (p.purchasePrice * (p.stockQty || 0)), 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search warehouse items..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[150px] truncate"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {uniqueCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[150px] truncate"
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                    >
                        <option value="all">All Brands</option>
                        {uniqueBrands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                    <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[150px] truncate"
                        value={warehouseFilter}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
                    >
                            <option value="all">All Warehouses</option>
                        {warehouses.map(wh => (
                            <option key={wh._id} value={wh._id}>{wh.name}</option>
                        ))}
                    </select>
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilter('all')}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'low' ? 'destructive' : 'outline'}
                                onClick={() => setFilter('low')}
                                size="sm"
                            >
                                Low Stock ({lowStockCount})
                            </Button>
                    {(search || filter !== 'all' || brandFilter !== 'all' || categoryFilter !== 'all' || warehouseFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            onClick={handleResetFilters}
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Barcode</TableHead>
                            <TableHead className="text-right">Purchase Price</TableHead>
                            <TableHead className="text-right">Selling Price</TableHead>
                            <TableHead className="text-center">Warehouse Stock</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            {!isCashier && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    No warehouse items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => {
                                const hasBatches = item.batches && item.batches.length > 0;
                                const isExpanded = expandedProducts[item._id];

                                return (
                                    <React.Fragment key={item._id}>
                                        <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => hasBatches && toggleExpand(item._id)}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {hasBatches ? (
                                                        isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <div className="w-4 h-4" /> // spacer
                                                    )}
                                                    <span>{item.name}</span>
                                                    {item.variant && <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">{item.variant}</span>}
                                                    {hasBatches && (
                                                        <span className="text-[10px] font-semibold bg-background px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                                                            {item.batches.length} Batches
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{item.brand || '—'}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{item.barcode || '—'}</TableCell>
                                            <TableCell className="text-right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₹{(item.sellingPrice || 0).toFixed(2)}</TableCell>
                                            <TableCell className="text-center font-bold">{item.stockQty}</TableCell>
                                            <TableCell className="text-center">
                                                {item.stockQty <= item.minStockLevel ? (
                                                    <Badge variant="destructive">Low Stock</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">In Stock</Badge>
                                                )}
                                            </TableCell>
                                            {!isCashier && (
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); handleAdjustOpen(item); }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Add Batch
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>

                                        {/* Render Batches if Expanded */}
                                        {isExpanded && item.batches.map(batch => (
                                            <TableRow key={batch._id || batch.batchNumber} className="bg-background hover:bg-muted/30 transition-colors">
                                                <TableCell className="pl-14">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 inline-block"></span>
                                                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                                            {batch.batchNumber}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                                <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                                <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                                <TableCell className="text-right text-xs">
                                                    <div className="text-muted-foreground">MFD:</div>
                                                    <div>{batch.manufacturedDate ? new Date(batch.manufacturedDate).toLocaleDateString() : 'Not Set'}</div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    <div className="text-muted-foreground">EXP:</div>
                                                    <div className={batch.expiryDate && new Date(batch.expiryDate) < new Date() ? 'text-destructive font-bold' : ''}>
                                                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'Not Set'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-blue-600 dark:text-blue-400">{batch.quantity}</TableCell>
                                                <TableCell className="text-center">
                                                    {batch.quantity <= 0 ? (
                                                        <Badge variant="outline" className="text-muted-foreground">Depleted</Badge>
                                                    ) : batch.expiryDate && new Date(batch.expiryDate) < new Date() ? (
                                                        <Badge variant="destructive">Expired</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Active Batch</Badge>
                                                    )}
                                                </TableCell>
                                                {!isCashier && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleAdjustOpen(item, batch); }}
                                                            className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            Edit / Adjust
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Adjustment Dialog (hidden for cashier, they are read-only) */}
            {!isCashier && (
                <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adjust Warehouse Stock</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4 py-4">
                            <div className="text-sm text-muted-foreground">
                                Adjusting stock for <span className="font-bold text-foreground">{selectedItem.name}</span>
                                {selectedBatch ? (
                                    <span> (Batch: <span className="font-mono text-blue-600 dark:text-blue-400">{selectedBatch.batchNumber}</span>)</span>
                                ) : (
                                    <span> (Entire Warehouse)</span>
                                )}
                                <br />Current Stock: <span className="font-mono">{selectedBatch ? selectedBatch.quantity : selectedItem.warehouseStock}</span>
                            </div>

                            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                                {['add', 'subtract', 'set'].map((type) => (
                                    <button
                                        key={type}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${adjustmentType === type
                                            ? 'bg-background shadow-sm text-primary'
                                            : 'text-muted-foreground hover:bg-background/50'
                                            }`}
                                        onClick={() => setAdjustmentType(type)}
                                    >
                                        {type === 'add' ? 'Add (+)' : type === 'subtract' ? 'Remove (-)' : 'Set To (=)'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    value={adjustmentQty}
                                    onChange={(e) => setAdjustmentQty(e.target.value)}
                                    placeholder="Enter quantity"
                                    autoFocus
                                />
                            </div>

                            <div className="text-sm text-center pt-2">
                                {adjustmentQty && !isNaN(parseInt(adjustmentQty)) && (
                                    <span className="text-muted-foreground">
                                        New Stock will be: <strong className="text-foreground">
                                            {adjustmentType === 'add'
                                                ? (selectedBatch ? selectedBatch.quantity : selectedItem.warehouseStock) + parseInt(adjustmentQty)
                                                : adjustmentType === 'subtract'
                                                    ? (selectedBatch ? selectedBatch.quantity : selectedItem.warehouseStock) - parseInt(adjustmentQty)
                                                    : parseInt(adjustmentQty)}
                                        </strong>
                                    </span>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="space-y-3 border-t pt-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Manufactured Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={mfgDateInput}
                                        onChange={(e) => setMfgDateInput(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={expiryDateInput}
                                        onChange={(e) => setExpiryDateInput(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Set dates to track on the Expire Product page.</p>
                            </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                            <Button onClick={handleStockUpdate}>Save Adjustment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Inventory;
