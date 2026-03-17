import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [customerId, setCustomerId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(customerId);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Customer ID. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass rounded-3xl p-8 shadow-xl relative z-10"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                        <Sparkles className="w-8 h-8 relative z-10" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
                    <p className="text-muted-foreground text-sm mt-1">Access your loyalty points & exclusive offers</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Customer ID</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                placeholder="e.g. 123456"
                                className="w-full bg-white/50 border border-border/50 rounded-2xl px-4 py-4 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:tracking-normal"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                        </div>
                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center pt-2">
                                {error}
                            </motion.p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || customerId.length < 6}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <Store className="w-3 h-3" /> FIO Point of Sale
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
