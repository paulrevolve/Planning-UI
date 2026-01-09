// Deployed Version below 

// import React, { useState, useMemo, useCallback } from 'react';
// import axios from 'axios';
// import { backendUrl } from "./config";
// import { FaPlay, FaLayerGroup, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

// const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
// const PROJECTS_API_PATH = "/Project/GetAllProjects";

// const PSRTrendReport = () => {
//   const [masterProjects, setMasterProjects] = useState([]);
//   const [masterActuals, setMasterActuals] = useState([]);
//   const [masterForecasts, setMasterForecasts] = useState([]);
  
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [fiscalYear, setFiscalYear] = useState("2025");
//   const [showDropdown, setShowDropdown] = useState(false);
  
//   const [loading, setLoading] = useState(false);
//   const [hasRun, setHasRun] = useState(false);

//   const monthsMap = [
//     { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
//     { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
//     { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
//     { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
//   ];

//   const handleRunReport = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [projRes, actualsRes, forecastRes] = await Promise.all([
//         axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
//         axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
//         axios.get(`${backendUrl}${FORECAST_API_PATH}`)
//       ]);
//       setMasterProjects(Array.isArray(projRes.data) ? projRes.data : []);
//       setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
//       setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);
//       setHasRun(true);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --- REFINED HIERARCHY & DATA LOGIC ---
//   const { reportData, activeProjectIds } = useMemo(() => {
//     if (!hasRun || !selectedProjectId) return { reportData: null, activeProjectIds: [] };

//     const segments = selectedProjectId.split('.');
//     const targetLevel = segments.length;
//     const parentPrefix = segments.slice(0, -1).join('.'); 

//     // PEER FILTER: Only siblings within the same parent family
//     const isPeer = (projId) => {
//       if (!projId) return false;
//       const cleanId = projId.toString().trim();
//       const s = cleanId.split('.');
      
//       // If Top Level (Level 1), only show the selected project itself
//       if (targetLevel === 1) {
//         return cleanId === selectedProjectId.trim();
//       }
      
//       // If Sub-Level, must match length AND parent prefix
//       if (s.length !== targetLevel) return false;
//       return cleanId.startsWith(parentPrefix + ".");
//     };

//     const peerIds = [...new Set(masterProjects.filter(p => isPeer(p.projectId)).map(p => p.projectId))].sort();
//     const processed = {};
    
//     monthsMap.forEach((m) => {
//       // Filter Actuals strictly for this month and peer group
//       const monthlyActuals = masterActuals.filter(d => 
//         isPeer(d?.projId) && 
//         d?.fyCd?.toString() === fiscalYear.toString() && 
//         parseInt(d.pdNo) === m.id
//       );

//       // Filter Forecast strictly for this month and peer group
//       const monthlyForecasts = masterForecasts.filter(d => 
//         isPeer(d?.projId) && 
//         d?.year?.toString() === fiscalYear.toString() && 
//         parseInt(d.month) === m.id
//       );

//       const getSum = (items, typeNo) => items
//         .filter(item => parseInt(item.subTotTypeNo) === typeNo)
//         .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

//       // Category logic with monthly separation
//       const rev = monthlyActuals.length > 0 ? getSum(monthlyActuals, 1) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
//       const labor = monthlyActuals.length > 0 ? getSum(monthlyActuals, 2) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
//       const odc = monthlyActuals.length > 0 ? getSum(monthlyActuals, 3) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
//       const ind = monthlyActuals.length > 0 ? getSum(monthlyActuals, 4) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);

//       const restAmt = monthlyActuals.filter(item => parseInt(item.subTotTypeNo) !== 1).reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

//       processed[m.name] = { 
//         rev, labor, odc, ind, 
//         netProfitActual: rev - restAmt, 
//         dataType: monthlyActuals.length > 0 ? "Actual" : "Forecast" 
//       };
//     });

//     return { reportData: processed, activeProjectIds: peerIds };
//   }, [hasRun, selectedProjectId, fiscalYear, masterActuals, masterForecasts, masterProjects]);

//   const monthNames = monthsMap.map(m => m.name);
//   const revenue = monthNames.map(m => reportData?.[m]?.rev || 0);
//   const labor = monthNames.map(m => reportData?.[m]?.labor || 0);
//   const odc = monthNames.map(m => reportData?.[m]?.odc || 0);
//   const indirect = monthNames.map(m => reportData?.[m]?.ind || 0);
//   const directCost = labor.map((val, i) => val + odc[i]);
//   const grossProfit = revenue.map((val, i) => val - directCost[i]);
//   const netProfit = monthNames.map((m, i) => 
//     reportData?.[m]?.dataType === "Actual" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
//   );

//   return (
//     <div className="w-full overflow-hidden p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
//       <style>{`
//         .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 1rem; border: 1px solid #e2e8f0; }
//         .psr-table { table-layout: fixed; width: max-content; border-spacing: 0; }
//         .sticky-col { position: sticky; left: 0; z-index: 20; width: 250px; background: white; border-right: 2px solid #f1f5f9 !important; padding: 1.25rem; }
//         .month-cell { width: 120px; text-align: right; padding: 1.25rem; border-right: 1px solid #f1f5f9; }
//         .total-cell { width: 150px; text-align: right; padding: 1.25rem; background: #f8fafc; font-weight: 900; }
//         .header-cell { background: #1e293b; color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
//       `}</style>

//       {/* Header */}
//       <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
//         <div>
//           <h1 className="text-2xl font-black text-slate-900 tracking-tight">PSR Trend</h1>
//           {/* <p className="text-slate-400 text-xs font-bold uppercase mt-1">Project Performance Trend</p> */}
//         </div>
//         <button onClick={handleRunReport} disabled={loading} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:bg-slate-300">
//           {loading ? "DATA SYNCING..." : "RUN ANALYSIS REPORT"}
//         </button>
//       </div>

//       {/* Control Panel */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
//         <div className="md:col-span-3 relative">
//           {/* <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Select Project Root/Level</label> */}
//           <input type="text" value={searchTerm} disabled={!hasRun} onChange={(e) => {setSearchTerm(e.target.value); setShowDropdown(true);}} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-400 font-bold text-slate-700 transition-all" placeholder="Search by Project ID..."/>
          
//           {showDropdown && (
//             <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-100 shadow-2xl rounded-2xl p-2">
//               {masterProjects.filter(p => p.projectId.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
//                 <div key={p.projectId} onClick={() => {setSelectedProjectId(p.projectId); setSearchTerm(`${p.projectId} - ${p.name}`); setShowDropdown(false);}} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl flex justify-between items-center group transition-all">
//                   <span className="font-bold text-slate-700">{p.projectId} <span className="text-slate-400 font-medium ml-2">— {p.name}</span></span>
//                   <span className="text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black">LVL {p.projectId.split('.').length}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         <div>
//           <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Fiscal Year</label>
//           <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
//             {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
//           </select>
//         </div>
//       </div>

//       {hasRun && reportData ? (
//         <div className="table-container shadow-2xl">
//           <div className="p-6 bg-white border-b border-slate-50">
//              <div className="flex items-center gap-3 mb-4">
//                 <FaInfoCircle className="text-blue-500" />
//                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Level Components:</span>
//              </div>
//              <div className="flex flex-wrap gap-2">
//                 {activeProjectIds.map(id => (
//                   <div key={id} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border transition-all ${id === selectedProjectId ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600'}`}>
//                     {id === selectedProjectId && <FaCheckCircle />} {id}
//                   </div>
//                 ))}
//              </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="psr-table">
//               <thead>
//                 <tr>
//                   <th className="sticky-col header-cell text-left border-r border-slate-700">Financial Category</th>
//                   {monthNames.map(m => (
//                     <th key={m} className="month-cell header-cell text-center border-r border-slate-700">
//                         {m}
//                         <span className="block text-[8px] opacity-60 mt-1 font-medium">{reportData[m]?.dataType}</span>
//                     </th>
//                   ))}
//                   <th className="total-cell header-cell text-center bg-slate-900 text-white">Annual Total</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 <Row label="Contract Revenue" values={revenue} />
//                 <Row label="Direct Labor" values={labor} />
//                 <Row label="ODCs (Direct)" values={odc} />
//                 <Row label="Total Direct Costs" values={directCost} isBold bg="bg-slate-50/50" />
//                 <Row label="Gross Profit" values={grossProfit} isBold />
//                 <Row label="Indirect Burdens" values={indirect} />
//                 <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50/40" color="text-blue-700" />
//               </tbody>
//             </table>
//           </div>
//         </div>
//       ) : !hasRun && (
//         <div className="flex flex-col items-center justify-center p-32 bg-white rounded-3xl border-2 border-dashed border-slate-100">
//           <FaLayerGroup className="text-slate-100 w-16 h-16 mb-6" />
//           <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Select a project and run the report to see data</p>
//         </div>
//       )}
//     </div>
//   );
// };

// const Row = ({ label, values, isBold, bg, color }) => {
//   const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
//   return (
//     <tr className={`${bg || ''} hover:bg-slate-50 transition-colors ${isBold ? `font-black ${color || 'text-slate-900'}` : 'text-slate-500 font-medium'}`}>
//       <td className={`sticky-col text-[12px] border-r border-slate-100 ${bg || 'bg-white'}`}>{label}</td>
//       {values.map((v, i) => (
//         <td key={i} className="month-cell tabular-nums text-[12px]">
//           {v === 0 ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
//         </td>
//       ))}
//       <td className={`total-cell tabular-nums text-[13px] ${isBold ? (color || 'text-slate-900') : 'text-slate-800'}`}>
//         {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
//       </td>
//     </tr>
//   );
// };

// export default PSRTrendReport;  


// Deployed Version above

import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { backendUrl } from "./config";
import { FaPlay, FaLayerGroup, FaInfoCircle, FaCheckCircle, FaSitemap, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
const PROJECTS_API_PATH = "/Project/GetAllProjects";

const PSRTrendReport = () => {
  const [masterProjects, setMasterProjects] = useState([]);
  const [masterActuals, setMasterActuals] = useState([]);
  const [masterForecasts, setMasterForecasts] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopLevelId, setSelectedTopLevelId] = useState("");
  const [depthLevel, setDepthLevel] = useState("1");
  const [fiscalYear, setFiscalYear] = useState("2025");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // New state for UI management
  const [isPeersExpanded, setIsPeersExpanded] = useState(false);

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

  const { reportData, activeProjectIds } = useMemo(() => {
    if (!hasRun || !selectedTopLevelId) return { reportData: null, activeProjectIds: [] };

    const isPeer = (projId) => {
      if (!projId) return false;
      const cleanId = projId.toString().trim();
      const s = cleanId.split('.');
      if (!cleanId.startsWith(selectedTopLevelId.trim())) return false;
      return s.length === parseInt(depthLevel);
    };

    const peerIds = [...new Set(masterProjects.filter(p => isPeer(p.projectId)).map(p => p.projectId))].sort();
    const processed = {};
    
    monthsMap.forEach((m) => {
      const monthlyActuals = masterActuals.filter(d => 
        isPeer(d?.projId) && d?.fyCd?.toString() === fiscalYear.toString() && parseInt(d.pdNo) === m.id
      );

      const monthlyForecasts = masterForecasts.filter(d => 
        isPeer(d?.projId) && d?.year?.toString() === fiscalYear.toString() && parseInt(d.month) === m.id
      );

      const getSum = (items, typeNo) => items
        .filter(item => parseInt(item.subTotTypeNo) === typeNo)
        .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

      const rev = monthlyActuals.length > 0 ? getSum(monthlyActuals, 1) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
      const labor = monthlyActuals.length > 0 ? getSum(monthlyActuals, 2) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
      const odc = monthlyActuals.length > 0 ? getSum(monthlyActuals, 3) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
      const ind = monthlyActuals.length > 0 ? getSum(monthlyActuals, 4) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);

      const restAmt = monthlyActuals.filter(item => parseInt(item.subTotTypeNo) !== 1).reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

      processed[m.name] = { rev, labor, odc, ind, netProfitActual: rev - restAmt, dataType: monthlyActuals.length > 0 ? "Actual" : "Forecast" };
    });

    return { reportData: processed, activeProjectIds: peerIds };
  }, [hasRun, selectedTopLevelId, depthLevel, fiscalYear, masterActuals, masterForecasts, masterProjects]);

  // UI Helpers
  const visiblePeers = isPeersExpanded ? activeProjectIds : activeProjectIds.slice(0, 12);

  return (
    <div className="w-full overflow-hidden p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
      <style>{`
        .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 1rem; border: 1px solid #e2e8f0; }
        .psr-table { table-layout: fixed; width: max-content; border-spacing: 0; }
        .sticky-col { position: sticky; left: 0; z-index: 20; width: 250px; background: white; border-right: 2px solid #f1f5f9 !important; padding: 1rem; }
        .month-cell { width: 120px; text-align: right; padding: 1rem; border-right: 1px solid #f1f5f9; }
        .total-cell { width: 150px; text-align: right; padding: 1rem; background: #f8fafc; font-weight: 900; }
        .header-cell { background: #1e293b; color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        .peer-tag { font-size: 11px; padding: 4px 10px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0; background: white; color: #475569; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">PSR  Trend</h1>
        <button onClick={handleRunReport} disabled={loading} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:bg-slate-300">
          {loading ? "SYNCING..." : "RUN ANALYSIS REPORT"}
        </button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="md:col-span-3 relative">
          <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Search Top Level Project</label>
          <input type="text" value={searchTerm} disabled={!hasRun} onChange={(e) => {setSearchTerm(e.target.value); setShowDropdown(true);}} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-400 font-bold" placeholder="Start typing root ID..."/>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-100 shadow-2xl rounded-2xl p-2">
              {masterProjects.filter(p => p.projectId.split('.').length === 1 && p.projectId.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <div key={p.projectId} onClick={() => {setSelectedTopLevelId(p.projectId); setSearchTerm(`${p.projectId} - ${p.name}`); setShowDropdown(false);}} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl flex justify-between items-center font-bold text-slate-700">
                  {p.projectId} — <span className="text-slate-400 font-medium ml-2">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Level</label>
          <select value={depthLevel} onChange={(e) => setDepthLevel(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
            <option value="1">L-1</option>
            <option value="2">L-2</option>
            <option value="3">L-3</option>
            <option value="4">L-4</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Fiscal Year</label>
          <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
            {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {hasRun && reportData ? (
        <div className="table-container shadow-2xl">
          {/* IMPROVED PEER LIST UI */}
          <div className="p-5 bg-white border-b border-slate-50">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <FaSitemap className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Included Components ({activeProjectIds.length})
                  </span>
                </div>
                {activeProjectIds.length > 12 && (
                  <button 
                    onClick={() => setIsPeersExpanded(!isPeersExpanded)}
                    className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:text-blue-800 transition-colors"
                  >
                    {isPeersExpanded ? <><FaChevronUp /> Show Less</> : <><FaChevronDown /> View All {activeProjectIds.length}</>}
                  </button>
                )}
             </div>
             
             <div className={`flex flex-wrap gap-2 transition-all duration-300 ${!isPeersExpanded ? 'max-h-24 overflow-hidden' : ''}`}>
                {activeProjectIds.length > 0 ? visiblePeers.map(id => (
                  <div key={id} className="peer-tag shadow-sm">
                    <FaCheckCircle className="text-blue-400 w-3 h-3"/> {id}
                  </div>
                )) : <p className="text-slate-400 text-xs italic">No projects found.</p>}
                
                {!isPeersExpanded && activeProjectIds.length > 12 && (
                  <div className="peer-tag bg-slate-50 border-dashed text-slate-400">
                    + {activeProjectIds.length - 12} more...
                  </div>
                )}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="psr-table">
              <thead>
                <tr>
                  <th className="sticky-col header-cell text-left border-r border-slate-700">Financial Items</th>
                  {monthsMap.map(m => (
                    <th key={m.id} className="month-cell header-cell text-center border-r border-slate-700">
                        {m.name}
                        <span className="block text-[8px] opacity-60 mt-1 font-medium">{reportData[m.name]?.dataType}</span>
                    </th>
                  ))}
                  <th className="total-cell header-cell text-center bg-slate-900 text-white">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <Row label="Contract Revenue" values={monthsMap.map(m => reportData?.[m.name]?.rev || 0)} />
                <Row label="Direct Labor" values={monthsMap.map(m => reportData?.[m.name]?.labor || 0)} />
                <Row label="ODCs (Direct)" values={monthsMap.map(m => reportData?.[m.name]?.odc || 0)} />
                <Row label="Total Direct Costs" values={monthsMap.map(m => (reportData?.[m.name]?.labor || 0) + (reportData?.[m.name]?.odc || 0))} isBold bg="bg-slate-50/50" />
                <Row label="Gross Profit" values={monthsMap.map(m => (reportData?.[m.name]?.rev || 0) - ((reportData?.[m.name]?.labor || 0) + (reportData?.[m.name]?.odc || 0)))} isBold />
                <Row label="Indirect Burdens" values={monthsMap.map(m => reportData?.[m.name]?.ind || 0)} />
                <Row label="Net Profit / Fee" values={monthsMap.map(m => reportData?.[m.name]?.dataType === "Actual" ? reportData[m.name].netProfitActual : (reportData?.[m.name]?.rev || 0) - ((reportData?.[m.name]?.labor || 0) + (reportData?.[m.name]?.odc || 0) + (reportData?.[m.name]?.ind || 0)))} isBold bg="bg-blue-50/40" color="text-blue-700" />
              </tbody>
            </table>
          </div>
        </div>
      ) : !hasRun && (
        <div className="flex flex-col items-center justify-center p-32 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <FaLayerGroup className="text-slate-100 w-16 h-16 mb-6" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Select project and level to continue</p>
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