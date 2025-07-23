import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';

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
        if (!hrUser || hrUser.role !== 'HR') {
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }

        const year = parseInt(req.query.year);
        const month = parseInt(req.query.month);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const workHours = await Attendance.aggregate([
            { $match: { checkInTime: { $gte: startDate, $lte: endDate }, duration: { $ne: null } } },
            { $group: { _id: "$user", totalSeconds: { $sum: "$duration" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userDetails" } },
            { $unwind: "$userDetails" },
            { $match: { "userDetails.role": { $in: ['Staff', 'Intern', 'Manager', 'Project Manager'] } } },
            { $project: { _id: 0, userId: "$userDetails._id", name: "$userDetails.name", totalHours: { $divide: ["$totalSeconds", 3600] } } },
            { $sort: { name: 1 } }
        ]);

        res.status(200).json({ success: true, data: workHours });

    } catch (error) {
        console.error("Work Hours API Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}