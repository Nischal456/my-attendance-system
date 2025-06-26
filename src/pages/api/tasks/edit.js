// pages/api/tasks/edit.js
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);

    // Security: Only Project Managers can edit tasks
    if (!pmUser || pmUser.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    const { taskId, title, description, assignedTo } = req.body;
    if (!taskId || !title || !assignedTo) {
      return res.status(400).json({ message: 'Task ID, title, and assigned user are required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Security: Ensure the PM editing the task is the one who assigned it.
    if (task.assignedBy.toString() !== pmUser._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only edit tasks you have assigned.' });
    }

    // Update the task fields
    task.title = title;
    task.description = description;
    task.assignedTo = assignedTo;
    task.deadline = deadline || null;
    
    await task.save();
    
    // Populate the user details for the response
    const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}