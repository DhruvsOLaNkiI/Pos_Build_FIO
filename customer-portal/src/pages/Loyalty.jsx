import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, Star } from 'lucide-react';

const Loyalty = () => {
    const { customer } = useAuth();
    const { trackPageVisit } = useCustomerActivityTracking();
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        trackPageVisit('/loyalty');
        const fetchSettings = async () => {
            try {
                const { data } = await API.get('/loyalty-settings');
                if (data.success && data.data) {
                    setSettings(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch loyalty settings', error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen bg-background p-4 animate-fade-in relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />

            <header className="mb-6 pt-2 relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        My Points
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        Your rewards balance
                    </p>
                </div>
                <div className="bg-muted px-3 py-1.5 rounded-full border border-border flex items-center gap-1.5 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-sm">{customer?.loyaltyPoints || 0}</span>
                </div>
            </header>

            {/* Digital Loyalty Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full aspect-[1.6/1] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-white/10"
            >
                {/* Card Sparkles Overlay */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="text-white/60 text-xs tracking-widest uppercase font-medium mb-1">FIO Premium</div>
                        <div className="text-white font-semibold tracking-wide flex items-center gap-2">
                            Rewards Card <Sparkles className="w-4 h-4 text-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="text-white/60 text-xs uppercase mb-1">Available Points</div>
                    <div className="text-4xl text-white font-bold tracking-tight">
                        {customer?.loyaltyPoints || 0}
                    </div>
                </div>

                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Cardholder</div>
                        <div className="text-white text-sm font-medium tracking-wide">
                            {customer?.name || 'Guest'}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/60 text-[10px] uppercase tracking-wider mb-0.5 text-right">Card No.</div>
                        <div className="text-white text-sm font-mono tracking-widest bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                            {customer?.customerId || '------'}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* How it works */}
            <div className="mt-8 space-y-4 relative z-10">
                <h3 className="font-semibold text-lg">How it works</h3>
                <div className="bg-white rounded-2xl p-4 border border-border/50 shadow-sm space-y-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-primary">1</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">Shop & Earn</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Earn points automatically on every purchase.</p>
                            {settings && settings.pointsPerCurrency > 0 && (
                                <p className="text-xs font-semibold text-primary mt-1.5 bg-primary/5 inline-block px-2 py-1 rounded-md">
                                    ✦ Earn {settings.pointsPerCurrency} point{settings.pointsPerCurrency !== 1 ? 's' : ''} per ₹1 spent
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="w-px h-6 bg-border ml-5 my-[-12px]" />
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-yellow-600">2</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">Redeem Points</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Tell the cashier your Customer ID during checkout to use points for discounts.</p>
                            {settings && settings.pointValue > 0 && (
                                <div className="text-xs mt-1.5 space-y-1">
                                    <p className="font-semibold text-yellow-600 bg-yellow-500/10 inline-block px-2 py-1 rounded-md">
                                        ✦ 1 Point = ₹{settings.pointValue}
                                    </p>
                                    <p className="text-muted-foreground italic">
                                        (Minimum {settings.minPointsToRedeem} points required to redeem)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-6"></div>
        </div>
    );
};

export default Loyalty;
