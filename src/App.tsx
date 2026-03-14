import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

// --- 🔗 เชื่อมต่อกับ Supabase ---
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  // --- 📦 State สำหรับเก็บข้อมูลที่ CG กรอก ---
  const [patientName, setPatientName] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [complicationStatus, setComplicationStatus] = useState('ปกติ');
  const [complicationDetail, setComplicationDetail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // --- ⚙️ ฟังก์ชันจัดการเมื่อติ๊กเลือกกิจกรรม ---
  const handleActivityChange = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  // --- 🚀 ฟังก์ชันบันทึกและส่งข้อมูล ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // เช็คว่ากรอกข้อมูลครบไหมก่อนส่ง
    if (!patientName || activities.length === 0 || !imageFile) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อผู้สูงอายุ เลือกกิจกรรมอย่างน้อย 1 อย่าง และแนบรูปถ่ายครับ',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setLoading(true); // เริ่มปุ่มหมุนๆ

    try {
      // 1. อัปโหลดรูปภาพขึ้น Supabase Storage (ถัง cg-images)
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('cg-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // ดึงลิงก์รูปภาพที่อัปโหลดเสร็จแล้ว
      const { data: publicUrlData } = supabase.storage
        .from('cg-images')
        .getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      // 2. บันทึกข้อมูลข้อความลงตาราง cg_reports
      const { error: insertError } = await supabase.from('cg_reports').insert([
        {
          patient_name: patientName,
          activities: activities.join(', '),
          complication_status: complicationStatus,
          complication_detail: complicationStatus === 'ผิดปกติ' ? complicationDetail : '',
          image_url: imageUrl,
        },
      ]);

      if (insertError) throw insertError;

      // 3. แจ้งเตือนเมื่อสำเร็จแบบสวยๆ
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'ข้อมูลถูกส่งไปยัง CM เรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });

      // 4. ล้างข้อมูลในฟอร์มให้ว่างเพื่อรอคีย์คนต่อไป
      setPatientName('');
      setActivities([]);
      setComplicationStatus('ปกติ');
      setComplicationDetail('');
      setImageFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      // แจ้งเตือนถ้ามี Error
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false); // หยุดหมุน
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* การ์ดฟอร์มหลัก */}
      <div className="card w-full max-w-lg bg-white shadow-xl border border-slate-200">
        <div className="card-body p-6 sm:p-8">
          <h2 className="card-title text-primary text-2xl mb-6 justify-center font-bold">
            📝 บันทึกการเยี่ยม (CG)
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- 1. เลือกชื่อ --- */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base text-slate-700">ผู้สูงอายุ / ผู้มีภาวะพึ่งพิง</span>
              </label>
              <select
                className="select select-bordered w-full bg-slate-50 text-base focus:border-primary"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              >
                <option value="" disabled>-- เลือกรายชื่อ --</option>
                <option value="คุณยาย ทองดี มั่งคั่ง">คุณยาย ทองดี มั่งคั่ง</option>
                <option value="คุณตา บุญมี ศรีสุข">คุณตา บุญมี ศรีสุข</option>
              </select>
            </div>

            {/* --- 2. เลือกกิจกรรม --- */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base text-slate-700">กิจกรรมที่ดูแลวันนี้ (เลือกได้มากกว่า 1)</span>
              </label>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                {['วัดสัญญาณชีพ', 'ช่วยเหลือการกิน', 'ช่วยเหลือการขับถ่าย/อาบน้ำ', 'ทำกายภาพบำบัด'].map((act) => (
                  <label key={act} className="cursor-pointer label justify-start gap-4 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={activities.includes(act)}
                      onChange={() => handleActivityChange(act)}
                    />
                    <span className="label-text text-base">{act}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* --- 3. ภาวะแทรกซ้อน --- */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base text-slate-700">พบภาวะแทรกซ้อนหรือไม่?</span>
              </label>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="cursor-pointer label justify-start gap-4 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="complication"
                    className="radio radio-success"
                    checked={complicationStatus === 'ปกติ'}
                    onChange={() => setComplicationStatus('ปกติ')}
                  />
                  <span className="label-text text-base font-medium text-success">🟢 ปกติ / ไม่มีอาการ</span>
                </label>
                <label className="cursor-pointer label justify-start gap-4 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="complication"
                    className="radio radio-error"
                    checked={complicationStatus === 'ผิดปกติ'}
                    onChange={() => setComplicationStatus('ผิดปกติ')}
                  />
                  <span className="label-text text-base font-medium text-error">🔴 ผิดปกติ / มีภาวะแทรกซ้อน</span>
                </label>
              </div>
            </div>

            {/* --- 4. ระบุอาการ (โชว์เมื่อเลือกผิดปกติ) --- */}
            {complicationStatus === 'ผิดปกติ' && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-error text-base">ระบุอาการที่พบโดยละเอียด</span>
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-error w-full h-24 text-base bg-red-50 focus:bg-white"
                  placeholder="เช่น มีไข้สูง 39 องศา, พบแผลกดทับบวมแดงบริเวณหลัง..."
                  value={complicationDetail}
                  onChange={(e) => setComplicationDetail(e.target.value)}
                  required
                ></textarea>
              </div>
            )}

            {/* --- 5. อัปโหลดรูป --- */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base text-slate-700">อัปโหลดภาพถ่ายหลักฐาน</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="file-input file-input-bordered file-input-primary w-full bg-slate-50"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                required
              />
            </div>

            {/* --- 6. ปุ่ม Submit --- */}
            <div className="card-actions mt-8">
              <button
                type="submit"
                className="btn btn-primary w-full text-lg h-14 shadow-lg shadow-blue-500/30"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-md"></span> : '💾 บันทึกและส่งรายงาน'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}