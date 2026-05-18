import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';
import User from '../../../../models/User';
import Notification from '../../../../models/Notification';
import jwt from 'jsonwebtoken';
import { sendPushNotification } from '../../../../lib/webPush';

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

        // Calculate unread canvases
        const unreadNotifs = await Notification.find({
            recipient: userId,
            isRead: false,
            link: { $regex: '^/projects/' }
        }).select('link');
        
        const unreadCanvasIds = [...new Set(unreadNotifs.map(n => n.link.split('/').pop()))];

        return res.status(200).json({ success: true, data: projects, userId, unreadCanvasIds });
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
            
        // Dispatch notifications and pushes to all assigned members
        if (assignedTo && assignedTo.length > 0) {
            const leaderUser = await User.findById(userId);
            const leaderName = leaderUser ? leaderUser.name : 'A team leader';
            
            for (let memberId of assignedTo) {
                if (memberId.toString() === userId.toString()) continue;
                
                await Notification.create({
                    recipient: memberId,
                    author: leaderName,
                    content: `invited you to a new canvas: ${title}`,
                    link: `/projects/${project._id}`,
                    isRead: false
                });

                const member = await User.findById(memberId);
                if (member && member.pushSubscriptions) {
                    const payload = JSON.stringify({
                        title: 'New Canvas Invitation',
                        body: `${leaderName} invited you to ${title}`,
                        url: `/projects/${project._id}`
                    });
                    
                    for (let sub of member.pushSubscriptions) {
                        try {
                            await sendPushNotification(sub, payload);
                        } catch (err) {
                            console.error('Failed to send push to member:', err);
                        }
                    }
                }
            }
        }

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