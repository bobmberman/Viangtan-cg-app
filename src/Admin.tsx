import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const SUPABASE_URL = 'https://bietketdljzltumxfkgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o5Ofjv8ask6C1dk-Qe1ihw_g4mqqmUT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [dateFilter, setDateFilter] = useState('');
  const [flyToTarget, setFlyToTarget] = useState<{lat: number, lng: number, trigger: number} | null>(null);

  // --- States ใหม่ที่เพิ่มเข้ามา ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // สำหรับเลือกจำนวนแถว
  const [selectedReport, setSelectedReport] = useState<any | null>(null); // สำหรับ Detail Modal
  const [highlightedId, setHighlightedId] = useState<string | null>(null); // สำหรับ Row Highlighting

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('cg_reports').select('*').order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  const showFullImage = (url: string) => {
    Swal.fire({ imageUrl: url, showConfirmButton: false, showCloseButton: true, width: 'auto', background: 'rgba(255,255,255,0.98)', padding: '0' });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบข้อมูล' });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

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
          patient_name: names[Math.floor(Math.random() * names.length)] + ` (Mock)`,
          activities: uniqueActs,
          complication_status: isAbnormal ? 'ผิดปกติ' : 'ปกติ',
          complication_detail: isAbnormal ? 'ความดันสูงกว่าปกติ มีไข้ต่ำๆ และบ่นปวดหัว' : '',
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

  useEffect(() => { fetchReports(); }, []);

  const filteredReports = reports.filter((report) => {
    const matchesName = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || report.complication_status === statusFilter;
    const matchesDate = !dateFilter || new Date(report.created_at).toLocaleDateString('en-CA') === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  // --- Logic การแบ่งหน้า (Pagination) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFilter, itemsPerPage]);

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
  }, {});
  const barData = Object.keys(patientStats).map(key => ({ name: key.split(' ')[1] || key, เยี่ยม: patientStats[key] })).slice(0, 5);

  const wiangTanCenter: [number, number] = [18.3245, 99.3245];

  const focusOnMap = (lat: any, lng: any, id: string) => {
    if (!lat || !lng) {
      Swal.fire({ icon: 'info', title: 'ไม่มีพิกัด', text: 'รายงานนี้ไม่มีการบันทึกพิกัด GPS', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      return;
    }
    setFlyToTarget({ lat: Number(lat), lng: Number(lng), trigger: Date.now() });
    
    // --- จุดที่ 3: Row Highlighting ---
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 3000); // ไฮไลท์ไว้ 3 วินาที

    const mainArea = document.getElementById('main-scroll-area');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 flex bg-[#F4F7FE] font-['Kanit'] overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Kanit', sans-serif; }
        .row-active { background-color: #EBF1FF !important; transition: background-color 0.4s ease; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`absolute lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#2B3674] text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col flex-shrink-0 shadow-2xl lg:shadow-none`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
            <div className="w-10 h-10 bg-[#05CD99] rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-[#05CD99]/30">V</div>
            <div>
              <h1 className="text-xl font-bold tracking-wider leading-none">Viangtan</h1>
              <p className="text-[10px] opacity-70 tracking-widest mt-1">SmartCity</p>
            </div>
        </div>
        <div className="p-4 mt-4 flex-1">
          <div className="bg-white text-[#2B3674] p-3.5 rounded-xl flex items-center gap-3 shadow-lg font-bold text-sm cursor-pointer mb-2">📊 แดชบอร์ด</div>
          <div className="text-white/60 hover:bg-white/10 p-3.5 rounded-xl flex items-center gap-3 font-medium text-sm cursor-pointer">👥 จัดการผู้ใช้งาน</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-[#F4F7FE]">
        
        <header className="px-8 py-5 flex flex-wrap gap-4 justify-between items-center bg-white border-b border-slate-100 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex lg:hidden items-center justify-center bg-slate-100 rounded-full text-[#4318FF]" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h1 className="text-xl font-bold text-[#2B3674]">ระบบสารสนเทศเยี่ยมบ้าน</h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">
            <div className="text-[#4318FF] font-bold text-lg tabular-nums">{time.toLocaleTimeString('th-TH')}</div>
          </div>
        </header>

        <main id="main-scroll-area" className="flex-1 p-6 lg:p-8 overflow-y-auto scroll-smooth custom-scrollbar">
          
          {/* Dashboard Summary Widgets */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">ทั้งหมด</p>
               <h3 className="text-4xl font-bold">{total}</h3>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">ผิดปกติ</p>
               <h3 className="text-4xl font-bold">{abnormal}</h3>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">วันนี้</p>
               <h3 className="text-4xl font-bold">{todayCount}</h3>
            </div>
            <div className="bg-[#05CD99] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">ปกติ</p>
               <h3 className="text-4xl font-bold">{normal}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-4 h-[450px] flex flex-col border border-slate-100 xl:col-span-2">
              <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="font-bold text-[#2B3674] text-sm">📍 แผนที่จุดเยี่ยมบ้าน</h4>
                <div className="flex gap-2">
                  <button onClick={generateMockData} className="text-[10px] bg-orange-50 text-orange-600 px-3 py-1 rounded-lg font-bold">🛠️ จำลองข้อมูล</button>
                  <button onClick={fetchReports} disabled={loading} className="text-[10px] bg-indigo-50 text-[#4318FF] px-3 py-1 rounded-lg font-bold">🔄 อัปเดต</button>
                </div>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden bg-slate-100">
                <MapContainer center={wiangTanCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater target={flyToTarget} />
                  {filteredReports.filter(r => r.latitude && r.longitude).map(r => (
                    <Marker key={r.id} position={[r.latitude, r.longitude]} icon={markerIcon}>
                      <Popup>
                        <div className="text-xs">
                          <b className="text-indigo-700">{r.patient_name}</b><br/>
                          {r.complication_status}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 h-[450px] flex flex-col border border-slate-100">
              <h4 className="font-bold text-[#2B3674] text-xs text-center mb-6">ความถี่การเยี่ยม (5 ลำดับแรก)</h4>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ChartTooltip cursor={{ fill: '#F4F7FE' }} />
                    <Bar dataKey="เยี่ยม" fill="#4318FF" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* --- Table Section --- */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 mb-8">
            <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6 items-center">
              <input type="text" placeholder="ค้นหาชื่อ..." className="input input-bordered bg-slate-50 h-10 text-sm flex-1" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select className="select select-bordered bg-slate-50 h-10 text-sm w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ทั้งหมด">สถานะทั้งหมด</option><option value="ปกติ">ปกติ</option><option value="ผิดปกติ">ผิดปกติ</option>
              </select>
              
              {/* --- จุดที่ 2: Rows Per Page Selector --- */}
              <select className="select select-bordered bg-slate-50 h-10 text-sm w-32" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                <option value={10}>หน้าละ 10</option>
                <option value={20}>หน้าละ 20</option>
                <option value={50}>หน้าละ 50</option>
              </select>

              <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] text-white border-none h-10">📗 Excel</button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-50">
                  <tr>
                    <th className="rounded-l-lg p-4">รูปภาพ</th>
                    <th>ชื่อผู้สูงอายุ</th>
                    <th>วันที่เยี่ยม</th>
                    <th className="text-center">พิกัด</th>
                    <th className="text-center">สถานะ</th>
                    <th className="text-right rounded-r-lg">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {currentItems.map((r) => (
                    <tr key={r.id} className={`hover:bg-slate-50/50 border-b border-slate-50 transition-colors ${highlightedId === r.id ? 'row-active' : ''}`}>
                      <td className="p-4">
                        {r.image_url ? <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-10 h-10 object-cover rounded-lg cursor-pointer border border-slate-200" /> : '-'}
                      </td>
                      <td className="p-4 font-bold text-[#2B3674]">{r.patient_name}</td>
                      <td className="p-4 text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => focusOnMap(r.latitude, r.longitude, r.id)} className="btn btn-ghost btn-xs text-[#4318FF] bg-blue-50 px-3">📍 ซูมดู</button>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${r.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {/* --- จุดที่ 1: Detail Modal Trigger --- */}
                        <button onClick={() => setSelectedReport(r)} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold">📄 รายละเอียด</button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-4">
              <span className="text-xs text-slate-400 font-medium">
                รายการ {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredReports.length)} จากทั้งหมด {filteredReports.length}
              </span>
              <div className="flex gap-1">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 disabled:opacity-20"
                >
                  ย้อนกลับ
                </button>
                <div className="flex gap-1 items-center px-4 font-bold text-[#2B3674] text-xs">
                  หน้า {currentPage} จาก {totalPages || 1}
                </div>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 disabled:opacity-20"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- จุดที่ 1: Detail Modal --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/50 backdrop-blur-md rounded-full text-white font-bold">✕</button>
            
            <div className="relative h-56 bg-slate-200">
              {selectedReport.image_url ? (
                <img src={selectedReport.image_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">ไม่มีรูปถ่าย</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-8 text-white">
                <h2 className="text-3xl font-bold">{selectedReport.patient_name}</h2>
                <p className="text-sm opacity-80">เยี่ยมบ้านเมื่อ: {new Date(selectedReport.created_at).toLocaleString('th-TH')}</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">กิจกรรมการดูแล</p>
                  <p className="text-sm font-medium text-[#2B3674] leading-relaxed">{selectedReport.activities}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">พิกัด GPS</p>
                  <p className="text-sm font-medium text-[#2B3674]">{selectedReport.latitude?.toFixed(5)}, {selectedReport.longitude?.toFixed(5)}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">ประเมินสถานะ</p>
                <span className={`px-4 py-2 rounded-xl text-xs font-bold ${selectedReport.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {selectedReport.complication_status}
                </span>
                
                {selectedReport.complication_status === 'ผิดปกติ' && (
                  <div className="mt-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-1">รายละเอียดความผิดปกติที่พบ</p>
                    <p className="text-sm font-medium text-red-700">{selectedReport.complication_detail || 'ไม่ได้ระบุรายละเอียด'}</p>
                  </div>
                )}
              </div>

              <button onClick={() => setSelectedReport(null)} className="w-full py-4 bg-[#4318FF] text-white font-bold rounded-2xl hover:bg-[#3311db] transition-colors">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}