import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  // อัปเดตเวลาวินาทีต่อวินาทีตามรูปตัวอย่าง
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

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ลบรายงานนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });
    if (result.isConfirmed) {
      const { error } = await supabase.from('cg_reports').delete().eq('id', id);
      if (!error) {
        Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1000, showConfirmButton: false });
        fetchReports();
      }
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // คำนวณตัวเลขสถิติ
  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex min-h-screen bg-slate-100 font-kanit">
      
      {/* --- 1. SIDEBAR (สี Gradient ตามรูป) --- */}
      <aside className="w-64 bg-gradient-to-b from-indigo-700 via-purple-700 to-fuchsia-800 text-white hidden lg:flex flex-col shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white p-2 rounded-full text-indigo-700 text-xl">🏛️</div>
          <div>
            <h1 className="font-bold leading-none">Viangtan</h1>
            <span className="text-xs opacity-70">Smart City</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 text-sm font-medium">
          <div className="bg-white/20 text-white p-3 rounded-xl flex items-center gap-3 cursor-pointer">
            📊 แดชบอร์ด
          </div>
          <div className="hover:bg-white/10 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all">
            👥 จัดการผู้สูงอายุ
          </div>
          <div className="hover:bg-white/10 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all">
            📁 รายงานสรุปผล
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-indigo-500 text-white rounded-full w-10">B</div>
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-bold truncate text-sm">Adisak (Boem)</p>
              <p className="opacity-60">Admin Online</p>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost w-full mt-3 text-white/70 hover:text-white">🚪 Logout</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* TOP NAV / HEADER */}
        <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button className="lg:hidden btn btn-ghost btn-sm">☰</button>
            <h2 className="text-slate-500 font-medium">ภาพรวมระบบดูแลผู้สูงอายุ (CM)</h2>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-indigo-600 font-bold text-xl leading-none">
              {time.toLocaleTimeString('th-TH')}
            </p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              {time.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        <div className="p-6">
          
          {/* --- 2. STAT CARDS (4 สีตามรูป) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
              <p className="opacity-70 text-sm font-medium">เยี่ยมทั้งหมด</p>
              <h3 className="text-4xl font-black mt-1">{total}</h3>
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">📋</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-lg shadow-orange-200 relative overflow-hidden">
              <p className="opacity-70 text-sm font-medium">เคสผิดปกติวันนี้</p>
              <h3 className="text-4xl font-black mt-1">{abnormal}</h3>
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">🚨</div>
            </div>
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 p-6 rounded-[2rem] text-white shadow-lg shadow-sky-200 relative overflow-hidden">
              <p className="opacity-70 text-sm font-medium">รายงานใหม่</p>
              <h3 className="text-4xl font-black mt-1">{todayCount}</h3>
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">⚡</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-[2rem] text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
              <p className="opacity-70 text-sm font-medium">สถานะปกติ</p>
              <h3 className="text-4xl font-black mt-1">{normal}</h3>
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">✅</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* แผนที่จำลอง (ตามรูป) */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">📍 แผนที่พิกัดบ้านผู้สูงอายุ</h4>
                <span className="badge badge-primary badge-outline text-[10px]">Real-time Map</span>
              </div>
              <div className="w-full h-full bg-slate-200 flex items-center justify-center relative">
                <img 
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
                  className="w-full h-full object-cover opacity-50 grayscale" 
                  alt="Map Placeholder" 
                />
                <div className="absolute flex flex-col items-center">
                   <p className="text-slate-500 font-bold bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">กำลังเชื่อมต่อพิกัด GPS...</p>
                </div>
              </div>
            </div>

            {/* กราฟสถิติจำลอง (ตามรูป) */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 flex flex-col">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">📊 สถิติแยกตามหมู่บ้าน</h4>
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                {[
                  { label: 'หมู่ 1 บ้านป่าม่วง', value: 80, color: 'bg-indigo-500' },
                  { label: 'หมู่ 2 บ้านศาลา', value: 45, color: 'bg-orange-400' },
                  { label: 'หมู่ 3 บ้านยาง', value: 65, color: 'bg-sky-400' },
                  { label: 'หมู่ 4 บ้านเวียง', value: 30, color: 'bg-emerald-400' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-500">{bar.label}</span>
                      <span className="text-slate-800">{bar.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bar.color}`} style={{ width: `${bar.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* รายการรายงานล่าสุด (Table Style) */}
          <div className="mt-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">📜 รายการส่งรายงานล่าสุด</h4>
              <button onClick={fetchReports} className="btn btn-sm btn-ghost gap-2">🔄 รีเฟรช</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="text-slate-400 uppercase text-[10px] tracking-widest border-b border-slate-50">
                  <tr>
                    <th>ผู้สูงอายุ</th>
                    <th>วันที่/เวลา</th>
                    <th>สถานะ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-bold text-slate-700">{r.patient_name}</td>
                      <td className="text-slate-400">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                      <td>
                        <span className={`badge border-none font-bold py-3 px-4 rounded-xl ${r.complication_status === 'ผิดปกติ' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-sm text-slate-300 hover:text-red-500">🗑️ ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}