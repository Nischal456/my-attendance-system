import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Notification from '../../../../models/Notification';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow up to 10mb for file uploads
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });
  
  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);
    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { taskId, title, description, assignedTo, deadline } = req.body;
    if (!taskId) return res.status(400).json({ message: 'Task ID is required.' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (task.assignedBy.toString() !== pmUser._id.toString()) {
      return res.status(403).json({ message: 'You can only edit tasks you have assigned.' });
    }

    const oldAssignedToId = task.assignedTo.toString();

    task.title = title;
    task.description = description;
    task.assignedTo = assignedTo;
    task.deadline = deadline || null;
    
    await task.save();

    const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('attachments.uploadedBy', 'name');
    res.status(200).json({ success: true, message: 'Task updated!', data: updatedTask });
    
    // Send notification if assignment changed
    if (oldAssignedToId !== assignedTo.toString()) {
      await Notification.create({ recipient: assignedTo, author: pmUser.name, content: `A task has been reassigned to you: "${title}"`, link: '/dashboard' });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}