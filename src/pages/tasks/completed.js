import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, CheckCircle, MessageSquare, Paperclip, Users } from 'react-feather';

// Helper Function
const formatEnglishDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

// Sub-Component to display a single completed task
const CompletedTaskCard = ({ task }) => {
    const userAttachments = task.attachments?.filter(att => att.uploadedBy?._id?.toString() === task.assignedTo?._id?.toString()) || [];
    return (
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h4 className="font-semibold text-slate-700">{task.title}</h4>
                    <p className="text-sm text-green-600 font-medium mt-1">Completed on {formatEnglishDate(task.completedAt)}</p>
                </div>
                <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Completed</span>
            </div>

            {/* --- NEW: Team Display Section --- */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/80">
                <Users size={14} className="text-slate-400 flex-shrink-0" />
                <div className="flex items-center -space-x-2">
                    <Image src={task.assignedTo?.avatar || '/default-avatar.png'} width={24} height={24} className="rounded-full object-cover aspect-square border-2 border-white ring-1 ring-indigo-500" alt={task.assignedTo?.name || ''} title={`Lead: ${task.assignedTo?.name}`} />
                    {task.assistedBy?.map(assistant => (
                        <Image key={assistant._id} src={assistant.avatar || '/default-avatar.png'} width={24} height={24} className="rounded-full object-cover aspect-square border-2 border-white" alt={assistant.name} title={`Assist: ${assistant.name}`} />
                    ))}
                </div>
            </div>

            {task.submissionDescription && (
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <div className="flex items-start gap-2.5 mt-2">
                        <MessageSquare size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.submissionDescription}</p>
                    </div>
                </div>
            )}
            {userAttachments.length > 0 &&
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <h4 className="text-xs font-bold text-green-700 mb-2">Your Submissions:</h4>
                    <div className="flex flex-wrap gap-2">
                        {userAttachments.map(file => (
                            <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md hover:bg-green-200 flex items-center gap-1.5">
                                <CheckCircle size={12} />
                                {file.filename}
                            </a>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
};

export default function CompletedTasksPage({ user, completedTasks }) {
    const router = useRouter();
    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/dashboard" className="text-lg font-bold text-slate-700 hover:text-green-600">
                            &larr; Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-2">
                            <Image src={user.avatar} width={36} height={36} className="rounded-full object-cover" alt="User Avatar" />
                            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Sign Out"><LogOut size={20} /></button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                <h1 className="text-3xl font-bold text-slate-800">Completed Task History</h1>
                <p className="mt-1 text-slate-500">A full record of all your completed work.</p>
                <div className="mt-8 space-y-4">
                    {completedTasks.length > 0 ? (
                        completedTasks.map(task => <CompletedTaskCard key={task._id} task={task} />)
                    ) : (
                        <p className="text-center text-slate-500 py-10">You have not completed any tasks yet.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

export async function getServerSideProps(context) {
    const jwt = require('jsonwebtoken');
    const dbConnect = require('../../../lib/dbConnect').default;
    const User = require('../../../models/User').default;
    const Task = require('../../../models/Task').default;

    await dbConnect();
    const { token } = context.req.cookies;
    if (!token) return { redirect: { destination: '/login', permanent: false } };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password').lean();
        if (!user) { return { redirect: { destination: '/login', permanent: false } }; }

        const completedTasks = await Task.find({ $or: [{ assignedTo: user._id }, { assistedBy: user._id }], status: 'Completed' })
            .populate('assignedTo', 'name avatar')
            .populate('assistedBy', 'name avatar') // This is the crucial update
            .populate('attachments.uploadedBy', 'name')
            .sort({ completedAt: -1 })
            .lean();

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                completedTasks: JSON.parse(JSON.stringify(completedTasks)),
            },
        };
    } catch (error) {
        context.res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        return { redirect: { destination: '/login', permanent: false } };
    }
}