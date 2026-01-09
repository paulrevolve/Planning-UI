
// import React, { useState, useMemo, useEffect, useCallback } from 'react';
// import { FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// // CRITICAL FIX: Importing backendUrl as requested
// import { backendUrl } from "./config"; 

// // --- CONFIGURATION & UTILS ---
// const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
// const ROWS_PER_PAGE = 20; 

// const PERIOD_MAP = {
//     1: 'Jan-25', 2: 'Feb-25', 3: 'Mar-25', 4: 'Apr-25', 5: 'May-25', 6: 'Jun-25',
//     7: 'Jul-25', 8: 'Aug-25', 9: 'Sep-25', 10: 'Oct-25', 11: 'Nov-25', 12: 'Dec-25',
//     13: 'Jan-26', 14: 'Feb-26', 15: 'Mar-26', 16: 'Apr-26', 17: 'May-26', 18: 'Jun-26',
//     19: 'Jul-26', 20: 'Aug-26', 21: 'Sep-26', 22: 'Oct-26', 23: 'Nov-26', 24: 'Dec-26',
// };

// const MONTHLY_PERIODS = Object.values(PERIOD_MAP);
// const MOCK_TIME_PERIODS = [...MONTHLY_PERIODS, 'FY-Total'];

// // HELPER: Identify if a period is in the "Yellow Zone" (Nov-25 onwards)
// const isYellowZone = (period) => {
//     const index = MOCK_TIME_PERIODS.indexOf(period);
//     // Nov-25 is index 10 in the MOCK_TIME_PERIODS array
//     return index >= 10; 
// };

// const CLOSE_PERIODS = [
//     'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 
//     'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25'
// ];

// const GENERAL_COSTS = 'GENERAL-COSTS';

// const SECTION_LABELS = {
//     REVENUE_SECTION: ' Revenue (REVENUE)',
//     INDIRECT_SECTION: ' Indirect',
//     FRINGE: '1. Fringe',
//     OVERHEAD: '2. Overhead',
//     MANDH: '3. Mat & Handling',
//     GNA: '4. General & Admin',
//     LABOR: 'Sumaria Labor Onsite (LABOR)',
//     'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)',
//     'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)',
//     'NON-LABOR-SUBCON': 'Subcontractors (LABOR)',
//     'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)',
//     [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)', 
// };

// const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
// const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
// const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];

// // --- HARD-CODED ACCT_ID → SECTION MAPPING ---
// const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
// const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
// const TRAVEL_NONLABOR_ACCTS = new Set([
//     '50-400-000', '50-400-004', '50-400-008', '50-300-000', 
//     '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002', 
// ]);
// const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
// const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);

// // --- FORMATTING HELPERS ---
// const formatCurrency = (amount) => {
//     if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '-'; 
//     return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
// };

// const formatDate = (dateString) => {
//     if (!dateString) return '-';
//     const date = new Date(dateString.split('T')[0] || dateString);
//     if (isNaN(date)) return dateString; 
//     return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
// }

// const getRollupId = (projId) => {
//     if (!projId) return 'N/A';
//     const match = projId.match(/^(\d+)/);
//     return match ? match[1] : projId.split('.')[0];
// };

// const getPeriodKeyFromForecast = (month, year) => {
//     const yearSuffix = String(year).slice(-2);
//     const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     if (month < 1 || month > 12) return null;
//     const monthPrefix = monthPrefixes[month - 1];
//     return `${monthPrefix}-${yearSuffix}`;
// };

// // --- DATA TRANSFORMATION LOGIC ---
// const determineSectionAndIndirectKey = (item) => {
//     const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
//     const poolName = (item.poolName || '').toUpperCase();
    
//     let section = GENERAL_COSTS; 
//     let indirectKey = null;

//     if (subTotTypeNo === 1) {
//         section = 'REVENUE_SECTION';
//     } else if (subTotTypeNo === 4) {
//         if (poolName.includes('FRINGE BENEFITS')) {
//             indirectKey = 'FRINGE';
//         } else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) {
//             indirectKey = 'GNA';
//         } else if (poolName.includes('OVERHEAD')) {
//             indirectKey = 'OVERHEAD';
//         } else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) {
//             indirectKey = 'MANDH';
//         }
//         section = GENERAL_COSTS; 
//     } 
//     return { section, indirectKey, subTotTypeNo }; 
// };

// const classifyCostSection = (acctId, currentSection) => {
//     if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
//     if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
//     if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
//     if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
//     if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
//     return currentSection; 
// };

// const transformData = (detailData, forecastData) => {
//     const aggregatedDataMap = {}; 
//     const getForecastKey = (item) => `${item.projId}-${item.acctId}-0-0`; 
    
//     forecastData.forEach(item => {
//         const periodKey = getPeriodKeyFromForecast(item.month, item.year);
//         const detailRowKey = getForecastKey(item);
//         if (!periodKey) return; 

//         let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
//         let forecastSubTotTypeNo = 0; 
//         if (item.revenue !== undefined && item.revenue !== 0) {
//              forecastSection = 'REVENUE_SECTION';
//              forecastSubTotTypeNo = 1;
//         }

