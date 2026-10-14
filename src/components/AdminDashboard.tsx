import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, doc, updateDoc, deleteDoc, 
  setDoc, addDoc, serverTimestamp, getDocs, orderBy 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Shield, Crown, Users, GraduationCap, School, Search, 
  Trash2, Lock, Unlock, X, Eye, Sparkles, RefreshCw, 
  AlertCircle, CheckCircle2, MessageSquare, Layers, 
  BarChart3, ChevronRight, UserCog, Mail, KeyRound,
  FileText, ArrowRightLeft, BookOpen, Send, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  onClose: () => void;
  onImpersonateRole?: (role: 'teacher' | 'student' | null) => void;
  impersonatedRole?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onClose, 
  onImpersonateRole, 
  impersonatedRole 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'classes'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals inside Admin
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [studentFeedbacks, setStudentFeedbacks] = useState<any[]>([]);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Create class modal
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState('');

  // Add student to class
  const [studentCodeOrEmailToAdd, setStudentCodeOrEmailToAdd] = useState('');

  // In-app confirmation modal state (replaces window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmText: string;
    type?: 'danger' | 'warning' | 'primary';
    action: () => Promise<void> | void;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Fetch all users
  useEffect(() => {
    setLoading(true);
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setLoading(false);
    }, (err) => {
      console.error("Admin fetch users error:", err);
      setLoading(false);
    });

    const classesUnsub = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(list);
    }, (err) => {
      console.error("Admin fetch classes error:", err);
    });

    return () => {
      usersUnsub();
      classesUnsub();
    };
  }, []);

  // Fetch feedbacks when student is selected
  useEffect(() => {
    if (selectedStudent) {
      const q = query(
        collection(db, 'users', selectedStudent.id, 'feedbacks'),
        orderBy('timestamp', 'asc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setStudentFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Fetch feedbacks error:", err);
      });
      return () => unsub();
    } else {
      setStudentFeedbacks([]);
    }
  }, [selectedStudent]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(null), 4000);
    } else {
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  // Toggle user ban status
  const handleToggleBan = (user: any) => {
    const isCurrentlyBanned = !!user.isBanned;
    setConfirmModal({
      title: isCurrentlyBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản người dùng',
      description: isCurrentlyBanned 
        ? `Bạn có chắc chắn muốn mở khóa quyền truy cập cho tài khoản "${user.displayName || user.email}"?`
        : `Bạn có chắc chắn muốn KHÓA tài khoản "${user.displayName || user.email}"? Người dùng này sẽ tạm thời không thể đăng nhập hệ thống.`,
      confirmText: isCurrentlyBanned ? 'Mở khóa ngay' : 'Khóa tài khoản',
      type: isCurrentlyBanned ? 'primary' : 'warning',
      action: async () => {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            isBanned: !isCurrentlyBanned
          });
          showNotification(`Đã ${isCurrentlyBanned ? 'mở khóa' : 'khóa'} tài khoản thành công!`);
        } catch (err: any) {
          showNotification("Lỗi cập nhật trạng thái tài khoản: " + err.message, true);
        }
      }
    });
  };

  // Change user role
  const handleChangeRole = (user: any, newRole: 'student' | 'teacher' | 'admin') => {
    if (user.role === newRole) return;
    const isRevokingTeacher = user.role === 'teacher' && newRole === 'student';
    setConfirmModal({
      title: isRevokingTeacher ? 'Xóa quyền Giáo viên (Hạ cấp)' : 'Chuyển đổi vai trò',
      description: isRevokingTeacher
        ? `XÁC NHẬN: Bạn có chắc muốn XÓA CHỨC QUYỀN GIÁO VIÊN của "${user.displayName || user.email}" và chuyển thành tài khoản Học sinh?`
        : `Đổi vai trò của "${user.displayName || user.email}" thành ${newRole === 'teacher' ? 'GIÁO VIÊN' : newRole.toUpperCase()}?`,
      confirmText: isRevokingTeacher ? 'Xác nhận hạ cấp' : 'Xác nhận chuyển đổi',
      type: isRevokingTeacher ? 'warning' : 'primary',
      action: async () => {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            role: newRole
          });
          showNotification(
            isRevokingTeacher
              ? `Đã xóa quyền giáo viên của ${user.displayName || user.email} (chuyển thành Học sinh)!`
              : `Đã đổi vai trò thành ${newRole} thành công!`
          );
        } catch (err: any) {
          showNotification("Lỗi cập nhật vai trò: " + err.message, true);
        }
      }
    });
  };

  // Delete user
  const handleDeleteUser = (user: any) => {
    setConfirmModal({
      title: 'Xóa vĩnh viễn tài khoản',
      description: `CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn XÓA vĩnh viễn tài khoản "${user.displayName || user.email}" khỏi hệ thống? Dữ liệu không thể khôi phục.`,
      confirmText: 'Xóa vĩnh viễn',
      type: 'danger',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'users', user.id));
          if (selectedStudent?.id === user.id) setSelectedStudent(null);
          showNotification(`Đã xóa tài khoản ${user.email} thành công!`);
        } catch (err: any) {
          showNotification("Lỗi xóa tài khoản: " + err.message, true);
        }
      }
    });
  };

  // Send admin feedback to student
  const handleSendAdminFeedback = async () => {
    if (!newFeedbackText.trim() || !selectedStudent || !auth.currentUser) return;
    setIsSendingFeedback(true);
    try {
      await addDoc(collection(db, 'users', selectedStudent.id, 'feedbacks'), {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName ? `Quản trị viên (${auth.currentUser.displayName})` : 'Quản trị viên',
        text: `[Admin] ${newFeedbackText.trim()}`,
        timestamp: serverTimestamp(),
        isTeacher: true,
        isAdmin: true
      });
      setNewFeedbackText('');
      showNotification("Đã gửi nhận xét đến học sinh!");
    } catch (err: any) {
      showNotification("Lỗi gửi nhận xét: " + err.message, true);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Delete class
  const handleDeleteClass = (classId: string, className: string) => {
    setConfirmModal({
      title: 'Xác nhận xóa lớp học',
      description: `Bạn có chắc chắn muốn xóa vĩnh viễn lớp học "${className}"? Toàn bộ danh sách lớp sẽ bị xóa.`,
      confirmText: 'Xác nhận xóa lớp',
      type: 'danger',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'classes', classId));
          if (selectedClass?.id === classId) setSelectedClass(null);
          showNotification(`Đã xóa lớp "${className}" thành công!`);
        } catch (err: any) {
          showNotification("Lỗi xóa lớp học: " + err.message, true);
        }
      }
    });
  };

  // Admin create class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const teacherId = selectedTeacherForClass || auth.currentUser?.uid;
      await addDoc(collection(db, 'classes'), {
        name: newClassName.trim(),
        teacherId: teacherId,
        studentIds: [],
        pendingStudentIds: [],
        coTeacherIds: [],
        createdAt: serverTimestamp(),
        createdByAdmin: true
      });
      setNewClassName('');
      setSelectedTeacherForClass('');
      setShowCreateClass(false);
      showNotification("Tạo lớp học mới thành công!");
    } catch (err: any) {
      showNotification("Lỗi tạo lớp học: " + err.message, true);
    }
  };

  // Add student to class
  const handleAddStudentToClass = async (targetClass: any) => {
    const queryStr = studentCodeOrEmailToAdd.trim().toLowerCase();
    if (!queryStr) return;

    const foundStudent = users.find(u => 
      u.role === 'student' && 
      (u.email?.toLowerCase() === queryStr || u.userCode?.toLowerCase() === queryStr)
    );

    if (!foundStudent) {
      showNotification("Không tìm thấy học sinh với email hoặc mã này!", true);
      return;
    }

    const currentStudentIds = targetClass.studentIds || [];
    if (currentStudentIds.includes(foundStudent.id)) {
      showNotification("Học sinh này đã có trong lớp!", true);
      return;
    }

    try {
      const updatedStudentIds = [...currentStudentIds, foundStudent.id];
      const updatedPendingIds = (targetClass.pendingStudentIds || []).filter((id: string) => id !== foundStudent.id);
      
      await updateDoc(doc(db, 'classes', targetClass.id), {
        studentIds: updatedStudentIds,
        pendingStudentIds: updatedPendingIds
      });

      setStudentCodeOrEmailToAdd('');
      showNotification(`Đã thêm học sinh ${foundStudent.displayName || foundStudent.email} vào lớp!`);
    } catch (err: any) {
      showNotification("Lỗi thêm học sinh vào lớp: " + err.message, true);
    }
  };

  // Remove student from class
  const handleRemoveStudentFromClass = (targetClass: any, studentUid: string) => {
    const studentObj = users.find(u => u.id === studentUid);
    const studentName = studentObj ? (studentObj.displayName || studentObj.email) : 'này';
    setConfirmModal({
      title: 'Gỡ học sinh khỏi lớp',
      description: `Bạn có chắc chắn muốn gỡ học sinh "${studentName}" khỏi lớp học "${targetClass.name}"?`,
      confirmText: 'Xác nhận gỡ',
      type: 'warning',
      action: async () => {
        try {
          const updatedStudentIds = (targetClass.studentIds || []).filter((id: string) => id !== studentUid);
          await updateDoc(doc(db, 'classes', targetClass.id), {
            studentIds: updatedStudentIds
          });
          showNotification("Đã gỡ học sinh khỏi lớp thành công!");
        } catch (err: any) {
          showNotification("Lỗi gỡ học sinh: " + err.message, true);
        }
      }
    });
  };

  // Filtered lists
  const studentsList = users.filter(u => u.role === 'student' || (!u.role && !u.isTeacher));
  const teachersList = users.filter(u => u.role === 'teacher');
  const adminsList = users.filter(u => u.role === 'admin');

  const filteredStudents = studentsList.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      (s.displayName || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query) ||
      (s.userCode || '').toLowerCase().includes(query)
    );
  });

  const filteredTeachers = teachersList.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.displayName || '').toLowerCase().includes(query) ||
      (t.email || '').toLowerCase().includes(query) ||
      (t.userCode || '').toLowerCase().includes(query)
    );
  });

  const filteredClasses = classes.filter(c => {
    const query = searchQuery.toLowerCase();
    const teacher = users.find(u => u.id === c.teacherId);
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (teacher?.displayName || '').toLowerCase().includes(query) ||
      (teacher?.email || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-7xl h-[92vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 relative"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Hệ Thống Quản Trị Toàn Năng (Admin)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  {auth.currentUser?.displayName || 'Toàn quyền'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Toàn quyền truy cập và quản lý tài khoản Giáo viên, Học sinh & Lớp học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onImpersonateRole && (
              <div className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-slate-300">Góc nhìn:</span>
                <button
                  onClick={() => onImpersonateRole(impersonatedRole === 'teacher' ? null : 'teacher')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    impersonatedRole === 'teacher' 
                      ? 'bg-violet-500 text-white' 
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  Giáo viên
                </button>
                <button
                  onClick={() => onImpersonateRole(impersonatedRole === 'student' ? null : 'student')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    impersonatedRole === 'student' 
                      ? 'bg-indigo-500 text-white' 
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  Học sinh
                </button>
                {impersonatedRole && (
                  <button
                    onClick={() => onImpersonateRole(null)}
                    className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md font-bold hover:bg-amber-300 ml-1"
                  >
                    Về Admin
                  </button>
                )}
              </div>
            )}

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Action Notifications */}
        {actionSuccessMsg && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionSuccessMsg}
          </div>
        )}
        {actionErrorMsg && (
          <div className="bg-rose-500 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionErrorMsg}
          </div>
        )}

        {/* Tab Navigation & Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Học sinh ({studentsList.length})
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'teachers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <School className="w-4 h-4" />
              Giáo viên ({teachersList.length})
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'classes'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Lớp học ({classes.length})
            </button>
          </div>

          {activeTab !== 'overview' && (
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, mã số..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-500">Đang tải toàn bộ dữ liệu hệ thống...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng tài khoản</p>
                        <h3 className="text-2xl font-black text-slate-900">{users.length}</h3>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Hoạt động bình thường</p>
                      </div>
                    </div>

                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Học sinh</p>
                        <h3 className="text-2xl font-black text-slate-900">{studentsList.length}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tài khoản học sinh</p>
                      </div>
                    </div>

                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                        <School className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Giáo viên</p>
                        <h3 className="text-2xl font-black text-slate-900">{teachersList.length}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Phụ trách hướng nghiệp</p>
                      </div>
                    </div>

                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lớp học</p>
                        <h3 className="text-2xl font-black text-slate-900">{classes.length}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Đã tạo trên hệ thống</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick System Actions */}
                  <div className="p-6 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                          Quản trị cấp cao
                        </span>
                        <h3 className="text-xl font-black">Hành động nhanh cho Quản trị viên</h3>
                        <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                          Bạn có quyền trực tiếp can thiệp, xem hồ sơ định hướng cá nhân của học sinh, gửi lời tư vấn đặc biệt hoặc phân quyền quản lý cho bất kỳ lớp nào.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => { setActiveTab('classes'); setShowCreateClass(true); }}
                          className="px-4 py-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20"
                        >
                          <Plus className="w-4 h-4" />
                          Tạo lớp học mới
                        </button>
                        <button
                          onClick={() => setActiveTab('students')}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all border border-white/15"
                        >
                          <Eye className="w-4 h-4" />
                          Xem bài làm học sinh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recently Logged In Users */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-indigo-600" />
                        Danh sách tài khoản trong hệ thống ({users.length})
                      </h4>
                      <span className="text-xs text-slate-400">Tự động cập nhật theo thời gian thực</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 font-bold">Người dùng</th>
                            <th className="pb-3 font-bold">Mã số</th>
                            <th className="pb-3 font-bold">Vai trò</th>
                            <th className="pb-3 font-bold">Trạng thái</th>
                            <th className="pb-3 font-bold">Khảo sát</th>
                            <th className="pb-3 font-bold text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.slice(0, 8).map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 font-medium text-slate-900">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.displayName ? u.displayName.charAt(0).toUpperCase() : (u.email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{u.displayName || 'Chưa đặt tên'}</p>
                                    <p className="text-[11px] text-slate-400">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 font-mono font-bold text-slate-600">
                                {u.userCode || '---'}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                  u.role === 'admin' 
                                    ? 'bg-amber-100 text-amber-800'
                                    : u.role === 'teacher'
                                    ? 'bg-violet-100 text-violet-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {u.role === 'admin' ? '👑 Admin' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                </span>
                              </td>
                              <td className="py-3">
                                {u.isBanned ? (
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-700">
                                    Đã khóa
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-700">
                                    Hoạt động
                                  </span>
                                )}
                              </td>
                              <td className="py-3">
                                {u.lastResult ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Đã làm
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Chưa làm</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                {u.role === 'student' && (
                                  <button
                                    onClick={() => setSelectedStudent(u)}
                                    className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-[11px] mr-1.5 transition-all"
                                  >
                                    Chi tiết
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleBan(u)}
                                  className={`p-1 rounded-lg transition-all ${
                                    u.isBanned 
                                      ? 'text-emerald-600 hover:bg-emerald-50' 
                                      : 'text-amber-600 hover:bg-amber-50'
                                  }`}
                                  title={u.isBanned ? 'Mở khóa' : 'Khóa'}
                                >
                                  {u.isBanned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDENTS MANAGEMENT */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">Quản lý Tài khoản Học sinh</h3>
                      <p className="text-xs text-slate-500">Xem toàn bộ thông tin cá nhân, kết quả định hướng và phản hồi học sinh</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      Hiển thị {filteredStudents.length} / {studentsList.length} học sinh
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => {
                      const studentClasses = classes.filter(c => 
                        (c.studentIds || []).includes(student.id) || 
                        (c.pendingStudentIds || []).includes(student.id)
                      );
                      const hasResult = !!student.lastResult;

                      return (
                        <div 
                          key={student.id} 
                          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                  {student.displayName ? student.displayName.charAt(0).toUpperCase() : student.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{student.displayName || 'Chưa đặt tên'}</h4>
                                  <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {student.userCode || 'Chưa cấp mã'}
                                  </span>
                                </div>
                              </div>
                              {student.isBanned && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-700">
                                  Bị khóa
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {student.email}
                            </p>

                            <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Khảo sát định hướng:</span>
                                {hasResult ? (
                                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {student.lastResult.careerName || student.lastResult.topCareers?.[0]?.name || 'Hoàn thành'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Chưa thực hiện</span>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Lớp học tham gia:</span>
                                <span className="font-bold text-slate-800">
                                  {studentClasses.length > 0 
                                    ? studentClasses.map(c => c.name).join(', ')
                                    : 'Chưa vào lớp'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem hồ sơ & tư vấn
                            </button>

                            <button
                              onClick={() => handleToggleBan(student)}
                              className={`p-2 rounded-xl transition-all ${
                                student.isBanned 
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                              title={student.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            >
                              {student.isBanned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleChangeRole(student, 'teacher')}
                              className="p-2 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-xl transition-all"
                              title="Chuyển thành Giáo viên"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(student)}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: TEACHERS MANAGEMENT */}
              {activeTab === 'teachers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">Quản lý Tài khoản Giáo viên</h3>
                      <p className="text-xs text-slate-500">Toàn quyền phân quyền, xem lớp phụ trách và trạng thái tài khoản giáo viên</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      Hiển thị {filteredTeachers.length} / {teachersList.length} giáo viên
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeachers.map((teacher) => {
                      const managedClasses = classes.filter(c => 
                        c.teacherId === teacher.id || 
                        (c.coTeacherIds || []).includes(teacher.id)
                      );
                      const totalStudentsInClasses = managedClasses.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0);

                      return (
                        <div 
                          key={teacher.id} 
                          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm">
                                  {teacher.displayName ? teacher.displayName.charAt(0).toUpperCase() : teacher.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm">{teacher.displayName || 'Giáo viên'}</h4>
                                  <span className="font-mono text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                    {teacher.userCode || 'Chưa cấp mã'}
                                  </span>
                                </div>
                              </div>
                              {teacher.isBanned && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-700">
                                  Bị khóa
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {teacher.email}
                            </p>

                            <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Số lớp phụ trách:</span>
                                <span className="font-bold text-violet-600">{managedClasses.length} lớp</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Tổng học sinh theo dõi:</span>
                                <span className="font-bold text-slate-800">{totalStudentsInClasses} học sinh</span>
                              </div>
                              {managedClasses.length > 0 && (
                                <div className="pt-1 flex flex-wrap gap-1">
                                  {managedClasses.map(c => (
                                    <span key={c.id} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                if (managedClasses.length > 0) {
                                  setSelectedClass(managedClasses[0]);
                                  setActiveTab('classes');
                                } else {
                                  showNotification("Giáo viên này chưa tạo lớp học nào!", true);
                                }
                              }}
                              className="flex-1 py-2 bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Xem lớp phụ trách
                            </button>

                            <button
                              onClick={() => handleToggleBan(teacher)}
                              className={`p-2 rounded-xl transition-all ${
                                teacher.isBanned 
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                              title={teacher.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            >
                              {teacher.isBanned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleChangeRole(teacher, 'student')}
                              className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-all"
                              title="Xóa chức quyền giáo viên (hạ cấp thành học sinh)"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(teacher)}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: ALL CLASSES MANAGEMENT */}
              {activeTab === 'classes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">Quản lý Toàn bộ Lớp học</h3>
                      <p className="text-xs text-slate-500">Toàn bộ lớp học trên hệ thống, phân bổ học sinh và giáo viên</p>
                    </div>
                    <button
                      onClick={() => setShowCreateClass(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      <Plus className="w-4 h-4" />
                      Tạo lớp học mới
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((cls) => {
                      const teacher = users.find(u => u.id === cls.teacherId);
                      const studentCount = cls.studentIds?.length || 0;
                      const pendingCount = cls.pendingStudentIds?.length || 0;

                      return (
                        <div 
                          key={cls.id}
                          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                                  <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-base">{cls.name}</h4>
                                  <p className="text-[11px] text-slate-500">
                                    GV: <span className="font-semibold text-slate-800">{teacher?.displayName || teacher?.email || 'Admin'}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-xs">
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Học sinh chính thức:</span>
                                <span className="font-bold text-indigo-600">{studentCount} học sinh</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Lời mời đang chờ:</span>
                                <span className="font-bold text-amber-600">{pendingCount} lời mời</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedClass(cls)}
                              className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Quản lý danh sách lớp
                            </button>

                            <button
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                              title="Xóa lớp học"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* MODAL: STUDENT DETAILED PROFILE & FEEDBACK */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-3xl max-h-[88vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedStudent.displayName || 'Hồ sơ học sinh'}</h3>
                    <p className="text-xs text-slate-300">
                      Mã HS: <span className="font-mono font-bold text-amber-400">{selectedStudent.userCode || 'Chưa cấp'}</span> • {selectedStudent.email}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedStudent.lastResult ? (
                  <>
                    {/* Career Result Header */}
                    <div className="p-5 bg-gradient-to-r from-indigo-50 to-indigo-100/60 rounded-3xl border border-indigo-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                            Nghề nghiệp phù hợp nhất (Top 1)
                          </span>
                          <h4 className="text-xl font-black text-indigo-950">
                            {selectedStudent.lastResult.careerName || selectedStudent.lastResult.topCareers?.[0]?.name}
                          </h4>
                        </div>
                        {selectedStudent.lastResult.topCareers?.[0]?.matchPercentage && (
                          <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-black">
                            {selectedStudent.lastResult.topCareers[0].matchPercentage}% Phù hợp
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2">
                        {selectedStudent.lastResult.summary || selectedStudent.lastResult.overallSummary}
                      </p>
                    </div>

                    {/* Academic Profile */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Điểm GPA</span>
                        <p className="text-lg font-black text-slate-800">
                          {selectedStudent.lastResult.gpa || selectedStudent.lastResult.assessmentData?.gpa || '---'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tính cách MBTI</span>
                        <p className="text-lg font-black text-indigo-600">
                          {selectedStudent.lastResult.mbti || selectedStudent.lastResult.assessmentData?.mbti || '---'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Holland Code</span>
                        <p className="text-lg font-black text-violet-600">
                          {Array.isArray(selectedStudent.lastResult.holland) 
                            ? selectedStudent.lastResult.holland.join('-')
                            : selectedStudent.lastResult.holland || '---'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</span>
                        <p className="text-xs font-black text-emerald-600 mt-1">Đã hoàn thành</p>
                      </div>
                    </div>

                    {/* Top Careers List */}
                    {selectedStudent.lastResult.topCareers && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Top Ngành Nghề Phù Hợp:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {selectedStudent.lastResult.topCareers.slice(0, 3).map((career: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                              <span className="text-[10px] font-bold text-indigo-600">Top {idx + 1}</span>
                              <h5 className="font-bold text-slate-900 text-xs mb-1 line-clamp-1">{career.name}</h5>
                              <p className="text-[11px] text-slate-500 line-clamp-2">{career.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-100">
                    <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Học sinh chưa hoàn thành bài khảo sát định hướng</p>
                    <p className="text-xs text-slate-400 mt-1">Khi học sinh làm trắc nghiệm, kết quả sẽ hiển thị ngay tại đây.</p>
                  </div>
                )}

                {/* Feedbacks / Tư vấn từ Admin & Giáo viên */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Trao đổi & Nhận xét định hướng ({studentFeedbacks.length})
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentFeedbacks.map((fb, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-2xl text-xs ${
                          fb.isAdmin 
                            ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                            : fb.isTeacher 
                            ? 'bg-violet-50 border border-violet-100 text-violet-900' 
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{fb.senderName}</span>
                          <span className="text-[10px] opacity-60">
                            {fb.timestamp?.toDate ? fb.timestamp.toDate().toLocaleString('vi-VN') : 'Vừa gửi'}
                          </span>
                        </div>
                        <p className="leading-relaxed">{fb.text}</p>
                      </div>
                    ))}
                    {studentFeedbacks.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-2">Chưa có nhận xét nào.</p>
                    )}
                  </div>

                  {/* Send Feedback Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Viết nhận xét hoặc chỉ dẫn định hướng từ Admin..."
                      value={newFeedbackText}
                      onChange={(e) => setNewFeedbackText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAdminFeedback()}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                    />
                    <button
                      onClick={handleSendAdminFeedback}
                      disabled={isSendingFeedback || !newFeedbackText.trim()}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CLASS DETAIL (ADMIN VIEW) */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-3xl max-h-[88vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Quản lý lớp: {selectedClass.name}</h3>
                    <p className="text-xs text-slate-300">
                      Quyền Quản trị viên tối cao: Thêm/Gỡ học sinh & Giáo viên
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Add student by email or code */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                  <h4 className="font-bold text-indigo-950 text-xs">Thêm học sinh trực tiếp vào lớp</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập Mã học sinh (ví dụ: HS-000001) hoặc Email học sinh..."
                      value={studentCodeOrEmailToAdd}
                      onChange={(e) => setStudentCodeOrEmailToAdd(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                    />
                    <button
                      onClick={() => handleAddStudentToClass(selectedClass)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                    >
                      Thêm vào lớp
                    </button>
                  </div>
                </div>

                {/* Joined Students */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3">
                    Học sinh trong lớp ({selectedClass.studentIds?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(selectedClass.studentIds || []).map((studentUid: string) => {
                      const student = users.find(u => u.id === studentUid);
                      return (
                        <div key={studentUid} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {student?.displayName ? student.displayName.charAt(0).toUpperCase() : 'HS'}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-900">{student?.displayName || 'Chưa đặt tên'}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{student?.userCode || '---'} • {student?.email || studentUid}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {student && (
                              <button
                                onClick={() => setSelectedStudent(student)}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-[11px]"
                              >
                                Xem định hướng
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveStudentFromClass(selectedClass, studentUid)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Gỡ khỏi lớp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(!selectedClass.studentIds || selectedClass.studentIds.length === 0) && (
                      <p className="text-xs text-slate-400 italic text-center py-4">Chưa có học sinh nào trong lớp này.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE CLASS */}
      <AnimatePresence>
        {showCreateClass && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowCreateClass(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-black text-slate-900 text-lg mb-1">Tạo lớp học mới</h3>
              <p className="text-xs text-slate-500 mb-5">Admin có thể tạo lớp và chỉ định giáo viên chủ nhiệm</p>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tên lớp học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 12A1 - Định hướng KHTN"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Giáo viên phụ trách</label>
                  <select
                    value={selectedTeacherForClass}
                    onChange={(e) => setSelectedTeacherForClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Mặc định (Admin phụ trách) --</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.displayName || t.email} ({t.userCode || 'Chưa cấp mã'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all mt-2"
                >
                  Xác nhận Tạo lớp
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IN-APP CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[300] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative"
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600' :
                confirmModal.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-indigo-100 text-indigo-600'
              }`}>
                {confirmModal.type === 'danger' ? <Trash2 className="w-7 h-7" /> :
                 confirmModal.type === 'warning' ? <AlertCircle className="w-7 h-7" /> :
                 <CheckCircle2 className="w-7 h-7" />}
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {confirmModal.description}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={async () => {
                    setIsProcessingAction(true);
                    try {
                      await confirmModal.action();
                    } finally {
                      setIsProcessingAction(false);
                      setConfirmModal(null);
                    }
                  }}
                  className={`flex-1 py-3 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
                    confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                    confirmModal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                    'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  {isProcessingAction ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    confirmModal.confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
