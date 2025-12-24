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

  const [selectedUserIdForOrgs, setSelectedUserIdForOrgs] = useState("");
  const [selectedOrgsForUser, setSelectedOrgsForUser] = useState([]);

  // UI state
  const [activeMainTab, setActiveMainTab] = useState("projectUsers");
  // "projectUsers" | "userGroups" | "groupOrgs" | "userOrgs"

  const [searchTermUsers, setSearchTermUsers] = useState("");
  const [searchTermGroups, setSearchTermGroups] = useState("");
  const [searchTermOrgs, setSearchTermOrgs] = useState("");
  const [searchTermUserOrgs, setSearchTermUserOrgs] = useState("");

  // Manage Groups form state
const [editingGroupId, setEditingGroupId] = useState(null);
const [groupCodeInput, setGroupCodeInput] = useState("");
const [groupNameInput, setGroupNameInput] = useState("");
const [groupDescription,setGroupDescription] = useState("")
const [groupFormLoading, setGroupFormLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------Manage Groups-----------

  const [selectedGroupIdsForDelete, setSelectedGroupIdsForDelete] = useState([]);

const toggleSelectedGroupForDelete = (id) => {
  setSelectedGroupIdsForDelete((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const areAllGroupsSelected = (list) =>
  list.length > 0 &&
  list.every((g) => selectedGroupIdsForDelete.includes(g.orgGroupId));

const toggleSelectAllGroups = (list) => {
  if (areAllGroupsSelected(list)) {
    setSelectedGroupIdsForDelete([]);
  } else {
    setSelectedGroupIdsForDelete(list.map((g) => g.orgGroupId));
  }
};


  const resetGroupForm = () => {
  setEditingGroupId(null);
  setGroupCodeInput("");
  setGroupNameInput("");
  setGroupDescription("");
};

const startEditGroup = (g) => {
  setEditingGroupId(g.orgGroupId);
  setGroupCodeInput(g.orgGroupCode || "");
  setGroupNameInput(g.orgGroupName || "");
  setGroupDescription(g.description || "");
};

const handleCreateOrUpdateGroup = async () => {
  if (!groupCodeInput.trim() || !groupNameInput.trim()) {
    toast.warn("Group code and name are required.");
    return;
  }

  try {
    setGroupFormLoading(true);

    if (editingGroupId == null) {
      // CREATE
      await axios.post(`${backendUrl}/api/user-projects/OrgGroups`, {
        orgGroupCode: groupCodeInput.trim(),
        orgGroupName: groupNameInput.trim(),
        description: groupDescription.trim(),
        isActive: true,
      });
      toast.success("Group created.");
    } else {
      // UPDATE
      await axios.put(
        `${backendUrl}/api/user-projects/OrgGroups/${editingGroupId}`,
        {
          orgGroupId: editingGroupId,
          orgGroupCode: groupCodeInput.trim(),
          orgGroupName: groupNameInput.trim(),
          description: groupDescription.trim(),
          isActive: true,
        }
      );
      toast.success("Group updated.");
    }

    // Refresh list
    const groupsRes = await axios.get(
  `${backendUrl}/api/user-projects/GetGroups`
);
const groupData = applyGroupSorting(groupsRes.data);
setGroups(groupData);
setGroupOptions(
  groupData.map((g) => ({
    value: g.orgGroupId,
    label: `${g.orgGroupId} - ${g.orgGroupName || ""}`,
  }))
);


    resetGroupForm();
  } catch (e) {
    console.error("Save group failed", e);
    // toast.error("Failed to save group.");
     const apiMessage =
    e?.response?.data?.message ||
    e?.response?.data?.title ||          // common for ASP.NET
    (typeof e?.response?.data === "string"
      ? e.response.data
      : null);

  if (apiMessage) {
    toast.error(apiMessage);            // e.g. "OrgGroupCode already exists."
  } else {
    toast.error("Failed to save group.");
  }
  } finally {
    setGroupFormLoading(false);
  }
};
 

const handleBulkDeleteGroups = async () => {
  if (selectedGroupIdsForDelete.length === 0) {
    toast.warn("Select at least one group to delete.");
    return;
  }
  if (!window.confirm(`Delete ${selectedGroupIdsForDelete.length} groups?`)) {
    return;
  }

  try {
    setGroupFormLoading(true);

    // ✅ single bulk call with array [1,2,...]
    await axios.post(
      `${backendUrl}/api/user-projects/OrgGroups/BulkDelete`,
      selectedGroupIdsForDelete
    );
    // if your API expects { ids: [...] } then:
    // await axios.post(`${backendUrl}/api/user-projects/OrgGroups/BulkDelete`, {
    //   ids: selectedGroupIdsForDelete,
    // });

    toast.success("Selected groups deleted.");

    const groupsRes = await axios.get(
      `${backendUrl}/api/user-projects/GetGroups`
    );
    const groupData = applyGroupSorting(groupsRes.data);
setGroups(groupData);
setGroupOptions(
  groupData.map((x) => ({
    value: x.orgGroupId,
    label: `${x.orgGroupId} - ${x.orgGroupName || ""}`,
  }))
);
    setSelectedGroupIdsForDelete([]);

    if (
      editingGroupId &&
      !groupData.some((g) => g.orgGroupId === editingGroupId)
    ) {
      resetGroupForm();
    }
  } catch (e) {
    console.error("Bulk delete groups failed", e);
    toast.error("Failed to delete selected groups.");
  } finally {
    setGroupFormLoading(false);
  }
};

//Sort new created at the top
const applyGroupSorting = (groupData) => {
  // assuming orgGroupId is incremental; use createdAt if you prefer
  return [...(groupData || [])].sort(
    (a, b) => (b.orgGroupId ?? 0) - (a.orgGroupId ?? 0)
    // or: (new Date(b.createdAt)) - (new Date(a.createdAt))
  );
};



  // ---------- Fetch base lists on mount ----------
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setProjectLoading(true);
        setUserLoading(true);
        setGroupLoading(true);
        setOrgLoading(true);

        // Projects
        const projRes = await fetch(`${backendUrl}/Project/GetAllProjects`);
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

        // Groups
        const groupsRes = await axios.get(
          `${backendUrl}/api/user-projects/GetGroups`
        );
        const groupData = groupsRes.data || [];
        setGroups(groupData);
        setGroupOptions(
          groupData.map((g) => ({
            value: g.orgGroupId,
            label: `${g.orgGroupId} - ${g.orgGroupName || ""}`,
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
  const sortedUsersForProject = [...filteredUsersForProject].sort((a, b) => {
    const aSel = selectedUsersForProject.includes(a.userId);
    const bSel = selectedUsersForProject.includes(b.userId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleUserForProject = (userId) => {
    setSelectedUsersForProject((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const saveProjectUsers = async () => {
    if (!selectedProjectId) {
      toast.warn("Select a project first.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${backendUrl}/api/user-projects/bulk-sync`, {
        projId: selectedProjectId,
        userIds: selectedUsersForProject,
      });
      toast.success("Project ↔ Users mapping updated.");

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
      toast.error("Failed to update project-users mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 2: User ↔ Groups ----------
  useEffect(() => {
    if (!selectedUserIdForGroups) {
      setSelectedGroupsForUser([]);
      return;
    }

    const fetchGroupsForUser = async () => {
      setGroupLoading(true);
      try {
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
  const sortedGroupsForUser = [...filteredGroupsForUser].sort((a, b) => {
    const aSel = selectedGroupsForUser.includes(a.orgGroupId);
    const bSel = selectedGroupsForUser.includes(b.orgGroupId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleGroupForUser = (orgGroupId) => {
    setSelectedGroupsForUser((prev) =>
      prev.includes(orgGroupId)
        ? prev.filter((id) => id !== orgGroupId)
        : [...prev, orgGroupId]
    );
  };

  const saveUserGroups = async () => {
    if (!selectedUserIdForGroups) {
      toast.warn("Select a user first.");
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
      toast.success("User ↔ Groups mapping updated.");

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
      toast.error("Failed to update user-groups mapping.");
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
          ? mappedOrgs.map((o) =>
              typeof o === "object" ? o.orgId : o
            )
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
  const sortedOrgsForGroup = [...filteredOrgsForGroup].sort((a, b) => {
    const aSel = selectedOrgsForGroup.includes(a.orgId);
    const bSel = selectedOrgsForGroup.includes(b.orgId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleOrgForGroup = (orgId) => {
    setSelectedOrgsForGroup((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const saveGroupOrgs = async () => {
    if (!selectedGroupIdForOrgs) {
      toast.warn("Select a group first.");
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
      toast.success("Group ↔ Orgs mapping updated.");

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Orgs/${selectedGroupIdForOrgs}`
      );
      const mappedOrgs = res.data || [];
      const mappedIds = Array.isArray(mappedOrgs)
        ? mappedOrgs.map((o) =>
            typeof o === "object" ? o.orgId : o
          )
        : [];
      setSelectedOrgsForGroup(mappedIds);
    } catch (e) {
      console.error("Save group-orgs failed", e);
      toast.error("Failed to update group-orgs mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 4: User ↔ Orgs ----------
  useEffect(() => {
    if (!selectedUserIdForOrgs) {
      setSelectedOrgsForUser([]);
      return;
    }

    const fetchOrgsForUser = async () => {
      setOrgLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/user-projects/Orgs/${selectedUserIdForOrgs}`
        );
        const mappedOrgs = res.data || [];
        const mappedIds = Array.isArray(mappedOrgs)
          ? mappedOrgs.map((o) =>
              typeof o === "object" ? o.orgId : o
            )
          : [];
        setSelectedOrgsForUser(mappedIds);
      } catch (e) {
        console.error("Fetch orgs for user failed", e);
        setSelectedOrgsForUser([]);
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrgsForUser();
  }, [selectedUserIdForOrgs]);

  const filteredOrgsForUser = orgs.filter((o) =>
    `${o.orgId} ${o.orgName || ""}`
      .toLowerCase()
      .includes(searchTermUserOrgs.toLowerCase())
  );
  const sortedOrgsForUser = [...filteredOrgsForUser].sort((a, b) => {
    const aSel = selectedOrgsForUser.includes(a.orgId);
    const bSel = selectedOrgsForUser.includes(b.orgId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleOrgForUser = (orgId) => {
    setSelectedOrgsForUser((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const saveUserOrgs = async () => {
    if (!selectedUserIdForOrgs) {
      toast.warn("Select a user first.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/BulkSyncUsersOrgs`,
        {
          userId: selectedUserIdForOrgs,
          orgIds: selectedOrgsForUser,
        }
      );
      toast.success("User ↔ Orgs mapping updated.");

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Orgs/${selectedUserIdForOrgs}`
      );
      const mappedOrgs = res.data || [];
      const mappedIds = Array.isArray(mappedOrgs)
        ? mappedOrgs.map((o) =>
            typeof o === "object" ? o.orgId : o
          )
        : [];
      setSelectedOrgsForUser(mappedIds);
    } catch (e) {
      console.error("Save user-orgs failed", e);
      toast.error("Failed to update user-orgs mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------Manage Groups------------
const renderManageGroupsTab = () => {
  const filteredGroups = groups.filter((g) =>
    `${g.orgGroupId} ${g.orgGroupCode || ""} ${g.orgGroupName || ""}`
      .toLowerCase()
      .includes(searchTermGroups.toLowerCase())
  );

  const allSelected = areAllGroupsSelected(filteredGroups);

  return (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {editingGroupId ? "Edit Group" : "Create Group"}
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Group Code
            </label>
            <input
              type="text"
              value={groupCodeInput}
              onChange={(e) => setGroupCodeInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Group code"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Group name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              type="text"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Description"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          {editingGroupId && (
            <button
              type="button"
              onClick={resetGroupForm}
              className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
              disabled={groupFormLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateOrUpdateGroup}
            className="px-5 py-2 text-sm rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
            disabled={groupFormLoading}
          >
            {groupFormLoading
              ? "Saving..."
              : editingGroupId
              ? "Update Group"
              : "Create Group"}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Existing Groups
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by id, code, name..."
              value={searchTermGroups}
              onChange={(e) => setSearchTermGroups(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
            />
            <button
              type="button"
              onClick={handleBulkDeleteGroups}
              className="px-4 py-2 text-xs rounded border border-red-500 text-red-600 disabled:opacity-50"
              disabled={groupFormLoading || selectedGroupIdsForDelete.length === 0}
            >
              Delete Selected ({selectedGroupIdsForDelete.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-3 py-2 text-left text-gray-500 text-xs w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={allSelected}
                    onChange={() => toggleSelectAllGroups(filteredGroups)}
                  />
                </th>
                {/* <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  ID
                </th> */}
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Code
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Description
                </th>
                <th className="px-3 py-2 text-right text-gray-500 text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No groups found.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => {
                  const selected = selectedGroupIdsForDelete.includes(
                    g.orgGroupId
                  );
                  return (
                    <tr key={g.orgGroupId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() =>
                            toggleSelectedGroupForDelete(g.orgGroupId)
                          }
                        />
                      </td>
                      {/* <td className="px-3 py-2">{g.orgGroupId}</td> */}
                      <td className="px-3 py-2">{g.orgGroupCode}</td>
                      <td className="px-3 py-2">{g.orgGroupName}</td>
                      <td className="px-3 py-2">{g.description}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditGroup(g)}
                          className="text-xs px-3 py-1 rounded border border-blue-500 text-blue-600"
                        >
                          Edit
                        </button>
                        {/* <button
                          type="button"
                          onClick={() => handleDeleteGroup(g)}
                          className="text-xs px-3 py-1 rounded border border-red-500 text-red-600"
                        >
                          Delete
                        </button> */}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};



  // ---------- Render helpers ----------
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
              ) : sortedUsersForProject.length === 0 ? (
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
              ) : sortedGroupsForUser.length === 0 ? (
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
                  const selected = selectedGroupsForUser.includes(
                    g.orgGroupId
                  );
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
                      <td className="px-3 py-2">
                        {g.orgGroupName || "-"}
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
              ) : sortedOrgsForGroup.length === 0 ? (
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

  const renderUserOrgsTab = () => (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User <span className="text-red-500">*</span>
        </label>
        <Select
          options={userOptions}
          isLoading={userLoading}
          value={
            selectedUserIdForOrgs
              ? userOptions.find((o) => o.value === selectedUserIdForOrgs)
              : null
          }
          onChange={(opt) =>
            setSelectedUserIdForOrgs(opt ? opt.value : "")
          }
          isSearchable
          placeholder="Search & select a user"
        />
        {selectedUserIdForOrgs && (
          <p className="mt-2 text-xs text-green-600">
            Selected user: <strong>{selectedUserIdForOrgs}</strong>
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Organizations for user
          </h3>
          <span className="text-sm text-blue-600">
            {selectedOrgsForUser.length} selected
          </span>
        </div>

        {selectedUserIdForOrgs && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTermUserOrgs}
              onChange={(e) => setSearchTermUserOrgs(e.target.value)}
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
              {!selectedUserIdForOrgs ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a user to view organizations.
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
              ) : sortedOrgsForUser.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                sortedOrgsForUser.map((o) => {
                  const selected = selectedOrgsForUser.includes(o.orgId);
                  return (
                    <tr key={o.orgId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() => toggleOrgForUser(o.orgId)}
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
          onClick={saveUserOrgs}
          disabled={!selectedUserIdForOrgs || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update User ↔ Orgs"}
        </button>
      </div>
    </>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow ml-5">
      <h2 className="text-2xl font-bold mb-2">
        User, Group & Org Mapping
      </h2>
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "projectUsers"
              ? "bg-white shadow text-blue-700 border border-blue-300 cursor-pointer"
              : "text-gray-700 hover:bg-gray-200 cursor-pointer"
          }`}
          onClick={() => setActiveMainTab("projectUsers")}
        >
          Project ↔ Users
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "userGroups"
              ? "bg-white shadow text-blue-700 border border-blue-300 cursor-pointer"
              : "text-gray-700 hover:bg-gray-200 cursor-pointer"
          }`}
          onClick={() => setActiveMainTab("userGroups")}
        >
          User ↔ Groups
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "groupOrgs"
              ? "bg-white shadow text-blue-700 border border-blue-300 cursor-pointer"
              : "text-gray-700 hover:bg-gray-200 cursor-pointer"
          }`}
          onClick={() => setActiveMainTab("groupOrgs")}
        >
          Group ↔ Orgs
        </button>
        {/* <button
          className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
            activeMainTab === "userOrgs"
              ? "bg-white shadow text-blue-700 border border-blue-300"
              : "text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveMainTab("userOrgs")}
        >
          User ↔ Orgs
        </button> */}
        <button
  className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
    activeMainTab === "manageGroups"
      ? "bg-white shadow text-blue-700 border border-blue-300 cursor-pointer"
      : "text-gray-700 hover:bg-gray-200 cursor-pointer"
  }`}
  onClick={() => setActiveMainTab("manageGroups")}
>
  Manage Groups
</button>

      </div>

      {activeMainTab === "projectUsers" && renderProjectUsersTab()}
      {activeMainTab === "userGroups" && renderUserGroupsTab()}
      {activeMainTab === "groupOrgs" && renderGroupOrgsTab()}
      {activeMainTab === "userOrgs" && renderUserOrgsTab()}
      {activeMainTab === "manageGroups" && renderManageGroupsTab()}
    </div>
  );
};

export default UserOrgProjectMapping;
