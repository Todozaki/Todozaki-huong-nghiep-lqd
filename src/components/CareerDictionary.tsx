import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, UserCheck, Briefcase, Filter, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

const careerData = [
  {
    icon: "💰",
    category: "Kinh doanh & Tài chính",
    title: "Tài chính & Đầu tư",
    whatItDoes: "Phân tích thị trường, quản lý dòng tiền, định giá doanh nghiệp và đầu tư sinh lời (chứng khoán, crypto, quỹ đầu tư).",
    whoItFits: "Cực kỳ nhạy bén với con số, có tư duy phản biện, chịu được áp lực rủi ro cao và quyết đoán.",
    jobs: ["Chuyên viên Phân tích Tài chính (CFA)", "Quản lý quỹ đầu tư", "Cố vấn Tài chính cá nhân"]
  },
  {
    icon: "🤖",
    category: "Công nghệ & Digital",
    title: "AI & Khoa học Dữ liệu (Data Science)",
    whatItDoes: "Thu thập, phân tích khối lượng dữ liệu khổng lồ để tìm ra \"mỏ vàng\" thông tin, huấn luyện trí tuệ nhân tạo (Machine Learning).",
    whoItFits: "Học cực giỏi Toán, tư duy logic sắc bén, thích dự đoán tương lai dựa trên số liệu và có tính kiên nhẫn.",
    jobs: ["Kỹ sư Trí tuệ Nhân tạo (AI Engineer)", "Chuyên gia Phân tích Dữ liệu (Data Analyst)", "Kỹ sư Máy học"]
  },
  {
    icon: "⚡",
    category: "Khoa học & Kỹ thuật",
    title: "Kỹ thuật Vi mạch & Bán dẫn",
    whatItDoes: "Thiết kế, chế tạo các con chip và linh kiện điện tử lõi - \"bộ não\" cho máy tính, điện thoại, ô tô thông minh.",
    whoItFits: "Giỏi Toán - Lý, cực kỳ tỉ mỉ, đam mê phần cứng và có tư duy hệ thống không gian xuất sắc.",
    jobs: ["Kỹ sư Thiết kế Vi mạch (IC Design)", "Kỹ sư Kiểm thử phần cứng", "Chuyên gia Hệ thống nhúng"]
  },
  {
    icon: "🛒",
    category: "Kinh doanh & Truyền thông",
    title: "Thương mại Điện tử & Kinh doanh Số",
    whatItDoes: "Vận hành gian hàng online, livestreaming, tối ưu hóa chuỗi cung ứng số, bán hàng xuyên biên giới (Shopee, TikTok, Amazon).",
    whoItFits: "Năng động, \"bắt trend\" nhanh nhạy, có tư duy khởi nghiệp (entrepreneurship), linh hoạt và không ngại thất bại.",
    jobs: ["Chuyên gia E-commerce", "Quản lý Vận hành Sàn", "Chủ doanh nghiệp D2C (Direct-to-Customer)"]
  },
  {
    icon: "🌿",
    category: "Khoa học & Kỹ thuật",
    title: "Năng lượng Tái tạo & Môi trường",
    whatItDoes: "Nghiên cứu, vận hành các hệ thống năng lượng sạch (điện mặt trời, điện gió), thương mại tín chỉ carbon và phát triển bền vững.",
    whoItFits: "Quan tâm đến tự nhiên, giỏi khoa học ứng dụng, thích làm việc ở quy mô dự án lớn.",
    jobs: ["Kỹ sư Năng lượng xanh", "Chuyên gia Tư vấn ESG (Môi trường - Xã hội - Quản trị)", "Kỹ sư Môi trường"]
  },
  {
    icon: "💻",
    category: "Công nghệ & Digital",
    title: "Công nghệ Thông tin (IT)",
    whatItDoes: "Viết code, thiết kế phần mềm, bảo mật hệ thống hoặc huấn luyện AI.",
    whoItFits: "Tư duy logic tốt, kiên nhẫn tìm lỗi sai (fix bug), thích giải quyết vấn đề.",
    jobs: ["Lập trình viên", "Kỹ sư dữ liệu", "Chuyên gia An toàn thông tin"]
  },
  {
    icon: "🎨",
    category: "Công nghệ & Digital",
    title: "Thiết kế Đồ họa & Đa phương tiện",
    whatItDoes: "Biến ý tưởng thành hình ảnh, video, hiệu ứng, kỹ xảo.",
    whoItFits: "Mắt thẩm mỹ tốt, sáng tạo, nhạy cảm với màu sắc.",
    jobs: ["Graphic Designer", "Video Editor", "Họa sĩ 3D"]
  },
  {
    icon: "📢",
    category: "Kinh doanh & Truyền thông",
    title: "Marketing & Truyền thông",
    whatItDoes: "Nghệ thuật 'bán' sự chú ý, làm khách hàng yêu thích sản phẩm.",
    whoItFits: "Bắt trend nhanh, ngôn từ linh hoạt, hiểu tâm lý con người.",
    jobs: ["Content Creator", "Brand Manager", "Chuyên viên Digital Marketing"]
  },
  {
    icon: "📦",
    category: "Vận hành & Cung ứng",
    title: "Logistics & Chuỗi cung ứng",
    whatItDoes: "Điều phối hàng hóa từ nơi sản xuất đến tay người dùng tối ưu nhất.",
    whoItFits: "Tính toán giỏi, tỉ mỉ, xử lý sự cố nhanh, giỏi ngoại ngữ.",
    jobs: ["Chuyên viên XNK", "Quản lý kho bãi", "Điều phối vận tải"]
  },
  {
    icon: "🔬",
    category: "Khoa học & Kỹ thuật",
    title: "Công nghệ Sinh học",
    whatItDoes: "Kết hợp sinh học và công nghệ tạo ra vaccine, thực phẩm sạch...",
    whoItFits: "Tò mò về tự nhiên, cẩn thận, không ngại làm việc trong phòng lab.",
    jobs: ["Kỹ sư Sinh học", "Nghiên cứu viên", "Chuyên viên QA/QC"]
  }
];

const categories = ["Tất cả", ...new Set(careerData.map(item => item.category))];

const CareerDictionary = ({ onBack }: { onBack?: () => void }) => {
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const filteredData = activeCategory === "Tất cả" 
    ? careerData 
    : careerData.filter(item => item.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-12">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
        </button>
      )}
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Từ Điển Nghề Nghiệp
        </h1>
        <p className="text-xl text-slate-600 font-bold max-w-2xl mx-auto">
          Khám phá các nhóm ngành "hot" nhất hiện nay trước khi đưa ra quyết định.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold transition-all border",
              activeCategory === cat
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:text-indigo-600"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((career, index) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={career.title}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
          >
            <div className="p-6 space-y-6 flex-1">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{career.icon}</div>
                <span className="text-[10px] font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">
                  {career.category}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-slate-900">{career.title}</h2>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Ngành này làm gì?</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {career.whatItDoes}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <UserCheck className="w-4 h-4" />
                    <span>Hợp với ai?</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {career.whoItFits}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Vị trí tiêu biểu</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5">
                    {career.jobs.map((job) => (
                      <li key={job} className="text-xs text-slate-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                        {job}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CareerDictionary;
