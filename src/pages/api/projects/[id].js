import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';
import User from '../../../../models/User'; // Ensure User model is loaded for population
import Notification from '../../../../models/Notification';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  const { token } = req.cookies;
  
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUserId = decoded.userId;

      // GET Project
      if (req.method === 'GET') {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: "Invalid ID" });

        const project = await Project.findById(id)
          .populate('leader', 'name avatar email')
          .populate('assignedTo', 'name avatar email role')
          .populate({ path: 'tasks.createdBy', select: 'name avatar' })
          .populate({ path: 'comments.author', select: 'name avatar' });
        
        if (!project) return res.status(404).json({ success: false, message: "Not Found" });
        return res.status(200).json({ success: true, data: project, currentUserId });
      }

      // POST: Add Task
      if (req.method === 'POST') {
        const { content } = req.body;
        const project = await Project.findByIdAndUpdate(
            id, 
            { $push: { tasks: { content, createdBy: currentUserId } } }, 
            { new: true }
        ).populate('tasks.createdBy', 'name avatar');
        
        return res.status(200).json({ success: true, data: project });
      }

      // PUT: Handle Actions
      if (req.method === 'PUT') {
        const { taskId, action, userIdToAdd, comment, status, reminderDate, reminderNote } = req.body;
        let updateQuery = {};

        // 1. PIN PROJECT (User Specific - Toggle ID in array)
        if (action === 'togglePinProject') {
            const project = await Project.findById(id);
            
            // Fix: Check if pinnedBy exists before checking includes
            const pinnedBy = project.pinnedBy || [];

            if (pinnedBy.includes(currentUserId)) {
                updateQuery = { $pull: { pinnedBy: currentUserId } };
            } else {
                updateQuery = { $addToSet: { pinnedBy: currentUserId } };
            }
        }
        
        // 2. SET REMINDER (Creates Notification)
        else if (action === 'setReminder') {
            try {
                await Notification.create({
                    recipient: currentUserId,
                    content: `Reminder: ${reminderNote || 'Check Project'}`,
                    type: 'alert',
                    link: `/projects/${id}`,
                    isRead: false,
                    remindAt: reminderDate || new Date(),
                    createdAt: new Date()
                });
            } catch (e) {
                // If Notification model fails, log it but don't crash the request
                console.log("Notification error:", e);
            }
            return res.status(200).json({ success: true, message: 'Reminder set' });
        }

        // 3. PIN TASK (Leader Only)
        else if (action === 'togglePinTask') {
            const project = await Project.findById(id);
            // Strict Leader Check
            if (project.leader.toString() !== currentUserId) {
                return res.status(403).json({ message: 'Only the project leader can pin tasks.' });
            }
            
            // Fix: Check if task exists safely
            const task = project.tasks.id(taskId);
            if (task) {
                task.isPinned = !task.isPinned;
                await project.save();
                return res.status(200).json({ success: true, data: project });
            }
        }

        // 4. ASSIGN USER (Leader Only)
        else if (action === 'assignUser') {
             const project = await Project.findById(id);
             // Strict Leader Check
             if (project.leader.toString() !== currentUserId) {
                 return res.status(403).json({ message: 'Only the project leader can assign members.' });
             }
             updateQuery = { $addToSet: { assignedTo: userIdToAdd } };
        }

        // 5. UPDATE STATUS
        else if (action === 'updateStatus') {
            updateQuery = { status: status }; 
        }

        // 6. ADD COMMENT
        else if (action === 'addComment') {
            updateQuery = { $push: { comments: { content: comment, author: currentUserId } } };
        }

        // 7. TOGGLE TASK COMPLETION
        else if (action === 'toggleTask') {
            const project = await Project.findById(id);
            // Fix: Check if task exists safely
            const task = project.tasks.id(taskId);
            if (task) {
                task.isCompleted = !task.isCompleted;
                await project.save();
                return res.status(200).json({ success: true, data: project });
            }
        }

        // Execute Standard Updates (for actions that used updateQuery)
        if (Object.keys(updateQuery).length > 0) {
            const updatedProject = await Project.findByIdAndUpdate(id, updateQuery, { new: true })
                .populate('leader', 'name avatar')
                .populate('assignedTo', 'name avatar role')
                .populate('tasks.createdBy', 'name avatar')
                .populate('comments.author', 'name avatar');
            return res.status(200).json({ success: true, data: updatedProject });
        }
      }

      // DELETE: Delete Project (Leader Only)
      if (req.method === 'DELETE') {
          const project = await Project.findById(id);
          
          if (!project) return res.status(404).json({ success: false });

          // Strict Leader Check
          if (project.leader.toString() !== currentUserId) {
              return res.status(403).json({ message: 'Only the project leader can delete this project.' });
          }

          await Project.findByIdAndDelete(id);
          return res.status(200).json({ success: true, message: 'Project deleted' });
      }

  } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
  }
}