import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" }, 
  { key: 'orgId', label: 'Org Id' },        
  { key: 'orgName', label: 'Org Name' },
  // { key: "orgId", label: "Organization" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
];

export const AMOUNTS_EMPLOYEE_COLUMNS = [
  { key: "idType",   label: "ID Type" },
  { key: "emplId",   label: "ID" },
  { key: "name",     label: "Name" },
  { key: "acctId",   label: "Account" },
  { key: "acctName", label: "Account Name" },
  { key: "orgId",    label: "Organization" },
  { key: "isRev",    label: "Rev" },
  { key: "isBrd",    label: "Brd" },
  { key: "status",   label: "Status" },
  { key: "total",    label: "Total" },
];


const ID_TYPE_OPTIONS = [
  { value: "", label: "Select ID Type" },
  { value: "Employee", label: "Employee" },
  { value: "Vendor", label: "Vendor" },
  { value: "Vendor Employee", label: "Vendor Employee" },
  { value: "Other", label: "Other" },
];

const ROW_HEIGHT_DEFAULT = 48;

// function isMonthEditable(duration, closedPeriod, planType) {
//   if (planType !== "EAC") return true;
//   if (!closedPeriod) return true;
//   const closedDate = new Date(closedPeriod);
//   if (isNaN(closedDate)) return true;
//   const durationDate = new Date(duration.year, duration.monthNo - 1, 1);
//   const closedMonth = closedDate.getMonth();
//   const closedYear = closedDate.getFullYear();
//   const durationMonth = durationDate.getMonth();
//   const durationYear = durationDate.getFullYear();
//   return (
//     durationYear > closedYear ||
//     (durationYear === closedYear && durationMonth >= closedMonth)
//   );
// }

const ProjectAmountsTable = ({
  initialData,
  startDate,
  endDate,
  planType,
  templateId,
  fiscalYear: propFiscalYear,
  onSaveSuccess,
  refreshKey,
  onColumnTotalsChange,
}) => {
  // Normalize fiscal year - add after component definition
  const normalizedFiscalYear =
    propFiscalYear === "All" || !propFiscalYear
      ? "All"
      : String(propFiscalYear).trim();

  const [employees, setEmployees] = useState([]);
  const [durations, setDurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [replaceScope, setReplaceScope] = useState("all");
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedColumnKey, setSelectedColumnKey] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    id: "",
    firstName: "",
    lastName: "",
    isRev: false,
    isBrd: false,
    idType: "",
    acctId: "",
    orgId: "",
    perHourRate: "",
    status: "Act",
  });
  const [newEntryPeriodAmounts, setNewEntryPeriodAmounts] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState("");
  const [hiddenRows, setHiddenRows] = useState({});
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [nonLaborAccounts, setNonLaborAccounts] = useState([]);
  const [otherDirectCostNonLaborAccounts, setOtherDirectCostNonLaborAccounts] =
    useState([]);
  const [showFillValues, setShowFillValues] = useState(false);
  const [fillAmounts, setFillAmounts] = useState("");
  const [fillStartDate, setFillStartDate] = useState(startDate);
  const [fillEndDate, setFillEndDate] = useState(endDate);

  const [fillMethod, setFillMethod] = useState("None");
  const [sourceRowIndex, setSourceRowIndex] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});
  const [idError, setIdError] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null); // dctId of selected employee
  const [localEmployees, setLocalEmployees] = useState([]);
  const [employeeNonLaborAccounts, setEmployeeNonLaborAccounts] = useState([]);
  const [subContractorNonLaborAccounts, setSubContractorNonLaborAccounts] =
    useState([]);
  const [accountOptionsWithNames, setAccountOptionsWithNames] = useState([]);
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [modifiedAmounts, setModifiedAmounts] = useState({});
  const [hasUnsavedAmountChanges, setHasUnsavedAmountChanges] = useState(false);

  const [selectedSourceIdx, setSelectedSourceIdx] = useState("");

  // Add after existing state declarations around line 88
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [hasUnsavedFieldChanges, setHasUnsavedFieldChanges] = useState(false);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState(new Set());


  // Copy-paste functionality states
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [hasClipboardData, setHasClipboardData] = useState(false);
  const [copiedRowsData, setCopiedRowsData] = useState([]);
  const [newEntries, setNewEntries] = useState([]);
  const [newEntryPeriodAmountsArray, setNewEntryPeriodAmountsArray] = useState(
    []
  );
  const [copiedMonthMetadata, setCopiedMonthMetadata] = useState([]);
  const [pastedEntrySuggestions, setPastedEntrySuggestions] = useState({});
  const [pastedEntryAccounts, setPastedEntryAccounts] = useState({});
  const [pastedEntryOrgs, setPastedEntryOrgs] = useState({});
  const isPastingRef = useRef(false);

  const isSilentRefreshing = useRef(false);

  const [findMatches, setFindMatches] = useState([]);
  const [showFindOnly, setShowFindOnly] = useState(false);

  // Add these after pastedEntryOrgs state
  const [cachedProjectData, setCachedProjectData] = useState(null);
  const [cachedOrgData, setCachedOrgData] = useState(null);
  // const [allowClosedPeriodEdit, setAllowClosedPeriodEdit] = useState(false);
  const [isClosedPeriodEditable, setIsClosedPeriodEditable] = useState(false);
const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

