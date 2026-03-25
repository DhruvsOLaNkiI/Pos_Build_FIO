import { useState, useEffect } from 'react';
import API from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutTemplate, Columns, SlidersHorizontal, Check, Palette, CreditCard } from 'lucide-react';

const heroOptions = [
    {
        value: 'grid',
        label: 'Grid Layout',
        description: 'A dynamic multi-banner grid showing up to 4 promotions simultaneously.',
        icon: LayoutTemplate,
        preview: (
            <div className="aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-2.5 flex gap-2 overflow-hidden border border-slate-200">
                <div className="w-1/2 bg-gradient-to-br from-violet-400 to-violet-600 rounded-lg shadow-md flex items-end p-3">
                    <div className="space-y-1"><div className="h-2 w-16 bg-white/60 rounded" /><div className="h-1.5 w-10 bg-white/40 rounded" /></div>
                </div>
                <div className="w-1/2 flex flex-col gap-2">
                    <div className="h-1/2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-md flex items-end p-2">
                        <div className="h-1.5 w-12 bg-white/50 rounded" />
                    </div>
                    <div className="h-1/2 flex gap-2">
                        <div className="w-1/2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-md flex items-end p-1.5">
                            <div className="h-1 w-8 bg-white/50 rounded" />
                        </div>
                        <div className="w-1/2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-md flex items-end p-1.5">
                            <div className="h-1 w-8 bg-white/50 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        value: 'slider',
        label: 'Sliding Banner',
        description: 'A sleek, auto-rotating hero banner with navigation arrows and dot indicators.',
        icon: Columns,
        preview: (
            <div className="aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-2.5 overflow-hidden border border-slate-200">
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg shadow-md flex flex-col justify-end p-4 relative">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 border-l-2 border-b-2 border-white rotate-45 translate-x-0.5" /></div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 border-r-2 border-t-2 border-white rotate-45 -translate-x-0.5" /></div>
                    <div className="space-y-1.5"><div className="h-3 w-3/4 bg-white/50 rounded" /><div className="h-2 w-1/2 bg-white/30 rounded" /></div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        <div className="w-2 h-2 bg-white/40 rounded-full" />
                        <div className="w-2 h-2 bg-white/40 rounded-full" />
                    </div>
                </div>
            </div>
        )
    },
    {
        value: 'carousel',
        label: 'Card Carousel',
        description: 'Horizontally scrollable banner cards that customers can swipe through.',
        icon: SlidersHorizontal,
        preview: (
            <div className="aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-2.5 overflow-hidden border border-slate-200">
                <div className="flex gap-2 h-full">
                    <div className="w-[45%] shrink-0 bg-gradient-to-br from-rose-400 to-rose-600 rounded-lg shadow-md flex items-end p-3">
                        <div className="space-y-1"><div className="h-2 w-14 bg-white/60 rounded" /><div className="h-1.5 w-8 bg-white/40 rounded" /></div>
                    </div>
                    <div className="w-[45%] shrink-0 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-md flex items-end p-3">
                        <div className="space-y-1"><div className="h-2 w-14 bg-white/60 rounded" /><div className="h-1.5 w-8 bg-white/40 rounded" /></div>
                    </div>
                    <div className="w-[20%] shrink-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg shadow-md opacity-60" />
                </div>
            </div>
        )
    }
];

const accentOptions = [
    { value: 'blue', label: 'Ocean Blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
    { value: 'purple', label: 'Royal Purple', color: 'bg-purple-500', ring: 'ring-purple-500' },
    { value: 'emerald', label: 'Emerald', color: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { value: 'rose', label: 'Rose Pink', color: 'bg-rose-500', ring: 'ring-rose-500' },
    { value: 'amber', label: 'Warm Amber', color: 'bg-amber-500', ring: 'ring-amber-500' },
    { value: 'indigo', label: 'Deep Indigo', color: 'bg-indigo-500', ring: 'ring-indigo-500' },
];

const cardStyleOptions = [
    { value: 'minimal', label: 'Minimal', description: 'Clean look with image, name & price' },
    { value: 'detailed', label: 'Detailed', description: 'Shows brand, category badge & stock status' },
    { value: 'compact', label: 'Compact', description: 'Smaller cards, fits more products per row' },
];

const GlobalPortalDesign = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const [heroType, setHeroType] = useState('grid');
    const [accentColor, setAccentColor] = useState('blue');
    const [productCardStyle, setProductCardStyle] = useState('minimal');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await API.get('/super-admin/global-settings');
                if (res.data?.success && res.data?.data) {
                    const d = res.data.data;
                    setHeroType(d.heroSectionType || 'grid');
                    setAccentColor(d.accentColor || 'blue');
                    setProductCardStyle(d.productCardStyle || 'minimal');
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage(null);
        try {
            const res = await API.put('/super-admin/global-settings', {
                heroSectionType: heroType,
                accentColor,
                productCardStyle,
            });
            if (res.data?.success) {
                setSaveMessage({ type: 'success', text: '✅ Changes saved! Customer portal updated globally.' });
            } else {
                setSaveMessage({ type: 'error', text: '❌ Unexpected response from server.' });
            }
        } catch (error) {
            console.error("Failed to save", error);
            setSaveMessage({ type: 'error', text: `❌ Failed to save: ${error.response?.data?.message || error.message}` });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portal Design Studio</h1>
                    <p className="text-muted-foreground mt-1">Customize how all customers experience the storefront</p>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[160px] gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Save Feedback Banner */}
            {saveMessage && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border animate-fade-in ${
                    saveMessage.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {saveMessage.text}
                </div>
            )}

            {/* Section 1: Hero Layout */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Hero Section Layout</h2>
                        <p className="text-sm text-muted-foreground">Choose how promotional banners appear on the homepage</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {heroOptions.map(option => {
                        const Icon = option.icon;
                        const isActive = heroType === option.value;
                        return (
                            <Card 
                                key={option.value}
                                className={`cursor-pointer transition-all duration-300 group ${
                                    isActive 
                                        ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                                        : 'hover:border-primary/40 hover:shadow-md'
                                }`}
                                onClick={() => setHeroType(option.value)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                        }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-semibold">{option.label}</h4>
                                        {isActive && (
                                            <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {option.preview}
                                    
                                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{option.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Section 2: Accent Color */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Accent Color</h2>
                        <p className="text-sm text-muted-foreground">Set the primary color theme for buttons, highlights and badges</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {accentOptions.map(opt => {
                        const isActive = accentColor === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setAccentColor(opt.value)}
                                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                                    isActive 
                                        ? `${opt.ring} border-transparent shadow-lg` 
                                        : 'border-border hover:border-muted-foreground/30'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full ${opt.color} shadow-md transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                    {isActive && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-center">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Section 3: Product Card Style */}
            <div className="space-y-4 pb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Product Card Style</h2>
                        <p className="text-sm text-muted-foreground">How individual products are displayed in the catalog</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {cardStyleOptions.map(opt => {
                        const isActive = productCardStyle === opt.value;
                        return (
                            <Card
                                key={opt.value}
                                className={`cursor-pointer transition-all duration-300 ${
                                    isActive
                                        ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                        : 'hover:border-primary/40 hover:shadow-md'
                                }`}
                                onClick={() => setProductCardStyle(opt.value)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold">{opt.label}</h4>
                                        {isActive && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Mini product card preview */}
                                    <div className={`rounded-lg border bg-white overflow-hidden ${
                                        opt.value === 'compact' ? 'flex flex-row h-16' : ''
                                    }`}>
                                        <div className={`bg-gradient-to-br from-slate-200 to-slate-300 ${
                                            opt.value === 'compact' ? 'w-16 h-16 shrink-0' : 'aspect-square w-full'
                                        }`} />
                                        <div className={`p-2 space-y-1 ${opt.value === 'compact' ? 'flex-1 flex flex-col justify-center' : ''}`}>
                                            <div className="h-2 w-3/4 bg-slate-200 rounded" />
                                            {opt.value === 'detailed' && (
                                                <>
                                                    <div className="h-1.5 w-1/2 bg-blue-200 rounded" />
                                                    <div className="flex gap-1">
                                                        <div className="h-1.5 w-8 bg-emerald-200 rounded-full" />
                                                        <div className="h-1.5 w-6 bg-amber-200 rounded-full" />
                                                    </div>
                                                </>
                                            )}
                                            <div className="h-2 w-1/3 bg-slate-900 rounded" />
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground mt-3">{opt.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GlobalPortalDesign;
