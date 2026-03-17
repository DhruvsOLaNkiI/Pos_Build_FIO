import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Package, Search, Download, Trash2, AlertTriangle, FileWarning, Plus, Warehouse, Store, Edit3 } from 'lucide-react';
import API from '../services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '@/hooks/useToast';

const ExpiredProducts = () => {
    const [items, setItems] = useState([]);
    const [shopItems, setShopItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortFilter, setSortFilter] = useState('All');
    const [stockSource, setStockSource] = useState('inventory'); // 'inventory' or 'shop'
    const { toast } = useToast();

    // Damage Report State
    const [damageReports, setDamageReports] = useState([]);
    const [isDamageDialogOpen, setIsDamageDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [damageForm, setDamageForm] = useState({
        damageType: 'other',
        quantity: 1,
        description: '',
    });
    const [showReports, setShowReports] = useState(false);

    // Edit Dates State
    const [isEditDatesOpen, setIsEditDatesOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editMfgDate, setEditMfgDate] = useState('');
    const [editExpDate, setEditExpDate] = useState('');

    useEffect(() => {
        fetchItems();
        fetchShopItems();
        fetchDamageReports();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/inventory/expired');
            if (data?.success) {
                setItems(data.data || []);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch inventory products',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchShopItems = async () => {
        try {
            const { data } = await API.get('/products');
            if (data?.success) {
                setShopItems(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch shop products', error);
        }
    };

    const fetchDamageReports = async () => {
        try {
            const { data } = await API.get('/damage-reports');
            if (data?.success) {
                setDamageReports(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch damage reports', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this product tracking?')) return;
        try {
            await API.delete(`/inventory/${id}`);
            toast({ title: 'Success', description: 'Product deleted successfully' });
            fetchItems();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete product',
                variant: 'destructive',
            });
        }
    };

    const openDamageReport = (item) => {
        setSelectedItem(item);
        setDamageForm({
            damageType: 'other',
            quantity: 1,
            description: '',
        });
        setIsDamageDialogOpen(true);
    };

    const submitDamageReport = async () => {
        if (!damageForm.description.trim()) {
            toast({ title: 'Required', description: 'Please describe what happened', variant: 'destructive' });
            return;
        }
        try {
            await API.post('/damage-reports', {
                inventoryItem: selectedItem._id,
                productName: selectedItem.name,
                batchNumber: selectedItem.batchNumber || '',
                damageType: damageForm.damageType,
                quantity: damageForm.quantity,
                description: damageForm.description,
            });
            toast({ title: 'Damage Reported', description: `Damage report filed for ${selectedItem.name}` });
            setIsDamageDialogOpen(false);
            fetchItems();
            fetchDamageReports();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to submit damage report',
                variant: 'destructive',
            });
        }
    };

    const deleteDamageReport = async (id) => {
        if (!confirm('Delete this damage report?')) return;
        try {
            await API.delete(`/damage-reports/${id}`);
            toast({ title: 'Deleted', description: 'Damage report removed' });
            fetchDamageReports();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete report', variant: 'destructive' });
        }
    };

    const openEditDates = (item) => {
        setEditItem(item);
        setEditMfgDate(item.manufacturedDate ? new Date(item.manufacturedDate).toISOString().split('T')[0] : '');
        setEditExpDate(item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '');
        setIsEditDatesOpen(true);
    };

    const saveEditDates = async () => {
        if (!editItem) return;
        try {
            if (stockSource === 'inventory') {
                // Update via inventory adjust (dates only, no stock change)
                await API.put(`/inventory/${editItem._id}/adjust`, {
                    type: 'add',
                    quantity: 0,
                    manufacturedDate: editMfgDate || undefined,
                    expiryDate: editExpDate || undefined,
                });
            } else {
                // Update Product directly
                await API.put(`/products/${editItem._id}`, {
                    manufacturedDate: editMfgDate || null,
                    expiryDate: editExpDate || null,
                });
            }
            toast({ title: 'Dates Updated', description: `${editItem.name} dates saved.` });
            setIsEditDatesOpen(false);
            if (stockSource === 'inventory') fetchItems();
            else fetchShopItems();
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update dates', variant: 'destructive' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const isExpired = (dateString) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    const isExpiringSoon = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const expDate = new Date(dateString);
        return expDate >= today && expDate <= nextWeek;
    };

    // Use the right data source based on toggle
    const activeItems = stockSource === 'inventory' ? items : shopItems;

    // Filter Logic
    const filteredItems = activeItems.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
            (item.barcode && item.barcode.toLowerCase().includes(searchLower)) ||
            (item.batchNumber && item.batchNumber.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;

        const expDate = item.expiryDate || null;

        if (sortFilter === 'Expired' && !isExpired(expDate)) return false;
        if (sortFilter === 'Next 7 Days' && !isExpiringSoon(expDate)) return false;
        if (sortFilter === 'No Expiry' && expDate) return false;

        return true;
    });

    const expiredCount = activeItems.filter(i => isExpired(i.expiryDate)).length;
    const expiringSoonCount = activeItems.filter(i => isExpiringSoon(i.expiryDate)).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-orange-500" />
                        Expire Product
                    </h1>
                    <p className="text-muted-foreground mt-2">Track all products with manufacturing and expiry details.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showReports ? 'default' : 'outline'}
                        onClick={() => setShowReports(!showReports)}
                        className="gap-2"
                    >
                        <FileWarning className="w-4 h-4" />
                        Damage Reports ({damageReports.length})
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <h3 className="text-2xl font-bold">{activeItems.length}</h3>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Expired</p>
                    <h3 className="text-2xl font-bold text-red-500">{expiredCount}</h3>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Expiring in 7 Days</p>
                    <h3 className="text-2xl font-bold text-orange-500">{expiringSoonCount}</h3>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Damage Reports</p>
                    <h3 className="text-2xl font-bold text-yellow-500">{damageReports.length}</h3>
                </div>
            </div>

            {/* Stock Source Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${stockSource === 'inventory'
                        ? 'bg-background shadow-sm text-primary'
                        : 'text-muted-foreground hover:bg-background/50'
                        }`}
                    onClick={() => setStockSource('inventory')}
                >
                    <Warehouse className="w-4 h-4" />
                    Inventory (Warehouse)
                </button>
                <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${stockSource === 'shop'
                        ? 'bg-background shadow-sm text-primary'
                        : 'text-muted-foreground hover:bg-background/50'
                        }`}
                    onClick={() => setStockSource('shop')}
                >
                    <Store className="w-4 h-4" />
                    Shop Stock
                </button>
            </div>

            {/* Damage Reports Section */}
            {showReports && (
                <Card className="border-yellow-500/30 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileWarning className="w-5 h-5 text-yellow-500" />
                            Damage Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted hover:bg-muted">
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Product</TableHead>
                                    <TableHead className="font-semibold">Batch</TableHead>
                                    <TableHead className="font-semibold">Type</TableHead>
                                    <TableHead className="font-semibold">Qty</TableHead>
                                    <TableHead className="font-semibold">What Happened</TableHead>
                                    <TableHead className="font-semibold">Reported By</TableHead>
                                    <TableHead className="text-right font-semibold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {damageReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                                            No damage reports yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    damageReports.map((report) => (
                                        <TableRow key={report._id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(report.createdAt)}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">{report.productName}</TableCell>
                                            <TableCell className="text-sm">
                                                <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border text-xs">
                                                    {report.batchNumber || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${report.damageType === 'expired' ? 'bg-red-500/10 text-red-500' :
                                                    report.damageType === 'broken' ? 'bg-orange-500/10 text-orange-500' :
                                                        report.damageType === 'water_damage' ? 'bg-blue-500/10 text-blue-500' :
                                                            report.damageType === 'defective' ? 'bg-purple-500/10 text-purple-500' :
                                                                'bg-gray-500/10 text-gray-500'
                                                    }`}>
                                                    {report.damageType.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold">{report.quantity}</TableCell>
                                            <TableCell className="text-sm max-w-[300px] truncate">{report.description}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{report.reportedBy?.name || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDamageReport(report._id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Products Table */}
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by SKU, Product or Batch..."
                                className="pl-9 h-10 w-full bg-background border-border"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                value={sortFilter}
                                onChange={(e) => setSortFilter(e.target.value)}
                            >
                                <option value="All">All Products</option>
                                <option value="Expired">Already Expired</option>
                                <option value="Next 7 Days">Expiring in 7 Days</option>
                                <option value="No Expiry">No Expiry Set</option>
                            </select>

                            <Button variant="outline" className="h-10 hover:bg-accent gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted hover:bg-muted">
                                <TableHead className="w-[120px] font-semibold">SKU / Barcode</TableHead>
                                <TableHead className="font-semibold">Product</TableHead>
                                <TableHead className="w-[120px] font-semibold text-center">{stockSource === 'inventory' ? 'Warehouse' : 'Shop'} Stock</TableHead>
                                <TableHead className="w-[150px] font-semibold">Manufactured</TableHead>
                                <TableHead className="w-[150px] font-semibold">Expiry Date</TableHead>
                                <TableHead className="text-right w-[160px] font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Loading products...
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Package className="w-10 h-10 mb-2 opacity-20" />
                                            <p>No products match your criteria</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => {
                                    const expired = isExpired(item.expiryDate);
                                    const expiringSoon = isExpiringSoon(item.expiryDate);
                                    return (
                                        <TableRow key={item._id} className={
                                            expired ? "bg-red-500/5 hover:bg-red-500/10 transition-colors" :
                                                expiringSoon ? "bg-orange-500/5 hover:bg-orange-500/10 transition-colors" : ""
                                        }>
                                            <TableCell className="font-medium text-xs text-muted-foreground">
                                                {item.barcode || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-foreground">{item.name}</span>
                                                    {item.variant && (
                                                        <span className="text-[10px] w-fit font-bold px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                            {item.variant}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold">
                                                {item.stockQty}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(item.manufacturedDate)}
                                            </TableCell>
                                            <TableCell className={`text-sm font-semibold ${expired ? 'text-red-500' : expiringSoon ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                                {formatDate(item.expiryDate)}
                                                {expired && <span className="ml-2 text-[10px] uppercase bg-red-500/10 border border-red-500/20 px-1 py-[2px] rounded">Expired</span>}
                                                {expiringSoon && <span className="ml-2 text-[10px] uppercase bg-orange-500/10 border border-orange-500/20 px-1 py-[2px] rounded text-orange-500">Soon</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs gap-1 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10"
                                                        onClick={() => openDamageReport(item)}
                                                    >
                                                        <FileWarning className="w-3.5 h-3.5" />
                                                        Damage
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item._id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Damage Report Dialog */}
            <Dialog open={isDamageDialogOpen} onOpenChange={setIsDamageDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileWarning className="w-5 h-5 text-yellow-500" />
                            Report Damage
                        </DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-2">
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium">{selectedItem.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Batch: {selectedItem.batchNumber || 'N/A'} &nbsp;|&nbsp; Stock: {selectedItem.stockQty}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Damage Type</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={damageForm.damageType}
                                    onChange={(e) => setDamageForm({ ...damageForm, damageType: e.target.value })}
                                >
                                    <option value="expired">Expired</option>
                                    <option value="broken">Broken / Physical Damage</option>
                                    <option value="water_damage">Water Damage</option>
                                    <option value="defective">Defective / Quality Issue</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Damaged Quantity</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={damageForm.quantity}
                                    onChange={(e) => setDamageForm({ ...damageForm, quantity: Number(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">This quantity will be deducted from stock.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>What Happened? <span className="text-red-500">*</span></Label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    placeholder="Describe what happened to the product..."
                                    value={damageForm.description}
                                    onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDamageDialogOpen(false)}>Cancel</Button>
                        <Button onClick={submitDamageReport} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            Submit Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dates Dialog */}
            <Dialog open={isEditDatesOpen} onOpenChange={setIsEditDatesOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-blue-500" />
                            Edit Dates
                        </DialogTitle>
                    </DialogHeader>
                    {editItem && (
                        <div className="space-y-4 py-2">
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium">{editItem.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stockSource === 'inventory' ? 'Warehouse' : 'Shop'} Stock: {editItem.stockQty}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Manufactured Date</Label>
                                <Input
                                    type="date"
                                    value={editMfgDate}
                                    onChange={(e) => setEditMfgDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Expiry Date</Label>
                                <Input
                                    type="date"
                                    value={editExpDate}
                                    onChange={(e) => setEditExpDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDatesOpen(false)}>Cancel</Button>
                        <Button onClick={saveEditDates}>Save Dates</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExpiredProducts;
