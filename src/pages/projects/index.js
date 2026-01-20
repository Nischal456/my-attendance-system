import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, Layers, Check, Search, X, Bookmark, ArrowLeft } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';

// --- Premium Canvas Loader ---
const GalleryLoader = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center z-50">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-24 h-24 mb-8"
        >
            {/* Abstract Layers Animation */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-slate-100 rounded-3xl"
            />
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-4 border-emerald-50 rounded-2xl"
            />
            <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                <Layers size={32} strokeWidth={1.5} />
            </div>

            {/* Pulse Dot */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-200"
            />
        </motion.div>

        <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full bg-emerald-500"
            />
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Gallery</p>
    </div>
);

export default function ProjectsGallery() {
    const [projects, setProjects] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true); // Loading state

    // Creation State
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const router = useRouter();

    // Load Projects & User ID
    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setProjects(data.data);
                    setCurrentUserId(data.userId);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not load projects");
        } finally {
            // Smooth transition out of loader
            setTimeout(() => setLoading(false), 800);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    // --- Toggle Pin ---
    const togglePin = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId) return;

        setProjects(prev => prev.map(p => {
            if (p._id === projectId) {
                const isPinned = p.pinnedBy?.includes(currentUserId);
                const newPinnedBy = isPinned
                    ? p.pinnedBy.filter(id => id !== currentUserId)
                    : [...(p.pinnedBy || []), currentUserId];
                return { ...p, pinnedBy: newPinnedBy };
            }
            return p;
        }));

        await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'togglePinProject' })
        });
        toast.success("Updated");
    };

    // Sort: Pinned first
    const sortedProjects = [...projects].sort((a, b) => {
        const aPinned = a.pinnedBy?.includes(currentUserId) ? 1 : 0;
        const bPinned = b.pinnedBy?.includes(currentUserId) ? 1 : 0;
        return bPinned - aPinned;
    });

    // Modal Functions
    const openModal = async () => {
        setIsModalOpen(true);
        if (availableUsers.length === 0) {
            setLoadingUsers(true);
            try {
                const res = await fetch('/api/users/list');
                if (res.ok) { const d = await res.json(); setAvailableUsers(d.data); }
            } catch (e) { } finally { setLoadingUsers(false); }
        }
    }
    const toggleUserSelection = (id) => {
        if (selectedUsers.includes(id)) setSelectedUsers(prev => prev.filter(u => u !== id));
        else setSelectedUsers(prev => [...prev, id]);
    }
    const createProject = async () => {
        if (!newTitle.trim()) return toast.error("Title required");
        setIsCreating(true);
        try {
            const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, description: newDescription, assignedTo: selectedUsers }) });
            const d = await res.json();
            if (d.success) router.push(`/projects/${d.data._id}`);
            else { toast.error(d.message); setIsCreating(false); }
        } catch (e) { setIsCreating(false); }
    }

    if (loading) return <GalleryLoader />;

    return (
        <div className="min-h-screen bg-white text-slate-800 p-6 sm:p-12 font-sans selection:bg-emerald-100 selection:text-emerald-900">

            {/* Back Button */}
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors group">
                    <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors"><ArrowLeft size={16} /></div>
                    Back to Dashboard
                </Link>
            </div>

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 sm:mb-16 gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 text-[#4caf50]"
                    >
                        Projects.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-slate-400 font-medium text-lg"
                    >
                        Your creative command center.
                    </motion.p>
                </div>
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    onClick={openModal}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-xl hover:shadow-emerald-200/50 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} /> New Project
                </motion.button>
            </header>

            {/* Grid */}
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>
                    {sortedProjects.map((project) => {
                        const isPinned = project.pinnedBy?.includes(currentUserId);

                        return (
                            <motion.div
                                layout
                                key={project._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                className="relative"
                            >
                                <Link href={`/projects/${project._id}`} className="block h-full">
                                    <div
                                        className={`group h-64 bg-white rounded-[2rem] p-6 relative overflow-hidden border ${isPinned ? 'border-emerald-400 shadow-emerald-100/50 ring-2 ring-emerald-500/20' : 'border-slate-200'} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-100 group-hover:from-emerald-50/30 group-hover:to-white transition-colors duration-500"></div>

                                        {/* PIN BUTTON - Stopped propagation to prevent Link click */}
                                        <button
                                            onClick={(e) => togglePin(e, project._id)}
                                            className={`absolute top-6 right-6 z-20 p-2 rounded-full transition-all ${isPinned ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-300 hover:text-slate-900 hover:bg-slate-100 border border-slate-100'}`}
                                        >
                                            <div className="group relative inline-flex items-center gap-1">
                                                <Bookmark
                                                    size={16}
                                                    className={`fill-current transition-all duration-200 
      ${isPinned ? 'text-white' : 'text-gray-400'}
      group-hover:scale-110`}
                                                />

                                                <span
                                                    className="text-xs text-gray-300 opacity-0 translate-x-[-4px]
      transition-all duration-200 ease-out
      group-hover:opacity-100 group-hover:translate-x-0"
                                                >
                                                    Pin
                                                </span>
                                            </div>

                                        </button>

                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-50 flex items-center justify-center text-emerald-600 mb-4">
                                                        <Layers size={20} />
                                                    </div>
                                                </div>
                                                <h2 className="text-xl font-extrabold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">{project.title}</h2>
                                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{project.description || 'No description provided.'}</p>
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative shadow-sm">
                                                        <Image src={project.leader?.avatar || '/default-avatar.png'} fill sizes="32px" className="object-cover" alt="Leader" />
                                                    </div>
                                                    {project.assignedTo?.slice(0, 3).map(u => (
                                                        <div key={u._id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative shadow-sm">
                                                            <Image src={u.avatar || '/default-avatar.png'} fill sizes="32px" className="object-cover" alt={u.name} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.div>

            {/* --- CREATE PROJECT MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px] border border-white/20" onClick={e => e.stopPropagation()}>

                            {/* Left Side: Inputs */}
                            <div className="flex-1 p-8 md:p-12 flex flex-col overflow-y-auto order-2 md:order-1">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-slate-900">New Project</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full md:hidden"><X size={24} /></button>
                                </div>
                                <div className="space-y-6 flex-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                                        <input autoFocus type="text" placeholder="Project Name" className="w-full text-3xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-emerald-500 outline-none placeholder:text-slate-300 text-slate-900 py-2 transition-colors" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                                        <textarea placeholder="Brief description..." className="w-full h-32 bg-slate-50 rounded-2xl p-4 text-sm font-medium border-none outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                                    </div>
                                </div>
                                <button onClick={createProject} disabled={isCreating} className="mt-8 w-full py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-emerald-600 shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2">
                                    {isCreating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>

                            {/* Right Side: User Selection */}
                            <div className="w-full md:w-80 bg-slate-50 p-6 md:p-8 border-b md:border-b-0 md:border-l border-slate-100 flex flex-col order-1 md:order-2 h-1/3 md:h-auto">
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-3"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Team</label><span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200 shadow-sm">{selectedUsers.length}</span></div>
                                    <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-500 transition-all shadow-sm" value={userSearch} onChange={e => setUserSearch(e.target.value)} /></div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {loadingUsers ? <div className="text-center py-4 text-slate-400 text-xs">Loading...</div> : availableUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(user => {
                                        const isSelected = selectedUsers.includes(user._id);
                                        return (
                                            <div key={user._id} onClick={() => toggleUserSelection(user._id)} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                                <div className="w-8 h-8 rounded-full bg-slate-200 relative overflow-hidden flex-shrink-0"><Image src={user.avatar || '/default-avatar.png'} fill sizes="32px" className="object-cover" alt={user.name} /></div>
                                                <div className="flex-1 min-w-0"><p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{user.name}</p><p className="text-[10px] text-slate-400 truncate">{user.role}</p></div>
                                                {isSelected && <div className="text-emerald-600 bg-emerald-100 p-1 rounded-full"><Check size={12} strokeWidth={4} /></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}