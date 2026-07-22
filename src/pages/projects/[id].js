import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Check, Clock, User, Calendar, Trash2, X, 
  UserPlus, AlertTriangle, MessageSquare, Send, Layers, CheckCircle, Flag,
  MapPin, Bell, Share2, Search, Filter, Sparkles
} from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// --- Premium Loader ---
const CanvasLoader = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center z-50 fixed inset-0">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-24 h-24 mb-8"
    >
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
    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Canvas</p>
  </div>
);

export default function ProjectCanvas() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newComment, setNewComment] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'pinned', 'urgent', 'completed'

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false); 
  const [reminderDate, setReminderDate] = useState(''); 
  
  // UI State
  const [activeTab, setActiveTab] = useState('board');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const commentsEndRef = useRef(null);

  // --- Fetch Data ---
  const refreshData = async () => {
    if(!id) return;
    try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (data.success) {
            setProject(data.data);
            setCurrentUserId(data.currentUserId);
        } else {
            toast.error("Project not found. Go back to your workspace.");
        }
    } catch (e) { toast.error("Connection failed"); } 
    finally { 
        setTimeout(() => setLoading(false), 600); 
    }
  };

  useEffect(() => { if(id) refreshData(); }, [id]);

  useEffect(() => {
    if (activeTab === 'discussion') commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project?.comments, activeTab]);

  // --- Actions ---

  const toggleProjectCompletion = async () => {
      const newStatus = project.status === 'Active' ? 'Completed' : 'Active';
      setProject(prev => ({ ...prev, status: newStatus }));

      if (newStatus === 'Completed') {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#059669'] });
          toast.success("Project Completed!", { icon: '🎉' });
      } else {
          toast('Project reactivated', { icon: '🚀' });
      }

      await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateStatus', status: newStatus })
      });
  };

  const saveReminder = async () => {
      setIsReminderOpen(false);
      const dateToSet = reminderDate || new Date();
      const res = await fetch(`/api/projects/${id}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ action: 'setReminder', reminderNote: project.title, reminderDate: dateToSet }) 
      });
      const data = await res.json();
      if (res.ok) {
          toast.success("Canvas reminder created & notification set!", { icon: '⏰' });
      } else {
          toast.error(data.message || "Failed to create reminder");
      }
      setReminderDate('');
  };

  const openAddUserModal = async () => {
      setIsAddUserOpen(true);
      if(availableUsers.length === 0) {
          try {
              const res = await fetch('/api/users/list');
              const data = await res.json();
              if(data.success) setAvailableUsers(data.data);
          } catch(e) { toast.error("Could not load users"); }
      }
  };

  const handleAddUser = async (userId) => {
      setIsAddUserOpen(false); 
      const toastId = toast.loading('Adding team member...');

      try {
        const res = await fetch(`/api/projects/${id}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: 'assignUser', userIdToAdd: userId }) 
        });
        const data = await res.json();
        
        if(data.success) {
            setProject(data.data);
            toast.success('Team member added to canvas!', { id: toastId });
        } else { 
            toast.error(data.message, { id: toastId }); 
        }
      } catch (e) { toast.error('Error adding user', { id: toastId }); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const tempTask = { 
        _id: Date.now().toString(), 
        content: newTask, 
        isCompleted: false, 
        isPinned: false,
        priority: newPriority,
        createdBy: { name: 'Me', avatar: '' }, 
        createdAt: new Date() 
    };
    
    setProject(prev => ({ ...prev, tasks: [...prev.tasks, tempTask] }));
    setNewTask('');
    setNewPriority('Medium');

    await fetch(`/api/projects/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempTask.content, priority: tempTask.priority })
    });
    refreshData(); 
  };

  const addComment = async (e) => {
      e.preventDefault();
      if(!newComment.trim()) return;

      const tempComment = { 
          _id: Date.now().toString(), 
          content: newComment, 
          author: { _id: currentUserId, name: 'Me', avatar: '' }, 
          isPinned: false,
          createdAt: new Date() 
      };

      setProject(prev => ({ ...prev, comments: [...(prev.comments || []), tempComment] }));
      const commentToSend = newComment;
      setNewComment('');

      await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addComment', comment: commentToSend })
      });
      refreshData();
  };

  const toggleTask = async (taskId) => {
     setProject(prev => ({ ...prev, tasks: prev.tasks.map(t => t._id === taskId ? { ...t, isCompleted: !t.isCompleted } : t) }));
     await fetch(`/api/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, action: 'toggleTask' }) });
  };

  const togglePinTask = async (e, taskId) => {
      e.stopPropagation();
      const currentTask = project.tasks.find(t => t._id === taskId);
      const isPinning = !currentTask?.isPinned;

      setProject(prev => ({ ...prev, tasks: prev.tasks.map(t => t._id === taskId ? { ...t, isPinned: !t.isPinned } : t) }));
      
      const res = await fetch(`/api/projects/${id}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ taskId, action: 'togglePinTask' }) 
      });
      const data = await res.json();
      if (!res.ok) {
          toast.error(data.message || "Failed to pin task");
          refreshData();
      } else {
          toast.success(isPinning ? "Task pinned to top!" : "Task unpinned", { icon: '📌' });
      }
  };

  const togglePinComment = async (commentId) => {
      const currentComment = (project.comments || []).find(c => c._id === commentId);
      const isPinning = !currentComment?.isPinned;

      setProject(prev => ({
          ...prev,
          comments: (prev.comments || []).map(c => c._id === commentId ? { ...c, isPinned: !c.isPinned } : c)
      }));

      const res = await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentId, action: 'togglePinComment' })
      });
      const data = await res.json();
      if (!res.ok) {
          toast.error(data.message || 'Failed to pin discussion message');
          refreshData();
      } else {
          toast.success(isPinning ? 'Discussion message pinned to top!' : 'Discussion message unpinned', { icon: '📌' });
      }
  };

  const copyCanvasLink = () => {
      if (typeof window !== 'undefined') {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Canvas URL copied to clipboard!", { icon: '🔗' });
      }
  };

  const handleDeleteProject = async () => {
      const toastId = toast.loading('Deleting project canvas...');
      try {
          const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if(res.ok) {
              toast.success('Project deleted', { id: toastId });
              router.push('/projects');
          } else { toast.error('Failed to delete project', { id: toastId }); }
      } catch (e) { toast.error('Server error', { id: toastId }); }
  };

  if (loading) return <CanvasLoader />;

  if (!project)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-md w-full text-center px-6">
          <div className="relative rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] p-8">
            <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
              <ArrowLeft size={22} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Project Not Found</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              The project canvas you're looking for doesn't exist or may have been deleted.
            </p>
            <Link
              href="/workspace"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold shadow-lg hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );

  const isLeader = project?.leader?._id === currentUserId;
  const isCompleted = project.status === 'Completed';

  // Sort Tasks: Pinned first, then by creation date
  const sortedTasks = [...(project.tasks || [])].sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1));

  // Filter Tasks
  const filteredTasks = sortedTasks.filter(task => {
      const matchesSearch = task.content.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (taskFilter === 'pinned') return task.isPinned;
      if (taskFilter === 'urgent') return task.priority === 'High' || task.priority === 'Urgent';
      if (taskFilter === 'completed') return task.isCompleted;
      return true;
  });

  const pinnedComments = (project.comments || []).filter(c => c.isPinned);

  return (
    <div className={`min-h-screen font-sans pb-20 transition-colors duration-700 ${isCompleted ? 'bg-emerald-50/50 selection:bg-emerald-200' : 'bg-white text-slate-800 selection:bg-emerald-100 selection:text-emerald-900'}`}>
      
      {/* Back Navigation Bar */}
      <div className="pt-8 px-6 sm:px-10 flex items-center justify-between">
          <Link href="/workspace" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors group">
              <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors"><ArrowLeft size={16}/></div>
              Back to Dashboard
          </Link>
          <button onClick={copyCanvasLink} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all">
              <Share2 size={14} /> Share Canvas
          </button>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 sm:px-10 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between transition-all">
        <div className="w-full sm:w-auto flex items-center justify-between gap-4">
            <button onClick={() => router.push('/projects')} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 text-sm font-bold">
                <ArrowLeft size={18}/> <span className="hidden sm:inline">Gallery</span>
            </button>
            
            {/* Mobile Tab Switch */}
            <div className="flex sm:hidden bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('board')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'board' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Board</button>
                <button onClick={() => setActiveTab('discussion')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'discussion' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Chat {pinnedComments.length > 0 && `(📌 ${pinnedComments.length})`}</button>
            </div>
        </div>
        
        {/* Desktop Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('board')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Board</button>
                <button onClick={() => setActiveTab('discussion')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'discussion' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Discussion {pinnedComments.length > 0 && `(📌 ${pinnedComments.length})`}
                </button>
            </div>

            {/* Reminder Bell */}
            <button onClick={() => setIsReminderOpen(true)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors" title="Set Canvas Reminder">
                <Bell size={18}/>
            </button>

            <div className="flex items-center -space-x-3 pl-2">
                {project.leader && <div className="w-10 h-10 rounded-full border-[3px] border-white relative shadow-sm" title={`Leader: ${project.leader.name}`}><Image src={project.leader.avatar || '/default-avatar.png'} fill sizes="40px" className="object-cover rounded-full" alt="Leader"/></div>}
                {project.assignedTo?.map(u => (<div key={u._id} className="w-10 h-10 rounded-full border-[3px] border-white bg-slate-100 relative shadow-sm" title={u.name}><Image src={u.avatar || '/default-avatar.png'} fill sizes="40px" className="object-cover rounded-full" alt={u.name}/></div>))}
                
                {/* ADD USER BUTTON - ACCESSIBLE TO LEADER */}
                {isLeader && !isCompleted && (
                    <button onClick={openAddUserModal} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center ring-[3px] ring-white hover:bg-emerald-600 transition shadow-md z-10" title="Add Team Member">
                        <UserPlus size={16} strokeWidth={2.5}/>
                    </button>
                )}
            </div>
            
            {isLeader && (
                <>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button onClick={toggleProjectCompletion} className={`p-2.5 rounded-xl transition-all shadow-sm ${isCompleted ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-slate-400 hover:text-emerald-600 border border-slate-200'}`} title={isCompleted ? "Mark Active" : "Mark Complete"}>
                        {isCompleted ? <CheckCircle size={18} strokeWidth={2.5}/> : <Flag size={18}/>}
                    </button>
                    <button onClick={() => setIsDeleteConfirmOpen(true)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Delete Canvas"><Trash2 size={18}/></button>
                </>
            )}
        </div>
      </header>

      {/* Main Canvas Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        
        {/* Title Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center sm:text-left">
            <h1 className={`text-4xl sm:text-6xl font-black tracking-tighter mb-4 leading-[1.1] transition-all duration-500 ${isCompleted ? 'text-emerald-900 opacity-60 line-through decoration-emerald-500/40 decoration-4' : 'text-slate-900'}`}>
                {project.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isCompleted && <span className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg animate-pulse"><CheckCircle size={12}/> Completed</span>}
                <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50"><Calendar size={12}/> {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            {project.description && <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-2xl">{project.description}</p>}
        </motion.div>

        {activeTab === 'board' ? (
            <>
                {/* Search & Filter Toolbar */}
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter canvas..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {['all', 'pinned', 'urgent', 'completed'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setTaskFilter(filter)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all whitespace-nowrap ${taskFilter === filter ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {filter === 'pinned' ? '📌 Pinned' : filter === 'urgent' ? '⚡ Urgent' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Canvas Editor Container */}
                <div className="space-y-1 group/canvas relative max-w-3xl mx-auto">
                    <div className="hidden sm:block absolute left-4 top-2 bottom-2 w-[1.5px] bg-slate-100 opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-500" />

                    <AnimatePresence mode='popLayout'>
                        {filteredTasks.length === 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center select-none">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner relative overflow-hidden group border border-slate-100">
                                    <Layers size={32} className="text-slate-300 group-hover:text-emerald-500 transition-colors duration-500" strokeWidth={1.5}/>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                                    {searchQuery || taskFilter !== 'all' ? 'No Matching Tasks' : 'Blank Canvas'}
                                </h3>
                                <p className="text-slate-400 text-sm max-w-sm leading-relaxed font-medium">
                                    {searchQuery || taskFilter !== 'all' ? 'Try adjusting your search query or task filter pill.' : 'Start typing below and press Enter to flow on your collaborative canvas.'}
                                </p>
                            </motion.div>
                        )}

                        {filteredTasks.map((task) => (
                            <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={task._id}
                                className={`relative group px-1 sm:px-2 py-2 flex items-start gap-4 transition-all duration-200 select-none ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-text hover:bg-slate-50 rounded-xl'} ${task.isCompleted ? 'opacity-50' : ''}`}
                            >
                                {/* Left Side Checkbox */}
                                <div className="flex items-center gap-2 mt-1 z-10 bg-white group-hover:bg-transparent">
                                    <div className="hidden sm:block opacity-0 group-hover:opacity-30 cursor-grab text-slate-400">
                                        <svg width="12" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M4.5 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0-4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0-4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM9.5 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0-4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0-4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
                                    </div>
                                    
                                    <button onClick={() => !isCompleted && toggleTask(task._id)}
                                        className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-all shadow-sm ${task.isCompleted ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 group-hover:border-slate-400 bg-white group-hover:bg-transparent'}`}>
                                        {task.isCompleted && <Check size={14} strokeWidth={4} />}
                                    </button>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 pb-1 border-b border-transparent group-hover:border-slate-100/60">
                                    <p className={`text-[15px] sm:text-[17px] leading-relaxed transition-all outline-none pb-1 ${task.isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                        {task.content}
                                    </p>
                                    
                                    {/* Sub-meta */}
                                    <AnimatePresence>
                                        {(task.isPinned || task.priority !== 'Medium' || (task.createdBy && task.createdBy.name && task.createdBy.name !== 'Me')) && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 mt-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                                {task.createdBy?.name !== 'Me' && task.createdBy?.name && <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">{task.createdBy?.avatar && <Image src={task.createdBy.avatar} width={12} height={12} className="rounded-full object-cover" alt=""/>} {task.createdBy?.name}</span>}
                                                {task.isPinned && <span className="text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1 font-extrabold"><MapPin size={10} className="fill-amber-500"/> Pinned to Canvas</span>}
                                                
                                                {task.priority && task.priority !== 'Medium' && (
                                                    <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${task.priority === 'High' ? 'bg-orange-50 text-orange-600' : task.priority === 'Urgent' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                                                        {task.priority}
                                                    </span>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Pin Control - ACCESSIBLE TO ALL TEAM MEMBERS */}
                                {!isCompleted && (
                                    <div className="flex items-center gap-1 mt-1 pr-2">
                                        <button 
                                            onClick={(e) => togglePinTask(e, task._id)} 
                                            className={`p-1.5 rounded-lg transition-all ${task.isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 hover:bg-slate-100'}`}
                                            title={task.isPinned ? "Unpin Task" : "Pin Task to Top"}
                                        >
                                            <MapPin size={14} className={task.isPinned ? 'fill-amber-500' : ''}/>
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Input Block */}
                    {!isCompleted && (
                        <motion.div layout className="relative flex items-center gap-4 mt-4 px-1 sm:px-2 py-2 group">
                            <div className="flex items-center gap-2 mt-0.5 z-10 bg-white">
                                <div className="hidden sm:block w-3" />
                                <div className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] flex items-center justify-center text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                    <Plus size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                            <form onSubmit={addTask} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                                <input 
                                    type="text" 
                                    value={newTask} 
                                    onChange={(e) => setNewTask(e.target.value)} 
                                    placeholder="Type a task or note onto the canvas..." 
                                    className="w-full flex-1 text-[15px] sm:text-[17px] leading-relaxed bg-transparent outline-none placeholder:text-slate-300 text-slate-800 transition-all font-medium py-1" 
                                    autoComplete="off"
                                />
                                <div className="flex items-center gap-2 opacity-50 focus-within:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                    <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Med</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                    <button type="submit" disabled={!newTask.trim()} className="bg-slate-900 text-white p-1 rounded-md hover:bg-emerald-600 disabled:opacity-30 transition-colors hidden sm:block"><Check size={14}/></button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>
            </>
        ) : (
            /* Discussion Tab */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Pinned Messages Banner */}
                {pinnedComments.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
                            <MapPin size={14} className="fill-amber-600 text-amber-600" />
                            <span>Pinned Discussion Messages ({pinnedComments.length})</span>
                        </div>
                        <div className="space-y-2">
                            {pinnedComments.map(pComm => (
                                <div key={pComm._id} className="bg-white/90 p-3 rounded-xl border border-amber-200/50 flex items-center justify-between text-xs font-medium text-slate-700 shadow-sm">
                                    <div>
                                        <span className="font-bold text-slate-900 mr-2">{pComm.author?.name}:</span>
                                        <span>{pComm.content}</span>
                                    </div>
                                    <button onClick={() => togglePinComment(pComm._id)} className="text-amber-600 hover:text-slate-800 text-[10px] font-bold uppercase tracking-wider ml-4">Unpin</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 min-h-[400px] flex flex-col">
                    <div className="flex-1 space-y-6 mb-6">
                        {project.comments && project.comments.length > 0 ? (
                            project.comments.map(comment => (
                                <div key={comment._id} className={`flex gap-4 group/comment ${comment.author?._id === currentUserId ? 'flex-row-reverse' : ''}`}>
                                    <div className="relative w-10 h-10 flex-shrink-0"><Image src={comment.author?.avatar || '/default-avatar.png'} fill sizes="40px" className="rounded-xl object-cover" alt={comment.author?.name || 'Author'} /></div>
                                    <div className={`max-w-[80%] ${comment.author?._id === currentUserId ? 'items-end' : 'items-start'} flex flex-col`}>
                                         <div className={`relative p-4 rounded-2xl text-sm leading-relaxed ${comment.author?._id === currentUserId ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                             {comment.isPinned && (
                                                 <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 p-1 rounded-full shadow-sm" title="Pinned Message">
                                                     <MapPin size={10} className="fill-slate-900"/>
                                                 </span>
                                             )}
                                             {comment.content}
                                         </div>
                                         <div className="flex items-center gap-2 mt-1">
                                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{comment.author?.name || 'User'}, {new Date(comment.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                             {!isCompleted && (
                                                 <button 
                                                     onClick={() => togglePinComment(comment._id)}
                                                     className={`text-[10px] font-bold uppercase tracking-wider transition-opacity ${comment.isPinned ? 'text-amber-600 opacity-100' : 'text-slate-400 opacity-0 group-hover/comment:opacity-100 hover:text-slate-700'}`}
                                                 >
                                                     {comment.isPinned ? 'Unpin' : 'Pin'}
                                                 </button>
                                             )}
                                         </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                                <MessageSquare size={40} className="mb-2 opacity-50"/>
                                <p className="font-bold">No discussions yet</p>
                                <p className="text-xs text-slate-400 mt-1">Post a note or announcement for your team below.</p>
                            </div>
                        )}
                        <div ref={commentsEndRef}></div>
                    </div>
                    
                    {!isCompleted && (
                        <form onSubmit={addComment} className="relative mt-auto">
                             <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type a message or announcement..." className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium" />
                             <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"><Send size={18}/></button>
                        </form>
                    )}
                </div>
            </motion.div>
        )}
      </main>

      {/* --- ADD USER MODAL --- */}
      <AnimatePresence>
        {isAddUserOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsAddUserOpen(false)}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Add Team Member</h3>
                        <button onClick={() => setIsAddUserOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-4 bg-slate-50"><input type="text" placeholder="Search team member..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm" /></div>
                    <div className="max-h-80 overflow-y-auto p-3 space-y-1 bg-white">
                        {availableUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) && !project.assignedTo?.find(a => a._id === u._id) && u._id !== project.leader?._id).map(user => (
                            <div key={user._id} onClick={() => handleAddUser(user._id)} className="flex items-center gap-4 p-3 hover:bg-emerald-50 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-slate-100 relative overflow-hidden flex-shrink-0"><Image src={user.avatar || '/default-avatar.png'} fill sizes="40px" className="object-cover" alt={user.name}/></div>
                                <div className="flex-1"><p className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{user.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</p></div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 text-emerald-600"><Plus size={18}/></div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- REMINDER MODAL --- */}
      <AnimatePresence>
        {isReminderOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsReminderOpen(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Bell size={32}/></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Set a Reminder</h3>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                        <button onClick={() => setReminderDate(new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16))} className="py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm">Later Today (3 Hours)</button>
                        <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); setReminderDate(d.toISOString().slice(0, 16)); }} className="py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm">Tomorrow Morning</button>
                        <input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
                    </div>
                    <button onClick={saveReminder} className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-emerald-600 shadow-lg transition-all active:scale-95">Set Reminder</button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRM MODAL --- */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-white/20">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><AlertTriangle size={32}/></div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Delete Project?</h3>
                    <p className="text-slate-500 text-sm mb-8 font-medium">This is permanent. All tasks and discussions will be lost.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsDeleteConfirmOpen(false)} className="py-3.5 rounded-2xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button onClick={handleDeleteProject} className="py-3.5 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">Delete</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}