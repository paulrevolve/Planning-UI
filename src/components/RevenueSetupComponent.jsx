// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { backendUrl } from "./config";

// const RevenueSetupComponent = ({ selectedPlan, revenueAccount }) => {
//   const [atRiskValue, setAtRiskValue] = useState("");
//   const [revenueType, setRevenueType] = useState("");
//   const [revenueAccountState, setRevenueAccountState] = useState("");
//   const [labFeeRt, setLabFeeRt] = useState("");
//   const [nonLabFeeRt, setNonLabFeeRt] = useState("");
//   const [revenueFormula, setRevenueFormula] = useState("");
//   const [formulaOptions, setFormulaOptions] = useState([]);
//   const [labCostFl, setLabCostFl] = useState(false);
//   const [labBurdFl, setLabBurdFl] = useState(false);
//   const [labFeeCostFl, setLabFeeCostFl] = useState(false);
//   const [labFeeHrsFl, setLabFeeHrsFl] = useState(false);
//   const [labTmFl, setLabTmFl] = useState(false);
//   const [nonLabCostFl, setNonLabCostFl] = useState(false);
//   const [nonLabBurdFl, setNonLabBurdFl] = useState(false);
//   const [nonLabFeeCostFl, setNonLabFeeCostFl] = useState(false);
//   const [nonLabFeeHrsFl, setNonLabFeeHrsFl] = useState(false);
//   const [nonLabTmFl, setNonLabTmFl] = useState(false);
//   const [overrideFundingCeilingFl, setOverrideFundingCeilingFl] =
//     useState(false);
//   const [overrideSettingsFl, setOverrideSettingsFl] = useState(false);
//   const [overrideRevAdjustmentsFl, setOverrideRevAdjustmentsFl] =
//     useState(false);
//   const [useFixedRevenueFl, setUseFixedRevenueFl] = useState(false);
//   const [setupId, setSetupId] = useState(0);
//   const [isSaving, setIsSaving] = useState(false);

//   // Styling variable for the Geist font family
//   const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-CA");
//     } catch (e) {
//       return "Invalid Date";
//     }
//   };

//   const handleFeeRateChange = (value, setter) => {
//     if (value === "") {
//       setter("");
//       return;
//     }

//     if (/[^\d.]/.test(value)) {
//       return;
//     }

//     if ((value.match(/\./g) || []).length > 1) {
//       return;
//     }

//     if (/^0\d/.test(value)) {
//       return;
//     }

//     const numValue = parseFloat(value);

//     if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
//       setter(value);
//     } else if (!isNaN(numValue) && numValue > 100) {
//       toast.warning("Fee Rate % cannot exceed 100%", {
//         toastId: "fee-rate-limit-warning",
//         autoClose: 3000,
//       });
//     }
//   };

//   useEffect(() => {
//     setRevenueFormula("");
//     setRevenueType("");
//     setSetupId(0);
//     setRevenueAccountState(revenueAccount || "");

//     axios
//       .get(`${backendUrl}/RevFormula`)
//       .then((response) => {
//         setFormulaOptions(response.data);
//       })
//       .catch((error) => {});

//     if (selectedPlan?.projId && selectedPlan?.version && selectedPlan?.plType) {
//       axios
//         .get(
//           `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`
//         )
//         .then((response) => {
//           const data = response.data;
//           setSetupId(data.id || 0);
//           setRevenueFormula(data.revType || "");
//           setRevenueType(data.revType || "");
//           setAtRiskValue(Number(data.atRiskAmt).toLocaleString());
//           setRevenueAccountState(data.revAcctId || revenueAccount || "");
//           setLabFeeRt(data.labFeeRt.toString());
//           setNonLabFeeRt(data.nonLabFeeRt.toString());
//           setLabCostFl(data.labCostFl || false);
//           setLabBurdFl(data.labBurdFl || false);
//           setLabFeeCostFl(data.labFeeCostFl || false);
//           setLabFeeHrsFl(data.labFeeHrsFl || false);
//           setLabTmFl(data.labTmFl || false);
//           setNonLabCostFl(data.labCostFl || false);
//           setNonLabBurdFl(data.labBurdFl || false);
//           setNonLabFeeCostFl(data.labFeeCostFl || false);
//           setNonLabFeeHrsFl(data.labFeeHrsFl || false);
//           setNonLabTmFl(data.nonLabTmFl || false);
//           setOverrideFundingCeilingFl(data.overrideFundingCeilingFl || false);
//           setOverrideSettingsFl(data.overrideRevSettingFl || false);
//           setOverrideRevAdjustmentsFl(data.useBillBurdenRates || false);
//           setUseFixedRevenueFl(data.overrideRevAmtFl || false);
//         })
//         .catch((error) => {});
//     }
//   }, [selectedPlan, revenueAccount, backendUrl]);

