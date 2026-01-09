// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import { backendUrl } from "./config";

// const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
// const PROJECTS_API_PATH = "/Project/GetAllProjects";

// const PSRTrendReport = () => { 
//   // Master Data Cache
//   const [masterProjects, setMasterProjects] = useState([]);
//   const [masterActuals, setMasterActuals] = useState([]);
//   const [masterForecasts, setMasterForecasts] = useState([]);
  
//   // Selection & Search State
//   const [searchTerm, setSearchTerm] = useState(""); // For the input field
//   const [selectedProjectId, setSelectedProjectId] = useState(""); // Actual selected ID
//   const [fiscalYear, setFiscalYear] = useState("2025");
//   const [showDropdown, setShowDropdown] = useState(false);
  
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const monthsMap = [
//     { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
//     { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
//     { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
//     { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
//   ];

//   // Fetch all data once on mount
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const [projRes, actualsRes, forecastRes] = await Promise.all([
//           axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
//           axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
//           axios.get(`${backendUrl}${FORECAST_API_PATH}`)
//         ]);

//         const projects = Array.isArray(projRes.data) ? projRes.data : [];
//         setMasterProjects(projects);
//         setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
//         setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);

//         if (projects.length > 0) {
//           setSelectedProjectId(projects[0].projectId);
//           setSearchTerm(`${projects[0].projectId} - ${projects[0].name}`);
//         }
//       } catch (err) {
//         setError("Failed to initialize dashboard data.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchInitialData();
//   }, []);

//   // Filter project list based on typing (Search Logic)
//   const filteredProjects = useMemo(() => {
//     if (!searchTerm) return masterProjects;
//     return masterProjects.filter(p => 
//       p?.projectId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
//       p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [searchTerm, masterProjects]);

//   // Recalculate Table Data locally when selection changes
//   const reportData = useMemo(() => {
//     if (!selectedProjectId || !masterActuals.length) return null;

//     const processed = {};
//     monthsMap.forEach((m) => {
//       const actualItems = masterActuals.filter(d => 
//         d?.projId?.toString().trim() === selectedProjectId.trim() && 
//         d?.fyCd?.toString() === fiscalYear && d.pdNo == m.id
//       );

//       const forecastItems = masterForecasts.filter(d => 
//         d?.projId?.toString().trim() === selectedProjectId.trim() && 
//         d?.year?.toString() === fiscalYear && d.month == m.id
//       );

//       const getSum = (items, typeNo) => items
//         .filter(item => item.subTotTypeNo === typeNo)
//         .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

//       const rev = getSum(actualItems, 1) || forecastItems.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
//       const labor = getSum(actualItems, 2) || forecastItems.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
//       const odc = getSum(actualItems, 3) || forecastItems.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
//       const ind = getSum(actualItems, 4) || forecastItems.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);

//       const restAmt = actualItems
//         .filter(item => item.subTotTypeNo !== 1)
//         .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

//       processed[m.name] = {
//         rev, labor, odc, ind,
//         netProfitActual: rev - restAmt,
//         type: actualItems.length > 0 ? "Actuals" : "Forecast"
//       };
//     });
//     return processed;
//   }, [selectedProjectId, fiscalYear, masterActuals, masterForecasts]);

//   // UI Table Helpers
//   const monthNames = monthsMap.map(m => m.name);
//   const v = (key) => monthNames.map(m => reportData?.[m]?.[key] || 0);
//   const sum = (a, b) => a.map((val, i) => val + b[i]);
//   const diff = (a, b) => a.map((val, i) => val - b[i]);
//   const marg = (n, d) => n.map((num, i) => d[i] === 0 ? "0.00" : ((num / d[i]) * 100).toFixed(2));

//   const revenue = v('rev');
//   const labor = v('labor');
//   const odc = v('odc');
//   const indirect = v('ind');
//   const directCost = sum(labor, odc);
//   const grossProfit = diff(revenue, directCost);
//   const grossMargin = marg(grossProfit, revenue);
//   const netProfit = monthNames.map((m, i) => 
//     reportData?.[m]?.type === "Actuals" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
//   );
//   const netMargin = marg(netProfit, revenue);

//   if (loading) return <div className="p-10 text-center text-blue-500 font-bold">Synchronizing Data...</div>;

//   return (
//     <div className="space-y-4">
//       {/* SEARCHABLE DROPDOWN FILTER */}
//       <div className="flex gap-4 p-4 bg-white border rounded-lg shadow-sm items-end">
//         <div className="flex flex-col flex-grow max-w-lg relative">
//           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Search & Select Project</label>
//           <input 
//             type="text"
//             placeholder="Type to filter projects..."
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(true);
//             }}
//             onFocus={() => setShowDropdown(true)}
//             className="p-2 text-sm border-2 border-gray-100 rounded focus:border-blue-500 outline-none w-full"
//           />
          
//           {showDropdown && filteredProjects.length > 0 && (
//             <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white border rounded shadow-xl">
//               {filteredProjects.map(p => (
//                 <div 
//                   key={p.projectId}
//                   className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0"
//                   onClick={() => {
//                     setSelectedProjectId(p.projectId);
//                     setSearchTerm(`${p.projectId} - ${p.name}`);
//                     setShowDropdown(false);
//                   }}
//                 >
//                   <span className="font-bold text-blue-700">{p.projectId}</span> - {p.name}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="flex flex-col">
//           <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fiscal Year</label>
//           <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="p-2 border-2 border-gray-100 rounded outline-none h-[38px]">
//             <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
//           </select>
//         </div>
//       </div>

//       {/* RENDER TABLE */}
//       {reportData ? (
//         <div className="bg-white border rounded overflow-hidden shadow-sm">
//           <table className="w-full text-[11px] border-collapse">
//             <thead className="bg-slate-700 text-white">
//               <tr>
//                 <th className="p-2 text-left min-w-[180px]">Category</th>
//                 {monthNames.map(m => <th key={m} className="p-2 text-center">{m}</th>)}
//                 <th className="p-2 bg-slate-800 text-center">FY Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               <Row label="Contract Revenue" values={revenue} />
//               <Row label="Direct Labor" values={labor} />
//               <Row label="ODCs" values={odc} />
//               <Row label="Total Direct Cost" values={directCost} isBold bg="bg-gray-50" />
//               <Row label="Gross Profit" values={grossProfit} isBold />
//               <MarginRow label="Gross Margin %" values={grossMargin} />
//               <Row label="Indirect Cost" values={indirect} />
//               <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50" />
//               <MarginRow label="Net Margin %" values={netMargin} />
//             </tbody>
//           </table>
//         </div>
//       ) : <div className="p-10 text-center text-gray-400">No data matching your selection.</div>}
//     </div>
//   );
// };

// const Row = ({ label, values, isBold, bg }) => {
//   const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
//   return (
//     <tr className={`${bg || ''} ${isBold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
//       <td className="p-2 border-b border-r pl-4">{label}</td>
//       {values.map((v, i) => <td key={i} className="p-2 border-b border-r text-right">{v.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>)}
//       <td className="p-2 border-b text-right font-bold bg-gray-100">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
//     </tr>
//   );
// };

// const MarginRow = ({ label, values }) => (
//   <tr className="italic text-gray-400">
//     <td className="p-2 border-b border-r pl-4">{label}</td>
//     {values.map((v, i) => <td key={i} className="p-2 border-b border-r text-right">{v}%</td>)}
//     <td className="p-2 border-b text-right font-bold bg-gray-100">-</td>
//   </tr>
// );

// export default PSRTrendReport;

// import React, { useState, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import { backendUrl } from "./config";
// import { FaPlay } from 'react-icons/fa'; // Ensure react-icons is installed

// const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
// const PROJECTS_API_PATH = "/Project/GetAllProjects";

// const PSRTrendReport = () => {
//   // Master Data Cache
//   const [masterProjects, setMasterProjects] = useState([]);
//   const [masterActuals, setMasterActuals] = useState([]);
//   const [masterForecasts, setMasterForecasts] = useState([]);
  
//   // Selection & Search State
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [fiscalYear, setFiscalYear] = useState("2025");
//   const [showDropdown, setShowDropdown] = useState(false);
  
//   // Status States
//   const [loading, setLoading] = useState(false);
//   const [hasRun, setHasRun] = useState(false); // Tracks if report was triggered
//   const [error, setError] = useState(null);

//   const monthsMap = [
//     { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
//     { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
//     { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
//     { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
//   ];

//   // --- MANUAL RUN LOGIC ---
//   const handleRunReport = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [projRes, actualsRes, forecastRes] = await Promise.all([
//         axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
//         axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
//         axios.get(`${backendUrl}${FORECAST_API_PATH}`)
//       ]);

//       const projects = Array.isArray(projRes.data) ? projRes.data : [];
//       setMasterProjects(projects);
//       setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
//       setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);

//       // Set default selection if none exists
//       if (projects.length > 0 && !selectedProjectId) {
//         setSelectedProjectId(projects[0].projectId);
//         setSearchTerm(`${projects[0].projectId} - ${projects[0].name}`);
//       }
      
//       setHasRun(true);
//     } catch (err) {
//       setError("Failed to fetch report data. Please check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedProjectId]);

//   // Filter project list based on typing
//   const filteredProjects = useMemo(() => {
//     if (!searchTerm) return masterProjects;
//     return masterProjects.filter(p => 
//       p?.projectId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
//       p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [searchTerm, masterProjects]);

//   // Table Data Calculation
//   const reportData = useMemo(() => {
//     if (!hasRun || !selectedProjectId) return null;

//     const processed = {};
//     monthsMap.forEach((m) => {
//       const actualItems = masterActuals.filter(d => 
//         d?.projId?.toString().trim() === selectedProjectId.trim() && 
//         d?.fyCd?.toString() === fiscalYear && d.pdNo == m.id
//       );

//       const forecastItems = masterForecasts.filter(d => 
//         d?.projId?.toString().trim() === selectedProjectId.trim() && 
//         d?.year?.toString() === fiscalYear && d.month == m.id
//       );

//       const getSum = (items, typeNo) => items
//         .filter(item => item.subTotTypeNo === typeNo)
//         .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

//       const rev = getSum(actualItems, 1) || forecastItems.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
//       const labor = getSum(actualItems, 2) || forecastItems.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
//       const odc = getSum(actualItems, 3) || forecastItems.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
//       const ind = getSum(actualItems, 4) || forecastItems.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);

//       const restAmt = actualItems
//         .filter(item => item.subTotTypeNo !== 1)
//         .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

//       processed[m.name] = {
//         rev, labor, odc, ind,
//         netProfitActual: rev - restAmt,
//         type: actualItems.length > 0 ? "Actuals" : "Forecast"
//       };
//     });
//     return processed;
//   }, [hasRun, selectedProjectId, fiscalYear, masterActuals, masterForecasts]);

//   // Calculation Helpers
//   const monthNames = monthsMap.map(m => m.name);
//   const v = (key) => monthNames.map(m => reportData?.[m]?.[key] || 0);
//   const revenue = v('rev');
//   const labor = v('labor');
//   const odc = v('odc');
//   const indirect = v('ind');
//   const directCost = labor.map((val, i) => val + odc[i]);
//   const grossProfit = revenue.map((val, i) => val - directCost[i]);
//   const netProfit = monthNames.map((m, i) => 
//     reportData?.[m]?.type === "Actuals" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
//   );

//   return (
//     <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
//         <h2 className="text-xl font-bold text-gray-800">PSR Trend Analysis</h2>
        
//         <button 
//           onClick={handleRunReport}
//           disabled={loading}
//           className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
//             loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
//           }`}
//         >
//           <FaPlay className={`w-3 h-3 ${loading ? 'animate-pulse' : ''}`} />
//           {loading ? "FETCHING DATA..." : "RUN ANALYSIS REPORT"}
//         </button>
//       </div>

//       {/* FILTERS */}
//       <div className="flex flex-wrap gap-4 p-5 bg-white border rounded-xl shadow-sm">
//         <div className="flex flex-col flex-grow max-w-lg relative">
//           <label className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Project Selection</label>
//           <input 
//             type="text"
//             placeholder={hasRun ? "Search projects..." : "Click 'Run' to load projects"}
//             value={searchTerm}
//             disabled={!hasRun}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setShowDropdown(true);
//             }}
//             onFocus={() => hasRun && setShowDropdown(true)}
//             className="p-2.5 text-sm border-2 border-gray-100 rounded-lg focus:border-blue-500 outline-none w-full transition-colors bg-gray-50 focus:bg-white"
//           />
          
//           {showDropdown && filteredProjects.length > 0 && (
//             <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-auto bg-white border border-gray-200 rounded-xl shadow-2xl">
//               {filteredProjects.map(p => (
//                 <div 
//                   key={p.projectId}
//                   className="p-3 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
//                   onClick={() => {
//                     setSelectedProjectId(p.projectId);
//                     setSearchTerm(`${p.projectId} - ${p.name}`);
//                     setShowDropdown(false);
//                   }}
//                 >
//                   <span className="font-bold text-blue-700">{p.projectId}</span> — {p.name}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="flex flex-col min-w-[120px]">
//           <label className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Fiscal Year</label>
//           <select 
//             value={fiscalYear} 
//             onChange={(e) => setFiscalYear(e.target.value)} 
//             className="p-2.5 border-2 border-gray-100 rounded-lg outline-none bg-gray-50 focus:border-blue-500 transition-colors cursor-pointer"
//           >
//             <option value="2024">2024</option>
//             <option value="2025">2025</option>
//             <option value="2026">2026</option>
//           </select>
//         </div>
//       </div>

//       {/* DATA VIEW */}
//       {loading ? (
//         <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-dashed border-gray-300">
//           <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
//           <p className="text-gray-500 font-medium italic">Synchronizing master data records...</p>
//         </div>
//       ) : error ? (
//         <div className="p-10 text-center bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">{error}</div>
//       ) : hasRun && reportData ? (
//         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
//           <table className="w-full text-[12px] border-collapse">
//             <thead className="bg-slate-800 text-white">
//               <tr>
//                 <th className="p-3 text-left min-w-[200px] uppercase tracking-wider">Financial Category</th>
//                 {monthNames.map(m => <th key={m} className="p-3 text-center">{m}</th>)}
//                 <th className="p-3 bg-slate-900 text-center border-l border-slate-700">FY Total</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               <Row label="Contract Revenue" values={revenue} />
//               <Row label="Direct Labor" values={labor} />
//               <Row label="ODCs" values={odc} />
//               <Row label="Total Direct Cost" values={directCost} isBold bg="bg-gray-50" />
//               <Row label="Gross Profit" values={grossProfit} isBold />
//               <Row label="Indirect Cost" values={indirect} />
//               <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50" />
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-gray-200 shadow-inner">
//            <div className="bg-blue-50 p-4 rounded-full mb-4">
//               <FaPlay className="text-blue-500 w-6 h-6 ml-1" />
//            </div>
//            {/* <p className="text-gray-400 font-bold text-lg">Report Ready</p> */}
//            {/* <p className="text-gray-400 text-sm">Click "Run Analysis Report" to fetch the latest project data.</p> */}
//         </div>
//       )}
//     </div>
//   );
// };

// // Sub-component for Table Rows
// const Row = ({ label, values, isBold, bg }) => {
//   const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
//   const cellClass = "p-3 border-r border-gray-100 text-right tabular-nums";
  
//   return (
//     <tr className={`${bg || ''} hover:bg-slate-50 transition-colors ${isBold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
//       <td className="p-3 border-r border-gray-100 pl-5">{label}</td>
//       {values.map((v, i) => (
//         <td key={i} className={cellClass}>
//           {v === 0 ? '-' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//         </td>
//       ))}
//       <td className="p-3 text-right font-black bg-gray-100 text-blue-900 border-l border-gray-200">
//         {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//       </td>
//     </tr>
//   );
// };

// export default PSRTrendReport;



import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { backendUrl } from "./config";
import { FaPlay, FaLayerGroup, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
const PROJECTS_API_PATH = "/Project/GetAllProjects";

const PSRTrendReport = () => {
  const [masterProjects, setMasterProjects] = useState([]);
  const [masterActuals, setMasterActuals] = useState([]);
  const [masterForecasts, setMasterForecasts] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [fiscalYear, setFiscalYear] = useState("2025");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const monthsMap = [
    { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
    { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
    { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
    { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
  ];

  const handleRunReport = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, actualsRes, forecastRes] = await Promise.all([
        axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
        axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
        axios.get(`${backendUrl}${FORECAST_API_PATH}`)
      ]);
      setMasterProjects(Array.isArray(projRes.data) ? projRes.data : []);
      setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
      setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);
      setHasRun(true);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- REFINED HIERARCHY & DATA LOGIC ---
  const { reportData, activeProjectIds } = useMemo(() => {
    if (!hasRun || !selectedProjectId) return { reportData: null, activeProjectIds: [] };

    const segments = selectedProjectId.split('.');
    const targetLevel = segments.length;
    const parentPrefix = segments.slice(0, -1).join('.'); 

    // PEER FILTER: Only siblings within the same parent family
    const isPeer = (projId) => {
      if (!projId) return false;
      const cleanId = projId.toString().trim();
      const s = cleanId.split('.');
      
      // If Top Level (Level 1), only show the selected project itself
      if (targetLevel === 1) {
        return cleanId === selectedProjectId.trim();
      }
      
      // If Sub-Level, must match length AND parent prefix
      if (s.length !== targetLevel) return false;
      return cleanId.startsWith(parentPrefix + ".");
    };

    const peerIds = [...new Set(masterProjects.filter(p => isPeer(p.projectId)).map(p => p.projectId))].sort();
    const processed = {};
    
    monthsMap.forEach((m) => {
      // Filter Actuals strictly for this month and peer group
      const monthlyActuals = masterActuals.filter(d => 
        isPeer(d?.projId) && 
        d?.fyCd?.toString() === fiscalYear.toString() && 
        parseInt(d.pdNo) === m.id
      );

      // Filter Forecast strictly for this month and peer group
      const monthlyForecasts = masterForecasts.filter(d => 
        isPeer(d?.projId) && 
        d?.year?.toString() === fiscalYear.toString() && 
        parseInt(d.month) === m.id
      );

      const getSum = (items, typeNo) => items
        .filter(item => parseInt(item.subTotTypeNo) === typeNo)
        .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

      // Category logic with monthly separation
      const rev = monthlyActuals.length > 0 ? getSum(monthlyActuals, 1) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
      const labor = monthlyActuals.length > 0 ? getSum(monthlyActuals, 2) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
      const odc = monthlyActuals.length > 0 ? getSum(monthlyActuals, 3) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
      const ind = monthlyActuals.length > 0 ? getSum(monthlyActuals, 4) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);

      const restAmt = monthlyActuals.filter(item => parseInt(item.subTotTypeNo) !== 1).reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

      processed[m.name] = { 
        rev, labor, odc, ind, 
        netProfitActual: rev - restAmt, 
        dataType: monthlyActuals.length > 0 ? "Actual" : "Forecast" 
      };
    });

    return { reportData: processed, activeProjectIds: peerIds };
  }, [hasRun, selectedProjectId, fiscalYear, masterActuals, masterForecasts, masterProjects]);

  const monthNames = monthsMap.map(m => m.name);
  const revenue = monthNames.map(m => reportData?.[m]?.rev || 0);
  const labor = monthNames.map(m => reportData?.[m]?.labor || 0);
  const odc = monthNames.map(m => reportData?.[m]?.odc || 0);
  const indirect = monthNames.map(m => reportData?.[m]?.ind || 0);
  const directCost = labor.map((val, i) => val + odc[i]);
  const grossProfit = revenue.map((val, i) => val - directCost[i]);
  const netProfit = monthNames.map((m, i) => 
    reportData?.[m]?.dataType === "Actual" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
  );

  return (
    <div className="w-full overflow-hidden p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
      <style>{`
        .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 1rem; border: 1px solid #e2e8f0; }
        .psr-table { table-layout: fixed; width: max-content; border-spacing: 0; }
        .sticky-col { position: sticky; left: 0; z-index: 20; width: 250px; background: white; border-right: 2px solid #f1f5f9 !important; padding: 1.25rem; }
        .month-cell { width: 120px; text-align: right; padding: 1.25rem; border-right: 1px solid #f1f5f9; }
        .total-cell { width: 150px; text-align: right; padding: 1.25rem; background: #f8fafc; font-weight: 900; }
        .header-cell { background: #1e293b; color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">PSR Trend</h1>
          {/* <p className="text-slate-400 text-xs font-bold uppercase mt-1">Project Performance Trend</p> */}
        </div>
        <button onClick={handleRunReport} disabled={loading} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:bg-slate-300">
          {loading ? "DATA SYNCING..." : "RUN ANALYSIS REPORT"}
        </button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="md:col-span-3 relative">
          {/* <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Select Project Root/Level</label> */}
          <input type="text" value={searchTerm} disabled={!hasRun} onChange={(e) => {setSearchTerm(e.target.value); setShowDropdown(true);}} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-400 font-bold text-slate-700 transition-all" placeholder="Search by Project ID..."/>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-100 shadow-2xl rounded-2xl p-2">
              {masterProjects.filter(p => p.projectId.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <div key={p.projectId} onClick={() => {setSelectedProjectId(p.projectId); setSearchTerm(`${p.projectId} - ${p.name}`); setShowDropdown(false);}} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl flex justify-between items-center group transition-all">
                  <span className="font-bold text-slate-700">{p.projectId} <span className="text-slate-400 font-medium ml-2">— {p.name}</span></span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black">LVL {p.projectId.split('.').length}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Fiscal Year</label>
          <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
            {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {hasRun && reportData ? (
        <div className="table-container shadow-2xl">
          <div className="p-6 bg-white border-b border-slate-50">
             <div className="flex items-center gap-3 mb-4">
                <FaInfoCircle className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Level Components:</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {activeProjectIds.map(id => (
                  <div key={id} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border transition-all ${id === selectedProjectId ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {id === selectedProjectId && <FaCheckCircle />} {id}
                  </div>
                ))}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="psr-table">
              <thead>
                <tr>
                  <th className="sticky-col header-cell text-left border-r border-slate-700">Financial Category</th>
                  {monthNames.map(m => (
                    <th key={m} className="month-cell header-cell text-center border-r border-slate-700">
                        {m}
                        <span className="block text-[8px] opacity-60 mt-1 font-medium">{reportData[m]?.dataType}</span>
                    </th>
                  ))}
                  <th className="total-cell header-cell text-center bg-slate-900 text-white">Annual Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <Row label="Contract Revenue" values={revenue} />
                <Row label="Direct Labor" values={labor} />
                <Row label="ODCs (Direct)" values={odc} />
                <Row label="Total Direct Costs" values={directCost} isBold bg="bg-slate-50/50" />
                <Row label="Gross Profit" values={grossProfit} isBold />
                <Row label="Indirect Burdens" values={indirect} />
                <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50/40" color="text-blue-700" />
              </tbody>
            </table>
          </div>
        </div>
      ) : !hasRun && (
        <div className="flex flex-col items-center justify-center p-32 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <FaLayerGroup className="text-slate-100 w-16 h-16 mb-6" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Select a project and run the report to see data</p>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, values, isBold, bg, color }) => {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  return (
    <tr className={`${bg || ''} hover:bg-slate-50 transition-colors ${isBold ? `font-black ${color || 'text-slate-900'}` : 'text-slate-500 font-medium'}`}>
      <td className={`sticky-col text-[12px] border-r border-slate-100 ${bg || 'bg-white'}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="month-cell tabular-nums text-[12px]">
          {v === 0 ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </td>
      ))}
      <td className={`total-cell tabular-nums text-[13px] ${isBold ? (color || 'text-slate-900') : 'text-slate-800'}`}>
        {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
    </tr>
  );
};

export default PSRTrendReport;  