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
        if (!hrUser || hrUser.role !== 'HR') {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
        }
        
        // 2. Get data from the request body, including the new target info
        const { content, targetType, targetUser } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required.' });
        }

        // 3. Check the target type and act accordingly
        if (targetType === 'individual') {
            // --- Logic for sending to a SINGLE user ---
            if (!targetUser) {
                return res.status(400).json({ message: 'A target user must be selected for individual notification.'});
            }
            // Create a single notification for the selected user
            await Notification.create({
                content: content,
                author: hrUser.name,
                recipient: targetUser,
                link: '#', 
            });

            // Send Web Push to this specific individual
            const recipientUser = await User.findById(targetUser).select('pushSubscriptions');
            if (recipientUser && recipientUser.pushSubscriptions && recipientUser.pushSubscriptions.length > 0) {
                const pushPromises = recipientUser.pushSubscriptions.map(sub => 
                    sendPushNotification(sub, {
                        title: `Message from ${hrUser.name} (HR) 📩`,
                        body: content,
                        url: '/dashboard',
                        icon: '/paw.png'
                    })
                );
                await Promise.allSettled(pushPromises);
            }

            res.status(201).json({ success: true, message: `Notification sent successfully to the selected user.` });

        } else {
            // --- Logic for sending to ALL users (your original logic) ---
            const allTargetUsers = await User.find({ role: { $ne: 'HR' } }).select('_id pushSubscriptions');
            
            if (allTargetUsers.length === 0) {
                return res.status(200).json({ success: true, message: 'No users to notify.' });
            }

            const notificationsToCreate = allTargetUsers.map(user => ({
                content: content,
                author: hrUser.name,
                recipient: user._id,
                link: '#',
            }));

            await Notification.insertMany(notificationsToCreate);

            // Execute Native Web Push Broadcast
            const broadcastPromises = [];
            allTargetUsers.forEach(user => {
                if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                    user.pushSubscriptions.forEach(sub => {
                        broadcastPromises.push(
                            sendPushNotification(sub, {
                                title: "System Broadcast 🚨",
                                body: content,
                                url: '/dashboard',
                                icon: '/paw.png'
                            })
                        );
                    });
                }
            });

            // Use allSettled so if one token is expired, it doesn't crash the whole broadcast
            await Promise.allSettled(broadcastPromises);
            
            res.status(201).json({ success: true, message: `Broadcast sent to ${allTargetUsers.length} users.` });
        }

    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}