import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Notification from '../../../../models/Notification';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const author = await User.findById(decoded.userId).lean();
        if (!author) return res.status(404).json({ message: 'User not found.' });

        const { taskId, content } = req.body;
        if (!taskId || !content) {
            return res.status(400).json({ message: 'Task ID and comment content are required.' });
        }

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found.' });
        
        const newComment = { author: author._id, content: content };

        task.comments.push(newComment);
        await task.save();

        const recipientId = author._id.equals(task.assignedTo) ? task.assignedBy : task.assignedTo;
        if (!author._id.equals(recipientId)) {
            await Notification.create({
                recipient: recipientId,
                author: `${author.name} (${author.role})`,
                content: `commented on your task: "${task.title}"`,
                link: `/dashboard?taskId=${task._id}`
            });
        }
        
        const addedComment = task.comments[task.comments.length - 1];
        const responseData = {
            ...addedComment.toObject(),
            author: { _id: author._id, name: author.name, avatar: author.avatar }
        };

        res.status(201).json({ success: true, message: 'Comment added!', data: responseData });

    } catch (error) {
        console.error("ADD COMMENT API ERROR:", error);
        res.status(500).json({ message: 'Server error adding comment.' });
    }
}