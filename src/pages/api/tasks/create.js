import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Notification from '../../../../models/Notification';
import cloudinary from 'cloudinary';

cloudinary.v2.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pmUser = await User.findById(decoded.userId);
    if (!pmUser || (pmUser.role !== 'Project Manager' && pmUser.role !== 'HR')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, description, assignedTo, deadline, attachments } = req.body;
    if (!title || !assignedTo) return res.status(400).json({ message: 'Title and assigned user are required.' });

    let uploadedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const uploadResponse = await cloudinary.v2.uploader.upload(file.url, { resource_type: "auto", folder: "task_attachments" });
        uploadedAttachments.push({ url: uploadResponse.secure_url, filename: file.filename, uploadedBy: pmUser._id });
      }
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) return res.status(404).json({ message: 'Assigned user not found.' });

    const newTask = new Task({ title, description, assignedTo, assignedBy: pmUser._id, deadline: deadline || null, attachments: uploadedAttachments });
    await newTask.save();
    
    const populatedTask = await Task.findById(newTask._id).populate('assignedTo', 'name avatar').populate('attachments.uploadedBy', 'name');
    res.status(201).json({ success: true, message: `Task assigned to ${assignedUser.name}.`, data: populatedTask });
    
    await Notification.create({ recipient: assignedTo, author: pmUser.name, content: `You have a new task: "${title}"`, link: '/dashboard' });

  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: 'Server error creating task' });
  }
}