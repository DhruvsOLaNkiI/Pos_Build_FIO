import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Store, Mail, Lock, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'id'
    
    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            if (loginMethod === 'email') {
                await login({ email, password });
            } else {
                await login({ customerId });
            }
            navigate('/select-company');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
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

                {/* Login Method Toggle */}
                <div className="flex bg-muted rounded-xl p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => { setLoginMethod('email'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                            loginMethod === 'email' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginMethod('id'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                            loginMethod === 'id' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Customer ID
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {loginMethod === 'email' ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@email.com"
                                        className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-medium text-foreground">Password</label>
                                    <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground ml-1">Customer ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 123456"
                                    className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:tracking-normal"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center pt-2 font-medium">
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (loginMethod === 'id' && customerId.length < 6)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] mt-2"
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
                    
                    <button 
                        type="button" 
                        onClick={() => navigate('/select-company')}
                        className="w-full bg-muted/60 hover:bg-muted text-foreground h-12 rounded-2xl font-medium text-sm flex items-center justify-center transition-all mt-3"
                    >
                        Browse as Guest (See Store)
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign up</Link>
                        </p>
                    </div>
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
