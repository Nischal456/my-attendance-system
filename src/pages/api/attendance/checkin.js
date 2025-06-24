import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Attendance from '../../../../models/Attendance';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if there's already an open attendance record (no checkout time)
    const existingEntry = await Attendance.findOne({ user: userId, checkOutTime: null });
    if (existingEntry) {
      return res.status(400).json({ message: 'You have already checked in.' });
    }

    const newAttendance = new Attendance({
      user: userId,
      checkInTime: new Date(),
    });

    await newAttendance.save();

    res.status(201).json({ success: true, data: newAttendance });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
