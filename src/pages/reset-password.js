import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token } = router.query;
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!token) {
            setError("No reset token found. Please request a new link.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessage(data.message);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <Image className="mx-auto h-36 w-auto" src="/logo.png" alt="Company Logo" width={100} height={200} />
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
                </div>
                {message ? (
                    <div className="text-center">
                        <p className="text-green-600">{message}</p>
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="New Password" />
                            </div>
                            <div>
                                <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Confirm New Password" />
                            </div>
                        </div>
                        {error && <p className="text-sm font-medium text-red-600 text-center">{error}</p>}
                        <div>
                            <button type="submit" disabled={isSubmitting} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#2ac759] hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ac759]/50 disabled:opacity-50">
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}