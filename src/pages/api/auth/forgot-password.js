import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../../../lib/email';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    await dbConnect();
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`Password reset requested for non-existent user: ${email}`);
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
        await user.save();
        await sendPasswordResetEmail({ to: user.email, token: resetToken });
        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('FORGOT PASSWORD API ERROR:', error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
}