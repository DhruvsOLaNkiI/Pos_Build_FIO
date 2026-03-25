import { useState, useEffect } from 'react';
import API from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Gift, Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
    Star, Percent, IndianRupee, ShoppingBag, Sparkles, Copy, Check, Blocks
} from 'lucide-react';

const OFFER_TYPES = [
    { value: 'percentage', label: 'Percentage Off', icon: Percent, color: 'text-blue-400 bg-blue-400/10' },
    { value: 'flat', label: 'Flat Discount', icon: IndianRupee, color: 'text-green-400 bg-green-400/10' },
    { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: ShoppingBag, color: 'text-purple-400 bg-purple-400/10' },
    { value: 'free_item', label: 'Free Item', icon: Gift, color: 'text-orange-400 bg-orange-400/10' },
];

const defaultOfferForm = {
    name: '', description: '', type: 'percentage', discountValue: '',
    maxDiscountAmount: '', minPurchaseAmount: '0', minQuantity: '', couponCode: '',
    isAutoApply: false, validFrom: '', validTo: '', usageLimit: '', isActive: true,
    applicableTo: 'all', applicableCategory: '', applicableProduct: '', buyQuantity: '', getQuantity: ''
};

const defaultWholesaleForm = {
    name: 'Wholesale Tier', applicableProduct: '', minQuantity: '', wholesalePrice: '', isActive: true
};

