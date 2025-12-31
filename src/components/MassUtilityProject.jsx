import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckSquare, Search, Trash2, CheckCircle, Filter, X, RefreshCw } from "lucide-react";

import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "./utils";
import { backendUrl } from "./config";


const COLUMN_LABELS = {
  selection: "", 
  projId: "Project Id",
  projName: "Project Name",
  plType: "BUD/EAC",
  version: "Revision",
  versionCode: "Version Type",
  source: "Origin",
  templateId: "Template Id",
  status: "Status",
  projectStartDate: "Start Date",
  projectEndDate: "End Date",
};

const MassUtilityProject = ({ onPlanSelect, selectedPlan ,projectId   
}) => {
  const [plans, setPlans] = useState([]);
  // Always operate on a safe array reference to avoid runtime errors when `plans` is null/undefined
  const safePlans = Array.isArray(plans) ? plans : [];
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const updatedRef = useRef(null);  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [versionFilter, setVersionFilter] = useState("All"); // All | Latest | Final
  const [versionCodeInput, setVersionCodeInput] = useState("");
  
  const [columns, setColumns] = useState([]);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState({});
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef(null);
  const [lastImportedVersion, setLastImportedVersion] = useState(null);
  const [lastImportTime, setLastImportTime] = useState(null);
  const [editingVersionCodeIdx, setEditingVersionCodeIdx] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [headerStartDate, setHeaderStartDate] = useState("");
const [headerEndDate, setHeaderEndDate] = useState("");
const [headerTemplateId, setHeaderTemplateId] = useState(0);



const fullProjectId = useRef(""); 
const BOOLEAN_FIELDS = ["finalVersion", "isCompleted", "isApproved"];
  const [templates, setTemplates] = useState([]);

  
  const [templateMap, setTemplateMap] = useState({});

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`
        );
        const data = Array.isArray(res.data) ? res.data : [];
        setTemplates(data);

        const map = {};
        data.forEach((t) => {
          // choose what to display; here using templateCode - description
          // map[t.id] = `${t.templateCode} - ${t.description}`;
          map[t.id] = `${t.templateCode}`;
        });
        setTemplateMap(map);
      } catch (err) {
        toast.error("Failed to load templates.");
      }
    };

    fetchTemplates();
  }, []);

  const getTemplateName = (id) =>
  templates.find((t) => t.id === id)?.templateCode || "";

  const handleSaveHeaderTemplateClick = async () => {
  const safePlans = Array.isArray(plans) ? plans : [];
  const templateId = Number(headerTemplateId) || 0;

  if (!templateId) {
    toast.warning("Please select a template.");
    return;
  }

  // resolve targets: multi-select first, then single selectedPlan
  let targetPlans = [];
  if (selectedRows && selectedRows.size > 0) {
    targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
  } else if (selectedPlan && selectedPlan.plId) {
    targetPlans = [selectedPlan];
  }

  if (targetPlans.length === 0) {
    toast.error("No plans selected to update template.");
    return;
  }

  const notAllowed = targetPlans.filter(p => p.status !== "In Progress");
  if (notAllowed.length > 0) {
    toast.warning("Template cannot be changed for plans with status In Progress.");
    return;
  } 

  try {
    setIsActionLoading(true);

    for (const plan of targetPlans) {
      const payload = { ...plan, templateId };
      await axios.put(`${backendUrl}/Project/UpdateProjectPlan`, payload);
    }

    // toast.success("Template updated successfully.", {
    //   toastId: "template-update-success",
    // });

    // refresh list once
    const projIdForRefresh = targetPlans[0].projId;
    if (projIdForRefresh) {
      await refreshPlans(projIdForRefresh);
    }

    // update selectedPlan so details reflect new template
    if (selectedPlan && targetPlans.some((p) => p.plId === selectedPlan.plId)) {
      const updatedPlan = { ...selectedPlan, templateId };
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    }
  } catch (err) {
    toast.error(
      "Error updating template: " +
        (err.response?.data?.message || err.message)
    );
  } finally {
    setIsActionLoading(false);
  }
};


const handleHeaderSaveAll = async () => {
  const safePlans = Array.isArray(plans) ? plans : [];

  // resolve target plans from selection
  let targetPlans = [];
  if (selectedRows && selectedRows.size > 0) {
    targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
  } else if (selectedPlan && selectedPlan.plId) {
    targetPlans = [selectedPlan];
  }

  if (targetPlans.length === 0) {
    toast.error("No plans selected to update.");
    return;
  }

  const tasks = [];

  // 1) dates
  const isFullDate = (v) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

  const hasDates =
    headerStartDate &&
    headerEndDate &&
    isFullDate(headerStartDate) &&
    isFullDate(headerEndDate);

  if (hasDates) {
    tasks.push(
      handleSaveHeaderDatesClick(targetPlans, headerStartDate, headerEndDate)
    );
  }

  // 2) template
  const templateId = Number(headerTemplateId) || 0;
  if (templateId) {
    tasks.push(handleSaveHeaderTemplateClick(targetPlans, templateId));
  }

  // 3) version code
  if (versionCodeInput && versionCodeInput.trim() !== "") {
    tasks.push(handleSaveVersionCodeClick(targetPlans, versionCodeInput));
  }

  if (tasks.length === 0) {
    toast.info("Nothing to update.");
    return;
  }

  try {
    setIsActionLoading(true);
    await Promise.all(tasks);
    toast.success("Updates saved successfully.", {
      toastId: "header-save-all",
    });
  } catch (err) {
    toast.error(
      "Error saving updates: " +
        (err.response?.data?.message || err.message)
    );
  } finally {
    setIsActionLoading(false);
  }
};

const handleTemplateChange = async (plan, value) => {
  const templateId = Number(value) || 0;
  if (!templateId) return;

  await handleSaveHeaderTemplateClick([ { ...plan, templateId } ]);
};

  
  // Refresh plans; if overrideProjId is supplied, fetch plans for that project
  const refreshPlans = async (overrideProjId = null) => {
    try {
      if (overrideProjId) {
        // Fetch plans for a single project and merge into existing plans
        const response = await axios.get(`${backendUrl}/Project/GetProjectPlans/${overrideProjId}`);
        const fetched = (response.data || []).map((p) => ({
          ...p,
          plId: p.plId || p.id || 0,
          projId: p.fullProjectId || p.projId || p.projectId || overrideProjId,
          status: (p.status || "In Progress").replace("Working", "In Progress").replace("Completed", "Submitted"),
        }));

        setPlans((prev) => {
          const filtered = (prev || []).filter((p) => p.projId !== overrideProjId);
          const merged = [...filtered, ...fetched];
        //   return sortPlansByProjIdPlTypeVersion(merged);
        });
        return fetched;
      }

      // Otherwise, fetch all plans according to filters
      const response = await axios.get(`${backendUrl}/Project/GetAllPlans`, {
        params: {
          search: searchQuery || "",
          type: typeFilter === "All" ? "" : typeFilter,
          status: statusFilter === "All" ? "" : statusFilter,
          active: versionFilter === "All" ? "" : versionFilter === "Active" ? "Y" : "N",
        },
      });

      const transformed = (response.data || []).map((p) => ({
        ...p,
        plId: p.plId || p.id || 0,
        projId: p.fullProjectId || p.projId || p.projectId || p.projId,
        status: (p.status || "In Progress").replace("Working", "In Progress").replace("Completed", "Submitted"),
      }));

      const sortedPlans = sortPlansByProjIdPlTypeVersion(transformed);
      setPlans(sortedPlans);
      return sortedPlans;
    } catch (error) {
      // toast.error("Failed to refresh plans."); 
      return [];
    }
  };

  const handleRowClick = (plan, tempDates = manualProjectDates) => {
    const isDateMissing =
      filteredProjects.length > 0 &&
      !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

    const effectiveStartDate = plan.projStartDt || plan.startDate || "";
    const effectiveEndDate = plan.projEndDt || plan.endDate || "";

    //  const effectiveStartDate =
    //     tempDates?.startDate ??
    //     plan.projStartDt ??
    //     plan.startDate ??
    //     "";

    //   const effectiveEndDate =
    //     tempDates?.endDate ??
    //     plan.projEndDt ??
    //     plan.endDate ??
    //     "";

    const updatedPlan = {
      ...plan,
      projStartDt: effectiveStartDate,
      projEndDt: effectiveEndDate,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    };

    //    setEditingDates(prev => ({
    //   ...prev,
    //   [plan.plId]: {
    //     startDate: plan.projStartDt || plan.startDate || '',
    //     endDate: plan.projEndDt || plan.endDate || ''
    //   }
    // }));

    setEditingDates((prev) => ({
      ...prev,
      [plan.plId]: {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      },
    }));

    const isSamePlanButDatesChanged =
      selectedPlan &&
      selectedPlan.plId === updatedPlan.plId &&
      selectedPlan.projId === updatedPlan.projId &&
      (selectedPlan.projStartDt !== updatedPlan.projStartDt ||
        selectedPlan.projEndDt !== updatedPlan.projEndDt);

    if (
      !selectedPlan ||
      updatedPlan.plId !== selectedPlan.plId ||
      updatedPlan.projId !== selectedPlan.projId ||
      isSamePlanButDatesChanged
    ) {
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    } else {
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    }

    setVersionCodeInput(updatedPlan.versionCode || "");
    setHeaderStartDate(effectiveStartDate || "");
  setHeaderEndDate(effectiveEndDate || "");
  setHeaderTemplateId(plan.templateId || 0);
  };

 const handleDateCellChange = (plId, dateColumn, value) => {
  const dateType = dateColumn === "projectStartDate" ? "startDate" : "endDate";
  const currentDates = editingDates[plId] || {};
  const newDates = { ...currentDates, [dateType]: value };

  // Update state with new dates
  setEditingDates((prev) => ({ ...prev, [plId]: newDates }));

  // Check if we have both dates in valid format
  const isFullDate = (v) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const hasStartDate = isFullDate(newDates.startDate);
  const hasEndDate = isFullDate(newDates.endDate);

  
};

  const handleUpdateProjectDates = async (newDates) => {
    if (!projectId || !newDates.startDate || !newDates.endDate) {
      toast.error("Project ID or both dates are missing for update.");
      return false;
    }
    const payload = {
      projId: selectedPlan?.projId || fullProjectId.current || projectId,
      projStartDt: newDates.startDate,
      projEndDt: newDates.endDate,
    };

    setIsActionLoading(true);
    try {
      await axios.put(`${backendUrl}/Project/UpdateDates`, payload);
      toast.success("Project dates updated successfully!");

      setManualDatesSubmitted(true);

      if (filteredProjects.length > 0) {
        const projectIndex = filteredProjects.findIndex(
          (p) => p.projId === projectId
        );
        if (projectIndex !== -1) {
          filteredProjects[projectIndex].startDate = newDates.startDate;
          filteredProjects[projectIndex].projStartDt = newDates.startDate;
          filteredProjects[projectIndex].endDate = newDates.endDate;
          filteredProjects[projectIndex].projEndDt = newDates.endDate;

          // Keep manual dates so they stay visible
          setManualProjectDates({
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          });
          tempManualDatesRef.current = {
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          };

          if (selectedPlan) {
            handleRowClick(selectedPlan, newDates);
          }
        }
      }
      return true;
    } catch (err) {
      toast.error(
        "Failed to update project dates. " +
          (err.response?.data?.message || err.message)
      );
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const isSaveDatesDisabled = () => {
  const currentPlan = getCurrentPlan();
  if (!currentPlan) return true;

  const edited = editingDates[currentPlan.plId];
  if (!edited) return true;

  const originalStart =
    currentPlan.projStartDt || currentPlan.startDate || "";
  const originalEnd = currentPlan.projEndDt || currentPlan.endDate || "";

  const newStart = edited.startDate || "";
  const newEnd = edited.endDate || "";

  // enable only if at least one date changed
  return originalStart === newStart && originalEnd === newEnd;
};


  const handleSaveDatesClick = async () => {
  // if (!selectedPlan?.plId) {
  //   toast.error("No plan selected to save dates.", {
  //     toastId: "no-plan-selected-dates",
  //   });
  //   return;
  // }

  const currentDates = editingDates[selectedPlan.plId] || {};
  const { startDate, endDate } = currentDates;

  // Reuse exactly the same validation as earlier
  const isFullDate = (v) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const hasStartDate = isFullDate(startDate);
  const hasEndDate = isFullDate(endDate);

  if (!hasStartDate || !hasEndDate) {
    toast.warning("Please select both start and end dates to save changes", {
      autoClose: 3000,
    });
    return;
  }

  // Get the plan (same as before)
  const plan = safePlans.find((p) => p.plId === selectedPlan?.plId);
  if (!plan?.projId) {
    toast.error("Missing project id for selected plan.");
    return;
  }

  try {
    setIsActionLoading(true);

    // Same payload / endpoint as old handleDateCellChange
    await axios.put(`${backendUrl}/Project/UpdateDates`, {
      projId: selectedPlan.projId,
      projStartDt: startDate,
      projEndDt: endDate,
    });

    toast.success("Dates updated successfully", { autoClose: 2000 });

    // Refresh the plans to get updated data (same logic)
    const updatedPlans = projectId?.trim()
      ? await refreshPlans()
      : await refreshPlansForSelected();

    // Update the selected plan with new dates (same shape)
    if (selectedPlan?.plId === plan.plId) {
      const updatedPlan = {
        ...selectedPlan,
        projStartDt: startDate,
        projEndDt: endDate,
        startDate,
        endDate,
      };
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    }
  } catch (error) {
    toast.error(
      `Failed to update dates: ${
        error.response?.data?.message || error.message
      }`,
      {
        autoClose: 4000,
      }
    );
  } finally {
    setIsActionLoading(false);
  }
};


const handleMassStatusUpdate = async (actionType) => {
  if (selectedRows.size === 0) {
    toast.warning("No rows selected!");
    return;
  }
  setLoading(true);
  const selectedIds = Array.from(selectedRows);

  // Map action to boolean field to validate eligibility
  const actionField = actionType === "submit" ? "isCompleted" : actionType === "approve" ? "isApproved" : "finalVersion";

  // Build list of plans to operate on and filter out invalid ones
  const candidates = selectedIds
    .map((id) => safePlans.find((p) => p.plId === id))
    .filter(Boolean);

  const allowed = candidates.filter((p) => isToggleAllowedForPlan(p, actionField));
  const disallowedCount = candidates.length - allowed.length;
  if (allowed.length === 0) {
    toast.error("None of the selected plans are eligible for this action.");
    setLoading(false);
    return;
  }

  if (disallowedCount > 0) {
    toast.warning(`${disallowedCount} selected plan(s) are not eligible and will be skipped.`);
  }

  try {
    // Use allSettled to capture per-plan success/failure
    const results = await Promise.allSettled(
      allowed.map(async (plan) => {
        const payload = {
          plId: plan.plId,
          projId: plan.projId || fullProjectId.current,
          plType: plan.plType,
          versionCode: plan.versionCode,
          finalVersion: !!plan.finalVersion,
          isCompleted: !!plan.isCompleted,
          isApproved: !!plan.isApproved,
          status: plan.status,
          approvedBy: plan.approvedBy,
          templateId: plan.templateId,
        };

        if (actionType === "submit") {
          payload.isCompleted = true;
          payload.status = "Submitted";
        } else if (actionType === "approve") {
          payload.isApproved = true;
          payload.status = "Approved";
        } else if (actionType === "conclude") {
          payload.finalVersion = true;
          payload.status = "Concluded";
        }

        await axios.put(`${backendUrl}/Project/UpdateProjectPlan`, payload);
        return { plan, payload };
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value.plan.plId);
    const failed = results.filter((r) => r.status === "rejected");

    // Update local plans only for succeeded updates
    setPlans((prev) =>
      prev.map((plan) => {
        if (succeeded.includes(plan.plId)) {
          const updated = { ...plan };
          if (actionType === "submit") {
            updated.status = "Submitted";
            updated.isCompleted = true;
          } else if (actionType === "approve") {
            updated.status = "Approved";
            updated.isApproved = true;
          } else if (actionType === "conclude") {
            updated.status = "Concluded";
            updated.finalVersion = true;
          }
          return updated;
        }
        return plan;
      })
    );

    // Refresh per-affected project to ensure server-side rules are reflected
    const affectedProjIds = Array.from(new Set(allowed.map((p) => p.projId).filter(Boolean)));
    await Promise.all(affectedProjIds.map((pid) => refreshPlans(pid)));

    // user feedback
    if (succeeded.length > 0) {
      toast.success(`Successfully ${actionType}d ${succeeded.length} plan(s)`);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} plan(s) failed to update. Please refresh.`);
    }

    setSelectedRows(new Set());
  } catch (err) {
    console.error(err);
    toast.error("Failed to update plans. Please refresh.");
  } finally {
    setLoading(false);
  }
};

