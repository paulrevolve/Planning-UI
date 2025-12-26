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
  const [isLoading, setIsLoading] = useState(false)
  const [isSelected, setIsSelected] = useState(false)

  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [columns, setColumns] = useState([
    "businessBudgetId",
    "description",
    "level",
    "isActive",
    "version",
    "versionCode",
    "startDate",
    "endDate",
    "escalationRate",
    "orgId",
    "accountGroup",
    "burdenTemplateId",
  ]);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    }
  }, [searchTerm]);

  const COLUMN_LABELS = {
    businessBudgetId: "Business Budget Id",
    description: "Description",
    level: "Level",
    isActive: "Active",
    version: "Version",
    versionCode: "Version Code",
    startDate: "Start Date",
    endDate: "End Date",
    escalationRate: "Escalation Rate",
    orgId: "Org Id",
    accountGroup: "Account Group",
    burdentemplateId: "Burden TemplateId",
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSearch = async () => {
    const term = searchTerm.trim();
    try {
      setIsLoading(true)
      if (!term) {
        const res = await axios.get(`${backendUrl}/GetAllNewBusiness`);
        setData(res.data || []);
        setSelectedBusiness(null);
      } else {
        const res = await axios.get(
          `${backendUrl}/GetAllNewBusinessById/${term}`
        );
        setData(res.data || []);
        setSelectedBusiness(null);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false)
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelect = (item) => {
    
    setSelectedBusiness((prev) =>
      prev && prev.businessBudgetId === item.businessBudgetId ? null : item
    );
    if(selectedBusiness){
      setIsSelected(true)
    }else{
      setIsSelected(false)
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axios.delete(
        `${backendUrl}/DeleteNewBusiness/${selectedBusiness.businessBudgetId}`
      );
      if (res.status === 200 || res.status === 204) {
      toast.success("Business Deleted Successfully!")
      try {
        const refreshed = await axios.get(`${backendUrl}/GetAllNewBusiness`);
        setData(refreshed.data || []);
        setSelectedBusiness(null);
      } catch (error) {
        console.log(error)
      }
    }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async () => {
    setEditNewBusinessPopup(true);
  };

  const handleNewBusinessSave = async (savedData) => {
    const newBusinessId = savedData.businessBudgetId;
    console.log(savedData)
    if (!newBusinessId) {
      toast.error("New Business saved, but project id is missing.");
      return;
    }
    handleSearch()
    handleSelect(savedData);
    setSearchTerm(savedData.businessBudgetId);
    setShowNewBusinessPopup(false);
  };

  return (
    <div className="p-2 sm:p-4 space-y-6 text-sm sm:text-base text-gray-800 font-inter ">
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
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#17414d] text-white group-hover:text-gray  px-3 py-1 rounded cursor-pointer text-xs sm:text-sm font-normal transition w-full sm:w-auto"
          >
            Search
          </button>
        </div>
      </div>

      <div
        key={searchTerm}
        className="space-y-4 sm:p-4 border-overall  p-2  bg-white mb-8"
      >
        <div className="flex items-center mb-2 gap-1">
          <button
            onClick={() => setShowNewBusinessPopup(true)}
            className="btn1 btn-blue disabled:bg-gray-300
  disabled:text-gray-500
  disabled:cursor-not-allowed disabled:border-0"
            title="New Business"
            disabled={editNewBusinessPopup}
          >
            New Business
          </button>

          <div
            className={`flex gap-1 items-center ${
              selectedBusiness ? "block" : "hidden"
            }`}
          >
            <button
              className="btn1 px-2 py-1.5 btn-blue disabled:bg-gray-300
  disabled:text-gray-500
  disabled:cursor-not-allowed disabled:border-0"
              title="Edit"
              onClick={handleEdit}
              disabled={showNewBusinessPopup}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn1 px-2 py-1.5 btn-red disabled:bg-gray-300
  disabled:text-gray-500
  disabled:cursor-not-allowed disabled:border-0"
              title="Delete"
              disabled={editNewBusinessPopup || showNewBusinessPopup}
            >
              Delete
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl border border-gray-200 overflow-hidden relative ${
            showNewBusinessPopup ? "" : ""
          }`}
        >
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
            <table className="min-w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-xs font-bold text-gray-600 capitalize tracking-widern whitespace-nowrap text-center"
                    >
                      {COLUMN_LABELS[col] || col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex items-center justify-center py-4">
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
                      className={`cursor-pointer hover:bg-blue-50 ${selectedBusiness && selectedBusiness.businessBudgetId === item.businessBudgetId ? "bg-blue-200" : "bg-white"}`}
                      onClick={() => handleSelect(item)}
                    >
                      {columns.map((col, idx) => (
                        <td
                          key={idx}
                          className={`px-4 py-2 text-xs text-gray-600 capitalize tracking-widern whitespace-nowrap text-center ${col === "description" ? "text-left" : ""}`}
                        >
                          {col === "startDate" || col === "endDate"
                            ? item[col].split("T")[0]
                            : col === "isActive"
                              ? item[col]
                                ? "true"
                                : "false"
                              : item[col]}
                        </td>
                      ))}
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
  