//   const handleSave = () => {
//     if (!revenueFormula || revenueFormula === "") {
//       toast.error("Please select revenue formula", {
//         toastId: "revenue-setup-save-select",
//         autoClose: 3000,
//       });
//       return;
//     }

//     const payload = {
//       id: setupId,
//       projId: selectedPlan?.projId || "",
//       revType: revenueFormula,
//       revAcctId: revenueAccountState,
//       dfltFeeRt: parseFloat(labFeeRt) || 0,
//       labCostFl,
//       labBurdFl,
//       labFeeCostFl,
//       labFeeHrsFl,
//       labFeeRt: parseFloat(labFeeRt) || 0,
//       labTmFl,
//       nonLabCostFl,
//       nonLabBurdFl,
//       nonLabFeeCostFl,
//       nonLabFeeHrsFl,
//       nonLabFeeRt: parseFloat(nonLabFeeRt) || 0,
//       nonLabTmFl,
//       useBillBurdenRates: overrideRevAdjustmentsFl,
//       overrideFundingCeilingFl,
//       overrideRevAmtFl: useFixedRevenueFl,
//       overrideRevAdjFl: true,
//       overrideRevSettingFl: overrideSettingsFl,
//       rowVersion: 0,
//       modifiedBy: "user",
//       timeStamp: new Date().toISOString(),
//       companyId: "company",
//       atRiskAmt: parseFloat(atRiskValue.replace(/,/g, "")) || 0,
//       versionNo: selectedPlan?.version || 0,
//       bgtType: selectedPlan?.plType || "",
//     };

//     setIsSaving(true);
//     toast.info("Saving revenue setup...", {
//       toastId: "revenue-setup-saving",
//       autoClose: false,
//     });

//     axios
//       .post(`${backendUrl}/ProjBgtRevSetup/upsert`, payload)
//       .then((response) => {
//         toast.dismiss("revenue-setup-saving");
//         toast.success("Data saved successfully!", {
//           toastId: "revenue-setup-save-success",
//           autoClose: 3000,
//         });
//       })
//       .catch((error) => {
//         toast.dismiss("revenue-setup-saving");
//         toast.error(
//           "Failed to save data: " +
//             (error.response?.data?.message || error.message),
//           {
//             toastId: "revenue-setup-save-error",
//             autoClose: 3000,
//           }
//         );
//       })
//       .finally(() => {
//         setIsSaving(false);
//       });
//   };

//   return (
//     <div 
//       className="p-2 sm:p-4 bg-gray rounded shadow min-h-[150px] scroll-mt-16 font-sans"
//       style={geistSansStyle}
//     >
//       <div className="flex flex-col space-y-4">
//         <div>
//           <label className="text-sm font-normal">Revenue Formula</label>
//           <select
//             className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1"
//             value={revenueFormula}
//             onChange={(e) => {
//               setRevenueFormula(e.target.value);
//               setRevenueType(e.target.value);
//             }}
//             style={geistSansStyle}
//           >
//             <option value="">---------Select----------</option>
//             {formulaOptions.map((option) => (
//               <option key={option.formulaCd} value={option.formulaCd}>
//                 {option.formulaDesc}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="text-sm font-normal mr-2">
//             Override Funding Ceiling
//           </label>
//           <input
//             type="checkbox"
//             className="text-sm font-normal"
//             checked={overrideFundingCeilingFl}
//             onChange={(e) => setOverrideFundingCeilingFl(e.target.checked)}
//           />
//         </div>
//         <div>
//           <label className="text-sm font-normal mr-2">Override Settings</label>
//           <input
//             type="checkbox"
//             className="text-sm font-normal"
//             checked={overrideSettingsFl}
//             onChange={(e) => setOverrideSettingsFl(e.target.checked)}
//           />
//         </div>
//         <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
//           <div className="flex-1">
//             <label className="text-sm font-normal mr-2">At Risk Value</label>
//             <input
//               type="text"
//               className={`border border-gray-300 rounded px-2 py-1 w-full sm:w-24 text-sm font-normal ${
//                 !overrideFundingCeilingFl
//                   ? "bg-gray-100 cursor-not-allowed"
//                   : ""
//               }`}
//               value={atRiskValue}
//               style={geistSansStyle}
//               onChange={(e) => {
//                 const rawDigits = e.target.value.replace(/\D/g, "");
//                 if (rawDigits === "") {
//                   setAtRiskValue("");
//                   return;
//                 }
//                 const cents = parseInt(rawDigits, 10);
//                 const dollars = cents / 100;
//                 const formatted = dollars.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 });
//                 setAtRiskValue(formatted);
//               }}
//               disabled={!overrideFundingCeilingFl}
//             />
//           </div>

