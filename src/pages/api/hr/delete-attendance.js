// pages/api/hr/delete-attendance.js
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import Attendance from '../../../../models/Attendance';

export default async function handler(req, res) {
  // This endpoint only accepts DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // 1. Authenticate and Authorize the HR user
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hrUser = await User.findById(decoded.userId);

    if (!hrUser || hrUser.role !== 'HR') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
    }

    // 2. Get the ID of the attendance record to delete from the request body
    const { attendanceId } = req.body;
    if (!attendanceId) {
      return res.status(400).json({ message: 'Attendance ID is required.' });
    }

    // 3. Find the record by its ID and delete it
    const deletedRecord = await Attendance.findByIdAndDelete(attendanceId);

    if (!deletedRecord) {
      return res.status(404).json({ message: 'Attendance record not found or already deleted.' });
    }

    // 4. Send a success response
    res.status(200).json({ success: true, message: 'Attendance record deleted successfully.' });

  } catch (error) {
    console.error("Error deleting attendance record:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}