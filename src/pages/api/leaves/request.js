import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import LeaveRequest from '../../../../models/LeaveRequest';
import Notification from '../../../../models/Notification';
import { sendPushNotification } from '../../../../lib/webPush';

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Connect to the database
  await dbConnect();

  try {
    // 3. Authenticate the user making the request
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 4. Validate the incoming form data
    const { startDate, endDate, reason, leaveType } = req.body;
    if (!startDate || !endDate || !reason || !leaveType) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    // Add a check to ensure the date range is logical
    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ message: 'The start date cannot be after the end date.' });
    }

    // 5. Create a new document using the LeaveRequest model
    const newLeaveRequest = new LeaveRequest({
      user: user._id,
      startDate,
      endDate,
      reason,
      leaveType,
      status: 'Pending', // Set default status
    });

    // 6. Save the new leave request to the database
    await newLeaveRequest.save();

    // 7. Notify Managers strictly (Manager, Project Manager, HR, Superadmin) via In-App Web Notification & Web Push
    const managerUsers = await User.find({
      role: { $in: ['Manager', 'Project Manager', 'HR', 'Superadmin'] }
    }).select('_id pushSubscriptions role name');

    const formattedStart = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedEnd = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const pushPromises = [];

    for (const mgr of managerUsers) {
      // Never send to oneself if a manager applies for leave
      if (String(mgr._id) === String(user._id)) continue;

      // Create Web App In-App Notification document strictly for Manager
      await Notification.create({
        recipient: mgr._id,
        author: `${user.name} (${user.role || 'Staff'})`,
        content: `📋 Leave Request: ${user.name} has submitted a ${leaveType} request from ${formattedStart} to ${formattedEnd}. Reason: "${reason}"`,
        link: '/hr/dashboard',
        isRead: false,
        createdAt: new Date(),
      });

      // Send Web Push Notification to Manager's registered devices
      if (mgr.pushSubscriptions && mgr.pushSubscriptions.length > 0) {
        mgr.pushSubscriptions.forEach(sub => {
          pushPromises.push(
            sendPushNotification(sub, {
              title: `📋 New Leave Request: ${user.name}`,
              body: `${user.name} requested ${leaveType} leave (${formattedStart} - ${formattedEnd}). Reason: ${reason}`,
              url: '/hr/dashboard',
              icon: '/hr.png'
            })
          );
        });
      }
    }

    await Promise.allSettled(pushPromises);

    // 8. Send a success response
    res.status(201).json({ success: true, message: 'Leave request submitted successfully.' });

  } catch (error) {
    // This will catch any errors during the process and log them
    console.error("Error in /api/leaves/request:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}