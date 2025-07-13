import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Notification from '../../../../models/Notification'; // Import Notification model
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure API body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // 1. Authenticate and Authorize the Project Manager
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);

    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to assign tasks.' });
    }

    // 2. Get all data from the request, including the new 'assistedBy' array
    const { title, description, assignedTo, deadline, attachments, assistedBy } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Task title and a main assigned employee are required.' });
    }

    // 3. Handle file attachments (if any)
    let uploadedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const uploadResponse = await cloudinary.v2.uploader.upload(file.url, {
          resource_type: "auto",
          folder: "task_attachments"
        });
        uploadedAttachments.push({
          url: uploadResponse.secure_url,
          filename: file.filename,
          uploadedBy: pmUser._id
        });
      }
    }

    // 4. Create the new task with all data, including assistants
    const newTask = new Task({
      title,
      description,
      assignedTo,
      assignedBy: pmUser._id,
      deadline: deadline || null,
      attachments: uploadedAttachments,
      assistedBy: assistedBy || [], // Add the assistants array
    });
    await newTask.save();

    // 5. Respond to the frontend immediately with the fully populated task
    const populatedTask = await Task.findById(newTask._id)
        .populate('assignedTo', 'name avatar')
        .populate('assistedBy', 'name avatar') // Populate assistants' info
        .populate('attachments.uploadedBy', 'name');
        
    res.status(201).json({ 
        success: true, 
        message: `Task assigned successfully.`, 
        data: populatedTask 
    });

    // 6. Create notifications for everyone involved (main user + assistants)
    const allInvolvedIds = [assignedTo, ...(assistedBy || [])];
    const uniqueInvolvedIds = [...new Set(allInvolvedIds)]; // Prevents duplicate notifications

    const notifications = uniqueInvolvedIds.map(userId => ({
        recipient: userId,
        author: pmUser.name,
        content: `You have been added to a new task: "${title}"`,
        link: '/dashboard'
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}