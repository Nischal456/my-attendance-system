import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import HRAuditLog from '../../../../models/HRAuditLog';
import Notification from '../../../../models/Notification';
import { sendPushNotification } from '../../../../lib/webPush';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { userId, isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Force boolean conversion
    const status = isActive === true;

    const targetUser = await User.findByIdAndUpdate(
      userId, 
      { isActive: status }, 
      { new: false } 
    ).select('name');

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log Audit
    await HRAuditLog.create({
        action: 'Edited',
        entity: 'Attendance', // Re-using generic entity
        details: status ? `Re-activated account for ${targetUser.name}` : `Deactivated account for ${targetUser.name}`,
        user: decoded.userId
    });

    const hrUser = await User.findById(decoded.userId).select('name');
    const notificationContent = status 
      ? `Your account has been re-activated by HR (${hrUser.name}). Welcome back!`
      : `Your account has been deactivated by HR (${hrUser.name}). You have been moved to Alumni status.`;
    
    await Notification.create({
      content: notificationContent,
      author: 'HR Department',
      recipient: targetUser._id,
      link: '/workspace'
    });

    const fullTargetUser = await User.findById(userId);
    if (fullTargetUser.pushSubscriptions && fullTargetUser.pushSubscriptions.length > 0) {
        const pushPromises = fullTargetUser.pushSubscriptions.map(sub => 
            sendPushNotification(sub, {
                title: status ? 'Account Re-Activated 🟢' : 'Account Deactivated 🔴',
                body: notificationContent,
                url: '/workspace',
                icon: '/paw.png'
            })
        );
        await Promise.allSettled(pushPromises);
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
        success: true, 
        message: status ? 'User Re-Activated Successfully' : 'User Moved to Alumni',
        data: user
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}