const sortedEmployees = useMemo(() => {
  if (!sortConfig.key) return employees;

  const sorted = [...employees];

  if (sortConfig.key === "acctId") {
    sorted.sort((a, b) => {
      const aVal = (a.emple?.accId ?? "").toString().toLowerCase();
      const bVal = (b.emple?.accId ?? "").toString().toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return sorted;
}, [employees, sortConfig]);


const handleSort = (key) => {
  setSortConfig((prev) => {
    if (prev.key === key) {
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    }
    return { key, direction: "asc" };
  });
};

const getSortIcon = (key) => {
  if (sortConfig.key !== key) return "↕";
  return sortConfig.direction === "asc" ? "↑" : "↓";
};


  //  const isFormOpened = useRef(false);

  const isInitialRender = useRef(true);

  const isEditable = initialData.status === "In Progress";
  const planId = initialData.plId;
  const projectId = initialData.projId;
  const closedPeriod = initialData.closedPeriod;
  const isBudPlan =
    (planType && planType.toUpperCase() === "BUD") ||
    planType?.toUpperCase() === "NBBUD";
  const isFieldEditable =
    planType && ["BUD", "NBBUD", "EAC"].includes(planType.toUpperCase());
  // const isEAC = planType && planType.toUpperCase() === "EAC";
  // const shouldDisableDelete = isEAC || !isEditable;  // ADD THIS LINE
  const isEAC = planType && planType.toUpperCase() === "EAC";
  //  Add this new constant
  const shouldHideButtons =
    isEAC &&
    ["SUBMITTED", "APPROVED", "CONCLUDED"].includes(
      initialData.status?.toUpperCase()
    );
  const shouldDisableDelete =
    isEAC && initialData.status?.toUpperCase() === "IN PROGRESS";
  const firstTableRef = useRef(null);
  const secondTableRef = useRef(null);
  const scrollingLock = useRef(false);

  const [maxKbdSuffix, setMaxKbdSuffix] = useState(0);

  // Add after line 143, after normalizedFiscalYear declaration
  const shouldShowCTD = () => {
    if (normalizedFiscalYear === "All") return false;

    const selectedYear = parseInt(normalizedFiscalYear);
    const startYear = parseInt(startDate.split("-")[0]);

    // Don't show CTD if selected year is the Start Date year
    if (selectedYear === startYear) return false;

    // Show CTD only if selected year is at least 2 years after start year
    return selectedYear >= startYear + 2;
  };

  const shouldShowPriorYear = () => {
    if (normalizedFiscalYear === "All") return false;

    const selectedYear = parseInt(normalizedFiscalYear);
    const startYear = parseInt(startDate.split("-")[0]);

    // Don't show Prior Year if selected year is the Start Date year
    if (selectedYear === startYear) return false;

    // Show Prior Year for ANY year after start year
    return selectedYear > startYear;
  };

  const sortedDurations = useMemo(() => {
    return [...durations]
      .filter((d) => {
        if (normalizedFiscalYear === "All") return true;
        return d.year === parseInt(normalizedFiscalYear);
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });
  }, [durations, normalizedFiscalYear]);

  const getMonthAmounts = (emp) => {
    const monthAmounts = {};
    if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
      emp.emple.plForecasts.forEach((forecast) => {
        const uniqueKey = `${forecast.month}_${forecast.year}`;
        // Use actualhours for EAC, forecastedhours otherwise
        const value =
          planType === "EAC" && forecast.actualamt !== undefined
            ? forecast.actualamt
            : forecast.forecastedamt ?? 0;
        monthAmounts[uniqueKey] = { value, ...forecast };
      });
    }
    return monthAmounts;
  };

  const columnTotals = useMemo(() => {
    const totals = {};

    let ctdTotal = 0;
    let priorYearTotal = 0;

    const currentFiscalYear =
      normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
    const startYear = startDate ? parseInt(startDate.split("-")[0]) : null;

    // Calculate CTD and Prior Year from ALL durations (use all, not filtered)
    if (currentFiscalYear && startYear) {
      durations.forEach((duration) => {
        let total = 0;
        const uniqueKey = `${duration.monthNo}_${duration.year}`;

        // Sum amounts from existing employees
        employees.forEach((emp, idx) => {
          if (hiddenRows[idx]) return;
          const inputValue = inputValues[`${idx}_${uniqueKey}`];
          const monthAmounts = getMonthAmounts(emp);
          const forecastValue = monthAmounts[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue;
          total += value && !isNaN(value) ? Number(value) : 0;
        });

        // Add amounts from new entry forms
        newEntries.forEach((entry, entryIndex) => {
          const newEntryValue =
            newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
          total +=
            newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
        });

        // Prior Year: sum of (selected fiscal year - 1)
        if (duration.year === currentFiscalYear - 1) {
          priorYearTotal += total;
        }

        // CTD: sum from start year to (selected fiscal year - 2)
        if (
          duration.year >= startYear &&
          duration.year <= currentFiscalYear - 2
        ) {
          ctdTotal += total;
        }
      });
    }

    // Calculate monthly totals for visible columns (filtered by fiscal year)
    sortedDurations.forEach((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      let total = 0;

      // Sum amounts from existing employees
      employees.forEach((emp, idx) => {
        if (hiddenRows[idx]) return;
        const inputValue = inputValues[`${idx}_${uniqueKey}`];
        const monthAmounts = getMonthAmounts(emp);
        const forecastValue = monthAmounts[uniqueKey]?.value;
        const value =
          inputValue !== undefined && inputValue !== ""
            ? inputValue
            : forecastValue;
        total += value && !isNaN(value) ? Number(value) : 0;
      });

      // Add amounts from new entry forms
      newEntries.forEach((entry, entryIndex) => {
        const newEntryValue =
          newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
        total +=
          newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
      });

      totals[uniqueKey] = total;
    });

    totals["ctd"] = ctdTotal;
    totals["priorYear"] = priorYearTotal;

    return totals;
  }, [
    durations,
    employees,
    inputValues,
    hiddenRows,
    newEntries,
    newEntryPeriodAmountsArray,
    sortedDurations,
    normalizedFiscalYear,
    startDate,
  ]);

  useEffect(() => {
  if (typeof onColumnTotalsChange === "function") {
    onColumnTotalsChange(columnTotals);
  }
}, [columnTotals, onColumnTotalsChange]);

  useEffect(() => {
    setCachedProjectData(null);
    setCachedOrgData(null);
  }, [projectId, planType]);

  useEffect(() => {
    setFillStartDate(startDate);
    setFillEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const existingKbdIds =
      employees
        ?.map((emp) => emp.emple?.emplId)
        .filter((id) => id && id.startsWith("KBD")) || [];

    const suffixes = existingKbdIds.map((id) => {
      const match = id.match(/^KBD(\d{3})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxSuffix = suffixes.length ? Math.max(...suffixes) : 0;
    setMaxKbdSuffix(maxSuffix);
  }, [employees]); // ✅ Only depends on employees

  // 2. Generate ID only when idType changes to "Other"
  useEffect(() => {
    if (newEntry.idType === "Other") {
      // Check if needs new ID
      const needsNewId =
        !newEntry.id || newEntry.id === "" || !/^KBD\d{3}$/.test(newEntry.id);

      if (needsNewId) {
        const newId = `KBD${String(maxKbdSuffix + 1).padStart(3, "0")}`;
        setNewEntry((prev) => ({
          ...prev,
          id: newId,
          status: "ACT",
        }));
      } else {
        // Just ensure status is ACT
        setNewEntry((prev) => ({
          ...prev,
          status: "ACT",
        }));
      }
    }
  }, [newEntry.idType]); // ✅ Only depends on idType - NO maxKbdSuffix!

  useEffect(() => {
    setShowNewForm(false);
    setNewEntry({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: "",
      acctId: "",
      orgId: "",
      perHourRate: "",
      status: "Act",
    });
    setNewEntryPeriodAmounts({});
    setEmployeeSuggestions([]);
    setEmployeeNonLaborAccounts([]);
    setSubContractorNonLaborAccounts([]);
  }, [planId, projectId]); // Reset when planId or projectId changes

  useEffect(() => {
    const initializeAccountNames = async () => {
      if (!projectId || !planType) return;

      try {
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
        );
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        let allAccountsWithNames = [];

        // Employee Accounts
        if (
          data.employeeNonLaborAccounts &&
          Array.isArray(data.employeeNonLaborAccounts)
        ) {
          const employeeAccountsWithNames = data.employeeNonLaborAccounts.map(
            (account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            })
          );
          allAccountsWithNames.push(...employeeAccountsWithNames);
        }

        // SubContractor Accounts
        if (
          data.subContractorNonLaborAccounts &&
          Array.isArray(data.subContractorNonLaborAccounts)
        ) {
          const subAccountsWithNames = data.subContractorNonLaborAccounts.map(
            (account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            })
          );
          allAccountsWithNames.push(...subAccountsWithNames);
        }

        // ✅ Other Direct Cost Accounts - MAKE SURE THIS IS HERE
        if (
          data.otherDirectCostNonLaborAccounts &&
          Array.isArray(data.otherDirectCostNonLaborAccounts)
        ) {
          const otherAccountsWithNames =
            data.otherDirectCostNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }));
          allAccountsWithNames.push(...otherAccountsWithNames);
        }

        // Remove duplicates
        const uniqueAccountsWithNamesMap = new Map();
        allAccountsWithNames.forEach((acc) => {
          if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
            uniqueAccountsWithNamesMap.set(acc.id, {
              id: acc.id,
              name: acc.name,
            });
          }
        });

        const uniqueAccountsWithNames = Array.from(
          uniqueAccountsWithNamesMap.values()
        );
        setAccountOptionsWithNames(uniqueAccountsWithNames);
      } catch (err) {
        console.error("Failed to initialize account names", err);
        setAccountOptionsWithNames([]);
      }
    };

    initializeAccountNames();
  }, [projectId, planType]);

  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    // Only sync if not already in an update
    if (!scrollingLock.current) {
      scrollingLock.current = true;
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      // Allow event on next tick
      setTimeout(() => {
        scrollingLock.current = false;
      }, 0);
    }
  };

  const handleFirstScroll = () => {
    syncScroll(firstTableRef, secondTableRef);
  };

  const handleSecondScroll = () => {
    syncScroll(secondTableRef, firstTableRef);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate || !planId) {
        setDurations([]);
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      // setIsLoading(true);
      if (!isSilentRefreshing.current) {
            setIsLoading(true);
        }
      setError(null);

      try {
        const durationResponse = await axios.get(
          `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
        );
        if (!Array.isArray(durationResponse.data)) {
          throw new Error("Invalid duration response format");
        }
        const fetchedDurations = durationResponse.data;
        setDurations(fetchedDurations);

        const response = await axios.get(
          `${backendUrl}/Project/GetDirectCostForecastDataByPlanId/${planId}`
        );
        const apiData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        if (apiData.length === 0) {
          setEmployees([]);
          // toast.info("No forecast data available for this plan.", {
          //   toastId: "no-forecast-data",
          //   autoClose: 3000,
          // });
        } else {
          const updatedEmployees = apiData.map((item, idx) => ({
            emple: {
              empleId: item.empl?.id || `auto-${idx}`,
              emplId: item.empl?.id || "",
              firstName: item.empl?.firstName || "",
              lastName: item.empl?.lastName || "",
              accId: item.empl?.acctId || "",
              orgId: item.empl?.orgId || "",
              perHourRate: item.empl?.hrRate || "",
              isRev: item.empl?.isRev || false,
              isBrd: item.empl?.isBrd || false,
              status: item.empl?.status || "Act",
              type: item.empl?.type || "",
              category: item.empl?.category || "",
              dctId: item.dctId || 0,
              plId: item.pl_ID || 0,
              plForecasts: item.empl?.plForecasts || [],
            },
          }));
          setEmployees(updatedEmployees);
        }
        setInputValues({});
        setNewEntryPeriodAmounts({});
      } catch (err) {
        setError("Failed to load data. Please try again.");
        if (err.response && err.response.status === 500) {
          setEmployees([]);
          // toast.info("No forecast data available for this plan.", {
          //   toastId: "no-forecast-data",
          //   autoClose: 3000,
          // });
        } else {
          toast.error(
            "Failed to load forecast data: " +
              (err.response?.data?.message || err.message),
            {
              toastId: "forecast-error",
              autoClose: 3000,
            }
          );
        }
      } finally {
        setIsLoading(false);
        isSilentRefreshing.current = false;
      }
    };

    fetchData();
  }, [startDate, endDate, planId, refreshKey]); // Added propFiscalYear for refetch on fiscal year change

 
// const getAccountSuggestionsByType = (type) => {
//   // Normalize type string
//   const normalizedType = type?.toLowerCase() || "";
  
//   if (normalizedType === "employee") {
//     return employeeNonLaborAccounts; // Map to Employee accounts
//   } 
  
//   if (normalizedType === "vendor" || normalizedType === "vendor employee") {
//     return subContractorNonLaborAccounts; // Map to SubContractor accounts
//   }
  
//   if (normalizedType === "other") {
//     // Other sees EVERYTHING combined
//     return [
//       ...employeeNonLaborAccounts, 
//       ...subContractorNonLaborAccounts, 
//       ...otherDirectCostNonLaborAccounts
//     ];
//   }

//   // Default fallback (usually all lists combined)
//   return [...employeeNonLaborAccounts, ...subContractorNonLaborAccounts, ...otherDirectCostNonLaborAccounts];
// };

const getAccountSuggestionsByType = (type) => {
    const normalizedType = type?.toLowerCase() || "";
    if (normalizedType === "employee") return employeeNonLaborAccounts;
    if (normalizedType === "vendor" || normalizedType === "vendor employee") return subContractorNonLaborAccounts;
    return [...employeeNonLaborAccounts, ...subContractorNonLaborAccounts, ...otherDirectCostNonLaborAccounts];
};

useEffect(() => {
  const loadOrganizationOptions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/Orgnization/GetAllOrgs`);
      const orgOptions = Array.isArray(response.data) ? response.data.map(org => ({
        value: org.orgId,
        // label: `${org.orgId} - ${org.orgName}`,  
        label: org.orgName,
        orgName: org.orgName                   
      })) : [];
      setOrganizationOptions(orgOptions);
      // console.log('✅ Loaded', orgOptions.length, 'organizations'); // DEBUG
    } catch (err) {
      // console.error('Failed to fetch organizations', err);
    }
  };
  loadOrganizationOptions(); // ✅ Run immediately
}, []); // ✅ Empty deps = mount only


  
  useEffect(() => {
    const formOpen = showNewForm || isEditable;

    const fetchEmployees = async () => {
      if (!projectId || !formOpen) {
        setEmployeeSuggestions([]);
        return;
      }

      try {
        const isVendorRelated = 
          newEntry.idType === "Vendor" || 
          newEntry.idType === "Vendor Employee" ||
          newEntries.some(e => e.idType === "Vendor" || e.idType === "Vendor Employee");

        const endpoint = isVendorRelated
          ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodeURIComponent(projectId)}`
          : `${backendUrl}/Project/GetEmployeesByProject/${encodeURIComponent(projectId)}`;

        const response = await axios.get(endpoint);

        const suggestions = Array.isArray(response.data)
          ? response.data.map((emp) => {
              if (newEntry.idType === "Vendor" || newEntries.some(e => e.idType === "Vendor")) {
                return {
                  emplId: emp.vendId || "",
                  firstName: "",
                  lastName: emp.employeeName || "",
                  orgId: emp.orgId,
                  acctId: emp.acctId,
                  acctName: emp.acctName || "",
                };
              } else if (newEntry.idType === "Vendor Employee" || newEntries.some(e => e.idType === "Vendor Employee")) {
                return {
                  emplId: emp.empId || "",
                  firstName: "",
                  lastName: emp.employeeName || "",
                  orgId: emp.orgId,
                  acctId: emp.acctId,
                  acctName: emp.acctName || "",
                };
              } else {
                const [lastName, firstName] = (emp.employeeName || "")
                  .split(", ")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId || "",
                  firstName: firstName || "",
                  lastName: lastName || "",
                  orgId: emp.orgId,
                  acctId: emp.acctId,
                  acctName: emp.acctName || "",
                };
              }
            })
          : [];
        setEmployeeSuggestions(suggestions);
      } catch (err) {
        setEmployeeSuggestions([]);
        toast.error(
          `Failed to fetch ${
            newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee"
              ? "vendor "
              : ""
          }employee suggestions for project ID ${projectId}`
        );
      }
    };

  
// const fetchNonLaborAccounts = async () => {
//   if (!projectId || !formOpen) {
//     setEmployeeNonLaborAccounts([]);
//     setSubContractorNonLaborAccounts([]);
//     setNonLaborAccounts([]);
//     return;
//   }

//   try {
//     const response = await axios.get(
//       `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
//     );
//     const data = Array.isArray(response.data) ? response.data[0] : response.data;

//     // Standard mapper to ensure accountId and acctName are always available
//     const mapAcc = (acc) => ({
//       accountId: acc.accountId || acc.id || String(acc),
//       acctName: acc.acctName || acc.name || String(acc),
//     });

//     const empAccs = (data.employeeNonLaborAccounts || []).map(mapAcc);
//     const subAccs = (data.subContractorNonLaborAccounts || []).map(mapAcc);
//     const otherAccs = (data.otherDirectCostNonLaborAccounts || []).map(mapAcc);

//     setEmployeeNonLaborAccounts(empAccs);
//     setSubContractorNonLaborAccounts(subAccs);
//     setOtherDirectCostNonLaborAccounts(otherAccs);

//     // Filter suggestions based on ID Type
//     let filteredList = [];
//     if (newEntry.idType === "Employee") {
//       filteredList = empAccs; // Rule 1: Employee type sees Employee accounts only
//     } else if (newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") {
//       filteredList = subAccs; // Rule 2: Vendor type sees SubContractor accounts only
//     } else if (newEntry.idType === "Other") {
//       filteredList = [...empAccs, ...subAccs, ...otherAccs]; // Rule 3: Other type sees ALL
//     } else {
//       filteredList = [...empAccs, ...subAccs, ...otherAccs];
//     }

//     setNonLaborAccounts(filteredList);
//     setAccountOptionsWithNames([...empAccs, ...subAccs, ...otherAccs]);

//   } catch (err) {
//     console.error("Failed to fetch non-labor accounts", err);
//   }
// };

// const fetchNonLaborAccounts = async () => {
//   if (!projectId || !formOpen) {
//     setEmployeeNonLaborAccounts([]);
//     setSubContractorNonLaborAccounts([]);
//     setNonLaborAccounts([]);
//     return;
//   }

//   try {
//     const response = await axios.get(
//       `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
//     );

//     const data = Array.isArray(response.data) ? response.data[0] : response.data;

//     const mapAcc = (acc) => ({
//       accountId: acc.accountId || acc.id || String(acc),
//       acctName: acc.acctName || acc.name || String(acc),
//     });

//     const empAccs = (data.employeeNonLaborAccounts || []).map(mapAcc);
//     const subAccs = (data.subContractorNonLaborAccounts || []).map(mapAcc);
//     const otherAccs = (data.otherDirectCostNonLaborAccounts || []).map(mapAcc);

//     setEmployeeNonLaborAccounts(empAccs);
//     setSubContractorNonLaborAccounts(subAccs);
//     setOtherDirectCostNonLaborAccounts(otherAccs);

//     // RESTRICTED FILTERING LOGIC
//     let accounts = [];
//     if (newEntry.idType === "Employee") {
//       accounts = empAccs; // Strict Rule 1
//     } else if (newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") {
//       accounts = subAccs; // Strict Rule 2
//     } else if (newEntry.idType === "Other") {
//       accounts = [...empAccs, ...subAccs, ...otherAccs]; // Strict Rule 3
//     } else {
//       accounts = [...empAccs, ...subAccs, ...otherAccs];
//     }

//     setNonLaborAccounts(accounts);
//     setAccountOptionsWithNames([...empAccs, ...subAccs, ...otherAccs]);
//   } catch (err) {
//     console.error("Failed to fetch non-labor accounts", err);
//   }
// };

// const fetchNonLaborAccounts = async () => {
//   if (!projectId || !formOpen) {
//     setEmployeeNonLaborAccounts([]);
//     setSubContractorNonLaborAccounts([]);
//     setNonLaborAccounts([]);
//     return;
//   }

//   try {
//     const response = await axios.get(
//       `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
//     );

//     const data = Array.isArray(response.data) ? response.data[0] : response.data;

//     // Standard mapper to ensure accountId and acctName/name are consistent
//     const mapAcc = (account) => ({
//       id: account.accountId || account,
//       accountId: account.accountId || account,
//       acctName: account.acctName || account.accountId || String(account),
//       name: account.acctName || account.accountId || String(account),
//     });

//     const uniqueEmployeeAccounts = (data.employeeNonLaborAccounts || []).map(mapAcc);
//     const uniqueSubAccounts = (data.subContractorNonLaborAccounts || []).map(mapAcc);
//     const uniqueOtherAccounts = (data.otherDirectCostNonLaborAccounts || []).map(mapAcc);

//     setEmployeeNonLaborAccounts(uniqueEmployeeAccounts);
//     setSubContractorNonLaborAccounts(uniqueSubAccounts);
//     setOtherDirectCostNonLaborAccounts(uniqueOtherAccounts);

//     // RESTRICTED FILTERING LOGIC based on ID Type
//     let accounts = []; 

//     if (newEntry.idType === "Employee") {
//       accounts = uniqueEmployeeAccounts;
//     } else if (newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") {
//       accounts = uniqueSubAccounts;
//     } else if (newEntry.idType === "Other") {
//       accounts = [...uniqueEmployeeAccounts, ...uniqueSubAccounts, ...uniqueOtherAccounts];
//     } else {
//       accounts = [...uniqueEmployeeAccounts, ...uniqueSubAccounts, ...uniqueOtherAccounts];
//     }

//     // CRITICAL: We set the objects with both ID and Name
//     setNonLaborAccounts(accounts);
//     setAccountOptionsWithNames([...uniqueEmployeeAccounts, ...uniqueSubAccounts, ...uniqueOtherAccounts]);

//   } catch (err) {
//     setEmployeeNonLaborAccounts([]);
//     setSubContractorNonLaborAccounts([]);
//     setNonLaborAccounts([]);
//     setOtherDirectCostNonLaborAccounts([]);
//     if (planType?.toUpperCase() !== "NBBUD") {
//       toast.error("Failed to fetch non-labor accounts");
//     }
//   }
// };

const fetchNonLaborAccounts = async () => {
  if (!projectId || !formOpen) {
    setEmployeeNonLaborAccounts([]);
    setSubContractorNonLaborAccounts([]);
    setNonLaborAccounts([]);
    return;
  }

  try {
    const response = await axios.get(
      `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`
    );

    const data = Array.isArray(response.data) ? response.data[0] : response.data;

    // Standard mapper to ensure accountId and acctName are consistent
    const mapAcc = (account) => ({
      accountId: account.accountId,
      acctName: account.acctName,
    });

    // Extract the three specific lists from API response
    const empAccs = (data.employeeNonLaborAccounts || []).map(mapAcc);
    const subAccs = (data.subContractorNonLaborAccounts || []).map(mapAcc);
    const otherOdcAccs = (data.otherDirectCostNonLaborAccounts || []).map(mapAcc);

    // Store them in individual states for reference
    setEmployeeNonLaborAccounts(empAccs);
    setSubContractorNonLaborAccounts(subAccs);
    setOtherDirectCostNonLaborAccounts(otherOdcAccs);

    // --- LOGIC CHANGE START ---
    let filteredList = [];

    if (newEntry.idType === "Employee") {
      // Rule 1: Employee type sees Employee accounts only
      filteredList = empAccs;
    } else if (newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") {
      // Rule 2: Vendor types see SubContractor accounts only
      filteredList = subAccs;
    } else if (newEntry.idType === "Other") {
      // Rule 3: Other type sees ALL (Employee + Sub + ODC)
      filteredList = [...empAccs, ...subAccs, ...otherOdcAccs];
    } else {
      // Default fallback
      filteredList = [...empAccs, ...subAccs, ...otherOdcAccs];
    }

    setNonLaborAccounts(filteredList);
    // --- LOGIC CHANGE END ---

  } catch (err) {
    console.error("Failed to fetch non-labor accounts", err);
  }
};

    if (formOpen) {
      fetchEmployees();
      fetchNonLaborAccounts();
    } else {
      setEmployeeNonLaborAccounts([]);
      setSubContractorNonLaborAccounts([]);
      setEmployeeSuggestions([]);
    }
  }, [projectId, showNewForm, newEntry.idType, newEntries, isEditable]);
  
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Only handle if conditions are met
        if (hasClipboardData && copiedRowsData.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handlePasteMultipleRows();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    hasClipboardData,
    copiedRowsData,
    propFiscalYear,
    durations,
    showNewForm,
    projectId,
    planType,
  ]); // Add all dependencies

  const handleIdChange = (value) => {
    // 1. Remove Emojis immediately from the input
    const rawValue = value.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    );

    // 2. Create a trimmed version for lookups/validation
    const trimmedValue = rawValue.trim();

    // --- FIX: Bypass validation if ID Type is "Other" ---
    if (newEntry.idType === "Other") {
      setNewEntry((prev) => ({
        ...prev,
        id: rawValue, // Use the sanitized rawValue (spaces allowed, emojis removed)
        firstName: "", // Reset names or keep logic to parse them later
        lastName: "",
        // Keep existing account if selected, otherwise default
        acctId:
          prev.acctId ||
          (nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : ""),
        orgId: "",
      }));
      return; // Stop here, do not run duplicate/employee checks
    }

    // --- EXISTING LOGIC FOR EMPLOYEE / VENDOR ---

    // 1. Check for duplicate ID
    const isDuplicateId = employees.some((emp) => {
      const emple = emp.emple;
      if (!emple) return false;
      return (
        emple.emplId === trimmedValue && // Use trimmed for comparison
        emple.accId === newEntry.acctId &&
        emple.plcGlcCode === newEntry.plcGlcCode
      );
    });

    if (isDuplicateId) {
      toast.error(
        "ID with the same Account and PLC is already present, so can't save.",
        {
          toastId: "duplicate-id-error",
          autoClose: 3000,
        }
      );
      // Update input to show what user typed (sanitized), but don't proceed with selection
      setNewEntry((prev) => ({
        ...prev,
        id: rawValue,
        firstName: "",
        lastName: "",
        acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
        orgId: "",
      }));
      return;
    }

    // 2. Check against Suggestions (Validation)
    // Only run this check if the user has typed something
    if (trimmedValue.length > 0) {
      const partialMatch = employeeSuggestions.some((emp) =>
        emp.emplId.startsWith(trimmedValue)
      );

      if (!partialMatch) {
        toast.error("Invalid Employee ID, please select a valid one!", {
          toastId: "invalid-employee-id",
          autoClose: 3000,
        });

        setNewEntry((prev) => ({
          ...prev,
          id: rawValue, // Allow typing to continue (sanitized)
          firstName: "",
          lastName: "",
          acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
          orgId: "",
        }));
        return;
      }
    }

    // 3. Valid Input - Try to find exact match
    const selectedEmployee = employeeSuggestions.find(
      (emp) => emp.emplId === trimmedValue
    );

    setNewEntry((prev) => ({
      ...prev,
      id: rawValue, // Keep spaces in the input field
      firstName: selectedEmployee ? selectedEmployee.firstName || "" : "",
      lastName: selectedEmployee ? selectedEmployee.lastName || "" : "",
      acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
      orgId: selectedEmployee?.orgId ? String(selectedEmployee.orgId) : "",
    }));
  };

  const handleRowFieldChange = (rowIdx, field, value) => {
    if (!isFieldEditable || !isEditable) return;
    setEditedRowData((prev) => ({
      ...prev,
      [rowIdx]: {
        ...prev[rowIdx],
        [field]: value,
      },
    }));

    setHasUnsavedFieldChanges(true); 
  setEditingRowIndex(rowIdx);
  };

  const handleRowFieldBlur = async (rowIdx, emp) => {
    if (!isFieldEditable || !isEditable) return;
    if (!emp || !emp.emple) {
      toast.error("Employee data is missing for update.");
      return;
    }

    const edited = editedRowData[rowIdx];
    if (
      edited.acctId === undefined &&
      edited.orgId === undefined &&
      edited.isRev === undefined &&
      edited.isBrd === undefined
    ) {
      return;
    }

    const payload = {
      dctId: emp.emple.dctId || 0,
      plId: emp.emple.plId || 0,
      accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
      orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
      type: emp.emple.type || "",
      category: emp.emple.category || "",
      amountType: emp.emple.amountType || "",
      id: emp.emple.emplId || "",
      isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
      isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
      createdBy: emp.emple.createdBy || "System",
      lastModifiedBy: "System",
    };

    // ✅ FIXED VALIDATION - Only validate if account was changed
    if (edited.acctId !== undefined) {
      const validAccounts =
        emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee"
          ? subContractorNonLaborAccounts.map((a) => a.id || a.accountId)
          : emp.emple.type === "Other"
          ? [
              // START FIX: Combine all three lists for 'Other'
              ...employeeNonLaborAccounts,
              ...subContractorNonLaborAccounts,
              ...otherDirectCostNonLaborAccounts,
            ]
          : employeeNonLaborAccounts.map((a) => a.id || a.accountId);

      if (payload.accId && !validAccounts.includes(payload.accId)) {
        toast.error("Please select a valid account from suggestions");
        return; // stop here, don't call API or show success
      }
    }

    // Validate orgId against organizationOptions - Only if changed
    if (edited.orgId !== undefined) {
      const validOrgs = organizationOptions.map((org) => org.value);
      if (payload.orgId && !validOrgs.includes(payload.orgId)) {
        toast.error("Please select a valid organization from suggestions");
        return; // block update
      }
    }

    try {
      await axios.put(
        `${backendUrl}DirectCost/UpdateDirectCost?plid=${planId}&TemplateId=${templateId}`,
        {
          ...payload,
          acctId: payload.accId,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setEditedRowData((prev) => {
        const newData = { ...prev };
        delete newData[rowIdx];
        return newData;
      });

      setEmployees((prev) => {
        const updated = [...prev];
        updated[rowIdx] = {
          ...updated[rowIdx],
          emple: {
            ...updated[rowIdx].emple,
            ...payload,
          },
        };
        return updated;
      });

      toast.success("Employee updated successfully!", {
        toastId: `employee-update-${rowIdx}`,
        autoClose: 2000,
      });
    } catch (err) {
      toast.error(
        `Failed to update row: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // Memoized org lookup for instant name resolution
const orgLookup = useMemo(() => {
  const lookup = new Map();
  (organizationOptions || []).forEach(org => {
    lookup.set(org.value.toString(), org);
  });
  return lookup;
}, [organizationOptions]);


  const getEmployeeRow = (emp, idx) => {
    const monthAmounts = getMonthAmounts(emp);
    const totalAmount = sortedDurations.reduce((sum, duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      const inputValue = inputValues[`${idx}_${uniqueKey}`];
      const forecastValue = monthAmounts[uniqueKey]?.value;
      const value =
        inputValue !== undefined && inputValue !== ""
          ? inputValue
          : forecastValue;
      return sum + (value && !isNaN(value) ? Number(value) : 0);
    }, 0);

    const formatIdType = (str) => {
      if (!str || str === "-") return "-";
      // Capitalize first letter, lowercase the rest
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

   const organizationId = emp.emple?.orgId;
  let resolvedOrgName = '-';
  if (organizationId && organizationOptions.length > 0) {
    const matchedOrg = organizationOptions.find(org => 
      org.value.toString() === organizationId.toString()
    );
    resolvedOrgName = matchedOrg ? matchedOrg.orgName || matchedOrg.label.split(' - ')[1] || organizationId : organizationId;
  }

    return {
      // idType: emp.emple.type || "-",
      idType: formatIdType(emp.emple.type || "-"),
      emplId: emp.emple.emplId || "-",
      name:
        emp.emple.category || emp.emple.firstName || emp.emple.lastName
          ? emp.emple.category ||
            `${emp.emple.lastName || ""}${
              emp.emple.firstName && emp.emple.lastName ? ", " : ""
            }${emp.emple.firstName || ""}`
          : "-",
      acctId: emp.emple.accId || "-",
      acctName: (() => {
        const accountId = emp.emple.accId || "-";
        const accountWithName = accountOptionsWithNames.find(
          (acc) => acc.id === accountId
        );
        return accountWithName ? accountWithName.name : "-";
      })(), // ADD THIS FIELD
      orgId: emp.emple?.orgId || '-',           // ✅ Column 6
  orgName: resolvedOrgName || '-',    
      isRev: emp.emple.isRev ? (
        <span className="text-green-600 font-sm text-xl">✓</span>
      ) : (
        "-"
      ),
      isBrd: emp.emple.isBrd ? (
        <span className="text-green-600 font-sm text-xl">✓</span>
      ) : (
        "-"
      ),
      status: emp.emple.status || "-",
      total: totalAmount.toFixed(2) || "-",
    };
  };

  const handleInputChange = (empIdx, uniqueKey, newValue) => {
    if (!isEditable) return;

    const currentDuration = sortedDurations.find(
      (d) => `${d.monthNo}_${d.year}` === uniqueKey
    );

    if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
      toast.warn("Cannot edit amounts for a closed period.", {
        toastId: "closed-period-warning",
        autoClose: 3000,
      });
      return;
    }

    if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
      console.log(`Updating inputValues for ${empIdx}_${uniqueKey}:`, newValue);
      setInputValues((prev) => ({
        ...prev,
        [`${empIdx}_${uniqueKey}`]: newValue,
      }));

      // Track modified amounts for save functionality
      setModifiedAmounts((prev) => ({
        ...prev,
        [`${empIdx}_${uniqueKey}`]: {
          empIdx,
          uniqueKey,
          newValue,
          employee: employees[empIdx],
        },
      }));

      setHasUnsavedAmountChanges(true);
    }
  };

  const handleSaveAllAmounts = async () => {
    if (Object.keys(modifiedAmounts).length === 0) {
      toast.info("No changes to save.", { autoClose: 2000 });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Prepare bulk payload array - DO NOT use individual updates
      const bulkPayload = [];

      for (const key in modifiedAmounts) {
        const { empIdx, uniqueKey, newValue, employee } = modifiedAmounts[key];

        const newNumericValue = newValue === "" ? 0 : Number(newValue);
        const emp = employee;
        const monthAmounts = getMonthAmounts(emp);
        const forecast = monthAmounts[uniqueKey];

        if (!forecast || !forecast.forecastid) {
          errorCount++;
          continue;
        }

        const currentDuration = sortedDurations.find(
          (d) => `${d.monthNo}_${d.year}` === uniqueKey
        );

        if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
          errorCount++;
          continue;
        }

        // Create payload matching EXACT bulk API structure
        const payload = {
          forecastedamt:
            planType === "EAC"
              ? forecast?.forecastedamt ?? 0
              : Number(newNumericValue) || 0,
          actualamt:
            planType === "EAC"
              ? Number(newNumericValue) || 0
              : forecast?.actualamt ?? 0,
          forecastid: Number(forecast?.forecastid ?? 0),
          projId: String(forecast?.projId ?? projectId ?? ""),
          plId: Number(forecast?.plId ?? planId ?? 0),
          emplId: String(forecast?.emplId ?? emp?.emple?.emplId ?? ""),
          dctId: Number(forecast?.dctId ?? 0),
          month: Number(forecast?.month ?? currentDuration?.monthNo ?? 0),
          year: Number(forecast?.year ?? currentDuration?.year ?? 0),
          totalBurdenCost: Number(forecast?.totalBurdenCost ?? 0),
          fees: Number(forecast?.fees ?? 0),
          burden: Number(forecast?.burden ?? 0),
          ccffRevenue: Number(forecast?.ccffRevenue ?? 0),
          tnmRevenue: Number(forecast?.tnmRevenue ?? 0),
          revenue: Number(forecast?.revenue ?? 0),
          cost: Number(forecast?.cost ?? 0),
          forecastedCost: Number(forecast?.forecastedCost ?? 0),
          fringe: Number(forecast?.fringe ?? 0),
          overhead: Number(forecast?.overhead ?? 0),
          gna: Number(forecast?.gna ?? 0),
          materials: Number(forecast?.materials ?? 0),
          forecastedhours: Number(forecast?.forecastedhours ?? 0),
          actualhours: Number(forecast?.actualhours ?? 0),
          createdat: forecast?.createdat ?? new Date().toISOString(),
          updatedat: new Date().toISOString(),
          displayText: String(forecast?.displayText ?? ""),
          acctId: String(emp?.emple?.accId ?? ""),
          orgId: String(emp?.emple?.orgId ?? ""),
          plc: String(emp?.emple?.plcGlcCode ?? ""),
          empleId: Number(emp?.emple?.id ?? 0),
          hrlyRate: Number(parseFloat(emp?.emple?.perHourRate ?? 0) || 0),
          effectDt: new Date().toISOString().split("T")[0],
          emple: emp?.emple
            ? {
                id: Number(emp.emple.id ?? 0),
                emplId: String(emp.emple.emplId ?? ""),
                orgId: String(emp.emple.orgId ?? ""),
                firstName: String(emp.emple.firstName ?? ""),
                lastName: String(emp.emple.lastName ?? ""),
                plcGlcCode: String(emp.emple.plcGlcCode ?? ""),
                perHourRate: Number(
                  parseFloat(emp.emple.perHourRate ?? 0) || 0
                ),
                salary: Number(parseFloat(emp.emple.salary ?? 0) || 0),
                accId: String(emp.emple.accId ?? ""),
                hireDate:
                  emp.emple.hireDate ?? new Date().toISOString().split("T")[0],
                isRev: Boolean(emp.emple.isRev ?? false),
                isBrd: Boolean(emp.emple.isBrd ?? false),
                createdAt: emp.emple.createdAt ?? new Date().toISOString(),
                type: String(emp.emple.type ?? ""),
                status: String(emp.emple.status ?? ""),
                plId: Number(planId ?? 0),
                isWarning: Boolean(emp.emple.isWarning ?? false),
                plForecasts: [],
                organization: emp.emple.organization || null,
                plProjectPlan: emp.emple.plProjectPlan || null,
              }
            : null,
        };

        bulkPayload.push(payload);
        successCount++;
      }

      if (bulkPayload.length === 0) {
        toast.warning("No valid entries to save.", { autoClose: 3000 });
        return;
      }

      // SINGLE BULK API CALL - NOT individual updates
      console.log(
        "Calling BULK amount API:",
        `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`
      );
      console.log("Bulk Payload:", JSON.stringify(bulkPayload, null, 2));

      const response = await axios.put(
        `${backendUrl}/Forecast/BulkUpdateForecastAmountV1/${planType}?plid=${planId}&templateid=${templateId}`,
        bulkPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Bulk amount update SUCCESS:", response.data);

      // Update local state for all successful updates
      setEmployees((prev) => {
        const updated = [...prev];

        for (const key in modifiedAmounts) {
          const { empIdx, uniqueKey, newValue } = modifiedAmounts[key];
          const newNumericValue = newValue === "" ? 0 : Number(newValue);

          if (
            updated[empIdx] &&
            updated[empIdx].emple &&
            updated[empIdx].emple.plForecasts
          ) {
            const currentDuration = sortedDurations.find(
              (d) => `${d.monthNo}_${d.year}` === uniqueKey
            );

            const forecastIndex = updated[empIdx].emple.plForecasts.findIndex(
              (f) =>
                f.month === currentDuration?.monthNo &&
                f.year === currentDuration?.year
            );

            if (forecastIndex !== -1) {
              if (planType === "EAC") {
                updated[empIdx].emple.plForecasts[forecastIndex].actualamt =
                  newNumericValue;
              } else {
                updated[empIdx].emple.plForecasts[forecastIndex].forecastedamt =
                  newNumericValue;
              }
              // Update the displayed value as well
              updated[empIdx].emple.plForecasts[forecastIndex].value =
                newNumericValue;
            }
          }
        }

        return updated;
      });

      // Clear modified amounts and reset flags
      setModifiedAmounts({});
      setHasUnsavedAmountChanges(false);

      // toast.success(`Successfully saved ${successCount} amount entries`, {
      //   autoClose: 3000,
      // });

      if (errorCount > 0) {
        toast.warning(`${errorCount} entries could not be processed.`, {
          autoClose: 3000,
        });
      }

      // DO NOT call onSaveSuccess to avoid refetch
      // The local state update above should be sufficient
    } catch (err) {
      console.error("Bulk amount update ERROR:", err);
      toast.error(
        "Failed to save amounts via BULK API: " +
          (err.response?.data?.message || err.message),
        {
          toastId: "save-amounts-error",
          autoClose: 3000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Combined save handler for both amounts and field changes
  const handleSaveAllChanges = async () => {
    if (hasUnsavedAmountChanges && hasUnsavedFieldChanges) {
      // Save both amounts and field changes
      await Promise.all([handleSaveAllAmounts(), handleSaveFieldChanges()]);
    } else if (hasUnsavedAmountChanges) {
      // Save only amounts
      await handleSaveAllAmounts();
    } else if (hasUnsavedFieldChanges) {
      // Save only field changes
      await handleSaveFieldChanges();
    }
  };

//   const handleSaveFieldChanges = async () => {
//   if (editingRowIndex === null || !editedRowData[editingRowIndex]) {
//     toast.info("No field changes to save.", { autoClose: 2000 });
//     return;
//   }

//   const emp = employees[editingRowIndex];
//   if (!emp || !emp.emple) {
//     toast.error("Employee data is missing for update.");
//     return;
//   }

//   const edited = editedRowData[editingRowIndex];

//   // --- START VALIDATION LOGIC ---
//   // Determine valid accounts based on ID Type to match the "New Entry" behavior
//   let validAccounts = [];
  
//   if (emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee") {
//     // Only Sub-Contractor accounts
//     validAccounts = subContractorNonLaborAccounts.map((a) => a.id || a.accountId || "");
//   } else if (emp.emple.type === "Other") {
//     // COMBINE ALL THREE for "Other" type: Employee + Sub + Other Direct Cost
//     validAccounts = [
//       ...employeeNonLaborAccounts.map((a) => a.id || a.accountId || ""),
//       ...subContractorNonLaborAccounts.map((a) => a.id || a.accountId || ""),
//       ...otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId || "")
//     ];
//   } else {
//     // Default: Employee Non-Labor accounts
//     validAccounts = employeeNonLaborAccounts.map((a) => a.id || a.accountId || "");
//   }

//   // Validate Account Selection
//   if (edited.acctId && !validAccounts.includes(edited.acctId)) {
//     toast.error("Please select a valid account from suggestions");
//     return; // STOP execution here to prevent API call and success toast
//   }

//   // Validate Organization Selection
//   const validOrgs = organizationOptions.map((org) => org.value);
//   if (edited.orgId && !validOrgs.includes(edited.orgId)) {
//     toast.error("Please select a valid organization from suggestions");
//     return; // STOP execution here
//   }
//   // --- END VALIDATION LOGIC ---

//   const payload = {
//     dctId: emp.emple.dctId || 0,
//     plId: emp.emple.plId || 0,
//     accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
//     orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
//     type: emp.emple.type || "",
//     category: emp.emple.category || "",
//     amountType: emp.emple.amountType || "",
//     id: emp.emple.emplId || "",
//     isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
//     isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
//     createdBy: emp.emple.createdBy || "System",
//     lastModifiedBy: "System",
//   };

//   setIsLoading(true);
//   try {
//     await axios.put(
//       `${backendUrl}/DirectCost/UpdateDirectCost`,
//       { ...payload, acctId: payload.accId },
//       { headers: { "Content-Type": "application/json" } }
//     );

//     // Clear edited data and reset states only on success
//     setEditedRowData((prev) => {
//       const newData = { ...prev };
//       delete newData[editingRowIndex];
//       return newData;
//     });

//     setEmployees((prev) => {
//       const updated = [...prev];
//       updated[editingRowIndex] = {
//         ...updated[editingRowIndex],
//         emple: {
//           ...updated[editingRowIndex].emple,
//           ...payload,
//         },
//       };
//       return updated;
//     });

//     setEditingRowIndex(null);
//     setHasUnsavedFieldChanges(false);

//     toast.success("Employee updated successfully!", {
//       toastId: `employee-update-${editingRowIndex}`,
//       autoClose: 2000,
//     });
//   } catch (err) {
//     toast.error(
//       "Failed to update employee: " +
//         (err.response?.data?.message || err.message)
//     );
//   } finally {
//     setIsLoading(false);
//   }
// };

  // const handleSaveFieldChanges = async () => {
  //   if (editingRowIndex === null || !editedRowData[editingRowIndex]) {
  //     toast.info("No field changes to save.", { autoClose: 2000 });
  //     return;
  //   }

  //   const emp = employees[editingRowIndex];
  //   if (!emp || !emp.emple) {
  //     toast.error("Employee data is missing for update.");
  //     return;
  //   }

  //   const edited = editedRowData[editingRowIndex];

  //   // ✅ FIXED: Added "Other" condition for validation
  //   const validAccounts =
  //     emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee"
  //       ? subContractorNonLaborAccounts.map((a) => a.id || a.accountId || "")
  //       : emp.emple.type === "Other"
  //       ? otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId || "")
  //       : employeeNonLaborAccounts.map((a) => a.id || a.accountId || "");

  //   if (edited.acctId && !validAccounts.includes(edited.acctId)) {
  //     toast.error("Please select a valid account from suggestions");
  //     return;
  //   }

  //   const validOrgs = organizationOptions.map((org) => org.value);
  //   if (edited.orgId && !validOrgs.includes(edited.orgId)) {
  //     toast.error("Please select a valid organization from suggestions");
  //     return;
  //   }

  //   const payload = {
  //     dctId: emp.emple.dctId || 0,
  //     plId: emp.emple.plId || 0,
  //     accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
  //     orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
  //     type: emp.emple.type || "",
  //     category: emp.emple.category || "",
  //     amountType: emp.emple.amountType || "",
  //     id: emp.emple.emplId || "",
  //     isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
  //     isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
  //     createdBy: emp.emple.createdBy || "System",
  //     lastModifiedBy: "System",
  //   };

  //   setIsLoading(true);
  //   try {
  //     await axios.put(
  //       `${backendUrl}/DirectCost/UpdateDirectCost`,
  //       { ...payload, acctId: payload.accId },
  //       { headers: { "Content-Type": "application/json" } }
  //     );

  //     // Clear edited data and reset states
  //     setEditedRowData((prev) => {
  //       const newData = { ...prev };
  //       delete newData[editingRowIndex];
  //       return newData;
  //     });

  //     setEmployees((prev) => {
  //       const updated = [...prev];
  //       updated[editingRowIndex] = {
  //         ...updated[editingRowIndex],
  //         emple: {
  //           ...updated[editingRowIndex].emple,
  //           ...payload,
  //         },
  //       };
  //       return updated;
  //     });

  //     setEditingRowIndex(null);
  //     setHasUnsavedFieldChanges(false);

  //     toast.success("Employee updated successfully!", {
  //       toastId: `employee-update-${editingRowIndex}`,
  //       autoClose: 2000,
  //     });
  //   } catch (err) {
  //     toast.error(
  //       "Failed to update employee: " +
  //         (err.response?.data?.message || err.message)
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

//   const handleMasterSave = async () => {
//   setIsLoading(true);
//   try {
//     const savePromises = [];

//     // 1. Handle New/Pasted Entries (POST)
//     if (newEntries.length > 0) {
//       // Re-use your existing logic for multiple entries
//       savePromises.push(handleSaveMultiplePastedEntries());
//     } 

//     // 2. Handle Grid Amount Changes (PUT Bulk)
//     if (hasUnsavedAmountChanges) {
//       savePromises.push(handleSaveAllAmounts());
//     }

//     // 3. Handle Field Changes (Account/Org) (PUT)
//     if (hasUnsavedFieldChanges) {
//       savePromises.push(handleSaveFieldChanges());
//     }

//     await Promise.all(savePromises);
    
//     // Clear selection states after comprehensive save
//     setSelectedRows(new Set());
//     setShowCopyButton(false);
    
//   } catch (err) {
//     console.error("Master Save Error:", err);
//   } finally {
//     setIsLoading(false);
//   }
// };

  // Handler for canceling field changes
  
//   const handleMasterSave = async () => {
//   setIsLoading(true);
//   try {
//     const savePromises = [];

//     if (newEntries.length > 0) {
//       savePromises.push(handleSaveMultiplePastedEntries());
//     } 

//     if (hasUnsavedAmountChanges) {
//       savePromises.push(handleSaveAllAmounts());
//     }

//     if (hasUnsavedFieldChanges) {
//       savePromises.push(handleSaveFieldChanges());
//     }

//     await Promise.all(savePromises);
    
//     // --- ADD THESE LINES TO HIDE BUTTONS AFTER SAVE ---
//     setNewEntries([]); // Clears the list of new forms
//     setNewEntryPeriodAmountsArray([]); 
//     setShowNewForm(false); // Hides the new entry section
//     setHasUnsavedAmountChanges(false);
//     setHasUnsavedFieldChanges(false);
//     // ------------------------------------------------
    
//     setSelectedRows(new Set());
//     setShowCopyButton(false);
    
//   } catch (err) {
//     console.error("Master Save Error:", err);
//   } finally {
//     setIsLoading(false);
//   }
// };

// const handleMasterSave = async () => {
//   setIsLoading(true);
//   try {
//     // 1. Run the save for New/Pasted entries
//     const saveSuccess = await handleSaveMultiplePastedEntries();
    
//     // 2. IF SAVE FAILED (Validation or API error), STOP HERE.
//     // The forms stay open because we haven't reached the state reset logic below.
//     if (!saveSuccess) {
//       setIsLoading(false);
//       return; 
//     }

//     // 3. Continue to save existing grid edits if necessary
//     if (hasUnsavedAmountChanges) {
//       await handleSaveAllAmounts();
//     }

//     if (hasUnsavedFieldChanges) {
//       await handleSaveFieldChanges();
//     }

//     // 4. ONLY RESET STATE IF EVERYTHING SAVED SUCCESSFULLY
//     setNewEntries([]);
//     setNewEntryPeriodAmountsArray([]); 
//     setShowNewForm(false);
//     setHasUnsavedAmountChanges(false);
//     setHasUnsavedFieldChanges(false);
//     setModifiedAmounts({});
//     setEditedRowData({});
//     setInputValues({});
//     setSelectedRows(new Set());
//     setShowCopyButton(false);

//     toast.success("All changes saved successfully!");
    
//   } catch (err) {
//     console.error("Master Save Error:", err);
//   } finally {
//     setIsLoading(false);
//   }
// };
const handleSaveFieldChanges = async () => {
  if (editingRowIndex === null || !editedRowData[editingRowIndex]) {
    // Return true because there was nothing to save (not a failure)
    return true;
  }

  const emp = employees[editingRowIndex];
  if (!emp || !emp.emple) {
    toast.error("Employee data is missing for update.");
    return false;
  }

  const edited = editedRowData[editingRowIndex];

  // --- START VALIDATION LOGIC ---
  let validAccounts = [];
  
  if (emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee") {
    validAccounts = subContractorNonLaborAccounts.map((a) => a.id || a.accountId || "");
  } else if (emp.emple.type === "Other") {
    validAccounts = [
      ...employeeNonLaborAccounts.map((a) => a.id || a.accountId || ""),
      ...subContractorNonLaborAccounts.map((a) => a.id || a.accountId || ""),
      ...otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId || "")
    ];
  } else {
    validAccounts = employeeNonLaborAccounts.map((a) => a.id || a.accountId || "");
  }

  if (edited.acctId && !validAccounts.includes(edited.acctId)) {
    toast.error("Please select a valid account from suggestions");
    return false; // STOP: Returns false to prevent Master Save success toast
  }

  const validOrgs = organizationOptions.map((org) => org.value);
  if (edited.orgId && !validOrgs.includes(edited.orgId)) {
    toast.error("Please select a valid organization from suggestions");
    return false; // STOP
  }
  // --- END VALIDATION LOGIC ---

  const payload = {
    dctId: emp.emple.dctId || 0,
    plId: emp.emple.plId || 0,
    accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
    orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
    type: emp.emple.type || "",
    category: emp.emple.category || "",
    amountType: emp.emple.amountType || "",
    id: emp.emple.emplId || "",
    isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
    isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
    createdBy: emp.emple.createdBy || "System",
    lastModifiedBy: "System",
  };

  setIsLoading(true);
  try {
    await axios.put(
      `${backendUrl}/DirectCost/UpdateDirectCost?plid=${planId}&TemplateId=${templateId}`,
      { ...payload, acctId: payload.accId },
      { headers: { "Content-Type": "application/json" } }
    );

    setEditedRowData((prev) => {
      const newData = { ...prev };
      delete newData[editingRowIndex];
      return newData;
    });

    setEmployees((prev) => {
      const updated = [...prev];
      updated[editingRowIndex] = {
        ...updated[editingRowIndex],
        emple: { ...updated[editingRowIndex].emple, ...payload },
      };
      return updated;
    });

    setEditingRowIndex(null);
    setHasUnsavedFieldChanges(false);

    // toast.success("Employee updated successfully!", {
    //   toastId: `employee-update-${editingRowIndex}`,
    //   autoClose: 2000,
    // });
    return true; // SUCCESS: Allows Master Save to continue
  } catch (err) {
    toast.error("Failed to update employee: " + (err.response?.data?.message || err.message));
    return false; // FAILURE: Blocks Master Save success toast
  } finally {
    setIsLoading(false);
  }
};

const handleMasterSave = async () => {
  setIsLoading(true);
  try {
    let saveSuccess = true;

    // 1. Handle Multiple Pasted Entries (POST)
    if (newEntries.length > 0) {
      saveSuccess = await handleSaveMultiplePastedEntries();
    } 
    // 2. Handle Single Manual New Entry (POST)
    else if (showNewForm && newEntry.id) {
      saveSuccess = await handleSaveNewEntry();
    }

    // CRITICAL: If new entry saving failed validation or API, STOP HERE.
    if (!saveSuccess) {
      setIsLoading(false);
      return; 
    }

    // 3. Handle Field Changes (Account/Org validation inside handleSaveFieldChanges)
    if (hasUnsavedFieldChanges) {
      // Note: We need this to return a boolean to know if it succeeded
      const fieldSuccess = await handleSaveFieldChanges();
      if (!fieldSuccess) {
        setIsLoading(false);
        return;
      }
    }

    // 4. Handle Grid Amount Changes (PUT Bulk)
    if (hasUnsavedAmountChanges) {
      await handleSaveAllAmounts();
    }

    // 5. Success Cleanup
    if (onSaveSuccess) {
      isSilentRefreshing.current = true;
      await onSaveSuccess();
    }

    // Reset all states only after full database commit
    setNewEntries([]);
    setNewEntryPeriodAmountsArray([]);
    setShowNewForm(false);
    setHasUnsavedAmountChanges(false);
    setHasUnsavedFieldChanges(false);
    setModifiedAmounts({});
    setEditedRowData({});
    setInputValues({});
    // setSelectedRows(new Set());
    // setShowCopyButton(false);

    toast.success("All changes saved successfully!");

  } catch (err) {
    console.error("Master Save Error:", err);
  } finally {
    setIsLoading(false);
  }
};


 
  const handleCancelAllChanges = () => {
    // Cancel amount changes
    if (hasUnsavedAmountChanges) {
      setModifiedAmounts({});
      setInputValues({});
      setHasUnsavedAmountChanges(false);
    }

    // Cancel field changes
    if (hasUnsavedFieldChanges) {
      if (editingRowIndex !== null) {
        setEditedRowData((prev) => {
          const newData = { ...prev };
          delete newData[editingRowIndex];
          return newData;
        });
        setEditingRowIndex(null);
      }
      setHasUnsavedFieldChanges(false);
    }

    toast.info("All changes cancelled.", { autoClose: 1500 });
  };

 

  const resetNewEntry = (newIdType) => {
    setNewEntry({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: newIdType || "", // preserve new idType
      acctId: "",
      orgId: "",
      perHourRate: "",
      status: "Act",
    });
  };

  const handleFillValues = async () => {
    if (!showNewForm || !isEditable) return;

    const newAmounts = {};
    if (fillMethod === "Copy From Source Record" && sourceRowIndex !== null) {
      const sourceEmp = employees[sourceRowIndex];
      const sourceMonthAmounts = getMonthAmounts(sourceEmp);
      sortedDurations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        if (
          planType === "EAC" &&
          !isMonthEditable(duration, closedPeriod, planType)
        ) {
          newAmounts[uniqueKey] = newEntryPeriodAmounts[uniqueKey] || "0";
        } else {
          newAmounts[uniqueKey] =
            sourceMonthAmounts[uniqueKey]?.value?.toString() || "0";
        }
      });
    }

    setNewEntryPeriodAmounts((prev) => ({ ...prev, ...newAmounts }));
    setShowFillValues(false);
    setFillMethod("None");
    setSourceRowIndex(null);
  };


  // New helper to apply fill changes to selected EXISTING rows
const applyFillToExistingRows = (startValue, startNum, rangeEndKey, selectedRows, employees, sortedDurations, inputValues, setInputValues, setModifiedAmounts, setHasUnsavedAmountChanges, closedPeriod, planType, toKeyNum) => {
    let updatedInputs = { ...inputValues };
    let newModifiedAmounts = {};

    selectedRows.forEach(actualEmpIdx => {
        const emp = employees[actualEmpIdx];
        const monthAmounts = getMonthAmounts(emp);

        // Determine the starting value for this specific EXISTING row
        let currentStartValue = startValue; 

        // If not using Specify Amounts, we need to read the initial value from the grid for this specific existing row
        if (startValue === null || startValue === undefined) { 
            const currentInputKey = `${actualEmpIdx}_${effectiveStartPeriodKey}`; // effectiveStartPeriodKey determined in handleFillValuesAmounts
            const inputValue = inputValues[currentInputKey];
            const forecastValue = monthAmounts[effectiveStartPeriodKey]?.value;

            currentStartValue = (inputValue !== undefined && inputValue !== "")
                ? inputValue
                : (forecastValue !== undefined && forecastValue !== null) 
                    ? String(forecastValue)
                    : "";
        }

        sortedDurations.forEach(duration => {
            const uniqueKey = `${duration.monthNo}_${duration.year}`;
            const currentNum = toKeyNum(duration.year, duration.monthNo);
            const inputKey = `${actualEmpIdx}_${uniqueKey}`;

            // 1. Check date range
            const k = toKeyNum(duration.year, duration.monthNo);
            if (k > rangeEndKey || currentNum < startNum) return; // Fill only up to end date, and starting from start month

            // 2. Check editability
            if (planType === "EAC" && !isMonthEditable(duration, closedPeriod, planType)) return;

            let newValue = currentStartValue;

            // 3. Stage the update
            if (String(updatedInputs[inputKey]) !== String(newValue) || updatedInputs[inputKey] === undefined) {
                updatedInputs[inputKey] = String(newValue);
                
                // Track for eventual bulk save
                newModifiedAmounts[inputKey] = {
                    empIdx: actualEmpIdx,
                    uniqueKey,
                    newValue: String(newValue),
                    employee: emp,
                };
            }
        });
    });

    if (Object.keys(newModifiedAmounts).length > 0) {
        // Only trigger state updates if actual changes occurred
        setInputValues(prev => ({ ...prev, ...updatedInputs }));
        
        // Merge with existing modified amounts to preserve pending saves
        setModifiedAmounts(prev => ({ ...prev, ...newModifiedAmounts }));
        setHasUnsavedAmountChanges(true);
        return Object.keys(newModifiedAmounts).length;
    }
    return 0;
};

const parseMonth = (dateStr) => {
  const [year, month] = dateStr.split("-").map(Number);
  return { year, month };
};


  
const handleFillValuesAmounts = () => {
  if (!isEditable) return;

  // 1. Basic Validation and Range Setup
  if (!fillStartDate || !fillEndDate) {
    toast.error("Start Period and End Period are required.");
    return;
  }

  const start = parseMonth(fillStartDate);
  const end = parseMonth(fillEndDate);

  const toKeyNum = (y, m) => y * 100 + m;

  const rangeStartKey = toKeyNum(start.year, start.month);
  const rangeEndKey = toKeyNum(end.year, end.month);

  if (rangeEndKey < rangeStartKey) {
    toast.error("End Period cannot be before Start Period.");
    return;
  }

  const isInRange = (duration) => {
    const k = toKeyNum(duration.year, duration.monthNo);
    return k >= rangeStartKey && k <= rangeEndKey;
  };

  // Identify Anchor Month for "Use Start Period Amounts"
  let anchorMonthKey = selectedColumnKey;
  if (!anchorMonthKey) {
    const firstVis = sortedDurations.find(d => toKeyNum(d.year, d.monthNo) >= rangeStartKey);
    if (firstVis) anchorMonthKey = `${firstVis.monthNo}_${firstVis.year}`;
  }
  const [aM, aY] = anchorMonthKey ? anchorMonthKey.split('_').map(Number) : [0, 0];
  const anchorSortVal = toKeyNum(aY, aM);

  let newInputs = { ...inputValues };
  let newModifiedAmounts = { ...modifiedAmounts };
  let targetRowIdxForScroll = null;

  // --- SOURCE PREPARATION (Only for Copy Method) ---
  const sourceIdx = selectedRows.size > 0 ? Array.from(selectedRows)[0] : null;
  const sourceEmp = sourceIdx !== null ? employees[sourceIdx] : null;
  const sourceMonthAmounts = sourceEmp ? getMonthAmounts(sourceEmp) : {};

  // --- 2. Logic for NEW ENTRIES ---
  if (newEntries.length > 0) {
    setNewEntryPeriodAmountsArray(prevArray => 
      prevArray.map((amounts) => {
        const updatedAmounts = { ...amounts };
        // Original logic: value from THIS row's anchor month
        const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

        sortedDurations.forEach(duration => {
          const currentK = toKeyNum(duration.year, duration.monthNo);
          if (currentK < rangeStartKey || currentK > rangeEndKey) return;
          if (planType === "EAC" && !isMonthEditable(duration, closedPeriod, planType)) return;

          const key = `${duration.monthNo}_${duration.year}`;
          
          if (fillMethod === "Copy From Source Record" && sourceEmp) {
            updatedAmounts[key] = newInputs[`${sourceIdx}_${key}`] ?? String(sourceMonthAmounts[key]?.value || "0");
          } else if (fillMethod === "Specify Amounts") {
            updatedAmounts[key] = String(fillAmounts);
          } else if (fillMethod === "Use Start Period Amounts") {
            if (currentK >= anchorSortVal) updatedAmounts[key] = valToCopyFromSelf;
          }
        });
        return updatedAmounts;
      })
    );
  } 

  // --- 3. Logic for EXISTING ROWS (Checked Rows) ---
  if (selectedRows.size > 0) {
    const isDropdownCopy = fillMethod === "Copy From Source Record" && selectedSourceIdx !== "";
    const targetIndices = isDropdownCopy ? [parseInt(selectedSourceIdx)] : Array.from(selectedRows);
    
    targetRowIdxForScroll = targetIndices[0];

    targetIndices.forEach(targetIdx => {
      const targetEmp = employees[targetIdx];
      if (!targetEmp) return;

      const valToCopyFromSelf = newInputs[`${targetIdx}_${anchorMonthKey}`] ?? String(getMonthAmounts(targetEmp)[anchorMonthKey]?.value || "0");
      
      sortedDurations.forEach(d => {
        const currentK = toKeyNum(d.year, d.monthNo);
        if (currentK < rangeStartKey || currentK > rangeEndKey) return;
        if (planType === "EAC" && !isMonthEditable(d, closedPeriod, planType)) return;

        const key = `${d.monthNo}_${d.year}`;
        const inputKey = `${targetIdx}_${key}`;
        let val;

        if (isDropdownCopy && sourceEmp) {
          val = newInputs[`${sourceIdx}_${key}`] ?? String(sourceMonthAmounts[key]?.value || "0");
        } else if (fillMethod === "Specify Amounts") {
          val = String(fillAmounts);
        } else if (fillMethod === "Use Start Period Amounts") {
           if (currentK >= anchorSortVal) val = valToCopyFromSelf;
           else return;
        } else return;

        newInputs[inputKey] = val;
        newModifiedAmounts[inputKey] = { empIdx: targetIdx, uniqueKey: key, newValue: val, employee: targetEmp };
      });
    });
  }

  setInputValues(newInputs);
  setModifiedAmounts(newModifiedAmounts);
  setHasUnsavedAmountChanges(true);
  setShowFillValues(false);

  if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    setFindMatches([{ empIdx: targetRowIdxForScroll, isFillHighlight: true }]);
    setTimeout(() => { setFindMatches([]); }, 4000);
  }

  setSelectedSourceIdx(""); 
  toast.success("Values applied successfully");
};

  const handleSaveNewEntry = async () => {
    if (!planId) {
      toast.error("Plan ID is required to save a new entry.", {
        toastId: "no-plan-id",
        autoClose: 3000,
      });
      return false;
    }

    if (!newEntry.id || newEntry.id.trim() === "") {
      toast.error("ID is required to save a new entry.", {
        toastId: "empty-id-error",
        autoClose: 3000,
      });
      return false;
    }

    if (newEntry.idType !== "Other") {
      const isValidEmployeeId = employeeSuggestions.some(
        (emp) => emp.emplId === newEntry.id
      );
      if (!isValidEmployeeId) {
        toast.error("Please select a valid employee ID from the suggestions.", {
          toastId: "invalid-employee-selection",
          autoClose: 3000,
        });
        return false;
      }
    }

    if (newEntry.acctId) {
      let validAccounts;
      if (newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") {
        validAccounts = subContractorNonLaborAccounts.map((a) => a.id || a.accountId);
      } else if (newEntry.idType === "Other") {
        validAccounts = [
          ...employeeNonLaborAccounts.map((a) => a.id || a.accountId),
          ...subContractorNonLaborAccounts.map((a) => a.id || a.accountId),
          ...otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId),
        ];
      } else {
        validAccounts = employeeNonLaborAccounts.map((a) => a.id || a.accountId);
      }

      if (!validAccounts.includes(newEntry.acctId)) {
        toast.error("Please select a valid account from the suggestions.", {
          toastId: "invalid-account-selection",
          autoClose: 3000,
        });
        return false;
      }
    }

    if (newEntry.orgId) {
      const validOrgs = organizationOptions.map((org) => org.value);
      if (!validOrgs.includes(newEntry.orgId)) {
        toast.error("Please select a valid organization from the suggestions.", {
          toastId: "invalid-org-selection",
          autoClose: 3000,
        });
        return false;
      }
    }

    const isDuplicateId = employees.some((emp) => {
      const emple = emp.emple;
      if (!emple) return false;
      return emple.emplId === newEntry.id && emple.accId === newEntry.acctId;
    });

    if (isDuplicateId) {
      toast.error("An entry with this ID already exists; cannot save duplicate.", {
        toastId: "duplicate-id-error",
        autoClose: 3000,
      });
      return false;
    }

    setIsLoading(true);

    const payloadForecasts = durations.map((duration) => ({
      forecastedamt: Number(newEntryPeriodAmounts[`${duration.monthNo}_${duration.year}`]) || 0,
      forecastid: 0,
      projId: projectId,
      plId: planId,
      emplId: newEntry.id,
      dctId: 0,
      month: duration.monthNo,
      year: duration.year,
      totalBurdenCost: 0,
      fees: 0,
      burden: 0,
      ccffRevenue: 0,
      tnmRevenue: 0,
      revenue: 0,
      cost: 0,
      fringe: 0,
      overhead: 0,
      gna: 0,
      forecastedhours: 0,
      updatedat: new Date().toISOString().split("T")[0],
      displayText: "",
      acctId: newEntry.acctId,
      orgId: newEntry.orgId,
      hrlyRate: Number(newEntry.perHourRate) || 0,
      effectDt: null,
    }));

    const payload = {
      dctId: 0,
      plId: planId,
      acctId: newEntry.acctId || "",
      orgId: newEntry.orgId || "",
      notes: "",
      category: newEntry.lastName && newEntry.firstName
        ? `${newEntry.lastName}, ${newEntry.firstName}`
        : newEntry.lastName || newEntry.firstName || "",
      amountType: "",
      id: newEntry.id,
      type: newEntry.idType || "-",
      isRev: newEntry.isRev || false,
      isBrd: newEntry.isBrd || false,
      status: newEntry.status || "-",
      createdBy: "System",
      lastModifiedBy: "System",
      plForecasts: payloadForecasts,
      plDct: {},
    };

    try {
      await axios.post(
        `${backendUrl}/DirectCost/AddNewDirectCosts?plid=${planId}&templateid=${templateId}`,
        [payload],
        { headers: { "Content-Type": "application/json" } }
      );
      return true; // SUCCESS
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      toast.error(`Failed to save entry: ${errorMessage}`);
      return false; // FAILED
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (newEntries.length === 0) {
      setPastedEntrySuggestions({});
      setPastedEntryAccounts({});
      setPastedEntryOrgs({});
      return;
    }

    const suggestionsByEntry = {};
    const accountsByEntry = {};
    const orgsByEntry = {};

    newEntries.forEach((entry, entryIndex) => {
      // 1. Employee ID suggestions (skip for Other)
      if (entry.idType !== "Other") {
        suggestionsByEntry[entryIndex] = employeeSuggestions || [];
      } else {
        suggestionsByEntry[entryIndex] = [];
      }

      // 2. Account suggestions - ALL for Other
      let accounts;
      if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
        accounts = subContractorNonLaborAccounts.map((acc) => ({ id: acc.id }));
      } else if (entry.idType === "Other") {
        accounts = [
          ...employeeNonLaborAccounts.map((acc) => ({ id: acc.id })),
          ...subContractorNonLaborAccounts.map((acc) => ({ id: acc.id })),
          ...otherDirectCostNonLaborAccounts.map((acc) => ({ id: acc.id })),
        ];
      } else {
        accounts = employeeNonLaborAccounts.map((acc) => ({ id: acc.id }));
      }
      accountsByEntry[entryIndex] = accounts;

      // 3. Organization suggestions
      orgsByEntry[entryIndex] = organizationOptions || [];
    });

    setPastedEntrySuggestions(suggestionsByEntry);
    setPastedEntryAccounts(accountsByEntry);
    setPastedEntryOrgs(orgsByEntry);
  }, [
    newEntries,
    employeeSuggestions,
    employeeNonLaborAccounts,
    subContractorNonLaborAccounts,
    otherDirectCostNonLaborAccounts,
    organizationOptions,
  ]);

 
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        
        const response = await axios.get(
           `${backendUrl}/api/Configuration/GetConfigValueByName/isClosedPeriodEditable`
        );
        
        
        const valString = response.data?.value;
        
        
        const isAllowed = String(valString).toLowerCase() === "true";
        
        setIsClosedPeriodEditable(isAllowed);
      } catch (err) {
        console.warn("Config fetch failed, defaulting to restricted:", err);
        setIsClosedPeriodEditable(false); 
      }
    };
    fetchConfig();
  }, []); 

  // function isMonthEditable(duration, closedPeriod, planType) {
  //   // 1. Existing Logic: Only applies to EAC
  //   if (planType !== "EAC") return true;
    
  //   // 2. Existing Logic: If no closed period defined, allow edit
  //   if (!closedPeriod) return true;

  //   // 3. NEW LOGIC: Check API Config Value
  //   // If the API says editing is disabled (value is false/null), block it immediately
  //   if (!isClosedPeriodEditable) return false;

  //   // 4. Existing Logic: Date Comparison
  //   const closedDate = new Date(closedPeriod);
  //   if (isNaN(closedDate)) return true;
    
  //   const durationDate = new Date(duration.year, duration.monthNo - 1, 1);
  //   const closedMonth = closedDate.getMonth();
  //   const closedYear = closedDate.getFullYear();
  //   const durationMonth = durationDate.getMonth();
  //   const durationYear = durationDate.getFullYear();

  //   // Allow edit if duration is AFTER the closed date
  //   // (Note: maintain your existing date logic here. usually it is > closedYear or same year & >= closedMonth)
  //   return (
  //     durationYear > closedYear ||
  //     (durationYear === closedYear && durationMonth > closedMonth)
  //   );
  // }

  // Place this function inside ProjectAmountsTable component 
  

  function isMonthEditable(duration, closedPeriod, planType) {
    
    if (planType !== "EAC") return true;

    
    if (isClosedPeriodEditable === true) {
      return true;
    }

    
    if (!closedPeriod) return true;

    const closedDate = new Date(closedPeriod);
    if (isNaN(closedDate)) return true;

    const durationDate = new Date(duration.year, duration.monthNo - 1, 1);
    const closedMonth = closedDate.getMonth();
    const closedYear = closedDate.getFullYear();
    const durationMonth = durationDate.getMonth();
    const durationYear = durationDate.getFullYear();

    
    return (
      durationYear > closedYear ||
      (durationYear === closedYear && durationMonth > closedMonth)
    );
  }

  

  
  const handleSaveMultiplePastedEntries = async () => {
  if (newEntries.length === 0) return true;

  if (!planId) {
    toast.error("Plan ID is required to save entries.");
    return false;
  }

  let validationFailed = false;
  const bulkPayload = [];

  try {
    for (let i = 0; i < newEntries.length; i++) {
      const entry = newEntries[i];
      const periodAmounts = newEntryPeriodAmountsArray[i] || {};

      // 1. Basic ID Check
      if (!entry.id || entry.id.trim() === "") {
        toast.error(`Entry ${i + 1}: ID is required.`);
        validationFailed = true; break;
      }

      // 2. STRICT ACCOUNT VALIDATION
      // Check if selected Account exists in the allowed suggestions for this specific row type
      const rowValidAccounts = getAccountSuggestionsByType(entry.idType);
      const isAccValid = rowValidAccounts.some(acc => (acc.accountId || acc.id) === entry.acctId);
      
      if (!isAccValid) {
        toast.error(`Row ${i + 1}: Invalid Account ID "${entry.acctId}". Please select from the suggestion list.`);
        validationFailed = true; break;
      }

      // 3. STRICT ORGANIZATION VALIDATION
      // Check if selected Org exists in the master organizationOptions list
      const isOrgValid = organizationOptions.some(org => String(org.value) === String(entry.orgId));
      
      if (!isOrgValid) {
        toast.error(`Row ${i + 1}: Invalid Organization "${entry.orgId}". Please select from the suggestion list.`);
        validationFailed = true; break;
      }

      // 4. Construct Forecasts for this entry
      const payloadForecasts = durations.map((duration) => ({
        forecastedamt: Number(periodAmounts[`${duration.monthNo}_${duration.year}`]) || 0,
        forecastid: 0,
        projId: projectId,
        plId: planId,
        emplId: entry.id.trim(),
        dctId: 0,
        month: duration.monthNo,
        year: duration.year,
        updatedat: new Date().toISOString().split("T")[0],
        acctId: entry.acctId,
        orgId: entry.orgId,
        hrlyRate: 0,
        effectDt: null,
      }));

      bulkPayload.push({
        dctId: 0,
        plId: planId,
        acctId: entry.acctId || "",
        orgId: entry.orgId || "",
        category: entry.lastName && entry.firstName
          ? `${entry.lastName}, ${entry.firstName}`
          : entry.lastName || entry.firstName || "",
        id: entry.id.trim(),
        type: entry.idType || "-",
        isRev: entry.isRev || false,
        isBrd: entry.isBrd || false,
        status: entry.status || "Act",
        createdBy: "System",
        lastModifiedBy: "System",
        plForecasts: payloadForecasts,
      });
    }

    if (validationFailed) return false;

    if (bulkPayload.length > 0) {
      await axios.post(
        `${backendUrl}/DirectCost/AddNewDirectCosts?plid=${planId}&templateid=${templateId}`,
        bulkPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      return true; 
    }
    return true;

  } catch (err) {
    const apiError = err.response?.data?.error || err.response?.data?.message || err.message;
    toast.error(apiError, { autoClose: 5000, toastId: "backend-error-direct-cost" });
    return false;
  } 
};

  const handleRowClickMultiple = (actualEmpIdx) => {
    if (!isEditable) return;
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(actualEmpIdx)) {
        newSelection.delete(actualEmpIdx);
      } else {
        newSelection.add(actualEmpIdx);
      }
      return newSelection;
    });
  };

  // const handleRowClick = (actualEmpIdx) => {
  //   // if (!isEditable) return;

  //   // Toggle selection in selectedRowIndex for UI highlighting
  //   setSelectedRowIndex((prev) =>
  //     prev === actualEmpIdx ? null : actualEmpIdx
  //   );

  //   // Use employees instead of Employees
  //   const selectedEmployee = employees[actualEmpIdx];
  //   setSelectedEmployeeId(
  //     selectedEmployee ? selectedEmployee.emple.dctId : null
  //   );
  //   setSelectedColumnKey(null);
  //   setReplaceScope(actualEmpIdx === selectedRowIndex ? "all" : "row");

  //   if (showNewForm) {
  //     setSourceRowIndex(actualEmpIdx);
  //   }

  //   // ADD THIS: Toggle row selection for copy functionality
  //   setSelectedRows((prev) => {
  //     const newSelection = new Set(prev);
  //     if (newSelection.has(actualEmpIdx)) {
  //       newSelection.delete(actualEmpIdx);
  //     } else {
  //       newSelection.add(actualEmpIdx);
  //     }
  //     setShowCopyButton(newSelection.size > 0);
  //     return newSelection;
  //   });
  //   //  handleRowClickMultiple(actualEmpIdx);
  // };

  const handleRowClick = (actualEmpIdx) => {
  const selectedEmployee = employees[actualEmpIdx];
  const dctId = selectedEmployee ? selectedEmployee.emple.dctId : null;

  setSelectedRowIndex((prev) => (prev === actualEmpIdx ? null : actualEmpIdx));
  setSelectedEmployeeId((prev) => (prev === dctId ? null : dctId));

  setSelectedRows((prev) => {
    const newSelection = new Set(prev);
    if (newSelection.has(actualEmpIdx)) {
      newSelection.delete(actualEmpIdx);
    } else {
      newSelection.add(actualEmpIdx);
    }
    setShowCopyButton(newSelection.size > 0);
    return newSelection;
  });
};

//   const handleRowClick = (actualEmpIdx) => {
//   // if (!isEditable) return;

//   // Toggle selection highlight
//   setSelectedRowIndex((prev) => (prev === actualEmpIdx ? null : actualEmpIdx));

//   const selectedEmployee = employees[actualEmpIdx];
//   setSelectedEmployeeId(selectedEmployee ? selectedEmployee.emple.dctId : null);

//   setSelectedColumnKey(null);
//   setReplaceScope(actualEmpIdx ? "row" : "all");

//   if (showNewForm) {
//     setSourceRowIndex(actualEmpIdx);
//   }

//   // Toggle selection for copy/fill
//   setSelectedRows((prev) => {
//     const newSelection = new Set(prev);
//     if (newSelection.has(actualEmpIdx)) newSelection.delete(actualEmpIdx);
//     else newSelection.add(actualEmpIdx);
//     setShowCopyButton(newSelection.size > 0);
//     return newSelection;
//   });
// };


  const handleNewClick = () => {
    if (!isFormOpened.current) {
      setShowNewForm(true);
      isFormOpened.current = true;
    }
  };

  const handleCloseForm = () => {
    setShowNewForm(false);
    isFormOpened.current = false;
    // Reset form state...
  };

  // const handleDeleteEmployee = async (dctId) => {
  //   if (!dctId) {
  //     toast.error("No record selected for deletion");
  //     return;
  //   }

  //   try {
  //     // Confirm deletion with user
  //     const confirmDelete = window.confirm(
  //       "Are you sure you want to delete this record?"
  //     );
  //     if (!confirmDelete) return;

  //     // Call delete API
  //     await axios.delete(`${backendUrl}/DirectCost/DeleteDirectCost/${dctId}`);

  //     // Show success message
  //     toast.success("Records Deleted Successfully!");

  //     // Remove employee from local state
  //     setEmployees((prev) => prev.filter((emp) => emp.emple.dctId !== dctId));

  //     // Clear selection
  //     setSelectedRowIndex(null);
  //     setSelectedEmployeeId(null);
  //   } catch (err) {
  //     toast.error(
  //       "Failed to delete record: " +
  //         (err.response?.data?.message || err.message)
  //     );
  //   }
  // };

  // const handleColumnHeaderClick = (uniqueKey) => {
  //   if (!isEditable) return;
  //   setSelectedColumnKey(uniqueKey === selectedColumnKey ? null : uniqueKey);
  //   setSelectedRowIndex(null);
  //   setReplaceScope(uniqueKey === selectedColumnKey ? "all" : "column");
  // };
  
  const handleDeleteEmployee = async () => {
  // 1. Identify which records to delete
  // If multiple rows are checked, use those. Otherwise, use the single selectedEmployeeId
  const idsToDelete = selectedRows.size > 0 
    ? Array.from(selectedRows).map(idx => employees[idx]?.emple?.dctId).filter(id => id)
    : [selectedEmployeeId].filter(id => id);

  if (idsToDelete.length === 0) {
    toast.error("No record selected for deletion");
    return;
  }

  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${idsToDelete.length} record(s)?`
  );
  if (!confirmDelete) return;

  try {
    setIsLoading(true);
    
    // 2. Execute Deletions (Assuming your API supports single delete, we loop)
    // If your backend has a BulkDelete endpoint, use that instead for better performance
    await Promise.all(
      idsToDelete.map(id => axios.delete(`${backendUrl}/DirectCost/DeleteDirectCost/${id}`))
    );

    toast.success("Records Deleted Successfully!");

    // 3. FIX: Update local state to remove the records
    setEmployees((prev) => prev.filter((emp) => !idsToDelete.includes(emp.emple.dctId)));

    // 4. FIX: Clear selection states so the "Copy Selected" number goes back to 0
    setSelectedRows(new Set());
    setShowCopyButton(false);
    setSelectedRowIndex(null);
    setSelectedEmployeeId(null);

  } catch (err) {
    toast.error("Failed to delete records: " + (err.response?.data?.message || err.message));
  } finally {
    setIsLoading(false);
  }
};
  const handleColumnHeaderClick = (uniqueKey) => {
  if (!isEditable) return;

  setSelectedColumnKeys((prev) => {
    const next = new Set(prev);
    if (next.has(uniqueKey)) {
      next.delete(uniqueKey);
    } else {
      next.add(uniqueKey);
    }
    return next;
  });

  // optional: keep the last clicked in selectedColumnKey for backward compatibility
  setSelectedColumnKey((prev) => (prev === uniqueKey ? null : uniqueKey));

  // clear row highlight when column scope is used
  setSelectedRowIndex(null);
  setReplaceScope("column");
};


    const hasRowSelection = selectedRows && selectedRows.size > 0;
    const hasColumnSelection =
  selectedColumnKeys && selectedColumnKeys.size > 0;


//   const handleFindReplace = async () => {
//     // if (
//     //   !isEditable ||
//     //   findValue === "" ||
//     //   (replaceScope === "row" && selectedRowIndex === null) ||
//     //   (replaceScope === "column" && selectedColumnKey === null)
//     // ) {
//     //   toast.warn("Please select a valid scope and enter a value to find.", {
//     //     toastId: "find-replace-warning",
//     //     autoClose: 3000,
//     //   });
//     //   return;
//     // }
  

// if (
//   !isEditable ||
//   findValue === "" ||
//   (replaceScope === "row" && !hasRowSelection && selectedRowIndex === null) ||
//   (replaceScope === "column" &&
//     !hasColumnSelection &&
//     selectedColumnKey === null)
// ) {
//   toast.warn("Please select a valid scope and enter a value to find.", {
//     toastId: "find-replace-warning",
//     autoClose: 3000,
//   });
//   return;
// }

//     setIsLoading(true);
//     let replacementsCount = 0;
//     let skippedCount = 0;

//     try {
//       // Prepare bulk payload array - DO NOT use individual updates
//       const bulkPayload = [];
//       const updatedInputValues = { ...inputValues };

//       for (const empIdx in employees) {
//         const emp = employees[empIdx];
//         const actualEmpIdx = parseInt(empIdx, 10);

//         // if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) {
//         //   continue;
//         // }
//         if (replaceScope === "row") {
//   if (hasRowSelection) {
//     // row scope = all selected rows
//     if (!selectedRows.has(actualEmpIdx)) continue;
//   } else if (
//     selectedRowIndex !== null &&
//     actualEmpIdx !== selectedRowIndex
//   ) {
//     // legacy single-row behavior as fallback
//     continue;
//   }
// }


//         for (const duration of sortedDurations) {
//           const uniqueKey = `${duration.monthNo}_${duration.year}`;

//           // if (replaceScope === "column" && uniqueKey !== selectedColumnKey) {
//           //   continue;
//           // }
          
// if (replaceScope === "column") {
//   if (hasColumnSelection) {
//     if (!selectedColumnKeys.has(uniqueKey)) continue;
//   } else if (selectedColumnKey && uniqueKey !== selectedColumnKey) {
//     continue;
//   }
// }


//           if (!isMonthEditable(duration, closedPeriod, planType)) {
//             continue;
//           }

//           const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;

//           // Get the actual displayed value
//           let displayedValue;
//           if (inputValues[currentInputKey] !== undefined) {
//             displayedValue = String(inputValues[currentInputKey]);
//           } else {
//             const monthAmounts = getMonthAmounts(emp);
//             const forecast = monthAmounts[uniqueKey];
//             if (forecast && forecast.value !== undefined) {
//               displayedValue = String(forecast.value);
//             } else {
//               displayedValue = "0";
//             }
//           }

//           const findValueTrimmed = findValue.trim();
//           const displayedValueTrimmed = displayedValue.trim();

//           // Matching logic
//           let isMatch = false;

//           if (findValueTrimmed === "0") {
//             const numValue = parseFloat(displayedValueTrimmed);
//             isMatch =
//               displayedValueTrimmed === "" ||
//               displayedValueTrimmed === "0" ||
//               (!isNaN(numValue) && numValue === 0);
//           } else {
//             isMatch = displayedValueTrimmed === findValueTrimmed;

//             if (!isMatch) {
//               const findNum = parseFloat(findValueTrimmed);
//               const displayNum = parseFloat(displayedValueTrimmed);
//               if (!isNaN(findNum) && !isNaN(displayNum)) {
//                 isMatch = findNum === displayNum;
//               }
//             }
//           }

//           if (isMatch) {
//             const newValue = replaceValue.trim();
//             const newNumericValue = newValue === "" ? 0 : Number(newValue);
//             const monthAmounts = getMonthAmounts(emp);
//             const forecast = monthAmounts[uniqueKey];

//             // Only proceed if we have a valid forecast with forecastid
//             if (!forecast || !forecast.forecastid) {
//               skippedCount++;
//               continue;
//             }

//             const originalValue =
//               planType === "EAC"
//                 ? forecast.actualamt ?? 0
//                 : forecast.forecastedamt ?? 0;

//             if (newNumericValue !== originalValue) {
//               updatedInputValues[currentInputKey] = newValue;
//               replacementsCount++;

//               // Create payload matching EXACT bulk API structure from handleSaveAllAmounts
//               const payload = {
//                 forecastedamt:
//                   planType === "EAC"
//                     ? forecast?.forecastedamt ?? 0
//                     : Number(newNumericValue) || 0,
//                 actualamt:
//                   planType === "EAC"
//                     ? Number(newNumericValue) || 0
//                     : forecast?.actualamt ?? 0,
//                 forecastid: Number(forecast?.forecastid ?? 0),
//                 projId: String(forecast?.projId ?? projectId ?? ""),
//                 plId: Number(forecast?.plId ?? planId ?? 0),
//                 emplId: String(forecast?.emplId ?? emp?.emple?.emplId ?? ""),
//                 dctId: Number(forecast?.dctId ?? 0),
//                 month: Number(forecast?.month ?? duration?.monthNo ?? 0),
//                 year: Number(forecast?.year ?? duration?.year ?? 0),
//                 totalBurdenCost: Number(forecast?.totalBurdenCost ?? 0),
//                 fees: Number(forecast?.fees ?? 0),
//                 burden: Number(forecast?.burden ?? 0),
//                 ccffRevenue: Number(forecast?.ccffRevenue ?? 0),
//                 tnmRevenue: Number(forecast?.tnmRevenue ?? 0),
//                 revenue: Number(forecast?.revenue ?? 0),
//                 cost: Number(forecast?.cost ?? 0),
//                 forecastedCost: Number(forecast?.forecastedCost ?? 0),
//                 fringe: Number(forecast?.fringe ?? 0),
//                 overhead: Number(forecast?.overhead ?? 0),
//                 gna: Number(forecast?.gna ?? 0),
//                 materials: Number(forecast?.materials ?? 0),
//                 forecastedhours: Number(forecast?.forecastedhours ?? 0),
//                 actualhours: Number(forecast?.actualhours ?? 0),
//                 createdat: forecast?.createdat ?? new Date().toISOString(),
//                 updatedat: new Date().toISOString(),
//                 displayText: String(forecast?.displayText ?? ""),
//                 acctId: String(emp?.emple?.accId ?? ""),
//                 orgId: String(emp?.emple?.orgId ?? ""),
//                 plc: String(emp?.emple?.plcGlcCode ?? ""),
//                 empleId: Number(emp?.emple?.id ?? 0),
//                 hrlyRate: Number(parseFloat(emp?.emple?.perHourRate ?? 0) || 0),
//                 effectDt: new Date().toISOString().split("T")[0],
//                 emple: emp?.emple
//                   ? {
//                       id: Number(emp.emple.id ?? 0),
//                       emplId: String(emp.emple.emplId ?? ""),
//                       orgId: String(emp.emple.orgId ?? ""),
//                       firstName: String(emp.emple.firstName ?? ""),
//                       lastName: String(emp.emple.lastName ?? ""),
//                       plcGlcCode: String(emp.emple.plcGlcCode ?? ""),
//                       perHourRate: Number(
//                         parseFloat(emp.emple.perHourRate ?? 0) || 0
//                       ),
//                       salary: Number(parseFloat(emp.emple.salary ?? 0) || 0),
//                       accId: String(emp.emple.accId ?? ""),
//                       hireDate:
//                         emp.emple.hireDate ??
//                         new Date().toISOString().split("T")[0],
//                       isRev: Boolean(emp.emple.isRev ?? false),
//                       isBrd: Boolean(emp.emple.isBrd ?? false),
//                       createdAt:
//                         emp.emple.createdAt ?? new Date().toISOString(),
//                       type: String(emp.emple.type ?? ""),
//                       status: String(emp.emple.status ?? ""),
//                       plId: Number(planId ?? 0),
//                       isWarning: Boolean(emp.emple.isWarning ?? false),
//                       plForecasts: [],
//                       organization: emp.emple.organization || null,
//                       plProjectPlan: emp.emple.plProjectPlan || null,
//                     }
//                   : null,
//               };

//               bulkPayload.push(payload);
//             }
//           }
//         }
//       }

//       if (bulkPayload.length === 0) {
//         if (replacementsCount === 0 && skippedCount === 0) {
//           toast.info("No cells replaced.", { autoClose: 2000 });
//         }
//         return;
//       }

//       // Update input values for UI consistency
//       setInputValues(updatedInputValues);

//       // SINGLE BULK API CALL - NOT individual updates, matching handleSaveAllAmounts
//       console.log(
//         "Calling BULK find/replace amount API:",
//         `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`
//       );
//       console.log(
//         "Bulk Find/Replace Payload:",
//         JSON.stringify(bulkPayload, null, 2)
//       );

//       const response = await axios.put(
//         `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`,
//         bulkPayload,
//         { headers: { "Content-Type": "application/json" } }
//       );

//       console.log("Bulk find/replace amount update SUCCESS:", response.data);

//       // Update local state for all successful updates matching handleSaveAllAmounts pattern
//       setEmployees((prev) => {
//         const updated = [...prev];

//         for (const empIdx in updated) {
//           const emp = updated[empIdx];
//           for (const duration of sortedDurations) {
//             const uniqueKey = `${duration.monthNo}_${duration.year}`;
//             const currentInputKey = `${empIdx}_${uniqueKey}`;
//             if (updatedInputValues[currentInputKey] !== undefined) {
//               if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
//                 const forecastIndex = emp.emple.plForecasts.findIndex(
//                   (f) =>
//                     f.month === duration.monthNo && f.year === duration.year
//                 );

//                 if (forecastIndex !== -1) {
//                   const newValue =
//                     parseFloat(updatedInputValues[currentInputKey]) || 0;
//                   if (planType === "EAC") {
//                     updated[empIdx].emple.plForecasts[forecastIndex].actualamt =
//                       newValue;
//                   } else {
//                     updated[empIdx].emple.plForecasts[
//                       forecastIndex
//                     ].forecastedamt = newValue;
//                   }
//                   // Update the displayed value as well
//                   updated[empIdx].emple.plForecasts[forecastIndex].value =
//                     newValue;
//                 }
//               }
//             }
//           }
//         }

//         return updated;
//       });

//       if (replacementsCount > 0) {
//         toast.success(`Successfully replaced ${replacementsCount} cells.`, {
//           autoClose: 2000,
//         });
//       }

//       if (skippedCount > 0) {
//         toast.warning(`${skippedCount} entries could not be processed.`, {
//           autoClose: 3000,
//         });
//       }
//     } catch (err) {
//       console.error("Bulk find/replace amount ERROR:", err);
//       toast.error(
//         "Failed to replace values via BULK API: " +
//           (err.response?.data?.message || err.message),
//         {
//           toastId: "replace-error",
//           autoClose: 3000,
//         }
//       );
//     } finally {
//       setIsLoading(false);
//       setShowFindReplace(false);
//       setFindValue("");
//       setReplaceValue("");
//       setSelectedRowIndex(null);
//       setSelectedColumnKey(null);
//       setReplaceScope("all");
//     }
//   };

const handleFindReplace = async () => {
  if (!isEditable || !findValue?.trim()) {
    toast.warn('Please enter a find value.');
    return;
  }

  // UPDATED: Check for checked rows within the scope logic
  if (replaceScope === 'row' && selectedRows.size === 0) {
    toast.warn('Please check at least one row.');
    return;
  }

  setIsLoading(true);
  let replacementsCount = 0;

  try {
    const bulkPayload = [];
    const updatedInputValues = { ...inputValues };
    
    /**
     * FIX LOGIC: 
     * If scope is 'row', we only iterate over indices present in the 'selectedRows' Set.
     * If scope is 'all' or 'column', we iterate over all employee indices that aren't hidden.
     */
    const targetRowIndices = replaceScope === 'row' 
      ? Array.from(selectedRows) 
      : employees.map((_, i) => i).filter(i => !hiddenRows[i]);

    for (const empIdx of targetRowIndices) {
      const emp = employees[empIdx];
      // Safety check: ensure the employee exists and isn't hidden
      if (!emp || hiddenRows[empIdx]) continue;

      for (const duration of sortedDurations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        
        // If scope is 'column', skip if not the specific selected column
        if (replaceScope === 'column' && uniqueKey !== selectedColumnKey) continue;
        
        if (!isMonthEditable(duration, closedPeriod, planType)) continue;

        const currentInputKey = `${empIdx}_${uniqueKey}`;
        
        let displayedValue;
        const monthAmounts = getMonthAmounts(emp);
        let forecast = monthAmounts[uniqueKey];

        if (inputValues[currentInputKey] !== undefined) {
          displayedValue = String(inputValues[currentInputKey]);
        } else if (forecast?.value !== undefined) {
          displayedValue = String(forecast.value);
        } else {
          displayedValue = '0';
        }

        const findValueTrimmed = findValue.trim();
        const displayedValueTrimmed = displayedValue.trim();

        const isZeroLike = (val) => {
          if (val === undefined || val === null) return true;
          if (typeof val === 'number') return val === 0;
          const trimmed = val.trim();
          return !trimmed || trimmed === '0' || trimmed === '0.0' || trimmed === '0.00';
        };

        let isMatch = false;
        if (isZeroLike(findValueTrimmed)) {
          isMatch = isZeroLike(displayedValueTrimmed);
        } else {
          isMatch = displayedValueTrimmed === findValueTrimmed;
          if (!isMatch) {
            const findNum = parseFloat(findValueTrimmed);
            const displayNum = parseFloat(displayedValueTrimmed);
            if (!isNaN(findNum) && !isNaN(displayNum)) {
              isMatch = findNum === displayNum;
            }
          }
        }

        if (isMatch) {
          const newValue = replaceValue?.trim() || '0';
          const newNumericValue = Number(newValue);
          
          updatedInputValues[currentInputKey] = newValue;
          replacementsCount++;

          bulkPayload.push({
            forecastid: Number(forecast?.forecastid || 0),
            emplId: String(emp.emple?.emplId || ""),
            dctId: Number(emp.emple?.dctId || 0),
            month: Number(duration.monthNo),
            year: Number(duration.year),
            ProjId: String(projectId || ""),
            OrgId: String(emp.emple?.orgId || ""),
            AcctId: String(emp.emple?.accId || ""),
            empleId: Number(emp.emple?.id || emp.emple?.empleId || 0),
            plid: Number(emp.emple?.plId || planId || 0),
            ...(planType === 'EAC' 
              ? { actualamt: newNumericValue } 
              : { forecastedamt: newNumericValue }),
            updatedat: new Date().toISOString()
          });
        }
      }
    }

    if (bulkPayload.length > 0) {
      const apiType = planType === 'NBBUD' ? 'BUD' : planType;
      await axios.put(`${backendUrl}/Forecast/BulkUpdateForecastAmountV1/${apiType}?plid=${planId}&templateid=${templateId}`, bulkPayload);
      
      setInputValues(updatedInputValues);
      toast.success(`Replaced ${replacementsCount} matches.`);

      if (onSaveSuccess) {
        isSilentRefreshing.current = true; 
        await onSaveSuccess(); 
      }
      
    } else {
      toast.info("No matching values found.");
    }
      
  } catch (err) {
    // console.error(err);
    toast.error("Error: " + (err.response?.data?.message || err.message));
  } finally {
    setIsLoading(false);
    setShowFindReplace(false);
    // Reset specific states to prevent leftover highlights
    setFindValue("");
    setReplaceValue("");
    // setSelectedRowIndex(null);
    // setSelectedColumnKey(null);
  }
};



  const handleFind = () => {
    if (!findValue) {
      toast.warn("Please enter a value to find.", { autoClose: 2000 });
      return;
    }

    const matches = [];
    const findValueTrimmed = findValue.trim();

    function isZeroLike(val) {
      if (val === undefined || val === null) return true;
      if (typeof val === "number") return val === 0;
      if (typeof val === "string") {
        const trimmed = val.trim();
        return (
          !trimmed ||
          trimmed === "0" ||
          trimmed === "0.0" ||
          trimmed === "0.00" ||
          (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
        );
      }
      return false;
    }

    for (const empIdx in employees) {
      const emp = employees[empIdx];
      const actualEmpIdx = parseInt(empIdx, 10);

      if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) continue;

      for (const duration of sortedDurations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;

        if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
          continue;

        if (!isMonthEditable(duration, closedPeriod, planType)) continue;

        const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
        let displayedValue;

        if (inputValues[currentInputKey] !== undefined) {
          displayedValue = String(inputValues[currentInputKey]);
        } else {
          const monthAmounts = getMonthAmounts(emp);
          const forecast = monthAmounts[uniqueKey];
          if (forecast && forecast.value !== undefined) {
            displayedValue = String(forecast.value);
          } else {
            displayedValue = "0";
          }
        }

        const displayedValueTrimmed = displayedValue.trim();
        let isMatch = false;

        if (
          !isNaN(Number(findValueTrimmed)) &&
          Number(findValueTrimmed) === 0
        ) {
          isMatch = isZeroLike(displayedValueTrimmed);
        } else {
          isMatch = displayedValueTrimmed === findValueTrimmed;

          if (!isMatch) {
            const findNum = parseFloat(findValueTrimmed);
            const displayNum = parseFloat(displayedValueTrimmed);
            if (!isNaN(findNum) && !isNaN(displayNum)) {
              isMatch = findNum === displayNum;
            }
          }
        }

        if (isMatch) {
          matches.push({ empIdx: actualEmpIdx, uniqueKey });
        }
      }
    }

    setFindMatches(matches);

    if (matches.length === 0) {
      toast.info("No matches found.", { autoClose: 2000 });
    } else {
      // toast.success(`Found ${matches.length} matches highlighted in the table.`, { autoClose: 3000 });
      setShowFindReplace(false);
    }
  };

  const showHiddenRows = () => setHiddenRows({});

  // const sortedDurations =
  //   propFiscalYear && propFiscalYear !== "All"
  //     ? durations
  //         .filter((d) => d.year === parseInt(propFiscalYear))
  //         .sort(
  //           (a, b) =>
  //             new Date(a.year, a.monthNo - 1, 1) -
  //             new Date(b.year, b.monthNo - 1, 1)
  //         )
  //     : durations.sort(
  //         (a, b) =>
  //           new Date(a.year, a.monthNo - 1, 1) -
  //           new Date(b.year, b.monthNo - 1, 1)
  //       );

  if (isLoading) {
    return (
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">
          Loading forecast data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 font-inter">
        <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
          <strong className="font-bold text-xs">Error: </strong>
          <span className="block sm:inline text-xs">{error}</span>
        </div>
      </div>
    );
  }

  const rowCount = Math.max(
    employees.filter((_, idx) => !hiddenRows[idx]).length +
      (showNewForm ? 1 : 0),
    2
  );

  // Calculate column totals for each month
  // const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum amounts from existing employees
  //     employees
  //       .filter((_, idx) => !hiddenRows[idx])
  //       .forEach((emp, idx) => {
  //         const actualEmpIdx = employees.findIndex((e) => e === emp);
  //         const inputValue = inputValues[`${actualEmpIdx}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;
  //         const value =
  //           inputValue !== undefined && inputValue !== ""
  //             ? inputValue
  //             : forecastValue;

  //         total += value && !isNaN(value) ? Number(value) : 0;
  //       });

  //     // Add amounts from new entry form if visible
  //     if (showNewForm) {
  //       const newEntryValue = newEntryPeriodAmounts[uniqueKey];
  //       total +=
  //         newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     }

  //     columnTotals[uniqueKey] = total;
  //   });

  //   return columnTotals;
  // };

  //   const calculateColumnTotals = () => {
  //   const columnTotals = {};

  //   let ctdTotal = 0;
  //   let priorYearTotal = 0;

  //   const currentFiscalYear = normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
  //   const startYear = startDate ? parseInt(startDate.split('-')[0]) : null;

  //   // Calculate CTD and Prior Year from ALL durations
  //   if (currentFiscalYear && startYear) {
  //     durations.forEach((duration) => {
  //       let total = 0;
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

  //       // Sum amounts from existing employees
  //       employees.forEach((emp, idx) => {
  //         if (hiddenRows[idx]) return;
  //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;
  //         const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //         total += value && !isNaN(value) ? Number(value) : 0;
  //       });

  //       // Add amounts from new entry forms
  //       newEntries.forEach((entry, entryIndex) => {
  //         const newEntryValue = newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
  //         total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //       });

  //       // Prior Year: sum of (selected fiscal year - 1)
  //       if (duration.year === currentFiscalYear - 1) {
  //         priorYearTotal += total;
  //       }

  //       // CTD: sum from start year to (selected fiscal year - 2)
  //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
  //         ctdTotal += total;
  //       }
  //     });
  //   }

  //   // Calculate monthly totals for visible columns (filtered by fiscal year)
  //   sortedDurations.forEach((duration) => {
  //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //     let total = 0;

  //     // Sum amounts from existing employees
  //     employees.forEach((emp, idx) => {
  //       if (hiddenRows[idx]) return;
  //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
  //       const monthAmounts = getMonthAmounts(emp);
  //       const forecastValue = monthAmounts[uniqueKey]?.value;
  //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
  //       total += value && !isNaN(value) ? Number(value) : 0;
  //     });

  //     // Add amounts from new entry forms
  //     newEntries.forEach((entry, entryIndex) => {
  //       const newEntryValue = newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
  //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
  //     });

  //     columnTotals[uniqueKey] = total;
  //   });

  //   // Add CTD and Prior Year to columnTotals
  //   columnTotals['ctd'] = ctdTotal;
  //   columnTotals['priorYear'] = priorYearTotal;

  //   return columnTotals;
  // };

  // Replace the regular function with useMemo - ADD THIS RIGHT AFTER sortedDurations

  // Function to handle row selection
  const handleRowSelection = (rowIndex, isSelected) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(rowIndex);
      } else {
        newSelection.delete(rowIndex);
      }
      setShowCopyButton(newSelection.size > 0);
      return newSelection;
    });
  };

  // Function to select/deselect all rows
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allRowIndices = new Set();
      employees.forEach((_, index) => {
        if (!hiddenRows[index]) {
          allRowIndices.add(index);
        }
      });
      setSelectedRows(allRowIndices);
      setShowCopyButton(true);
    } else {
      setSelectedRows(new Set());
      setShowCopyButton(false);
    }
  };

  const visibleRowIndices = employees
  .map((_, idx) => idx)
  .filter((idx) => !hiddenRows[idx]);

