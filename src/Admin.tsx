import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';

// --- 🔗 เชื่อมต่อกับ Supabase ---
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // States สำหรับการค้นหาและกรอง
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

  const getBase64FromUrl = async (url: string) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  // --- 📊 ฟังก์ชันส่งออก Excel พร้อมรูปและพิกัด ---
  const exportToExcelWithImages = async () => {
    if (filteredReports.length === 0) {
      Swal.fire('ไม่มีข้อมูล', 'ไม่พบข้อมูลที่ตรงตามตัวกรอง', 'info');
      return;
    }

    Swal.fire({
      title: 'กำลังเตรียมไฟล์...',
      text: 'ระบบกำลังประมวลผลรูปภาพและข้อมูลพิกัด GPS',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('รายงานการเยี่ยม');

      worksheet.columns = [
        { header: 'รูปถ่าย', key: 'img', width: 22 },
        { header: 'ชื่อผู้สูงอายุ', key: 'name', width: 25 },
        { header: 'วันที่เยี่ยม', key: 'date', width: 15 },
        { header: 'สถานะ', key: 'status', width: 12 },
        { header: 'กิจกรรม', key: 'act', width: 35 },
        { header: 'Latitude', key: 'lat', width: 15 },
        { header: 'Longitude', key: 'lng', width: 15 },
      ];

      for (let i = 0; i < filteredReports.length; i++) {
        const report = filteredReports[i];
        const row = worksheet.addRow({
          name: report.patient_name,
          date: new Date(report.created_at).toLocaleDateString('th-TH'),
          status: report.complication_status,
          act: report.activities,
          lat: report.latitude || '-',
          lng: report.longitude || '-'
        });

        row.height = 95;
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        if (report.image_url) {
          try {
            const base64: any = await getBase64FromUrl(report.image_url);
            const imageId = workbook.addImage({
              base64: base64.split(',')[1],
              extension: 'jpeg',
            });
            worksheet.addImage(imageId, {
              tl: { col: 0.1, row: i + 1.1 },
              ext: { width: 120, height: 120 }
            });
          } catch (e) { console.error("Image load failed"); }
        }
      }

      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `รายงานเยี่ยมบ้าน_เวียงตาล_${new Date().getTime()}.xlsx`;
      link.click();

      Swal.fire({ icon: 'success', title: 'สำเร็จ!', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire('Error', 'ไม่สามารถสร้างไฟล์ได้', 'error'); }
  };

  const showFullImage = (url: string) => {
    Swal.fire({ imageUrl: url, imageAlt: 'Visit', showConfirmButton: false, showCloseButton: true, width: 'auto', background: 'transparent', padding: '0' });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'ลบรายงานนี้?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบข้อมูล' });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // คำนวณสถิติจากข้อมูลต้นฉบับ
  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  // กรองข้อมูลตามเงื่อนไข
  const filteredReports = reports.filter((report) => {
    const matchesName = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || report.complication_status === statusFilter;
    const matchesDate = !dateFilter || new Date(report.created_at).toLocaleDateString('en-CA') === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  return (
    <div className="flex h-screen w-screen bg-[#F4F7FE] font-kanit overflow-hidden relative">
      
      {/* 🌑 Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 🟣 Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 flex justify-between items-center text-left">
            <div>
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">VIANGTAN</h1>
                <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase mt-1">Smart City Dash</p>
            </div>
            <button className="lg:hidden text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-6 space-y-3 mt-6 text-sm">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10" onClick={() => setIsSidebarOpen(false)}>📊 <span className="font-bold">แดชบอร์ดสรุปผล</span></div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all" onClick={() => setIsSidebarOpen(false)}>👥 รายชื่อผู้ดูแล (CG)</div>
        </nav>
      </aside>

      {/* ⚪ Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md lg:hidden border border-slate-100 text-[#4318FF]" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-none">รายงานการเยี่ยมบ้าน</h1>
              <p className="text-[#707EAE] text-sm mt-1 font-medium italic">Executive Management Center</p>
            </div>
          </div>
          <div className="hidden sm:block text-[#4318FF] font-black text-xl bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-50">
            {time.toLocaleTimeString('th-TH')}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto pt-0">
          
          {/* --- 📊 Stats Cards --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
            <div className="bg-[#4318FF] p-6 rounded-[2rem] text-white shadow-xl hover:scale-105 transition-all">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">ทั้งหมด</p>
               <h3 className="text-4xl font-black mt-1">{total} ราย</h3>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-[2rem] text-[#2B3674] shadow-xl border border-white/20 hover:scale-105 transition-all">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest text-[#2B3674]">ผิดปกติ</p>
               <h3 className="text-4xl font-black mt-1 text-[#2B3674]">{abnormal} ราย</h3>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-[2rem] text-white shadow-xl hover:scale-105 transition-all">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">วันนี้</p>
               <h3 className="text-4xl font-black mt-1">{todayCount} ราย</h3>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-[2rem] text-white shadow-xl hover:scale-105 transition-all">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">ปกติ</p>
               <h3 className="text-4xl font-black mt-1">{normal} ราย</h3>
            </div>
          </div>

          {/* --- 🔍 ค้นหาและส่งออก --- */}
          <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-8 border border-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label text-[10px] font-bold text-[#707EAE] uppercase tracking-widest">ค้นหาชื่อ</label>
                <input type="text" placeholder="พิมพ์ชื่อผู้สูงอายุ..." className="input bg-[#F4F7FE] border-none rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label text-[10px] font-bold text-[#707EAE] uppercase tracking-widest">สถานะ</label>
                <select className="select bg-[#F4F7FE] border-none rounded-xl text-[#2B3674]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ผิดปกติ">ผิดปกติ</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label text-[10px] font-bold text-[#707EAE] uppercase tracking-widest">วันที่ส่งรายงาน</label>
                <input type="date" className="input bg-[#F4F7FE] border-none rounded-xl" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={() => {setSearchTerm(''); setStatusFilter('ทั้งหมด'); setDateFilter('');}} className="btn btn-ghost bg-[#F4F7FE] rounded-xl flex-1 text-[#707EAE] font-bold">ล้าง</button>
                <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] border-none rounded-xl flex-1 text-white font-bold shadow-lg shadow-emerald-100 transition-all hover:scale-105">📗 Excel+รูป</button>
              </div>
            </div>
          </div>

          {/* --- 📜 ตารางแสดงผล --- */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-white mb-10">
            <div className="flex justify-between items-center mb-8 px-2">
               <h4 className="font-bold text-[#2B3674] text-xl">รายการแจ้งรายงาน ({filteredReports.length})</h4>
               <button onClick={fetchReports} className={`btn btn-sm bg-[#4318FF] text-white border-none rounded-xl px-6 ${loading ? 'loading' : ''}`} disabled={loading}>🔄 รีเฟรช</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead className="text-[#707EAE] text-[10px] uppercase font-bold tracking-widest border-none">
                  <tr>
                    <th>รูปถ่าย</th>
                    <th>ชื่อผู้สูงอายุ</th>
                    <th className="hidden sm:table-cell text-center">พิกัดแผนที่</th>
                    <th className="text-center">สถานะ</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="group hover:bg-[#F4F7FE] transition-all">
                      <td className="p-4 rounded-l-3xl">
                        {r.image_url && <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-12 h-12 object-cover rounded-2xl cursor-pointer hover:scale-110 shadow-md border-2 border-white" />}
                      </td>
                      <td className="p-4 font-bold text-[#2B3674]">
                        {r.patient_name}
                        <p className="text-[10px] text-slate-400 font-medium md:hidden">{new Date(r.created_at).toLocaleDateString('th-TH')}</p>
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell">
                        {r.latitude && r.longitude ? (
                          <a 
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs text-[#4318FF] bg-blue-50 border-blue-100 hover:bg-blue-100 rounded-lg font-bold"
                          >
                            📍 เปิดแผนที่
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">ไม่มีพิกัด</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50] border border-[#EE5D50]/10' : 'bg-[#F2FFF9] text-[#05CD99] border border-[#05CD99]/10'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-4 text-right rounded-r-3xl">
                        <button onClick={() => handleDelete(r.id)} className="text-[#707EAE] hover:text-[#EE5D50] p-2 transition-colors">🗑️</button>
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