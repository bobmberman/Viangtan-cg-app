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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // --- 📍 State สำหรับเก็บพิกัด GPS ---
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // อัปเดตเวลาและดึงพิกัดเบื้องต้นเมื่อเปิดแอป
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // ดึงพิกัด GPS ทันทีที่เข้าแอป
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
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
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกข้อมูลและแนบรูปถ่ายให้ครบครับ', confirmButtonColor: '#4318FF' });
      return;
    }

    setLoading(true);

    try {
      // 1. ดึงพิกัดที่แม่นยำที่สุดอีกครั้งก่อนส่ง (Refresh Location)
      let finalLat = location?.lat;
      let finalLng = location?.lng;

      if ("geolocation" in navigator) {
        try {
          const position: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
          });
          finalLat = position.coords.latitude;
          finalLng = position.coords.longitude;
        } catch (err) {
          console.warn("Could not refresh GPS, using last known position.");
        }
      }

      // 2. อัปโหลดรูปภาพไปยัง Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('cg-images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('cg-images').getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      // 3. บันทึกข้อมูลลงฐานข้อมูล (รวมพิกัด GPS)
      const { error: insertError } = await supabase.from('cg_reports').insert([{
        patient_name: patientName,
        activities: activities.join(', '),
        complication_status: complicationStatus,
        complication_detail: complicationStatus === 'ผิดปกติ' ? complicationDetail : '',
        image_url: imageUrl,
        latitude: finalLat, // บันทึกลงคอลัมน์ latitude
        longitude: finalLng // บันทึกลงคอลัมน์ longitude
      }]);
      if (insertError) throw insertError;

      await Swal.fire({ 
        icon: 'success', 
        title: 'ส่งรายงานสำเร็จ!', 
        text: 'บันทึกข้อมูลและพิกัดลงพื้นที่เรียบร้อย', 
        timer: 2000, 
        showConfirmButton: false 
      });
      
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
    <div className="flex h-screen w-screen bg-[#F4F7FE] font-kanit overflow-hidden relative">
      
      {/* Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <div className="text-left">
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Viangtan</h1>
                <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase mt-1">Caregiver Portal</p>
            </div>
            <button className="lg:hidden text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-6 space-y-3 mt-6 text-sm">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10" onClick={() => setIsSidebarOpen(false)}>
            <span>📝</span> <span className="font-bold">บันทึกรายงาน</span>
          </div>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-white/20">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md lg:hidden border border-slate-100 text-[#4318FF]" onClick={() => setIsSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-none">บันทึกการลงพื้นที่</h1>
              <p className="text-[#707EAE] text-sm mt-1 font-medium italic">Wiangtan Smart City Ops</p>
            </div>
          </div>
          <div className="hidden sm:block text-right bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-50">
             <span className="text-[#4318FF] font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto pt-0">
          <div className="max-w-2xl mx-auto">
            
            {/* 📍 แถบแจ้งสถานะ GPS ให้เจ้าหน้าที่เห็น */}
            <div className={`mt-6 mb-2 p-3 rounded-2xl text-[11px] font-bold text-center border transition-all ${location ? 'bg-[#F2FFF9] text-[#05CD99] border-[#05CD99]/20' : 'bg-[#FFF5F5] text-[#EE5D50] border-[#EE5D50]/20 animate-pulse'}`}>
              {location ? `✅ ระบบพร้อมบันทึกพิกัด: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : '⚠️ กำลังค้นหาสัญญาณ GPS (กรุณาอนุญาตการเข้าถึงตำแหน่ง)'}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-white p-8 sm:p-10 mb-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">ชื่อผู้สูงอายุ</span></label>
                  <select className="select select-bordered bg-[#F4F7FE] border-none rounded-2xl h-14 text-[#2B3674] focus:ring-2 focus:ring-[#4318FF]" value={patientName} onChange={(e) => setPatientName(e.target.value)} required>
                    <option value="" disabled>-- คลิกเพื่อเลือกรายชื่อ --</option>
                    <option value="คุณยาย ทองดี มั่งคั่ง">คุณยาย ทองดี มั่งคั่ง</option>
                    <option value="คุณตา บุญมี ศรีสุข">คุณตา บุญมี ศรีสุข</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">กิจกรรมวันนี้</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                    {['วัดสัญญาณชีพ', 'ช่วยเหลือการกิน', 'กายภาพบำบัด'].map((act) => (
                      <label key={act} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${activities.includes(act) ? 'bg-[#E9E3FF] border-[#4318FF] text-[#4318FF] shadow-lg shadow-indigo-100' : 'bg-[#F4F7FE] border-transparent text-[#707EAE]'}`}>
                        <input type="checkbox" className="hidden" checked={activities.includes(act)} onChange={() => handleActivityChange(act)} />
                        <span className="font-bold text-sm">{activities.includes(act) ? '✅ ' : '⬜ '}{act}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">การประเมินเบื้องต้น</span></label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setComplicationStatus('ปกติ')} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${complicationStatus === 'ปกติ' ? 'bg-[#05CD99] text-white shadow-xl shadow-[#05cd99]/20' : 'bg-[#F4F7FE] text-[#707EAE]'}`}>✅ ปกติ</button>
                    <button type="button" onClick={() => setComplicationStatus('ผิดปกติ')} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${complicationStatus === 'ผิดปกติ' ? 'bg-[#EE5D50] text-white shadow-xl shadow-[#ee5d50]/20' : 'bg-[#F4F7FE] text-[#707EAE]'}`}>🚨 ผิดปกติ</button>
                  </div>
                </div>

                {complicationStatus === 'ผิดปกติ' && (
                  <textarea className="textarea bg-[#FFF5F5] border-[#EE5D50]/20 rounded-2xl w-full h-28 text-[#EE5D50] font-bold" placeholder="ระบุอาการผิดปกติที่พบโดยละเอียด..." value={complicationDetail} onChange={(e) => setComplicationDetail(e.target.value)} required></textarea>
                )}

                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">รูปถ่ายหลักฐาน (ถ่ายที่บ้านผู้สูงอายุ)</span></label>
                  <input id="file-upload" type="file" accept="image/*" className="file-input bg-[#F4F7FE] border-none w-full rounded-2xl text-[#707EAE]" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} required />
                </div>

                <button type="submit" className={`btn btn-primary w-full rounded-3xl h-16 text-lg font-black shadow-2xl shadow-[#4318ff]/30 border-none bg-[#4318FF] hover:bg-[#3311CC] transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? 'กำลังบันทึกพิกัดและข้อมูล...' : '💾 ส่งรายงานพร้อมพิกัด GPS'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}