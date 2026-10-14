import React from 'react';
import { ChevronLeft, Award, BookOpen, Languages, Scale, GraduationCap, Globe, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';

export const CertificatesView = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold"
      >
        <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 bg-indigo-600 text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4">Danh mục chứng chỉ quốc tế</h1>
          <p className="text-indigo-100 text-lg max-w-2xl">
            Các chứng chỉ được chấp nhận xét tuyển đại học tại Việt Nam và quốc tế.
          </p>
        </div>

        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-indigo-600">
              <BookOpen className="w-6 h-6" />
              <h2 className="text-xl font-black uppercase tracking-tight">1. Nhóm Bài thi Chuẩn hóa</h2>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>Nhóm này dùng để đánh giá tư duy logic, kiến thức nền tảng và có thể dùng thay thế/bổ trợ cho nhau trong quá trình xét tuyển.</p>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-1">SAT & ACT (Bài thi chuẩn hóa)</h3>
                  <p className="text-sm">Hai bài thi đối thủ và có giá trị tương đương nhau, phổ biến nhất để xét tuyển đại học tại Mỹ, Việt Nam và nhiều quốc gia khác. Đánh giá tư duy logic, Toán học và Ngôn ngữ (riêng ACT có thêm phần Khoa học).</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-1">IB & A-Level (Bằng trung học quốc tế)</h3>
                  <p className="text-sm">Bằng Tú tài Quốc tế (IB) và Chứng chỉ chuẩn Anh Quốc (A-Level) là những "tấm vé vàng" uy tín bậc nhất. Các trường đại học hàng đầu thường dùng hai bằng cấp này để xét tuyển thẳng, có thể thay thế hoàn toàn cho điểm SAT/ACT.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-1">AP (Tiền Đại học)</h3>
                  <p className="text-sm">Là các môn học có trình độ tương đương năm nhất đại học. Dùng để bổ trợ cho SAT/ACT giúp làm nổi bật hồ sơ chuyên sâu và được miễn giảm tín chỉ khi vào đại học.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-600">
                <Languages className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">2. Nhóm Tiếng Anh</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>Nhóm này có giá trị tương đương nhau, dùng để chứng minh trình độ tiếng Anh (Nghe - Nói - Đọc - Viết) của học sinh quốc tế.</p>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                    <p><strong className="text-slate-900">IELTS & TOEFL iBT:</strong> Hai chứng chỉ truyền thống và "quyền lực" nhất. IELTS phổ biến rộng rãi toàn cầu, trong khi TOEFL mang tính hàn lâm cao và đặc biệt được các trường tại Bắc Mỹ ưa chuộng.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                    <p><strong className="text-slate-900">PTE Academic:</strong> Lợi thế là thi 100% trên máy tính và trả kết quả cực nhanh (1-2 ngày). Rất phổ biến cho mục đích du học và định cư tại Úc, New Zealand.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                    <p><strong className="text-slate-900">Duolingo English Test (DET):</strong> Xu hướng mới với ưu điểm thi trực tuyến tại nhà, chi phí rẻ, thời gian thi ngắn. Hiện được hàng ngàn trường ở Bắc Mỹ và Anh chấp nhận thay thế cho IELTS/TOEFL.</p>
                  </li>
                </ul>
              </div>
            </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Scale className="w-6 h-6" />
                  <h2 className="text-xl font-black uppercase tracking-tight">3. Nhóm Chuyên ngành</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-1">UCAT / BMAT</h3>
                    <p className="text-xs text-indigo-700">Bài thi đánh giá năng lực y khoa, bắt buộc khối ngành Y, Nha khoa.</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-1">LNAT</h3>
                    <p className="text-xs text-indigo-700">Bài thi đánh giá suy luận logic, bắt buộc đối với khối ngành Luật.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    );
};

export const InternationalStatsView = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold"
      >
        <ChevronLeft className="w-5 h-5" /> Quay lại trang chủ
      </button>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 bg-emerald-600 text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
            <Globe className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4">Tình trạng sinh viên quốc tế</h1>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Số liệu và thống kê mới nhất về nhu cầu học tập tại Việt Nam (Cập nhật 2024).
          </p>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <TrendingUp className="w-6 h-6" />
              <h2 className="text-xl font-black uppercase tracking-tight">1. Tổng quan số lượng</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                <p className="text-emerald-600 font-bold uppercase text-xs tracking-widest mb-2">Hiện tại (2024)</p>
                <p className="text-4xl font-black text-emerald-900">22.000</p>
                <p className="text-sm text-emerald-700 mt-2">Sinh viên quốc tế</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Tăng trưởng</p>
                <p className="text-4xl font-black text-slate-900">8-10%</p>
                <p className="text-sm text-slate-500 mt-2">Mỗi năm (2018-2023)</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Kỷ lục</p>
                <p className="text-4xl font-black text-slate-900">9 Năm</p>
                <p className="text-sm text-slate-500 mt-2">Mức cao nhất từ trước tới nay</p>
              </div>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl">
              <h3 className="font-bold text-slate-900 mb-4">Biến động qua các năm học:</h3>
              <div className="space-y-4">
                {[
                  { year: '2020 - 2021', count: 18500, label: '18.500 du học sinh' },
                  { year: '2021 - 2022', count: 16000, label: '16.000 (Ảnh hưởng COVID-19)' },
                  { year: '2022 - 2023', count: 21000, label: '21.000 (Phục hồi nhanh)' },
                  { year: '2023 - 2024', count: 22000, label: '22.000 (Đạt kỷ lục mới)' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500 w-24">{item.year}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / 22000) * 100}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Users className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">2. Đặc điểm & Nguồn gốc</h2>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Quốc gia láng giềng</h3>
                  <p className="text-sm text-slate-600">Sinh viên từ <strong>Lào và Campuchia</strong> chiếm khoảng <strong>80%</strong> tổng số du học sinh quốc tế tại Việt Nam.</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Mở rộng đa dạng</h3>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li>• <strong>Ấn Độ:</strong> Nhu cầu cao ngành Y khoa & Sức khỏe.</li>
                    <li>• <strong>Châu Phi:</strong> Chủ yếu học Thạc sĩ, Tiến sĩ.</li>
                    <li>• Khác: Pháp, Philippines, Myanmar, Ghana, Hàn Quốc, Trung Quốc...</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <GraduationCap className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">3. Hình thức & Ngành học</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Tự túc</p>
                    <p className="text-2xl font-black text-emerald-900">18.000</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hiệp định</p>
                    <p className="text-2xl font-black text-slate-900">4.000</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900">Nhóm ngành thu hút nhất:</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Y tế & Sức khỏe', 'Kinh tế & Quản lý', 'Khoa học xã hội', 'Ngôn ngữ Tiếng Việt', 'Văn hóa & Lịch sử'].map(tag => (
                      <span key={tag} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
