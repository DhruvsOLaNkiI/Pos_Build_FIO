import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Monitor, Plus, Edit2, Trash2, Power, CircleDollarSign, Clock, Users, History, AlertCircle } from 'lucide-react';
import API from '@/services/api';

const Registers = () => {
    const [registers, setRegisters] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState('');
    
    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    
    const [currentRegister, setCurrentRegister] = useState(null);
    const [registerSessions, setRegisterSessions] = useState([]);
    
    // Forms
    const [formData, setFormData] = useState({ name: '', assignedCashier: '' });
    const [fundAmount, setFundAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedStore) {
            fetchRegisters(selectedStore);
        }
    }, [selectedStore]);

    const fetchInitialData = async () => {
        try {
            const [storesRes, usersRes] = await Promise.all([
                API.get('/stores'),
                API.get('/employees') // Fetch all employees (staff/cashiers)
            ]);
            
            if (storesRes.data.success) {
                setStores(storesRes.data.data);
                if (storesRes.data.data.length > 0) {
                    setSelectedStore(storesRes.data.data[0]._id);
                }
            }
            if (usersRes.data.success) setUsers(usersRes.data.data);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegisters = async (storeId) => {
        setLoading(true);
        try {
            const res = await API.get(`/registers?storeId=${storeId}`);
            if (res.data.success) {
                setRegisters(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch registers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRegister = async (e) => {
        e.preventDefault();
        if (!formData.name) return;
        
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                storeId: selectedStore,
                assignedCashier: formData.assignedCashier || null
            };
            
            if (currentRegister) {
                await API.put(`/registers/${currentRegister._id}`, payload);
            } else {
                await API.post('/registers', payload);
            }
            
            setIsCreateModalOpen(false);
            setFormData({ name: '', assignedCashier: '' });
            setCurrentRegister(null);
            fetchRegisters(selectedStore);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save register');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this register?")) return;
        try {
            await API.delete(`/registers/${id}`);
            fetchRegisters(selectedStore);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete register');
        }
    };

    const handleFundRegister = async (e) => {
        e.preventDefault();
        if (!fundAmount) return;
        
        setIsSubmitting(true);
        try {
            await API.post(`/registers/${currentRegister._id}/open-session`, {
                openingBalance: parseFloat(fundAmount)
            });
            setIsFundModalOpen(false);
            setFundAmount('');
            fetchRegisters(selectedStore);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to fund register');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseSession = async (id) => {
        if (!window.confirm("Only Cashiers usually do this at EoD. Force close session?")) return;
        try {
            await API.post(`/registers/${id}/close-session`, {
                actualBalance: 0,
                note: "Force closed by Manager/Admin"
            });
            fetchRegisters(selectedStore);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to close session');
        }
    };

    const viewSessions = async (reg) => {
        setCurrentRegister(reg);
        setIsSessionsModalOpen(true);
        try {
            const res = await API.get(`/registers/${reg._id}/sessions`);
            if (res.data.success) {
                setRegisterSessions(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        }
    };

    if (loading && stores.length === 0) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cash Registers</h1>
                    <p className="text-gray-500 mt-1">Manage billing counters, assign cashiers, and track daily drawer balances.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                    >
                        {stores.map(store => (
                            <option key={store._id} value={store._id}>{store.name}</option>
                        ))}
                    </select>
                    <Button onClick={() => {
                        setFormData({ name: '', assignedCashier: '' });
                        setCurrentRegister(null);
                        setIsCreateModalOpen(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Register
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : registers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Registers Found</h3>
                    <p className="text-gray-500 mt-1 mb-4">You haven't setup any cash counters for this store yet.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>Create First Register</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registers.map(reg => (
                        <Card key={reg._id} className="relative overflow-hidden group">
                            {/* Status Bar */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${reg.activeSession ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Monitor className="w-5 h-5 text-gray-400" /> {reg.name}
                                        </h3>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 w-fit ${
                                            reg.activeSession ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {reg.activeSession ? '🟢 Session Open' : '⚫ Offline (Closed)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => {
                                            setCurrentRegister(reg);
                                            setFormData({ name: reg.name, assignedCashier: reg.assignedCashier?._id || '' });
                                            setIsCreateModalOpen(true);
                                        }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(reg._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-900 mx-1">Cashier:</span> 
                                        {reg.assignedCashier ? reg.assignedCashier.name : <span className="text-orange-500 text-xs font-bold">UNASSIGNED</span>}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-medium text-gray-900 mx-1">Last seen:</span> 
                                        {reg.deviceInfo ? reg.deviceInfo.substring(0,25) : 'Unknown Device'}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                                    {!reg.activeSession ? (
                                        <Button 
                                            variant="outline" 
                                            className="w-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800"
                                            onClick={() => {
                                                setCurrentRegister(reg);
                                                setIsFundModalOpen(true);
                                            }}
                                        >
                                            <Power className="w-4 h-4 mr-2" /> Add Opening Balance (Fund)
                                        </Button>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Expected Cash</span>
                                                    <span className="font-black text-gray-900">₹{(reg.activeSession.expectedBalance || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200 mx-2"></div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Sales Today</span>
                                                    <span className="font-black text-emerald-600">₹{(reg.activeSession.totalSales || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleCloseSession(reg._id)}
                                            >
                                                <Power className="w-4 h-4 mr-2" /> Force Close Session
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900" onClick={() => viewSessions(reg)}>
                                        <History className="w-4 h-4 mr-2" /> View Session History
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Register Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentRegister ? 'Edit Cash Register' : 'Create New Cash Register'}</DialogTitle>
                        <DialogDescription>Define a physical billing counter in this store.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateRegister}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Register Name/Number</Label>
                                <Input 
                                    placeholder="e.g. Counter 1, Express Lane" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Cashier Assignment (Optional)</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.assignedCashier}
                                    onChange={e => setFormData({...formData, assignedCashier: e.target.value})}
                                >
                                    <option value="">Any Staff/Cashier</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Register
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Fund Register Modal */}
            <Dialog open={isFundModalOpen} onOpenChange={setIsFundModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Opening Balance</DialogTitle>
                        <DialogDescription>Open a new session for <b>{currentRegister?.name}</b> by adding starter cash to the drawer.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFundRegister}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2 relative">
                                <Label>Starting Cash Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                    <Input 
                                        type="number" 
                                        className="pl-8 text-lg font-bold"
                                        placeholder="0.00" 
                                        value={fundAmount} 
                                        onChange={e => setFundAmount(e.target.value)}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex items-start gap-2 border border-blue-100">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>Adding funds will immediately <b>open</b> a new session. Ensure the cashier is ready to start billing.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFundModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Open Session with ₹{fundAmount || '0'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Sessions History Modal */}
            <Dialog open={isSessionsModalOpen} onOpenChange={setIsSessionsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Session History: {currentRegister?.name}</DialogTitle>
                    </DialogHeader>
                    {registerSessions.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No session history found.</div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {registerSessions.map(session => (
                                <div key={session._id} className={`border rounded-xl p-4 ${session.status === 'open' ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900">{new Date(session.openedAt).toLocaleDateString()}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${session.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {session.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Cashier: {session.cashierId?.name || 'Unknown'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-900">Diff: {session.difference === 0 ? <span className="text-emerald-500">Matched</span> : <span className={session.difference > 0 ? 'text-emerald-600' : 'text-red-500'}>₹{session.difference}</span>}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm mt-3">
                                        <div><span className="text-[10px] text-gray-400 font-bold block">OPENING</span><span className="font-bold">₹{session.openingBalance}</span></div>
                                        <div><span className="text-[10px] text-gray-400 font-bold block">SALES (CASH)</span><span className="font-bold text-blue-600">+₹{session.totalSales}</span></div>
                                        <div><span className="text-[10px] text-gray-400 font-bold block">IN/OUT</span><span className="font-bold">₹{session.totalCashIn - session.totalCashOut}</span></div>
                                        <div><span className="text-[10px] text-gray-400 font-bold block">EXPECTED</span><span className="font-bold">₹{session.expectedBalance}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Registers;
