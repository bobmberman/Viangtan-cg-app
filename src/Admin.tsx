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
    Swal.fire({ imageUrl: url, imageAlt: 'Visit Photo', showConfirmButton: false, showCloseButton: true, width: 'auto', background: 'transparent', padding: '0' });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'ลบข้อมูล?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบข้อมูล' });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="flex h-screen w-screen bg-[#F4F7FE] font-kanit overflow-hidden relative">
      
      {/* Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar พร้อมปุ่มปิด */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <div className="text-left">
                <h1 className="text-2xl font-black italic tracking-tighter uppercase">VIANGTAN</h1>
                <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase">Smart City Dash</p>
            </div>
            <button className="lg:hidden text-white p-2" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-6 space-y-3 mt-6">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10" onClick={() => setIsSidebarOpen(false)}>📊 <span className="font-bold">แดชบอร์ด</span></div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all" onClick={() => setIsSidebarOpen(false)}>👥 จัดการรายชื่อ</div>
        </nav>
        <div className="absolute bottom-10 w-full px-6">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">B</div>
                <div className="text-xs">
                    <p className="font-bold">Adisak (Boem)</p>
                    <p className="opacity-50 uppercase font-black">Admin</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm lg:hidden border border-slate-100" onClick={() => setIsSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4318FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-none">ภาพรวมระบบ</h1>
              <p className="text-[#707EAE] text-sm mt-1 font-medium">Executive Command Center</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
             <span className="text-[#4318FF] font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto pt-0">
          {/* ส่วนเนื้อหาตารางจะมาอยู่ตรงนี้ (ใช้โค้ดตารางเดิมของคุณได้เลยครับ) */}
          <div className="bg-white rounded-[2.5rem] shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
               <h4 className="font-bold text-[#2B3674]">📜 ข้อมูลล่าสุด</h4>
               <button onClick={fetchReports} className="btn btn-sm bg-[#4318FF] text-white rounded-xl border-none">รีเฟรช</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[#707EAE] text-[10px] uppercase font-bold tracking-widest border-none">
                    <th>รูปภาพ</th>
                    <th>ผู้สูงอายุ</th>
                    <th className="hidden sm:table-cell">วันที่</th>
                    <th className="text-center">สถานะ</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F4F7FE] transition-all">
                      <td className="p-4 rounded-l-3xl">
                        {r.image_url && <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-12 h-12 object-cover rounded-2xl cursor-pointer shadow-md" />}
                      </td>
                      <td className="p-4 font-bold text-[#2B3674]">{r.patient_name}</td>
                      <td className="p-4 text-[#707EAE] font-medium hidden sm:table-cell">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 text-center">
                        <span className={`px-5 py-2 rounded-xl font-bold text-[11px] uppercase ${r.complication_status === 'ผิดปกติ' ? 'bg-[#FFF5F5] text-[#EE5D50]' : 'bg-[#F2FFF9] text-[#05CD99]'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-4 text-right rounded-r-3xl">
                        <button onClick={() => handleDelete(r.id)} className="text-[#707EAE] hover:text-[#EE5D50]">🗑️</button>
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