import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';
import LeaveRequest from '../../../../models/LeaveRequest';
import HRAuditLog from '../../../../models/HRAuditLog';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    await dbConnect();
    try {
        const { token } = req.cookies;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hrUser = await User.findById(decoded.userId);
        if (!hrUser) return res.status(403).json({ message: 'Forbidden: Access denied.' });
        
        const allUserRoles = [hrUser.role, ...(hrUser.accessRoles || [])];
        if (!allUserRoles.some(r => ['HR', 'Superadmin'].includes(r))) {
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }

        const [allAttendance, allLeaveRequests, allUsers, hrAuditLogs] = await Promise.all([
            Attendance.find({}).populate("user", "name role avatar").sort({ checkInTime: -1 }).lean(),
            LeaveRequest.find({}).populate('user', 'name role').sort({ createdAt: -1 }).lean(),
            User.find({}).select('-password -__v').populate('createdBy', 'name').populate('promotedBy', 'name').sort({ name: 1 }).lean(),
            HRAuditLog.find({}).populate('user', 'name avatar role').sort({ date: -1 }).lean()
        ]);
        
        const unreadAuditCount = hrAuditLogs.filter(log => !log.isRead).length;
        
        const now = new Date();
        const pendingLeaveRequests = allLeaveRequests.filter(l => l.status === 'Pending');
        const concludedLeaveRequests = allLeaveRequests.filter(l => l.status === 'Approved' || l.status === 'Rejected').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const approvedLeaves = allLeaveRequests.filter(l => l.status === 'Approved' && new Date(l.endDate) >= now).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        res.status(200).json({
            initialAttendance: allAttendance,
            initialLeaveRequests: pendingLeaveRequests,
            initialConcludedLeaves: concludedLeaveRequests,
            initialApprovedLeaves: approvedLeaves,
            allUsers: allUsers,
            auditLogs: hrAuditLogs,
            unreadAuditCount: unreadAuditCount
        });

    } catch (error) {
        console.error("HR Dashboard Data API Error:", error);
        res.status(500).json({ message: 'An error occurred fetching dashboard data.' });
    }
}