import { useState, useEffect } from 'react';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Filter, RefreshCw } from 'lucide-react';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('today'); // today, all

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            let url = '/attendance';
            if (filterDate === 'today') {
                url = '/attendance/today';
            }
            const res = await API.get(url);
            setAttendance(res.data.data);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [filterDate]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800';
            case 'clocked_in': return 'bg-blue-100 text-blue-800';
            case 'clocked_out': return 'bg-gray-100 text-gray-800';
            case 'on_break': return 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
            case 'absent': return 'bg-red-100 text-red-800';
            case 'on_leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes || minutes <= 0) return '—';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="font-semibold">{filterDate === 'today' ? "Today's Status" : "Attendance History"}</h3>
                        <p className="text-sm text-muted-foreground">Monitor employee check-ins and check-outs</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterDate} onValueChange={setFilterDate}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today Limit</SelectItem>
                            <SelectItem value="all">Full History</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchAttendance}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Employee</TableHead>
                            {filterDate !== 'today' && <TableHead>Date</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Breaks</TableHead>
                            <TableHead className="text-right">Work Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendance.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            attendance.map((record) => (
                                <TableRow key={record._id || record.employee?._id}>
                                    <TableCell className="font-medium">
                                        {record.employee?.name || record.name}
                                        {record.role && <span className="text-xs text-muted-foreground ml-2 capitalize">({record.role})</span>}
                                    </TableCell>
                                    {filterDate !== 'today' && <TableCell>{formatDate(record.date)}</TableCell>}
                                    <TableCell>
                                        <Badge variant="outline" className={`border-0 ${getStatusColor(record.status)}`}>
                                            {record.status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatTime(record.clockIn)}</TableCell>
                                    <TableCell>{formatTime(record.clockOut)}</TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                            {formatDuration(record.totalBreakDuration)}
                                            {record.status === 'on_break' && ' (Active)'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatDuration(record.duration)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default Attendance;