const areAllVisibleSelected =
  visibleRowIndices.length > 0 &&
  visibleRowIndices.every((idx) => selectedRows.has(idx));

const isIndeterminate =
  visibleRowIndices.some((idx) => selectedRows.has(idx)) &&
  !areAllVisibleSelected;


  // const handleCopySelectedRows = () => {
  //   if (selectedRows.size === 0) {
  //     toast.info("No rows selected to copy.", { autoClose: 2000 });
  //     return;
  //   }

  //   const sortedDurations = durations.sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const headers = [
  //     "ID Type",
  //     "ID",
  //     "Name",
  //     "Account",
  //     "Account Name",
  //     "Organization",
  //     "Rev",
  //     "Brd",
  //     "Status",
  //   ];

  //   // Store month metadata for matching during paste
  //   const monthMetadata = [];

  //   sortedDurations.forEach((duration) => {
  //     const monthName = new Date(
  //       duration.year,
  //       duration.monthNo - 1
  //     ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  //     headers.push(monthName);
  //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
  //   });

  //   const copyData = [headers];
  //   const structuredData = [];

  //   selectedRows.forEach((rowIndex) => {
  //     const emp = employees[rowIndex];
  //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
  //       const employeeRow = getEmployeeRow(emp, rowIndex);
  //       const rowData = [
  //         employeeRow.idType,
  //         employeeRow.emplId,
  //         employeeRow.name,
  //         employeeRow.acctId,
  //         employeeRow.acctName,
  //         employeeRow.orgId,
  //         typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev,
  //         typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd,
  //         employeeRow.status,
  //       ];

  //       sortedDurations.forEach((duration) => {
  //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;
  //         const value =
  //           inputValue !== undefined && inputValue !== ""
  //             ? inputValue
  //             : forecastValue || "0.00";
  //         rowData.push(value);
  //       });

  //       copyData.push(rowData);
  //       structuredData.push(rowData);
  //     }
  //   });

  //   const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

  //   navigator.clipboard
  //     .writeText(tsvContent)
  //     .then(() => {
  //       setCopiedRowsData(() => structuredData);
  //       setCopiedMonthMetadata(() => monthMetadata);
  //       setHasClipboardData(() => true);

  //       toast.success(`Copied ${structuredData.length} rows!`, {
  //         autoClose: 3000,
  //       });

  //       Promise.resolve().then(() => {
  //         setSelectedRows(new Set());
  //         setShowCopyButton(false);
  //       });
  //     })
  //     .catch((err) => {
  //       console.error("Copy failed:", err);
  //       toast.error("Failed to copy data.", { autoClose: 3000 });
  //     });
  // };

  // const handleCopySelectedRows = () => {
  //   if (selectedRows.size === 0) {
  //     toast.info("No rows selected to copy.", { autoClose: 2000 });
  //     return;
  //   }

  //   // COPY ALL DURATIONS (not filtered by fiscal year) - use spread to avoid mutation
  //   const sortedDurations = [...durations].sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const headers = [
  //     "ID Type",
  //     "ID",
  //     "Name",
  //     "Account",
  //     "Account Name",
  //     "Organization",
  //     "Rev",
  //     "Brd",
  //     "Status",
  //     "Total",
  //   ];

  //   // Store month metadata for matching during paste
  //   const monthMetadata = [];

  //   sortedDurations.forEach((duration) => {
  //     const monthName = new Date(
  //       duration.year,
  //       duration.monthNo - 1
  //     ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  //     headers.push(monthName);
  //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
  //   });

  //   const copyData = [headers];
  //   const structuredData = [];

  //   selectedRows.forEach((rowIndex) => {
  //     const emp = employees[rowIndex];
  //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
  //       const employeeRow = getEmployeeRow(emp, rowIndex);
  //       const rowData = [
  //         employeeRow.idType,
  //         employeeRow.emplId,
  //         employeeRow.name,
  //         employeeRow.acctId,
  //         employeeRow.acctName,
  //         employeeRow.orgId,
  //         typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev === true ? "✓" : "-",
  //         typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd === true ? "✓" : "-",
  //         employeeRow.status,
  //         employeeRow.total,
  //       ];

  //       sortedDurations.forEach((duration) => {
  //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;

  //         // Format the value properly
  //         let value = "0.00";
  //         if (inputValue !== undefined && inputValue !== "" && inputValue !== null) {
  //           value = parseFloat(inputValue).toFixed(2);
  //         } else if (forecastValue !== undefined && forecastValue !== "" && forecastValue !== null) {
  //           value = parseFloat(forecastValue).toFixed(2);
  //         }

  //         rowData.push(value);
  //       });

  //       copyData.push(rowData);
  //       structuredData.push(rowData);
  //     }
  //   });

  //   const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

  //   navigator.clipboard
  //     .writeText(tsvContent)
  //     .then(() => {
  //       setCopiedRowsData(() => structuredData);
  //       setCopiedMonthMetadata(() => monthMetadata);
  //       setHasClipboardData(() => true);

  //       toast.success(`Copied ${structuredData.length} rows with all fiscal year data!`, {
  //         autoClose: 3000,
  //       });

  //       Promise.resolve().then(() => {
  //         setSelectedRows(new Set());
  //         setShowCopyButton(false);
  //       });
  //     })
  //     .catch((err) => {
  //       console.error("Copy failed:", err);
  //       toast.error("Failed to copy data.", { autoClose: 3000 });
  //     });
  // };

  const handleCopySelectedRows = async () => {
  if (selectedRows.size === 0) {
    toast.info("No rows selected to copy.", { autoClose: 2000 });
    return;
  }

  // Use ALL durations to ensure all fiscal years are captured
  const allAvailableDurations = [...durations].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNo - b.monthNo;
  });

  // EXACT column order to match your getEmployeeRow structure
  const headers = [
    "ID Type", "ID", "Name", "Account", "Account Name", 
    "Org Id", "Org Name", "Rev", "Brd", "Status", "Total"
  ];

  const monthMetadata = [];
  allAvailableDurations.forEach(duration => {
    const monthName = new Date(duration.year, duration.monthNo - 1)
      .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    headers.push(monthName);
    monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
  });

  const copyData = [headers];
  const structuredData = [];

  selectedRows.forEach(rowIndex => {
    const emp = employees[rowIndex];
    if (emp && emp.emple && !hiddenRows[rowIndex]) {
      const employeeRow = getEmployeeRow(emp, rowIndex);
      
      // Ensure this array matches 'headers' length exactly
      const rowData = [
        employeeRow.idType,
        employeeRow.emplId,
        employeeRow.name,
        employeeRow.acctId,
        employeeRow.acctName,
        employeeRow.orgId,
        employeeRow.orgName || "-", // Added Org Name to prevent shifting
        (emp.emple.isRev ? '✓' : '-'), // Simple string for Excel
        (emp.emple.isBrd ? '✓' : '-'),
        employeeRow.status,
        employeeRow.total, // Positioned at index 10
      ];

      // Add monthly values
      const empMonthAmounts = getMonthAmounts(emp);
      allAvailableDurations.forEach(duration => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
        const forecastValue = empMonthAmounts[uniqueKey]?.value;
        const value = inputValue !== undefined && inputValue !== "" ? inputValue : (forecastValue || "0.00");
        rowData.push(value);
      });

      copyData.push(rowData);
      structuredData.push(rowData);
    }
  });

  const tsvContent = copyData.map(row => row.join('\t')).join('\n');
  navigator.clipboard.writeText(tsvContent).then(() => {
    setCopiedRowsData(structuredData);
    setCopiedMonthMetadata(monthMetadata);
    setHasClipboardData(true);
    toast.success(`Copied ${structuredData.length} rows with all fiscal years!`);
    setSelectedRows(new Set());
    setShowCopyButton(false);
  });
};

  // const handleCopySelectedRows = () => {
  //   if (selectedRows.size === 0) {
  //     toast.info("No rows selected to copy.", { autoClose: 2000 });
  //     return;
  //   }

  //   // COPY ALL DURATIONS (not filtered by fiscal year) - use spread to avoid mutation
  //   // const sortedDurations = [...durations].sort((a, b) => {
  //   //   if (a.year !== b.year) return a.year - b.year;
  //   //   return a.monthNo - b.monthNo;
  //   // });

  //   const headers = [
  //     "ID Type",
  //     "ID",
  //     "Name",
  //     "Account",
  //     "Account Name",
  //     "Organization",
  //     "Rev",
  //     "Brd",
  //     "Status",
  //     "Total",
  //   ];

  //   // Store month metadata for matching during paste
  //   const monthMetadata = [];

  //   // GENERATE MONTH NAMES CORRECTLY
  //   const monthNames = [
  //     "Jan",
  //     "Feb",
  //     "Mar",
  //     "Apr",
  //     "May",
  //     "Jun",
  //     "Jul",
  //     "Aug",
  //     "Sep",
  //     "Oct",
  //     "Nov",
  //     "Dec",
  //   ];

  //   sortedDurations.forEach((duration) => {
  //     // Use direct month mapping instead of Date object
  //     const monthName = `${monthNames[duration.monthNo - 1]} ${duration.year}`;
  //     headers.push(monthName);
  //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
  //   });

  //   const copyData = [headers];
  //   const structuredData = [];

  //   selectedRows.forEach((rowIndex) => {
  //     const emp = employees[rowIndex];
  //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
  //       const employeeRow = getEmployeeRow(emp, rowIndex);
  //       const rowData = [
  //         employeeRow.idType,
  //         employeeRow.emplId,
  //         employeeRow.name,
  //         employeeRow.acctId,
  //         employeeRow.acctName,
  //         employeeRow.orgId,
  //         typeof employeeRow.isRev === "object"
  //           ? "✓"
  //           : employeeRow.isRev === true
  //           ? "✓"
  //           : "-",
  //         typeof employeeRow.isBrd === "object"
  //           ? "✓"
  //           : employeeRow.isBrd === true
  //           ? "✓"
  //           : "-",
  //         employeeRow.status,
  //         employeeRow.total,
  //       ];

  //       sortedDurations.forEach((duration) => {
  //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
  //         const monthAmounts = getMonthAmounts(emp);
  //         const forecastValue = monthAmounts[uniqueKey]?.value;

  //         // Format the value properly
  //         let value = "0.00";
  //         if (
  //           inputValue !== undefined &&
  //           inputValue !== "" &&
  //           inputValue !== null
  //         ) {
  //           value = parseFloat(inputValue).toFixed(2);
  //         } else if (
  //           forecastValue !== undefined &&
  //           forecastValue !== "" &&
  //           forecastValue !== null
  //         ) {
  //           value = parseFloat(forecastValue).toFixed(2);
  //         }

  //         rowData.push(value);
  //       });

  //       copyData.push(rowData);
  //       structuredData.push(rowData);
  //     }
  //   });

  //   const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

  //   navigator.clipboard
  //     .writeText(tsvContent)
  //     .then(() => {
  //       setCopiedRowsData(() => structuredData);
  //       setCopiedMonthMetadata(() => monthMetadata);
  //       setHasClipboardData(() => true);

  //       toast.success(
  //         `Copied ${structuredData.length} rows with all fiscal year data!`,
  //         {
  //           autoClose: 3000,
  //         }
  //       );

  //       // Promise.resolve().then(() => {
  //       //   setSelectedRows(new Set());
  //       //   setShowCopyButton(false);
  //       // });
  //     })
  //     .catch((err) => {
  //       console.error("Copy failed:", err);
  //       toast.error("Failed to copy data.", { autoClose: 3000 });
  //     });
  // };

  // ✅ OPTION 1: Copy WITHOUT orgName (matches existing paste)
