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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

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

  useEffect(() => { fetchReports(); }, []);

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
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 7));
        mockData.push({
          patient_name: names[Math.floor(Math.random() * names.length)] + ` (Mock)`,
          activities: [acts[Math.floor(Math.random() * acts.length)]].join(', '),
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
      Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'เพิ่มข้อมูลจำลองแล้ว', timer: 2000 });
      fetchReports();
    } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
  };

  const filteredReports = reports.filter((report) => {
    const matchesName = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || report.complication_status === statusFilter;
    const matchesDate = !dateFilter || new Date(report.created_at).toLocaleDateString('en-CA') === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  const total = filteredReports.length;
  const abnormal = filteredReports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;

  // Pie Data - แก้ไขให้มีการใช้งานตัวแปร
  const pieData = [
    { name: 'ปกติ', value: normal, color: '#05CD99' },
    { name: 'ผิดปกติ', value: abnormal, color: '#FFB547' }
  ];

  const patientStats = filteredReports.reduce((acc, curr) => {
    acc[curr.patient_name] = (acc[curr.patient_name] || 0) + 1;
    return acc;
  }, {} as any);
  const barData = Object.keys(patientStats).map(key => ({ name: key.split(' ')[1] || key, เยี่ยม: patientStats[key] })).slice(0, 5);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFilter, itemsPerPage]);

  const focusOnMap = (lat: any, lng: any, id: string) => {
    if (!lat || !lng) return;
    setFlyToTarget({ lat: Number(lat), lng: Number(lng), trigger: Date.now() });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 3000);
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

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`absolute lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#2B3674] text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
            <div className="w-10 h-10 bg-[#05CD99] rounded-full flex items-center justify-center font-bold">V</div>
            <h1 className="text-xl font-bold">Viangtan</h1>
        </div>
        <div className="p-4 flex-1">
          <div className="bg-white text-[#2B3674] p-3 rounded-xl flex items-center gap-3 font-bold text-sm">📊 แดชบอร์ด</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="px-8 py-5 flex justify-between items-center bg-white border-b border-slate-100 shrink-0 z-20">
          <button className="lg:hidden text-[#2B3674]" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <h1 className="text-xl font-bold text-[#2B3674]">ระบบสารสนเทศเยี่ยมบ้าน</h1>
          <div className="text-[#4318FF] font-bold tabular-nums bg-indigo-50 px-4 py-2 rounded-full">{time.toLocaleTimeString('th-TH')}</div>
        </header>

        <main id="main-scroll-area" className="flex-1 p-6 lg:p-8 overflow-y-auto scroll-smooth custom-scrollbar">
          {/* Summary Widgets */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#4318FF] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">ทั้งหมด</p>
               <h3 className="text-3xl font-bold">{total}</h3>
            </div>
            <div className="bg-[#FFB547] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">ผิดปกติ</p>
               <h3 className="text-3xl font-bold">{abnormal}</h3>
            </div>
            <div className="bg-[#00B5E2] p-6 rounded-2xl text-white shadow-lg">
               <p className="text-xs opacity-80 mb-1">ปกติ</p>
               <h3 className="text-3xl font-bold">{normal}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-4 h-[450px] flex flex-col border border-slate-100 xl:col-span-2">
              <h4 className="font-bold text-[#2B3674] text-sm mb-4 px-2">📍 แผนที่จุดเยี่ยมบ้าน</h4>
              <div className="flex-1 rounded-xl overflow-hidden bg-slate-100">
                <MapContainer center={[18.3245, 99.3245]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="แผนที่">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  <MapUpdater target={flyToTarget} />
                  {filteredReports.filter(r => r.latitude && r.longitude).map(r => (
                    <Marker key={r.id} position={[r.latitude, r.longitude]} icon={markerIcon}>
                      <Popup><b className="text-indigo-700">{r.patient_name}</b></Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 h-[450px] flex flex-col border border-slate-100">
              <h4 className="font-bold text-[#2B3674] text-xs text-center mb-6">ความถี่การเยี่ยม (5 อันดับ)</h4>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="50%">
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
                    <ChartTooltip />
                    <Bar dataKey="เยี่ยม" fill="#4318FF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Pie Chart - เพิ่มการแสดงผล */}
                <h4 className="font-bold text-[#2B3674] text-xs text-center mt-4 mb-2">สัดส่วนสถานะ</h4>
                <ResponsiveContainer width="100%" height="40%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex flex-wrap gap-4 mb-6">
              <input type="text" placeholder="ค้นหาชื่อ..." className="input input-bordered h-10 text-sm flex-1" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select className="select select-bordered h-10 text-sm w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ทั้งหมด">ทั้งหมด</option><option value="ปกติ">ปกติ</option><option value="ผิดปกติ">ผิดปกติ</option>
              </select>
              {/* Fix setDateFilter Error */}
              <input type="date" className="input input-bordered h-10 text-sm w-40" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              <select className="select select-bordered h-10 text-sm w-32" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                <option value={10}>10 รายการ</option><option value={20}>20 รายการ</option><option value={50}>50 รายการ</option>
              </select>
              <button onClick={generateMockData} className="btn btn-ghost h-10 text-xs">🛠️ จำลอง</button>
              <button onClick={exportToExcelWithImages} className="btn bg-[#05CD99] text-white border-none h-10">📗 Excel</button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="p-4">รูปภาพ</th><th>ชื่อผู้สูงอายุ</th><th>วันที่เยี่ยม</th><th className="text-center">พิกัด</th><th className="text-center">สถานะ</th><th className="text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {currentItems.map((r) => (
                    <tr key={r.id} className={`hover:bg-slate-50 border-b border-slate-50 transition-colors ${highlightedId === r.id ? 'row-active' : ''}`}>
                      <td className="p-4">{r.image_url ? <img src={r.image_url} onClick={() => showFullImage(r.image_url)} className="w-10 h-10 object-cover rounded-lg cursor-pointer" /> : '-'}</td>
                      <td className="p-4 font-bold text-[#2B3674]">{r.patient_name}</td>
                      <td className="p-4 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => focusOnMap(r.latitude, r.longitude, r.id)} className="btn btn-ghost btn-xs text-[#4318FF] bg-blue-50">📍 ซูมดู</button>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${r.complication_status === 'ผิดปกติ' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {r.complication_status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelectedReport(r)} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold">📄 รายละเอียด</button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 p-2 ml-2">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400">รายการที่ {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, total)} จาก {total}</span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn btn-ghost btn-xs">ก่อนหน้า</button>
                <span className="text-xs font-bold py-1">หน้า {currentPage}</span>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="btn btn-ghost btn-xs">ถัดไป</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/50 backdrop-blur-md rounded-full text-white font-bold">✕</button>
            <div className="h-48 bg-slate-200">
              {selectedReport.image_url && <img src={selectedReport.image_url} className="w-full h-full object-cover" />}
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#2B3674]">{selectedReport.patient_name}</h2>
              <p className="text-sm text-slate-400 mb-4">เยี่ยมเมื่อ: {new Date(selectedReport.created_at).toLocaleString('th-TH')}</p>
              <div className="bg-slate-50 p-4 rounded-xl mb-4 text-sm">
                <b>กิจกรรม:</b> {selectedReport.activities}
              </div>
              {selectedReport.complication_status === 'ผิดปกติ' && (
                <div className="bg-red-50 p-4 rounded-xl text-red-700 text-sm">
                  <b>ความผิดปกติ:</b> {selectedReport.complication_detail || 'ไม่ได้ระบุ'}
                </div>
              )}
              <button onClick={() => setSelectedReport(null)} className="w-full mt-6 py-4 bg-[#4318FF] text-white font-bold rounded-2xl">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}