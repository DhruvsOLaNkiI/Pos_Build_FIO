import { useState, useEffect } from 'react';
import API from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CalendarPlus, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const LeaveRequests = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        type: 'casual',
        reason: '',
    });

    const isOwner = user?.role === 'owner';

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await API.get('/leaves');
            setLeaves(res.data.data);
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleSubmit = async () => {
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            toast({ title: 'Missing Fields', description: 'Please fill all fields', variant: 'destructive' });
            return;
        }

        try {
            setSubmitting(true);
            await API.post('/leaves', formData);
            toast({ title: 'Request Sent', description: 'Leave request submitted successfully' });
            setIsModalOpen(false);
            setFormData({ startDate: '', endDate: '', type: 'casual', reason: '' });
            fetchLeaves();
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to submit', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await API.put(`/leaves/${id}`, { status });
            toast({ title: status === 'approved' ? 'Approved' : 'Rejected', description: `Leave request ${status}` });
            fetchLeaves();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Leave Management</h3>
                    <p className="text-sm text-muted-foreground">
                        {isOwner ? 'Review and manage leave requests' : 'Request time off and tracking status'}
                    </p>
                </div>
                {!isOwner && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Request Leave
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Employee</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            {isOwner && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaves.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No leave requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            leaves.map((leave) => (
                                <TableRow key={leave._id}>
                                    <TableCell className="font-medium">{leave.employee?.name}</TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                    </TableCell>
                                    <TableCell className="capitalize">{leave.type}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                                        {leave.reason}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                leave.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                    leave.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                        'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                            }
                                        >
                                            {leave.status}
                                        </Badge>
                                    </TableCell>
                                    {isOwner && leave.status === 'pending' && (
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction(leave._id, 'approved')}>
                                                <CheckCircle2 className="w-5 h-5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(leave._id, 'rejected')}>
                                                <XCircle className="w-5 h-5" />
                                            </Button>
                                        </TableCell>
                                    )}
                                    {isOwner && leave.status !== 'pending' && (
                                        <TableCell className="text-right">
                                            <span className="text-xs text-muted-foreground">Converted</span>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Request Leave Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Leave</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="casual">Casual Leave</SelectItem>
                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                    <SelectItem value="earned">Earned Leave</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                placeholder="Reason for leave..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveRequests;
