import crypto from 'crypto';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();

    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required.' });
        }

        // Hash the incoming token to find it in the database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find the user by the token and check if it has not expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        // Set the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Invalidate the token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        // --- NEW: Create a notification for the user ---
        try {
            await Notification.create({
                content: "Your account password has been changed successfully.",
                author: "System Security",
                recipient: user._id, // Send only to the user whose password was changed
                link: '/dashboard' // Link back to their dashboard
            });
        } catch (notificationError) {
            console.error("Failed to create password change notification:", notificationError);
            // We don't stop the process if notification fails, as the password change was successful.
        }
        // --- END OF NEW CODE ---

        res.status(200).json({ success: true, message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('RESET PASSWORD API ERROR:', error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
}