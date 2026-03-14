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
      title: 'ลบรายงานนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
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
    <div className="flex h-screen w-screen bg-[#F4F7FE] font-kanit overflow-hidden">
      
      {/* --- Sidebar (Gradient ม่วง-น้ำเงิน) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* --- Header (ตามรูปที่คุณ Boem ส่งมาเป๊ะๆ) --- */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* ปุ่มเมนูวงกลมสีขาว */}
            <button 
              className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm lg:hidden border border-slate-100" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4318FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* หัวข้อ 2 บรรทัด */}
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-none">ภาพรวมระบบการเยี่ยม</h1>
              <p className="text-[#707EAE] text-sm mt-1 font-medium">Executive Command Center</p>
            </div>
          </div>

          <div className="text-right hidden sm:block bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-50">
             <span className="text-[#4318FF] font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
             <span className="text-[10px] text-[#707EAE] font-bold uppercase">{time.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {/* --- ส่วนเนื้อหา (เลื่อนขึ้นลงได้ภายใน) --- */}
        <main className="flex-1 p-6 overflow-y-auto pt-0">
          
          {/* Stats Cards (ดีไซน์ใหม่ให้พรีเมียมขึ้น) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#4318ff]/30">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">ทั้งหมด</p>
               <h3 className="text-4xl font-black mt-1">{total}</h3>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#ffb547]/30">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">รอตรวจสอบ</p>
               <h3 className="text-4xl font-black mt-1">{abnormal}</h3>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#00b5e2]/30">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">เคสใหม่วันนี้</p>
               <h3 className="text-4xl font-black mt-1">{todayCount}</h3>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-[2rem] text-white shadow-2xl shadow-[#05cd99]/30">
               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">เสร็จสิ้น</p>
               <h3 className="text-4xl font-black mt-1">{normal}</h3>
            </div>
          </div>

          {/* รายการรายงานล่าสุด */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-white p-8">
            <div className="flex justify-between items-center mb-8">
               <h4 className="font-bold text-[#2B3674] text-xl">📋 รายการแจ้งรายงานล่าสุด</h4>
               <button onClick={fetchReports} className={`btn btn-sm bg-[#4318FF] hover:bg-[#3311CC] text-white border-none rounded-xl px-6 ${loading ? 'loading' : ''}`} disabled={loading}>
                 {!loading && '🔄'} รีเฟรช
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead className="text-[#707EAE] text-[10px] uppercase font-bold tracking-widest border-none">
                  <tr>
                    <th className="bg-transparent border-none">รูปภาพ</th>
                    <th className="bg-transparent border-none">ชื่อผู้สูงอายุ</th>
                    <th className="bg-transparent border-none hidden sm:table-cell">วันที่</th>
                    <th className="bg-transparent border-none text-center">สถานะ</th>
                    <th className="bg-transparent border-none text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="group hover:bg-[#F4F7FE] transition-all">
                      <td className="bg-transparent border-none p-4 rounded-l-3xl">
                        {r.image_url ? (
                          <img 
                            src={r.image_url} 
                            onClick={() => showFullImage(r.image_url)}
                            className="w-12 h-12 object-cover rounded-2xl cursor-pointer hover:scale-110 transition-transform shadow-md"
                            alt="thumb" 
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[10px] text-slate-300">N/A</div>
                        )}
                      </td>
                      <td className="bg-transparent border-none p-4 font-bold text-[#2B3674]">{r.patient_name}</td>
                      <td className="bg-transparent border-none p-4 text-[#707EAE] font-medium hidden sm:table-cell">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="bg-transparent border-none p-4 text-center">
                        <span className={`px-5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50]' : 'bg-[#F2FFF9] text-[#05CD99]'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="bg-transparent border-none p-4 text-right rounded-r-3xl">
                        <button onClick={() => handleDelete(r.id)} className="text-[#707EAE] hover:text-[#EE5D50] transition-colors p-2">🗑️</button>
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