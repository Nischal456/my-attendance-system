import Link from 'next/link';
import jwt from 'jsonwebtoken';
import LeaveRequest from '../../../models/LeaveRequest';
import dbConnect from '../../../lib/dbConnect';
import { ArrowLeft } from 'react-feather';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-CA');

const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

export default function LeaveReportPage({ leaveHistory }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <Link href="/leaves" legacyBehavior>
                <a className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4">
                    <ArrowLeft size={16} />
                    Back to Leave Portal
                </a>
            </Link>
          <h1 className="text-2xl font-bold text-gray-800">Your Leave History</h1>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HR Comments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveHistory.map(req => (
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.leaveType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.startDate)} to {formatDate(req.endDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate" title={req.reason}>{req.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500 italic">{req.hrComments || '-'}</td>
                    </tr>
                  ))}
                  {leaveHistory.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">You have not submitted any leave requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
        const leaveHistory = await LeaveRequest.find({ user: decoded.userId }).sort({ createdAt: -1 });
        
        return {
            props: {
                leaveHistory: JSON.parse(JSON.stringify(leaveHistory)),
            },
        };
    } catch (error) {
        console.error("Leave Report Error:", error);
        return { redirect: { destination: '/dashboard', permanent: false } };
    }
}