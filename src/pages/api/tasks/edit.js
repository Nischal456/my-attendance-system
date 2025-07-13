import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Notification from '../../../../models/Notification';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  await dbConnect();

  try {
    // 1. Authenticate and Authorize the Project Manager
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);
    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 2. Get all data from the request, including the new 'assistedBy' array
    const { taskId, title, description, assignedTo, deadline, assistedBy } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (task.assignedBy.toString() !== pmUser._id.toString()) {
      return res.status(403).json({ message: 'You can only edit tasks you have assigned.' });
    }

    // 3. Keep track of who was on the task *before* the update
    const oldAssignee = task.assignedTo.toString();
    const oldAssistants = task.assistedBy.map(id => id.toString());
    const oldTeam = new Set([oldAssignee, ...oldAssistants]);

    // 4. Update the task fields
    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.deadline = deadline || null;
    task.assistedBy = assistedBy || []; // Update assistants
    
    await task.save();

    // 5. Respond to the frontend immediately with the fully populated task
    const updatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'name avatar')
        .populate('assistedBy', 'name avatar')
        .populate('attachments.uploadedBy', 'name');

    res.status(200).json({ success: true, message: 'Task updated!', data: updatedTask });

    // 6. Send notifications to any NEWLY added members after responding
    const newAssignee = task.assignedTo.toString();
    const newAssistants = task.assistedBy.map(id => id.toString());
    const newTeam = new Set([newAssignee, ...newAssistants]);

    const addedMembers = [...newTeam].filter(memberId => !oldTeam.has(memberId));

    if (addedMembers.length > 0) {
        const notifications = addedMembers.map(userId => ({
            recipient: userId,
            author: pmUser.name,
            content: `You have been added to an updated task: "${task.title}"`,
            link: '/dashboard'
        }));
        await Notification.insertMany(notifications);
    }
    
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}