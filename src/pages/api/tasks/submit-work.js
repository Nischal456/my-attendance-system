import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow up to 10mb for file uploads
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userSubmitting = await User.findById(decoded.userId);

    // --- UPDATED: Receive and validate submissionDescription ---
    const { taskId, attachments, submissionDescription } = req.body;
    if (!taskId || !submissionDescription) {
      return res.status(400).json({ message: 'Task ID and a submission description are required.' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (task.assignedTo.toString() !== userSubmitting._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only submit work for your own tasks.' });
    }

    let uploadedAttachments = [];
    if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const uploadResponse = await cloudinary.v2.uploader.upload(file.url, {
            resource_type: "auto",
            folder: "task_submissions"
          });
          uploadedAttachments.push({
            url: uploadResponse.secure_url,
            filename: file.filename,
            uploadedBy: userSubmitting._id
          });
        }
    }

    task.attachments.push(...uploadedAttachments);
    task.status = 'Completed';
    task.completedAt = new Date();
    // --- NEW: Save the description ---
    task.submissionDescription = submissionDescription; 
    
    await task.save();

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('attachments.uploadedBy', 'name');
    res.status(200).json({ success: true, message: 'Work submitted successfully!', data: populatedTask });
  } catch (error) {
    console.error("Error submitting work:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}