const Loyalty = () => {
    const { toast } = useToast();

    // ── Loyalty Settings ────────────────────────────────────────────────
    const [settings, setSettings] = useState({
        pointsPerRupee: 1,
        rupeeValuePerPoint: 0.10,
        minPointsToRedeem: 100,
        maxRedeemPercentage: 20,
        isEnabled: true
    });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);

    // ── Offers ──────────────────────────────────────────────────────────
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [offerForm, setOfferForm] = useState(defaultOfferForm);
    const [copiedCode, setCopiedCode] = useState(null);

    // ── Wholesale ───────────────────────────────────────────────────────
    const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
    const [editingWholesale, setEditingWholesale] = useState(null);
    const [wholesaleForm, setWholesaleForm] = useState(defaultWholesaleForm);

    // ── Categories & Products ───────────────────────────────────────────
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        fetchSettings();
        fetchOffers();
        fetchProductsData();
    }, []);

    const fetchProductsData = async () => {
        try {
            const res = await API.get('/products');
            const products = res.data.data || [];
            const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
            setCategories(uniqueCategories);
            setAllProducts(products);
        } catch (e) {
            console.error('Failed to fetch products for categories', e);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await API.get('/loyalty/settings');
            setSettings(res.data.data);
        } catch (e) {
            console.error('Failed to fetch loyalty settings', e);
        } finally {
            setSettingsLoading(false);
        }
    };

    const fetchOffers = async () => {
        try {
            const res = await API.get('/loyalty/offers');
            setOffers(res.data.data);
        } catch (e) {
            console.error('Failed to fetch offers', e);
        } finally {
            setOffersLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        try {
            const res = await API.put('/loyalty/settings', settings);
            setSettings(res.data.data);
            toast({ title: '✅ Saved', description: 'Loyalty settings updated successfully' });
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
        } finally {
            setSettingsSaving(false);
        }
    };

    const openCreateOffer = () => {
        setEditingOffer(null);
        setOfferForm(defaultOfferForm);
        setIsOfferModalOpen(true);
    };

    const openEditOffer = (offer) => {
        setEditingOffer(offer);
        setOfferForm({
            name: offer.name,
            description: offer.description || '',
            type: offer.type,
            discountValue: offer.discountValue || '',
            maxDiscountAmount: offer.maxDiscountAmount || '',
            minPurchaseAmount: offer.minPurchaseAmount || '0',
            minQuantity: offer.minQuantity || '',
            couponCode: offer.couponCode || '',
            isAutoApply: offer.isAutoApply,
            validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
            validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : '',
            usageLimit: offer.usageLimit || '',
            isActive: offer.isActive,
            applicableTo: offer.applicableTo || 'all',
            applicableCategory: offer.applicableCategory || '',
            applicableProduct: offer.applicableProduct || '',
            buyQuantity: offer.buyQuantity || '',
            getQuantity: offer.getQuantity || '',
        });
        setIsOfferModalOpen(true);
    };

    const handleSaveOffer = async () => {
        try {
            if (!offerForm.name) return toast({ title: 'Error', description: 'Offer name is required', variant: 'destructive' });
            const payload = {
                ...offerForm,
                discountValue: Number(offerForm.discountValue) || 0,
                maxDiscountAmount: offerForm.maxDiscountAmount ? Number(offerForm.maxDiscountAmount) : null,
                minPurchaseAmount: Number(offerForm.minPurchaseAmount) || 0,
                minQuantity: Number(offerForm.minQuantity) || 0,
                usageLimit: offerForm.usageLimit ? Number(offerForm.usageLimit) : null,
                validFrom: offerForm.validFrom || null,
                validTo: offerForm.validTo || null,
                buyQuantity: offerForm.buyQuantity ? Number(offerForm.buyQuantity) : null,
                getQuantity: offerForm.getQuantity ? Number(offerForm.getQuantity) : null,
                couponCode: offerForm.isAutoApply ? null : (offerForm.couponCode || null),
                applicableTo: offerForm.applicableTo || 'all',
                applicableCategory: offerForm.applicableTo === 'category' ? (offerForm.applicableCategory || null) : null,
                applicableProduct: offerForm.applicableTo === 'product' ? (offerForm.applicableProduct || null) : null,
            };

            if (editingOffer) {
                const res = await API.put(`/loyalty/offers/${editingOffer._id}`, payload);
                setOffers(prev => prev.map(o => o._id === editingOffer._id ? res.data.data : o));
                toast({ title: '✅ Updated', description: 'Offer updated successfully' });
            } else {
                const res = await API.post('/loyalty/offers', payload);
                setOffers(prev => [res.data.data, ...prev]);
                toast({ title: '✅ Created', description: 'Offer created successfully' });
            }
            setIsOfferModalOpen(false);
        } catch (e) {
            toast({ title: 'Error', description: e.response?.data?.message || 'Failed to save offer', variant: 'destructive' });
        }
    };

    // === Wholesale Specific Logic ===
    const openCreateWholesale = () => {
        setEditingWholesale(null);
        setWholesaleForm(defaultWholesaleForm);
        setIsWholesaleModalOpen(true);
    };

    const openEditWholesale = (offer) => {
        setEditingWholesale(offer);
        setWholesaleForm({
            name: offer.name,
            applicableProduct: offer.applicableProduct || '',
            minQuantity: offer.minQuantity || '',
            wholesalePrice: offer.wholesalePrice || '',
            isActive: offer.isActive
        });
        setIsWholesaleModalOpen(true);
    };

    const handleSaveWholesale = async () => {
        try {
            if (!wholesaleForm.applicableProduct) return toast({ title: 'Error', description: 'Product is required', variant: 'destructive' });
            if (!wholesaleForm.wholesalePrice || !wholesaleForm.minQuantity) return toast({ title: 'Error', description: 'Price and min quantity are required', variant: 'destructive' });

            const payload = {
                name: wholesaleForm.name,
                type: 'wholesale',
                applicableTo: 'product',
                isAutoApply: true, // Wholesale prices are always auto-applied
                applicableProduct: wholesaleForm.applicableProduct,
                minQuantity: Number(wholesaleForm.minQuantity),
                wholesalePrice: Number(wholesaleForm.wholesalePrice),
                isActive: wholesaleForm.isActive,
            };

            if (editingWholesale) {
                const res = await API.put(`/loyalty/offers/${editingWholesale._id}`, payload);
                setOffers(prev => prev.map(o => o._id === editingWholesale._id ? res.data.data : o));
                toast({ title: '✅ Updated', description: 'Wholesale tier updated' });
            } else {
                const res = await API.post('/loyalty/offers', payload);
                setOffers(prev => [res.data.data, ...prev]);
                toast({ title: '✅ Created', description: 'Wholesale tier created' });
            }
            setIsWholesaleModalOpen(false);
        } catch (e) {
            toast({ title: 'Error', description: e.response?.data?.message || 'Failed to save wholesale tier', variant: 'destructive' });
        }
    };

    const handleToggleOffer = async (offer) => {
        try {
            const res = await API.put(`/loyalty/offers/${offer._id}`, { ...offer, isActive: !offer.isActive });
            setOffers(prev => prev.map(o => o._id === offer._id ? res.data.data : o));
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to toggle offer', variant: 'destructive' });
        }
    };

    const handleDeleteOffer = async (id) => {
        if (!window.confirm('Delete this offer?')) return;
        try {
            await API.delete(`/loyalty/offers/${id}`);
            setOffers(prev => prev.filter(o => o._id !== id));
            toast({ title: '🗑️ Deleted', description: 'Offer removed' });
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
        }
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getTypeInfo = (type) => OFFER_TYPES.find(t => t.value === type) || OFFER_TYPES[0];

    const isOfferExpired = (offer) => {
        if (!offer.validTo) return false;
        return new Date(offer.validTo) < new Date();
    };

    const isOfferUpcoming = (offer) => {
        if (!offer.validFrom) return false;
        return new Date(offer.validFrom) > new Date();
    };

    const getOfferStatus = (offer) => {
        if (!offer.isActive) return { label: 'Disabled', color: 'bg-gray-500/20 text-gray-400' };
        if (isOfferExpired(offer)) return { label: 'Expired', color: 'bg-red-500/20 text-red-400' };
        if (isOfferUpcoming(offer)) return { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400' };
        return { label: 'Active', color: 'bg-green-500/20 text-green-400' };
    };

    const getDiscountDisplay = (offer) => {
        if (offer.type === 'percentage') return `${offer.discountValue}% off${offer.maxDiscountAmount ? ` (max ₹${offer.maxDiscountAmount})` : ''}`;
        if (offer.type === 'flat') return `₹${offer.discountValue} off`;
        if (offer.type === 'buy_x_get_y') return `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`;
        if (offer.type === 'free_item') return 'Free Item';
        if (offer.type === 'wholesale') return `Wholesale Price: ₹${offer.wholesalePrice}`;
        return '—';
    };

    const generalOffers = offers.filter(o => o.type !== 'wholesale');
    const wholesaleOffers = offers.filter(o => o.type === 'wholesale');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                        Loyalty & Offers
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage reward points and promotional discounts</p>
                </div>
            </div>

            <Tabs defaultValue="loyalty">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                    <TabsTrigger value="loyalty" className="flex items-center gap-2">
                        <Star className="w-4 h-4" /> Reward Points
                    </TabsTrigger>
                    <TabsTrigger value="offers" className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Offers & Discounts
                    </TabsTrigger>
                    <TabsTrigger value="wholesale" className="flex items-center gap-2">
                        <Blocks className="w-4 h-4" /> Wholesale / Bulk Pricing
                    </TabsTrigger>
                </TabsList>

                {/* ─── TAB: LOYALTY SETTINGS ─── */}
                <TabsContent value="loyalty" className="space-y-6 mt-6">
                    {settingsLoading ? (
                        <div className="text-center py-20 text-muted-foreground">Loading settings...</div>
                    ) : (
                        <>
                            {/* Enable Card */}
                            <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Reward Points Program</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">Customers earn points for every purchase and redeem them for discounts</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, isEnabled: !s.isEnabled }))}
                                    className="flex items-center gap-2 text-sm font-semibold"
                                >
                                    {settings.isEnabled
                                        ? <><ToggleRight className="w-10 h-10 text-green-500" /> <span className="text-green-500">Enabled</span></>
                                        : <><ToggleLeft className="w-10 h-10 text-muted-foreground" /> <span className="text-muted-foreground">Disabled</span></>
                                    }
                                </button>
                            </div>

                            {/* Settings Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Earn Rules */}
                                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                                    <div className="flex items-center gap-2 border-b border-border pb-3">
                                        <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                                            <Star className="w-4 h-4 text-yellow-400" />
                                        </div>
                                        <h3 className="font-semibold">Earning Rules</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Points earned per ₹1 spent</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={settings.pointsPerRupee}
                                                    onChange={e => setSettings(s => ({ ...s, pointsPerRupee: Number(e.target.value) }))}
                                                    className="pr-20"
                                                />
                                                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground font-medium">pts / ₹</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">e.g. 1 = customer earns 1 point for every ₹1 spent</p>
                                        </div>
                                        <div className="p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-lg text-sm">
                                            <span className="font-semibold text-yellow-400">Example: </span>
                                            <span className="text-muted-foreground">₹500 purchase → {(500 * settings.pointsPerRupee).toLocaleString()} points</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Redeem Rules */}
                                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                                    <div className="flex items-center gap-2 border-b border-border pb-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                                            <IndianRupee className="w-4 h-4 text-green-400" />
                                        </div>
                                        <h3 className="font-semibold">Redemption Rules</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>₹ value per point redeemed</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={settings.rupeeValuePerPoint}
                                                    onChange={e => setSettings(s => ({ ...s, rupeeValuePerPoint: Number(e.target.value) }))}
                                                    className="pr-16"
                                                />
                                                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground font-medium">₹/pt</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">e.g. 0.10 = 100 points = ₹10 discount</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Minimum points required to redeem</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings.minPointsToRedeem}
                                                onChange={e => setSettings(s => ({ ...s, minPointsToRedeem: Number(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max % of bill payable with points</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0" max="100"
                                                    value={settings.maxRedeemPercentage}
                                                    onChange={e => setSettings(s => ({ ...s, maxRedeemPercentage: Number(e.target.value) }))}
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Preview */}
                            <div className="bg-gradient-to-r from-yellow-900/20 to-green-900/20 border border-yellow-400/20 rounded-xl p-5">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Points Summary Preview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-1">₹1000 purchase earns</p>
                                        <p className="text-2xl font-bold text-yellow-400">{(1000 * settings.pointsPerRupee).toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">points</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-1">100 points worth</p>
                                        <p className="text-2xl font-bold text-green-400">₹{(100 * settings.rupeeValuePerPoint).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">discount</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-1">Minimum to redeem</p>
                                        <p className="text-2xl font-bold text-blue-400">{settings.minPointsToRedeem}</p>
                                        <p className="text-xs text-muted-foreground">points</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveSettings} disabled={settingsSaving} size="lg" className="px-8">
                                    {settingsSaving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* ─── TAB: OFFERS ─── */}
                <TabsContent value="offers" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Active Offers & Coupons</h2>
                            <p className="text-sm text-muted-foreground">{generalOffers.length} offer{generalOffers.length !== 1 ? 's' : ''} total</p>
                        </div>
                        <Button onClick={openCreateOffer} className="gap-2">
                            <Plus className="w-4 h-4" /> Create Offer
                        </Button>
                    </div>

                    {offersLoading ? (
                        <div className="text-center py-20 text-muted-foreground">Loading offers...</div>
                    ) : generalOffers.length === 0 ? (
                        <div className="text-center py-20 bg-card border border-border rounded-xl">
                            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-lg font-semibold">No offers yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Create your first discount offer or coupon code</p>
                            <Button onClick={openCreateOffer}><Plus className="w-4 h-4 mr-2" /> Create First Offer</Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {generalOffers.map(offer => {
                                const typeInfo = getTypeInfo(offer.type);
                                const status = getOfferStatus(offer);
                                const TypeIcon = typeInfo.icon;
                                return (
                                    <div key={offer._id} className={`bg-card border rounded-xl p-5 transition-all ${!offer.isActive || isOfferExpired(offer) ? 'opacity-60 border-border' : 'border-border hover:border-primary/40'}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                                                    <TypeIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-base">{offer.name}</h3>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                        {offer.isAutoApply && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase">Auto-Apply</span>
                                                        )}
                                                    </div>
                                                    {offer.description && <p className="text-sm text-muted-foreground mt-0.5">{offer.description}</p>}
                                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-primary">{getDiscountDisplay(offer)}</span>
                                                        {offer.minPurchaseAmount > 0 && (
                                                            <span className="text-xs text-muted-foreground">Min. ₹{offer.minPurchaseAmount}</span>
                                                        )}
                                                        {offer.minQuantity > 0 && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 uppercase">Min. Qty: {offer.minQuantity}</span>
                                                        )}
                                                        {offer.couponCode && (
                                                            <button
                                                                onClick={() => copyCode(offer.couponCode)}
                                                                className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg text-xs font-mono font-bold hover:bg-muted/80 transition-colors"
                                                            >
                                                                {copiedCode === offer.couponCode
                                                                    ? <><Check className="w-3 h-3 text-green-400" /> Copied!</>
                                                                    : <><Copy className="w-3 h-3" /> {offer.couponCode}</>
                                                                }
                                                            </button>
                                                        )}
                                                        {(offer.validFrom || offer.validTo) && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {offer.validFrom ? new Date(offer.validFrom).toLocaleDateString('en-IN') : '∞'} → {offer.validTo ? new Date(offer.validTo).toLocaleDateString('en-IN') : '∞'}
                                                            </span>
                                                        )}
                                                        {offer.usageLimit && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Used: {offer.usedCount}/{offer.usageLimit}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleToggleOffer(offer)}
                                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                    title={offer.isActive ? 'Disable' : 'Enable'}
                                                >
                                                    {offer.isActive
                                                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                                                        : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                                                    }
                                                </button>
                                                <button onClick={() => openEditOffer(offer)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteOffer(offer._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-destructive transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ─── TAB: WHOLESALE ─── */}
                <TabsContent value="wholesale" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Wholesale Pricing Tiers</h2>
                            <p className="text-sm text-muted-foreground">Set bulk prices for products when customers buy large quantities. Example: Buy 10+, Price becomes ₹50/unit</p>
                        </div>
                        <Button onClick={openCreateWholesale} className="gap-2 bg-primary">
                            <Plus className="w-4 h-4" /> Add Wholesale Tier
                        </Button>
                    </div>

                    {offersLoading ? (
                        <div className="text-center py-20 text-muted-foreground">Loading wholesale tiers...</div>
                    ) : wholesaleOffers.length === 0 ? (
                        <div className="text-center py-20 bg-card border border-border rounded-xl">
                            <Blocks className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-lg font-semibold">No wholesale tiers yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Start selling products at a wholesale rate based on minimum quantity</p>
                            <Button onClick={openCreateWholesale}><Plus className="w-4 h-4 mr-2" /> Add Wholesale Tier</Button>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Min. Qty to Buy</TableHead>
                                        <TableHead>Wholesale Price (per unit)</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wholesaleOffers.map(offer => {
                                        // Try to find the associated product name locally
                                        const productObj = allProducts.find(p => p._id === offer.applicableProduct);
                                        const productName = productObj ? `${productObj.name} ${productObj.variant ? `(${productObj.variant})` : ''}` : 'Unknown Product (Deleted?)';
                                        
                                        return (
                                            <TableRow key={offer._id}>
                                                <TableCell className="font-semibold">{productName}</TableCell>
                                                <TableCell><span className="font-bold px-2 py-1 bg-muted rounded">{offer.minQuantity}+</span> units</TableCell>
                                                <TableCell className="font-bold text-green-600 dark:text-green-400">₹{offer.wholesalePrice}</TableCell>
                                                <TableCell>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${offer.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {offer.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-1">
                                                    <button onClick={() => handleToggleOffer(offer)} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                                                        {offer.isActive ? <ToggleRight className="text-green-500" /> : <ToggleLeft />}
                                                    </button>
                                                    <button onClick={() => openEditWholesale(offer)} className="p-2 hover:bg-muted rounded text-primary">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteOffer(offer._id)} className="p-2 hover:bg-red-500/10 rounded text-destructive">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* ─── Wholesale Create / Edit Modal ─── */}
            <Dialog open={isWholesaleModalOpen} onOpenChange={setIsWholesaleModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{editingWholesale ? 'Edit Wholesale Tier' : 'Add Wholesale Tier'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        {/* Name */}
                        <div className="space-y-2 hidden">
                            <Label>Tier Name</Label>
                            <Input value={wholesaleForm.name} onChange={e => setWholesaleForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        
                        {/* Status Toggle */}
                        <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border border-border">
                            <Label>Status</Label>
                            <button
                                type="button"
                                onClick={() => setWholesaleForm(f => ({ ...f, isActive: !f.isActive }))}
                                className="font-semibold text-sm flex items-center gap-2"
                            >
                                {wholesaleForm.isActive
                                    ? <><ToggleRight className="text-green-500 w-6 h-6" /> <span className="text-green-500">Active</span></>
                                    : <><ToggleLeft className="text-muted-foreground w-6 h-6" /> <span className="text-muted-foreground">Disabled</span></>
                                }
                            </button>
                        </div>

                        {/* Product Dropdown */}
                        <div className="space-y-2">
                            <Label>Select Product *</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                value={wholesaleForm.applicableProduct}
                                onChange={e => setWholesaleForm(f => ({ ...f, applicableProduct: e.target.value }))}
                            >
                                <option value="" disabled>Select a Product</option>
                                {allProducts.length === 0 && <option disabled>No products found in database</option>}
                                {allProducts.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} {p.variant ? `(${p.variant})` : ''} - ₹{p.sellingPrice}</option>
                                ))}
                            </select>
                        </div>

                        {/* Min Qty & Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min. Qty to Buy *</Label>
                                <div className="relative">
                                    <Input type="number" min="1" value={wholesaleForm.minQuantity} onChange={e => setWholesaleForm(f => ({ ...f, minQuantity: e.target.value }))} placeholder="e.g. 10" />
                                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground font-medium">units</span>
                                </div>
                            </div>
                            <div className="space-y-2 border-l border-border pl-4">
                                <Label className="text-primary font-bold">New Price / Unit *</Label>
                                <div className="relative">
                                    <Input type="number" min="0" className="border-primary focus-visible:ring-primary h-12 text-lg font-bold pl-8" value={wholesaleForm.wholesalePrice} onChange={e => setWholesaleForm(f => ({ ...f, wholesalePrice: e.target.value }))} placeholder="e.g. 50" />
                                    <span className="absolute left-3 top-3 text-lg font-bold text-muted-foreground">₹</span>
                                </div>
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWholesaleModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveWholesale}>{editingWholesale ? 'Update Tier' : 'Save Tier'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Offer Create / Edit Modal ─── */}
            <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        {/* Name & Description */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Offer Name *</Label>
                                <Input value={offerForm.name} onChange={e => setOfferForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Sale, Festive 20% Off" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                <Input value={offerForm.description} onChange={e => setOfferForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown to cashiers" />
                            </div>
                        </div>

                        {/* Offer Type */}
                        <div className="space-y-2">
                            <Label>Offer Type *</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {OFFER_TYPES.filter(o => o.value !== 'wholesale').map(({ value, label, icon: Icon, color }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setOfferForm(f => ({ ...f, type: value }))}
                                        className={`p-3 border rounded-xl flex items-center gap-2 text-sm font-medium transition-all text-left ${offerForm.type === value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                                    >
                                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </span>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Discount Value */}
                        {(offerForm.type === 'percentage' || offerForm.type === 'flat') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{offerForm.type === 'percentage' ? 'Discount %' : 'Flat Discount (₹)'} *</Label>
                                    <Input type="number" min="0" value={offerForm.discountValue} onChange={e => setOfferForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={offerForm.type === 'percentage' ? 'e.g. 15' : 'e.g. 100'} />
                                </div>
                                {offerForm.type === 'percentage' && (
                                    <div className="space-y-2">
                                        <Label>Max Discount Cap (₹) <span className="text-xs text-muted-foreground">optional</span></Label>
                                        <Input type="number" min="0" value={offerForm.maxDiscountAmount} onChange={e => setOfferForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="e.g. 500" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Buy X Get Y */}
                        {offerForm.type === 'buy_x_get_y' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Buy Quantity (X)</Label>
                                    <Input type="number" min="1" value={offerForm.buyQuantity} onChange={e => setOfferForm(f => ({ ...f, buyQuantity: e.target.value }))} placeholder="e.g. 2" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Get Quantity (Y - Free)</Label>
                                    <Input type="number" min="1" value={offerForm.getQuantity} onChange={e => setOfferForm(f => ({ ...f, getQuantity: e.target.value }))} placeholder="e.g. 1" />
                                </div>
                            </div>
                        )}

                        {/* Minimums & Usage Limit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Minimum Purchase (₹)</Label>
                                <Input type="number" min="0" value={offerForm.minPurchaseAmount} onChange={e => setOfferForm(f => ({ ...f, minPurchaseAmount: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Minimum Quantity <span className="text-xs text-muted-foreground">(Bulk tier)</span></Label>
                                <Input type="number" min="0" value={offerForm.minQuantity} onChange={e => setOfferForm(f => ({ ...f, minQuantity: e.target.value }))} placeholder="e.g. 5" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Usage Limit <span className="text-xs text-muted-foreground">optional</span></Label>
                            <Input type="number" min="1" value={offerForm.usageLimit} onChange={e => setOfferForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="Leave empty = unlimited" />
                        </div>

                        {/* Coupon vs Auto-Apply */}
                        <div className="space-y-3">
                            <Label>Apply Method</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOfferForm(f => ({ ...f, isAutoApply: false }))}
                                    className={`p-3 border rounded-xl text-sm font-medium text-left transition-all ${!offerForm.isAutoApply ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                                >
                                    🎟️ Coupon Code
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Customer enters a code at checkout</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOfferForm(f => ({ ...f, isAutoApply: true }))}
                                    className={`p-3 border rounded-xl text-sm font-medium text-left transition-all ${offerForm.isAutoApply ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                                >
                                    ✨ Auto-Apply
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Applied automatically when conditions are met</p>
                                </button>
                            </div>
                            {!offerForm.isAutoApply && (
                                <div className="space-y-2">
                                    <Label>Coupon Code</Label>
                                    <Input
                                        value={offerForm.couponCode}
                                        onChange={e => setOfferForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. SUMMER20"
                                        className="font-mono uppercase"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valid From <span className="text-xs text-muted-foreground">optional</span></Label>
                                <Input type="date" value={offerForm.validFrom} onChange={e => setOfferForm(f => ({ ...f, validFrom: e.target.value }))} className="text-foreground bg-background" />
                            </div>
                            <div className="space-y-2">
                                <Label>Valid Until <span className="text-xs text-muted-foreground">optional</span></Label>
                                <Input type="date" value={offerForm.validTo} onChange={e => setOfferForm(f => ({ ...f, validTo: e.target.value }))} className="text-foreground bg-background" />
                            </div>
                        </div>

                        {/* Applicability */}
                        <div className="space-y-3 p-3 border border-border rounded-xl bg-card">
                            <Label className="text-base font-semibold">Offer Scope</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOfferForm(f => ({ ...f, applicableTo: 'all', applicableCategory: '', applicableProduct: '' }))}
                                    className={`p-2 border rounded-xl text-xs sm:text-sm font-medium transition-all ${offerForm.applicableTo === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                                >
                                    🛍️ All Products
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOfferForm(f => ({ ...f, applicableTo: 'category', applicableProduct: '' }))}
                                    className={`p-2 border rounded-xl text-xs sm:text-sm font-medium transition-all ${offerForm.applicableTo === 'category' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                                >
                                    📁 Category
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOfferForm(f => ({ ...f, applicableTo: 'product', applicableCategory: '' }))}
                                    className={`p-2 border rounded-xl text-xs sm:text-sm font-medium transition-all ${offerForm.applicableTo === 'product' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                                >
                                    📦 Specific Product
                                </button>
                            </div>
                            
                            {offerForm.applicableTo === 'category' && (
                                <div className="space-y-2 mt-3 p-3 bg-muted/30 rounded-lg">
                                    <Label>Select Category</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={offerForm.applicableCategory}
                                        onChange={e => setOfferForm(f => ({ ...f, applicableCategory: e.target.value }))}
                                    >
                                        <option value="" disabled>Select a Category</option>
                                        {categories.length === 0 && <option disabled>No categories found in database</option>}
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {offerForm.applicableTo === 'product' && (
                                <div className="space-y-2 mt-3 p-3 bg-muted/30 rounded-lg">
                                    <Label>Select Product</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={offerForm.applicableProduct}
                                        onChange={e => setOfferForm(f => ({ ...f, applicableProduct: e.target.value }))}
                                    >
                                        <option value="" disabled>Select a Product</option>
                                        {allProducts.length === 0 && <option disabled>No products found in database</option>}
                                        {allProducts.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} {p.variant ? `(${p.variant})` : ''} - ₹{p.sellingPrice}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tip: Combine "Specific Product", "Minimum Quantity", and "Auto-Apply" to create 'Buy More, Pay Less' Bulk tiers.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOfferModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveOffer}>{editingOffer ? 'Update Offer' : 'Create Offer'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Loyalty;
