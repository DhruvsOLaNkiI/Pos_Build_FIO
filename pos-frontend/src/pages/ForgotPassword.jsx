import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { KeyRound, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await forgotPassword(email);
            setSuccess(true);
            if (res.resetToken) {
                setResetToken(res.resetToken);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset token.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md relative animate-fade-in border-border bg-card">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                        <CardDescription className="mt-2">
                            Enter your email and we'll send you a reset link
                        </CardDescription>
                    </div>
                </CardHeader>

                {success ? (
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-green-500/10 text-green-500 text-sm border border-green-500/20 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Reset token generated!</p>
                                {resetToken && (
                                    <p className="mt-2 text-xs font-mono bg-background p-2 rounded break-all">
                                        {resetToken}
                                    </p>
                                )}
                                <p className="mt-2 text-xs opacity-75">
                                    In production, this would be sent via email.
                                </p>
                            </div>
                        </div>
                        <Link to="/login">
                            <Button variant="outline" className="w-full">
                                Back to Login
                            </Button>
                        </Link>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Token'
                                )}
                            </Button>
                            <Link
                                to="/login"
                                className="text-sm text-center text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                Back to Login
                            </Link>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default ForgotPassword;
