import dbConnect from './lib/dbConnect.js';
import User from './models/User.js';
import HRAuditLog from './models/HRAuditLog.js';
import LeaveRequest from './models/LeaveRequest.js';
import Attendance from './models/Attendance.js';

async function test() {
  await dbConnect();
  const allUsers = await User.find({}).select('-password -__v').populate('createdBy', 'name').populate('promotedBy', 'name').sort({ name: 1 }).lean();
  console.log("Users fetched:", allUsers.length);
  const hrAuditLogs = await HRAuditLog.find({}).populate('user', 'name avatar role').sort({ date: -1 }).lean();
  console.log("Audit Logs fetched:", hrAuditLogs.length);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
