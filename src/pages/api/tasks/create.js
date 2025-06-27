import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
// --- NEW: Import the email sending function ---
import { sendTaskNotificationEmail } from '../../../../lib/email';

export default async function handler(req, res) {
  // 1. Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Connect to the database
  await dbConnect();

  try {
    // 3. Authenticate the user (the PM) by verifying their token
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userMakingRequest = await User.findById(decoded.userId);

    // 4. Authorize the user: Check if their role is 'Project Manager' or 'HR'
    if (!userMakingRequest || (userMakingRequest.role !== 'Project Manager' && userMakingRequest.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to assign tasks.' });
    }

    // 5. Validate the incoming data
    const { title, description, assignedTo, deadline } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Task title and an assigned employee are required.' });
    }

    // --- NEW: Find the full user object for the person being assigned the task ---
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
        return res.status(404).json({ message: 'The user you are trying to assign this task to does not exist.' });
    }

    // 6. Create the new task document in the database
    const newTask = new Task({
      title,
      description,
      assignedTo: assignedUser._id, // Use the validated user ID
      assignedBy: userMakingRequest._id,
      deadline: deadline || null,
    });

    await newTask.save();

    // --- NEW: Send the email notification after saving the task ---
    // This runs in the background and will not block the API response.
    sendTaskNotificationEmail({
        to: assignedUser.email,
        userName: assignedUser.name,
        taskTitle: newTask.title,
        taskDescription: newTask.description || 'No description provided.',
        assignedBy: userMakingRequest.name,
    }).catch(emailError => {
        // The error is already logged inside the email function.
        // This just prevents an unhandled promise rejection warning in your server logs.
        console.error(`Email dispatch failed for task ${newTask._id}, but the task was created successfully.`);
    });


    // 7. Send a successful response with a more informative message
    res.status(201).json({ 
        success: true, 
        message: `Task assigned to ${assignedUser.name}. An email notification has been sent.`, 
        data: newTask 
    });

  } catch (error) {
    console.error("Error creating task:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}