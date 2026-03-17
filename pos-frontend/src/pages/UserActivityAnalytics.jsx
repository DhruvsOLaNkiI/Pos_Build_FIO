import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Activity,
    TrendingUp,
    Clock,
    Eye,
    ShoppingBag,
    ShoppingCart,
    RefreshCw,
    Trash2,
    Search,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '@/services/api';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const UserActivityAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState(30);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [companies, setCompanies] = useState([]);

    // Analytics data
    const [analytics, setAnalytics] = useState(null);
    const [engagement, setEngagement] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [pageAnalytics, setPageAnalytics] = useState([]);
    const [returningUsers, setReturningUsers] = useState([]);
    const [cartAbandonment, setCartAbandonment] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

    // Filters
    const [activityTypeFilter, setActivityTypeFilter] = useState('all');
    const [pageFilter, setPageFilter] = useState('');
    const [clearingLogs, setClearingLogs] = useState(false);

    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await API.get('/super-admin/companies');
                setCompanies(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedCompany(res.data.data[0]._id);
                }
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            }
        };
        fetchCompanies();
    }, []);

    // Fetch all data
    useEffect(() => {
        if (selectedCompany) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    await Promise.all([
                        fetchAnalytics(),
                        fetchEngagement(),
                        fetchPopularProducts(),
                        fetchPageAnalytics(),
                        fetchReturningUsers(),
                        fetchCartAbandonment(),
                        fetchLogs(1)
                    ]);
                } catch (error) {
                    console.error('Error fetching user activity data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [selectedCompany, timeRange]);

    const fetchAnalytics = async () => {
        try {
            const res = await API.get(`/super-admin/user-activity/analytics?days=${timeRange}&companyId=${selectedCompany}`);
            console.log('User activity analytics:', res.data.data);
            setAnalytics(res.data.data);
        } catch (error) {
            console.error('Failed to fetch user activity analytics', error);
            setAnalytics({ summary: {}, activityByType: [], dailyTrends: [], hourlyPattern: [] });
        }
    };

    const fetchEngagement = async () => {
        try {
            const res = await API.get(`/super-admin/user-activity/engagement?days=${timeRange}&companyId=${selectedCompany}`);
            setEngagement(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch user engagement', error);
            setEngagement([]);
        }
    };

    const fetchPopularProducts = async () => {
        try {
            const res = await API.get(`/super-admin/user-activity/popular-products?days=${timeRange}&companyId=${selectedCompany}&limit=10`);
            setPopularProducts(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch popular products', error);
            setPopularProducts([]);
        }
    };

    const fetchPageAnalytics = async () => {
        try {
            const res = await API.get(`/super-admin/user-activity/page-analytics?days=${timeRange}&companyId=${selectedCompany}`);
            setPageAnalytics(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch page analytics', error);
            setPageAnalytics([]);
        }
    };

    const fetchReturningUsers = async () => {
        try {
            const res = await API.get(`/super-admin/user-activity/returning-users?days=${timeRange}&companyId=${selectedCompany}`);
            setReturningUsers(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch returning users', error);
            setReturningUsers([]);
        }
    };

    const fetchCartAbandonment = async () => {
        try {
            const res = await API.get(`/super-admin/user-activity/cart-abandonment?days=${timeRange}&companyId=${selectedCompany}`);
            setCartAbandonment(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch cart abandonment', error);
            setCartAbandonment([]);
        }
    };

    const fetchLogs = async (page = 1) => {
        try {
            let query = `page=${page}&limit=50&companyId=${selectedCompany}`;
            if (activityTypeFilter !== 'all') query += `&activityType=${activityTypeFilter}`;
            if (pageFilter) query += `&page=${pageFilter}`;

            const res = await API.get(`/super-admin/user-activity/logs?${query}`);
            setActivityLogs(res.data.data || []);
            setLogsPagination(res.data.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
        } catch (error) {
            console.error('Failed to fetch activity logs', error);
            setActivityLogs([]);
            setLogsPagination({ page: 1, limit: 50, total: 0, pages: 0 });
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear old activity logs? This action cannot be undone.')) return;

        setClearingLogs(true);
        try {
            await API.delete('/super-admin/user-activity/clear-old', {
                data: { companyId: selectedCompany, days: 90 }
            });
            await fetchLogs(1);
        } catch (error) {
            console.error('Failed to clear logs:', error);
            alert('Failed to clear logs');
        } finally {
            setClearingLogs(false);
        }
    };

    const getActivityTypeColor = (type) => {
        const colors = {
            'page_visit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'product_view': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'login': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'logout': 'bg-muted/50 text-muted-foreground border-white/10',
            'purchase': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            'add_to_cart': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'search': 'bg-pink-500/10 text-pink-400 border-pink-500/20'
        };
        return colors[type] || 'bg-muted/50 text-muted-foreground border-white/10';
    };

    if (loading && !analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">User Activity Monitoring</h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Track user behavior, engagement, and activity patterns</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                            {companies.map((company) => (
                                <SelectItem key={company._id} value={company._id}>
                                    {company.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={timeRange.toString()} onValueChange={(val) => setTimeRange(parseInt(val))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                            <SelectItem value="90">90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-none transition-all hover:bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">
                                    {analytics?.summary?.totalActivities?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <Activity className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-none transition-all hover:bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">
                                    {analytics?.summary?.uniqueUsers?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-none transition-all hover:bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">
                                    {analytics?.summary?.totalSessions?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-none transition-all hover:bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg/User</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">
                                    {analytics?.summary?.avgActivitiesPerUser || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 lg:max-w-[800px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                    <TabsTrigger value="cart-abandonment">Cart</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Daily Trends */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Daily Activity Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics?.dailyTrends || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="activities" stroke="#8b5cf6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="uniqueUsers" stroke="#06b6d4" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Activity by Type */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Activity by Type
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={analytics?.activityByType || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {(analytics?.activityByType || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Hourly Activity Pattern
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={analytics?.hourlyPattern || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="activities" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Engagement Tab */}
                <TabsContent value="engagement" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="w-4 h-4" /> User Engagement Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">User</th>
                                            <th className="px-4 py-2 font-medium">Sessions</th>
                                            <th className="px-4 py-2 font-medium">Page Views</th>
                                            <th className="px-4 py-2 font-medium">Product Views</th>
                                            <th className="px-4 py-2 font-medium">Avg Session</th>
                                            <th className="px-4 py-2 font-medium">Total Time</th>
                                            <th className="px-4 py-2 font-medium">Unique Pages</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {engagement.map((item, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{item.user?.name || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground">{item.user?.email || ''}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{item.totalSessions}</td>
                                                <td className="px-4 py-3">{item.pageViews}</td>
                                                <td className="px-4 py-3">{item.productViews}</td>
                                                <td className="px-4 py-3">{Math.round(item.avgSessionDuration)}s</td>
                                                <td className="px-4 py-3">{Math.round(item.totalDuration / 60)}m</td>
                                                <td className="px-4 py-3">{item.uniquePages}</td>
                                            </tr>
                                        ))}
                                        {engagement.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Users className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No engagement data available</p>
                                                        <p className="text-xs">Users need to visit the portal to generate data</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Returning Users */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Returning Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">User</th>
                                            <th className="px-4 py-2 font-medium">Sessions</th>
                                            <th className="px-4 py-2 font-medium">First Visit</th>
                                            <th className="px-4 py-2 font-medium">Last Visit</th>
                                            <th className="px-4 py-2 font-medium">Days Active</th>
                                            <th className="px-4 py-2 font-medium">Page Views</th>
                                            <th className="px-4 py-2 font-medium">Product Views</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returningUsers.map((item, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{item.user?.name || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground">{item.user?.email || ''}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        {item.sessionCount}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {new Date(item.firstVisit).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {new Date(item.lastVisit).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">{Math.round(item.daysSinceFirstVisit)} days</td>
                                                <td className="px-4 py-3">{item.pageViews}</td>
                                                <td className="px-4 py-3">{item.productViews}</td>
                                            </tr>
                                        ))}
                                        {returningUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <RefreshCw className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No returning users yet</p>
                                                        <p className="text-xs">Users with multiple sessions will appear here</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Popular Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Product</th>
                                            <th className="px-4 py-2 font-medium">Views</th>
                                            <th className="px-4 py-2 font-medium">Unique Viewers</th>
                                            <th className="px-4 py-2 font-medium">Avg Views/User</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {popularProducts.map((product, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium">
                                                    {product.productName || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                                        {product.viewCount}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">{product.uniqueViewers}</td>
                                                <td className="px-4 py-3">
                                                    {(product.viewCount / product.uniqueViewers).toFixed(1)}
                                                </td>
                                            </tr>
                                        ))}
                                        {popularProducts.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No product views yet</p>
                                                        <p className="text-xs">Users need to view products to generate data</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pages Tab */}
                <TabsContent value="pages" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Page Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Page</th>
                                            <th className="px-4 py-2 font-medium">Views</th>
                                            <th className="px-4 py-2 font-medium">Unique Visitors</th>
                                            <th className="px-4 py-2 font-medium">Avg Duration</th>
                                            <th className="px-4 py-2 font-medium">Total Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageAnalytics.map((page, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium truncate max-w-[300px]">
                                                    {page.page}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                        {page.viewCount}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">{page.uniqueVisitors}</td>
                                                <td className="px-4 py-3">{page.avgDuration}s</td>
                                                <td className="px-4 py-3">{Math.round(page.totalDuration / 60)}m</td>
                                            </tr>
                                        ))}
                                        {pageAnalytics.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Eye className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No page visits yet</p>
                                                        <p className="text-xs">Users need to visit pages to generate data</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cart Abandonment Tab */}
                <TabsContent value="cart-abandonment" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" /> Cart Abandonment
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Customers who added items to cart but didn't complete purchase
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Customer</th>
                                            <th className="px-4 py-2 font-medium">Abandoned Items</th>
                                            <th className="px-4 py-2 font-medium">Products in Cart</th>
                                            <th className="px-4 py-2 font-medium">Last Activity</th>
                                            <th className="px-4 py-2 font-medium">Sessions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartAbandonment.map((item, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{item.customer?.name || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground">{item.customer?.mobile || ''}</p>
                                                        <p className="text-xs text-muted-foreground">ID: {item.customer?.customerId || ''}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        {item.abandonedCount}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="max-w-[200px]">
                                                        {item.abandonedItems.slice(0, 3).map((product, idx) => (
                                                            <p key={idx} className="text-xs truncate">{product.productName}</p>
                                                        ))}
                                                        {item.abandonedItems.length > 3 && (
                                                            <p className="text-xs text-muted-foreground">+{item.abandonedItems.length - 3} more</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {new Date(item.lastActivity).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">{item.sessions}</td>
                                            </tr>
                                        ))}
                                        {cartAbandonment.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ShoppingCart className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No cart abandonment data</p>
                                                        <p className="text-xs">Customers who add to cart but don't purchase will appear here</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Activity Logs
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearLogs}
                                    disabled={clearingLogs}
                                >
                                    {clearingLogs ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Clear Old
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-2">
                                <Select value={activityTypeFilter} onValueChange={(val) => setActivityTypeFilter(val)}>
                                    <SelectTrigger className="w-[150px] h-8 text-xs">
                                        <SelectValue placeholder="Activity Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="page_visit">Page Visit</SelectItem>
                                        <SelectItem value="product_view">Product View</SelectItem>
                                        <SelectItem value="login">Login</SelectItem>
                                        <SelectItem value="logout">Logout</SelectItem>
                                        <SelectItem value="purchase">Purchase</SelectItem>
                                        <SelectItem value="add_to_cart">Add to Cart</SelectItem>
                                        <SelectItem value="search">Search</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Filter by page..."
                                    value={pageFilter}
                                    onChange={(e) => setPageFilter(e.target.value)}
                                    className="w-[200px] h-8 text-xs"
                                />
                                <Button size="sm" variant="outline" onClick={() => fetchLogs(1)}>
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Logs Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-3 py-2 font-medium text-xs">Time</th>
                                            <th className="px-3 py-2 font-medium text-xs">User</th>
                                            <th className="px-3 py-2 font-medium text-xs">Type</th>
                                            <th className="px-3 py-2 font-medium text-xs">Page</th>
                                            <th className="px-3 py-2 font-medium text-xs">Product</th>
                                            <th className="px-3 py-2 font-medium text-xs">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activityLogs.map((log, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-3 py-2 text-xs">
                                                    {new Date(log.startTime).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-2 text-xs">
                                                    {log.userId?.name || 'N/A'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="outline" className={`text-xs ${getActivityTypeColor(log.activityType)}`}>
                                                        {log.activityType}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2 text-xs truncate max-w-[150px]">
                                                    {log.page || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-xs truncate max-w-[150px]">
                                                    {log.productName || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-xs">
                                                    {log.duration ? `${log.duration}s` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {activityLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Activity className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No activity logs yet</p>
                                                        <p className="text-xs">User activities will appear here as they use the portal</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Showing {activityLogs.length} of {logsPagination.total} entries
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={logsPagination.page === 1}
                                        onClick={() => fetchLogs(logsPagination.page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span>Page {logsPagination.page} of {logsPagination.pages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={logsPagination.page === logsPagination.pages}
                                        onClick={() => fetchLogs(logsPagination.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default UserActivityAnalytics;
