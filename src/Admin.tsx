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
    Swal.fire({ imageUrl: url, showConfirmButton: false, showCloseButton: true, width: 'auto', background: 'rgba(255,255,255,0.98)', padding: '0' });
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
      link.download = `รายงานเยี่ยมบ้าน_เวียงตาล_${new Date().getTime()}.xlsx`;
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
    // 🌍 บังคับกว้าง w-screen เพื่อให้เต็มขอบหน้าจอเบราว์เซอร์
    <div className="flex h-screen w-screen bg-[#F8FAFC] font-['Kanit'] overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700;800;900&display=swap');
        * { font-family: 'Kanit', sans-serif !important; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(0.2);
          transform: scale(1.5);
        }
      `}</style>
      
      {/* 🌑 Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-[120] lg:hidden backdrop-blur-md" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 🟣 Sidebar: ปรับความกว้างเป็น w-80 และแก้การวางตำแหน่ง */}
      <aside className={`fixed inset-y-0 left-0 z-[130] w-80 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex-shrink-0 shadow-2xl lg:shadow-none`}>
        <div className="p-10 border-b border-white/10 text-center">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">VIANGTAN</h1>
            <p className="text-xs opacity-60 tracking-[0.3em] uppercase mt-3 font-bold">Smart City Dash</p>
        </div>
        <nav className="p-8 space-y-6 mt-6">
          <div className="bg-white/20 p-5 rounded-[2rem] flex items-center gap-5 shadow-2xl border border-white/20">
            <span className="text-2xl">📊</span> <span className="font-bold text-xl uppercase tracking-wider">แดชบอร์ด</span>
          </div>
          <div className="p-5 rounded-[2rem] flex items-center gap-5 opacity-40 hover:bg-white/10 cursor-pointer transition-all hover:opacity-100">
            <span className="text-2xl">👥</span> <span className="font-bold text-xl uppercase tracking-wider">จัดการข้อมูล</span>
          </div>
        </nav>
      </aside>

      {/* ⚪ Main Content Area: ใช้ flex-1 และ min-w-0 เพื่อให้ยืดเต็มที่ฝั่งขวา */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        
        {/* Header (ใหญ่สะใจตามคำขอ) */}
        <header className="p-10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-8">
            <button className="w-16 h-16 flex lg:hidden items-center justify-center bg-white rounded-2xl shadow-xl text-[#4318FF] text-3xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-5xl font-black text-[#2B3674] tracking-tight leading-none uppercase">รายงานการเยี่ยมบ้าน</h1>
              <p className="text-[#707EAE] text-xl font-bold mt-2 uppercase tracking-[0.1em]">Executive Management Center</p>
            </div>
          </div>
          <div className="hidden lg:block text-[#4318FF] font-black text-4xl bg-white px-10 py-5 rounded-[2.5rem] shadow-sm border border-slate-50 tabular-nums">
            {time.toLocaleTimeString('th-TH')}
          </div>
        </header>

        <main className="flex-1 p-10 pt-0 overflow-y-auto">
          
          {/* Stats Cards (ขยายขนาดตัวอักษร) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-[#4318FF] p-10 rounded-[3rem] text-white shadow-2xl hover:translate-y-[-5px] transition-all">
               <p className="text-sm font-black opacity-60 uppercase tracking-[0.2em]">ทั้งหมด</p>
               <h3 className="text-6xl font-black mt-3 leading-none">{total} <span className="text-2xl font-bold opacity-40">ราย</span></h3>
            </div>
            <div className="bg-[#FFB547] p-10 rounded-[3rem] text-[#2B3674] shadow-2xl hover:translate-y-[-5px] transition-all">
               <p className="text-sm font-black opacity-60 uppercase tracking-[0.2em]">ผิดปกติ</p>
               <h3 className="text-6xl font-black mt-3 leading-none">{abnormal} <span className="text-2xl font-bold opacity-30">ราย</span></h3>
            </div>
            <div className="bg-[#00B5E2] p-10 rounded-[3rem] text-white shadow-2xl hover:translate-y-[-5px] transition-all">
               <p className="text-sm font-black opacity-60 uppercase tracking-[0.2em]">วันนี้</p>
               <h3 className="text-6xl font-black mt-3 leading-none">{todayCount} <span className="text-2xl font-bold opacity-40">ราย</span></h3>
            </div>
            <div className="bg-[#05CD99] p-10 rounded-[3rem] text-white shadow-2xl hover:translate-y-[-5px] transition-all">
               <p className="text-sm font-black opacity-60 uppercase tracking-[0.2em]">ปกติ</p>
               <h3 className="text-6xl font-black mt-3 leading-none">{total - abnormal} <span className="text-2xl font-bold opacity-40">ราย</span></h3>
            </div>
          </div>

          {/* Filter Panel (หัวข้อหนาและมีปฏิทิน) */}
          <div className="bg-white rounded-[3rem] shadow-sm p-10 mb-10 border border-white/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="form-control">
                <label className="label mb-2"><span className="text-lg font-black text-[#2B3674] uppercase tracking-wider">ค้นหาชื่อ</span></label>
                <input type="text" placeholder="พิมพ์ชื่อผู้สูงอายุ..." className="input bg-[#F4F7FE] border-none rounded-2xl h-20 text-xl font-bold px-8 focus:ring-4 focus:ring-[#4318FF]/10 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label mb-2"><span className="text-lg font-black text-[#2B3674] uppercase tracking-wider">สถานะ</span></label>
                <select className="select bg-[#F4F7FE] border-none rounded-2xl h-20 text-xl font-black text-[#2B3674] px-8" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ผิดปกติ">ผิดปกติ</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label mb-2"><span className="text-lg font-black text-[#2B3674] uppercase tracking-wider">วันที่ (ปฏิทิน)</span></label>
                {/* 📅 ปรับช่องวันที่ให้กดแล้วปฏิทินเด้งทันที */}
                <input type="date" className="input bg-[#F4F7FE] border-none rounded-2xl h-20 text-xl font-black text-[#2B3674] px-8" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              </div>
              <div className="flex items-end gap-4">
                <button onClick={() => {setSearchTerm(''); setStatusFilter('ทั้งหมด'); setDateFilter('');}} className="btn btn-ghost bg-[#F4F7FE] rounded-2xl h-20 flex-1 font-black text-xl hover:bg-slate-200">ล้าง</button>
                <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] border-none rounded-2xl h-20 flex-1 text-white font-black text-xl shadow-xl shadow-emerald-100 hover:scale-105 transition-all">📗 EXCEL</button>
              </div>
            </div>
          </div>

          {/* Table List (ใหญ่ ชัดเจน) */}
          <div className="bg-white rounded-[4rem] shadow-sm p-12 border border-white mb-20">
            <div className="flex justify-between items-center mb-12 px-2">
               <h4 className="font-black text-[#2B3674] text-4xl uppercase tracking-tight">รายการแจ้งล่าสุด ({filteredReports.length})</h4>
               <button onClick={fetchReports} className={`btn h-16 px-10 bg-[#4318FF] text-white border-none rounded-[1.5rem] font-black text-xl shadow-lg ${loading ? 'loading' : ''}`}>🔄 รีเฟรชข้อมูล</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-4">
                <thead className="text-[#707EAE] text-lg uppercase font-black tracking-[0.2em] border-none">
                  <tr>
                    <th className="pb-8">รูปถ่าย</th>
                    <th className="pb-8">ผู้สูงอายุ</th>
                    <th className="pb-8 text-center hidden sm:table-cell">แผนที่</th>
                    <th className="pb-8 text-center">สถานะ</th>
                    <th className="pb-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-2xl font-bold">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="group hover:bg-[#F4F7FE] transition-all duration-300">
                      <td className="p-6 rounded-l-[3rem] bg-transparent border-none">
                        {r.image_url && <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-20 h-20 object-cover rounded-[1.5rem] cursor-pointer hover:scale-110 shadow-2xl border-4 border-white" />}
                      </td>
                      <td className="p-6 bg-transparent border-none font-black text-[#2B3674] text-3xl">
                        {r.patient_name}
                        <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </td>
                      <td className="p-6 bg-transparent border-none text-center hidden sm:table-cell">
                        {r.latitude ? (
                          <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-lg text-[#4318FF] bg-blue-50 border-4 border-blue-100 hover:bg-blue-100 rounded-[1.5rem] font-black text-lg">📍 แผนที่</a>
                        ) : (
                          <span className="text-sm text-slate-300 italic font-bold">ไม่มีพิกัด</span>
                        )}
                      </td>
                      <td className="p-6 bg-transparent border-none text-center">
                        <span className={`px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.1em] shadow-md border-2 ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50] border-[#EE5D50]/20' : 'bg-[#F2FFF9] text-[#05CD99] border-[#05CD99]/20'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-6 bg-transparent border-none text-right rounded-r-[3rem]">
                        <button onClick={() => handleDelete(r.id)} className="text-[#707EAE] hover:text-[#EE5D50] p-5 transition-colors text-3xl">🗑️</button>
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