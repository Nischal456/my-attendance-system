import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
  // 1. This endpoint only accepts PUT requests for updates.
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Connect to the database
  await dbConnect();

  try {
    // 3. Authenticate the employee by verifying their token
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.userId;

    // 4. Get the task ID and the new status from the request
    const { taskId, newStatus } = req.body;
    if (!taskId || !newStatus) {
      return res.status(400).json({ message: 'Task ID and new status are required.' });
    }

    const validStatuses = ['In Progress', 'Completed'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ message: 'Cannot move — already in progress.' });
    }

    // 5. Find the task in the database
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // 6. CRITICAL SECURITY CHECK: Ensure the employee updating the task is the one it's assigned to.
    if (task.assignedTo.toString() !== employeeId) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this task.' });
    }

    // 7. Update the task status
    task.status = newStatus;
    
    // If the task is being marked as 'Completed', record the completion timestamp
    if (newStatus === 'Completed' && !task.completedAt) {
      task.completedAt = new Date();
    }

    await task.save();

    // 8. Send a successful response with the updated task data
    res.status(200).json({ success: true, data: task });

  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}