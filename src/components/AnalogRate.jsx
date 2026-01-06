// import React, { useState, useEffect } from "react";
// import Select from "react-select";
// import { backendUrl } from "./config";


// const AnalogRate = () => {
//   // projectInput (free-text) removed — selection should come only from API-provided dropdown
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [activeTab, setActiveTab] = useState("Burden Cost Ceiling Details");
//   const [isSearched, setIsSearched] = useState(false);
//   const [availableProjects, setAvailableProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   // const [nbiRateRows,setNbiRateRows] = useState([]);


// const nbiRateRows = [
//   {
//     accountType: "1 - Total Revenue (REVENUE)",
//     actual: "74,462,470.14",
//     rates: ["", "", "", "", "", ""],
//   },
//   {
//     accountType: "2 - Sumaria Labor Onsite (LABOR)",
//     actual: "32,886,490.18",
//     rates: ["44.17%", "44.17%", "44.17%", "44.17%", "44.17%", "44.17%"],
//   },
//   {
//     accountType: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)",
//     actual: "112.92",
//     rates: ["0.00%", "0.00%", "0.00%", "0.00%", "0.00%", "0.00%"],
//   },
//   {
//     accountType: "5 - Sumaria Travel (NON-LABOR)",
//     actual: "1,350,732.10",
//     rates: ["1.81%", "1.81%", "1.81%", "1.81%", "1.81%", "1.81%"],
//   },
//   {
//     accountType: "6 - Subcontractors (LABOR)",
//     actual: "14,850,167.76",
//     rates: ["19.94%", "19.94%", "19.94%", "19.94%", "19.94%", "19.94%"],
//   },
//   {
//     accountType: "6 - Subcontractors (NON-LABOR)",
//     actual: "618,959.31",
//     rates: ["0.83%", "0.83%", "0.83%", "0.83%", "0.83%", "0.83%"],
//   },
// ];
 
 

// useEffect(() => {
//   const fetchNbiRates = async () => {
//     if (!selectedProjectId) {
//       setNbiRateRows([]);
//       return;
//     }
//     try {
//       const response = await fetch(
//         `${backendUrl}/api/AnalgsRt`
//       );
//       if (!response.ok) {
//         throw new Error(`HTTP error! status ${response.status}`);
//       }
//       const data = await response.json();

//       // Transform API response to expected table format
//       const normalized = data.map(row => ({
//         id: row.analgId,
//         totRev: row.totRev || 0,
//         labOnste: row.labOnste || 0,
//         labOnsteNonBill: row.labOnsteNonBill || 0,
//         nonLabTrvl: row.nonLabTrvl || 0,
//         subLab: row.subLab || 0,
//         subNonLab: row.subNonLab || 0,
//         clsPd: row.clsPd || '',
//         ovrwrteRt: row.ovrwrteRt || false,
//         fyCd: row.fyCd || 0,
//         actualAmt: row.actualAmt || false,
//         modifiedBy: row.modifiedBy || '',
//         timeStamp: row.timeStamp || '',
//         // Add any computed fields your table needs
//         isEditing: false,
//         isNew: false
//       }));

//       setNbiRateRows(normalized);
//     } catch (err) {
//       console.error("Failed to fetch NBI rates", err);
//       setNbiRateRows([]);
//     }
//   };

//   fetchNbiRates();
// }, [selectedProjectId, backendUrl]);


 
//   return (
//     <div className="w-full mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg ml-5">
//      <div className="p-4 border-b mb-1 border-gray-100 flex items-center justify-between bg-gray-50/50">
//           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//              NBIs Analogous Rate
//           </h2>
          
//         </div>
//       {/* project selector (API-sourced) — free-text entry removed on purpose */}
//  <table className="min-w-full border border-gray-300 text-sm">
//   <thead className="bg-gray-100">
//     <tr>
//       <th className="border px-2 py-1 text-left">NBIs RATE</th>
//       <th className="border px-2 py-1 text-right">FY-25 Actual AMT</th>
//       <th className="border px-2 py-1 text-right">FY-25 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-26 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-27 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-28 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-29 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-30 Rate</th>
//     </tr>
//   </thead>
//   <tbody>
//     {nbiRateRows.map((row) => (
//       <tr key={row.accountType}>
//         <td className="border px-2 py-1">{row.accountType}</td>
//         <td className="border px-2 py-1 text-right">
//           ${" "}{row.actual}
//         </td>
//         {row.rates.map((r, idx) => (
//           <td key={idx} className="border px-2 py-1 text-right">
//             {r}
//           </td>
//         ))}
//       </tr>   
//     ))}
//   </tbody>
// </table>

//     </div>
//   );
// };

// export default AnalogRate;


// Version 2 


// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const AnalogRate = () => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [rawData, setRawData] = useState([]);
//   const [isSaving, setIsSaving] = useState(false);

//   const categories = [
//     { label: "1 - Total Revenue (REVENUE)", key: "totRev" },
//     { label: "2 - Sumaria Labor Onsite (LABOR)", key: "labOnste" },
//     { label: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)", key: "labOnsteNonBill" },
//     { label: "5 - Sumaria Travel (NON-LABOR)", key: "nonLabTrvl" },
//     { label: "6 - Subcontractors (LABOR)", key: "subLab" },
//     { label: "6 - Subcontractors (NON-LABOR)", key: "subNonLab" },
//   ];

//   const fyYears = [25, 26, 27, 28, 29, 30];

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${backendUrl}/api/AnalgsRt`);
//       if (!response.ok) throw new Error("Failed to fetch data");
//       const data = await response.json();
//       setRawData(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getValue = (categoryKey, fyCode, isActual) => {
//     const record = rawData.find(d => d.fyCd === fyCode && d.actualAmt === isActual);
//     if (!record) return ""; 
//     return record[categoryKey] ?? "";
//   };

//   const handleRateChange = (categoryKey, fyCode, newValue) => {
//     setRawData((prevData) => {
//       const newData = [...prevData];
//       const index = newData.findIndex(d => d.fyCd === fyCode && d.actualAmt === false);

//       if (index > -1) {
//         newData[index] = { 
//           ...newData[index], 
//           [categoryKey]: newValue === "" ? "" : parseFloat(newValue),
//           ovrwrteRt: true 
//         };
//       } else {
//         const newRecord = {
//           fyCd: fyCode,
//           actualAmt: false,
//           ovrwrteRt: true,
//           [categoryKey]: newValue === "" ? "" : parseFloat(newValue)
//         };
//         newData.push(newRecord);
//       }
//       return newData;
//     });
//   };

//   const handleSave = async (fyCode) => {
//     const recordToSave = rawData.find(d => d.fyCd === fyCode && d.actualAmt === false);
//     if (!recordToSave) return;

//     setIsSaving(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/AnalgsRt`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(recordToSave),
//       });
//       if (!response.ok) throw new Error("Update failed");
//       alert(`FY-${fyCode} rates saved successfully!`);
//     } catch (err) {
//       alert("Error: " + err.message);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (loading) return <div className="p-10 text-center text-gray-500">Loading Financial Data...</div>;

//   return (
//     <div className="w-full mx-auto bg-white p-6 rounded-xl shadow-lg ml-5">
//       {/* CSS to hide arrows and handle input styling */}
//       <style>{`
//         input::-webkit-outer-spin-button,
//         input::-webkit-inner-spin-button {
//           -webkit-appearance: none;
//           margin: 0;
//         }
//         input[type=number] {
//           -moz-appearance: textfield;
//         }
//       `}</style>

//       <div className="p-4 border-b mb-6 flex items-center justify-between bg-gray-50 rounded-t-lg">
//         <h2 className="text-xl font-bold text-gray-800">NBIs Analogous Rate</h2>
//         <button 
//           onClick={fetchData} 
//           className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm"
//         >
//           Refresh Data
//         </button>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border-collapse">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border border-gray-300 px-4 py-3 text-left text-gray-700">Category</th>
//               <th className="border border-gray-300 px-4 py-3 text-right bg-blue-50 text-blue-900">FY-25 Actual AMT</th>
//               {fyYears.map(year => (
//                 <th key={year} className="border border-gray-300 px-4 py-3 text-right">
//                   <div className="flex flex-col items-end gap-2">
//                     <span className="text-gray-700">FY-{year} Rate (%)</span>
//                     <button 
//                       onClick={() => handleSave(year)}
//                       className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 uppercase tracking-wider font-bold shadow-sm"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {categories.map((cat) => (
//               <tr key={cat.key} className="hover:bg-gray-50">
//                 <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-white">
//                   {cat.label}
//                 </td>
                
//                 {/* READ-ONLY ACTUALS */}
//                 <td className="border border-gray-300 px-4 py-3 text-right bg-blue-50/10 font-mono text-gray-600">
//                   ${Number(getValue(cat.key, 25, true)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                 </td>

//                 {/* EDITABLE RATES WITH BORDERS */}
//                 {fyYears.map(year => {
//                   const isModified = rawData.find(d => d.fyCd === year && d.actualAmt === false)?.ovrwrteRt;
//                   return (
//                     <td key={year} className="border border-gray-300 px-2 py-2">
//                       <input
//                         type="number"
//                         step="0.01"
//                         placeholder="0.00"
//                         onWheel={(e) => e.target.blur()} 
//                         className={`w-full text-right p-2 rounded-md border transition-all outline-none font-mono
//                           ${isModified 
//                             ? 'border-blue-400 bg-blue-50/30 text-blue-700 font-bold' 
//                             : 'border-gray-200 bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
//                           }`}
//                         value={getValue(cat.key, year, false)}
//                         onChange={(e) => handleRateChange(cat.key, year, e.target.value)}
//                       />
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-4 flex items-center gap-4 text-xs">
//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div>
//           <span className="text-gray-600 font-medium">Modified Rates</span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
//           <span className="text-gray-600 font-medium">Default Rates</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AnalogRate;



import React, { useState, useEffect } from "react";
import { backendUrl } from "./config";

const AnalogRate = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(null);
  
  // Toggle between 'Overwrite' and 'Calculated'
  const [viewMode, setViewMode] = useState("Calculated"); 

  const categories = [
    { label: "1 - Total Revenue (REVENUE)", key: "totRev" },
    { label: "2 - Sumaria Labor Onsite (LABOR)", key: "labOnste" },
    { label: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)", key: "labOnsteNonBill" },
    { label: "5 - Sumaria Travel (NON-LABOR)", key: "nonLabTrvl" },
    { label: "6 - Subcontractors (LABOR)", key: "subLab" },
    { label: "6 - Subcontractors (NON-LABOR)", key: "subNonLab" },
  ];

  const fyYears = [2025, 2026, 2027, 2028, 2029, 2030];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/AnalgsRt`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setRawData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getValue = (categoryKey, fyCode, isActual) => {
    // If it's the Actual column, always look for actualAmt: true
    if (isActual) {
      const record = rawData.find(d => d.fyCd === fyCode && d.actualAmt === true);
      return record ? (record[categoryKey] ?? "") : "";
    }

    // Otherwise, look for the record based on the current viewMode (Slider)
    const targetOverwriteStatus = viewMode === "Overwrite";
    const record = rawData.find(d => 
      d.fyCd === fyCode && 
      d.actualAmt === false && 
      d.ovrwrteRt === targetOverwriteStatus
    );
    
    return record ? (record[categoryKey] ?? "") : "";
  };

  const handleStartOverwrite = (year) => {
    setViewMode("Overwrite");
    setEditMode(year);
  };

  const handleRateChange = (categoryKey, fyCode, newValue) => {
    setRawData((prevData) => {
      const newData = [...prevData];
      const index = newData.findIndex(d => d.fyCd === fyCode && d.actualAmt === false && d.ovrwrteRt === true);
      const parsedVal = newValue === "" ? "" : parseFloat(newValue);

      if (index > -1) {
        newData[index] = { ...newData[index], [categoryKey]: parsedVal };
      } else {
        newData.push({ fyCd: fyCode, actualAmt: false, ovrwrteRt: true, [categoryKey]: parsedVal });
      }
      return newData;
    });
  };

  const handleApplyToAll = (sourceYear) => {
    const sourceRecord = rawData.find(d => d.fyCd === sourceYear && d.actualAmt === false && d.ovrwrteRt === true);
    if (!sourceRecord) return;

    setRawData((prevData) => {
      const valuesToCopy = {};
      categories.forEach(cat => {
        valuesToCopy[cat.key] = sourceRecord[cat.key];
      });

      return prevData.map(record => {
        if (record.actualAmt === false && record.ovrwrteRt === true) {
          return { ...record, ...valuesToCopy };
        }
        return record;
      });
    });
  };

  const handleSave = async (fyCode) => {
    const recordToSave = rawData.find(d => d.fyCd === fyCode && d.actualAmt === false && d.ovrwrteRt === true);
    if (!recordToSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${backendUrl}/api/AnalgsRt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordToSave),
      });
      if (!response.ok) throw new Error("Update failed");
      alert(`FY-${fyCode} rates saved successfully!`);
      setEditMode(null);
      fetchData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 italic">Loading Financials...</div>;

  return (
    <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-lg border border-gray-100">
      <style>{`
        .financial-font {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-variant-numeric: tabular-nums;
        }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Header with Slider */}
      <div className="p-4 border-b mb-4 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-bold text-slate-800">NBIs Analogous Rate</h2>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-gray-200 p-1 rounded-lg border border-gray-300">
            <button
              onClick={() => { setViewMode("Calculated"); setEditMode(null); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === "Calculated" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Calculated Rates
            </button>
            <button
              onClick={() => setViewMode("Overwrite")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === "Overwrite" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overwrite Rates
            </button>
          </div>

          <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-100 transition-all shadow-sm">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-gray-300 px-3 py-3 text-left text-slate-700 min-w-[200px]">Category</th>
              <th className="border border-gray-300 px-3 py-3 text-right bg-blue-100/30 text-blue-900 min-w-[150px]">FY-2025 Actuals</th>
              {fyYears.map(year => (
                <th key={year} className={`border border-gray-300 px-2 py-3 text-right transition-colors ${editMode === year ? 'bg-orange-50' : ''} min-w-[230px]`}>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-slate-700 font-bold text-xs uppercase tracking-tight">FY-{year} {viewMode} (%)</span>
                    
                    <div className="flex flex-row items-center justify-end gap-1.5 w-full whitespace-nowrap">
                      {/* Scenario 1: Slider is on Calculated -> Show Overwrite Button */}
                      {viewMode === "Calculated" && (
                        <button 
                          onClick={() => handleStartOverwrite(year)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-[4px] text-[10px] font-bold hover:bg-blue-700 uppercase shadow-sm"
                        >
                          Overwrite
                        </button>
                      )}

                      {/* Scenario 2: Slider is on Overwrite and this year is being edited -> Show Save/Cancel */}
                      {viewMode === "Overwrite" && editMode === year && (
                        <>
                          <button onClick={() => handleApplyToAll(year)} className="bg-indigo-600 text-white px-2 py-1 rounded-[4px] text-[10px] font-bold hover:bg-indigo-700 uppercase">Apply All</button>
                          <button onClick={() => handleSave(year)} className="bg-green-600 text-white px-2 py-1 rounded-[4px] text-[10px] font-bold hover:bg-green-700 uppercase">Save</button>
                          <button onClick={() => setEditMode(null)} className="bg-gray-500 text-white px-2 py-1 rounded-[4px] text-[10px] font-bold hover:bg-gray-600 uppercase">Cancel</button>
                        </>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.key} className="hover:bg-gray-50/50">
                <td className="border border-gray-300 px-3 py-3 font-medium text-slate-700 bg-white text-xs leading-tight">
                  {cat.label}
                </td>
                
                <td className="border border-gray-300 px-3 py-3 text-right bg-blue-50/10 financial-font text-slate-800 font-semibold text-sm">
                  {getValue(cat.key, 2025, true) !== "" 
                    ? `$ ${Number(getValue(cat.key, 2025, true)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                    : "—"}
                </td>

                {fyYears.map(year => {
                  const isActive = editMode === year;
                  const value = getValue(cat.key, year, false);
                  
                  return (
                    <td key={year} className={`border border-gray-300 px-1 py-1 transition-colors ${isActive ? 'bg-orange-50/20' : ''}`}>
                      <input
                        type="number"
                        disabled={!isActive}
                        className={`w-full text-right px-2 py-2.5 rounded outline-none financial-font font-bold transition-all
                          ${isActive 
                            ? 'text-xl text-orange-700 bg-white border-2 border-orange-300' 
                            : viewMode === "Overwrite"
                              ? 'text-xl text-blue-700 bg-blue-50/40'
                              : 'text-xl text-slate-700 bg-transparent border-transparent'
                          }`}
                        value={value}
                        onChange={(e) => handleRateChange(cat.key, year, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalogRate;