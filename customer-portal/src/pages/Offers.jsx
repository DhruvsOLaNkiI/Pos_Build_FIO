import { useState, useEffect } from 'react';
import API from '../services/api';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { Gift, Zap, Copy, CheckCircle2, Blocks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Offers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const { trackPageVisit } = useCustomerActivityTracking();

    useEffect(() => {
        trackPageVisit('/offers');
        const fetchOffers = async () => {
            try {
                const { data } = await API.get('/offers');
                setOffers(data.data);
            } catch (error) {
                console.error('Failed to fetch offers', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, []);

    const handleCopy = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen bg-background p-4 animate-fade-in pb-24">
            <header className="mb-6 pt-2">
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    Exclusive Offers <Gift className="w-6 h-6 text-primary" />
                </h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">
                    Tap to copy and use at checkout
                </p>
            </header>

            <div className="space-y-4">
                <AnimatePresence>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : offers.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-12 text-muted-foreground bg-white/50 rounded-2xl border border-dashed border-border"
                        >
                            No active offers available right now.
                        </motion.div>
                    ) : (
                        offers.map((offer, index) => {
                            // Render distinct UI for wholesale tiers
                            if (offer.type === 'wholesale') {
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={offer._id}
                                        className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-5 shadow-sm border border-indigo-100 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 uppercase tracking-wider">
                                            <Blocks className="w-3 h-3 fill-current" /> Bulk Deal
                                        </div>

                                        <div className="pr-20">
                                            <h3 className="font-bold text-lg leading-tight text-indigo-900">
                                                {offer.applicableProduct?.name || 'Special Item'} {offer.applicableProduct?.variant ? `(${offer.applicableProduct.variant})` : ''}
                                            </h3>
                                            <p className="text-sm font-medium text-indigo-600/80 mt-1">
                                                Buy {offer.minQuantity} or more, get them for ₹{offer.wholesalePrice} each!
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-dashed border-indigo-200 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                                                    Applied Automatically
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl flex items-center gap-1 font-black text-indigo-600">
                                                    <span className="text-lg">₹</span>{offer.wholesalePrice}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            // Normal offer rendering
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={offer._id}
                                    className="bg-white rounded-3xl p-5 shadow-sm border border-border/50 relative overflow-hidden"
                                >
                                    {/* Decorative badge */}
                                    {offer.isAutoApply && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 uppercase tracking-wider">
                                            <Zap className="w-3 h-3 fill-current" /> Auto-Apply
                                        </div>
                                    )}

                                    <div className="pr-12">
                                        <h3 className="font-bold text-lg leading-tight text-foreground">
                                            {offer.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {offer.description || 'Valid on your next purchase.'}
                                        </p>
                                        {offer.minPurchaseAmount > 0 && (
                                            <p className="text-xs font-semibold text-primary mt-1">
                                                Min. Order: ₹{offer.minPurchaseAmount}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-dashed border-border flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                                                {offer.isAutoApply ? 'No Code Needed' : 'Use Promo Code'}
                                            </div>
                                            {!offer.isAutoApply && (
                                                <div className="font-mono font-bold text-primary tracking-widest text-lg">
                                                    {offer.couponCode}
                                                </div>
                                            )}
                                        </div>

                                        {!offer.isAutoApply && (
                                            <button
                                                onClick={() => handleCopy(offer.couponCode, offer._id)}
                                                className={`p-3 rounded-full transition-colors ${copiedId === offer._id ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                            >
                                                {copiedId === offer._id ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <Copy className="w-5 h-5" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Offers;