// const handleCopySelectedRows = async () => {
//   if (selectedRows.size === 0) {
//     toast.info("No rows selected to copy.", { autoClose: 2000 });
//     return;
//   }

//   const sortedDurations = [...durations].sort((a, b) => {
//     if (a.year !== b.year) return a.year - b.year;
//     return a.monthNo - b.monthNo;
//   });

//   // ✅ MATCH EXISTING PASTE ORDER (10 columns)
//   const headers = [
//     "ID Type", "ID", "Name", "Account", "Account Name", 
//     "OrgId", "Rev", "Brd", "Status", "Total"
//   ];

//   const monthMetadata = [];
//   sortedDurations.forEach(duration => {
//     const monthName = new Date(duration.year, duration.monthNo - 1)
//       .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
//     headers.push(monthName);
//     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
//   });

//   const copyData = [headers];
//   const structuredData = [];

//   selectedRows.forEach(rowIndex => {
//     const emp = employees[rowIndex];
//     if (emp && emp.emple && !hiddenRows[rowIndex]) {
//       const employeeRow = getEmployeeRow(emp, rowIndex);
      
//       const rowData = [
//         employeeRow.idType,
//         employeeRow.emplId,
//         employeeRow.name,
//         employeeRow.acctId,
//         employeeRow.acctName,
//         employeeRow.orgId,           // Position 6 ✅
//         // Skip orgName for copy compatibility
//         (employeeRow.isRev ? '✓' : '-'),
//         (employeeRow.isBrd ? '✓' : '-'),
//         employeeRow.status,
//       ];

