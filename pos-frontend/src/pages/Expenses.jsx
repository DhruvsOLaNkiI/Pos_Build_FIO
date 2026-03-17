import { useState, useEffect } from 'react';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    IndianRupee,
    Calendar,
    Filter,
    Receipt,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
    { value: 'rent', label: 'Rent' },
    { value: 'salary', label: 'Salary' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'water', label: 'Water' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'transport', label: 'Transport' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'miscellaneous', label: 'Miscellaneous' },
    { value: 'other', label: 'Other' },
];

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalAmount, setTotalAmount] = useState(0);
    const [categoryBreakdown, setCategoryBreakdown] = useState({});
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'miscellaneous',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await API.get(`/expenses?${params.toString()}`);
            setExpenses(res.data.data);
            setTotalAmount(res.data.totalAmount);
            setCategoryBreakdown(res.data.categoryBreakdown);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [categoryFilter, startDate, endDate]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchExpenses();
    };

    const openAddDialog = () => {
        setEditingExpense(null);
        setFormData({
            title: '',
            amount: '',
            category: 'miscellaneous',
            description: '',
            date: new Date().toISOString().split('T')[0],
        });
        setDialogOpen(true);
    };

    const openEditDialog = (expense) => {
        setEditingExpense(expense);
        setFormData({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            description: expense.description || '',
            date: new Date(expense.date).toISOString().split('T')[0],
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editingExpense) {
                await API.put(`/expenses/${editingExpense._id}`, {
                    ...formData,
                    amount: Number(formData.amount),
                });
            } else {
                await API.post('/expenses', {
                    ...formData,
                    amount: Number(formData.amount),
                });
            }
            setDialogOpen(false);
            fetchExpenses();
        } catch (err) {
            console.error('Failed to save expense:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await API.delete(`/expenses/${id}`);
            fetchExpenses();
        } catch (err) {
            console.error('Failed to delete expense:', err);
        }
    };

    const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Top 3 categories by spending
    const topCategories = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground mt-1">Track and manage your business expenses</p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
                            </div>
                            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                                <IndianRupee className="w-5 h-5 text-destructive" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Entries</p>
                                <p className="text-2xl font-bold mt-1">{expenses.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-primary-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {topCategories.map(([cat, amount]) => (
                    <Card key={cat}>
                        <CardContent className="p-4">
                            <div>
                                <p className="text-sm text-muted-foreground capitalize">{cat}</p>
                                <p className="text-2xl font-bold mt-1">{formatCurrency(amount)}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search expenses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </form>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[150px]"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[150px]"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead>Date</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No expenses found
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <TableRow key={expense._id} className="hover:bg-muted">
                                    <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                                    <TableCell>{expense.title}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                        {expense.description || '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(expense)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(expense._id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                        <DialogDescription>
                            {editingExpense ? 'Update the expense details below.' : 'Fill in the details for the new expense.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Monthly Rent"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !formData.title || !formData.amount}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : editingExpense ? (
                                'Update'
                            ) : (
                                'Add Expense'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Expenses;
