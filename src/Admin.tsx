import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';

const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('cg_reports').select('*').order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  const showFullImage = (url: string) => {
    Swal.fire({ imageUrl: url, showConfirmButton: false, showCloseButton: true, width: 'auto', background: 'rgba(255,255,255,0.95)', padding: '0' });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบข้อมูล' });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  const getBase64FromUrl = async (url: string) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  const exportToExcelWithImages = async () => {
    if (filteredReports.length === 0) {
      Swal.fire('ไม่มีข้อมูล', 'ไม่พบข้อมูลที่ตรงตามตัวกรอง', 'info');
      return;
    }
    Swal.fire({ title: 'กำลังเตรียมไฟล์...', text: 'กรุณารอสักครู่ครับ', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('รายงานการเยี่ยม');
      worksheet.columns = [
        { header: 'รูปถ่าย', key: 'img', width: 22 },
        { header: 'ชื่อผู้สูงอายุ', key: 'name', width: 25 },
        { header: 'วันที่เยี่ยม', key: 'date', width: 15 },
        { header: 'สถานะ', key: 'status', width: 12 },
        { header: 'กิจกรรม', key: 'act', width: 35 },
      ];
      for (let i = 0; i < filteredReports.length; i++) {
        const report = filteredReports[i];
        const row = worksheet.addRow({ name: report.patient_name, date: new Date(report.created_at).toLocaleDateString('th-TH'), status: report.complication_status, act: report.activities });
        row.height = 95;
        row.alignment = { vertical: 'middle', horizontal: 'left' };
        if (report.image_url) {
          try {
            const base64: any = await getBase64FromUrl(report.image_url);
            const imageId = workbook.addImage({ base64: base64.split(',')[1], extension: 'jpeg' });
            worksheet.addImage(imageId, { tl: { col: 0.1, row: i + 1.1 }, ext: { width: 120, height: 120 } });
          } catch (e) { console.error("Img Error"); }
        }
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `รายงานเยี่ยมบ้าน_${new Date().getTime()}.xlsx`;
      link.click();
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire('Error', 'สร้างไฟล์ไม่สำเร็จ', 'error'); }
  };

  useEffect(() => { fetchReports(); }, []);

  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  const filteredReports = reports.filter((report) => {
    const matchesName = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || report.complication_status === statusFilter;
    const matchesDate = !dateFilter || new Date(report.created_at).toLocaleDateString('en-CA') === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  return (
    <div className="relative flex h-screen w-full bg-[#F8FAFC] font-['Kanit'] overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700;800&display=swap');
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(0.4);
        }
      `}</style>
      
      {/* 🌑 Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 🟣 Sidebar: ใช้ fixed ตรึงขอบซ้ายสุดเสมอ */}
      <aside className={`fixed inset-y-0 left-0 z-[110] w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 text-center">
            <h1 className="text-3xl font-extrabold italic tracking-tighter uppercase leading-none">VIANGTAN</h1>
            <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase mt-2">Smart City Dash</p>
        </div>
        <nav className="p-6 space-y-4 mt-6">
          <div className="bg-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl border border-white/10">
            <span className="text-xl">📊</span> <span className="font-bold text-lg">แดชบอร์ดสรุปผล</span>
          </div>
          <div className="p-4 rounded-3xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all">
            <span className="text-xl">👥</span> <span className="font-medium text-lg">จัดการรายชื่อ CG</span>
          </div>
        </nav>
      </aside>

      {/* ⚪ Main Content: ใช้ ml-72 เพื่อขยับเนื้อหาไปทางขวาให้พอดีกับ Sidebar */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden lg:ml-72 transition-all">
        
        {/* Header (ตัวหนังสือใหญ่ ชัดเจน) */}
        <header className="p-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <button className="w-14 h-14 flex lg:hidden items-center justify-center bg-white rounded-2xl shadow-md text-[#4318FF] text-2xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-4xl font-extrabold text-[#2B3674] tracking-tight">รายงานการเยี่ยมบ้าน</h1>
              <p className="text-[#707EAE] text-lg font-medium mt-1 uppercase tracking-widest">Executive Management Center</p>
            </div>
          </div>
          <div className="hidden sm:block text-[#4318FF] font-extrabold text-3xl bg-white px-8 py-4 rounded-[2.5rem] shadow-sm border border-slate-50">
            {time.toLocaleTimeString('th-TH')}
          </div>
        </header>

        <main className="flex-1 p-8 pt-0 overflow-y-auto">
          
          {/* Stats Cards (ใหญ่และอ่านง่าย) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10 mt-4">
            <div className="bg-[#4318FF] p-8 rounded-[2.5rem] text-white shadow-xl hover:scale-[1.02] transition-transform">
               <p className="text-xs font-bold opacity-70 uppercase tracking-widest">ทั้งหมด</p>
               <h3 className="text-5xl font-black mt-2">{total} <span className="text-xl font-normal opacity-60">ราย</span></h3>
            </div>
            <div className="bg-[#FFB547] p-8 rounded-[2.5rem] text-[#2B3674] shadow-xl hover:scale-[1.02] transition-transform">
               <p className="text-xs font-bold opacity-70 uppercase tracking-widest">ผิดปกติ</p>
               <h3 className="text-5xl font-black mt-2">{abnormal} <span className="text-xl font-normal opacity-40">ราย</span></h3>
            </div>
            <div className="bg-[#00B5E2] p-8 rounded-[2.5rem] text-white shadow-xl hover:scale-[1.02] transition-transform">
               <p className="text-xs font-bold opacity-70 uppercase tracking-widest">วันนี้</p>
               <h3 className="text-5xl font-black mt-2">{todayCount} <span className="text-xl font-normal opacity-60">ราย</span></h3>
            </div>
            <div className="bg-[#05CD99] p-8 rounded-[2.5rem] text-white shadow-xl hover:scale-[1.02] transition-transform">
               <p className="text-xs font-bold opacity-70 uppercase tracking-widest">ปกติ</p>
               <h3 className="text-5xl font-black mt-2">{total - abnormal} <span className="text-xl font-normal opacity-60">ราย</span></h3>
            </div>
          </div>

          {/* Filter Panel (ปรับให้ Label หนาขึ้นและช่องวันที่เป็นปฏิทิน) */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 mb-10 border border-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="form-control">
                <label className="label py-2"><span className="text-sm font-extrabold text-[#2B3674] uppercase">ค้นหาด้วยชื่อ</span></label>
                <input type="text" placeholder="พิมพ์ชื่อผู้สูงอายุ..." className="input bg-[#F4F7FE] border-none rounded-2xl h-16 text-lg font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label py-2"><span className="text-sm font-extrabold text-[#2B3674] uppercase">สถานะ</span></label>
                <select className="select bg-[#F4F7FE] border-none rounded-2xl h-16 text-lg font-bold text-[#2B3674]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ผิดปกติ">ผิดปกติ</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label py-2"><span className="text-sm font-extrabold text-[#2B3674] uppercase">วันที่ส่งรายงาน (ปฏิทิน)</span></label>
                {/* 📅 ปรับปรุงช่องวันที่ให้กดแล้วเด้งปฏิทินทันที */}
                <input 
                  type="date" 
                  className="input bg-[#F4F7FE] border-none rounded-2xl h-16 text-lg font-bold text-[#2B3674] px-6" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                />
              </div>
              <div className="flex items-end gap-3">
                <button onClick={() => {setSearchTerm(''); setStatusFilter('ทั้งหมด'); setDateFilter('');}} className="btn btn-ghost bg-[#F4F7FE] rounded-2xl h-16 flex-1 font-bold text-lg">ล้าง</button>
                <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] border-none rounded-2xl h-16 flex-1 text-white font-extrabold text-lg shadow-lg shadow-emerald-100 hover:scale-[1.02] transition-transform">📗 EXCEL</button>
              </div>
            </div>
          </div>

          {/* Table List (หัวข้อใหญ่ ทันสมัย) */}
          <div className="bg-white rounded-[3rem] shadow-sm p-10 border border-white mb-20">
            <div className="flex justify-between items-center mb-10 px-2">
               <h4 className="font-extrabold text-[#2B3674] text-3xl">รายการล่าสุด ({filteredReports.length})</h4>
               <button onClick={fetchReports} className={`btn h-14 px-8 bg-[#4318FF] text-white border-none rounded-2xl font-bold text-lg ${loading ? 'loading' : ''}`}>🔄 รีเฟรชข้อมูล</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-3">
                <thead className="text-[#707EAE] text-sm uppercase font-extrabold tracking-widest border-none">
                  <tr>
                    <th className="pb-6">รูปถ่าย</th>
                    <th className="pb-6">ชื่อผู้สูงอายุ</th>
                    <th className="pb-6 text-center">พิกัด</th>
                    <th className="pb-6 text-center">สถานะ</th>
                    <th className="pb-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-lg">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="group hover:bg-[#F4F7FE] transition-all duration-300">
                      <td className="p-5 rounded-l-[2.5rem] bg-transparent border-none">
                        {r.image_url && <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-16 h-16 object-cover rounded-2xl cursor-pointer hover:scale-110 shadow-lg border-2 border-white" />}
                      </td>
                      <td className="p-5 bg-transparent border-none font-bold text-[#2B3674] text-xl">
                        {r.patient_name}
                        <p className="text-xs text-slate-400 font-medium mt-1">{new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </td>
                      <td className="p-5 bg-transparent border-none text-center">
                        {r.latitude ? (
                          <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-md text-[#4318FF] bg-blue-50 border-blue-100 hover:bg-blue-100 rounded-xl font-extrabold">📍 แผนที่</a>
                        ) : (
                          <span className="text-sm text-slate-300 italic">ไม่มีพิกัด</span>
                        )}
                      </td>
                      <td className="p-5 bg-transparent border-none text-center">
                        <span className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50] border border-[#EE5D50]/10' : 'bg-[#F2FFF9] text-[#05CD99] border border-[#05CD99]/10'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-5 bg-transparent border-none text-right rounded-r-[2.5rem]">
                        <button onClick={() => handleDelete(r.id)} className="text-[#707EAE] hover:text-[#EE5D50] p-4 transition-colors text-2xl">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}