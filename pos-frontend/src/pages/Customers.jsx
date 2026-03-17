import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
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
import { Search, Plus, Edit2, Trash2, Phone, Mail, MapPin, History, ChevronDown, ChevronUp } from 'lucide-react';

const Customers = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        address: '',
    });

    // History state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyCustomer, setHistoryCustomer] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedInvoice, setExpandedInvoice] = useState(null);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/customers');
            setCustomers(data.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch customers',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                mobile: customer.mobile,
                email: customer.email || '',
                address: customer.address || '',
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                mobile: '',
                email: '',
                address: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await API.put(`/customers/${editingCustomer._id}`, formData);
                toast({ title: 'Success', description: 'Customer updated successfully' });
            } else {
                await API.post('/customers', formData);
                toast({ title: 'Success', description: 'Customer added successfully' });
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Operation failed',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await API.delete(`/customers/${id}`);
                toast({ title: 'Success', description: 'Customer deleted' });
                fetchCustomers();
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
            }
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.mobile.includes(debouncedSearchTerm)
    );

    const fetchHistory = async (customer) => {
        try {
            setHistoryLoading(true);
            setHistoryCustomer(customer);
            setIsHistoryOpen(true);
            setExpandedInvoice(null);
            const { data } = await API.get(`/customers/${customer._id}/history`);
            setHistoryData(data.data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch history', variant: 'destructive' });
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground mt-1">Manage customer profiles and history</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Customer
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or mobile number..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Customer ID</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Total Spent</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            {customer.mobile}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {customer.email && (
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <Mail className="w-3 h-3" />
                                                {customer.email}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded-md border border-border">
                                                {customer.customerId || 'N/A'}
                                            </span>
                                            {customer.customerId && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(customer.customerId);
                                                        toast({ title: 'Copied', description: 'Customer ID copied to clipboard' });
                                                    }}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title="Copy ID"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {customer.address && (
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm max-w-[200px] truncate">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                {customer.address}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">₹{(customer.totalSpent || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {customer.loyaltyPoints}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" title="View Purchase History" onClick={() => fetchHistory(customer)}>
                                                <History className="w-4 h-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(customer)}>
                                                <Edit2 className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(customer._id)}>
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number</Label>
                            <Input
                                id="mobile"
                                required
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingCustomer ? 'Update' : 'Add Customer'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Purchase History Dialog */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" /> Purchase History — {historyCustomer?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {historyLoading ? (
                        <div className="py-12 text-center text-muted-foreground">Loading history...</div>
                    ) : historyData.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No purchases found for this customer.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground">
                                {historyData.length} invoice(s) found • Total Spent: <span className="font-bold text-foreground">₹{(historyCustomer?.totalSpent || 0).toFixed(2)}</span>
                            </div>

                            {historyData.map((sale) => (
                                <div key={sale._id} className="border border-border rounded-lg overflow-hidden">
                                    {/* Invoice Header — clickable to expand */}
                                    <button
                                        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                                        onClick={() => setExpandedInvoice(expandedInvoice === sale._id ? null : sale._id)}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-mono text-xs text-muted-foreground">{sale.invoiceNo}</span>
                                            <span className="text-sm font-medium">
                                                {new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {' '}
                                                <span className="text-muted-foreground">
                                                    {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-lg">₹{sale.grandTotal.toFixed(2)}</span>
                                            {expandedInvoice === sale._id ? (
                                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded Invoice Details */}
                                    {expandedInvoice === sale._id && (
                                        <div className="p-3 space-y-3 border-t border-border">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs text-muted-foreground">
                                                        <th className="text-left pb-2">Product</th>
                                                        <th className="text-center pb-2">Qty</th>
                                                        <th className="text-right pb-2">Price</th>
                                                        <th className="text-right pb-2">GST%</th>
                                                        <th className="text-right pb-2">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sale.items.map((item, i) => (
                                                        <tr key={i} className="border-t border-border/30">
                                                            <td className="py-1.5 font-medium">{item.name}</td>
                                                            <td className="py-1.5 text-center">{item.quantity}</td>
                                                            <td className="py-1.5 text-right">₹{item.price.toFixed(2)}</td>
                                                            <td className="py-1.5 text-right">{item.gstPercent || 0}%</td>
                                                            <td className="py-1.5 text-right font-semibold">₹{item.total.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                                                <span>Subtotal: ₹{sale.subtotal.toFixed(2)}</span>
                                                <span>GST: ₹{sale.totalGST.toFixed(2)}</span>
                                                {sale.discount > 0 && <span>Discount: -₹{sale.discount.toFixed(2)}</span>}
                                                <span>Payment: {sale.paymentMethods?.map(p => p.method).join(', ').toUpperCase()}</span>
                                            </div>
                                            {sale.seller && (
                                                <div className="text-xs text-muted-foreground">
                                                    Billed by: {sale.seller.name}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Customers;
