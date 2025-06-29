import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Send, ArrowLeft } from 'react-feather';

export default function ApplyLeavePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', content: '' });
    try {
        const res = await fetch('/api/leaves/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        setMessage({ type: 'success', content: 'Success! Your leave request has been submitted.' });
        setTimeout(() => {
            router.push('/leaves');
        }, 2000);
    } catch (err) {
        setMessage({ type: 'error', content: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
            <Link href="/leaves" legacyBehavior>
                <a className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <ArrowLeft size={16} />
                    Back to Leave Portal
                </a>
            </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Leave Application Form</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                  <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select id="leaveType" name="leaveType" value={formData.leaveType} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm">
                      <option>Sick Leave</option>
                      <option>Home Leave</option>
                  </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">From Date</label>
                      <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">To Date</label>
                      <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
              </div>
              <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Leave Remarks (Reason)</label>
                  <textarea id="reason" name="reason" value={formData.reason} onChange={handleChange} required rows="5" className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/>
              </div>
              {message.content && (
                  <p className={`text-sm p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.content}</p>
              )}
              <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50 hover:bg-indigo-700 flex items-center justify-center gap-2">
                      <Send size={16} />
                      {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                  </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}