//       let totalAmount = 0;
//       sortedDurations.forEach(duration => {
//         const uniqueKey = `${duration.monthNo}${duration.year}`;
//         const inputValue = inputValues[rowIndex]?.[uniqueKey];
//         const monthAmounts = getMonthAmounts(emp);
//         const forecastValue = monthAmounts[uniqueKey]?.value;
//         const value = inputValue !== undefined ? inputValue : forecastValue;
//         totalAmount += value && !isNaN(value) ? Number(value) : 0;
//         rowData.push(value || '0.00');
//       });

//       rowData.unshift(totalAmount.toFixed(2)); // Total column
//       copyData.push(rowData);
//       structuredData.push(rowData);
//     }
//   });

//   const tsvContent = copyData.map(row => row.join('\t')).join('\n');
//   navigator.clipboard.writeText(tsvContent).then(() => {
//     setCopiedRowsData(structuredData);
//     setCopiedMonthMetadata(monthMetadata);
//     setHasClipboardData(true);
//     toast.success(`Copied ${structuredData.length} rows!`, { autoClose: 3000 });
//     setSelectedRows(new Set());
//     setShowCopyButton(false);
//   }).catch(err => {
//     toast.error("Failed to copy data.", { autoClose: 3000 });
//   });
// };


//   const handleCopySelectedRows = async () => {
//   if (selectedRows.size === 0) {
//     toast.info("No rows selected to copy.", { autoClose: 2000 });
//     return;
//   }

//   const sortedDurations = [...durations].sort((a, b) => {
//     if (a.year !== b.year) return a.year - b.year;
//     return a.monthNo - b.monthNo;
//   });

//   // ✅ FIXED: Headers with Org Name column
//   const headers = [
//     "ID Type", "ID", "Name", "Account", "Account Name", 
//     "OrgId", "Org Name", "Rev", "Brd", "Status", "Total"
//   ];

//   const monthMetadata = [];
//   sortedDurations.forEach(duration => {
//     const monthName = new Date(duration.year, duration.monthNo - 1)
//       .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
//     headers.push(monthName);
//     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
//   });

//   const copyData = [headers];
//   const structuredData = [];

//   selectedRows.forEach(rowIndex => {
//     const emp = employees[rowIndex];
//     if (emp && emp.emple && !hiddenRows[rowIndex]) {
//       const employeeRow = getEmployeeRow(emp, rowIndex);
      
//       // ✅ FIXED: Include BOTH orgId AND orgName
//       const rowData = [
//         employeeRow.idType,
//         employeeRow.emplId,
//         employeeRow.name,
//         employeeRow.acctId,
//         employeeRow.acctName,
//         employeeRow.orgId,           // Position 6
//         employeeRow.orgName || '-',  // ✅ Position 7 - Org Name
//         typeof employeeRow.isRev === 'object' ? (employeeRow.isRev ? '✓' : '-') : (employeeRow.isRev ? '✓' : '-'),
//         typeof employeeRow.isBrd === 'object' ? (employeeRow.isBrd ? '✓' : '-') : (employeeRow.isBrd ? '✓' : '-'),
//         employeeRow.status,
//       ];

//       // Add month values
//       let totalAmount = 0;
//       sortedDurations.forEach(duration => {
//         const uniqueKey = `${duration.monthNo}${duration.year}`;
//         const inputValue = inputValues[rowIndex]?.[uniqueKey];
//         const monthAmounts = getMonthAmounts(emp);
//         const forecastValue = monthAmounts[uniqueKey]?.value;
//         const value = inputValue !== undefined ? inputValue : forecastValue;
//         totalAmount += value && !isNaN(value) ? Number(value) : 0;
//         rowData.push(value || '0.00');
//       });

//       rowData.unshift(totalAmount.toFixed(2)); // Total column BEFORE months
//       copyData.push(rowData);
//       structuredData.push(rowData);
//     }
//   });

//   const tsvContent = copyData.map(row => row.join('\t')).join('\n');
  
//   navigator.clipboard.writeText(tsvContent).then(() => {
//     setCopiedRowsData(structuredData);
//     setCopiedMonthMetadata(monthMetadata);
//     setHasClipboardData(true);
//     toast.success(`Copied ${structuredData.length} rows!`, { autoClose: 3000 });
//     setSelectedRows(new Set());
//     setShowCopyButton(false);
//   }).catch(err => {
//     console.error("Copy failed", err);
//     toast.error("Failed to copy data.", { autoClose: 3000 });
//   });
// };


  // const handlePasteMultipleRows = () => {
  //   if (copiedRowsData.length === 0) {
  //     toast.error("No copied data available to paste", { autoClose: 2000 });
  //     return;
  //   }

  //   if (showNewForm) {
  //     setShowNewForm(false);
  //   }

  //   const sortedDurations = [...durations]
  //     .filter((d) => {
  //       if (propFiscalYear === "All") return true;
  //       return d.year === parseInt(propFiscalYear);
  //     })
  //     .sort((a, b) => {
  //       if (a.year !== b.year) return a.year - b.year;
  //       return a.monthNo - b.monthNo;
  //     });

  //   const processedEntries = [];
  //   const processedAmountsArray = [];

  //   copiedRowsData.forEach((rowData) => {
  //     const [
  //       idTypeLabel,
  //       id,
  //       name,
  //       acctId,
  //       acctName,
  //       orgId,
  //       isRev,
  //       isBrd,
  //       status,
  //       ...monthValues
  //     ] = rowData;

  //     const idType =
  //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //       idTypeLabel;

  //     let firstName = "";
  //     let lastName = "";

  //     if (idType === "Vendor" || idType === "Vendor Employee") {
  //       lastName = name;
  //     } else if (idType === "Employee") {
  //       const nameParts = name.split(" ");
  //       firstName = nameParts[0];
  //       lastName = nameParts.slice(1).join(" ");
  //     } else {
  //       firstName = name;
  //     }

  //     const entry = {
  //       id: id,
  //       firstName: firstName,
  //       lastName: lastName,
  //       idType: idType,
  //       acctId: acctId,
  //       orgId: orgId,
  //       perHourRate: "",
  //       status: status || "ACT",
  //       isRev: isRev === "✓",
  //       isBrd: isBrd === "✓",
  //     };

  //     const periodAmounts = {};
  //     const copiedAmountsMap = {};
  //     copiedMonthMetadata.forEach((meta, index) => {
  //       const key = `${meta.monthNo}_${meta.year}`;
  //       copiedAmountsMap[key] = monthValues[index];
  //     });

  //     sortedDurations.forEach((duration) => {
  //       const uniqueKey = `${duration.monthNo}_${duration.year}`;
  //       const value = copiedAmountsMap[uniqueKey];

  //       if (value && value !== "0.00" && value !== "0" && value !== "") {
  //         periodAmounts[uniqueKey] = value;
  //       }
  //     });

  //     processedEntries.push(entry);
  //     processedAmountsArray.push(periodAmounts);
  //   });

  //   setNewEntries(processedEntries);
  //   setNewEntryPeriodAmountsArray(processedAmountsArray);

  //   processedEntries.forEach((entry, index) => {
  //     fetchSuggestionsForPastedEntry(index, entry);
  //   });

  //   setHasClipboardData(false);
  //   setCopiedRowsData([]);
  //   setCopiedMonthMetadata([]);

  //   toast.success(
  //     `Pasted ${processedEntries.length} entries for fiscal year ${propFiscalYear}!`,
  //     { autoClose: 3000 }
  //   );
  // };

  // **NEW OPTIMIZED FUNCTION** - Fetches all data with minimal API calls
  //   const fetchAllSuggestionsOptimizedForAmounts = async (processedEntries) => {
  //     if (processedEntries.length === 0) return;

  //     const encodedProjectId = encodeURIComponent(projectId);

  //     try {
  //       // **STEP 1: Fetch common project-level data ONCE**
  //       let projectData = cachedProjectData;
  //       let orgOptions = cachedOrgData;

  //       // Fetch project data if not cached
  //       if (!projectData) {
  //         const projectResponse = await axios.get(
  //           `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
  //         );
  //         projectData = Array.isArray(projectResponse.data)
  //           ? projectResponse.data[0]
  //           : projectResponse.data;
  //         setCachedProjectData(projectData);
  //       }

  //       // Fetch org data if not cached
  //       if (!orgOptions) {
  //         const orgResponse = await axios.get(
  //           `${backendUrl}/Orgnization/GetAllOrgs`
  //         );
  //         orgOptions = Array.isArray(orgResponse.data)
  //           ? orgResponse.data.map((org) => ({
  //               value: org.orgId,
  //               label: org.orgId,
  //             }))
  //           : [];
  //         setCachedOrgData(orgOptions);
  //       }

  //       // **STEP 2: Group entries by idType to minimize API calls**
  //       const employeeEntries = [];
  //       const vendorEntries = [];

  //       processedEntries.forEach((entry, index) => {
  //         if (entry.idType === "Employee") {
  //           employeeEntries.push({ entry, index });
  //         } else if (
  //           entry.idType === "Vendor" ||
  //           entry.idType === "Vendor Employee"
  //         ) {
  //           vendorEntries.push({ entry, index });
  //         }
  //       });

  //       // **STEP 3: Fetch employee suggestions ONCE per type**
  //       let employeeSuggestions = [];
  //       let vendorSuggestions = [];

  //       // Fetch Employee suggestions only if there are Employee entries
  //       if (employeeEntries.length > 0) {
  //         try {
  //           const response = await axios.get(
  //             `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`
  //           );
  //           employeeSuggestions = Array.isArray(response.data)
  //             ? response.data.map((emp) => {
  //                 const [lastName, firstName] = (emp.employeeName || "")
  //                   .split(", ")
  //                   .map((str) => str.trim());
  //                 return {
  //                   emplId: emp.empId,
  //                   firstName: firstName || "",
  //                   lastName: lastName || "",
  //                   orgId: emp.orgId || "",
  //                   acctId: emp.acctId || "",
  //                 };
  //               })
  //             : [];
  //         } catch (err) {
  //           console.error("Failed to fetch employee suggestions:", err);
  //         }
  //       }

  //       // Fetch Vendor suggestions only if there are Vendor entries
  //       if (vendorEntries.length > 0) {
  //         try {
  //           const response = await axios.get(
  //             `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
  //           );
  //           vendorSuggestions = Array.isArray(response.data)
  //             ? response.data.map((emp) => ({
  //                 emplId: emp.vendId || emp.empId,
  //                 firstName: "",
  //                 lastName: emp.employeeName,
  //                 orgId: emp.orgId || "",
  //                 acctId: emp.acctId || "",
  //               }))
  //             : [];
  //         } catch (err) {
  //           console.error("Failed to fetch vendor suggestions:", err);
  //         }
  //       }

  //       // **STEP 4: Apply cached data to all entries**
  //       processedEntries.forEach((entry, entryIndex) => {
  //         // Set employee/vendor suggestions based on type
  //         if (entry.idType === "Employee") {
  //           setPastedEntrySuggestions((prev) => ({
  //             ...prev,
  //             [entryIndex]: employeeSuggestions,
  //           }));
  //         } else if (
  //           entry.idType === "Vendor" ||
  //           entry.idType === "Vendor Employee"
  //         ) {
  //           setPastedEntrySuggestions((prev) => ({
  //             ...prev,
  //             [entryIndex]: vendorSuggestions,
  //           }));
  //         }

  //         // Set account options based on idType
  //         // let accountsWithNames = [];
  //         // if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
  //         //   accountsWithNames = Array.isArray(
  //         //     projectData.subContractorNonLaborAccounts
  //         //   )
  //         //     ? projectData.subContractorNonLaborAccounts.map((account) => ({
  //         //         id: account.accountId || account,
  //         //         name: account.acctName || account.accountId || String(account),
  //         //       }))
  //         //     : [];
  //         // } else if (entry.idType === "Employee") {
  //         //   accountsWithNames = Array.isArray(
  //         //     projectData.employeeNonLaborAccounts
  //         //   )
  //         //     ? projectData.employeeNonLaborAccounts.map((account) => ({
  //         //         id: account.accountId || account,
  //         //         name: account.acctName || account.accountId || String(account),
  //         //       }))
  //         //     : [];
  //         // } else if (entry.idType === "Other") {
  //         //   accountsWithNames = Array.isArray(
  //         //     projectData.otherDirectCostLaborAccounts
  //         //   )
  //         //     ? projectData.otherDirectCostLaborAccounts.map((account) => ({
  //         //         id: account.accountId || account,
  //         //         name: account.acctName || account.accountId || String(account),
  //         //       }))
  //         //     : [];
  //         // }

  //         // setPastedEntryAccounts((prev) => ({
  //         //   ...prev,
  //         //   [entryIndex]: accountsWithNames,
  //         // }));
  //         if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
  //   accountsWithNames = Array.isArray(projectData.subContractorNonLaborAccounts)
  //     ? projectData.subContractorNonLaborAccounts.map((account) => ({
  //         id: account.accountId || account,
  //         name: account.acctName || account.accountId || String(account),
  //       }))
  //     : [];
  // } else if (entry.idType === "Other") {  // ADD THIS CONDITION
  //   accountsWithNames = Array.isArray(projectData.otherDirectCostNonLaborAccounts)
  //     ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
  //         id: account.accountId || account,
  //         name: account.acctName || account.accountId || String(account),
  //       }))
  //     : [];
  // } else if (entry.idType === "Employee") {
  //   accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
  //     ? projectData.employeeNonLaborAccounts.map((account) => ({
  //         id: account.accountId || account,
  //         name: account.acctName || account.accountId || String(account),
  //       }))
  //     : [];
  // }

  // setPastedEntryAccounts((prev) => ({
  //   ...prev,
  //   [entryIndex]: accountsWithNames,
  // }));

  //         // Set org options (same for all)
  //         setPastedEntryOrgs((prev) => ({
  //           ...prev,
  //           [entryIndex]: orgOptions,
  //         }));
  //       });
  //     } catch (err) {
  //       console.error("Failed to fetch suggestions for pasted entries:", err);
  //     }
  //   };
  const fetchAllSuggestionsOptimizedForAmounts = async (processedEntries) => {
    if (processedEntries.length === 0) return;

    const encodedProjectId = encodeURIComponent(projectId);

    try {
      // **STEP 1: Fetch common project-level data ONCE**
      let projectData = cachedProjectData;
      let orgOptions = cachedOrgData;

      // Fetch project data if not cached
      if (!projectData) {
        const projectResponse = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
        );
        projectData = Array.isArray(projectResponse.data)
          ? projectResponse.data[0]
          : projectResponse.data;
        setCachedProjectData(projectData);
      }

      // Fetch org data if not cached
      if (!orgOptions) {
        const orgResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        orgOptions = Array.isArray(orgResponse.data)
          ? orgResponse.data.map((org) => ({
              value: org.orgId,
              label: org.orgId,
            }))
          : [];
        setCachedOrgData(orgOptions);
      }

      // **STEP 2: Group entries by idType to minimize API calls**
      const employeeEntries = [];
      const vendorEntries = [];

      processedEntries.forEach((entry, index) => {
        if (entry.idType === "Employee") {
          employeeEntries.push({ entry, index });
        } else if (
          entry.idType === "Vendor" ||
          entry.idType === "Vendor Employee"
        ) {
          vendorEntries.push({ entry, index });
        }
      });

      // **STEP 3: Fetch employee suggestions ONCE per type**
      let employeeSuggestions = [];
      let vendorSuggestions = [];

      // Fetch Employee suggestions only if there are Employee entries
      if (employeeEntries.length > 0) {
        try {
          const response = await axios.get(
            `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`
          );
          employeeSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                const [lastName, firstName] = (emp.employeeName || "")
                  .split(", ")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  orgId: emp.orgId || "",
                  acctId: emp.acctId || "",
                };
              })
            : [];
        } catch (err) {
          console.error("Failed to fetch employee suggestions:", err);
        }
      }

      // Fetch Vendor suggestions only if there are Vendor entries
        // if (vendorEntries.length > 0) {
        //   try {
        //     const response = await axios.get(
        //       `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
        //     );
        //     vendorSuggestions = Array.isArray(response.data)
        //       ? response.data.map((emp) => ({
        //           emplId: emp.vendId || emp.empId,
        //           firstName: "",
        //           lastName: emp.employeeName,
        //           orgId: emp.orgId || "",
        //           acctId: emp.acctId || "",
        //         }))
        //       : [];
        //   } catch (err) {
        //     console.error("Failed to fetch vendor suggestions:", err);
        //   }
        // }
      // fix version
      if (vendorEntries.length > 0) {
  try {
    const response = await axios.get(
      `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
    );
    vendorSuggestions = Array.isArray(response.data)
      ? response.data.map((emp) => {
          // ✅ EXACT SAME CONDITION LOGIC AS SINGLE ENTRY
          const vendorEntriesWithIdType = vendorEntries.map(ve => ve.entry);
          
          if (vendorEntriesWithIdType.some(e => e.idType === "Vendor")) {
            // Use vendId for pure Vendor entries
            return {
              emplId: emp.vendId || "",
              firstName: "",
              lastName: emp.employeeName || "",
              orgId: emp.orgId,
              acctId: emp.acctId,
              acctName: emp.acctName || "",
            };
          } else if (vendorEntriesWithIdType.some(e => e.idType === "Vendor Employee")) {
            // Use empId for Vendor Employee entries
            return {
              emplId: emp.empId || "",
              firstName: "",
              lastName: emp.employeeName || "",
              orgId: emp.orgId,
              acctId: emp.acctId,
              acctName: emp.acctName || "",
            };
          } else {
            // Fallback (shouldn't happen for vendor API, but safe)
            return {
              emplId: emp.vendId || emp.empId || "",
              firstName: "",
              lastName: emp.employeeName || "",
              orgId: emp.orgId,
              acctId: emp.acctId,
              acctName: emp.acctName || "",
            };
          }
        })
      : [];
  } catch (err) {
    console.error("Failed to fetch vendor suggestions:", err);
  }
}


      // **STEP 4: Apply cached data to all entries**
      // processedEntries.forEach((entry, entryIndex) => {
      //   // Set employee/vendor suggestions based on type
      //   if (entry.idType === "Employee") {
      //     setPastedEntrySuggestions((prev) => ({
      //       ...prev,
      //       [entryIndex]: employeeSuggestions,
      //     }));
      //   } else if (
      //     entry.idType === "Vendor" ||
      //     entry.idType === "Vendor Employee"
      //   ) {
      //     setPastedEntrySuggestions((prev) => ({
      //       ...prev,
      //       [entryIndex]: vendorSuggestions,
      //     }));
      //   }

      //   // Set account options based on idType
      //   let accountsWithNames = [];

      //   if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
      //     accountsWithNames = Array.isArray(
      //       projectData.subContractorNonLaborAccounts
      //     )
      //       ? projectData.subContractorNonLaborAccounts.map((account) => ({
      //           id: account.accountId || account,
      //           name: account.acctName || account.accountId || String(account),
      //         }))
      //       : [];
      //   } else if (entry.idType === "Other") {
      //     accountsWithNames = Array.isArray(
      //       projectData.otherDirectCostNonLaborAccounts
      //     )
      //       ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
      //           id: account.accountId || account,
      //           name: account.acctName || account.accountId || String(account),
      //         }))
      //       : [];
      //   } else if (entry.idType === "Employee") {
      //     accountsWithNames = Array.isArray(
      //       projectData.employeeNonLaborAccounts
      //     )
      //       ? projectData.employeeNonLaborAccounts.map((account) => ({
      //           id: account.accountId || account,
      //           name: account.acctName || account.accountId || String(account),
      //         }))
      //       : [];
      //   }

      //   setPastedEntryAccounts((prev) => ({
      //     ...prev,
      //     [entryIndex]: accountsWithNames,
      //   }));

      //   // Set org options (same for all)
      //   setPastedEntryOrgs((prev) => ({
      //     ...prev,
      //     [entryIndex]: orgOptions,
      //   }));
      // });
      // **STEP 4: Apply cached data to all entries**
// processedEntries.forEach((entry, entryIndex) => {
//     // Set employee/vendor suggestions based on type
//     if (entry.idType === "Employee") {
//         setPastedEntrySuggestions((prev) => ({
//             ...prev,
//             [entryIndex]: employeeSuggestions,
//         }));
//     } else if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
//         setPastedEntrySuggestions((prev) => ({
//             ...prev,
//             [entryIndex]: vendorSuggestions,
//         }));
//     }

//     // Set account options based on idType
//     // let rawAccounts = [];

//     // if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
//     //     rawAccounts = projectData.subContractorNonLaborAccounts || [];
//     // } else if (entry.idType === "Other") {
//     //     rawAccounts = projectData.otherDirectCostNonLaborAccounts || [];
//     // } else if (entry.idType === "Employee") {
//     //     rawAccounts = projectData.employeeNonLaborAccounts || [];
//     // }

//     // // MAP THE DATA HERE: Use both legacy and backend keys to ensure display
//     // const accountsWithNames = rawAccounts.map((account) => ({
//     //     accountId: account.accountId || account.id || String(account),
//     //     acctName: account.acctName || account.name || String(account),
//     //     // Keep these for internal consistency
//     //     id: account.accountId || account.id || String(account),
//     //     name: account.acctName || account.name || String(account),
//     // }));

//     // setPastedEntryAccounts((prev) => ({
//     //     ...prev,
//     //     [entryIndex]: accountsWithNames,
//     // }));

//     let rawAccounts = [];
//     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
//         rawAccounts = projectData.subContractorNonLaborAccounts || [];
//     } else if (entry.idType === "Other") {
//         rawAccounts = projectData.otherDirectCostNonLaborAccounts || [];
//     } else if (entry.idType === "Employee") {
//         // This targets the data you just showed me
//         rawAccounts = projectData.employeeNonLaborAccounts || [];
//     }

//     const accountsWithNames = rawAccounts.map((account) => ({
//         // Ensure we use accountId and acctName from your backend JSON
//         accountId: account.accountId, 
//         acctName: account.acctName,
//         // Also map to generic id/name for internal component consistency
//         id: account.accountId,
//         name: account.acctName
//     }));

//     setPastedEntryAccounts((prev) => ({
//         ...prev,
//         [entryIndex]: accountsWithNames,
//     }));

//     // Set org options (same for all)
//     setPastedEntryOrgs((prev) => ({
//         ...prev,
//         [entryIndex]: orgOptions,
//     }));
// });
// Logic for Paste Suggestions (inside handlePasteMultipleRows or fetchAllSuggestionsOptimized)
processedEntries.forEach((entry, entryIndex) => {
    let accountsForThisRow = [];
    
    if (entry.idType === "Employee") {
        accountsForThisRow = employeeNonLaborAccounts;
    } else if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
        accountsForThisRow = subContractorNonLaborAccounts;
    } else {
        // "Other" gets everything
        accountsForThisRow = [...employeeNonLaborAccounts, ...subContractorNonLaborAccounts, ...otherDirectCostNonLaborAccounts];
    }

    setPastedEntryAccounts(prev => ({
        ...prev,
        [entryIndex]: accountsForThisRow
    }));
});
    } catch (err) {
      console.error("Failed to fetch suggestions for pasted entries:", err);
    }
  };

  // const handlePasteMultipleRows = async () => {
  //   if (copiedRowsData.length === 0) {
  //     toast.error("No copied data available to paste", { autoClose: 2000 });
  //     return;
  //   }

  //   if (showNewForm) {
  //     setShowNewForm(false);
  //   }

  //   // USE ALL DURATIONS (not filtered) - same as what was copied
  //   const allDurations = [...durations].sort((a, b) => {
  //     if (a.year !== b.year) return a.year - b.year;
  //     return a.monthNo - b.monthNo;
  //   });

  //   const processedEntries = [];
  //   const processedAmountsArray = [];

  //   copiedRowsData.forEach((rowData) => {
  //     const [
  //       idTypeLabel,
  //       rawId, // Rename to rawId to process it
  //       name,
  //       acctId,
  //       acctName,
  //       orgId,
  //       isRev,
  //       isBrd,
  //       status,
  //       total,
  //       ...monthValues
  //     ] = rowData;

  //     const idType =
  //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //       idTypeLabel;

  //     // --- FIX: SANITIZE ID IMMEDIATELY ---
  //     const id = (rawId || "").replace(
  //       /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
  //       ""
  //     );
  //     // ------------------------------------

  //     let firstName = "";
  //     let lastName = "";

  //     if (idType === "Vendor" || idType === "Vendor Employee") {
  //       lastName = name;
  //     } else if (idType === "Employee") {
  //       const nameParts = name.split(" ");
  //       firstName = nameParts[0];
  //       lastName = nameParts.slice(1).join(" ");
  //     } else {
  //       firstName = name;
  //     }

  //     const entry = {
  //       id: id, // Use the sanitized id
  //       firstName: firstName,
  //       lastName: lastName,
  //       idType: idType,
  //       acctId: acctId,
  //       orgId: orgId,
  //       perHourRate: "",
  //       status: status || "ACT",
  //       isRev: isRev === "✓",
  //       isBrd: isBrd === "✓",
  //     };

  //     const periodAmounts = {};

  //     copiedMonthMetadata.forEach((meta, index) => {
  //       const uniqueKey = `${meta.monthNo}_${meta.year}`;
  //       const value = monthValues[index];

  //       if (value && value !== "0.00" && value !== "0" && value !== "") {
  //         periodAmounts[uniqueKey] = value;
  //       }
  //     });

  //     processedEntries.push(entry);
  //     processedAmountsArray.push(periodAmounts);
  //   });

  //   setNewEntries(processedEntries);
  //   setNewEntryPeriodAmountsArray(processedAmountsArray);

  //   setHasClipboardData(false);
  //   setCopiedRowsData([]);
  //   setCopiedMonthMetadata([]);

  //   toast.success(
  //     `Pasted ${processedEntries.length} entries with all fiscal year data!`,
  //     { autoClose: 3000 }
  //   );

    
  //    fetchAllSuggestionsOptimizedForAmounts(processedEntries);

    

    
  // };
  
//   const handlePasteMultipleRows = async () => {
//   if (copiedRowsData.length === 0) {
//     toast.error("No copied data available to paste", { autoClose: 2000 });
//     return;
//   }

//   if (showNewForm) {
//     setShowNewForm(false);
//   }

//   // USE ALL DURATIONS (not filtered) - same as what was copied
//   const allDurations = [...durations].sort((a, b) => {
//     if (a.year !== b.year) return a.year - b.year;
//     return a.monthNo - b.monthNo;
//   });

//   const processedEntries = [];
//   const processedAmountsArray = [];

//   copiedRowsData.forEach((rowData) => {
//     // ✅ FIXED: Match EXACT copy order (11 columns before months)
//     const [
//       idTypeLabel,
//       rawId, // ID
//       name,
//       acctId,
//       acctName,
//       orgId,      // Position 6 ✅ OrgId
//       orgName,    // Position 7 ✅ Org Name (NEW)
//       isRev,
//       isBrd,
//       status,
//       total,
//       ...monthValues
//     ] = rowData;

//     const idType =
//       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
//       idTypeLabel;

//     // --- FIX: SANITIZE ID IMMEDIATELY ---
//     const id = (rawId || "").replace(
//       /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
//       ""
//     );
//     // ------------------------------------

//     let firstName = "";
//     let lastName = "";

//     if (idType === "Vendor" || idType === "Vendor Employee") {
//       lastName = name;
//     } else if (idType === "Employee") {
//       const nameParts = name.split(" ");
//       firstName = nameParts[0];
//       lastName = nameParts.slice(1).join(" ");
//     } else {
//       firstName = name;
//     }

//     // ✅ FIXED: Include orgName from paste data
//     const entry = {
//       id: id,           // Sanitized ID
//       firstName: firstName,
//       lastName: lastName,
//       idType: idType,
//       acctId: acctId,
//       orgId: orgId,     // ✅ Correct position 6
//       orgName: orgName || '',  // ✅ NEW from position 7
//       perHourRate: "",
//       status: status || "ACT",
//       isRev: isRev === "✓",
//       isBrd: isBrd === "✓",
//     };

//     const periodAmounts = {};

//     copiedMonthMetadata.forEach((meta, index) => {
//       const uniqueKey = `${meta.monthNo}_${meta.year}`;
//       const value = monthValues[index];

//       if (value && value !== "0.00" && value !== "0" && value !== "") {
//         periodAmounts[uniqueKey] = value;
//       }
//     });

//     processedEntries.push(entry);
//     processedAmountsArray.push(periodAmounts);
//   });

//   setNewEntries(processedEntries);
//   setNewEntryPeriodAmountsArray(processedAmountsArray);

//   setHasClipboardData(false);
//   setCopiedRowsData([]);
//   setCopiedMonthMetadata([]);

//   toast.success(
//     `Pasted ${processedEntries.length} entries with Org Names & fiscal year data!`,
//     { autoClose: 3000 }
//   );

//   fetchAllSuggestionsOptimizedForAmounts(processedEntries);
// };
  
const handlePasteMultipleRows = async () => {
  if (copiedRowsData.length === 0) {
    toast.error("No copied data available to paste", { autoClose: 2000 });
    return;
  }

  if (showNewForm) {
    setShowNewForm(false);
  }

  // USE ALL DURATIONS (not filtered) - same as what was copied
  const allDurations = [...durations].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNo - b.monthNo;
  });

  const processedEntries = [];
  const processedAmountsArray = [];

  copiedRowsData.forEach((rowData) => {
    // ✅ FIXED: Added orgName (position 7) - Keep ALL existing logic
    const [
      idTypeLabel,
      rawId,
      name,
      acctId,
      acctName,
      orgId,           // Position 6
      orgName,         // ✅ NEW Position 7 (ignore if empty)
      isRev,           // Position 8  
      isBrd,           // Position 9
      status,
      total,
      ...monthValues
    ] = rowData;

    const idType =
      ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
      idTypeLabel;

    // --- FIX: SANITIZE ID IMMEDIATELY ---
    const id = (rawId || "").replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    );

    let firstName = "";
    let lastName = "";

    if (idType === "Vendor" || idType === "Vendor Employee") {
      lastName = name;
    } else if (idType === "Employee") {
      const nameParts = name.split(" ");
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    } else {
      firstName = name;
    }

    // ✅ Keep ALL existing entry logic + ADD orgName
    const entry = {
      id: id,
      firstName: firstName,
      lastName: lastName,
      idType: idType,
      acctId: acctId,
      orgId: orgId,
      orgName: orgName || '',  // ✅ NEW - store orgName from paste
      perHourRate: "",
      status: status || "ACT",
      isRev: isRev === "✓",
      isBrd: isBrd === "✓",
    };

    // ✅ ALL existing month logic - UNCHANGED
    const periodAmounts = {};
    copiedMonthMetadata.forEach((meta, index) => {
      const uniqueKey = `${meta.monthNo}_${meta.year}`;
      const value = monthValues[index];
      if (value && value !== "0.00" && value !== "0" && value !== "") {
        periodAmounts[uniqueKey] = value;
      }
    });

    processedEntries.push(entry);
    processedAmountsArray.push(periodAmounts);
  });

  setNewEntries(processedEntries);
  setNewEntryPeriodAmountsArray(processedAmountsArray);

  setHasClipboardData(false);
  setCopiedRowsData([]);
  setCopiedMonthMetadata([]);

  toast.success(
    `Pasted ${processedEntries.length} entries with all fiscal year data!`,
    { autoClose: 3000 }
  );

  fetchAllSuggestionsOptimizedForAmounts(processedEntries);
};


  const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
    const encodedProjectId = encodeURIComponent(projectId);

    // **OPTIMIZATION: Use cached data instead of fetching for each entry**
    try {
      let projectData = cachedProjectData;
      let orgOptions = cachedOrgData;
      let employeeSuggestions = [];
      let vendorSuggestions = [];

      // Only fetch project data if not already cached
      if (!projectData) {
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
        );
        projectData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        setCachedProjectData(projectData);
      }

      // Only fetch org data if not already cached
      if (!orgOptions) {
        const orgResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        orgOptions = Array.isArray(orgResponse.data)
          ? orgResponse.data.map((org) => ({
              value: org.orgId,
              label: org.orgId,
            }))
          : [];
        setCachedOrgData(orgOptions);
      }

      // **NEW: Fetch employee suggestions ONCE and cache**
      if (entry.idType === "Employee") {
        // Check if already fetched
        const cacheKey = `employee_${projectId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          employeeSuggestions = JSON.parse(cached);
        } else {
          const response = await axios.get(
            `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}`
          );
          employeeSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                const [lastName, firstName] = (emp.employeeName || "")
                  .split(", ")
                  .map((str) => str.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  orgId: emp.orgId || "",
                  acctId: emp.acctId || "",
                };
              })
            : [];
          sessionStorage.setItem(cacheKey, JSON.stringify(employeeSuggestions));
        }

        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: employeeSuggestions,
        }));
      } else if (
        entry.idType === "Vendor" ||
        entry.idType === "Vendor Employee"
      ) {
        // Check if already fetched
        const cacheKey = `vendor_${projectId}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          vendorSuggestions = JSON.parse(cached);
        } else {
          const response = await axios.get(
            `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}`
          );
          // vendorSuggestions = Array.isArray(response.data)
          //   ? response.data.map((emp) => ({
          //       emplId: emp.vendId || emp.empId,
          //       firstName: "",
          //       lastName: emp.employeeName,
          //       orgId: emp.orgId || "",
          //       acctId: emp.acctId || "",
          //     }))
          //   : [];
          vendorSuggestions = Array.isArray(response.data)
      ? response.data.map((emp) => {
          if (entry.idType === "Vendor" || newEntries.some(e => e.idType === "Vendor")) {
            return {
              emplId: emp.vendId || "",
              firstName: "",
              lastName: emp.employeeName || "",
              orgId: emp.orgId || "",
              acctId: emp.acctId || "",
              acctName: emp.acctName || "",
            };
          } else if (entry.idType === "Vendor Employee" || newEntries.some(e => e.idType === "Vendor Employee")) {
            return {
              emplId: emp.empId || "",
              firstName: "",
              lastName: emp.employeeName || "",
              orgId: emp.orgId || "",
              acctId: emp.acctId || "",
              acctName: emp.acctName || "",
            };
          } else {
            // Fallback to existing logic
            return {
              emplId: emp.vendId || emp.empId || "",
              firstName: "",
              lastName: emp.employeeName || "",
              orgId: emp.orgId || "",
              acctId: emp.acctId || "",
              acctName: emp.acctName || "",
            };
          }
        })
      : [];
          sessionStorage.setItem(cacheKey, JSON.stringify(vendorSuggestions));
        }

        setPastedEntrySuggestions((prev) => ({
          ...prev,
          [entryIndex]: vendorSuggestions,
        }));
      }

      // Now use the cached data to populate entry-specific options
      let accountsWithNames = [];
      if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
        accountsWithNames = Array.isArray(
          projectData.subContractorNonLaborAccounts
        )
          ? projectData.subContractorNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      } else if (entry.idType === "Employee") {
        accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
          ? projectData.employeeNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      } else if (entry.idType === "Other") {
        accountsWithNames = Array.isArray(
          projectData.otherDirectCostNonLaborAccounts
        )
          ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
              id: account.accountId || account,
              name: account.acctName || account.accountId || String(account),
            }))
          : [];
      }

      setPastedEntryAccounts((prev) => ({
        ...prev,
        [entryIndex]: accountsWithNames,
      }));

      setPastedEntryOrgs((prev) => ({
        ...prev,
        [entryIndex]: orgOptions,
      }));
    } catch (err) {
      console.error(
        `Failed to fetch pasted entry options for index ${entryIndex}:`,
        err
      );
    }
  };

  const addNewEntryForm = () => {
    const newEntry = {
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: "",
      acctId: "",
      orgId: "",
      perHourRate: "",
      status: "Act",
    };
    setNewEntries((prev) => [...prev, newEntry]);
    setNewEntryPeriodAmountsArray((prev) => [...prev, {}]);
  };

  const removeNewEntryForm = (index) => {
    setNewEntries((prev) => prev.filter((_, i) => i !== index));
    setNewEntryPeriodAmountsArray((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewEntry = (index, updates) => {
    setNewEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
    );
  };

  const updateNewEntryPeriodAmounts = (index, periodAmounts) => {
    setNewEntryPeriodAmountsArray((prev) =>
      prev.map((amounts, i) =>
        i === index ? { ...amounts, ...periodAmounts } : amounts
      )
    );
  };

  const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };
  return (
    <div className="relative p-4 font-inter w-full synchronized-tables-outer">
      
  
      <div className="w-full flex justify-between mb-1 gap-2">
         <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-md sm:text-md blue-text">
           Other Cost
          </span>
        </div>
        <div className="flex-grow"></div>
        <div className="flex gap-2">
          {Object.values(hiddenRows).some(Boolean) && (
            <button
              className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
              onClick={showHiddenRows}
            >
              Show Hidden Rows
            </button>
          )}

          {isEditable && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Create a new entry object
                  const newEntryItem = {
                    id: "",
                    firstName: "",
                    lastName: "",
                    isRev: false,
                    isBrd: false,
                    idType: "",
                    acctId: "",
                    orgId: "",
                    perHourRate: "",
                    status: "Act",
                  };

                  // Add the new entry and its corresponding period amounts array entry
                  setNewEntries((prev) => [...prev, newEntryItem]);
                  setNewEntryPeriodAmountsArray((prev) => [...prev, {}]);
                  setShowNewForm(true); // Ensure the section is visible
                }}
                className={`btn-click`}
  //                   className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
  //           style={{
  //   ...geistSansStyle,
  //   backgroundColor:  "#113d46",
  // }} 
              >
                New
              </button>

              {/* {newEntries.length > 0 && (
                <button
                  onClick={() => {
                    // Removes the last added entry
                    const updatedEntries = newEntries.slice(0, -1);
                    setNewEntries(updatedEntries);
                    setNewEntryPeriodAmountsArray((prev) => prev.slice(0, -1));

                    if (updatedEntries.length === 0) {
                      setShowNewForm(false);
                    }
                    toast.info("Last new entry cancelled.", {
                      autoClose: 1500,
                    });
                  }}
                  className="px-4 py-2   bg-gray-500 text-white  hover:bg-gray-600 rounded text-xs font-medium"
                >
                  Cancel
                </button>
              )} */}
            </div>
          )}

          {/* {isEditable && (
  <div className="flex gap-2">
    <button
      onClick={() => {
        // If form already visible, DO NOTHING – user should use Copy/Paste or Fill
        if (showNewForm) return;

        // Guard double-clicks
        if (isAddingNewEntry) return;
        setIsAddingNewEntry(true);

        // Show the section and create ONLY ONE first entry
        setShowNewForm(true);

        setNewEntries([
          {
            id: "",
            firstName: "",
            lastName: "",
            isRev: false,
            isBrd: false,
            idType: "",
            acctId: "",
            orgId: "",
            perHourRate: "",
            status: "Act",
          },
        ]);

        setNewEntryPeriodAmountsArray([{}]);

        setTimeout(() => setIsAddingNewEntry(false), 300);
      }}
      disabled={isAddingNewEntry}
      className="px-4 py-2 blue-btn-common text-white rounded text-xs font-medium disabled:opacity-50"
    >
      {isAddingNewEntry ? "Adding..." : "New"}
    </button>

    {(showNewForm || newEntries.length > 0) && newEntries.length > 0 && (
      <button
        onClick={() => {
          setNewEntries((prev) => {
            if (prev.length <= 1) {
              setNewEntryPeriodAmountsArray([]);
              setShowNewForm(false);
              return [];
            }
            const updated = prev.slice(0, -1);
            setNewEntryPeriodAmountsArray((amountsPrev) =>
              amountsPrev.slice(0, updated.length)
            );
            return updated;
          });
        }}
        className="px-4 py-2 bg-gray-400 text-white rounded text-xs font-medium"
      >
        Cancel
      </button>
    )}
  </div>
)} */}

          {/* Copy/Paste Buttons */}
          {showCopyButton && newEntries.length === 0 && (
            <button
              onClick={handleCopySelectedRows}
              className={`btn-click`}
  //              className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
  //           style={{
  //   ...geistSansStyle,
  //   backgroundColor:  "#113d46",
  // }} 
            >
              Copy Selected ({selectedRows.size})
            </button>
          )}

          {/* Paste button - only show when has clipboard data and NOT in new form mode */}
          {/* {hasClipboardData && !showNewForm && newEntries.length === 0 && status === "In Progress" && (
            <button
              onClick={handlePasteMultipleRows}
              className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700"
            >
              Paste ({copiedRowsData.length} data)
            </button>
          )} */}
          {/* {hasClipboardData && !showNewForm && newEntries.length === 0    (
  <button
    onClick={handlePasteMultipleRows}
    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700"
  >
    Paste ({copiedRowsData.length} rows)
  </button>
)} */}

          {hasClipboardData &&
            !showNewForm &&
            newEntries.length === 0 &&
            initialData.status === "In Progress" && (
              <button
                onClick={handlePasteMultipleRows}
                className={`btn-click`}
  //                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
  //           style={{
  //   ...geistSansStyle,
  //   backgroundColor:  "#113d46",
  // }} 
              >
                Paste ({copiedRowsData.length} rows)
              </button>
            )}

          {/* Save Entry Button - Shows for BOTH single new form AND pasted entries */}
          {/* {(showNewForm || newEntries.length > 0) && (
    <button
      onClick={() => {
        if (newEntries.length > 0) {
          // Save all pasted entries using existing logic
          handleSaveNewEntry(); // You'll need to modify this to handle multiple
        } else {
          // Save single new entry
          handleSaveNewEntry();
        }
      }}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
    >
      {newEntries.length > 0 ? `Save All (${newEntries.length})` : "Save Entry"}
    </button>
  )} */}
          {/* Save Entry Button - Shows for BOTH single new form AND pasted entries */}
          {/* {(showNewForm || newEntries.length > 0) && (
            <button
              onClick={() => {
                if (newEntries.length > 0) {
                  // Save all pasted entries using NEW function
                  handleSaveMultiplePastedEntries();
                } else {
                  // Save single new entry
                  handleSaveNewEntry();
                }
              }}
              // className="px-4 py-2 blue-btn-common text-white rounded  text-xs font-medium"
               className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
            style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : newEntries.length > 0
                ? `Save All (${newEntries.length})`
                : "Save Entry"}
            </button>
          )} */}

          {/* {!showNewForm && !shouldHideButtons && (
            <button
              // className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
               className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
            style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
              onClick={() => {
                if (isEditable) {
                  setShowFindReplace(true);
                }
              }}
              // disabled={!isEditable}
            >
              Find / Replace
            </button>
          )} */}

          {isEditable && !showNewForm && !shouldHideButtons && (
  <button
    // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
    // style={{
    //   ...geistSansStyle,
    //   backgroundColor: "#113d46",
    // }}
    className={`btn-click`}
    onClick={() => {
      // Logic is already safe, but double check is good
      if (isEditable) {
        setShowFindReplace(true);
      }
    }}
  >
    Find / Replace
  </button>
)}

          {/* <button
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
    onClick={() => {
      if (!selectedEmployeeId) {
        toast.error("Please select an employee to delete");
        return;
      }
      handleDeleteEmployee(selectedEmployeeId);
    }}
  >
    Delete
  </button> */}

          {/* Delete Button */}
          {/* {!shouldHideButtons && (
            <button
              className={`px-4 py-2 text-white rounded transition text-xs font-medium cursor-pointer ${
                shouldDisableDelete
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              onClick={() => {
                if (!selectedEmployeeId) {
                  toast.error("Please select an record to delete");
                  return;
                }
                // if (
                //   window.confirm(
                //     "Are you sure you want to delete this employee?"
                //   )
                // ) 
                {
                  handleDeleteEmployee(selectedEmployeeId);
                  setSelectedEmployeeId(null);
                }
              }}
              disabled={shouldDisableDelete}
            >
              Delete
            </button>
          )} */}


          {/* {isEditable && !shouldHideButtons && (
  <button
    className={`px-4 py-2 text-white rounded transition text-xs font-medium cursor-pointer ${
      shouldDisableDelete
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-500 hover:bg-red-600"
    }`}
    onClick={() => {
      if (!selectedEmployeeId) {
        toast.error("Please select a record to delete");
        return;
      }
      handleDeleteEmployee(selectedEmployeeId);
      setSelectedEmployeeId(null);
    }}
    disabled={shouldDisableDelete}
  >
    Delete
  </button>
)} */}