//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = {
//                 id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', 
//                 accountName: `Forecast: ${item.acctId}`, projectName: item.projName, 
//                 popStartDate: '', popEndDate: '', parentProject: null,
//                 section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'FY-Total': 0, 
//             };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         if (row.section === 'REVENUE_SECTION') {
//              row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
//         }
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) {
//             const costAmount = (item.cost || 0); 
//             if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; 
//         }
//         INDIRECT_KEYS.forEach(ik => {
//             const indirectAmount = (item[ik.toLowerCase()] || 0);
//             if (indirectAmount !== 0) {
//                 const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
//                 if (!aggregatedDataMap[indirectRowKey]) {
//                     aggregatedDataMap[indirectRowKey] = {
//                         id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', 
//                         accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, 
//                         popStartDate: '', popEndDate: '', parentProject: null,
//                         section: GENERAL_COSTS, subTotTypeNo: 4, 'FY-Total': 0, 
//                     };
//                 }
//                 aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
//             }
//         });
//     });

//     detailData.forEach(item => {
//         let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
//         if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
//         const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 
//         const periodKey = PERIOD_MAP[item.pdNo];
//         if (!periodKey) return; 

//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = {
//                 id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, 
//                 accountName: item.l1AcctName || item.poolName || 'Unknown Pool', 
//                 projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt,
//                 parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'FY-Total': 0, 
//             };
//         } else {
//             const row = aggregatedDataMap[detailRowKey];
//             row.accountName = item.l1AcctName || item.poolName || row.accountName;
//             row.popStartDate = item.projStartDt || row.popStartDate;
//             row.popEndDate = item.projEndDt || row.popEndDate;
//             row.section = section;
//             if (item.projName) row.projectName = item.projName;
//             row.subTotTypeNo = subTotTypeNo;
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         const monthlyAmount = (item.ptdIncurAmt || 0); 
//         if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
//         else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
//         else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
//     });
    
//     Object.values(aggregatedDataMap).forEach(row => {
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) {
//             let total = 0;
//             MONTHLY_PERIODS.forEach(period => { total += (row[period] || 0); });
//             row['FY-Total'] = total;
//         } else row['FY-Total'] = 0; 
//     });
//     return Object.values(aggregatedDataMap); 
// };

// // --- FORECAST REPORT COMPONENT ---
// const ForecastReport = () => {
//     const [projectSearchTerm, setProjectSearchTerm] = useState('');
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [apiData, setApiData] = useState([]); 
//     const [currentPage, setCurrentPage] = useState(1);

//     const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
//     const [expandedSections, setExpandedSections] = useState(initialExpandedState);
//     const [expandedProjects, setExpandedProjects] = useState({}); 

//     const toggleSection = useCallback((key) => {
//         setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
//     }, []);
    
//     const toggleProject = useCallback((projectId) => {
//         setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
//     }, []);

//     const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

//     const handleToggleAll = () => {
//         if (isAllExpanded) {
//             setExpandedSections(initialExpandedState);
//             setExpandedProjects({}); 
//         } else {
//             const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {});
//             setExpandedSections(allExpanded);
//         }
//     };

//     const fetchReportData = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         const DETAIL_URL = `${backendUrl}${DETAIL_API_PATH}`;
//         const FORECAST_URL = `${backendUrl}${FORECAST_API_PATH}`; 
//         try {
//             const [detailResponse, forecastResponse] = await Promise.all([fetch(DETAIL_URL), fetch(FORECAST_URL)]);
//             if (!detailResponse.ok) throw new Error(`Detail API failed: ${detailResponse.statusText}`);
//             const detailData = await detailResponse.json();
//             const forecastData = forecastResponse.ok ? await forecastResponse.json() : [];
//             const transformedRows = transformData(detailData, forecastData);
//             if (transformedRows.length === 0) setError("Zero relevant rows found."); 
//             else setError(null);
//             setApiData(transformedRows);
//         } catch (e) {
//             setApiData([]);
//             setError(`Data load failed: ${e.message}`);
//         } finally { setLoading(false); }
//     }, []);

//     useEffect(() => { fetchReportData(); }, [fetchReportData]); 

//     const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
//         const lowerCaseSearch = projectSearchTerm.toLowerCase();
//         const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
//         const rollupGroup = {};
//         const allProjectRows = [];
//         const ALL_SECTION_KEYS = [...DISPLAYED_SECTION_KEYS, GENERAL_COSTS];

//         filtered.forEach(item => {
//             const rollupId = getRollupId(item.project);
//             let groupKey;
//             let groupSection = item.section;
//             const isRevenueRow = item.section === 'REVENUE_SECTION';

//             if (isRevenueRow) { groupKey = `${rollupId}__REVENUE_SECTION`; groupSection = 'REVENUE_SECTION'; }
//             else if (ALL_SECTION_KEYS.includes(item.section)) { groupKey = `${rollupId}__${item.section}`; groupSection = item.section; }
//             else return; 
            
//             allProjectRows.push(item);
//             if (!rollupGroup[groupKey]) {
//                 rollupGroup[groupKey] = {
//                     id: groupKey, project: rollupId, org: item.org || item.orgId || '', acctId: null, 
//                     popStartDate: item.popStartDate || item.proj_start_dt || '', popEndDate: item.popEndDate || item.proj_end_dt || '',
//                     isRollupParent: true, 'FY-Total': 0, section: groupSection, children: [],
//                 };
//             }
//             const parent = rollupGroup[groupKey];
//             parent.children.push(item);
//             MONTHLY_PERIODS.forEach(period => {
//                 if (!isRevenueRow && item.section !== 'REVENUE_SECTION') {
//                     if (item[period] !== undefined) parent[period] = (parent[period] || 0) + (item[period] || 0);
//                     INDIRECT_KEYS.forEach(ik => {
//                         if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0);
//                     });
//                 }
//                 if (item[`${period}_Revenue`] !== undefined) parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
//             });
//             if (!isRevenueRow) parent['FY-Total'] += (item['FY-Total'] || 0);
//         });
        
//         const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project) || a.section.localeCompare(b.section));
//         const uniqueProjectKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
//         const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
//         const paginatedProjectKeys = uniqueProjectKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
//         const paginatedRollups = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);

//         return { allRows: allProjectRows, uniqueProjectKeys, paginatedRollups };
//     }, [apiData, projectSearchTerm, currentPage]); 

//     const dimensionHeaders = [
//         { key: 'project', label: 'PROJECT', width: '150px' },
//         { key: 'projectName', label: 'PROJECT NAME', width: '260px' },
//         { key: 'org', label: 'ORG', width: '120px' },
//         { key: 'accountID', label: 'ACCOUNT ID', width: '140px' },
//         { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' },
//         { key: 'popStartDate', label: 'POP START DATE', width: '140px' },
//         { key: 'popEndDate', label: 'POP END DATE', width: '140px' },
//     ];
    
//     const monthlyColWidth = 150;
//     const stickyPositions = useMemo(() => {
//         let currentPos = 0;
//         const positions = {};
//         dimensionHeaders.forEach((header, index) => {
//             positions[header.key] = { left: currentPos, zIndex: 20 + dimensionHeaders.length - index };
//             currentPos += parseInt(header.width);
//         });
//         return positions;
//     }, [dimensionHeaders]); 

//     const totalContentWidth = useMemo(() => dimensionHeaders.reduce((sum, h) => sum + parseInt(h.width), 0) + (MOCK_TIME_PERIODS.length * monthlyColWidth), [dimensionHeaders]); 
//     const lastStickyKey = dimensionHeaders[dimensionHeaders.length - 1].key;
    
//     const { sectionTotals, grandCostTotal, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys } = useMemo(() => {
//         const sectionTotals = {}; const grandCostTotal = {}; const grandRevenueTotal = {}; const grandIndirectComponents = {};
//         const PERIODS = MOCK_TIME_PERIODS; 

//         DISPLAYED_SECTION_KEYS.forEach(key => {
//             const sectionRows = allRows.filter(row => row.section === key && row.section !== 'REVENUE_SECTION');
//             sectionTotals[key] = {};
//             PERIODS.forEach(period => {
//                 const costSum = sectionRows.reduce((acc, row) => (row[period] !== undefined ? acc + row[period] : acc), 0);
//                 if (costSum !== 0) { sectionTotals[key][period] = costSum; grandCostTotal[period] = (grandCostTotal[period] || 0) + costSum; }
//             });
//         });

//         const revenueRows = allRows.filter(row => row.section === 'REVENUE_SECTION');
//         PERIODS.forEach(period => {
//             const revenueSum = revenueRows.reduce((acc, row) => (row[`${period}_Revenue`] !== undefined ? acc + row[`${period}_Revenue`] : acc), 0);
//             if (revenueSum !== 0) grandRevenueTotal[period] = (grandRevenueTotal[period] || 0) + revenueSum; 
//         });

//         const indirectRows = allRows.filter(row => INDIRECT_KEYS.some(k => PERIODS.some(p => row[`${p}_${k}`] !== undefined)));
//         PERIODS.forEach(period => {
//              INDIRECT_KEYS.forEach(indirectKey => {
//                 const indirectSum = indirectRows.reduce((acc, row) => (row[`${period}_${indirectKey}`] !== undefined ? acc + row[`${period}_${indirectKey}`] : acc), 0);
//                 if (indirectSum !== 0) {
//                     if (!grandIndirectComponents[indirectKey]) grandIndirectComponents[indirectKey] = {};
//                     grandIndirectComponents[indirectKey][period] = (grandIndirectComponents[indirectKey][period] || 0) + indirectSum;
//                 }
//             });
//         });
        
//         const grandIndirectTotal = {};
//         PERIODS.forEach(period => {
//             const indirectTotal = INDIRECT_KEYS.reduce((sum, key) => sum + (grandIndirectComponents[key]?.[period] || 0), 0);
//             if (indirectTotal !== 0) { grandIndirectTotal[period] = indirectTotal; grandCostTotal[period] = (grandCostTotal[period] || 0) + indirectTotal; }
//         });
        
//         const finalIndirectKeys = Object.keys(grandIndirectComponents).filter(key => PERIODS.some(p => grandIndirectComponents[key][p] > 0));
//         return { sectionTotals, grandCostTotal, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys };
//     }, [allRows]); 

//     const totalRollupPages = Math.ceil(uniqueProjectKeys.length / ROWS_PER_PAGE); 
//     const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= totalRollupPages) setCurrentPage(newPage); };

//     // UPDATED: Dynamic Background Logic for Summary Rows
//     const renderTotalRow = (sectionKey, totalData, isGrandTotal = false, isRevenueOrIndirect = false) => {
//         const totalLabel = SECTION_LABELS[sectionKey];
//         const rowClass = isGrandTotal ? 'grand-total-row' : (isRevenueOrIndirect ? 'revenue-indirect-row' : 'section-total-row');
//         const zIndex = isGrandTotal ? 40 : (isRevenueOrIndirect ? 35 : 25); 
//         const dataKeySuffix = sectionKey === 'REVENUE_SECTION' ? '_Revenue' : (INDIRECT_KEYS.includes(sectionKey) ? `_${sectionKey}` : '');

//         return (
//             <tr key={sectionKey} className={rowClass} onClick={!isGrandTotal ? () => toggleSection(sectionKey) : undefined} style={{ cursor: !isGrandTotal ? 'pointer' : 'default' }}>
//                 {dimensionHeaders.map((header) => (
//                     <th 
//                         key={header.key}
//                         className={`px-3 py-2 text-left text-sm font-extrabold sticky left-0 ${rowClass}-sticky ${header.key === lastStickyKey ? 'last-sticky-col-border' : ''}`}
//                         style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: zIndex }}
//                     >
//                         {header.key === 'project' ? (isGrandTotal ? 'GRAND TOTAL' : <FaCaretRight className={`w-3 h-3 transition-transform ${expandedSections[sectionKey] ? 'rotate-90' : ''}`} />) : (header.key === 'projectName' ? totalLabel : '')}
//                     </th>
//                 ))}
//                 {MOCK_TIME_PERIODS.map(period => {
//                     const yellow = isYellowZone(period);
//                     return (
//                         <th 
//                             key={period} 
//                             className={`px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-extrabold ${period === 'FY-Total' ? 'fy-total-col' : ''}`}
//                             style={{ 
//                                 backgroundColor: yellow ? '#FEF9C3' : '', // Light Yellow
//                                 color: yellow ? '#1F2937' : 'white'      // Dark text for yellow, white for green
//                             }}
//                         >
//                             {formatCurrency(totalData[`${period}${dataKeySuffix}`] || totalData[period])}
//                         </th>
//                     );
//                 })}
//             </tr>
//         );
//     };

//     const renderBreakdownStickyCells = (item, isRevenueBreakdown, breakdownKey, isRollupParent = false) => {
//         return dimensionHeaders.map((header) => {
//             const isLastSticky = header.key === lastStickyKey;
//             let cellContent = ''; let paddingLeft = '12px';

//             if (isRevenueBreakdown) {
//                 if (header.key === 'project') {
//                     cellContent = item.project;
//                     if (item.isRollupParent) {
//                         return (
//                             <td key={header.key} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left last-sticky-col-border`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: stickyPositions[header.key].zIndex, cursor: 'pointer', paddingLeft: '12px', backgroundColor: 'white' }} onClick={() => toggleProject(`REV_${item.project}`)}>
//                                 <div className="flex items-center space-x-1">
//                                     <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} />
//                                     <span>{item.project}</span>
//                                 </div>
//                             </td>
//                         );
//                     }
//                     paddingLeft = '35px';
//                 } else if (header.key === 'projectName') cellContent = item.projectName;
//                 else if (header.key === 'org') cellContent = item.org;
//                 else if (header.key === 'accountID') cellContent = item.acctId;
//                 else if (header.key === 'accountName') cellContent = item.accountName;
//                 else if (header.key === 'popStartDate') cellContent = formatDate(item.popStartDate);
//                 else if (header.key === 'popEndDate') cellContent = formatDate(item.popEndDate);
//             }
//             else if (item) {
//                 if (header.key === 'project') {
//                     cellContent = item.project;
//                     paddingLeft = item.isRollupParent ? '12px' : '35px'; 
//                     if (item.isRollupParent && item.children && item.children.length > 0) {
//                         return (
//                             <td key={header.key} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left ${isLastSticky ? 'last-sticky-col-border' : ''} ${item.isRollupParent ? 'rollup-parent-row-sticky' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: stickyPositions[header.key].zIndex, cursor: 'pointer', paddingLeft: paddingLeft, backgroundColor: 'white' }} onClick={() => toggleProject(item.project)}>
//                                 <div className="flex items-center space-x-1">
//                                     <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} />
//                                     <span>{cellContent}</span>
//                                 </div>
//                             </td>
//                         );
//                     }
//                 } else if (header.key === 'projectName') cellContent = item.projectName;
//                 else if (header.key === 'org') cellContent = item.org;
//                 else if (header.key === 'accountID') cellContent = item.acctId || item.accountID;
//                 else if (header.key === 'accountName') cellContent = item.accountName;
//                 else if (header.key === 'popStartDate') cellContent = formatDate(item.popStartDate);
//                 else if (header.key === 'popEndDate') cellContent = formatDate(item.popEndDate);
//             }
//             else if (breakdownKey && header.key === 'project') { cellContent = SECTION_LABELS[breakdownKey]; paddingLeft = '25px'; }

//             return (
//                 <td key={header.key} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left ${isLastSticky ? 'last-sticky-col-border' : ''} ${isRollupParent ? 'rollup-parent-row-sticky' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: stickyPositions[header.key].zIndex, paddingLeft: paddingLeft, backgroundColor: isRollupParent ? '#e5e7eb' : 'white' }}>
//                     {cellContent}
//                 </td>
//             );
//         });
//     };

//     if (loading) return <div className="p-4 text-center text-lg font-semibold text-blue-600">Loading Report Data...</div>;
//     if (error) return <div className="p-4 text-center text-lg font-semibold text-red-600">Error: {error}</div>;

//     return (
//         <div className="p-4 bg-gray-50 min-h-full">
//             <style>
//                 {`
//                     .sticky-table { table-layout: fixed; border-collapse: separate; border-spacing: 0; min-width: ${totalContentWidth}px; }
//                     .month-cell { min-width: ${monthlyColWidth}px; width: ${monthlyColWidth}px; }
//                     .sticky-table th.sticky-left, .sticky-table td.sticky-left { position: sticky; z-index: 10; background-color: white !important; box-shadow: 2px 0 3px -2px rgba(0,0,0,0.1); border-right: 1px solid #e5e7eb; }
//                     .sticky-table thead th.sticky-left { position: sticky; top: 0; z-index: 40 !important; background-color: #e5e7eb !important; }
//                     .sticky-table th.last-sticky-col-border, .sticky-table td.last-sticky-col-border { border-right: 2px solid #9ca3af !important; box-shadow: 2px 0 3px -2px rgba(0,0,0,0.4); }
//                     .fy-total-col { background-color: #fffbe7; font-weight: 600; }
//                     .section-total-row, .revenue-indirect-row, .grand-total-row { color: white; font-weight: bold; border-top: 2px solid #065f46; }
//                     .section-total-row { background-color: #34d399; }
//                     .revenue-indirect-row { background-color: #10b988; }
//                     .grand-total-row { background-color: #065f46; } 
                    
//                     /* Ensure Sticky headers in Green rows stay green */
//                     .section-total-row-sticky { background-color: #34d399 !important; color: white !important; }
//                     .revenue-indirect-row-sticky { background-color: #10b988 !important; color: white !important; }
//                     .grand-total-row-sticky { background-color: #065f46 !important; color: white !important; }

//                     .rollup-parent-row { background-color: #e5e7eb; font-weight: bold; border-bottom: 2px solid #9ca3af; color: #1f2937; }
//                     .rollup-parent-row-sticky { background-color: #e5e7eb !important; color: #1f2937 !important; }
//                     .revenue-breakdown-row td { background-color: #f0fdfa !important; border-bottom: 1px dashed #6ee7b7; }
//                     .sticky-table th, .sticky-table td { border-bottom: 1px solid #e5e7eb; }
//                 `}
//             </style>
            
//             <h2 className="text-2xl font-bold text-gray-800 mb-6">Forecast Report (2025-2026 Integrated)</h2>

//             <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-md mb-4">
//                 <span className="text-sm text-gray-600">Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} to {Math.min(currentPage * ROWS_PER_PAGE, uniqueProjectKeys.length)} of {uniqueProjectKeys.length} Projects</span>
//                 <div className="flex space-x-2">
//                     <button onClick={handleToggleAll} className={`px-3 py-1 text-sm rounded-lg text-white ${isAllExpanded ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
//                         {isAllExpanded ? <><FaChevronUp className="inline-block w-3 h-3 mr-1" /> Collapse All</> : <><FaChevronDown className="inline-block w-3 h-3 mr-1" /> Expand All</>}
//                     </button>
//                     <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-lg text-gray-700 border hover:bg-gray-100 disabled:opacity-50"><FaChevronLeft className="inline-block w-3 h-3" /> Previous</button>
//                     <span className="px-3 py-1 text-sm rounded-lg border bg-gray-100 text-gray-700">Page {currentPage} of {totalRollupPages}</span>
//                     <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalRollupPages || totalRollupPages === 0} className="px-3 py-1 text-sm rounded-lg text-gray-700 border hover:bg-gray-100 disabled:opacity-50">Next <FaChevronRight className="inline-block w-3 h-3" /></button>
//                 </div>
//             </div>

//             <div style={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }} className="rounded-lg shadow-md border border-gray-200">
//                 <table className="min-w-full divide-y divide-gray-200 sticky-table">
//                     <thead>
//                         <tr>
//                             {dimensionHeaders.map((header) => (
//                                 <th key={header.key} scope="col" className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 sticky-left ${header.key === lastStickyKey ? 'last-sticky-col-border' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width }}>{header.label}</th>
//                             ))}
//                             {MOCK_TIME_PERIODS.map(period => {
//                                 const yellow = isYellowZone(period);
//                                 return (
//                                     <th key={period} scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider month-cell" 
//                                         style={{ backgroundColor: yellow ? '#FDE047' : '#10B981', color: yellow ? '#1F2937' : 'white' }}>{period}</th>
//                                 );
//                             })}
//                         </tr>
//                     </thead>

//                     <tbody>
//                         {renderTotalRow('REVENUE_SECTION', grandRevenueTotal, false, true)}
//                         {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                             <React.Fragment key={`rev-rollup-${rollupItem.id}`}>
//                                 <tr className="revenue-breakdown-row" onClick={() => toggleProject(`REV_${rollupItem.project}`)} style={{ cursor: 'pointer' }}>
//                                     {renderBreakdownStickyCells({...rollupItem, projectName: `Total - ${rollupItem.project}`}, true, null, true)}
//                                     {MOCK_TIME_PERIODS.map(period => (
//                                         <td key={period} className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-semibold" style={{ backgroundColor: '#e0f2f1' }}>{formatCurrency(rollupItem[`${period}_Revenue`] || 0)}</td>
//                                     ))}
//                                 </tr>
//                                 {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.filter(child => child.section === 'REVENUE_SECTION').map(projectItem => (
//                                     <tr key={`rev-detail-${projectItem.id}`} className="revenue-breakdown-row">
//                                         {renderBreakdownStickyCells({...projectItem, isRollupParent: false}, true, null, false)}
//                                         {MOCK_TIME_PERIODS.map(period => (<td key={period} className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell" style={{ backgroundColor: '#f0fdfa' }}>{formatCurrency(projectItem[`${period}_Revenue`] || 0)}</td>))}
//                                     </tr>
//                                 ))}
//                             </React.Fragment>
//                         ))}
//                     </tbody>

//                     <tbody>
//                         {DISPLAYED_SECTION_KEYS.map(sectionKey => {
//                             const sectionRollupParents = paginatedRollups.filter(rollup => rollup.section === sectionKey);
//                             if (!(sectionTotals[sectionKey] && MOCK_TIME_PERIODS.some(p => sectionTotals[sectionKey][p] !== 0))) return null;
//                             return (
//                                 <React.Fragment key={sectionKey}>
//                                     {renderTotalRow(sectionKey, sectionTotals[sectionKey])}
//                                     {expandedSections[sectionKey] && sectionRollupParents.map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="rollup-parent-row" onClick={() => toggleProject(rollupItem.project)} style={{ cursor: 'pointer' }}>
//                                                 {renderBreakdownStickyCells(rollupItem, false, null, true)}
//                                                 {MOCK_TIME_PERIODS.map(period => (<td key={period} className={`px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-extrabold ${period === 'FY-Total' ? 'fy-total-col' : ''}`}>{formatCurrency(rollupItem[period] || 0)}</td>))}
//                                             </tr>
//                                             {expandedProjects[rollupItem.project] && rollupItem.children.filter(child => child.section === sectionKey).map(projectItem => (
//                                                 <tr key={projectItem.id} className="hover:bg-gray-50 transition-colors">
//                                                     {renderBreakdownStickyCells(projectItem, false, null, false)}
//                                                     {MOCK_TIME_PERIODS.map(period => (<td key={period} className={`px-6 py-2 whitespace-nowrap text-sm text-gray-700 month-cell ${period === 'FY-Total' ? 'font-semibold fy-total-col' : ''}`}>{formatCurrency(projectItem[period] || 0)}</td>))}
//                                                 </tr>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                 </React.Fragment>
//                             );
//                         })}
//                     </tbody>

//                     <tfoot>
//                         {renderTotalRow('INDIRECT_SECTION', grandIndirectTotal, false, true)}
//                         {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => (
//                             <tr key={`indirect-breakdown-${key}`} className="revenue-breakdown-row">
//                                 {renderBreakdownStickyCells(null, false, key, false)}
//                                 {MOCK_TIME_PERIODS.map(period => (<td key={period} className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell" style={{ backgroundColor: '#e0f2f1' }}>{formatCurrency(grandIndirectComponents[key][period] || 0)}</td>))}
//                             </tr>
//                         ))}
//                         {renderTotalRow('GRAND_TOTAL_KEY', grandCostTotal, true)}
//                     </tfoot>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default ForecastReport;

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';

// CRITICAL FIX: Importing backendUrl
import { backendUrl } from "./config"; 

const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
const ROWS_PER_PAGE = 20; 

// ... (KEEP ALL YOUR CONSTANTS: PERIOD_MAP, SECTION_LABELS, etc. - unchanged) ...
const PERIOD_MAP = { 1: 'Jan-25', 2: 'Feb-25', 3: 'Mar-25', 4: 'Apr-25', 5: 'May-25', 6: 'Jun-25', 7: 'Jul-25', 8: 'Aug-25', 9: 'Sep-25', 10: 'Oct-25', 11: 'Nov-25', 12: 'Dec-25', 13: 'Jan-26', 14: 'Feb-26', 15: 'Mar-26', 16: 'Apr-26', 17: 'May-26', 18: 'Jun-26', 19: 'Jul-26', 20: 'Aug-26', 21: 'Sep-26', 22: 'Oct-26', 23: 'Nov-26', 24: 'Dec-26' };
const MONTHLY_PERIODS = Object.values(PERIOD_MAP);
const MOCK_TIME_PERIODS = [...MONTHLY_PERIODS, 'FY-Total'];
const isYellowZone = (period) => MOCK_TIME_PERIODS.indexOf(period) >= 10;
const GENERAL_COSTS = 'GENERAL-COSTS';
const SECTION_LABELS = { REVENUE_SECTION: ' Revenue (REVENUE)', INDIRECT_SECTION: ' Indirect', FRINGE: '1. Fringe', OVERHEAD: '2. Overhead', MANDH: '3. Mat & Handling', GNA: '4. General & Admin', LABOR: 'Sumaria Labor Onsite (LABOR)', 'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)', 'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)', 'NON-LABOR-SUBCON': 'Subcontractors (LABOR)', 'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)', TOTAL_FEE: 'Total Fee', [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)' };
const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];
const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
const TRAVEL_NONLABOR_ACCTS = new Set(['50-400-000', '50-400-004', '50-400-008', '50-300-000', '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002']);
const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);

