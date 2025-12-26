"use client";
import React from 'react';

const IS_Report = () => {
  // Mock data - This structure allows for easy API integration later
  const reportData = {
    orgName: "SUMARIA SYSTEMS, LLC",
    reportTitle: "Income Statement Option 1",
    organization: "1 SUMARIA SYSTEMS, LLC",
    reportDate: "12/18/25",
    reportTime: "06:11 PM",
    periodRange: "10/01/25 - 10/31/25",
    
    sections: {
      revenue: {
        total: { period: 8453497.55, ytd: 74462470.14 }
      },
      directCosts: {
        items: [
          { label: "Sumaria Labor Onsite", period: -3575520.04, ytd: -32886603.10 },
          { label: "Sumaria ODC's", period: -13734.46, ytd: -193868.66 },
          { label: "Sumaria Travel", period: -185246.78, ytd: -1350732.10 },
          { label: "Subcontractors", period: -2076223.53, ytd: -15275258.41 },
        ],
        subtotal: { period: -5850724.81, ytd: -49706462.27 }
      },
      grossProfit: { period: 2602772.74, ytd: 24756007.87 },
      equipment: {
        items: [
          { label: "Income", period: 5003527.39, ytd: 27547605.49 },
          { label: "Expense", period: -4883443.51, ytd: -26888671.27 },
        ],
        subtotal: { period: 120083.88, ytd: 658934.22 }
      },
      netIncomeAfterEquip: { period: 2722856.62, ytd: 25414942.09 },
      costOfOps: {
        items: [
          { label: "Fringe Benefits", period: -1554597.73, ytd: -13007401.75 },
          { label: "Overhead", period: -244494.90, ytd: -2354574.10 },
          { label: "Material & Handling", period: -32144.71, ytd: -292425.55 },
          { label: "HR Service Center", period: -16117.76, ytd: -181151.72 },
          { label: "General & Admin", period: -492481.02, ytd: -5317223.72 },
          { label: "Unallocated Burden Allocations", period: 0.00, ytd: 0.00 },
        ],
        subtotal: { period: -2339836.12, ytd: -21152776.84 }
      },
      operatingMargin: { period: 383020.50, ytd: 4262165.25 },
      unallowable: {
        items: [{ label: "Unallowable Expenses", period: -441342.28, ytd: -3985569.85 }],
        subtotal: { period: -441342.28, ytd: -3985569.85 }
      },
      otherIncome: { period: -58321.78, ytd: 276595.40 },
      comprehensiveIncome: { period: -58321.78, ytd: 276595.40 }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Reusable Row Component
  const ReportRow = ({ label, period, ytd, isBold = false, indent = false }) => (
    <div className={`grid grid-cols-12 py-1 text-[14px] ${isBold ? 'font-bold' : 'font-normal'}`}>
      <div className={`col-span-6 ${indent ? 'pl-8' : ''}`}>{label}</div>
      <div className="col-span-3 text-right pr-16">{formatCurrency(period)}</div>
      <div className="col-span-3 text-right pr-8">{formatCurrency(ytd)}</div>
    </div>
  );

  // Reusable Subtotal/Line Component
  const SubtotalLine = ({ period, ytd }) => (
    <div className="grid grid-cols-12 pt-1 pb-3">
      <div className="col-span-6"></div>
      <div className="col-span-3 border-t border-black text-right pr-16 pt-1 text-[14px] font-medium">
        {formatCurrency(period)}
      </div>
      <div className="col-span-3 border-t border-black text-right pr-8 pt-1 text-[14px] font-medium">
        {formatCurrency(ytd)}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white p-6 md:p-10 text-gray-800 font-serif min-h-screen">
      {/* Top Banner */}
      <div className="bg-[#5B9BD5] text-white px-4 py-1.5 text-sm font-sans mb-8 w-full shadow-sm">
        Financial Statements Report - 1
      </div>

      {/* Responsive Wrapper to prevent content collapse */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          
          {/* Header Section */}
          <div className="text-center relative mb-10">
            <h1 className="text-2xl tracking-[0.25em] uppercase font-bold text-gray-900 mb-1">
              {reportData.orgName}
            </h1>
            <h2 className="text-3xl underline decoration-1 underline-offset-8 font-light italic text-gray-700 mb-4">
              {reportData.reportTitle}
            </h2>
            <div className="text-right absolute top-0 right-0 text-sm font-sans text-gray-600 leading-tight">
              <p>Page 1 of 1</p>
              <p>{reportData.reportDate}</p>
              <p>{reportData.reportTime}</p>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-800">
              Organization: {reportData.organization}
            </p>
          </div>

          <hr className="border-black border-t-2 mb-8" />

          {/* Date Range & YTD Headers */}
          <div className="grid grid-cols-12 mb-8">
            <div className="col-span-6"></div>
            <div className="col-span-3 px-4">
              <div className="bg-[#D9E1F2] text-center py-2 text-sm font-bold shadow-sm border border-blue-200">
                10/01/25<br />10/31/25
              </div>
            </div>
            <div className="col-span-3 px-4">
              <div className="bg-[#D9E1F2] h-full flex items-center justify-center text-sm font-bold shadow-sm border border-blue-200">
                Y-T-D
              </div>
            </div>
          </div>

          {/* REVENUE */}
          <div className="mb-6">
            <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Revenue</h3>
            <ReportRow label="Total Revenue" period={reportData.sections.revenue.total.period} ytd={reportData.sections.revenue.total.ytd} />
            <SubtotalLine period={reportData.sections.revenue.total.period} ytd={reportData.sections.revenue.total.ytd} />
          </div>

          {/* DIRECT COSTS */}
          <div className="mb-6">
            <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Direct Costs</h3>
            {reportData.sections.directCosts.items.map((item, idx) => (
              <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
            ))}
            <SubtotalLine period={reportData.sections.directCosts.subtotal.period} ytd={reportData.sections.directCosts.subtotal.ytd} />
          </div>

          {/* GROSS PROFIT */}
          <div className="mb-8 bg-gray-50 py-1">
            <ReportRow label="Gross Profit" period={reportData.sections.grossProfit.period} ytd={reportData.sections.grossProfit.ytd} isBold />
          </div>

          {/* EQUIPMENT PURCHASE */}
          <div className="mb-6">
            <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Equipment Purchase</h3>
            {reportData.sections.equipment.items.map((item, idx) => (
              <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
            ))}
            <SubtotalLine period={reportData.sections.equipment.subtotal.period} ytd={reportData.sections.equipment.subtotal.ytd} />
          </div>

          {/* NET INCOME AFTER EQUIP */}
          <div className="mb-8 bg-gray-50 py-1">
            <ReportRow label="Net Income After Equip. Margin" period={reportData.sections.netIncomeAfterEquip.period} ytd={reportData.sections.netIncomeAfterEquip.ytd} isBold />
          </div>

          {/* COST OF OPERATIONS */}
          <div className="mb-6">
            <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Cost of Operations</h3>
            {reportData.sections.costOfOps.items.map((item, idx) => (
              <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
            ))}
            <SubtotalLine period={reportData.sections.costOfOps.subtotal.period} ytd={reportData.sections.costOfOps.subtotal.ytd} />
          </div>

          {/* OPERATING MARGIN */}
          <div className="mb-8 bg-gray-50 py-1">
            <ReportRow label="Operating Margin" period={reportData.sections.operatingMargin.period} ytd={reportData.sections.operatingMargin.ytd} isBold />
          </div>

          {/* OTHER INCOME & EXPENSES */}
          <div className="mb-6">
            <h3 className="italic text-lg font-semibold border-b border-gray-300 mb-2">Other Income & Expenses</h3>
            {reportData.sections.unallowable.items.map((item, idx) => (
              <ReportRow key={idx} label={item.label} period={item.period} ytd={item.ytd} indent />
            ))}
            <SubtotalLine period={reportData.sections.unallowable.subtotal.period} ytd={reportData.sections.unallowable.subtotal.ytd} />
            <ReportRow label="Other Income & Expenses" period={reportData.sections.otherIncome.period} ytd={reportData.sections.otherIncome.ytd} isBold />
          </div>

          {/* COMPREHENSIVE INCOME (Double Underline) */}
          <div className="mt-6 border-t-2 border-black">
            <div className="grid grid-cols-12 pt-3 font-bold">
              <div className="col-span-6 text-base uppercase tracking-wider">Comprehensive Income</div>
              <div className="col-span-3 text-right pr-16 text-base">
                 <span className="border-b-[4px] border-double border-black pb-1">
                   {formatCurrency(reportData.sections.comprehensiveIncome.period)}
                 </span>
              </div>
              <div className="col-span-3 text-right pr-8 text-base">
                 <span className="border-b-[4px] border-double border-black pb-1">
                   {formatCurrency(reportData.sections.comprehensiveIncome.ytd)}
                 </span>
              </div>
            </div>
          </div>
          
          <div className="h-20" /> {/* Bottom spacer for better scrolling */}
        </div>
      </div>
    </div>
  );
};

export default IS_Report;