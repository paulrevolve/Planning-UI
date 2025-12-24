// // // // import React, { useEffect, useState, useRef } from "react";
// // // // import axios from "axios";
// // // // import { backendUrl } from "./config";

// // // // // Sample UI to configure visibility per role.
// // // // // Data model:
// // // // // sections: [{ id, label, fields: [{ id, label }] }]

// // // // const sampleSections = [
// // // //   {
// // // //     id: "dashboard",
// // // //     label: "Dashboard",
// // // //     fields: [
// // // //       { id: "financials", label: "Financials" },
// // // //       { id: "revenue", label: "Revenue" },
// // // //     ],
// // // //   },
// // // //   {
// // // //     id: "projects",
// // // //     label: "Projects",
// // // //     fields: [
// // // //       { id: "planTable", label: "Plan Table" },
// // // //       { id: "projectForm", label: "Project Form" },
// // // //     ],
// // // //   },
// // // //   {
// // // //     id: "settings",
// // // //     label: "Settings",
// // // //     fields: [
// // // //       { id: "display", label: "Display Settings" },
// // // //       { id: "roles", label: "Role Configuration" },
// // // //     ],
// // // //   },
// // // // ];

// // // // const ConfigureField = () => {
// // // //   const [roles, setRoles] = useState(["Admin", "Manager", "Viewer"]);
// // // //   const [selectedRole, setSelectedRole] = useState(roles[0]);
// // // //   const [sections, setSections] = useState(sampleSections);
// // // //   const [visibility, setVisibility] = useState({});
// // // //   const [expanded, setExpanded] = useState({});
// // // //   const [loading, setLoading] = useState(false);
// // // //   const [saving, setSaving] = useState(false);
// // // //   const parentRefs = useRef({});

// // // //   useEffect(() => {
// // // //     // Try to fetch roles and sections from backend, fall back to sample data
// // // //     const fetchMeta = async () => {
// // // //       try {
// // // //         // Example endpoints - replace with real ones if available
// // // //         const r = await axios.get(`${backendUrl}/Security/GetRoles`);
// // // //         if (Array.isArray(r.data) && r.data.length > 0) setRoles(r.data);
// // // //       } catch (e) {
// // // //         // ignore and use sample roles
// // // //       }

// // // //       try {
// // // //         const s = await axios.get(`${backendUrl}/Configuration/GetVisibilitySections`);
// // // //         if (s.data && Array.isArray(s.data)) setSections(s.data);
// // // //       } catch (e) {
// // // //         // keep sampleSections
// // // //       }
// // // //     };

// // // //     fetchMeta();
// // // //   }, []);

// // // //   useEffect(() => {
// // // //     // Load visibility for selected role
// // // //     const load = async () => {
// // // //       setLoading(true);
// // // //       try {
// // // //         const res = await axios.get(`${backendUrl}/Configuration/GetVisibilityByRole/${encodeURIComponent(selectedRole)}`);
// // // //         if (res.data) {
// // // //           setVisibility(res.data);
// // // //         } else {
// // // //           // default: make everything visible
// // // //           const defaultVis = {};
// // // //           sections.forEach((s) => {
// // // //             defaultVis[s.id] = true;
// // // //             s.fields.forEach((f) => (defaultVis[`${s.id}.${f.id}`] = true));
// // // //           });
// // // //           setVisibility(defaultVis);
// // // //         }
// // // //       } catch (e) {
// // // //         // fallback default visibility
// // // //         const defaultVis = {};
// // // //         sections.forEach((s) => {
// // // //           defaultVis[s.id] = true;
// // // //           s.fields.forEach((f) => (defaultVis[`${s.id}.${f.id}`] = true));
// // // //         });
// // // //         setVisibility(defaultVis);
// // // //       } finally {
// // // //         setLoading(false);
// // // //       }
// // // //     };

// // // //     load();
// // // //   }, [selectedRole, sections]);

// // // //   useEffect(() => {
// // // //     // Update parent indeterminate state when visibility changes
// // // //     sections.forEach((s) => {
// // // //       const ref = parentRefs.current[s.id];
// // // //       if (!ref) return;
// // // //       const childIds = s.fields.map((f) => `${s.id}.${f.id}`);
// // // //       const checkedCount = childIds.filter((id) => visibility[id]).length;
// // // //       if (checkedCount === 0) {
// // // //         ref.indeterminate = false;
// // // //         ref.checked = !!visibility[s.id];
// // // //       } else if (checkedCount === childIds.length) {
// // // //         ref.indeterminate = false;
// // // //         ref.checked = true;
// // // //       } else {
// // // //         ref.indeterminate = true;
// // // //         ref.checked = false;
// // // //       }
// // // //     });
// // // //   }, [visibility, sections]);

// // // //   const toggleSection = (sectionId) => {
// // // //     setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
// // // //   };

// // // //   const onParentChange = (sectionId, checked) => {
// // // //     const newVis = { ...visibility, [sectionId]: checked };
// // // //     const section = sections.find((s) => s.id === sectionId);
// // // //     if (section) {
// // // //       section.fields.forEach((f) => (newVis[`${sectionId}.${f.id}`] = checked));
// // // //     }
// // // //     setVisibility(newVis);
// // // //   };

// // // //   const onChildChange = (sectionId, fieldId, checked) => {
// // // //     setVisibility((prev) => ({ ...prev, [`${sectionId}.${fieldId}`]: checked }));
// // // //   };

// // // //   const save = async () => {
// // // //     setSaving(true);
// // // //     try {
// // // //       await axios.put(`${backendUrl}/Configuration/UpdateVisibilityByRole/${encodeURIComponent(selectedRole)}`, visibility);
// // // //       // show toast? the app uses react-toastify elsewhere; but keep this component generic
// // // //       setSaving(false);
// // // //     } catch (e) {
// // // //       setSaving(false);
// // // //       throw e;
// // // //     }
// // // //   };

// // // //   const renderSection = (s) => {
// // // //     return (
// // // //       <div key={s.id} className="border rounded mb-2">
// // // //         <div className="flex items-center justify-between p-3 bg-gray-50">
// // // //           <div className="flex items-center gap-3">
// // // //             <input
// // // //               ref={(el) => (parentRefs.current[s.id] = el)}
// // // //               type="checkbox"
// // // //               checked={!!visibility[s.id]}
// // // //               onChange={(e) => onParentChange(s.id, e.target.checked)}
// // // //             />
// // // //             <button
// // // //               className="font-semibold text-sm text-left"
// // // //               onClick={() => toggleSection(s.id)}
// // // //             >
// // // //               {s.label}
// // // //             </button>
// // // //           </div>
// // // //           <div className="text-xs text-gray-500">{s.fields.length} fields</div>
// // // //         </div>
// // // //         {expanded[s.id] && (
// // // //           <div className="p-3 bg-white">
// // // //             {s.fields.map((f) => (
// // // //               <label key={f.id} className="flex items-center gap-2 text-sm py-1">
// // // //                 <input
// // // //                   type="checkbox"
// // // //                   checked={!!visibility[`${s.id}.${f.id}`]}
// // // //                   onChange={(e) => onChildChange(s.id, f.id, e.target.checked)}
// // // //                 />
// // // //                 <span>{f.label}</span>
// // // //               </label>
// // // //             ))}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     );
// // // //   };

