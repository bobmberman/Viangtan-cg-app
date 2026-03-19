import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Marker Setup ---
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', text: "เมื่อลบแล้วข้อมูลจะไม่สามารถกู้คืนได้", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ลบเลย' });
    if (result.isConfirmed) {
      await supabase.from('cg_reports').delete().eq('id', id);
      fetchReports();
    }
  };

  const exportToExcelWithImages = async () => {
    // ... ฟังก์ชันเดิมของคุณ (คงไว้ตามเดิม)
  };

  const filteredReports = reports.filter((report) => {
    const matchesName = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ทั้งหมด' || report.complication_status === statusFilter;
    const matchesDate = !dateFilter || new Date(report.created_at).toLocaleDateString('en-CA') === dateFilter;
    return matchesName && matchesStatus && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentItems = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = filteredReports.length;
  const abnormal = filteredReports.filter(r => r.complication_status === 'ผิดปกติ').length;
  const normal = total - abnormal;

  const barData = Object.entries(filteredReports.reduce((acc, curr) => {
    acc[curr.patient_name] = (acc[curr.patient_name] || 0) + 1;
    return acc;
  }, {} as any)).map(([name, count]) => ({ name: name.split(' ')[1] || name, เยี่ยม: count })).slice(0, 5);

  const focusOnMap = (lat: any, lng: any) => {
    if (!lat || !lng) {
      Swal.fire({ icon: 'info', title: 'ไม่มีพิกัด', text: 'รายงานนี้ไม่มีการบันทึกพิกัด GPS', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      return;
    }
    setFlyToTarget({ lat: Number(lat), lng: Number(lng), trigger: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 flex bg-[#F4F7FE] font-['Kanit'] overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Kanit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .table-spacing { border-separate: border-spacing: 0 0.75rem; }
      `}</style>
      
      {/* Sidebar (ใช้โค้ดเดิมของคุณ) */}
      <aside className={`absolute lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#2B3674] text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shrink-0`}>
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center font-bold shadow-lg">V</div>
          <span className="font-bold text-xl tracking-wide">Viangtan</span>
        </div>
        <div className="p-4 flex-1">
          <div className="bg-white/10 p-3.5 rounded-xl flex items-center gap-3 font-bold text-sm mb-2 shadow-inner">📊 แดชบอร์ด</div>
          <div className="text-white/60 hover:bg-white/5 p-3.5 rounded-xl flex items-center gap-3 font-medium text-sm cursor-pointer transition-colors">👥 จัดการข้อมูล</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        
        {/* Header */}
        <header className="px-8 py-5 flex justify-between items-center bg-white border-b border-slate-100 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-[#2B3674] text-2xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h1 className="text-xl font-bold text-[#2B3674]">หน้าจัดการระบบเยี่ยมบ้าน</h1>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100">
            <span className="text-indigo-600 font-bold tabular-nums">{time.toLocaleTimeString('th-TH')}</span>
            <div className="w-px h-4 bg-indigo-200"></div>
            <span className="text-xs text-indigo-400 font-medium">{time.toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
          </div>
        </header>

        <main id="main-scroll-area" className="flex-1 p-6 lg:p-8 overflow-y-auto scroll-smooth custom-scrollbar">
          
          {/* Summary Stats (Cards) */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ทั้งหมด</span>
              <h3 className="text-4xl font-extrabold text-[#2B3674]">{total}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">ผิดปกติ</span>
              <h3 className="text-4xl font-extrabold text-orange-500">{abnormal}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">ปกติ</span>
              <h3 className="text-4xl font-extrabold text-emerald-500">{normal}</h3>
            </div>
            <div className="bg-[#4318FF] p-6 rounded-3xl shadow-lg flex flex-col items-center text-white">
              <span className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">วันนี้</span>
              <h3 className="text-4xl font-extrabold">{todayCount}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Map (Card) */}
            <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm p-5 border border-slate-100 h-[450px] flex flex-col">
              <h4 className="font-bold text-[#2B3674] mb-4 flex items-center gap-2">📍 แผนที่แสดงตำแหน่งล่าสุด</h4>
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-50 relative z-0 shadow-inner">
                <MapContainer center={wiangTanCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater target={flyToTarget} />
                  {filteredReports.map(r => r.latitude && (
                    <Marker key={r.id} position={[r.latitude, r.longitude]} icon={markerIcon}>
                      <Popup><b>{r.patient_name}</b><br/>{r.complication_status}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Top Stats (Chart Card) */}
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 h-[450px] flex flex-col items-center">
              <h4 className="font-bold text-[#2B3674] mb-8">📊 สถิติการเยี่ยม 5 อันดับแรก</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fontWeight: 500, fill: '#707EAE'}} axisLine={false} tickLine={false} />
                  <ChartTooltip cursor={{fill: '#F4F7FE'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="เยี่ยม" fill="#4318FF" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Main Data Table Section */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
            
            {/* Table Filters Header */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
              <div className="flex flex-1 min-w-[300px] gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
                  <input 
                    type="text" placeholder="ค้นหาชื่อผู้สูงอายุ..." 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ทั้งหมด">ทุกสถานะ</option>
                  <option value="ปกติ">ปกติ</option>
                  <option value="ผิดปกติ">ผิดปกติ</option>
                </select>
                <input 
                  type="date" 
                  className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <select 
                   className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                   value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={10}>แสดง 10 รายการ</option>
                  <option value={20}>แสดง 20 รายการ</option>
                  <option value={50}>แสดง 50 รายการ</option>
                </select>
                <button onClick={exportToExcelWithImages} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2">
                  📗 ส่งออก Excel
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full table-spacing">
                <thead>
                  <tr className="text-slate-400 text-[11px] uppercase tracking-[0.1em] font-black">
                    <th className="px-6 pb-4 text-left">ผู้สูงอายุ / ข้อมูลการเยี่ยม</th>
                    <th className="px-6 pb-4 text-center">วันที่ส่งรายงาน</th>
                    <th className="px-6 pb-4 text-center">สถานะประเมิน</th>
                    <th className="px-6 pb-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((r) => (
                    <tr key={r.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                      {/* Patient & Image Info */}
                      <td className="px-6 py-5 bg-white border-y border-l border-slate-50 first:rounded-l-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            {r.image_url ? (
                              <img 
                                src={r.image_url} 
                                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-indigo-100 transition-all cursor-pointer"
                                onClick={() => showFullImage(r.image_url)}
                              />
                            ) : (
                              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 text-xs">No img</div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${r.complication_status === 'ผิดปกติ' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#2B3674] text-base truncate mb-0.5">{r.patient_name}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{r.activities || 'ไม่ได้ระบุกิจกรรม'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date Info */}
                      <td className="px-6 py-5 bg-white border-y border-slate-50 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <p className="text-sm font-bold text-[#2B3674]">{new Date(r.created_at).toLocaleDateString('th-TH')}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(r.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-5 bg-white border-y border-slate-50 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          r.complication_status === 'ผิดปกติ' 
                          ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {r.complication_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 bg-white border-y border-r border-slate-50 last:rounded-r-3xl text-right shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => focusOnMap(r.latitude, r.longitude)}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title="ดูพิกัดบนแผนที่"
                          >
                            📍
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id)}
                            className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            title="ลบข้อมูล"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {currentItems.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <div className="text-6xl mb-4">📂</div>
                  <p className="text-lg font-medium">ไม่พบข้อมูลการเยี่ยมในขณะนี้</p>
                  <button onClick={() => {setSearchTerm(''); setStatusFilter('ทั้งหมด'); setDateFilter('');}} className="mt-4 text-indigo-500 font-bold hover:underline">ล้างตัวกรองทั้งหมด</button>
                </div>
              )}
            </div>

            {/* Custom Pagination UI */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-400 font-medium">
                  แสดงหน้า <span className="text-[#2B3674] font-bold">{currentPage}</span> จากทั้งหมด <span className="text-[#2B3674] font-bold">{totalPages}</span> หน้า
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Logic to show limited page numbers (e.g., current, first, last)
                      if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-2xl text-sm font-bold transition-all ${
                              currentPage === pageNum 
                              ? 'bg-[#4318FF] text-white shadow-lg shadow-indigo-200' 
                              : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="text-slate-300 px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </main>
      </div>
    </div>
  );
}