// ... (KEEP ALL HELPER FUNCTIONS: formatCurrency, transformData, etc. - unchanged) ...
const formatCurrency = (amount) => (typeof amount !== 'number' || isNaN(amount) || amount === 0) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => { if (!dateString) return '-'; const date = new Date(dateString.split('T')[0] || dateString); return isNaN(date) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
const getRollupId = (projId) => { if (!projId) return 'N/A'; const match = projId.match(/^(\d+)/); return match ? match[1] : projId.split('.')[0]; };
const getPeriodKeyFromForecast = (month, year) => { const yearSuffix = String(year).slice(-2); const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return (month < 1 || month > 12) ? null : `${monthPrefixes[month - 1]}-${yearSuffix}`; };

const determineSectionAndIndirectKey = (item) => {
    const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
    const poolName = (item.poolName || '').toUpperCase();
    let section = GENERAL_COSTS, indirectKey = null;
    if (subTotTypeNo === 1) section = 'REVENUE_SECTION';
    else if (subTotTypeNo === 4) {
        if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
        else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
        else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
        else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
        section = GENERAL_COSTS; 
    } 
    return { section, indirectKey, subTotTypeNo }; 
};

const classifyCostSection = (acctId, currentSection) => {
    if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
    if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
    if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
    if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
    if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
    return currentSection; 
};

const transformData = (detailData, forecastData) => {
    const aggregatedDataMap = {}; 
    const getForecastKey = (item) => `${item.projId}-${item.acctId}-0-0`; 
    forecastData.forEach(item => {
        const periodKey = getPeriodKeyFromForecast(item.month, item.year);
        const detailRowKey = getForecastKey(item);
        if (!periodKey) return; 
        let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
        let forecastSubTotTypeNo = 0; 
        if (item.revenue !== undefined && item.revenue !== 0) { forecastSection = 'REVENUE_SECTION'; forecastSubTotTypeNo = 1; }
        if (!aggregatedDataMap[detailRowKey]) {
            aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast: ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'FY-Total': 0, };
        }
        const row = aggregatedDataMap[detailRowKey];
        if (row.section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
        if (DISPLAYED_SECTION_KEYS.includes(row.section)) { const costAmount = (item.cost || 0); if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; }
        INDIRECT_KEYS.forEach(ik => {
            const indirectAmount = (item[ik.toLowerCase()] || 0);
            if (indirectAmount !== 0) {
                const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
                if (!aggregatedDataMap[indirectRowKey]) { aggregatedDataMap[indirectRowKey] = { id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: GENERAL_COSTS, subTotTypeNo: 4, 'FY-Total': 0, }; }
                aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
            }
        });
    });
    detailData.forEach(item => {
        let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
        if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
        const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 
        const periodKey = PERIOD_MAP[item.pdNo];
        if (!periodKey) return; 
        if (!aggregatedDataMap[detailRowKey]) { aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, accountName: item.l1AcctName || item.poolName || 'Unknown Pool', projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt, parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'FY-Total': 0, };
        } else { const row = aggregatedDataMap[detailRowKey]; row.accountName = item.l1AcctName || item.poolName || row.accountName; row.popStartDate = item.projStartDt || row.popStartDate; row.popEndDate = item.projEndDt || row.popEndDate; row.section = section; if (item.projName) row.projectName = item.projName; row.subTotTypeNo = subTotTypeNo; }
        const row = aggregatedDataMap[detailRowKey];
        const monthlyAmount = (item.ptdIncurAmt || 0); 
        if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
        else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
        else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
    });
    Object.values(aggregatedDataMap).forEach(row => { if (DISPLAYED_SECTION_KEYS.includes(row.section)) { let total = 0; MONTHLY_PERIODS.forEach(period => { total += (row[period] || 0); }); row['FY-Total'] = total; } else row['FY-Total'] = 0; });
    return Object.values(aggregatedDataMap); 
};

