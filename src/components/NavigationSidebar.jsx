// import React, { useState, useEffect } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Menu, X, ChevronDown, ChevronRight, Plus, LogOut } from "lucide-react";
// import TopBar from "./TopBar";
// import.meta.env.VITE_APP_VERSION;

// const NavigationSidebar = () => {
//   const { pathname } = useLocation();
//   const navigate = useNavigate();

//   const [generalMenuOpen, setGeneralMenuOpen] = useState(
//     pathname.includes("/dashboard/project-budget-status") ||
//       pathname.includes("/dashboard/new-business") ||
//       pathname.includes("/dashboard/pool-rate-tabs") ||
//       pathname.includes("/dashboard/pool-configuration") ||
//       pathname.includes("/dashboard/template-pool-mapping") ||
//       pathname.includes("/dashboard/template") ||
//       pathname.includes("/dashboard/ceiling-configuration") ||
//       pathname.includes("/dashboard/global-configuration") ||
//       pathname.includes("/dashboard/prospective-id-setup") ||
//       pathname.includes("/dashboard/display-settings") ||
//       pathname.includes("/dashboard/annual-holidays") ||
//       pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
//       pathname.includes("/dashboard/analog-rate")   || pathname.includes("/dashboard/project-report") || pathname.includes("/dashboard/role-rights") || pathname.includes("/dashboard/mass-utility")
//   );
//   const [planningOpen, setPlanningOpen] = useState(
//     pathname.includes("/dashboard/project-budget-status") ||
//       pathname.includes("/dashboard/new-business") || pathname.includes("/dashboard/project-report") || pathname.includes("/dashboard/mass-utility")
//   );
//   const [configurationOpen, setConfigurationOpen] = useState(
//     pathname.includes("/dashboard/pool-rate-tabs") ||
//       pathname.includes("/dashboard/pool-configuration") ||
//       pathname.includes("/dashboard/template-pool-mapping") ||
//       pathname.includes("/dashboard/template") ||
//       pathname.includes("/dashboard/ceiling-configuration") ||
//       pathname.includes("/dashboard/global-configuration") ||
//       pathname.includes("/dashboard/prospective-id-setup") ||
//       pathname.includes("/dashboard/display-settings") ||
//       pathname.includes("/dashboard/annual-holidays") ||
//       pathname.includes("/dashboard/maintain-fiscal-year-periods")
//       ||
//       pathname.includes("/dashboard/analog-rate")  || pathname.includes("/dashboard/role-rights")
//   );
//   const [poolMappingOpen, setPoolMappingOpen] = useState(
//     pathname.includes("/dashboard/pool-configuration") ||
//       pathname.includes("/dashboard/template-pool-mapping")
//   );
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [selectedPage, setSelectedPage] = useState(pathname);

//   const [currentUserRole, setCurrentUserRole] = useState(null);
//   const [userName, setUserName] = useState("User");

//   useEffect(() => {
//     const userString = localStorage.getItem("currentUser");
//     if (userString) {
//       try {
//         const userObj = JSON.parse(userString);
//         setUserName(userObj.name || "User");
//         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
//       } catch {
//         setCurrentUserRole(null);
//         setUserName("User");
//       }
//     }
//   }, []);

//   const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";
//   // useEffect(() => {
//   //   setSelectedPage(pathname);
//   //   setGeneralMenuOpen(
//   //     pathname.includes("/dashboard/project-budget-status") ||
//   //       pathname.includes("/dashboard/new-business") ||
//   //       pathname.includes("/dashboard/pool-rate") ||
//   //       pathname.includes("/dashboard/pool-configuration") ||
//   //       pathname.includes("/dashboard/template-pool-mapping") ||
//   //       pathname.includes("/dashboard/template") ||
//   //       pathname.includes("/dashboard/ceiling-configuration") ||
//   //       pathname.includes("/dashboard/global-configuration") ||
//   //       pathname.includes("/dashboard/prospective-id-setup") ||
//   //       pathname.includes("/dashboard/display-settings") ||
//   //       pathname.includes("/dashboard/annual-holidays") ||
//   //       pathname.includes("/dashboard/maintain-fiscal-year-periods")
//   //   );
//   //   setPlanningOpen(
//   //     pathname.includes("/dashboard/project-budget-status") ||
//   //       pathname.includes("/dashboard/new-business")
//   //   );
//   //   setConfigurationOpen(
//   //     pathname.includes("/dashboard/pool-rate") ||
//   //       pathname.includes("/dashboard/pool-configuration") ||
//   //       pathname.includes("/dashboard/template-pool-mapping") ||
//   //       pathname.includes("/dashboard/template") ||
//   //       pathname.includes("/dashboard/ceiling-configuration") ||
//   //       pathname.includes("/dashboard/global-configuration") ||
//   //       pathname.includes("/dashboard/prospective-id-setup") ||
//   //       pathname.includes("/dashboard/display-settings") ||
//   //       pathname.includes("/dashboard/annual-holidays") ||
//   //       pathname.includes("/dashboard/maintain-fiscal-year-periods")
//   //   );
//   //   setPoolMappingOpen(
//   //     pathname.includes("/dashboard/pool-configuration") ||
//   //       pathname.includes("/dashboard/template-pool-mapping")
//   //   );
//   // }, [pathname]);

