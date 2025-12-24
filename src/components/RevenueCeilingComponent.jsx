import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const RevenueCeilingComponent = ({ selectedPlan, revenueAccount }) => {
  const [periods, setPeriods] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [acctId, setAcctId] = useState("");
  const [overrideAdjustments, setOverrideAdjustments] = useState(false);
  const [useFixedRevenue, setUseFixedRevenue] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(false);

  const geistSans = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-CA");
    } catch (e) {
      return "Invalid Date";
    }
  };

  const fetchRevenueData = async () => {
    if (!selectedPlan?.projId || !selectedPlan?.version || !selectedPlan?.plType) {
      setPeriods([]);
      return;
    }
    setLoading(true);
    try {
      const { projId, version, plType } = selectedPlan;
      const url = `${backendUrl}/ProjRevWrkPd/filter?projId=${projId}&versionNo=${version}&bgtType=${plType}`;
      const response = await axios.get(url);
      const newData = Array.isArray(response.data) ? response.data : [];

      setPeriods((prevPeriods) => {
        const updatedPeriods = prevPeriods.map((prevPeriod) => {
          const updatedPeriod = newData.find((newPeriod) => newPeriod.id === prevPeriod.id);
          return updatedPeriod || prevPeriod;
        });
        const newPeriodIds = new Set(updatedPeriods.map((p) => p.id));
        const additionalPeriods = newData.filter((newPeriod) => !newPeriodIds.has(newPeriod.id));
        return [...updatedPeriods, ...additionalPeriods];
      });
    } catch (error) {
      toast.error("Failed to fetch revenue data.");
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    setOrgId(selectedPlan?.orgId || "");
    setAcctId(selectedPlan?.revenueAccount || selectedPlan?.acctId || setupData?.revAcctId || "");
  }, [selectedPlan, revenueAccount, setupData]);

  const handleInputChange = (index, field, value) => {
    const updatedPeriods = periods.map((period, i) => {
      if (i === index) {
        const updatedPeriod = { ...period, [field]: value };
        if (field === "endDate" && period.id <= 0) {
          try {
            const date = new Date(value);
            if (!isNaN(date)) {
              updatedPeriod.fiscalYear = date.getFullYear().toString();
              updatedPeriod.period = (date.getMonth() + 1).toString();
            }
          } catch (e) {}
        }
        return updatedPeriod;
      }
      return period;
    });
    setPeriods(updatedPeriods);
  };

  useEffect(() => {
    const fetchSetupData = async () => {
      if (!selectedPlan?.projId || !selectedPlan?.version || !selectedPlan?.plType) return;
      try {
        const url = `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`;
        const response = await axios.get(url);
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        if (data) {
          setUseFixedRevenue(!!data.overrideRevAmtFl);
          setOverrideAdjustments(!!data.useBillBurdenRates);
          setSetupData(data);
          setAcctId(selectedPlan?.revenueAccount || selectedPlan?.acctId || data.revAcctId || "");
        }
      } catch (error) {}
    };
    fetchSetupData();
  }, [selectedPlan]);

  const handleRevAdjBlur = async (index) => {
    const period = periods[index];
    if (period.id <= 0) return;

    const payload = {
      ...period,
      id: period.id,
      useFixedRevenue: useFixedRevenue,
      overrideSystemAdjustment: overrideAdjustments,
      revAmt: parseFloat(period.revAmt) || 0,
      revAdj: parseFloat((period.revAdj || "").toString().replace(/,/g, "")) || 0,
      fiscalYear: period.fiscalYear || "",
    };

    try {
      await axios.post(`${backendUrl}/ProjRevWrkPd/upsert`, payload);
      toast.success("Revenue adjustment updated successfully!");
      fetchRevenueData();
    } catch (error) {
      toast.error("Failed to update revenue adjustment.");
    }
  };

  const handleSetupCheckboxChange = async (field, value) => {
    if (!setupData) return;
    const updatedSetup = { ...setupData, [field]: value };
    setSetupData(updatedSetup);

    if (field === "overrideRevAmtFl") setUseFixedRevenue(value);
    if (field === "useBillBurdenRates") setOverrideAdjustments(value);

    try {
      await axios.post(`${backendUrl}/ProjBgtRevSetup/upsert`, updatedSetup);
      toast.success("Revenue setup updated successfully!");
    } catch (error) {
      toast.error("Failed to update revenue setup.");
      setSetupData(setupData);
      if (field === "overrideRevAmtFl") setUseFixedRevenue(setupData.overrideRevAmtFl);
      if (field === "useBillBurdenRates") setOverrideAdjustments(setupData.useBillBurdenRates);
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-gray rounded shadow min-h-[150px] scroll-mt-16" style={geistSans}>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-normal">Org ID</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1 bg-gray-200"
              style={geistSans}
              value={orgId}
              readOnly
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-normal">Acct ID</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1 bg-gray-200"
              style={geistSans}
              value={acctId}
              readOnly
            />
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-sm font-normal mr-2">Use Fixed Revenue Amount as Total Revenue</label>
            <input
              type="checkbox"
              className="text-sm font-normal"
              checked={useFixedRevenue}
              disabled={!setupData}
              onChange={(e) => handleSetupCheckboxChange("overrideRevAmtFl", e.target.checked)}
            />
          </div>
          <div>
            <label className="text-sm font-normal mr-2">Override Revenue Adjustments from Accounting System</label>
            <input
              type="checkbox"
              className="text-sm font-normal"
              checked={overrideAdjustments}
              disabled={!setupData}
              onChange={(e) => handleSetupCheckboxChange("useBillBurdenRates", e.target.checked)}
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-x-auto overflow-y-auto border-line">
          <table className="w-full table">
            <thead className="thead sticky top-0 z-10">
              <tr>
                <th className="th-thead" style={geistSans}>Fiscal Year</th>
                <th className="th-thead" style={geistSans}>Period</th>
                <th className="th-thead min-w-[150px]" style={geistSans}>End Date</th>
                <th className="th-thead min-w-[100px]" style={geistSans}>Fixed Revenue Amount</th>
                <th className="th-thead" style={geistSans}>Revenue Adjustment</th>
                <th className="th-thead" style={geistSans}>Description</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-4" style={geistSans}>Loading...</td>
                </tr>
              ) : periods.length > 0 ? (
                periods.map((period, index) => {
                  const isNewRow = period.id <= 0;
                  const isRevAdjDisabled = !overrideAdjustments;

                  return (
                    <tr key={period.id}>
                      <td className="tbody-td">
                        {isNewRow ? (
                          <input
                            type="text"
                            className="w-full p-1 border rounded text-sm font-normal"
                            style={geistSans}
                            value={period.fiscalYear || ""}
                            onChange={(e) => handleInputChange(index, "fiscalYear", e.target.value)}
                          />
                        ) : (
                          <span className="text-sm font-normal" style={geistSans}>{period.fy_Cd}</span>
                        )}
                      </td>
                      <td className="tbody-td">
                        <input
                          type="text"
                          className="w-full p-1 text-sm font-normal text-center"
                          style={geistSans}
                          value={period.period || ""}
                          onChange={(e) => handleInputChange(index, "period", e.target.value)}
                          disabled={!isNewRow}
                        />
                      </td>
                      <td className="tbody-td min-w-[150px]">
                        {isNewRow ? (
                          <input
                            type="date"
                            className="w-full p-1 border rounded text-sm font-normal"
                            style={geistSans}
                            value={period.endDate ? period.endDate.split("T")[0] : ""}
                            onChange={(e) => handleInputChange(index, "endDate", e.target.value)}
                          />
                        ) : (
                          <span className="text-sm font-normal" style={geistSans}>{formatDate(period.endDate)}</span>
                        )}
                      </td>
                      <td className="tbody-td min-w-[100px]">
                        <input
                          type="number"
                          className="w-full p-1 border rounded text-sm font-normal bg-gray-200"
                          style={geistSans}
                          value={period.revAmt ?? 0}
                          disabled={true}
                        />
                      </td>
                      <td className="tbody-td">
                        <input
                          type="text"
                          className={`w-full p-1 border rounded text-sm font-normal ${isRevAdjDisabled ? "bg-gray-200" : "bg-white"}`}
                          style={geistSans}
                          value={period.revAdj ?? ""}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/,/g, ""); 
                            if (raw === "") { handleInputChange(index, "revAdj", ""); return; }
                            if (!/^\d*\.?\d*$/.test(raw)) return;
                            const [intPart, decimalPart] = raw.split(".");
                            const formattedInt = intPart ? Number(intPart).toLocaleString("en-US") : "";
                            const formatted = decimalPart !== undefined ? `${formattedInt}.${decimalPart}` : formattedInt;
                            handleInputChange(index, "revAdj", formatted);
                          }}
                          onBlur={() => !isNewRow && handleRevAdjBlur(index)}
                          disabled={isRevAdjDisabled}
                        />
                      </td>
                      <td className="tbody-td">
                        <input
                          type="text"
                          className="w-full p-1 text-sm font-normal"
                          style={geistSans}
                          value={period.revDesc || ""}
                          onChange={(e) => handleInputChange(index, "revDesc", e.target.value)}
                          disabled={!isEditMode && !isNewRow}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-4" style={geistSans}>No revenue ceiling data found for this plan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueCeilingComponent;