import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Trash2, Clock, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HistoryView = ({ onSelectHistory }: { onSelectHistory: (result: any, answers: any) => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'history'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'history', id));
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Lịch sử đánh giá</h2>
        <p className="text-slate-500 text-lg">Xem lại các kết quả định hướng nghề nghiệp trước đây của bạn</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500">Bạn chưa có lịch sử đánh giá nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-indigo-300">
              <div 
                className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => {
                  if (item.fullResult) {
                    onSelectHistory(item.fullResult, item.answers);
                  } else {
                    alert('Dữ liệu lịch sử này là phiên bản cũ và không thể xem chi tiết toàn bộ trang kết quả.');
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold">
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold">
                      Phù hợp {item.matchPercentage}%
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{item.careerName}</h3>
                  <p className="text-slate-500 mt-2 line-clamp-2">{item.summary}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Xóa lịch sử này"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="p-3 text-indigo-600 bg-indigo-50 rounded-xl">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