//           <div className="flex-1">
//             <label className="text-sm font-normal mr-2">Revenue Account:</label>
//             <span className="text-sm font-normal">{revenueAccountState}</span>
//           </div>
//         </div>
//         <div className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
//           <table className="w-full table sm:w-auto">
//             <tbody className="tbody">
//               <tr>
//                 <td className="thead text-center"></td>
//                 <td className="thead text-center" style={geistSansStyle}>Rev on Cost</td>
//                 <td className="thead text-center" style={geistSansStyle}>Rev on Burden</td>
//                 <td className="thead text-center" style={geistSansStyle}>Fee on Cost/Burden</td>
//                 <td className="thead text-center" style={geistSansStyle}>Fee on Hours</td>
//                 <td className="thead text-center" style={geistSansStyle}>Fee Rate %</td>
//                 <td className="thead text-center" style={geistSansStyle}>Use T&M Rates</td>
//               </tr>
//               <tr>
//                 <td className="thead text-center" style={geistSansStyle}>Labor</td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={labCostFl}
//                     onChange={(e) => setLabCostFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={labBurdFl}
//                     onChange={(e) => setLabBurdFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={labFeeCostFl}
//                     onChange={(e) => setLabFeeCostFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={labFeeHrsFl}
//                     onChange={(e) => setLabFeeHrsFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="string"
//                     step="any"
//                     min="0"
//                     max="100"
//                     className="w-full p-1 border rounded text-sm font-normal"
//                     style={{ ...geistSansStyle, appearance: "none" }}
//                     value={labFeeRt}
//                     onChange={(e) =>
//                       handleFeeRateChange(e.target.value, setLabFeeRt)
//                     }
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={labTmFl}
//                     onChange={(e) => setLabTmFl(e.target.checked)}
//                   />
//                 </td>
//               </tr>
//               <tr>
//                 <td className="thead text-center" style={geistSansStyle}>Non-Labor</td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={nonLabCostFl}
//                     onChange={(e) => setNonLabCostFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={nonLabBurdFl}
//                     onChange={(e) => setNonLabBurdFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={nonLabFeeCostFl}
//                     onChange={(e) => setNonLabFeeCostFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={nonLabFeeHrsFl}
//                     onChange={(e) => setNonLabFeeHrsFl(e.target.checked)}
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="string"
//                     step="any"
//                     min="0"
//                     max="100"
//                     className="w-full p-1 border rounded text-sm font-normal"
//                     style={{ ...geistSansStyle, appearance: "none" }}
//                     value={nonLabFeeRt}
//                     onChange={(e) =>
//                       handleFeeRateChange(e.target.value, setNonLabFeeRt)
//                     }
//                   />
//                 </td>
//                 <td className="tbody-td">
//                   <input
//                     type="checkbox"
//                     className="text-sm font-normal"
//                     checked={nonLabTmFl}
//                     onChange={(e) => setNonLabTmFl(e.target.checked)}
//                   />
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//         <div className="flex justify-end w-full">
//           <button
//             className="rounded-full bg-sky-600 px-4 py-1.5 font-medium text-white cursor-pointer disabled:opacity-40"
//             style={geistSansStyle}
//             onClick={handleSave}
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RevenueSetupComponent;


// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { backendUrl } from "./config";

// const RevenueSetupComponent = ({ selectedPlan, revenueAccount }) => {
//   const [atRiskValue, setAtRiskValue] = useState("");
//   const [revenueType, setRevenueType] = useState("");
//   const [revenueAccountState, setRevenueAccountState] = useState("");
//   const [labFeeRt, setLabFeeRt] = useState("");
//   const [nonLabFeeRt, setNonLabFeeRt] = useState("");
//   const [revenueFormula, setRevenueFormula] = useState("");
//   const [formulaOptions, setFormulaOptions] = useState([]);
//   const [labCostFl, setLabCostFl] = useState(false);
//   const [labBurdFl, setLabBurdFl] = useState(false);
//   const [labFeeCostFl, setLabFeeCostFl] = useState(false);
//   const [labFeeHrsFl, setLabFeeHrsFl] = useState(false);
//   const [labTmFl, setLabTmFl] = useState(false);
//   const [nonLabCostFl, setNonLabCostFl] = useState(false);
//   const [nonLabBurdFl, setNonLabBurdFl] = useState(false);
//   const [nonLabFeeCostFl, setNonLabFeeCostFl] = useState(false);
//   const [nonLabFeeHrsFl, setNonLabFeeHrsFl] = useState(false);
//   const [nonLabTmFl, setNonLabTmFl] = useState(false);
//   const [overrideFundingCeilingFl, setOverrideFundingCeilingFl] =
//     useState(false);
//   const [overrideSettingsFl, setOverrideSettingsFl] = useState(false);
//   const [overrideRevAdjustmentsFl, setOverrideRevAdjustmentsFl] =
//     useState(false);
//   const [useFixedRevenueFl, setUseFixedRevenueFl] = useState(false);
//   const [setupId, setSetupId] = useState(0);
//   const [isSaving, setIsSaving] = useState(false);

