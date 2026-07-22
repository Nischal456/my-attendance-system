import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import LeaveRequest from '../../../../models/LeaveRequest';
import Notification from '../../../../models/Notification'; // Import Notification model
import HRAuditLog from '../../../../models/HRAuditLog';
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
    if (!hrUser || ![hrUser.role, ...(hrUser.accessRoles || [])].some(r => ['HR', 'Superadmin'].includes(r))) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    const { leaveId, status, hrComments } = req.body;
    if (!leaveId || !status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Leave ID and a valid status are required.' });
    }

    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
        leaveId,
        { status, hrComments: hrComments || '', updatedBy: hrUser._id },
        { new: true }
    ).populate('user', 'name role email').populate('updatedBy', 'name avatar');

    if (!updatedLeaveRequest) {
        return res.status(404).json({ message: 'Leave request not found.' });
    }

    // --- Create a short, concise notification for the staff user ---
    const shortStart = new Date(updatedLeaveRequest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const shortEnd = new Date(updatedLeaveRequest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const statusEmoji = status === 'Approved' ? '✅' : '❌';
    const notificationContent = `Leave ${status} ${statusEmoji}: ${updatedLeaveRequest.leaveType} (${shortStart} - ${shortEnd})${hrComments ? `. HR Note: "${hrComments}"` : ''}`;
    
    await Notification.create({
      content: notificationContent,
      author: 'HR Management',
      recipient: updatedLeaveRequest.user._id,
      link: '/leaves/report',
      isRead: false,
      createdAt: new Date(),
    });

    await HRAuditLog.create({
        action: status, // 'Approved' or 'Rejected'
        entity: 'Leave Request',
        details: `${status} leave request for ${updatedLeaveRequest.user.name} (${updatedLeaveRequest.leaveType})`,
        user: hrUser._id
    });

    // Send the Native Web Push Alert
    const targetUser = await User.findById(updatedLeaveRequest.user._id).select('pushSubscriptions');
    if (targetUser && targetUser.pushSubscriptions && targetUser.pushSubscriptions.length > 0) {
        const pushPromises = targetUser.pushSubscriptions.map(sub => 
            sendPushNotification(sub, {
                title: `Leave Request ${status} ${statusEmoji}`,
                body: notificationContent,
                url: '/leaves/report',
                icon: '/paw.png'
            })
        );
        await Promise.allSettled(pushPromises);
    }

    res.status(200).json({ success: true, message: `Request has been ${status}.`, data: updatedLeaveRequest });
  } catch (error) {
    console.error("Error managing leave request:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

// Helper function to format dates, can be moved to a lib file later
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });