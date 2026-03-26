import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1); // 1 = verify otp, 2 = set password
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { verifyOtp, resetPassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem('reset_email');
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await verifyOtp(email, otp);
            setSuccess('OTP Verified! You can now enter a new password.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await resetPassword(email, otp, password);
            setSuccess('Password updated successfully! Redirecting...');
            localStorage.removeItem('reset_email');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to reset password.');
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {step === 1 ? 'Verify OTP' : 'Set New Password'}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        {step === 1 ? 'Enter the 6-digit code sent to your email.' : 'Choose a strong password for your account.'}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground ml-1">OTP Code</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    required
                                    placeholder="123456"
                                    maxLength={6}
                                    className="w-full bg-white/50 border border-border/50 rounded-2xl pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:tracking-normal"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
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
                            disabled={loading || otp.length < 6}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] mt-4"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify Code
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground ml-1">New Password</label>
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
                        {success && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-sm text-center pt-2 font-medium">
                                {success}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || password.length < 6}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-medium text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] mt-4"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Confirm Change
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}

            </motion.div>
        </div>
    );
};

export default ResetPassword;
