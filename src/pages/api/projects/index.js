import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';
import User from '../../../../models/User'; // Imported User model to ensure population works
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();
  const { token } = req.cookies;
  
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // GET: Fetch all projects
      if (req.method === 'GET') {
        const projects = await Project.find({
            $or: [{ leader: userId }, { assignedTo: userId }]
        })
        .populate('leader', 'name avatar')
        .populate('assignedTo', 'name avatar')
        .sort({ updatedAt: -1 });

        // ✅ Return userId so frontend can sort pinned projects correctly
        return res.status(200).json({ success: true, data: projects, userId });
      } 
      
      // POST: Create Project
      else if (req.method === 'POST') {
        const { title, description, assignedTo } = req.body;
        
        const project = await Project.create({
            title,
            description,
            leader: userId,
            assignedTo: assignedTo || [] // Now accepts users immediately
        });

        // Populate immediately so the frontend gets the full data
        const populatedProject = await Project.findById(project._id)
            .populate('leader', 'name avatar')
            .populate('assignedTo', 'name avatar');

        return res.status(201).json({ success: true, data: populatedProject });
      }
      
      else {
          return res.status(405).json({ message: 'Method Not Allowed' });
      }

  } catch (error) {
      console.error("Project API Error:", error);
      return res.status(500).json({ success: false, message: error.message });
  }
}