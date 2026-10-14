import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Trophy, Globe, Users, GraduationCap, BarChart3, Star, MapPin, Building2, BookOpen, Wallet, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

import WORLD_RANKING_DATA from '../data/universities.json';
import VN_RANKING_DATA from '../data/vn_universities.json';

export default function UniversityRanking({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<'world' | 'vietnam'>('world');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [visibleCount, setVisibleCount] = useState(50);

  const currentData = activeTab === 'world' ? WORLD_RANKING_DATA : VN_RANKING_DATA;

  const countries = ['All', ...new Set(WORLD_RANKING_DATA.map(item => item.country))].sort();

  const allFilteredData = currentData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (activeTab === 'world' ? (item as any).country.toLowerCase().includes(searchTerm.toLowerCase()) : (item as any).region.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCountry = activeTab === 'vietnam' || filterCountry === 'All' || (item as any).country === filterCountry;
    return matchesSearch && matchesCountry;
  });

  const displayedData = allFilteredData.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  return (
    <div className="space-y-8">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
        </button>
      )}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mb-2">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bảng xếp hạng các trường đại học</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Khám phá danh sách các trường đại học hàng đầu thế giới và Việt Nam dựa trên các tiêu chí về uy tín học thuật và chất lượng đào tạo.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => { setActiveTab('world'); setSearchTerm(''); setVisibleCount(50); }}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'world' 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Globe className="w-4 h-4" />
            Thế giới (Top 150)
          </button>
          <button
            onClick={() => { setActiveTab('vietnam'); setSearchTerm(''); setVisibleCount(50); }}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'vietnam' 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Building2 className="w-4 h-4" />
            Việt Nam (Top 50)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder={activeTab === 'world' ? "Tìm kiếm tên trường hoặc quốc gia..." : "Tìm kiếm tên trường hoặc khu vực..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(50); // Reset count on search
            }}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        {activeTab === 'world' && (
          <div className="w-full md:w-64 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              value={filterCountry}
              onChange={(e) => {
                setFilterCountry(e.target.value);
                setVisibleCount(50); // Reset count on filter
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
            >
              {countries.map(country => (
                <option key={country} value={country}>{country === 'All' ? 'Tất cả quốc gia' : country}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider">Hạng</th>
                <th className="px-6 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider">Trường Đại học</th>
                <th className="px-6 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider hidden md:table-cell">
                  {activeTab === 'world' ? 'Quốc gia' : 'Khu vực'}
                </th>
                <th className="px-6 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider text-center">Điểm tổng</th>
                <th className="px-6 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider text-center hidden lg:table-cell">
                  {activeTab === 'world' ? 'Học thuật' : 'Loại hình'}
                </th>
                <th className="px-6 py-5 font-bold text-slate-800 text-sm uppercase tracking-wider text-center hidden lg:table-cell">
                  {activeTab === 'world' ? 'Tuyển dụng' : 'Học phí'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayedData.map((item: any, index) => (
                <motion.tr 
                  key={`${item.rank}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min((index % 50) * 0.01, 0.5) }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                      item.rank === 1 ? "bg-amber-100 text-amber-600 shadow-sm shadow-amber-100" :
                      item.rank === 2 ? "bg-slate-200 text-slate-600" :
                      item.rank === 3 ? "bg-orange-100 text-orange-600" :
                      "text-slate-400"
                    )}>
                      {item.rank}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {activeTab === 'vietnam' && item.logo && (
                        <div className="w-12 h-12 rounded-xl border border-slate-100 p-1 bg-white flex-shrink-0 overflow-hidden">
                          <img src={item.logo} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 md:hidden">
                          <MapPin className="w-3 h-3" />
                          {activeTab === 'world' ? item.country : item.region}
                        </div>
                        {activeTab === 'vietnam' && item.strengths && (
                          <div className="flex flex-wrap gap-1 mt-1 hidden sm:flex">
                            {item.strengths.slice(0, 2).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-slate-600">
                      {activeTab === 'world' ? <Globe className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                      {activeTab === 'world' ? item.country : item.region}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-1">
                      <div className="font-black text-indigo-600 text-lg">{item.score.toFixed(1)}</div>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center hidden lg:table-cell">
                    {activeTab === 'world' ? (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                        {item.academic}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold whitespace-nowrap">
                        {item.type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center hidden lg:table-cell">
                    {activeTab === 'world' ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                        {item.employer}
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-medium">
                        <Wallet className="w-3 h-3 text-slate-400" />
                        {item.tuition_range}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleCount < allFilteredData.length && (
          <div className="p-8 text-center border-t border-slate-50 bg-slate-50/30">
            <button 
              onClick={handleLoadMore}
              className="px-8 py-3 bg-white border border-slate-200 text-indigo-600 font-bold rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
            >
              Xem thêm 50 trường tiếp theo ({allFilteredData.length - visibleCount} trường còn lại)
            </button>
          </div>
        )}

        {allFilteredData.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Search className="w-10 h-10" />
            </div>
            <div className="text-slate-500 font-medium">Không tìm thấy kết quả nào phù hợp.</div>
            <button 
              onClick={() => { setSearchTerm(''); setFilterCountry('All'); setVisibleCount(50); }}
              className="text-indigo-600 font-bold hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black mb-2">
            {activeTab === 'world' ? '150+' : '50+'}
          </div>
          <div className="text-indigo-100 font-medium">Trường đại học được phân tích</div>
        </div>
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">
            {activeTab === 'world' ? '98%' : '95%'}
          </div>
          <div className="text-slate-500 font-medium">Độ hài lòng của sinh viên</div>
        </div>
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">
            {activeTab === 'world' ? 'Top 1%' : 'Hàng đầu'}
          </div>
          <div className="text-slate-500 font-medium">
            {activeTab === 'world' ? 'Các trường tinh hoa toàn cầu' : 'Cơ sở giáo dục uy tín VN'}
          </div>
        </div>
      </div>
    </div>
  );
}
