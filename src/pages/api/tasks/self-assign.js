import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const selfUser = await User.findById(decoded.userId);

        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: 'Task title is required.' });

        const newTask = new Task({
            title,
            description,
            status: 'To Do',
            assignedTo: selfUser._id,
            assignedBy: selfUser._id, // User assigns to themselves
        });

        await newTask.save();
        
        const populatedTask = await Task.findById(newTask._id).populate('assignedTo', 'name avatar').populate('assignedBy', 'name').populate('assistedBy', 'name avatar');
            
        res.status(201).json({ success: true, message: 'Personal task created!', data: populatedTask });

    } catch (error) {
        res.status(500).json({ message: 'Server error creating task.' });
    }
}