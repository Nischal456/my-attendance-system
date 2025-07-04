import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import { sendTaskNotificationEmail, sendTaskUpdateEmail } from '../../../../lib/email';

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

    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    const { taskId, title, description, assignedTo, deadline, startTime, endTime } = req.body;
    if (!taskId || !title || !assignedTo) {
      return res.status(400).json({ message: 'Task ID, title, and assigned user are required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (task.assignedBy.toString() !== pmUser._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only edit tasks you have assigned.' });
    }

    const oldAssignedToId = task.assignedTo.toString();
    task.title = title;
    task.description = description;
    task.assignedTo = assignedTo;
    task.deadline = deadline || null;
    task.startTime = startTime || null;
    task.endTime = endTime || null;
    
    await task.save();
    
    const newAssignedToId = task.assignedTo.toString();
    const assignedUser = await User.findById(newAssignedToId);

    if (assignedUser) {
        if (oldAssignedToId !== newAssignedToId) {
            sendTaskNotificationEmail({ to: assignedUser.email, userName: assignedUser.name, taskTitle: task.title, taskDescription: task.description || 'No description provided.', assignedBy: pmUser.name }).catch(e => console.error("Reassignment email failed to send:", e));
        } else {
            sendTaskUpdateEmail({ to: assignedUser.email, userName: assignedUser.name, taskTitle: task.title, assignedBy: pmUser.name }).catch(e => console.error("Update email failed to send:", e));
        }
    }
    
    const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name');
    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}