//   // Styling variable for the Geist font family
//   const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

//   const handleFeeRateChange = (value, setter) => {
//     if (value === "") {
//       setter("");
//       return;
//     }
//     if (/[^\d.]/.test(value)) return;
//     if ((value.match(/\./g) || []).length > 1) return;
//     if (/^0\d/.test(value)) return;

//     const numValue = parseFloat(value);
//     if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
//       setter(value);
//     } else if (!isNaN(numValue) && numValue > 100) {
//       toast.warning("Fee Rate % cannot exceed 100%", {
//         toastId: "fee-rate-limit-warning",
//         autoClose: 3000,
//       });
//     }
//   };

//   useEffect(() => {
//     setRevenueFormula("");
//     setRevenueType("");
//     setSetupId(0);
//     setRevenueAccountState(revenueAccount || "");

//     axios
//       .get(`${backendUrl}/RevFormula`)
//       .then((response) => {
//         setFormulaOptions(response.data);
//       })
//       .catch((error) => {});

//     if (selectedPlan?.projId && selectedPlan?.version && selectedPlan?.plType) {
//       axios
//         .get(
//           `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`
//         )
//         .then((response) => {
//           const data = response.data;
//           setSetupId(data.id || 0);
//           setRevenueFormula(data.revType || "");
//           setRevenueType(data.revType || "");
//           setAtRiskValue(Number(data.atRiskAmt).toLocaleString());
//           setRevenueAccountState(data.revAcctId || revenueAccount || "");
//           setLabFeeRt(data.labFeeRt.toString());
//           setNonLabFeeRt(data.nonLabFeeRt.toString());
//           setLabCostFl(data.labCostFl || false);
//           setLabBurdFl(data.labBurdFl || false);
//           setLabFeeCostFl(data.labFeeCostFl || false);
//           setLabFeeHrsFl(data.labFeeHrsFl || false);
//           setLabTmFl(data.labTmFl || false);
//           setNonLabCostFl(data.labCostFl || false);
//           setNonLabBurdFl(data.labBurdFl || false);
//           setNonLabFeeCostFl(data.labFeeCostFl || false);
//           setNonLabFeeHrsFl(data.labFeeHrsFl || false);
//           setNonLabTmFl(data.nonLabTmFl || false);
//           setOverrideFundingCeilingFl(data.overrideFundingCeilingFl || false);
//           setOverrideSettingsFl(data.overrideRevSettingFl || false);
//           setOverrideRevAdjustmentsFl(data.useBillBurdenRates || false);
//           setUseFixedRevenueFl(data.overrideRevAmtFl || false);
//         })
//         .catch((error) => {});
//     }
//   }, [selectedPlan, revenueAccount, backendUrl]);

//   const handleSave = () => {
//     if (!revenueFormula || revenueFormula === "") {
//       toast.error("Please select revenue formula", {
//         toastId: "revenue-setup-save-select",
//         autoClose: 3000,
//       });
//       return;
//     }

//     const payload = {
//       id: setupId,
//       projId: selectedPlan?.projId || "",
//       revType: revenueFormula,
//       revAcctId: revenueAccountState,
//       dfltFeeRt: parseFloat(labFeeRt) || 0,
//       labCostFl,
//       labBurdFl,
//       labFeeCostFl,
//       labFeeHrsFl,
//       labFeeRt: parseFloat(labFeeRt) || 0,
//       labTmFl,
//       nonLabCostFl,
//       nonLabBurdFl,
//       nonLabFeeCostFl,
//       nonLabFeeHrsFl,
//       nonLabFeeRt: parseFloat(nonLabFeeRt) || 0,
//       nonLabTmFl,
//       useBillBurdenRates: overrideRevAdjustmentsFl,
//       overrideFundingCeilingFl,
//       overrideRevAmtFl: useFixedRevenueFl,
//       overrideRevAdjFl: true,
//       overrideRevSettingFl: overrideSettingsFl,
//       rowVersion: 0,
//       modifiedBy: "user",
//       timeStamp: new Date().toISOString(),
//       companyId: "company",
//       atRiskAmt: parseFloat(atRiskValue.replace(/,/g, "")) || 0,
//       versionNo: selectedPlan?.version || 0,
//       bgtType: selectedPlan?.plType || "",
//     };

