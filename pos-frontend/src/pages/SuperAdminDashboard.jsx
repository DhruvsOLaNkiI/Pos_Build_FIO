import { useState, useEffect } from 'react';
import API from '@/services/api';
import {
    Building2, Users, DollarSign, CheckCircle, XCircle,
    BarChart3, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const PlanBadge = ({ plan }) => {
    const colors = {
        trial: 'bg-yellow-100 text-yellow-800',
        basic: 'bg-blue-100 text-blue-800',
        premium: 'bg-purple-100 text-purple-800',
        enterprise: 'bg-green-100 text-green-800',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[plan] || colors.trial}`}>
            {plan}
        </span>
    );
};

const buildWeeklyCompaniesData = (companies) => {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - idx));
        return {
            key: d.toDateString(),
            label: days[d.getDay()],
            companies: 0,
        };
    });

    companies.forEach((company) => {
        if (!company.createdAt) return;
        const created = new Date(company.createdAt);
        const key = created.toDateString();
        const bucket = buckets.find((b) => b.key === key);
        if (bucket) {
            bucket.companies += 1;
        }
    });

    return buckets.map(({ key, ...rest }) => rest);
};

const buildMonthlyCompaniesData = (companies) => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${d.getFullYear()}-${d.getMonth()}`,
            label: d.toLocaleString('default', { month: 'short' }),
            companies: 0,
        });
    }

    companies.forEach((company) => {
        if (!company.createdAt) return;
        const created = new Date(company.createdAt);
        const key = `${created.getFullYear()}-${created.getMonth()}`;
        const bucket = months.find((m) => m.key === key);
        if (bucket) bucket.companies += 1;
    });

    return months.map(({ key, ...rest }) => rest);
};

const SuperAdminDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, companiesRes] = await Promise.all([
                    API.get('/super-admin/analytics'),
                    API.get('/super-admin/companies'),
                ]);
                setAnalytics(analyticsRes.data.data);
                setCompanies(companiesRes.data.data);
            } catch (error) {
                console.error('Failed to fetch super admin data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleStatus = async (company) => {
        try {
            await API.put(`/super-admin/companies/${company._id}/status`, {
                isActive: !company.isActive
            });
            setCompanies(prev => prev.map(c =>
                c._id === company._id ? { ...c, isActive: !company.isActive } : c
            ));
        } catch (error) {
            console.error('Failed to update company status', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const planChartData =
        analytics?.planBreakdown?.map((p) => ({
            name: p._id || 'unknown',
            count: p.count,
        })) || [];

    const weeklyCompaniesData = buildWeeklyCompaniesData(companies);
    const monthlyCompaniesData = buildMonthlyCompaniesData(companies);

    const statusPieData = [
        { name: 'Active', value: analytics?.activeCompanies || 0 },
        { name: 'Inactive', value: analytics?.inactiveCompanies || 0 },
    ];

    const statusColors = ['#22c55e', '#ef4444'];

    const recentCompanies = companies.slice(0, 5);

    const expiredCompanies = companies
        .filter(
            (c) =>
                c.subscriptionStatus &&
                c.subscriptionStatus !== 'active'
        )
        .sort((a, b) => {
            const aDate = a.subscriptionEndDate || a.updatedAt || a.createdAt;
            const bDate = b.subscriptionEndDate || b.updatedAt || b.createdAt;
            return new Date(bDate) - new Date(aDate);
        })
        .slice(0, 5);

    const topRevenueCompanies = [...companies]
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        .slice(0, 5);

    const statCards = [
        {
            title: 'Total Companies',
            value: analytics?.totalCompanies || 0,
            icon: Building2,
            sub: `${analytics?.newCompanies || 0} new this month`,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'Active Companies',
            value: analytics?.activeCompanies || 0,
            icon: CheckCircle,
            sub: `${analytics?.inactiveCompanies || 0} suspended`,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            title: 'Total Subscribers',
            value: analytics?.totalUsers || 0,
            icon: Users,
            sub: 'Across all companies',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
        {
            title: 'Total Earnings',
            value: formatCurrency(analytics?.totalRevenue),
            icon: DollarSign,
            sub: `${formatCurrency(analytics?.revenueLastMonth)} last 30 days`,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Hero / Welcome Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 text-white shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-widest opacity-80">
                            Super Admin
                        </p>
                        <h1 className="text-2xl md:text-3xl font-semibold">
                            Welcome back, Admin
                        </h1>
                        <p className="text-xs md:text-sm text-orange-50">
                            {analytics?.newCompanies || 0} new companies subscribed this month!
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {stat.title}
                                </p>
                                <p className="mt-1 text-xl font-semibold">{stat.value}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Middle row: companies chart + revenue chart + top plans */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Companies Created (This Week) */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Companies (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weeklyCompaniesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="companies"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Revenue Summary */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Revenue Overview
                            </span>
                            <span className="text-xs text-muted-foreground">
                                All time · last 30 days
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Total Revenue
                                </p>
                                <p className="text-lg font-semibold">
                                    {formatCurrency(analytics?.totalRevenue)}
                                </p>
                                <p className="text-xs text-emerald-600">
                                    {formatCurrency(analytics?.revenueLastMonth)} last 30 days
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Total Orders
                                </p>
                                <p className="text-lg font-semibold">
                                    {analytics?.totalOrders || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Across all companies
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Plans */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Top Plans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={planChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Extra analytics: companies growth + status split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Monthly Companies Growth */}
                <Card className="border-none shadow-sm xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Companies Growth (Last 6 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={230}>
                            <LineChart data={monthlyCompaniesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="companies"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Active vs Inactive Pie */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Company Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4">
                        <div className="w-32 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={28}
                                        outerRadius={40}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {statusPieData.map((entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={statusColors[index % statusColors.length]}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 text-xs">
                            {statusPieData.map((item, idx) => (
                                <div key={item.name} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: statusColors[idx] }}
                                        />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <span className="font-semibold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom row: companies table + side lists */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Companies Table */}
                <Card className="xl:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> All Tenants
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-left">
                                        <th className="px-4 py-2 font-medium">Company</th>
                                        <th className="px-4 py-2 font-medium">Plan</th>
                                        <th className="px-4 py-2 font-medium">Stores</th>
                                        <th className="px-4 py-2 font-medium">Employees</th>
                                        <th className="px-4 py-2 font-medium">Revenue</th>
                                        <th className="px-4 py-2 font-medium">Status</th>
                                        <th className="px-4 py-2 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company) => (
                                        <tr key={company._id} className="border-b hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold">{company.name}</p>
                                                <p className="text-xs text-muted-foreground">{company.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <PlanBadge plan={company.plan} />
                                            </td>
                                            <td className="px-4 py-3">{company.storeCount}</td>
                                            <td className="px-4 py-3">{company.employeeCount}</td>
                                            <td className="px-4 py-3 font-medium">{formatCurrency(company.totalRevenue)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${company.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                                    {company.isActive ? (
                                                        <><CheckCircle className="w-3.5 h-3.5" /> Active</>
                                                    ) : (
                                                        <><XCircle className="w-3.5 h-3.5" /> Suspended</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    size="sm"
                                                    variant={company.isActive ? 'destructive' : 'default'}
                                                    className="text-xs h-7"
                                                    onClick={() => handleToggleStatus(company)}
                                                >
                                                    {company.isActive ? 'Suspend' : 'Activate'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {companies.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No companies registered yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Side column: recently registered + expired plans */}
                <div className="space-y-6">
                    {/* Recently Registered */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Recently Registered</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            {recentCompanies.map((c) => (
                                <div
                                    key={c._id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{c.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {new Date(c.createdAt).toLocaleDateString()} ·{' '}
                                            {c.employeeCount || 0} users
                                        </p>
                                    </div>
                                    <PlanBadge plan={c.plan} />
                                </div>
                            ))}
                            {recentCompanies.length === 0 && (
                                <p className="text-muted-foreground text-xs">
                                    No recent companies yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Plan Expired */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Recent Plan Updates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            {expiredCompanies.map((c) => (
                                <div
                                    key={c._id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{c.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {c.subscriptionEndDate
                                                ? `Ended ${new Date(
                                                      c.subscriptionEndDate
                                                  ).toLocaleDateString()}`
                                                : c.subscriptionStatus}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                    >
                                        Send Reminder
                                    </Button>
                                </div>
                            ))}
                            {expiredCompanies.length === 0 && (
                                <p className="text-muted-foreground text-xs">
                                    No recent subscription changes.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Revenue Companies */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Top Revenue Companies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            {topRevenueCompanies.map((c) => (
                                <div
                                    key={c._id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{c.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {c.storeCount || 0} stores ·{' '}
                                            {c.employeeCount || 0} users
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(c.totalRevenue)}
                                    </span>
                                </div>
                            ))}
                            {topRevenueCompanies.length === 0 && (
                                <p className="text-muted-foreground text-xs">
                                    No revenue data yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