//   // const handleLinkClick = (pagePath) => {
//   //   if (selectedPage === pagePath) {
//   //     setSelectedPage(null);
//   //     navigate("/dashboard");
//   //   } else {
//   //     setSelectedPage(pagePath);
//   //     navigate(pagePath);
//   //   }
//   //   if (isSidebarOpen) {
//   //     setIsSidebarOpen(false);
//   //   }
//   // };

//   useEffect(() => {
//     setSelectedPage(pathname);

//     if (currentUserRole === "admin") {
//       setGeneralMenuOpen(
//         pathname.includes("/dashboard/project-budget-status") ||
//           pathname.includes("/dashboard/new-business") ||
//           pathname.includes("/dashboard/pool-rate-tabs") ||
//           pathname.includes("/dashboard/pool-configuration") ||
//           pathname.includes("/dashboard/template-pool-mapping") ||
//           pathname.includes("/dashboard/template") ||
//           pathname.includes("/dashboard/ceiling-configuration") ||
//           pathname.includes("/dashboard/global-configuration") ||
//           pathname.includes("/dashboard/prospective-id-setup") ||
//           pathname.includes("/dashboard/display-settings") ||
//           pathname.includes("/dashboard/annual-holidays") ||
//           pathname.includes("/dashboard/maintain-fiscal-year-periods") || pathname.includes("/dashboard/analog-rate")   || pathname.includes("/dashboard/project-report") || pathname.includes("/dashboard/role-rights") || pathname.includes("/dashboard/mass-utility")
//       );
//       setPlanningOpen(
//         pathname.includes("/dashboard/project-budget-status") ||
//           pathname.includes("/dashboard/new-business")  || pathname.includes("/dashboard/project-report") || pathname.includes("/dashboard/mass-utility")
//       );
//       setConfigurationOpen(
//         pathname.includes("/dashboard/pool-rate-tabs") ||
//           pathname.includes("/dashboard/pool-configuration") ||
//           pathname.includes("/dashboard/template-pool-mapping") ||
//           pathname.includes("/dashboard/template") ||
//           pathname.includes("/dashboard/ceiling-configuration") ||
//           pathname.includes("/dashboard/global-configuration") ||
//           pathname.includes("/dashboard/prospective-id-setup") ||
//           pathname.includes("/dashboard/display-settings") ||
//           pathname.includes("/dashboard/annual-holidays") ||
//           pathname.includes("/dashboard/maintain-fiscal-year-periods") || pathname.includes("/dashboard/analog-rate")   || pathname.includes("/dashboard/role-rights")

//       );
//       setPoolMappingOpen(
//         pathname.includes("/dashboard/pool-configuration") ||
//           pathname.includes("/dashboard/template-pool-mapping")
//       );
//     } else if (currentUserRole === "user") {
//       // For user, open only general menu and planning if on project budget status page, else close all
//       const isProjectBudget = pathname.includes(
//         "/dashboard/project-budget-status"
//       );
//       setGeneralMenuOpen(isProjectBudget);
//       setPlanningOpen(isProjectBudget);
//       setConfigurationOpen(false);
//       setPoolMappingOpen(false);

//       // Additionally, if pathname is outside allowed route, redirect user to allowed path
//       if (!isProjectBudget) {
//         navigate("/dashboard/project-budget-status");
//       }
//     } else {
//       // If role not yet determined, close all menus
//       setGeneralMenuOpen(false);
//       setPlanningOpen(false);
//       setConfigurationOpen(false);
//       setPoolMappingOpen(false);
//     }
//   }, [pathname, currentUserRole, navigate]);

//   const handleLinkClick = (pagePath) => {
//     setSelectedPage(pagePath);
//     navigate(pagePath);
//     if (isSidebarOpen) {
//       setIsSidebarOpen(false);
//     }
//   };

//   const handleCloseSidebar = () => {
//     if (isSidebarOpen) {
//       setIsSidebarOpen(false);
//     }
//   };

//   // Add Logout handler
//   const handleLogout = () => {
//     localStorage.removeItem("authToken"); // Clear auth token
//     navigate("/login");
//     setIsSidebarOpen(false);
//   };

//   // <TopBar name={userName} onLogout={handleLogout} />;
//   return (
//     <div className="flex min-h-screen font-inter">
//       <button
//         className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-1 rounded-md hover:bg-gray-700 transition ease-in-out duration-200"
//         onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//       >
//         {isSidebarOpen ? (
//           <X className="w-5 h-5" />
//         ) : (
//           <Menu className="w-5 h-5" />
//         )}
//       </button>

//       <div
//         className={`fixed inset-y-0 left-0 w-48  font-normal bg-gradient text-white p-3 sm:p-4 shadow-lg transform transition-transform duration-300 ${
//           isSidebarOpen ? "translate-x-0" : "-translate-x-full"
//         } md:translate-x-0 md:static md:w-48 z-40 flex flex-col`} // Added flex flex-col
//       >
//         {/* Header */}
//         {/* <div className="flex justify-between items-center mb-2 sm:mb-4">
//           <h2 className="text-base sm:text-lg md:text-2xl tracking-wide">
//             FinAxis
//           </h2>
//           <button
//             className="md:hidden text-white hover:text-gray-300 p-1 rounded"
//             onClick={handleCloseSidebar}
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div> */}

//         {/* Menu Content - Added flex-1 to take up remaining space */}
//         <div className="flex-1 overflow-y-auto">
//           <div
//             className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//             onClick={() => setGeneralMenuOpen(!generalMenuOpen)}
//           >
//             <span className="text-xs sm:text-sm">Menu</span>
//             <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
//           </div>

