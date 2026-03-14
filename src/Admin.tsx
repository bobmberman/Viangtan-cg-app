import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

// --- 🔗 เชื่อมต่อกับ Supabase ---
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

  // --- ฟังก์ชันกดดูรูปใหญ่ ---
  const showFullImage = (url: string) => {
    Swal.fire({
      imageUrl: url,
      imageAlt: 'หลักฐานการเยี่ยม',
      showConfirmButton: false,
      showCloseButton: true,
      width: 'auto',
      padding: '0',
      background: 'rgba(255,255,255,0.9)',
      backdrop: `rgba(0,0,123,0.4)`
    });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ต้องการลบรายงานนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
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
    <div className="flex h-screen w-screen bg-[#F4F7FE] font-kanit overflow-hidden">
      
      {/* --- SIDEBAR (ม่วง-น้ำเงิน) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 text-center">
            <h1 className="text-2xl font-black italic tracking-tighter">VIANGTAN</h1>
            <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase">Smart City Dashboard</p>
        </div>
        
        <nav className="p-6 space-y-3 mt-4">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-black/10">📊 <span className="font-bold">Dashboard</span></div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all">👥 ผู้ดูแล (CG)</div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all">⚙️ ตั้งค่าระบบ</div>
        </nav>

        <div className="absolute bottom-8 w-full px-6">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold border-2 border-white/20">B</div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">Adisak (Boem)</p>
                        <p className="text-[10px] opacity-50 uppercase">Administrator</p>
                    </div>
                </div>
                <button className="btn btn-xs btn-ghost w-full mt-3 text-white/50 hover:text-white">🚪 Logout</button>
            </div>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="p-6 flex justify-between items-center bg-[#F4F7FE]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex lg:hidden items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-[#4318FF]" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-tight">ภาพรวมระบบการเยี่ยม</h1>
              <p className="text-[#707EAE] text-sm font-medium">Executive Command Center</p>
            </div>
          </div>
          <div className="text-right hidden sm:block bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-100">
             <span className="text-[#4318FF] font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
             <span className="text-[10px] text-[#707EAE] font-bold uppercase tracking-widest mt-1 block">14 มีนาคม 2569</span>
          </div>
        </header>

        {/* CONTENT (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-6 pt-2">
          
          {/* STAT CARDS (Animated on Hover) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#4318ff]/20 hover:scale-[1.03] transition-transform duration-300 cursor-default group relative overflow-hidden">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">ทั้งหมด</p>
               <h3 className="text-4xl font-black mt-1">{total} ราย</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">📋</div>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#ffb547]/20 hover:scale-[1.03] transition-transform duration-300 cursor-default group relative overflow-hidden">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest text-[#2B3674]">ผิดปกติ</p>
               <h3 className="text-4xl font-black mt-1 text-[#2B3674]">{abnormal}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">🚨</div>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#00b5e2]/20 hover:scale-[1.03] transition-transform duration-300 cursor-default group relative overflow-hidden">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">เคสใหม่วันนี้</p>
               <h3 className="text-4xl font-black mt-1">{todayCount}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">⚡</div>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#05cd99]/20 hover:scale-[1.03] transition-transform duration-300 cursor-default group relative overflow-hidden">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">สถานะปกติ</p>
               <h3 className="text-4xl font-black mt-1">{normal}</h3>
               <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">✅</div>
            </div>
          </div>

          {/* TABLE (Card Style) */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white p-8 mb-8">
            <div className="flex justify-between items-center mb-8 px-2">
               <h4 className="font-bold text-[#2B3674] text-xl">📜 รายการข้อมูลล่าสุด</h4>
               <button onClick={fetchReports} className={`btn btn-sm bg-[#4318FF] hover:bg-[#3311CC] text-white border-none rounded-xl px-6 ${loading ? 'loading' : ''}`} disabled={loading}>
                 {!loading && '🔄'} รีเฟรชข้อมูล
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead className="text-[#707EAE] text-[10px] uppercase font-bold tracking-[0.2em] border-none">
                  <tr>
                    <th className="bg-transparent border-none p-4">รูปภาพ</th>
                    <th className="bg-transparent border-none p-4">รายชื่อผู้สูงอายุ</th>
                    <th className="bg-transparent border-none p-4 hidden md:table-cell">วันที่ส่งข้อมูล</th>
                    <th className="bg-transparent border-none p-4 text-center">อาการ</th>
                    <th className="bg-transparent border-none p-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="group hover:bg-[#F4F7FE] transition-all duration-300">
                      <td className="bg-transparent border-none p-4 rounded-l-3xl">
                        {r.image_url ? (
                          <div className="relative w-12 h-12">
                            <img 
                              src={r.image_url} 
                              onClick={() => showFullImage(r.image_url)}
                              className="w-12 h-12 object-cover rounded-2xl cursor-pointer hover:scale-110 transition-transform shadow-md border-2 border-white ring-1 ring-slate-100"
                              alt="thumb" 
                            />
                            <div className="absolute -top-1 -right-1 bg-[#4318FF] text-white text-[8px] px-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">ซูม</div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[8px] text-slate-300 font-bold uppercase italic">No Pic</div>
                        )}
                      </td>
                      <td className="bg-transparent border-none p-4">
                        <p className="font-bold text-[#2B3674] text-base">{r.patient_name}</p>
                        <p className="text-[10px] text-[#707EAE] md:hidden">{new Date(r.created_at).toLocaleDateString('th-TH')}</p>
                      </td>
                      <td className="bg-transparent border-none p-4 text-[#707EAE] font-semibold hidden md:table-cell">
                        {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="bg-transparent border-none p-4 text-center">
                        <span className={`px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50] border border-[#EE5D50]/10' : 'bg-[#F2FFF9] text-[#05CD99] border border-[#05CD99]/10'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="bg-transparent border-none p-4 text-right rounded-r-3xl">
                        <button onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-sm text-[#707EAE] hover:text-[#EE5D50] transition-colors rounded-xl">🗑️</button>
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