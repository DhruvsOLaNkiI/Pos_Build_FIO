import { useState, useEffect } from 'react';
import API from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Store,
    ReceiptText,
    Percent,
    Save,
    Loader2,
    CheckCircle,
} from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        shopName: '',
        address: '',
        phone: '',
        email: '',
        gstNumber: '',
        defaultGST: 18,
        currency: 'INR',
        receiptHeader: '',
        receiptFooter: 'Thank you for your purchase!',
        lowStockThreshold: 10,
        expiryAlertDays: 30,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await API.get('/settings');
                setSettings(res.data.data);
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
        if (saved) setSaved(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await API.put('/settings', settings);
            setSettings(res.data.data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-fade-in flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure your shop details and preferences</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : saved ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shop Details */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Store className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Shop Details</CardTitle>
                                <CardDescription>Basic information about your shop</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SettingField label="Shop Name" value={settings.shopName} onChange={(v) => handleChange('shopName', v)} placeholder="Enter shop name" />
                        <SettingField label="Address" value={settings.address} onChange={(v) => handleChange('address', v)} placeholder="Enter address" />
                        <div className="grid grid-cols-2 gap-4">
                            <SettingField label="Phone" value={settings.phone} onChange={(v) => handleChange('phone', v)} placeholder="Phone number" />
                            <SettingField label="Email" value={settings.email} onChange={(v) => handleChange('email', v)} placeholder="Email address" type="email" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tax Configuration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Percent className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Tax Configuration</CardTitle>
                                <CardDescription>GST and tax settings for billing</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SettingField label="GST Number (GSTIN)" value={settings.gstNumber} onChange={(v) => handleChange('gstNumber', v)} placeholder="e.g. 22AAAAA0000A1Z5" />
                        <div className="grid grid-cols-2 gap-4">
                            <SettingField
                                label="Default GST (%)"
                                value={settings.defaultGST}
                                onChange={(v) => handleChange('defaultGST', Number(v))}
                                placeholder="18"
                                type="number"
                            />
                            <SettingField label="Currency" value={settings.currency} onChange={(v) => handleChange('currency', v)} placeholder="INR" />
                        </div>
                    </CardContent>
                </Card>

                {/* Receipt Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <ReceiptText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Receipt Settings</CardTitle>
                                <CardDescription>Customize your printed receipts</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SettingField label="Receipt Header" value={settings.receiptHeader} onChange={(v) => handleChange('receiptHeader', v)} placeholder="Text shown at top of receipt" />
                        <SettingField label="Receipt Footer" value={settings.receiptFooter} onChange={(v) => handleChange('receiptFooter', v)} placeholder="Thank you for your purchase!" />
                    </CardContent>
                </Card>

                {/* Alert Thresholds */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Store className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Alert Thresholds</CardTitle>
                                <CardDescription>Configure when alerts are triggered</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SettingField
                            label="Low Stock Threshold (default for new products)"
                            value={settings.lowStockThreshold}
                            onChange={(v) => handleChange('lowStockThreshold', Number(v))}
                            placeholder="10"
                            type="number"
                        />
                        <SettingField
                            label="Expiry Alert Days (warn before expiry)"
                            value={settings.expiryAlertDays}
                            onChange={(v) => handleChange('expiryAlertDays', Number(v))}
                            placeholder="30"
                            type="number"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Reusable Setting Field
function SettingField({ label, value, onChange, placeholder, type = 'text' }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">{label}</Label>
            <Input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

export default Settings;