//           {generalMenuOpen && (
//             <div className="ml-1 mt-2 space-y-1">
//               <div
//                 className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//                 onClick={() => setPlanningOpen(!planningOpen)}
//               >
//                 <span className="text-xs sm:text-sm">Planning</span>
//                 {planningOpen ? (
//                   <ChevronDown className="w-3 sm:w-3 h-3 sm:h-3" />
//                 ) : (
//                   <ChevronRight className="w-3 sm:w-3 h-3 sm:h-3" />
//                 )}
//               </div>

//               {planningOpen && (
//                 <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
//                   <Link
//                     to="/dashboard/project-budget-status"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                       selectedPage === "/dashboard/project-budget-status"
//                         ? "bg-gray-800"
//                         : ""
//                     }`}
//                     onClick={(e) => {
//                       e.preventDefault();
//                       handleLinkClick("/dashboard/project-budget-status");
//                     }}
//                   >
//                     Project Planning
//                   </Link>
//                   <Link
//                     to="/dashboard/project-report"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                       selectedPage === "/dashboard/project-report"
//                         ? "bg-gray-800"
//                         : ""
//                     }`}
//                     onClick={(e) => {
//                       e.preventDefault();
//                       handleLinkClick("/dashboard/project-report");
//                     }}
//                   >
//                     Reporting
//                   </Link>
//                   <Link
//                     to="/dashboard/mass-utility"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                       selectedPage === "/dashboard/mass-utility"
//                         ? "bg-gray-800"
//                         : ""
//                     }`}
//                     onClick={(e) => {
//                       e.preventDefault();
//                       handleLinkClick("/dashboard/mass-utility");
//                     }}
//                   >
//                     Mass Utility
//                   </Link>
//                   {/* <Link
//                     to="/dashboard/new-business"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                       selectedPage === "/dashboard/new-business" ? "bg-gray-800 underline" : ""
//                     }`}
//                     onClick={(e) => {
//                       e.preventDefault();
//                       handleLinkClick("/dashboard/new-business");
//                     }}
//                   >
//                     New Business
//                   </Link> */}
//                 </div>
//               )}

//               {/* tabVisibility.revenueAnalysis !== false */}
//               {currentUserRole === "admin" && (
//                 <>
//                   <div
//                     className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//                     onClick={() => setConfigurationOpen(!configurationOpen)}
//                   >
//                     <span className="text-xs sm:text-sm">Configuration</span>
//                     {configurationOpen ? (
//                       <ChevronDown className="w-3 sm:w-3 h-3 sm:h-3" />
//                     ) : (
//                       <ChevronRight className="w-3 sm:w-3 h-3 sm:h-3" />
//                     )}
//                   </div>

//                   {configurationOpen && (
//                     <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
//                       <Link
//                         to="/dashboard/pool-rate-tabs"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded whitespace-nowrap transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/pool-rate-tabs"
//                             ? "bg-gray-800 "
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/pool-rate-tabs");
//                         }}
//                       >
//                         Forward Rate
//                       </Link>
//                       <Link
//                         to="/dashboard/analog-rate"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/analog-rate"
//                             ? "bg-gray-800"
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/analog-rate");
//                         }}
//                       >
//                         NBIs Analogous Rate
//                       </Link>
//                       <Link
//                         to="/dashboard/global-configuration"
//                         className={`block text-xs text-gray-200 hover:text-white  hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/global-configuration"
//                             ? "bg-gray-800 "
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/global-configuration");
//                         }}
//                       >
//                         Settings
//                       </Link>
//                       <div
//                         className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//                         onClick={() => setPoolMappingOpen(!poolMappingOpen)}
//                       >
//                         <span className="text-xs sm:text-sm">Pool Mapping</span>
//                         {poolMappingOpen ? (
//                           <ChevronDown className="w-3 sm:w-3 h-3 sm:h-3" />
//                         ) : (
//                           <ChevronRight className="w-3 sm:w-3 h-3 sm:h-3" />
//                         )}
//                       </div>

//                       {poolMappingOpen && (
//                         <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
//                           <Link
//                             to="/dashboard/pool-configuration"
//                             className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                               selectedPage === "/dashboard/pool-configuration"
//                                 ? "bg-gray-800"
//                                 : ""
//                             }`}
//                             onClick={(e) => {
//                               e.preventDefault();
//                               handleLinkClick("/dashboard/pool-configuration");
//                             }}
//                           >
//                             Org Account
//                           </Link>
//                           <Link
//                             to="/dashboard/template-pool-mapping"
//                             className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                               selectedPage ===
//                               "/dashboard/template-pool-mapping"
//                                 ? "bg-gray-800"
//                                 : ""
//                             }`}
//                             onClick={(e) => {
//                               e.preventDefault();
//                               handleLinkClick(
//                                 "/dashboard/template-pool-mapping"
//                               );
//                             }}
//                           >
//                             Template Pool Mapping
//                           </Link>
//                         </div>
//                       )}
//                       <Link
//                         to="/dashboard/ceiling-configuration"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/ceiling-configuration"
//                             ? "bg-gray-800"
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/ceiling-configuration");
//                         }}
//                       >
//                         Ceiling Configuration
//                       </Link>

