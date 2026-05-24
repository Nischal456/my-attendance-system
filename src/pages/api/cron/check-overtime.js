import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { sendPushNotification } from '@/lib/webPush';

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
    // Find attendances that:
    // 1. Have not checked out
    // 2. Haven't been notified of overtime yet
    const activeAttendances = await Attendance.find({
      checkOutTime: { $exists: false },
      overtimeNotified: { $ne: true }
    }).populate('user', 'name role pushSubscriptions');

    const activeAttendancesNull = await Attendance.find({
      checkOutTime: null,
      overtimeNotified: { $ne: true }
    }).populate('user', 'name role pushSubscriptions');

    // Combine and deduplicate
    const allActive = [...new Map([...activeAttendances, ...activeAttendancesNull].map(item => [item._id.toString(), item])).values()];

    // Filter by role-specific thresholds:
    // Intern: 7 hours (7 * 60 * 60 * 1000 ms)
    // Trainee: 8 hours (8 * 60 * 60 * 1000 ms)
    const allOverdue = allActive.filter(record => {
      if (!record.user || !record.checkInTime) return false;
      
      const role = record.user.role;
      const elapsedMs = Date.now() - new Date(record.checkInTime).getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      if (role === 'Intern') {
        return elapsedHours >= 7;
      }
      if (role === 'Trainee') {
        return elapsedHours >= 8;
      }
      
      // Other roles are ignored for check-out warning push notifications
      return false;
    });

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
        content: `Hey ${userName}, you haven't checked out. Please, did you forget to check out?`,
        link: '/workspace'
      });

      // 3. Dispatch Web Push Notification
      if (record.user.pushSubscriptions && record.user.pushSubscriptions.length > 0) {
        const pushPayload = {
          title: 'Checkout Reminder ⏰',
          body: `Hey ${userName}, you haven't checked out. Please, did you forget to check out?`,
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
