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
    // ดึงพิกัด GPS ทันที
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        null, { enableHighAccuracy: true }
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
      // Refresh GPS 
      let finalLat = location?.lat;
      let finalLng = location?.lng;
      if ("geolocation" in navigator) {
        const pos: any = await new Promise((res) => navigator.geolocation.getCurrentPosition(res, null, {enableHighAccuracy: true}));
        finalLat = pos.coords.latitude;
        finalLng = pos.coords.longitude;
      }

      // Upload Photo
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('cg-images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('cg-images').getPublicUrl(fileName);

      // Insert Data
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

      await Swal.fire({ icon: 'success', title: 'บันทึกเรียบร้อย!', timer: 2000, showConfirmButton: false });
      setPatientName(''); setActivities([]); setComplicationStatus('ปกติ'); setComplicationDetail(''); setImageFile(null);
      (document.getElementById('file-upload') as HTMLInputElement).value = '';

    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-kanit pb-10">
      
      {/* 📱 Mobile App Bar */}
      <header className="bg-[#4318FF] text-white p-6 rounded-b-[2.5rem] shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Viangtan CG</h1>
            <p className="text-[10px] opacity-70">ระบบบันทึกการเยี่ยมบ้านผู้สูงอายุ</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold block leading-none">{time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[10px] opacity-70">Online</span>
          </div>
        </div>
      </header>

      <main className="px-5 -mt-6">
        
        {/* 📍 GPS Status Badge */}
        <div className={`mb-4 p-3 rounded-2xl shadow-sm border text-[11px] font-bold text-center transition-all ${location ? 'bg-white text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100 animate-pulse'}`}>
          {location ? `📍 พิกัด GPS พร้อมบันทึกแล้ว` : '⚠️ กำลังค้นหาสัญญาณพิกัด...'}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm p-6 border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* รายชื่อ */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">ชื่อผู้สูงอายุ</label>
              <select className="select select-bordered w-full bg-slate-50 border-none rounded-2xl h-14 font-bold text-[#2B3674]" value={patientName} onChange={(e) => setPatientName(e.target.value)} required>
                <option value="" disabled>-- เลือกรายชื่อ --</option>
                <option value="คุณยาย ทองดี มั่งคั่ง">คุณยาย ทองดี มั่งคั่ง</option>
                <option value="คุณตา บุญมี ศรีสุข">คุณตา บุญมี ศรีสุข</option>
              </select>
            </div>

            {/* กิจกรรม (แบบปุ่มกดขนาดใหญ่) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">กิจกรรมวันนี้</label>
              <div className="grid grid-cols-1 gap-2">
                {['วัดสัญญาณชีพ', 'ช่วยเหลือการกิน', 'กายภาพบำบัด'].map((act) => (
                  <button 
                    key={act} 
                    type="button"
                    onClick={() => handleActivityChange(act)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${activities.includes(act) ? 'bg-[#E9E3FF] border-[#4318FF] text-[#4318FF]' : 'bg-slate-50 border-transparent text-slate-400'}`}
                  >
                    <span className="font-bold">{act}</span>
                    <span className="text-xl">{activities.includes(act) ? '✅' : '⬜'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* การประเมิน */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">การประเมินอาการ</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setComplicationStatus('ปกติ')} className={`py-4 rounded-2xl font-black text-sm transition-all ${complicationStatus === 'ปกติ' ? 'bg-[#05CD99] text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>✅ ปกติ</button>
                <button type="button" onClick={() => setComplicationStatus('ผิดปกติ')} className={`py-4 rounded-2xl font-black text-sm transition-all ${complicationStatus === 'ผิดปกติ' ? 'bg-[#EE5D50] text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>🚨 ผิดปกติ</button>
              </div>
            </div>

            {complicationStatus === 'ผิดปกติ' && (
              <textarea className="textarea bg-red-50 border-red-100 rounded-2xl w-full h-24 text-red-600 font-bold placeholder:text-red-200" placeholder="ระบุอาการผิดปกติ..." value={complicationDetail} onChange={(e) => setComplicationDetail(e.target.value)} required></textarea>
            )}

            {/* รูปถ่าย (Camera) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">ถ่ายรูปขณะเยี่ยม</label>
              <input id="file-upload" type="file" accept="image/*" capture="environment" className="file-input w-full bg-slate-50 border-none rounded-2xl" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} required />
              <p className="text-[9px] text-slate-400 mt-2 px-1">* ระบบจะบันทึกพิกัด GPS ลงในรูปภาพโดยอัตโนมัติ</p>
            </div>

            {/* ปุ่มส่ง */}
            <button type="submit" className={`btn btn-primary w-full rounded-3xl h-16 text-lg font-black bg-[#4318FF] border-none shadow-2xl shadow-indigo-200 active:scale-95 transition-transform ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? 'กำลังบันทึก...' : '💾 ส่งรายงานการเยี่ยม'}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}