//                       {/* <Link
//                         to="/dashboard/template"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/template"
//                             ? "bg-gray-800 "
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/template");
//                         }}
//                       >
//                         Burden Setup
//                       </Link> */}

//                       <Link
//                         to="/dashboard/prospective-id-setup"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/prospective-id-setup"
//                             ? "bg-gray-800"
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/prospective-id-setup");
//                         }}
//                       >
//                         Prospective ID Setup
//                       </Link>
//                       <Link
//                         to="/dashboard/display-settings"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/display-settings"
//                             ? "bg-gray-800"
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/display-settings");
//                         }}
//                       >
//                         Display Settings
//                       </Link>
//                       {/* <Link
//                         to="/dashboard/role-rights"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded whitespace-nowrap transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/role-rights"
//                             ? "bg-gray-800"
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/role-rights");
//                         }}
//                       >
//                         Configure Role Rights
//                       </Link> */}
//                       <Link
//                         to="/dashboard/annual-holidays"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage === "/dashboard/annual-holidays"
//                             ? "bg-gray-800 "
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick("/dashboard/annual-holidays");
//                         }}
//                       >
//                         Annual Holidays
//                       </Link>
//                       <Link
//                         to="/dashboard/maintain-fiscal-year-periods"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                           selectedPage ===
//                           "/dashboard/maintain-fiscal-year-periods"
//                             ? "bg-gray-800"
//                             : ""
//                         }`}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleLinkClick(
//                             "/dashboard/maintain-fiscal-year-periods"
//                           );
//                         }}
//                       >
//                         Maintain Fiscal Year Periods
//                       </Link>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           )}
//         </div>

//         {/* LOGOUT BUTTON AT THE BOTTOM */}
//         <div className="mt-auto pt-4 border-t border-gray-700 pb-10">
//           {/* <button
//             className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2 w-full rounded-md hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
//             onClick={handleLogout}
//           >
//             <LogOut className="w-4 h-4" />
//             Logout
//           </button> */}
//           {/* Version number fixed at bottom right */}
//           <div className="fixed bottom-2 right-2 text-xs text-white font-mono select-none pointer-events-none pb-10">
//             v{appVersion}
//           </div>
//         </div>
//       </div>

//       {isSidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
//           onClick={handleCloseSidebar}
//         ></div>
//       )}
//     </div>
//   );
// };

// export default NavigationSidebar;

// Final One

// import React, { useState, useEffect } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Menu, X, ChevronDown, ChevronRight, Plus, LogOut,Minus } from "lucide-react";
// import TopBar from "./TopBar";
// import.meta.env.VITE_APP_VERSION;

// const NavigationSidebar = () => {
//   const { pathname } = useLocation();
//   const navigate = useNavigate();

//   const [generalMenuOpen, setGeneralMenuOpen] = useState(
//     pathname.includes("/dashboard/project-budget-status") ||
//       pathname.includes("/dashboard/new-business") ||
//       pathname.includes("/dashboard/pool-rate-tabs") ||
//       pathname.includes("/dashboard/pool-configuration") ||
//       pathname.includes("/dashboard/template-pool-mapping") ||
//       pathname.includes("/dashboard/template") ||
//       pathname.includes("/dashboard/ceiling-configuration") ||
//       pathname.includes("/dashboard/global-configuration") ||
//       pathname.includes("/dashboard/prospective-id-setup") ||
//       pathname.includes("/dashboard/display-settings") ||
//       pathname.includes("/dashboard/annual-holidays") ||
//       pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
//       pathname.includes("/dashboard/analog-rate") ||
//       pathname.includes("/dashboard/project-report") ||
//       pathname.includes("/dashboard/role-rights") ||
//       pathname.includes("/dashboard/mass-utility") ||
//       pathname.includes("/dashboard/account-mapping") ||
//           pathname.includes("/dashboard/projectmapping")
//   );

//   const [planningOpen, setPlanningOpen] = useState(
//     pathname.includes("/dashboard/project-budget-status") ||
//       pathname.includes("/dashboard/new-business") ||
//       pathname.includes("/dashboard/project-report") ||
//       pathname.includes("/dashboard/mass-utility")
//   );

//   const [configurationOpen, setConfigurationOpen] = useState(
//     pathname.includes("/dashboard/pool-rate-tabs") ||
//       pathname.includes("/dashboard/pool-configuration") ||
//       pathname.includes("/dashboard/template-pool-mapping") ||
//       pathname.includes("/dashboard/template") ||
//       pathname.includes("/dashboard/ceiling-configuration") ||
//       pathname.includes("/dashboard/global-configuration") ||
//       pathname.includes("/dashboard/prospective-id-setup") ||
//       pathname.includes("/dashboard/display-settings") ||
//       pathname.includes("/dashboard/annual-holidays") ||
//       pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
//       pathname.includes("/dashboard/analog-rate") ||
//       pathname.includes("/dashboard/role-rights") ||
//       pathname.includes("/dashboard/account-mapping") ||
//           pathname.includes("/dashboard/projectmapping")
//   );

//   const [poolMappingOpen, setPoolMappingOpen] = useState(
//     pathname.includes("/dashboard/pool-configuration") ||
//       pathname.includes("/dashboard/template-pool-mapping")
//   );