// // // //   return (
// // // //     <div className="p-4">
// // // //       <h2 className="text-lg font-semibold mb-4">Configure Visibility by Role</h2>

// // // //       <div className="mb-4 flex items-center gap-3">
// // // //         <label className="text-sm">Role:</label>
// // // //         <select
// // // //           value={selectedRole}
// // // //           onChange={(e) => setSelectedRole(e.target.value)}
// // // //           className="border border-gray-300 rounded px-2 py-1 text-sm"
// // // //         >
// // // //           {roles.map((r) => (
// // // //             <option key={r} value={r}>
// // // //               {r}
// // // //             </option>
// // // //           ))}
// // // //         </select>
// // // //         <button
// // // //           className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-sm"
// // // //           onClick={save}
// // // //           disabled={saving}
// // // //         >
// // // //           {saving ? "Saving..." : "Save"}
// // // //         </button>
// // // //       </div>

// // // //       {loading ? (
// // // //         <div>Loading...</div>
// // // //       ) : (
// // // //         <div>{sections.map((s) => renderSection(s))}</div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // };

// // // // export default ConfigureField;

// // // import React, { useEffect, useState, useRef } from "react";
// // // import axios from "axios";
// // // import { backendUrl } from "./config";

// // // // Updated sections to match ProjectBudgetStatus tabs
// // // const projectBudgetSections = [
// // //   {
// // //     id: "dashboard",
// // //     label: "Dashboard",
// // //     fields: [{ id: "financials", label: "Financials" }],
// // //     adminOnly: false
// // //   },
// // //   {
// // //     id: "hours",
// // //     label: "Hours",
// // //     fields: [{ id: "hoursDetails", label: "Hours Details" }],
// // //     adminOnly: false
// // //   },
// // //   {
// // //     id: "amounts",
// // //     label: "Other Cost",
// // //     fields: [{ id: "amountsTable", label: "Amounts Table" }],
// // //     adminOnly: false
// // //   },
// // //   {
// // //     id: "revenueAnalysis",
// // //     label: "Revenue Details",
// // //     fields: [{ id: "revenueTable", label: "Revenue Analysis" }],
// // //     adminOnly: true
// // //   },
// // //   {
// // //     id: "analysisByPeriod",
// // //     label: "Monthly Forecast",
// // //     fields: [{ id: "forecastTable", label: "Forecast Data" }],
// // //     adminOnly: true
// // //   },
// // //   {
// // //     id: "plc",
// // //     label: "Labor Categories",
// // //     fields: [{ id: "plcComponent", label: "PLC Component" }],
// // //     adminOnly: true
// // //   },
// // //   {
// // //     id: "revenueSetup",
// // //     label: "Revenue Definition",
// // //     fields: [{ id: "revenueSetup", label: "Revenue Setup" }],
// // //     adminOnly: true
// // //   },
// // //   {
// // //     id: "revenueCeiling",
// // //     label: "Adjustment",
// // //     fields: [{ id: "revenueCeiling", label: "Revenue Ceiling" }],
// // //     adminOnly: true
// // //   },
// // //   {
// // //     id: "funding",
// // //     label: "Funding",
// // //     fields: [{ id: "fundingComponent", label: "Funding" }],
// // //     adminOnly: true
// // //   },
// // //   {
// // //     id: "warning",
// // //     label: "Warning",
// // //     fields: [{ id: "warningComponent", label: "Warnings" }],
// // //     adminOnly: false
// // //   }
// // // ];

// // // const ConfigureField = () => {
// // //   const [roles, setRoles] = useState(["Admin", "Manager", "Viewer"]);
// // //   const [selectedRole, setSelectedRole] = useState("Admin");
// // //   const [sections, setSections] = useState(projectBudgetSections);
// // //   const [visibility, setVisibility] = useState({});
// // //   const [expanded, setExpanded] = useState({});
// // //   const [loading, setLoading] = useState(false);
// // //   const [saving, setSaving] = useState(false);
// // //   const parentRefs = useRef({});

// // //   // Get current user role from localStorage (same as ProjectBudgetStatus)
// // //   const [currentUserRole, setCurrentUserRole] = useState(null);
  
// // //   useEffect(() => {
// // //     const userString = localStorage.getItem("currentUser");
// // //     if (userString) {
// // //       try {
// // //         const userObj = JSON.parse(userString);
// // //         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
// // //       } catch {
// // //         setCurrentUserRole(null);
// // //       }
// // //     }
// // //   }, []);

// // //   useEffect(() => {
// // //     const fetchMeta = async () => {
// // //       try {
// // //         const r = await axios.get(`${backendUrl}/Security/GetRoles`);
// // //         if (Array.isArray(r.data) && r.data.length > 0) {
// // //           setRoles(r.data);
// // //           if (r.data.includes("Admin")) setSelectedRole("Admin");
// // //         }
// // //       } catch (e) {
// // //         // use default roles
// // //       }
// // //     };
// // //     fetchMeta();
// // //   }, []);

// // //   useEffect(() => {
// // //     const load = async () => {
// // //       setLoading(true);
// // //       try {
// // //         const res = await axios.get(
// // //           `${backendUrl}/Configuration/GetVisibilityByRole/${encodeURIComponent(selectedRole)}`
// // //         );
// // //         if (res.data) {
// // //           setVisibility(res.data);
// // //         } else {
// // //           // Initialize visibility based on role permissions
// // //           const defaultVis = {};
// // //           sections.forEach((s) => {
// // //             const isVisible = selectedRole.toLowerCase() === 'admin' || !s.adminOnly;
// // //             defaultVis[s.id] = isVisible;
// // //             s.fields.forEach((f) => {
// // //               defaultVis[`${s.id}.${f.id}`] = isVisible;
// // //             });
// // //           });
// // //           setVisibility(defaultVis);
// // //         }
// // //       } catch (e) {
// // //         // Default visibility with admin-only restrictions
// // //         const defaultVis = {};
// // //         sections.forEach((s) => {
// // //           const isVisible = selectedRole.toLowerCase() === 'admin' || !s.adminOnly;
// // //           defaultVis[s.id] = isVisible;
// // //           s.fields.forEach((f) => {
// // //             defaultVis[`${s.id}.${f.id}`] = isVisible;
// // //           });
// // //         });
// // //         setVisibility(defaultVis);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };
// // //     load();
// // //   }, [selectedRole, sections]);

