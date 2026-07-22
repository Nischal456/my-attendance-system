import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';
import { sendPushNotification } from '../../../../lib/webPush';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    await dbConnect();

    try {
        // 1. Authenticate and authorize the HR user
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser || ![hrUser.role, ...(hrUser.accessRoles || [])].some(r => ['HR', 'Superadmin'].includes(r))) {
            return res.status(403).json({ message: 'Forbidden: HR access required.' });
        }
        
        // 2. Get data from request body
        const { content, targetType, targetUser, noticeType = 'hr_notice' } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Notification content is required.' });
        }

        // Determine Notification Author and Web Push Title based on noticeType
        let notificationAuthor = `${hrUser.name} (HR)`;
        let pushTitle = `📢 Announcement from HR (${hrUser.name})`;
        let pushIcon = '/hr.png';

        if (noticeType === 'system_update') {
            notificationAuthor = 'WorkOS System Notification';
            pushTitle = '⚙️ System Notification Update';
            pushIcon = '/paw.png';
        } else if (noticeType === 'system_alert') {
            notificationAuthor = 'WorkOS Emergency Alert';
            pushTitle = '🚨 System Emergency Alert';
            pushIcon = '/paw.png';
        }

        // 3. Resolve Target Users
        let targetUsers = [];

        if (targetType === 'individual') {
            if (!targetUser) {
                return res.status(400).json({ message: 'Please select an individual recipient.' });
            }
            const singleUser = await User.findById(targetUser).select('_id pushSubscriptions name');
            if (singleUser) targetUsers = [singleUser];
        } else if (targetType === 'staff') {
            targetUsers = await User.find({ role: { $in: ['Staff', 'Intern', 'Trainee'] } }).select('_id pushSubscriptions name');
        } else if (targetType === 'managers') {
            targetUsers = await User.find({ role: { $in: ['Manager', 'Project Manager', 'HR', 'Superadmin'] } }).select('_id pushSubscriptions name');
        } else {
            // 'all' or default -> Everyone in the organization
            targetUsers = await User.find({}).select('_id pushSubscriptions name');
        }

        if (targetUsers.length === 0) {
            return res.status(200).json({ success: true, message: 'No recipients matched the selected filter.' });
        }

        // 4. Create In-App Notifications for all target users
        const notificationsToCreate = targetUsers.map(user => ({
            content: content,
            author: notificationAuthor,
            recipient: user._id,
            link: '/dashboard',
            isRead: false,
            createdAt: new Date(),
        }));

        await Notification.insertMany(notificationsToCreate);

        // 5. Send Web Push Notifications to all target devices
        const pushPromises = [];
        targetUsers.forEach(user => {
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                user.pushSubscriptions.forEach(sub => {
                    pushPromises.push(
                        sendPushNotification(sub, {
                            title: pushTitle,
                            body: content,
                            url: '/dashboard',
                            icon: pushIcon
                        })
                    );
                });
            }
        });

        await Promise.allSettled(pushPromises);

        res.status(201).json({ 
            success: true, 
            message: `Notification broadcasted to ${targetUsers.length} user(s) as ${notificationAuthor}.` 
        });

    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}