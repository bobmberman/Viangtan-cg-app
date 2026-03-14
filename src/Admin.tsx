import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // ตัวแปรเจ้าปัญหา
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReports = async () => {
    setLoading(true); // ใช้งาน setLoading
    const { data, error } = await supabase.from('cg_reports').select('*').order('created_at', { ascending: false });
    if (!error) {
      setReports(data || []);
    }
    setLoading(false); // ใช้งาน setLoading
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

  const total = reports.length;
  const abnormal = reports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;
  const todayCount = reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="flex min-h-screen bg-slate-100 font-kanit">
      
      {/* SIDEBAR สีม่วง Gradient ตามรูป Smart City */}
      <aside className="w-64 bg-gradient-to-b from-indigo-700 via-purple-700 to-fuchsia-800 text-white hidden lg:flex flex-col shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white p-2 rounded-full text-indigo-700 text-xl font-bold italic">V</div>
          <div>
            <h1 className="font-bold leading-none">Viangtan</h1>
            <span className="text-[10px] opacity-70">SmartCity Dashboard</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 text-sm font-medium">
          <div className="bg-white/20 text-white p-3 rounded-xl flex items-center gap-3 cursor-pointer">📊 แดชบอร์ด</div>
          <div className="hover:bg-white/10 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all">👥 จัดการผู้สูงอายุ</div>
          <div className="hover:bg-white/10 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all">⚙️ ตั้งค่าระบบ</div>
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
          <button className="btn btn-sm btn-ghost w-full mt-3 text-white/70 hover:text-white">Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-500 font-medium">ภาพรวมระบบการเยี่ยม (Executive Command)</h2>
          </div>
          <div className="text-right">
            <p className="text-indigo-600 font-bold text-xl leading-none">
              {time.toLocaleTimeString('th-TH')}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {time.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        <div className="p-6">
          {/* STAT CARDS สีสันสดใส */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg">
              <p className="opacity-70 text-sm">ทั้งหมด</p>
              <h3 className="text-4xl font-black">{total}</h3>
            </div>
            <div className="bg-orange-500 p-6 rounded-2xl text-white shadow-lg">
              <p className="opacity-70 text-sm">รอตรวจสอบ (ผิดปกติ)</p>
              <h3 className="text-4xl font-black">{abnormal}</h3>
            </div>
            <div className="bg-sky-500 p-6 rounded-2xl text-white shadow-lg">
              <p className="opacity-70 text-sm">เคสใหม่วันนี้</p>
              <h3 className="text-4xl font-black">{todayCount}</h3>
            </div>
            <div className="bg-emerald-500 p-6 rounded-2xl text-white shadow-lg">
              <p className="opacity-70 text-sm">เสร็จสิ้น (ปกติ)</p>
              <h3 className="text-4xl font-black">{normal}</h3>
            </div>
          </div>

          {/* TABLE LIST รายการข้อมูล */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800">📋 รายการแจ้งรายงาน</h4>
              {/* จุดที่มีการเรียกใช้งาน loading เพื่อแก้ Error */}
              <button 
                onClick={fetchReports} 
                className={`btn btn-sm btn-primary rounded-xl ${loading ? 'loading' : ''}`}
                disabled={loading} 
              >
                {!loading && '🔄'} รีเฟรช
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px]">
                    <th>ผู้สูงอายุ</th>
                    <th>วันที่ส่ง</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="font-bold text-slate-700">{r.patient_name}</td>
                      <td>{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td>
                        <span className={`badge border-none font-bold p-3 rounded-lg ${r.complication_status === 'ผิดปกติ' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-xs text-slate-300 hover:text-red-500">🗑️ ลบ</button>
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