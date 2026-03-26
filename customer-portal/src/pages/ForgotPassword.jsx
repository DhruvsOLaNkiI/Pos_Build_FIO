import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { forgotPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await forgotPassword(email);
            setSuccess('OTP sent successfully!');
            // Save email so we can pre-fill the reset pass form
            localStorage.setItem('reset_email', email);
            setTimeout(() => {
                navigate('/reset-password');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass rounded-3xl p-8 shadow-xl relative z-10"
            >
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                </Link>

                <div className="flex flex-col items-center text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot Password</h1>
                    <p className="text-muted-foreground text-sm mt-2">Enter your email and we'll send you an OTP to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    
                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center pt-2 font-medium">
                            {error}
                        </motion.p>
                    )}

                    {success && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-sm text-center pt-2 font-medium">
                            {success}
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
                                Send OTP
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
