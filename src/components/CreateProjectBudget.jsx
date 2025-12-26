import { BriefcaseBusiness, FolderKanban } from "lucide-react";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { backendUrl } from "./config";
import axios from "axios";
import { toast } from "react-toastify";

const formatDate = (date) => {
  if (!date) return "";
  return date.split("T")[0];
};

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div className="flex items-center gap-4">
    <label className="w-40 text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const CreateProjectBudget = () => {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [newBusiness, setNewBusiness] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [availableProjectForm, setAvailableProjectForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [newBusinessForm, setNewBusinessForm] = useState({
    description: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetch(`${backendUrl}/Project/GetAllProjects`)
      .then((res) => res.json())
      .then(setAvailableProjects);
  }, []);

  useEffect(() => {
    fetch(`${backendUrl}/GetAllNonTransferedNewBusinessAsync`)
      .then((res) => res.json())
      .then(setNewBusiness);
  }, []);

  const projectOptions = availableProjects.map((p) => ({
    value: p.projectId,
    label: `${p.projectId} - ${p.name}`,
  }));

  const businessOptions = newBusiness.map((b) => ({
    value: b.businessBudgetId,
    label: b.businessBudgetId,
  }));

  const handleTransfer = async () => {
    try {
      const payload = {
        businessBudgetId: selectedBusiness.businessBudgetId,
        description: newBusinessForm.description,
        startDate: newBusinessForm.startDate,
        endDate: newBusinessForm.endDate,
        orgId: selectedBusiness.orgId,
        accountGroup: selectedBusiness.accountGroup,
        burdenTemplateId: selectedBusiness.burdenTemplateId,
        escalationRate: selectedBusiness.escalationRate,
        level: selectedBusiness.level,
        version: selectedBusiness.version,
        versionCode: selectedBusiness.versionCode,
        isActive: selectedBusiness.isActive,
      };

      console.log(selectedProject.projectId)
      console.log(payload)

      const sourceProjectId = selectedProject.projectId
        .split(".")
        .slice(0, 2)
        .join(".");

      const response = await axios.post(
        `${backendUrl}/Project/AddPBudgetFromNewBussinessAsync`,
        payload,
        {
          params: {
            SourceProject: sourceProjectId,
          },
        }
      );


      toast.success("Transfer successful");
      console.log(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Transfer failed");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="p-4 rounded-sm flex items-center justify-between bg-white">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BriefcaseBusiness size={20} className="text-blue-600" />
          New Business Transfer Utility
        </h2>
      </div>

      <div className="bg-white rounded-sm p-6">
        <div className="grid grid-cols-2 gap-8 mt-2">
          <div>
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2 text-gray-700">
              New Business
            </h2>

            <div className="shadow-sm rounded-md p-4 space-y-4">
              <h2 className="flex items-center font-medium text-gray-700">
                Project Id
              </h2>
              <Select
                options={businessOptions}
                value={
                  selectedBusiness
                    ? {
                        value: selectedBusiness.businessBudgetId,
                        label: selectedBusiness.businessBudgetId,
                      }
                    : null
                }
                onChange={(o) => {
                  const business = newBusiness.find(
                    (b) => b.businessBudgetId === o?.value
                  );
                  setSelectedBusiness(business || null);
                  setNewBusinessForm({
                    description: business?.description || "",
                    startDate: formatDate(business?.startDate),
                    endDate: formatDate(business?.endDate),
                  });
                }}
                placeholder="Select Business ID"
              />

              <InputField
                label="Description"
                value={newBusinessForm.description}
                onChange={(e) =>
                  setNewBusinessForm({
                    ...newBusinessForm,
                    description: e.target.value,
                  })
                }
              />

              <InputField
                label="Start Date"
                type="date"
                value={newBusinessForm.startDate}
                onChange={(e) =>
                  setNewBusinessForm({
                    ...newBusinessForm,
                    startDate: e.target.value,
                  })
                }
              />

              <InputField
                label="End Date"
                type="date"
                value={newBusinessForm.endDate}
                onChange={(e) =>
                  setNewBusinessForm({
                    ...newBusinessForm,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2 text-gray-700">
              Available Projects
            </h2>

            <div className="shadow-sm rounded-md p-4 space-y-4">
              <h2 className="flex items-center font-medium text-gray-700">
                Project Id
              </h2>
              <Select
                options={projectOptions}
                value={
                  selectedProject
                    ? {
                        value: selectedProject.projectId,
                        label: `${selectedProject.projectId} - ${selectedProject.name}`,
                      }
                    : null
                }
                onChange={(o) => {
                  const project = availableProjects.find(
                    (p) => p.projectId === o?.value
                  );
                  setSelectedProject(project || null);
                  setAvailableProjectForm({
                    name: project?.name || "",
                    startDate: formatDate(project?.startDate),
                    endDate: formatDate(project?.endDate),
                  });
                }}
                placeholder="Select Project"
              />

              <InputField
                label="Project Name"
                value={availableProjectForm.name}
                onChange={(e) =>
                  setAvailableProjectForm({
                    ...availableProjectForm,
                    name: e.target.value,
                  })
                }
              />

              <InputField
                label="Start Date"
                type="date"
                value={availableProjectForm.startDate}
                onChange={(e) =>
                  setAvailableProjectForm({
                    ...availableProjectForm,
                    startDate: e.target.value,
                  })
                }
              />

              <InputField
                label="End Date"
                type="date"
                value={availableProjectForm.endDate}
                onChange={(e) =>
                  setAvailableProjectForm({
                    ...availableProjectForm,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="w-full flex justify-end mt-4">
          <button
            onClick={handleTransfer}
            className="btn1 btn-blue text-[16px]"
            disabled={!selectedBusiness || !selectedProject}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectBudget;
