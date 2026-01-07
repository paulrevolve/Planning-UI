import React, { useEffect, useState } from "react";
import { backendUrl } from "./config";

const FundingComponent = ({ selectedProjectId,selectedPlan }) => {
  const [fundingData, setFundingData] = useState([
    {
      label: "Cost Fee + Funding",
      funding: "",
      budget: "",
      balance: "",
      percent: "",
    },
    { label: "Cost", funding: "", budget: "", balance: "", percent: "" },
  ]);
const [loading,setLoading]= useState("false");

  // Font Styling consistent with your other components
  const geistSans = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

  useEffect(() => {
    const roundTwoDecimals = (num) => {
      if (num === null || num === undefined || num === "") return "";
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return "";
      return parsed.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };
    

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${backendUrl}/Project/GetFundingV1/${selectedProjectId}?plid=${selectedPlan}`
        );
        let data = await response.json();

        const roundedData = data.slice(0, 3).map((item) => ({
          funding: roundTwoDecimals(item.funding),
          budget: roundTwoDecimals(item.budget),
          balance: roundTwoDecimals(item.balance),
          percent: roundTwoDecimals(item.percent),
        }));

        setFundingData([
          { label: "Cost", ...roundedData[1] },
          { label: "Fee", ...roundedData[2] },
          { label: "Total Funding", ...roundedData[0] },
        ]);
        
      } catch (error) {
        setFundingData([
          {
            label: "Cost ",
            funding: "",
            budget: "",
            balance: "",
            percent: "",
          },
          { label: "Fee", funding: "", budget: "", balance: "", percent: "" },
            {
              label: "Total Funding",
              funding: "",
              budget: "",
              balance: "",
              percent: "",
            },
        ]);
         
      }
      finally{
        setLoading(false)
      }
    };

    if (selectedProjectId) {
      fetchData();
    }
  }, [selectedProjectId]);

  return (
    <div className="border border-gray-200 rounded overflow-hidden" style={geistSans}>
       {loading ? 
       (<div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 mt-2">
                        Loading...
                      </span>
                    </div>
       ) : (

      <table className="w-full table">
        <thead className="thead h-8">
          <tr>
            <th className="th-thead" style={geistSans}></th>
            <th className="th-thead" style={geistSans}>Funded</th>
            <th className="th-thead" style={geistSans}>Budget</th>
            <th className="th-thead" style={geistSans}>Balance</th>
            <th className="th-thead" style={geistSans}>Percent</th>
          </tr>
        </thead>
        <tbody className="tbody">
          {fundingData.map((row) => (
            <tr key={row.label}>
              <td className="tbody-td" style={geistSans}>{row.label}</td>
              <td className="tbody-td" style={geistSans}>{row.funding}</td>
              <td className="tbody-td" style={geistSans}>{row.budget}</td>
              <td className="tbody-td" style={geistSans}>{row.balance}</td>
              <td className="tbody-td" style={geistSans}>{row.percent}</td>
            </tr>
          ))}
        </tbody>
      </table>
  )}
    </div>
  );
};

export default FundingComponent;