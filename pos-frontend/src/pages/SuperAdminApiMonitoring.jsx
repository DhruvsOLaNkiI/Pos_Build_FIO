import { useState, useEffect } from 'react';
import API from '@/services/api';
import {
    Activity, Database, Clock, Globe, Server,
    AlertTriangle, Trash2, RefreshCw, ChevronDown,
    Search, Filter, Download, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

const SuperAdminApiMonitoring = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('7');
    const [analytics, setAnalytics] = useState(null);
    const [logs, setLogs] = useState([]);
    const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [pagePerformance, setPagePerformance] = useState([]);
    const [dbPerformance, setDbPerformance] = useState(null);
    const [clearingLogs, setClearingLogs] = useState(false);
    
    // Filters
    const [methodFilter, setMethodFilter] = useState('');
    const [endpointFilter, setEndpointFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchAnalytics = async () => {
        try {
            const res = await API.get(`/super-admin/api-monitoring/analytics?days=${timeRange}`);
            console.log('Analytics data:', res.data.data);
            setAnalytics(res.data.data);
        } catch (error) {
            console.error('Failed to fetch API analytics', error);
            setAnalytics({ summary: {}, topEndpoints: [], topPages: [], dailyStats: [], statusDistribution: [], methodDistribution: [] });
        }
    };

    const fetchLogs = async (page = 1) => {
        try {
            let query = `page=${page}&limit=50`;
            if (methodFilter) query += `&method=${methodFilter}`;
            if (endpointFilter) query += `&endpoint=${endpointFilter}`;
            if (statusFilter) query += `&statusCode=${statusFilter}`;
            
            const res = await API.get(`/super-admin/api-monitoring/logs?${query}`);
            console.log('Logs data:', res.data);
            setLogs(res.data.data || []);
            setLogsPagination(res.data.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
        } catch (error) {
            console.error('Failed to fetch API logs', error);
            setLogs([]);
            setLogsPagination({ page: 1, limit: 50, total: 0, pages: 0 });
        }
    };

    const fetchPagePerformance = async () => {
        try {
            const res = await API.get(`/super-admin/api-monitoring/pages?days=${timeRange}`);
            setPagePerformance(res.data.data);
        } catch (error) {
            console.error('Failed to fetch page performance', error);
        }
    };

    const fetchDbPerformance = async () => {
        try {
            const res = await API.get(`/super-admin/api-monitoring/db-performance?days=${timeRange}`);
            setDbPerformance(res.data.data);
        } catch (error) {
            console.error('Failed to fetch DB performance', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchAnalytics(),
                fetchLogs(1),
                fetchPagePerformance(),
                fetchDbPerformance()
            ]);
            setLoading(false);
        };
        loadData();
    }, [timeRange]);

    const handleClearLogs = async () => {
        if (!window.confirm('Are you sure you want to clear logs older than 30 days?')) return;
        setClearingLogs(true);
        try {
            await API.delete('/super-admin/api-monitoring/logs', { data: { days: 30 } });
            fetchLogs(1);
        } catch (error) {
            console.error('Failed to clear logs', error);
        } finally {
            setClearingLogs(false);
        }
    };

    const handleRefresh = () => {
        fetchAnalytics();
        fetchLogs(logsPagination.page);
        fetchPagePerformance();
        fetchDbPerformance();
    };

    const getStatusColor = (statusCode) => {
        if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
        if (statusCode >= 300 && statusCode < 400) return 'bg-yellow-100 text-yellow-800';
        if (statusCode >= 400 && statusCode < 500) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getMethodColor = (method) => {
        const colors = {
            GET: 'bg-blue-100 text-blue-800',
            POST: 'bg-green-100 text-green-800',
            PUT: 'bg-yellow-100 text-yellow-800',
            PATCH: 'bg-orange-100 text-orange-800',
            DELETE: 'bg-red-100 text-red-800',
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const statusColors = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];
    const methodColors = {
        GET: '#3b82f6',
        POST: '#22c55e',
        PUT: '#f59e0b',
        PATCH: '#f97316',
        DELETE: '#ef4444'
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">API Monitoring</h1>
                    <p className="text-xs text-muted-foreground">
                        Track API usage, database queries, and page performance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] h-9 text-xs">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Last 24 Hours</SelectItem>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Total Requests
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {analytics?.summary?.totalRequests?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                In last {timeRange} days
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Avg Response Time
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {analytics?.summary?.avgResponseTime || 0}ms
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Per request
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                DB Queries
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {analytics?.summary?.totalDbQueries?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total queries executed
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50">
                            <Database className="w-5 h-5 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Error Rate
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {analytics?.summary?.errorRate || 0}%
                            </p>
                            <p className="text-xs text-red-500">
                                {analytics?.summary?.errorCount || 0} errors
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-red-50">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:max-w-[600px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                    <TabsTrigger value="database">Database</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Daily Stats Chart */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Daily Traffic
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics?.dailyStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="Requests"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="totalDbQueries"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="DB Queries"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution */}
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Server className="w-4 h-4" /> Status Codes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-8">
                                <div className="w-40 h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics?.statusDistribution || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={50}
                                                paddingAngle={4}
                                                dataKey="count"
                                                nameKey="_id"
                                            >
                                                {(analytics?.statusDistribution || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {(analytics?.statusDistribution || []).map((item, idx) => (
                                        <div key={item._id} className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: statusColors[idx % statusColors.length] }}
                                            />
                                            <span className="font-medium">{item._id}</span>
                                            <span className="text-muted-foreground">({item.count})</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Method Distribution */}
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> HTTP Methods
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={analytics?.methodDistribution || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {(analytics?.methodDistribution || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={methodColors[entry._id] || '#6b7280'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Pages */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Top Pages Generating Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Page</th>
                                            <th className="px-4 py-2 font-medium">Requests</th>
                                            <th className="px-4 py-2 font-medium">Avg Response Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(analytics?.topPages || []).map((page, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium truncate max-w-[300px]">
                                                    {page.page}
                                                </td>
                                                <td className="px-4 py-3">{page.count.toLocaleString()}</td>
                                                <td className="px-4 py-3">{page.avgResponseTime}ms</td>
                                            </tr>
                                        ))}
                                        {analytics?.topPages?.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-muted-foreground">
                                                    No page data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Endpoints Tab */}
                <TabsContent value="endpoints" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Server className="w-4 h-4" /> Top Endpoints
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Method</th>
                                            <th className="px-4 py-2 font-medium">Endpoint</th>
                                            <th className="px-4 py-2 font-medium">Requests</th>
                                            <th className="px-4 py-2 font-medium">Avg Response Time</th>
                                            <th className="px-4 py-2 font-medium">Avg DB Queries</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(analytics?.topEndpoints || []).map((endpoint, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                                                        {endpoint.method}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-medium truncate max-w-[300px]">
                                                    {endpoint.endpoint}
                                                </td>
                                                <td className="px-4 py-3">{endpoint.count.toLocaleString()}</td>
                                                <td className="px-4 py-3">{endpoint.avgResponseTime}ms</td>
                                                <td className="px-4 py-3">{endpoint.avgDbQueries}</td>
                                            </tr>
                                        ))}
                                        {analytics?.topEndpoints?.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Activity className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No endpoint data available yet</p>
                                                        <p className="text-xs">Navigate around the app to generate API logs</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request Logs */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Recent API Logs
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearLogs}
                                    disabled={clearingLogs}
                                >
                                    {clearingLogs ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
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
                                <Select value={methodFilter || 'all'} onValueChange={(val) => setMethodFilter(val === 'all' ? '' : val)}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Filter by endpoint..."
                                    value={endpointFilter}
                                    onChange={(e) => setEndpointFilter(e.target.value)}
                                    className="w-[200px] h-8 text-xs"
                                />
                                <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="200">200 OK</SelectItem>
                                        <SelectItem value="201">201 Created</SelectItem>
                                        <SelectItem value="400">400 Bad Request</SelectItem>
                                        <SelectItem value="401">401 Unauthorized</SelectItem>
                                        <SelectItem value="404">404 Not Found</SelectItem>
                                        <SelectItem value="500">500 Error</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                            <th className="px-3 py-2 font-medium text-xs">Method</th>
                                            <th className="px-3 py-2 font-medium text-xs">Endpoint</th>
                                            <th className="px-3 py-2 font-medium text-xs">Status</th>
                                            <th className="px-3 py-2 font-medium text-xs">Response Time</th>
                                            <th className="px-3 py-2 font-medium text-xs">DB Queries</th>
                                            <th className="px-3 py-2 font-medium text-xs">Page</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-3 py-2 text-xs">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="outline" className={`text-xs ${getMethodColor(log.method)}`}>
                                                        {log.method}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2 text-xs truncate max-w-[200px]">
                                                    {log.endpoint}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="outline" className={`text-xs ${getStatusColor(log.statusCode)}`}>
                                                        {log.statusCode}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2 text-xs">{log.responseTime}ms</td>
                                                <td className="px-3 py-2 text-xs">{log.dbQueries}</td>
                                                <td className="px-3 py-2 text-xs truncate max-w-[150px]">
                                                    {log.page || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Database className="w-8 h-8 text-muted-foreground/50" />
                                                        <p>No logs available yet</p>
                                                        <p className="text-xs">API requests will be logged automatically as you use the app</p>
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
                                    Showing {logs.length} of {logsPagination.total} entries
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

                {/* Pages Tab */}
                <TabsContent value="pages" className="space-y-6 mt-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Page Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Page</th>
                                            <th className="px-4 py-2 font-medium">Requests</th>
                                            <th className="px-4 py-2 font-medium">Unique Endpoints</th>
                                            <th className="px-4 py-2 font-medium">Avg Response Time</th>
                                            <th className="px-4 py-2 font-medium">Total DB Queries</th>
                                            <th className="px-4 py-2 font-medium">Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagePerformance.map((page, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium truncate max-w-[300px]">
                                                    {page.page}
                                                </td>
                                                <td className="px-4 py-3">{page.requestCount.toLocaleString()}</td>
                                                <td className="px-4 py-3">{page.uniqueEndpoints}</td>
                                                <td className="px-4 py-3">{page.avgResponseTime}ms</td>
                                                <td className="px-4 py-3">{page.totalDbQueries.toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    {page.errorCount > 0 ? (
                                                        <span className="text-red-600 font-medium">{page.errorCount}</span>
                                                    ) : (
                                                        <span className="text-green-600">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {pagePerformance.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                                                    No page performance data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Database Tab */}
                <TabsContent value="database" className="space-y-6 mt-6">
                    {/* DB Query Trends */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Database className="w-4 h-4" /> Daily Database Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={dbPerformance?.dailyDbStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="totalQueries" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Heavy DB Endpoints */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Database className="w-4 h-4" /> Endpoints with Most DB Queries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Method</th>
                                            <th className="px-4 py-2 font-medium">Endpoint</th>
                                            <th className="px-4 py-2 font-medium">Avg Queries</th>
                                            <th className="px-4 py-2 font-medium">Max Queries</th>
                                            <th className="px-4 py-2 font-medium">Total Queries</th>
                                            <th className="px-4 py-2 font-medium">Avg Query Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(dbPerformance?.heavyDbEndpoints || []).map((endpoint, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                                                        {endpoint.method}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-medium truncate max-w-[250px]">
                                                    {endpoint.endpoint}
                                                </td>
                                                <td className="px-4 py-3">{endpoint.avgQueries}</td>
                                                <td className="px-4 py-3">{endpoint.maxQueries}</td>
                                                <td className="px-4 py-3">{endpoint.totalQueries.toLocaleString()}</td>
                                                <td className="px-4 py-3">{endpoint.avgQueryTime}ms</td>
                                            </tr>
                                        ))}
                                        {dbPerformance?.heavyDbEndpoints?.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                                                    No database performance data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Heavy DB Pages */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Pages with Heavy Database Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-4 py-2 font-medium">Page</th>
                                            <th className="px-4 py-2 font-medium">Requests</th>
                                            <th className="px-4 py-2 font-medium">Avg Queries/Request</th>
                                            <th className="px-4 py-2 font-medium">Total Queries</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(dbPerformance?.heavyDbPages || []).map((page, index) => (
                                            <tr key={index} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium truncate max-w-[300px]">
                                                    {page._id}
                                                </td>
                                                <td className="px-4 py-3">{page.requestCount.toLocaleString()}</td>
                                                <td className="px-4 py-3">{page.avgQueriesPerRequest}</td>
                                                <td className="px-4 py-3">{page.totalQueries.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {dbPerformance?.heavyDbPages?.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-muted-foreground">
                                                    No heavy DB page data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SuperAdminApiMonitoring;
