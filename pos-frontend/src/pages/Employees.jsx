import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'; // Import Tabs
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus, Edit2, Trash2, Shield, User, Smartphone, Mail, Banknote,
    MessageCircle, Calendar, History, TrendingUp, HelpCircle, Wallet,
    ReceiptText, Loader2, KeyRound
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Attendance from '@/components/employees/Attendance'; // Import new components
import LeaveRequests from '@/components/employees/LeaveRequests';

const Employees = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [pendingEmployees, setPendingEmployees] = useState([]);
    const [stores, setStores] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState(user?.role === 'owner' ? 'list' : 'myInfo');

    // Appeals State
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [appealFormData, setAppealFormData] = useState({ subject: '', message: '' });
    const [responseMessage, setResponseMessage] = useState('');

    // Sales Modal State
    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [employeeSalesData, setEmployeeSalesData] = useState([]);
    const [salesLoading, setSalesLoading] = useState(false);

    // Page Access State
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [accessEmployee, setAccessEmployee] = useState(null);
    const [accessPermissions, setAccessPermissions] = useState([]);
    const [accessLoading, setAccessLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'staff',
        phone: '',
        password: '',
        salaryAmount: 0,
        salaryFrequency: 'monthly',
        joiningDate: new Date().toISOString().split('T')[0],
        bonus: 0,
        leaveAllowance: 12,
        shiftStart: '09:00',
        shiftEnd: '17:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        defaultStore: '',
        accessibleStores: [],
        accessibleWarehouses: []
    });

    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PAGE_PERMISSIONS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'billing', label: 'Billing' },
    { key: 'customers', label: 'Customers' },
    { key: 'reports', label: 'Reports' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'products', label: 'Products' },
    { key: 'create_products', label: 'Create Product' },
    { key: 'warehouse_inventory', label: 'Warehouse Inventory' },
    { key: 'expired_products', label: 'Expire Product' },
    { key: 'units', label: 'Units' },
    { key: 'stores', label: 'Stores' },
    { key: 'warehouses', label: 'Warehouses' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'order_tracking', label: 'Order Tracking' },
    { key: 'employees', label: 'People' },
    { key: 'loyalty', label: 'Loyalty & Offers' },
    { key: 'online_orders', label: 'Online Orders' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'settings', label: 'Settings' },
];

    useEffect(() => {
        if (user?.role === 'owner') {
            fetchEmployees();
            fetchStores();
            fetchWarehouses();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await API.get('/employees');
            const allUsers = res.data.data;

            setEmployees(allUsers.filter(u => u.status === 'active' && u.isApproved));
            setPendingEmployees(allUsers.filter(u => !u.isApproved));
        } catch (error) {
            console.error("Error fetching employees", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            const res = await API.get('/stores');
            setStores(res.data.data.filter(s => s.isActive));
        } catch (error) {
            console.error("Error fetching stores", error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await API.get('/warehouses');
            setWarehouses(res.data.data.filter(w => w.isActive));
        } catch (error) {
            console.error("Error fetching warehouses", error);
        }
    };

    const handleOpenModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                name: employee.name,
                email: employee.email,
                role: employee.role,
                phone: employee.phone || '',
                password: '', // Don't fill password on edit
                salaryAmount: employee.salary?.amount || 0,
                salaryFrequency: employee.salary?.frequency || 'monthly',
                designation: employee.designation || 'Staff',
                joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
                bonus: employee.bonus || 0,
                leaveAllowance: employee.leaveAllowance || 12,
                shiftStart: employee.shift?.startTime || '09:00',
                shiftEnd: employee.shift?.endTime || '17:00',
                workingDays: employee.shift?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                defaultStore: employee.defaultStore?._id || '',
                accessibleStores: employee.accessibleStores?.map(s => typeof s === 'string' ? s : s._id) || [],
                accessibleWarehouses: employee.accessibleWarehouses?.map(w => typeof w === 'string' ? w : w._id) || []
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                name: '', email: '', role: 'staff', phone: '', password: '',
                salaryAmount: 0, salaryFrequency: 'monthly', designation: 'Staff', joiningDate: new Date().toISOString().split('T')[0],
                bonus: 0, leaveAllowance: 12, shiftStart: '09:00', shiftEnd: '17:00',
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                defaultStore: '', accessibleStores: [], accessibleWarehouses: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                salary: {
                    amount: Number(formData.salaryAmount),
                    frequency: formData.salaryFrequency
                },
                bonus: Number(formData.bonus),
                leaveAllowance: Number(formData.leaveAllowance)
            };

            if (editingEmployee) {
                await API.put(`/employees/${editingEmployee._id}`, payload);
                toast({ title: 'Updated', description: 'Employee updated successfully' });
            } else {
                await API.post('/employees', payload);
                toast({ title: 'Created', description: 'Employee created successfully' });
            }
            setIsModalOpen(false);
            fetchEmployees();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Operation failed',
                variant: 'destructive',
            });
        }
    };

    const handleCreateAppeal = async () => {
        try {
            await API.post('/employees/appeal', appealFormData);
            toast({ title: 'Success', description: 'Appeal submitted to manager' });
            setIsAppealModalOpen(false);
            setAppealFormData({ subject: '', message: '' });
            // Refresh our own data if needed (if we have a self-fetch)
            // For now, since it's just a 2-person shop, refresh global or rely on context
            window.location.reload(); // Quick refresh to show in list
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit appeal', variant: 'destructive' });
        }
    };

    const handleRespondToAppeal = async () => {
        try {
            await API.put(`/employees/${selectedEmployeeId}/appeal/${selectedAppeal._id}`, {
                response: responseMessage,
                status: 'resolved'
            });
            toast({ title: 'Success', description: 'Response sent to employee' });
            setIsResponseModalOpen(false);
            setResponseMessage('');
            fetchEmployees();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to send response', variant: 'destructive' });
        }
    };

    const handleApprove = async (id) => {
        try {
            await API.put(`/employees/${id}/approve`, { role: 'staff' });
            toast({ title: 'Approved', description: 'Employee approved successfully' });
            fetchEmployees();
        } catch (error) {
            console.error("Approval failed", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this employee?')) return;
        try {
            await API.delete(`/employees/${id}`);
            toast({ title: 'Deleted', description: 'Employee removed successfully' });
            fetchEmployees();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleOpenAccessModal = (employee) => {
        setAccessEmployee(employee);
        setAccessPermissions(employee.permissions || []);
        setIsAccessModalOpen(true);
    };

    const handleSaveAccess = async () => {
        if (!accessEmployee) return;
        setAccessLoading(true);
        try {
            const res = await API.put(`/employees/${accessEmployee._id}/permissions`, { permissions: accessPermissions });
            if (res.data.success) {
                toast({ title: 'Access Updated', description: `Page access updated for ${accessEmployee.name}` });
                setEmployees(prev => prev.map(e => e._id === accessEmployee._id ? { ...e, permissions: accessPermissions } : e));
                setIsAccessModalOpen(false);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update access', variant: 'destructive' });
        } finally {
            setAccessLoading(false);
        }
    };

    const handlePaySalary = async (employee) => {
        const totalPay = (employee.salary?.amount || 0) + (employee.bonus || 0);
        if (totalPay <= 0) {
            toast({ title: 'Invalid Payment', description: 'Salary amount must be greater than 0', variant: 'destructive' });
            return;
        }

        if (!confirm(`Are you sure you want to pay ₹${totalPay} to ${employee.name}? This will create an Expense record and reset their bonus.`)) return;

        try {
            const res = await API.post(`/employees/${employee._id}/pay-salary`);
            toast({ title: 'Salary Paid', description: res.data?.message || `Successfully paid ${employee.name}` });
            fetchEmployees();
        } catch (error) {
            toast({
                title: 'Payment Failed',
                description: error.response?.data?.message || 'Could not process salary payment',
                variant: 'destructive'
            });
        }
    };

    const handleViewSales = async (employee) => {
        setViewingEmployee(employee);
        setIsSalesModalOpen(true);
        setSalesLoading(true);

        try {
            // Defaulting to the last 30 days for this view
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);

            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];

            const res = await API.get(`/sales?seller=${employee._id}&startDate=${startStr}&endDate=${endStr}`);
            setEmployeeSalesData(res.data.data || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch sales data',
                variant: 'destructive'
            });
            setEmployeeSalesData([]);
        } finally {
            setSalesLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">People</h1>
                    <p className="text-muted-foreground mt-1">Manage staff, attendance, and payroll</p>
                </div>
                {/* Only show Add button if on Employees tab - handled below or kept generic */}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    {user?.role === 'owner' ? (
                        <>
                            <TabsTrigger value="list">Employee List</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance</TabsTrigger>
                            <TabsTrigger value="leaves">Leaves</TabsTrigger>
                            <TabsTrigger value="appeals">Appeals & Support</TabsTrigger>
                        </>
                    ) : (
                        <>
                            <TabsTrigger value="myInfo">My Summary</TabsTrigger>
                            <TabsTrigger value="attendance">My Attendance</TabsTrigger>
                            <TabsTrigger value="leaves">My Leaves</TabsTrigger>
                            <TabsTrigger value="appeals">My Support Requests</TabsTrigger>
                        </>
                    )}
                </TabsList>

                {/* Tab: My Info (Staff Only) */}
                {user?.role !== 'owner' && (
                    <TabsContent value="myInfo" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                    <Banknote className="w-8 h-8" />
                                </div>
                                <h4 className="text-muted-foreground text-sm font-medium">Estimated Pay</h4>
                                <p className="text-3xl font-black mt-1">₹{(user.salary?.amount || 0) + (user.bonus || 0)}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-muted px-2 py-1 rounded">Base: ₹{user.salary?.amount}</span>
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Bonus: +₹{user.bonus}</span>
                                </div>
                            </div>

                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h4 className="text-muted-foreground text-sm font-medium">Leaves Left</h4>
                                <p className="text-3xl font-black mt-1">{user.leaveAllowance || 0} Days</p>
                                <p className="text-xs text-muted-foreground mt-2">Approved this year: 0</p>
                            </div>

                            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                                    <TrendingUp className="w-8 h-8" />
                                </div>
                                <h4 className="text-muted-foreground text-sm font-medium">Last Month</h4>
                                <p className="text-3xl font-black mt-1">₹{user.salary?.amount}</p>
                                <p className="text-xs text-muted-foreground mt-2">Status: Fully Paid</p>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Need help from Manager?</h3>
                                    <p className="text-sm text-muted-foreground">Request salary advances, report issues, or ask questions.</p>
                                </div>
                            </div>
                            <Button onClick={() => setIsAppealModalOpen(true)}>Submit Appeal</Button>
                        </div>
                    </TabsContent>
                )}

                {/* Tab: Employee List (Owner Only) */}
                <TabsContent value="list" className="space-y-6">
                    {/* Pending Approvals (Same as before) */}
                    {pendingEmployees.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5" /> Pending Approvals
                            </h3>
                            <div className="space-y-2">
                                {pendingEmployees.map(emp => (
                                    <div key={emp._id} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground">{emp.email} • {emp.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleApprove(emp._id)}>Approve</Button>
                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(emp._id)}>Reject</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Employees */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Active Staff</h2>
                        <Button onClick={() => handleOpenModal()}>
                            <Plus className="w-4 h-4 mr-2" /> Add Employee
                        </Button>
                    </div>

                    <div className="rounded-md border border-border bg-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Base Salary</TableHead>
                                    <TableHead>Bonus</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Leave Bal</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No active employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <div>
                                                    <p>{employee.name}</p>
                                                    <p className="text-xs text-muted-foreground tracking-tighter">{employee.designation}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-medium capitalize
                                                        ${employee.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                                                            employee.role === 'cashier' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {employee.role}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                                                        {employee.shift?.startTime || '09:00'} - {employee.shift?.endTime || '17:00'}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground mt-0.5">
                                                        {(employee.shift?.workingDays || DAYS_OF_WEEK.slice(0, 6)).map(d => d.substring(0, 3)).join(', ')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>₹{employee.salary?.amount}</TableCell>
                                            <TableCell className="text-green-600 font-bold">₹{employee.bonus || 0}</TableCell>
                                            <TableCell>
                                                {employee.defaultStore ? (
                                                    <span className="flex flex-col text-xs font-medium">
                                                        <span>{employee.defaultStore.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{employee.defaultStore.code}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{employee.leaveAllowance || 12} Days</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 mr-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                                    onClick={() => handleOpenAccessModal(employee)}
                                                    title="Manage Page Access"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5 mr-1" /> Access
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 mr-2 text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={() => handlePaySalary(employee)}
                                                    title="Pay Salary"
                                                >
                                                    <Wallet className="w-3.5 h-3.5 mr-1" /> Pay
                                                </Button>
                                                {employee.role === 'cashier' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 mr-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => handleViewSales(employee)}
                                                        title="View Sales History"
                                                    >
                                                        <ReceiptText className="w-3.5 h-3.5 mr-1" /> Sales
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(employee)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(employee._id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Tab: Attendance */}
                <TabsContent value="attendance">
                    <Attendance />
                </TabsContent>

                {/* Tab: Leaves */}
                <TabsContent value="leaves">
                    <LeaveRequests />
                </TabsContent>

                {/* Tab: Appeals */}
                <TabsContent value="appeals" className="space-y-4">
                    {user?.role === 'owner' ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Staff Requests & Appeals</h3>
                            <div className="grid gap-4">
                                {employees.flatMap(emp =>
                                    (emp.appeals || []).map(appeal => ({ ...appeal, employeeName: emp.name, employeeId: emp._id }))
                                ).length === 0 && (
                                        <div className="bg-card p-10 text-center border rounded-xl text-muted-foreground">
                                            No appeals or requests from staff yet.
                                        </div>
                                    )}
                                {employees.flatMap(emp =>
                                    (emp.appeals || []).map(appeal => ({ ...appeal, employeeName: emp.name, employeeId: emp._id }))
                                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(appeal => (
                                    <div key={appeal._id} className="bg-card p-4 rounded-xl border border-border flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">{appeal.employeeName}</span>
                                                <h4 className="font-bold">{appeal.subject}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black ${appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {appeal.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{appeal.message}</p>
                                            {appeal.response && (
                                                <div className="mt-2 p-2 bg-muted rounded text-xs ">
                                                    <span className="font-bold block mb-1 text-primary">Your Response:</span>
                                                    {appeal.response}
                                                </div>
                                            )}
                                        </div>
                                        {appeal.status === 'pending' && (
                                            <Button size="sm" onClick={() => {
                                                setSelectedAppeal(appeal);
                                                setSelectedEmployeeId(appeal.employeeId);
                                                setIsResponseModalOpen(true);
                                            }}>Respond</Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">My Requests History</h3>
                                <Button onClick={() => setIsAppealModalOpen(true)}>New Appeal</Button>
                            </div>
                            <div className="grid gap-4">
                                {(user.appeals || []).length === 0 && (
                                    <div className="bg-card p-10 text-center border rounded-xl text-muted-foreground">
                                        You haven't submitted any appeals yet.
                                    </div>
                                )}
                                {(user.appeals || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(appeal => (
                                    <div key={appeal._id} className="bg-card p-4 rounded-xl border border-border">
                                        <div className="flex justify-between mb-2">
                                            <h4 className="font-bold">{appeal.subject}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black ${appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {appeal.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{appeal.message}</p>
                                        {appeal.response ? (
                                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs">
                                                <span className="font-black block mb-1 text-green-700 uppercase">Manager Response:</span>
                                                {appeal.response}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-muted-foreground italic">Waiting for manager response...</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Employee Modal (Create/Edit) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                        </div>
                        {!editingEmployee && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••" />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cashier">Cashier</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Designation</Label>
                                <Input value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Senior Chef" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Primary Store</Label>
                            <Select value={formData.defaultStore || 'none'} onValueChange={(v) => setFormData({ ...formData, defaultStore: v === 'none' ? '' : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Default Store" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {stores.map(store => (
                                        <SelectItem key={store._id} value={store._id}>{store.name} ({store.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">This employee will be associated with this store for billing and reporting.</p>
                        </div>

                        <div className="space-y-3 border-t pt-4 mt-2">
                            <h4 className="font-semibold text-sm">Access Control</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Accessible Stores</Label>
                                    <div className="space-y-1 max-h-32 overflow-y-auto border p-2 rounded text-sm bg-muted/20">
                                        {stores.map(store => (
                                            <label key={`store-${store._id}`} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.accessibleStores.includes(store._id)}
                                                    onChange={(e) => {
                                                        const current = formData.accessibleStores;
                                                        setFormData({
                                                            ...formData,
                                                            accessibleStores: e.target.checked
                                                                ? [...current, store._id]
                                                                : current.filter(id => id !== store._id)
                                                        });
                                                    }}
                                                    className="w-4 h-4 rounded border-border"
                                                />
                                                <span className="truncate">{store.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Accessible Warehouses</Label>
                                    <div className="space-y-1 max-h-32 overflow-y-auto border p-2 rounded text-sm bg-muted/20">
                                        {warehouses.map(wh => (
                                            <label key={`wh-${wh._id}`} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.accessibleWarehouses.includes(wh._id)}
                                                    onChange={(e) => {
                                                        const current = formData.accessibleWarehouses;
                                                        setFormData({
                                                            ...formData,
                                                            accessibleWarehouses: e.target.checked
                                                                ? [...current, wh._id]
                                                                : current.filter(id => id !== wh._id)
                                                        });
                                                    }}
                                                    className="w-4 h-4 rounded border-border"
                                                />
                                                <span className="truncate">{wh.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-2">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <Banknote className="w-4 h-4" /> Payroll & Benefits
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Salary Amount</Label>
                                    <Input type="number" value={formData.salaryAmount} onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select value={formData.salaryFrequency} onValueChange={(v) => setFormData({ ...formData, salaryFrequency: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div className="space-y-2">
                                    <Label>Bonus (Current Month)</Label>
                                    <Input type="number" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Leave Allowance (Days)</Label>
                                    <Input type="number" value={formData.leaveAllowance} onChange={(e) => setFormData({ ...formData, leaveAllowance: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div className="space-y-2">
                                    <Label>Shift Start Time</Label>
                                    <Input type="time" value={formData.shiftStart} onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Shift End Time</Label>
                                    <Input type="time" value={formData.shiftEnd} onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2 mt-3">
                                <Label>Working Days</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.workingDays || [];
                                                if (current.includes(day)) {
                                                    setFormData({ ...formData, workingDays: current.filter(d => d !== day) });
                                                } else {
                                                    setFormData({ ...formData, workingDays: [...current, day] });
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${(formData.workingDays || []).includes(day)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background text-muted-foreground border-border hover:bg-muted'
                                                }`}
                                        >
                                            {day.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 mt-3">
                                <Label>Joining Date</Label>
                                <Input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingEmployee ? 'Save Changes' : 'Create Employee'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submit Appeal Modal (Staff Only) */}
            <Dialog open={isAppealModalOpen} onOpenChange={setIsAppealModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Support Appeal</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input placeholder="e.g. Salary Advance Request" value={appealFormData.subject} onChange={(e) => setAppealFormData({ ...appealFormData, subject: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Input className="h-20" placeholder="Explain your request..." value={appealFormData.message} onChange={(e) => setAppealFormData({ ...appealFormData, message: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAppealModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAppeal}>Submit Appeal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Respond to Appeal Modal (Owner Only) */}
            <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Respond to {selectedAppeal?.employeeName}'s Appeal</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-3 rounded text-sm">
                            <p className="font-bold mb-1">{selectedAppeal?.subject}</p>
                            <p className="text-muted-foreground">{selectedAppeal?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Your Response</Label>
                            <Input className="h-20" placeholder="Write your response here..." value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResponseModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRespondToAppeal}>Send Response & Resolve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Sales Modal */}
            <Dialog open={isSalesModalOpen} onOpenChange={setIsSalesModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{viewingEmployee?.name}'s Performance (Last 30 Days)</DialogTitle>
                    </DialogHeader>
                    {salesLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-center">
                                    <p className="text-sm font-semibold text-primary">Customers Billed</p>
                                    <p className="text-3xl font-black text-primary mt-1">{employeeSalesData.length}</p>
                                </div>
                                <div className="bg-green-50 z-0 border border-green-200 p-4 rounded-xl text-center">
                                    <p className="text-sm font-semibold text-green-700">Total Billed Amount</p>
                                    <p className="text-3xl font-black text-green-700 mt-1">
                                        ₹{employeeSalesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted sticky top-0">
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employeeSalesData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                    No sales recorded in the last 30 days.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            employeeSalesData.map(sale => (
                                                <TableRow key={sale._id}>
                                                    <TableCell className="text-xs">
                                                        {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">{sale.invoiceNumber}</TableCell>
                                                    <TableCell>{sale.customer?.name || 'Walk-in Customer'}</TableCell>
                                                    <TableCell className="text-right font-medium">₹{sale.totalAmount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsSalesModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Page Access Dialog */}
            <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Manage Page Access — {accessEmployee?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-muted-foreground font-medium">
                            Select which pages <strong>{accessEmployee?.role === 'cashier' ? 'cashiers' : 'staff'}</strong> can access. Leave unchecked to deny access.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {PAGE_PERMISSIONS.map(perm => (
                                <label
                                    key={perm.key}
                                    onClick={() => {
                                        if (accessPermissions.includes(perm.key)) {
                                            setAccessPermissions(prev => prev.filter(p => p !== perm.key));
                                        } else {
                                            setAccessPermissions(prev => [...prev, perm.key]);
                                        }
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${
                                        accessPermissions.includes(perm.key)
                                            ? 'border-blue-600 bg-blue-50 text-blue-900 border-opacity-100'
                                            : 'border-gray-100 bg-white text-gray-800 hover:border-gray-300'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        accessPermissions.includes(perm.key) ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                        {accessPermissions.includes(perm.key) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tight">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            Note: Owner always has full access. Role-based access still applies.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAccessModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAccess} disabled={accessLoading}>
                            {accessLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Employees;