const handleSaveHeaderDatesClick = async () => {
  const safePlans = Array.isArray(plans) ? plans : [];

  // 1. Resolve target plans: multi-select first, then single selectedPlan
  let targetPlans = [];
  if (selectedRows && selectedRows.size > 0) {
    targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
  } else if (selectedPlan && selectedPlan.plId) {
    targetPlans = [selectedPlan];
  }

  if (targetPlans.length === 0) {
    toast.error("No plans selected to update dates.");
    return;
  }

  const startDate = headerStartDate;
  const endDate = headerEndDate;

  const isFullDate = (v) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

  if (!isFullDate(startDate) || !isFullDate(endDate)) {
    toast.warning("Please select both start and end dates.");
    return;
  }

  // 2. Ensure all target plans have projId
  const invalid = targetPlans.filter((p) => !p.projId);
  if (invalid.length > 0) {
    toast.error("Missing project id for one or more selected plans.");
    return;
  }

  try {
    setIsActionLoading(true);

    // 3. Update dates for each target plan
    for (const plan of targetPlans) {
      await axios.put(`${backendUrl}/Project/UpdateDates`, {
        projId: plan.projId,
        projStartDt: startDate,
        projEndDt: endDate,
      });
    }

    toast.success("Dates updated successfully", { autoClose: 2000 });

    // 4. Refresh once (optional: pass first projId if your refresh is per-project)
    await refreshPlans(targetPlans[0].projId);

    // 5. Update selectedPlan so detail panel reflects new dates
    if (selectedPlan && targetPlans.some((p) => p.plId === selectedPlan.plId)) {
      const updatedPlan = {
        ...selectedPlan,
        projStartDt: startDate,
        projEndDt: endDate,
        startDate,
        endDate,
      };
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    }
  } catch (error) {
    toast.error(
      `Failed to update dates: ${
        error.response?.data?.message || error.message
      }`,
      { autoClose: 4000 }
    );
  } finally {
    setIsActionLoading(false);
  }
};


//   const handleCheckboxChange = async (idx, field) => {
//     const prevPlans = [...plans];
//     const plan = plans[idx];
//     const planId = plan.plId;
//     if (!plan.plType || !plan.version) {
//       toast.error(
//         `Cannot update ${field}: Plan Type and Version are required.`,
//         { toastId: "checkbox-error" }
//       );
//       return;
//     }
//     if (field === "isApproved" && !plan.isCompleted) {
//       toast.error("You can't approve this row until Submitted is checked", {
//         toastId: "checkbox-error",
//       });
//       return;
//     }
//     if (field === "finalVersion" && !plan.isApproved) {
//       toast.error("You can't set Conclude until Approved is checked", {
//         toastId: "checkbox-error",
//       });
//       return;
//     }
//     let updated = { ...plan };
//     updated[field] = !plan[field];
//     if (field === "isCompleted") {
//       updated.status = updated.isCompleted ? "Submitted" : "In Progress";
//       if (!updated.isCompleted) {
//         updated.isApproved = false;
//         updated.finalVersion = false;
//       }
//     }
//     if (field === "isApproved") {
//       updated.status = updated.isApproved ? "Approved" : "Submitted";
//       if (!updated.isApproved) updated.finalVersion = false;
//     }
//     if (field === "finalVersion")
//       updated.status = updated.finalVersion ? "Concluded" : "Approved";
//     let newPlans;

//     if (field === "isCompleted" && !updated.isCompleted) {
//       const isEAC = updated.plType === "EAC";
//       const inProgressCount = plans.filter(
//         (p) =>
//           p.status === "In Progress" &&
//           p.plType === updated.plType &&
//           p.projId === updated.projId
//       ).length;
//       if (inProgressCount > 0 && updated.status === "In Progress") {
//         toast.error(
//           `Only one ${
//             isEAC ? "EAC" : "BUD"
//           } plan can have In Progress status at a time.`,
//           { toastId: "checkbox-error" }
//         );
//         return;
//       }
//     }
//     if (field === "finalVersion" && updated.finalVersion) {
//       newPlans = plans.map((p, i) =>
//         i === idx
//           ? updated
//           : p.plType === updated.plType && p.projId === updated.projId
//           ? { ...p, finalVersion: false }
//           : p
//       );
//     } else {
//       newPlans = plans.map((p, i) => (i === idx ? updated : p));
//     }

//     if (updated.status === "In Progress") {
//       newPlans = newPlans.map((p, i) =>
//         i !== idx &&
//         p.status === "In Progress" &&
//         p.plType === updated.plType &&
//         p.projId === updated.projId
//           ? { ...p, status: "Submitted", isCompleted: true }
//           : p
//       );
//     }
//     setPlans(newPlans);
//     if (typeof onPlanSelect === "function") onPlanSelect(updated);

//     if ((BOOLEAN_FIELDS.includes(field) || field === "status") && planId && Number(planId) > 0) {
//       const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;

//       const payload = {
//         plId: updated.plId,
//         projId: fullProjectId.current || updated.projId,
//         plType: updated.plType,
//         versionCode: updated.versionCode,
//         finalVersion: updated.finalVersion,
//         isCompleted: updated.isCompleted,
//         isApproved: updated.isApproved,
//         status: updated.status,
//         approvedBy: updated.approvedBy,
//         templateId: updated.templateId,
//       };
//       try {
//         setRowLoading((prev) => ({ ...prev, [planId]: true }));
//         await axios.put(updateUrl, payload);

//         // Only refresh once for mass operations; callers can pass skipRefresh=true
//         // if (!skipRefresh) {
//         //   // Prefer refreshing the specific project to minimize data churn
//         //   await refreshPlans(payload.projId);
//         // }

//         toast.success("Status updated successfully.", {
//           toastId: "plan-status-updated",
//         });
//       } catch (err) {
//         setPlans(prevPlans);
//         toast.error(
//           "Error updating plan: " + (err.response?.data?.message || err.message),
//           { toastId: "checkbox-error" }
//         );
//       } finally {
//         setRowLoading((prev) => ({ ...prev, [planId]: false }));
//       }
//     }
//   };

//bulk

// const handleCheckboxChange = async (idx, field) => {
//   const prevPlans = [...plans];
//   const plan = plans[idx];
//   const planId = plan.plId;

//   if (!plan.plType || !plan.version) {
//     toast.error(
//       `Cannot update ${field}: Plan Type and Version are required.`,
//       { toastId: "checkbox-error" }
//     );
//     return;
//   }

//   if (field === "isApproved" && !plan.isCompleted) {
//     toast.error("You can't approve this row until Submitted is checked", {
//       toastId: "checkbox-error",
//     });
//     return;
//   }

//   if (field === "finalVersion" && !plan.isApproved) {
//     toast.error("You can't set Conclude until Approved is checked", {
//       toastId: "checkbox-error",
//     });
//     return;
//   }

//   // 1) Update local state and capture updated row
//   setPlans((currentPlans) => {
//     const currentPlan = currentPlans[idx];
//     if (!currentPlan) return currentPlans;

//     let updated = { ...currentPlan };
//     updated[field] = !currentPlan[field];

//     if (field === "isCompleted") {
//       updated.status = updated.isCompleted ? "Submitted" : "In Progress";
//       if (!updated.isCompleted) {
//         updated.isApproved = false;
//         updated.finalVersion = false;
//       }
//     }

//     if (field === "isApproved") {
//       updated.status = updated.isApproved ? "Approved" : "Submitted";
//       if (!updated.isApproved) updated.finalVersion = false;
//     }

//     if (field === "finalVersion") {
//       updated.status = updated.finalVersion ? "Concluded" : "Approved";
//     }

//     let newPlans = currentPlans;

//     // Enforce single In Progress per projId + plType
//     if (field === "isCompleted" && !updated.isCompleted) {
//       const isEAC = updated.plType === "EAC";
//       const inProgressCount = currentPlans.filter(
//         (p) =>
//           p.status === "In Progress" &&
//           p.plType === updated.plType &&
//           p.projId === updated.projId
//       ).length;

//       if (inProgressCount > 0 && updated.status === "In Progress") {
//         toast.error(
//           `Only one ${isEAC ? "EAC" : "BUD"} plan can have In Progress status at a time.`,
//           { toastId: "checkbox-error" }
//         );
//         return currentPlans;
//       }
//     }

//     // Final version: clear others for same proj/type
//     if (field === "finalVersion" && updated.finalVersion) {
//       newPlans = currentPlans.map((p, i) =>
//         i === idx
//           ? updated
//           : p.plType === updated.plType && p.projId === updated.projId
//           ? { ...p, finalVersion: false }
//           : p
//       );
//     } else {
//       newPlans = currentPlans.map((p, i) => (i === idx ? updated : p));
//     }

//     // If this row becomes In Progress, push others back to Submitted
//     if (updated.status === "In Progress") {
//       newPlans = newPlans.map((p, i) =>
//         i !== idx &&
//         p.status === "In Progress" &&
//         p.plType === updated.plType &&
//         p.projId === updated.projId
//           ? { ...p, status: "Submitted", isCompleted: true }
//           : p
//       );
//     }

//     if (typeof onPlanSelect === "function") onPlanSelect(updated);
//     updatedRef.current = updated;

//     return newPlans;
//   });

//   const updated = updatedRef.current || plan;

//   // 2) Call bulk API with a single‑item array
//   if (
//     (BOOLEAN_FIELDS.includes(field) || field === "status") &&
//     planId &&
//     Number(planId) > 0
//   ) {
//     const updateUrl = `${backendUrl}/Project/BulkUpdateProjectPlan`;

//     const payload = {
//       plId: updated.plId,
//       projId: fullProjectId.current || updated.projId,
//       plType: updated.plType,
//       versionCode: updated.versionCode,
//       finalVersion: updated.finalVersion,
//       isCompleted: updated.isCompleted,
//       isApproved: updated.isApproved,
//       status: updated.status,
//       approvedBy: updated.approvedBy,
//       templateId: updated.templateId,
//     };

//     try {
//       setRowLoading((prev) => ({ ...prev, [planId]: true }));

//       // backend expects an array of plans
//       await axios.put(updateUrl, [payload]);

//       // optional: refresh project plans if needed
//       // await refreshPlans(payload.projId);
//     } catch (err) {
//       setPlans(prevPlans);
//       toast.error(
//         "Error updating plan: " +
//           (err.response?.data?.message || err.message),
//         { toastId: "checkbox-error" }
//       );
//     } finally {
//       setRowLoading((prev) => ({ ...prev, [planId]: false }));
//     }
//   }
// };
// single

const handleCheckboxChange = async (idx, field) => {
    const prevPlans = [...plans];
    const plan = plans[idx];
    const planId = plan.plId;
    if (!plan.plType || !plan.version) {
      toast.error(
        `Cannot update ${field}: Plan Type and Version are required.`,
        { toastId: "checkbox-error" }
      );
      return;
    }
    if (field === "isApproved" && !plan.isCompleted) {
      toast.error("You can't approve this row until Submitted is checked", {
        toastId: "checkbox-error",
      });
      return;
    }
    if (field === "finalVersion" && !plan.isApproved) {
      toast.error("You can't set Conclude until Approved is checked", {
        toastId: "checkbox-error",
      });
      return;
    }
    setPlans((currentPlans) => {
    const currentPlan = currentPlans[idx];
    if (!currentPlan) return currentPlans;

    let updated = { ...currentPlan };
    updated[field] = !currentPlan[field];

    if (field === "isCompleted") {
      updated.status = updated.isCompleted ? "Submitted" : "In Progress";
      if (!updated.isCompleted) {
        updated.isApproved = false;
        updated.finalVersion = false;
      }
    }
    if (field === "isApproved") {
      updated.status = updated.isApproved ? "Approved" : "Submitted";
      if (!updated.isApproved) updated.finalVersion = false;
    }
    if (field === "finalVersion") {
      updated.status = updated.finalVersion ? "Concluded" : "Approved";
    }

    let newPlans = currentPlans;

    if (field === "isCompleted" && !updated.isCompleted) {
      const isEAC = updated.plType === "EAC";
      const inProgressCount = currentPlans.filter(
        (p) =>
          p.status === "In Progress" &&
          p.plType === updated.plType &&
          p.projId === updated.projId
      ).length;

      if (inProgressCount > 0 && updated.status === "In Progress") {
        toast.error(
          `Only one ${isEAC ? "EAC" : "BUD"} plan can have In Progress status at a time.`,
          { toastId: "checkbox-error" }
        );
        return currentPlans;
      }
    }

    if (field === "finalVersion" && updated.finalVersion) {
      newPlans = currentPlans.map((p, i) =>
        i === idx
          ? updated
          : p.plType === updated.plType && p.projId === updated.projId
          ? { ...p, finalVersion: false }
          : p
      );
    } else {
      newPlans = currentPlans.map((p, i) => (i === idx ? updated : p));
    }

    if (updated.status === "In Progress") {
      newPlans = newPlans.map((p, i) =>
        i !== idx &&
        p.status === "In Progress" &&
        p.plType === updated.plType &&
        p.projId === updated.projId
          ? { ...p, status: "Submitted", isCompleted: true }
          : p
      );
    }

    // also keep onPlanSelect behavior
    if (typeof onPlanSelect === "function") onPlanSelect(updated);

    // expose updated object to the outer scope via closure
    updatedRef.current = updated;

    return newPlans;
  });
  
    const updated = updatedRef.current || plan;

    if ((BOOLEAN_FIELDS.includes(field) || field === "status") && planId && Number(planId) > 0) {
      const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;

      const payload = {
        plId: updated.plId,
        projId: fullProjectId.current || updated.projId,
        plType: updated.plType,
        versionCode: updated.versionCode,
        finalVersion: updated.finalVersion,
        isCompleted: updated.isCompleted,
        isApproved: updated.isApproved,
        status: updated.status,
        approvedBy: updated.approvedBy,
        templateId: updated.templateId,
      };
      try {
        setRowLoading((prev) => ({ ...prev, [planId]: true }));
        await axios.put(updateUrl, payload);

        // Only refresh once for mass operations; callers can pass skipRefresh=true
        // if (!skipRefresh) {
        //   // Prefer refreshing the specific project to minimize data churn
        //   await refreshPlans(payload.projId);
        // }

        // toast.success("Status updated successfully.", {
        //   toastId: "plan-status-updated",
        // });
      } catch (err) {
        setPlans(prevPlans);
        toast.error(
          "Error updating plan: " + (err.response?.data?.message || err.message),
          { toastId: "checkbox-error" }
        );
      } finally {
        setRowLoading((prev) => ({ ...prev, [planId]: false }));
      }
    }
  };

  // const handleVersionCodeChange = async (plId, value) => {
  //   const prevPlans = [...plans];
  //   const currentPlan = plans.find((p) => p.plId === plId);
  //   if (!currentPlan) return;

  //   if (currentPlan.versionCode === value) {
  //     return;
  //   }

  //   let updated = { ...currentPlan, versionCode: value };
  //   const newPlans = plans.map((plan) => (plan.plId === plId ? updated : plan));
  //   setPlans(newPlans);

  //   if (plId && Number(plId) > 0) {
  //     const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
  //     toast.info("Updating version code...", { toastId: "version-code-info" });
  //     try {
  //       setIsActionLoading(true);
  //       await axios.put(updateUrl, updated);
  //       toast.success("Version code updated successfully!", {
  //         toastId: "version-code-success",
  //       });
  //     } catch (err) {
  //       setPlans(prevPlans);
  //       toast.error(
  //         "Error updating version code: " +
  //           (err.response?.data?.message || err.message),
  //         { toastId: "version-code-error" }
  //       );
  //     } finally {
  //       setIsActionLoading(false);
  //     }
  //   }
  // };

const handleVersionCodeChange = async (plId, value) => {
  const prevPlans = [...plans];
  const currentPlan = safePlans.find((p) => p.plId === plId);
  if (!currentPlan) return;

  if (currentPlan.versionCode === value) {
    return;
  }

  let updated = { ...currentPlan, versionCode: value };
  const newPlans = plans.map((plan) => (plan.plId === plId ? updated : plan));
  setPlans(newPlans);

  if (plId && Number(plId) > 0) {
    const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
    // toast.info("Updating version code...", { toastId: "version-code-info" });
    try {
      setIsActionLoading(true);
      await axios.put(updateUrl, updated); 
    //   toast.success("Version code updated successfully!", {
    //     toastId: "version-code-success",
    //   });
      // Refresh project plans so any server-side rules are applied
      await refreshPlans(updated.projId || fullProjectId.current);
      // Clear edit mode and update inputs/selection
      setEditingVersionCodeIdx(null);
      setVersionCodeInput(updated.versionCode || "");
      if (typeof onPlanSelect === "function" && selectedPlan?.plId === updated.plId) {
        onPlanSelect(updated);
      }
    } catch (err) {
      setPlans(prevPlans);
      toast.error(
        "Error updating version code: " +
          (err.response?.data?.message || err.message),
        { toastId: "version-code-error" }
      );
    } finally {
      setIsActionLoading(false);
    }
  }
};

const handleSaveVersionCodeClick = () => {
  const safePlans = Array.isArray(plans) ? plans : [];

  // find all target plans
  let targetPlans = [];

  if (selectedRows && selectedRows.size > 0) {
    targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
  } else if (selectedPlan && selectedPlan.plId) {
    targetPlans = [selectedPlan];
  }

  if (targetPlans.length === 0) {
    toast.error("No plans selected to update version code.");
    return;
  }

  targetPlans.forEach((plan) => {
    if (plan.plId) {
      handleVersionCodeChange(plan.plId, versionCodeInput);
    }
  });
};

const handleActionSelect = async (idx, action) => {
  const plan = plans[idx];
  if (!plan || action === "None") return;

  try {
    setIsActionLoading(true);

    // 1) Delete
    if (action === "Delete") {
      if (!plan.plId || Number(plan.plId) <= 0) {
        toast.error("Cannot delete: Invalid plan ID.");
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to delete this plan?"
      );
      if (!confirmed) return;

      toast.info("Deleting plan...");

      try {
        await axios.delete(
          `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`
        );
        toast.success("Plan deleted successfully!");
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error(
            "Plan not found on server. It may have already been deleted."
          );
        } else {
          toast.error(
            "Error deleting plan: " +
              (err.response?.data?.message || err.message)
          );
        }
        return;
      }

      // remove from local state
      setPlans((prev) => prev.filter((_, i) => i !== idx));

      // refresh project-specific plans to ensure server state sync
      await refreshPlans(plan.projId);

      // clear selection if this was selected
      if (selectedPlan?.plId === plan.plId && typeof onPlanSelect === "function") {
        onPlanSelect(null);
      }

      return;
    }

    // 2) Create new plan (Budget / Blank Budget / EAC / NB BUD)
    if (
      action === "Create Budget" ||
      action === "Create Blank Budget" ||
      action === "Create EAC" ||
      action === "Create NB BUD"
    ) {
      const actionProjId =
        fullProjectId?.current || plan.projId || "";

      const newPlType =
        action === "Create NB BUD"
          ? "NBBUD"
          : action === "Create Budget" || action === "Create Blank Budget"
          ? "BUD"
          : "EAC";

      const payloadTemplate = {
        projId: selectedPlan?.projId || plan.projId || actionProjId || "",
        plId: plan.plId || 0,
        plType: newPlType,
        source: plan.source || "",
        type:
          typeof isChildProjectId === "function" &&
          isChildProjectId(actionProjId)
            ? "SYSTEM"
            : plan.type || "",
        version: plan.version || 0,
        versionCode: plan.versionCode || "",
        finalVersion: false,
        isCompleted: false,
        isApproved: false,
        status: "In Progress",
        createdBy: plan.createdBy || "User",
        modifiedBy: plan.modifiedBy || "User",
        approvedBy: "",
        templateId: plan.templateId || 1,
        // fiscalYear,
      };

      toast.info(
        `Creating ${
          action === "Create Budget"
            ? "Budget"
            : action === "Create Blank Budget"
            ? "Blank Budget"
            : action === "Create NB BUD"
            ? "NB BUD"
            : "EAC"
        }...`
      );

      const response = await axios.post(
        `${backendUrl}/Project/AddProjectPlan?type=${
          action === "Create Blank Budget" ? "blank" : "actual"
        }`,
        payloadTemplate
      );

      const rawCreatedPlan = response.data || {};

      // normalize created plan so projId matches what the grid uses
      const normalizedPlan = {
        ...plan,
        ...rawCreatedPlan,
        plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
        projId:
          rawCreatedPlan.fullProjectId ||
          rawCreatedPlan.projId ||
           
          plan.projId ||
          actionProjId,
        projName: rawCreatedPlan.projName || plan.projName || "",
        plType:
          rawCreatedPlan.plType === "Budget"
            ? "BUD"
            : rawCreatedPlan.plType === "EAC"
            ? "EAC"
            : newPlType,
        version: Number(rawCreatedPlan.version) || 0,
        status: "In Progress",
        finalVersion: false,
        isCompleted: false,
        isApproved: false,
        projStartDt: rawCreatedPlan.projStartDt || plan.projStartDt || "",
        projEndDt: rawCreatedPlan.projEndDt || plan.projEndDt || "",
      };

      if (!normalizedPlan.projId || !normalizedPlan.plType) {
        toast.error(
          "Plan returned from backend is missing required fields. Please reload and try again."
        );
        return;
      }

      // use the normalized projId for refresh so the new plan appears in the grid
      const effectiveProjIdForRefresh =
        fullProjectId?.current ||
        normalizedPlan.projId ||
        projectId ||
        "";

      const newPlans = await refreshPlans(effectiveProjIdForRefresh);

      // pick the plan we just created from refreshed list
      if (newPlans && newPlans.length > 0) {
        const planToSelect =
          newPlans.find(
            (p) =>
              p.plId === normalizedPlan.plId &&
              p.projId === normalizedPlan.projId &&
              p.plType === normalizedPlan.plType
          ) || normalizedPlan;

        // select in grid and notify parent
        handleRowClick(planToSelect);
        if (typeof onPlanCreated === "function") {
          onPlanCreated(planToSelect); // parent can set projectId = planToSelect.projId
        }
      }

      toast.success(
        `${
          action === "Create Budget"
            ? "Budget"
            : action === "Create Blank Budget"
            ? "Blank Budget"
            : action === "Create NB BUD"
            ? "NB BUD"
            : "EAC"
        } created successfully!`
      );
      return;
    }

    // 3) Other actions not implemented
    toast.info(`Action "${action}" selected (API call not implemented)`);
  } catch (err) {
    toast.error(
      "Error performing action: " +
        (err.response?.data?.message || err.message)
    );
  } finally {
    setIsActionLoading(false);
  }
};

  const getProjectDotLevel = (projId) => {
    if (!projId || typeof projId !== "string") return 0;
    const dotCount = (projId.match(/\./g) || []).length;
    return dotCount;
  };

  const getActionOptions = (plan) => {
    let options = ["None"];

    if (!plan?.projId) {
      return options;
    }

    let lockDotLevel = null;
    const masterId = plan.projId.split(".")[0];

    for (const p of plans) {
      if (p.plType && p.projId?.startsWith(masterId)) {
        lockDotLevel = getProjectDotLevel(p.projId);
        break;
      }
    }

    if (!plan.plType && !plan.version) {
      const currentDotLevel = getProjectDotLevel(plan.projId);
      const creationOptions = [
        "None",
        "Create Budget",
        "Create Blank Budget",
        "Create EAC",
      ];

      if (lockDotLevel === null) {
        return creationOptions;
      }

      if (currentDotLevel === lockDotLevel) {
        return creationOptions;
      }

      return options;
    }

    if (plan.status === "In Progress") options = ["None", "Delete"];
    else if (plan.status === "Submitted")
      options = ["None", "Create Budget", "Create Blank Budget"];
    else if (plan.status === "Approved")
      options = [
        "None",
        "Create Budget",
        "Create Blank Budget",
        "Create EAC",
        "Delete",
      ];
    else if (plan.status === "Concluded")
      options = ["None", "Create Budget", "Create Blank Budget", "Create EAC"];

    return options;
  };

  const getButtonAvailability = (plan, action) => {
    const options = getActionOptions(plan);
    return options.includes(action);
  };

  const isToggleAllowedForPlan = (plan, field) => {
    if (!plan || !plan.plType || !plan.version) return false;
    if (field === "isCompleted") return !plan.isApproved;
    if (field === "isApproved") return !!plan.isCompleted;
    if (field === "finalVersion") {
      if (!plan.isApproved) return false;
      // if it's already final, allow un-conclude
      if (plan.finalVersion) return true;
      // disallow setting final if another final exists for same projId and plType
      const anotherFinal = safePlans.find(
        (p) => p.plId !== plan.plId && p.plType === plan.plType && p.projId === plan.projId && p.finalVersion
      );
      return !anotherFinal;
    }
    return false;
  };

  const checkedFinalVersionIdx = (plans || []).findIndex((plan) => plan.finalVersion);

  const getCheckboxProps = (plan, col, idx) => {
    if (!plan.plType || !plan.version)
      return { checked: false, disabled: true };

    if (col === "isCompleted")
      return { checked: plan.isCompleted, disabled: !!plan.isApproved };

    if (col === "isApproved")
      return { checked: plan.isApproved, disabled: !plan.isCompleted };

    if (col === "finalVersion") {
      const anotherFinalVersionIdx = (plans || []).findIndex(
        (p, i) =>
          i !== idx &&
          p.plType === plan.plType &&
          p.projId === plan.projId &&
          p.finalVersion
      );

      return {
        checked: plan.finalVersion,
        disabled: anotherFinalVersionIdx !== -1,
      };
    }

    return { checked: plan[col], disabled: false };
  };

  // Determine aggregate toggle state for mass-selected rows
  const getMassToggleProps = (field) => {
    if (selectedRows.size === 0) return { disabled: true, label: "", title: "No rows selected" };
    const selected = safePlans.filter((p) => selectedRows.has(p.plId));
    if (!selected || selected.length === 0) return { disabled: true, label: "", title: "No valid plans selected" };

    // If any selected is concluded while others are not, disable all toggles
    const statuses = selected.map((p) => (p.status || "").toLowerCase());
    if (statuses.includes("concluded") && !statuses.every((s) => s === "concluded")) {
      return { disabled: true, label: "", title: "Mixed statuses (contains Concluded) - action disabled" };
    }

    if (field === "isCompleted") {
      const allTrue = selected.every((p) => !!p.isCompleted);
      const allFalse = selected.every((p) => !p.isCompleted);
      if (!allTrue && !allFalse) return { disabled: true, label: "", title: "Mixed submission states" };
      const allowed = selected.every((p) => isToggleAllowedForPlan(p, "isCompleted"));
      return {
        disabled: !allowed,
        label: allTrue ? "Unsubmit" : "Submit",
        title: allTrue ? "Unsubmit selected" : "Submit selected",
      };
    }

    if (field === "isApproved") {
      const allTrue = selected.every((p) => !!p.isApproved);
      const allFalse = selected.every((p) => !p.isApproved);
      if (!allTrue && !allFalse) return { disabled: true, label: "", title: "Mixed approval states" };
      const allowed = selected.every((p) => isToggleAllowedForPlan(p, "isApproved"));
      return {
        disabled: !allowed,
        label: allTrue ? "Unapprove" : "Approve",
        title: allTrue ? "Unapprove selected" : "Approve selected",
      };
    }

    if (field === "finalVersion") {
      const allTrue = selected.every((p) => !!p.finalVersion);
      const allFalse = selected.every((p) => !p.finalVersion);
      if (!allTrue && !allFalse) return { disabled: true, label: "", title: "Mixed final/conclude states" };
      const allowed = selected.every((p) => isToggleAllowedForPlan(p, "finalVersion"));
      return {
        disabled: !allowed,
        label: allTrue ? "Unconclude" : "Conclude",
        title: allTrue ? "Unconclude selected" : "Conclude selected",
      };
    }

    return { disabled: true, label: "", title: "Unsupported field" };
  };

  const handleTopButtonToggle = async (field) => {
    if (!selectedPlan) {
      toast.error(`No plan selected to update ${field}.`, {
        toastId: "no-plan-selected",
      });
      return;
    }
    const idx = (plans || []).findIndex((p) => p.plId === selectedPlan.plId);
    if (idx === -1) {
      toast.error(`Selected plan not found.`, { toastId: "plan-not-found" });
      return;
    }
    setIsActionLoading(true);
    await handleCheckboxChange(idx, field);
    setIsActionLoading(false);
  };

  const handleCalc = async () => {
    if (!selectedPlan) {
      toast.error("No plan selected for calculation.", {
        toastId: "no-plan-selected",
      });
      return;
    }
    if (!selectedPlan.plId || !selectedPlan.templateId) {
      toast.error(
        "Cannot calculate: Missing required parameters (planID or templateId).",
        {
          toastId: "missing-params",
        }
      );
      return;
    }
    setIsActionLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/Forecast/CalculateRevenueCost?planID=${selectedPlan.plId}&templateId=${selectedPlan.templateId}&type=actual`
      );
      const message =
        typeof response.data === "string"
          ? response.data
          : response.data?.message || "Revenue Calculation successful!";
      toast.success(message);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Error during calculation.";
      toast.error(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Mass action helpers - single implementation for both single and multi-plan actions
  // `targets` is optional array of plan objects to operate on; if omitted, uses selectedRows
  const handleMassAction = async (action, targets = null) => {
    const selected = Array.isArray(targets) && targets.length > 0 ? targets : safePlans.filter((p) => selectedRows.has(p.plId));

    if (!selected || selected.length === 0) {
      toast.error("No plans selected for mass action.", { toastId: "no-selected-mass" });
      return;
    }

    setIsActionLoading(true);
    try {
      // DELETE
      if (action === "Delete") {
        const results = [];
        for (const plan of selected) {
          if (!getButtonAvailability(plan, "Delete")) {
            results.push({ plan, ok: false, error: new Error("Not allowed") });
            continue;
          }
          try {
            await axios.delete(`${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`);
            results.push({ plan, ok: true });
          } catch (err) {
            results.push({ plan, ok: false, error: err });
          }
        }
        const failed = results.filter((r) => !r.ok);
        setPlans((prev) => prev.filter((p) => !selected.some((s) => s.plId === p.plId)));
        setSelectedRows(new Set());
        if (typeof onPlanSelect === "function") onPlanSelect(null);
        if (failed.length > 0) {
          toast.error(`${failed.length} plan(s) failed to delete.`);
        } else {
          toast.success("Selected plans deleted successfully.");
        }
        // refresh to ensure any project-level derived states are updated
        await refreshPlans();
        return;
      }

      // CREATE variations
      if (
        action === "Create Budget" ||
        action === "Create Blank Budget" ||
        action === "Create EAC" ||
        action === "Create NB BUD"
      ) {
        const results = [];
        for (const plan of selected) {
          if (!getButtonAvailability(plan, action)) {
            results.push({ plan, ok: false, error: new Error("Not allowed") });
            continue;
          }

          const actionProjId = fullProjectId.current || plan.projId || projectId || "";
          const payloadTemplate = {
            projId: plan.projId || actionProjId || "",
            plId: plan.plId || 0,
            plType:
              action === "Create NB BUD"
                ? "NBBUD"
                : action === "Create Budget" || action === "Create Blank Budget"
                ? "BUD"
                : "EAC",
            source: plan.source || "",
            type:
              typeof isChildProjectId === "function" && isChildProjectId(actionProjId)
                ? "SYSTEM"
                : plan.type || "",
            version: plan.version || 0,
            versionCode: plan.versionCode || "",
            finalVersion: false,
            isCompleted: false,
            isApproved: false,
            status: "In Progress",
            createdBy: plan.createdBy || "User",
            modifiedBy: plan.modifiedBy || "User",
            approvedBy: "",
            templateId: plan.templateId || 1,
            // fiscalYear: fiscalYear,
          };

          try {
            const response = await axios.post(
              `${backendUrl}/Project/AddProjectPlan?type=${action === "Create Blank Budget" ? "blank" : "actual"}`,
              payloadTemplate
            );
            results.push({ plan, ok: true, data: response.data });
          } catch (err) {
            results.push({ plan, ok: false, error: err });
          }
        }

        // Refresh to pick up newly created plans
        await refreshPlans();
        setSelectedRows(new Set());
        if (typeof onPlanSelect === "function") onPlanSelect(null);

        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          toast.error(`${failed.length} plan(s) failed during creation.`);
        } else {
          toast.success("Plans created successfully!");
        }

        // If single-target call and success, try to select created plan in UI
        if (Array.isArray(targets) && targets.length === 1 && results.length === 1 && results[0].ok) {
          // try to select the plan we just created
          const rawCreated = results[0].data || {};
          const normalizedPlan = {
            ...selected[0],
            ...rawCreated,
            plId: rawCreated.plId || rawCreated.id || selected[0].plId || 0,
            projId: rawCreated.fullProjectId || rawCreated.projId || rawCreated.projectId || selected[0].projId || "",
            projName: rawCreated.projName || selected[0].projName || "",
            plType: rawCreated.plType === "Budget" ? "BUD" : rawCreated.plType === "EAC" ? "EAC" : selected[0].plType,
            version: Number(rawCreated.version) || selected[0].version || 0,
          };
          // find in refreshed plans
          const newPlans = await refreshPlans(normalizedPlan.projId || normalizedPlan.projId);
          if (newPlans && newPlans.length > 0) {
            const planToSelect = newPlans.find((p) => p.plId === normalizedPlan.plId && p.projId === normalizedPlan.projId && p.plType === normalizedPlan.plType) || normalizedPlan;
            handleRowClick(planToSelect);
            if (typeof onPlanCreated === "function") onPlanCreated(planToSelect);
          }
        }

        return;
      }

      toast.info(`Mass action "${action}" is not implemented yet.`);
    } catch (err) {
      toast.error(`Error performing mass action: ${err.message || err}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMassDelete = async () => {
    if (selectedRows.size === 0) {
      toast.error("No plans selected to delete.", { toastId: "no-selected-delete" });
      return;
    }
    const selected = safePlans.filter((p) => selectedRows.has(p.plId));
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selected.length} selected plan(s)?`
    );
    if (!confirmed) return;

    setIsActionLoading(true);
    const results = [];
    try {
      for (const plan of selected) {
        if (!getButtonAvailability(plan, "Delete")) {
          results.push({ plan, ok: false, error: new Error("Not allowed") });
          continue;
        }
        try {
          await axios.delete(`${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`);
          results.push({ plan, ok: true });
        } catch (err) {
          results.push({ plan, ok: false, error: err });
        }
      }

      const failed = results.filter((r) => !r.ok);
      setPlans((prev) => prev.filter((p) => !selectedRows.has(p.plId)));
      setSelectedRows(new Set());
      if (typeof onPlanSelect === "function") onPlanSelect(null);
      if (failed.length > 0) {
        toast.error(`${failed.length} plan(s) failed to delete.`);
      } else {
        toast.success("Selected plans deleted successfully.");
      }
      // refresh to pick up any server-side side-effects
      await refreshPlans();
    } catch (err) {
      toast.error("Error deleting selected plans: " + (err.message || err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMassToggle = async (field) => {
    if (selectedRows.size === 0) return handleTopButtonToggle(field);
    setIsActionLoading(true);
    try {
      const selected = safePlans.filter((p) => selectedRows.has(p.plId));
      for (const plan of selected) {
        const idx = (plans || []).findIndex((p) => p.plId === plan.plId);
        if (idx !== -1) await handleCheckboxChange(idx, field, true);
      }
      // Refresh once after all updates to ensure consistent server-side state
    //   await refreshPlans();
      setSelectedRows(new Set());
      if (typeof onPlanSelect === "function") onPlanSelect(null);
    } catch (err) {
      toast.error("Error performing mass toggle: " + (err.message || err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMassCalc = async () => {
    if (selectedRows.size === 0) return handleCalc();
    setIsActionLoading(true);
    try {
      const selected = safePlans.filter((p) => selectedRows.has(p.plId));
      const results = [];
      for (const plan of selected) {
        if (!plan.plId || !plan.templateId) {
          results.push({ plan, ok: false, error: new Error("Missing params") });
          continue;
        }
        try {
          const response = await axios.get(
            `${backendUrl}/Forecast/CalculateRevenueCost?planID=${plan.plId}&templateId=${plan.templateId}&type=actual`
          );
          results.push({ plan, ok: true, data: response.data });
        } catch (err) {
          results.push({ plan, ok: false, error: err });
        }
      }

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} calculation(s) failed.`);
      } else {
        toast.success("Calculation(s) completed successfully.");
      }
      if (typeof onPlanSelect === "function") onPlanSelect(null);
    } catch (err) {
      toast.error("Error during mass calculation: " + (err.message || err));
    } finally {
      setIsActionLoading(false);
    }
  };

