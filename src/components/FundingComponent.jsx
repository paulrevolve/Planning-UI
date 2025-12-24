import React, { useEffect, useState } from "react";
import { backendUrl } from "./config";

const FundingComponent = ({ selectedProjectId }) => {
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
      try {
        const response = await fetch(
          `${backendUrl}/Project/GetFunding/${selectedProjectId}`
        );
        let data = await response.json();

        const roundedData = data.slice(0, 3).map((item) => ({
          funding: roundTwoDecimals(item.funding),
          budget: roundTwoDecimals(item.budget),
          balance: roundTwoDecimals(item.balance),
          percent: roundTwoDecimals(item.percent),
        }));

        setFundingData([
          { label: "Cost Fee + Funding", ...roundedData[0] },
          { label: "Cost", ...roundedData[1] },
        ]);
      } catch (error) {
        setFundingData([
          {
            label: "Cost Fee + Funding",
            funding: "",
            budget: "",
            balance: "",
            percent: "",
          },
          { label: "Cost", funding: "", budget: "", balance: "", percent: "" },
          {
            funding: "",
            budget: "",
            balance: "",
            percent: "",
          },
        ]);
      }
    };

    if (selectedProjectId) {
      fetchData();
    }
  }, [selectedProjectId]);

  return (
    <div className="border-line overflow-hidden" style={geistSans}>
      <table className="w-full table">
        <thead className="thead">
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
    </div>
  );
};

export default FundingComponent;