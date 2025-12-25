import React, { useState, useEffect, useRef } from "react"; 
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const PoolConfigurationTable = () => {
  const [tableData, setTableData] = useState([]);
  const [originalTableData, setOriginalTableData] = useState([]);
  const [groupCodes, setGroupCodes] = useState([]);
  const [groupNames, setGroupNames] = useState({});
  const [groupTypes, setGroupTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgSearchTerm, setOrgSearchTerm] = useState(""); 
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
 const [hasLoadedForYear, setHasLoadedForYear] = useState({}); 

 const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);
 
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // remember which year we already loaded
  const lastLoadedYearRef = useRef(null);

    useEffect(() => {
    // if year didn't actually change, do nothing
    if (lastLoadedYearRef.current === selectedYear) {
      console.log("skip fetch, selectedYear unchanged:", selectedYear);
      return;
    }

    console.log(">>> REAL fetchData call for selectedYear:", selectedYear);
    lastLoadedYearRef.current = selectedYear;

    const fetchData = async () => {
      console.log("fetchData running for selectedYear:", selectedYear);
      setLoading(true);
      try {
        const groupResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllPools`
        );
        const codes = groupResponse.data.map((item) => item.code);
        const names = groupResponse.data.reduce((acc, item) => {
          acc[item.code] = item.name;
          return acc;
        }, {});
        const types = groupResponse.data.reduce((acc, item) => {
          acc[item.code] = item.type;
          return acc;
        }, {});
        setGroupCodes(codes);
        setGroupNames(names);
        setGroupTypes(types);

        const tableResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAccountPools?Year=${selectedYear}`
        );
        const tableDataRaw = tableResponse.data;

        const mappedData = tableDataRaw.map((row) => {
          const mappedRow = {
            orgId: row.orgId || "",
            acctId: row.acctId || "",
          };
          codes.forEach((code) => {
            mappedRow[code] = row[code.toUpperCase()] === true;
          });
          return mappedRow;
        });

        setTableData(mappedData);
        setOriginalTableData(mappedData);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Unknown error"
        );
        setTableData([]);
        setOriginalTableData([]);
        setGroupCodes([]);
        setGroupNames({});
        setGroupTypes({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // const handleYearChange = (e) => {
  //   const y = Number(e.target.value);
  //   if (!Number.isNaN(y) && y !== selectedYear) {
  //     setSelectedYear(y); // this will trigger one fetch via useEffect
  //   }
  // };

  // Only fire one warning toast per click
  const handleCheckboxChange = (orgId, acctId, groupCode) => {
    let showWarning = false;

    setTableData((prev) =>
      prev.map((row) => {
        if (row.orgId === orgId && row.acctId === acctId) {
          const targetType = groupTypes[groupCode];
          const isCurrentlyChecked = row[groupCode] === true;
          if (!isCurrentlyChecked) {
            // Check if any other pool of same type is already checked
            const otherChecked = groupCodes.some(
              (code) =>
                code !== groupCode &&
                groupTypes[code] === targetType &&
                row[code] === true
            );
            if (otherChecked) {
              showWarning = true; // Mark to show toast after state update
              return row; // Prevent checking
            }
          }
          // Toggle as normal (set this one ON/OFF)
          return {
            ...row,
            [groupCode]: !row[groupCode],
          };
        }
        return row;
      })
    );

    // Show toast outside of state setter to avoid duplicate toasts
    setTimeout(() => {
      if (showWarning) {
        toast.warn("Duplicate pool type mapping detected for this Org Account");
      }
    }, 0);
  };

  const handleSave = async () => {
    const changedRows = tableData
      .filter((row) => {
        const origRow = originalTableData.find(
          (o) => o.orgId === row.orgId && o.acctId === row.acctId
        );
        if (!origRow) return false;
        return groupCodes.some((code) => row[code] !== origRow[code]);
      })
      .map((row) => ({
        orgId: row.orgId,
        acctId: row.acctId,
        Year: selectedYear,
        ...groupCodes.reduce((acc, code) => {
          acc[code] = row[code] || false;
          return acc;
        }, {}),
      }));

    if (changedRows.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(
        `${backendUrl}/Orgnization/BulkUpSertOrgAccountPoolMapping`,
        changedRows,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setOriginalTableData([...tableData]);
      setError(null);
      toast.success("Data saved successfully");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update pool mapping";
      setError(errorMessage);
      setTableData([...originalTableData]);
      setTimeout(() => setError(null), 5000);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 font-roboto">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 text-sm font-medium">
          Loading...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-3 bg-red-50 rounded-lg font-roboto text-sm font-medium shadow-sm">
        Error: {error}
      </div>
    );
  }

  const filteredData = tableData.filter((row) => {
  const acctMatch = searchTerm
    ? row.acctId?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    : true;

  const orgMatch = orgSearchTerm
    ? row.orgId?.toString().toLowerCase().includes(orgSearchTerm.toLowerCase())
    : true;

  // When both entered, both must match
  return acctMatch && orgMatch;
});


  const displayNames = {
  HR: "HR",
  hr: "HR",
  // add others if needed
};

  return (
    <div className="p-4 sm:p-5 w-full mx-auto font-roboto bg-gray-50 rounded-xl shadow-md ml-5">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
      />
      {/* <h2 className="w-full bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
        Pool Configuration
      </h2> */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             Pool Configuration
          </h2>
          
        </div>
      <div className="flex items-center gap-4 mb-3">
        <label
          htmlFor="fiscalYear"
          className="font-medium text-gray-700 text-sm"
        >
          Fiscal Year:
        </label>
        <select
          id="fiscalYear"
          value={selectedYear}
          onChange={(e) => setFiscalYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className="flex-grow"></div>
       <div className="flex items-center gap-2 mb-2">
  {/* Org ID filter */}
  <input
    type="text"
    placeholder="Filter by Org ID"
    value={orgSearchTerm}
    onChange={(e) => setOrgSearchTerm(e.target.value)}
    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
  />

  {/* Account ID filter (existing) */}
  <input
    type="text"
    placeholder="Filter by Account ID"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
  />
</div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="ml-3 bg-[#17414d] text-white group-hover:text-gray font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
      <div
        style={{
          maxHeight: "500px",
          overflowY: "auto",
          position: "relative",
          // border: "1px solid #e5e7eb",
          // borderRadius: "0.5rem",
        }}
        className="border-line"
      >
        <table className="min-w-full table">
          <thead
            className="thead"
            // style={{
            //   position: "sticky",
            //   top: 0,
            //   zIndex: 10,
            //   boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            // }}
          >
            <tr>
              <th className="th-thead">Org ID</th>
              <th className="th-thead">Account ID</th>
              {groupCodes.map((code, index) => (
                <th key={index} className="th-thead">
                  {displayNames[code] || groupNames[code] || code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tbody">
            {filteredData.map((row) => (
              <tr
                key={`${row.orgId}-${row.acctId}`}
                // className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="tbody-td">{row.orgId}</td>
                <td className="tbody-td  whitespace-nowrap">{row.acctId}</td>
                {groupCodes.map((code, idx) => (
                  <td key={idx} className="tbody-td">
                    <input
                      type="checkbox"
                      checked={row[code] === true}
                      onChange={() =>
                        handleCheckboxChange(row.orgId, row.acctId, code)
                      }
                      className="h-3 w-3 text-blue-600  focus:ring-blue-500 focus:ring-opacity-50 tbody-td"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoolConfigurationTable;