//   const getTopButtonDisabled = (field) => {
//     const currentPlan = getCurrentPlan();
//     if (!currentPlan || !currentPlan.plType || !currentPlan.version)
//       return true;
//     if (field === "isCompleted") return !!currentPlan.isApproved;
//     if (field === "isApproved") return !currentPlan.isCompleted;
//     if (field === "finalVersion") {
//       const anotherFinalVersionIdx = plans.findIndex(
//         (p) =>
//           p.plId !== currentPlan.plId &&
//           p.plType === currentPlan.plType &&
//           p.projId === currentPlan.projId &&
//           p.finalVersion
//       );
//       if (anotherFinalVersionIdx !== -1) return true;
//       return !currentPlan.isApproved;
//     }
//     return false;
//   };

// Returns the currently selected plan from local state, or null

const getCurrentPlan = () => {
  if (!selectedPlan) return null;
  return (
    safePlans.find(
      (p) => p.plId === selectedPlan.plId && p.projId === selectedPlan.projId
    ) || selectedPlan
  );
};


  const getCalcButtonDisabled = () => {
    return !selectedPlan || !selectedPlan.plId || !selectedPlan.templateId;
  };const getTopButtonDisabled = (field) => {
  const currentPlan = getCurrentPlan();
  if (!currentPlan || !currentPlan.plType || !currentPlan.version) return true;

  const status = (currentPlan.status || "").toLowerCase();
  const isConcluded = status === "concluded";

  // once concluded, no more submit/approve/conclude
  if (isConcluded) return true;

  if (field === "isCompleted") return !!currentPlan.isApproved;
  if (field === "isApproved") return !currentPlan.isCompleted;
  if (field === "finalVersion") {
    const anotherFinalVersionIdx = (plans || []).findIndex(
      (p) =>
        p.plId !== currentPlan.plId &&
        p.plType === currentPlan.plType &&
        p.projId === currentPlan.projId &&
        p.finalVersion
    );
    if (anotherFinalVersionIdx !== -1) return true;
    return !currentPlan.isApproved;
  }

  return false;
};


  const isAnyActionPerformed = (plansList, selectedProjId) => {
    if (!selectedProjId) return false;
    const selectedLevel = getProjectDotLevel(selectedProjId);
    return plansList.some(
      (plan) => !!plan.plType && plan.projId === selectedProjId
    );
  };

  const getMasterProjects = (plansList) => {
    return plansList.filter((plan) => {
      const projId = plan.projId?.trim();
      if (!projId) return false;
      return !projId.includes(".");
    });
  };

  const getMasterAndRelatedProjects = (plansList, clickedProjId) => {
    if (!clickedProjId)
      return { master: null, related: [], sameLevelBud: false };

    const parts = clickedProjId.split(".");
    const masterId = parts[0];
    const selectedLevel = parts.length;

    const filtered = plansList.filter(
      (p) => p.projId?.startsWith(masterId) && p.plType === "BUD"
    );

    const seen = new Set();
    const related = filtered
      .filter((p) => {
        if (seen.has(p.projId)) return false;
        seen.add(p.projId);
        return true;
      })
      .map((p) => ({
        ...p,
        level: p.projId.split(".").length,
      }));

    if (related.length === 0) {
      return { master: masterId, related, selectedLevel, sameLevelBud: true };
    }

    const sameLevelBud = related.some((r) => r.level === selectedLevel);

    return { master: masterId, related, selectedLevel, sameLevelBud };
  };


