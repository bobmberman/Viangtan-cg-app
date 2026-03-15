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
    // แก้ไข w-screen เป็น w-full เพื่อป้องกันการล้นจอ (Horizontal Scroll)
    <div className="flex h-screen w-full bg-[#F4F7FE] font-['Kanit'] overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Kanit', sans-serif; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(0.4);
        }
      `}</style>
      
      {/* 🌑 Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 🟣 Sidebar: เอา flex-shrink-0 มาใส่เพื่อไม่ให้มันโดนบีบ และเอา lg:ml-xx ของเนื้อหาหลักออก */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4318FF] to-[#6039FF] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex-shrink-0 shadow-lg lg:shadow-none`}>
        <div className="p-8 border-b border-white/10 text-center">
            <h1 className="text-2xl font-bold tracking-wider uppercase">VIANGTAN</h1>
            <p className="text-[10px] opacity-70 tracking-[0.1em] uppercase mt-1 font-medium">Smart City Dash</p>
        </div>
        <nav className="p-6 space-y-2 mt-4">
          <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-white/10">
            <span className="text-xl">📊</span> <span className="font-semibold text-sm tracking-wide">แดชบอร์ดสรุปผล</span>
          </div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all hover:opacity-100">
            <span className="text-xl">👥</span> <span className="font-medium text-sm tracking-wide">จัดการข้อมูล CG</span>
          </div>
        </nav>
      </aside>

      {/* ⚪ Main Content Area: ใช้แค่ flex-1 (ลบ lg:ml- ออกทั้งหมดเพื่อแก้ปัญหาล้นจอ) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Header: ปรับขนาดฟอนต์ให้สมส่วน */}
        <header className="p-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <button className="w-10 h-10 flex lg:hidden items-center justify-center bg-white rounded-xl shadow-sm text-[#4318FF] text-xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] tracking-tight">รายงานการเยี่ยมบ้าน</h1>
              <p className="text-[#707EAE] text-sm font-medium mt-1">Executive Management Center</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-slate-400 text-sm font-medium">เวลาปัจจุบัน:</span>
            <span className="text-[#4318FF] font-bold text-lg tabular-nums">{time.toLocaleTimeString('th-TH')}</span>
          </div>
        </header>

        <main className="flex-1 p-8 pt-0 overflow-y-auto">
          
          {/* Stats Cards: ขนาดพอดีคำ ดูแพงขึ้น */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-[1.5rem] text-white shadow-lg shadow-indigo-100 transition-all">
               <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">ทั้งหมด</p>
               <h3 className="text-3xl font-bold">{total} <span className="text-sm font-normal opacity-70">ราย</span></h3>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] text-[#2B3674] shadow-lg shadow-slate-100 border border-slate-100 transition-all">
               <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">ผิดปกติ</p>
               <h3 className="text-3xl font-bold">{abnormal} <span className="text-sm font-normal text-slate-400">ราย</span></h3>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-[1.5rem] text-white shadow-lg shadow-sky-100 transition-all">
               <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">ส่งวันนี้</p>
               <h3 className="text-3xl font-bold">{todayCount} <span className="text-sm font-normal opacity-70">ราย</span></h3>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-[1.5rem] text-white shadow-lg shadow-emerald-100 transition-all">
               <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">สถานะปกติ</p>
               <h3 className="text-3xl font-bold">{total - abnormal} <span className="text-sm font-normal opacity-70">ราย</span></h3>
            </div>
          </div>

          {/* Filter Panel: เรียบหรู ใช้งานง่าย */}
          <div className="bg-white rounded-[1.5rem] shadow-sm p-6 mb-8 border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label py-1"><span className="text-xs font-semibold text-slate-500">ค้นหาชื่อ</span></label>
                <input type="text" placeholder="พิมพ์ชื่อผู้สูงอายุ..." className="input bg-[#F4F7FE] border-none rounded-xl h-12 text-sm font-medium text-[#2B3674] px-4 focus:ring-2 focus:ring-[#4318FF]/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="text-xs font-semibold text-slate-500">สถานะ</span></label>
                <select className="select bg-[#F4F7FE] border-none rounded-xl h-12 text-sm font-medium text-[#2B3674] px-4" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ผิดปกติ">ผิดปกติ</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="text-xs font-semibold text-slate-500">วันที่ส่งรายงาน</span></label>
                <input type="date" className="input bg-[#F4F7FE] border-none rounded-xl h-12 text-sm font-medium text-[#2B3674] px-4" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              </div>
              <div className="flex items-end gap-3 h-[48px] self-end">
                <button onClick={() => {setSearchTerm(''); setStatusFilter('ทั้งหมด'); setDateFilter('');}} className="btn btn-ghost bg-[#F4F7FE] rounded-xl flex-1 font-semibold text-sm text-slate-500 hover:bg-slate-200 h-full min-h-0">ล้างค่า</button>
                <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] border-none rounded-xl flex-1 text-white font-semibold text-sm shadow-md shadow-emerald-100 hover:bg-[#04b386] h-full min-h-0">📗 Excel</button>
              </div>
            </div>
          </div>

          {/* Table List: สะอาดตา เส้นขอบบางๆ */}
          <div className="bg-white rounded-[1.5rem] shadow-sm p-8 border border-slate-100 mb-10">
            <div className="flex justify-between items-center mb-6 px-1">
               <h4 className="font-bold text-[#2B3674] text-lg">รายการข้อมูล ({filteredReports.length})</h4>
               <button onClick={fetchReports} className={`btn btn-sm px-6 bg-[#4318FF] text-white border-none rounded-lg font-medium text-xs ${loading ? 'loading' : ''}`}>🔄 รีเฟรช</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead className="text-xs uppercase font-semibold tracking-wider text-slate-400 border-none">
                  <tr>
                    <th className="pb-3 pl-4 font-semibold">รูปถ่าย</th>
                    <th className="pb-3 font-semibold">ผู้สูงอายุ</th>
                    <th className="pb-3 text-center hidden sm:table-cell font-semibold">แผนที่</th>
                    <th className="pb-3 text-center font-semibold">สถานะ</th>
                    <th className="pb-3 text-right pr-4 font-semibold">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="group hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3 pl-4 rounded-l-2xl bg-white border-y border-l border-slate-100 group-hover:border-blue-100">
                        {r.image_url ? (
                          <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-12 h-12 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-slate-200" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                        )}
                      </td>
                      <td className="p-3 bg-white border-y border-slate-100 group-hover:border-blue-100 font-medium text-[#2B3674]">
                        {r.patient_name}
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">{new Date(r.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="p-3 bg-white border-y border-slate-100 group-hover:border-blue-100 text-center hidden sm:table-cell">
                        {r.latitude ? (
                          <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#4318FF] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            📍 เปิดดู
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300 font-normal">ไม่มี</span>
                        )}
                      </td>
                      <td className="p-3 bg-white border-y border-slate-100 group-hover:border-blue-100 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide ${r.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-3 pr-4 bg-white border-y border-r border-slate-100 group-hover:border-blue-100 text-right rounded-r-2xl">
                        <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-red-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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