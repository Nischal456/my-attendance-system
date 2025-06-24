import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect'; // Adjust path
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
    const entry = await Attendance.findOne({ user: decoded.userId, checkOutTime: null });

    if (!entry) {
      return res.status(404).json({ message: 'No active check-in found.' });
    }
    
    // Ensure user is not on an open break before checking out
    const hasOpenBreak = entry.breaks.some(b => !b.breakOutTime);
    if (hasOpenBreak) {
      return res.status(400).json({ message: 'You must end your break before checking out.' });
    }

    entry.checkOutTime = new Date();
    entry.description = req.body.description;

    // --- NEW LOGIC TO CALCULATE NET DURATION ---
    let totalBreakMillis = 0;
    entry.breaks.forEach(b => {
      if (b.breakInTime && b.breakOutTime) {
        totalBreakMillis += (new Date(b.breakOutTime) - new Date(b.breakInTime));
      }
    });

    entry.totalBreakDuration = Math.round(totalBreakMillis / 1000); // Save total break in seconds

    const grossMillis = entry.checkOutTime - entry.checkInTime;
    const netMillis = grossMillis - totalBreakMillis;

    entry.duration = Math.round(netMillis / 1000); // Save NET work duration in seconds

    await entry.save();
    res.status(200).json({ success: true, data: entry });

  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
