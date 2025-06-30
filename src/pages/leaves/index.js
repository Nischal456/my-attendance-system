import Link from 'next/link';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import LeaveBalance from '../../../models/LeaveBalance';
import LeaveRequest from '../../../models/LeaveRequest';
import dbConnect from '../../../lib/dbConnect';
import { FilePlus, FileText, ArrowLeft } from 'react-feather';

export default function MyLeaveHub({ balance, takenLeave }) {
  const sickLeaveTaken = takenLeave.sick;
  const homeLeaveTaken = takenLeave.home;

  const sickLeaveRemaining = balance.sickLeaveAvailable - sickLeaveTaken;
  const homeLeaveRemaining = balance.homeLeaveAvailable - homeLeaveTaken;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Leave Portal</h1>
          <Link href="/dashboard" legacyBehavior>
            <a className="text-sm text-[#2ac759] hover:text-green-800 flex items-center gap-1">
              <ArrowLeft size={16} />
              Back to Dashboard
            </a>
          </Link>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Leave Balance for {new Date().getFullYear()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700">Sick Leave</h3>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-2xl font-bold text-blue-600">{balance.sickLeaveAvailable}</p><p className="text-xs text-gray-500">Available</p></div>
                  <div><p className="text-2xl font-bold text-orange-600">{sickLeaveTaken}</p><p className="text-xs text-gray-500">Taken</p></div>
                  <div><p className="text-2xl font-bold text-green-600">{sickLeaveRemaining}</p><p className="text-xs text-gray-500">Remaining</p></div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700">Home Leave</h3>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-2xl font-bold text-blue-600">{balance.homeLeaveAvailable}</p><p className="text-xs text-gray-500">Available</p></div>
                  <div><p className="text-2xl font-bold text-orange-600">{homeLeaveTaken}</p><p className="text-xs text-gray-500">Taken</p></div>
                  <div><p className="text-2xl font-bold text-green-600">{homeLeaveRemaining}</p><p className="text-xs text-gray-500">Remaining</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/leaves/apply" legacyBehavior>
              <a className="bg-[#2ac759] hover:bg-green-800 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105">
                <FilePlus size={20} />
                <span>Apply for Leave</span>
              </a>
            </Link>
            <Link href="/leaves/report" legacyBehavior>
              <a className="bg-white hover:bg-gray-50 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md border flex items-center justify-center gap-2 transition-transform hover:scale-105">
                <FileText size={20} />
                <span>View Leave Report</span>
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: '/login', permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return { redirect: { destination: '/login', permanent: false } };

        let leaveBalance = await LeaveBalance.findOne({ user: user._id, year: new Date().getFullYear() });
        if (!leaveBalance) {
            leaveBalance = await LeaveBalance.create({ user: user._id });
        }

        const approvedRequests = await LeaveRequest.find({ user: user._id, status: 'Approved' });
        
        let sickLeaveTaken = 0;
        let homeLeaveTaken = 0;

        approvedRequests.forEach(req => {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            if(req.leaveType === 'Sick Leave') sickLeaveTaken += duration;
            else if (req.leaveType === 'Home Leave') homeLeaveTaken += duration;
        });
        
        return {
            props: {
                balance: JSON.parse(JSON.stringify(leaveBalance)),
                takenLeave: { sick: sickLeaveTaken, home: homeLeaveTaken }
            },
        };
    } catch (error) {
        console.error("Leave Hub Error:", error);
        return { redirect: { destination: '/dashboard', permanent: false } };
    }
}