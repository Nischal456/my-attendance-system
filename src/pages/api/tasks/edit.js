import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
// --- NEW: Import both email functions ---
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

    // Security: Only Project Managers or HR can edit tasks
    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    // --- BUG FIX: Added `deadline` to the destructuring ---
    const { taskId, title, description, assignedTo, deadline } = req.body;
    if (!taskId || !title || !assignedTo) {
      return res.status(400).json({ message: 'Task ID, title, and assigned user are required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Security: Ensure the PM editing the task is the one who assigned it.
    if (task.assignedBy.toString() !== pmUser._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only edit tasks you have assigned.' });
    }

    // --- NEW: Keep track of old assignee to check if the task was reassigned ---
    const oldAssignedToId = task.assignedTo.toString();

    // Update the task fields
    task.title = title;
    task.description = description;
    task.assignedTo = assignedTo;
    task.deadline = deadline || null;
    
    await task.save();
    
    // --- NEW: Email Notification Logic ---
    const newAssignedToId = task.assignedTo.toString();
    const assignedUser = await User.findById(newAssignedToId);

    if (assignedUser) {
        if (oldAssignedToId !== newAssignedToId) {
            // The task was REASSIGNED to a new user.
            sendTaskNotificationEmail({
                to: assignedUser.email,
                userName: assignedUser.name,
                taskTitle: task.title,
                taskDescription: task.description || 'No description provided.',
                assignedBy: pmUser.name,
            }).catch(e => console.error("Reassignment email failed to send:", e));
        } else {
            // The task was just UPDATED for the same user.
            sendTaskUpdateEmail({
                to: assignedUser.email,
                userName: assignedUser.name,
                taskTitle: task.title,
                assignedBy: pmUser.name,
            }).catch(e => console.error("Update email failed to send:", e));
        }
    }
    
    // Populate the user details for the response so the frontend updates correctly
    const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name');

    res.status(200).json({ success: true, data: updatedTask });

  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}