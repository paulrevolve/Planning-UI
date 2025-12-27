import React, { useState, useEffect, useRef} from "react";
import { useParams } from "react-router-dom";
import { Save, Plus, X, Edit2, Trash2, CheckCircle } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const AccountMapping = () => {
  const { projectId, projectType } = useParams();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    accountId: "",
    accountName: "",
    costType: "",
    accountType: "",
    budgetSheet: "",
  });

  const [editingIds, setEditingIds] = useState([]);
  const [multiEditData, setMultiEditData] = useState({});
  const [lastUpdatedIds, setLastUpdatedIds] = useState([]);

  const [filters, setFilters] = useState({
    accountId: "",
    accountName: "",
    accountType: "",
    budgetSheet: "",
    costType: "",
  });

  const geistSans = "'Geist', 'Geist Fallback', sans-serif";

   const didFetchRef = useRef(false);

  // useEffect(() => {
  //   fetchData();
  // }, [projectId, projectType]);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = `${backendUrl}/api/ChartOfAccounts`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("API not responding");

      const result = await response.json();
      const rawList = Array.isArray(result) ? result : result.data || [];
      processData(rawList);
    } catch (error) {
      console.error("Error fetching account mapping:", error);
      processData([]);
    } finally {
      setLoading(false);
    }
  };

  const processData = (list) => {
    const mappedData = list.map((item) => ({
      accountId: item.accountId || "",
      accountName: item.accountName || "",
      costType: item.costType || "",
      accountType: item.accountType || "",
      budgetSheet: item.budgetSheet || "",
    }));
    setData(mappedData);
    setFilteredData(mappedData);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    const filtered = data.filter(
      (item) =>
        (item.accountId || "").toLowerCase().startsWith(newFilters.accountId.toLowerCase()) &&
        (item.accountName || "").toLowerCase().startsWith(newFilters.accountName.toLowerCase()) &&
        (item.accountType || "").toLowerCase().startsWith(newFilters.accountType.toLowerCase()) &&
        (item.budgetSheet || "").toLowerCase().startsWith(newFilters.budgetSheet.toLowerCase()) &&
        (item.costType || "").toLowerCase().startsWith(newFilters.costType.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleApiResponse = async (response, successMsg) => {
    const contentType = response.headers.get("content-type");
    let message = "";
    try {
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        message = result.message || result.error || (response.ok ? successMsg : "Action failed");
      } else {
        message = await response.text();
      }
    } catch (e) {
      message = response.ok ? successMsg : "Failed to parse server response";
    }

    if (response.ok) {
      return { success: true, message: message || successMsg };
    } else {
      toast.error(message || "Backend error occurred");
      return { success: false };
    }
  };

  const handleSaveNewRow = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/ChartOfAccounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      });

      const res = await handleApiResponse(response, "Account created successfully");
      if (res.success) {
        toast.success(res.message);
        setIsAdding(false);
        setNewRow({ accountId: "", accountName: "", costType: "", accountType: "", budgetSheet: "" });
        fetchData();
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    }
  };

  const startEditing = (item) => {
    if (!editingIds.includes(item.accountId)) {
      setEditingIds([...editingIds, item.accountId]);
      setMultiEditData({ ...multiEditData, [item.accountId]: { ...item } });
    }
  };

  const cancelEditing = (accountId) => {
    setEditingIds(editingIds.filter((id) => id !== accountId));
    const updatedMultiData = { ...multiEditData };
    delete updatedMultiData[accountId];
    setMultiEditData(updatedMultiData);
  };

  const handleMultiInputChange = (accountId, field, value) => {
    setMultiEditData({
      ...multiEditData,
      [accountId]: { ...multiEditData[accountId], [field]: value },
    });
  };

  const handleUpdateRows = async (specificId = null) => {
    const idsToUpdate = specificId ? [specificId] : editingIds;
    if (idsToUpdate.length === 0) return;

    const loadingToast = toast.info(idsToUpdate.length > 1 ? "Updating records..." : "Updating record...", { autoClose: false });
    try {
      const promises = idsToUpdate.map((id) =>
        fetch(`${backendUrl}/api/ChartOfAccounts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...multiEditData[id], updatedAt: new Date().toISOString() }),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every((r) => r.ok);

      if (allOk) {
        toast.dismiss(loadingToast);
        toast.success(idsToUpdate.length > 1 ? "All accounts updated successfully" : "Account updated successfully");
        setLastUpdatedIds([...idsToUpdate]);
        setEditingIds(editingIds.filter(id => !idsToUpdate.includes(id)));
        const newData = { ...multiEditData };
        idsToUpdate.forEach(id => delete newData[id]);
        setMultiEditData(newData);
        fetchData();
        setTimeout(() => setLastUpdatedIds([]), 3000);
      } else {
        toast.error("Some updates failed. Please try again.");
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    }
  };

  const handleDeleteRow = async (accountId) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      const response = await fetch(`${backendUrl}/api/ChartOfAccounts/${accountId}`, {
        method: "DELETE",
      });

      const res = await handleApiResponse(response, "Account deleted successfully");
      if (res.success) {
        toast.success(res.message);
        fetchData();
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    }
  };

  return (
    <div className="flex justify-center h-screen w-full overflow-hidden text-[13px] ml-3" style={{ fontFamily: geistSans }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Chart of Accounts
          </h2>
          <div className="flex gap-2">
            {editingIds.length > 1 && (
              <button 
                onClick={() => handleUpdateRows()} 
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs cursor-pointer shadow-sm"
              >
                <CheckCircle size={14} /> Save All ({editingIds.length})
              </button>
            )}
            <button 
              onClick={() => setIsAdding(true)} 
              className="flex items-center gap-1 text-white px-3 py-1 rounded text-xs cursor-pointer shadow-sm transition-colors"
              style={{ backgroundColor: "#113d46" }}
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>

        <div className="px-4 pt-4 shrink-0">
          <div className="border border-gray-200 rounded bg-white shadow-sm overflow-hidden mb-4">
            <div className="px-3 py-1.5 border-b border-gray-200 font-semibold text-[#003366]">Maintain Account Mapping</div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
              <div className="flex items-center gap-2">
                <label className="w-24 text-gray-600">Account ID</label>
                <input name="accountId" value={filters.accountId} onChange={handleFilterChange} className="flex-1 border border-gray-300 p-1 rounded outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-gray-600">Account Type</label>
                <input name="accountType" value={filters.accountType} onChange={handleFilterChange} className="flex-1 border border-gray-300 p-1 rounded outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-gray-600">Cost Type</label>
                <input name="costType" value={filters.costType} onChange={handleFilterChange} className="flex-1 border border-gray-300 p-1 rounded outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-gray-600">Account Name</label>
                <input name="accountName" value={filters.accountName} onChange={handleFilterChange} className="flex-1 border border-gray-300 p-1 rounded outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-gray-600">Budget Sheet</label>
                <input name="budgetSheet" value={filters.budgetSheet} onChange={handleFilterChange} className="flex-1 border border-gray-300 p-1 rounded outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Unified Scrollable Table Section */}
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <div className="border border-gray-200 rounded h-full bg-white shadow-sm overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-30 bg-[#fafafa]">
                <tr className="text-[10px] uppercase text-gray-500 border-b">
                  <th className="p-2 border-r border-gray-200 font-bold w-[15%] shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">Account ID</th>
                  <th className="p-2 border-r border-gray-200 font-bold w-[25%] shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">Account Name</th>
                  <th className="p-2 border-r border-gray-200 font-bold w-[18%] shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">Cost Type</th>
                  <th className="p-2 border-r border-gray-200 font-bold w-[18%] shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">Account Type</th>
                  <th className="p-2 border-r border-gray-200 font-bold w-[18%] shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">Budget Sheet</th>
                  <th className="p-2 font-bold w-20 text-center shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">Action</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-orange-50 border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200 w-[15%]"><input className="w-full p-1 border rounded text-xs" value={newRow.accountId} onChange={(e) => setNewRow({ ...newRow, accountId: e.target.value })} /></td>
                    <td className="p-1 border-r border-gray-200 w-[25%]"><input className="w-full p-1 border rounded text-xs" value={newRow.accountName} onChange={(e) => setNewRow({ ...newRow, accountName: e.target.value })} /></td>
                    <td className="p-1 border-r border-gray-200 w-[18%]"><input className="w-full p-1 border rounded text-xs" value={newRow.costType} onChange={(e) => setNewRow({ ...newRow, costType: e.target.value })} /></td>
                    <td className="p-1 border-r border-gray-200 w-[18%]"><input className="w-full p-1 border rounded text-xs" value={newRow.accountType} onChange={(e) => setNewRow({ ...newRow, accountType: e.target.value })} /></td>
                    <td className="p-1 border-r border-gray-200 w-[18%]"><input className="w-full p-1 border rounded text-xs" value={newRow.budgetSheet} onChange={(e) => setNewRow({ ...newRow, budgetSheet: e.target.value })} /></td>
                    <td className="p-1 w-20 text-center">
                      <div className="flex gap-2 justify-center items-center">
                        <button onClick={handleSaveNewRow} className="text-green-600 cursor-pointer"><Save size={16} /></button>
                        <button onClick={() => setIsAdding(false)} className="text-red-600 cursor-pointer"><X size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredData.map((item, idx) => {
                  const isEditing = editingIds.includes(item.accountId);
                  const rowData = isEditing ? multiEditData[item.accountId] : item;
                  const isJustUpdated = lastUpdatedIds.includes(item.accountId);

                  return (
                    <tr key={idx} className={`border-b border-gray-200 transition-colors duration-500 text-xs text-gray-800 ${isEditing ? "bg-blue-50" : isJustUpdated ? "bg-green-100" : "hover:bg-gray-50"}`}>
                      <td className="p-2 border-r border-gray-200 w-[15%]">
                        {isEditing ? <input className="w-full p-1 border rounded" value={rowData.accountId} onChange={(e) => handleMultiInputChange(item.accountId, "accountId", e.target.value)} /> : item.accountId}
                      </td>
                      <td className="p-2 border-r border-gray-200 w-[25%]">
                        {isEditing ? <input className="w-full p-1 border rounded" value={rowData.accountName} onChange={(e) => handleMultiInputChange(item.accountId, "accountName", e.target.value)} /> : item.accountName}
                      </td>
                      <td className="p-2 border-r border-gray-200 w-[18%] uppercase">
                        {isEditing ? <input className="w-full p-1 border rounded" value={rowData.costType} onChange={(e) => handleMultiInputChange(item.accountId, "costType", e.target.value)} /> : item.costType}
                      </td>
                      <td className="p-2 border-r border-gray-200 w-[18%] uppercase">
                        {isEditing ? <input className="w-full p-1 border rounded" value={rowData.accountType} onChange={(e) => handleMultiInputChange(item.accountId, "accountType", e.target.value)} /> : item.accountType}
                      </td>
                      <td className="p-2 border-r border-gray-200 w-[18%] uppercase">
                        {isEditing ? <input className="w-full p-1 border rounded" value={rowData.budgetSheet} onChange={(e) => handleMultiInputChange(item.accountId, "budgetSheet", e.target.value)} /> : item.budgetSheet}
                      </td>
                      <td className="p-2 w-20 text-center">
                        <div className="flex gap-2 justify-center items-center h-full">
                          {isEditing ? (
                            <>
                              {editingIds.length === 1 && (
                                <button onClick={() => handleUpdateRows(item.accountId)} className="text-green-600 cursor-pointer flex-shrink-0"><Save size={16} /></button>
                              )}
                              <button onClick={() => cancelEditing(item.accountId)} className="text-red-500 cursor-pointer flex-shrink-0"><X size={16} /></button>
                              <button onClick={() => handleDeleteRow(item.accountId)} className="text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"><Trash2 size={16} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditing(item)} className="text-gray-400 hover:text-blue-600 cursor-pointer flex-shrink-0"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteRow(item.accountId)} className="text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMapping;