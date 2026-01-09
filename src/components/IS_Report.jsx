// // // // "use client";
// import React from 'react';

// const IS_Report = () => {
//   // Mock data - This structure allows for easy API integration later
//   const reportData = {
//     orgName: "SUMARIA SYSTEMS, LLC",
//     reportTitle: "Income Statement Option 1",
//     organization: "1 SUMARIA SYSTEMS, LLC",
//     reportDate: "12/18/25",
//     reportTime: "06:11 PM",
//     periodRange: "10/01/25 - 10/31/25",
    
//     sections: {
//       revenue: {
//         total: { period: 8453497.55, ytd: 74462470.14 }
//       },
//       directCosts: {
//         items: [
//           { label: "Sumaria Labor Onsite", period: -3575520.04, ytd: -32886603.10 },
//           { label: "Sumaria ODC's", period: -13734.46, ytd: -193868.66 },
//           { label: "Sumaria Travel", period: -185246.78, ytd: -1350732.10 },
//           { label: "Subcontractors", period: -2076223.53, ytd: -15275258.41 },
//         ],
//         subtotal: { period: -5850724.81, ytd: -49706462.27 }
//       },
//       grossProfit: { period: 2602772.74, ytd: 24756007.87 },
//       equipment: {
//         items: [
//           { label: "Income", period: 5003527.39, ytd: 27547605.49 },
//           { label: "Expense", period: -4883443.51, ytd: -26888671.27 },
//         ],
//         subtotal: { period: 120083.88, ytd: 658934.22 }
//       },
//       netIncomeAfterEquip: { period: 2722856.62, ytd: 25414942.09 },
//       costOfOps: {
//         items: [
//           { label: "Fringe Benefits", period: -1554597.73, ytd: -13007401.75 },
//           { label: "Overhead", period: -244494.90, ytd: -2354574.10 },
//           { label: "Material & Handling", period: -32144.71, ytd: -292425.55 },
//           { label: "HR Service Center", period: -16117.76, ytd: -181151.72 },
//           { label: "General & Admin", period: -492481.02, ytd: -5317223.72 },
//           { label: "Unallocated Burden Allocations", period: 0.00, ytd: 0.00 },
//         ],
//         subtotal: { period: -2339836.12, ytd: -21152776.84 }
//       },
//       operatingMargin: { period: 383020.50, ytd: 4262165.25 },
//       unallowable: {
//         items: [{ label: "Unallowable Expenses", period: -441342.28, ytd: -3985569.85 }],
//         subtotal: { period: -441342.28, ytd: -3985569.85 }
//       },
//       otherIncome: { period: -58321.78, ytd: 276595.40 },
//       comprehensiveIncome: { period: -58321.78, ytd: 276595.40 }
//     }
//   };

//   const formatCurrency = (val) => {
//     return new Intl.NumberFormat('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(val);
//   };

//   // Reusable Row Component
//   const ReportRow = ({ label, period, ytd, isBold = false, indent = false }) => (
//     <div className={`grid grid-cols-12 py-1 text-[14px] ${isBold ? 'font-bold' : 'font-normal'}`}>
//       <div className={`col-span-6 ${indent ? 'pl-8' : ''}`}>{label}</div>
//       <div className="col-span-3 text-right pr-16">{formatCurrency(period)}</div>
//       <div className="col-span-3 text-right pr-8">{formatCurrency(ytd)}</div>
//     </div>
//   );

//   // Reusable Subtotal/Line Component
//   const SubtotalLine = ({ period, ytd }) => (
//     <div className="grid grid-cols-12 pt-1 pb-3">
//       <div className="col-span-6"></div>
//       <div className="col-span-3 border-t border-black text-right pr-16 pt-1 text-[14px] font-medium">
//         {formatCurrency(period)}
//       </div>
//       <div className="col-span-3 border-t border-black text-right pr-8 pt-1 text-[14px] font-medium">
//         {formatCurrency(ytd)}
//       </div>
//     </div>
//   );

//   return (
//     <div className="w-full bg-white p-6 md:p-10 text-gray-800 font-serif min-h-screen">
//       {/* Top Banner */}
//       <div className="bg-[#5B9BD5] text-white px-4 py-1.5 text-sm font-sans mb-8 w-full shadow-sm">
//         Financial Statements Report - 1
//       </div>

//       {/* Responsive Wrapper to prevent content collapse */}
//       <div className="w-full overflow-x-auto">
//         <div className="min-w-[1000px]">
          
//           {/* Header Section */}
//           <div className="text-center relative mb-10">
//             <h1 className="text-2xl tracking-[0.25em] uppercase font-bold text-gray-900 mb-1">
//               {reportData.orgName}
//             </h1>
//             <h2 className="text-3xl underline decoration-1 underline-offset-8 font-light italic text-gray-700 mb-4">
//               {reportData.reportTitle}
//             </h2>
//             <div className="text-right absolute top-0 right-0 text-sm font-sans text-gray-600 leading-tight">
//               <p>Page 1 of 1</p>
//               <p>{reportData.reportDate}</p>
//               <p>{reportData.reportTime}</p>
//             </div>
//             <p className="mt-6 text-lg font-medium text-gray-800">
//               Organization: {reportData.organization}
//             </p>
//           </div>

//           <hr className="border-black border-t-2 mb-8" />

//           {/* Date Range & YTD Headers */}
//           <div className="grid grid-cols-12 mb-8">
//             <div className="col-span-6"></div>
//             <div className="col-span-3 px-4">
//               <div className="bg-[#D9E1F2] text-center py-2 text-sm font-bold shadow-sm border border-blue-200">
//                 10/01/25<br />10/31/25
//               </div>
//             </div>
//             <div className="col-span-3 px-4">
//               <div className="bg-[#D9E1F2] h-full flex items-center justify-center text-sm font-bold shadow-sm border border-blue-200">
//                 Y-T-D
//               </div>
//             </div>
//           </div>

//           {/* REVENUE */}
//           <div className="mb-6">
//             <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Revenue</h3>
//             <ReportRow label="Total Revenue" period={reportData.sections.revenue.total.period} ytd={reportData.sections.revenue.total.ytd} />
//             <SubtotalLine period={reportData.sections.revenue.total.period} ytd={reportData.sections.revenue.total.ytd} />
//           </div>

//           {/* DIRECT COSTS */}
//           <div className="mb-6">
//             <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Direct Costs</h3>
//             {reportData.sections.directCosts.items.map((item, idx) => (
//               <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
//             ))}
//             <SubtotalLine period={reportData.sections.directCosts.subtotal.period} ytd={reportData.sections.directCosts.subtotal.ytd} />
//           </div>

//           {/* GROSS PROFIT */}
//           <div className="mb-8 bg-gray-50 py-1">
//             <ReportRow label="Gross Profit" period={reportData.sections.grossProfit.period} ytd={reportData.sections.grossProfit.ytd} isBold />
//           </div>

//           {/* EQUIPMENT PURCHASE */}
//           <div className="mb-6">
//             <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Equipment Purchase</h3>
//             {reportData.sections.equipment.items.map((item, idx) => (
//               <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
//             ))}
//             <SubtotalLine period={reportData.sections.equipment.subtotal.period} ytd={reportData.sections.equipment.subtotal.ytd} />
//           </div>

//           {/* NET INCOME AFTER EQUIP */}
//           <div className="mb-8 bg-gray-50 py-1">
//             <ReportRow label="Net Income After Equip. Margin" period={reportData.sections.netIncomeAfterEquip.period} ytd={reportData.sections.netIncomeAfterEquip.ytd} isBold />
//           </div>

//           {/* COST OF OPERATIONS */}
//           <div className="mb-6">
//             <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Cost of Operations</h3>
//             {reportData.sections.costOfOps.items.map((item, idx) => (
//               <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
//             ))}
//             <SubtotalLine period={reportData.sections.costOfOps.subtotal.period} ytd={reportData.sections.costOfOps.subtotal.ytd} />
//           </div>

//           {/* OPERATING MARGIN */}
//           <div className="mb-8 bg-gray-50 py-1">
//             <ReportRow label="Operating Margin" period={reportData.sections.operatingMargin.period} ytd={reportData.sections.operatingMargin.ytd} isBold />
//           </div>

//           {/* OTHER INCOME & EXPENSES */}
//           <div className="mb-6">
//             <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Other Income & Expenses</h3>
//             {reportData.sections.unallowable.items.map((item, idx) => (
//               <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
//             ))}
//             <SubtotalLine period={reportData.sections.unallowable.subtotal.period} ytd={reportData.sections.unallowable.subtotal.ytd} />
//             <ReportRow label="Other Income & Expenses" period={reportData.sections.otherIncome.period} ytd={reportData.sections.otherIncome.ytd} isBold />
//           </div>

//           {/* COMPREHENSIVE INCOME (Double Underline) */}
//           <div className="mt-6 border-t-2 border-black">
//             <div className="grid grid-cols-12 pt-3 font-bold">
//               <div className="col-span-6 text-base uppercase tracking-wider">Comprehensive Income</div>
//               <div className="col-span-3 text-right pr-16 text-base">
//                  <span className="border-b-[4px] border-double border-black pb-1">
//                    {formatCurrency(reportData.sections.comprehensiveIncome.period)}
//                  </span>
//               </div>
//               <div className="col-span-3 text-right pr-8 text-base">
//                  <span className="border-b-[4px] border-double border-black pb-1">
//                    {formatCurrency(reportData.sections.comprehensiveIncome.ytd)}
//                  </span>
//               </div>
//             </div>
//           </div>
          
//           <div className="h-20" /> {/* Bottom spacer for better scrolling */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IS_Report;


// "use client";
// import React, { useState, useEffect, useMemo } from 'react';
// import { backendUrl } from './config';

// const IS_Report = () => {
//   const [rawData, setRawData] = useState([]);
//   const [selectedMonth, setSelectedMonth] = useState(10); // Default to Oct/Pd 10 as per your mock
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch(`${backendUrl}/api/ForecastReport/GetISData`);
//         if (!response.ok) throw new Error('Failed to fetch report data');
//         const result = await response.json();
//         setRawData(Array.isArray(result) ? result : [result]);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Logical Calculation: Filtering and Summing Revenue
//   const revenueCalculations = useMemo(() => {
//     // 1. Filter for Total Revenue entries only
//     const revenueEntries = rawData.filter(
//       item => item.fsGrpDesc === "Revenue" && item.fsLnDesc === "Total Revenue"
//     );

//     // 2. Sum for Selected Month (Current Period)
//     const periodTotal = revenueEntries
//       .filter(item => Number(item.pdNo) === Number(selectedMonth))
//       .reduce((sum, item) => sum + (item.amt1 || 0), 0);

//     // 3. Sum for YTD (All periods in the data)
//     const ytdTotal = revenueEntries.reduce((sum, item) => sum + (item.amt1 || 0), 0);

//     return { periodTotal, ytdTotal };
//   }, [rawData, selectedMonth]);

//   const formatCurrency = (val) => {
//     return new Intl.NumberFormat('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(val || 0);
//   };

//   if (loading) return <div className="p-10 text-center font-sans animate-pulse text-blue-600">Loading Financial Data...</div>;
//   if (error) return <div className="p-10 text-center text-red-600 font-sans border border-red-200 bg-red-50 m-10 rounded">Error: {error}</div>;

//   return (
//     <div className="w-full bg-slate-50 p-4 md:p-8 min-h-screen font-serif print:bg-white print:p-0">
      
//       {/* Interactive Controls */}
//       <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-4 justify-between items-center no-print bg-white p-4 shadow-sm border border-gray-200 rounded">
//         <div className="flex items-center gap-4">
//           <label className="font-sans text-sm font-bold text-gray-700">Select Period (pdNo):</label>
//           <select 
//             value={selectedMonth} 
//             onChange={(e) => setSelectedMonth(e.target.value)}
//             className="border border-gray-300 rounded px-3 py-1.5 text-sm font-sans focus:ring-2 focus:ring-blue-500 outline-none"
//           >
//             {[...Array(12)].map((_, i) => (
//               <option key={i + 1} value={i + 1}>Period {i + 1}</option>
//             ))}
//           </select>
//         </div>
//         <button 
//           onClick={() => window.print()}
//           className="bg-[#5B9BD5] text-white px-6 py-2 rounded shadow-md hover:bg-blue-600 text-sm font-sans transition-all"
//         >
//           Print Report
//         </button>
//       </div>

//       <div className="max-w-6xl mx-auto bg-white shadow-xl border border-gray-200 p-10 print:shadow-none print:border-none">
//         <div className="w-full overflow-x-auto">
//           <div className="min-w-[900px]">
            
//             {/* Header */}
//             <div className="text-center relative mb-10">
//               <h1 className="text-2xl tracking-[0.3em] uppercase font-bold text-gray-900 mb-2">SUMARIA SYSTEMS, LLC</h1>
//               <h2 className="text-3xl font-light italic text-gray-700 border-b-2 border-gray-100 pb-4 inline-block px-10">Income Statement</h2>
//               <div className="text-right absolute top-0 right-0 text-xs font-sans text-gray-400">
//                 <p>Page 1 of 1</p>
//                 <p>{new Date().toLocaleDateString()}</p>
//               </div>
//             </div>

//             {/* Column Headers */}
//             <div className="grid grid-cols-12 mb-6 gap-4">
//               <div className="col-span-6"></div>
//               <div className="col-span-3">
//                 <div className="bg-[#D9E1F2] text-center py-2 text-xs font-bold border-b-2 border-blue-400">
//                   PERIOD {selectedMonth}
//                 </div>
//               </div>
//               <div className="col-span-3">
//                 <div className="bg-[#D9E1F2] text-center py-2 text-xs font-bold border-b-2 border-blue-400 uppercase">
//                   Year-to-Date
//                 </div>
//               </div>
//             </div>

//             {/* REVENUE SECTION ONLY */}
//             <div className="mb-8">
//               <h3 className="text-[#2F5597] text-sm uppercase font-bold tracking-widest mb-3 border-b border-gray-200 pb-1 italic">
//                 Revenue
//               </h3>
              
//               {/* Data Row */}
//               <div className="grid grid-cols-12 py-2 text-[15px] hover:bg-gray-50 transition-colors">
//                 <div className="col-span-6 font-medium">Total Revenue</div>
//                 <div className="col-span-3 text-right pr-16 tabular-nums">
//                   {formatCurrency(revenueCalculations.periodTotal)}
//                 </div>
//                 <div className="col-span-3 text-right pr-8 tabular-nums font-semibold">
//                   {formatCurrency(revenueCalculations.ytdTotal)}
//                 </div>
//               </div>

//               {/* Subtotal Visual Line */}
//               <div className="grid grid-cols-12 pt-1 pb-4">
//                 <div className="col-span-6"></div>
//                 <div className="col-span-3 border-t border-black text-right pr-16 pt-1 text-[14px] font-bold">
//                   {formatCurrency(revenueCalculations.periodTotal)}
//                 </div>
//                 <div className="col-span-3 border-t border-black text-right pr-8 pt-1 text-[14px] font-bold">
//                   {formatCurrency(revenueCalculations.ytdTotal)}
//                 </div>
//               </div>
//             </div>

//             {/* Note: Remaining sections are hidden as requested until further mapping */}
//             <div className="mt-20 text-center text-gray-300 text-xs font-sans uppercase tracking-widest no-print">
//               End of Revenue Section
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IS_Report;  


// "use client";
// import React, { useState, useEffect, useMemo } from 'react';
// import { backendUrl } from './config';

// const IS_Report = () => {
//   const [rawData, setRawData] = useState([]);
//   const [selectedMonth, setSelectedMonth] = useState(5); // Adjusted to 5 based on your API snippet
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch(`${backendUrl}/api/ForecastReport/GetISData`);
//         if (!response.ok) throw new Error('Failed to fetch report data');
//         const result = await response.json();
//         setRawData(Array.isArray(result) ? result : [result]);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Helper function to sum data based on group and line description
//   const getSum = (grpDesc, lnDesc, month = null) => {
//     return rawData
//       .filter(item => 
//         item.fsGrpDesc === grpDesc && 
//         item.fsLnDesc === lnDesc && 
//         (month === null || Number(item.pdNo) === Number(month))
//       )
//       .reduce((sum, item) => sum + (item.amt1 || 0), 0);
//   };

//   const calculations = useMemo(() => {
//     // REVENUE
//     const revenuePeriod = getSum("Revenue", "Total Revenue", selectedMonth);
//     const revenueYTD = getSum("Revenue", "Total Revenue");

//     // DIRECT COSTS - Individual Items
//     const directCostItems = [
//       { label: "Sumaria Labor Onsite", lnDesc: "Sumaria Labor Onsite" },
//       { label: "Sumaria ODC's", lnDesc: "Sumaria ODC's" },
//       { label: "Sumaria Travel", lnDesc: "Sumaria Travel" },
//       { label: "Subcontractors", lnDesc: "Subcontractors" },
//     ].map(item => ({
//       ...item,
//       period: getSum("Direct Costs", item.lnDesc, selectedMonth),
//       ytd: getSum("Direct Costs", item.lnDesc)
//     }));

//     // DIRECT COSTS - Subtotal
//     const directCostsSubtotalPeriod = directCostItems.reduce((a, b) => a + b.period, 0);
//     const directCostsSubtotalYTD = directCostItems.reduce((a, b) => a + b.ytd, 0);

//     return { revenuePeriod, revenueYTD, directCostItems, directCostsSubtotalPeriod, directCostsSubtotalYTD };
//   }, [rawData, selectedMonth]);

//   const formatCurrency = (val) => {
//     const formatted = new Intl.NumberFormat('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(Math.abs(val || 0));
//     return val < 0 ? `(${formatted})` : formatted;
//   };

//   if (loading) return <div className="p-10 text-center font-sans animate-pulse">Loading Financial Data...</div>;
//   if (error) return <div className="p-10 text-center text-red-600 font-sans">Error: {error}</div>;

//   return (
//     <div className="w-full bg-slate-50 p-4 md:p-8 min-h-screen font-serif">
//       {/* Month Selector */}
//       <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center no-print bg-white p-4 shadow-sm border rounded">
//         <div className="flex items-center gap-4">
//           <label className="font-sans text-sm font-bold text-gray-700">Reporting Period:</label>
//           <select 
//             value={selectedMonth} 
//             onChange={(e) => setSelectedMonth(e.target.value)}
//             className="border border-gray-300 rounded px-3 py-1.5 text-sm font-sans outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             {[...Array(12)].map((_, i) => (
//               <option key={i + 1} value={i + 1}>Month {i + 1}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto bg-white shadow-xl p-10 border border-gray-200">
//         <div className="min-w-[900px]">
//           {/* Column Headers */}
//           <div className="grid grid-cols-12 mb-6 gap-4">
//             <div className="col-span-6"></div>
//             <div className="col-span-3 text-center bg-[#D9E1F2] py-2 text-xs font-bold border-b-2 border-blue-400">
//               PERIOD {selectedMonth}
//             </div>
//             <div className="col-span-3 text-center bg-[#D9E1F2] py-2 text-xs font-bold border-b-2 border-blue-400">
//               YEAR-TO-DATE
//             </div>
//           </div>

//           {/* REVENUE SECTION */}
//           <div className="mb-8">
//             <h3 className="text-[#2F5597] text-sm uppercase font-bold tracking-widest mb-2 italic border-b border-gray-100">Revenue</h3>
//             <div className="grid grid-cols-12 py-1.5 text-[14px]">
//               <div className="col-span-6 pl-4">Total Revenue</div>
//               <div className="col-span-3 text-right pr-16">{formatCurrency(calculations.revenuePeriod)}</div>
//               <div className="col-span-3 text-right pr-8 font-semibold">{formatCurrency(calculations.revenueYTD)}</div>
//             </div>
//           </div>

//           {/* DIRECT COSTS SECTION */}
//           <div className="mb-8">
//             <h3 className="text-[#2F5597] text-sm uppercase font-bold tracking-widest mb-2 italic border-b border-gray-100">Direct Costs</h3>
            
//             {calculations.directCostItems.map((item, idx) => (
//               <div key={idx} className="grid grid-cols-12 py-1.5 text-[14px] hover:bg-gray-50">
//                 <div className="col-span-6 pl-8">{item.label}</div>
//                 <div className="col-span-3 text-right pr-16">{formatCurrency(item.period)}</div>
//                 <div className="col-span-3 text-right pr-8">{formatCurrency(item.ytd)}</div>
//               </div>
//             ))}

//             {/* Subtotal Line */}
//             <div className="grid grid-cols-12 pt-2 pb-4">
//               <div className="col-span-6"></div>
//               <div className="col-span-3 border-t border-black text-right pr-16 pt-1 text-[14px] font-bold">
//                 {formatCurrency(calculations.directCostsSubtotalPeriod)}
//               </div>
//               <div className="col-span-3 border-t border-black text-right pr-8 pt-1 text-[14px] font-bold">
//                 {formatCurrency(calculations.directCostsSubtotalYTD)}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IS_Report;

"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { backendUrl } from './config';
import { FaPlay } from 'react-icons/fa'; // Optional: for a nice icon

