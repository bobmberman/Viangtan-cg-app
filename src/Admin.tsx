import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

// --- 🔗 เชื่อมต่อกับ Supabase (ใช้ค่าเดิมของคุณ Boem) ---
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

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
      imageAlt: 'หลักฐานการเยี่ยม',
      showConfirmButton: false,
      showCloseButton: true,
      width: 'auto',
      background: 'rgba(255,255,255,0.9)',
      padding: '0'
    });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ต้องการลบรายงานนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-kanit">
      
      {/* Sidebar (ใช้ค่าเดิม) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-indigo-800 to-purple-900 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 text-center">
            <h1 className="text-2xl font-black tracking-tighter italic">VIANGTAN</h1>
            <p className="text-[10px] opacity-60 tracking-[0.3em] uppercase">Smart City Dashboard</p>
        </div>
        
        <nav className="p-6 space-y-3 mt-6">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl">📊 <span className="font-bold">แดชบอร์ด</span></div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-60 hover:bg-white/10 cursor-pointer transition-all">👥 จัดการรายชื่อ</div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-60 hover:bg-white/10 cursor-pointer transition-all">⚙️ ตั้งค่าระบบ</div>
        </nav>

        <div className="absolute bottom-10 w-full px-6 text-center">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
                <p className="text-xs font-bold truncate">Adisak (Boem)</p>
                <button className="text-[10px] mt-2 opacity-50 hover:opacity-100 uppercase font-black">🚪 Logout</button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        
        {/* Header (ใช้ค่าเดิม) */}
        <header className="p-6 flex justify-between items-center sticky top-0 bg-slate-50 z-40 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button className="lg:hidden btn btn-ghost btn-sm" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              🏛️ <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">แผงควบคุมหลัก (CM)</span>
            </h2>
          </div>
          <div className="text-right hidden sm:block bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-50">
             <span className="text-indigo-600 font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
             <span className="text-[10px] text-slate-400 font-bold uppercase">{time.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto pt-4">
          
          {/* --- 📊 ส่วน Stat Cards ที่ปรับปรุงใหม่ --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* ทั้งหมด - ใช้ SVG Chart */}
            <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest z-10 relative">เยี่ยมทั้งหมด</p>
               <h3 className="text-4xl font-black mt-1 z-10 relative">{total}</h3>
               {/* SVG Icon ที่พื้นหลัง  */}
               <svg xmlns="http://www.w3.org/2000/svg" className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 group-hover:scale-110 transition-transform duration-500 z-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
            </div>

            {/* ผิดปกติ - ใช้ SVG Bell */}
            <div className="bg-orange-500 p-6 rounded-[2rem] text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest z-10 relative">เคสรอตรวจสอบ</p>
               <h3 className="text-4xl font-black mt-1 z-10 relative">{abnormal}</h3>
               {/* SVG Icon ที่พื้นหลัง  */}
               <svg xmlns="http://www.w3.org/2000/svg" className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 group-hover:scale-110 transition-transform duration-500 z-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
               </svg>
            </div>

            {/* เคสใหม่ - ใช้ SVG UserPlus */}
            <div className="bg-sky-500 p-6 rounded-[2rem] text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest z-10 relative">เคสใหม่วันนี้</p>
               <h3 className="text-4xl font-black mt-1 z-10 relative">{todayCount}</h3>
               {/* SVG Icon ที่พื้นหลัง  */}
               <svg xmlns="http://www.w3.org/2000/svg" className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 group-hover:scale-110 transition-transform duration-500 z-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
               </svg>
            </div>

            {/* ปกติ - ใช้ SVG CheckCircle */}
            <div className="bg-emerald-500 p-6 rounded-[2rem] text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest z-10 relative">สถานะปกติ</p>
               <h3 className="text-4xl font-black mt-1 z-10 relative">{normal}</h3>
               {/* SVG Icon ที่พื้นหลัง  */}
               <svg xmlns="http://www.w3.org/2000/svg" className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 group-hover:scale-110 transition-transform duration-500 z-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
          </div>

          {/* ตารางรายงานล่าสุด (ใช้ค่าเดิม) */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-8 px-2">
               <h4 className="font-bold text-slate-800 text-2xl">📋 รายการแจ้งรายงานล่าสุด</h4>
               <button onClick={fetchReports} className={`btn btn-sm btn-ghost bg-slate-50 border-slate-100 rounded-xl gap-2 ${loading ? 'loading' : ''}`} disabled={loading}>
                 {!loading && '🔄'} รีเฟรช
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50">
                  <tr>
                    <th>รูปถ่าย</th>
                    <th>ชื่อผู้สูงอายุ</th>
                    <th className="hidden sm:table-cell">วันที่ส่ง</th>
                    <th className="text-center">สถานะ</th>
                    <th className="text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                      <td>
                        {r.image_url ? (
                          <img 
                            src={r.image_url} 
                            onClick={() => showFullImage(r.image_url)}
                            className="w-12 h-12 object-cover rounded-xl cursor-pointer hover:ring-4 hover:ring-indigo-100 transition-all border border-slate-100"
                            alt="thumb" 
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-300">N/A</div>
                        )}
                      </td>
                      <td className="font-bold text-slate-700">{r.patient_name}</td>
                      <td className="text-slate-400 hidden sm:table-cell">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="text-center">
                        <span className={`px-4 py-1.5 rounded-xl font-bold text-[11px] uppercase ${r.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-xs text-slate-300 hover:text-red-500">🗑️ ลบ</button>
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