//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [selectedPage, setSelectedPage] = useState(pathname);
//   const [currentUserRole, setCurrentUserRole] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   useEffect(() => {
//     const userString = localStorage.getItem("currentUser");
//     if (userString) {
//       try {
//         const userObj = JSON.parse(userString);
//         setUserName(userObj.name || "User");
//         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
//       } catch {
//         setCurrentUserRole(null);
//         setUserName("User");
//       }
//     }
//   }, []);

//   const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";

//   useEffect(() => {
//     setSelectedPage(pathname);

//     if (currentUserRole === "admin") {
//       setGeneralMenuOpen(
//         pathname.includes("/dashboard/project-budget-status") ||
//           pathname.includes("/dashboard/new-business") ||
//           pathname.includes("/dashboard/pool-rate-tabs") ||
//           pathname.includes("/dashboard/pool-configuration") ||
//           pathname.includes("/dashboard/template-pool-mapping") ||
//           pathname.includes("/dashboard/template") ||
//           pathname.includes("/dashboard/ceiling-configuration") ||
//           pathname.includes("/dashboard/global-configuration") ||
//           pathname.includes("/dashboard/prospective-id-setup") ||
//           pathname.includes("/dashboard/display-settings") ||
//           pathname.includes("/dashboard/annual-holidays") ||
//           pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
//           pathname.includes("/dashboard/analog-rate") ||
//           pathname.includes("/dashboard/project-report") ||
//           pathname.includes("/dashboard/role-rights") ||
//           pathname.includes("/dashboard/mass-utility") ||
//           pathname.includes("/dashboard/account-mapping")||
//           pathname.includes("/dashboard/projectmapping")
//       );
//       setPlanningOpen(
//         pathname.includes("/dashboard/project-budget-status") ||
//           pathname.includes("/dashboard/new-business") ||
//           pathname.includes("/dashboard/project-report") ||
//           pathname.includes("/dashboard/mass-utility")
//       );
//       setConfigurationOpen(
//         pathname.includes("/dashboard/pool-rate-tabs") ||
//           pathname.includes("/dashboard/pool-configuration") ||
//           pathname.includes("/dashboard/template-pool-mapping") ||
//           pathname.includes("/dashboard/template") ||
//           pathname.includes("/dashboard/ceiling-configuration") ||
//           pathname.includes("/dashboard/global-configuration") ||
//           pathname.includes("/dashboard/prospective-id-setup") ||
//           pathname.includes("/dashboard/display-settings") ||
//           pathname.includes("/dashboard/annual-holidays") ||
//           pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
//           pathname.includes("/dashboard/analog-rate") ||
//           pathname.includes("/dashboard/role-rights") ||
//           pathname.includes("/dashboard/account-mapping") ||
//           pathname.includes("/dashboard/projectmapping")

//       );
//       setPoolMappingOpen(
//         pathname.includes("/dashboard/pool-configuration") ||
//           pathname.includes("/dashboard/template-pool-mapping")
//       );
//     } else if (currentUserRole === "user") {
//       const isProjectBudget = pathname.includes("/dashboard/project-budget-status");
//       setGeneralMenuOpen(isProjectBudget);
//       setPlanningOpen(isProjectBudget);
//       setConfigurationOpen(false);
//       setPoolMappingOpen(false);

//       if (!isProjectBudget) {
//         navigate("/dashboard/project-budget-status");
//       }
//     }
//   }, [pathname, currentUserRole, navigate]);

//   const handleLinkClick = (pagePath) => {
//     setSelectedPage(pagePath);
//     navigate(pagePath);
//     if (isSidebarOpen) {
//       setIsSidebarOpen(false);
//     }
//   };

//   const handleCloseSidebar = () => {
//     if (isSidebarOpen) {
//       setIsSidebarOpen(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("authToken");
//     navigate("/login");
//     setIsSidebarOpen(false);
//   };

//   return (
//     <div className="flex min-h-screen font-inter">
//       <button
//         className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-1 rounded-md hover:bg-gray-700 transition ease-in-out duration-200"
//         onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//       >
//         {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//       </button>

//       <div
//         className={`fixed inset-y-0 left-0 w-48 font-normal bg-gradient text-white p-3 sm:p-4 shadow-lg transform transition-transform duration-300 ${
//           isSidebarOpen ? "translate-x-0" : "-translate-x-full"
//         } md:translate-x-0 md:static md:w-48 z-40 flex flex-col`}
//       >
//         <div className="flex-1 overflow-y-auto">
//           <div
//             className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//             onClick={() => setGeneralMenuOpen(!generalMenuOpen)}
//           >
//             <span className="text-xs sm:text-sm">Menu</span>
//             {generalMenuOpen ? (
//     <Minus className="w-3 sm:w-4 h-3 sm:h-4" />
//   ) : (
//     <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
//   )}
//             {/* <Plus className="w-3 sm:w-4 h-3 sm:h-4" /> */}
//           </div>

//           {generalMenuOpen && (
//             <div className="ml-1 mt-2 space-y-1">
//               {/* Planning Section */}
//               <div
//                 className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//                 onClick={() => setPlanningOpen(!planningOpen)}
//               >
//                 <span className="text-xs sm:text-sm">Planning</span>
//                 {planningOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
//               </div>

