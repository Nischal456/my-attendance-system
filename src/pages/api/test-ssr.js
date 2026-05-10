import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import LeaveRequest from '../../../models/LeaveRequest';
import Attendance from '../../../models/Attendance';
import HRAuditLog from '../../../models/HRAuditLog';

export default async function handler(req, res) {
  try {
    await dbConnect();
    const [allAttendance, allLeaveRequests, allUsers, hrAuditLogs] = await Promise.all([
        Attendance.find({}).populate("user", "name role avatar").sort({ checkInTime: -1 }).lean(), 
        LeaveRequest.find({}).populate('user', 'name role avatar').populate('updatedBy', 'name avatar').sort({ createdAt: -1 }).lean(), 
        User.find({}).select('-password -__v').populate('createdBy', 'name').populate('promotedBy', 'name').sort({ name: 1 }).lean(),
        HRAuditLog.find({}).populate('user', 'name avatar role').sort({ date: -1 }).lean()
    ]);
    res.status(200).json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
