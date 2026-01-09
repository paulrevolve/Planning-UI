import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProjectHoursDetails from "./ProjectHoursDetails";
import ProjectPlanTable from "./ProjectPlanTable";
import RevenueAnalysisTable from "./RevenueAnalysisTable";
import AnalysisByPeriodContent from "./AnalysisByPeriodContent";
import ProjectAmountsTable from "./ProjectAmountsTable";
import PLCComponent from "./PLCComponent";
import FundingComponent from "./FundingComponent";
import RevenueSetupComponent from "./RevenueSetupComponent";
import RevenueCeilingComponent from "./RevenueCeilingComponent";
import ProjectPoolCosts from "./ProjectPoolCosts";
import { formatDate } from "./utils";
import FinancialDashboard from "./FinancialDashboard";
import Warning from "./Warning";
import { backendUrl } from "./config";
import { CircleArrowLeft } from "lucide-react";

const ProjectBudgetStatus = () => {
  const [projects, setProjects] = useState([]);
  const [prefixes, setPrefixes] = useState(new Set());
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [revenueAccount, setRevenueAccount] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [viewMode, setViewMode] = useState("plans");
  const [showTabs, setShowTabs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState("All");
  const [fiscalYearOptions, setFiscalYearOptions] = useState([]);
  const [analysisApiData, setAnalysisApiData] = useState([]);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoursColumnTotalsFromHours, setHoursColumnTotalsFromHours] = useState(
    {}
  );
  const [otherColumnTotalsFromAmounts, setOtherColumnTotalsFromAmounts] =
    useState({});
  const [calculation, setCalculation] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [finalSearchTerm, setFinalSearchTerm] = useState(""); // For the Table prop
  const [allProjects, setAllProjects] = useState([]); // Master list from API

  const hoursRefs = useRef({});
  const amountsRefs = useRef({});
  const revenueRefs = useRef({});
  const analysisRefs = useRef({});
  const revenueSetupRefs = useRef({});
  const revenueCeilingRefs = useRef({});
  const fundingRefs = useRef({});
  const inputRef = useRef(null);
  const dashboardRefs = useRef({});
  const warningRefs = useRef({});
  const fileInputRef = useRef(null);

  const EXTERNAL_API_BASE_URL = backendUrl;
  const CALCULATE_COST_ENDPOINT = "/Forecast/CalculateCost";

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userName, setUserName] = useState("User");
  const [tabVisibility, setTabVisibility] = useState({});
  const planTableRef = useRef(null);
  const searchContainerRef = useRef(null); // Create a ref for the parent container

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //   useEffect(() => {
  //   const loadTabVisibility = async () => {
  //     const userString = localStorage.getItem("currentUser");
  //     if (!userString) return;

  //     try {
  //       const userObj = JSON.parse(userString);
  //       const userId = userObj.id;

  //       // First try user-specific, fallback to role
  //       try {
  //         const res = await axios.get(`${backendUrl}/Configuration/GetVisibilityByUser/${userId}`);
  //         setTabVisibility(res.data || {});
  //       } catch {
  //         const res = await axios.get(`${backendUrl}/Configuration/GetVisibilityByRole/${encodeURIComponent(userObj.role)}`);
  //         setTabVisibility(res.data || {});
  //       }
  //     } catch (e) {
  //       // Fallback to admin check
  //       setTabVisibility({
  //         dashboard: true, hours: true, amounts: true, warning: true,
  //         revenueAnalysis: currentUserRole === 'admin',
  //         analysisByPeriod: currentUserRole === 'admin',
  //         plc: currentUserRole === 'admin',
  //         revenueSetup: currentUserRole === 'admin',
  //         revenueCeiling: currentUserRole === 'admin',
  //         funding: currentUserRole === 'admin'
  //       });
  //     }
  //   };
  //   loadTabVisibility();
  // }, [currentUserRole]);

  function capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const handleExportPlan = async (planOverride) => {
    const plan = planOverride || selectedPlan;

    if (!plan?.projId || !plan?.version || !plan?.plType) {
      toast.error("Missing required parameters for export.");
      return;
    }

    // 1. SET EXPORT-SPECIFIC LOADING (Don't use the global 'setLoading')
    setIsExporting(true);
    const toastId = toast.loading("Preparing Excel file, please wait...");

    try {
      const response = await axios.get(
        `${backendUrl}/Forecast/ExportPlanDirectCost`,
        {
          params: {
            projId: plan.projId,
            version: plan.version,
            type: plan.plType,
          },
          responseType: "blob",
        }
      );

      if (!response.data || response.data.size === 0) {
        toast.update(toastId, {
          render: "No data received from server",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      // Handle the file download silently in the background
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Plan_${plan.projId}_${plan.version}_${plan.plType}.xlsx`
      );

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.update(toastId, {
        render: "Export successful!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Export Error:", err);
      toast.update(toastId, {
        render:
          "Export failed: " + (err.response?.data?.message || err.message),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      // 2. RELEASE EXPORT LOADING (UI stays intact)
      setIsExporting(false);
    }
  };

  const handleExportPlanFromDetails = () => {
    if (selectedPlan) {
      handleExportPlan(selectedPlan);
    } else {
      toast.warning("Please select a plan first.");
    }
  };

  const handleImportPlanFromDetails = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // if (!selectedPlan?.projId) {
    //   toast.error("Please select a project before importing data.");
    //   return;
    // }

    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error(
        "Invalid file format. Please upload an Excel file (.xlsx or .xls)"
      );
      return;
    }

    // 1. USE LOCALIZED LOADING (Prevents whole page flicker)
    setIsImporting(true);
    const toastId = toast.loading("Processing data import...");

    const formData = new FormData();
    formData.append("file", file);
    // formData.append("projId", selectedPlan.projId);

    try {
      const response = await axios.post(
        `${backendUrl}/Forecast/ImportDirectCostPlan`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Refresh data after import success
      if (typeof refreshPlans === "function") {
        await refreshPlans(selectedPlan.projId);
      }

      toast.update(toastId, {
        render: "Data imported successfully.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Force a re-render of the details view if needed
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Import Error:", err);
      let errorMessage =
        "Failed to import file. Please verify the project ID and file format.";
      if (err.response?.data) {
        errorMessage =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data.message;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      // 2. RELEASE LOADING
      setIsImporting(false);
      if (event.target) event.target.value = ""; // Reset file input
    }
  };

  const safeFormatDate = (value) => {
    if (!value) return "N/A";

    // Handle YYYY-MM-DD format
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${month}/${day}/${year}`;
    }

    // Handle other date formats
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (e) {
      return "N/A";
    }
  };

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUserName(userObj.name ? capitalizeWords(userObj.name) : "User");
        setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
      } catch {
        setCurrentUserRole(null);
        setUserName("User");
      }
    }
  }, []);

  const isChildProjectId = (projId) => {
    return projId && typeof projId === "string" && projId.includes(".");
  };

  useEffect(() => {
    if (!activeTab) return;

    const refMap = {
      hours: hoursRefs,
      amounts: amountsRefs,
      revenueAnalysis: revenueRefs,
      analysisByPeriod: analysisRefs,
      revenueSetup: revenueSetupRefs,
      revenueCeiling: revenueCeilingRefs,
      funding: fundingRefs,
      plc: hoursRefs,
      dashboard: dashboardRefs,
      warning: warningRefs,
    };

    const refObj = refMap[activeTab];

    if (refObj && refObj.current && refObj.current[searchTerm]) {
      requestAnimationFrame(() => {
        refObj.current[searchTerm].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (
        !selectedPlan ||
        !selectedPlan.plId ||
        !selectedPlan.templateId ||
        !selectedPlan.plType
      ) {
        setAnalysisApiData([]);
        setIsAnalysisLoading(false);
        setAnalysisError("Please select a plan to view Analysis By Period.");
        return;
      }
      if (activeTab !== "analysisByPeriod") return;

      setIsAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const params = new URLSearchParams({
          planID: selectedPlan.plId.toString(),
          templateId: selectedPlan.templateId.toString(),
          type: selectedPlan.plType,
        });

        const externalApiUrl = `${EXTERNAL_API_BASE_URL}${CALCULATE_COST_ENDPOINT}?${params.toString()}`;
        // const externalApiUrl = `${backendUrl}/Forecast/CalculateCost?${params.toString()}`;

        const response = await fetch(externalApiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          let errorText = "Unknown error";
          try {
            errorText =
              (await response.json()).message ||
              JSON.stringify(await response.json());
          } catch (e) {
            errorText = await response.text();
          }
          throw new Error(
            `HTTP error! status: ${response.status}. Details: ${errorText}`
          );
        }
        const apiResponse = await response.json();
        setAnalysisApiData(apiResponse);
      } catch (err) {
        setAnalysisError(`Failed to load Analysis By Period data. `);
        setAnalysisApiData([]);
      } finally {
        setIsAnalysisLoading(false);
      }
    };
    fetchAnalysisData();
  }, [selectedPlan, activeTab, EXTERNAL_API_BASE_URL, CALCULATE_COST_ENDPOINT]);

  useEffect(() => {
    if (filteredProjects.length > 0) {
      const project = filteredProjects[0];
      const startDate = project.startDate || project.projStartDt;
      const endDate = project.endDate || project.projEndDt;

      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const date = dateStr.includes("/")
          ? (() => {
              const [month, day, year] = dateStr.split("/");
              return new Date(`${year}-${month}-${day}`);
            })()
          : new Date(dateStr);

        return isNaN(date.getTime()) ? null : date;
      };

      const start = parseDate(startDate);
      const end = parseDate(endDate);

      if (start && end) {
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const currentYear = new Date().getFullYear();

        if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
          const years = [];
          for (let year = startYear; year <= endYear; year++) {
            years.push(year.toString());
          }
          setFiscalYearOptions(["All", ...years]);
          if (years.includes(currentYear.toString())) {
            setFiscalYear(currentYear.toString());
          } else {
            setFiscalYear("All");
          }
        } else {
          setFiscalYearOptions(["All"]);
          setFiscalYear("All");
        }
      } else {
        setFiscalYearOptions(["All"]);
        setFiscalYear("All");
      }
    } else {
      setFiscalYearOptions(["All"]);
      setFiscalYear("All");
    }
  }, [filteredProjects]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearched(false);
    }
  }, [searchTerm]);

  const handleSearch = async (value) => {
    // const term = searchTerm.trim();

    // setSearched(true);
    // setErrorMessage("");

    // // if (!term) {
    // //   setFilteredProjects([]);
    // //   setSelectedPlan(null);
    // //   setRevenueAccount("");
    // //   setPrefixes(new Set());
    // //   return;
    // // }

    // setLoading(true);

    const term = value.trim();

    // if (!term) {
    //   toast.error("Please enter or select a Project ID");
    //   return;
    // }

    // 1. Set these to trigger the Table loading and UI states
    setFinalSearchTerm(term);
    setSearched(true);
    setErrorMessage("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await axios
        .get
        // `${backendUrl}/Project/GetAllProjectByProjId/${term}`
        ();
      const data = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      const project = {
        projId: data.projectId || term,
        projName: data.name || "",
        projTypeDc: data.description || "",
        orgId: data.orgId || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        fundedCost: data.proj_f_cst_amt || "",
        fundedFee: data.proj_f_fee_amt || "",
        fundedRev: data.proj_f_tot_amt || "",
        revenue: data.revenue || "",
      };
      const prefix = project.projId.includes(".")
        ? project.projId.split(".")[0]
        : project.projId.includes("T")
          ? project.projId.split("T")[0]
          : project.projId;
      setPrefixes(new Set([prefix]));
      setFilteredProjects([project]);
      setRevenueAccount(data.revenueAccount || "");
    } catch (error) {
      try {
        const planResponse = await axios.get(
          `${backendUrl}/Project/GetProjectPlans/${userId}/${role}/dsvyuvsb?status=${statusFilter}`
        );
        const planData = Array.isArray(planResponse.data)
          ? planResponse.data[0]
          : planResponse.data;
        if (planData && planData.projId) {
          const project = {
            projId: planData.projId || term,
            projName: planData.name || "",
            projTypeDc: planData.description || "",
            orgId: planData.orgId || "",
            startDate: planData.startDate || "",
            endDate: planData.endDate || "",
            fundedCost: planData.proj_f_cst_amt || "",
            fundedFee: planData.proj_f_fee_amt || "",
            fundedRev: planData.proj_f_tot_amt || "",
            revenue: planData.revenue || "",
          };
          const prefix = project.projId.includes(".")
            ? project.projId.split(".")[0]
            : project.projId.includes("T")
              ? project.projId.split("T")[0]
              : project.projId;
          setPrefixes(new Set([prefix]));
          setFilteredProjects([project]);
          setRevenueAccount(planData.revenueAccount || "");
          // toast.info("Project data fetched from plans.", {
          //   toastId: "fallback-project-fetch",
          //   autoClose: 3000,
          // });
        } else {
          throw new Error("No valid plan data found.");
        }
      } catch (planError) {
        setErrorMessage("No project or plan found with that ID.");
        setFilteredProjects([]);
        setSelectedPlan(null);
        setRevenueAccount("");
        setPrefixes(new Set());
        // toast.error("Failed to fetch project or plan data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch(searchTerm);
  };

  // const handleInputChange = (e) => {
  //   setSearchTerm(e.target.value);
  //   // handleSearch(e.target.value);
  //   setErrorMessage("");
  //   setSearched(false);
  //   setFilteredProjects([]);
  //   setSelectedPlan(null);
  // };
  // 1. Call API once on Focus
  const handleFocus = async () => {
    // Only fetch if we haven't loaded the projects yet
    if (allProjects.length === 0) {
      try {
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectsForSearch`
        );
        const data = response.data || [];
        setAllProjects(data);
        // If there is already text in the box, filter immediately on focus
        if (searchTerm) {
          filterData(searchTerm, data);
        } else {
          setSuggestions(data); // Show all if box is empty
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    } else {
      // If data already exists, just show it
      filterData(searchTerm, allProjects);
    }
    setShowSuggestions(true);
  };

  // 2. Local filtering logic (Shared function)
  // const filterData = (value, sourceData) => {
  //   const term = value.toLowerCase();
  //   const filtered = sourceData
  //     .filter(
  //       (proj) =>
  //         proj.projectId.toLowerCase().includes(term) ||
  //         proj.name.toLowerCase().includes(term)
  //     )
  //     .sort((a, b) => {
  //       // Boost relevance: Projects starting with the search term come first
  //       const aStarts = a.projectId.toLowerCase().startsWith(term);
  //       const bStarts = b.projectId.toLowerCase().startsWith(term);
  //       if (aStarts && !bStarts) return -1;
  //       if (!aStarts && bStarts) return 1;
  //       return 0;
  //     });

  //   setSuggestions(filtered);
  // };
  const filterData = (value, sourceData) => {
  if (!value) {
    setSuggestions([]);
    return;
  }
  
  const term = value.toLowerCase().trim();
  const filtered = sourceData.filter(
    (proj) =>
      proj.projectId.toLowerCase().includes(term) ||
      proj.name.toLowerCase().includes(term)
  );

  const sorted = filtered.sort((a, b) => {
    const aId = a.projectId.toLowerCase();
    const bId = b.projectId.toLowerCase();
    
    // 1. EXACT MATCH first (e.g., "20001" when searching "20001")
    const aExact = aId === term;
    const bExact = bId === term;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // 2. STARTS WITH next (boost prefix matches)
    const aStarts = aId.startsWith(term);
    const bStarts = bId.startsWith(term);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // 3. HIERARCHY LEVEL: Parent (fewer dots) before children
    const aDots = (aId.match(/\./g) || []).length;
    const bDots = (bId.match(/\./g) || []).length;
    if (aDots !== bDots) return aDots - bDots;
    
    // 4. Alphabetical within same level
    return a.projectId.localeCompare(b.projectId);
  });

  setSuggestions(sorted);
};


  // 3. Handle Input Change (No API calls here)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setErrorMessage("");
    setSearched(false);

    if (value.trim() === "") {
      setSuggestions(allProjects); // Show everything if cleared
    } else {
      filterData(value, allProjects);
    }
    setShowSuggestions(true);
  };

  // const handleSelectSuggestion = (proj) => {
  //   setSearchTerm(proj.projectId);
  //   setShowSuggestions(false);
  //   // We keep allProjects but reset suggestions for the next time it opens
  //   setSuggestions(allProjects);
  // };

  // Selection handler triggers search immediately
  const handleSelectSuggestion = (proj) => {
    setSearchTerm(proj.projectId);
    setSuggestions(allProjects);
    setShowSuggestions(false);

    // Trigger search immediately with the selected ID
    handleSearch(proj.projectId);
  };

  // const handlePlanSelect = (plan) => {
  //   if (!plan) {
  //     setSelectedPlan(null);
  //     localStorage.removeItem("selectedPlan");
  //     setActiveTab(null);
  //     setForecastData([]);
  //     setIsForecastLoading(false);
  //     setAnalysisApiData([]);
  //     setIsAnalysisLoading(false);
  //     setAnalysisError(null);
  //     return;
  //   }

  //   if (
  //     !selectedPlan ||
  //     selectedPlan.plId !== plan.plId ||
  //     JSON.stringify(selectedPlan) !== JSON.stringify(plan)
  //   ) {
  //     const project = {
  //       projId: plan.projId || "",
  //       projName: plan.projName || "",
  //       projStartDt: plan.projStartDt || "",
  //       projEndDt: plan.projEndDt || "",
  //       orgId: plan.orgId || "",
  //       fundedCost: plan.fundedCost || "",
  //       fundedFee: plan.fundedFee || "",
  //       fundedRev: plan.fundedRev || "",
  //     };

  //     setFilteredProjects([project]);
  //     setRevenueAccount(plan.revenueAccount || "");
  //     setSelectedPlan(plan);
  //     localStorage.setItem("selectedPlan", JSON.stringify(plan));
  //     setForecastData([]);
  //     setIsForecastLoading(false);
  //     setAnalysisApiData([]);
  //     setIsAnalysisLoading(false);
  //     setAnalysisError(null);
  //   }
  // };

  //   const handlePlanSelect = (plan) => {
  //     if (!plan) {
  //       setSelectedPlan(null);
  //       localStorage.removeItem("selectedPlan");
  //       setActiveTab(null);
  //       setForecastData([]);
  //       setIsForecastLoading(false);
  //       setAnalysisApiData([]);
  //       setIsAnalysisLoading(false);
  //       setAnalysisError(null);
  //       return;
  //     }

  //     // --- CRITICAL FIX START ---
  //     // Use an explicit check for necessary updates (ID change or Date change)
  //     // The previous JSON.stringify check was overly strict and caused the issue.

  //     const isPlanIdentityChanged =
  //         !selectedPlan ||
  //         selectedPlan.plId !== plan.plId ||
  //         selectedPlan.projId !== plan.projId;

  //     const hasDatesChanged =
  //         selectedPlan &&
  //         (selectedPlan.projStartDt !== plan.projStartDt || selectedPlan.projEndDt !== plan.projEndDt);

  //     // Retain the core logic structure: Update only if essential state changes.
  //     if (isPlanIdentityChanged || hasDatesChanged) {
  //     // --- CRITICAL FIX END ---

  //       const project = {
  //         projId: plan.projId || "",
  //         projName: plan.projName || "",
  //         // Crucial: Use the latest effective dates passed from the table
  //         projStartDt: plan.projStartDt || "",
  //         projEndDt: plan.projEndDt || "",
  //         // Retain existing properties for project object
  //         orgId: plan.orgId || "",
  //         fundedCost: plan.fundedCost || "",
  //         fundedFee: plan.fundedFee || "",
  //         fundedRev: plan.fundedRev || "",
  //         revenue: plan.revenue || "",
  //       };

  //       setFilteredProjects([project]);
  //       setRevenueAccount(plan.revenueAccount || "");
  //       setSelectedPlan(plan); // The full plan object now has the correct dates
  //       localStorage.setItem("selectedPlan", JSON.stringify(plan));
  //       setForecastData([]);
  //       setIsForecastLoading(false);
  //       setAnalysisApiData([]);
  //       setIsAnalysisLoading(false);
  //       setAnalysisError(null);
  //     }
  //   };

  // const handlePlanSelect = (plan) => {
  //   if (!plan) {
  //     setSelectedPlan(null);
  //     localStorage.removeItem("selectedPlan");
  //     setActiveTab(null);
  //     return;
  //   }

  //   // --- RUNTIME SYNC FIX ---
  //   // We check if the plan identity OR any of the status fields have changed
  //   const isDifferentPlan = !selectedPlan || selectedPlan.plId !== plan.plId;

  //   const hasStatusChanged =
  //     selectedPlan &&
  //     (selectedPlan.status !== plan.status ||
  //       selectedPlan.isCompleted !== plan.isCompleted ||
  //       selectedPlan.isApproved !== plan.isApproved ||
  //       selectedPlan.finalVersion !== plan.finalVersion ||
  //       selectedPlan.projStartDt !== plan.projStartDt ||
  //       selectedPlan.projEndDt !== plan.projEndDt);

  //   if (isDifferentPlan || hasStatusChanged) {
  //     const project = {
  //       projId: plan.projId || "",
  //       projName: plan.projName || "",
  //       projStartDt: plan.projStartDt || "",
  //       projEndDt: plan.projEndDt || "",
  //       orgId: plan.orgId || "",
  //       fundedCost: plan.fundedCost || "",
  //       fundedFee: plan.fundedFee || "",
  //       fundedRev: plan.fundedRev || "",
  //       revenue: plan.revenue || "",
  //     };

  //     setFilteredProjects([project]);
  //     setRevenueAccount(plan.revenueAccount || "");
  //     setSelectedPlan(plan); // This now carries the fresh status
  //     localStorage.setItem("selectedPlan", JSON.stringify(plan));

  //     // Optional: Clear analysis data to force reload with new status context
  //     setAnalysisApiData([]);
  //   }
  // };

  const handlePlanSelect = (plan) => {
    // Validation: Ensure plan exists before proceeding
    if (!plan) {
      setSelectedPlan(null);
      localStorage.removeItem("selectedPlan");
      setActiveTab(null);
      return;
    }

    const project = {
      projId: plan.projId || "",
      projName: plan.projName || "",
      projStartDt: plan.projStartDt || "",
      projEndDt: plan.projEndDt || "",
      orgId: plan.orgId || "",
      fundedCost: plan.fundedCost || "",
      fundedFee: plan.fundedFee || "",
      fundedRev: plan.fundedRev || "",
      revenue: plan.revenue || "",
    };

    setFilteredProjects([project]);
    setRevenueAccount(plan.revenueAccount || "");

    // Update the selected plan state
    setSelectedPlan(plan);
    localStorage.setItem("selectedPlan", JSON.stringify(plan));

    // Clear analysis data to ensure fresh data is loaded for the newly selected row
    setAnalysisApiData([]);
  };

  // inside ProjectBudgetStatus
  // inside ProjectBudgetStatus

  const handlePlanCreated = (plan) => {
    handlePlanSelect(plan);

    // always reflect the project id in the search box / filter
    if (plan.projId) {
      setSearchTerm(plan.projId); // shows 20001.00.000200.0000 in the input
    }

    if (!plan.projId) return;

    const prefix = plan.projId.includes(".")
      ? plan.projId.split(".")[0]
      : plan.projId.includes("T")
        ? plan.projId.split("T")[0]
        : plan.projId;

    setPrefixes(new Set([prefix]));
    setFilteredProjects([
      {
        projId: plan.projId || "",
        projName: plan.projName || "",
        projTypeDc: "",
        orgId: plan.orgId || "",
        startDate: plan.projStartDt || "",
        endDate: plan.projEndDt || "",
        fundedCost: plan.fundedCost || "",
        fundedFee: plan.fundedFee || "",
        fundedRev: plan.fundedRev || "",
        revenue: plan.revenue || "",
      },
    ]);
  };

  // const handleTabClick = (tabName) => {
  //   if (tabName !== "dashboard" && !selectedPlan) {
  //     toast.info("Please select a plan first.", {
  //       toastId: "no-plan-selected",
  //       autoClose: 3000,
  //     });
  //     return;
  //   }
  //   if (activeTab !== tabName) {
  //     setActiveTab(tabName);
  //   }
  // };

  const handleTabClick = (tabName) => {
    if (tabName !== "dashboard" && !selectedPlan) {
      toast.info("Please select a plan first.", {
        toastId: "no-plan-selected",
        autoClose: 3000,
      });
      return;
    }

    // if tabs area is still hidden, ignore all except "detail"
    if (!showTabs && tabName !== "detail") {
      return;
    }

    if (activeTab !== tabName) {
      setActiveTab(tabName);
    }
  };

  // const handleCloseTab = () => {
  //   setActiveTab(null);
  // };

  const handleCloseTab = () => {
    setActiveTab(null);
    setViewMode("plans"); // back to plan table
    setShowTabs(false); // hide tabs row
    setRefreshKey((prev) => prev + 1);
  };

  const geistSansStyle = {
    fontFamily: "'Geist', 'Geist Fallback', sans-serif",
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 font-inter">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 text-sm sm:text-base">
          Loading...
        </span>
      </div>
    );
  }

  const handleCalc = async () => {
    setCalculation(true);
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
    // setIsActionLoading(true);
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
      // setIsActionLoading(false);
      setCalculation(false);
    }
  };

  const getCurrentPlan = () => {
    if (!selectedPlan) return null;
    return selectedPlan;
  };

  return (
    <div className="sm:p-2  space-y-6 text-sm sm:text-base text-gray-800 font-inter  mt-9 ">
      {viewMode === "plans" && (
        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 mb-2 ">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Add the ref to this wrapper div */}
            <div
              className="flex items-center gap-2 w-full sm:w-auto"
              ref={searchContainerRef}
            >
              <label className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                Project ID:
              </label>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white shadow-inner"
                  placeholder="Search Project ID..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyPress}
                  ref={inputRef}
                  autoComplete="off"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((proj, index) => (
                      <li
                        key={index}
                        className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-none"
                        onMouseDown={(e) => {
                          // Using onMouseDown prevents the input onBlur from firing first
                          e.preventDefault();
                          handleSelectSuggestion(proj);
                        }}
                      >
                        <div className="font-bold text-blue-900">
                          {proj.projectId}
                        </div>
                        <div className="text-gray-600 truncate">
                          {proj.name}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-500">Status</span>
              <select
                className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100  "
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                // disabled={searchTerm.length === 0}
              >
                <option value="">All</option>
                <option value="Y">Active</option>
                <option value="N">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => handleSearch(searchTerm)}
              className="bg-[#17414d] text-white group-hover:text-gray px-6 py-1.5 rounded cursor-pointer text-xs sm:text-sm font-semibold   transition-all shadow-md active:scale-95 w-full sm:w-auto"
            >
              Search
            </button>
          </div>
        </div>
      )}

      <div
        // key={searchTerm}
        // className="space-y-4 sm:p-2 border-overall  bg-white   "

        className="space-y-4 bg-white rounded-lg"
      >
        {viewMode === "plans" && getCurrentPlan() && (
          <div
            // className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-1"
            className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-2 rounded-md border-l-[6px] mb-1 relative"
            style={{
              backgroundColor: "#e9f6fb",
              color: "#17414d",
              borderLeftColor: "#17414d",
              borderRadius: "8px", // Ensures consistent rounding on all corners
            }}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="font-semibold blue-text">Project ID:</span>{" "}
                <span className="text-gray-700">{getCurrentPlan().projId}</span>
              </div>

              <div>
                <span className="font-semibold blue-text">
                  Period of Performance:
                </span>{" "}
                Start Date:{" "}
                <span className="text-gray-700">
                  {getCurrentPlan().projStartDt || getCurrentPlan().startDate
                    ? safeFormatDate(
                        getCurrentPlan().projStartDt ||
                          getCurrentPlan().startDate
                      )
                    : "N/A"}
                </span>
                {" | "}
                End Date:{" "}
                <span className="text-gray-700">
                  {getCurrentPlan().projEndDt || getCurrentPlan().endDate
                    ? safeFormatDate(
                        getCurrentPlan().projEndDt || getCurrentPlan().endDate
                      )
                    : "N/A"}
                </span>
              </div>

              {/* </div> */}
              {/* <div>
                    <span className="font-semibold text-green-800">
                      Organization:
                    </span>{" "}
                    <span className="text-gray-700">{getCurrentPlan().orgId}</span>
                  </div> */}
              <div>
                <span className="font-semibold blue-text">Funded Fee:</span>{" "}
                <span className="text-gray-700">
                  {Number(getCurrentPlan().fundedFee).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Funded Cost:</span>{" "}
                <span className="text-gray-700">
                  {Number(getCurrentPlan().fundedCost).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Funded Rev:</span>{" "}
                <span className="text-gray-700">
                  {Number(getCurrentPlan().fundedRev).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Revenue:</span>{" "}
                <span className="text-gray-700">
                  {Number(getCurrentPlan().revenue || 0).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }
                  )}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Backlog:</span>{" "}
                <span className="text-gray-700">
                  {Number(
                    (getCurrentPlan().revenue || 0) -
                      (getCurrentPlan().fundedCost || 0)
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Flex container to keep buttons on the left of ProjectPlanTable */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* {viewMode === "details" && showTabs && (
  // <div className="flex flex-row gap-2 text-blue-600 text-xs sm:text-sm w-full flex-wrap mt-4 ">
   <div className=" px-4 py-2 flex gap-2 overflow-x-auto relative w-full border-none border-gray-200 mt-6">
   
    <span
      // className={`btn ${activeTab === "hours" ? "btn-active" : "btn-inactive"}`}
 className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "hours"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "hours" ? "#113d46" : "#e5e7eb",
  }} 

      onClick={() => setActiveTab("hours")}
    >
      BUD/EAC
    </span>
  

    {currentUserRole === "admin" && (
      <>
        <span
          // className={`btn ${
          //   activeTab === "analysisByPeriod" ? "btn-active" : "btn-inactive"
          // }`}
           
             className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "analysisByPeriod"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "analysisByPeriod" ? "#113d46" : "#e5e7eb",
  }} 
          onClick={() => handleTabClick("analysisByPeriod")}
        >
          Monthly Forecast
        </span>
        <span
          // className={`btn ${activeTab === "plc" ? "btn-active" : "btn-inactive"}`}
              className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "plc"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "plc" ? "#113d46" : "#e5e7eb",
  }} 
          onClick={() => handleTabClick("plc")}
        >
          Labor Categories
        </span>
        <span
          // className={`btn ${
          //   activeTab === "revenueSetup" ? "btn-active" : "btn-inactive"
          // }`}
               className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "revenueSetup"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "revenueSetup" ? "#113d46" : "#e5e7eb",
  }} 
          onClick={() => handleTabClick("revenueSetup")}
        >
          Revenue Definition
        </span>
        <span
          // className={`btn ${
          //   activeTab === "revenueCeiling" ? "btn-active" : "btn-inactive"
          // }`}
            className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "revenueCeiling"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "revenueCeiling" ? "#113d46" : "#e5e7eb",
  }} 
          onClick={() => handleTabClick("revenueCeiling")}
        >
          Adjustment
        </span>
        <span
          // className={`btn ${activeTab === "funding" ? "btn-active" : "btn-inactive"}`}
            className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "funding"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "funding" ? "#113d46" : "#e5e7eb",
  }} 
          onClick={() => handleTabClick("funding")}
        >
          Funding
        </span>
      </>
    )}

    <span
     
    className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
    ${activeTab === "warning"
      ? "text-white"
      : "text-gray-500 font-semibold bg-gray-200"
    }`}
  style={{
    ...geistSansStyle,
    backgroundColor: activeTab === "warning" ? "#113d46" : "#e5e7eb",
  }} 
      onClick={() => handleTabClick("warning")}
    >
      Warning
    </span>
  </div>
)} */}

          {viewMode === "details" && showTabs && (
            <div className="px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between min-w-full mt-2 gap-4">
              {/* LEFT SIDE: Tabs Container */}
              <div className="flex gap-2 overflow-x-auto border-none border-gray-200">
                <span
                  className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeTab === "hours"
              ? "text-white"
              : "text-gray-500 font-semibold bg-gray-200"
          }`}
                  style={{
                    ...geistSansStyle,
                    backgroundColor:
                      activeTab === "hours" ? "#113d46" : "#e5e7eb",
                  }}
                  onClick={() => setActiveTab("hours")}
                >
                  BUD/EAC
                </span>

                {currentUserRole === "admin" && (
                  <>
                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
              ${
                activeTab === "analysisByPeriod"
                  ? "text-white"
                  : "text-gray-500 font-semibold bg-gray-200"
              }`}
                      style={{
                        ...geistSansStyle,
                        backgroundColor:
                          activeTab === "analysisByPeriod"
                            ? "#113d46"
                            : "#e5e7eb",
                      }}
                      onClick={() => handleTabClick("analysisByPeriod")}
                    >
                      Monthly Forecast
                    </span>
                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
              ${
                activeTab === "plc"
                  ? "text-white"
                  : "text-gray-500 font-semibold bg-gray-200"
              }`}
                      style={{
                        ...geistSansStyle,
                        backgroundColor:
                          activeTab === "plc" ? "#113d46" : "#e5e7eb",
                      }}
                      onClick={() => handleTabClick("plc")}
                    >
                      Labor Categories
                    </span>
                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
              ${
                activeTab === "revenueSetup"
                  ? "text-white"
                  : "text-gray-500 font-semibold bg-gray-200"
              }`}
                      style={{
                        ...geistSansStyle,
                        backgroundColor:
                          activeTab === "revenueSetup" ? "#113d46" : "#e5e7eb",
                      }}
                      onClick={() => handleTabClick("revenueSetup")}
                    >
                      Revenue Definition
                    </span>
                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
              ${
                activeTab === "revenueCeiling"
                  ? "text-white"
                  : "text-gray-500 font-semibold bg-gray-200"
              }`}
                      style={{
                        ...geistSansStyle,
                        backgroundColor:
                          activeTab === "revenueCeiling"
                            ? "#113d46"
                            : "#e5e7eb",
                      }}
                      onClick={() => handleTabClick("revenueCeiling")}
                    >
                      Adjustment
                    </span>
                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
              ${
                activeTab === "funding"
                  ? "text-white"
                  : "text-gray-500 font-semibold bg-gray-200"
              }`}
                      style={{
                        ...geistSansStyle,
                        backgroundColor:
                          activeTab === "funding" ? "#113d46" : "#e5e7eb",
                      }}
                      onClick={() => handleTabClick("funding")}
                    >
                      Funding
                    </span>
                  </>
                )}

                <span
                  className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeTab === "warning"
              ? "text-white"
              : "text-gray-500 font-semibold bg-gray-200"
          }`}
                  style={{
                    ...geistSansStyle,
                    backgroundColor:
                      activeTab === "warning" ? "#113d46" : "#e5e7eb",
                  }}
                  onClick={() => handleTabClick("warning")}
                >
                  Warning
                </span>
              </div>

              {/* RIGHT SIDE: Fiscal Year Dropdown */}
              <div className="flex items-center justify-end gap-x-4">
                <div className="flex items-center gap-2 ml-auto pr-2">
                  <label className="text-xs font-bold text-gray-600 whitespace-nowrap">
                    Fiscal Year:
                  </label>
                  <select
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#113d46] shadow-sm min-w-[100px]"
                  >
                    {fiscalYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full flex justify-end">
                  <button
                    className="right-3 flex gap-x-1.5 items-center text-sm text-white bg-[#17414d] px-2 py-1.5 rounded-sm transition-colors cursor-pointer"
                    onClick={handleCloseTab}
                    title="Close project details"
                  >
                    <CircleArrowLeft size={15} className="text-white" /> Back
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 overflow-hidden">
            {viewMode === "plans" && (
              <ProjectPlanTable
                ref={planTableRef}
                onExportPlan={handleExportPlan}
                // projectId={searchTerm.trim()}
                projectId={finalSearchTerm}
                searched={searched}
                onPlanSelect={handlePlanSelect}
                selectedPlan={selectedPlan}
                fiscalYear={fiscalYear}
                setFiscalYear={setFiscalYear}
                fiscalYearOptions={fiscalYearOptions}
                filteredProjects={filteredProjects}
                onPlanCreated={handlePlanCreated}
                status={statusFilter}
                // onOpenDetails={() => {
                //   if (!selectedPlan) {
                //     toast.info("Please select a plan first.", {
                //       toastId: "no-plan-selected",
                //       autoClose: 3000,
                //     });
                //     return;
                //   }
                //  setViewMode("details");      // hide grid, enable details
                //         setShowTabs(true);           // show all tabs
                //         setActiveTab("detail");
                // }}
                onOpenDetails={() => {
                  if (!selectedPlan) {
                    toast.info("Please select a plan first.", {
                      toastId: "no-plan-selected",
                      autoClose: 3000,
                    });
                    return;
                  }
                  setViewMode("details");
                  setShowTabs(true);
                  setActiveTab("hours"); // open Hours as default
                }}
                onOpenMonthly={() => {
                  if (!selectedPlan) {
                    toast.info("Please select a plan first.", {
                      toastId: "no-plan-selected",
                      autoClose: 3000,
                    });
                    return;
                  }
                  setViewMode("details");
                  setShowTabs(true);
                  setActiveTab("analysisByPeriod"); // open Hours as default
                }}
              />
            )}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && currentUserRole === "admin" && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (dashboardRefs.current[searchTerm] = el)}
          >
            <div className="relative">
              <button
                className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
                onClick={handleCloseTab}
                title="Close dashboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* HOURS TAB: hours + other cost together */}
        {viewMode === "details" && activeTab === "hours" && selectedPlan && (
          <div
            className="relative p-2 sm:p-4  min-h-[150px] scroll-mt-16"
            ref={(el) => {
              hoursRefs.current[searchTerm] = el;
              amountsRefs.current[searchTerm] = el;
            }}
          >
            {/* shared project header + close */}
            {/* <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 relative">
      <button
        className="absolute top-2 right-2 blue-text hover:text-red-500 text-xl z-20 cursor-pointer bg-white bg-opacity-80 rounded-full p-0.5 transition-shadow shadow"
        onClick={handleCloseTab}
        title="Close project details"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

     
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-r-md border-l-4" 
     style={{ 
        backgroundColor: "#e9f6fb", 
        color: "#17414d", 
        borderLeftColor: "#17414d" 
     }}>
  <span>
    <span className="font-semibold">Project ID: </span>
    {selectedPlan.projId}
  </span>
  <span>
    <span className="font-semibold">Type: </span>
    {selectedPlan.plType || "N/A"}
  </span>
  <span>
    <span className="font-semibold">Version: </span>
    {selectedPlan.version || "N/A"}
  </span>
  <span>
    <span className="font-semibold">Status: </span>
    {selectedPlan.status || "N/A"}
  </span>
  <span>
    <span className="font-semibold">Period of Performance: </span>
    Start Date:{" "}
    {selectedPlan.projStartDt
      ? formatDate(selectedPlan.projStartDt)
      : "N/A"}{" "}
    | End Date:{" "}
    {selectedPlan.projEndDt ? formatDate(selectedPlan.projEndDt) : "N/A"}
  </span>
</div>
    </div> */}

            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
              style={{
                backgroundColor: "#e9f6fb",
                color: "#17414d",
                borderLeftColor: "#17414d",
                borderRadius: "8px", // Ensures consistent rounding on all corners
              }}
            >
              {/* Close Button Integrated into the New Styled Header */}
              {/* <button
                className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                onClick={handleCloseTab}
                title="Close project details"
                style={{ color: "#17414d" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button> */}

              {/* Project Info Details */}
              <div className="flex flex-wrap items-center gap-x-6 pr-8">
                <span>
                  <span className="font-semibold">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Period of Performance: </span>
                  Start Date:{" "}
                  {selectedPlan.projStartDt
                    ? formatDate(selectedPlan.projStartDt)
                    : "N/A"}{" "}
                  | End Date:{" "}
                  {selectedPlan.projEndDt
                    ? formatDate(selectedPlan.projEndDt)
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* centered cards, outer div has NO overflow */}
            <div className="w-full mx-auto grid gap-4 md:grid-cols-1">
              <div className="flex gap-2 items-center">
                {/* ✅ IMPORT BUTTON - uses table ref */}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="btn1 btn-blue cursor-pointer flex items-center"
                  title="Import Plan"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4"
                    />
                  </svg>
                  Import
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportPlanFromDetails}
                  accept=".xlsx,.xls"
                  className="hidden"
                />

                {/* ✅ EXPORT BUTTON - uses table ref */}
                <button
                  // onClick={(e) => {
                  //   e.stopPropagation();
                  //   handleExportPlanFromDetails;
                  // }}
                  type="button"
                  onClick={() => handleExportPlanFromDetails()}
                  className="btn1 btn-blue cursor-pointer flex items-center"
                  title="Export to Excel"
                  disabled={
                    !selectedPlan?.projId ||
                    !selectedPlan?.version ||
                    !selectedPlan?.plType
                  }
                >
                  
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Export
                </button>

                <button
                  onClick={handleCalc}
                  className="btn1 btn-blue cursor-pointer flex items-center"
                  title="Import Plan"
                  disabled={calculation}
                >
                  {calculation ? "Calculating" : "Calc"}
                </button>
              </div>
              {/* HOURS CARD */}
              <div className="border border-gray-200 rounded-md shadow-sm bg-white">
                {/* <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-xs sm:text-sm blue-text">
            Hours
          </span>
        </div> */}
                {/* inner scroll handled by grid component; no extra scroll here */}

                <div className="px-2 pb-2">
                  <ProjectHoursDetails
                    planId={selectedPlan.plId}
                    projectId={selectedPlan.projId}
                    templateId={selectedPlan.templateId}
                    status={selectedPlan.status}
                    planType={selectedPlan.plType}
                    closedPeriod={selectedPlan.closedPeriod}
                    startDate={selectedPlan.projStartDt}
                    endDate={selectedPlan.projEndDt}
                    fiscalYear={fiscalYear}
                    onSaveSuccess={() => {}}
                    //  onColumnTotalsChange={setHoursColumnTotalsFromHours}
                    onColumnTotalsChange={setHoursColumnTotalsFromHours} // NEW
                  />
                </div>
              </div>

              {/* OTHER COST CARD */}
              <div className="border border-gray-200 rounded-md shadow-sm bg-white">
                {/* <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-xs sm:text-sm blue-text">
            Other Cost
          </span>
        </div> */}
                <div className="px-2 pb-2">
                  <ProjectAmountsTable
                    initialData={selectedPlan}
                    startDate={selectedPlan.projStartDt}
                    endDate={selectedPlan.projEndDt}
                    planType={selectedPlan.plType}
                    templateId={selectedPlan.templateId}
                    fiscalYear={fiscalYear}
                    refreshKey={refreshKey}
                    onSaveSuccess={() => setRefreshKey((prev) => prev + 1)}
                    onColumnTotalsChange={setOtherColumnTotalsFromAmounts}
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-md shadow-sm bg-white">
                <div className="px-2 pb-2">
                  <ProjectPoolCosts
                    planId={selectedPlan.plId}
                    startDate={selectedPlan.projStartDt}
                    endDate={selectedPlan.projEndDt}
                    fiscalYear={fiscalYear}
                    hoursColumnTotals={hoursColumnTotalsFromHours}
                    otherColumnTotals={otherColumnTotalsFromAmounts}
                    refreshCalculation={calculation}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AMOUNTS TAB: only other cost, same header/alignment */}
        {viewMode === "details" && activeTab === "amounts" && selectedPlan && (
          <div
            className="relative p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (amountsRefs.current[searchTerm] = el)}
          >
            {/* shared project header + close */}
            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
              style={{
                backgroundColor: "#e9f6fb",
                color: "#17414d",
                borderLeftColor: "#17414d",
                borderRadius: "8px", // Ensures consistent rounding on all corners
              }}
            >
              {/* Close Button Integrated into the New Styled Header */}
              {/* <button
                className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                onClick={handleCloseTab}
                title="Close project details"
                style={{ color: "#17414d" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button> */}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
                <span>
                  <span className="font-semibold blue-text">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold blue-text">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold blue-text">
                    Period of Performance:{" "}
                  </span>
                  Start Date:{" "}
                  {selectedPlan.projStartDt
                    ? formatDate(selectedPlan.projStartDt)
                    : "N/A"}{" "}
                  | End Date:{" "}
                  {selectedPlan.projEndDt
                    ? formatDate(selectedPlan.projEndDt)
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="w-full mx-auto">
              <div className="border border-gray-200 rounded-md shadow-sm bg-white">
                <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm blue-text">
                    Other Cost
                  </span>
                </div>
                {/* no outer overflow, let grid scroll inside */}
                <div className="px-2 pb-2">
                  <ProjectAmountsTable
                    initialData={selectedPlan}
                    startDate={selectedPlan.projStartDt}
                    endDate={selectedPlan.projEndDt}
                    planType={selectedPlan.plType}
                    fiscalYear={fiscalYear}
                    refreshKey={refreshKey}
                    onSaveSuccess={() => setRefreshKey((prev) => prev + 1)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Analysis Tab */}
        {viewMode === "details" &&
          activeTab === "revenueAnalysis" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (revenueRefs.current[searchTerm] = el)}
            >
              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
                style={{
                  backgroundColor: "#e9f6fb",
                  color: "#17414d",
                  borderLeftColor: "#17414d",
                  borderRadius: "8px", // Ensures consistent rounding on all corners
                }}
              >
                {/* Close Button Integrated into the New Styled Header */}
                {/* <button
                  className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                  onClick={handleCloseTab}
                  title="Close project details"
                  style={{ color: "#17414d" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
                  <span>
                    <span className="font-semibold blue-text">
                      Project ID:{" "}
                    </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold blue-text">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <RevenueAnalysisTable
                planId={selectedPlan.plId}
                status={selectedPlan.status}
                fiscalYear={fiscalYear}
              />
            </div>
          )}

        {/* Analysis By Period Tab */}
        {activeTab === "analysisByPeriod" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative   p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (analysisRefs.current[searchTerm] = el)}
            >
              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
                style={{
                  backgroundColor: "#e9f6fb",
                  color: "#17414d",
                  borderLeftColor: "#17414d",
                  borderRadius: "8px", // Ensures consistent rounding on all corners
                }}
              >
                {/* Close Button Integrated into the New Styled Header */}
                {/* <button
                  className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                  onClick={handleCloseTab}
                  title="Close project details"
                  style={{ color: "#17414d" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold blue-text">
                      Project ID:{" "}
                    </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold ">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <AnalysisByPeriodContent
                onCancel={handleCloseTab}
                planID={selectedPlan.plId}
                templateId={selectedPlan.templateId || 1}
                type={selectedPlan.plType || "TARGET"}
                initialApiData={analysisApiData}
                isLoading={isAnalysisLoading}
                error={analysisError}
                fiscalYear={fiscalYear}
              />
            </div>
          )}

        {/* {activeTab === "plc" && selectedPlan && (
              <div
                className="relative border p-2 sm:p-4 bg-gray-50 rounded shadow min-h-[150px] scroll-mt-16"
                ref={(el) => (hoursRefs.current[searchTerm] = el)}
              >
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl z-10"
                  onClick={handleCloseTab}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <PLCComponent
                  selectedProjectId={selectedPlan.projId}
                  selectedPlan={selectedPlan}
                  showPLC={activeTab === "plc"}
                />
              </div>
            )} */}

        {/* PLC Tab */}
        {activeTab === "plc" && selectedPlan && currentUserRole === "admin" && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (hoursRefs.current[searchTerm] = el)}
          >
            {/* <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl z-10"
                  onClick={handleCloseTab}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
              style={{
                backgroundColor: "#e9f6fb",
                color: "#17414d",
                borderLeftColor: "#17414d",
                borderRadius: "8px", // Ensures consistent rounding on all corners
              }}
            >
              {/* Close Button Integrated into the New Styled Header */}
              {/* <button
                className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                onClick={handleCloseTab}
                title="Close project details"
                style={{ color: "#17414d" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button> */}
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                <span>
                  <span className="font-semibold">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Period of Performance: </span>
                  Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"} |
                  End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                </span>
              </div>
            </div>
            <PLCComponent
              selectedProjectId={selectedPlan.projId}
              selectedPlan={selectedPlan}
              showPLC={activeTab === "plc"}
            />
          </div>
        )}

        {/* RevenueSetup Tab */}
        {activeTab === "revenueSetup" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line  min-h-[150px] scroll-mt-16"
              ref={(el) => (revenueSetupRefs.current[searchTerm] = el)}
            >
              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
                style={{
                  backgroundColor: "#e9f6fb",
                  color: "#17414d",
                  borderLeftColor: "#17414d",
                  borderRadius: "8px", // Ensures consistent rounding on all corners
                }}
              >
                {/* Close Button Integrated into the New Styled Header */}
                {/* <button
                  className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                  onClick={handleCloseTab}
                  title="Close project details"
                  style={{ color: "#17414d" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold">Project ID: </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <RevenueSetupComponent
                selectedPlan={{
                  ...selectedPlan,
                  startDate: selectedPlan.startDate,
                  endDate: selectedPlan.endDate,
                  orgId: filteredProjects[0]?.orgId,
                }}
                revenueAccount={revenueAccount}
              />
            </div>
          )}

        {/* Revenue Ceiling Tab */}
        {activeTab === "revenueCeiling" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (revenueCeilingRefs.current[searchTerm] = el)}
            >
              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
                style={{
                  backgroundColor: "#e9f6fb",
                  color: "#17414d",
                  borderLeftColor: "#17414d",
                  borderRadius: "8px", // Ensures consistent rounding on all corners
                }}
              >
                {/* Close Button Integrated into the New Styled Header */}
                {/* <button
                  className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                  onClick={handleCloseTab}
                  title="Close project details"
                  style={{ color: "#17414d" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold">Project ID: </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <RevenueCeilingComponent
                selectedPlan={{
                  ...selectedPlan,
                  startDate: selectedPlan.startDate,
                  endDate: selectedPlan.endDate,
                  orgId: filteredProjects[0]?.orgId,
                }}
                revenueAccount={revenueAccount}
              />
            </div>
          )}

        {/* Funding Tab */}
        {activeTab === "funding" &&
          selectedPlan &&
          currentUserRole === "admin" && (
            <div
              className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
              ref={(el) => (fundingRefs.current[searchTerm] = el)}
            >
              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
                style={{
                  backgroundColor: "#e9f6fb",
                  color: "#17414d",
                  borderLeftColor: "#17414d",
                  borderRadius: "8px", // Ensures consistent rounding on all corners
                }}
              >
                {/* Close Button Integrated into the New Styled Header */}
                {/* <button
                  className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                  onClick={handleCloseTab}
                  title="Close project details"
                  style={{ color: "#17414d" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button> */}
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                  <span>
                    <span className="font-semibold">Project ID: </span>
                    {selectedPlan.projId}
                  </span>
                  <span>
                    <span className="font-semibold">Type: </span>
                    {selectedPlan.plType || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Version: </span>
                    {selectedPlan.version || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">Status: </span>
                    {selectedPlan.status || "N/A"}
                  </span>
                  <span>
                    <span className="font-semibold">
                      Period of Performance:{" "}
                    </span>
                    Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"}{" "}
                    | End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                  </span>
                </div>
              </div>
              <FundingComponent
                selectedProjectId={selectedPlan.projId}
                selectedPlan={selectedPlan.plId}
              />
            </div>
          )}

        {/* Warning Tab */}
        {activeTab === "warning" && selectedPlan && (
          <div
            className="relative  p-2 sm:p-4 border-line min-h-[150px] scroll-mt-16"
            ref={(el) => (warningRefs.current[searchTerm] = el)}
          >
            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 relative"
              style={{
                backgroundColor: "#e9f6fb",
                color: "#17414d",
                borderLeftColor: "#17414d",
                borderRadius: "8px", // Ensures consistent rounding on all corners
              }}
            >
              {/* Close Button Integrated into the New Styled Header */}
              {/* <button
                className="absolute top-1/2 -translate-y-1/2 right-3 hover:text-red-500 transition-colors z-20 cursor-pointer"
                onClick={handleCloseTab}
                title="Close project details"
                style={{ color: "#17414d" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button> */}
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs blue-text">
                <span>
                  <span className="font-semibold">Project ID: </span>
                  {selectedPlan.projId}
                </span>
                <span>
                  <span className="font-semibold">Type: </span>
                  {selectedPlan.plType || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Version: </span>
                  {selectedPlan.version || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Status: </span>
                  {selectedPlan.status || "N/A"}
                </span>
                <span>
                  <span className="font-semibold">Period of Performance: </span>
                  Start Date: {formatDate(selectedPlan.projStartDt) || "N/A"} |
                  End Date: {formatDate(selectedPlan.projEndDt) || "N/A"}
                </span>
              </div>
            </div>
            <Warning
              planId={selectedPlan.plId}
              projectId={selectedPlan.projId}
              templateId={selectedPlan.templateId}
              planType={selectedPlan.plType}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectBudgetStatus;