//               {planningOpen && (
//                 <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
//                   <Link
//                     to="/dashboard/project-budget-status"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                       selectedPage === "/dashboard/project-budget-status" ? "bg-gray-800" : ""
//                     }`}
//                     onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/project-budget-status"); }}
//                   >
//                     Project Planning
//                   </Link>
//                   <Link
//                     to="/dashboard/project-report"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                       selectedPage === "/dashboard/project-report" ? "bg-gray-800" : ""
//                     }`}
//                     onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/project-report"); }}
//                   >
//                     Reporting
//                   </Link>
//                   <Link
//                     to="/dashboard/mass-utility"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                       selectedPage === "/dashboard/mass-utility" ? "bg-gray-800" : ""
//                     }`}
//                     onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/mass-utility"); }}
//                   >
//                     Mass Utility
//                   </Link>
//                    <Link
//                     to="/dashboard/new-business"
//                     className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ease-in-out duration-200 ${
//                       selectedPage === "/dashboard/new-business" ? "bg-gray-800 underline" : ""
//                     }`}
//                     onClick={(e) => {
//                       e.preventDefault();
//                       handleLinkClick("/dashboard/new-business");
//                     }}
//                   >
//                     New Business Budget
//                  </Link>
//                 </div>
//               )}

//               {/* Admin Configuration Section */}
//               {currentUserRole === "admin" && (
//                 <>
//                   <div
//                     className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition ease-in-out duration-200"
//                     onClick={() => setConfigurationOpen(!configurationOpen)}
//                   >
//                     <span className="text-xs sm:text-sm">Configuration</span>
//                     {configurationOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
//                   </div>

//                   {configurationOpen && (
//                     <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
//                       <Link
//                         to="/dashboard/pool-rate-tabs"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/pool-rate-tabs" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/pool-rate-tabs"); }}
//                       >
//                         Forward Rate
//                       </Link>
//                       <Link
//                         to="/dashboard/analog-rate"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/analog-rate" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/analog-rate"); }}
//                       >
//                         NBIs Analogous Rate
//                       </Link>
//                       <Link
//                         to="/dashboard/account-mapping"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/account-mapping" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/account-mapping"); }}
//                       >
//                         Account Mapping
//                       </Link>
//                       <Link
//                         to="/dashboard/global-configuration"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/global-configuration" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/global-configuration"); }}
//                       >
//                         Settings
//                       </Link>

//                       {/* Pool Mapping Nested */}
//                       <div
//                         className="flex justify-between items-center cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md transition"
//                         onClick={() => setPoolMappingOpen(!poolMappingOpen)}
//                       >
//                         <span className="text-xs">Pool Mapping</span>
//                         {poolMappingOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
//                       </div>

//                       {poolMappingOpen && (
//                         <div className="ml-3 mt-1 pl-1 border-l border-gray-600 space-y-1">
//                           <Link
//                             to="/dashboard/pool-configuration"
//                             className={`block text-[11px] text-gray-200 hover:text-white px-2 py-1 rounded ${
//                               selectedPage === "/dashboard/pool-configuration" ? "bg-gray-800" : ""
//                             }`}
//                             onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/pool-configuration"); }}
//                           >
//                             Org Account
//                           </Link>
//                           <Link
//                             to="/dashboard/template-pool-mapping"
//                             className={`block text-[11px] text-gray-200 hover:text-white px-2 py-1 rounded ${
//                               selectedPage === "/dashboard/template-pool-mapping" ? "bg-gray-800" : ""
//                             }`}
//                             onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/template-pool-mapping"); }}
//                           >
//                             Template Pool Mapping
//                           </Link>
//                         </div>
//                       )}

//                       <Link
//                         to="/dashboard/ceiling-configuration"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/ceiling-configuration" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/ceiling-configuration"); }}
//                       >
//                         Ceiling Configuration
//                       </Link>
//                       <Link
//                         to="/dashboard/prospective-id-setup"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/prospective-id-setup" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/prospective-id-setup"); }}
//                       >
//                         Prospective ID Setup
//                       </Link>
//                       <Link
//                         to="/dashboard/display-settings"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/display-settings" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/display-settings"); }}
//                       >
//                         Display Settings
//                       </Link>
//                       {/* <Link
//                         to="/dashboard/role-rights"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/role-rights" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/role-rights"); }}
//                       >
//                         Configure Role Rights
//                       </Link> */}
//                       <Link
//                         to="/dashboard/projectmapping"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/projectmapping" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/projectmapping"); }}
//                       >
//                          Project Mapping
//                       </Link>
//                       <Link
//                         to="/dashboard/annual-holidays"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/annual-holidays" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/annual-holidays"); }}
//                       >
//                         Annual Holidays
//                       </Link>
//                       <Link
//                         to="/dashboard/maintain-fiscal-year-periods"
//                         className={`block text-xs text-gray-200 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition ${
//                           selectedPage === "/dashboard/maintain-fiscal-year-periods" ? "bg-gray-800" : ""
//                         }`}
//                         onClick={(e) => { e.preventDefault(); handleLinkClick("/dashboard/maintain-fiscal-year-periods"); }}
//                       >
//                         Fiscal Year Periods
//                       </Link>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Footer Version */}
//         <div className="mt-auto pt-4 border-t border-gray-700 pb-10">
//           <div className="fixed bottom-2 right-2 text-xs text-white font-mono select-none pointer-events-none pb-10">
//             v{appVersion}
//           </div>
//         </div>
//       </div>

//       {isSidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
//           onClick={handleCloseSidebar}
//         ></div>
//       )}
//     </div>
//   );
// };

// export default NavigationSidebar;

