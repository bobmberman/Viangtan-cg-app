import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// การตั้งค่า Marker Icon สำหรับ Leaflet
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// การเชื่อมต่อ Supabase
const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Component สำหรับจัดการการเคลื่อนที่ของแผนที่
const MapUpdater = ({ target }: { target: { lat: number, lng: number, trigger: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 500);
    return () => clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    if (target) {
      setTimeout(() => map.flyTo([target.lat, target.lng], 18, { animate: true, duration: 1.5 }), 400);
    }
  }, [target, map]);
  return null;
};

export default function Admin() {
  // --- States หลัก ---
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // --- States สำหรับการกรองข้อมูล ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [dateFilter, setDateFilter] = useState('');
  const [flyToTarget, setFlyToTarget] = useState<{lat: number, lng: number, trigger: number} | null>(null);

  // --- States สำหรับ Pagination (เพิ่มใหม่) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // อัปเดตเวลาเรียลไทม์
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // โหลดข้อมูลจาก Supabase
  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('cg_reports').select('*').order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  // --- Logic การกรองข้อมูล ---
  const filteredReports = reports.filter((report) => {
    const matchesName = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || report.complication_status === statusFilter;
    const matchesDate = !dateFilter || new Date(report.created_at).toLocaleDateString('en-CA') === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  // เมื่อตัวกรองเปลี่ยน ให้รีเซ็ตกลับไปหน้า 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  // --- Logic การแบ่งหน้า (Pagination Logic) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem); // ข้อมูลที่จะแสดงในตาราง
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // ฟังก์ชันแสดงรูปภาพขนาดใหญ่
  const showFullImage = (url: string) => {
    Swal.fire({ imageUrl: url, showConfirmButton: false, showCloseButton: true, width: 'auto', background: 'rgba(255,255,255,0.98)', padding: '0' });
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบข้อมูล' });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  // ฟังก์ชันช่วยสำหรับการ Export Excel
  const getBase64FromUrl = async (url: string) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  const exportToExcelWithImages = async () => {
    if (filteredReports.length === 0) return Swal.fire('ไม่มีข้อมูล', 'ไม่พบข้อมูลที่ตรงตามตัวกรอง', 'info');
    Swal.fire({ title: 'กำลังเตรียมไฟล์...', text: 'กรุณารอสักครู่ครับ', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('รายงานการเยี่ยม');
      worksheet.columns = [
        { header: 'รูปถ่าย', key: 'img', width: 22 }, { header: 'ชื่อผู้สูงอายุ', key: 'name', width: 25 },
        { header: 'วันที่เยี่ยม', key: 'date', width: 15 }, { header: 'สถานะ', key: 'status', width: 12 },
        { header: 'กิจกรรม', key: 'act', width: 35 }, { header: 'Latitude', key: 'lat', width: 15 }, { header: 'Longitude', key: 'lng', width: 15 }
      ];
      for (let i = 0; i < filteredReports.length; i++) {
        const report = filteredReports[i];
        const row = worksheet.addRow({ name: report.patient_name, date: new Date(report.created_at).toLocaleDateString('th-TH'), status: report.complication_status, act: report.activities, lat: report.latitude || '-', lng: report.longitude || '-' });
        row.height = 95; row.alignment = { vertical: 'middle', horizontal: 'left' };
        if (report.image_url) {
          try {
            const base64: any = await getBase64FromUrl(report.image_url);
            const imageId = workbook.addImage({ base64: base64.split(',')[1], extension: 'jpeg' });
            worksheet.addImage(imageId, { tl: { col: 0.1, row: i + 1.1 }, ext: { width: 120, height: 120 } });
          } catch (e) {}
        }
      }
      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `รายงานเยี่ยมบ้าน_เวียงตาล_${new Date().getTime()}.xlsx`; link.click();
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire('Error', 'สร้างไฟล์ไม่สำเร็จ', 'error'); }
  };

  // ฟังก์ชันสร้างข้อมูลจำลอง
  const generateMockData = async () => {
    Swal.fire({ title: 'กำลังสร้างข้อมูลจำลอง...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const mockData = [];
      const names = ['คุณยาย ทองดี', 'คุณตา บุญมี', 'คุณตา สมชาย', 'คุณยาย สมศรี', 'คุณตา ประเสริฐ', 'คุณยาย มะลิ', 'คุณตา วินัย', 'คุณยาย วันดี', 'คุณตา อำนวย', 'คุณยาย สมใจ'];
      const acts = ['วัดสัญญาณชีพ', 'ช่วยเหลือการกิน', 'กายภาพบำบัด', 'พูดคุยให้กำลังใจ', 'ทำความสะอาดร่างกาย'];
      
      for (let i = 0; i < 25; i++) {
        const isAbnormal = Math.random() > 0.8;
        const lat = 18.3245 + (Math.random() - 0.5) * 0.04;
        const lng = 99.3245 + (Math.random() - 0.5) * 0.04;
        const randomActs = [acts[Math.floor(Math.random() * acts.length)], acts[Math.floor(Math.random() * acts.length)]];
        const uniqueActs = [...new Set(randomActs)].join(', ');
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 7));

        mockData.push({
          patient_name: names[Math.floor(Math.random() * names.length)] + ` (Mock ${i+1})`,
          activities: uniqueActs,
          complication_status: isAbnormal ? 'ผิดปกติ' : 'ปกติ',
          complication_detail: isAbnormal ? 'ความดันสูงกว่าปกติ มีไข้ต่ำๆ' : '',
          image_url: `https://picsum.photos/400/300?random=${Date.now() + i}`,
          latitude: lat,
          longitude: lng,
          created_at: pastDate.toISOString()
        });
      }
      const { error } = await supabase.from('cg_reports').insert(mockData);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'เพิ่มข้อมูลจำลอง 25 รายการเรียบร้อยแล้ว', timer: 2000 });
      fetchReports();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // --- ข้อมูลสำหรับ Dashboard ---
  const total = filteredReports.length;
  const abnormal = filteredReports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const todayCount = filteredReports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
  const normal = total - abnormal;

  const pieData = [
    { name: 'ปกติ', value: normal, color: '#05CD99' },
    { name: 'ผิดปกติ', value: abnormal, color: '#FFB547' }
  ];

  const patientStats = filteredReports.reduce((acc, curr) => {
    acc[curr.patient_name] = (acc[curr.patient_name] || 0) + 1;
    return acc;
  }, {} as any);
  const barData = Object.keys(patientStats).map(key => ({ name: key.split(' ')[1] || key, เยี่ยม: patientStats[key] })).slice(0, 5);

  const wiangTanCenter: [number, number] = [18.3245, 99.3245];

  const focusOnMap = (lat: any, lng: any) => {
    if (!lat || !lng) {
      Swal.fire({ icon: 'info', title: 'ไม่มีพิกัด', text: 'รายงานนี้ไม่มีการบันทึกพิกัด GPS', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      return;
    }
    setFlyToTarget({ lat: Number(lat), lng: Number(lng), trigger: Date.now() });
    const mainArea = document.getElementById('main-scroll-area');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 flex bg-[#F4F7FE] font-['Kanit'] overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Kanit', sans-serif; }
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* --- Sidebar --- */}
      <aside className={`absolute lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#2B3674] text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col flex-shrink-0 shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
            <div className="w-10 h-10 bg-[#05CD99] rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-[#05CD99]/30">V</div>
            <div>
              <h1 className="text-xl font-bold tracking-wider leading-none">Viangtan</h1>
              <p className="text-[10px] opacity-70 tracking-widest mt-1">SmartCity</p>
            </div>
        </div>
        
        <div className="p-4 mt-4 flex-1 overflow-y-auto">
          <p className="text-[10px] text-slate-400 font-bold mb-3 pl-4 uppercase tracking-wider">Main Menu</p>
          <div className="bg-white text-[#2B3674] p-3.5 rounded-xl flex items-center gap-3 shadow-lg font-bold text-sm cursor-pointer mb-2">
            📊 แดชบอร์ด
          </div>
          <div className="text-white/60 hover:bg-white/10 p-3.5 rounded-xl flex items-center gap-3 font-medium text-sm cursor-pointer transition-all hover:text-white">
            👥 จัดการผู้ใช้งาน
          </div>
        </div>

        <div className="p-4 m-4 bg-white/10 rounded-2xl border border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">B</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">Adisak (Beum)</p>
              <p className="text-[10px] text-[#05CD99] font-bold">● Online</p>
            </div>
          </div>
          <button className="w-full py-2 bg-white text-[#2B3674] text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors">
            [→ Logout
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-[#F4F7FE]">
        
        <header className="px-8 py-5 flex flex-wrap gap-4 justify-between items-center bg-white border-b border-slate-100 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex lg:hidden items-center justify-center bg-slate-100 rounded-full text-[#4318FF]" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="text-xl font-bold text-[#2B3674]">ภาพรวมระบบเยี่ยมบ้าน</h1>
              <p className="text-[#707EAE] text-[11px] font-medium uppercase tracking-widest mt-0.5">Executive Command Center</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="text-[#4318FF] font-bold text-lg tabular-nums">{time.toLocaleTimeString('th-TH')}</div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="text-xs text-slate-400 font-medium">{time.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <span className="text-xl opacity-30 ml-1">🕒</span>
          </div>

          <div className="hidden sm:flex items-center gap-3">
             <div className="text-right">
               <p className="text-sm font-bold text-[#2B3674]">Adisak (Beum)</p>
               <p className="text-[10px] text-slate-400 font-medium">ผู้ดูแลระบบ</p>
             </div>
             <div className="w-10 h-10 bg-[#4318FF] text-white rounded-full flex items-center justify-center font-bold">👤</div>
          </div>
        </header>

        <main id="main-scroll-area" className="flex-1 p-6 lg:p-8 overflow-y-auto scroll-smooth">
          
          {/* --- Stats Cards --- */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <p className="text-xs font-medium opacity-80 mb-2">ทั้งหมด</p>
               <h3 className="text-4xl font-bold">{total}</h3>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <p className="text-xs font-medium opacity-80 mb-2">ผิดปกติ</p>
               <h3 className="text-4xl font-bold">{abnormal}</h3>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <p className="text-xs font-medium opacity-80 mb-2">เคสใหม่วันนี้</p>
               <h3 className="text-4xl font-bold">{todayCount}</h3>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <p className="text-xs font-medium opacity-80 mb-2">ปกติ</p>
               <h3 className="text-4xl font-bold">{normal}</h3>
            </div>
          </div>

          {/* --- Map & Charts --- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-4 h-[450px] flex flex-col border border-slate-100">
              <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="font-bold text-[#2B3674] text-sm flex items-center gap-2">📍 แผนที่จุดเยี่ยมบ้าน</h4>
                <div className="flex gap-2">
                  <button onClick={generateMockData} className="text-[10px] bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1 rounded-lg font-bold">🛠️ จำลองข้อมูล</button>
                  <button onClick={fetchReports} disabled={loading} className="text-[10px] bg-indigo-50 text-[#4318FF] px-3 py-1 rounded-lg font-bold">{loading ? '...' : '🔄 โหลดใหม่'}</button>
                </div>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden bg-slate-100 relative z-0">
                <MapContainer center={wiangTanCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="🛰️ แผนที่ดาวเทียม">
                      <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="🛣️ แผนที่ถนน">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  <MapUpdater target={flyToTarget} />
                  {filteredReports.filter(r => r.latitude && r.longitude).map(r => (
                    <Marker key={r.id} position={[r.latitude, r.longitude]} icon={markerIcon}>
                      <Popup>
                        <div className="font-kanit">
                          <b className="text-[#2B3674]">{r.patient_name}</b>
                          <p className="text-xs text-slate-500 mt-1">{r.activities}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 h-[450px] flex flex-col border border-slate-100">
              <h4 className="font-bold text-[#2B3674] text-sm mb-4 px-2">📝 10 กิจกรรมล่าสุด</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {filteredReports.slice(0, 10).map((r) => (
                  <div key={r.id} onClick={() => focusOnMap(r.latitude, r.longitude)} className="p-3 rounded-xl border bg-slate-50 flex gap-3 items-center cursor-pointer hover:border-blue-300">
                    <img src={r.image_url || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2B3674] text-xs truncate">{r.patient_name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">🕒 {new Date(r.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 h-[450px] flex flex-col border border-slate-100">
                <h4 className="font-bold text-[#2B3674] text-xs text-center mb-4">สถิติความถี่การเยี่ยม (คน)</h4>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                      <ChartTooltip />
                      <Bar dataKey="เยี่ยม" fill="#4318FF" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* --- Table Section with Pagination --- */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6">
              <input type="text" placeholder="ค้นหาชื่อ..." className="input input-bordered bg-slate-50 h-10 text-sm flex-1" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select className="select select-bordered bg-slate-50 h-10 text-sm w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ทั้งหมด">ทั้งหมด</option><option value="ปกติ">ปกติ</option><option value="ผิดปกติ">ผิดปกติ</option>
              </select>
              <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] text-white border-none h-10">📗 Excel</button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-3">รูปภาพ</th>
                    <th>ชื่อผู้สูงอายุ</th>
                    <th>วันที่ส่ง</th>
                    <th className="text-center">แผนที่</th>
                    <th className="text-center">สถานะ</th>
                    <th className="text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {currentItems.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                      <td className="p-3">
                        {r.image_url ? <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-10 h-10 object-cover rounded-lg cursor-pointer" /> : '-'}
                      </td>
                      <td className="p-3 font-medium text-[#2B3674]">{r.patient_name}</td>
                      <td className="p-3 text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => focusOnMap(r.latitude, r.longitude)} className="btn btn-ghost btn-xs text-[#4318FF] bg-blue-50">📍 ซูม</button>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${r.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-red-500">🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 font-medium">ไม่พบข้อมูลที่ค้นหา</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- Pagination Controls --- */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-50 pt-6">
              <p className="text-sm text-slate-500">
                แสดง <span className="font-bold text-[#2B3674]">{filteredReports.length > 0 ? indexOfFirstItem + 1 : 0}</span> ถึง <span className="font-bold text-[#2B3674]">{Math.min(indexOfLastItem, filteredReports.length)}</span> จากทั้งหมด <span className="font-bold text-[#2B3674]">{filteredReports.length}</span> รายการ
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-[#2B3674]"
                >
                  ← ก่อนหน้า
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // แสดงเฉพาะหน้าปัจจุบัน, หน้าแรก, หน้าสุดท้าย และหน้ารอบข้าง (กรณีหน้าเยอะ)
                    if (totalPages <= 5 || pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${currentPage === pageNum ? 'bg-[#4318FF] text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-300">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-[#2B3674]"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}