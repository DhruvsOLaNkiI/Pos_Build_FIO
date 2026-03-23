import { useState } from 'react';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Search,
    ReceiptText,
    RefreshCcw,
    ArrowLeftRight,
    XCircle,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Package
} from 'lucide-react';

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const ReturnExchange = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);

    // Return Modal
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnProcessing, setReturnProcessing] = useState(false);
    const [returnForm, setReturnForm] = useState({ items: [], reason: '' });
    const [returnSuccess, setReturnSuccess] = useState(null);

    // Cancel Modal
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelProcessing, setCancelProcessing] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSelectedSale(null);
        setReturnSuccess(null);
        try {
            const { data } = await API.get(`/sales?invoiceNo=${searchQuery.trim()}`);
            setSearchResults(data.data || []);
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const selectSale = (sale) => {
        setSelectedSale(sale);
        setReturnSuccess(null);
    };

    const openReturnModal = () => {
        if (!selectedSale) return;
        const items = selectedSale.items
            .map(item => {
                const maxReturn = item.quantity - (item.returnedQty || 0);
                return { ...item, maxReturn, returnQty: 0, addToStock: true };
            })
            .filter(item => item.maxReturn > 0);

        if (items.length === 0) {
            alert('All items in this invoice have already been returned.');
            return;
        }
        setReturnForm({ items, reason: '' });
        setReturnModalOpen(true);
    };

    const openCancelModal = () => {
        if (!selectedSale) return;
        if (selectedSale.returnStatus === 'full') {
            alert('This order has already been fully returned.');
            return;
        }
        setCancelReason('');
        setCancelModalOpen(true);
    };

    const handleItemReturnChange = (index, field, value) => {
        const newItems = [...returnForm.items];
        if (field === 'returnQty') {
            const val = parseInt(value, 10);
            newItems[index][field] = isNaN(val) ? 0 : Math.min(Math.max(0, val), newItems[index].maxReturn);
        } else {
            newItems[index][field] = value;
        }
        setReturnForm({ ...returnForm, items: newItems });
    };

    const handleProcessReturn = async () => {
        const returnedItems = returnForm.items
            .filter(i => i.returnQty > 0)
            .map(i => ({
                productId: i.product._id || i.product,
                quantity: i.returnQty,
                addToStock: i.addToStock
            }));

        if (returnedItems.length === 0) {
            alert('Please select at least one item to return.');
            return;
        }

        setReturnProcessing(true);
        try {
            const { data } = await API.put(`/sales/${selectedSale._id}/return`, {
                returnedItems,
                reason: returnForm.reason
            });
            setReturnSuccess({
                type: 'return',
                totalRefund: data.data.returns[data.data.returns.length - 1]?.totalRefund || 0,
                invoiceNo: selectedSale.invoiceNo
            });
            setReturnModalOpen(false);
            setSelectedSale(data.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to process return');
        } finally {
            setReturnProcessing(false);
        }
    };

    const handleCancelOrder = async () => {
        setCancelProcessing(true);
        try {
            // Full cancel = return ALL remaining items
            const returnedItems = selectedSale.items
                .filter(i => (i.quantity - (i.returnedQty || 0)) > 0)
                .map(i => ({
                    productId: i.product._id || i.product,
                    quantity: i.quantity - (i.returnedQty || 0),
                    addToStock: true
                }));

            const { data } = await API.put(`/sales/${selectedSale._id}/return`, {
                returnedItems,
                reason: cancelReason || 'Order cancelled'
            });
            setReturnSuccess({
                type: 'cancel',
                totalRefund: data.data.returns[data.data.returns.length - 1]?.totalRefund || 0,
                invoiceNo: selectedSale.invoiceNo
            });
            setCancelModalOpen(false);
            setSelectedSale(data.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelProcessing(false);
        }
    };

    const estimatedRefund = returnForm.items.reduce(
        (acc, item) => acc + (item.returnQty > 0 ? (item.returnQty * (item.total / item.quantity)) : 0), 0
    );

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <RefreshCcw className="w-8 h-8" />
                    Returns & Exchange
                </h1>
                <p className="text-muted-foreground mt-1">Search an invoice to return, exchange or cancel items</p>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Invoice Number (e.g., INV-17423...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={searchLoading}>
                            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Success Banner */}
            {returnSuccess && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                    returnSuccess.type === 'cancel' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                        : 'bg-green-500/10 border-green-500/20 text-green-500'
                }`}>
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <p className="font-bold">
                            {returnSuccess.type === 'cancel' ? 'Order Cancelled' : 'Return Processed'} Successfully!
                        </p>
                        <p className="text-sm opacity-80">
                            Invoice: {returnSuccess.invoiceNo} • Refund Amount: {formatCurrency(returnSuccess.totalRefund)}
                        </p>
                    </div>
                </div>
            )}

            {/* Search Results + Selected Sale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Search results list */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Search Results ({searchResults.length})
                    </h3>
                    {searchResults.length === 0 && !searchLoading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <ReceiptText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Search for an invoice to get started</p>
                        </div>
                    )}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {searchResults.map(sale => (
                            <button
                                key={sale._id}
                                onClick={() => selectSale(sale)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    selectedSale?._id === sale._id
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm text-blue-400 font-mono">{sale.invoiceNo}</span>
                                    {sale.returnStatus === 'full' ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold">RETURNED</span>
                                    ) : sale.returnStatus === 'partial' ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-bold">PARTIAL</span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">COMPLETED</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    <span className="font-bold text-foreground">{formatCurrency(sale.grandTotal)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {sale.items?.length || 0} items • {sale.orderSource === 'app' ? '🌐 Online' : '🏪 In-Store'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Selected sale details */}
                <div className="lg:col-span-2">
                    {!selectedSale ? (
                        <Card className="h-full flex items-center justify-center min-h-[400px]">
                            <div className="text-center text-muted-foreground">
                                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select an invoice</p>
                                <p className="text-sm">Click on a search result to view details and process returns</p>
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ReceiptText className="w-5 h-5 text-blue-400" />
                                        Invoice: {selectedSale.invoiceNo}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(selectedSale.createdAt).toLocaleString('en-IN')} • Cashier: {selectedSale.seller?.name || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        size="sm"
                                        disabled={selectedSale.returnStatus === 'full'}
                                        onClick={openReturnModal}
                                    >
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Return Items
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={selectedSale.returnStatus === 'full'}
                                        onClick={openCancelModal}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancel Order
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Status bar */}
                                {selectedSale.returnStatus && selectedSale.returnStatus !== 'none' && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                                        selectedSale.returnStatus === 'full'
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-sm font-semibold">
                                            {selectedSale.returnStatus === 'full' ? 'This order has been fully returned / cancelled' : 'Some items have been returned'}
                                        </span>
                                    </div>
                                )}

                                {/* Items Table */}
                                <div className="rounded-md border border-border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted">
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-center">Returned</TableHead>
                                                <TableHead className="text-center">Remaining</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedSale.items.map((item, idx) => {
                                                const returned = item.returnedQty || 0;
                                                const remaining = item.quantity - returned;
                                                return (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-center">
                                                            {returned > 0 ? (
                                                                <span className="text-red-500 font-bold">{returned}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">0</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={remaining === 0 ? 'text-muted-foreground' : 'text-green-500 font-bold'}>
                                                                {remaining}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Summary */}
                                <div className="flex justify-end">
                                    <div className="w-[280px] space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{formatCurrency(selectedSale.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">GST</span>
                                            <span>{formatCurrency(selectedSale.totalGST)}</span>
                                        </div>
                                        {selectedSale.discount > 0 && (
                                            <div className="flex justify-between text-green-500">
                                                <span>Discount</span>
                                                <span>-{formatCurrency(selectedSale.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                                            <span>Grand Total</span>
                                            <span>{formatCurrency(selectedSale.grandTotal)}</span>
                                        </div>
                                        {selectedSale.returns?.length > 0 && (
                                            <div className="flex justify-between text-destructive font-bold pt-1 border-t border-border">
                                                <span>Total Refunded</span>
                                                <span>-{formatCurrency(selectedSale.returns.reduce((a, r) => a + r.totalRefund, 0))}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Return History */}
                                {selectedSale.returns?.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Return History</h4>
                                        {selectedSale.returns.map((ret, i) => (
                                            <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border text-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold">Return #{i + 1}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(ret.returnDate).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mb-1">Reason: {ret.reason}</div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs">
                                                        {ret.items.length} item(s) returned
                                                    </span>
                                                    <span className="font-bold text-destructive">-{formatCurrency(ret.totalRefund)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* ============ RETURN MODAL ============ */}
            <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5" />
                            Process Return - {selectedSale?.invoiceNo}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted text-xs">
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-center">Remaining</TableHead>
                                        <TableHead className="text-center w-24">Return Qty</TableHead>
                                        <TableHead className="text-center">Add to Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returnForm.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium text-sm">{item.name}</TableCell>
                                            <TableCell className="text-right text-sm">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-center text-sm">{item.maxReturn}</TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={item.maxReturn}
                                                    value={item.returnQty === 0 ? '' : item.returnQty}
                                                    onChange={(e) => handleItemReturnChange(idx, 'returnQty', e.target.value)}
                                                    className="h-8 text-center"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 cursor-pointer"
                                                    checked={item.addToStock}
                                                    onChange={(e) => handleItemReturnChange(idx, 'addToStock', e.target.checked)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason for Return</Label>
                            <Input
                                placeholder="e.g., Customer changed mind, defective..."
                                value={returnForm.reason}
                                onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                            />
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
                            <span className="font-medium">Estimated Refund:</span>
                            <span className="text-xl font-bold text-destructive">{formatCurrency(estimatedRefund)}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleProcessReturn} disabled={returnProcessing}>
                            {returnProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                            Process Return
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ CANCEL ORDER MODAL ============ */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <XCircle className="w-5 h-5" />
                            Cancel Entire Order
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <p className="text-sm font-medium text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                This will return ALL remaining items and refund the full amount.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Invoice</Label>
                            <Input value={selectedSale?.invoiceNo || ''} disabled />
                        </div>

                        <div className="space-y-2">
                            <Label>Amount to Refund</Label>
                            <div className="text-2xl font-bold text-destructive">
                                {formatCurrency(
                                    selectedSale?.items?.reduce((acc, i) => {
                                        const remaining = i.quantity - (i.returnedQty || 0);
                                        return acc + (remaining * (i.total / i.quantity));
                                    }, 0) || 0
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason for Cancellation</Label>
                            <Input
                                placeholder="e.g., Customer request, wrong order..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Go Back</Button>
                        <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelProcessing}>
                            {cancelProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ReturnExchange;
