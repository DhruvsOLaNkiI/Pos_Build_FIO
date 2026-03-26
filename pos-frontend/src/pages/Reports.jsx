import React, { useState, useEffect } from 'react';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    TrendingUp,
    ShoppingCart,
    IndianRupee,
    ReceiptText,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Percent,
    Building2,
    ChevronDown,
    ChevronUp,
    RefreshCcw,
    Download,
    MapPin,
    Store,
    Users,
} from 'lucide-react';

const COLORS = ['#E8DCCA', '#9CA582', '#0a4d22ff', '#4A6B5A', '#2D4A3E', '#1F3329', '#7CB9A8', '#D4A574', '#A8C686', '#6B8F71'];

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Helper function to download data as CSV
const downloadCSV = (data, filename, headers) => {
    if (!data || data.length === 0) {
        alert('No data to download');
        return;
    }

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map((header) => {
            const key = header.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            let value = row[key] || row[header] || '';
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const Reports = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Report data states
    const [salesData, setSalesData] = useState(null);
    const [plData, setPlData] = useState(null);
    const [gstData, setGstData] = useState(null);
    const [transactionsData, setTransactionsData] = useState(null);
    const [gisData, setGisData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sales') {
                const res = await API.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
                setSalesData(res.data.data);
            } else if (activeTab === 'profit-loss') {
                const res = await API.get(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
                setPlData(res.data.data);
            } else if (activeTab === 'gst') {
                const res = await API.get(`/reports/gst?startDate=${startDate}&endDate=${endDate}`);
                setGstData(res.data.data);
            } else if (activeTab === 'transactions') {
                const res = await API.get(`/sales?startDate=${startDate}&endDate=${endDate}`);
                setTransactionsData(res.data.data);
            } else if (activeTab === 'gis') {
                const res = await API.get(`/reports/gis?startDate=${startDate}&endDate=${endDate}`);
                setGisData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab, startDate, endDate]);

    // ======================== SALES TAB ========================
    const SalesTab = () => {
        if (!salesData) return null;

        const paymentPieData = Object.entries(salesData.paymentBreakdown)
            .filter(([, v]) => v > 0)
            .map(([key, value]) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value,
            }));

        return (
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard title="Total Revenue" value={formatCurrency(salesData.totalRevenue)} icon={IndianRupee} color="text-green-400" />
                    <KPICard title="Total Orders" value={salesData.totalOrders} icon={ShoppingCart} color="text-blue-400" />
                    <KPICard title="Avg Order Value" value={formatCurrency(salesData.avgOrderValue)} icon={TrendingUp} color="text-yellow-400" />
                    <KPICard title="Total GST Collected" value={formatCurrency(salesData.totalGST)} icon={ReceiptText} color="text-purple-400" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Trend Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Sales Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {salesData.salesTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesData.salesTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4a6b5a" opacity={0.3} />
                                            <XAxis
                                                dataKey="date"
                                                fontSize={12}
                                                fontWeight={600}
                                                tick={{ fill: '#ffffff' }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                                }}
                                            />
                                            <YAxis
                                                fontSize={12}
                                                fontWeight={600}
                                                tick={{ fill: '#ffffff' }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `₹${v}`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#31473A', color: '#EDF4F2' }}
                                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                                            />
                                            <Bar dataKey="revenue" fill="#E8DCCA" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No sales data for this period
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Method Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {paymentPieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {paymentPieData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#31473A', color: '#EDF4F2' }}
                                                formatter={(value) => [formatCurrency(value)]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No payment data
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead>#</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty Sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesData.topProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No products sold in this period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        salesData.topProducts.map((product, i) => (
                                            <TableRow key={i} className="hover:bg-muted">
                                                <TableCell className="font-medium">{i + 1}</TableCell>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell className="text-right">{product.quantity}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(product.revenue)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Brand-wise Sales Analytics */}
                {salesData.brandSales && salesData.brandSales.length > 0 && (
                    <BrandSalesSection brandSales={salesData.brandSales} />
                )}
            </div>
        );
    };

    // ======================== P&L TAB ========================
    const ProfitLossTab = () => {
        if (!plData) return null;

        const expenseChartData = Object.entries(plData.expenseBreakdown).map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            amount: value,
        }));

        const isProfit = plData.netProfit >= 0;

        return (
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard title="Total Revenue" value={formatCurrency(plData.totalRevenue)} icon={IndianRupee} color="text-green-400" />
                    <KPICard title="Cost of Goods" value={formatCurrency(plData.costOfGoods)} icon={ShoppingCart} color="text-orange-400" />
                    <KPICard title="Total Expenses" value={formatCurrency(plData.totalExpenses)} icon={ArrowDownRight} color="text-red-400" />
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Net Profit</p>
                                    <p className={`text-2xl font-bold mt-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(plData.netProfit)}
                                    </p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isProfit ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                    {isProfit ? <ArrowUpRight className="w-5 h-5 text-green-400" /> : <ArrowDownRight className="w-5 h-5 text-red-400" />}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* P&L Summary Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Profit & Loss Statement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableBody>
                                    <TableRow className="bg-muted">
                                        <TableCell className="font-semibold">Sales Revenue</TableCell>
                                        <TableCell className="text-right font-semibold text-green-400">{formatCurrency(plData.totalRevenue)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="pl-8">Less: Cost of Goods Sold</TableCell>
                                        <TableCell className="text-right text-red-400">- {formatCurrency(plData.costOfGoods)}</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-muted">
                                        <TableCell className="font-semibold">Gross Profit</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(plData.grossProfit)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="pl-8">Less: Operating Expenses</TableCell>
                                        <TableCell className="text-right text-red-400">- {formatCurrency(plData.totalExpenses)}</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-muted border-t-2">
                                        <TableCell className="font-bold text-lg">Net Profit / Loss</TableCell>
                                        <TableCell className={`text-right font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrency(plData.netProfit)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Breakdown Chart */}
                {expenseChartData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Expense Breakdown by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expenseChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4a6b5a" opacity={0.3} />
                                        <XAxis type="number" fontSize={12} fontWeight={600} tick={{ fill: '#ffffff' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                                        <YAxis type="category" dataKey="name" fontSize={12} fontWeight={600} tick={{ fill: '#ffffff' }} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#31473A', color: '#EDF4F2' }}
                                            formatter={(value) => [formatCurrency(value), 'Amount']}
                                        />
                                        <Bar dataKey="amount" fill="#E8DCCA" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    // ======================== GST TAB ========================
    const GSTTab = () => {
        if (!gstData) return null;

        const handleDownloadGST = () => {
            const csvData = gstData.slabs.map(slab => ({
                gstRate: slab.gstPercent + '%',
                taxableValue: slab.taxableValue,
                cgst: slab.cgst,
                sgst: slab.sgst,
                totalTax: slab.totalTax,
                invoiceCount: slab.invoiceCount
            }));
            
            // Add totals row
            csvData.push({
                gstRate: 'TOTAL',
                taxableValue: gstData.totals.taxableValue,
                cgst: gstData.totals.cgst,
                sgst: gstData.totals.sgst,
                totalTax: gstData.totals.totalTax,
                invoiceCount: gstData.totalInvoices
            });
            
            downloadCSV(csvData, `gst_report_${startDate}_to_${endDate}.csv`, [
                'GST Rate', 'Taxable Value', 'CGST', 'SGST', 'Total Tax', 'Invoices'
            ]);
        };

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard title="Total Invoices" value={gstData.totalInvoices} icon={ReceiptText} color="text-blue-400" />
                    <KPICard title="Total Taxable Value" value={formatCurrency(gstData.totals.taxableValue)} icon={IndianRupee} color="text-green-400" />
                    <KPICard title="Total GST" value={formatCurrency(gstData.totals.totalTax)} icon={Percent} color="text-yellow-400" />
                </div>

                {/* GST Slab Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">GST Slab-wise Summary (GSTR-1)</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadGST}
                            disabled={!gstData.slabs || gstData.slabs.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead>GST Rate</TableHead>
                                        <TableHead className="text-right">Taxable Value</TableHead>
                                        <TableHead className="text-right">CGST</TableHead>
                                        <TableHead className="text-right">SGST</TableHead>
                                        <TableHead className="text-right">Total Tax</TableHead>
                                        <TableHead className="text-right">Invoices</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gstData.slabs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                No GST data for this period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {gstData.slabs.map((slab, i) => (
                                                <TableRow key={i} className="hover:bg-muted">
                                                    <TableCell className="font-medium">{slab.gstPercent}%</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(slab.taxableValue)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(slab.cgst)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(slab.sgst)}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatCurrency(slab.totalTax)}</TableCell>
                                                    <TableCell className="text-right">{slab.invoiceCount}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-muted font-bold border-t-2">
                                                <TableCell className="font-bold">TOTAL</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(gstData.totals.taxableValue)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(gstData.totals.cgst)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(gstData.totals.sgst)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(gstData.totals.totalTax)}</TableCell>
                                                <TableCell className="text-right font-bold">{gstData.totalInvoices}</TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ======================== TRANSACTION HISTORY TAB ========================
    const TransactionHistoryTab = () => {
        if (!transactionsData) return null;

        const [expandedInvoice, setExpandedInvoice] = useState(null);
        const [returnModalOpen, setReturnModalOpen] = useState(false);
        const [returnProcessing, setReturnProcessing] = useState(false);
        const [returnForm, setReturnForm] = useState({
            sale: null,
            items: [],
            reason: '',
        });

        const openReturnModal = (sale) => {
            const items = sale.items.map(item => {
                const maxReturn = item.quantity - (item.returnedQty || 0);
                return {
                    ...item,
                    maxReturn,
                    returnQty: 0,
                    addToStock: true
                };
            }).filter(item => item.maxReturn > 0);

            if (items.length === 0) {
                alert("All items in this invoice have already been returned.");
                return;
            }

            setReturnForm({
                sale,
                items,
                reason: ''
            });
            setReturnModalOpen(true);
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
                alert("Please select at least one item to return.");
                return;
            }

            setReturnProcessing(true);
            try {
                await API.put(`/sales/${returnForm.sale._id}/return`, {
                    returnedItems,
                    reason: returnForm.reason
                });
                alert("Return processed successfully");
                setReturnModalOpen(false);
                fetchReport();
            } catch (err) {
                console.error(err);
                alert("Failed to process return");
            } finally {
                setReturnProcessing(false);
            }
        };

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Transaction History</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const csvData = transactionsData.map(sale => ({
                                    date: new Date(sale.createdAt).toLocaleDateString('en-IN'),
                                    time: new Date(sale.createdAt).toLocaleTimeString('en-IN'),
                                    invoiceNo: sale.invoiceNo || 'N/A',
                                    cashier: sale.seller?.name || 'Unknown',
                                    paymentMethod: sale.paymentMethods?.map(pm => pm.method).join(', ') || sale.paymentMethod || 'Unknown',
                                    subtotal: sale.subtotal || 0,
                                    gst: sale.totalGST || 0,
                                    discount: sale.discount || 0,
                                    grandTotal: sale.grandTotal || 0,
                                    status: sale.returnStatus || 'normal'
                                }));
                                downloadCSV(csvData, `transactions_${startDate}_to_${endDate}.csv`, [
                                    'Date', 'Time', 'Invoice No', 'Cashier', 'Payment Method', 'Subtotal', 'GST', 'Discount', 'Grand Total', 'Status'
                                ]);
                            }}
                            disabled={!transactionsData || transactionsData.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Invoice No</TableHead>
                                        <TableHead>Cashier</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                No transactions found for this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactionsData.map((sale) => (
                                            <React.Fragment key={sale._id}>
                                                <TableRow
                                                    className="hover:bg-muted cursor-pointer transition-colors"
                                                    onClick={() => setExpandedInvoice(expandedInvoice === sale._id ? null : sale._id)}
                                                >
                                                    <TableCell>
                                                        {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {new Date(sale.createdAt).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-blue-400">
                                                        {sale.invoiceNo || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>{sale.seller?.name || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            {sale.paymentMethods && sale.paymentMethods.length > 0 ? (
                                                                sale.paymentMethods.map((pm, i) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-xs">
                                                                        {pm.method}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                                                                    {sale.paymentMethod || 'Unknown'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {formatCurrency(sale.grandTotal || 0)}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded Details Row */}
                                                {expandedInvoice === sale._id && (
                                                    <TableRow className="bg-muted/30">
                                                        <TableCell colSpan={5} className="p-0 border-b">
                                                            <div className="p-4 bg-background border-y border-border m-2 rounded-md shadow-inner">
                                                                <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                                    <ReceiptText className="w-4 h-4 text-blue-400" />
                                                                    Items in {sale.invoiceNo}
                                                                </div>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="bg-muted/50">
                                                                            <TableHead className="h-8 py-1 text-xs">Product</TableHead>
                                                                            <TableHead className="h-8 py-1 text-xs text-right">Price</TableHead>
                                                                            <TableHead className="h-8 py-1 text-xs text-right">Qty</TableHead>
                                                                            <TableHead className="h-8 py-1 text-xs text-right">Returned</TableHead>
                                                                            <TableHead className="h-8 py-1 text-xs text-right">Total</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {sale.items && sale.items.map((item, idx) => (
                                                                            <TableRow key={idx} className="border-b/50 border-border/50 hover:bg-muted/30">
                                                                                <TableCell className="py-2 text-sm">{item?.name || 'Unknown item'}</TableCell>
                                                                                <TableCell className="py-2 text-sm text-right">{formatCurrency(item?.price || 0)}</TableCell>
                                                                                <TableCell className="py-2 text-sm text-right">{item?.quantity || 0}</TableCell>
                                                                                <TableCell className="py-2 text-sm text-right text-destructive font-medium">{item?.returnedQty || 0}</TableCell>
                                                                                <TableCell className="py-2 text-sm text-right font-medium">{formatCurrency(item?.total || 0)}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                                {/* Summary block */}
                                                                <div className="mt-3 flex justify-end">
                                                                    <div className="w-[250px] space-y-1 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Subtotal</span>
                                                                            <span>{formatCurrency(sale.subtotal || 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Summary GST</span>
                                                                            <span>{formatCurrency(sale.totalGST || 0)}</span>
                                                                        </div>
                                                                        {sale.discount > 0 && (
                                                                            <div className="flex justify-between text-green-400">
                                                                                <span>Discount</span>
                                                                                <span>-{formatCurrency(sale.discount || 0)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between font-bold text-base pt-1 border-t border-border mt-1">
                                                                            <span>Grand Total</span>
                                                                            <span>{formatCurrency(sale.grandTotal || 0)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-4 flex justify-between items-center border-t border-border pt-3">
                                                                        <div className="flex gap-2">
                                                                            {sale.returnStatus === 'full' ? (
                                                                                <span className="px-3 py-1 bg-destructive/10 text-destructive rounded font-semibold text-sm">Fully Returned</span>
                                                                            ) : sale.returnStatus === 'partial' ? (
                                                                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded font-semibold text-sm">Partially Returned</span>
                                                                            ) : null}
                                                                        </div>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                                            size="sm"
                                                                            disabled={sale.returnStatus === 'full'}
                                                                            onClick={() => openReturnModal(sale)}
                                                                        >
                                                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                                                            Return Items
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Return Modal */}
                <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>Process Return - {returnForm.sale?.invoiceNo}</DialogTitle>
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
                            
                            {/* Summary showing total refund based on selected return qty */}
                            <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
                                <span className="font-medium">Estimated Refund Amount:</span>
                                <span className="text-xl font-bold text-destructive">
                                    {formatCurrency(returnForm.items.reduce((acc, item) => acc + (item.returnQty * (item.total / item.quantity)), 0))}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleProcessReturn} disabled={returnProcessing}>
                                {returnProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                                Process Return & Refund
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    };

    // ======================== GIS REPORT TAB ========================
    const GISTab = () => {
        if (!gisData) return null;

        const { locations, cityWise, summary } = gisData;

        const handleDownloadGIS = () => {
            const csvData = locations.map(loc => ({
                storeName: loc.storeName,
                address: loc.address,
                city: loc.city,
                state: loc.state,
                pincode: loc.pincode,
                totalRevenue: loc.totalRevenue,
                totalOrders: loc.totalOrders,
                uniqueCustomers: loc.uniqueCustomers
            }));
            downloadCSV(csvData, `gis_report_${startDate}_to_${endDate}.csv`, [
                'Store Name', 'Address', 'City', 'State', 'Pincode', 'Total Revenue', 'Total Orders', 'Unique Customers'
            ]);
        };

        const handleDownloadCityWise = () => {
            downloadCSV(cityWise, `city_wise_report_${startDate}_to_${endDate}.csv`, [
                'City', 'State', 'Total Revenue', 'Total Orders', 'Stores'
            ]);
        };

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard title="Total Locations" value={summary.totalLocations} icon={Store} color="text-blue-400" />
                    <KPICard title="Active Stores" value={summary.activeStores} icon={MapPin} color="text-green-400" />
                    <KPICard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={IndianRupee} color="text-yellow-400" />
                    <KPICard title="Total Orders" value={summary.totalOrders} icon={ShoppingCart} color="text-purple-400" />
                </div>

                {/* City-wise Summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            City-wise Sales Summary
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadCityWise}
                            disabled={!cityWise || cityWise.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download City Report
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead>City</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead className="text-right">Stores</TableHead>
                                        <TableHead className="text-right">Total Orders</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cityWise.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                No city data available.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cityWise.map((city, i) => (
                                            <TableRow key={i} className="hover:bg-muted">
                                                <TableCell className="font-medium">{city.city}</TableCell>
                                                <TableCell>{city.state}</TableCell>
                                                <TableCell className="text-right">{city.stores}</TableCell>
                                                <TableCell className="text-right">{city.totalOrders}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(city.totalRevenue)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Store-wise Details */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Store className="w-5 h-5" />
                            Store-wise Details
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadGIS}
                            disabled={!locations || locations.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Full Report
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead>Store Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead className="text-right">Orders</TableHead>
                                        <TableHead className="text-right">Customers</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {locations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                No store location data available.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        locations.map((loc, i) => (
                                            <TableRow key={i} className="hover:bg-muted">
                                                <TableCell className="font-medium">{loc.storeName}</TableCell>
                                                <TableCell className="max-w-xs truncate">{loc.address}</TableCell>
                                                <TableCell>{loc.city}, {loc.state}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={loc.totalOrders > 0 ? 'text-green-400' : 'text-muted-foreground'}>
                                                        {loc.totalOrders}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{loc.uniqueCustomers}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(loc.totalRevenue)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ======================== RENDER ========================
    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-1">Sales, Profit & Loss, GST, and Location reports</p>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border border-border">
                {/* Quick Presets */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {[
                        {
                            label: 'This Week', getRange: () => {
                                const now = new Date();
                                const day = now.getDay();
                                const start = new Date(now);
                                start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
                                return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
                            }
                        },
                        {
                            label: 'This Month', getRange: () => {
                                const now = new Date();
                                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                                return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
                            }
                        },
                        {
                            label: '3 Months', getRange: () => {
                                const now = new Date();
                                const start = new Date();
                                start.setMonth(start.getMonth() - 3);
                                return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
                            }
                        },
                        {
                            label: 'This Year', getRange: () => {
                                const now = new Date();
                                const start = new Date(now.getFullYear(), 0, 1);
                                return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
                            }
                        },
                    ].map((preset) => {
                        const { start, end } = preset.getRange();
                        const isActive = startDate === start && endDate === end;
                        return (
                            <button
                                key={preset.label}
                                onClick={() => { setStartDate(start); setEndDate(end); }}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>

                <div className="h-6 w-px bg-border hidden md:block" />

                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">From</Label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[160px]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">To</Label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[160px]"
                    />
                </div>
                <Button variant="outline" onClick={fetchReport} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="sales">Sales Report</TabsTrigger>
                    <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="gst">GST Report</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="gis">GIS Report</TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="sales">
                            <SalesTab />
                        </TabsContent>
                        <TabsContent value="profit-loss">
                            <ProfitLossTab />
                        </TabsContent>
                        <TabsContent value="gst">
                            <GSTTab />
                        </TabsContent>
                        <TabsContent value="transactions">
                            <TransactionHistoryTab />
                        </TabsContent>
                        <TabsContent value="gis">
                            <GISTab />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
};

// Brand Sales Analytics Section
function BrandSalesSection({ brandSales }) {
    const [expandedBrand, setExpandedBrand] = useState(null);
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'detail'

    const maxRevenue = brandSales[0]?.revenue || 1;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Brand-wise Sales
                </CardTitle>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'chart'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Chart
                    </button>
                    <button
                        onClick={() => setViewMode('detail')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'detail'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Products
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'chart' ? (
                    /* Brand Revenue Bar Chart */
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={brandSales} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a6b5a" opacity={0.3} />
                                <XAxis
                                    type="number"
                                    fontSize={12}
                                    fontWeight={600}
                                    tick={{ fill: '#ffffff' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="brand"
                                    fontSize={12}
                                    fontWeight={600}
                                    tick={{ fill: '#ffffff' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={90}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#31473A', color: '#EDF4F2' }}
                                    formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Qty']}
                                />
                                <Bar dataKey="revenue" fill="#E8DCCA" radius={[0, 4, 4, 0]} barSize={22} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    /* Brand Detail View — expandable per brand */
                    <div className="space-y-3">
                        {brandSales.map((brand, idx) => {
                            const isExpanded = expandedBrand === brand.brand;
                            const barWidth = Math.max((brand.revenue / maxRevenue) * 100, 5);

                            return (
                                <div key={idx} className="border border-border rounded-lg overflow-hidden">
                                    {/* Brand Header */}
                                    <button
                                        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                                        onClick={() => setExpandedBrand(isExpanded ? null : brand.brand)}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <Building2 className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm">{brand.brand}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {brand.products.length} product{brand.products.length > 1 ? 's' : ''} • {brand.quantity} units sold
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="font-bold text-sm">{formatCurrency(brand.revenue)}</div>
                                                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden mt-1">
                                                    <div className="h-full bg-primary/60 rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }} />
                                                </div>
                                            </div>
                                            {isExpanded
                                                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            }
                                        </div>
                                    </button>

                                    {/* Expanded — product breakdown */}
                                    {isExpanded && (
                                        <div className="p-3 border-t border-border bg-card">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30">
                                                        <TableHead>Product</TableHead>
                                                        <TableHead className="text-right">Qty Sold</TableHead>
                                                        <TableHead className="text-right">Revenue</TableHead>
                                                        <TableHead className="text-right">Share</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {brand.products.map((product, pIdx) => (
                                                        <TableRow key={pIdx} className="hover:bg-muted/20">
                                                            <TableCell className="font-medium text-sm">{product.name}</TableCell>
                                                            <TableCell className="text-right">{product.quantity}</TableCell>
                                                            <TableCell className="text-right font-semibold">{formatCurrency(product.revenue)}</TableCell>
                                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                                {((product.revenue / brand.revenue) * 100).toFixed(1)}%
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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
    );
}

// Reusable KPI Card Component
function KPICard({ title, value, icon: Icon, color }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default Reports;
