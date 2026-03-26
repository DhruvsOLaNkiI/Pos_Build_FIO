import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Store, Mail, Lock, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../services/api';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Get the first company as default for signup (or from localStorage if available)
            const { data } = await API.get('/companies');
            const companyId = data.data?.[0]?._id;
            
            if (!companyId) {
                throw new Error("No active company found for registration.");
            }

            const storeId = localStorage.getItem('customer_store_id') || undefined;
            
            await signup({ 
                name, 
                email, 
                mobile, 
                password, 
                companyId,
                preferredStoreId: storeId
            });
            
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Signup failed. Please try again.');
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
                className="w-full max-w-sm glass rounded-3xl p-8 shadow-xl relative z-10 my-8"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                        <Sparkles className="w-8 h-8 relative z-10" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
                    <p className="text-muted-foreground text-sm mt-1">Join us to earn points and shop faster</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground ml-1">Mobile Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="tel"
                                required
                                placeholder="9876543210"
                                className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </div>
                    </div>

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
                        <label className="text-sm font-medium text-foreground ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                                className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center pt-2 font-medium">
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] mt-4"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Sign Up
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
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

export default Signup;
