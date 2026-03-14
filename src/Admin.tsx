import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // สำหรับมือถือ
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cg_reports').select('*').order('created_at', { ascending: false });
    if (!error) setReports(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ลบรายงานนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  // --- ฟังก์ชันกดดูรูปใหญ่ ---
  const showFullImage = (url: string) => {
    Swal.fire({
      imageUrl: url,
      imageAlt: 'หลักฐานการเยี่ยม',
      showConfirmButton: false,
      showCloseButton: true,
      width: 'auto',
      padding: '0',
      background: 'transparent'
    });
  };

  useEffect(() => { fetchReports(); }, []);

  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-kanit overflow-x-hidden">
      
      {/* --- Sidebar (รองรับมือถือ) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-800 to-purple-900 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white text-indigo-800 w-8 h-8 rounded-lg flex items-center justify-center font-bold">V</div>
            <h1 className="font-bold leading-none">Viangtan<br/><span className="text-[10px] opacity-60 font-normal tracking-widest uppercase">SmartCity</span></h1>
          </div>
          <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        
        <nav className="p-4 space-y-2 mt-4">
          <div className="bg-white/20 p-3 rounded-2xl flex items-center gap-3 shadow-inner">📊 แดชบอร์ด</div>
          <div className="p-3 rounded-2xl flex items-center gap-3 opacity-60 hover:bg-white/10 cursor-pointer">👥 จัดการรายชื่อ</div>
          <div className="p-3 rounded-2xl flex items-center gap-3 opacity-60 hover:bg-white/10 cursor-pointer">⚙️ ตั้งค่าระบบ</div>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/10 bg-black/10 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white/20 flex items-center justify-center font-bold">B</div>
              <div className="text-xs">
                <p className="font-bold">Adisak (Boem)</p>
                <p className="opacity-50 italic">Administrator</p>
              </div>
           </div>
           <button className="text-white/40 hover:text-white text-[10px] mt-4 uppercase font-bold tracking-widest">Logout</button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 p-4 flex justify-between items-center border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button className="lg:hidden btn btn-sm btn-ghost" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h2 className="font-medium text-slate-500 hidden sm:block">Executive Command Center</h2>
          </div>
          <div className="text-right">
             <span className="text-indigo-600 font-black text-xl sm:text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{time.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1 overflow-x-hidden">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
               <p className="text-[10px] font-bold opacity-60 uppercase">ทั้งหมด</p>
               <h3 className="text-3xl font-black mt-1">{total}</h3>
            </div>
            <div className="bg-orange-500 p-5 rounded-[2rem] text-white shadow-xl shadow-orange-200">
               <p className="text-[10px] font-bold opacity-60 uppercase">ผิดปกติ</p>
               <h3 className="text-3xl font-black mt-1">{abnormal}</h3>
            </div>
            <div className="bg-sky-500 p-5 rounded-[2rem] text-white shadow-xl shadow-sky-200">
               <p className="text-[10px] font-bold opacity-60 uppercase">เคสใหม่วันนี้</p>
               <h3 className="text-3xl font-black mt-1">{todayCount}</h3>
            </div>
            <div className="bg-emerald-500 p-5 rounded-[2rem] text-white shadow-xl shadow-emerald-200">
               <p className="text-[10px] font-bold opacity-60 uppercase">ปกติ</p>
               <h3 className="text-3xl font-black mt-1">{normal}</h3>
            </div>
          </div>

          {/* รายการข้อมูล (Table) */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 sm:p-8">
            <div className="flex justify-between items-center mb-8 px-2">
               <h4 className="font-black text-slate-800 text-lg sm:text-xl">📋 รายการส่งรายงานล่าสุด</h4>
               <button onClick={fetchReports} className={`btn btn-sm btn-primary rounded-xl ${loading ? 'loading' : ''}`} disabled={loading}>
                 {!loading && '🔄'} รีเฟรช
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="text-slate-400 text-[10px] uppercase border-b border-slate-50">
                  <tr>
                    <th className="p-4">รูปภาพ</th>
                    <th className="p-4">ชื่อผู้สูงอายุ</th>
                    <th className="p-4 hidden sm:table-cell">วันที่ส่ง</th>
                    <th className="p-4 text-center">สถานะ</th>
                    <th className="p-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                      <td className="p-4">
                        {r.image_url ? (
                          <img 
                            src={r.image_url} 
                            onClick={() => showFullImage(r.image_url)}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl cursor-pointer hover:ring-4 hover:ring-indigo-100 transition-all border border-slate-100"
                            alt="thumb" 
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-300">ไม่มีรูป</div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-700">{r.patient_name}</td>
                      <td className="p-4 text-slate-400 hidden sm:table-cell">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 text-center">
                        <span className={`px-4 py-1.5 rounded-xl font-bold text-[11px] ${r.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
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