{isEditable && !shouldHideButtons && (
  <button
    className={`btn-click ${
      shouldDisableDelete || (selectedRows.size === 0 && !selectedEmployeeId)
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-500 hover:bg-red-600"
    }`}
    onClick={handleDeleteEmployee} // Call the new bulk handler
    disabled={shouldDisableDelete || (selectedRows.size === 0 && !selectedEmployeeId)}
  >
    {selectedRows.size > 1 ? `Delete Selected (${selectedRows.size})` : "Delete"}
  </button>
)}

          {/* {showNewForm && (
    <button
      onClick={handleSaveNewEntry}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
    >
      Save Entry
    </button>
  )} */}

          {/* {showNewForm || checkedRows.size > 0 ? (
            <button
              // className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
               className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
            style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
              onClick={() => {
                if (isEditable) {
                  setShowFillValues(true);
                }
              }}
            >
              Fill Values
            </button>
          )} */}

          {/* Updated Fill Values Button Condition */}
{(showNewForm || selectedRows.size > 0) && (
  <button
    // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
    // style={{
    //   ...geistSansStyle,
    //   backgroundColor: "#113d46",
    // }}
    className={`btn-click`}
    onClick={() => {
      if (isEditable) {
        setShowFillValues(true);
      }
    }}
  >
    Fill Values
  </button>
)}

          {/* Combined Save button for both amounts and field changes */}
          {/* {(hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
    <button
      onClick={handleSaveAllChanges}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
      disabled={isLoading}
    >
      {isLoading ? "Saving..." : "Save"}
    </button>
  )} */}
          {/* Combined Save and Cancel buttons for both amounts and field changes */}
          {/* {(hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
            <>
              <button
                onClick={handleSaveAllChanges}
                className="blue-btn-common  disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : `Save Changes (${
                      Object.keys(modifiedAmounts).length +
                      (hasUnsavedFieldChanges ? 1 : 0)
                    })`}
              </button>
              <button
                onClick={handleCancelAllChanges}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
            </>
          )} */}
          {/* CONSOLIDATED CANCEL BUTTON */}
{/* {(showNewForm || 
  newEntries.length > 0 || 
  hasUnsavedAmountChanges || 
  hasUnsavedFieldChanges) && (
  <button
    onClick={() => {
      // 1. Prioritize removing the latest New Entry form (LIFO)
      if (newEntries.length > 0) {
        const updatedEntries = newEntries.slice(0, -1);
        const updatedAmounts = newEntryPeriodAmountsArray.slice(0, -1);
        setNewEntries(updatedEntries);
        setNewEntryPeriodAmountsArray(updatedAmounts);

        if (updatedEntries.length === 0) {
          setShowNewForm(false);
        }
        return; // Exit here so we only cancel one form per click
      }

      // 2. Revert Grid Amount changes instantly
      if (hasUnsavedAmountChanges) {
        setInputValues({});        
        setModifiedAmounts({});      
        setHasUnsavedAmountChanges(false);
        setFindMatches([]);
      }

      // 3. Revert Field changes (Account/Org) instantly
      if (hasUnsavedFieldChanges) {
        setEditedRowData({}); 
        setEditingRowIndex(null);
        setHasUnsavedFieldChanges(false);
      }

      // 4. Cleanup single form state
      if (showNewForm) setShowNewForm(false);
      
      setHasClipboardData(false);
      setCopiedRowsData([]);
      toast.info("Changes reverted", { autoClose: 1500 });
    }}
  className="px-4 py-2 blue-btn-common text-white rounded text-xs font-medium"
  >
    Cancel
  </button>
)} */}

{/* Change the Save button condition to include field changes */}
{/* {(hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
  <button
    onClick={handleSaveAllChanges}
    // className="blue-btn-common text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2"
     className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
            style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
    disabled={isLoading}
  >
    {isLoading ? (
      "Saving..."
    ) : (
      `Save Changes (${
        Object.keys(modifiedAmounts).length + (hasUnsavedFieldChanges ? 1 : 0)
      })`
    )}
  </button>
)} */}

{/* ONE UNIFIED SAVE BUTTON */}
{(newEntries.length > 0 || hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
  <button
    onClick={handleMasterSave}
    // className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white"
    // style={{
    //   ...geistSansStyle,
    //   backgroundColor: "#113d46",
    // }}
    className={`btn-click`}
    disabled={isLoading}
  >
    {isLoading ? (
      "Saving..."
    ) : (
      `Save All (${
        newEntries.length + 
        Object.keys(modifiedAmounts).length + 
        (hasUnsavedFieldChanges ? 1 : 0)
      })`
    )}
  </button>
)}

{/* CONSOLIDATED CANCEL BUTTON */}
{/* CONSOLIDATED CANCEL BUTTON */}
{/* {(showNewForm || 
  newEntries.length > 0 || 
  hasUnsavedAmountChanges || 
  hasUnsavedFieldChanges) && (
  <button
    onClick={() => {
      // 1. Prioritize removing New Entry forms in LIFO order if they exist
      if (newEntries.length > 0) {
        const updatedEntries = newEntries.slice(0, -1);
        const updatedAmounts = newEntryPeriodAmountsArray.slice(0, -1);
        setNewEntries(updatedEntries);
        setNewEntryPeriodAmountsArray(updatedAmounts);

        // If that was the last form, hide the section
        if (updatedEntries.length === 0) {
          setShowNewForm(false);
          resetNewEntry(); // Use the correct function name defined at line 984
        }
      } 
      
      // 2. If no "multiple" entries exist, but the single form or grid changes exist
      else {
        // Hide and reset single new form if open
        if (showNewForm) {
          setShowNewForm(false);
          resetNewEntry(); // Use the correct function name defined at line 984
        }

        // ALWAYS Revert existing grid changes (Amounts and Fields) instantly in runtime
        if (hasUnsavedAmountChanges) {
          setInputValues({});        
          setModifiedAmounts({});      
          setHasUnsavedAmountChanges(false);
        }

        if (hasUnsavedFieldChanges) {
          setEditedRowData({}); 
          setEditingRowIndex(null);
          setHasUnsavedFieldChanges(false);
        }

        // Cleanup other states
        setFindMatches([]);
        setHasClipboardData(false);
        setCopiedRowsData([]);
      }
      
      toast.info("Changes reverted", { autoClose: 1500 });
    }}
    className="px-4 py-2 blue-btn-common text-white rounded text-xs font-medium"
  >
    Cancel
  </button>
)}     */}
{/* {(showNewForm || newEntries.length > 0 || hasUnsavedAmountChanges || hasUnsavedFieldChanges) && (
  <button
    onClick={() => {
      // 1. Revert New Entry forms
      if (newEntries.length > 0) {
        setNewEntries([]);
        setNewEntryPeriodAmountsArray([]);
        setShowNewForm(false);
      } 
      
      // 2. Hide single manual form
      if (showNewForm) setShowNewForm(false);

      // 3. Revert Grid Amount changes
      if (hasUnsavedAmountChanges) {
        setInputValues({});         
        setModifiedAmounts({});      
        setHasUnsavedAmountChanges(false);
      }

      // 4. Revert Field changes (Account/Org)
      if (hasUnsavedFieldChanges) {
        setEditedRowData({});  
        setEditingRowIndex(null);
        setHasUnsavedFieldChanges(false);
      }

      setFindMatches([]);
      setHasClipboardData(false);
      setCopiedRowsData([]);
      toast.info("Changes reverted", { autoClose: 1500 });
    }}
    className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer transition-colors text-white"
     style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
  >
    Cancel
  </button>
)} */}

{(newEntries.length > 0 || hasUnsavedAmountChanges || hasUnsavedFieldChanges || showNewForm) && (
  <button
    onClick={() => {
      // 1. LIFO: Prioritize removing the latest New Entry form if multiple exist
      if (newEntries.length > 0) {
        const updatedEntries = newEntries.slice(0, -1);
        const updatedAmounts = newEntryPeriodAmountsArray.slice(0, -1);
        setNewEntries(updatedEntries);
        setNewEntryPeriodAmountsArray(updatedAmounts);

        if (updatedEntries.length === 0) {
          setShowNewForm(false);
          resetNewEntry();
        }
        return; 
      }

      // 2. Otherwise, revert grid changes and hide form
      if (hasUnsavedAmountChanges) {
        setInputValues({});         
        setModifiedAmounts({});      
        setHasUnsavedAmountChanges(false);
      }

      if (hasUnsavedFieldChanges) {
        setEditedRowData({});  
        setEditingRowIndex(null);
        setHasUnsavedFieldChanges(false);
      }

      if (showNewForm) setShowNewForm(false);
      
      setFindMatches([]);
      setHasClipboardData(false);
      setCopiedRowsData([]);
      toast.info("Changes reverted", { autoClose: 1500 });
    }}
    // className="px-4 py-2 blue-btn-common text-white rounded text-xs font-medium cursor-pointer"
    // style={{
    //     ...geistSansStyle,
    //     backgroundColor: "#113d46", // Keeping your requested color
    // }}
    className={`btn-click`}
  >
    Cancel
  </button>
)}


        </div>
      </div>

      {/* {showFillValues && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              Fill Values to selected record/s
            </h3>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Select Fill Method
              </label>
              <select
                value={fillMethod}
                onChange={(e) => setFillMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              >
                <option value="None">None</option>
                <option value="Copy From Source Record">
                  Copy from source record
                </option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Start Period
              </label>
              <input
                type="text"
                value={startDate}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 text-xs bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                End Period
              </label>
              <input
                type="text"
                value={endDate}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 text-xs bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFillValues(false);
                  setFillMethod("None");
                  setSourceRowIndex(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleFillValues}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
              >
                Fill
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* {showFillValues && (
                         <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
       
            <h3 className="text-lg font-semibold mb-4">
              Fill Values to New Entries
            </h3>

       

 <div>
     {selectedRows.size > 0 && (
  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
    <p className="font-bold mb-1">Selected Source:</p>
    {Array.from(selectedRows).map(idx => {
      const emp =  employees[idx]?.emple;
      return (
        <div key={idx} className="border-b border-blue-100 pb-1 mb-1 last:border-0">
          ID: {emp?.emplId} | Acc: {emp?.accId} | Org: {emp?.orgId} 
        </div>
      );
    })}
  </div>
)}
  </div>


            
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Select Fill Method
              </label>
              <select
                value={fillMethod}
                onChange={(e) => {
                  setFillMethod(e.target.value);
                  // Clear single index selection when changing mode, as it's only needed for debugging single source
                  setSelectedRowIndex(null);
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              >
                <option value="None">None</option>
                <option value="Copy From Source Record">
                  Copy From Source Record
                </option>
                <option value="Specify Amounts">Specify Amounts</option>
                <option value="Use Start Period Amounts">
                  Use Start Period Amounts
                </option>
              </select>
            </div>

           


            
            {fillMethod === "Specify Amounts" && (
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fillAmounts}
                  onChange={(e) =>
                    setFillAmounts(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-full p-2 border rounded text-xs"
                  placeholder="Enter amount"
                />
              </div>
            )}
 
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Start Period
              </label>
              <input
                type="date"
                value={fillStartDate || ""}
                onChange={(e) => setFillStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              />
            </div>


            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                End Period
              </label>
              <input
                type="date"
                value={fillEndDate || ""}
                onChange={(e) => setFillEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFillValues(false);
                  setFillMethod("None");
                  setFillAmounts("");
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  // setSelectedRows(new Set());
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                // onClick={handleFillValuesAmounts}
                onClick={() => {
    // REQUIREMENT: Toast if copy selected but no rows checked
    if (fillMethod === "Copy From Source Record" && selectedRows.size === 0) {
      toast.error("Source row is not selected. Please check a row in the grid first.", {
        toastId: "source-not-selected"
      });
      return;
    }
    handleFillValuesAmounts(); 
  }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                disabled={
                  fillMethod === "None" 
                  // (fillMethod === "Copy From Source Record" &&
                  //   selectedRows.size === 0)
                }
              >
                Fill Value
              </button>
            </div>
          </div>
        </div>
        </div>
      )} */}

{/* {showFillValues && (
  <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm font-inter">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Fill Values</h3>

      
       <div>
     {selectedRows.size > 0 && (
  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
    <p className="font-bold mb-1">Selected Source:</p>
    {Array.from(selectedRows).map(idx => {
      const emp =  employees[idx]?.emple;
      return (
        <div key={idx} className="border-b border-blue-100 pb-1 mb-1 last:border-0">
          ID: {emp?.emplId} | Acc: {emp?.accId} | Org: {emp?.orgId} 
        </div>
      );
    })}
  </div>
)}
  </div>


        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-tight">Select Fill Method</label>
          <select
            value={fillMethod}
            onChange={(e) => setFillMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="None">None</option>
            <option value="Copy From Source Record">Copy from Source Record</option>
            <option value="Specify Amounts">Specify Amounts</option>
            <option value="Use Start Period Amounts">Use Start Period Amounts</option>
          </select>
        </div>

       
        {fillMethod === "Copy From Source Record" && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1">
            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-tight">
              Select Record to Fill
            </label>
            <select
              value={selectedSourceIdx}
              onChange={(e) => setSelectedSourceIdx(e.target.value)}
              className="w-full border border-blue-300 bg-blue-50 rounded-md p-2 text-xs outline-none"
            >
              <option value="">-- Choose a source --</option>
              {employees.map((emp, idx) => {
                // DON'T show rows in dropdown that are already checked as targets
                if (selectedRows.has(idx)) return null;
                return (
                  <option key={idx} value={idx}>
                    {emp.emple?.emplId} | {emp.emple?.accId} | {emp.emple?.orgId}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {fillMethod === "Specify Amounts" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Amount</label>
            <input
              type="text"
              value={fillAmounts}
              onChange={(e) => setFillAmounts(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full p-2 border border-gray-300 rounded-md text-xs"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-[10px] font-bold uppercase mb-1">Start Period</label>
            <input
              type="date"
              value={fillStartDate || ""}
              onChange={(e) => setFillStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-[10px] font-bold uppercase mb-1">End Period</label>
            <input
              type="date"
              value={fillEndDate || ""}
              onChange={(e) => setFillEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowFillValues(false);
              setFillMethod("None");
              setSelectedSourceIdx("");
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-xs font-medium hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (fillMethod === "Copy From Source Record" && selectedSourceIdx === "") {
                toast.error("Please select a source record.");
                return;
              }
              handleFillValuesAmounts(); 
            }}
            className="px-4 py-2 bg-[#113d46] text-white rounded-md text-xs font-medium disabled:opacity-50 transition-colors shadow-sm"
            disabled={fillMethod === "None" || (selectedRows.size === 0 && newEntries.length === 0)}
          >
            Fill Value
          </button>
        </div>
      </div>
    </div>
  </div>
)} */}

