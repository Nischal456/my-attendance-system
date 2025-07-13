import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);

    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const assignedTasks = await Task.find({ assignedBy: pmUser._id })
      .populate('assignedTo', 'name avatar')
      .populate('assistedBy', 'name avatar')
      .populate('attachments.uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: assignedTasks });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}