const fetchAllPlans = async () => {
  setLoading(true);
  try {
    // Note: We call the base GetProjectPlans for the mass utility view
    // const response = await axios.get(`${backendUrl}/Project/GetAllPlans`);
    const response = await axios.get(`${backendUrl}/Project/GetAllPlans`, {
      params: {
        search: searchQuery || "",         // Maps to backend 'search'
        type: typeFilter === "All" ? "" : typeFilter,       // Maps to backend 'type' (BUD/EAC)
        status: statusFilter === "All" ? "" : statusFilter, // Maps to backend 'status'
        active: versionFilter === "All" ? "" : (versionFilter === "Active" ? "Y" : "N")
      }
    }); 
    if (response.data) {
      const transformed = response.data.map(p => ({
        ...p,
        plId: p.plId || p.id,
        // Ensure status mapping consistency for the filter
        status: (p.status || "In Progress")
          .replace("Working", "In Progress")
          .replace("Completed", "Submitted")
      }));
      setPlans(transformed);
    //   toast.success("");
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to load project plans.");
  } finally {
    setLoading(false);
  }
};

// Auto-fetch plans when filters change or on mount
// useEffect(() => {
//   fetchAllPlans();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [searchQuery, typeFilter, statusFilter, versionFilter]);

// 2. Use the same function for initial load
// useEffect(() => {
//   fetchAllPlans();
// }, []);
//   useEffect(() => {
//     const fetchAllPlans = async () => {
//       setLoading(true);
//       try {
//         const response = await axios.get(`${backendUrl}/Project/GetAllPlans`);
//         if (response.data) {
//           const transformed = response.data.map(p => ({
//             ...p,
//             plId: p.plId || p.id
//           }));
//           setPlans(transformed);
//         }
//       } catch (err) {
//         toast.error("Failed to load project plans.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllPlans();
//   }, []);

  // Memoized Filtered Plans (includes new version filter)
 const filteredPlans = useMemo(() => {
  const safePlans = Array.isArray(plans) ? plans : [];

  const latestMap = {};
  if (versionFilter === "Latest") {
    for (const p of safePlans) {
      const key = `${p.projId}::${p.plType}`;
      const ver = Number(p.version) || 0;
      if (!latestMap[key] || ver > latestMap[key]) latestMap[key] = ver;
    }
  }

  return safePlans.filter((plan) => {
    const matchesSearch =
      !searchQuery ||
      plan.projId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.projName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "All" || plan.plType === typeFilter;
    const matchesStatus = statusFilter === "All" || plan.status === statusFilter;

    let matchesVersion = true;
    if (versionFilter === "Final") matchesVersion = !!plan.finalVersion;
    else if (versionFilter === "Latest") {
      const key = `${plan.projId}::${plan.plType}`;
      const ver = Number(plan.version) || 0;
      matchesVersion = latestMap[key] === ver;
    }

    return matchesSearch && matchesType && matchesStatus && matchesVersion;
  });
}, [plans, searchQuery, typeFilter, statusFilter, versionFilter]);


  const getRowKey = (p) =>
  `${p.projId || ""}::${p.plType || ""}::${p.version || ""}::${p.versionCode || ""}`;

  // FIXED: Select All Logic

  const safeFiltered = Array.isArray(filteredPlans) ? filteredPlans : [];

    // Ensure we always operate on an array to avoid runtime errors when `plans` is null/undefined
    // const safePlans = Array.isArray(plans) ? plans : [];
const isAllSelected =
  safeFiltered.length > 0 &&
  safeFiltered.every((p) => selectedRows.has(p.plId));
  
  const toggleSelectAll = () => {
    const newSelection = new Set(selectedRows);
    if (isAllSelected) {
      safeFiltered.forEach(p => newSelection.delete(p.plId));
    } else {
      safeFiltered.forEach(p => newSelection.add(p.plId));
    }
    setSelectedRows(newSelection);
    // Clear single plan selection when toggling multiple selections
    if (typeof onPlanSelect === "function") onPlanSelect(null);
  };

  const toggleRowSelection = (plan) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(plan.plId)) {
      newSelection.delete(plan.plId);
    } else {
      newSelection.add(plan.plId);
    }
    setSelectedRows(newSelection);
    if (typeof onPlanSelect === "function") onPlanSelect(newSelection.has(plan.plId) ? plan : null);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("All");
    setStatusFilter("All");
    setVersionFilter("All")
  };

  return (
    <div className="w-full min-h-screen">
      {/* FILTER & ACTION SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Filter size={20} className="text-blue-600" /> Update Multiple Projects
          </h2>
          
        </div>
        
         
            <div className="p-5 space-y-3">
  {/* Row 1: filters */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Search */}
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase">
        Search Project
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="ID or Name..."
          className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>

    {/* Plan Type */}
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase">
        Plan Type (BUD/EAC)
      </label>
      <select
        className="border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        <option value="All">All Types</option>
        <option value="BUD">BUD</option>
        <option value="EAC">EAC</option>
      </select>
    </div>

    {/* Status */}
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase">
        Status
      </label>
      <select
        className="border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="All">All Statuses</option>
        <option value="In Progress">In Progress</option>
        <option value="Submitted">Submitted</option>
        <option value="Approved">Approved</option>
        <option value="Concluded">Concluded</option>
      </select>
    </div>

    {/* Version */}
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase">
        Version
      </label>
      <select
        className="border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        value={versionFilter}
        onChange={(e) => setVersionFilter(e.target.value)}
      >
        <option value="All">All</option>
        <option value="Latest">Latest</option>
        <option value="Final">Final</option>
      </select>
    </div>
  </div>

  {/* Row 2: Clear + Fetch aligned right, small width */}
  <div className="flex justify-end gap-2">
    <button
      onClick={resetFilters}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
    >
      <X size={14} />
      Clear All
    </button>

    <button
      onClick={fetchAllPlans}
      disabled={loading}
      // className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
      className="btn1 btn-blue hover:btn-blue disabled:btn-blue "
    >
      {loading ? "Loading..." : "Fetch Plans"}
    </button>
  </div>
</div>


        {/* MASS ACTIONS BAR */}
        {selectedRows.size > 0 && (
          <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
            {/* <span className="text-sm font-bold text-blue-700">{selectedRows.size} Projects Selected</span> */}
            <div className="flex justify-between items-center mb-2 gap-1">
            <div className="flex gap-1 flex-wrap items-center ">
            {safePlans.length >= 0 && (
              <>
                <button
                    onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassAction("Create Budget");
                    else
                      await handleActionSelect(
                        safePlans.findIndex((p) => p.plId === selectedPlan?.plId),
                        "Create Budget"
                      );
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                    (selectedRows.size > 0 &&
                      !Array.from(selectedRows)
                        .map((id) => safePlans.find((p) => p.plId === id))
                        .some((p) => p && getButtonAvailability(p, "Create Budget"))) ||
                    (selectedRows.size === 0 &&
                      (!selectedPlan || !getButtonAvailability(selectedPlan, "Create Budget")))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? !Array.from(selectedRows)
                          .map((id) => safePlans.find((p) => p.plId === id))
                          .some((p) => p && getButtonAvailability(p, "Create Budget"))
                        ? "btn-disabled"
                        : "btn-blue"
                      : !selectedPlan || !getButtonAvailability(selectedPlan, "Create Budget")
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create Budget"
                >
                  New Budget
                </button>

                <button
                    onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassAction("Create Blank Budget");
                    else
                      await handleActionSelect(
                        safePlans.findIndex((p) => p.plId === selectedPlan?.plId),
                        "Create Blank Budget"
                      );
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                      (selectedRows.size > 0 &&
                      !Array.from(selectedRows)
                        .map((id) => safePlans.find((p) => p.plId === id))
                        .some((p) => p && getButtonAvailability(p, "Create Blank Budget"))) ||
                    (selectedRows.size === 0 &&
                      (!selectedPlan || !getButtonAvailability(selectedPlan, "Create Blank Budget")))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? !Array.from(selectedRows)
                          .map((id) => safePlans.find((p) => p.plId === id))
                          .some((p) => p && getButtonAvailability(p, "Create Blank Budget"))
                        ? "btn-disabled"
                        : "btn-blue"
                      : !selectedPlan || !getButtonAvailability(selectedPlan, "Create Blank Budget")
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create Blank Budget"
                >
                  New Blank Budget
                </button>

                <button
                    onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassAction("Create EAC");
                    else
                      await handleActionSelect(
                        safePlans.findIndex((p) => p.plId === selectedPlan?.plId),
                        "Create EAC"
                      );
                    setIsActionLoading(false);
                  }}
                    disabled={
                      isActionLoading ||
                    (selectedRows.size > 0 &&
                      !Array.from(selectedRows)
                        .map((id) => safePlans.find((p) => p.plId === id))
                        .some((p) => p && getButtonAvailability(p, "Create EAC"))) ||
                    (selectedRows.size === 0 &&
                      (!selectedPlan || !getButtonAvailability(selectedPlan, "Create EAC")))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? !Array.from(selectedRows)
                          .map((id) => safePlans.find((p) => p.plId === id))
                          .some((p) => p && getButtonAvailability(p, "Create EAC"))
                        ? "btn-disabled"
                        : "btn-blue"
                      : !selectedPlan || !getButtonAvailability(selectedPlan, "Create EAC")
                      ? "btn-disabled"
                      : "btn-blue"
                  }`}
                  title="Create EAC"
                >
                  New EAC
                </button>

                {selectedPlan && selectedPlan.plType === "NBBUD" && (
                  <button
                    onClick={() => {
                      setIsActionLoading(true);
                      handleActionSelect(
                        safePlans.findIndex((p) => p.plId === selectedPlan?.plId),
                        "Create NB BUD"
                      );
                    }}
                    className="btn1 btn-blue"
                    title="Create BUD"
                  >
                    CREATE NB BUD
                  </button>
                )}

                <button
                    onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassDelete();
                    else
                      await handleActionSelect(
                        safePlans.findIndex((p) => p.plId === selectedPlan?.plId),
                        "Delete"
                      );
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                    (selectedRows.size > 0 &&
                      !Array.from(selectedRows)
                        .map((id) => safePlans.find((p) => p.plId === id))
                        .some((p) => p && getButtonAvailability(p, "Delete") && !p.isApproved && getMasterAndRelatedProjects(safePlans, p.projId).sameLevelBud)) ||
                    (selectedRows.size === 0 && (
                      !selectedPlan ||
                      selectedPlan.isApproved ||
                      !getButtonAvailability(selectedPlan, "Delete") ||
                      !getMasterAndRelatedProjects(safePlans, selectedPlan?.projId).sameLevelBud
                    ))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? !Array.from(selectedRows)
                          .map((id) => safePlans.find((p) => p.plId === id))
                          .some((p) => p && getButtonAvailability(p, "Delete") && !p.isApproved && getMasterAndRelatedProjects(safePlans, p.projId).sameLevelBud)
                        ? "btn-disabled"
                        : "btn-red"
                      : !selectedPlan || selectedPlan.isApproved || !getButtonAvailability(selectedPlan, "Delete") || !getMasterAndRelatedProjects(safePlans, selectedPlan?.projId).sameLevelBud
                      ? "btn-disabled"
                      : "btn-red"
                  }`}
                  title="Delete Selected Plan"
                >
                  Delete
                </button>

                <button
                  onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassToggle("isCompleted");
                    else await handleTopButtonToggle("isCompleted");
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                    (selectedRows.size > 0 && getMassToggleProps("isCompleted").disabled) ||
                    (selectedRows.size === 0 && (getTopButtonDisabled("isCompleted") || isActionLoading))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? getMassToggleProps("isCompleted").disabled
                        ? "btn-disabled"
                        : getMassToggleProps("isCompleted").label === "Unsubmit"
                        ? "btn-orange"
                        : "btn-blue"
                      : getTopButtonDisabled("isCompleted") || isActionLoading
                      ? "btn-disabled"
                      : getCurrentPlan()?.status === "Submitted"
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    selectedRows.size > 0
                      ? getMassToggleProps("isCompleted").title
                      : getCurrentPlan()?.status === "Submitted"
                      ? "Unsubmit"
                      : "Submit"
                  }
                >
                  {  selectedRows.size > 0
                    ? getMassToggleProps("isCompleted").label || "Submit"
                    : getCurrentPlan()?.status === "Submitted"
                    ? "Unsubmit"
                    : "Submit"}
                </button>
 
                <button
                  onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassToggle("isApproved");
                    else await handleTopButtonToggle("isApproved");
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                    (selectedRows.size > 0 && getMassToggleProps("isApproved").disabled) ||
                    (selectedRows.size === 0 && (getTopButtonDisabled("isApproved") || isActionLoading))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? getMassToggleProps("isApproved").disabled
                        ? "btn-disabled"
                        : getMassToggleProps("isApproved").label === "Unapprove"
                        ? "btn-orange"
                        : "btn-blue"
                      : getTopButtonDisabled("isApproved") || isActionLoading
                      ? "btn-disabled"
                      : getCurrentPlan()?.status === "Approved" || getCurrentPlan()?.finalVersion
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    selectedRows.size > 0
                      ? getMassToggleProps("isApproved").title
                      : getCurrentPlan()?.status === "Approved"
                      ? "Unapprove"
                      : "Approve"
                  }
                >
                  {  selectedRows.size > 0
                    ? getMassToggleProps("isApproved").label || "Approve"
                    : getCurrentPlan()?.status === "Approved" || getCurrentPlan()?.finalVersion
                    ? "Unapprove"
                    : "Approve"}
                </button>

                <button
                  onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassToggle("finalVersion");
                    else await handleTopButtonToggle("finalVersion");
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                    (selectedRows.size > 0 && getMassToggleProps("finalVersion").disabled) ||
                    (selectedRows.size === 0 && (getTopButtonDisabled("finalVersion") || isActionLoading))
                  }
                  className={`btn1 ${
                    selectedRows.size > 0
                      ? getMassToggleProps("finalVersion").disabled
                        ? "btn-disabled"
                        : getMassToggleProps("finalVersion").label === "Unconclude"
                        ? "btn-orange"
                        : "btn-blue"
                      : getTopButtonDisabled("finalVersion") || isActionLoading
                      ? "btn-disabled"
                      : getCurrentPlan()?.finalVersion
                      ? "btn-orange"
                      : "btn-blue"
                  }`}
                  title={
                    selectedRows.size > 0
                      ? getMassToggleProps("finalVersion").title
                      : getCurrentPlan()?.finalVersion
                      ? "Unconclude"
                      : "Conclude"
                  }
                >
                  {selectedRows.size > 0
                    ? getMassToggleProps("finalVersion").label || "Conclude"
                    : getCurrentPlan()?.finalVersion
                    ? "Unconclude"
                    : "Conclude"}
                </button>

                <button
                  onClick={async () => {
                    setIsActionLoading(true);
                    if (selectedRows.size > 0) await handleMassCalc();
                    else await handleCalc();
                    setIsActionLoading(false);
                  }}
                  disabled={
                    isActionLoading ||
                    (selectedRows.size > 0 &&
                      !Array.from(selectedRows)
                        .map((id) => safePlans.find((p) => p.plId === id))
                        .some((p) => p && p.plId && p.templateId)) ||
                    (selectedRows.size === 0 && getCalcButtonDisabled())
                  }
                  className={`btn1 ${(selectedRows.size > 0 && !Array.from(selectedRows)
                      .map((id) => safePlans.find((p) => p.plId === id))
                      .some((p) => p && p.plId && p.templateId)) || getCalcButtonDisabled() ? "btn-disabled" : "btn-blue"}`}
                  title="Calculate"
                >
                  Calc
                </button>

                {/* <button
                  onClick={() => setBudEacFilter(!budEacFilter)}
                  className={`btn1 ${budEacFilter ? "btn-orange" : "btn-blue"}`}
                  title={
                    budEacFilter ? "Show All Plans" : "Filter BUD/EAC Plans"
                  }
                >
                  {budEacFilter ? "Show All" : "BUD/EAC"}
                </button>

                <button
                  onClick={() => setShowNewBusinessPopup(true)}
                  className="btn1 btn-green"
                  title="New Business"
                >
                  New Business
                </button> */}

                {/* <button
  onClick={handleSaveDatesClick}
  disabled={isActionLoading || !selectedPlan}
  className={`btn1 ${
    isActionLoading || !selectedPlan ? "btn-disabled" : "btn-blue"
  }`}
  title="Save Project Dates"
>
  Save Dates
</button> */}

