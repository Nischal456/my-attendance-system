import dbConnect from '../../../../lib/dbConnect';
import Project from '../../../../models/Project';
import User from '../../../../models/User'; // Ensure User model is loaded for population
import Notification from '../../../../models/Notification';
import jwt from 'jsonwebtoken';
import { sendPushNotification } from '../../../../lib/webPush';

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
        const { content, priority } = req.body;
        const project = await Project.findByIdAndUpdate(
            id, 
            { $push: { tasks: { content, priority: priority || 'Medium', createdBy: currentUserId } } }, 
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
        
        // 2. SET REMINDER (Creates Notification & Push)
        else if (action === 'setReminder') {
            try {
                const user = await User.findById(currentUserId);
                const userName = user ? user.name : 'System';

                const newNotif = await Notification.create({
                    recipient: currentUserId,
                    author: 'Canvas Reminder',
                    content: `⏰ Reminder: ${reminderNote || 'Check Project'}`,
                    link: `/projects/${id}`,
                    isRead: false,
                    remindAt: reminderDate ? new Date(reminderDate) : new Date(),
                    createdAt: new Date()
                });

                // Send Web Push Notification
                if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                    const payload = JSON.stringify({
                        title: '⏰ Canvas Reminder Set',
                        body: `Reminder: ${reminderNote || 'Check Project'}`,
                        url: `/projects/${id}`
                    });
                    
                    for (let sub of user.pushSubscriptions) {
                        try {
                            await sendPushNotification(sub, payload);
                        } catch (err) {
                            console.error('Failed to send push notification:', err);
                        }
                    }
                }
            } catch (e) {
                console.error("Set Reminder Notification Error:", e);
                return res.status(500).json({ success: false, message: 'Failed to set reminder' });
            }
            return res.status(200).json({ success: true, message: 'Reminder set successfully' });
        }

        // 3. PIN TASK (Leader or Assigned Team Members)
        else if (action === 'togglePinTask') {
            const project = await Project.findById(id);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const isLeader = project.leader.toString() === currentUserId;
            const isAssigned = (project.assignedTo || []).some(uId => uId.toString() === currentUserId);
            
            if (!isLeader && !isAssigned) {
                return res.status(403).json({ message: 'Only project team members can pin tasks.' });
            }
            
            const task = project.tasks.id(taskId);
            if (task) {
                task.isPinned = !task.isPinned;
                await project.save();
                return res.status(200).json({ success: true, data: project });
            }
        }

        // 3b. PIN COMMENT / MESSAGE (Leader or Assigned Team Members)
        else if (action === 'togglePinComment') {
            const { commentId } = req.body;
            const project = await Project.findById(id);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const isLeader = project.leader.toString() === currentUserId;
            const isAssigned = (project.assignedTo || []).some(uId => uId.toString() === currentUserId);
            
            if (!isLeader && !isAssigned) {
                return res.status(403).json({ message: 'Only project team members can pin discussion messages.' });
            }
            
            const comment = project.comments.id(commentId);
            if (comment) {
                comment.isPinned = !comment.isPinned;
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

             // Notify the new user
             try {
                const leaderUser = await User.findById(currentUserId);
                const leaderName = leaderUser ? leaderUser.name : 'The project leader';
                await Notification.create({
                    recipient: userIdToAdd,
                    author: leaderName,
                    content: `added you to this canvas: ${project.title}`,
                    link: `/projects/${id}`,
                    isRead: false
                });

                const member = await User.findById(userIdToAdd);
                if (member && member.pushSubscriptions) {
                    const payload = JSON.stringify({
                        title: 'Added to Canvas',
                        body: `${leaderName} added you to ${project.title}`,
                        url: `/projects/${id}`
                    });
                    for (let sub of member.pushSubscriptions) {
                        try { await sendPushNotification(sub, payload); } catch (err) {}
                    }
                }
             } catch (e) {
                console.error("Assign User Notification Error:", e);
             }
        }

        // 5. UPDATE STATUS
        else if (action === 'updateStatus') {
            updateQuery = { status: status }; 
        }

        // 6. ADD COMMENT
        else if (action === 'addComment') {
            updateQuery = { $push: { comments: { content: comment, author: currentUserId } } };

            // Notify all participants
            try {
                const project = await Project.findById(id);
                const commenter = await User.findById(currentUserId);
                const commenterName = commenter ? commenter.name : 'A team member';
                
                // Get all users to notify (assignedTo + leader)
                const participants = new Set(project.assignedTo.map(pId => pId.toString()));
                participants.add(project.leader.toString());
                participants.delete(currentUserId); // Don't notify the commenter

                for (let memberId of Array.from(participants)) {
                    await Notification.create({
                        recipient: memberId,
                        author: commenterName,
                        content: `added a new discussion on canvas: ${project.title}`,
                        link: `/projects/${id}`,
                        isRead: false
                    });

                    const member = await User.findById(memberId);
                    if (member && member.pushSubscriptions) {
                        const payload = JSON.stringify({
                            title: 'New Canvas Discussion',
                            body: `${commenterName} commented on ${project.title}`,
                            url: `/projects/${id}`
                        });
                        for (let sub of member.pushSubscriptions) {
                            try { await sendPushNotification(sub, payload); } catch (err) {}
                        }
                    }
                }
            } catch (e) {
                console.error("Add Comment Notification Error:", e);
            }
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