// // //   const toggleSection = (sectionId) => {
// // //     setExpanded((prev) => ({
// // //       ...prev,
// // //       [sectionId]: !prev[sectionId]
// // //     }));
// // //   };

// // //   const onParentChange = (sectionId, checked) => {
// // //     const newVis = { ...visibility, [sectionId]: checked };
// // //     const section = sections.find((s) => s.id === sectionId);
// // //     if (section) {
// // //       section.fields.forEach((f) => {
// // //         newVis[`${sectionId}.${f.id}`] = checked;
// // //       });
// // //     }
// // //     setVisibility(newVis);
// // //   };

// // //   const onChildChange = (sectionId, fieldId, checked) => {
// // //     setVisibility((prev) => ({
// // //       ...prev,
// // //       [`${sectionId}.${fieldId}`]: checked
// // //     }));
// // //   };

// // //   const save = async () => {
// // //     setSaving(true);
// // //     try {
// // //       await axios.put(
// // //         `${backendUrl}/Configuration/UpdateVisibilityByRole/${encodeURIComponent(selectedRole)}`,
// // //         visibility
// // //       );
// // //       alert("Configuration saved successfully!");
// // //     } catch (e) {
// // //       alert("Failed to save configuration");
// // //     } finally {
// // //       setSaving(false);
// // //     }
// // //   };

// // //   const renderSection = (s) => (
// // //     <div key={s.id} className="border rounded mb-2">
// // //       <div className="flex items-center justify-between p-3 bg-gray-50">
// // //         <div className="flex items-center gap-3">
// // //           <input
// // //             ref={(el) => (parentRefs.current[s.id] = el)}
// // //             type="checkbox"
// // //             checked={!!visibility[s.id]}
// // //             onChange={(e) => onParentChange(s.id, e.target.checked)}
// // //             className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
// // //           />
// // //           <button
// // //             className="font-semibold text-sm text-left hover:text-blue-600"
// // //             onClick={() => toggleSection(s.id)}
// // //           >
// // //             {s.label}
// // //           </button>
// // //         </div>
// // //         <div className="text-xs text-gray-500">
// // //           {s.fields.length} fields
// // //         </div>
// // //       </div>
// // //       {expanded[s.id] && (
// // //         <div className="p-3 bg-white">
// // //           {s.fields.map((f) => (
// // //             <label key={f.id} className="flex items-center gap-2 text-sm py-1">
// // //               <input
// // //                 type="checkbox"
// // //                 checked={!!visibility[`${s.id}.${f.id}`]}
// // //                 onChange={(e) => onChildChange(s.id, f.id, e.target.checked)}
// // //                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
// // //               />
// // //               <span>{f.label}</span>
// // //             </label>
// // //           ))}
// // //         </div>
// // //       )}
// // //     </div>
// // //   );

// // //   return (
// // //     <div className="p-6 max-w-2xl mx-auto">
// // //       <h2 className="text-2xl font-bold mb-6">Configure Field Visibility</h2>
      
// // //       <div className="mb-6">
// // //         <label className="block text-sm font-medium mb-2">Current User Role</label>
// // //         <div className="p-3 bg-blue-50 border rounded-lg">
// // //           <span className="font-semibold text-blue-800">
// // //             {currentUserRole ? currentUserRole.toUpperCase() : "Unknown"}
// // //           </span>
// // //         </div>
// // //       </div>

// // //       <div className="mb-6 flex items-center gap-3">
// // //         <label className="text-sm font-medium">Configure for Role:</label>
// // //         <select
// // //           value={selectedRole}
// // //           onChange={(e) => setSelectedRole(e.target.value)}
// // //           className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
// // //           disabled={loading}
// // //         >
// // //           {roles.map((r) => (
// // //             <option key={r} value={r}>
// // //               {r}
// // //             </option>
// // //           ))}
// // //         </select>
// // //       </div>

// // //       <div className="mb-6">
// // //         <button
// // //           className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
// // //           onClick={save}
// // //           disabled={saving || loading}
// // //         >
// // //           {saving ? "Saving..." : "Save Configuration"}
// // //         </button>
// // //       </div>

// // //       {loading ? (
// // //         <div className="flex justify-center items-center p-8">
// // //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
// // //           <span className="ml-2 text-sm text-gray-600">Loading...</span>
// // //         </div>
// // //       ) : (
// // //         sections.map(renderSection)
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default ConfigureField;

// // import React, { useEffect, useState, useRef } from "react";
// // import axios from "axios";
// // import { backendUrl } from "./config";

// // // Updated sections to match ProjectBudgetStatus tabs
// // const projectBudgetSections = [
// //   {
// //     id: "dashboard",
// //     label: "Dashboard",
// //     fields: [{ id: "financials", label: "Financials" }],
// //     adminOnly: false,
// //   },
// //   {
// //     id: "hours",
// //     label: "Hours",
// //     fields: [{ id: "hoursDetails", label: "Hours Details" }],
// //     adminOnly: false,
// //   },
// //   {
// //     id: "amounts",
// //     label: "Other Cost",
// //     fields: [{ id: "amountsTable", label: "Amounts Table" }],
// //     adminOnly: false,
// //   },
// //   {
// //     id: "revenueAnalysis",
// //     label: "Revenue Details",
// //     fields: [{ id: "revenueTable", label: "Revenue Analysis" }],
    // adminOnly: true,
// //   },
// //   {
// //     id: "analysisByPeriod",
// //     label: "Monthly Forecast",
// //     fields: [{ id: "forecastTable", label: "Forecast Data" }],
// //     adminOnly: true,
// //   },
// //   {
// //     id: "plc",
// //     label: "Labor Categories",
// //     fields: [{ id: "plcComponent", label: "PLC Component" }],
// //     adminOnly: true,
// //   },
// //   {
// //     id: "revenueSetup",
// //     label: "Revenue Definition",
// //     fields: [{ id: "revenueSetup", label: "Revenue Setup" }],
// //     adminOnly: true,
// //   },
// //   {
// //     id: "revenueCeiling",
// //     label: "Adjustment",
// //     fields: [{ id: "revenueCeiling", label: "Revenue Ceiling" }],
// //     adminOnly: true,
// //   },
// //   {
// //     id: "funding",
// //     label: "Funding",
// //     fields: [{ id: "fundingComponent", label: "Funding" }],
// //     adminOnly: true,
// //   },
// //   {
// //     id: "warning",
// //     label: "Warning",
// //     fields: [{ id: "warningComponent", label: "Warnings" }],
// //     adminOnly: false,
// //   },
// // ];