//     setIsSaving(true);
//     toast.info("Saving revenue setup...", {
//       toastId: "revenue-setup-saving",
//       autoClose: false,
//     });

//     axios
//       .post(`${backendUrl}/ProjBgtRevSetup/upsert`, payload)
//       .then((response) => {
//         toast.dismiss("revenue-setup-saving");
//         toast.success("Data saved successfully!", {
//           toastId: "revenue-setup-save-success",
//           autoClose: 3000,
//         });
//       })
//       .catch((error) => {
//         toast.dismiss("revenue-setup-saving");
//         toast.error(
//           "Failed to save data: " +
//             (error.response?.data?.message || error.message),
//           {
//             toastId: "revenue-setup-save-error",
//             autoClose: 3000,
//           }
//         );
//       })
//       .finally(() => {
//         setIsSaving(false);
//       });
//   };

//   return (
//     <div 
//       className="p-1 sm:p-2 bg-gray rounded shadow scroll-mt-16 font-sans"
//       style={geistSansStyle}
//     >
//       <div className="flex flex-col space-y-2">
//         <div>
//           <label className="text-xs font-normal">Revenue Formula</label>
//           <select
//             className="border border-gray-300 rounded px-2 py-0.5 w-full text-xs font-normal mt-0.5"
//             value={revenueFormula}
//             onChange={(e) => {
//               setRevenueFormula(e.target.value);
//               setRevenueType(e.target.value);
//             }}
//             style={geistSansStyle}
//           >
//             <option value="">---------Select----------</option>
//             {formulaOptions.map((option) => (
//               <option key={option.formulaCd} value={option.formulaCd}>
//                 {option.formulaDesc}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex flex-wrap gap-x-4 gap-y-1">
//           <div className="flex items-center">
//             <label className="text-xs font-normal mr-2">Override Funding Ceiling</label>
//             <input
//               type="checkbox"
//               className="w-3 h-3"
//               checked={overrideFundingCeilingFl}
//               onChange={(e) => setOverrideFundingCeilingFl(e.target.checked)}
//             />
//           </div>
//           <div className="flex items-center">
//             <label className="text-xs font-normal mr-2">Override Settings</label>
//             <input
//               type="checkbox"
//               className="w-3 h-3"
//               checked={overrideSettingsFl}
//               onChange={(e) => setOverrideSettingsFl(e.target.checked)}
//             />
//           </div>
//         </div>

//         <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
//           <div className="flex items-center">
//             <label className="text-xs font-normal mr-2">At Risk Value</label>
//             <input
//               type="text"
//               className={`border border-gray-300 rounded px-2 py-0.5 w-24 text-xs font-normal ${
//                 !overrideFundingCeilingFl ? "bg-gray-100 cursor-not-allowed" : ""
//               }`}
//               value={atRiskValue}
//               style={geistSansStyle}
//               onChange={(e) => {
//                 const rawDigits = e.target.value.replace(/\D/g, "");
//                 if (rawDigits === "") {
//                   setAtRiskValue("");
//                   return;
//                 }
//                 const cents = parseInt(rawDigits, 10);
//                 const dollars = cents / 100;
//                 const formatted = dollars.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 });
//                 setAtRiskValue(formatted);
//               }}
//               disabled={!overrideFundingCeilingFl}
//             />
//           </div>

//           <div className="flex items-center">
//             <label className="text-xs font-normal mr-2">Revenue Account:</label>
//             <span className="text-xs font-normal">{revenueAccountState}</span>
//           </div>
//         </div>

