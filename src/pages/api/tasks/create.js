import jwt from 'jsonwebtoken';
// --- CORRECTED: Using the '@/' alias for clean, error-free imports ---
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
  // 1. Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Connect to the database
  await dbConnect();

  try {
    // 3. Authenticate the user by verifying their token from cookies
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user making the request
    const userMakingRequest = await User.findById(decoded.userId);

    // 4. Authorize the user: Check if their role is 'Project Manager'
    if (!userMakingRequest || userMakingRequest.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to assign tasks.' });
    }

    // 5. Validate the incoming data
    const { title, description, assignedTo } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Task title and an assigned employee are required.' });
    }

    // 6. Create the new task document in the database
    const newTask = new Task({
      title,
      description,
      assignedTo, // The ID of the employee receiving the task
      assignedBy: userMakingRequest._id, // The ID of the Project Manager assigning it
    });

    await newTask.save();

    // 7. Send a successful response
    res.status(201).json({ success: true, message: 'Task created successfully', data: newTask });

  } catch (error) {
    console.error("Error creating task:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}