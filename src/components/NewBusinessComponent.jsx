import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendUrl } from "./config";
import NewBusiness from "./NewBusiness";
import { toast } from "react-toastify";

const NewBusinessComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewBusinessPopup, setShowNewBusinessPopup] = useState(false);
  const [editNewBusinessPopup, setEditNewBusinessPopup] = useState(false);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const [columns] = useState([
    "businessBudgetId",
    "description",
    "orgId",
    "accountGroup",
    "level",
    "isActive",
    "version",
    "versionCode",
    "startDate",
    "endDate",
    "escalationRate",
    "burdenTemplateId",
    "status",
    "trf_ProjId",
  ]);

  const isAllSelected = data.length > 0 && selectedRows.size === data.length;

  // ⭐ ADDED
  const selectedCount = selectedRows.size;
  const showEdit = selectedCount === 1;
  const showDelete = selectedCount >= 1;

  useEffect(() => {
    if (searchTerm) handleSearch();
  }, [searchTerm]);

  const COLUMN_LABELS = {
    businessBudgetId: "Id",
    description: "Description",
    level: "Level",
    isActive: "Active",
    version: "Ver",
    versionCode: "Version Code",
    startDate: "Start Date",
    endDate: "End Date",
    escalationRate: "Escalation Rate",
    orgId: "Org Id",
    accountGroup: "Account Group",
    burdenTemplateId: "Template",
    status: "Status",
    trf_ProjId: "Transferred Project",
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSearch = async () => {
    const term = searchTerm.trim();
    try {
      setIsLoading(true);
      const res = term
        ? await axios.get(`${backendUrl}/GetAllNewBusinessById/${term}`)
        : await axios.get(`${backendUrl}/GetAllNewBusiness`);

      setData(res.data || []);
      setSelectedRows(new Set());
      setSelectedBusiness(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };


  const toggleRow = (item) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(item.businessBudgetId)) {
        newSet.delete(item.businessBudgetId);
      } else {
        newSet.add(item.businessBudgetId);
      }

      if (newSet.size === 1) {
        const id = [...newSet][0];
        setSelectedBusiness(
          data.find((d) => d.businessBudgetId === id) || null
        );
      } else {
        setSelectedBusiness(null);
      }

      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows(new Set());
      setSelectedBusiness(null);
    } else {
      const allIds = new Set(data.map((d) => d.businessBudgetId));
      setSelectedRows(allIds);
      setSelectedBusiness(null);
    }
  };


  const handleDelete = async () => {
    try {
      await axios.delete(
        `${backendUrl}/DeleteNewBusiness/${selectedBusiness.businessBudgetId}`
      );
      toast.success("Business Deleted Successfully!");
      handleSearch();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (item) => {
    setSelectedBusiness(item);
    setEditNewBusinessPopup(true);
  };


  const handleNewBusinessSave = async (savedData) => {
    handleSearch();
    setShowNewBusinessPopup(false);
    setEditNewBusinessPopup(false);
  };

  return (
    <div className="p-2 sm:p-4 space-y-6 text-sm sm:text-base text-gray-800 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative w-full sm:w-auto">
          <label className="font-semibold text-xs sm:text-sm">
            Busniess ID:
          </label>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#17414d] text-white px-3 py-1 rounded cursor-pointer text-xs sm:text-sm"
          >
            Search
          </button>
        </div>
      </div>

      <div className="space-y-4 sm:p-4 border-overall p-2 bg-white mb-8">
        <div className="flex items-center mb-2 gap-1 w-full flex-nowrap">
          <button
            onClick={() => setShowNewBusinessPopup(true)}
            className="btn1 btn-blue shrink-0"
            disabled={editNewBusinessPopup}
          >
            New Business
          </button>

          <div
            className={`flex gap-1 w-full items-center ${
              showDelete ? "inline" : "hidden"
            }`}
          >
            {/* <button
              className="btn1 px-2 py-1.5 btn-blue"
              title="Edit"
              onClick={handleEdit}
              disabled={!showEdit || showNewBusinessPopup}
            >
              Edit
            </button> */}
            <button
              onClick={handleDelete}
              className="btn1 px-4 py-1.5 btn-red"
              title="Delete"
              disabled={editNewBusinessPopup || showNewBusinessPopup}
            >
              Delete {selectedRows.size}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 overflow-hidden relative">
          {showNewBusinessPopup && (
            <div className="absolute inset-0 z-40">
              <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-white w-full overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    <NewBusiness
                      mode={"business"}
                      onClose={() => setShowNewBusinessPopup(false)}
                      selectedBusiness={null}
                      onSaveSuccess={handleNewBusinessSave}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {editNewBusinessPopup && (
            <div className="absolute inset-0 z-40">
              <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-white w-full overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4">
                    <NewBusiness
                      mode={"business"}
                      onClose={() => setEditNewBusinessPopup(false)}
                      selectedBusiness={selectedBusiness}
                      onSaveSuccess={handleNewBusinessSave}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div
            className={`overflow-x-auto max-h-[70vh] min-h-[70vh] ${
              showNewBusinessPopup ? "blur-sm pointer-events-none" : ""
            }`}
          >
            <table className="min-w-full table-auto divide-gray-200">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="py-2 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-xs font-bold text-gray-600 text-center"
                    >
                      {COLUMN_LABELS[col] || col}
                    </th>
                  ))}
                  <th className="px-4 py-2 pr-2 text-xs font-bold text-gray-600 text-center">
                    Edit
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">
                          Loading project plans...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 && searchTerm.trim() === "" ? (
                  <tr>
                    <td colSpan={columns.length + 1}>
                      <div className="p-8 text-center text-gray-500 text-lg">
                        Search and select a valid Project to view details
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.businessBudgetId}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedRows.has(item.businessBudgetId)
                          ? "bg-blue-200"
                          : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.businessBudgetId)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRow(item);
                          }}
                        />
                      </td>

                      {columns.map((col, idx) => (
                        <td
                          key={idx}
                          // className="px-4 py-2 text-xs text-gray-600 text-center"
                                                   className={`px-4 py-2 text-xs text-gray-600 text-center ${
  col === "startDate" ||col === "endDate" || col === "trf_ProjId  "
    ? "whitespace-nowrap"
    : ""
}`}
                        >
                          {col === "startDate" || col === "endDate"
                            ? item[col]?.split("T")[0]
                            : col === "isActive"
                              ? item[col]
                                ? "true"
                                : "false"
                              : item[col]}
                        </td>
                      ))}
                      <td>
                        <button
                          className="btn1 px-2 py-1.5 btn-blue"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          disabled={showNewBusinessPopup}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBusinessComponent;
