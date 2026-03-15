import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

// --- 🔗 เชื่อมต่อกับ Supabase ---
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [patientName, setPatientName] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [complicationStatus, setComplicationStatus] = useState('ปกติ');
  const [complicationDetail, setComplicationDetail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    // ดึงพิกัด GPS ทันทีที่เปิดแอป
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error("GPS Error:", error), 
        { enableHighAccuracy: true }
      );
    }
    return () => clearInterval(timer);
  }, []);

  const handleActivityChange = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || activities.length === 0 || !imageFile) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อ เลือกกิจกรรม และถ่ายรูปด้วยครับ', confirmButtonColor: '#4318FF' });
      return;
    }

    setLoading(true);
    try {
      // 📍 Refresh GPS ก่อนส่งเพื่อความแม่นยำ
      let finalLat = location?.lat;
      let finalLng = location?.lng;
      if ("geolocation" in navigator) {
        try {
          const pos: any = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 }));
          finalLat = pos.coords.latitude;
          finalLng = pos.coords.longitude;
        } catch (err) {
          console.warn("ใช้พิกัดล่าสุดที่บันทึกไว้");
        }
      }

      // 📸 Upload Photo
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('cg-images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('cg-images').getPublicUrl(fileName);

      // 💾 Insert Data
      const { error: insertError } = await supabase.from('cg_reports').insert([{
        patient_name: patientName,
        activities: activities.join(', '),
        complication_status: complicationStatus,
        complication_detail: complicationStatus === 'ผิดปกติ' ? complicationDetail : '',
        image_url: publicUrlData.publicUrl,
        latitude: finalLat,
        longitude: finalLng
      }]);
      if (insertError) throw insertError;

      await Swal.fire({ icon: 'success', title: 'ส่งรายงานสำเร็จ!', text: 'บันทึกพิกัดและข้อมูลเรียบร้อย', timer: 2000, showConfirmButton: false });
      
      // ล้างค่าฟอร์ม
      setPatientName(''); setActivities([]); setComplicationStatus('ปกติ'); setComplicationDetail(''); setImageFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message, confirmButtonColor: '#EE5D50' });
    } finally {
      setLoading(false);
    }
  };

  return (
    // 📱 โครงสร้างหลักสำหรับ Mobile 100%
    <div className="min-h-screen w-full bg-[#F4F7FE] font-['Kanit'] overflow-x-hidden flex flex-col pb-10">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Kanit', sans-serif; }
        body, html { margin: 0; padding: 0; width: 100%; overflow-x: hidden; background-color: #F4F7FE; }
      `}</style>
      
      {/* 🔵 App Bar (ติดขอบบนเสมอ) */}
      <header className="bg-gradient-to-r from-[#4318FF] to-[#6039FF] text-white p-6 rounded-b-[2rem] shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white shadow-inner backdrop-blur-sm">V</div>
          <div>
            <h1 className="text-xl font-bold tracking-wider leading-none uppercase">Viangtan</h1>
            <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">CG Field Ops</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold block leading-none tabular-nums">{time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[10px] text-[#05CD99] font-bold tracking-widest uppercase">● Online</span>
        </div>
      </header>

      {/* ⚪ พื้นที่เนื้อหาหลัก */}
      <main className="flex-1 px-5 pt-6 flex flex-col gap-5 max-w-md mx-auto w-full">
        
        {/* 📍 GPS Status Badge */}
        <div className={`p-4 rounded-2xl shadow-sm border text-xs font-bold text-center flex items-center justify-center gap-2 transition-all ${location ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100 animate-pulse'}`}>
          {location ? (
            <><span>📍</span> <span>พิกัดพร้อมบันทึก: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span></>
          ) : (
            <><span>⚠️</span> <span>กำลังค้นหาสัญญาณ GPS...</span></>
          )}
        </div>

        {/* 📝 ฟอร์มบันทึกข้อมูล */}
        <div className="bg-white rounded-[2rem] shadow-sm p-6 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* รายชื่อ */}
            <div className="form-control">
              <label className="label pb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">ชื่อผู้สูงอายุ</span></label>
              <select className="select select-bordered w-full bg-[#F4F7FE] border-none rounded-2xl h-14 font-bold text-[#2B3674] focus:ring-2 focus:ring-[#4318FF]/20" value={patientName} onChange={(e) => setPatientName(e.target.value)} required>
                <option value="" disabled>-- กดเลือกรายชื่อ --</option>
                <option value="คุณยาย ทองดี มั่งคั่ง">คุณยาย ทองดี มั่งคั่ง</option>
                <option value="คุณตา บุญมี ศรีสุข">คุณตา บุญมี ศรีสุข</option>
              </select>
            </div>

            {/* กิจกรรม (แบบปุ่มกดขนาดใหญ่) */}
            <div className="form-control">
              <label className="label pb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">กิจกรรมที่ดำเนินการ</span></label>
              <div className="grid grid-cols-1 gap-3">
                {['วัดสัญญาณชีพ', 'ช่วยเหลือการกิน', 'กายภาพบำบัด'].map((act) => (
                  <button 
                    key={act} 
                    type="button"
                    onClick={() => handleActivityChange(act)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${activities.includes(act) ? 'bg-[#E9E3FF] border-[#4318FF] text-[#4318FF]' : 'bg-[#F4F7FE] border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <span className="font-bold text-sm">{act}</span>
                    <span className="text-xl leading-none">{activities.includes(act) ? '✅' : '⬜'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* การประเมิน */}
            <div className="form-control">
              <label className="label pb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">การประเมินอาการเบื้องต้น</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setComplicationStatus('ปกติ')} className={`py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${complicationStatus === 'ปกติ' ? 'bg-[#05CD99] text-white shadow-lg shadow-emerald-100' : 'bg-[#F4F7FE] text-slate-400'}`}>✅ ปกติ</button>
                <button type="button" onClick={() => setComplicationStatus('ผิดปกติ')} className={`py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${complicationStatus === 'ผิดปกติ' ? 'bg-[#EE5D50] text-white shadow-lg shadow-red-100' : 'bg-[#F4F7FE] text-slate-400'}`}>🚨 ผิดปกติ</button>
              </div>
            </div>

            {/* ช่องกรอกรายละเอียดเมื่อผิดปกติ */}
            {complicationStatus === 'ผิดปกติ' && (
              <div className="form-control animate-fade-in">
                <textarea className="textarea bg-red-50 border-none focus:ring-2 focus:ring-red-200 rounded-2xl w-full h-28 text-red-600 font-bold placeholder:text-red-300 p-4" placeholder="ระบุอาการผิดปกติที่พบ..." value={complicationDetail} onChange={(e) => setComplicationDetail(e.target.value)} required></textarea>
              </div>
            )}

            {/* รูปถ่าย (Camera) */}
            <div className="form-control">
              <label className="label pb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">รูปถ่ายสถานที่/กิจกรรม</span></label>
              <div className="relative">
                <input id="file-upload" type="file" accept="image/*" capture="environment" className="file-input w-full bg-[#F4F7FE] border-none rounded-2xl h-14 font-medium text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4318FF]/10 file:text-[#4318FF] hover:file:bg-[#4318FF]/20" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} required />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-center gap-1"><span>📍</span> ระบบจะบันทึกพิกัดอัตโนมัติเมื่อกดส่ง</p>
            </div>

            {/* ปุ่มส่ง */}
            <button type="submit" className={`btn btn-primary w-full rounded-2xl h-16 text-lg font-black bg-[#4318FF] hover:bg-[#3311CC] border-none shadow-xl shadow-indigo-200 active:scale-95 transition-all mt-4 ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกและส่งรายงาน'}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}