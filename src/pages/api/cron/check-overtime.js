import dbConnect from '../../../lib/dbConnect';
import Attendance from '../../../models/Attendance';
import User from '../../../models/User';
import Notification from '../../../models/Notification';
import { sendPushNotification } from '../../../lib/webPush';

export default async function handler(req, res) {
  // Only allow GET or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Basic Security Check: Require a secret key
  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;
  
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    querySecret !== process.env.CRON_SECRET
  ) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  try {
    // Threshold: 7 hours ago
    const thresholdDate = new Date(Date.now() - 7 * 60 * 60 * 1000);

    // Find attendances that:
    // 1. Have not checked out
    // 2. Checked in MORE than 7 hours ago
    // 3. Haven't been notified yet
    const overdueAttendances = await Attendance.find({
      checkOutTime: { $exists: false }, // Using $exists or null check based on schema structure
      checkInTime: { $lte: thresholdDate },
      overtimeNotified: { $ne: true }
    }).populate('user', 'name pushSubscriptions');

    // Also try checking explicit nulls just in case
    const overdueAttendancesNull = await Attendance.find({
      checkOutTime: null,
      checkInTime: { $lte: thresholdDate },
      overtimeNotified: { $ne: true }
    }).populate('user', 'name pushSubscriptions');

    // Combine and deduplicate
    const allOverdue = [...new Map([...overdueAttendances, ...overdueAttendancesNull].map(item => [item._id.toString(), item])).values()];

    if (allOverdue.length === 0) {
      return res.status(200).json({ success: true, message: 'No overdue checkouts found.' });
    }

    const notifiedUsers = [];

    // Process each overdue attendance
    for (const record of allOverdue) {
      if (!record.user) continue; // Skip if user was deleted
      
      const userId = record.user._id;
      const userName = record.user.name.split(' ')[0]; // First name

      // 1. Mark as notified in Database
      await Attendance.findByIdAndUpdate(record._id, { overtimeNotified: true });

      // 2. Create In-App Workspace Notification
      await Notification.create({
        recipient: userId,
        author: 'System Monitor',
        content: `Hey ${userName}, you have been checked in for over 7 hours. Did you forget to checkout?`,
        link: '/workspace'
      });

      // 3. Dispatch Web Push Notification
      if (record.user.pushSubscriptions && record.user.pushSubscriptions.length > 0) {
        const pushPayload = {
          title: 'Checkout Reminder ⏰',
          body: `Hey ${userName}, you've been working for over 7 hours! Don't forget to check out.`,
          url: '/workspace'
        };

        const remainingSubscriptions = [];
        for (const sub of record.user.pushSubscriptions) {
          try {
            await sendPushNotification(sub, pushPayload);
            remainingSubscriptions.push(sub);
          } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
              console.log('Subscription expired, removing from user.');
            } else {
              console.error('Push error:', error);
              remainingSubscriptions.push(sub);
            }
          }
        }

        if (remainingSubscriptions.length !== record.user.pushSubscriptions.length) {
          await User.findByIdAndUpdate(userId, { pushSubscriptions: remainingSubscriptions });
        }
      }
      
      notifiedUsers.push(record.user.name);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully notified ${notifiedUsers.length} users.`,
      notifiedUsers
    });

  } catch (error) {
    console.error('Overtime Cron Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
