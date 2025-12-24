import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { backendUrl } from "./config";
import { toast } from "react-toastify";

const UserOrgProjectMapping = () => {
  // Global lists
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);

  // Select options
  const [projectOptions, setProjectOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);

  // Selections per mode
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedUsersForProject, setSelectedUsersForProject] = useState([]);

  const [selectedUserIdForGroups, setSelectedUserIdForGroups] = useState("");
  const [selectedGroupsForUser, setSelectedGroupsForUser] = useState([]);

  const [selectedGroupIdForOrgs, setSelectedGroupIdForOrgs] = useState("");
  const [selectedOrgsForGroup, setSelectedOrgsForGroup] = useState([]);

  // UI state
  const [activeMainTab, setActiveMainTab] = useState("projectUsers"); // "projectUsers" | "userGroups" | "groupOrgs"
  const [searchTermUsers, setSearchTermUsers] = useState("");
  const [searchTermGroups, setSearchTermGroups] = useState("");
  const [searchTermOrgs, setSearchTermOrgs] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState(null);


   const getCurrentUserContext = () => {
  try {
    const userString = localStorage.getItem("currentUser");
    if (!userString) return { userId: "", role: "" };
    const userObj = JSON.parse(userString);
    return {
      userId: userObj.userId  ?? "",
      role: userObj.role ?? "",
    };
  } catch {
    return { userId: "", role: "" };
  }
};


  const { userId, role } = getCurrentUserContext();

  // ---------- Fetch base lists on mount ----------

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setProjectLoading(true);
        setUserLoading(true);
        setGroupLoading(true);
        setOrgLoading(true);

        // Projects
        const projRes = await fetch(`${backendUrl}/Project/GetAllProjectsByUser/${userId}
 `);
        if (!projRes.ok) throw new Error("Project fetch failed");
        const projData = await projRes.json();
        setProjects(projData);
        setProjectOptions(
          (projData || []).map((p) => ({
            value: p.projectId || p.id || "",
            label: `${p.name || p.projectName || "Unnamed"} - ${
              p.projectId || p.id || ""
            }`,
          }))
        );

        // Users
        const userRes = await axios.get(`${backendUrl}/api/User`);
        const userData = userRes.data || [];
        setUsers(userData);
        setUserOptions(
          userData.map((u) => ({
            value: u.userId,
            label: `${u.userId} - ${u.username || u.fullName || ""}`,
          }))
        );

        // ✅ Groups – use api/user-projects/GetGroups
       const groupsRes = await axios.get(
  `${backendUrl}/api/user-projects/GetGroups`
);
const groupData = groupsRes.data || [];
setGroups(groupData);
setGroupOptions(
  groupData.map((g) => ({
    value: g.orgGroupId,                       // ✅ correct ID
    label: `${g.orgGroupId} - ${g.orgGroupName || ""}`, // ✅ show id + name
  }))
);

        // Orgs
        const orgRes = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        const orgData = orgRes.data || [];
        setOrgs(orgData);
      } catch (e) {
        console.error("Base data fetch failed", e);
        setError("Failed to load initial data.");
      } finally {
        setProjectLoading(false);
        setUserLoading(false);
        setGroupLoading(false);
        setOrgLoading(false);
      }
    };

    fetchBaseData();
  }, []);

  // ---------- Mode 1: Project ↔ Users ----------

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedUsersForProject([]);
      return;
    }

    const fetchUsersForProject = async () => {
      setUserLoading(true);
      try {
        const mappedRes = await axios.get(
          `${backendUrl}/api/user-projects/users/${selectedProjectId}`
        );
        const mappedUsers = mappedRes.data || [];
        const mappedIds = Array.isArray(mappedUsers)
          ? mappedUsers.map((u) => (typeof u === "object" ? u.userId : u))
          : [];
        setSelectedUsersForProject(mappedIds);
      } catch (e) {
        console.error("Fetch mapped users for project failed", e);
        setSelectedUsersForProject([]);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUsersForProject();
  }, [selectedProjectId]);

  const filteredUsersForProject = users.filter((u) =>
    `${u.userId} ${u.username || ""} ${u.fullName || ""}`
      .toLowerCase()
      .includes(searchTermUsers.toLowerCase())
  );

  const toggleUserForProject = (userId) => {
    setSelectedUsersForProject((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const saveProjectUsers = async () => {
    if (!selectedProjectId) {
      // alert("Select a project first.");
      toast.warn("Select a project first.")
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/bulk-sync`,
        {
          projId: selectedProjectId,
          userIds: selectedUsersForProject,
        }
      );
      // alert("Project ↔ Users mapping updated.");
      toast.success("Project ↔ Users mapping updated.")

      const mappedRes = await axios.get(
        `${backendUrl}/api/user-projects/users/${selectedProjectId}`
      );
      const mappedUsers = mappedRes.data || [];
      const mappedIds = Array.isArray(mappedUsers)
        ? mappedUsers.map((u) => (typeof u === "object" ? u.userId : u))
        : [];
      setSelectedUsersForProject(mappedIds);
    } catch (e) {
      console.error("Save project-users failed", e);
      // alert("Failed to update project-users mapping.");
      toast.error("Failed to update project-users mapping.")
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 2: User ↔ Groups (fixed to use GetGroups) ----------

  useEffect(() => {
    if (!selectedUserIdForGroups) {
      setSelectedGroupsForUser([]);
      return;
    }

    const fetchGroupsForUser = async () => {
  setGroupLoading(true);
  try {
    // Get mapped groups for that user
    const res = await axios.get(
      `${backendUrl}/api/user-projects/Groups/${selectedUserIdForGroups}`
    );

    const mappedGroups = res.data || [];
    // mappedGroups = [{ orgGroupId: 2, userId: 1, ... }, ...]
    const mappedIds = Array.isArray(mappedGroups)
      ? mappedGroups.map((g) =>
          typeof g === "object" ? g.orgGroupId : g
        )
      : [];

    // All groups list already in state; just mark mappedIds as checked
    setSelectedGroupsForUser(mappedIds);
  } catch (e) {
    console.error("Fetch groups for user failed", e);
    setSelectedGroupsForUser([]);
  } finally {
    setGroupLoading(false);
  }
};


    fetchGroupsForUser();
  }, [selectedUserIdForGroups]);

  const filteredGroupsForUser = groups.filter((g) =>
  `${g.orgGroupId} ${g.orgGroupName || ""}`
    .toLowerCase()
    .includes(searchTermGroups.toLowerCase())
);


  const toggleGroupForUser = (orgGroupId) => {
  setSelectedGroupsForUser((prev) =>
    prev.includes(orgGroupId)
      ? prev.filter((id) => id !== orgGroupId)
      : [...prev, orgGroupId]
  );
};

  const saveUserGroups = async () => {
    if (!selectedUserIdForGroups) {
      // alert("Select a user first.");
      toast.warn("Select a user first.")
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/BulkSyncUsersGroups`,
        {
           userId: selectedUserIdForGroups,
    groupIds: selectedGroupsForUser,
        }
      );
      // alert("User ↔ Groups mapping updated.");
      toast.success("User ↔ Groups mapping updated.")

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Groups/${selectedUserIdForGroups}`
      );
     const mappedGroups = res.data || [];
const mappedIds = Array.isArray(mappedGroups)
  ? mappedGroups.map((g) =>
      typeof g === "object" ? g.orgGroupId : g
    )
  : [];
setSelectedGroupsForUser(mappedIds);
    } catch (e) {
      console.error("Save user-groups failed", e);
      // alert("Failed to update user-groups mapping.");
      toast.error("Failed to update user-groups mapping.")
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 3: Group ↔ Orgs ----------

  useEffect(() => {
    if (!selectedGroupIdForOrgs) {
      setSelectedOrgsForGroup([]);
      return;
    }

    const fetchOrgsForGroup = async () => {
      setOrgLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/user-projects/Orgs/${selectedGroupIdForOrgs}`
        );
        const mappedOrgs = res.data || [];
        const mappedIds = Array.isArray(mappedOrgs)
          ? mappedOrgs.map((o) => (typeof o === "object" ? o.orgId : o))
          : [];
        setSelectedOrgsForGroup(mappedIds);
      } catch (e) {
        console.error("Fetch orgs for group failed", e);
        setSelectedOrgsForGroup([]);
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrgsForGroup();
  }, [selectedGroupIdForOrgs]);

  const filteredOrgsForGroup = orgs.filter((o) =>
    `${o.orgId} ${o.orgName || ""}`
      .toLowerCase()
      .includes(searchTermOrgs.toLowerCase())
  );

  const toggleOrgForGroup = (orgId) => {
    setSelectedOrgsForGroup((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const saveGroupOrgs = async () => {
    if (!selectedGroupIdForOrgs) {
      // alert("Select a group first.");
      toast.warn("Select a group first.")
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/BulkSyncGroupOrgs`,
        {
          groupId: selectedGroupIdForOrgs,
          orgIds: selectedOrgsForGroup,
        }
      );
      // alert("Group ↔ Orgs mapping updated.");
      toast.success("Group ↔ Orgs mapping updated."

      )

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Orgs/${selectedGroupIdForOrgs}`
      );
      const mappedOrgs = res.data || [];
      const mappedIds = Array.isArray(mappedOrgs)
        ? mappedOrgs.map((o) => (typeof o === "object" ? o.orgId : o))
        : [];
      setSelectedOrgsForGroup(mappedIds);
    } catch (e) {
      console.error("Save group-orgs failed", e);
      // alert("Failed to update group-orgs mapping.");
      toast.error("Failed to update group-orgs mapping.")
    } finally {
      setLoading(false);
    }
  };

// sort
// AFTER filteredUsersForProject
const sortedUsersForProject = [...filteredUsersForProject].sort((a, b) => {
  const aSel = selectedUsersForProject.includes(a.userId);
  const bSel = selectedUsersForProject.includes(b.userId);
  if (aSel === bSel) return 0;
  return aSel ? -1 : 1; // selected first
});

// AFTER filteredGroupsForUser
const sortedGroupsForUser = [...filteredGroupsForUser].sort((a, b) => {
  const aSel = selectedGroupsForUser.includes(a.orgGroupId);
  const bSel = selectedGroupsForUser.includes(b.orgGroupId);
  if (aSel === bSel) return 0;
  return aSel ? -1 : 1;
});

// AFTER filteredOrgsForGroup
const sortedOrgsForGroup = [...filteredOrgsForGroup].sort((a, b) => {
  const aSel = selectedOrgsForGroup.includes(a.orgId);
  const bSel = selectedOrgsForGroup.includes(b.orgId);
  if (aSel === bSel) return 0;
  return aSel ? -1 : 1;
});


  // ---------- Render helpers (same as before, using new state) ----------

  const renderProjectUsersTab = () => (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project <span className="text-red-500">*</span>
        </label>
        <Select
          options={projectOptions}
          isLoading={projectLoading}
          value={
            selectedProjectId
              ? projectOptions.find((o) => o.value === selectedProjectId)
              : null
          }
          onChange={(opt) => setSelectedProjectId(opt ? opt.value : "")}
          isSearchable
          placeholder="Search & select a project"
        />
        {selectedProjectId && (
          <p className="mt-2 text-xs text-green-600">
            Selected project: <strong>{selectedProjectId}</strong>
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Users for project
          </h3>
          <span className="text-sm text-blue-600">
            {selectedUsersForProject.length} selected
          </span>
        </div>

        {selectedProjectId && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search users by ID, name..."
              value={searchTermUsers}
              onChange={(e) => setSearchTermUsers(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        )}

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-3 py-2 w-10 text-left text-gray-500 text-xs">
                  Select
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  User ID
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedProjectId ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a project to view users.
                  </td>
                </tr>
              ) : userLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsersForProject.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                sortedUsersForProject.map((u) => {
                  const selected = selectedUsersForProject.includes(u.userId);
                  return (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() => toggleUserForProject(u.userId)}
                        />
                      </td>
                      <td className="px-3 py-2">{u.userId}</td>
                      <td className="px-3 py-2">
                        {u.username || u.fullName || "-"}
                      </td>
                      <td className="px-3 py-2">{u.role || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveProjectUsers}
          disabled={!selectedProjectId || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update Project ↔ Users"}
        </button>
      </div>
    </>
  );

  const renderUserGroupsTab = () => (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User <span className="text-red-500">*</span>
        </label>
        <Select
          options={userOptions}
          isLoading={userLoading}
          value={
            selectedUserIdForGroups
              ? userOptions.find((o) => o.value === selectedUserIdForGroups)
              : null
          }
          onChange={(opt) =>
            setSelectedUserIdForGroups(opt ? opt.value : "")
          }
          isSearchable
          placeholder="Search & select a user"
        />
        {selectedUserIdForGroups && (
          <p className="mt-2 text-xs text-green-600">
            Selected user: <strong>{selectedUserIdForGroups}</strong>
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Groups for user
          </h3>
          <span className="text-sm text-blue-600">
            {selectedGroupsForUser.length} selected
          </span>
        </div>

        {selectedUserIdForGroups && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTermGroups}
              onChange={(e) => setSearchTermGroups(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        )}

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-3 py-2 w-10 text-left text-gray-500 text-xs">
                  Select
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Group ID
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Group Name
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedUserIdForGroups ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a user to view groups.
                  </td>
                </tr>
              ) : groupLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Loading groups...
                  </td>
                </tr>
              ) : filteredGroupsForUser.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No groups found.
                  </td>
                </tr>
              ) : (
                sortedGroupsForUser.map((g) => {
                   const selected = selectedGroupsForUser.includes(g.orgGroupId);
  return (
    <tr key={g.orgGroupId} className="hover:bg-gray-50">
      <td className="px-3 py-2">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={selected}
          onChange={() => toggleGroupForUser(g.orgGroupId)}
        />
      </td>
      <td className="px-3 py-2">{g.orgGroupId}</td>
      <td className="px-3 py-2">{g.orgGroupName || "-"}</td>
    </tr>
  );  
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveUserGroups}
          disabled={!selectedUserIdForGroups || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update User ↔ Groups"}
        </button>
      </div>
    </>
  );

  const renderGroupOrgsTab = () => (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group <span className="text-red-500">*</span>
        </label>
        <Select
          options={groupOptions}
          isLoading={groupLoading}
          value={
            selectedGroupIdForOrgs
              ? groupOptions.find((o) => o.value === selectedGroupIdForOrgs)
              : null
          }
          onChange={(opt) =>
            setSelectedGroupIdForOrgs(opt ? opt.value : "")
          }
          isSearchable
          placeholder="Search & select a group"
        />
        {selectedGroupIdForOrgs && (
          <p className="mt-2 text-xs text-green-600">
            Selected group: <strong>{selectedGroupIdForOrgs}</strong>
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Organizations for group
          </h3>
          <span className="text-sm text-blue-600">
            {selectedOrgsForGroup.length} selected
          </span>
        </div>

        {selectedGroupIdForOrgs && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTermOrgs}
              onChange={(e) => setSearchTermOrgs(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        )}

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-3 py-2 w-10 text-left text-gray-500 text-xs">
                  Select
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Org ID
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Org Name
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedGroupIdForOrgs ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a group to view organizations.
                  </td>
                </tr>
              ) : orgLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Loading organizations...
                  </td>
                </tr>
              ) : filteredOrgsForGroup.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                sortedOrgsForGroup.map((o) => {
                  const selected = selectedOrgsForGroup.includes(o.orgId);
                  return (
                    <tr key={o.orgId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() => toggleOrgForGroup(o.orgId)}
                        />
                      </td>
                      <td className="px-3 py-2">{o.orgId}</td>
                      <td className="px-3 py-2">
                        {o.orgName || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveGroupOrgs}
          disabled={!selectedGroupIdForOrgs || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update Group ↔ Orgs"}
        </button>
      </div>
    </>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-2">
        User, Group & Org Mapping
      </h2>
     
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "projectUsers"
              ? "bg-white shadow text-blue-700 border border-blue-300"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveMainTab("projectUsers")}
        >
          Project ↔ Users
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "userGroups"
              ? "bg-white shadow text-blue-700 border border-blue-300"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveMainTab("userGroups")}
        >
          User ↔ Groups
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "groupOrgs"
              ? "bg-white shadow text-blue-700 border border-blue-300"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveMainTab("groupOrgs")}
        >
          Group ↔ Orgs
        </button>
      </div>

      {activeMainTab === "projectUsers" && renderProjectUsersTab()}
      {activeMainTab === "userGroups" && renderUserGroupsTab()}
      {activeMainTab === "groupOrgs" && renderGroupOrgsTab()}
    </div>
  );
};

export default UserOrgProjectMapping;
