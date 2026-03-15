import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

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

  const showFullImage = (url: string) => {
    Swal.fire({
      imageUrl: url,
      imageAlt: 'Visit Photo',
      showConfirmButton: false,
      showCloseButton: true,
      width: 'auto',
      background: 'rgba(255,255,255,0.9)',
      padding: '0'
    });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ลบรายงานนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบข้อมูล'
    });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // สถิติจากข้อมูลทั้งหมด
  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  // กรองข้อมูลตามเงื่อนไขที่ CM เลือก
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
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 🟣 Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <div className="text-left">
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">VIANGTAN</h1>
                <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase mt-1">Smart City Dash</p>
            </div>
            <button className="lg:hidden text-white p-2 bg-white/10 rounded-full" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-6 space-y-3 mt-6">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10" onClick={() => setIsSidebarOpen(false)}>📊 <span className="font-bold">แดชบอร์ด</span></div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all" onClick={() => setIsSidebarOpen(false)}>👥 จัดการรายชื่อ</div>
        </nav>
      </aside>

      {/* ⚪ Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className="p-6 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md lg:hidden border border-slate-100 text-[#4318FF]" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-none">แผงควบคุมหลัก</h1>
              <p className="text-[#707EAE] text-sm mt-1 font-medium">Executive Command Center</p>
            </div>
          </div>
          <div className="hidden sm:block text-right bg-white px-6 py-2 rounded-2xl shadow-sm">
             <span className="text-[#4318FF] font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto pt-0">
          
          {/* --- 📊 Stat Cards (กลับมาแล้วครับ!) --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-[2rem] text-white shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group cursor-default">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest relative z-10">เยี่ยมทั้งหมด</p>
               <h3 className="text-4xl font-black mt-1 relative z-10">{total}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">📋</div>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-[2rem] text-[#2B3674] shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group cursor-default border border-white/20">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest relative z-10">ผิดปกติ</p>
               <h3 className="text-4xl font-black mt-1 relative z-10">{abnormal}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform text-[#2B3674]">🚨</div>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-[2rem] text-white shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group cursor-default">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest relative z-10">เคสใหม่วันนี้</p>
               <h3 className="text-4xl font-black mt-1 relative z-10">{todayCount}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">⚡</div>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-[2rem] text-white shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group cursor-default">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest relative z-10">สถานะปกติ</p>
               <h3 className="text-4xl font-black mt-1 relative z-10">{normal}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">✅</div>
            </div>
          </div>

          {/* --- 🔍 Search & Filter Panel --- */}
          <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-8 border border-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label text-[10px] font-bold text-[#707EAE] uppercase">ค้นหาชื่อ</label>
                <input type="text" placeholder="พิมพ์ชื่อ..." className="input bg-[#F4F7FE] border-none rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label text-[10px] font-bold text-[#707EAE] uppercase">สถานะ</label>
                <select className="select bg-[#F4F7FE] border-none rounded-xl" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ผิดปกติ">ผิดปกติ</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label text-[10px] font-bold text-[#707EAE] uppercase">วันที่</label>
                <input type="date" className="input bg-[#F4F7FE] border-none rounded-xl" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              </div>
              <div className="flex items-end">
                <button onClick={() => {setSearchTerm(''); setStatusFilter('ทั้งหมด'); setDateFilter('');}} className="btn btn-ghost bg-[#F4F7FE] rounded-xl w-full text-[#707EAE] font-bold">ล้างตัวกรอง</button>
              </div>
            </div>
          </div>

          {/* --- 📜 Table List --- */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-white">
            <div className="flex justify-between items-center mb-8 px-2">
               <h4 className="font-bold text-[#2B3674] text-xl">รายการแจ้งรายงาน ({filteredReports.length})</h4>
               <button onClick={fetchReports} className={`btn btn-sm bg-[#4318FF] text-white border-none rounded-xl px-6 ${loading ? 'loading' : ''}`} disabled={loading}>รีเฟรช</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead className="text-[#707EAE] text-[10px] uppercase font-bold tracking-widest border-none">
                  <tr>
                    <th>รูปถ่าย</th>
                    <th>ผู้สูงอายุ</th>
                    <th className="hidden sm:table-cell">วันที่</th>
                    <th className="text-center">สถานะ</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F4F7FE] transition-all duration-300">
                      <td className="p-4 rounded-l-3xl">
                        {r.image_url && <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-12 h-12 object-cover rounded-2xl cursor-pointer hover:scale-110 transition-transform shadow-md" />}
                      </td>
                      <td className="p-4 font-bold text-[#2B3674] text-base">{r.patient_name}</td>
                      <td className="p-4 text-[#707EAE] font-medium hidden sm:table-cell">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 text-center">
                        <span className={`px-5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50]' : 'bg-[#F2FFF9] text-[#05CD99]'}`}>
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