const ForecastReport = () => {
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [loading, setLoading] = useState(false); // Default to false
    const [isReportRun, setIsReportRun] = useState(false); // NEW STATE
    const [error, setError] = useState(null);
    const [apiData, setApiData] = useState([]); 
    const [currentPage, setCurrentPage] = useState(1);

    const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    const [expandedSections, setExpandedSections] = useState(initialExpandedState);
    const [expandedProjects, setExpandedProjects] = useState({}); 

    const toggleSection = useCallback((key) => { setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })); }, []);
    const toggleProject = useCallback((projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); }, []);
    const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

    const handleToggleAll = () => {
        if (isAllExpanded) { setExpandedSections(initialExpandedState); setExpandedProjects({}); 
        } else { const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {}); setExpandedSections(allExpanded); }
    };

    // TRIGGERED MANUALLY NOW
    const handleRunReport = async () => {
        setLoading(true);
        setIsReportRun(true);
        setError(null);
        const DETAIL_URL = `${backendUrl}${DETAIL_API_PATH}`;
        const FORECAST_URL = `${backendUrl}${FORECAST_API_PATH}`; 
        try {
            const [detailResponse, forecastResponse] = await Promise.all([fetch(DETAIL_URL), fetch(FORECAST_URL)]);
            if (!detailResponse.ok) throw new Error(`Detail API failed: ${detailResponse.statusText}`);
            const detailData = await detailResponse.json();
            const forecastData = forecastResponse.ok ? await forecastResponse.json() : [];
            const transformedRows = transformData(detailData, forecastData);
            if (transformedRows.length === 0) setError("Zero relevant rows found."); 
            else setError(null);
            setApiData(transformedRows);
        } catch (e) {
            setApiData([]);
            setError(`Data load failed: ${e.message}`);
        } finally { setLoading(false); }
    };

    // useEffect is now only for logging or other side effects, 
    // it no longer calls fetchReportData on mount.

    const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
        const lowerCaseSearch = projectSearchTerm.toLowerCase();
        const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
        const rollupGroup = {};
        const allProjectRows = [];
        const ALL_SECTION_KEYS = [...DISPLAYED_SECTION_KEYS, GENERAL_COSTS];

        filtered.forEach(item => {
            const rollupId = getRollupId(item.project);
            let groupKey;
            let groupSection = item.section;
            const isRevenueRow = item.section === 'REVENUE_SECTION';
            if (isRevenueRow) { groupKey = `${rollupId}__REVENUE_SECTION`; groupSection = 'REVENUE_SECTION'; }
            else if (ALL_SECTION_KEYS.includes(item.section)) { groupKey = `${rollupId}__${item.section}`; groupSection = item.section; }
            else return; 
            allProjectRows.push(item);
            if (!rollupGroup[groupKey]) { rollupGroup[groupKey] = { id: groupKey, project: rollupId, org: item.org || item.orgId || '', acctId: null, popStartDate: item.popStartDate || item.proj_start_dt || '', popEndDate: item.popEndDate || item.proj_end_dt || '', isRollupParent: true, 'FY-Total': 0, section: groupSection, children: [], }; }
            const parent = rollupGroup[groupKey];
            parent.children.push(item);
            MONTHLY_PERIODS.forEach(period => {
                if (!isRevenueRow && item.section !== 'REVENUE_SECTION') {
                    if (item[period] !== undefined) parent[period] = (parent[period] || 0) + (item[period] || 0);
                    INDIRECT_KEYS.forEach(ik => { if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0); });
                }
                if (item[`${period}_Revenue`] !== undefined) parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
            });
            if (!isRevenueRow) parent['FY-Total'] += (item['FY-Total'] || 0);
        });
        const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project) || a.section.localeCompare(b.section));
        const uniqueKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const paginatedProjectKeys = uniqueKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
        const paginatedRollups = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);
        return { allRows: allProjectRows, uniqueProjectKeys: uniqueKeys, paginatedRollups };
    }, [apiData, projectSearchTerm, currentPage]); 

    // ... (KEEP dimensionHeaders, stickyPositions, totalContentWidth, and render helpers - same as your code) ...
    const dimensionHeaders = [ { key: 'project', label: 'PROJECT', width: '150px' }, { key: 'projectName', label: 'PROJECT NAME', width: '260px' }, { key: 'org', label: 'ORG', width: '120px' }, { key: 'accountID', label: 'ACCOUNT ID', width: '140px' }, { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' }, { key: 'popStartDate', label: 'POP START DATE', width: '140px' }, { key: 'popEndDate', label: 'POP END DATE', width: '140px' }, ];
    const monthlyColWidth = 150;
    const stickyPositions = useMemo(() => { let currentPos = 0; const positions = {}; dimensionHeaders.forEach((header, index) => { positions[header.key] = { left: currentPos, zIndex: 20 + dimensionHeaders.length - index }; currentPos += parseInt(header.width); }); return positions; }, [dimensionHeaders]); 
    const totalContentWidth = useMemo(() => dimensionHeaders.reduce((sum, h) => sum + parseInt(h.width), 0) + (MOCK_TIME_PERIODS.length * monthlyColWidth), [dimensionHeaders]); 
    const lastStickyKey = dimensionHeaders[dimensionHeaders.length - 1].key;
    const { sectionTotals, grandCostTotal, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee } = useMemo(() => {
        const sectionTotals = {}; const grandCostTotal = {}; const grandRevenueTotal = {}; const grandIndirectComponents = {}; const grandTotalFee = {};
        const PERIODS = MOCK_TIME_PERIODS; 
        DISPLAYED_SECTION_KEYS.forEach(key => {
            const sectionRows = allRows.filter(row => row.section === key && row.section !== 'REVENUE_SECTION');
            sectionTotals[key] = {};
            PERIODS.forEach(period => { const costSum = sectionRows.reduce((acc, row) => (row[period] !== undefined ? acc + row[period] : acc), 0); if (costSum !== 0) { sectionTotals[key][period] = costSum; grandCostTotal[period] = (grandCostTotal[period] || 0) + costSum; } });
        });
        const revenueRows = allRows.filter(row => row.section === 'REVENUE_SECTION');
        PERIODS.forEach(period => { const revenueSum = revenueRows.reduce((acc, row) => (row[`${period}_Revenue`] !== undefined ? acc + row[`${period}_Revenue`] : acc), 0); if (revenueSum !== 0) grandRevenueTotal[period] = (grandRevenueTotal[period] || 0) + revenueSum; });
        const indirectRows = allRows.filter(row => INDIRECT_KEYS.some(k => PERIODS.some(p => row[`${p}_${k}`] !== undefined)));
        PERIODS.forEach(period => { INDIRECT_KEYS.forEach(indirectKey => { const indirectSum = indirectRows.reduce((acc, row) => (row[`${period}_${indirectKey}`] !== undefined ? acc + row[`${period}_${indirectKey}`] : acc), 0); if (indirectSum !== 0) { if (!grandIndirectComponents[indirectKey]) grandIndirectComponents[indirectKey] = {}; grandIndirectComponents[indirectKey][period] = (grandIndirectComponents[indirectKey][period] || 0) + indirectSum; } }); });
        const grandIndirectTotal = {};
        PERIODS.forEach(period => { const indirectTotal = INDIRECT_KEYS.reduce((sum, key) => sum + (grandIndirectComponents[key]?.[period] || 0), 0); if (indirectTotal !== 0) { grandIndirectTotal[period] = indirectTotal; grandCostTotal[period] = (grandCostTotal[period] || 0) + indirectTotal; } });
        PERIODS.forEach(period => { grandTotalFee[period] = (grandRevenueTotal[period] || 0) - (grandCostTotal[period] || 0); });
        const finalIndirectKeys = Object.keys(grandIndirectComponents).filter(key => PERIODS.some(p => grandIndirectComponents[key][p] > 0));
        return { sectionTotals, grandCostTotal, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee };
    }, [allRows]); 

    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= Math.ceil(uniqueProjectKeys.length / ROWS_PER_PAGE)) setCurrentPage(newPage); };

    const renderTotalRow = (sectionKey, totalData, isGrandTotal = false, isRevenueOrIndirect = false) => {
        const totalLabel = SECTION_LABELS[sectionKey];
        const isFee = sectionKey === 'TOTAL_FEE';
        const rowClass = isFee ? 'total-fee-row' : (isGrandTotal ? 'grand-total-row' : (isRevenueOrIndirect ? 'revenue-indirect-row' : 'section-total-row'));
        const zIndex = isGrandTotal || isFee ? 40 : (isRevenueOrIndirect ? 35 : 25); 
        const dataKeySuffix = sectionKey === 'REVENUE_SECTION' ? '_Revenue' : (INDIRECT_KEYS.includes(sectionKey) ? `_${sectionKey}` : '');
        return (
            <tr key={sectionKey} className={rowClass} onClick={!isGrandTotal && !isFee ? () => toggleSection(sectionKey) : undefined} style={{ cursor: isGrandTotal || isFee ? 'default' : 'pointer' }}>
                {dimensionHeaders.map((header) => (
                    <th key={header.key} className={`px-3 py-2 text-left text-sm font-extrabold sticky left-0 ${rowClass}-sticky ${header.key === lastStickyKey ? 'last-sticky-col-border' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: zIndex }}>
                        {header.key === 'project' ? (isGrandTotal || isFee ? '' : <FaCaretRight className={`w-3 h-3 transition-transform ${expandedSections[sectionKey] ? 'rotate-90' : ''}`} />) : (header.key === 'projectName' ? totalLabel : '')}
                    </th>
                ))}
                {MOCK_TIME_PERIODS.map(period => {
                    const yellow = isYellowZone(period);
                    return <th key={period} className={`px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-extrabold ${period === 'FY-Total' ? 'fy-total-col' : ''}`} style={{ backgroundColor: yellow ? '#FEF9C3' : '', color: yellow ? '#1F2937' : 'white' }}>{formatCurrency(totalData[`${period}${dataKeySuffix}`] || totalData[period])}</th>;
                })}
            </tr>
        );
    };

    const renderBreakdownStickyCells = (item, isRevenueBreakdown, breakdownKey, isRollupParent = false) => {
        return dimensionHeaders.map((header) => {
            const isLastSticky = header.key === lastStickyKey;
            let cellContent = ''; let paddingLeft = '12px';
            if (isRevenueBreakdown) {
                if (header.key === 'project') {
                    cellContent = item.project;
                    if (item.isRollupParent) { return ( <td key={header.key} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left last-sticky-col-border`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: stickyPositions[header.key].zIndex, cursor: 'pointer', paddingLeft: '12px', backgroundColor: 'white' }} onClick={() => toggleProject(`REV_${item.project}`)}> <div className="flex items-center space-x-1"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} /> <span>{item.project}</span> </div> </td> ); }
                    paddingLeft = '35px';
                } else if (header.key === 'projectName') cellContent = item.projectName;
                else if (header.key === 'org') cellContent = item.org;
                else if (header.key === 'accountID') cellContent = item.acctId;
                else if (header.key === 'accountName') cellContent = item.accountName;
                else if (header.key === 'popStartDate') cellContent = formatDate(item.popStartDate);
                else if (header.key === 'popEndDate') cellContent = formatDate(item.popEndDate);
            }
            else if (item) {
                if (header.key === 'project') {
                    cellContent = item.project; paddingLeft = item.isRollupParent ? '12px' : '35px'; 
                    if (item.isRollupParent && item.children && item.children.length > 0) { return ( <td key={header.key} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left ${isLastSticky ? 'last-sticky-col-border' : ''} ${item.isRollupParent ? 'rollup-parent-row-sticky' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: stickyPositions[header.key].zIndex, cursor: 'pointer', paddingLeft: paddingLeft, backgroundColor: 'white' }} onClick={() => toggleProject(item.project)}> <div className="flex items-center space-x-1"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} /> <span>{cellContent}</span> </div> </td> ); }
                } else if (header.key === 'projectName') cellContent = item.projectName;
                else if (header.key === 'org') cellContent = item.org;
                else if (header.key === 'accountID') cellContent = item.acctId || item.accountID;
                else if (header.key === 'accountName') cellContent = item.accountName;
                else if (header.key === 'popStartDate') cellContent = formatDate(item.popStartDate);
                else if (header.key === 'popEndDate') cellContent = formatDate(item.popEndDate);
            } else if (breakdownKey && header.key === 'project') { cellContent = SECTION_LABELS[breakdownKey]; paddingLeft = '25px'; }
            return <td key={header.key} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 sticky-left ${isLastSticky ? 'last-sticky-col-border' : ''} ${isRollupParent ? 'rollup-parent-row-sticky' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width, zIndex: stickyPositions[header.key].zIndex, paddingLeft: paddingLeft, backgroundColor: isRollupParent ? '#e5e7eb' : 'white' }}>{cellContent}</td>;
        });
    };

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <style>
                {`
                    .sticky-table { table-layout: fixed; border-collapse: separate; border-spacing: 0; min-width: ${totalContentWidth}px; }
                    .month-cell { min-width: ${monthlyColWidth}px; width: ${monthlyColWidth}px; }
                    .sticky-table th.sticky-left, .sticky-table td.sticky-left { position: sticky; z-index: 10; background-color: white !important; box-shadow: 2px 0 3px -2px rgba(0,0,0,0.1); border-right: 1px solid #e5e7eb; }
                    .sticky-table thead th.sticky-left { position: sticky; top: 0; z-index: 40 !important; background-color: #e5e7eb !important; }
                    .sticky-table th.last-sticky-col-border, .sticky-table td.last-sticky-col-border { border-right: 2px solid #9ca3af !important; box-shadow: 2px 0 3px -2px rgba(0,0,0,0.4); }
                    .fy-total-col { background-color: #fffbe7; font-weight: 600; }
                    .section-total-row, .revenue-indirect-row, .grand-total-row, .total-fee-row { color: white; font-weight: bold; border-top: 2px solid #065f46; }
                    .section-total-row { background-color: #34d399; }
                    .revenue-indirect-row { background-color: #10b988; }
                    .grand-total-row { background-color: #065f46; } 
                    .total-fee-row { background-color: #60a5fa; border-top: 2px solid #2563eb; }
                    .section-total-row-sticky { background-color: #34d399 !important; color: white !important; }
                    .revenue-indirect-row-sticky { background-color: #10b988 !important; color: white !important; }
                    .grand-total-row-sticky { background-color: #065f46 !important; color: white !important; }
                    .total-fee-row-sticky { background-color: #60a5fa !important;  color: white !important; }
                    .rollup-parent-row { background-color: #e5e7eb; font-weight: bold; border-bottom: 2px solid #9ca3af; color: #1f2937; }
                    .rollup-parent-row-sticky { background-color: #e5e7eb !important; color: #1f2937 !important; }
                    .revenue-breakdown-row td { background-color: #f0fdfa !important; border-bottom: 1px dashed #6ee7b7; }
                    .sticky-table th, .sticky-table td { border-bottom: 1px solid #e5e7eb; }
                `}
            </style>
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Forecast Report </h2>
                {/* RUN REPORT BUTTON */}
                {!loading && (
                    <button 
                        onClick={handleRunReport} 
                        className="flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95"
                    >
                        <FaPlay className="mr-2 text-sm" /> {isReportRun ? 'Refresh Report' : 'Run Report'}
                    </button>
                )}
            </div>

            {loading && <div className="p-10 text-center text-lg font-semibold text-blue-600 bg-white rounded-xl shadow-sm border">Loading Report Data...</div>}
            {error && <div className="p-10 text-center text-lg font-semibold text-red-600 bg-white rounded-xl shadow-sm border">Error: {error}</div>}

            {!loading && !error && !isReportRun && (
                <div className="p-20 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500">
                    Click the <span className="font-bold text-green-600">"Run Report"</span> button above to load the data.
                </div>
            )}

            {!loading && !error && isReportRun && (
                <>
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-md mb-4">
                        <span className="text-sm text-gray-600">Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} to {Math.min(currentPage * ROWS_PER_PAGE, uniqueProjectKeys.length)} of {uniqueProjectKeys.length} Projects</span>
                        <div className="flex space-x-2">
                            <button onClick={handleToggleAll} className={`px-3 py-1 text-sm rounded-lg text-white ${isAllExpanded ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                                {isAllExpanded ? <><FaChevronUp className="inline-block w-3 h-3 mr-1" /> Collapse All</> : <><FaChevronDown className="inline-block w-3 h-3 mr-1" /> Expand All</>}
                            </button>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-lg text-gray-700 border hover:bg-gray-100 disabled:opacity-50"><FaChevronLeft className="inline-block w-3 h-3" /> Previous</button>
                            <span className="px-3 py-1 text-sm rounded-lg border bg-gray-100 text-gray-700">Page {currentPage} of {Math.ceil(uniqueProjectKeys.length / ROWS_PER_PAGE)}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === Math.ceil(uniqueProjectKeys.length / ROWS_PER_PAGE) || uniqueProjectKeys.length === 0} className="px-3 py-1 text-sm rounded-lg text-gray-700 border hover:bg-gray-100 disabled:opacity-50">Next <FaChevronRight className="inline-block w-3 h-3" /></button>
                        </div>
                    </div>

                    <div style={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }} className="rounded-lg shadow-md border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 sticky-table">
                            <thead>
                                <tr>
                                    {dimensionHeaders.map((header) => (
                                        <th key={header.key} scope="col" className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 sticky-left ${header.key === lastStickyKey ? 'last-sticky-col-border' : ''}`} style={{ left: `${stickyPositions[header.key].left}px`, width: header.width }}>{header.label}</th>
                                    ))}
                                    {MOCK_TIME_PERIODS.map(period => {
                                        const yellow = isYellowZone(period);
                                        return <th key={period} scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider month-cell" style={{ backgroundColor: yellow ? '#FDE047' : '#10B981', color: yellow ? '#1F2937' : 'white' }}>{period}</th>;
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {renderTotalRow('REVENUE_SECTION', grandRevenueTotal, false, true)}
                                {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
                                    <React.Fragment key={`rev-rollup-${rollupItem.id}`}>
                                        <tr className="revenue-breakdown-row" onClick={() => toggleProject(`REV_${rollupItem.project}`)} style={{ cursor: 'pointer' }}>
                                            {renderBreakdownStickyCells({...rollupItem, projectName: `Total - ${rollupItem.project}`}, true, null, true)}
                                            {MOCK_TIME_PERIODS.map(period => <td key={period} className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-semibold" style={{ backgroundColor: '#e0f2f1' }}>{formatCurrency(rollupItem[`${period}_Revenue`] || 0)}</td>)}
                                        </tr>
                                        {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.filter(child => child.section === 'REVENUE_SECTION').map(projectItem => (
                                            <tr key={`rev-detail-${projectItem.id}`} className="revenue-breakdown-row">
                                                {renderBreakdownStickyCells({...projectItem, isRollupParent: false}, true, null, false)}
                                                {MOCK_TIME_PERIODS.map(period => <td key={period} className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell" style={{ backgroundColor: '#f0fdfa' }}>{formatCurrency(projectItem[`${period}_Revenue`] || 0)}</td>)}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                            <tbody>
                                {DISPLAYED_SECTION_KEYS.map(sectionKey => {
                                    const sectionRollupParents = paginatedRollups.filter(rollup => rollup.section === sectionKey);
                                    if (!(sectionTotals[sectionKey] && MOCK_TIME_PERIODS.some(p => sectionTotals[sectionKey][p] !== 0))) return null;
                                    return (
                                        <React.Fragment key={sectionKey}>
                                            {renderTotalRow(sectionKey, sectionTotals[sectionKey])}
                                            {expandedSections[sectionKey] && sectionRollupParents.map(rollupItem => (
                                                <React.Fragment key={rollupItem.id}>
                                                    <tr className="rollup-parent-row" onClick={() => toggleProject(rollupItem.project)} style={{ cursor: 'pointer' }}>
                                                        {renderBreakdownStickyCells(rollupItem, false, null, true)}
                                                        {MOCK_TIME_PERIODS.map(period => <td key={period} className={`px-6 py-2 whitespace-nowrap text-sm text-right month-cell font-extrabold ${period === 'FY-Total' ? 'fy-total-col' : ''}`}>{formatCurrency(rollupItem[period] || 0)}</td>)}
                                                    </tr>
                                                    {expandedProjects[rollupItem.project] && rollupItem.children.filter(child => child.section === sectionKey).map(projectItem => (
                                                        <tr key={projectItem.id} className="hover:bg-gray-50 transition-colors">
                                                            {renderBreakdownStickyCells(projectItem, false, null, false)}
                                                            {MOCK_TIME_PERIODS.map(period => <td key={period} className={`px-6 py-2 whitespace-nowrap text-sm text-gray-700 month-cell ${period === 'FY-Total' ? 'font-semibold fy-total-col' : ''}`}>{formatCurrency(projectItem[period] || 0)}</td>)}
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {renderTotalRow('INDIRECT_SECTION', grandIndirectTotal, false, true)}
                                {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => (
                                    <tr key={`indirect-breakdown-${key}`} className="revenue-breakdown-row">
                                        {renderBreakdownStickyCells(null, false, key, false)}
                                        {MOCK_TIME_PERIODS.map(period => <td key={period} className="px-6 py-2 whitespace-nowrap text-sm text-right month-cell" style={{ backgroundColor: '#e0f2f1' }}>{formatCurrency(grandIndirectComponents[key][period] || 0)}</td>)}
                                    </tr>
                                ))}
                                {renderTotalRow('GRAND_TOTAL_KEY', grandCostTotal, true)}
                                {renderTotalRow('TOTAL_FEE', grandTotalFee, false, false)}
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ForecastReport;