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
  const [hoursColumnTotalsFromHours, setHoursColumnTotalsFromHours] = useState({});
const [otherColumnTotalsFromAmounts, setOtherColumnTotalsFromAmounts] = useState({});


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

  const EXTERNAL_API_BASE_URL = backendUrl;
  const CALCULATE_COST_ENDPOINT = "/Forecast/CalculateCost";

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userName, setUserName] = useState("User");
  const [tabVisibility, setTabVisibility] = useState({});

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



const safeFormatDate = (value) => {
  if (!value) return "N/A";
  
  // Handle YYYY-MM-DD format
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }
  
  // Handle other date formats
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
        setAnalysisError(
          `Failed to load Analysis By Period data. `
        );
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

  const handleSearch = async () => {
    const term = searchTerm.trim();

    setSearched(true);
    setErrorMessage("");

    // if (!term) {
    //   setFilteredProjects([]);
    //   setSelectedPlan(null);
    //   setRevenueAccount("");
    //   setPrefixes(new Set());
    //   return;
    // }

    setLoading(true);

    try {
      const response = await axios.get(
        `${backendUrl}/Project/GetAllProjectByProjId/${term}`
      );
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
          `${backendUrl}/Project/GetProjectPlans/${term}`
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
        toast.error("Failed to fetch project or plan data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    // handleSearch(e.target.value);
    setErrorMessage("");
    setSearched(false);
    setFilteredProjects([]);
    setSelectedPlan(null);
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

const handlePlanSelect = (plan) => {
    if (!plan) {
      setSelectedPlan(null);
      localStorage.removeItem("selectedPlan");
      setActiveTab(null);
      return;
    }

    // --- RUNTIME SYNC FIX ---
    // We check if the plan identity OR any of the status fields have changed
    const isDifferentPlan = !selectedPlan || selectedPlan.plId !== plan.plId;
    
    const hasStatusChanged = selectedPlan && (
      selectedPlan.status !== plan.status ||
      selectedPlan.isCompleted !== plan.isCompleted ||
      selectedPlan.isApproved !== plan.isApproved ||
      selectedPlan.finalVersion !== plan.finalVersion ||
      selectedPlan.projStartDt !== plan.projStartDt ||
      selectedPlan.projEndDt !== plan.projEndDt
    );

    if (isDifferentPlan || hasStatusChanged) {
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
      setSelectedPlan(plan); // This now carries the fresh status
      localStorage.setItem("selectedPlan", JSON.stringify(plan));
      
      // Optional: Clear analysis data to force reload with new status context
      setAnalysisApiData([]); 
    }
  };

// inside ProjectBudgetStatus
// inside ProjectBudgetStatus

const handlePlanCreated = (plan) => {
  handlePlanSelect(plan);

  // always reflect the project id in the search box / filter
  if (plan.projId) {
    setSearchTerm(plan.projId);  // shows 20001.00.000200.0000 in the input
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
  setViewMode("plans");   // back to plan table
  setShowTabs(false);     // hide tabs row
};

const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };



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

  return (
    <div className="p-2 sm:p-4  space-y-6 text-sm sm:text-base text-gray-800 font-inter mt-7 ">

      {viewMode === "plans" && (
        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="font-semibold text-xs sm:text-sm whitespace-nowrap">Project ID:</label>
              <input
                type="text"
                className="border border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 bg-white shadow-inner"
                placeholder="Search Project ID..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                ref={inputRef}
                autoComplete="off"
              />
            </div>
            <button
              onClick={handleSearch}
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
      


      

        

        {viewMode === "plans" && selectedPlan && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-1">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="font-semibold blue-text">Project ID:</span>{" "}
                <span className="text-gray-700">{selectedPlan.projId}</span>
              </div>
             
<div>
  <span className="font-semibold blue-text">Period of Performance:</span>{" "}
   Start Date:{" "}
  <span className="text-gray-700">
    {selectedPlan.projStartDt || selectedPlan.startDate 
      ? safeFormatDate(selectedPlan.projStartDt || selectedPlan.startDate) 
      : "N/A"
    } 
    </span>
    {" | "}
  End Date:{" "}
    <span className="text-gray-700">
    {selectedPlan.projEndDt || selectedPlan.endDate
      ? safeFormatDate(selectedPlan.projEndDt || selectedPlan.endDate)
      : "N/A"
    }
   </span>
</div>

              {/* </div> */}
              {/* <div>
                    <span className="font-semibold text-green-800">
                      Organization:
                    </span>{" "}
                    <span className="text-gray-700">{selectedPlan.orgId}</span>
                  </div> */}
              <div>
                <span className="font-semibold blue-text">Funded Fee:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.fundedFee).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Funded Cost:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.fundedCost).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div>
                <span className="font-semibold blue-text">Funded Rev:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.fundedRev).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
               <div>
                <span className="font-semibold blue-text">Revenue:</span>{" "}
                <span className="text-gray-700">
                  {Number(selectedPlan.revenue || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}
                </span>
              </div>
               <div>
                <span className="font-semibold blue-text">Backlog:</span>{" "}
                <span className="text-gray-700">
                   {Number(
      (selectedPlan.revenue || 0) - (selectedPlan.fundedCost || 0)
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


{viewMode === "details" && showTabs && (
  // <div className="flex flex-row gap-2 text-blue-600 text-xs sm:text-sm w-full flex-wrap mt-4 ">
   <div className=" px-4 py-2 flex gap-2 overflow-x-auto relative w-full border-none border-gray-200 mt-6">
    {/* <button
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
      </button> */}
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
    {/* <span
      // className={`btn ${activeTab === "amounts" ? "btn-active" : "btn-inactive"}`}
      className={`px-3 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === "amounts"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
      onClick={() => setActiveTab("amounts")}
    >
      Other Cost
    </span> */}

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
      // className={`btn ${activeTab === "warning" ? "btn-active" : "btn-inactive"}`}
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
)}


          
          <div className="flex-1 min-w-0 overflow-hidden">
            {viewMode === "plans" && (
           <ProjectPlanTable
  projectId={searchTerm.trim()}
  searched={searched}
  onPlanSelect={handlePlanSelect}
  selectedPlan={selectedPlan}
  fiscalYear={fiscalYear}
  setFiscalYear={setFiscalYear}
  fiscalYearOptions={fiscalYearOptions}
  filteredProjects={filteredProjects}
  onPlanCreated={handlePlanCreated}
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
  setActiveTab("hours");   // open Hours as default
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
  setActiveTab("analysisByPeriod");   // open Hours as default
}}

/>
 )}


         
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" &&
          currentUserRole === "admin" && (
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
  </button>

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
      Start Date: {selectedPlan.projStartDt ? formatDate(selectedPlan.projStartDt) : "N/A"} | End Date: {selectedPlan.projEndDt ? formatDate(selectedPlan.projEndDt) : "N/A"}
    </span>
  </div>
</div>

    {/* centered cards, outer div has NO overflow */}
    <div className="w-full mx-auto grid gap-4 md:grid-cols-1">
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
            status={selectedPlan.status}
            planType={selectedPlan.plType}
            closedPeriod={selectedPlan.closedPeriod}
            startDate={selectedPlan.projStartDt}
            endDate={selectedPlan.projEndDt}
            fiscalYear={fiscalYear}
            onSaveSuccess={() => {}}
            //  onColumnTotalsChange={setHoursColumnTotalsFromHours}
            onColumnTotalsChange={setHoursColumnTotalsFromHours}  // NEW
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
      </button>

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
          <span className="font-semibold blue-text">Period of Performance: </span>
          Start Date:{" "}
          {selectedPlan.projStartDt
            ? formatDate(selectedPlan.projStartDt)
            : "N/A"}{" "}
          | End Date:{" "}
          {selectedPlan.projEndDt ? formatDate(selectedPlan.projEndDt) : "N/A"}
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
        {viewMode === "details" && activeTab === "revenueAnalysis" &&
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
                </button>
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
                </button>
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
              </button>
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
                </button>
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
                </button>
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
                </button>
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
                selectedPlan={selectedPlan}
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
    borderRadius: "8px" // Ensures consistent rounding on all corners
  }}
>
  {/* Close Button Integrated into the New Styled Header */}
  <button
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
              </button>
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

// import React, { useState, useRef, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import ProjectHoursDetails from "./ProjectHoursDetails";
// import ProjectPlanTable from "./ProjectPlanTable";
// import RevenueAnalysisTable from "./RevenueAnalysisTable";
// import AnalysisByPeriodContent from "./AnalysisByPeriodContent";
// import ProjectAmountsTable from "./ProjectAmountsTable";
// import PLCComponent from "./PLCComponent";
// import FundingComponent from "./FundingComponent";
// import RevenueSetupComponent from "./RevenueSetupComponent";
// import RevenueCeilingComponent from "./RevenueCeilingComponent";
// import ProjectPoolCosts from "./ProjectPoolCosts";
// import { formatDate } from "./utils";
// import FinancialDashboard from "./FinancialDashboard";
// import Warning from "./Warning";
// import { backendUrl } from "./config";

// const ProjectBudgetStatus = () => {
//   const [projects, setProjects] = useState([]);
//   const [prefixes, setPrefixes] = useState(new Set());
//   const [filteredProjects, setFilteredProjects] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [revenueAccount, setRevenueAccount] = useState("");
//   const [activeTab, setActiveTab] = useState(null);
//   const [viewMode, setViewMode] = useState("plans");
//   const [showTabs, setShowTabs] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [searched, setSearched] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [forecastData, setForecastData] = useState([]);
//   const [isForecastLoading, setIsForecastLoading] = useState(false);
//   const [fiscalYear, setFiscalYear] = useState("All");
//   const [fiscalYearOptions, setFiscalYearOptions] = useState([]);
//   const [analysisApiData, setAnalysisApiData] = useState([]);
//   const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
//   const [analysisError, setAnalysisError] = useState(null);
//   const [refreshKey, setRefreshKey] = useState(0);

//   const hoursRefs = useRef({});
//   const amountsRefs = useRef({});
//   const revenueRefs = useRef({});
//   const analysisRefs = useRef({});
//   const revenueSetupRefs = useRef({});
//   const revenueCeilingRefs = useRef({});
//   const fundingRefs = useRef({});
//   const inputRef = useRef(null);
//   const dashboardRefs = useRef({});
//   const warningRefs = useRef({});

//   const EXTERNAL_API_BASE_URL = backendUrl;
//   const CALCULATE_COST_ENDPOINT = "/Forecast/CalculateCost";

//   const [currentUserRole, setCurrentUserRole] = useState(null);
//   const [userName, setUserName] = useState("User");

//   function capitalizeWords(str) {
//     return str.replace(/\b\w/g, (char) => char.toUpperCase());
//   }

//   const safeFormatDate = (value) => {
//     if (!value) return "N/A";
//     if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//       const [year, month, day] = value.split('-');
//       return `${month}/${day}/${year}`;
//     }
//     try {
//       const date = new Date(value);
//       if (isNaN(date.getTime())) return "N/A";
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit'
//       });
//     } catch (e) {
//       return "N/A";
//     }
//   };

//   useEffect(() => {
//     const userString = localStorage.getItem("currentUser");
//     if (userString) {
//       try {
//         const userObj = JSON.parse(userString);
//         setUserName(userObj.name ? capitalizeWords(userObj.name) : "User");
//         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
//       } catch {
//         setCurrentUserRole(null);
//         setUserName("User");
//       }
//     }
//   }, []);

//   const handleSearch = async () => {
//     const term = searchTerm.trim();
//     setSearched(true);
//     setErrorMessage("");
//     setLoading(true);
//     try {
//       const response = await axios.get(`${backendUrl}/Project/GetAllProjectByProjId/${term}`);
//       const data = Array.isArray(response.data) ? response.data[0] : response.data;
//       const project = {
//         projId: data.projectId || term,
//         projName: data.name || "",
//         projTypeDc: data.description || "",
//         orgId: data.orgId || "",
//         startDate: data.startDate || "",
//         endDate: data.endDate || "",
//         fundedCost: data.proj_f_cst_amt || "",
//         fundedFee: data.proj_f_fee_amt || "",
//         fundedRev: data.proj_f_tot_amt || "",
//         revenue: data.revenue || "",
//       };
//       setFilteredProjects([project]);
//       setRevenueAccount(data.revenueAccount || "");
//     } catch (error) {
//       try {
//         const planResponse = await axios.get(`${backendUrl}/Project/GetProjectPlans/${term}`);
//         const planData = Array.isArray(planResponse.data) ? planResponse.data[0] : planResponse.data;
//         if (planData && planData.projId) {
//           const project = {
//             projId: planData.projId || term,
//             projName: planData.name || "",
//             projTypeDc: planData.description || "",
//             orgId: planData.orgId || "",
//             startDate: planData.startDate || "",
//             endDate: planData.endDate || "",
//             fundedCost: planData.proj_f_cst_amt || "",
//             fundedFee: planData.proj_f_fee_amt || "",
//             fundedRev: planData.proj_f_tot_amt || "",
//             revenue: planData.revenue || "",
//           };
//           setFilteredProjects([project]);
//           setRevenueAccount(planData.revenueAccount || "");
//         }
//       } catch (planError) {
//         setErrorMessage("No project found.");
//         setFilteredProjects([]);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     setSearchTerm(e.target.value);
//     setSearched(false);
//   };

//   const handleKeyPress = (e) => { if (e.key === "Enter") handleSearch(); };

//   const handlePlanSelect = (plan) => {
//     if (!plan) {
//       setSelectedPlan(null);
//       setActiveTab(null);
//       return;
//     }
//     const isPlanIdentityChanged = !selectedPlan || selectedPlan.plId !== plan.plId;
//     if (isPlanIdentityChanged) {
//       setSelectedPlan(plan);
//     }
//   };

//   const handlePlanCreated = (plan) => {
//     handlePlanSelect(plan);
//     if (plan.projId) setSearchTerm(plan.projId);
//   };

//   const handleTabClick = (tabName) => {
//     if (tabName !== "dashboard" && !selectedPlan) {
//       toast.info("Please select a plan first.");
//       return;
//     }
//     if (activeTab !== tabName) setActiveTab(tabName);
//   };

//   const handleCloseTab = () => {
//     setActiveTab(null);
//     setViewMode("plans");
//     setShowTabs(false);
//   };

//   const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64 font-inter">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-1 sm:p-2 space-y-4 text-sm sm:text-base text-gray-800 font-inter w-full overflow-y-auto">
      
//       {/* 1. SEARCH SECTION */}
//       {viewMode === "plans" && (
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-2">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative w-full sm:w-auto">
//             <label className="font-semibold text-xs sm:text-sm whitespace-nowrap">Project ID:</label>
//             <div className="relative w-full sm:w-64">
//               <input
//                 type="text"
//                 className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white shadow-sm"
//                 value={searchTerm}
//                 onChange={handleInputChange}
//                 onKeyDown={handleKeyPress}
//                 ref={inputRef}
//                 autoComplete="off"
//               />
//             </div>
//             <button
//               onClick={handleSearch}
//               className="bg-blue-600 text-white px-4 py-1 rounded cursor-pointer text-xs sm:text-sm font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
//             >
//               Search
//             </button>
//           </div>
//         </div>
//       )}

//       {/* 2. HEADER INFO BOX */}
//       <div className="space-y-4 bg-white rounded-lg pt-2 mt-4">
//         {viewMode === "plans" && selectedPlan && (
//           <div className="mx-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] bg-[#e9f6fb] text-[#17414d] border-[#17414d] shadow-sm">
//             <div><span className="font-bold">Project ID:</span> {selectedPlan.projId}</div>
//             <div>
//               <span className="font-bold">Period of Performance:</span> Start Date: {selectedPlan.projStartDt ? formatDate(selectedPlan.projStartDt) : "N/A"} | End Date: {selectedPlan.projEndDt ? formatDate(selectedPlan.projEndDt) : "N/A"}
//             </div>
//             <div><span className="font-bold">Funded Fee:</span> {Number(selectedPlan.fundedFee || 0).toLocaleString()}</div>
//             <div><span className="font-bold">Funded Cost:</span> {Number(selectedPlan.fundedCost || 0).toLocaleString()}</div>
//             <div><span className="font-bold">Funded Rev:</span> {Number(selectedPlan.fundedRev || 0).toLocaleString()}</div>
//             <div><span className="font-bold">Revenue:</span> {Number(selectedPlan.revenue || 0).toLocaleString()}</div>
//             <div><span className="font-bold">Backlog:</span> {Number((selectedPlan.revenue || 0) - (selectedPlan.fundedCost || 0)).toLocaleString()}</div>
//           </div>
//         )}

//         {/* 3. TABS NAVIGATION */}
//         {viewMode === "details" && showTabs && (
//           <div className="w-full px-2 mt-2">
//             <div className="flex flex-wrap items-center gap-2 p-1 bg-transparent rounded-none relative">
//               <span onClick={() => setActiveTab("hours")} 
//                 className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "hours" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                 Hours
//               </span>
//               {currentUserRole === "admin" && (
//                 <>
//                   <span onClick={() => handleTabClick("analysisByPeriod")}
//                     className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "analysisByPeriod" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                     Monthly Forecast
//                   </span>
//                   <span onClick={() => handleTabClick("plc")}
//                     className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "plc" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                     Labor Categories
//                   </span>
//                   <span onClick={() => handleTabClick("revenueSetup")}
//                     className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "revenueSetup" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                     Revenue Definition
//                   </span>
//                   <span onClick={() => handleTabClick("revenueCeiling")}
//                     className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "revenueCeiling" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                     Adjustment
//                   </span>
//                   <span onClick={() => handleTabClick("funding")}
//                     className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "funding" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                     Funding
//                   </span>
//                 </>
//               )}
//               <span onClick={() => handleTabClick("warning")}
//                 className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeTab === "warning" ? "text-white bg-[#113d46]" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"}`}>
//                 Warning
//               </span>
              
//               <button className="ml-auto p-2 blue-text hover:text-red-500 cursor-pointer" onClick={handleCloseTab}>
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* 4. MAIN DATA AREA - Ensuring Scrolling is enabled */}
//         <div className="w-full min-w-0 overflow-visible mt-6">
//           {viewMode === "plans" ? (
//             <div className="mt-4 overflow-auto max-h-screen">
//               <ProjectPlanTable
//                 projectId={searchTerm.trim()}
//                 searched={searched}
//                 onPlanSelect={handlePlanSelect}
//                 selectedPlan={selectedPlan}
//                 fiscalYear={fiscalYear}
//                 setFiscalYear={setFiscalYear}
//                 fiscalYearOptions={fiscalYearOptions}
//                 filteredProjects={filteredProjects}
//                 onPlanCreated={handlePlanCreated}
//                 onOpenDetails={() => {
//                   if (!selectedPlan) return;
//                   setViewMode("details");
//                   setShowTabs(true);
//                   setActiveTab("hours");
//                 }}
//               />
//             </div>
//           ) : (
//             <div className="w-full px-2 pb-10 mt-4 overflow-y-visible">
//               <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px] mb-4 bg-[#e9f6fb] text-[#17414d] border-[#17414d]">
//                 <span className="font-bold">Project ID: {selectedPlan.projId}</span>
//                 <span><span className="font-bold">Type:</span> {selectedPlan.plType || "N/A"}</span>
//                 <span><span className="font-bold">Version:</span> {selectedPlan.version || "N/A"}</span>
//                 <span><span className="font-bold">Status:</span> {selectedPlan.status || "N/A"}</span>
//                 <span><span className="font-bold">Period of Performance:</span> Start Date: {selectedPlan.projStartDt ? formatDate(selectedPlan.projStartDt) : "N/A"} | End Date: {selectedPlan.projEndDt ? formatDate(selectedPlan.projEndDt) : "N/A"}</span>
//               </div>

//               {activeTab === "hours" && selectedPlan && (
//                 <div className="space-y-4">
//                   <div className="border border-gray-200 rounded shadow-sm bg-white overflow-auto max-h-[600px]">
//                     <ProjectHoursDetails planId={selectedPlan.plId} projectId={selectedPlan.projId} status={selectedPlan.status} planType={selectedPlan.plType} closedPeriod={selectedPlan.closedPeriod} startDate={selectedPlan.projStartDt} endDate={selectedPlan.projEndDt} fiscalYear={fiscalYear} onSaveSuccess={() => {}} />
//                   </div>
//                   <div className="border border-gray-200 rounded shadow-sm bg-white overflow-auto max-h-[600px]">
//                     <ProjectAmountsTable initialData={selectedPlan} startDate={selectedPlan.projStartDt} endDate={selectedPlan.projEndDt} planType={selectedPlan.plType} fiscalYear={fiscalYear} refreshKey={refreshKey} onSaveSuccess={() => setRefreshKey(k => k + 1)} />
//                   </div>
//                   <div className="border border-gray-200 rounded shadow-sm bg-white overflow-auto max-h-[600px]">
//                     <ProjectPoolCosts planId={selectedPlan.plId} startDate={selectedPlan.projStartDt} endDate={selectedPlan.projEndDt} fiscalYear={fiscalYear} />
//                   </div>
//                 </div>
//               )}
//               {activeTab === "analysisByPeriod" && <div className="overflow-auto"><AnalysisByPeriodContent planID={selectedPlan.plId} templateId={selectedPlan.templateId} type={selectedPlan.plType} initialApiData={analysisApiData} fiscalYear={fiscalYear} /></div>}
//               {activeTab === "plc" && <div className="overflow-auto"><PLCComponent selectedProjectId={selectedPlan.projId} selectedPlan={selectedPlan} showPLC={true} /></div>}
//               {activeTab === "revenueSetup" && <div className="overflow-auto"><RevenueSetupComponent selectedPlan={selectedPlan} revenueAccount={revenueAccount} /></div>}
//               {activeTab === "revenueCeiling" && <div className="overflow-auto"><RevenueCeilingComponent selectedPlan={selectedPlan} revenueAccount={revenueAccount} /></div>}
//               {activeTab === "funding" && <div className="overflow-auto"><FundingComponent selectedProjectId={selectedPlan.projId} selectedPlan={selectedPlan} /></div>}
//               {activeTab === "warning" && <div className="overflow-auto"><Warning planId={selectedPlan.plId} projectId={selectedPlan.projId} templateId={selectedPlan.templateId} planType={selectedPlan.plType} /></div>}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProjectBudgetStatus;