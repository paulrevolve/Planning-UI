import React, { useState, useEffect } from "react";
import Select from "react-select";
import { backendUrl } from "./config";


const AnalogRate = () => {
  // projectInput (free-text) removed — selection should come only from API-provided dropdown
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [activeTab, setActiveTab] = useState("Burden Cost Ceiling Details");
  const [isSearched, setIsSearched] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [nbiRateRows,setNbiRateRows] = useState([]);


const nbiRateRows = [
  {
    accountType: "1 - Total Revenue (REVENUE)",
    actual: "74,462,470.14",
    rates: ["", "", "", "", "", ""],
  },
  {
    accountType: "2 - Sumaria Labor Onsite (LABOR)",
    actual: "32,886,490.18",
    rates: ["44.17%", "44.17%", "44.17%", "44.17%", "44.17%", "44.17%"],
  },
  {
    accountType: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)",
    actual: "112.92",
    rates: ["0.00%", "0.00%", "0.00%", "0.00%", "0.00%", "0.00%"],
  },
  {
    accountType: "5 - Sumaria Travel (NON-LABOR)",
    actual: "1,350,732.10",
    rates: ["1.81%", "1.81%", "1.81%", "1.81%", "1.81%", "1.81%"],
  },
  {
    accountType: "6 - Subcontractors (LABOR)",
    actual: "14,850,167.76",
    rates: ["19.94%", "19.94%", "19.94%", "19.94%", "19.94%", "19.94%"],
  },
  {
    accountType: "6 - Subcontractors (NON-LABOR)",
    actual: "618,959.31",
    rates: ["0.83%", "0.83%", "0.83%", "0.83%", "0.83%", "0.83%"],
  },
];
 

useEffect(() => {
  const fetchNbiRates = async () => {
    if (!selectedProjectId) {
      setNbiRateRows([]);
      return;
    }
    try {
      const response = await fetch(
        `${backendUrl}/AnalogRates/GetNbiRates?projectId=${selectedProjectId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status ${response.status}`);
      }
      const data = await response.json();

      // Optional: normalize rates to always be 6 elements
      const normalized = data.map(row => ({
        accountType: row.accountType,
        actual: row.actual,
        rates: (row.rates || []).slice(0, 6),
      }));

      setNbiRateRows(normalized);
    } catch (err) {
      console.error("Failed to fetch NBI rates", err);
      setNbiRateRows([]);
    }
  };

  fetchNbiRates();
}, [selectedProjectId, backendUrl]);

 
  return (
    <div className="w-full mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg ml-5">
     <div className="p-4 border-b mb-1 border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             NBIs Analogous Rate
          </h2>
          
        </div>
      {/* project selector (API-sourced) — free-text entry removed on purpose */}
 <table className="min-w-full border border-gray-300 text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="border px-2 py-1 text-left">NBIs RATE</th>
      <th className="border px-2 py-1 text-right">FY-25 Actual AMT</th>
      <th className="border px-2 py-1 text-right">FY-25 Rate</th>
      <th className="border px-2 py-1 text-right">FY-26 Rate</th>
      <th className="border px-2 py-1 text-right">FY-27 Rate</th>
      <th className="border px-2 py-1 text-right">FY-28 Rate</th>
      <th className="border px-2 py-1 text-right">FY-29 Rate</th>
      <th className="border px-2 py-1 text-right">FY-30 Rate</th>
    </tr>
  </thead>
  <tbody>
    {nbiRateRows.map((row) => (
      <tr key={row.accountType}>
        <td className="border px-2 py-1">{row.accountType}</td>
        <td className="border px-2 py-1 text-right">
          ${" "}{row.actual}
        </td>
        {row.rates.map((r, idx) => (
          <td key={idx} className="border px-2 py-1 text-right">
            {r}
          </td>
        ))}
      </tr>   
    ))}
  </tbody>
</table>

    </div>
  );
};

export default AnalogRate;
