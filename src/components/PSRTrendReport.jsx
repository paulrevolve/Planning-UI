import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { backendUrl } from "./config";

const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
const PROJECTS_API_PATH = "/Project/GetAllProjects";

const PSRTrendReport = () => {
  // Master Data Cache
  const [masterProjects, setMasterProjects] = useState([]);
  const [masterActuals, setMasterActuals] = useState([]);
  const [masterForecasts, setMasterForecasts] = useState([]);
  
  // Selection & Search State
  const [searchTerm, setSearchTerm] = useState(""); // For the input field
  const [selectedProjectId, setSelectedProjectId] = useState(""); // Actual selected ID
  const [fiscalYear, setFiscalYear] = useState("2025");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const monthsMap = [
    { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
    { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
    { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
    { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
  ];

  // Fetch all data once on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projRes, actualsRes, forecastRes] = await Promise.all([
          axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
          axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
          axios.get(`${backendUrl}${FORECAST_API_PATH}`)
        ]);

        const projects = Array.isArray(projRes.data) ? projRes.data : [];
        setMasterProjects(projects);
        setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
        setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);

        if (projects.length > 0) {
          setSelectedProjectId(projects[0].projectId);
          setSearchTerm(`${projects[0].projectId} - ${projects[0].name}`);
        }
      } catch (err) {
        setError("Failed to initialize dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Filter project list based on typing (Search Logic)
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return masterProjects;
    return masterProjects.filter(p => 
      p?.projectId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, masterProjects]);

  // Recalculate Table Data locally when selection changes
  const reportData = useMemo(() => {
    if (!selectedProjectId || !masterActuals.length) return null;

    const processed = {};
    monthsMap.forEach((m) => {
      const actualItems = masterActuals.filter(d => 
        d?.projId?.toString().trim() === selectedProjectId.trim() && 
        d?.fyCd?.toString() === fiscalYear && d.pdNo == m.id
      );

      const forecastItems = masterForecasts.filter(d => 
        d?.projId?.toString().trim() === selectedProjectId.trim() && 
        d?.year?.toString() === fiscalYear && d.month == m.id
      );

      const getSum = (items, typeNo) => items
        .filter(item => item.subTotTypeNo === typeNo)
        .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

      const rev = getSum(actualItems, 1) || forecastItems.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
      const labor = getSum(actualItems, 2) || forecastItems.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
      const odc = getSum(actualItems, 3) || forecastItems.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
      const ind = getSum(actualItems, 4) || forecastItems.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);

      const restAmt = actualItems
        .filter(item => item.subTotTypeNo !== 1)
        .reduce((acc, curr) => acc + (Number(curr.pyIncurAmt) || 0), 0);

      processed[m.name] = {
        rev, labor, odc, ind,
        netProfitActual: rev - restAmt,
        type: actualItems.length > 0 ? "Actuals" : "Forecast"
      };
    });
    return processed;
  }, [selectedProjectId, fiscalYear, masterActuals, masterForecasts]);

  // UI Table Helpers
  const monthNames = monthsMap.map(m => m.name);
  const v = (key) => monthNames.map(m => reportData?.[m]?.[key] || 0);
  const sum = (a, b) => a.map((val, i) => val + b[i]);
  const diff = (a, b) => a.map((val, i) => val - b[i]);
  const marg = (n, d) => n.map((num, i) => d[i] === 0 ? "0.00" : ((num / d[i]) * 100).toFixed(2));

  const revenue = v('rev');
  const labor = v('labor');
  const odc = v('odc');
  const indirect = v('ind');
  const directCost = sum(labor, odc);
  const grossProfit = diff(revenue, directCost);
  const grossMargin = marg(grossProfit, revenue);
  const netProfit = monthNames.map((m, i) => 
    reportData?.[m]?.type === "Actuals" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
  );
  const netMargin = marg(netProfit, revenue);

  if (loading) return <div className="p-10 text-center text-blue-500 font-bold">Synchronizing Data...</div>;

  return (
    <div className="space-y-4">
      {/* SEARCHABLE DROPDOWN FILTER */}
      <div className="flex gap-4 p-4 bg-white border rounded-lg shadow-sm items-end">
        <div className="flex flex-col flex-grow max-w-lg relative">
          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Search & Select Project</label>
          <input 
            type="text"
            placeholder="Type to filter projects..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="p-2 text-sm border-2 border-gray-100 rounded focus:border-blue-500 outline-none w-full"
          />
          
          {showDropdown && filteredProjects.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white border rounded shadow-xl">
              {filteredProjects.map(p => (
                <div 
                  key={p.projectId}
                  className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0"
                  onClick={() => {
                    setSelectedProjectId(p.projectId);
                    setSearchTerm(`${p.projectId} - ${p.name}`);
                    setShowDropdown(false);
                  }}
                >
                  <span className="font-bold text-blue-700">{p.projectId}</span> - {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fiscal Year</label>
          <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="p-2 border-2 border-gray-100 rounded outline-none h-[38px]">
            <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* RENDER TABLE */}
      {reportData ? (
        <div className="bg-white border rounded overflow-hidden shadow-sm">
          <table className="w-full text-[11px] border-collapse">
            <thead className="bg-slate-700 text-white">
              <tr>
                <th className="p-2 text-left min-w-[180px]">Category</th>
                {monthNames.map(m => <th key={m} className="p-2 text-center">{m}</th>)}
                <th className="p-2 bg-slate-800 text-center">FY Total</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Contract Revenue" values={revenue} />
              <Row label="Direct Labor" values={labor} />
              <Row label="ODCs" values={odc} />
              <Row label="Total Direct Cost" values={directCost} isBold bg="bg-gray-50" />
              <Row label="Gross Profit" values={grossProfit} isBold />
              <MarginRow label="Gross Margin %" values={grossMargin} />
              <Row label="Indirect Cost" values={indirect} />
              <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50" />
              <MarginRow label="Net Margin %" values={netMargin} />
            </tbody>
          </table>
        </div>
      ) : <div className="p-10 text-center text-gray-400">No data matching your selection.</div>}
    </div>
  );
};

const Row = ({ label, values, isBold, bg }) => {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  return (
    <tr className={`${bg || ''} ${isBold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
      <td className="p-2 border-b border-r pl-4">{label}</td>
      {values.map((v, i) => <td key={i} className="p-2 border-b border-r text-right">{v.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>)}
      <td className="p-2 border-b text-right font-bold bg-gray-100">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
    </tr>
  );
};

const MarginRow = ({ label, values }) => (
  <tr className="italic text-gray-400">
    <td className="p-2 border-b border-r pl-4">{label}</td>
    {values.map((v, i) => <td key={i} className="p-2 border-b border-r text-right">{v}%</td>)}
    <td className="p-2 border-b text-right font-bold bg-gray-100">-</td>
  </tr>
);

export default PSRTrendReport;