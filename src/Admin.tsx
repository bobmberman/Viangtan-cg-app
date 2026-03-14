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

  // --- 📥 ฟังก์ชันดึงข้อมูลจากฐานข้อมูล ---
  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cg_reports')
      .select('*')
      .order('created_at', { ascending: false }); // ดึงข้อมูลล่าสุดขึ้นก่อน

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'ดึงข้อมูลไม่สำเร็จ',
        text: error.message,
        confirmButtonColor: '#3b82f6',
        fontFamily: 'Kanit'
      });
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  // --- 🗑️ ฟังก์ชันลบข้อมูลพร้อม SweetAlert2 ---
  const handleDelete = async (id: string) => {
    // 1. ถามยืนยันก่อนลบ
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      text: "หากลบแล้ว รายงานนี้จะหายไปจากระบบทันที ไม่สามารถกู้คืนได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // สีแดง (Tailwind error)
      cancelButtonColor: '#e2e8f0', // สีเทา (Tailwind slate-200)
      confirmButtonText: 'ใช่, ลบข้อมูล',
      cancelButtonText: '<span style="color: #475569">ยกเลิก</span>',
      fontFamily: 'Kanit',
      reverseButtons: true // สลับให้ปุ่มยืนยันอยู่ด้านขวา
    });

    if (result.isConfirmed) {
      Swal.showLoading(); // โชว์วงกลมโหลดตอนกำลังลบ

      // 2. สั่งลบข้อมูลใน Supabase
      const { error } = await supabase.from('cg_reports').delete().eq('id', id);

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'ลบไม่สำเร็จ',
          text: error.message,
          fontFamily: 'Kanit'
        });
      } else {
        // 3. แจ้งเตือนเมื่อลบสำเร็จ
        await Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ!',
          text: 'ข้อมูลถูกลบออกจากระบบเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
          fontFamily: 'Kanit'
        });
        fetchReports(); // ดึงข้อมูลใหม่มาแสดง
      }
    }
  };

  // ดึงข้อมูลครั้งแรกตอนเปิดหน้าเว็บ
  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- 🏷️ ส่วนหัว (Header) --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
            📋 <span className="text-primary">รายงานการเยี่ยม (CM)</span>
          </h1>
          <button 
            className={`btn btn-primary btn-outline shadow-sm ${loading ? 'loading' : ''}`} 
            onClick={fetchReports}
            disabled={loading}
          >
            {!loading && '🔄'} อัปเดตข้อมูล
          </button>
        </div>

        {/* --- 📝 ส่วนแสดงรายการ (List) --- */}
        {reports.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-xl text-slate-500 font-medium">ยังไม่มีข้อมูลการเยี่ยมในขณะนี้</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="card bg-white shadow-soft border border-slate-100 hover:border-primary/30 transition-all duration-300">
                <div className="card-body p-5 sm:p-6">
                  
                  {/* หัวการ์ด: ชื่อ + ปุ่มลบ */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">👵 {report.patient_name}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        🕒 {new Date(report.created_at).toLocaleString('th-TH', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(report.id)} 
                      className="btn btn-circle btn-ghost btn-sm text-error hover:bg-red-50"
                      title="ลบรายงานนี้"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  
                  {/* เนื้อหาการ์ด: กิจกรรม + สถานะ */}
                  <div className="space-y-3 py-4 border-y border-slate-100">
                    <div className="flex items-start gap-2 text-slate-600">
                      <span className="font-semibold whitespace-nowrap">กิจกรรม:</span>
                      <span>{report.activities}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-600 whitespace-nowrap">สถานะ:</span>
                      {report.complication_status === 'ผิดปกติ' ? (
                        <div className="text-error bg-red-50 px-3 py-1 rounded-lg text-sm w-full">
                          <span className="font-bold">⚠️ ผิดปกติ:</span> {report.complication_detail}
                        </div>
                      ) : (
                        <div className="text-success bg-green-50 px-3 py-1 rounded-lg text-sm w-full font-medium">
                          ✅ ปกติ / ไม่มีอาการ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* รูปภาพ */}
                  {report.image_url && (
                    <div className="mt-4">
                      <a href={report.image_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                        <img 
                          src={report.image_url} 
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" 
                          alt="หลักฐานการเยี่ยม" 
                        />
                      </a>
                      <p className="text-xs text-center text-slate-400 mt-2">แตะที่รูปเพื่อดูภาพขนาดเต็ม</p>
                    </div>
                  )}
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}