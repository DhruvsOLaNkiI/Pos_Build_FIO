import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import MapLocationPicker from '@/components/MapLocationPicker';

const Stores = () => {
    const { toast } = useToast();
    const [stores, setStores] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', address: '', pincode: '', contactNumber: '', isDefault: false, defaultWarehouseId: '', latitude: 0, longitude: 0 });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchStores();
        fetchWarehouses();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/stores');
            setStores(data.data);
        } catch (error) {
            toast({ title: 'Error fetching stores', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const { data } = await API.get('/warehouses');
            setWarehouses(data.data);
        } catch (error) {
            console.error('Failed to fetch warehouses', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData
            };

            // Send null instead of empty string if no warehouse is selected
            if (!payload.defaultWarehouseId) {
                payload.defaultWarehouseId = null;
            }

            if (editingId) {
                await API.put(`/stores/${editingId}`, payload);
                toast({ title: 'Store updated successfully' });
            } else {
                await API.post('/stores', payload);
                toast({ title: 'Store created successfully' });
            }
            setIsModalOpen(false);
            fetchStores();
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
            toast({ title: 'Cannot delete the default store', variant: 'destructive' });
            return;
        }
        if (!window.confirm('Are you sure you want to delete this store?')) return;

        try {
            await API.delete(`/stores/${id}`);
            toast({ title: 'Store deleted successfully' });
            fetchStores();
        } catch (error) {
            toast({
                title: 'Cannot delete',
                description: error.response?.data?.message || 'Delete failed',
                variant: 'destructive'
            });
        }
    };

    const openCreateModal = () => {
        setFormData({ name: '', code: '', address: '', pincode: '', contactNumber: '', isDefault: false, defaultWarehouseId: '', latitude: 0, longitude: 0 });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (wh) => {
        setFormData({
            name: wh.name,
            code: wh.code,
            address: wh.address || '',
            pincode: wh.pincode || '',
            contactNumber: wh.contactNumber || '',
            isDefault: wh.isDefault || false,
            defaultWarehouseId: wh.defaultWarehouseId?._id || wh.defaultWarehouseId || '',
            latitude: wh.location?.coordinates?.[1] || 0,
            longitude: wh.location?.coordinates?.[0] || 0,
        });
        setEditingId(wh._id);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
                    <p className="text-muted-foreground mt-1">Manage multiple store locations and capacity limits</p>
                </div>
                <Button onClick={openCreateModal} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Store
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
                                <TableHead>Pincode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading stores...</TableCell>
                                </TableRow>
                            ) : stores.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">No stores found.</TableCell>
                                </TableRow>
                            ) : (
                                stores.map((wh) => (
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
                                        <TableCell>{wh.pincode || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={wh.isActive ? 'default' : 'secondary'}>
                                                {wh.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Store' : 'Add Store'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Store Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. South Branch"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Store Code</label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="WH-SOUTH"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2 mt-8">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            checked={formData.isDefault}
                                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                                            Set as Default Store
                                        </label>
                                    </div>
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
                                <label className="text-sm font-medium">Default Warehouse Location <span className="text-muted-foreground text-xs font-normal">(Optional)</span></label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.defaultWarehouseId}
                                    onChange={(e) => setFormData({ ...formData, defaultWarehouseId: e.target.value })}
                                >
                                    <option value="">No Default Warehouse (See All Stock)</option>
                                    {warehouses.map(wh => (
                                        <option key={wh._id} value={wh._id}>{wh.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground mt-1 text-balance">
                                    If selected, this store will default to showing inventory from this warehouse.
                                </p>
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
                            <div>
                                <label className="text-sm font-medium">Pincode</label>
                                <Input
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    required
                                    placeholder="e.g. 110001"
                                />
                            </div>

                            {/* Map Location Picker */}
                            <div className="mt-4">
                                <MapLocationPicker
                                    latitude={formData.latitude || 0}
                                    longitude={formData.longitude || 0}
                                    onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                    label="Store GPS Location"
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingId ? 'Save Changes' : 'Create Store'}</Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Stores;
