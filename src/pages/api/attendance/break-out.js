import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect'; // Adjust path if needed
import Attendance from '../../../../models/Attendance'; // Adjust path

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  await dbConnect();
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const activeEntry = await Attendance.findOne({ user: decoded.userId, checkOutTime: null });

    if (!activeEntry) {
      return res.status(400).json({ message: 'You are not checked in.' });
    }
    
    const openBreak = activeEntry.breaks.find(b => !b.breakOutTime);
    if (!openBreak) {
      return res.status(400).json({ message: 'You are not on a break.' });
    }

    openBreak.breakOutTime = new Date();
    await activeEntry.save();
    
    res.status(200).json({ success: true, data: activeEntry });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
