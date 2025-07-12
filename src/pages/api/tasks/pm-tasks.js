import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Authenticate the user (the PM) by verifying their token
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const pmUser = await User.findById(decoded.userId);

    // Authorize the user: Check if their role is 'Project Manager' or 'HR'
    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view these tasks.' });
    }

    // Fetch all tasks assigned by this PM, and populate necessary details
    const assignedTasks = await Task.find({ assignedBy: pmUser._id })
      .populate('assignedTo', 'name avatar')
      .populate('attachments.uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: assignedTasks });

  } catch (error) {
    console.error("Error fetching PM tasks:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}