import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const POOL_ROWS = [
  { key: "fringe", label: "Fringe" },
  { key: "hr", label: "HR" },
  { key: "overhead", label: "Overhead" },
  { key: "materials", label: "M&H" },
  { key: "gna", label: "G&A" },
];

const ROW_HEIGHT_DEFAULT = 48;
const geistSansStyle = {
  fontFamily: "'Geist', 'Geist Fallback', sans-serif",
};

const ProjectPoolCosts = ({
  planId,
  startDate,
  endDate,
  fiscalYear,
  planType,
  hoursColumnTotals,   // from Hours screen: { "1_2025_cost": 45631.08, ... }
  otherColumnTotals,   // from Other Cost: { "1_2025": 800, ... }
}) => {
  const [durations, setDurations] = useState([]);
  const [aggregatedData, setAggregatedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const leftTableRef = useRef(null);
  const rightTableRef = useRef(null);
  const scrollingLock = useRef(false);

  const normalizedFiscalYear =
    fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();

  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    if (!scrollingLock.current) {
      scrollingLock.current = true;
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      setTimeout(() => {
        scrollingLock.current = false;
      }, 0);
    }
  };

  const handleLeftScroll = () => syncScroll(leftTableRef, rightTableRef);
  const handleRightScroll = () => syncScroll(rightTableRef, leftTableRef);

  const fetchAllData = async () => {
    if (!planId || !startDate || !endDate) return;
    setIsLoading(true);

    try {
      const durationRes = await axios.get(
        `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`
      );
      const durationData = Array.isArray(durationRes.data) ? durationRes.data : [];
      setDurations(durationData);

      const [empRes, directRes] = await Promise.all([
        axios.get(`${backendUrl}/Project/GetEmployeeForecastByPlanID/${planId}`),
        axios.get(`${backendUrl}/Project/GetDirectCostForecastDataByPlanId/${planId}`),
      ]);

      const poolMap = {};

      const ensureKey = (month, year) => {
        const key = `${month}_${year}`;
        if (!poolMap[key]) {
          poolMap[key] = {
            fringe: 0,
            overhead: 0,
            gna: 0,
            hr: 0,
            materials: 0,
            laborCost: 0,
            otherCost: 0,
          };
        }
        return key;
      };

      // HOURS (labor) – original indirect + labor logic preserved
      (Array.isArray(empRes.data) ? empRes.data : []).forEach((item) => {
        item.emple?.plForecasts?.forEach((f) => {
          const key = ensureKey(f.month, f.year);

          poolMap[key].laborCost += Number(f.forecastedCost || 0);

          poolMap[key].fringe += Number(f.fringe || 0);
          poolMap[key].overhead += Number(f.overhead || 0);
          poolMap[key].gna += Number(f.gna || 0);
          poolMap[key].hr += Number(f.hr || 0);
          poolMap[key].materials += Number(f.materials || 0);
        });
      });

      // OTHER COST – original indirect + other logic preserved
      (Array.isArray(directRes.data) ? directRes.data : []).forEach((item) => {
        item.empl?.plForecasts?.forEach((f) => {
          const key = ensureKey(f.month, f.year);

          const amountValue =
            planType === "EAC"
              ? (f.actualamt ?? f.forecastedamt)
              : f.forecastedamt;
          poolMap[key].otherCost += Number(amountValue || 0);

          poolMap[key].fringe += Number(f.fringe || 0);
          poolMap[key].overhead += Number(f.overhead || 0);
          poolMap[key].gna += Number(f.gna || 0);
          poolMap[key].hr += Number(f.hr || 0);
          poolMap[key].materials += Number(f.materials || 0);
        });
      });

      setAggregatedData(poolMap);
    } catch (err) {
      toast.error("Failed to load combined pool cost data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [planId, startDate, endDate]);

  const visibleDurations = useMemo(() => {
    return durations
      .filter(
        (d) =>
          normalizedFiscalYear === "All" ||
          d.year === parseInt(normalizedFiscalYear, 10)
      )
      .sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.monthNo - b.monthNo
      );
  }, [durations, normalizedFiscalYear]);

  // Footer totals: indirect from pools, hours+other from props
//   const columnTotals = useMemo(() => {
//     const totals = {};
//     visibleDurations.forEach((d) => {
//       const key = `${d.monthNo}_${d.year}`;
//       const data =
//         aggregatedData[key] || {
//           fringe: 0,
//           overhead: 0,
//           gna: 0,
//           hr: 0,
//           materials: 0,
//         };

//       const indirectTotal =
//         (data.fringe || 0) +
//         (data.overhead || 0) +
//         (data.gna || 0) +
//         (data.hr || 0) +
//         (data.materials || 0);

//       const hoursKey = `${d.monthNo}_${d.year}_cost`;
//       const hoursCost = Number(hoursColumnTotals?.[hoursKey] || 0);

//       const otherCost = Number(otherColumnTotals?.[key] || 0);

//       const projectTotal = indirectTotal + hoursCost + otherCost;

//       totals[key] = {
//         indirect: indirectTotal,
//         project: projectTotal,
//       };
//     });
//     return totals;
//   }, [visibleDurations, aggregatedData, hoursColumnTotals, otherColumnTotals]);
const columnTotals = useMemo(() => {
  const totals = {};
  visibleDurations.forEach((d) => {
    const key = `${d.monthNo}_${d.year}`;
    const data =
      aggregatedData[key] || {
        fringe: 0,
        overhead: 0,
        gna: 0,
        hr: 0,
        materials: 0,
      };

    const indirectTotal =
      (data.fringe || 0) +
      (data.overhead || 0) +
      (data.gna || 0) +
      (data.hr || 0) +
      (data.materials || 0);

    const hoursKey = `${d.monthNo}_${d.year}_cost`;
    const hoursCost = Number(hoursColumnTotals?.[hoursKey] || 0);

    const otherCost = Number(otherColumnTotals?.[key] || 0);

    const projectTotal = indirectTotal + hoursCost + otherCost;

    totals[key] = {
      indirect: indirectTotal,
      project: projectTotal,
    };
  });
  return totals;
}, [visibleDurations, aggregatedData, hoursColumnTotals, otherColumnTotals]);

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;

  return (
    <div
      style={geistSansStyle}
      className="relative p-4 font-inter w-full synchronized-tables-outer"
    >
      <div className="w-full flex justify-between mb-1 gap-2">
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span
            className="font-semibold text-md sm:text-sm blue-text"
            style={{ color: "#113d46" }}
          >
            Indirect Cost
          </span>
        </div>
      </div>

      <div className="border-line">
        <div className="synchronized-tables-container flex w-full overflow-hidden rounded-lg">
          {/* Left Table: Fixed Labels */}
          <div
            ref={leftTableRef}
            onScroll={handleLeftScroll}
            className="hide-scrollbar"
            style={{
              width: "180px",
              maxHeight: "400px",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <table className="table-fixed table min-w-full">
              <thead className="thead">
                <tr style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}>
                  <th className="th-thead px-4 text-center">Cost Pool</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {POOL_ROWS.map((row) => (
                  <tr
                    key={row.key}
                    style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}
                    className="border-b border-gray-100"
                  >
                    <td className="tbody-td px-4 text-center font-medium text-gray-700">
                      {row.label}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  className="bg-gray-100 font-bold"
                  style={{
                    height: `${ROW_HEIGHT_DEFAULT}px`,
                    position: "sticky",
                    bottom: 48,
                    zIndex: 20,
                  }}
                >
                  <td className="tbody-td px-4 text-center text-gray-800 border-t">
                    Total Indirect Cost
                  </td>
                </tr>
                <tr
                  className="bg-blue-50 font-bold"
                  style={{
                    height: `${ROW_HEIGHT_DEFAULT}px`,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 20,
                  }}
                >
                  <td className="tbody-td px-4 text-center text-blue-900 border-t">
                    Total Cost
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Right Table: Data (tbody logic unchanged) */}
          <div
            ref={rightTableRef}
            onScroll={handleRightScroll}
            className="flex-1"
            style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}
          >
            <table className="min-w-full table">
              <thead className="thead">
                <tr style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}>
                  {visibleDurations.map((d) => (
                    <th
                      key={`${d.monthNo}_${d.year}`}
                      className="th-thead min-w-[110px] text-center px-2"
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="whitespace-nowrap">{d.month}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tbody">
                {POOL_ROWS.map((row) => (
                  <tr
                    key={row.key}
                    style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}
                    className="hover:bg-blue-50 transition border-b border-gray-100"
                  >
                    {visibleDurations.map((d) => {
                      const key = `${d.monthNo}_${d.year}`;
                      return (
                        <td
                          key={`${key}-${row.key}`}
                          className="tbody-td text-center text-gray-600 px-2"
                        >
                          {(aggregatedData[key]?.[row.key] || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  className="bg-gray-100 font-bold text-center"
                  style={{
                    height: `${ROW_HEIGHT_DEFAULT}px`,
                    position: "sticky",
                    bottom: 48,
                    zIndex: 20,
                  }}
                >
                  {visibleDurations.map((d) => {
                    const key = `${d.monthNo}_${d.year}`;
                    return (
                      <td
                        key={`footer-ind-${key}`}
                        className="tbody-td text-gray-800 px-2 border-t"
                      >
                        {(columnTotals[key]?.indirect || 0).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr
                  className="bg-blue-50 font-bold text-center"
                  style={{
                    height: `${ROW_HEIGHT_DEFAULT}px`,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 20,
                  }}
                >
                  {visibleDurations.map((d) => {
                    const key = `${d.monthNo}_${d.year}`;
                    return (
                      <td
                        key={`footer-proj-${key}`}
                        className="tbody-td text-blue-900 px-2 border-t"
                      >
                        {(columnTotals[key]?.project || 0).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPoolCosts;
