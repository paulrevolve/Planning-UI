// import React, { useEffect, useState, useMemo, useRef } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { backendUrl } from "./config";

// const POOL_ROWS = [
//   { key: "fringe", label: "Fringe" },
//   { key: "hr", label: "HR" },
//   { key: "overhead", label: "Overhead" },
//   { key: "materials", label: "M&H" },
//   { key: "gna", label: "G&A" },
// ];

// const ROW_HEIGHT = 40;
// const geistSansStyle = { 
//   fontFamily: "'Geist', 'Geist Fallback', sans-serif",
//   '--font-sans': "'Geist', 'Geist Fallback'",
//   '--font-mono': "'Geist Mono', 'Geist Mono Fallback'"
// };

// const ProjectPoolCosts = ({ planId, startDate, endDate, fiscalYear }) => {
//   const [durations, setDurations] = useState([]);
//   const [aggregatedData, setAggregatedData] = useState({});
//   const [isLoading, setIsLoading] = useState(false);

//   const leftTableRef = useRef(null);
//   const rightTableRef = useRef(null);

//   const normalizedFiscalYear =
//     fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();

//   const handleScroll = (e) => {
//     if (e.target === rightTableRef.current) {
//       leftTableRef.current.scrollTop = rightTableRef.current.scrollTop;
//     }
//   };

//   const fetchAllData = async () => {
//     if (!planId || !startDate || !endDate) return;
//     setIsLoading(true);

//     try {
//       // 1. Fetch Durations
//       const durationRes = await axios.get(
//         `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
//       );
//       const durationData = Array.isArray(durationRes.data) ? durationRes.data : [];
//       setDurations(durationData);

//       // 2. Fetch Employee Forecast (Indirects from Labor)
//       const empRes = await axios.get(
//         `${backendUrl}/Project/GetEmployeeForecastByPlanID/${planId}`
//       );
//       const empData = Array.isArray(empRes.data) ? empRes.data : [];

//       // 3. Fetch Direct Cost Forecast (Indirects from ODCs/Travel)
//       const directRes = await axios.get(
//         `${backendUrl}/Project/GetDirectCostForecastDataByPlanId/${planId}`
//       );
//       const directData = Array.isArray(directRes.data) ? directRes.data : [];

//       // 4. Aggregation Logic
//       const poolMap = {};

//       const addToMap = (month, year, values) => {
//         const key = `${month}_${year}`;
//         if (!poolMap[key]) {
//           poolMap[key] = { fringe: 0, overhead: 0, gna: 0, hr: 0, materials: 0 };
//         }
//         poolMap[key].fringe += Number(values.fringe || 0);
//         poolMap[key].overhead += Number(values.overhead || 0);
//         poolMap[key].gna += Number(values.gna || 0);
//         poolMap[key].hr += Number(values.hr || 0);
//         poolMap[key].materials += Number(values.materials || 0);
//       };

//       // Process Employee Forecasts
//       empData.forEach((item) => {
//         const forecasts = item.emple?.plForecasts;
//         if (Array.isArray(forecasts)) {
//           forecasts.forEach((f) => {
//             addToMap(f.month, f.year, {
//               fringe: f.fringe,
//               overhead: f.overhead,
//               gna: f.gna,
//               hr: f.hr,
//               materials: f.materials,
//             });
//           });
//         }
//       });

//       // Process Direct Cost Forecasts
//       directData.forEach((item) => {
//         const forecasts = item.empl?.plForecasts;
//         if (Array.isArray(forecasts)) {
//           forecasts.forEach((f) => {
//             addToMap(f.month, f.year, {
//               fringe: f.fringe,
//               overhead: f.overhead,
//               gna: f.gna,
//               hr: f.hr,
//               materials: f.materials,
//             });
//           });
//         }
//       });

//       setAggregatedData(poolMap);
//     } catch (err) {
//       toast.error("Failed to load combined pool cost data");
//       console.error(err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllData();
//   }, [planId, startDate, endDate]);

//   const visibleDurations = useMemo(() => {
//     return durations
//       .filter(
//         (d) =>
//           normalizedFiscalYear === "All" ||
//           d.year === parseInt(normalizedFiscalYear)
//       )
//       .sort((a, b) =>
//         a.year !== b.year ? a.year - b.year : a.monthNo - b.monthNo
//       );
//   }, [durations, normalizedFiscalYear]);

//   const columnTotals = useMemo(() => {
//     const totals = {};
//     visibleDurations.forEach((d) => {
//       const key = `${d.monthNo}_${d.year}`;
//       const data = aggregatedData[key] || {};
//       totals[key] =
//         (data.fringe || 0) +
//         (data.overhead || 0) +
//         (data.gna || 0) +
//         (data.hr || 0) +
//         (data.materials || 0);
//     });
//     return totals;
//   }, [visibleDurations, aggregatedData]);

//   if (isLoading) return <div style={{ ...geistSansStyle, padding: "1rem", fontSize: "0.75rem" }}>Loading Indirect Costs...</div>;

//   return (
//     <div style={geistSansStyle} className="overflow-hidden bg-white">
//       <div className="px-4 py-2 border-b flex justify-between items-center">
//         <span className="font-bold text-sm text-gray-800">Indirect Cost</span>
//       </div>

//       <div className="flex w-full">
//         {/* Left Side: Labels */}
//         <div
//           ref={leftTableRef}
//           className="overflow-hidden border-r z-10"
//           style={{ width: "150px" }}
//         >
//           <table className="w-full text-xs">
//             <thead>
//               <tr style={{ height: "48px" }} className="border-b">
//                 <th className="px-3 text-left font-bold text-gray-600">
//                   Cost Pool
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {POOL_ROWS.map((row) => (
//                 <tr
//                   key={row.key}
//                   style={{ height: `${ROW_HEIGHT}px` }}
//                   className="border-b"
//                 >
//                   <td className="px-3 font-medium text-gray-700">{row.label}</td>
//                 </tr>
//               ))}
//               <tr
//                 style={{ height: `${ROW_HEIGHT}px` }}
//                 className="font-bold text-gray-800"
//               >
//                 <td className="px-3">Total Indirect Cost</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Right Side: Duration Data */}
//         <div
//           ref={rightTableRef}
//           onScroll={handleScroll}
//           className="overflow-x-auto flex-1"
//         >
//           <table className="min-w-full text-xs text-center border-collapse">
//             <thead>
//               <tr style={{ height: "48px" }} className="border-b">
//                 {visibleDurations.map((d) => (
//                   <th
//                     key={`${d.monthNo}_${d.year}`}
//                     className="px-4 border-r min-w-[100px]"
//                   >
//                     <div className="flex flex-col">
//                       <span className="font-bold">{d.month}</span>
//                     </div>
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {POOL_ROWS.map((row) => (
//                 <tr
//                   key={row.key}
//                   style={{ height: `${ROW_HEIGHT}px` }}
//                   className="border-b hover:bg-gray-50 transition-colors"
//                 >
//                   {visibleDurations.map((d) => {
//                     const key = `${d.monthNo}_${d.year}`;
//                     const val = aggregatedData[key]?.[row.key] || 0;
//                     return (
//                       <td key={`${key}-${row.key}`} className="px-2 border-r text-gray-600">
//                         {val.toLocaleString(undefined, {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               ))}
//               {/* Footer Total Row - Removed border-b to remove the bottom line */}
//               <tr style={{ height: `${ROW_HEIGHT}px` }} className="font-bold">
//                 {visibleDurations.map((d) => {
//                   const key = `${d.monthNo}_${d.year}`;
//                   return (
//                     <td key={`footer-${key}`} className="px-2 border-r text-gray-800">
//                       {columnTotals[key]?.toLocaleString(undefined, {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </td>
//                   );
//                 })}
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProjectPoolCosts;


import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const POOL_ROWS = [
  { key: "fringe", label: "Fringe" },
  { key: "hr", label: "HR" },
  { key: "overhead", label: "Overhead" },
  { key: "materials", label: "M&H" },
  { key: "gna", label: "G&A" },
];

const ROW_HEIGHT_DEFAULT = 48;
const geistSansStyle = { 
  fontFamily: "'Geist', 'Geist Fallback', sans-serif"
};

const ProjectPoolCosts = ({ planId, startDate, endDate, fiscalYear }) => {
  const [durations, setDurations] = useState([]);
  const [aggregatedData, setAggregatedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const leftTableRef = useRef(null);
  const rightTableRef = useRef(null);
  const scrollingLock = useRef(false);

  const normalizedFiscalYear =
    fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();

  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    if (!scrollingLock.current) {
      scrollingLock.current = true;
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      setTimeout(() => {
        scrollingLock.current = false;
      }, 0);
    }
  };

  const handleLeftScroll = () => syncScroll(leftTableRef, rightTableRef);
  const handleRightScroll = () => syncScroll(rightTableRef, leftTableRef);

  const fetchAllData = async () => {
    if (!planId || !startDate || !endDate) return;
    setIsLoading(true);

    try {
      const durationRes = await axios.get(
        `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
      );
      const durationData = Array.isArray(durationRes.data) ? durationRes.data : [];
      setDurations(durationData);

      const [empRes, directRes] = await Promise.all([
        axios.get(`${backendUrl}/Project/GetEmployeeForecastByPlanID/${planId}`),
        axios.get(`${backendUrl}/Project/GetDirectCostForecastDataByPlanId/${planId}`)
      ]);

      const poolMap = {};
      const addToMap = (month, year, values) => {
        const key = `${month}_${year}`;
        if (!poolMap[key]) {
          poolMap[key] = { fringe: 0, overhead: 0, gna: 0, hr: 0, materials: 0 };
        }
        poolMap[key].fringe += Number(values.fringe || 0);
        poolMap[key].overhead += Number(values.overhead || 0);
        poolMap[key].gna += Number(values.gna || 0);
        poolMap[key].hr += Number(values.hr || 0);
        poolMap[key].materials += Number(values.materials || 0);
      };

      (Array.isArray(empRes.data) ? empRes.data : []).forEach((item) => {
        item.emple?.plForecasts?.forEach((f) => addToMap(f.month, f.year, f));
      });

      (Array.isArray(directRes.data) ? directRes.data : []).forEach((item) => {
        item.empl?.plForecasts?.forEach((f) => addToMap(f.month, f.year, f));
      });

      setAggregatedData(poolMap);
    } catch (err) {
      toast.error("Failed to load combined pool cost data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [planId, startDate, endDate]);

  const visibleDurations = useMemo(() => {
    return durations
      .filter(d => normalizedFiscalYear === "All" || d.year === parseInt(normalizedFiscalYear))
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthNo - b.monthNo);
  }, [durations, normalizedFiscalYear]);

  const columnTotals = useMemo(() => {
    const totals = {};
    visibleDurations.forEach((d) => {
      const key = `${d.monthNo}_${d.year}`;
      const data = aggregatedData[key] || {};
      totals[key] = (data.fringe || 0) + (data.overhead || 0) + (data.gna || 0) + (data.hr || 0) + (data.materials || 0);
    });
    return totals;
  }, [visibleDurations, aggregatedData]);

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;

  return (
    <div style={geistSansStyle} className="relative p-4 font-inter w-full synchronized-tables-outer">
      <div className="w-full flex justify-between mb-1 gap-2">
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-md sm:text-sm blue-text" style={{ color: "#113d46" }}>
            Indirect Cost
          </span>
        </div>
      </div>

      <div className="border-line">
        <div className="synchronized-tables-container flex w-full overflow-hidden rounded-lg">
          {/* Left Table: Fixed Labels */}
          <div
            ref={leftTableRef}
            onScroll={handleLeftScroll}
            className="hide-scrollbar" // Removed border-r to remove the line
            style={{ width: "180px", maxHeight: "400px", overflowY: "auto", flexShrink: 0 }}
          >
            <table className="table-fixed table min-w-full">
              <thead className="thead">
                <tr style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}>
                  <th className="th-thead px-4 text-center">Cost Pool</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {POOL_ROWS.map((row) => (
                  <tr key={row.key} style={{ height: `${ROW_HEIGHT_DEFAULT}px` }} className="border-b border-gray-100">
                    <td className="tbody-td px-4 text-center font-medium text-gray-700">{row.label}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold" style={{ height: `${ROW_HEIGHT_DEFAULT}px`, position: "sticky", bottom: 0, zIndex: 20 }}>
                  <td className="tbody-td px-4 text-center text-gray-800">Total Indirect Cost</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Right Table: Data */}
          <div
            ref={rightTableRef}
            onScroll={handleRightScroll}
            className="flex-1"
            style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}
          >
            <table className="min-w-full table">
              <thead className="thead">
                <tr style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}>
                  {visibleDurations.map((d) => (
                    <th key={`${d.monthNo}_${d.year}`} className="th-thead min-w-[110px] text-center px-2">
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="whitespace-nowrap">{d.month}</span>
                      
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tbody">
                {POOL_ROWS.map((row) => (
                  <tr key={row.key} style={{ height: `${ROW_HEIGHT_DEFAULT}px` }} className="hover:bg-blue-50 transition border-b border-gray-100">
                    {visibleDurations.map((d) => {
                      const key = `${d.monthNo}_${d.year}`;
                      return (
                        <td key={`${key}-${row.key}`} className="tbody-td text-center text-gray-600 px-2">
                          {(aggregatedData[key]?.[row.key] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold text-center" style={{ height: `${ROW_HEIGHT_DEFAULT}px`, position: "sticky", bottom: 0, zIndex: 20 }}>
                  {visibleDurations.map((d) => {
                    const key = `${d.monthNo}_${d.year}`;
                    return (
                      <td key={`footer-${key}`} className="tbody-td text-gray-800 px-2">
                        {(columnTotals[key] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPoolCosts;