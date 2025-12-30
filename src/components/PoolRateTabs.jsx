
import React, { useState } from "react";
import Fringe from "./Fringe";
import HR from "./HR";
import MH from "./MH";
import Overhead from "./Overhead";
import Rates from "./Rates";
import GNA from "./GNA";
import PoolRate from "./PoolRate";
import Template from "./Template";
import PoolConfigurationTable from "./PoolConfigurationTable";
import TemplateManager from "./Template";



const PoolRateTabs = () => {
  const [activeTab, setActiveTab] = useState("Rates");

  const tabs = [
    { id: "Template", label: "Add Template" },
    { id: "Rate Configure", label: "Rate Configure" },
    { id: "Rate", label: "Forecast Rate" },
    { id: "Fringe", label: "Fringe" },
    { id: "HR", label: "HR" },
    { id: "Overhead", label: "Overhead" },
    { id: "M&H", label: "M&H" },
    { id: "G&A", label: "G&A" },
    { id: "Base Setup", label: "Base Setup" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Rate Configure":
        return <PoolRate />;
      case "Fringe":
        return <Fringe />;
      case "HR":
        return <HR />;
      case "Overhead":
        return <Overhead />;
      case "M&H":
        return <MH />;
      case "G&A":
        return <GNA />;
      case "Rate":
        return <Rates />;
      case "Template":
        return (
          <>
            <TemplateManager />
          </>
        ); 
      case "Base Setup":
        return <PoolConfigurationTable />;
      default:
        return null;
    }
  };

  return (
    <div className="border-overall bg-white p-4 ml-5 w-full">
      {/* Header */}
      <div className="p-4 mb-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          Burden Rate
        </h2>
      </div>

      {/* Scrollable Tab Header */}
      <div className="w-full mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-medium shadow-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-white text-blue-700 border-2 border-blue-500 shadow-md"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content card with full width */}
      <div className="w-full min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PoolRateTabs;
