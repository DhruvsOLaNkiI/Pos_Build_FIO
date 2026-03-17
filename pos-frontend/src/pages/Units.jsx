import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Edit2, Trash2, Plus, Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import API from '@/services/api';

const Units = () => {
    const [units, setUnits] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        baseUnit: '',
    });
    const { toast } = useToast();

    const fetchUnits = async () => {
        try {
            const { data } = await API.get('/units');
            setUnits(data.data || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch units',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleOpenModal = (unit = null) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({
                name: unit.name,
                shortName: unit.shortName,
                baseUnit: unit.baseUnit || '',
            });
        } else {
            setEditingUnit(null);
            setFormData({
                name: '',
                shortName: '',
                baseUnit: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUnit) {
                await API.put(`/units/${editingUnit._id}`, formData);
                toast({ title: 'Success', description: 'Unit updated successfully' });
            } else {
                await API.post('/units', formData);
                toast({ title: 'Success', description: 'Unit added successfully' });
            }
            setIsModalOpen(false);
            fetchUnits();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Operation failed',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            try {
                await API.delete(`/units/${id}`);
                toast({ title: 'Success', description: 'Unit deleted' });
                fetchUnits();
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to delete unit', variant: 'destructive' });
            }
        }
    };

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.shortName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Units</h1>
                    <p className="text-muted-foreground mt-1">Manage units of measurement (e.g. Kg, Pc, Box)</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Unit
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search units..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                            </TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Short name</TableHead>
                            <TableHead className="text-center">No of Products</TableHead>
                            <TableHead>Created Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUnits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No units found. Add some to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUnits.map((unit) => (
                                <TableRow key={unit._id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="text-center">
                                        <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground/90">{unit.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{unit.shortName}</TableCell>
                                    <TableCell className="text-center font-medium">
                                        {unit.noOfProducts || 0}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(unit.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenModal(unit)} className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/50">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(unit._id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Unit Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Kilogram"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shortName">Short Name</Label>
                            <Input
                                id="shortName"
                                placeholder="e.g. Kg"
                                required
                                value={formData.shortName}
                                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="baseUnit">Base Unit (Optional)</Label>
                            <Input
                                id="baseUnit"
                                placeholder="e.g. 1000g"
                                value={formData.baseUnit}
                                onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingUnit ? 'Update Unit' : 'Add Unit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Units;
