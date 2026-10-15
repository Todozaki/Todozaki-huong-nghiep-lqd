/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { 
  GraduationCap, 
  Compass, 
  BrainCircuit, 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  BarChart3, 
  Sparkles,
  BookOpen,
  Target,
  Trophy,
  Map,
  TrendingUp,
  Coins,
  Book,
  ShieldAlert,
  Briefcase,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  Info,
  Banknote,
  CheckCircle,
  Code,
  Users,
  Award,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  LogOut,
  Trash2,
  Ban,
  ShieldCheck,
  Plus,
  UserPlus,
  ClipboardList,
  UserCheck,
  Menu,
  Crown
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  runTransaction,
  sendPasswordResetEmail
} from './lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, onSnapshot, getDocFromServer, deleteDoc, updateDoc, query, where, getDocs, addDoc, orderBy, or } from 'firebase/firestore';
import { db } from './lib/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';
import { analyzeCareer, createCounselorChat } from './lib/gemini';
import { cn } from './lib/utils';
import { AssessmentData, CareerResult } from './types';
import CareerDictionary from './components/CareerDictionary';
import UniversityRanking from './components/UniversityRanking';
import { CertificatesView, InternationalStatsView } from './components/ModuleViews';
import { HistoryView } from './components/HistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

// --- Constants & Mock Data ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  }
  console.error('Firestore Error Detail:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

testConnection();

const STEPS = [
  { id: 'welcome', title: 'Chào mừng', icon: Sparkles },
  { id: 'gpa', title: 'Học tập', icon: GraduationCap },
  { id: 'mbti_holland', title: 'Tính cách', icon: BrainCircuit },
  { id: 'interests', title: 'Đam mê', icon: Heart },
  { id: 'preferences', title: 'Định hướng', icon: Map },
  { id: 'results', title: 'Kết quả', icon: Target },
];

const MBTI_TYPES = [
  { id: 'INTJ', name: 'Kiến trúc sư (Architect)', desc: 'Người suy nghĩ chiến lược, có kế hoạch cho mọi thứ.' },
  { id: 'INTP', name: 'Nhà logic học (Logician)', desc: 'Nhà sáng chế sáng tạo với niềm khát khao tri thức.' },
  { id: 'ENTJ', name: 'Nhà điều hành (Commander)', desc: 'Nhà lãnh đạo táo bạo, giàu trí tưởng tượng.' },
  { id: 'ENTP', name: 'Người tranh biện (Debater)', desc: 'Người suy nghĩ thông minh và tò mò.' },
  { id: 'INFJ', name: 'Người ủng hộ (Advocate)', desc: 'Người lý tưởng hóa lặng lẽ nhưng truyền cảm hứng.' },
  { id: 'INFP', name: 'Người hòa giải (Mediator)', desc: 'Người giàu lòng trắc ẩn, luôn sẵn lòng giúp đỡ.' },
  { id: 'ENFJ', name: 'Người chỉ dẫn (Protagonist)', desc: 'Nhà lãnh đạo đầy lôi cuốn và truyền cảm hứng.' },
  { id: 'ENFP', name: 'Người truyền cảm hứng (Campaigner)', desc: 'Người nhiệt tình, sáng tạo và tự do.' },
  { id: 'ISTJ', name: 'Người hậu cần (Logistician)', desc: 'Người thực tế và dựa trên sự thật.' },
  { id: 'ISFJ', name: 'Người bảo vệ (Defender)', desc: 'Người bảo vệ tận tâm và ấm áp.' },
  { id: 'ESTJ', name: 'Người quản lý (Executive)', desc: 'Người quản trị xuất sắc, không ai sánh kịp.' },
  { id: 'ESFJ', name: 'Người quan tâm (Consul)', desc: 'Người cực kỳ chu đáo, có tính cộng đồng.' },
  { id: 'ISTP', name: 'Người khéo léo (Virtuoso)', desc: 'Người thử nghiệm táo bạo và thực tế.' },
  { id: 'ISFP', name: 'Nghệ sĩ (Adventurer)', desc: 'Nghệ sĩ linh hoạt và quyến rũ.' },
  { id: 'ESTP', name: 'Người thực thi (Entrepreneur)', desc: 'Người thông minh, năng động và thực tế.' },
  { id: 'ESFP', name: 'Người trình diễn (Entertainer)', desc: 'Người tự phát, năng động và nhiệt tình.' },
];

const HOLLAND_TYPES = [
  { id: 'R', name: 'Realistic (Kỹ thuật)', desc: 'Người thực tế, thích làm việc với máy móc, công cụ, cây cối, con vật.' },
  { id: 'I', name: 'Investigative (Nghiên cứu)', desc: 'Người thích quan sát, tìm tòi, phân tích và giải quyết vấn đề.' },
  { id: 'A', name: 'Artistic (Nghệ thuật)', desc: 'Người sáng tạo, trực giác, thích làm việc trong các tình huống không có kế hoạch.' },
  { id: 'S', name: 'Social (Xã hội)', desc: 'Người thích làm việc với con người để giúp đỡ, huấn luyện, phát triển.' },
  { id: 'E', name: 'Enterprising (Quản lý)', desc: 'Người thích làm việc với con người để gây ảnh hưởng, thuyết phục, dẫn dắt.' },
  { id: 'C', name: 'Conventional (Nghiệp vụ)', desc: 'Người thích làm việc với dữ liệu, có khả năng tính toán, chi tiết.' },
];

const CORE_MOTIVATIONS = [
  { id: 'wealth', icon: '💰', label: 'Thu nhập cao / Làm giàu' },
  { id: 'balance', icon: '⚖️', label: 'Cân bằng công việc & cuộc sống (Ổn định)' },
  { id: 'freedom', icon: '🎨', label: 'Tự do, linh hoạt, được sáng tạo' },
  { id: 'contribution', icon: '🤝', label: 'Giúp đỡ người khác / Cống hiến cho xã hội' },
  { id: 'power', icon: '👑', label: 'Quyền lực, thăng tiến, lãnh đạo' },
];

// --- Components ---

const AboutPage = ({ onStart, onBack }: { onStart: () => void, onBack: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-12 py-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium mb-4"
      >
        <ChevronLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="text-center space-y-6">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Về LQĐ Future – Khám phá tiềm năng, <br />
          <span className="text-indigo-600">Định hướng tương lai</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed italic max-w-3xl mx-auto">
          "Đứng trước ngưỡng cửa tương lai, bạn đã bao giờ tự hỏi: 'Mình thực sự giỏi điều gì?' hay 'Đâu mới là con đường phù hợp nhất dành cho mình?'"
        </p>
      </div>

      <div className="space-y-10 text-lg text-slate-700 leading-relaxed">
        <p>
          Hiểu được những trăn trở, băn khoăn của hàng ngàn học sinh và sinh viên trong việc lựa chọn ngành nghề và trường đại học, <strong>LQĐ Future</strong> đã ra đời. Chúng tôi không chỉ là một công cụ công nghệ, mà là một người bạn đồng hành thấu hiểu, giúp bạn tự tin bước những bước đi đầu tiên trên hành trình sự nghiệp.
        </p>

        <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <Target className="w-7 h-7" /> Sứ mệnh của chúng tôi
          </h2>
          <p className="text-indigo-900/80">
            Sứ mệnh của <strong>LQĐ Future</strong> là dân chủ hóa việc hướng nghiệp. Chúng tôi ứng dụng sức mạnh của Trí tuệ nhân tạo (AI) để biến những dữ liệu khô khan thành một lộ trình phát triển mang tính cá nhân hóa cao nhất, giúp bất kỳ ai cũng có thể tìm thấy bệ phóng hoàn hảo cho tương lai của mình.
          </p>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-4">Điều gì làm nên sự khác biệt của LQĐ Future?</h2>
          <p>Thay vì đưa ra những lời khuyên chung chung, LQĐ Future kết hợp giữa năng lực thực tế và bản sắc cá nhân của riêng bạn:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Khoa học & Chính xác</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Cung cấp kết quả đánh giá chuyên sâu dựa trên các mô hình trắc nghiệm tính cách chuẩn quốc tế như Holland và MBTI, giúp bạn "giải mã" chính mình.</p>
            </div>
            
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Phân tích toàn diện</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Hệ thống AI thông minh không chỉ phân tích tính cách, đam mê mà còn đánh giá năng lực học tập thực tế qua điểm số GPA để đưa ra dự phóng chính xác nhất.</p>
            </div>
            
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Lộ trình tối ưu</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Từ những dữ liệu trên, hệ thống sẽ đề xuất danh sách các trường Đại học và ngành nghề "đo ni đóng giày" cho riêng bạn, tiết kiệm thời gian và giảm thiểu rủi ro chọn sai ngành.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-4">Giá trị cốt lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 font-bold">1</div>
              <h4 className="font-bold text-slate-800 mb-1">Cá nhân hóa</h4>
              <p className="text-sm text-slate-500">Không ai giống ai, và lộ trình của bạn tại LQĐ Future là duy nhất.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 font-bold">2</div>
              <h4 className="font-bold text-slate-800 mb-1">Đáng tin cậy</h4>
              <p className="text-sm text-slate-500">Mọi đề xuất đều được xây dựng nền tảng dữ liệu khoa học và thực tế.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 font-bold">3</div>
              <h4 className="font-bold text-slate-800 mb-1">Truyền cảm hứng</h4>
              <p className="text-sm text-slate-500">Khuyến khích bạn mạnh dạn khám phá bản thân và dám theo đuổi đam mê.</p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-8 pt-12 border-t border-slate-100">
          <div className="space-y-2">
            <p className="text-2xl font-black text-slate-900">Khám phá tương lai - Bắt đầu từ chính bạn.</p>
            <p className="text-slate-600">Đừng để những lựa chọn quan trọng nhất cuộc đời dựa vào may rủi. Hãy để <strong>LQĐ Future</strong> cùng bạn vẽ nên tấm bản đồ cho tương lai.</p>
          </div>
          
          <button 
            onClick={onStart}
            className="group relative px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95"
          >
            Bắt đầu hành trình của bạn ngay hôm nay!
            <ChevronRight className="inline-block ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  // We have 5 main steps after the welcome screen (GPA, MBTI+Holland, Interests, Preferences, Results)
  const totalSegments = 5;
  
  return (
    <div className="flex gap-1.5 mb-10">
      {Array.from({ length: totalSegments }).map((_, i) => {
        const segmentIndex = i + 1;
        const isActive = currentStep >= segmentIndex;
        const isCurrent = currentStep === segmentIndex;
        
        return (
          <div 
            key={i}
            className={cn(
              "flex-1 h-2.5 relative bg-slate-200 rounded-full overflow-hidden transition-all duration-300",
              isCurrent && "ring-2 ring-indigo-100 ring-offset-2"
            )}
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: isActive ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]"
            />
          </div>
        );
      })}
    </div>
  );
};

const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const generateUserCode = async (role: string, email?: string | null) => {
  const totalCounterRef = doc(db, 'counters', 'total_users');
  const roleCounterRef = doc(db, 'counters', role);
  
  return await runTransaction(db, async (transaction) => {
    try {
      const totalDoc = await transaction.get(totalCounterRef);
      const roleDoc = await transaction.get(roleCounterRef);
      
      let totalCount = 1;
      if (totalDoc.exists()) {
        totalCount = (totalDoc.data().count || 0) + 1;
      }
      transaction.set(totalCounterRef, { count: totalCount });

      let roleCount = 1;
      if (roleDoc.exists()) {
        roleCount = (roleDoc.data().count || 0) + 1;
      }
      transaction.set(roleCounterRef, { count: roleCount });
      
      const prefix = role === 'admin' ? 'AD' : (role === 'student' ? 'HS' : 'GV');
      const paddedNumber = roleCount.toString().padStart(6, '0');
      return { code: `${prefix}-${paddedNumber}`, role: role };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `counters/${role}`);
      throw error;
    }
  });
};

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  userData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: any, 
  userData: any 
}) => {
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || '');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || '');
    }
  }, [userData]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB limit
        setMessage({ type: 'error', text: 'Ảnh quá lớn! Vui lòng chọn ảnh dưới 3MB.' });
        return;
      }
      
      setIsLoading(true);
      try {
        // Resize image to stay under 1MB Firestore limit (max 800x800)
        const compressed = await compressImage(file, 800, 800, 0.7);
        setPhotoURL(compressed);
      } catch (err) {
        console.error("Image compression error:", err);
        setMessage({ type: 'error', text: 'Lỗi xử lý ảnh. Vui lòng thử lại.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      // Update Firebase Auth Profile
      const profileUpdates: any = { displayName };
      // Firebase Auth photoURL has a length limit, so don't pass base64 strings
      if (photoURL && photoURL.length < 2000) {
        profileUpdates.photoURL = photoURL;
      }
      await updateProfile(user, profileUpdates);
      
      // Update Firestore Document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName,
        photoURL,
      }, { merge: true });

      // Update Password if provided
      if (newPassword) {
        await updatePassword(user, newPassword);
        // Update password in Firestore as well
        await setDoc(userRef, { password: newPassword }, { merge: true });
      }

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      
      // Try to parse Firestore error if it's JSON
      let errorMsg = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) {
          errorMsg = parsed.error;
        }
      } catch (e) {
        // Not JSON, use original message
      }
      
      setMessage({ type: 'error', text: `Lỗi: ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4 group">
              <img 
                src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                alt="Avatar" 
                className="w-24 h-24 rounded-3xl object-cover border-4 border-indigo-50 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Thiết lập tài khoản</h2>
            <p className="text-slate-500 text-sm">Mã số: <span className="font-mono font-bold text-indigo-600">{userData?.userCode || 'Đang cập nhật...'}</span></p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên hiển thị</label>
              <input 
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                placeholder="Tên của bạn"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Link ảnh đại diện (URL)</label>
              <input 
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-[10px] text-slate-400 ml-1 italic">* Bạn có thể dán link ảnh hoặc nhấn vào biểu tượng trên ảnh để tải lên.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mật khẩu mới (Để trống nếu không đổi)</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={cn(
                "p-4 rounded-2xl text-sm font-medium text-center",
                message.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const ClassManagement = ({ onClose, teacherId, initialClassId, isAdmin }: { onClose: () => void, teacherId: string, initialClassId?: string | null, isAdmin?: boolean }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [studentIdToAdd, setStudentIdToAdd] = useState('');
  const [studentsInClass, setStudentsInClass] = useState<any[]>([]);
  const [pendingStudentsInClass, setPendingStudentsInClass] = useState<any[]>([]);
  const [coTeachersInClass, setCoTeachersInClass] = useState<any[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [viewingStudentResult, setViewingStudentResult] = useState<any | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'careers' | 'roadmap'>('profile');
  const [localCareerIndex, setLocalCareerIndex] = useState(0);
  const [studentToKick, setStudentToKick] = useState<string | null>(null);
  const [classToDeleteConfirm, setClassToDeleteConfirm] = useState<any | null>(null);
  const [isDeletingClassInModal, setIsDeletingClassInModal] = useState(false);

  useEffect(() => {
    if (viewingStudentResult) {
      setActiveTab('profile');
      setLocalCareerIndex(0);
    }
  }, [viewingStudentResult]);

  useEffect(() => {
    if (viewingStudentResult) {
      const q = query(
        collection(db, 'users', viewingStudentResult.id, 'feedbacks'),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeedbacks(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${viewingStudentResult.id}/feedbacks`);
      });
      return () => unsubscribe();
    } else {
      setFeedbacks([]);
    }
  }, [viewingStudentResult]);

  const handleSendFeedback = async () => {
    if (!newFeedback.trim() || !viewingStudentResult || !auth.currentUser) return;
    setIsSendingFeedback(true);
    try {
      const feedbacksRef = collection(db, 'users', viewingStudentResult.id, 'feedbacks');
      await addDoc(feedbacksRef, {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || (isAdmin ? 'Quản trị viên' : 'Giáo viên'),
        text: isAdmin ? `[Admin] ${newFeedback}` : newFeedback,
        timestamp: serverTimestamp(),
        isTeacher: true,
        ...(isAdmin ? { isAdmin: true } : {})
      });
      setNewFeedback("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${viewingStudentResult.id}/feedbacks`);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  useEffect(() => {
    const q = isAdmin
      ? collection(db, 'classes')
      : query(
          collection(db, 'classes'), 
          or(where('teacherId', '==', teacherId), where('coTeacherIds', 'array-contains', teacherId))
        );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesList);
      
      // Select class if initialClassId is provided
      if (initialClassId) {
        const found = classesList.find(c => c.id === initialClassId);
        if (found) setSelectedClass(found);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });
    return () => unsubscribe();
  }, [teacherId, initialClassId, isAdmin]);

  useEffect(() => {
    const fetchStudentsRecursive = async () => {
      if (selectedClass) {
        // Fetch co-teachers
        if (selectedClass.coTeacherIds && selectedClass.coTeacherIds.length > 0) {
          const uniqueCoUids = Array.from(new Set(selectedClass.coTeacherIds as string[]));
          const coTeachersList: any[] = [];
          for (const uid of uniqueCoUids) {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                coTeachersList.push({ id: userDoc.id, ...userDoc.data() });
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `users/${uid}`);
            }
          }
          setCoTeachersInClass(coTeachersList);
        } else {
          setCoTeachersInClass([]);
        }

        // Fetch pending students and co-teachers together to prevent race condition
        const pendingList: any[] = [];
        
        if (selectedClass.pendingTeacherIds && selectedClass.pendingTeacherIds.length > 0) {
          const uniquePendingCoUids = Array.from(new Set(selectedClass.pendingTeacherIds as string[]));
          for (const uid of uniquePendingCoUids) {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                pendingList.push({ id: userDoc.id, ...userDoc.data(), isCoTeacher: true });
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `users/${uid}`);
            }
          }
        }
        
        if (selectedClass.pendingStudentIds && selectedClass.pendingStudentIds.length > 0) {
          const uniquePendingUids = Array.from(new Set(selectedClass.pendingStudentIds as string[]));
          for (const uid of uniquePendingUids) {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                // Ensure we don't add duplicates if they were somehow in both lists
                if (!pendingList.some(user => user.id === uid)) {
                  pendingList.push({ id: userDoc.id, ...userDoc.data() });
                }
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `users/${uid}`);
            }
          }
        }
        setPendingStudentsInClass(pendingList);
        
        // Fetch joined students
        if (selectedClass.studentIds && selectedClass.studentIds.length > 0) {
          const uniqueUids = Array.from(new Set(selectedClass.studentIds as string[]));
          const studentsList: any[] = [];
          for (const uid of uniqueUids) {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                studentsList.push({ id: userDoc.id, ...userDoc.data() });
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `users/${uid}`);
            }
          }
          setStudentsInClass(studentsList);
        } else {
          setStudentsInClass([]);
        }
      } else {
        setStudentsInClass([]);
        setPendingStudentsInClass([]);
        setCoTeachersInClass([]);
      }
    };
    fetchStudentsRecursive();
  }, [selectedClass]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherId: teacherId,
        studentIds: [],
        pendingStudentIds: [],
        coTeacherIds: [],
        pendingTeacherIds: [],
        createdAt: serverTimestamp()
      });
      setNewClassName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
      alert("Lỗi khi tạo lớp học.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickStudent = async (studentUid: string) => {
    if (!selectedClass) return;
    
    setIsLoading(true);
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      const updatedStudentIds = Array.from(new Set(selectedClass.studentIds.filter((id: string) => id !== studentUid)));
      
      await updateDoc(classRef, {
        studentIds: updatedStudentIds
      });
      
      setSelectedClass((prev: any) => ({
        ...prev,
        studentIds: updatedStudentIds
      }));
      
      setStudentToKick(null);
      // alert("Đã mời học sinh ra khỏi lớp.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${selectedClass.id}`);
      alert("Lỗi khi mời học sinh ra khỏi lớp.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = async (studentUid: string) => {
    if (!selectedClass) return;
    
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      const updatedPendingIds = Array.from(new Set((selectedClass.pendingStudentIds || []).filter((id: string) => id !== studentUid)));
      
      await updateDoc(classRef, {
        pendingStudentIds: updatedPendingIds
      });
      
      setSelectedClass((prev: any) => ({
        ...prev,
        pendingStudentIds: updatedPendingIds
      }));
      
      alert("Đã hủy lời mời.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${selectedClass.id}`);
      alert("Lỗi khi hủy lời mời.");
    }
  };

  const handleCancelTeacherInvite = async (teacherUid: string) => {
    if (!selectedClass) return;
    
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      const updatedPendingIds = Array.from(new Set((selectedClass.pendingTeacherIds || []).filter((id: string) => id !== teacherUid)));
      
      await updateDoc(classRef, {
        pendingTeacherIds: updatedPendingIds
      });
      
      setSelectedClass((prev: any) => ({
        ...prev,
        pendingTeacherIds: updatedPendingIds
      }));
      
      alert("Đã hủy lời mời đồng nghiệp.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${selectedClass.id}`);
      alert("Lỗi khi hủy lời mời.");
    }
  };

  const handleRemoveCoTeacher = async (teacherUid: string) => {
    if (!selectedClass) return;
    if (teacherUid === teacherId) {
      alert("Bạn không thể tự xóa mình khỏi lớp.");
      return;
    }
    
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      const updatedCoTeacherIds = (selectedClass.coTeacherIds || []).filter((id: string) => id !== teacherUid);
      
      await updateDoc(classRef, {
        coTeacherIds: updatedCoTeacherIds
      });
      
      setSelectedClass((prev: any) => ({
        ...prev,
        coTeacherIds: updatedCoTeacherIds
      }));
      
      alert("Đã xóa đồng nghiệp khỏi lớp.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${selectedClass.id}`);
      alert("Lỗi khi xóa đồng nghiệp.");
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdToAdd.trim() || !selectedClass) return;
    setIsAddingStudent(true);
    try {
      // Find user by userCode
      const q = query(collection(db, 'users'), where('userCode', '==', studentIdToAdd.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Không tìm thấy người dùng với mã số này.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userUid = userDoc.id;

      const currentPendingIds = selectedClass.pendingStudentIds || [];
      const currentStudentIds = selectedClass.studentIds || [];
      const currentCoTeacherIds = selectedClass.coTeacherIds || [];

      if (currentStudentIds.includes(userUid) || currentPendingIds.includes(userUid) || currentCoTeacherIds.includes(userUid) || selectedClass.teacherId === userUid) {
        alert("Người dùng này đã có trong lớp hoặc đã được mời.");
        return;
      }

      const classRef = doc(db, 'classes', selectedClass.id);
      
      if (userData.role === 'teacher') {
        const currentPendingTeacherIds = selectedClass.pendingTeacherIds || [];
        if (currentPendingTeacherIds.includes(userUid)) {
          alert("Giáo viên này đã được mời.");
          return;
        }
        const newPendingTeacherIds = Array.from(new Set([...currentPendingTeacherIds, userUid]));
        await updateDoc(classRef, {
          pendingTeacherIds: newPendingTeacherIds
        });
        setSelectedClass((prev: any) => ({
          ...prev,
          pendingTeacherIds: newPendingTeacherIds
        }));
        alert("Đã gửi lời mời cho đồng nghiệp.");
      } else {
        const newPendingIds = Array.from(new Set([...currentPendingIds, userUid]));
        await updateDoc(classRef, {
          pendingStudentIds: newPendingIds
        });
        setSelectedClass((prev: any) => ({
          ...prev,
          pendingStudentIds: newPendingIds
        }));
        alert("Đã gửi lời mời cho học sinh.");
      }
      
      setStudentIdToAdd('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${selectedClass.id}`);
      alert("Lỗi khi thêm người dùng.");
    } finally {
      setIsAddingStudent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-black text-slate-900">Quản lý lớp học</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Class List & Create */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tạo lớp mới
              </h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Tên lớp (VD: 12A1)" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang tạo...' : 'Tạo lớp'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                Danh sách lớp
              </h2>
              <div className="space-y-2">
                {classes.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">Chưa có lớp học nào.</p>
                ) : (
                  classes.map((c) => (
                    <div 
                      key={c.id}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl transition-all font-bold flex items-center justify-between group",
                        selectedClass?.id === c.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <button 
                        onClick={() => setSelectedClass(c)}
                        className="flex-1 text-left"
                      >
                        {c.name}
                        <span className="block text-[10px] opacity-70 font-medium">
                          {c.studentIds?.length || 0} học sinh
                          {c.pendingStudentIds?.length > 0 && ` (${c.pendingStudentIds.length} chờ)`}
                        </span>
                      </button>
                      {(c.teacherId === teacherId || isAdmin) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClassToDeleteConfirm(c);
                          }}
                          className={cn(
                            "p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
                            selectedClass?.id === c.id ? "hover:bg-indigo-700 text-indigo-200 hover:text-white" : "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          )}
                          title="Xóa lớp học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Class Details */}
          <div className="lg:col-span-2 relative">
            <AnimatePresence>
              {studentToKick && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 bottom-0 z-50 p-6 bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] border border-slate-700 shadow-2xl m-4"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-3">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold mb-1">Xác nhận mời ra khỏi lớp?</h4>
                    <p className="text-slate-400 text-xs mb-4">Học sinh này sẽ không còn trong danh sách lớp của bạn.</p>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => handleKickStudent(studentToKick)}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-50"
                      >
                        {isLoading ? 'Đang thực hiện...' : 'Mời ra khỏi lớp'}
                      </button>
                      <button 
                        onClick={() => setStudentToKick(null)}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-600 transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Class Deletion Confirmation inside ClassManagement */}
            <AnimatePresence>
              {classToDeleteConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 bottom-0 z-50 p-6 bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] border border-slate-700 shadow-2xl m-4"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-3">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold mb-1">Xóa lớp "{classToDeleteConfirm.name}"?</h4>
                    <p className="text-slate-400 text-xs mb-4">Hành động này không thể hoàn tác và lớp học sẽ bị xóa vĩnh viễn.</p>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={async () => {
                          setIsDeletingClassInModal(true);
                          try {
                            await deleteDoc(doc(db, 'classes', classToDeleteConfirm.id));
                            if (selectedClass?.id === classToDeleteConfirm.id) setSelectedClass(null);
                            setClassToDeleteConfirm(null);
                          } catch (err: any) {
                            console.error("Lỗi xóa lớp:", err);
                          } finally {
                            setIsDeletingClassInModal(false);
                          }
                        }}
                        disabled={isDeletingClassInModal}
                        className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isDeletingClassInModal ? 'Đang xóa...' : 'Xác nhận xóa lớp'}
                      </button>
                      <button 
                        onClick={() => setClassToDeleteConfirm(null)}
                        disabled={isDeletingClassInModal}
                        className="flex-1 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-600 transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedClass ? (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900">Lớp: {selectedClass.name}</h2>
                    {isAdmin && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                        Toàn quyền Admin
                      </span>
                    )}
                    {(selectedClass.teacherId === teacherId || isAdmin) && (
                      <button 
                        onClick={() => setClassToDeleteConfirm(selectedClass)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                        title="Xóa lớp học này"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleAddStudent} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Mã số HS/GV (VD: HS-000001)" 
                      value={studentIdToAdd}
                      onChange={(e) => setStudentIdToAdd(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm w-48"
                    />
                    <button 
                      type="submit"
                      disabled={isAddingStudent}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Thêm
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  {coTeachersInClass.length > 0 && (
                    <>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Đồng nghiệp</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coTeachersInClass.map((ct) => (
                          <div key={`coteacher-${ct.id}`} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <img 
                                src={ct.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ct.email}`} 
                                alt="Avatar" 
                                className="w-10 h-10 rounded-xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-slate-900">{ct.displayName || 'Giáo viên'}</p>
                                <p className="text-[10px] font-mono font-bold text-indigo-600">{ct.userCode}</p>
                              </div>
                            </div>
                            {selectedClass.teacherId === teacherId && (
                              <button 
                                onClick={() => handleRemoveCoTeacher(ct.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                                title="Xóa đồng nghiệp"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Danh sách học sinh</h3>
                  {(studentsInClass.length === 0 && pendingStudentsInClass.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Users className="w-12 h-12 mb-2 opacity-20" />
                      <p>Chưa có học sinh nào trong lớp này.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Joined Students */}
                      {studentsInClass.map((s) => (
                        <div key={`joined-${s.id}`} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <img 
                              src={s.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.email}`} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-xl object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{s.displayName || 'Chưa đặt tên'}</p>
                              <p className="text-[10px] font-mono font-bold text-indigo-600">{s.userCode}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setViewingStudentResult(s)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Xem đánh giá"
                            >
                              <BarChart3 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setStudentToKick(s.id)}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                              title="Mời ra khỏi lớp"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Pending Students */}
                      {pendingStudentsInClass.map((s) => (
                        <div key={`pending-${s.id}`} className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-between group">
                          <div className="flex items-center gap-3 opacity-60">
                            <img 
                              src={s.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.email}`} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-xl object-cover grayscale"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-slate-700">{s.displayName || 'Chưa đặt tên'}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase">Đang chờ</span>
                                <p className="text-[10px] font-mono font-bold text-slate-400">{s.userCode}</p>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCancelInvite(s.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                            title="Hủy lời mời"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-slate-400 min-h-[500px]">
                <ClipboardList className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium">Chọn một lớp học để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Result Modal */}
      <AnimatePresence>
        {viewingStudentResult && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingStudentResult(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Báo cáo chi tiết: {viewingStudentResult.displayName}</h2>
                    <p className="text-xs font-bold text-slate-500">{viewingStudentResult.userCode}</p>
                  </div>
                </div>
                <button onClick={() => setViewingStudentResult(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Report Details */}
                  <div className="space-y-6">
                    {viewingStudentResult.lastResult ? (
                      <div className="space-y-6">
                        {/* Tabs Navigation */}
                        <div className="flex gap-4 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
                          {[
                            { id: 'profile', label: 'Hồ sơ năng lực', icon: User },
                            { id: 'careers', label: 'Gợi ý nghề nghiệp', icon: Briefcase },
                            { id: 'roadmap', label: 'Lộ trình phát triển', icon: Target },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                activeTab === tab.id 
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                  : "text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              <tab.icon className="w-3.5 h-3.5" />
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                                <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Nhóm tính cách (MBTI)</h5>
                                <p className="text-xl font-black text-amber-900">{viewingStudentResult.lastResult.mbti || 'N/A'}</p>
                              </div>
                              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                                <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Mã Holland</h5>
                                <p className="text-xl font-black text-rose-900">{viewingStudentResult.lastResult.holland || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                              <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                Kết quả học tập (GPA)
                                <span className="text-blue-600 font-black">{viewingStudentResult.lastResult.gpa || '0.0'}</span>
                              </h5>
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                {viewingStudentResult.lastResult.subjects && Object.entries(viewingStudentResult.lastResult.subjects).map(([sub, val]: any) => (
                                  <div key={sub} className="bg-white/60 p-2 rounded-lg text-center border border-blue-100">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{sub}</p>
                                    <p className="text-sm font-black text-blue-700">{val}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Heart className="w-4 h-4 text-rose-500" /> Sở thích & Đam mê:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {(viewingStudentResult.lastResult.interests || viewingStudentResult.lastResult.assessmentData?.interests)?.map((interest: string, idx: number) => (
                                  <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">
                                <BrainCircuit className="w-4 h-4 text-indigo-600" /> Tóm tắt phân tích
                              </h4>
                              <p className="text-sm text-slate-600 leading-relaxed italic">
                                "{viewingStudentResult.lastResult.summary || viewingStudentResult.lastResult.overallSummary}"
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Careers Tab */}
                        {activeTab === 'careers' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            {!viewingStudentResult.lastResult.topCareers ? (
                              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Dữ liệu chi tiết chưa có cho bài đánh giá này.</p>
                              </div>
                            ) : (
                              viewingStudentResult.lastResult.topCareers.map((career: any, idx: number) => (
                                <div 
                                  key={idx}
                                  onClick={() => { setLocalCareerIndex(idx); setActiveTab('roadmap'); }}
                                  className="group p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-600 transition-all cursor-pointer relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-12 -mt-12 rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{career.name}</h4>
                                      <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                        {career.startingSalary} • {career.demandForecast}
                                      </div>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black">
                                      {career.matchPercentage}%
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                                    {career.reason}
                                  </p>
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex gap-1.5">
                                      {career.admissionSubjects?.slice(0, 3).map((sub: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold">
                                          {sub}
                                        </span>
                                      ))}
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1">
                                      Xem lộ trình <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </motion.div>
                        )}

                        {/* Roadmap Tab */}
                        {activeTab === 'roadmap' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                          >
                            {!viewingStudentResult.lastResult.topCareers ? (
                              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Dữ liệu lộ trình chưa được khởi tạo.</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Career Selector if multiple exist */}
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
                                  {viewingStudentResult.lastResult.topCareers.map((c: any, i: number) => (
                                    <button
                                      key={i}
                                      onClick={() => setLocalCareerIndex(i)}
                                      className={cn(
                                        "flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                                        localCareerIndex === i 
                                          ? "bg-white text-indigo-600 shadow-sm" 
                                          : "text-slate-500 hover:text-slate-700"
                                      )}
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                </div>

                                <div className="space-y-4 relative pl-4 border-l-2 border-indigo-100">
                                  {viewingStudentResult.lastResult.topCareers[localCareerIndex].roadmap.map((step: any, idx: number) => (
                                    <div key={idx} className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="absolute -left-[25px] top-6 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 z-10" />
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{step.period}</span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest leading-none flex flex-col items-center">
                                          <span>{step.salary}</span>
                                          {step.salary.includes('VNĐ') && <span className="text-[7px] font-black tracking-tighter -mt-0.5 uppercase">Mức lương</span>}
                                        </span>
                                      </div>
                                      <h5 className="font-black text-slate-800 mb-2">{step.title}</h5>
                                      <ul className="space-y-2 mb-4">
                                        {step.goals.map((goal: string, gidx: number) => (
                                          <li key={gidx} className="flex items-start gap-2 text-[11px] text-slate-600">
                                            <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                            {goal}
                                          </li>
                                        ))}
                                      </ul>
                                      <div className="flex flex-wrap gap-1.5">
                                        {step.hardSkills.map((skill: string, sidx: number) => (
                                          <span key={sidx} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-bold border border-slate-100">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
                        <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium text-center px-6">Học sinh chưa hoàn thành bài đánh giá nghề nghiệp.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Feedback/Chat Box */}
                  <div className="flex flex-col h-full min-h-[500px] border-l border-slate-100 pl-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4" /> Nhận xét & Trao đổi
                      </h4>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                        {feedbacks.length} tin nhắn
                      </span>
                    </div>

                    <div className="flex-1 bg-slate-50/50 rounded-2xl overflow-hidden flex flex-col border border-slate-100">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {feedbacks.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                            <Plus className="w-8 h-8" />
                            <p className="text-xs text-center px-10">Chưa có nhận xét nào. Hãy bắt đầu trao đổi với học sinh.</p>
                          </div>
                        ) : (
                          feedbacks.map((f, i) => (
                            <div 
                              key={f.id} 
                              className={cn(
                                "flex flex-col max-w-[85%]",
                                f.senderId === auth.currentUser?.uid ? "ml-auto items-end" : "items-start"
                              )}
                            >
                              <div className={cn(
                                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                f.senderId === auth.currentUser?.uid 
                                  ? "bg-indigo-600 text-white shadow-md rounded-tr-none" 
                                  : "bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none"
                              )}>
                                {f.text}
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 font-bold px-1 uppercase tracking-tighter">
                                {f.senderId === auth.currentUser?.uid ? "Bạn" : f.senderName} • {f.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative">
                          <textarea 
                            rows={3}
                            value={newFeedback}
                            onChange={(e) => setNewFeedback(e.target.value)}
                            placeholder="Viết nhận xét hoặc lời khuyên..."
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-sm resize-none"
                          />
                          <button 
                            onClick={handleSendFeedback}
                            disabled={isSendingFeedback || !newFeedback.trim()}
                            className="absolute bottom-3 right-3 p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale"
                          >
                            {isSendingFeedback ? (
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (email: string, role: string) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [step, setStep] = useState<'role' | 'email' | 'verification'>('role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError("Vui lòng nhập Email để đặt lại mật khẩu.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      alert(`Link đặt lại mật khẩu đã được gửi đến ${trimmedEmail}. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam).`);
      setAuthError(null);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      if (error.code === 'auth/user-not-found') {
        setAuthError("Email này chưa được đăng ký.");
      } else {
        setAuthError(error.message || "Không thể gửi email đặt lại mật khẩu.");
      }
    }
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = email.trim();
    const trimmedDisplayName = displayName.trim();

    // Check if logging in as Admin JuzJackie
    const isAdminAccount = 
      rawInput.toLowerCase() === 'juzjackie' || 
      rawInput.toLowerCase() === 'juzjackie.admin@gmail.com' ||
      rawInput.toLowerCase() === 'juzjackie@admin.com';

    if (!selectedRole && !isAdminAccount) {
      setAuthError("Vui lòng chọn vai trò trước khi tiếp tục.");
      return;
    }

    if (!rawInput) {
      setAuthError("Vui lòng nhập Email hoặc Tên đăng nhập.");
      return;
    }

    let authEmail = rawInput;
    if (isAdminAccount) {
      authEmail = rawInput.includes('@') ? rawInput : 'juzjackie.admin@gmail.com';
    } else {
      if (!validateEmail(rawInput)) {
        setAuthError("Email không hợp lệ. Vui lòng kiểm tra lại.");
        return;
      }

      if (emailMode === 'register' && !rawInput.toLowerCase().endsWith("@gmail.com")) {
        setAuthError("Không tìm thấy Gmail, vui lòng kiểm tra lại.");
        return;
      }
    }

    setIsLoading(true);
    setAuthError(null);

    // Validate password length for registration
    if (password.length < 6) {
      setAuthError("Mật khẩu phải chứa tối thiểu 6 ký tự!");
      setIsLoading(false);
      return;
    }
    
    try {
      if (emailMode === 'register' && !isAdminAccount) {
        // Call backend to send OTP via Nodemailer
        const response = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail }),
        });

        const result = await response.json();
        if (!response.ok) {
          if (result.error && (result.error.includes("recipient") || result.error.includes("invalid") || result.error.includes("not found"))) {
            throw new Error("Không tìm thấy Gmail, vui lòng kiểm tra lại.");
          }
          throw new Error(result.error || "Lỗi gửi mã OTP");
        }

        alert(`Mã xác minh đã được gửi đến email ${authEmail}. Vui lòng kiểm tra hộp thư.`);
        setStep('verification');
      } else {
        // Login flow
        let user;
        let roleToUse: string = isAdminAccount ? 'admin' : (selectedRole || 'student');
        let userCode = isAdminAccount ? 'AD-000001' : null;

        try {
          const result = await signInWithEmailAndPassword(auth, authEmail, password);
          user = result.user;
        } catch (signInErr: any) {
          // If admin JuzJackie account does not exist in Firebase Auth yet, auto-provision with 'admin1234'
          if (isAdminAccount && password === 'admin1234' && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
            try {
              const createRes = await createUserWithEmailAndPassword(auth, authEmail, 'admin1234');
              user = createRes.user;
              await updateProfile(user, { displayName: 'JuzJackie' });
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                throw new Error("Mật khẩu không chính xác.");
              }
              throw createErr;
            }
          } else {
            throw signInErr;
          }
        }

        const userRef = doc(db, 'users', user.uid);
        let userSnap = await getDoc(userRef);
        const existingData = userSnap.exists() ? userSnap.data() : null;
        
        // CHECK IF ACCOUNT HAS BEEN LOCKED / BANNED
        if (existingData?.isBanned) {
          await signOut(auth);
          setAuthError("Tài khoản của bạn đã bị khoá.");
          setIsLoading(false);
          return;
        }

        const isUserAdmin = 
          isAdminAccount || 
          user.email?.toLowerCase() === 'juzjackie.admin@gmail.com' || 
          user.email?.toLowerCase() === 'juzjackie@admin.com' ||
          existingData?.role === 'admin';

        if (isUserAdmin) {
          roleToUse = 'admin';
          userCode = existingData?.userCode || 'AD-000001';
        } else if (existingData?.role) {
          roleToUse = existingData.role;
          userCode = existingData.userCode;
        }

        if (!userCode) {
          const { code, role } = await generateUserCode(roleToUse, user.email);
          userCode = code;
          if (!isUserAdmin) roleToUse = role;
        }

        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || (isUserAdmin ? 'JuzJackie' : (existingData?.displayName || trimmedDisplayName || 'Giáo viên')),
          role: roleToUse,
          userCode: userCode,
          lastLogin: serverTimestamp(),
        }, { merge: true });

        onLogin(user.displayName || (isUserAdmin ? 'JuzJackie' : (user.email || 'User')), roleToUse);
        onClose();
        resetModal();
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      const errorCode = error.code || "";
      const errorMessage = error.message || "";

      if (errorCode === 'auth/invalid-credential' || errorMessage.includes('invalid-credential')) {
        setAuthError("Email/Tên đăng nhập hoặc mật khẩu không chính xác.");
      } else if (errorCode === 'auth/user-not-found') {
        setAuthError("Tài khoản không tồn tại.");
      } else if (errorCode === 'auth/wrong-password') {
        setAuthError("Mật khẩu không chính xác.");
      } else if (errorMessage.toLowerCase().includes('pattern') || errorMessage.includes('expected pattern')) {
        setAuthError("Dữ liệu nhập vào chưa đúng định dạng. Vui lòng kiểm tra lại.");
      } else {
        setAuthError(errorMessage || "Đã có lỗi xảy ra.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setAuthError("Vui lòng chọn vai trò trước khi tiếp tục.");
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      let userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : null;

      // Check if account has been locked / banned
      if (existingData?.isBanned) {
        await signOut(auth);
        setAuthError("Tài khoản của bạn đã bị khoá.");
        setIsLoading(false);
        return;
      }
      
      let roleToUse: string = selectedRole;
      let userCode = null;

      if (existingData) {
        if (existingData.role) roleToUse = existingData.role;
        userCode = existingData.userCode;
      }

      if (!userCode) {
        const { code, role } = await generateUserCode(roleToUse, user.email);
        userCode = code;
        roleToUse = role;
      }

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName,
        photoURL: user.photoURL,
        role: roleToUse,
        userCode: userCode,
        lastLogin: serverTimestamp(),
      }, { merge: true });

      onLogin(user.email || 'User', roleToUse);
      onClose();
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setAuthError(error.message || "Đã có lỗi xảy ra khi đăng nhập bằng Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();
    if (!selectedRole || !trimmedEmail) return;
    
    setIsVerifying(true);
    setAuthError(null);
    
    if (!inputCode || inputCode.length !== 6) {
      setAuthError("Vui lòng nhập mã OTP gồm 6 chữ số.");
      setIsVerifying(false);
      return;
    }
    
    try {
      // Verify OTP with backend
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, otp: inputCode }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Mã xác minh không chính xác");
      }

      // OTP verified, now create Firebase user
      setIsLoading(true);
      try {
        const authResult = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = authResult.user;
        await updateProfile(user, { displayName: trimmedDisplayName });

        const userRef = doc(db, 'users', user.uid);
        const { code, role } = await generateUserCode(selectedRole, user.email);

        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || trimmedDisplayName,
          role: role,
          userCode: code,
          lastLogin: serverTimestamp(),
        }, { merge: true });

        onLogin(user.email || 'User', role);
        onClose();
      } catch (fbError: any) {
        if (fbError.code === 'auth/email-already-in-use') {
          throw new Error("Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.");
        }
        throw fbError;
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      setAuthError(error.message || "Xác minh thất bại.");
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('role');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAuthError(null);
    setInputCode('');
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={() => { onClose(); resetModal(); }}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 'role' && (
              <motion.div
                key="role-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mx-auto mb-6">
                    <Compass className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Chào mừng bạn</h2>
                  <p className="text-slate-500">Vui lòng chọn vai trò của bạn để tiếp tục</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => { setSelectedRole('student'); setStep('email'); }}
                    className="group relative p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left flex items-center gap-4 active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Tôi là Học sinh</h3>
                      <p className="text-slate-500 text-xs">Khám phá lộ trình nghề nghiệp</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => { setSelectedRole('teacher'); setStep('email'); }}
                    className="group relative p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-violet-600 hover:bg-violet-50/50 transition-all text-left flex items-center gap-4 active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Tôi là Giáo viên</h3>
                      <p className="text-slate-500 text-xs">Hỗ trợ định hướng cho học sinh</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'email' && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setStep('role')}
                  className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 text-sm font-bold mb-6 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-1">
                    {emailMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {emailMode === 'login' ? 'Nhập thông tin tài khoản của bạn' : 'Tạo tài khoản mới để bắt đầu'}
                  </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {emailMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                      Email hoặc Tên đăng nhập
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com hoặc tên đăng nhập"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
                      {emailMode === 'login' && (
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                          Bạn quên mật khẩu?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-sm"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {emailMode === 'register' && (
                      <p className="text-[10px] text-slate-500 mt-1.5 ml-1 italic">
                        *Vui lòng đặt mật khẩu chứa tối thiểu 6 ký tự*
                      </p>
                    )}
                  </div>

                  {authError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                      <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 font-medium leading-relaxed">{authError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 mt-4 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                      </div>
                    ) : (
                      emailMode === 'login' ? 'Đăng nhập' : 'Đăng ký ngay'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    {emailMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button 
                      onClick={() => setEmailMode(emailMode === 'login' ? 'register' : 'login')}
                      className="ml-1.5 text-indigo-600 font-bold hover:underline"
                    >
                      {emailMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'verification' && (
              <motion.div
                key="verification-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setStep('email')}
                  className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 text-sm font-bold mb-6 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Xác minh Email</h2>
                  <p className="text-slate-500 text-sm">
                    Chúng tôi đã gửi mã xác minh đến <span className="font-bold text-slate-900">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã xác minh (6 chữ số)</label>
                    <input 
                      type="text"
                      required
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => {
                        setAuthError(null);
                        setInputCode(e.target.value.replace(/\D/g, ''));
                      }}
                      placeholder="000000"
                      className="w-full text-center text-3xl tracking-[1em] font-black py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                    />
                  </div>

                  {authError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-shake">
                      <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-rose-600 font-medium leading-relaxed">{authError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifying || inputCode.length !== 6}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Đang xác minh...
                      </div>
                    ) : (
                      'Xác nhận & Đăng ký'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Không nhận được mã? 
                    <button 
                      onClick={handleEmailAuth}
                      className="ml-1.5 text-indigo-600 font-bold hover:underline"
                    >
                      Gửi lại mã
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của LQĐ Future.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface AssessmentTagInputProps {
  tags: string[];
  maxTags?: number;
  placeholder: string;
  maxPlaceholder: string;
  focusRingClass?: string;
  onAddTag: (tag: string) => void;
  disabled?: boolean;
}

const AssessmentTagInput: React.FC<AssessmentTagInputProps> = ({
  tags,
  maxTags = 3,
  placeholder,
  maxPlaceholder,
  focusRingClass = "focus:ring-2 focus:ring-indigo-500",
  onAddTag,
  disabled = false
}) => {
  const [value, setValue] = useState("");
  const isComposingRef = useRef(false);
  const pendingCommitRef = useRef(false);

  const commitValue = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setValue("");
      return;
    }
    if (tags.length >= maxTags) {
      setValue("");
      return;
    }
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const exists = tags.some(t => t.trim().toLowerCase() === capitalized.toLowerCase());
    if (!exists) {
      onAddTag(capitalized);
    }
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Nếu đang gõ tiếng Việt (Telex/VNI - bộ gõ đang ghép âm/dấu)
      if (e.nativeEvent.isComposing || (e as any).keyCode === 229) {
        pendingCommitRef.current = true;
        return;
      }
      commitValue(value);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    if (pendingCommitRef.current) {
      pendingCommitRef.current = false;
      commitValue(e.currentTarget.value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.endsWith(',')) {
      const tag = text.slice(0, -1);
      commitValue(tag);
      return;
    }
    setValue(text);
  };

  const handleBlur = () => {
    if (!isComposingRef.current && value.trim()) {
      commitValue(value);
    }
  };

  return (
    <input 
      type="text" 
      value={value}
      disabled={disabled || tags.length >= maxTags}
      placeholder={tags.length >= maxTags ? maxPlaceholder : placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      className={cn(
        "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        focusRingClass
      )}
    />
  );
};

export default function App() {
  const [step, setStep] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [bannedModalMessage, setBannedModalMessage] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [teacherInvites, setTeacherInvites] = useState<any[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [initialClassId, setInitialClassId] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<any | null>(null);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  const effectiveRole = userRole;

  const handleDeleteClass = async () => {
    if (!classToDelete || !auth.currentUser) return;
    const isSuperAdmin = userRole === 'admin' || currentUserData?.role === 'admin' || auth.currentUser.email?.toLowerCase().includes('juzjackie');
    if (classToDelete.teacherId !== auth.currentUser.uid && !isSuperAdmin) {
      setClassToDelete(null);
      return;
    }

    setIsDeletingClass(true);
    try {
      await deleteDoc(doc(db, 'classes', classToDelete.id));
      setClassToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classes/${classToDelete.id}`);
    } finally {
      setIsDeletingClass(false);
    }
  };

  // Fetch pending invites for student
  useEffect(() => {
    if (isLoggedIn && userRole === 'student' && auth.currentUser) {
      const q = query(
        collection(db, 'classes'), 
        where('pendingStudentIds', 'array-contains', auth.currentUser.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const invitesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingInvites(invitesList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      });
      return () => unsubscribe();
    } else {
      setPendingInvites([]);
    }
  }, [isLoggedIn, userRole]);

  // Fetch pending invites for teacher
  useEffect(() => {
    if (isLoggedIn && userRole === 'teacher' && auth.currentUser) {
      const q = query(
        collection(db, 'classes'), 
        where('pendingTeacherIds', 'array-contains', auth.currentUser.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const invitesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherInvites(invitesList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      });
      return () => unsubscribe();
    } else {
      setTeacherInvites([]);
    }
  }, [isLoggedIn, userRole]);

  // Fetch teacher classes (or all classes for admin)
  useEffect(() => {
    if (isLoggedIn && (userRole === 'teacher' || userRole === 'admin') && auth.currentUser) {
      const q = userRole === 'admin'
        ? collection(db, 'classes')
        : query(
            collection(db, 'classes'), 
            or(where('teacherId', '==', auth.currentUser.uid), where('coTeacherIds', 'array-contains', auth.currentUser.uid))
          );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherClasses(classesList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      });
      return () => unsubscribe();
    } else {
      setTeacherClasses([]);
    }
  }, [isLoggedIn, userRole]);

  const handleAcceptInvite = async (classId: string) => {
    if (!auth.currentUser) return;
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      if (!classDoc.exists()) return;
      
      const data = classDoc.data();
      const updatedStudentIds = Array.from(new Set([...(data.studentIds || []), auth.currentUser.uid]));
      const updatedPendingIds = (data.pendingStudentIds || []).filter((id: string) => id !== auth.currentUser.uid);
      
      await updateDoc(classRef, {
        studentIds: updatedStudentIds,
        pendingStudentIds: updatedPendingIds
      });
      alert("Đã chấp nhận lời mời vào lớp!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      alert("Lỗi khi chấp nhận lời mời.");
    }
  };

  const handleDeclineInvite = async (classId: string) => {
    if (!auth.currentUser) return;
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      if (!classDoc.exists()) return;
      
      const data = classDoc.data();
      const updatedPendingIds = Array.from(new Set((data.pendingStudentIds || []).filter((id: string) => id !== auth.currentUser.uid)));
      
      await updateDoc(classRef, {
        pendingStudentIds: updatedPendingIds
      });
      alert("Đã từ chối lời mời.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      alert("Lỗi khi từ chối lời mời.");
    }
  };

  const handleAcceptTeacherInvite = async (classId: string) => {
    if (!auth.currentUser) return;
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      if (!classDoc.exists()) return;
      
      const data = classDoc.data();
      const updatedCoTeacherIds = Array.from(new Set([...(data.coTeacherIds || []), auth.currentUser.uid]));
      const updatedPendingIds = (data.pendingTeacherIds || []).filter((id: string) => id !== auth.currentUser.uid);
      
      await updateDoc(classRef, {
        coTeacherIds: updatedCoTeacherIds,
        pendingTeacherIds: updatedPendingIds
      });
      alert("Đã chấp nhận lời mời làm đồng nghiệp!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      alert("Lỗi khi chấp nhận lời mời.");
    }
  };

  const handleDeclineTeacherInvite = async (classId: string) => {
    if (!auth.currentUser) return;
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      if (!classDoc.exists()) return;
      
      const data = classDoc.data();
      const updatedPendingIds = Array.from(new Set((data.pendingTeacherIds || []).filter((id: string) => id !== auth.currentUser.uid)));
      
      await updateDoc(classRef, {
        pendingTeacherIds: updatedPendingIds
      });
      alert("Đã từ chối lời mời.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}`);
      alert("Lỗi khi từ chối lời mời.");
    }
  };

  const [loading, setLoading] = useState(false);
  const [teacherFeedbacks, setTeacherFeedbacks] = useState<any[]>([]);
  const [studentReply, setStudentReply] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    if (isLoggedIn && auth.currentUser && userRole === 'student') {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'feedbacks'),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherFeedbacks(list);
      });
      return () => unsubscribe();
    }
  }, [isLoggedIn, userRole]);

  const handleSendReply = async () => {
    if (!studentReply.trim() || !auth.currentUser) return;
    setIsSendingReply(true);
    try {
      const feedbacksRef = collection(db, 'users', auth.currentUser.uid, 'feedbacks');
      await addDoc(feedbacksRef, {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Học sinh',
        text: studentReply,
        timestamp: serverTimestamp(),
        isTeacher: false
      });
      setStudentReply("");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Refs for scroll containers
  const homeContainerRef = React.useRef<HTMLDivElement>(null);
  const rankingContainerRef = React.useRef<HTMLDivElement>(null);
  const dictionaryContainerRef = React.useRef<HTMLDivElement>(null);
  const aboutContainerRef = React.useRef<HTMLDivElement>(null);

  const [data, setData] = useState<AssessmentData>({
    gpa: 8.0,
    subjects: { 
      math: null, 
      literature: null, 
      english: null,
      physics: -1,
      chemistry: -1,
      biology: -1,
      history: -1,
      geography: -1,
      civics: -1,
      informatics: -1
    },
    mbti: '',
    holland: [],
    interests: [],
    passions: [],
    strengths: [],
    weaknesses: [],
    coreMotivations: [],
    softSkills: [],
    preferredRegion: [],
    preferredFinancial: [],
    origin: 'vietnam',
    internationalCertificates: '',
  });
  const [result, setResult] = useState<CareerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedWiki, setExpandedWiki] = useState<number | null>(null);
  const [selectedCareerIndex, setSelectedCareerIndex] = useState(0);

  // Chat State
  const chatRef = React.useRef<any>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const gpaRef = React.useRef<HTMLInputElement>(null);
  const subjectRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const nextStepButtonRef = React.useRef<HTMLButtonElement>(null);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || 'User');
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserRole(null);
        setCurrentUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserRole(data.role);
        setCurrentUserData(data);
      }
    }, (error) => {
      // Only report if still logged in to avoid race condition errors on logout
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && currentUserData && auth.currentUser) {
      // Check for ban status
      if (currentUserData.isBanned) {
        setBannedModalMessage("Tài khoản của bạn đã bị khoá.");
        handleLogout();
        return;
      }

      // Ensure admin account always has admin role and AD code
      const isAdminEmail = auth.currentUser.email === 'juzjackie.admin@gmail.com' || auth.currentUser.email === 'juzjackie@admin.com';
      const needsFix = !currentUserData.userCode || (isAdminEmail && currentUserData.role !== 'admin');

      if (needsFix) {
        const fixUserData = async () => {
          try {
            let roleToUse = currentUserData.role || 'student';
            if (isAdminEmail || currentUserData.role === 'admin') {
              roleToUse = 'admin';
            }
            const { code, role } = await generateUserCode(roleToUse, auth.currentUser!.email);
            
            await setDoc(doc(db, 'users', auth.currentUser!.uid), { 
              userCode: (isAdminEmail || roleToUse === 'admin') ? (currentUserData.userCode || 'AD-000001') : code,
              role: roleToUse 
            }, { merge: true });
          } catch (error) {
            console.error("Error fixing user data:", error);
          }
        };
        fixUserData();
      }
    }
  }, [isLoggedIn, currentUserData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    if (pendingFocusIndex !== null) {
      const input = subjectRefs.current[pendingFocusIndex];
      if (input) {
        input.focus();
        setPendingFocusIndex(null);
      }
    }
  }, [pendingFocusIndex, data.subjects]);

  useEffect(() => {
    if (homeContainerRef.current) {
      homeContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, result]);

  useEffect(() => {
    if (result && data) {
      chatRef.current = createCounselorChat(data, result);
      setChatMessages([{ role: 'model', text: 'Chào bạn, tôi là chuyên gia AI. Bạn có câu hỏi nào về kết quả đánh giá, lộ trình sự nghiệp hay các trường đại học được gợi ý không?' }]);
    }
  }, [result, data]);

  useEffect(() => {
    // Only scroll the internal chat container, not the whole window
    if (chatMessages.length > 1 && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      const lastMessageIsUser = chatMessages[chatMessages.length - 1].role === 'user';

      if (isNearBottom || lastMessageIsUser) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatRef.current) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, đã có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRoleplay = async (careerName: string) => {
    if (!chatRef.current) return;
    
    // Scroll to chatbot
    const chatElement = document.getElementById('ai-counselor');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    }

    const roleplayMsg = `Hãy đóng vai sếp của tôi trong ngành ${careerName}. Hãy đưa ra một tình huống/bài toán khó khăn thực tế mà tôi phải giải quyết trong ngày làm việc đầu tiên, và cho tôi 3 hướng giải quyết để tôi chọn.`;
    
    setChatMessages(prev => [...prev, { role: 'user', text: `🎮 [Trải nghiệm thử nghề] ${careerName}` }]);
    setIsChatLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: roleplayMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, đã có lỗi xảy ra khi bắt đầu mô phỏng. Vui lòng thử lại sau.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetNavigation = () => {
    setShowAbout(false);
    setShowHistory(false);
    setShowDictionary(false);
    setShowRanking(false);
    setShowCertificates(false);
    setShowStats(false);
    setShowClassManagement(false);
    setShowAdminDashboard(false);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setSelectedCareerIndex(0);
    setStep(STEPS.length - 1); // Move to results step
    
    try {
      const resultData = await analyzeCareer(data);
      setResult(resultData);
      
      // Save result to user profile for teacher visibility
      if (auth.currentUser && resultData.topCareers && resultData.topCareers.length > 0) {
        const topCareer = resultData.topCareers[0];
        const userRef = doc(db, 'users', auth.currentUser.uid);
        try {
          await updateDoc(userRef, {
            lastResult: {
              careerName: topCareer.name,
              matchPercentage: topCareer.matchPercentage,
              summary: resultData.overallSummary,
              reasons: [topCareer.reason],
              mbti: data.mbti,
              holland: data.holland.join(', '),
              gpa: data.gpa,
              interests: data.interests,
              subjects: data.subjects,
              timestamp: serverTimestamp(),
              // Additional fields for full teacher visibility
              topCareers: resultData.topCareers,
              contingencyPlans: resultData.contingencyPlans,
              skillsToDevelop: resultData.skillsToDevelop,
              overallSummary: resultData.overallSummary,
              assessmentData: data
            }
          });

          // Add to history
          const historyRef = collection(db, 'users', auth.currentUser.uid, 'history');
          await addDoc(historyRef, {
            careerName: topCareer.name,
            matchPercentage: topCareer.matchPercentage,
            summary: resultData.overallSummary,
            answers: data,
            fullResult: resultData,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        }
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Rất tiếc, đã có lỗi xảy ra trong quá trình phân tích. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const generatePDFInstance = async (): Promise<jsPDF | null> => {
    const pages = [
      document.getElementById('pdf-page-1'),
      document.getElementById('pdf-page-2'),
      document.getElementById('pdf-page-3'),
      document.getElementById('pdf-page-4'),
    ];
    
    if (pages.some(p => !p)) {
      return null;
    }
    
    // Small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    for (let i = 0; i < pages.length; i++) {
      const element = pages[i] as HTMLElement;
      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: 0.8,
        pixelRatio: 1.5,
        backgroundColor: '#ffffff',
        width: 800,
      });

      if (i > 0) {
        pdf.addPage();
      }

      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);
      
      const imgWidth = pdfWidth;
      const imgHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidth, imgHeight);
    }

    return pdf;
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] font-bold flex items-center gap-3 animate-bounce';
    toast.innerHTML = '<svg class="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tải file và gửi email...';
    document.body.appendChild(toast);

    try {
      const pdf = await generatePDFInstance();
      if (!pdf) {
        alert("Không tìm thấy dữ liệu báo cáo. Vui lòng thử lại sau giây lát.");
        document.body.removeChild(toast);
        return;
      }

      // 1. Download locally
      pdf.save('dinh_huong_nghe_nghiep.pdf');
      
      // 2. Convert to Base64
      const pdfBase64 = pdf.output('datauristring');

      // 3. Send to backend
      if (userEmail) {
        const response = await fetch('/api/send-pdf-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            pdfBase64: pdfBase64
          }),
        });

        if (response.ok) {
          toast.innerHTML = '<svg class="w-5 h-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Đã tải xong và gửi email thành công!';
          toast.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] font-bold flex items-center gap-3';
        } else {
          let errorMsg = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            // Ignore JSON parse error
          }
          throw new Error(errorMsg);
        }
      }

      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);

    } catch (err) {
      console.error('PDF generation/email error:', err);
      toast.innerHTML = '<svg class="w-5 h-5 text-rose-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Có lỗi xảy ra. Vui lòng thử lại.';
      toast.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] font-bold flex items-center gap-3';
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0 z-50">
        <div className={cn("mx-auto px-4 h-16 flex items-center justify-between relative transition-all duration-500", (step === 5 && !showAbout && !showDictionary) ? "max-w-7xl" : "max-w-7xl")}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setStep(0); resetNavigation(); setIsMobileMenuOpen(false); }}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Hướng nghiệp <span className="text-indigo-600">LQĐ</span></span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            {userRole !== 'teacher' && (
              <>
                <button 
                  onClick={() => { resetNavigation(); setShowDictionary(true); }} 
                  className={cn(
                    "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50",
                    showDictionary ? "border-blue-600 text-blue-600 bg-blue-50" : "text-slate-600"
                  )}
                >
                  Từ điển nghề
                </button>
                <button 
                  onClick={() => { resetNavigation(); setShowCertificates(true); }} 
                  className={cn(
                    "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/50",
                    showCertificates ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "text-slate-600"
                  )}
                >
                  Chứng chỉ quốc tế
                </button>
                <button 
                  onClick={() => { resetNavigation(); setShowStats(true); }} 
                  className={cn(
                    "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/50",
                    showStats ? "border-emerald-600 text-emerald-600 bg-emerald-50" : "text-slate-600"
                  )}
                >
                  Thực trạng sinh viên quốc tế
                </button>
                <button 
                  onClick={() => { resetNavigation(); setShowRanking(true); }} 
                  className={cn(
                    "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-amber-600 hover:text-amber-600 hover:bg-amber-50/50",
                    showRanking ? "border-amber-600 text-amber-600 bg-amber-50" : "text-slate-600"
                  )}
                >
                  Bảng xếp hạng
                </button>
                <button 
                  onClick={() => { resetNavigation(); setShowAbout(true); }} 
                  className={cn(
                    "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/50",
                    showAbout ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "text-slate-600"
                  )}
                >
                  Về chúng tôi
                </button>
                {isLoggedIn && (
                  <button 
                    onClick={() => { resetNavigation(); setShowHistory(true); }} 
                    className={cn(
                      "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/50",
                      showHistory ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "text-slate-600"
                    )}
                  >
                    Lịch sử đánh giá
                  </button>
                )}
              </>
            )}
            {userRole === 'admin' && (
              <button 
                onClick={() => { resetNavigation(); setShowAdminDashboard(true); }} 
                className={cn(
                  "px-4 py-2 border rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-sm",
                  showAdminDashboard 
                    ? "border-amber-500 text-amber-900 bg-amber-100" 
                    : "border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 hover:border-amber-400"
                )}
              >
                <Crown className="w-4 h-4 text-amber-600" />
                Quản trị hệ thống
              </button>
            )}
            {(effectiveRole === 'teacher' || userRole === 'admin') && (
              <button 
                onClick={() => { resetNavigation(); setShowClassManagement(true); }} 
                className={cn(
                  "px-4 py-2 border border-slate-200 rounded-xl transition-all hover:border-violet-600 hover:text-violet-600 hover:bg-violet-50/50",
                  showClassManagement ? "border-violet-600 text-violet-600 bg-violet-50" : "text-slate-600"
                )}
              >
                Quản lý lớp
              </button>
            )}
            <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block" />
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold text-slate-900 leading-none">{currentUserData?.displayName || userEmail.split('@')[0]}</span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md flex items-center gap-1",
                    userRole === 'admin' 
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : effectiveRole === 'teacher' 
                      ? "bg-violet-100 text-violet-600" 
                      : "bg-indigo-100 text-indigo-600"
                  )}>
                    {userRole === 'admin' ? '👑 Admin Toàn Năng' : (effectiveRole === 'teacher' ? 'Giáo viên' : 'Học sinh')}
                  </span>
                </div>
                <button 
                  onClick={() => setShowProfile(true)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border-2 transition-transform hover:scale-110",
                    userRole === 'admin' 
                      ? "border-amber-400 bg-amber-50 text-amber-700" 
                      : effectiveRole === 'teacher' 
                      ? "border-violet-200 bg-violet-50 text-violet-600" 
                      : "border-indigo-200 bg-indigo-50 text-indigo-600"
                  )}
                >
                  {currentUserData?.photoURL ? (
                    <img src={currentUserData.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    userEmail.charAt(0).toUpperCase()
                  )}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <motion.button 
                onClick={() => setShowLogin(true)}
                className="relative px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 overflow-hidden group"
                animate={{
                  y: [0, -2, 0],
                  rotate: [0, -1, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Shimmer effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 1
                  }}
                />
                <span className="relative flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Đăng kí/Đăng nhập
                </span>
              </motion.button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {userRole !== 'teacher' && (
                  <>
                    <button 
                      onClick={() => { resetNavigation(); setShowDictionary(true); setIsMobileMenuOpen(false); }} 
                      className={cn(
                        "px-4 py-3 text-left rounded-xl transition-all font-medium",
                        showDictionary ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Từ điển nghề
                    </button>
                    <button 
                      onClick={() => { resetNavigation(); setShowCertificates(true); setIsMobileMenuOpen(false); }} 
                      className={cn(
                        "px-4 py-3 text-left rounded-xl transition-all font-medium",
                        showCertificates ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Chứng chỉ quốc tế
                    </button>
                    <button 
                      onClick={() => { resetNavigation(); setShowStats(true); setIsMobileMenuOpen(false); }} 
                      className={cn(
                        "px-4 py-3 text-left rounded-xl transition-all font-medium",
                        showStats ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Thực trạng sinh viên quốc tế
                    </button>
                    <button 
                      onClick={() => { resetNavigation(); setShowRanking(true); setIsMobileMenuOpen(false); }} 
                      className={cn(
                        "px-4 py-3 text-left rounded-xl transition-all font-medium",
                        showRanking ? "bg-amber-50 text-amber-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Bảng xếp hạng
                    </button>
                    <button 
                      onClick={() => { resetNavigation(); setShowAbout(true); setIsMobileMenuOpen(false); }} 
                      className={cn(
                        "px-4 py-3 text-left rounded-xl transition-all font-medium",
                        showAbout ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Về chúng tôi
                    </button>
                    {isLoggedIn && (
                      <button 
                        onClick={() => { resetNavigation(); setShowHistory(true); setIsMobileMenuOpen(false); }} 
                        className={cn(
                          "px-4 py-3 text-left rounded-xl transition-all font-medium",
                          showHistory ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Lịch sử đánh giá
                      </button>
                    )}
                  </>
                )}
                {userRole === 'admin' && (
                  <button 
                    onClick={() => { resetNavigation(); setShowAdminDashboard(true); setIsMobileMenuOpen(false); }} 
                    className={cn(
                      "px-4 py-3 text-left rounded-xl transition-all font-bold flex items-center gap-2",
                      showAdminDashboard ? "bg-amber-100 text-amber-900" : "text-amber-900 hover:bg-amber-50"
                    )}
                  >
                    <Crown className="w-4 h-4 text-amber-600" />
                    Quản trị hệ thống (Admin)
                  </button>
                )}
                {(effectiveRole === 'teacher' || userRole === 'admin') && (
                  <button 
                    onClick={() => { resetNavigation(); setShowClassManagement(true); setIsMobileMenuOpen(false); }} 
                    className={cn(
                      "px-4 py-3 text-left rounded-xl transition-all font-medium",
                      showClassManagement ? "bg-violet-50 text-violet-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Quản lý lớp
                  </button>
                )}
                
                <div className="h-px bg-slate-200 my-2" />
                
                {isLoggedIn ? (
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setShowProfile(true); setIsMobileMenuOpen(false); }}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden border-2",
                          userRole === 'admin' 
                            ? "border-amber-400 bg-amber-50 text-amber-700" 
                            : effectiveRole === 'teacher' 
                            ? "border-violet-200 bg-violet-50 text-violet-600" 
                            : "border-indigo-200 bg-indigo-50 text-indigo-600"
                        )}
                      >
                        {currentUserData?.photoURL ? (
                          <img src={currentUserData.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          userEmail.charAt(0).toUpperCase()
                        )}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{currentUserData?.displayName || userEmail.split('@')[0]}</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-md self-start flex items-center gap-1",
                          userRole === 'admin' 
                            ? "bg-amber-100 text-amber-900 border border-amber-300" 
                            : effectiveRole === 'teacher' 
                            ? "bg-violet-100 text-violet-600" 
                            : "bg-indigo-100 text-indigo-600"
                        )}>
                          {userRole === 'admin' ? '👑 Admin Toàn Năng' : (effectiveRole === 'teacher' ? 'Giáo viên' : 'Học sinh')}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setShowLogin(true); setIsMobileMenuOpen(false); }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Đăng kí/Đăng nhập
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {showLogin && (
          <LoginModal 
            isOpen={showLogin} 
            onClose={() => setShowLogin(false)} 
            onLogin={(email, role) => {
              setIsLoggedIn(true);
              setUserEmail(email);
              setUserRole(role);
            }}
          />
        )}

        {showProfile && auth.currentUser && (
          <ProfileModal 
            isOpen={showProfile} 
            onClose={() => setShowProfile(false)} 
            user={auth.currentUser}
            userData={currentUserData}
          />
        )}

        {showClassManagement && auth.currentUser && (
          <ClassManagement 
            onClose={() => { setShowClassManagement(false); setInitialClassId(null); }} 
            teacherId={auth.currentUser.uid} 
            initialClassId={initialClassId}
            isAdmin={userRole === 'admin'}
          />
        )}

        {showAdminDashboard && (
          <AdminDashboard 
            onClose={() => setShowAdminDashboard(false)} 
          />
        )}

        {bannedModalMessage && (
          <div className="fixed inset-0 z-[300] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 text-center relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-rose-200">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{bannedModalMessage}</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Tài khoản này đã bị khoá bởi Quản trị viên. Bạn không thể truy cập vào hệ thống bằng tài khoản này.
              </p>
              <button
                type="button"
                onClick={() => setBannedModalMessage(null)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-200"
              >
                Đã hiểu
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative overflow-hidden">
        {/* Home Section */}
        <div 
          ref={homeContainerRef}
          className={cn(
            "absolute inset-0 overflow-y-auto transition-opacity duration-300",
            (!showAbout && !showDictionary && !showRanking) ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}
        >
          <div className={cn("mx-auto px-4 py-12 transition-all duration-500", (step === 0 || step === 5) && !showAbout && !showDictionary && !showRanking && !showCertificates && !showStats ? "max-w-7xl" : "max-w-4xl")}>
            {!showAbout && !showDictionary && !showRanking && !showCertificates && !showStats && (
              <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <motion.span 
                  className="text-indigo-600 font-bold text-base md:text-lg inline-block"
                  animate={{
                    rotate: [-1, 1, -1],
                    y: [0, -2, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Xin chào! Đây là trang web giúp bạn có thể giúp bạn tìm thấy lối đi trong tương lai.
                </motion.span>
              </div>
            )}
            {!showAbout && !showDictionary && !showRanking && !showCertificates && !showStats && <ProgressBar currentStep={step} />}

            {/* Class Invitations Section */}
            {isLoggedIn && (((userRole === 'student' && pendingInvites.length > 0) || (userRole === 'teacher' && teacherInvites.length > 0))) && step === 0 && !showAbout && !showDictionary && !showRanking && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx("mt-8 mb-4 max-w-2xl mx-auto", userRole === 'teacher' && "order-first")}
              >
                <div className={clsx("border rounded-[2rem] p-6 shadow-sm", userRole === 'teacher' ? "bg-violet-50 border-violet-200" : "bg-amber-50 border-amber-200")}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", userRole === 'teacher' ? "bg-violet-100 text-violet-600" : "bg-amber-100 text-amber-600")}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Lời mời vào lớp học</h3>
                      <p className={clsx("text-xs font-medium", userRole === 'teacher' ? "text-violet-700" : "text-amber-700")}>
                        Bạn có {(userRole === 'teacher' ? teacherInvites : pendingInvites).length} lời mời đang chờ xác nhận
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(userRole === 'teacher' ? teacherInvites : pendingInvites).map((invite) => (
                      <div key={invite.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-800 text-sm">Lớp {invite.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {userRole === 'teacher' ? 'Lời mời làm đồng nghiệp' : 'Từ Giáo viên của bạn'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => userRole === 'teacher' ? handleAcceptTeacherInvite(invite.id) : handleAcceptInvite(invite.id)}
                            className={clsx(
                              "px-4 py-2 text-white rounded-xl text-xs font-black shadow-lg transition-all",
                              userRole === 'teacher' ? "bg-violet-600 shadow-violet-100 hover:bg-violet-700" : "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700"
                            )}
                          >
                            Đồng ý
                          </button>
                          <button 
                            onClick={() => userRole === 'teacher' ? handleDeclineTeacherInvite(invite.id) : handleDeclineInvite(invite.id)}
                            className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Class Deletion Confirmation Overlay */}
            <AnimatePresence>
              {classToDelete && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center"
                  >
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Xóa lớp học?</h3>
                    <p className="text-slate-500 text-sm mb-8">
                      Bạn có chắc muốn xóa lớp <span className="font-bold text-slate-900">"{classToDelete.name}"</span>? 
                      Hành động này không thể hoàn tác và toàn bộ dữ liệu lớp sẽ bị mất.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleDeleteClass}
                        disabled={isDeletingClass}
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                      >
                        {isDeletingClass ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Xác nhận xóa
                      </button>
                      <button 
                        onClick={() => setClassToDelete(null)}
                        disabled={isDeletingClass}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {showAbout && (
                <AboutPage onStart={() => { setShowAbout(false); nextStep(); }} onBack={() => setShowAbout(false)} />
              )}
              {showDictionary && (
                <CareerDictionary onBack={() => setShowDictionary(false)} />
              )}
              {showRanking && (
                <UniversityRanking onBack={() => setShowRanking(false)} />
              )}
              {showCertificates && (
                <CertificatesView onBack={() => setShowCertificates(false)} />
              )}
              {showStats && (
                <InternationalStatsView onBack={() => setShowStats(false)} />
              )}

              {step === 0 && !showAbout && !showDictionary && !showRanking && !showCertificates && !showStats && (
                <div className="max-w-4xl mx-auto">
                  <motion.div 
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-8"
                  >
                    {userRole === 'admin' && (
                      <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20 shrink-0">
                            <Crown className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">Tài khoản Quản trị Toàn Năng</h3>
                              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase rounded-md">Toàn quyền</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Bạn có quyền truy cập, kiểm soát tất cả tài khoản Giáo viên, Học sinh và toàn bộ Lớp học trên hệ thống.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { resetNavigation(); setShowAdminDashboard(true); }}
                          className="px-4 py-2.5 bg-slate-950 text-white hover:bg-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0 w-full sm:w-auto justify-center"
                        >
                          <Crown className="w-4 h-4 text-amber-400" />
                          Mở Bảng Quản Trị
                        </button>
                      </div>
                    )}

                    <div className="space-y-4 relative z-10">
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.2] py-2 selection:bg-indigo-600/20">
                        Khám phá tương lai <br /> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 inline-block py-1 selection:bg-indigo-600/30">
                          Bắt đầu từ chính bạn
                        </span>
                      </h1>
                      <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        LQĐ Future sử dụng trí tuệ nhân tạo để phân tích điểm số, tính cách và đam mê của bạn, 
                        từ đó đưa ra lộ trình nghề nghiệp tối ưu nhất.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      {(userRole === 'teacher' || userRole === 'admin') ? (
                        <>
                          <div 
                            onClick={() => { resetNavigation(); setInitialClassId(null); setShowClassManagement(true); }}
                            className="p-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm hover:border-indigo-600 hover:bg-indigo-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[160px]"
                          >
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Tạo lớp học</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{userRole === 'admin' ? 'Tạo với quyền Admin' : 'Thêm lớp mới'}</p>
                          </div>

                          {teacherClasses.map((c) => (
                            <div 
                              key={c.id}
                              onClick={() => { resetNavigation(); setInitialClassId(c.id); setShowClassManagement(true); }}
                              className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all cursor-pointer text-left group flex flex-col justify-between min-h-[160px]"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <ClipboardList className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {c.teacherId !== auth.currentUser?.uid && (
                                      <span className={cn(
                                        "text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1",
                                        userRole === 'admin' ? "text-amber-700 bg-amber-100" : "text-violet-600 bg-violet-100"
                                      )}>
                                        <Users className="w-2.5 h-2.5" />
                                        {userRole === 'admin' ? 'Lớp hệ thống' : 'Đồng nghiệp'}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                      {c.studentIds?.length || 0} HS
                                    </span>
                                  </div>
                                </div>
                                <h3 className="font-black text-slate-900 text-lg mb-1 truncate">{c.name}</h3>
                                <p className="text-xs text-slate-400 font-medium">Quản lý và xem kết quả</p>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-all">
                                  <span>Chi tiết</span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                                {(c.teacherId === auth.currentUser?.uid || userRole === 'admin') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setClassToDelete(c);
                                    }}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Xóa lớp học"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {[
                            { title: "Phân tích GPA", desc: "Đánh giá năng lực học tập thực tế.", icon: GraduationCap, color: "bg-blue-50 text-blue-600" },
                            { title: "Test Tính cách", desc: "Dựa trên mô hình Holland & MBTI.", icon: BrainCircuit, color: "bg-purple-50 text-purple-600" },
                            { title: "Gợi ý Trường", desc: "Danh sách đại học phù hợp nhất.", icon: Map, color: "bg-emerald-50 text-emerald-600" },
                          ].map((item, i) => (
                            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto", item.color)}>
                                <item.icon className="w-6 h-6" />
                              </div>
                              <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {userRole !== 'teacher' && (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <button 
                          onClick={() => {
                            setData(prev => ({ ...prev, origin: 'vietnam' }));
                            nextStep();
                          }}
                          className="group relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1 selection:bg-white/30 w-full sm:w-auto"
                        >
                          Bạn là người Việt Nam
                          <ChevronRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                          onClick={() => {
                            setData(prev => ({ ...prev, origin: 'international' }));
                            nextStep();
                          }}
                          className="group relative px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all hover:-translate-y-1 selection:bg-white/30 w-full sm:w-auto"
                        >
                          Bạn là người nước ngoài
                          <ChevronRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}

          {step === 1 && (
            <motion.div 
              key="gpa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  {data.origin === 'international' ? <Award className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{data.origin === 'international' ? 'Chứng chỉ quốc tế' : 'Năng lực học tập'}</h2>
                  <p className="text-slate-500">
                    {data.origin === 'international' 
                      ? 'Nhập các chứng chỉ bạn có (IELTS, SAT, AP, IB...)' 
                      : 'Nhập điểm trung bình và các môn học của bạn.'}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {data.origin === 'international' ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Danh sách chứng chỉ & Thành tích</label>
                    <textarea 
                      value={data.internationalCertificates}
                      onChange={(e) => setData(prev => ({ ...prev, internationalCertificates: e.target.value }))}
                      placeholder="VD: IELTS 7.5, SAT 1450, AP Calculus BC 5, IB Diploma 38..."
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all min-h-[150px] resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-slate-700">GPA năm học gần nhất</label>
                    <input 
                      ref={gpaRef}
                      type="number" min="5" max="10" step="0.1"
                      value={data.gpa}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (['-', 'e', '+'].includes(e.key)) e.preventDefault();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const subjectKeys = Object.keys(data.subjects);
                          const firstKey = subjectKeys[0] as keyof typeof data.subjects;
                          if (data.subjects[firstKey] === -1) {
                            setData(prev => ({
                              ...prev,
                              subjects: { ...prev.subjects, [firstKey]: null }
                            }));
                            setPendingFocusIndex(0);
                          } else {
                            const firstSubjectInput = subjectRefs.current.find(ref => ref !== null);
                            if (firstSubjectInput) firstSubjectInput.focus();
                          }
                        }
                      }}
                      onBlur={(e) => {
                        let val = e.target.value === '' ? 5 : parseFloat(e.target.value);
                        if (val < 5) setData({...data, gpa: 5});
                      }}
                      onChange={(e) => {
                        let val = e.target.value === '' ? 5 : parseFloat(e.target.value);
                        if (val > 10) val = 10;
                        setData({...data, gpa: val});
                      }}
                      className="w-20 p-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <input 
                    type="range" min="5" max="10" step="0.1" 
                    value={data.gpa}
                    onChange={(e) => setData({...data, gpa: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>5.0</span>
                    <span>10.0</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Điểm các môn học</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(data.subjects).map((subject, index) => {
                      const labels: Record<string, string> = {
                        math: 'Toán',
                        literature: 'Ngữ Văn',
                        english: 'Tiếng Anh',
                        physics: 'Vật lý',
                        chemistry: 'Hóa học',
                        biology: 'Sinh học',
                        history: 'Lịch sử',
                        geography: 'Địa lý',
                        civics: 'GDCD / KTPL',
                        informatics: 'Tin học'
                      };
                      const isNotStudying = data.subjects[subject as keyof typeof data.subjects] === -1;
                      return (
                        <div key={subject} className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-600">
                              {labels[subject] || subject}
                            </label>
                            <button 
                              onClick={() => {
                                const currentVal = data.subjects[subject as keyof typeof data.subjects];
                                setData({
                                  ...data,
                                  subjects: {
                                    ...data.subjects,
                                    [subject]: currentVal === -1 ? null : -1
                                  }
                                });
                              }}
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold transition-all",
                                isNotStudying 
                                  ? "bg-slate-200 text-slate-500" 
                                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                              )}
                            >
                              {isNotStudying ? "Đã tắt" : "Không học"}
                            </button>
                          </div>
                          {isNotStudying ? (
                            <div 
                              ref={() => { subjectRefs.current[index] = null; }}
                              className="h-[42px] flex items-center justify-center bg-slate-100 rounded-xl border border-dashed border-slate-200"
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Không học</span>
                            </div>
                          ) : (
                            <input 
                              ref={(el) => { subjectRefs.current[index] = el; }}
                              type="number" min="2.5" max="10" step="0.1"
                              placeholder="Nhập điểm"
                              value={data.subjects[subject as keyof typeof data.subjects] ?? ''}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (['-', 'e', '+'].includes(e.key)) e.preventDefault();
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const subjectKeys = Object.keys(data.subjects);
                                  const nextIndex = index + 1;
                                  if (nextIndex < subjectKeys.length) {
                                    const nextKey = subjectKeys[nextIndex] as keyof typeof data.subjects;
                                    if (data.subjects[nextKey] === -1) {
                                      setData(prev => ({
                                        ...prev,
                                        subjects: { ...prev.subjects, [nextKey]: null }
                                      }));
                                      setPendingFocusIndex(nextIndex);
                                    } else {
                                      const nextInput = subjectRefs.current.slice(nextIndex).find(ref => ref !== null);
                                      if (nextInput) {
                                        nextInput.focus();
                                      } else if (nextStepButtonRef.current && !nextStepButtonRef.current.disabled) {
                                        nextStepButtonRef.current.focus();
                                      } else {
                                        e.currentTarget.blur();
                                      }
                                    }
                                  } else if (nextStepButtonRef.current && !nextStepButtonRef.current.disabled) {
                                    nextStepButtonRef.current.focus();
                                  } else {
                                    e.currentTarget.blur();
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                let val = e.target.value === '' ? null : parseFloat(e.target.value);
                                if (val !== null && val < 2.5) {
                                  setData({
                                    ...data,
                                    subjects: { ...data.subjects, [subject]: 2.5 }
                                  });
                                }
                              }}
                              onChange={(e) => {
                                let val = e.target.value === '' ? null : parseFloat(e.target.value);
                                if (val !== null) {
                                  if (val > 10) val = 10;
                                }
                                setData({
                                  ...data, 
                                  subjects: { ...data.subjects, [subject]: val }
                                });
                              }}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Quay lại
                </button>
                <button 
                  ref={nextStepButtonRef}
                  onClick={nextStep} 
                  disabled={data.origin === 'international' ? false : Object.values(data.subjects).filter(v => v !== null && v !== -1).length < 7}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 selection:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp theo <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              {data.origin !== 'international' && Object.values(data.subjects).filter(v => v !== null && v !== -1).length < 7 && (
                <p className="text-center text-xs text-rose-500 mt-2 font-medium">Bạn cần nhập điểm ít nhất 7 môn để tiếp tục</p>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="mbti_holland"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Khám phá Tính cách & Nghề nghiệp</h2>
                  <p className="text-slate-500">Kết hợp MBTI và Holland để có cái nhìn toàn diện nhất.</p>
                </div>
              </div>

              {/* Link làm bài test - Centered at top */}
              <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-indigo-900 font-bold">
                  <Sparkles className="w-5 h-5" />
                  <span>Bạn chưa biết kết quả của mình?</span>
                </div>
                <p className="text-sm text-indigo-700">
                  Hãy dành 10-15 phút để làm bài trắc nghiệm tổng hợp tại đây:
                </p>
                <a 
                  href="https://mbti-and-holland.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 selection:bg-white/30"
                >
                  Làm bài trắc nghiệm ngay <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MBTI Section */}
                <div className="space-y-5 p-6 bg-white rounded-3xl border border-slate-100 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">Nhập mã MBTI</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded uppercase tracking-wider">MBTI</span>
                          <span className="text-[10px] text-slate-400 font-medium">16 Nhóm tính cách</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chọn mã 4 chữ cái của bạn từ kết quả trắc nghiệm (ví dụ: INTJ, ENFP...)
                  </p>
                  <div className="relative">
                    <select 
                      value={data.mbti}
                      onChange={(e) => setData({ ...data, mbti: e.target.value })}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer font-bold text-indigo-600 text-base shadow-sm"
                    >
                      <option value="">-- Chọn MBTI --</option>
                      {MBTI_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.id} - {type.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  {data.mbti && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white rounded-xl border border-slate-100 mt-auto"
                    >
                      <p className="text-xs text-slate-500 italic leading-relaxed">
                        "{MBTI_TYPES.find(t => t.id === data.mbti)?.desc}"
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Holland Section */}
                <div className="space-y-5 p-6 bg-white rounded-3xl border border-slate-100 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">Chọn 3 mã Holland</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded uppercase tracking-wider">RIASEC</span>
                          <span className="text-[10px] text-slate-400 font-medium">Mô hình nghề nghiệp</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chọn 3 nhóm có điểm cao nhất của bạn để AI phân tích xu hướng nghề nghiệp.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {HOLLAND_TYPES.map((type) => {
                      const isSelected = data.holland.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            if (isSelected) {
                              setData({ ...data, holland: data.holland.filter(h => h !== type.id) });
                            } else if (data.holland.length < 3) {
                              setData({ ...data, holland: [...data.holland, type.id] });
                            }
                          }}
                          className={cn(
                            "relative p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 overflow-hidden group",
                            isSelected 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]" 
                              : "bg-slate-50/50 border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-white hover:shadow-sm"
                          )}
                        >
                          {isSelected && (
                            <motion.div 
                              layoutId="active-dot"
                              className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"
                            />
                          )}
                          <span className={cn(
                            "text-xl font-black tracking-tight transition-transform group-hover:scale-110",
                            isSelected ? "text-white" : "text-slate-800"
                          )}>{type.id}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">{type.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Đã chọn: {data.holland.length}/3
                    </p>
                    {data.holland.length > 0 && (
                      <button 
                        onClick={() => setData({...data, holland: []})}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Xóa hết
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Quay lại
                </button>
                <button 
                  disabled={!data.mbti || data.holland.length !== 3}
                  onClick={nextStep} 
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed selection:bg-white/30 shadow-lg shadow-indigo-100"
                >
                  Tiếp theo <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Sở thích & Đam mê</h2>
                  <p className="text-slate-500">Hãy cho AI biết bạn thực sự yêu thích điều gì.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Sở thích của bạn (Chọn 2-3 cái: Vẽ, code, viết lách, thể thao...)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.interests.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm font-medium flex items-center gap-1">
                        {item}
                        <button onClick={() => setData({...data, interests: data.interests.filter((_, idx) => idx !== i)})} className="hover:text-rose-800">×</button>
                      </span>
                    ))}
                  </div>
                  <AssessmentTagInput
                    tags={data.interests}
                    maxTags={3}
                    placeholder="Nhập các sở thích..."
                    maxPlaceholder="Đã đủ 3 sở thích"
                    focusRingClass="focus:ring-2 focus:ring-rose-500"
                    onAddTag={(tag) => setData(prev => ({ ...prev, interests: [...prev.interests, tag] }))}
                  />
                  <p className={cn("text-xs mt-2", data.interests.length < 2 ? "text-rose-500 font-medium" : "text-slate-400")}>
                    Đã chọn: {data.interests.length}/3 (Tối thiểu 2)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Đam mê lớn nhất (Điều bạn có thể làm cả ngày không chán)</label>
                  <textarea 
                    rows={2}
                    placeholder="Mô tả đam mê của bạn..."
                    onChange={(e) => setData({...data, passions: [e.target.value]})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" /> Ưu điểm của bạn (Chọn 2-3 cái)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {data.strengths.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm font-medium flex items-center gap-1">
                          {item}
                          <button onClick={() => setData({...data, strengths: data.strengths.filter((_, idx) => idx !== i)})} className="hover:text-amber-800">×</button>
                        </span>
                      ))}
                    </div>
                    <AssessmentTagInput
                      tags={data.strengths}
                      maxTags={3}
                      placeholder="Nhập các ưu điểm..."
                      maxPlaceholder="Đã đủ 3 ưu điểm"
                      focusRingClass="focus:ring-2 focus:ring-amber-500"
                      onAddTag={(tag) => setData(prev => ({ ...prev, strengths: [...prev.strengths, tag] }))}
                    />
                    <p className={cn("text-[10px] mt-1", data.strengths.length < 2 ? "text-rose-500 font-medium" : "text-slate-400")}>
                      Đã chọn: {data.strengths.length}/3 (Tối thiểu 2)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-400" /> Nhược điểm của bạn (Chọn 2-3 cái)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {data.weaknesses.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium flex items-center gap-1">
                          {item}
                          <button onClick={() => setData({...data, weaknesses: data.weaknesses.filter((_, idx) => idx !== i)})} className="hover:text-slate-800">×</button>
                        </span>
                      ))}
                    </div>
                    <AssessmentTagInput
                      tags={data.weaknesses}
                      maxTags={3}
                      placeholder="Nhập các nhược điểm..."
                      maxPlaceholder="Đã đủ 3 nhược điểm"
                      focusRingClass="focus:ring-2 focus:ring-slate-400"
                      onAddTag={(tag) => setData(prev => ({ ...prev, weaknesses: [...prev.weaknesses, tag] }))}
                    />
                    <p className={cn("text-[10px] mt-1", data.weaknesses.length < 2 ? "text-rose-500 font-medium" : "text-slate-400")}>
                      Đã chọn: {data.weaknesses.length}/3 (Tối thiểu 2)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Kỹ năng mềm & Hoạt động ngoại khóa (Chọn 2-3 cái: Thuyết trình, làm việc nhóm, CLB...)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.softSkills.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium flex items-center gap-1">
                        {item}
                        <button onClick={() => setData({...data, softSkills: data.softSkills.filter((_, idx) => idx !== i)})} className="hover:text-indigo-800">×</button>
                      </span>
                    ))}
                  </div>
                  <AssessmentTagInput
                    tags={data.softSkills}
                    maxTags={3}
                    placeholder="Nhập kỹ năng hoặc hoạt động..."
                    maxPlaceholder="Đã đủ 3 mục"
                    focusRingClass="focus:ring-2 focus:ring-indigo-500"
                    onAddTag={(tag) => setData(prev => ({ ...prev, softSkills: [...prev.softSkills, tag] }))}
                  />
                  <p className={cn("text-xs mt-2", data.softSkills.length < 2 ? "text-rose-500 font-medium" : "text-slate-400")}>
                    Đã chọn: {data.softSkills.length}/3 (Tối thiểu 2)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Động lực làm việc (Chọn 1-2 yếu tố bạn quan tâm nhất)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CORE_MOTIVATIONS.map(motivation => {
                      const isSelected = data.coreMotivations.includes(motivation.label);
                      return (
                        <button
                          key={motivation.id}
                          onClick={() => {
                            if (isSelected) {
                              setData({
                                ...data,
                                coreMotivations: data.coreMotivations.filter(m => m !== motivation.label)
                              });
                            } else {
                              if (data.coreMotivations.length < 2) {
                                setData({
                                  ...data,
                                  coreMotivations: [...data.coreMotivations, motivation.label]
                                });
                              }
                            }
                          }}
                          className={clsx(
                            "p-3 rounded-xl border text-left transition-all flex items-center gap-3",
                            isSelected 
                              ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50/50"
                          )}
                        >
                          <span className="text-xl">{motivation.icon}</span>
                          <span className="text-sm font-medium">{motivation.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className={cn("text-xs mt-2", data.coreMotivations.length < 1 ? "text-rose-500 font-medium" : "text-slate-400")}>
                    Đã chọn: {data.coreMotivations.length}/2 (Tối thiểu 1)
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Quay lại
                </button>
                <button 
                  onClick={nextStep}
                  disabled={
                    data.interests.length < 2 || data.interests.length > 3 ||
                    data.strengths.length < 2 || data.strengths.length > 3 ||
                    data.weaknesses.length < 2 || data.weaknesses.length > 3 ||
                    data.softSkills.length < 2 || data.softSkills.length > 3 ||
                    data.coreMotivations.length < 1 || data.coreMotivations.length > 2 ||
                    !data.passions[0]?.trim()
                  }
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed selection:bg-white/30"
                >
                  Tiếp theo <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="preferences"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Map className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Định hướng vùng miền & Tài chính</h2>
                  <p className="text-slate-500">Thông tin này giúp AI gợi ý các trường đại học thực tế hơn (Tùy chọn).</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">Bạn muốn học ở khu vực nào? (Bạn có thể chọn nhiều)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['Miền Bắc', 'Miền Trung', 'Miền Nam'].map((region) => {
                      const isSelected = data.preferredRegion.includes(region);
                      return (
                        <button
                          key={region}
                          onClick={() => {
                            if (isSelected) {
                              setData({ ...data, preferredRegion: data.preferredRegion.filter(r => r !== region) });
                            } else {
                              setData({ ...data, preferredRegion: [...data.preferredRegion, region] });
                            }
                          }}
                          className={cn(
                            "p-4 rounded-2xl border font-bold transition-all",
                            isSelected 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]" 
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300"
                          )}
                        >
                          {region}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">Ngân sách chi phí dự kiến</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'Dưới 30 triệu', label: 'Dưới 30 triệu/năm' },
                      { id: '30 - 60 triệu', label: '30 - 60 triệu/năm' },
                      { id: '60 - 120 triệu', label: '60 - 120 triệu/năm' },
                      { id: 'Trên 120 triệu', label: 'Trên 120 triệu/năm' }
                    ].map((type) => {
                      const isSelected = data.preferredFinancial.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            if (isSelected) {
                              setData({ ...data, preferredFinancial: [] });
                            } else {
                              setData({ ...data, preferredFinancial: [type.id] });
                            }
                          }}
                          className={cn(
                            "p-4 rounded-2xl border font-bold transition-all",
                            isSelected 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 scale-[1.02]" 
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300"
                          )}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Quay lại
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={data.preferredRegion.length < 1 || data.preferredFinancial.length < 1}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 selection:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xem kết quả <Sparkles className="w-5 h-5" />
                </button>
              </div>
              {(data.preferredRegion.length < 1 || data.preferredFinancial.length < 1) && (
                <p className="text-center text-xs text-rose-500 mt-2 font-medium">Vui lòng chọn ít nhất 1 khu vực và 1 mức ngân sách</p>
              )}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800">Đang phân tích dữ liệu...</h3>
                    <p className="text-slate-500">AI đang kết hợp GPA, tính cách và đam mê của bạn để tìm ra lộ trình tốt nhất.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl text-center space-y-6">
                  <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Lỗi phân tích</h3>
                    <p className="text-slate-600 mb-8">{error}</p>
                    <button 
                      onClick={() => setStep(0)}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      Quay lại từ đầu
                    </button>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-12">
                  <div className="flex justify-start">
                    <button 
                      onClick={() => setStep(4)}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" /> Quay lại chỉnh sửa
                    </button>
                  </div>

                  {/* Profile Summary Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden selection:bg-white/30"
                  >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
                        <Sparkles className="w-16 h-16 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/10">
                          <Target className="w-3 h-3" /> Phân tích chuyên sâu
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                          Chân dung: {
                            (data.subjects.biology || 0) >= 8.5 && data.interests.some(i => i.toLowerCase().includes('nghiên cứu'))
                            ? "Nhà Khoa Học Y Sinh"
                            : data.mbti.startsWith('E') && ((data.subjects.math || 0) >= 8.5 || (data.subjects.english || 0) >= 8.5)
                            ? "Nhà Quản Trị Chiến Lược"
                            : "Nhà Chiến Lược Công Nghệ"
                          }
                        </h3>
                        <p className="text-indigo-100 text-xl max-w-3xl leading-relaxed">
                          Dựa trên GPA <strong>{data.gpa}</strong> và nhóm tính cách <strong>{data.mbti}</strong>, bạn sở hữu {
                            (data.subjects.biology || 0) >= 8.5 && data.interests.some(i => i.toLowerCase().includes('nghiên cứu'))
                            ? "tư duy nghiên cứu tỉ mỉ và khả năng quan sát sâu sắc."
                            : data.mbti.startsWith('E') && ((data.subjects.math || 0) >= 8.5 || (data.subjects.english || 0) >= 8.5)
                            ? "khả năng giao tiếp thuyết phục và tư duy kinh doanh nhạy bén."
                            : "tư duy hệ thống vượt trội và khả năng giải quyết vấn đề logic."
                          } Lộ trình dưới đây được thiết kế để tối ưu hóa tiềm năng của bạn trong 10 năm tới.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Top Careers Section */}
                  <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-10">
                    <div className="flex flex-col items-center text-center gap-4 px-2">
                      <div>
                        <h3 className="text-3xl font-bold text-slate-800">Kế hoạch A: Top 3 Ngành nghề phù hợp nhất</h3>
                        <p className="text-slate-500 text-sm">Phân tích dựa trên năng lực học tập và dự báo kinh tế 2030</p>
                      </div>
                      <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <BarChart3 className="w-4 h-4 text-indigo-600" /> So sánh chi tiết 3 ngành
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-6">
                      {result.topCareers.map((career, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          onClick={() => {
                            setSelectedCareerIndex(i);
                            const roadmapSection = document.getElementById('career-roadmap');
                            if (roadmapSection) {
                              roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className={cn(
                            "bg-slate-50/50 rounded-[2rem] border shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex-1 min-w-[300px] max-w-[400px] cursor-pointer",
                            selectedCareerIndex === i ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30" : "border-slate-100"
                          )}
                        >
                          {selectedCareerIndex === i && (
                            <div className="absolute top-4 right-4 z-20">
                              <div className="bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                          <div className="p-8">
                            <div className="mb-6">
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Độ tương thích</span>
                                <span className="text-2xl font-black text-slate-800">{career.matchPercentage}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${career.matchPercentage}%` }}
                                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                />
                              </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{career.name}</h3>
                            {career.specificRoles && career.specificRoles.length > 0 && (
                              <div className="mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vị trí phù hợp: </span>
                                <span className="text-sm font-medium text-indigo-600">{career.specificRoles.join(', ')}</span>
                              </div>
                            )}
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">{career.description}</p>
                            
                            {/* Why You? Section */}
                            <div className="mb-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Lý do phù hợp (Why you?)</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {career.reason}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 md:col-span-1 relative group/tooltip">
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                  <Coins className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Mức lương</span>
                                  <Info className="w-3 h-3 text-slate-300 cursor-help" />
                                </div>
                                <div className="text-xs font-bold text-slate-700">{career.salaryRange || career.startingSalary}</div>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10">
                                  Mức lương phụ thuộc vào năng lực, vị trí địa lý và quy mô doanh nghiệp.
                                </div>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 md:col-span-1">
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Nhu cầu 2030</span>
                                </div>
                                <div className="text-xs font-bold text-emerald-600">{career.demandForecast}</div>
                              </div>
                            </div>

                             {/* Admission Subjects */}
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổ hợp môn xét tuyển</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {career.admissionSubjects.map((subject, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100">
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Market Insight Box */}
                            <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Nhu cầu thị trường 2025-2030</span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                "{career.marketInsight}"
                              </p>
                            </div>

                            {/* Universities */}
                            <div className="mb-6 space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5" /> Gợi ý trường Đại học
                              </h4>
                              <div className="space-y-2">
                                {career.universities.top.length > 0 && (
                                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">🌟 Nhóm 1: Trường Top / Mơ ước</div>
                                    <ul className="space-y-1">
                                      {career.universities.top.map((uni, idx) => (
                                        <li key={idx} className="text-xs text-slate-700 font-medium">• {uni}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {career.universities.medium.length > 0 && (
                                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">✅ Nhóm 2: Trường Vừa sức / Phổ biến</div>
                                    <ul className="space-y-1">
                                      {career.universities.medium.map((uni, idx) => (
                                        <li key={idx} className="text-xs text-slate-700 font-medium">• {uni}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {career.universities.safe.length > 0 && (
                                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">🛡️ Nhóm 3: Trường Dự phòng / An toàn</div>
                                    <ul className="space-y-1">
                                      {career.universities.safe.map((uni, idx) => (
                                        <li key={idx} className="text-xs text-slate-700 font-medium">• {uni}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoleplay(career.name);
                                }}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 selection:bg-white/30"
                              >
                                <Sparkles className="w-4 h-4" /> Trải nghiệm thử nghề này
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedWiki(expandedWiki === i ? null : i);
                                }}
                                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
                              >
                                <Book className="w-4 h-4" /> {expandedWiki === i ? 'Đóng từ điển' : 'Job Wiki: Từ điển công việc'}
                                <ChevronDown className={cn("w-4 h-4 transition-transform", expandedWiki === i && "rotate-180")} />
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedWiki === i && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-slate-50 border-t border-slate-100 overflow-hidden"
                              >
                                <div className="p-8 space-y-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <Briefcase className="w-3.5 h-3.5" /> Công việc thực tế hàng ngày
                                    </h4>
                                    <ul className="space-y-2">
                                      {career.jobWiki.dailyTasks.map((task, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                          {task}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <Search className="w-3.5 h-3.5" /> Thuật ngữ chuyên ngành
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {career.jobWiki.terms.map((term, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                                          {term}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Contingency Plans & Universities */}
                  <div className="grid grid-cols-1 gap-8">
                    {/* Contingency Plans (Plan B/C) */}
                    <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-6">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-rose-900">Phương án dự phòng</h3>
                          <p className="text-rose-600 text-xs font-medium uppercase tracking-wider">Kế hoạch B & C</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-6">
                        {result.contingencyPlans.map((plan, i) => (
                          <div key={i} className="p-6 bg-white rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow flex-1 min-w-[300px] max-w-[500px]">
                            <div className="flex items-start justify-between mb-3 gap-3">
                              <h4 className="font-bold text-slate-800 leading-tight">{plan.name}</h4>
                              <span className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0",
                                plan.type === 'niche' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {plan.type === 'niche' ? 'Ngành ngách' : 'Học nghề'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 inline-block">
                          <p className="text-[10px] text-rose-700 leading-relaxed italic">
                            * Lời khuyên: Luôn có một phương án dự phòng giúp bạn tự tin hơn trong các kỳ thi quan trọng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isLoggedIn ? (
                    <>
                      {/* 10-Year Career Roadmap */}
                      <div id="career-roadmap" className="bg-slate-900 p-8 md:p-12 rounded-[3rem] shadow-2xl text-white relative overflow-hidden selection:bg-white/30 scroll-mt-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10">
                      <div className="flex flex-col items-center text-center gap-6 mb-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <Layers className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-indigo-400">Lộ trình Sự nghiệp 10 năm</h3>
                            <p className="text-white font-medium">Ngành: <span className="text-indigo-300">{result.topCareers[selectedCareerIndex].name}</span></p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-indigo-200/50 text-[10px] font-bold uppercase tracking-[0.2em]">Cải thiện yếu điểm / Trau dồi kỹ năng</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {result.skillsToDevelop.map((skill, i) => (
                              <span key={i} className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/10">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="relative overflow-x-auto custom-scrollbar pt-10 pb-10 cursor-grab active:cursor-grabbing">
                        <div className="relative min-w-max px-4">
                          {/* Continuous Connecting Line */}
                          <div className="absolute top-6 left-0 w-full h-0.5 bg-indigo-500/20 z-0 hidden md:block"></div>
                          
                          <div className="flex gap-8 relative z-10 pb-4">
                            {result.topCareers[selectedCareerIndex].roadmap.map((step, i) => (
                              <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                key={`${selectedCareerIndex}-${i}`} 
                                className="relative group flex-shrink-0 w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all"
                              >
                                <div className="flex flex-col gap-6">
                                  <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">{step.period}</span>
                                      <h4 className="text-xl font-bold text-white">{step.title}</h4>
                                    </div>
                                    <div className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2 shrink-0">
                                      <Banknote className="w-4 h-4 shrink-0" />
                                      <div className="flex flex-col items-center leading-tight">
                                        {step.salary.includes('VNĐ') ? (
                                          <>
                                            <span className="whitespace-nowrap">{step.salary.replace('VNĐ', '').trim()}</span>
                                            <span className="text-[10px] opacity-80 font-black tracking-tighter">VNĐ</span>
                                          </>
                                        ) : (
                                          <span className="whitespace-nowrap">{step.salary}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                                        <CheckCircle className="w-3.5 h-3.5" /> Mục tiêu thực tế
                                      </div>
                                      <ul className="space-y-1.5">
                                        {step.goals.map((goal, idx) => (
                                          <li key={idx} className="text-sm text-slate-300 flex gap-2">
                                            <span className="text-indigo-500 mt-1">•</span> {goal}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                                        <Code className="w-3.5 h-3.5" /> Kỹ năng & Công nghệ
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {step.hardSkills.map((skill, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] font-medium text-indigo-300">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {step.certifications && step.certifications.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                                          <Award className="w-3.5 h-3.5" /> Chứng chỉ cần thi
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {step.certifications.map((cert, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] font-medium text-amber-300">
                                              {cert}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {step.branchingPaths && (
                                      <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Rẽ nhánh sự nghiệp</div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                                            <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase mb-1">
                                              <Code className="w-3 h-3" /> Chuyên môn
                                            </div>
                                            <div className="text-xs font-bold text-white mb-1">{step.branchingPaths.technical.title}</div>
                                            <div className="text-[10px] text-slate-400 leading-tight mb-2">{step.branchingPaths.technical.goals}</div>
                                            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                                              💰 
                                              <div className="flex flex-col items-center leading-none">
                                                {step.branchingPaths.technical.salary.includes('VNĐ') ? (
                                                  <>
                                                    <span className="whitespace-nowrap">{step.branchingPaths.technical.salary.replace('VNĐ', '').trim()}</span>
                                                    <span className="text-[8px] opacity-80 font-black tracking-tighter">VNĐ</span>
                                                  </>
                                                ) : (
                                                  <span className="whitespace-nowrap">{step.branchingPaths.technical.salary}</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-colors">
                                            <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase mb-1">
                                              <Users className="w-3 h-3" /> Quản lý
                                            </div>
                                            <div className="text-xs font-bold text-white mb-1">{step.branchingPaths.management.title}</div>
                                            <div className="text-[10px] text-slate-400 leading-tight mb-2">{step.branchingPaths.management.goals}</div>
                                            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                                              💰 
                                              <div className="flex flex-col items-center leading-none">
                                                {step.branchingPaths.management.salary.includes('VNĐ') ? (
                                                  <>
                                                    <span className="whitespace-nowrap">{step.branchingPaths.management.salary.replace('VNĐ', '').trim()}</span>
                                                    <span className="text-[8px] opacity-80 font-black tracking-tighter">VNĐ</span>
                                                  </>
                                                ) : (
                                                  <span className="whitespace-nowrap">{step.branchingPaths.management.salary}</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="pt-2">
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                        <Target className="w-3 h-3" /> {step.milestone}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* AI Counselor Chatbox & Teacher Feedback Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
                    {/* AI Counselor Chatbox */}
                    <div id="ai-counselor" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[600px]">
                      <div className="p-6 bg-indigo-600 text-white flex items-center gap-4 selection:bg-white/30">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Sparkles className="w-6 h-6 text-indigo-100" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Chuyên gia Tư vấn AI</h3>
                          <p className="text-indigo-200 text-sm">Hỏi thêm về lộ trình, trường đại học hoặc ngành nghề</p>
                        </div>
                      </div>
                      
                      <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50"
                      >
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={cn(
                            "flex max-w-[85%] gap-4",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                          )}>
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                              msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                              {msg.role === 'user' ? <div className="font-bold text-sm">Bạn</div> : <Sparkles className="w-5 h-5" />}
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl text-sm leading-relaxed",
                              msg.role === 'user' 
                                ? "bg-indigo-600 text-[#ffffff] rounded-tr-sm selection:bg-white/30" 
                                : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                            )}>
                              <div className={cn(
                                "prose prose-sm max-w-none",
                                msg.role === 'user' ? "prose-invert !text-[#ffffff] prose-p:!text-[#ffffff] prose-headings:!text-[#ffffff] prose-strong:!text-[#ffffff]" : "prose-slate"
                              )}>
                                <Markdown>
                                  {msg.text}
                                </Markdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex max-w-[85%] gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-tl-sm shadow-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return;
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Nhập câu hỏi của bạn..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                          />
                          <button 
                            onClick={handleSendMessage}
                            disabled={isChatLoading || !chatInput.trim()}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed selection:bg-white/30"
                          >
                            Gửi
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Feedback Chatbox */}
                    <div id="teacher-feedback" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[600px]">
                      <div className="p-6 bg-emerald-600 text-white flex items-center gap-4 selection:bg-white/30">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <UserCheck className="w-6 h-6 text-emerald-100" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Trao đổi với Thầy/Cô</h3>
                          <p className="text-emerald-100 text-sm">Nhận xét chuyên môn và lời khuyên từ giáo viên</p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                        {teacherFeedbacks.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4 px-10">
                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                              <ClipboardList className="w-12 h-12 mx-auto mb-3" />
                              <p className="text-center text-sm font-medium">Báo cáo của bạn đang chờ thầy cô xem xét và gửi nhận xét.</p>
                            </div>
                          </div>
                        ) : (
                          teacherFeedbacks.map((f, i) => (
                            <div 
                              key={f.id} 
                              className={cn(
                                "flex flex-col max-w-[85%]",
                                f.senderId === auth.currentUser?.uid ? "ml-auto items-end" : "items-start"
                              )}
                            >
                              <div className={cn(
                                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                f.senderId === auth.currentUser?.uid 
                                  ? "bg-emerald-600 text-white shadow-md rounded-tr-none" 
                                  : "bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none"
                              )}>
                                {f.text}
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 font-bold px-1 uppercase tracking-tighter">
                                {f.senderId === auth.currentUser?.uid ? "Bạn" : f.senderName} • {f.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={studentReply}
                            onChange={(e) => setStudentReply(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return;
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                            placeholder="Gửi tin nhắn cho thầy cô..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                          />
                          <button 
                            onClick={handleSendReply}
                            disabled={isSendingReply || !studentReply.trim()}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed selection:bg-white/30"
                          >
                            {isSendingReply ? "..." : "Gửi"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              </>
            ) : (
                    <div className="mt-16 bg-indigo-50 p-8 md:p-12 rounded-[3rem] border border-indigo-100 text-center space-y-6">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-indigo-900">Đăng nhập để mở khóa toàn bộ tính năng</h3>
                      <p className="text-indigo-900/80 max-w-2xl mx-auto">
                        Đăng nhập bằng Gmail để xem chi tiết Lộ trình phát triển 10 năm, sử dụng Trợ lý AI Hướng nghiệp và nhận báo cáo PDF tự động gửi về email của bạn.
                      </p>
                      <button 
                        onClick={() => setShowLogin(true)}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5 text-amber-300" /> Đăng nhập ngay
                      </button>
                    </div>
                  )}

                  <div className="mt-12 flex flex-col md:flex-row justify-center gap-4">
                    <button 
                      onClick={() => setStep(0)}
                      className="px-10 py-4 bg-white text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
                    >
                      Làm lại đánh giá
                    </button>
                    {isLoggedIn && (
                      <button 
                        onClick={handleDownloadPDF}
                        disabled={isDownloadingPDF}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 selection:bg-white/30"
                      >
                        {isDownloadingPDF ? 'Đang xử lý...' : 'Tải xuống & Nhận qua Email'} <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-8 text-center max-w-2xl mx-auto">
                    <p className="text-xs text-slate-400 leading-relaxed italic px-4">
                      Lưu ý: Các phân tích và định hướng trên được tạo ra bởi Trí tuệ nhân tạo (AI) dựa trên dữ liệu bạn cung cấp, chỉ mang tính chất tham khảo. Hãy kết hợp với lời khuyên từ gia đình và thầy cô để đưa ra quyết định cuối cùng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-500">Có lỗi xảy ra khi phân tích. Vui lòng thử lại.</p>
                  <button onClick={() => setStep(0)} className="mt-4 text-indigo-600 font-bold">Quay lại trang chủ</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

        {/* History Section */}
        <div 
          className={cn(
            "absolute inset-0 overflow-y-auto transition-opacity duration-300 bg-slate-50",
            showHistory ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}
        >
          <div className="mx-auto px-4 py-12 max-w-7xl">
            {showHistory && (
              <HistoryView 
                onSelectHistory={(historyResult, historyAnswers) => {
                  setResult(historyResult);
                  setData(historyAnswers);
                  setStep(STEPS.length - 1);
                  setShowHistory(false);
                }} 
              />
            )}
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowHistory(false)}
                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
              >
                <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        <div 
          ref={rankingContainerRef}
          className={cn(
            "absolute inset-0 overflow-y-auto transition-opacity duration-300",
            showRanking ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}
        >
          <div className="mx-auto px-4 py-12 max-w-7xl">
            <UniversityRanking />
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowRanking(false)}
                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
              >
                <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>

        {/* Dictionary Section */}
        <div 
          ref={dictionaryContainerRef}
          className={cn(
            "absolute inset-0 overflow-y-auto transition-opacity duration-300",
            showDictionary ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}
        >
          <div className="mx-auto px-4 py-12 max-w-4xl">
            <CareerDictionary />
            <div className="mt-12 text-center">
              <button 
                onClick={() => setShowDictionary(false)}
                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
              >
                <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div 
          ref={aboutContainerRef}
          className={cn(
            "absolute inset-0 overflow-y-auto transition-opacity duration-300",
            showAbout ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}
        >
          <div className="mx-auto px-4 py-12 max-w-4xl">
            <AboutPage 
              onBack={() => setShowAbout(false)}
              onStart={() => {
                setShowAbout(false);
                setStep(1);
              }}
            />
          </div>
        </div>
      </main>

      {/* Hidden Report for PDF Generation */}
      {result && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: '-2000px', 
          width: '800px', 
          zIndex: -1,
          backgroundColor: 'white'
        }}>
          {/* Common Styles for PDF Pages */}
          <div style={{
            // @ts-ignore
            '--color-indigo-50': '#eef2ff',
            '--color-indigo-100': '#e0e7ff',
            '--color-indigo-400': '#818cf8',
            '--color-indigo-500': '#6366f1',
            '--color-indigo-600': '#4f46e5',
            '--color-indigo-700': '#4338ca',
            '--color-indigo-900': '#312e81',
            '--color-slate-50': '#f8fafc',
            '--color-slate-100': '#f1f5f9',
            '--color-slate-200': '#e2e8f0',
            '--color-slate-300': '#cbd5e1',
            '--color-slate-400': '#94a3b8',
            '--color-slate-500': '#64748b',
            '--color-slate-600': '#475569',
            '--color-slate-700': '#334155',
            '--color-slate-800': '#1e293b',
            '--color-slate-900': '#0f172a',
            '--color-emerald-50': '#ecfdf5',
            '--color-emerald-100': '#d1fae5',
            '--color-emerald-500': '#10b981',
            '--color-emerald-600': '#059669',
            '--color-emerald-700': '#047857',
            '--color-rose-50': '#fff1f2',
            '--color-rose-100': '#ffe4e6',
            '--color-rose-500': '#f43f5e',
            '--color-rose-600': '#e11d48',
            '--color-rose-700': '#be123c',
            '--color-rose-900': '#881337',
            '--color-white': '#ffffff',
            '--color-black': '#000000',
            '--color-transparent': 'transparent',
          } as React.CSSProperties}>
            
            {/* PAGE 1: Academic Profile & MBTI */}
            <div id="pdf-page-1" className="w-[800px] p-12 bg-white text-slate-900 font-sans min-h-[1120px] relative overflow-hidden">
              <div className="text-center mb-12 border-b-4 border-indigo-600 pb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-100">
                  <Sparkles className="w-3 h-3" /> Khám phá tương lai
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">BÁO CÁO ĐỊNH HƯỚNG NGHỀ NGHIỆP</h1>
                <p className="text-indigo-600 font-bold text-xl">LQĐ Future - Chuyên gia tư vấn hướng nghiệp thông minh</p>
              </div>

              <div className="space-y-12">
                <section>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-l-4 border-indigo-600 pl-4">1. HỒ SƠ HỌC THUẬT</h2>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-lg font-bold text-slate-700">Điểm trung bình (GPA):</span>
                      <span className="text-3xl font-black text-indigo-600">{data.gpa}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(data.subjects).map(([key, val]) => (
                        val !== null && val !== -1 && (
                          <div key={key} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                            <span className="text-sm font-medium text-slate-500 capitalize">
                              {key === 'math' ? 'Toán học' : 
                               key === 'literature' ? 'Ngữ văn' : 
                               key === 'english' ? 'Tiếng Anh' : 
                               key === 'physics' ? 'Vật lý' : 
                               key === 'chemistry' ? 'Hóa học' : 
                               key === 'biology' ? 'Sinh học' : 
                               key === 'history' ? 'Lịch sử' : 
                               key === 'geography' ? 'Địa lý' : 
                               key === 'civics' ? 'GDCD' : 
                               key === 'informatics' ? 'Tin học' : key}
                            </span>
                            <span className="font-bold text-slate-800">{val}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-l-4 border-indigo-600 pl-4">2. TÍNH CÁCH MBTI</h2>
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-2xl">{data.mbti}</div>
                      <h3 className="text-xl font-bold text-indigo-900">
                        {MBTI_TYPES.find(t => t.id === data.mbti)?.name || data.mbti}
                      </h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{MBTI_TYPES.find(t => t.id === data.mbti)?.desc}"
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* PAGE 2: Holland Interest Codes & Passions (Sections 3 & 4) */}
            <div id="pdf-page-2" className="w-[800px] p-12 bg-white text-slate-900 font-sans min-h-[1120px] relative overflow-hidden">
              <div className="text-center mb-12 border-b-2 border-slate-100 pb-4">
                <p className="text-indigo-600 font-bold">LQĐ Future - Báo cáo Định hướng Nghề nghiệp (Trang 2)</p>
              </div>

              <div className="space-y-12">
                <section>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-l-4 border-indigo-600 pl-4">3. THIÊN HƯỚNG NGHỀ NGHIỆP (HOLLAND)</h2>
                  <div className="space-y-4">
                    {data.holland.map((code) => {
                      const type = HOLLAND_TYPES.find(t => t.id === code);
                      return (
                        <div key={code} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">{code}</div>
                            <h4 className="font-bold text-slate-800">{type?.name}</h4>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{type?.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-l-4 border-indigo-600 pl-4">4. ĐAM MÊ & SỞ THÍCH</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sở thích & Đam mê</h4>
                      <div className="flex flex-wrap gap-2">
                        {[...data.interests, ...data.passions].map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Điểm mạnh nổi bật</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.strengths.map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-indigo-400 font-bold mb-3 flex items-center gap-2">
                        ✨ NHẬN XÉT TỔNG QUAN
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-300 italic">
                        {result.overallSummary}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* PAGE 3: Career Plans (Section 5) */}
            <div id="pdf-page-3" className="w-[800px] p-12 bg-white text-slate-900 font-sans min-h-[1120px] relative overflow-hidden">
              <div className="text-center mb-12 border-b-2 border-slate-100 pb-4">
                <p className="text-indigo-600 font-bold">LQĐ Future - Báo cáo Định hướng Nghề nghiệp (Trang 3)</p>
              </div>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-l-4 border-indigo-600 pl-4">5. CÁC PHƯƠNG ÁN NGHỀ NGHIỆP</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" /> KẾ HOẠCH A: TOP 3 NGÀNH PHÙ HỢP NHẤT
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {result.topCareers.map((career, i) => (
                          <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-bold text-indigo-600">{career.name}</h4>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                                Tương thích {career.matchPercentage}%
                              </span>
                            </div>
                            {career.specificRoles && career.specificRoles.length > 0 && (
                              <div className="mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Vị trí: </span>
                                <span className="text-xs font-medium text-indigo-600">{career.specificRoles.join(', ')}</span>
                              </div>
                            )}
                            <p className="text-xs text-slate-600 mb-3 line-clamp-2">{career.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-[10px]">
                              <div className="p-2 bg-slate-50 rounded-xl">
                                <span className="text-slate-400 block mb-0.5 uppercase font-bold">Mức lương</span>
                                <span className="text-slate-800 font-bold">{career.salaryRange || career.startingSalary}</span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded-xl">
                                <span className="text-slate-400 block mb-0.5 uppercase font-bold">Nhu cầu 2030</span>
                                <span className="text-emerald-600 font-bold">{career.demandForecast}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-rose-500 rounded-full" /> KẾ HOẠCH B & C: PHƯƠNG ÁN DỰ PHÒNG
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {result.contingencyPlans.map((plan, i) => (
                          <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h4 className="text-sm font-bold text-rose-900 leading-tight">{plan.name}</h4>
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-white text-rose-600 rounded-full uppercase shrink-0 whitespace-nowrap">
                                {plan.type === 'niche' ? 'Ngành ngách' : 'Học nghề'}
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-700 leading-relaxed line-clamp-3">{plan.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* PAGE 4: Roadmap (Section 6) */}
            <div id="pdf-page-4" className="w-[800px] p-12 bg-white text-slate-900 font-sans min-h-[1120px] relative overflow-hidden">
              <div className="text-center mb-12 border-b-2 border-slate-100 pb-4">
                <p className="text-indigo-600 font-bold">LQĐ Future - Báo cáo Định hướng Nghề nghiệp (Trang 4)</p>
              </div>

              <div className="space-y-12">
                <section>
                  <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-l-4 border-indigo-600 pl-4">6. LỘ TRÌNH PHÁT TRIỂN 10 NĂM</h2>
                  
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cải thiện yếu điểm / Trau dồi kỹ năng</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsToDevelop.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-indigo-100">
                    {result.topCareers[selectedCareerIndex].roadmap.map((step, i) => (
                      <div key={i} className="relative pl-12">
                        <div className="absolute left-0 top-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-lg shadow-indigo-200">
                          {i + 1}
                        </div>
                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{step.period}</span>
                              <h4 className="font-bold text-slate-800">{step.title}</h4>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex flex-col items-center leading-tight shrink-0">
                              <span className="whitespace-nowrap">{step.salary.replace('VNĐ', '').trim()}</span>
                              <span className="text-[8px] opacity-80 font-black tracking-tighter">VNĐ</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-600"><span className="font-bold">Mục tiêu:</span> {step.goals.join(", ")}</p>
                            <p className="text-[10px] text-slate-600"><span className="font-bold">Kỹ năng:</span> {step.hardSkills.join(", ")}</p>
                            {step.certifications && step.certifications.length > 0 && (
                              <p className="text-[10px] text-slate-600"><span className="font-bold">Chứng chỉ:</span> {step.certifications.join(", ")}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="text-center pt-12 border-t border-slate-100">
                  <p className="text-slate-400 text-xs italic">Báo cáo được tạo tự động bởi LQĐ Future vào ngày {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
