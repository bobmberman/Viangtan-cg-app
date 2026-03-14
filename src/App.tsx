import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

// 🔴 1. นำ URL และ Key จาก Supabase มาใส่ตรงนี้ครับ
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';

// สร้างตัวเชื่อมต่อฐานข้อมูล
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  // 🟢 2. สร้าง State สำหรับเก็บข้อมูลในฟอร์ม
  const [patientName, setPatientName] = useState('');
  const [tasks, setTasks] = useState({
    task1: false, task2: false, task3: false, task4: false
  });
  const [complication, setComplication] = useState('ปกติ');
  const [compDetail, setCompDetail] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  // 🟢 3. ฟังก์ชันจัดการเมื่อมีการกดปุ่มส่งข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo) {
      Swal.fire('แจ้งเตือน', 'กรุณาถ่ายภาพหลักฐานการเยี่ยมด้วยครับ', 'warning');
      return;
    }

    Swal.fire({
      title: 'กำลังอัปโหลดข้อมูล...',
      html: 'กรุณารอสักครู่ ระบบกำลังจัดเก็บรูปภาพและข้อมูล',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      // --- ขั้นตอน A: อัปโหลดรูปลง Storage (ถัง cg-images) ---
      const fileName = `${Date.now()}_${photo.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cg-images')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      // ดึง URL ของรูปภาพที่อัปโหลดเสร็จแล้ว
      const { data: publicUrlData } = supabase.storage
        .from('cg-images')
        .getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      // --- ขั้นตอน B: เตรียมข้อมูลกิจกรรมเป็นข้อความ ---
      const activityList = [];
      if (tasks.task1) activityList.push('วัดสัญญาณชีพ');
      if (tasks.task2) activityList.push('ช่วยเหลือการกิน');
      if (tasks.task3) activityList.push('ช่วยเหลือการขับถ่าย/อาบน้ำ');
      if (tasks.task4) activityList.push('ทำกายภาพบำบัด');
      const activitiesString = activityList.join(', ');

      // --- ขั้นตอน C: บันทึกข้อมูลลงตาราง cg_reports ---
      const { error: insertError } = await supabase
        .from('cg_reports')
        .insert([{
          patient_name: patientName,
          activities: activitiesString,
          complication_status: complication,
          complication_detail: complication === 'ผิดปกติ' ? compDetail : '-',
          image_url: imageUrl
        }]);

      if (insertError) throw insertError;

      // --- ขั้นตอน D: แจ้งเตือนสำเร็จและล้างฟอร์ม ---
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'ส่งรายงานการเยี่ยมเรียบร้อยแล้ว',
        confirmButtonColor: '#27ae60'
      });

      // ล้างข้อมูลหน้าจอเพื่อรอรับเคสใหม่
      setPatientName('');
      setTasks({ task1: false, task2: false, task3: false, task4: false });
      setComplication('ปกติ');
      setCompDetail('');
      setPhoto(null);
      (document.getElementById('photoInput') as HTMLInputElement).value = '';

    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่',
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  // 🟢 4. ส่วนแสดงผล (หน้าตาแอปพลิเคชัน)
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.headerTitle}>📝 บันทึกการเยี่ยม (CG)</h2>
        
        <form onSubmit={handleSubmit}>
          {/* ส่วนที่ 1: ชื่อผู้ป่วย */}
          <label style={styles.label}>ผู้สูงอายุ / ผู้มีภาวะพึ่งพิง</label>
          <select 
            required 
            style={styles.input} 
            value={patientName} 
            onChange={(e) => setPatientName(e.target.value)}
          >
            <option value="">-- เลือกรายชื่อ --</option>
            <option value="คุณตา สมชาย ใจดี">คุณตา สมชาย ใจดี</option>
            <option value="คุณยาย สมศรี รักสงบ">คุณยาย สมศรี รักสงบ</option>
            <option value="คุณตา บุญมี แสงสว่าง">คุณตา บุญมี แสงสว่าง</option>
            <option value="คุณยาย ทองดี มั่งคั่ง">คุณยาย ทองดี มั่งคั่ง</option>
          </select>

          {/* ส่วนที่ 2: กิจกรรม */}
          <label style={styles.label}>กิจกรรมที่ดูแลวันนี้ (เลือกได้มากกว่า 1)</label>
          <div style={styles.boxGroup}>
            <label style={styles.checkLabel}>
              <input type="checkbox" style={styles.checkbox} checked={tasks.task1} onChange={(e) => setTasks({...tasks, task1: e.target.checked})} /> วัดสัญญาณชีพ
            </label>
            <label style={styles.checkLabel}>
              <input type="checkbox" style={styles.checkbox} checked={tasks.task2} onChange={(e) => setTasks({...tasks, task2: e.target.checked})} /> ช่วยเหลือการกิน
            </label>
            <label style={styles.checkLabel}>
              <input type="checkbox" style={styles.checkbox} checked={tasks.task3} onChange={(e) => setTasks({...tasks, task3: e.target.checked})} /> ช่วยเหลือการขับถ่าย/อาบน้ำ
            </label>
            <label style={styles.checkLabel}>
              <input type="checkbox" style={styles.checkbox} checked={tasks.task4} onChange={(e) => setTasks({...tasks, task4: e.target.checked})} /> ทำกายภาพบำบัด
            </label>
          </div>

          {/* ส่วนที่ 3: ภาวะแทรกซ้อน */}
          <label style={styles.label}>พบภาวะแทรกซ้อนหรือไม่?</label>
          <div style={styles.boxGroup}>
            <label style={styles.checkLabel}>
              <input type="radio" name="comp" value="ปกติ" style={styles.checkbox} checked={complication === 'ปกติ'} onChange={() => setComplication('ปกติ')} /> 🟢 ปกติ / ไม่มีอาการ
            </label>
            <label style={styles.checkLabel}>
              <input type="radio" name="comp" value="ผิดปกติ" style={styles.checkbox} checked={complication === 'ผิดปกติ'} onChange={() => setComplication('ผิดปกติ')} /> 🔴 ผิดปกติ / มีภาวะแทรกซ้อน
            </label>
          </div>

          {/* ซ่อน/แสดง ช่องกรอกอาการ */}
          {complication === 'ผิดปกติ' && (
            <div style={{ marginTop: '10px' }}>
              <label style={styles.label}>ระบุอาการผิดปกติที่พบ:</label>
              <input 
                type="text" 
                required 
                placeholder="เช่น มีไข้สูง, แผลกดทับ" 
                style={styles.input}
                value={compDetail}
                onChange={(e) => setCompDetail(e.target.value)}
              />
            </div>
          )}

          {/* ส่วนที่ 4: รูปภาพ */}
          <label style={styles.label}>📷 ถ่ายภาพหลักฐาน</label>
          <input 
            id="photoInput"
            type="file" 
            accept="image/*" 
            capture="environment" 
            style={styles.input} 
            onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
          />

          <button type="submit" style={styles.submitBtn}>
            💾 บันทึกและส่งรายงาน
          </button>
        </form>
      </div>
    </div>
  );
}

// 🎨 5. สไตล์ CSS ตกแต่งให้สวยงามและเหมาะกับมือถือ
const styles = {
  container: {
    fontFamily: '"Sarabun", sans-serif',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '450px'
  },
  headerTitle: {
    textAlign: 'center' as const,
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '20px'
  },
  label: {
    fontWeight: 'bold',
    display: 'block',
    marginTop: '15px',
    marginBottom: '8px',
    color: '#34495e'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ced4da',
    boxSizing: 'border-box' as const,
    fontSize: '16px'
  },
  boxGroup: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '16px',
    cursor: 'pointer'
  },
  checkbox: {
    transform: 'scale(1.4)',
    marginRight: '12px'
  },
  submitBtn: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '16px',
    width: '100%',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '30px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(39, 174, 96, 0.3)'
  }
};