// // const ConfigureField = () => {
// //   const [roles, setRoles] = useState(["Admin", "Manager", "Viewer"]);
// //   const [users, setUsers] = useState([]);          // all users
// //   const [selectedUserId, setSelectedUserId] = useState(""); // current user to configure
// //   const [selectedUserRole, setSelectedUserRole] = useState(""); // role of that user

// //   const [sections, setSections] = useState(projectBudgetSections);
// //   const [visibility, setVisibility] = useState({});
// //   const [expanded, setExpanded] = useState({});
// //   const [loading, setLoading] = useState(false);
// //   const [saving, setSaving] = useState(false);
// //   const parentRefs = useRef({});

// //   // Get current logged-in user role from localStorage (same as ProjectBudgetStatus)
// //   const [currentUserRole, setCurrentUserRole] = useState(null);

// //   useEffect(() => {
// //     const userString = localStorage.getItem("currentUser");
// //     if (userString) {
// //       try {
// //         const userObj = JSON.parse(userString);
// //         setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
// //       } catch {
// //         setCurrentUserRole(null);
// //       }
// //     }
// //   }, []);

// //   // Load roles + users metadata once
// //   useEffect(() => {
// //     const fetchMeta = async () => {
// //       try {
// //         const r = await axios.get(`${backendUrl}/Security/GetRoles`);
// //         if (Array.isArray(r.data) && r.data.length > 0) {
// //           setRoles(r.data);
// //         }
// //       } catch (e) {
// //         // keep default roles
// //       }

// //       try {
// //         // EXPECTED: [{ id, name, role }, ...] – adjust keys if your API differs
// //         const u = await axios.get(`${backendUrl}/Security/GetUsers`);
// //         if (Array.isArray(u.data) && u.data.length > 0) {
// //           setUsers(u.data);
// //           setSelectedUserId(String(u.data[0].id));
// //           setSelectedUserRole(u.data[0].role || "");
// //         }
// //       } catch (e) {
// //         // no users loaded
// //       }
// //     };

// //     fetchMeta();
// //   }, []);

// //   // When selectedUserId changes, sync selectedUserRole
// //   useEffect(() => {
// //     if (!selectedUserId) return;
// //     const user = users.find((u) => String(u.id) === String(selectedUserId));
// //     if (user) {
// //       setSelectedUserRole(user.role || "");
// //     }
// //   }, [selectedUserId, users]);

// //   // Load visibility for the selected user (not role)
// //   useEffect(() => {
// //     if (!selectedUserId) return;

// //     const load = async () => {
// //       setLoading(true);
// //       try {
// //         const res = await axios.get(
// //           `${backendUrl}/Configuration/GetVisibilityByUser/${encodeURIComponent(
// //             selectedUserId
// //           )}`
// //         );

// //         if (res.data) {
// //           setVisibility(res.data);
// //         } else {
// //           // Default: compute from user's role + adminOnly
// //           const defaultVis = {};
// //           const roleLower = (selectedUserRole || "").toLowerCase();
// //           sections.forEach((s) => {
// //             const isVisible =
// //               roleLower === "admin" || !s.adminOnly; // admin sees all, others hide adminOnly
// //             defaultVis[s.id] = isVisible;
// //             s.fields.forEach((f) => {
// //               defaultVis[`${s.id}.${f.id}`] = isVisible;
// //             });
// //           });
// //           setVisibility(defaultVis);
// //         }
// //       } catch (e) {
// //         // Fallback same default logic
// //         const defaultVis = {};
// //         const roleLower = (selectedUserRole || "").toLowerCase();
// //         sections.forEach((s) => {
// //           const isVisible =
// //             roleLower === "admin" || !s.adminOnly;
// //           defaultVis[s.id] = isVisible;
// //           s.fields.forEach((f) => {
// //             defaultVis[`${s.id}.${f.id}`] = isVisible;
// //           });
// //         });
// //         setVisibility(defaultVis);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     load();
// //   }, [selectedUserId, selectedUserRole, sections]);

// //   const toggleSection = (sectionId) => {
// //     setExpanded((prev) => ({
// //       ...prev,
// //       [sectionId]: !prev[sectionId],
// //     }));
// //   };

// //   const onParentChange = (sectionId, checked) => {
// //     const newVis = { ...visibility, [sectionId]: checked };
// //     const section = sections.find((s) => s.id === sectionId);
// //     if (section) {
// //       section.fields.forEach((f) => {
// //         newVis[`${sectionId}.${f.id}`] = checked;
// //       });
// //     }
// //     setVisibility(newVis);
// //   };

// //   const onChildChange = (sectionId, fieldId, checked) => {
// //     setVisibility((prev) => ({
// //       ...prev,
// //       [`${sectionId}.${fieldId}`]: checked,
// //     }));
// //   };

