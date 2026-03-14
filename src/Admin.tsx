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

  // --- 📥 ฟังก์ชันดึงข้อมูล ---
  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cg_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Swal.fire({ icon: 'error', title: 'ดึงข้อมูลไม่สำเร็จ', text: error.message });
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  // --- 🗑️ ฟังก์ชันลบข้อมูล ---
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      text: "หากลบแล้ว รายงานนี้จะหายไปจากระบบทันที!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      Swal.showLoading();
      const { error } = await supabase.from('cg_reports').delete().eq('id', id);
      if (error) {
        Swal.fire('Error!', error.message, 'error');
      } else {
        await Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', timer: 1500, showConfirmButton: false });
        fetchReports();
      }
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // คำนวณสถิติเบื้องต้น
  const totalVisits = reports.length;
  const abnormalCount = reports.filter(r => r.complication_status === 'ผิดปกติ').length;

  return (
    <div className="min-h-screen bg-slate-50 font-kanit">
      
      {/* --- 🔝 Top Navigation --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                เทศบาลตำบลเวียงตาล (CM)
              </span>
            </div>
            <button 
              className={`btn btn-sm btn-ghost gap-2 ${loading ? 'loading' : ''}`}
              onClick={fetchReports}
            >
              {!loading && '🔄'} รีเฟรช
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* --- 📊 Stats Overview --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stats shadow-sm bg-white border border-slate-100">
            <div className="stat">
              <div className="stat-figure text-blue-500 text-3xl">👥</div>
              <div className="stat-title text-slate-500">เยี่ยมทั้งหมด</div>
              <div className="stat-value text-blue-600 text-3xl">{totalVisits} เคส</div>
              <div className="stat-desc text-slate-400">อัปเดตวันนี้</div>
            </div>
          </div>
          <div className="stats shadow-sm bg-white border border-slate-100">
            <div className="stat">
              <div className="stat-figure text-error text-3xl">🚨</div>
              <div className="stat-title text-slate-500">พบอาการผิดปกติ</div>
              <div className="stat-value text-error text-3xl">{abnormalCount} ราย</div>
              <div className="stat-desc text-error/70 font-medium">ต้องการการดูแลด่วน</div>
            </div>
          </div>
          <div className="stats shadow-sm bg-white border border-slate-100">
            <div className="stat">
              <div className="stat-figure text-success text-3xl">✅</div>
              <div className="stat-title text-slate-500">สถานะปกติ</div>
              <div className="stat-value text-success text-3xl">{totalVisits - abnormalCount} ราย</div>
              <div className="stat-desc text-success/70 font-medium">สุขภาพดีเยี่ยม</div>
            </div>
          </div>
        </div>

        {/* --- 📝 Main Content Grid --- */}
        {reports.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="text-7xl mb-4 grayscale opacity-50">📋</div>
            <p className="text-xl text-slate-400 font-medium">ยังไม่มีข้อมูลส่งเข้ามาในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="card bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden">
                
                {/* Image Preview */}
                {report.image_url && (
                  <figure className="relative h-48 overflow-hidden">
                    <img 
                      src={report.image_url} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt="Visit Proof"
                    />
                    <div className="absolute top-4 right-4 badge badge-neutral/80 backdrop-blur-md border-none p-3">
                      📸 รูปถ่าย
                    </div>
                  </figure>
                )}

                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">👵 {report.patient_name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 uppercase tracking-wider">
                        <span>🗓️ {new Date(report.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                        <span>•</span>
                        <span>🕒 {new Date(report.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(report.id)}
                      className="btn btn-ghost btn-circle btn-sm text-slate-300 hover:text-error hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Activity Badges */}
                  <div className="flex flex-wrap gap-2 my-4">
                    {report.activities.split(',').map((act: string) => (
                      <span key={act} className="badge badge-ghost badge-sm py-3 px-3 font-medium text-slate-600 bg-slate-50 border-slate-100">
                        {act.trim()}
                      </span>
                    ))}
                  </div>

                  <div className="divider my-0 opacity-40"></div>

                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-widest">การประเมินอาการ:</span>
                    {report.complication_status === 'ผิดปกติ' ? (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-sm font-bold text-red-600 flex items-center gap-1">
                          🚨 พบความผิดปกติ:
                        </p>
                        <p className="text-sm text-red-700 mt-1 leading-relaxed">
                          {report.complication_detail}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-success font-bold text-sm px-1">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        สุขภาพปกติ / ไม่มีภาวะแทรกซ้อน
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}