const IS_Report = () => {
  const [rawData, setRawData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(10); 
  const [loading, setLoading] = useState(false); // Start as false
  const [hasRun, setHasRun] = useState(false); // Track if report has been triggered
  const [error, setError] = useState(null);

  // 1. Fetch function wrapped in useCallback
  const handleRunReport = async () => {
    setLoading(true);
    setHasRun(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/ForecastReport/GetISData`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      const result = await response.json();
      setRawData(Array.isArray(result) ? result : [result]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSum = useCallback((grpDesc, lnDesc, monthLimit = null, isExact = false) => {
    if (!rawData || rawData.length === 0) return 0;

    const total = rawData
      .filter(item => {
        const matchesGrp = item.fsGrpDesc?.trim().toLowerCase() === grpDesc.trim().toLowerCase();
        const matchesLn = item.fsLnDesc?.trim().toLowerCase() === lnDesc.trim().toLowerCase();
        
        const itemPd = Number(item.pdNo);
        const matchesPd = isExact 
          ? itemPd === monthLimit 
          : (monthLimit === null || itemPd <= monthLimit);

        return matchesGrp && matchesLn && matchesPd;
      })
      .reduce((sum, item) => sum + (parseFloat(item.amt1) || 0), 0);
    
    return total * -1;
  }, [rawData]);

  const calculations = useMemo(() => {
    if (!hasRun || rawData.length === 0) return null;

    const calcSection = (defaultGrp, lines) => {
      const items = lines.map(ln => {
        const isComplex = typeof ln === 'object' && !Array.isArray(ln);
        const isMultiKey = Array.isArray(ln);
        const label = isComplex ? ln.label : (isMultiKey ? ln[0] : ln);
        const mappingKeys = isComplex ? ln.keys : (isMultiKey ? ln : [ln]);
        
        let periodTotal = 0;
        let ytdTotal = 0;

        mappingKeys.forEach(key => {
          const targetGrp = typeof key === 'object' ? key.grp : defaultGrp;
          const targetLn = typeof key === 'object' ? key.ln : key;
          periodTotal += getSum(targetGrp, targetLn, selectedMonth, true);
          ytdTotal += getSum(targetGrp, targetLn, selectedMonth, false);
        });
        
        return { label, period: periodTotal, ytd: ytdTotal };
      });

      const subtotalPeriod = items.reduce((a, b) => a + b.period, 0);
      const subtotalYTD = items.reduce((a, b) => a + b.ytd, 0);
      return { items, subtotalPeriod, subtotalYTD };
    };

    const rev = calcSection("Revenue", ["Total Revenue"]);
    const dc = calcSection("Direct Costs", ["Sumaria Labor Onsite", "Sumaria ODCs", "Sumaria Travel", "Subcontractors"]);
    const grossProfitP = rev.subtotalPeriod + dc.subtotalPeriod;
    const grossProfitY = rev.subtotalYTD + dc.subtotalYTD;

    const equip = calcSection("Equipment Purchase", ["Income", "Expense"]);
    const netEquipP = grossProfitP + equip.subtotalPeriod;
    const netEquipY = grossProfitY + equip.subtotalYTD;

    const coo = calcSection("Cost of Operations", [
      "Fringe Benefits", "Overhead", "Material & Handling", "HR Service Center", 
      ["General & Admin", 
        { grp: "Cost of Operations, EBITDA Add Back", ln: "Depreciation, General & Admin" },
        { grp: "Cost of Operations, EBITDA Add Back", ln: "General & Admin, Taxes" }
      ], 
      "Unallocated Burden Allocations"
    ]);

    const opMarginP = netEquipP + coo.subtotalPeriod;
    const opMarginY = netEquipY + coo.subtotalYTD;

    const other = calcSection("Other Income & Expenses", [
      [
        "Unallowable Expenses", 
        { grp: "EBITDA Add Back, Other Income & Expenses", ln: "Interest, Unallowable Expenses" },
        { grp: "EBITDA Add Back, Other Income & Expenses", ln: "Amortization, Unallowable Expenses" }
      ], 
      // "Other Income & Expenses"
    ]);

    const otherIncomeTotalP = opMarginP + other.subtotalPeriod;
    const otherIncomeTotalY = opMarginY + other.subtotalYTD;

    return { 
        rev, dc, grossProfitP, grossProfitY, equip, netEquipP, netEquipY, 
        coo, opMarginP, opMarginY, other, otherIncomeTotalP, otherIncomeTotalY, 
        compP: otherIncomeTotalP, compY: otherIncomeTotalY 
    };
  }, [selectedMonth, getSum, hasRun, rawData]);

  const formatCurrency = (val) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val || 0));
    return val < 0 ? `(${formatted})` : formatted;
  };

  const RenderSection = ({ title, data, indent = true }) => (
    <div className="mb-6">
      <h3 className="text-[#2F5597] text-sm uppercase font-bold tracking-widest mb-2 italic border-b border-gray-100">{title}</h3>
      {data.items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 py-1 text-[14px] hover:bg-slate-50 transition-colors">
          <div className={`col-span-6 ${indent ? 'pl-8' : 'pl-4'}`}>{item.label}</div>
          <div className="col-span-3 text-right pr-16 tabular-nums">{formatCurrency(item.period)}</div>
          <div className="col-span-3 text-right pr-8 tabular-nums">{formatCurrency(item.ytd)}</div>
        </div>
      ))}
      <div className="grid grid-cols-12 pt-1 pb-4">
        <div className="col-span-6"></div>
        <div className="col-span-3 border-t border-slate-900 text-right pr-16 pt-1 text-[14px] font-bold tabular-nums">{formatCurrency(data.subtotalPeriod)}</div>
        <div className="col-span-3 border-t border-slate-900 text-right pr-8 pt-1 text-[14px] font-bold tabular-nums">{formatCurrency(data.subtotalYTD)}</div>
      </div>
    </div>
  );

  const RenderMargin = ({ label, period, ytd, isFinal = false }) => (
    <div className={`grid grid-cols-12 py-3 mb-6 font-bold text-[14px] ${isFinal ? 'bg-slate-900 text-white rounded-sm' : 'bg-slate-50 border-y border-slate-200 text-slate-900'}`}>
      <div className="col-span-6 pl-4 uppercase tracking-tight">{label}</div>
      <div className="col-span-3 text-right pr-16 tabular-nums">{formatCurrency(period)}</div>
      <div className="col-span-3 text-right pr-8 tabular-nums">{formatCurrency(ytd)}</div>
    </div>
  );

  return (
    <div className="w-full bg-slate-100 p-2 md:p-6 min-h-screen font-serif">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #report-print-area, #report-print-area * { visibility: visible; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Control Bar */}
      <div className="max-w-[98%] mx-auto mb-6 flex justify-between items-center no-print bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-6 items-center">
            <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Month</label>
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                    className="mt-1 bg-slate-50 border border-slate-200 py-2 px-4 rounded-lg font-sans text-sm outline-none cursor-pointer"
                >
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}> {i+1}</option>)}
                </select>
            </div>
            
            {/* THE NEW RUN REPORT BUTTON */}
            <button 
                onClick={handleRunReport}
                disabled={loading}
                className={`mt-4 flex items-center gap-2 px-6 py-2 rounded-lg font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-md ${
                    loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                {loading ? 'Generating...' : <><FaPlay className="w-2 h-2" /> Run Report</>}
            </button>
        </div>

        <button 
            onClick={() => window.print()} 
            disabled={!hasRun}
            className={`px-6 py-2 rounded-lg font-sans text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
                !hasRun ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white'
            }`}
        >
            Export PDF
        </button>
      </div>

      {/* Main Report Area */}
      <div id="report-print-area" className="max-w-[98%] mx-auto bg-white shadow-2xl p-8 md:p-16 border border-slate-200 min-h-[80vh] flex flex-col">
        {!hasRun ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FaPlay className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-lg font-sans font-medium">Click "Run Report" to load financial data</p>
                <p className="text-sm font-sans italic mt-2 text-slate-300">Sumaria Systems Income Statement v2.0</p>
            </div>
        ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-600 font-sans font-bold animate-pulse tracking-widest">CALCULATING STATEMENT...</p>
            </div>
        ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-500">
                <p className="text-xl font-bold">Error loading report</p>
                <p className="text-sm">{error}</p>
                <button onClick={handleRunReport} className="mt-4 text-blue-600 underline">Try again</button>
            </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="text-center mb-12">
                <h1 className="text-3xl font-black uppercase tracking-[0.4em] text-slate-900 mb-2">Sumaria Systems, LLC</h1>
                <h2 className="text-4xl italic font-serif text-slate-600">Income Statement</h2>
              </div>

              <div className="grid grid-cols-12 mb-10 gap-4">
                <div className="col-span-6"></div>
                <div className="col-span-3 text-center bg-slate-100 py-3 text-[10px] font-black border-b-2 border-slate-900 uppercase">Period {selectedMonth}</div>
                <div className="col-span-3 text-center bg-slate-100 py-3 text-[10px] font-black border-b-2 border-slate-900 uppercase">YTD (1-{selectedMonth})</div>
              </div>

              <RenderSection title="Revenue" data={calculations.rev} indent={false} />
              <RenderSection title="Direct Costs" data={calculations.dc} />
              <RenderMargin label="Gross Profit" period={calculations.grossProfitP} ytd={calculations.grossProfitY} />
              
              <RenderSection title="Equipment Purchase" data={calculations.equip} />
              <RenderMargin label="Net Income After Equip. Margin" period={calculations.netEquipP} ytd={calculations.netEquipY} />

              <RenderSection title="Cost of Operations" data={calculations.coo} />
              <RenderMargin label="Operating Margin" period={calculations.opMarginP} ytd={calculations.opMarginY} />

              <RenderSection title="Other Income & Expenses" data={calculations.other} />
              <RenderMargin label="Total Other Income & Expenses" period={calculations.otherIncomeTotalP} ytd={calculations.otherIncomeTotalY} />

              <div className="mt-12 pt-6 border-t-[5px] border-double border-slate-900">
                <div className="grid grid-cols-12 font-black text-xl text-slate-900">
                  <div className="col-span-6 uppercase tracking-tight">Comprehensive Income</div>
                  <div className="col-span-3 text-right pr-16 border-b-4 border-double border-slate-900 pb-1 tabular-nums">{formatCurrency(calculations.compP)}</div>
                  <div className="col-span-3 text-right pr-8 border-b-4 border-double border-slate-900 pb-1 tabular-nums">{formatCurrency(calculations.compY)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IS_Report;