{/* Replace the current input block with this */}
{/* <div  className="flex flex-col items-end gap-1">
  <div className="flex items-center gap-2">
    <button className="px-4 py-1 bg-blue-700 text-white text-xs font-bold rounded">
      VERSION CODE
    </button>
   <button 
  onClick={handleSaveVersionCodeClick}
  className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-700"
>
  SAVE
</button>
  </div>
  <input 
    type="text" 
    className="mt-1 w-30 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    value={versionCodeInput}
    onChange={(e) => setVersionCodeInput(e.target.value)}
  />
</div> */}
<div className="flex flex-col items-end gap-1">
    <div className="flex items-center gap-1">
  <button className="px-2 py-1 text-black text-xs font-bold rounded">
    VERSION CODE:
  </button>

  <input
    type="text"
    className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    value={versionCodeInput}
    onChange={(e) => setVersionCodeInput(e.target.value)}
  />

  {/* <button
    onClick={handleSaveVersionCodeClick}
    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
  >
    SAVE
  </button> */}
</div>

  </div>

  <div className="flex items-center gap-2">
  <label className="text-xs font-bold text-gray-500 uppercase">
    Project Dates
  </label>

  <input
    type="date"
    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    value={headerStartDate}
    onChange={(e) => setHeaderStartDate(e.target.value)}
  />

  <span className="text-xs text-gray-500">to</span>

  <input
    type="date"
    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    value={headerEndDate}
    onChange={(e) => setHeaderEndDate(e.target.value)}
  />

  {/* <button
    onClick={handleSaveHeaderDatesClick}
    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
  >
    SAVE
  </button> */}
</div>
<div className="flex items-center gap-2">
  <span className="text-xs font-bold text-gray-500 uppercase">
    Template
  </span>

  <select
    value={headerTemplateId}
    onChange={(e) => setHeaderTemplateId(Number(e.target.value) || 0)}
     disabled={selectedPlan?.status !== "In Progress"}
     className={`border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 ${
      selectedPlan?.status !== "In Progress" ? "cursor-not-allowed" : ""
    }`}
  >
    <option value={0}>Select</option>
    {templates.map((t) => (
      <option key={t.id} value={t.id}>
        {t.templateCode}
      </option>
    ))}
  </select>

  {/* <button
    onClick={handleSaveHeaderTemplateClick}
    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
  >
    SAVE
  </button> */}
</div>

<button
  onClick={handleHeaderSaveAll}
  className="px-4 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
>
  SAVE
</button>

              </>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* <div className="flex items-center gap-1">
              <label
                htmlFor="fiscalYear"
                className="font-semibold text-xs whitespace-nowrap"
              >
                Fiscal Year:
              </label>
              <select
                id="fiscalYear"
                // value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={fiscalYearOptions?.length === 0}
              >
                {fiscalYearOptions?.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>
          </div>
        )}
      </div>

      {/* ADJUSTABLE TABLE CONTAINER */}
     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto max-h-[70vh]">
    <table className="w-full text-left table-auto border-collapse">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 w-10">
            <input
              type="checkbox"
              className="th-thead"
              checked={isAllSelected}
              onChange={toggleSelectAll}
            />
          </th>
         {Object.entries(COLUMN_LABELS).map(([key, label]) => {
      if (key === "selection") return null

      const isLeftCol = key === "projName" || key === "projId"

      return (
        <th
          key={key}
          className={
            "th-thead capitalize " + (isLeftCol ? "text-left" : "text-center")
          }
        >
          {label}
        </th>
      )
    })}
        </tr>
      </thead>

      <tbody className="tbody">
        {/* Global processing state */}
        {isActionLoading && (
          <tr>
            <td colSpan={11} className="py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="ml-2 text-sm text-gray-700">
                  Processing...
                </span>
              </div>
            </td>
          </tr>
        )}

        {/* Loading state */}
        {!isActionLoading && loading && (
          <tr>
            <td
              colSpan={11}
              className="text-center py-20 text-gray-400 animate-pulse"
            >
              Loading mass project data...
            </td>
          </tr>
        )}

        {/* Empty state */}
        {!isActionLoading && !loading && filteredPlans.length === 0 && (
          <tr>
            <td
              colSpan={11}
              className="text-center py-20 text-gray-400 font-medium"
            >
              No projects found. Try adjusting your filters.
            </td>
          </tr>
        )}

        {/* Data rows */}
        {!isActionLoading &&
          !loading &&
          filteredPlans.length > 0 &&
          filteredPlans.map((plan) => (
            <tr
              key={plan.plId}
              className={`transition-colors duration-150 ${
                selectedRows.has(plan.plId)
                  ? "bg-blue-50/40"
                  : "hover:bg-gray-50/80"
              }`}
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  className="h-3 px-4 py-1 text-gray-700"
                  checked={selectedRows.has(plan.plId)}
                  onChange={() => toggleRowSelection(plan)}
                />
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700">
                {plan.projId}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700">
                {plan.projName}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {plan.plType}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {plan.version}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {plan.versionCode}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {plan.source}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {getTemplateName(plan.templateId || 0)}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-[12px] capitalize tracking-tighter
                  ${
                    plan.status === "Approved"
                      ? "bg-green-100 text-black"
                      : plan.status === "In Progress"
                      ? "bg-red-100 text-black"
                      : plan.status === "Concluded"
                      ? "bg-blue-200 text-black"
                      : plan.status === "Submitted"
                      ? "bg-yellow-100 text-black"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {plan.status}
                </span>
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {formatDate(plan.projStartDt)}
              </td>
              <td className="text-xs h-1 px-1 py-1 text-gray-700 text-center">
                {formatDate(plan.projEndDt)}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
};

export default MassUtilityProject;