//         <div className="rounded-lg shadow border border-gray-200 overflow-hidden">
//           <table className="w-full table sm:w-auto">
//             <tbody className="tbody">
//               <tr>
//                 <td className="bg-gray-50 text-center py-1"></td>
//                 <td className="bg-gray-50 text-center py-1 px-1 text-[10px] font-semibold leading-tight" style={geistSansStyle}>Rev on Cost</td>
//                 <td className="bg-gray-50 text-center py-1 px-1 text-[10px] font-semibold leading-tight" style={geistSansStyle}>Rev on Burden</td>
//                 <td className="bg-gray-50 text-center py-1 px-1 text-[10px] font-semibold leading-tight" style={geistSansStyle}>Fee on Cost/Burden</td>
//                 <td className="bg-gray-50 text-center py-1 px-1 text-[10px] font-semibold leading-tight" style={geistSansStyle}>Fee on Hours</td>
//                 <td className="bg-gray-50 text-center py-1 px-1 text-[10px] font-semibold leading-tight" style={geistSansStyle}>Fee Rate %</td>
//                 <td className="bg-gray-50 text-center py-1 px-1 text-[10px] font-semibold leading-tight" style={geistSansStyle}>Use T&M Rates</td>
//               </tr>
//               <tr className="border-t border-gray-100">
//                 <td className="bg-gray-50 text-center text-[10px] font-semibold px-2" style={geistSansStyle}>Labor</td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={labCostFl} onChange={(e) => setLabCostFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={labBurdFl} onChange={(e) => setLabBurdFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={labFeeCostFl} onChange={(e) => setLabFeeCostFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={labFeeHrsFl} onChange={(e) => setLabFeeHrsFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 px-1">
//                   <input
//                     type="string"
//                     className="w-12 p-0.5 border rounded text-[10px] font-normal text-center"
//                     style={geistSansStyle}
//                     value={labFeeRt}
//                     onChange={(e) => handleFeeRateChange(e.target.value, setLabFeeRt)}
//                   />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={labTmFl} onChange={(e) => setLabTmFl(e.target.checked)} />
//                 </td>
//               </tr>
//               <tr className="border-t border-gray-100">
//                 <td className="bg-gray-50 text-center text-[10px] font-semibold px-2" style={geistSansStyle}>Non-Labor</td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={nonLabCostFl} onChange={(e) => setNonLabCostFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={nonLabBurdFl} onChange={(e) => setNonLabBurdFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={nonLabFeeCostFl} onChange={(e) => setNonLabFeeCostFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={nonLabFeeHrsFl} onChange={(e) => setNonLabFeeHrsFl(e.target.checked)} />
//                 </td>
//                 <td className="py-1 px-1">
//                   <input
//                     type="string"
//                     className="w-12 p-0.5 border rounded text-[10px] font-normal text-center"
//                     style={geistSansStyle}
//                     value={nonLabFeeRt}
//                     onChange={(e) => handleFeeRateChange(e.target.value, setNonLabFeeRt)}
//                   />
//                 </td>
//                 <td className="py-1 text-center">
//                   <input type="checkbox" className="w-3 h-3" checked={nonLabTmFl} onChange={(e) => setNonLabTmFl(e.target.checked)} />
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//         <div className="flex justify-end w-full pt-1">
//           <button
//             className="rounded-lg px-6 py-1 text-xs font-semibold text-white cursor-pointer disabled:opacity-40 transition-colors"
//             style={{ ...geistSansStyle, backgroundColor: "#113d46" }}
//             onClick={handleSave}
//             disabled={isSaving}
//           >
//             {isSaving ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RevenueSetupComponent;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const RevenueSetupComponent = ({ selectedPlan, revenueAccount }) => {
  const [atRiskValue, setAtRiskValue] = useState("");
  const [revenueType, setRevenueType] = useState("");
  const [revenueAccountState, setRevenueAccountState] = useState("");
  const [labFeeRt, setLabFeeRt] = useState("");
  const [nonLabFeeRt, setNonLabFeeRt] = useState("");
  const [revenueFormula, setRevenueFormula] = useState("");
  const [formulaOptions, setFormulaOptions] = useState([]);
  const [labCostFl, setLabCostFl] = useState(false);
  const [labBurdFl, setLabBurdFl] = useState(false);
  const [labFeeCostFl, setLabFeeCostFl] = useState(false);
  const [labFeeHrsFl, setLabFeeHrsFl] = useState(false);
  const [labTmFl, setLabTmFl] = useState(false);
  const [nonLabCostFl, setNonLabCostFl] = useState(false);
  const [nonLabBurdFl, setNonLabBurdFl] = useState(false);
  const [nonLabFeeCostFl, setNonLabFeeCostFl] = useState(false);
  const [nonLabFeeHrsFl, setNonLabFeeHrsFl] = useState(false);
  const [nonLabTmFl, setNonLabTmFl] = useState(false);
  const [overrideFundingCeilingFl, setOverrideFundingCeilingFl] =
    useState(false);
  const [overrideSettingsFl, setOverrideSettingsFl] = useState(false);
  const [overrideRevAdjustmentsFl, setOverrideRevAdjustmentsFl] =
    useState(false);
  const [useFixedRevenueFl, setUseFixedRevenueFl] = useState(false);
  const [setupId, setSetupId] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Styling variable for the Geist font family
  const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

  const handleFeeRateChange = (value, setter) => {
    if (value === "") {
      setter("");
      return;
    }
    if (/[^\d.]/.test(value)) return;
    if ((value.match(/\./g) || []).length > 1) return;
    if (/^0\d/.test(value)) return;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setter(value);
    } else if (!isNaN(numValue) && numValue > 100) {
      toast.warning("Fee Rate % cannot exceed 100%", {
        toastId: "fee-rate-limit-warning",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    setRevenueFormula("");
    setRevenueType("");
    setSetupId(0);
    setRevenueAccountState(revenueAccount || "");

    axios
      .get(`${backendUrl}/RevFormula`)
      .then((response) => {
        setFormulaOptions(response.data);
      })
      .catch((error) => {});

    if (selectedPlan?.projId && selectedPlan?.version && selectedPlan?.plType) {
      axios
        .get(
          `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`
        )
        .then((response) => {
          const data = response.data;
          setSetupId(data.id || 0);
          setRevenueFormula(data.revType || "");
          setRevenueType(data.revType || "");
          setAtRiskValue(Number(data.atRiskAmt).toLocaleString());
          setRevenueAccountState(data.revAcctId || revenueAccount || "");
          setLabFeeRt(data.labFeeRt.toString());
          setNonLabFeeRt(data.nonLabFeeRt.toString());
          setLabCostFl(data.labCostFl);
          setLabBurdFl(data.labBurdFl);
          setLabFeeCostFl(data.labFeeCostFl );
          setLabFeeHrsFl(data.labFeeHrsFl);
          setLabTmFl(data.labTmFl);
          setNonLabCostFl(data.labCostFl  );
          setNonLabBurdFl(data.labBurdFl  );
          setNonLabFeeCostFl(data.labFeeCostFl  );
          setNonLabFeeHrsFl(data.labFeeHrsFl  );
          setNonLabTmFl(data.nonLabTmFl  );
          setOverrideFundingCeilingFl(data.overrideFundingCeilingFl  );
          setOverrideSettingsFl(data.overrideRevSettingFl  );
          setOverrideRevAdjustmentsFl(data.useBillBurdenRates  );
          setUseFixedRevenueFl(data.overrideRevAmtFl  );
        })
        .catch((error) => {});
    }
  }, [selectedPlan, revenueAccount, backendUrl]);

  const handleSave = () => {
    if (!revenueFormula || revenueFormula === "") {
      toast.error("Please select revenue formula", {
        toastId: "revenue-setup-save-select",
        autoClose: 3000,
      });
      return;
    }

    const payload = {
      id: setupId,
      projId: selectedPlan?.projId || "",
      plId: selectedPlan?.plId || "",
      revType: revenueFormula,
      revAcctId: revenueAccountState,
      dfltFeeRt: parseFloat(labFeeRt) || 0,
      labCostFl,
      labBurdFl,
      labFeeCostFl,
      labFeeHrsFl,
      labFeeRt: parseFloat(labFeeRt) || 0,
      labTmFl,
      nonLabCostFl,
      nonLabBurdFl,
      nonLabFeeCostFl,
      nonLabFeeHrsFl,
      nonLabFeeRt: parseFloat(nonLabFeeRt) || 0,
      nonLabTmFl,
      useBillBurdenRates: overrideRevAdjustmentsFl,
      overrideFundingCeilingFl,
      overrideRevAmtFl: useFixedRevenueFl,
      overrideRevAdjFl: true,
      overrideRevSettingFl: overrideSettingsFl,
      rowVersion: 0,
      modifiedBy: "user",
      timeStamp: new Date().toISOString(),
      companyId: "company",
      atRiskAmt: parseFloat(atRiskValue.replace(/,/g, "")) || 0,
      versionNo: selectedPlan?.version || 0,
      bgtType: selectedPlan?.plType || "",
    };

    setIsSaving(true);
    toast.info("Saving revenue setup...", {
      toastId: "revenue-setup-saving",
      autoClose: false,
    });

    axios
      .post(`${backendUrl}/ProjBgtRevSetup/upsert`, payload)
      .then((response) => {
        toast.dismiss("revenue-setup-saving");
        toast.success("Data saved successfully!", {
          toastId: "revenue-setup-save-success",
          autoClose: 3000,
        });
      })
      .catch((error) => {
        toast.dismiss("revenue-setup-saving");
        toast.error(
          "Failed to save data: " +
            (error.response?.data?.message || error.message),
          {
            toastId: "revenue-setup-save-error",
            autoClose: 3000,
          }
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div 
      className="p-2 sm:p-4 bg-gray rounded shadow min-h-[150px] scroll-mt-16" 
      style={geistSansStyle}
    >
      <div className="flex flex-col space-y-4">
        <div>
          <label className="text-sm font-normal">Revenue Formula</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1"
            value={revenueFormula}
            onChange={(e) => {
              setRevenueFormula(e.target.value);
              setRevenueType(e.target.value);
            }}
            style={geistSansStyle}
          >
            <option value="">---------Select----------</option>
            {formulaOptions.map((option) => (
              <option key={option.formulaCd} value={option.formulaCd}>
                {option.formulaDesc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-normal mr-2">Override Funding Ceiling</label>
          <input
            type="checkbox"
            className="text-sm font-normal"
            checked={overrideFundingCeilingFl}
            onChange={(e) => setOverrideFundingCeilingFl(e.target.checked)}
          />
        </div>
        <div>
          <label className="text-sm font-normal mr-2">Override Settings</label>
          <input
            type="checkbox"
            className="text-sm font-normal"
            checked={overrideSettingsFl}
            onChange={(e) => setOverrideSettingsFl(e.target.checked)}
          />
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="text-sm font-normal mr-2">At Risk Value</label>
            <input
              type="text"
              className={`border border-gray-300 rounded px-2 py-1 w-full sm:w-24 text-sm font-normal ${
                !overrideFundingCeilingFl ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              value={atRiskValue}
              style={geistSansStyle}
              onChange={(e) => {
                const rawDigits = e.target.value.replace(/\D/g, "");
                if (rawDigits === "") {
                  setAtRiskValue("");
                  return;
                }
                const cents = parseInt(rawDigits, 10);
                const dollars = cents / 100;
                const formatted = dollars.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                setAtRiskValue(formatted);
              }}
              disabled={!overrideFundingCeilingFl}
            />
          </div>

          <div className="flex-1">
            <label className="text-sm font-normal mr-2">Revenue Account:</label>
            <span className="text-sm font-normal">{revenueAccountState}</span>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full table sm:w-auto">
            <tbody className="tbody">
              <tr>
                <td className="thead text-center"></td>
                <td className="thead text-center" style={geistSansStyle}>Rev on Cost</td>
                <td className="thead text-center" style={geistSansStyle}>Rev on Burden</td>
                <td className="thead text-center" style={geistSansStyle}>Fee on Cost/Burden</td>
                <td className="thead text-center" style={geistSansStyle}>Fee on Hours</td>
                <td className="thead text-center" style={geistSansStyle}>Fee Rate %</td>
                <td className="thead text-center" style={geistSansStyle}>Use T&M Rates</td>
              </tr>
              <tr>
                <td className="thead text-center" style={geistSansStyle}>Labor</td>
                <td className="tbody-td">
                  <input type="checkbox" checked={labCostFl} onChange={(e) => setLabCostFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={labBurdFl} onChange={(e) => setLabBurdFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={labFeeCostFl} onChange={(e) => setLabFeeCostFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={labFeeHrsFl} onChange={(e) => setLabFeeHrsFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input
                    type="string"
                    className="w-full p-1 border rounded text-sm font-normal"
                    style={geistSansStyle}
                    value={labFeeRt}
                    onChange={(e) => handleFeeRateChange(e.target.value, setLabFeeRt)}
                  />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={labTmFl} onChange={(e) => setLabTmFl(e.target.checked)} />
                </td>
              </tr>
              <tr>
                <td className="thead text-center" style={geistSansStyle}>Non-Labor</td>
                <td className="tbody-td">
                  <input type="checkbox" checked={nonLabCostFl} onChange={(e) => setNonLabCostFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={nonLabBurdFl} onChange={(e) => setNonLabBurdFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={nonLabFeeCostFl} onChange={(e) => setNonLabFeeCostFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={nonLabFeeHrsFl} onChange={(e) => setNonLabFeeHrsFl(e.target.checked)} />
                </td>
                <td className="tbody-td">
                  <input
                    type="string"
                    className="w-full p-1 border rounded text-sm font-normal"
                    style={geistSansStyle}
                    value={nonLabFeeRt}
                    onChange={(e) => handleFeeRateChange(e.target.value, setNonLabFeeRt)}
                  />
                </td>
                <td className="tbody-td">
                  <input type="checkbox" checked={nonLabTmFl} onChange={(e) => setNonLabTmFl(e.target.checked)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end w-full">
         <button
            className="rounded-lg px-6 py-1 text-xs font-semibold text-white cursor-pointer disabled:opacity-40 transition-colors"
            style={{ ...geistSansStyle, backgroundColor: "#113d46" }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueSetupComponent;