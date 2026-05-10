import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import HRAuditLog from '../../../../models/HRAuditLog';
import Notification from '../../../../models/Notification';
import { sendPushNotification } from '../../../../lib/webPush';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hrUser = await User.findById(decoded.userId);

    const allUserRoles = [hrUser.role, ...(hrUser.accessRoles || [])];
    if (!hrUser || !allUserRoles.some(r => ['HR', 'Superadmin'].includes(r))) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    const { userId, newRole } = req.body;
    if (!userId || !newRole) {
      return res.status(400).json({ message: 'User ID and new role are required.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Strict Check: Only Superadmins can assign or remove the Superadmin role
    if ((newRole === 'Superadmin' || targetUser.role === 'Superadmin') && hrUser.role !== 'Superadmin') {
      return res.status(403).json({ message: 'Forbidden: Only existing Superadmins can assign or remove the Superadmin role.' });
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    targetUser.promotedBy = hrUser._id;
    await targetUser.save();

    // 1. Audit Log for HR Dashboard
    await HRAuditLog.create({
      action: 'Edited',
      entity: 'Attendance', // We'll just use 'Attendance' as a generic HR entity for now since we didn't add 'User' to the enum
      details: `Changed role of ${targetUser.name} from ${oldRole} to ${newRole}`,
      user: hrUser._id
    });

    // 2. Notification in Workspace
    const notificationContent = `Your role has been updated to ${newRole} by ${hrUser.name}.`;
    await Notification.create({
      content: notificationContent,
      author: 'HR Department',
      recipient: targetUser._id,
      link: '/workspace'
    });

    // 3. Web Push Notification
    if (targetUser.pushSubscriptions && targetUser.pushSubscriptions.length > 0) {
      const pushPromises = targetUser.pushSubscriptions.map(sub =>
        sendPushNotification(sub, {
          title: 'Role Updated ',
          body: notificationContent,
          url: '/workspace',
          icon: '/paw.png'
        })
      );
      await Promise.allSettled(pushPromises);
    }

    const updatedUser = await User.findById(userId).populate('createdBy', 'name').populate('promotedBy', 'name').lean();

    res.status(200).json({ success: true, message: `Successfully updated role to ${newRole}`, data: updatedUser });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
