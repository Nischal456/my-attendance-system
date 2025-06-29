import { useState } from 'react';
import { useRouter } from 'next/router';
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
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters long.'); return; }
        setIsSubmitting(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessage(data.message + ' You will be redirected shortly.');
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8">
                <div><Image className="mx-auto h-12 w-auto rounded-full" src="/geckoworks.png" alt="Company Logo" width={48} height={48} /><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Set a new password</h2></div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div><label htmlFor="password">New Password</label><input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300" placeholder="New Password" /></div>
                        <div><label htmlFor="confirm-password">Confirm New Password</label><input id="confirm-password" name="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300" placeholder="Confirm New Password" /></div>
                    </div>
                    {message && <p className="text-sm font-medium text-green-600 text-center">{message}</p>}
                    {error && <p className="text-sm font-medium text-red-600 text-center">{error}</p>}
                    <div><button type="submit" disabled={isSubmitting || !!message} className="group relative w-full flex justify-center py-2 px-4 border text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{isSubmitting ? 'Resetting...' : 'Reset Password'}</button></div>
                </form>
            </div>
        </div>
    );
}