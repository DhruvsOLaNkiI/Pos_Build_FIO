import { useEffect, useMemo, useState } from 'react';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Building2,
    CheckCircle,
    Loader2,
    XCircle,
    Search,
    ArrowUpDown,
    Plus,
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const formatCurrency = (v) =>
    `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const PlanBadge = ({ plan }) => {
    const colors = {
        trial: 'bg-yellow-100 text-yellow-800',
        basic: 'bg-blue-100 text-blue-800',
        premium: 'bg-purple-100 text-purple-800',
        enterprise: 'bg-purple-100 text-purple-800',
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                colors[plan] || colors.trial
            }`}
        >
            {plan}
        </span>
    );
};

const StatusBadge = ({ isActive }) => {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
        >
            {isActive ? (
                <>
                    <CheckCircle className="w-3.5 h-3.5" /> Active
                </>
            ) : (
                <>
                    <XCircle className="w-3.5 h-3.5" /> Inactive
                </>
            )}
        </span>
    );
};

const SuperAdminCompanies = () => {
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createForm, setCreateForm] = useState({
        companyName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerPassword: '',
        plan: 'trial',
    });

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await API.get('/super-admin/companies');
                setCompanies(res.data.data || []);
            } catch (error) {
                console.error('Failed to fetch companies', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateCompany = async (onSuccess) => {
        setCreating(true);
        setCreateError('');
        try {
            const payload = {
                companyName: createForm.companyName.trim(),
                ownerName: createForm.ownerName.trim(),
                ownerEmail: createForm.ownerEmail.trim(),
                ownerPhone: createForm.ownerPhone.trim(),
                ownerPassword: createForm.ownerPassword,
                plan: createForm.plan,
            };

            const res = await API.post('/super-admin/companies', payload);
            const created = res.data?.data?.company;

            if (created) {
                setCompanies((prev) => [created, ...prev]);
            }

            setCreateForm({
                companyName: '',
                ownerName: '',
                ownerEmail: '',
                ownerPhone: '',
                ownerPassword: '',
                plan: 'trial',
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to create company', error);
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'Failed to create company';
            setCreateError(message);
        } finally {
            setCreating(false);
        }
    };

    const totals = useMemo(() => {
        const total = companies.length;
        const active = companies.filter((c) => c.isActive).length;
        const inactive = total - active;
        const locations = companies.length; // placeholder, adapt if you add actual locations
        return { total, active, inactive, locations };
    }, [companies]);

    const filteredCompanies = useMemo(() => {
        let list = [...companies];

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (c) =>
                    c.name?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q)
            );
        }

        if (planFilter !== 'all') {
            list = list.filter((c) => c.plan === planFilter);
        }

        if (statusFilter !== 'all') {
            const active = statusFilter === 'active';
            list = list.filter((c) => !!c.isActive === active);
        }

        list.sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (sortBy === 'revenue') {
                return (b.totalRevenue || 0) - (a.totalRevenue || 0);
            }
            return 0;
        });

        return list;
    }, [companies, search, planFilter, statusFilter, sortBy]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
                    <p className="text-xs text-muted-foreground">
                        Manage all tenant companies, their plans, and status.
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="gap-2 h-9 text-xs md:text-sm">
                            <Plus className="w-4 h-4" />
                            Add Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Company</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        value={createForm.companyName}
                                        onChange={handleCreateChange}
                                        placeholder="Acme Retail Pvt Ltd"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="plan">Plan</Label>
                                    <select
                                        id="plan"
                                        name="plan"
                                        value={createForm.plan}
                                        onChange={handleCreateChange}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="trial">Trial</option>
                                        <option value="basic">Basic</option>
                                        <option value="premium">Premium</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ownerName">Owner Name</Label>
                                    <Input
                                        id="ownerName"
                                        name="ownerName"
                                        value={createForm.ownerName}
                                        onChange={handleCreateChange}
                                        placeholder="Owner full name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ownerEmail">Owner Email</Label>
                                    <Input
                                        id="ownerEmail"
                                        name="ownerEmail"
                                        type="email"
                                        value={createForm.ownerEmail}
                                        onChange={handleCreateChange}
                                        placeholder="owner@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ownerPhone">Owner Phone (optional)</Label>
                                    <Input
                                        id="ownerPhone"
                                        name="ownerPhone"
                                        value={createForm.ownerPhone}
                                        onChange={handleCreateChange}
                                        placeholder="+91-XXXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ownerPassword">Temporary Password</Label>
                                    <Input
                                        id="ownerPassword"
                                        name="ownerPassword"
                                        type="password"
                                        value={createForm.ownerPassword}
                                        onChange={handleCreateChange}
                                        placeholder="Set a temporary password"
                                    />
                                </div>
                            </div>

                            {createError && (
                                <p className="text-xs text-red-600">{createError}</p>
                            )}
                        </div>
                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                disabled={creating}
                                onClick={() => handleCreateCompany()}
                            >
                                {creating ? 'Creating...' : 'Create Company'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Total Companies
                            </p>
                            <p className="mt-1 text-xl font-semibold">{totals.total}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50">
                            <Building2 className="w-5 h-5 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Active Companies
                            </p>
                            <p className="mt-1 text-xl font-semibold">{totals.active}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Inactive Companies
                            </p>
                            <p className="mt-1 text-xl font-semibold">{totals.inactive}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-red-50">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Company Location
                            </p>
                            <p className="mt-1 text-xl font-semibold">{totals.locations}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-sky-50">
                            <Building2 className="w-5 h-5 text-sky-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters + search */}
            <Card className="border-none shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search companies..."
                                className="pl-8 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Select
                                value={planFilter}
                                onValueChange={(val) => setPlanFilter(val)}
                            >
                                <SelectTrigger className="h-8 w-[150px] text-xs">
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => setStatusFilter(val)}
                            >
                                <SelectTrigger className="h-8 w-[150px] text-xs">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                                <SelectTrigger className="h-8 w-[170px] text-xs">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Sort by: Last 7 Days</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="revenue">Highest Revenue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Companies table */}
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> All Companies
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-left">
                                    <th className="px-4 py-2 font-medium text-xs">Company Name</th>
                                    <th className="px-4 py-2 font-medium text-xs">Email</th>
                                    <th className="px-4 py-2 font-medium text-xs">Plan</th>
                                    <th className="px-4 py-2 font-medium text-xs">Created Date</th>
                                    <th className="px-4 py-2 font-medium text-xs">Revenue</th>
                                    <th className="px-4 py-2 font-medium text-xs">Status</th>
                                    <th className="px-4 py-2 font-medium text-xs text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCompanies.map((company) => (
                                    <tr
                                        key={company._id}
                                        className="border-b hover:bg-muted/20 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-sm">{company.name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {company.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <PlanBadge plan={company.plan} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {company.createdAt
                                                ? new Date(
                                                      company.createdAt
                                                  ).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {formatCurrency(company.totalRevenue)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge isActive={company.isActive} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                >
                                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCompanies.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-muted-foreground text-sm"
                                        >
                                            No companies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
                        <span>
                            Showing {filteredCompanies.length} of {companies.length} entries
                        </span>
                        <span>Row per page: 10</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuperAdminCompanies;

