import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building, PackageOpen } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import WarehouseStockManager from '@/components/warehouses/WarehouseStockManager';

const Warehouses = () => {
    const { toast } = useToast();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedManagerWarehouse, setSelectedManagerWarehouse] = useState(null);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', address: '', contactNumber: '', totalCapacity: 0 });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/warehouses');
            setWarehouses(data.data);
        } catch (error) {
            toast({ title: 'Error fetching warehouses', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                totalCapacity: Number(formData.totalCapacity)
            };

            if (editingId) {
                await API.put(`/warehouses/${editingId}`, payload);
                toast({ title: 'Warehouse updated successfully' });
            } else {
                await API.post('/warehouses', payload);
                toast({ title: 'Warehouse created successfully' });
            }
            setIsModalOpen(false);
            fetchWarehouses();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Action failed',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (id, isDefault) => {
        if (isDefault) {
            toast({ title: 'Cannot delete the default warehouse', variant: 'destructive' });
            return;
        }
        if (!window.confirm('Are you sure you want to delete this warehouse?')) return;

        try {
            await API.delete(`/warehouses/${id}`);
            toast({ title: 'Warehouse deleted successfully' });
            fetchWarehouses();
        } catch (error) {
            toast({
                title: 'Cannot delete',
                description: error.response?.data?.message || 'Delete failed',
                variant: 'destructive'
            });
        }
    };

    const openCreateModal = () => {
        setFormData({ name: '', code: '', address: '', contactNumber: '', totalCapacity: 0 });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (wh) => {
        setFormData({
            name: wh.name,
            code: wh.code,
            address: wh.address || '',
            contactNumber: wh.contactNumber || '',
            totalCapacity: wh.totalCapacity || 0
        });
        setEditingId(wh._id);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
                    <p className="text-muted-foreground mt-1">Manage multiple store locations and capacity limits</p>
                </div>
                <Button onClick={openCreateModal} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Warehouse
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Locations</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-right">Max Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading warehouses...</TableCell>
                                </TableRow>
                            ) : warehouses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">No warehouses found.</TableCell>
                                </TableRow>
                            ) : (
                                warehouses.map((wh) => (
                                    <TableRow key={wh._id}>
                                        <TableCell className="font-mono">{wh.code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-bold">{wh.name}</span>
                                                {wh.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{wh.address}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {wh.totalCapacity > 0 ? wh.totalCapacity.toLocaleString() : 'Unlimited'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={wh.isActive ? 'default' : 'secondary'}>
                                                {wh.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" className="mr-2" onClick={() => setSelectedManagerWarehouse(wh)}>
                                                <PackageOpen className="w-4 h-4 mr-2" />
                                                Manage Stock
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(wh)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {!wh.isDefault && (
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(wh._id, wh.isDefault)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-background text-foreground border border-border rounded-xl shadow-xl p-6 w-full max-w-md animate-scale-in my-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Warehouse Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. South Branch"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Warehouse Code</label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="WH-SOUTH"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Capacity (Items)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.totalCapacity}
                                        onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })}
                                        placeholder="0 for unlimited"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Phone / Contact</label>
                                <Input
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="+91..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Address</label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                    placeholder="Full Address"
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingId ? 'Save Changes' : 'Create Warehouse'}</Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Stock Manager Modal */}
            {selectedManagerWarehouse && (
                <WarehouseStockManager
                    warehouse={selectedManagerWarehouse}
                    onClose={() => setSelectedManagerWarehouse(null)}
                />
            )}
        </div>
    );
};

export default Warehouses;