// //   // Save visibility FOR THIS USER
// //   const save = async () => {
// //     if (!selectedUserId) return;
// //     setSaving(true);
// //     try {
// //       await axios.put(
// //         `${backendUrl}/Configuration/UpdateVisibilityByUser/${encodeURIComponent(
// //           selectedUserId
// //         )}`,
// //         {
// //           userId: selectedUserId,
// //           role: selectedUserRole, // optional, if backend wants it
// //           visibility,
// //         }
// //       );
// //       alert("Configuration saved successfully!");
// //     } catch (e) {
// //       alert("Failed to save configuration");
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   const renderSection = (s) => (
// //     <div key={s.id} className="border rounded mb-2">
// //       <div className="flex items-center justify-between p-3 bg-gray-50">
// //         <div className="flex items-center gap-3">
// //           <input
// //             ref={(el) => (parentRefs.current[s.id] = el)}
// //             type="checkbox"
// //             checked={!!visibility[s.id]}
// //             onChange={(e) => onParentChange(s.id, e.target.checked)}
// //             className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
// //           />
// //           <button
// //             className="font-semibold text-sm text-left hover:text-blue-600"
// //             onClick={() => toggleSection(s.id)}
// //           >
// //             {s.label}
// //           </button>
// //         </div>
// //         <div className="text-xs text-gray-500">
// //           {s.fields.length} fields
// //         </div>
// //       </div>
// //       {expanded[s.id] && (
// //         <div className="p-3 bg-white">
// //           {s.fields.map((f) => (
// //             <label key={f.id} className="flex items-center gap-2 text-sm py-1">
// //               <input
// //                 type="checkbox"
// //                 checked={!!visibility[`${s.id}.${f.id}`]}
// //                 onChange={(e) => onChildChange(s.id, f.id, e.target.checked)}
// //                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
// //               />
// //               <span>{f.label}</span>
// //             </label>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );

// //   return (
// //     <div className="p-6 max-w-2xl mx-auto">
// //       <h2 className="text-2xl font-bold mb-6">Configure Field Visibility</h2>

// //       <div className="mb-4">
// //         <label className="block text-sm font-medium mb-2">
// //           Current Logged-in Role
// //         </label>
// //         <div className="p-3 bg-blue-50 border rounded-lg">
// //           <span className="font-semibold text-blue-800">
// //             {currentUserRole ? currentUserRole.toUpperCase() : "Unknown"}
// //           </span>
// //         </div>
// //       </div>

// //       {/* Select which user to configure */}
// //       <div className="mb-4 flex items-center gap-3 flex-wrap">
// //         <div>
// //           <label className="block text-sm font-medium mb-1">
// //             Configure for User:
// //           </label>
// //           <select
// //             value={selectedUserId}
// //             onChange={(e) => setSelectedUserId(e.target.value)}
// //             className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
// //             disabled={loading || users.length === 0}
// //           >
// //             {users.map((u) => (
// //               <option key={u.id} value={u.id}>
// //                 {u.name} ({u.role})
// //               </option>
// //             ))}
// //           </select>
// //         </div>

// //         <div>
// //           <label className="block text-sm font-medium mb-1">
// //             User Role
// //           </label>
// //           <input
// //             value={selectedUserRole || ""}
// //             readOnly
// //             className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
// //           />
// //         </div>
// //       </div>

// //       <div className="mb-6">
// //         <button
// //           className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 disabled:opacity-60"
// //           onClick={save}
// //           disabled={saving || loading || !selectedUserId}
// //         >
// //           {saving ? "Saving..." : "Save Configuration for User"}
// //         </button>
// //       </div>

// //       {loading ? (
// //         <div className="flex justify-center items-center p-8">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
// //           <span className="ml-2 text-sm text-gray-600">Loading...</span>
// //         </div>
// //       ) : (
// //         sections.map(renderSection)
// //       )}
// //     </div>
// //   );
// // };

// // export default ConfigureField;

//   import React, { useEffect, useState, useRef } from "react";
//   import axios from "axios";
//   import { PLC_PROJECT_COLUMNS, PLC_EMPLOYEE_COLUMNS, PLC_VENDOR_COLUMNS } from "./PLCComponent";
//   import { backendUrl } from "./config";
//   import { HOURS_EMPLOYEE_COLUMNS } from "./ProjectHoursDetails";
//   import { AMOUNTS_EMPLOYEE_COLUMNS } from "./ProjectAmountsTable";

//   // Sections for ConfigureField
//   const tableSections = [
//     {
//       id: "projectHours",
//       label: "Project Hours",
//       adminOnly: false,
//       fields: HOURS_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
//     },
//     {
//       id: "projectAmounts", 
//       label: "Project Amounts",
//       adminOnly: false,
//       fields: AMOUNTS_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
//     },
//     {
//       id: "revenueAnalysis",
//       label: "Revenue Details",
//       adminOnly: true,
//       fields: [
//         { id: "revenueAmount", label: "Revenue Amount" },
//         { id: "backlog", label: "Backlog" }
//       ],
//     },
//     {
//       id: "analysisByPeriod",
//       label: "Monthly Forecast", 
//       adminOnly: true,
//       fields: [
//         { id: "forecastTable", label: "Forecast Data" }
//       ],
//     },
//     {
//       id: "plcProject",
//       label: "PLC Project Rates",
//       adminOnly: true,
//       fields: PLC_PROJECT_COLUMNS.map(c => ({ id: c.key, label: c.label })),
//     },
//     {
//       id: "plcEmployee",
//       label: "PLC Employee Rates",
//       adminOnly: true,
//       fields: PLC_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
//     },
//     {
//       id: "plcVendor",
//       label: "PLC Vendor Rates",
//       adminOnly: true,
//       fields: PLC_VENDOR_COLUMNS.map(c => ({ id: c.key, label: c.label })),
//     },
//     {
//       id: "revenueSetup",
//       label: "Revenue Definition",
//       adminOnly: true,
//       fields: [
//         { id: "revenueSetup", label: "Revenue Setup" }
//       ],
//     },
//     {
//       id: "revenueCeiling",
//       label: "Adjustment",
//       adminOnly: true,
//       fields: [
//         { id: "revenueCeiling", label: "Revenue Ceiling" }
//       ],
//     },
//     {
//       id: "funding",
//       label: "Funding",
//       adminOnly: true,
//       fields: [
//         { id: "fundingAmount", label: "Funding Amount" },
//         { id: "modNumber", label: "Mod Number" }
//       ],
//     },
//     {
//       id: "warning",
//       label: "Warning",
//       adminOnly: false,
//       fields: [
//         { id: "warningComponent", label: "Warnings" }
//       ],
//     },
//   ];


//   // Detailed mapping of Tabs -> Table Headers
//   // const configurationMetadata = [
//   //   {
//   //     id: "hours",
//   //     label: "Hours Tab",
//   //     adminOnly: false,
//   //     fields: [
//   //       { id: "idType", label: "ID Type" },
//   //       { id: "emplId", label: "Employee ID" },
//   //       { id: "name", label: "Employee Name" },
//   //       { id: "acctId", label: "Account ID" },
//   //       { id: "orgId", label: "Organization" },
//   //       { id: "glcPlc", label: "PLC" },
//   //       { id: "perHourRate", label: "Hour Rate" },
//   //       { id: "total", label: "Total Cost" },
//   //     ],
//   //   },
//   //   {
//   //     id: "amounts",
//   //     label: "Other Cost Tab",
//   //     adminOnly: false,
//   //     fields: [
//   //       { id: "expenditureType", label: "Expenditure Type" },
//   //       { id: "itemDescription", label: "Description" },
//   //       { id: "amount", label: "Amount" },
//   //     ],
//   //   },
//   //   {
//   //     id: "revenueAnalysis",
//   //     label: "Revenue Details Tab",
//   //     adminOnly: true,
//   //     fields: [
//   //       { id: "revenueAmount", label: "Revenue Amount" },
//   //       { id: "backlog", label: "Backlog" },
//   //     ],
//   //   },
//   //   {
//   //     id: "plc",
//   //     label: "Labor Categories Tab",
//   //     adminOnly: true,
//   //     fields: [
//   //       { id: "plcCode", label: "PLC Code" },
//   //       { id: "description", label: "Description" },
//   //       { id: "billRate", label: "Bill Rate" },
//   //     ],
//   //   },
//   //   {
//   //     id: "funding",
//   //     label: "Funding Tab",
//   //     adminOnly: true,
//   //     fields: [
//   //       { id: "fundingAmount", label: "Funding Amount" },
//   //       { id: "modNumber", label: "Mod Number" },
//   //     ],
//   //   },
//   // ];

//   const ConfigureField = ({ externalSections } ) => {
//     const [users, setUsers] = useState([]);
//     const [selectedUserId, setSelectedUserId] = useState("");
//     const [visibility, setVisibility] = useState({}); // Stores { "hours": true, "hours.emplId": false }
//     const [expanded, setExpanded] = useState({});
//     const [loading, setLoading] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [sections, setSections] = useState(tableSections);
//     const parentRefs = useRef({});
  

//     // 1. Fetch Users on Load
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await axios.get(`${backendUrl}/api/User`);
//         if (res.data) {
//           setUsers(res.data);
//           if (res.data.length > 0) {
//             setSelectedUserId(String(res.data[0].userId)); // not .id
//           }
//         }
//       } catch (e) {
//         console.error("User fetch failed", e);
//       }
//     };
//     fetchUsers();
//   }, []);


//   const selectedUser = users.find(
//     (u) => String(u.userId) === String(selectedUserId)
//   );

//   const selectedUserLabel = selectedUser
//     ? `${selectedUser.userId} - ${selectedUser.username} (${selectedUser.fullName})`
//     : "";


//     // 2. Load Visibility when User Selection changes
//     useEffect(() => {
//       if (!selectedUserId) return;
//       const loadConfig = async () => {
//         setLoading(true);
//         try {
//           const res = await axios.get(`${backendUrl}/Configuration/GetVisibilityByUser/${selectedUserId}`);
//           setVisibility(res.data || {});
//         } catch (e) {
//           // Fallback: If no config exists, default to all visible
//           const defaultVis = {};
//           tableSections.forEach(tab => {
//             defaultVis[tab.id] = true;
//             tab.fields.forEach(f => defaultVis[`${tab.id}.${f.id}`] = true);
//           });
//           setVisibility(defaultVis);
//         } finally { setLoading(false); }
//       };
//       loadConfig();
//     }, [selectedUserId]);

//     const toggleTabVisibility = (tabId, checked) => {
//       const newVis = { ...visibility, [tabId]: checked };
//       // Also toggle all children (headers) automatically
//       const tab = tableSections.find(t => t.id === tabId);
//       tab.fields.forEach(f => newVis[`${tabId}.${f.id}`] = checked);
//       setVisibility(newVis);
//     };

//     const save = async () => {
//       setSaving(true);
//       try {
//         await axios.put(`${backendUrl}/Configuration/UpdateVisibilityByUser/${selectedUserId}`, {
//           userId: selectedUserId,
//           visibility
//         });
//         alert("Settings Saved!");
//       } catch (e) { alert("Save failed"); }
//       finally { setSaving(false); }
//     };

//     return (
//       <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
//         <h2 className="text-xl font-bold mb-4">User Access & Header Configuration</h2>
        
//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Select User to Configure:</label>
//           <select
//     className="border border-gray-300 rounded px-2 py-1 text-sm"
//     value={selectedUserId}
//     onChange={(e) => setSelectedUserId(e.target.value)}
//   >
//     {users.map((u) => (
//       <option key={u.userId} value={u.userId}>
//         {u.userId} - {u.username} ({u.fullName})
//       </option>
//     ))}
//   </select>
//         </div>

//         <div className="space-y-4">
//           {tableSections.map(tab => (
//             <div key={tab.id} className="border rounded-lg overflow-hidden">
//               {/* TAB LEVEL */}
//               <div className="flex items-center justify-between p-3 bg-gray-100 border-b">
//                 <div className="flex items-center gap-3">
//                   <input 
//                     type="checkbox" 
//                     checked={!!visibility[tab.id]} 
//                     onChange={(e) => toggleTabVisibility(tab.id, e.target.checked)}
//                     className="w-4 h-4"
//                   />
//                   <span className="font-bold text-gray-800">{tab.label}</span>
//                   {tab.adminOnly && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded">Admin Only</span>}
//                 </div>
//                 <button 
//                   onClick={() => setExpanded(prev => ({...prev, [tab.id]: !prev[tab.id]}))}
//                   className="text-blue-600 text-sm hover:underline"
//                 >
//                   {expanded[tab.id] ? "Hide Headers" : "Configure Headers"}
//                 </button>
//               </div>

//               {/* HEADER LEVEL */}
//               {expanded[tab.id] && (
//                 <div className="p-3 grid grid-cols-2 gap-2 bg-white">
//                   {tab.fields.map(field => (
//                     <label key={field.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
//                       <input 
//                         type="checkbox"
//                         disabled={!visibility[tab.id]} // Disable headers if tab is hidden
//                         checked={!!visibility[`${tab.id}.${field.id}`]}
//                         onChange={(e) => setVisibility(prev => ({...prev, [`${tab.id}.${field.id}`]: e.target.checked}))}
//                       />
//                       <span className={!visibility[tab.id] ? "text-gray-400" : ""}>{field.label}</span>
//                     </label>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         <button 
//           onClick={save}
//           disabled={saving || loading}
//           className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-400"
//         >
//           {saving ? "Saving..." : "Save Configuration"}
//         </button>
//       </div>
//     );
//   };

//   export default ConfigureField;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { PLC_PROJECT_COLUMNS, PLC_EMPLOYEE_COLUMNS, PLC_VENDOR_COLUMNS } from "./PLCComponent";
import { backendUrl } from "./config";
import { HOURS_EMPLOYEE_COLUMNS } from "./ProjectHoursDetails";
import { AMOUNTS_EMPLOYEE_COLUMNS } from "./ProjectAmountsTable";

// Table Headers Sections (existing)
const tableSections = [
  {
    id: "projectHours",
    label: "Project Hours",
    // adminOnly: false,
    fields: HOURS_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  },
  {
    id: "projectAmounts", 
    label: "Project Amounts",
    // adminOnly: false,
    fields: AMOUNTS_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  },
  {
    id: "revenueAnalysis",
    label: "Revenue Details",
    // adminOnly: true,
    fields: [
      { id: "revenueAmount", label: "Revenue Amount" },
      { id: "backlog", label: "Backlog" }
    ],
  },
  {
    id: "analysisByPeriod",
    label: "Monthly Forecast", 
    // adminOnly: true,
    fields: [
      { id: "forecastTable", label: "Forecast Data" }
    ],
  },
  {
    id: "plcProject",
    label: "PLC Project Rates",
    // adminOnly: true,
    fields: PLC_PROJECT_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  },
  {
    id: "plcEmployee",
    label: "PLC Employee Rates",
    // adminOnly: true,
    fields: PLC_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  },
  {
    id: "plcVendor",
    label: "PLC Vendor Rates",
    // adminOnly: true,
    fields: PLC_VENDOR_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  },
  {
    id: "revenueSetup",
    label: "Revenue Definition",
    // adminOnly: true,
    fields: [
      { id: "revenueSetup", label: "Revenue Setup" }
    ],
  },
  {
    id: "revenueCeiling",
    label: "Adjustment",
    // adminOnly: true,
    fields: [
      { id: "revenueCeiling", label: "Revenue Ceiling" }
    ],
  },
  {
    id: "funding",
    label: "Funding",
    // adminOnly: true,
    fields: [
      { id: "fundingAmount", label: "Funding Amount" },
      { id: "modNumber", label: "Mod Number" }
    ],
  },
  {
    id: "warning",
    label: "Warning",
    adminOnly: false,
    fields: [
      { id: "warningComponent", label: "Warnings" }
    ],
  },
];

// Navigation Sidebar Sections
const navigationSections = [
  {
    id: "planning",
    label: "Planning Menu",
    adminOnly: false,
    fields: [
      { id: "projectBudgetStatus", label: "Project Planning" },
      { id: "projectReport", label: "Reporting" },
      { id: "massUtility", label: "Mass Utility" },
      { id: "newBusiness", label: "New Business" }
    ],
  },
  {
    id: "configuration",
    label: "Configuration Menu",
    // adminOnly: true,
    fields: [
      { id: "poolRateTabs", label: "Forward Rate" },
      { id: "analogRate", label: "NBIs Analogous Rate" },
      { id: "accountMapping", label: "Account Mapping" },
      { id: "globalConfiguration", label: "Settings" }
    ],
  },
  {
    id: "poolMapping",
    label: "Pool Mapping",
    // adminOnly: true,
    fields: [
      { id: "poolConfiguration", label: "Org Account" },
      { id: "templatePoolMapping", label: "Template Pool Mapping" }
    ],
  },
  {
    id: "adminConfig",
    label: "Admin Config",
    // adminOnly: true,
    fields: [
      { id: "ceilingConfiguration", label: "Ceiling Configuration" },
      { id: "template", label: "Burden Setup" },
      { id: "prospectiveIdSetup", label: "Prospective ID Setup" },
      { id: "displaySettings", label: "Display Settings" },
      { id: "roleRights", label: "Configure Role Rights" },
      { id: "annualHolidays", label: "Annual Holidays" },
      { id: "fiscalYearPeriods", label: "Fiscal Year Periods" }
    ],
  },
];

const ConfigureField = ({ externalSections }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [visibility, setVisibility] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("tableHeaders"); // "tableHeaders" | "navigation"
  const [selectedUserIds, setSelectedUserIds] = useState([]);
const [userSearch, setUserSearch] = useState("");
// const [configMode, setConfigMode] = useState<"role" | "user">("user");
const [configMode, setConfigMode] = useState("user");
const [selectedUserRole,setSelectedUserRole] = useState("")

  const parentRefs = useRef({});


//   useEffect(() => {
//   if (configMode === "user") {
//     if (!selectedUserId) return;
//     const loadConfig = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `${backendUrl}Configuration/GetVisibilityByUser/${selectedUserId}`
//         );
//         setVisibility(res.data);
//       } catch (e) {
//         // default based on sections
//         const defaultVis: any = {};
//         getCurrentSections().forEach((tab) => {
//           defaultVis[tab.id] = !tab.adminOnly;
//           tab.fields.forEach((f) => {
//             defaultVis[`${tab.id}.${f.id}`] = !tab.adminOnly;
//           });
//         });
//         setVisibility(defaultVis);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadConfig();
//   } else {
//     if (!selectedUserRole) return;
//     const loadConfig = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `${backendUrl}Configuration/GetVisibilityByRole/${encodeURIComponent(
//             selectedUserRole
//           )}`
//         );
//         setVisibility(res.data);
//       } catch (e) {
//         const defaultVis: any = {};
//         const roleLower = selectedUserRole.toLowerCase();
//         getCurrentSections().forEach((tab) => {
//           const isVisible = roleLower === "admin" || !tab.adminOnly;
//           defaultVis[tab.id] = isVisible;
//           tab.fields.forEach((f) => {
//             defaultVis[`${tab.id}.${f.id}`] = isVisible;
//           });
//         });
//         setVisibility(defaultVis);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadConfig();
//   }
// }, [configMode, selectedUserId, selectedUserRole, activeTab]);

  // 1. Fetch Users on Load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/User`);
        if (res.data) {
          setUsers(res.data);
          if (res.data.length > 0) {
            setSelectedUserId(String(res.data[0].userId));
          }
        }
      } catch (e) {
        console.error("User fetch failed", e);
      }
    };
    fetchUsers();
  }, []);

  const selectedUser = users.find(
    (u) => String(u.userId) === String(selectedUserId)
  );

  const selectedUserLabel = selectedUser
    ? `${selectedUser.userId} - ${selectedUser.username} (${selectedUser.fullName})`
    : "";

  // Get current sections based on active tab
  const getCurrentSections = () => {
    return activeTab === "navigation" ? navigationSections : tableSections;
  };

  // 2. Load Visibility when User Selection changes
  useEffect(() => {
    if (!selectedUserId) return;
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/Configuration/GetVisibilityByUser/${selectedUserId}`);
        setVisibility(res.data || {});
      } catch (e) {
        // Fallback: Default visibility based on sections
        const defaultVis = {};
        getCurrentSections().forEach(tab => {
          defaultVis[tab.id] = !tab.adminOnly;
          tab.fields.forEach(f => defaultVis[`${tab.id}.${f.id}`] = !tab.adminOnly);
        });
        setVisibility(defaultVis);
      } finally { 
        setLoading(false); 
      }
    };
    loadConfig();
  }, [selectedUserId, activeTab]);

  const toggleTabVisibility = (tabId, checked) => {
    const newVis = { ...visibility, [tabId]: checked };
    // Also toggle all children headers automatically
    const tab = getCurrentSections().find(t => t.id === tabId);
    if (tab) {
      tab.fields.forEach(f => newVis[`${tab.id}.${f.id}`] = checked);
    }
    setVisibility(newVis);
  };

  const filteredUsers = users.filter(u => {
  const q = userSearch.trim().toLowerCase();
  if (!q) return true;
  return (
    String(u.userId).toLowerCase().includes(q) ||
    u.username?.toLowerCase().includes(q) ||
    u.fullName?.toLowerCase().includes(q)
  );
});

const allVisibleIds = filteredUsers.map(u => String(u.userId));
const isAllSelected =
  allVisibleIds.length > 0 &&
  allVisibleIds.every(id => selectedUserIds.includes(id));


 const save = async () => {
  setSaving(true);
  try {
    if (configMode === "user") {
      if (!selectedUserId) return;
      await axios.put(
        `${backendUrl}Configuration/UpdateVisibilityByUser/${selectedUserId}`,
        { userId: selectedUserId, visibility, configType: activeTab }
      );
    } else {
      if (!selectedUserRole) return;
      await axios.put(
        `${backendUrl}Configuration/UpdateVisibilityByRole/${encodeURIComponent(
          selectedUserRole
        )}`,
        { role: selectedUserRole, visibility, configType: activeTab }
      );
    }
    alert("Configuration saved successfully!");
  } catch (e) {
    alert("Failed to save configuration");
  } finally {
    setSaving(false);
  }
};

  const renderSection = (tab) => {
    const isVisible = !!visibility[tab.id];
    return (
      <div key={tab.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* TAB LEVEL */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <input 
              ref={el => { if (el) parentRefs.current[tab.id] = el; }}
              type="checkbox" 
              checked={isVisible} 
              onChange={(e) => toggleTabVisibility(tab.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-semibold text-gray-900 text-sm">{tab.label}</span>
              {/* {tab.adminOnly && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  Admin Only
                </span>
              )} */}
            </div>
          </div>
          <button 
            onClick={() => setExpanded(prev => ({...prev, [tab.id]: !prev[tab.id]}))}
            className="text-blue-600 text-sm hover:text-blue-700 font-medium hover:underline p-1 rounded"
          >
            {expanded[tab.id] ? "Hide Items" : `(${tab.fields.length}) Show Items`}
          </button>
        </div>

        {/* ITEMS LEVEL */}
        {expanded[tab.id] && (
          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tab.fields.map(field => {
                const fieldId = `${tab.id}.${field.id}`;
                return (
                  <label key={fieldId} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100">
                    <input 
                      type="checkbox"
                      disabled={!isVisible}
                      checked={!!visibility[fieldId]}
                      onChange={(e) => setVisibility(prev => ({...prev, [fieldId]: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-medium ${
                      !isVisible 
                        ? "text-gray-400 line-through" 
                        : visibility[fieldId] 
                          ? "text-gray-900" 
                          : "text-gray-600"
                    }`}>
                      {field.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 w-full mx-auto bg-white shadow-xl rounded-2xl">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Access Configuration</h2>
      </div>
      {/* User Selection */}
      {/* <div className="mb-8 p-6 bg-gray-50 rounded-xl border">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select User to Configure:
        </label>
        <select
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={loading}
        >
          {users.length === 0 ? (
            <option>No users loaded</option>
          ) : (
            users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.userId} - {u.username} ({u.fullName})
              </option>
            ))
          )}
        </select>
        {selectedUserLabel && (
          <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">{selectedUserLabel}</p>
        )}
      </div> */}
<div className="mb-4 flex gap-3 items-center">
  <span className="text-sm font-medium text-gray-700">Configure by:</span>
  <button
    type="button"
    onClick={() => setConfigMode("user")}
    className={`px-3 py-1.5 text-xs rounded border ${
      configMode === "user"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    User
  </button>
  <button
    type="button"
    onClick={() => setConfigMode("role")}
    className={`px-3 py-1.5 text-xs rounded border ${
      configMode === "role"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    Role
  </button>
</div>

{configMode === "user" ? (
      <div className="mb-2 p-4 bg-gray-50 rounded-xl border">
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    Select User(s) to Configure:
  </label>

  {/* Search + All + multi-select in one */}
  <div className="space-y-2">
    <input
      type="text"
      placeholder="Search by ID, username, or name..."
      value={userSearch}
      onChange={(e) => setUserSearch(e.target.value)}
      disabled={loading}
      className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />

    <div className="border-2 border-gray-300 rounded-xl max-h-56 overflow-y-auto bg-white">
      {/* All toggle */}
      <label className="flex items-center gap-2 px-4 py-2 border-b text-sm cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={isAllSelected}
          disabled={loading || filteredUsers.length === 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
            } else {
              setSelectedUserIds((prev) => prev.filter(id => !allVisibleIds.includes(id)));
            }
          }}
        />
        <span className="font-semibold">All (visible)</span>
      </label>

          <div className="max-h-30 overflow-y-auto">
      {users.length === 0 ? (
        <div className="px-4 py-2 text-xs text-gray-500">No users loaded</div>
      ) : filteredUsers.length === 0 ? (
        <div className="px-4 py-2 text-xs text-gray-500">No matches</div>
      ) : (
        filteredUsers.map((u) => {
          const id = String(u.userId);
          const checked = selectedUserIds.includes(id);
          return (
            <label
              key={id}
              className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={checked}
                disabled={loading}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUserIds((prev) => [...prev, id]);
                  } else {
                    setSelectedUserIds((prev) => prev.filter(x => x !== id));
                  }
                }}
              />
              <span>
                {u.userId} - {u.username} ({u.fullName})
              </span>
            </label>
          );
        })
      )}
    </div>
  </div>
  </div>  

  {selectedUserIds.length > 0 && (
    <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
      Selected: {selectedUserIds.join(", ")}
    </p>
  )}
</div>
): (<div className="mb-8 p-6 bg-gray-50 rounded-xl border">
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      Select Role to Configure:
    </label>
    <select
      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
      value={selectedUserRole}
      onChange={(e) => setSelectedUserRole(e.target.value)}
      disabled={loading}
    >
      {/* {roles.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))} */}
    </select>
  </div>
)}

   {/* Tab Switcher */}
      <div className="mb-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "tableHeaders"
                ? "bg-white shadow-sm text-blue-700 border-2 border-blue-200"
                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("tableHeaders")}
          >
            Table Headers
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "navigation"
                ? "bg-white shadow-sm text-blue-700 border-2 border-blue-200"
                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("navigation")}
          >
            Navigation Menu
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Loading configuration...
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4 mb-4">
        {getCurrentSections().map(renderSection)}
      </div>

      {/* Save Button */}

      <button 
        onClick={save}
        disabled={saving || loading || !selectedUserId}
        className="w-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-2 rounded-xl text-xs shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
            Saving...
          </>
        ) : (
          `Save ${activeTab === "navigation" ? "Navigation" : "Table"} Configuration`
        )}
      </button>
    </div>
  );
};

export default ConfigureField;
