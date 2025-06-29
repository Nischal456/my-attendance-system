import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import LeaveRequest from '../../../../models/LeaveRequest';
import Notification from '../../../../models/Notification'; // Import Notification model

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
    if (!hrUser || hrUser.role !== 'HR') {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    const { leaveId, status, hrComments } = req.body;
    if (!leaveId || !status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Leave ID and a valid status are required.' });
    }

    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
        leaveId,
        { status, hrComments: hrComments || '' },
        { new: true }
    ).populate('user', 'name role email');

    if (!updatedLeaveRequest) {
        return res.status(404).json({ message: 'Leave request not found.' });
    }

    // --- Create a TARGETED notification for the user ---
    const notificationContent = `Your ${updatedLeaveRequest.leaveType} request for ${formatDate(updatedLeaveRequest.startDate)} has been ${status.toLowerCase()}.`;
    
    await Notification.create({
      content: notificationContent,
      author: 'HR Department',
      recipient: updatedLeaveRequest.user._id, // Assign the notification to the specific user
      link: '/leaves/report' // Link them to their leave report page
    });

    res.status(200).json({ success: true, message: `Request has been ${status}.`, data: updatedLeaveRequest });
  } catch (error) {
    console.error("Error managing leave request:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

// Helper function to format dates, can be moved to a lib file later
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });