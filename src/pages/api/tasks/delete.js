// pages/api/tasks/delete.js
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);

    if (!pmUser || pmUser.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ message: 'Task ID is required.' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (task.assignedBy.toString() !== pmUser._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete tasks you have assigned.' });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}