// //added hambureg

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  BarChart2,
  Layers,
  FileText,
  Settings,
} from "lucide-react";

const NavigationSidebar = ({ onHoverChange }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // --- ALL ORIGINAL LOGIC PRESERVED ---
  const [generalMenuOpen, setGeneralMenuOpen] = useState(
    pathname.includes("/dashboard/project-budget-status") ||
      pathname.includes("/dashboard/new-business") ||
      pathname.includes("/dashboard/pool-rate-tabs") ||
      pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping") ||
      pathname.includes("/dashboard/template") ||
      pathname.includes("/dashboard/ceiling-configuration") ||
      pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/prospective-id-setup") ||
      pathname.includes("/dashboard/display-settings") ||
      pathname.includes("/dashboard/annual-holidays") ||
      pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
      pathname.includes("/dashboard/analog-rate") ||
      pathname.includes("/dashboard/project-report") ||
      pathname.includes("/dashboard/role-rights") ||
      pathname.includes("/dashboard/mass-utility") ||
      pathname.includes("/dashboard/account-mapping") ||
      pathname.includes("/dashboard/projectmapping")
  );

  const [planningOpen, setPlanningOpen] = useState(
    pathname.includes("/dashboard/project-budget-status") ||
      pathname.includes("/dashboard/new-business") ||
      pathname.includes("/dashboard/project-report") ||
      pathname.includes("/dashboard/mass-utility")
  );

  const [configurationOpen, setConfigurationOpen] = useState(
    pathname.includes("/dashboard/pool-rate-tabs") ||
      pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping") ||
      pathname.includes("/dashboard/template") ||
      pathname.includes("/dashboard/ceiling-configuration") ||
      pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/prospective-id-setup") ||
      pathname.includes("/dashboard/display-settings") ||
      pathname.includes("/dashboard/annual-holidays") ||
      pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
      pathname.includes("/dashboard/analog-rate") ||
      pathname.includes("/dashboard/role-rights") ||
      pathname.includes("/dashboard/account-mapping") ||
      pathname.includes("/dashboard/projectmapping")
  );

  const [poolMappingOpen, setPoolMappingOpen] = useState(
    pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping")
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(pathname);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userName, setUserName] = useState("User");

  // New state for the hover functionality
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUserName(userObj.name || "User");
        setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
      } catch {
        setCurrentUserRole(null);
        setUserName("User");
      }
    }
  }, []);

  const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";

  useEffect(() => {
    setSelectedPage(pathname);

    if (currentUserRole === "admin") {
      setGeneralMenuOpen(
        pathname.includes("/dashboard/project-budget-status") ||
          pathname.includes("/dashboard/new-business") ||
          pathname.includes("/dashboard/pool-rate-tabs") ||
          pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping") ||
          pathname.includes("/dashboard/template") ||
          pathname.includes("/dashboard/ceiling-configuration") ||
          pathname.includes("/dashboard/global-configuration") ||
          pathname.includes("/dashboard/prospective-id-setup") ||
          pathname.includes("/dashboard/display-settings") ||
          pathname.includes("/dashboard/annual-holidays") ||
          pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
          pathname.includes("/dashboard/analog-rate") ||
          pathname.includes("/dashboard/project-report") ||
          pathname.includes("/dashboard/role-rights") ||
          pathname.includes("/dashboard/mass-utility") ||
          pathname.includes("/dashboard/account-mapping") ||
          pathname.includes("/dashboard/projectmapping")
      );
      setPlanningOpen(
        pathname.includes("/dashboard/project-budget-status") ||
          pathname.includes("/dashboard/new-business") ||
          pathname.includes("/dashboard/project-report") ||
          pathname.includes("/dashboard/mass-utility")
      );
      setConfigurationOpen(
        pathname.includes("/dashboard/pool-rate-tabs") ||
          pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping") ||
          pathname.includes("/dashboard/template") ||
          pathname.includes("/dashboard/ceiling-configuration") ||
          pathname.includes("/dashboard/global-configuration") ||
          pathname.includes("/dashboard/prospective-id-setup") ||
          pathname.includes("/dashboard/display-settings") ||
          pathname.includes("/dashboard/annual-holidays") ||
          pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
          pathname.includes("/dashboard/analog-rate") ||
          pathname.includes("/dashboard/role-rights") ||
          pathname.includes("/dashboard/account-mapping") ||
          pathname.includes("/dashboard/projectmapping")
      );
      setPoolMappingOpen(
        pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping")
      );
    } else if (currentUserRole === "user") {
      const isProjectBudget = pathname.includes(
        "/dashboard/project-budget-status"
      );
      setGeneralMenuOpen(isProjectBudget);
      setPlanningOpen(isProjectBudget);
      setConfigurationOpen(false);
      setPoolMappingOpen(false);

      if (!isProjectBudget) {
        navigate("/dashboard/project-budget-status");
      }
    }
  }, [pathname, currentUserRole, navigate]);

  const handleLinkClick = (pagePath) => {
    setSelectedPage(pagePath);
    navigate(pagePath);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleCloseSidebar = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen font-inter bg-white">
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-1 rounded-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar - Hover to expand */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
          ${onHoverChange ? "w-64" : "w-16"}
        `}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4">
          {/* Menu / General Toggle Section */}
          <div
            className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setGeneralMenuOpen(!generalMenuOpen)}
          >
            <div className="w-8 flex justify-center">
              {generalMenuOpen ? <Minus size={16} /> : <Plus size={16} />}
            </div>
            <span
              className={`ml-4 text-sm font-semibold transition-opacity duration-200 ${onHoverChange ? "opacity-100" : "opacity-0"}`}
            >
              Menu
            </span>
          </div>

          {generalMenuOpen && (
            <div className="space-y-1 mt-2">
              {/* --- PLANNING SECTION --- */}
              <div>
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 group"
                  onClick={() => setPlanningOpen(!planningOpen)}
                >
                  <div className="flex items-center">
                    <div className="w-8 flex justify-center">
                      <BarChart2 className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <span
                      className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${onHoverChange ? "opacity-100" : "opacity-0"}`}
                    >
                      Planning
                    </span>
                  </div>
                  {onHoverChange &&
                    (planningOpen ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    ))}
                </div>

                {planningOpen && onHoverChange && (
                  <div className="ml-12 mr-4 space-y-1 border-l border-gray-100">
                    <NavItem
                      label="Project Planning"
                      path="/dashboard/project-budget-status"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                    />
                    <NavItem
                      label="Reporting"
                      path="/dashboard/project-report"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                    />
                    <NavItem
                      label="Mass Utility"
                      path="/dashboard/mass-utility"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                    />
                    <NavItem
                      label="New Business Budget"
                      path="/dashboard/new-business"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                    />
                  </div>
                )}
              </div>

              {/* --- FORECASTING (Visual Only) --- */}
              {/* <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 group">
                <div className="w-8 flex justify-center">
                    <Layers className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    Forecasting
                </span>
                {isHovered && <ChevronRight size={14} className="ml-auto" />}
              </div> */}

              {/* --- REPORTS (Visual Only) --- */}
              {/* <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 group">
                <div className="w-8 flex justify-center">
                    <FileText className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    Reports
                </span>
                {isHovered && <ChevronRight size={14} className="ml-auto" />}
              </div> */}

              {/* --- CONFIGURATION SECTION --- */}
              {currentUserRole === "admin" && (
                <div>
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 group"
                    onClick={() => setConfigurationOpen(!configurationOpen)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex justify-center">
                        <Settings className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <span
                        className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
                      >
                        Configuration
                      </span>
                    </div>
                    {onHoverChange &&
                      (configurationOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      ))}
                  </div>

                  {configurationOpen && onHoverChange && (
                    <div className="ml-12 mr-4 space-y-1 border-l border-gray-100">
                      <NavItem
                        label="Forward Rate"
                        path="/dashboard/pool-rate-tabs"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="NBIs Analogous Rate"
                        path="/dashboard/analog-rate"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Account Mapping"
                        path="/dashboard/account-mapping"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Settings"
                        path="/dashboard/global-configuration"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />

                      {/* Nested Pool Mapping */}
                      <div className="py-1">
                        <div
                          className="flex justify-between items-center px-3 py-2 cursor-pointer hover:bg-gray-50 rounded text-xs"
                          onClick={() => setPoolMappingOpen(!poolMappingOpen)}
                        >
                          <span>Pool Mapping</span>
                          {poolMappingOpen ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                        </div>
                        {poolMappingOpen && (
                          <div className="ml-3 mt-1 border-l border-gray-200 space-y-1">
                            <NavItem
                              label="Org Account"
                              path="/dashboard/pool-configuration"
                              selected={selectedPage}
                              onClick={handleLinkClick}
                            />
                            <NavItem
                              label="Template Pool Mapping"
                              path="/dashboard/template-pool-mapping"
                              selected={selectedPage}
                              onClick={handleLinkClick}
                            />
                          </div>
                        )}
                      </div>

                      <NavItem
                        label="Ceiling Configuration"
                        path="/dashboard/ceiling-configuration"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Prospective ID Setup"
                        path="/dashboard/prospective-id-setup"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Display Settings"
                        path="/dashboard/display-settings"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Project Mapping"
                        path="/dashboard/projectmapping"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Annual Holidays"
                        path="/dashboard/annual-holidays"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                      <NavItem
                        label="Fiscal Year Periods"
                        path="/dashboard/maintain-fiscal-year-periods"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Version */}
        <div
          className={`mt-auto p-4 border-t border-gray-100 transition-opacity duration-200 ${onHoverChange ? "opacity-100" : "opacity-0"}`}
        >
          <div className="text-[10px] text-gray-400 font-mono select-none">
            v{appVersion}
          </div>
        </div>
      </div>

      {/* Background Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-30"
          onClick={handleCloseSidebar}
        ></div>
      )}
    </div>
  );
};

// Sub-component for individual links to keep code clean
const NavItem = ({ label, path, selected, onClick }) => (
  <Link
    to={path}
    // className={`block px-3 py-2 text-xs transition-colors rounded-md ${
    //   selected === path
    //     ? "text-blue-600 bg-blue-50 font-semibold"
    //     : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    // }`}
    className={`block px-3 py-2 text-xs transition-colors rounded-md whitespace-nowrap ${
  selected === path
    ? "text-white font-semibold"
    : "text-gray-500 hover:text-gray-900"
}`}
style={{
  backgroundColor:
    selected === path
      ? "oklch(0.205 0 0)"
      : "rgb(245,245,245)",
}}
    onClick={(e) => {
      e.preventDefault();
      onClick(path);
    }}
  >
    {label}
  </Link>
);

export default NavigationSidebar;
