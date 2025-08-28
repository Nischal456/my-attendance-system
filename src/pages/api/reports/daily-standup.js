import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';
import jwt from 'jsonwebtoken';
import { startOfDay, endOfDay } from 'date-fns';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        jwt.verify(token, process.env.JWT_SECRET);

        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        // ✅ FIX: Using a more powerful and correct aggregation query
        const reports = await Attendance.aggregate([
            // Stage 1: Find today's checkout records
            {
                $match: {
                    checkOutTime: { $gte: todayStart, $lte: todayEnd },
                    description: { $exists: true, $ne: "" }
                }
            },
            // Stage 2: Join with the Users collection
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            // Stage 3: Deconstruct the userDetails array
            { $unwind: "$userDetails" },
            // Stage 4: Filter for only 'Staff' and 'Intern' roles
            {
                $match: {
                    "userDetails.role": { $in: ['Staff', 'Intern'] }
                }
            },
            // Stage 5: Sort by most recent checkout
            { $sort: { checkOutTime: -1 } },
            // Stage 6: Select the final fields
            {
                $project: {
                    _id: 1,
                    checkOutTime: 1,
                    description: 1,
                    user: {
                        _id: "$userDetails._id",
                        name: "$userDetails.name",
                        avatar: "$userDetails.avatar",
                        role: "$userDetails.role"
                    }
                }
            }
        ]);

        res.status(200).json({ success: true, reports });

    } catch (error) {
        console.error("Daily Standup API Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}