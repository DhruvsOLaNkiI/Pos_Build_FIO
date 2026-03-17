import React, { useState, useEffect } from 'react';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Save, Search, RefreshCw, PackageOpen } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';

import { createPortal } from 'react-dom';

const WarehouseStockManager = ({ warehouse, onClose }) => {
    const { toast } = useToast();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    // For assigning new products
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (warehouse?._id) {
            fetchInventory();
        }
    }, [warehouse]);

    // Fetch existing allocations
    const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data } = await API.get(`/warehouses/${warehouse._id}/inventory`);
            setInventory(data.data);
        } catch (error) {
            toast({ title: 'Error fetching inventory', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // Live search for products that aren't allocated here yet
    useEffect(() => {
        const searchProducts = async () => {
            if (!debouncedSearch) {
                setSearchResults([]);
                return;
            }
            try {
                setIsSearching(true);
                const { data } = await API.get(`/products?search=${debouncedSearch}`);

                // Filter out products already in this warehouse
                const existingIds = new Set(inventory.map(inv => inv.productId?._id));
                const filtered = data.data.filter(p => !existingIds.has(p._id));

                setSearchResults(filtered);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };
        searchProducts();
    }, [debouncedSearch, inventory]);

    const handleAllocate = async (product, newQty) => {
        try {
            await API.post(`/warehouses/${warehouse._id}/inventory`, {
                productId: product._id,
                stockQty: newQty || 0
            });

            toast({ title: `Allocated ${product.name} to ${warehouse.name}` });
            setSearchQuery('');
            setSearchResults([]);
            fetchInventory();
        } catch (error) {
            toast({
                title: 'Allocation Failed',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    };

    const handleUpdateStock = async (inventoryRecordId, productId, newQty) => {
        try {
            await API.post(`/warehouses/${warehouse._id}/inventory`, {
                productId: productId,
                stockQty: newQty
            });

            toast({ title: 'Stock updated' });
            fetchInventory();
        } catch (error) {
            toast({ title: 'Update Failed', variant: 'destructive' });
        }
    };

    const handleRemoveStock = async (inventoryRecordId) => {
        try {
            await API.delete(`/warehouses/${warehouse._id}/inventory/${inventoryRecordId}`);
            toast({ title: 'Item tracking removed from warehouse' });
            fetchInventory();
        } catch (error) {
            toast({
                title: 'Removal Failed',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        }
    };

    if (!document.body) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
            <div className="bg-background text-foreground rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in border border-border overflow-hidden">

                {/* Header */}
                <div className="shrink-0 p-6 border-b border-border flex justify-between items-start bg-muted/50">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <PackageOpen className="w-6 h-6 text-primary" />
                            Stock Manager: {warehouse?.name}
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Allocate global product stock into this specific location.
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0 ml-4">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">

                    {/* Allocation Search */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                        <h3 className="text-sm font-semibold mb-3">Allocate New Product to Warehouse</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search all global products to allocate here..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchQuery && (
                            <div className="mt-2 bg-background border border-border rounded-md shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-3 text-center text-sm text-muted-foreground animate-pulse">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(product => (
                                        <div key={product._id} className="p-3 border-b border-border last:border-0 hover:bg-muted/50 flex justify-between items-center transition-colors">
                                            <div>
                                                <p className="font-medium text-sm">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">Global Stock: {product.stockQty}</p>
                                            </div>
                                            <Button size="sm" onClick={() => handleAllocate(product, 0)}>
                                                Track in this Warehouse
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-sm text-muted-foreground">No matching unallocated products found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Current Inventory Table */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-lg font-semibold">Currently Tracked Here ({inventory.length})</h3>
                            <Button variant="ghost" size="sm" onClick={fetchInventory} disabled={loading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        <div className="border border-border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50 border-b border-border">
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead className="text-right">Global Stock (All)</TableHead>
                                        <TableHead className="text-right">Stock Here</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Loading allocated inventory...
                                            </TableCell>
                                        </TableRow>
                                    ) : inventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No products are currently tracked in this warehouse. Use the search above to add some.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inventory.map((inv) => (
                                            <TableRow key={inv._id}>
                                                <TableCell className="font-medium">
                                                    {inv.productId?.name || 'Unknown Product'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-mono">
                                                    {inv.productId?.barcode || '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {inv.productId?.stockQty || 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        defaultValue={inv.stockQty}
                                                        className="w-24 text-right ml-auto h-8"
                                                        onBlur={(e) => {
                                                            const newQty = Number(e.target.value);
                                                            if (newQty !== inv.stockQty && !isNaN(newQty)) {
                                                                handleUpdateStock(inv._id, inv.productId?._id, newQty);
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            if (window.confirm('Remove tracking for this item from this warehouse?')) {
                                                                handleRemoveStock(inv._id);
                                                            }
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div >,
        document.body
    );
};

export default WarehouseStockManager;
