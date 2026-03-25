import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { Loader2, Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import API from '@/services/api';

const BannerManagement = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [section, setSection] = useState('TOP_HERO');
    const [layoutType, setLayoutType] = useState('GRID_2');
    const [items, setItems] = useState([]);
    
    // Existing config
    const [existingConfig, setExistingConfig] = useState(null);

    useEffect(() => {
        fetchBannerConfig();
    }, [section]);

    const fetchBannerConfig = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/banners/admin');
            
            // Find config for current section
            const config = data.data.find(b => b.section === section);
            
            if (config) {
                setExistingConfig(config);
                setLayoutType(config.layoutType);
                setItems(config.items || []);
            } else {
                setExistingConfig(null);
                setItems([]);
                // Pre-populate based on layout
                if (layoutType === 'GRID_2') setItems([{}, {}]);
                if (layoutType === 'GRID_3') setItems([{}, {}, {}]);
                if (layoutType === 'MARQUEE_TEXT') setItems([{}]);
            }
        } catch (error) {
            console.error('Failed to fetch banners', error);
            toast({ title: 'Error', description: 'Failed to load banner configuration', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleLayoutChange = (val) => {
        setLayoutType(val);
        // Adjust items array size based on layout
        if (val === 'GRID_2' && items.length < 2) setItems([...items, ...Array(2 - items.length).fill({})]);
        if (val === 'GRID_3' && items.length < 3) setItems([...items, ...Array(3 - items.length).fill({})]);
        if (val === 'GRID_1' && items.length < 1) setItems([{}]);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        if (!newItems[index]) newItems[index] = {};
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                section,
                layoutType,
                items: items.map((item, i) => ({ ...item, order: i })),
                isActive: true
            };

            // Needs to specify company if logged in as admin. We will let backend handle owner default.
            // If super-admin, we should ideally have a company selector. For now, we assume user.company exists or backend is robust.
            
            // To be safe, we will just fetch the current user profile to attach company if needed, or backend handles it.
            // The backend endpoint requires `company` in payload.
            const userRes = await API.get('/auth/me');
            payload.company = userRes.data.data.company;

            if (existingConfig) {
                await API.put(`/banners/${existingConfig._id}`, payload);
            } else {
                await API.post('/banners', payload);
            }
            
            toast({ title: 'Success', description: 'Banner configuration saved successfully' });
            fetchBannerConfig(); // Refresh
        } catch (error) {
            console.error('Save error', error);
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save configuration', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !items.length) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banner Management</h1>
                    <p className="text-muted-foreground mt-1">Configure customer portal banners and redirects.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Configuration
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Section Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Choose Section</Label>
                            <Select value={section} onValueChange={setSection}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TOP_HERO">Top Hero Banner</SelectItem>
                                    <SelectItem value="BOTTOM_HERO">Bottom Hero Banner</SelectItem>
                                    <SelectItem value="MARQUEE">Scrolling Marquee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {section !== 'MARQUEE' && (
                            <div className="space-y-2">
                                <Label>Layout Grid</Label>
                                <Select value={layoutType} onValueChange={handleLayoutChange}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GRID_1">Single Large Banner</SelectItem>
                                        <SelectItem value="GRID_2">Grid of 2 (Side by Side)</SelectItem>
                                        <SelectItem value="GRID_3">Grid of 3 (1 Large, 2 Small)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-4">
                    {section === 'MARQUEE' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Marquee Text Setup</CardTitle>
                                <CardDescription>Enter the text you want to scroll across the screen.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Announcement Text</Label>
                                    <Input 
                                        placeholder="e.g., NEW HERE? GET 50% OFF YOUR 1ST ORDER! 🎉" 
                                        value={items[0]?.title || ''}
                                        onChange={(e) => updateItem(0, 'title', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        items.slice(0, layoutType === 'GRID_1' ? 1 : layoutType === 'GRID_2' ? 2 : 3).map((item, index) => (
                            <Card key={index} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-muted px-4 py-2 border-b flex justify-between items-center text-sm font-semibold">
                                    Banner Slot {index + 1} {layoutType === 'GRID_3' && index === 0 && '(Large Main)'}
                                </div>
                                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-4 sm:col-span-2">
                                        <div className="space-y-2">
                                            <Label>Image URL</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    placeholder="https://..." 
                                                    value={item.imageUrl || ''}
                                                    onChange={(e) => updateItem(index, 'imageUrl', e.target.value)}
                                                />
                                            </div>
                                            {item.imageUrl && (
                                                <div className="mt-2 h-32 w-full rounded-md border overflow-hidden bg-black/5 flex items-center justify-center relative group">
                                                    <img src={item.imageUrl} alt="preview" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Overlay Title (Optional)</Label>
                                        <Input 
                                            placeholder="e.g., THE FUTURE IS INSTANT" 
                                            value={item.title || ''}
                                            onChange={(e) => updateItem(index, 'title', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Action / Redirect</Label>
                                        <Select 
                                            value={item.redirectType || 'none'} 
                                            onValueChange={(val) => updateItem(index, 'redirectType', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Action</SelectItem>
                                                <SelectItem value="store">Go to Store</SelectItem>
                                                <SelectItem value="product">Go to Product</SelectItem>
                                                <SelectItem value="category">Go to Category</SelectItem>
                                                <SelectItem value="offer">Go to Offers</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {item.redirectType && item.redirectType !== 'none' && (
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label>Redirect Target (ID or Name)</Label>
                                            <Input 
                                                placeholder={`Enter the ${item.redirectType} ID or name...`} 
                                                value={item.redirectTo || ''}
                                                onChange={(e) => updateItem(index, 'redirectTo', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BannerManagement;
