import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import { sendTaskNotificationEmail } from '../../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  await dbConnect();
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userMakingRequest = await User.findById(decoded.userId);

    if (!userMakingRequest || (userMakingRequest.role !== 'Project Manager' && userMakingRequest.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to assign tasks.' });
    }

    const { title, description, assignedTo, deadline, startTime, endTime } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Task title and an assigned employee are required.' });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
        return res.status(404).json({ message: 'The user you are trying to assign this task to does not exist.' });
    }

    const newTask = new Task({
      title,
      description,
      assignedTo: assignedUser._id,
      assignedBy: userMakingRequest._id,
      deadline: deadline || null,
      startTime: startTime || null,
      endTime: endTime || null,
    });
    await newTask.save();

    sendTaskNotificationEmail({
        to: assignedUser.email,
        userName: assignedUser.name,
        taskTitle: newTask.title,
        taskDescription: newTask.description || 'No description provided.',
        assignedBy: userMakingRequest.name,
    }).catch(emailError => {
        console.error(`Email dispatch failed for task ${newTask._id}, but the task was created successfully.`);
    });

    res.status(201).json({ 
        success: true, 
        message: `Task assigned to ${assignedUser.name}. An email notification has been sent.`, 
        data: newTask 
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}