import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- เชื่อมต่อกับ Supabase ---
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Admin() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลจากฐานข้อมูล
  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cg_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching:', error);
      alert('ดึงข้อมูลไม่สำเร็จ');
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

// ฟังก์ชันสำหรับลบข้อมูล
const deleteReport = async (id: string) => {
    if (!window.confirm('คุณแน่ใจใช่ไหมว่าจะลบรายงานนี้?')) return;

    const { error } = await supabase
      .from('cg_reports')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    } else {
      // เมื่อลบสำเร็จ ให้ดึงข้อมูลใหม่มาแสดงทันที
      fetchReports();
    }
  };


  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>📋 รายงานการเยี่ยม (CM)</h2>
        <button onClick={fetchReports} style={styles.refreshBtn}>
          {loading ? 'กำลังโหลด...' : '🔄 รีเฟรช'}
        </button>
      </header>

      {reports.length === 0 && !loading ? (
        <div style={styles.empty}>ยังไม่มีข้อมูลการเยี่ยมในขณะนี้</div>
      ) : (
        <div style={styles.list}>
          {reports.map((item) => (
            <div key={item.id} style={styles.card}>
             <div style={styles.cardHeader}>
    <span style={styles.patientName}>👵 {item.patient_name}</span>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <span style={styles.date}>{new Date(item.created_at).toLocaleDateString('th-TH')}</span>
      <button 
        onClick={() => deleteReport(item.id)} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
      >
        🗑️
      </button>
    </div>
  </div> 
              
              <div style={styles.cardBody}>
                <p><strong>กิจกรรม:</strong> {item.activities}</p>
                <p>
                  <strong>สถานะ:</strong> {' '}
                  {item.complication_status === 'ผิดปกติ' ? (
                    <span style={styles.dangerText}>⚠️ ผิดปกติ: {item.complication_detail}</span>
                  ) : (
                    <span style={styles.successText}>✅ ปกติ</span>
                  )}
                </p>
              </div>

              {item.image_url && (
                <div style={styles.imageContainer}>
                  <a href={item.image_url} target="_blank" rel="noreferrer">
                    <img src={item.image_url} alt="หลักฐาน" style={styles.image} />
                  </a>
                  <p style={styles.imageHint}>แตะที่รูปเพื่อดูภาพใหญ่</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- สไตล์การตกแต่ง (เน้นใช้งานบนมือถือได้ดี) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '15px',
    fontFamily: '"Sarabun", sans-serif',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  title: { margin: 0, fontSize: '1.2rem', color: '#1a73e8' },
  refreshBtn: {
    padding: '8px 15px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '15px' },
  card: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    borderLeft: '5px solid #1a73e8',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
  },
  patientName: { fontWeight: 'bold', color: '#333' },
  date: { fontSize: '0.85rem', color: '#666' },
  cardBody: { fontSize: '0.95rem', lineHeight: '1.5', color: '#444' },
  dangerText: { color: '#d93025', fontWeight: 'bold' },
  successText: { color: '#188038', fontWeight: 'bold' },
  imageContainer: { marginTop: '10px', textAlign: 'center' },
  image: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  imageHint: { fontSize: '0.75rem', color: '#888', marginTop: '5px' },
  empty: { textAlign: 'center', padding: '50px', color: '#888' },
};

