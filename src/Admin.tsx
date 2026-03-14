import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- เชื่อมต่อกับ Supabase (ใช้ค่าเดิมของคุณ Boem) ---
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- State สำหรับ Modal ลบข้อมูล ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cg_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setReports(data || []);
    setLoading(false);
  };

  // 1. ฟังก์ชันเรียกเปิด Modal
  const askDelete = (id: string) => {
    setTargetId(id);
    setIsModalOpen(true);
  };

  // 2. ฟังก์ชันยืนยันการลบจริง
  const confirmDelete = async () => {
    if (!targetId) return;
    setIsDeleting(true);
    
    const { error } = await supabase.from('cg_reports').delete().eq('id', targetId);

    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    } else {
      await fetchReports();
      setIsModalOpen(false); // ปิด Modal
    }
    setIsDeleting(false);
    setTargetId(null);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>📋 รายงานการเยี่ยม (CM)</h2>
        <button onClick={fetchReports} style={styles.refreshBtn}>
          {loading ? '...' : '🔄 รีเฟรช'}
        </button>
      </header>

      <div style={styles.list}>
        {reports.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.patientName}>👵 {item.patient_name}</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={styles.date}>{new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                <button onClick={() => askDelete(item.id)} style={styles.deleteIcon}>🗑️</button>
              </div>
            </div>
            <div style={styles.cardBody}>
              <p><strong>กิจกรรม:</strong> {item.activities}</p>
              <p><strong>สถานะ:</strong> {item.complication_status === 'ผิดปกติ' ? '⚠️ ' + item.complication_detail : '✅ ปกติ'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- ส่วนของหน้าจอ Animation Modal --- */}
      {isModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <div style={styles.modalIcon}>⚠️</div>
            <h3>ยืนยันการลบข้อมูล?</h3>
            <p>หากลบแล้วข้อมูลรายนี้จะหายไปจากระบบทันที ไม่สามารถกู้คืนได้</p>
            <div style={styles.modalActions}>
              <button onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>ยกเลิก</button>
              <button onClick={confirmDelete} style={styles.confirmBtn} disabled={isDeleting}>
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation (ใส่ไว้ในสไตล์) */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// --- ปรับปรุงสไตล์เพิ่มเติม ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '15px', fontFamily: '"Sarabun", sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '10px' },
  title: { margin: 0, fontSize: '1.2rem', color: '#1a73e8' },
  refreshBtn: { padding: '8px 15px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '5px' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { backgroundColor: 'white', padding: '15px', borderRadius: '10px', borderLeft: '5px solid #1a73e8' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px' },
  patientName: { fontWeight: 'bold' },
  date: { fontSize: '0.85rem', color: '#888' },
  deleteIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' },
  cardBody: { marginTop: '10px', fontSize: '0.9rem' },
  
  // สไตล์สำหรับ Modal
  modalBackdrop: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '85%', maxWidth: '400px',
    textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' // ใส่ Animation ตรงนี้
  },
  modalIcon: { fontSize: '3rem', marginBottom: '10px' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', backgroundColor: '#eee', cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#d93025', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
};