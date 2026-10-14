import React from 'react';
import { Award, Globe } from 'lucide-react';

const SidebarModules = ({ onOpenCertificates, onOpenStats }: { onOpenCertificates: () => void, onOpenStats: () => void }) => {
  return (
    <div className="flex flex-col gap-3">
      <button 
        onClick={onOpenCertificates}
        className="w-full px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all text-center shadow-sm flex items-center justify-center gap-2 group"
      >
        <Award className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        Chứng chỉ quốc tế
      </button>
      <button 
        onClick={onOpenStats}
        className="w-full px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all text-center shadow-sm flex items-center justify-center gap-2 group"
      >
        <Globe className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        Sinh viên quốc tế
      </button>
    </div>
  );
};

export default SidebarModules;
