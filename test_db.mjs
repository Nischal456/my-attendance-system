import { config } from 'dotenv';
config({ path: '.env.local' });
import dbConnect from './lib/dbConnect.js';
import User from './models/User.js';
import LeaveRequest from './models/LeaveRequest.js';
import Attendance from './models/Attendance.js';
import HRAuditLog from './models/HRAuditLog.js';

async function test() {
  await dbConnect();
  try {
    const [allAttendance, allLeaveRequests, allUsers, hrAuditLogs] = await Promise.all([
        Attendance.find({}).populate("user", "name role avatar").sort({ checkInTime: -1 }).lean(), 
        LeaveRequest.find({}).populate('user', 'name role avatar').populate('updatedBy', 'name avatar').sort({ createdAt: -1 }).lean(), 
        User.find({}).select('-password -__v').populate('createdBy', 'name').populate('promotedBy', 'name').sort({ name: 1 }).lean(),
        HRAuditLog.find({}).populate('user', 'name avatar role').sort({ date: -1 }).lean()
    ]);
    console.log("Success! Users:", allUsers.length);
    console.log(JSON.stringify(allUsers).substring(0, 50));
  } catch(e) {
    console.error("ERROR:", e);
  }
  process.exit(0);
}
test();
