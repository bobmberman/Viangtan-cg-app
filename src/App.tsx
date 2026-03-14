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

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
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
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('cg-images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('cg-images').getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from('cg_reports').insert([{
        patient_name: patientName,
        activities: activities.join(', '),
        complication_status: complicationStatus,
        complication_detail: complicationStatus === 'ผิดปกติ' ? complicationDetail : '',
        image_url: imageUrl,
      }]);
      if (insertError) throw insertError;

      await Swal.fire({ icon: 'success', title: 'ส่งรายงานสำเร็จ!', text: 'ข้อมูลถูกบันทึกเข้าระบบเรียบร้อย', timer: 2000, showConfirmButton: false });
      
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
    <div className="flex h-screen w-screen bg-[#F4F7FE] font-kanit overflow-hidden">
      
      {/* --- Sidebar (สไตล์เดียวกับ Admin) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 text-center">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Viangtan</h1>
            <p className="text-[10px] opacity-60 tracking-[0.2em] uppercase">Caregiver Portal</p>
        </div>
        <nav className="p-6 space-y-3 mt-6">
          <div className="bg-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl border border-white/10">📝 <span className="font-bold">บันทึกรายงาน</span></div>
          <div className="p-4 rounded-2xl flex items-center gap-4 opacity-50 hover:bg-white/10 cursor-pointer transition-all">📋 ประวัติการส่ง</div>
        </nav>
        <div className="absolute bottom-10 w-full px-6">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">CG</div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">เจ้าหน้าที่ภาคสนาม</p>
                    <p className="text-[10px] opacity-50 uppercase">Online</p>
                </div>
            </div>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header (สไตล์เดียวกับ Admin) */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm lg:hidden border border-slate-100" onClick={() => setIsSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4318FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B3674] leading-none">บันทึกการเยี่ยม</h1>
              <p className="text-[#707EAE] text-sm mt-1 font-medium">SmartCity Field Operation</p>
            </div>
          </div>
          <div className="text-right hidden sm:block bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-50">
             <span className="text-[#4318FF] font-black text-2xl leading-none block">{time.toLocaleTimeString('th-TH')}</span>
             <span className="text-[10px] text-[#707EAE] font-bold uppercase">{time.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto pt-0">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-white p-8 sm:p-10 mb-10">
              
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. เลือกชื่อ */}
                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">ชื่อผู้สูงอายุ / ผู้มีภาวะพึ่งพิง</span></label>
                  <select className="select select-bordered bg-[#F4F7FE] border-none rounded-2xl h-14 text-[#2B3674] focus:ring-2 focus:ring-[#4318FF] transition-all" value={patientName} onChange={(e) => setPatientName(e.target.value)} required>
                    <option value="" disabled>-- คลิกเพื่อเลือกรายชื่อ --</option>
                    <option value="คุณยาย ทองดี มั่งคั่ง">คุณยาย ทองดี มั่งคั่ง</option>
                    <option value="คุณตา บุญมี ศรีสุข">คุณตา บุญมี ศรีสุข</option>
                  </select>
                </div>

                {/* 2. กิจกรรม */}
                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">กิจกรรมที่ดำเนินการ</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                    {['วัดสัญญาณชีพ', 'ช่วยเหลือการกิน', 'ทำกายภาพบำบัด', 'ทำความสะอาดที่พัก'].map((act) => (
                      <label key={act} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${activities.includes(act) ? 'bg-[#E9E3FF] border-[#4318FF] text-[#4318FF]' : 'bg-[#F4F7FE] border-transparent text-[#707EAE]'}`}>
                        <input type="checkbox" className="checkbox checkbox-primary hidden" checked={activities.includes(act)} onChange={() => handleActivityChange(act)} />
                        <span className="font-bold text-sm">{activities.includes(act) ? '✅ ' : '⬜ '}{act}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. สถานะ */}
                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">การประเมินอาการ</span></label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setComplicationStatus('ปกติ')} className={`flex-1 py-4 rounded-2xl font-black text-sm border transition-all hover:scale-[1.02] active:scale-[0.98] ${complicationStatus === 'ปกติ' ? 'bg-[#05CD99] text-white border-[#05CD99] shadow-xl shadow-[#05cd99]/20' : 'bg-[#F4F7FE] text-[#707EAE] border-transparent'}`}>✅ ปกติ</button>
                    <button type="button" onClick={() => setComplicationStatus('ผิดปกติ')} className={`flex-1 py-4 rounded-2xl font-black text-sm border transition-all hover:scale-[1.02] active:scale-[0.98] ${complicationStatus === 'ผิดปกติ' ? 'bg-[#EE5D50] text-white border-[#EE5D50] shadow-xl shadow-[#ee5d50]/20' : 'bg-[#F4F7FE] text-[#707EAE] border-transparent'}`}>🚨 ผิดปกติ</button>
                  </div>
                </div>

                {complicationStatus === 'ผิดปกติ' && (
                  <div className="form-control animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea className="textarea textarea-bordered bg-[#FFF5F5] border-[#EE5D50]/20 rounded-2xl h-28 text-[#EE5D50] placeholder:text-[#EE5D50]/30 font-bold" placeholder="ระบุอาการผิดปกติที่พบโดยละเอียด..." value={complicationDetail} onChange={(e) => setComplicationDetail(e.target.value)} required></textarea>
                  </div>
                )}

                {/* 4. รูปถ่าย */}
                <div className="form-control">
                  <label className="label"><span className="text-sm font-bold text-[#2B3674] uppercase tracking-wider">อัปโหลดรูปถ่ายหลักฐาน</span></label>
                  <div className="relative group">
                    <input id="file-upload" type="file" accept="image/*" className="file-input file-input-bordered bg-[#F4F7FE] border-none w-full rounded-2xl text-[#707EAE]" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} required />
                  </div>
                </div>

                {/* 5. ปุ่มส่ง */}
                <button type="submit" className={`btn btn-primary w-full rounded-[1.5rem] h-16 text-lg font-black shadow-2xl shadow-[#4318ff]/30 border-none bg-[#4318FF] hover:bg-[#3311CC] transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกและส่งรายงาน'}
                </button>

              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}