{showFillValues && (
  <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm font-inter">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Fill Values</h3>

       

        
        <div>
          {selectedRows.size > 0 && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
              <p className="font-bold mb-1">Selected Source:</p>
              {Array.from(selectedRows).map(idx => {
                const emp = employees[idx]?.emple;
                return (
                  <div key={idx} className="border-b border-blue-100 pb-1 mb-1 last:border-0">
                    ID: {emp?.emplId} | Acc: {emp?.accId} | Org: {emp?.orgId} 
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-tight">Select Fill Method</label>
          <select
            value={fillMethod}
            onChange={(e) => setFillMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="None">None</option>
            <option value="Copy From Source Record">Copy from Source Record</option>
            <option value="Specify Amounts">Specify Amounts</option>
            <option value="Use Start Period Amounts">Use Start Period Amounts</option>
          </select>
        </div>

        {/* Dropdown: Shows destination candidates (excludes the checked source row) */}
        {fillMethod === "Copy From Source Record" && newEntries.length === 0 && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1">
            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-tight">
              Select Record to Fill (Destination)
            </label>
            <select
              value={selectedSourceIdx}
              onChange={(e) => setSelectedSourceIdx(e.target.value)}
              className="w-full border border-blue-300 bg-blue-50 rounded-md p-2 text-xs outline-none"
            >
              <option value="">-- Choose destination --</option>
              {employees.map((emp, idx) => {
                // Filter out the source row from the destination dropdown
                if (selectedRows.has(idx)) return null;
                return (
                  <option key={idx} value={idx}>
                    {emp.emple?.emplId} | {emp.emple?.accId} | {emp.emple?.orgId}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {fillMethod === "Specify Amounts" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Amount</label>
            <input
              type="text"
              value={fillAmounts}
              onChange={(e) => setFillAmounts(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full p-2 border border-gray-300 rounded-md text-xs"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-[10px] font-bold uppercase mb-1">Start Period</label>
            <input type="date" value={fillStartDate || ""} onChange={(e) => setFillStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-xs"/>
          </div>
          <div>
            <label className="block text-gray-700 text-[10px] font-bold uppercase mb-1">End Period</label>
            <input type="date" value={fillEndDate || ""} onChange={(e) => setFillEndDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-xs"/>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowFillValues(false);
              setFillMethod("None");
              setSelectedSourceIdx("");
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-xs font-medium"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (fillMethod === "Copy From Source Record" && selectedRows.size === 0) {
                toast.error("Please check a row in the grid to act as the source.");
                return;
              }
              if (fillMethod === "Copy From Source Record" && newEntries.length === 0 && selectedSourceIdx === "") {
                toast.error("Please select a destination record from the dropdown.");
                return;
              }
              handleFillValuesAmounts(); 
            }}
            className="px-4 py-2 bg-[#113d46] text-white rounded-md text-xs font-medium disabled:opacity-50 transition-all"
            disabled={fillMethod === "None" || (selectedRows.size === 0 && newEntries.length === 0)}
          >
            Fill Value
          </button>
        </div>
      </div>
    </div>
  </div>
)}




      {/* {showFillValues && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Fill Amounts</h3>
      <div className="mb-3">
        <label className="block text-gray-700 text-xs font-medium mb-1">Method</label>
        <select 
          value={fillMethod} 
          onChange={(e) => setFillMethod(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-xs"
        >
          <option value="None">None</option>
          <option value="Specify Amounts">Specify Amounts</option>
          <option value="Use Start Period Amounts">Use Start Period Amounts</option>
          <option value="Copy From Source Record">Copy From Source Record</option>
        </select>
      </div>
      {fillMethod === "Specify Amounts" && (
        <div className="mb-3">
          <label className="block text-gray-700 text-xs font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={fillAmounts}
            onChange={(e) => setFillAmounts(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border border-gray-300 rounded text-xs"
          />
        </div>
      )}
      {fillMethod === "Copy From Source Record" && (
        <div className="mb-3">
          <label className="block text-gray-700 text-xs font-medium mb-1">Source Row</label>
          <select
            value={sourceRowIndex || ""}
            onChange={(e) => setSourceRowIndex(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border border-gray-300 rounded text-xs"
          >
            <option value="">Select Source Row</option>
            {employees.filter((_, idx) => !hiddenRows[idx]).map((emp, idx) => (
              <option key={idx} value={idx}>
                Row {idx + 1}: {emp.emple.emplId}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => {
            setShowFillValues(false);
            setFillMethod("None");
            setFillAmounts(0.0);
            setSourceRowIndex(null);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
        >
          Cancel
        </button>
        <button
          onClick={handleFillValuesAmounts}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
        >
          Fill
        </button>
      </div>
    </div>
  </div>
)} */}

      {employees.length === 0 && !showNewForm && sortedDurations.length > 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs">
          No forecast data available for this plan.
        </div>
      ) : (
        // <div ref={verticalScrollRef} className="vertical-scroll-wrapper">
        <div className="border-line">
          <div className="synchronized-tables-container flex w-full">
            <div
              ref={firstTableRef}
              onScroll={handleFirstScroll}
              className="hide-scrollbar flex-1"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                overflowX: "scroll",
                // marginTop: "-3px"
              }}
            >
              <table className="table-fixed min-w-full table">
                <thead className="thead">
                  <tr
                    style={{
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                    }}
                  >
    <th className="th-thead w-6 text-center">
      <input
        type="checkbox"
        // ref={(el) => {
        //   if (el) el.indeterminate = isIndeterminate;
        // }}
        className="w-4 h-4"
        checked={areAllVisibleSelected}
        onChange={(e) => handleSelectAll(e.target.checked)}
        disabled={ visibleRowIndices.length === 0}
      />
    </th>
                    {EMPLOYEE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="th-thead whitespace-nowrap   min-w-[70px]" // Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px]
                        onClick={col.key === "acctId" ? () => handleSort("acctId") : undefined}

     style={{
                          cursor: col.key === "acctId" ? "pointer" : "default",
                          textAlign: col.key === "name" ? "left" : "center",
                        }}
                      >
                        {col.label}
                        {col.key === "acctId" && (
        <span className="text-[12px] text-gray-500">
          {getSortIcon("acctId")}
        </span>
      )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tbody">
                  {/* Pasted Entries */}
                  {/* Pasted Entries */}

                  {newEntries.length > 0 &&
  newEntries.map((entry, entryIndex) => (
    <React.Fragment key={`pasted-duration-${entryIndex}`}>
      <tr
        key={`new-entry-${entryIndex}`}
        className="bg-yellow-50"
        style={{
          height: `${ROW_HEIGHT_DEFAULT}px`,
          lineHeight: "normal",
        }}
      >
        <td className="tbody-td min-w-[45px] px-2 text-center">
          <input type="checkbox" disabled className="w-4 h-4 opacity-50 cursor-not-allowed" />
        </td>

        <td className="tbody-td min-w-[70px]">
          <select
            name="idType"
            value={entry.idType}
            // onChange={(e) => {
            //   const value = e.target.value;
            //   const newId = value === "PLC" ? "PLC" : "";
            //   setNewEntries((prev) =>
            //     prev.map((ent, idx) =>
            //       idx === entryIndex
            //         ? {
            //             ...ent,
            //             id: newId,
            //             firstName: "",
            //             lastName: "",
            //             isRev: false,
            //             isBrd: false,
            //             idType: value,
            //             acctId: "",
            //             orgId: "",
            //             status: "Act",
            //           }
            //         : ent
            //     )
            //   );
            //   fetchSuggestionsForPastedEntry(entryIndex, { ...entry, idType: value });
            // }}
            onChange={(e) => {
    const value = e.target.value;
    // const newId = value === "PLC" ? "PLC" : "";
    const newId = value === "PLC" ? "PLC" : value === "Other" ? "TBD" : "";

    
    // 1. Update the local entry state
    setNewEntries((prev) =>
        prev.map((ent, idx) =>
            idx === entryIndex ? { ...ent, idType: value, id: newId, firstName: "", lastName: "", acctId: "", orgId: "",orgName: "",acctName: "", status: "Act" } : ent
        )
    );
    
    
    fetchSuggestionsForPastedEntry(entryIndex, { ...entry, idType: value });
}}
            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
          >
            {ID_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </td>

        {/* ID Column */}
        {/* <td className="tbody-td min-w-[115px]">
          <input
            type="text"
            value={entry.id}
            onKeyDown={(e) => e.key === ' ' && e.stopPropagation()}
            // onChange={(e) => {
            //   const val = e.target.value.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "");
            //   const trimmedValue = val.trim();
            //   setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, id: val } : ent)));
            //   if (entry.idType !== "Other") {
            //     const suggestions = pastedEntrySuggestions[entryIndex] || [];
            //     const selectedEmployee = suggestions.find((emp) => emp.emplId === trimmedValue);
            //     if (selectedEmployee) {
            //       setNewEntries((prev) =>
            //         prev.map((ent, idx) =>
            //           idx === entryIndex
            //             ? {
            //                 ...ent,
            //                 id: trimmedValue,
            //                 firstName: selectedEmployee.firstName || "",
            //                 lastName: selectedEmployee.lastName || "",
            //                 orgId: selectedEmployee.orgId || ent.orgId,
            //               }
            //             : ent
            //         )
            //       );
            //     }
            //   }
            // }}
            onChange={(e) => {
  const val = e.target.value.trim();
  const suggestions = pastedEntrySuggestions[entryIndex] || [];
  
  // 1. Find the matched employee from suggestions
  const matchedEmployee = suggestions.find((emp) => emp.emplId === val);

  if (matchedEmployee) {
    // 2. Find the Account Name for this employee's acctId
    const acctList = getAccountSuggestionsByType(entry.idType);
    const matchedAcct = acctList.find(a => (a.accountId || a.id) === matchedEmployee.acctId);

    // 3. Find the Org Name for this employee's orgId
    const matchedOrg = organizationOptions.find(o => String(o.value) === String(matchedEmployee.orgId));

    updateNewEntry(entryIndex, { 
      id: val,
      firstName: matchedEmployee.firstName || "",
      lastName: matchedEmployee.lastName || "",
      acctId: matchedEmployee.acctId || "",
      acctName: matchedAcct ? matchedAcct.acctName : "", // AUTO-POPULATE ACCOUNT NAME
      orgId: String(matchedEmployee.orgId || ""),
      orgName: matchedOrg ? matchedOrg.orgName : ""     // AUTO-POPULATE ORG NAME
    });
  } else {
    updateNewEntry(entryIndex, { id: val });
  }
}}
            disabled={entry.idType === "PLC"}
            style={{ maxWidth: "100px" }}
            className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none ${entry.idType === "PLC" ? "bg-gray-100" : ""}`}
            list={`employee-id-list-${entryIndex}`}
            placeholder="ID"
          />
          <datalist id={`employee-id-list-${entryIndex}`}>
            {(pastedEntrySuggestions[entryIndex] || []).filter((emp) => emp.emplId).map((emp, idx) => (
              <option key={idx} value={emp.emplId}>{emp.lastName}, {emp.firstName}</option>
            ))}
          </datalist>
        </td> */}
        {/* <td className="tbody-td min-w-[115px]">
  <input
    type="text"
    value={entry.id}
    onKeyDown={(e) => e.key === ' ' && e.stopPropagation()}
    onChange={(e) => {
      const val = e.target.value.trim();
      const [emplId, lastName] = val.split(" - ");
      const suggestions = pastedEntrySuggestions[entryIndex] || [];
      
      // 1. Find the matched employee object
      const matchedEmployee = suggestions.find((emp) => emp.lastName === lastName);

      if (matchedEmployee) {
        // 2. Resolve the names for Account and Org immediately
        const acctList = getAccountSuggestionsByType(entry.idType);
        const matchedAcct = acctList.find(a => (a.accountId || a.id) === matchedEmployee.acctId);
        const matchedOrg = organizationOptions.find(o => String(o.value) === String(matchedEmployee.orgId));

        // 3. Update all 6 fields in one state change
        updateNewEntry(entryIndex, { 
          id: emplId,
          firstName: matchedEmployee.firstName || "",
          lastName: matchedEmployee.lastName || "",
          acctId: matchedEmployee.acctId || "",
          acctName: matchedAcct ? matchedAcct.acctName : "", // AUTO-POPULATE
          orgId: String(matchedEmployee.orgId || ""),
          orgName: matchedOrg ? matchedOrg.orgName : ""      // AUTO-POPULATE
        });
      } else {
        updateNewEntry(entryIndex, { id: val });
      }
    }}
    disabled={entry.idType === "PLC"}
    className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none ${entry.idType === "PLC" ? "bg-gray-100" : ""}`}
    list={`employee-id-list-${entryIndex}`}
    placeholder="ID"
  />
  <datalist id={`employee-id-list-${entryIndex}`}>
    {(pastedEntrySuggestions[entryIndex] || []).filter((emp) => emp.emplId).map((emp, idx) => (
      // Adding the Name/Account here is ONLY for the user to see in the dropdown 
      // so they can choose the correct one if IDs are identical.
      <option key={idx} value={`${emp.emplId} - ${emp.lastName} ${emp.firstName}`}>
        
      </option>
    ))}
  </datalist>
</td> */}
        <td className="tbody-td min-w-[115px]">
  <input
    type="text"
    value={entry.id}
    onKeyDown={(e) => e.key === ' ' && e.stopPropagation()}
    onChange={(e) => {
      const rawValue = e.target.value;
      // 1. Extract the Clean ID if selecting from datalist (split by " - ")
      // const cleanId = rawValue.split(" - ")[0].trim();
      const [emplId, lastName] =
                                  rawValue.split(" - ");

                                  // show only ID in the input
                                setNewEntries((prev) =>
                                  prev.map((ent, idx) =>
                                    idx === entryIndex
                                      ? { ...ent, id: emplId }
                                      : ent
                                  )
                                );
      
      const suggestions = pastedEntrySuggestions[entryIndex] || [];
      
      // 2. Find the matched employee object from suggestions
      // We check if the ID matches OR if the full display string matches what's in the datalist
      const matchedEmployee = suggestions.find(
                                  (emp) =>
                                    String(emp.emplId) === emplId &&
                                    emp.lastName === lastName
                                );

      if (matchedEmployee) {
        // 3. Resolve the names for Account and Organization
        const acctList = getAccountSuggestionsByType(entry.idType);
        const matchedAcct = acctList.find(a => (a.accountId || a.id) === matchedEmployee.acctId);
        const matchedOrg = organizationOptions.find(o => String(o.value) === String(matchedEmployee.orgId));

        // 4. Update the entry with clean data and auto-populated names
        updateNewEntry(entryIndex, { 
          id: matchedEmployee.emplId, // Sets ONLY the numeric ID back to the field
          firstName: matchedEmployee.firstName || "",
          lastName: matchedEmployee.lastName || "",
          acctId: matchedEmployee.acctId || "",
          // acctName: matchedAcct ? ( matchedEmployee.acctName || matchedAcct.acctName || matchedAcct.name) : "",
          acctName:
                                    matchedEmployee.acctName ||
                                      matchedAcct?.acctName ||
                                      matchedAcct?.name ||
                                      "",
          orgId: String(matchedEmployee.orgId || ""),
          orgName: matchedOrg ? (matchedOrg.orgName || matchedOrg.label) : ""
        });
      } else {
        // If the user is just typing and hasn't selected a match yet
        updateNewEntry(entryIndex, { id: rawValue });
      }
    }}
    disabled={entry.idType === "PLC" || entry.idType === "Other"  }
    className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none ${entry.idType === "PLC" || entry.idType === "Other" ? "bg-gray-100" : ""}`}
    list={`employee-id-list-${entryIndex}`}
    placeholder="ID"
  />
  {/* <datalist id={`employee-id-list-${entryIndex}`}>
    {(pastedEntrySuggestions[entryIndex] || []).filter((emp) => emp.emplId).map((emp, idx) => (
      <option key={idx} value={`${emp.emplId} - ${emp.lastName} ${emp.firstName}`} />
    ))}
  </datalist> */}
  <datalist id={`employee-id-list-${entryIndex}`}>
                              {(pastedEntrySuggestions[entryIndex] || []).map(
                                (emp, idx) => (
                                  <option
                                    key={idx}
                                    value={`${emp.emplId} - ${emp.lastName}`}
                                  >
                                    {emp.lastName}, {emp.firstName}
                                  </option>
                                )
                              )}
                            </datalist>
</td>
        <td className="tbody-td min-w-[115px]">
          <input
            type="text"
            // value={entry.idType === "Other" || planType === "NBBUD" ? entry.firstName || "" : entry.lastName && entry.firstName ? `${entry.lastName}, ${entry.firstName}` : entry.lastName || entry.firstName || ""}
            // readOnly={entry.idType !== "Other"}
            value={
      entry.idType === "Other" 
        ? (entry.firstName || "") 
        : (entry.lastName && entry.firstName ? `${entry.lastName}, ${entry.firstName}` : (entry.lastName || entry.firstName || ""))
    }
    readOnly={entry.idType !== "Other"}
            onKeyDown={(e) => e.key === " " && e.stopPropagation()}
            onChange={(e) => {
              if (entry.idType === "Other" || planType === "NBBUD") {
                const cleanValue = e.target.value.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "");
                setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, firstName: cleanValue.trimStart(), lastName: "" } : ent)));
              }
            }}
            style={{ maxWidth: "100px" }}
            className={`border border-gray-300 rounded px-1 py-0.5 text-xs ${entry.idType === "Other" || planType === "NBBUD" ? "bg-white" : "bg-gray-100"}`}
            placeholder="Name"
          />
        </td>

       {/* Account ID Column */}
{/* <td className="tbody-td">
    <input
        type="text"
        value={newEntry.acctId}
        list="new-entry-acct-list"
        onChange={(e) => {
            const val = e.target.value;
            // Requirement: Find the matching account to auto-populate the name
            const matched = nonLaborAccounts.find(a => a.accountId === val);
            setNewEntry(prev => ({
                ...prev,
                acctId: val,
                acctName: matched ? matched.acctName : "" 
            }));
        }}
        // Requirement: Styling synced with Org ID
        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs outline-none focus:border-blue-400"
        placeholder="Account"
    />
    <datalist id="new-entry-acct-list">
        {nonLaborAccounts.map((acc, idx) => (
            <option key={idx} value={acc.accountId}>
                {acc.acctName}
            </option>
        ))}
    </datalist>
</td> */}
{/* Inside newEntries.map loop */}
{/* <td className="tbody-td">
  <input
    type="text"
    value={entry.acctId}
    // Logic: Get list based on THIS new form's selected idType
    list={`new-entry-acct-list-${entryIndex}`} 
    onChange={(e) => {
      const val = e.target.value;
      const suggestions = getAccountSuggestionsByType(entry.idType);
      const matched = suggestions.find(a => (a.accountId || a.id) === val);
      
      updateNewEntry(entryIndex, {
        acctId: val,
        acctName: matched ? (matched.acctName || matched.name) : ""
      });
    }}
    className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
  />
  <datalist id={`new-entry-acct-list-${entryIndex}`}>
    {getAccountSuggestionsByType(entry.idType).map((acc, idx) => (
      <option key={idx} value={acc.accountId || acc.id}>
        {acc.acctName || acc.name}
      </option>
    ))}
  </datalist>
</td> */}
{/* Inside newEntries.map loop */}
{/* <td className="tbody-td">
    <input
        type="text"
        value={entry.acctId || ""}
        list={`new-entry-acct-list-${entryIndex}`}
        onChange={(e) => {
            const val = e.target.value;
            // Get the specific allowed accounts for THIS row's type
            const suggestions = getAccountSuggestionsByType(entry.idType);
            
            // Find the matching account object
            const matched = suggestions.find(a => (a.accountId || a.id) === val);
            
            // Update the state for this specific index
            updateNewEntry(entryIndex, {
                acctId: val,
                acctName: matched ? (matched.acctName || matched.name) : "" 
            });
        }}
        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
        placeholder="Account"
    />
    <datalist id={`new-entry-acct-list-${entryIndex}`}>
        {getAccountSuggestionsByType(entry.idType).map((acc, idx) => (
            <option key={idx} value={acc.accountId || acc.id}>
                {acc.acctName || acc.name}
            </option>
        ))}
    </datalist>
</td> */}
{/* Inside newEntries.map loop - Account ID Column */}
<td className="tbody-td">
  <input
    type="text"
    value={entry.acctId || ""}
    list={`new-entry-acct-list-${entryIndex}`}
    onChange={(e) => {
      const val = e.target.value;
      // Get filtered suggestions based on this specific row's ID Type
      const suggestions = getAccountSuggestionsByType(entry.idType);
      const matched = suggestions.find(a => (a.accountId || a.id) === val);
      
      // Update both ID and Name in the array
      updateNewEntry(entryIndex, {
        acctId: val,
        acctName: matched ? matched.acctName : "" 
      });
    }}
    className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
    placeholder="Account"
  />
  <datalist id={`new-entry-acct-list-${entryIndex}`}>
    {getAccountSuggestionsByType(entry.idType).map((acc, idx) => (
      <option key={idx} value={acc.accountId || acc.id}>
        {acc.acctName}
      </option>
    ))}
  </datalist>
</td>

{/* Account Name Column - Must pull from entry.acctName */}
<td className="tbody-td">
  <input
    type="text"
    value={entry.acctName || ""} 
    readOnly
    className="w-full bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs cursor-not-allowed"
    placeholder="Account Name"
  />
</td>

{/* <td className="tbody-td">
    <input
        type="text"
        value={entry.acctName || ""} // This now pulls from the specific entry object
        readOnly
        className="w-full bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs cursor-not-allowed"
        placeholder="Account Name"
    />
</td> */}

{/* Account Name Column */}
{/* <td className="tbody-td">
    <input
        type="text"
        value={newEntry.acctName || ""}
        readOnly
        // Requirement: Styling synced with Org Name (bg-gray-100)
        className="w-full bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs cursor-not-allowed"
        placeholder="Account Name"
    />
</td> */}

        {/* Organization Column */}
        {/* <td className="tbody-td min-w-[125px]">
          <input
            type="text"
            value={entry.orgId}
            onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, orgId: e.target.value } : ent)))}
            style={{ maxWidth: "110px" }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
            list={`org-list-pasted-${entryIndex}`}
            placeholder="Org"
          />
          <datalist id={`org-list-pasted-${entryIndex}`}>
            {(pastedEntryOrgs[entryIndex] || []).map((org, index) => (
              <option key={index} value={org.value}>{org.label}</option>
            ))}
          </datalist>
        </td> */}
        {/* <td className="tbody-td min-w-[125px]">
  <input
    type="text"
    value={entry.orgId}
    onChange={(e) => {
      const val = e.target.value;
      const matchedOrg = organizationOptions.find(org => org.value.toString() === val);
      updateNewEntry(entryIndex, { 
        orgId: val, 
        orgName: matchedOrg ? matchedOrg.orgName : "" 
      });
    }}
    style={{ maxWidth: "110px" }}
    className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
    list={`org-list-pasted-${entryIndex}`}
    placeholder="Org"
  />
  <datalist id={`org-list-pasted-${entryIndex}`}>
    {organizationOptions.map((org, index) => (
      <option key={index} value={org.value}>{org.label}</option>
    ))}
  </datalist>
</td> */}
<td className="tbody-td min-w-[125px]">
  <input
    type="text"
    value={entry.orgId}
    onChange={(e) => {
      const val = e.target.value;
      // Find matching org from the global organizationOptions state
      const matchedOrg = organizationOptions.find(
        (org) => org.value.toString() === val
      );
      
      // Update Org ID and auto-populate Org Name
      updateNewEntry(entryIndex, { 
        orgId: val, 
        orgName: matchedOrg ? (matchedOrg.orgName || matchedOrg.label.split(' - ')[1]) : "" 
      });
    }}
    style={{ maxWidth: "110px" }}
    className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
    list={`org-list-pasted-${entryIndex}`}
    placeholder="Org"
  />
  <datalist id={`org-list-pasted-${entryIndex}`}>
    {organizationOptions.map((org, index) => (
      <option key={index} value={org.value}>
        {org.label}
      </option>
    ))}
  </datalist>
</td>
        
        {/* <td>

              <input
  type="text"
  value={newEntry.orgName || ''}
  readOnly
  className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs"
  placeholder="Org Name (auto-populated)"
  style={{ maxWidth: "130px" }}
/>

        </td> */}
        <td>
  <input
    type="text"
    value={entry.orgName || ''}
    readOnly
    className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs"
    placeholder="Org Name"
    style={{ maxWidth: "130px" }}
  />
</td>
    

        <td className="tbody-td text-center">
          <input type="checkbox" checked={entry.isRev} onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, isRev: e.target.checked } : ent)))} />
        </td>
        <td className="tbody-td text-center">
          <input type="checkbox" checked={entry.isBrd} onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, isBrd: e.target.checked } : ent)))} />
        </td>
        <td className="tbody-td">
          <input type="text" value={entry.status} onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, status: e.target.value } : ent)))} className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" />
        </td>
        <td className="tbody-td">
          {Object.values(newEntryPeriodAmountsArray[entryIndex] || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
        </td>
      </tr>
    </React.Fragment>
  ))}

  {sortedEmployees
  .filter((_, idx) => !hiddenRows[idx])
  .map((emp, idx) => {
    const actualEmpIdx = employees.findIndex((e) => e === emp);
    const row = getEmployeeRow(emp, actualEmpIdx);
    const uniqueRowKey = `${emp.emple.emplId || "emp"}-${actualEmpIdx}`;
    const isSelected = selectedRows.has(actualEmpIdx);

    return (
      <tr
        key={uniqueRowKey}
        className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
          isSelected ? "bg-blue-100" : selectedRowIndex === actualEmpIdx ? "bg-yellow-100" : "even:bg-gray-50"
        }`}
        style={{
          height: `${ROW_HEIGHT_DEFAULT}px`,
          lineHeight: "normal",
          cursor: isEditable ? "pointer" : "default",
        }}
      >
        <td className="tbody-td text-center w-6">
          <input type="checkbox" className="w-4 h-4" checked={isSelected} onClick={(e) => { e.stopPropagation(); handleRowClick(actualEmpIdx); }} />
        </td>

        {EMPLOYEE_COLUMNS.map((col) => {
          let tdWidth = "min-w-[70px]";
          if (col.key === "emplId") tdWidth = "min-w-[115px]";
          if (col.key === "acctId" || col.key === "orgId") tdWidth = "min-w-[125px]";
          // if (col.key === "acctName" || col.key === "name") tdWidth = "min-w-[130px]";
          if (col.key === "acctName" || col.key === "orgName" || col.key === "name") tdWidth = "min-w-[130px]";

//           if (isBudPlan && isEditable) {
//             if (col.key === "acctId") {
//               return (
//                 <td key={`${uniqueRowKey}-acctId`} className={`tbody-td ${tdWidth}`}>
//                   <input
//                     type="text"
//                     value={editedRowData[actualEmpIdx]?.acctId !== undefined ? editedRowData[actualEmpIdx].acctId : row.acctId}
//                     onChange={(e) => {
//                       const val = e.target.value;
//                       const matched = accountOptionsWithNames.find(acc => (acc.id || acc.accountId) === val);
//                       setEditedRowData(prev => ({
//                         ...prev,
//                         [actualEmpIdx]: { ...prev[actualEmpIdx], acctId: val, acctName: matched ? (matched.name || matched.acctName) : "" }
//                       }));
//                       setEditingRowIndex(actualEmpIdx);
//                       setHasUnsavedFieldChanges(true);
//                     }}
//                     style={{ maxWidth: "110px" }}
//                     className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
//                     list={`account-list-${actualEmpIdx}`}
//                   />
//                   <datalist id={`account-list-${actualEmpIdx}`}>
//                     {accountOptionsWithNames.map((acc, i) => <option key={i} value={acc.id} />)}
//                   </datalist>
//                 </td>
//               );
//             }
//             // if (col.key === "orgId") {
//             //   return (
//             //     <td key={`${uniqueRowKey}-orgId`} className={`tbody-td ${tdWidth}`}>
//             //       <input
//             //         type="text"
//             //         value={editedRowData[actualEmpIdx]?.orgId !== undefined ? editedRowData[actualEmpIdx].orgId : row.orgId}
//             //         onChange={(e) => handleRowFieldChange(actualEmpIdx, "orgId", e.target.value)}
//             //         style={{ maxWidth: "110px" }}
//             //         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
//             //         list={`org-list-${actualEmpIdx}`}
//             //       />
//             //       <datalist id={`org-list-${actualEmpIdx}`}>
//             //         {organizationOptions.map((org, i) => <option key={i} value={org.value}>{org.label}</option>)}
//             //       </datalist>
//             //     </td>
//             //   );
//             // }
// //             if (col.key === "orgId") {
// //   return (
// //     <td key={`${uniqueRowKey}-orgId`} className={`tbody-td ${tdWidth}`}>
// //       <input
// //         type="text"
// //         value={editedRowData[actualEmpIdx]?.orgId !== undefined ? editedRowData[actualEmpIdx].orgId : row.orgId}
// //         onChange={(e) => {
// //           const val = e.target.value.replace(/[^0-9.]/g, ''); // ✅ Keep decimals
// //           const matched = organizationOptions.find(org => org.value === val) ||
// //                          updateOrganizationOptions.find(org => org.value === val);
// //           setEditedRowData(prev => ({
// //             ...prev,
// //             [actualEmpIdx]: { 
// //               ...prev[actualEmpIdx], 
// //               orgId: val, 
// //               orgName: matched ? (matched.orgName || matched.label || '') : '' 
// //             }
// //           }));
// //           setEditingRowIndex(actualEmpIdx);
// //           setHasUnsavedFieldChanges(true);
// //         }}
// //         style={{ maxWidth: "110px" }}
// //         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
// //         list={`org-list-${actualEmpIdx}`}
// //       />
// //       <datalist id={`org-list-${actualEmpIdx}`}>
// //         {organizationOptions.map((org, i) => <option key={i} value={org.value} />)}
// //       </datalist>
// //     </td>
// //   );
// // }
// if (col.key === "orgId" && isBudPlan && isEditable) {
//   return (
//     <td key={`${uniqueRowKey}-orgId`} className={`tbody-td min-w-[125px]`}>
//       <input
//         type="text"
//         value={editedRowData[actualEmpIdx]?.orgId !== undefined 
//           ? editedRowData[actualEmpIdx].orgId 
//           : row.orgId}
//         onChange={(e) => {
//           const val = e.target.value;
//           // ✅ Find matching org INSTANTLY
//           const matched = organizationOptions.find(org => org.value.toString() === val);
//           setEditedRowData(prev => ({
//             ...prev,
//             [actualEmpIdx]: {
//               ...prev[actualEmpIdx],
//               orgId: val,
//               orgName: matched ? matched.orgName || matched.label.split(' - ')[1] || '' : ''
//             }
//           }));
//           setEditingRowIndex(actualEmpIdx);
//           setHasUnsavedFieldChanges(true);
//         }}
//         style={{ maxWidth: "110px" }}
//         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
//         list={`org-list-${actualEmpIdx}`}  // ✅ Datalist suggestions
//       />
//       <datalist id={`org-list-${actualEmpIdx}`}>
//         {organizationOptions.map((org, i) => (
//           <option key={i} value={org.value}>{org.label}</option>  // ✅ Full label in dropdown
//         ))}
//       </datalist>
//     </td>
//   );
// }

// if (col.key === "orgName") {
//   return (
//     <td key={`${uniqueRowKey}-orgName`} className="tbody-td min-w-[130px]">
//       {editedRowData[actualEmpIdx]?.orgName !== undefined
//         ? editedRowData[actualEmpIdx].orgName
//         : row.orgName || '-'
//       }
//     </td>
//   );
// }



//           }
          if (isBudPlan && isEditable) {
    // 1. Account ID Logic
    // if (col.key === "acctId") {
    //     return (
    //         <td key={`${uniqueRowKey}-acctId`} className={`tbody-td ${tdWidth}`}>
    //             <input
    //                 type="text"
    //                 value={editedRowData[actualEmpIdx]?.acctId !== undefined ? editedRowData[actualEmpIdx].acctId : row.acctId}
    //                 onChange={(e) => {
    //                     const val = e.target.value;
    //                     const matched = accountOptionsWithNames.find(acc => (acc.id || acc.accountId) === val);
    //                     setEditedRowData(prev => ({
    //                         ...prev,
    //                         [actualEmpIdx]: { ...prev[actualEmpIdx], acctId: val, acctName: matched ? (matched.name || matched.acctName) : "" }
    //                     }));
    //                     setEditingRowIndex(actualEmpIdx);
    //                     setHasUnsavedFieldChanges(true);
    //                 }}
    //                 style={{ maxWidth: "110px" }}
    //                 className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
    //                 list={`account-list-${actualEmpIdx}`}
    //             />
    //             <datalist id={`account-list-${actualEmpIdx}`}>
    //                 {accountOptionsWithNames.map((acc, i) => <option key={i} value={acc.id} />)}
    //             </datalist>
    //         </td>
    //     );
    // }
//     if (col.key === "acctId") {
//   // Use the state variables populated by /Project/GetAllProjectByProjId/
//   let currentSuggestions = [];
//   const rowIdType = emp.emple.type;

//   if (rowIdType === "Vendor" || rowIdType === "Vendor Employee") {
//     currentSuggestions = subContractorNonLaborAccounts;
//   } else if (rowIdType === "Other") {
//     // Combine all lists for 'Other' type to match New Entry logic
//     currentSuggestions = [
//       ...employeeNonLaborAccounts,
//       ...subContractorNonLaborAccounts,
//       ...otherDirectCostNonLaborAccounts,
//     ];
//   } else {
//     currentSuggestions = employeeNonLaborAccounts;
//   }

//   return (
//     <td key={`${uniqueRowKey}-acctId`} className={`tbody-td ${tdWidth}`}>
//       <input
//         type="text"
//         value={editedRowData[actualEmpIdx]?.acctId !== undefined ? editedRowData[actualEmpIdx].acctId : row.acctId}
//         onChange={(e) => {
//           const val = e.target.value;
//           // Find the name from the suggestions to auto-update Account Name column
//           const matched = currentSuggestions.find(acc => (acc.id || acc.accountId) === val);
          
//           setEditedRowData(prev => ({
//             ...prev,
//             [actualEmpIdx]: { 
//               ...prev[actualEmpIdx], 
//               acctId: val, 
//               acctName: matched ? (matched.name || matched.acctName) : "" 
//             }
//           }));
//           setEditingRowIndex(actualEmpIdx);
//           setHasUnsavedFieldChanges(true);
//         }}
//         style={{ maxWidth: "110px" }}
//         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
//         list={`account-list-existing-${actualEmpIdx}`}
//       />
//       <datalist id={`account-list-existing-${actualEmpIdx}`}>
//         {currentSuggestions.map((acc, i) => (
//           <option key={i} value={acc.id || acc.accountId}>
//             {acc.name || acc.acctName}
//           </option>
//         ))}
//       </datalist>
//     </td>
//   );
// }

    // 2. Organization ID Logic
    // if (col.key === "orgId") {
    //     return (
    //         <td key={`${uniqueRowKey}-orgId`} className={`tbody-td min-w-[125px]`}>
    //             <input
    //                 type="text"
    //                 value={editedRowData[actualEmpIdx]?.orgId !== undefined ? editedRowData[actualEmpIdx].orgId : row.orgId}
    //                 onChange={(e) => {
    //                     const val = e.target.value;
    //                     const matched = organizationOptions.find(org => org.value.toString() === val);
    //                     setEditedRowData(prev => ({
    //                         ...prev,
    //                         [actualEmpIdx]: {
    //                             ...prev[actualEmpIdx],
    //                             orgId: val,
    //                             orgName: matched ? matched.orgName || matched.label.split(' - ')[1] || '' : ''
    //                         }
    //                     }));
    //                     setEditingRowIndex(actualEmpIdx);
    //                     setHasUnsavedFieldChanges(true);
    //                 }}
    //                 style={{ maxWidth: "110px" }}
    //                 className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
    //                 list={`org-list-${actualEmpIdx}`}
    //             />
    //             <datalist id={`org-list-${actualEmpIdx}`}>
    //                 {organizationOptions.map((org, i) => (
    //                     <option key={i} value={org.value}>{org.label}</option>
    //                 ))}
    //             </datalist>
    //         </td>
    //     );
    // }

    // 3. Org Name Logic
    // if (col.key === "orgName") {
    //     return (
    //         <td key={`${uniqueRowKey}-orgName`} className="tbody-td min-w-[130px]">
    //             {editedRowData[actualEmpIdx]?.orgName !== undefined
    //                 ? editedRowData[actualEmpIdx].orgName
    //                 : row.orgName || '-'}
    //         </td>
    //     );
    // }

//     if (col.key === "acctId") {
//     // Get suggestions based on row's specific type
//     let rowSuggestions = [];
//     const rowType = emp.emple.type;

//     if (rowType === "Vendor" || rowType === "Vendor Employee") {
//         rowSuggestions = subContractorNonLaborAccounts;
//     } else if (rowType === "Other") {
//         rowSuggestions = [...employeeNonLaborAccounts, ...subContractorNonLaborAccounts, ...otherDirectCostNonLaborAccounts];
//     } else {
//         rowSuggestions = employeeNonLaborAccounts;
//     }

//     return (
//         <td key={`${uniqueRowKey}-acctId`} className={`tbody-td ${tdWidth}`}>
//             <input
//                 type="text"
//                 value={editedRowData[actualEmpIdx]?.acctId !== undefined ? editedRowData[actualEmpIdx].acctId : row.acctId}
//                 onChange={(e) => {
//                     const val = e.target.value;
//                     const matched = rowSuggestions.find(acc => (acc.id || acc.accountId) === val);
//                     setEditedRowData(prev => ({
//                         ...prev,
//                         [actualEmpIdx]: { 
//                             ...prev[actualEmpIdx], 
//                             acctId: val, 
//                             acctName: matched ? (matched.name || matched.acctName) : "" 
//                         }
//                     }));
//                     setEditingRowIndex(actualEmpIdx);
//                     setHasUnsavedFieldChanges(true);
//                 }}
//                 style={{ maxWidth: "110px" }}
//                 className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
//                 list={`account-list-existing-${actualEmpIdx}`}
//             />
//             <datalist id={`account-list-existing-${actualEmpIdx}`}>
//                 {rowSuggestions.map((acc, i) => (
//                     <option key={i} value={acc.id || acc.accountId}>
//                         {acc.name || acc.acctName}
//                     </option>
//                 ))}
//             </datalist>
//         </td>
//     );
// }

if (col.key === "acctId") {
  // Logic: Get list based on THIS row's employee type
  const rowSuggestions = getAccountSuggestionsByType(emp.emple.type);

  return (
    <td key={`${uniqueRowKey}-acctId`} className={`tbody-td ${tdWidth}`}>
      <input
        type="text"
        value={editedRowData[actualEmpIdx]?.acctId !== undefined ? editedRowData[actualEmpIdx].acctId : row.acctId}
        onChange={(e) => {
          const val = e.target.value;
          const matched = rowSuggestions.find(acc => (acc.accountId || acc.id) === val);
          
          setEditedRowData(prev => ({
            ...prev,
            [actualEmpIdx]: { 
              ...prev[actualEmpIdx], 
              acctId: val, 
              acctName: matched ? (matched.acctName || matched.name) : "" 
            }
          }));
          setEditingRowIndex(actualEmpIdx);
          setHasUnsavedFieldChanges(true);
        }}
        style={{ maxWidth: "110px" }}
        className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
        list={`account-list-existing-${actualEmpIdx}`}
      />
      <datalist id={`account-list-existing-${actualEmpIdx}`}>
        {rowSuggestions.map((acc, i) => (
          <option key={i} value={acc.accountId || acc.id}>
            {acc.acctName || acc.name}
          </option>
        ))}
      </datalist>
    </td>
  );
}

if (col.key === "acctName") {
    return (
        <td key={`${uniqueRowKey}-acctName`} className="tbody-td min-w-[130px]">
            {editedRowData[actualEmpIdx]?.acctName !== undefined
                ? editedRowData[actualEmpIdx].acctName
                : row.acctName || '-'}
        </td>
    );
}

if (col.key === "orgId") {
    return (
        <td key={`${uniqueRowKey}-orgId`} className={`tbody-td min-w-[125px]`}>
            <input
                type="text"
                value={editedRowData[actualEmpIdx]?.orgId !== undefined ? editedRowData[actualEmpIdx].orgId : row.orgId}
                onChange={(e) => {
                    const val = e.target.value;
                    const matched = organizationOptions.find(org => org.value.toString() === val);
                    setEditedRowData(prev => ({
                        ...prev,
                        [actualEmpIdx]: {
                            ...prev[actualEmpIdx],
                            orgId: val,
                            orgName: matched ? (matched.orgName || matched.label.split(' - ')[1]) : ""
                        }
                    }));
                    setEditingRowIndex(actualEmpIdx);
                    setHasUnsavedFieldChanges(true);
                }}
                style={{ maxWidth: "110px" }}
                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                list={`org-list-existing-${actualEmpIdx}`}
            />
            <datalist id={`org-list-existing-${actualEmpIdx}`}>
                {organizationOptions.map((org, i) => (
                    <option key={i} value={org.value}>{org.label}</option>
                ))}
            </datalist>
        </td>
    );
}

if (col.key === "orgName") {
    return (
        <td key={`${uniqueRowKey}-orgName`} className="tbody-td min-w-[130px]">
            {editedRowData[actualEmpIdx]?.orgName !== undefined
                ? editedRowData[actualEmpIdx].orgName
                : row.orgName || '-'}
        </td>
    );
}

    // 4. ADDED: Rev Checkbox Logic
    if (col.key === "isRev") {
        return (
            <td key={`${uniqueRowKey}-isRev`} className="tbody-td text-center">
                <input
                    type="checkbox"
                    checked={editedRowData[actualEmpIdx]?.isRev !== undefined ? editedRowData[actualEmpIdx].isRev : emp.emple.isRev}
                    onChange={(e) => handleRowFieldChange(actualEmpIdx, "isRev", e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                />
            </td>
        );
    }

    // 5. ADDED: Brd Checkbox Logic
    if (col.key === "isBrd") {
        return (
            <td key={`${uniqueRowKey}-isBrd`} className="tbody-td text-center">
                <input
                    type="checkbox"
                    checked={editedRowData[actualEmpIdx]?.isBrd !== undefined ? editedRowData[actualEmpIdx].isBrd : emp.emple.isBrd}
                    onChange={(e) => handleRowFieldChange(actualEmpIdx, "isBrd", e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                />
            </td>
        );
    }
}
          return (
            <td key={`${uniqueRowKey}-${col.key}`} className={`tbody-td ${tdWidth} ${col.key === "name" ? "text-left" : ""}`
            }  style={{
              textAlign: col.key === "name" ? "left" : ""
            }}>
              {row[col.key]}
            </td>
          );
        })}
      </tr>
    );
  })}
                  


                
                </tbody>
<tfoot>
                  <tr
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      borderTop: "2px solid #d1d5db",
                      backgroundColor: "#d7ebf3",
                    }}
                  >
                    {/* EMPTY CELLS (scroll normally) */}
                    {EMPLOYEE_COLUMNS.map((_, idx) => (
                      <td key={idx}></td>
                    ))}
 
                    {/* FIXED RIGHT "Total Amount" */}
                    <td
                      className="sticky right-0 z-30 text-right font-semibold"
                      style={{
                        backgroundColor: "#d7ebf3",
                        minWidth: "100px",
                        paddingRight: "1rem",
                        boxShadow: "-2px 0 0 #d1d5db",
                      }}

                    >
                      Total Amts:
                    </td>
                  </tr>
                </tfoot>
 
              </table>
            </div>
            <div
              ref={secondTableRef}
              onScroll={handleSecondScroll}
              className="flex-1"
              style={{
                maxHeight: "400px",
                overflowY: "auto", // show scrollbar
                overflowX: "scroll",
                // marginBottom: "-1px"
              }}
            >
              <table className="min-w-full text-xs text-center table">
                <thead className="  thead">
                  <tr
                    style={{
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                    }}
                  >
                    {/* CTD and Prior Year headers - only show when fiscal year is NOT "All" */}
                    {normalizedFiscalYear !== "All" && (
                      <>
                        {/* <th className="th-thead min-w-80px">
      <div className="flex flex-col items-center justify-center h-full">
        <span className="whitespace-nowrap th-thead">CTD</span>
        <span className="text-xs text-gray-600 font-normal normal-case">
          {(() => {
            const startYear = parseInt(startDate.split('-')[0]);
            const selectedYear = parseInt(normalizedFiscalYear);
            return `${startYear}-${selectedYear - 2}`;
          })()}
        </span>
      </div>
    </th> */}
                        {shouldShowCTD() && (
                          <th className="th-thead min-w-100px">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead font-bold">
                                CTD
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-600 font-normal normal-case">
                                {(() => {
                                  const startYear = parseInt(
                                    startDate.split("-")[0]
                                  );
                                  const selectedYear =
                                    parseInt(normalizedFiscalYear);
                                  return `${startYear}-${selectedYear - 2}`;
                                })()}
                              </span>
                            </div>
                          </th>
                        )}

                        {shouldShowPriorYear() && (
                          <th className="th-thead min-w-100px">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead font-bold">
                                Prior Year
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-600 font-normal normal-case">
                                {parseInt(normalizedFiscalYear) - 1}
                              </span>
                            </div>
                          </th>
                        )}
                      </>
                    )}

                    {sortedDurations.map((duration) => {
                      const uniqueKey = `${duration.monthNo}_${duration.year}`;
                       const isColSelected = selectedColumnKeys.has(uniqueKey);
                      return (  
                        <th
                          key={uniqueKey}
                          className={`th-thead min-w-80px ${isColSelected ? "bg-yellow-100" : ""}`}
                          style={{ cursor: isEditable ? "pointer" : "default" }}
                          onClick={() => handleColumnHeaderClick(uniqueKey)}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="whitespace-nowrap th-thead ">
                              {duration.month}
                            </span>
                            <span className="text-xs text-gray-600 font-normal normal-case">
                              Amt
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="tbody">
                  {/* Pasted Entries in Second Table */}
                  
                    {newEntries.length > 0 &&
                    newEntries.map((entry, entryIndex) => (
                      <tr
                        key={`pasted-duration-${entryIndex}`}
                        className="bg-yellow-50"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT}px`,
                          lineHeight: "normal",
                        }}
                      >
                        {shouldShowCTD() && (
                          <td className="tbody-td text-center text-xs bg-gray-100">
                            0.00
                          </td>
                        )}

                        {shouldShowPriorYear() && (
                          <td className="tbody-td text-center text-xs bg-gray-100">
                            0.00
                          </td>
                        )}
                        {sortedDurations.map((duration) => {
                          const uniqueKey = `${duration.monthNo}_${duration.year}`;
                          const isInputEditable =
                            isEditable &&
                            isMonthEditable(duration, closedPeriod, planType);
                          const value =
                            newEntryPeriodAmountsArray[entryIndex]?.[
                              uniqueKey
                            ] || "";

                          return (
                            <td
                              key={`pasted-${entryIndex}-${uniqueKey}`}
                              className={`tbody-td min-w-[80px] ${
                                planType === "EAC"
                                  ? isInputEditable
                                    ? "bg-green-50"
                                    : "bg-gray-100"
                                  : ""
                              }`}
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                value={value}
                                onChange={(e) => {
                                  if (isInputEditable) {
                                    updateNewEntryPeriodAmounts(entryIndex, {
                                      [uniqueKey]: e.target.value.replace(
                                        /[^0-9.]/g,
                                        ""
                                      ),
                                    });
                                  }
                                }}
                                className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
                                  !isInputEditable
                                    ? "cursor-not-allowed text-gray-400"
                                    : "text-gray-700"
                                }`}
                                disabled={!isInputEditable}
                                placeholder="0.00"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                     {sortedEmployees
                    .filter((_, idx) => !hiddenRows[idx])
                    .map((emp, idx) => {
                      const actualEmpIdx = employees.findIndex(
                        (e) => e === emp
                      );
                      const monthAmounts = getMonthAmounts(emp);
                      const uniqueRowKey = `${
                        emp.emple.emplId || "emp"
                      }-${actualEmpIdx}`;
                      return (
                        <tr
                          key={uniqueRowKey}
                          className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                            selectedRows.has(actualEmpIdx)
                              ? "bg-blue-100" // Selected row background
                              : selectedRowIndex === actualEmpIdx
                              ? "bg-yellow-100"
                              : "even:bg-gray-50"
                          }`}
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                            cursor: isEditable ? "pointer" : "default",
                          }}
                          onClick={() => handleRowClick(actualEmpIdx)}
                        >
                          {/* CTD and Prior Year cells */}
                          {normalizedFiscalYear !== "All" && (
                            <>
                              {shouldShowCTD() && (
                                <td className="tbody-td text-center">
                                  {(() => {
                                    let empCtd = 0;
                                    const currentFiscalYear =
                                      parseInt(normalizedFiscalYear);
                                    const startYear = parseInt(
                                      startDate.split("-")[0]
                                    );

                                    durations.forEach((duration) => {
                                      if (
                                        duration.year >= startYear &&
                                        duration.year <= currentFiscalYear - 2
                                      ) {
                                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                                        const inputValue =
                                          inputValues[
                                            `${actualEmpIdx}_${uniqueKey}`
                                          ];
                                        const monthAmounts =
                                          getMonthAmounts(emp);
                                        const forecastValue =
                                          monthAmounts[uniqueKey]?.value;
                                        const value =
                                          inputValue !== undefined &&
                                          inputValue !== ""
                                            ? inputValue
                                            : forecastValue;
                                        empCtd +=
                                          value && !isNaN(value)
                                            ? Number(value)
                                            : 0;
                                      }
                                    });

                                    return empCtd.toFixed(2);
                                  })()}
                                </td>
                              )}

                              {shouldShowPriorYear() && (
                                <td className="tbody-td text-center">
                                  {(() => {
                                    let empPriorYear = 0;
                                    const currentFiscalYear =
                                      parseInt(normalizedFiscalYear);

                                    durations.forEach((duration) => {
                                      if (
                                        duration.year ===
                                        currentFiscalYear - 1
                                      ) {
                                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                                        const inputValue =
                                          inputValues[
                                            `${actualEmpIdx}_${uniqueKey}`
                                          ];
                                        const monthAmounts =
                                          getMonthAmounts(emp);
                                        const forecastValue =
                                          monthAmounts[uniqueKey]?.value;
                                        const value =
                                          inputValue !== undefined &&
                                          inputValue !== ""
                                            ? inputValue
                                            : forecastValue;
                                        empPriorYear +=
                                          value && !isNaN(value)
                                            ? Number(value)
                                            : 0;
                                      }
                                    });

                                    return empPriorYear.toFixed(2);
                                  })()}
                                </td>
                              )}
                            </>
                          )}
                          {sortedDurations.map((duration) => {
                            const uniqueKey = `${duration.monthNo}_${duration.year}`;
                            const forecast = monthAmounts[uniqueKey];
                            const value =
                              inputValues[`${actualEmpIdx}_${uniqueKey}`] ??
                              (forecast?.value !== undefined
                                ? forecast.value
                                : "0");
                            const isInputEditable =
                              isEditable &&
                              isMonthEditable(duration, closedPeriod, planType);
                            return (
                              <td
                                key={`${uniqueRowKey}-${uniqueKey}`}
                                className={`tbody-td min-w-[80px] ${
                                  /* Changed py-2 px-3 to px-2 py-1.5, min-w-[100px] to min-w-[80px] */
                                  selectedColumnKey === uniqueKey
                                    ? "bg-yellow-100"
                                    : ""
                                } ${
                                  planType === "EAC"
                                    ? isInputEditable
                                      ? "bg-green-50"
                                      : "bg-gray-100"
                                    : ""
                                }`}
                              >
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className={`text-center border border-gray-300 bg-white text-xs w-[50px] h-[18px] p-[2px] ${
                                    !isInputEditable
                                      ? "cursor-not-allowed text-gray-400"
                                      : "text-gray-700"
                                  } ${
                                    findMatches.some(
                                      (match) =>
                                        match.empIdx === actualEmpIdx &&
                                        match.uniqueKey === uniqueKey
                                    )
                                      ? "bg-yellow-200 border-yellow-500 border-2"
                                      : ""
                                  }`}
                                  value={value}
                                  onChange={(e) =>
                                    handleInputChange(
                                      actualEmpIdx,
                                      uniqueKey,
                                      e.target.value.replace(/[^0-9.]/g, "")
                                    )
                                  }
                                  // onBlur={(e) =>
                                  //   handleForecastAmountBlur(
                                  //     actualEmpIdx,
                                  //     uniqueKey,
                                  //     e.target.value
                                  //   )
                                  // }
                                  disabled={!isInputEditable}
                                  placeholder="Enter Amount"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}


                </tbody>
             

                <tfoot>
  <tr
    className="font-bold text-center"
    style={{
      position: "sticky",
      bottom: 0,
      zIndex: 20,
      height: `${ROW_HEIGHT_DEFAULT}px`,
      lineHeight: "normal",
      borderTop: "2px solid #d1d5db",
      backgroundColor: "#d7ebf3", // same light blue
      color: "#000000",
    }}
  >
    {normalizedFiscalYear !== "All" && (
      <>
        {shouldShowCTD() && (
          <td className="tbody-td text-center sticky bottom-0 text-xs font-bold">
            {(columnTotals["ctd"] || 0).toFixed(2)}
          </td>
        )}

        {shouldShowPriorYear() && (
          <td className="tbody-td text-center sticky bottom-0 text-xs font-bold">
            {(columnTotals["priorYear"] || 0).toFixed(2)}
          </td>
        )}
      </>
    )}

    {sortedDurations.map((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      const total = columnTotals[uniqueKey] || 0;
      return (
        <td
          key={`total-${uniqueKey}`}
          className="tbody-td text-center sticky bottom-0 text-xs font-bold"
        >
          {total.toFixed(2)}
        </td>
      );
    })}
  </tr>
</tfoot>

              </table>
            </div>
          </div>
        </div>
      )}

      {/* {showFindReplace && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              Find and Replace Amounts
            </h3>
            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find:
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or empty)"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="replaceValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Replace with:
              </label>
              <input
                type="text"
                id="replaceValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={replaceValue}
                onChange={(e) =>
                  setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="New value (e.g., 120 or empty)"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope:
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row (
                    {selectedRowIndex !== null
                      ? employees[selectedRowIndex]?.emple.emplId
                      : "N/A"}
                    )
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}_${d.year}` === selectedColumnKey
                        )?.month
                      : "N/A"}
                    )
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFindReplace}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs cursor-pointer"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )} */}
      {showFindReplace && (
                   <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
        {/* <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm"> */}
            <h3 className="text-lg font-semibold mb-4">
              {showFindOnly ? "Find Hours" : "Find and Replace Amounts"}
            </h3>

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(false);
                  setFindMatches([]);
                }}
                className={`btn-click ${
                  !showFindOnly
                    ? "btn-blue"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find & Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(true);
                  setFindMatches([]);
                }}
                className={`btn-click ${
                  showFindOnly
                    ? "btn-blue"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find Only
              </button>
            </div>

            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or 0)"
              />
            </div>

            {!showFindOnly && (
              <div className="mb-4">
                <label
                  htmlFor="replaceValue"
                  className="block text-gray-700 text-xs font-medium mb-1"
                >
                  Replace with
                </label>
                <input
                  type="text"
                  id="replaceValue"
                  className="w-full border border-gray-300 rounded-md p-2 text-xs"
                  value={replaceValue}
                  onChange={(e) =>
                    setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="New value (e.g., 120)"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row 
                    {/* (
                    {selectedRowIndex !== null
                      ? employees[selectedRowIndex]?.emple.emplId
                      : "NA"}
                    ) */}
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column 
                    {/* (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}_${d.year}` === selectedColumnKey
                        )?.month
                      : "NA"}
                    ) */}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                  setFindMatches([]);
                  setShowFindOnly(false);
                }}
                // className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
                className="px-2 py-2 mt-1 mb-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              {showFindOnly ? (
                <button
                  type="button"
                  onClick={handleFind}
                  // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                  className={`btn-click`}
                >
                  Find & Highlight
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFindReplace}
                  // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                  className={`btn-click`}
                >
                  Replace All
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAmountsTable;