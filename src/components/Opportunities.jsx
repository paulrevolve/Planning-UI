import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaFileExcel, FaFileImport, FaTable, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx'; 
import moment from 'moment'; 
import Holidays from 'date-holidays'; 

// --- CONFIGURATION CONSTANTS ---
const WORK_HOURS_PER_DAY = 8;
const MAX_ITERATION_DAYS = 365 * 15; 
const HD = new Holidays('US', 'en'); 
const BATCH_SIZE = 20; // Process 20 rows at a time

// **CRITICAL SPEED OPTIMIZATION:** Cache for monthly work hours { 'YYYY-MM': hours }
const WORKDAY_CACHE = {}; 

// 1. COLUMN MAPPING: 0-based index
const EXPECTED_COLUMNS = [
    { index: 0, field: 'projectId', header: 'Project ID' },
    { index: 1, field: 'name', header: 'Project Name' },
    { index: 8, field: 'orgId', header: 'Org ID' },
    { index: 10, field: 'startDate', header: 'Start Date' },
    { index: 11, field: 'endDate', header: 'End Date' },
    { index: 13, field: 'fundingAmount', header: 'Funding Amount' },
    { index: 15, field: 'winProbability', header: 'Win %' },
];

const BASE_HEADERS = EXPECTED_COLUMNS.map(col => col.header);

/**
 * Pre-calculates the total work hours (Mon-Fri, excluding US holidays) for a given month.
 * The results are stored in WORKDAY_CACHE.
 */
const getCachedMonthlyWorkHours = (year, monthIndex) => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    if (WORKDAY_CACHE[key]) {
        return WORKDAY_CACHE[key];
    }

    let workHours = 0;
    const startOfMonth = moment([year, monthIndex]).startOf('month');
    const endOfMonth = moment(startOfMonth).endOf('month');
    
    let currentDate = startOfMonth.clone();
    
    while (currentDate.isSameOrBefore(endOfMonth, 'day')) {
        const dayOfWeek = currentDate.day(); 
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; 
        const isHoliday = HD.isHoliday(currentDate.toDate()); 
        
        if (!isWeekend && !isHoliday) {
            workHours += WORK_HOURS_PER_DAY;
        }
        currentDate.add(1, 'day');
    }
    
    WORKDAY_CACHE[key] = workHours;
    return workHours;
};


// --- TIME-PHASING CALCULATION (CORE LOGIC) ---
const calculateMonthlyDistribution = (opportunity) => {
    const { fundingAmount, winProbability, startDate, endDate } = opportunity;

    const amount = parseFloat(fundingAmount) || 0;
    let winP = parseFloat(winProbability);
    if (isNaN(winP)) winP = 0;
    if (winP > 1) winP /= 100;
    
    const weightedValue = amount * winP;
    
    if (typeof startDate !== 'number' || typeof endDate !== 'number' || startDate < 1 || endDate < 1) {
         throw new Error("Date Not Numeric");
    }

    try {
        const startComponents = XLSX.SSF.parse_date_code(startDate);
        const endComponents = XLSX.SSF.parse_date_code(endDate);

        const start = moment([startComponents.y, startComponents.m - 1, startComponents.d]).startOf('day');
        const end = moment([endComponents.y, endComponents.m - 1, endComponents.d]).startOf('day');

        if (!start.isValid() || !end.isValid() || start.isAfter(end) || start.year() > 2050) {
            throw new Error(`Invalid Date Range: ${start.format()} to ${end.format()}`);
        }
        
        let totalWorkHours = 0;
        const monthlyHourCount = {}; 
        const monthsList = [];
        
        const startMonthKey = start.format('MMM-YY');
        const endMonthKey = end.format('MMM-YY');
        
        let currentDate = start.clone();
        
        // 1. Handle PARTIAL Start Month
        const startMonthEnd = moment(start).endOf('month');
        let currentMonth = start.clone().startOf('month');
        
        while (currentDate.isSameOrBefore(end, 'day') && currentDate.isSameOrBefore(startMonthEnd, 'day')) {
            const dayOfWeek = currentDate.day(); 
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; 
            const isHoliday = HD.isHoliday(currentDate.toDate()); 
            
            if (!isWeekend && !isHoliday) {
                totalWorkHours += WORK_HOURS_PER_DAY;
                monthlyHourCount[startMonthKey] = (monthlyHourCount[startMonthKey] || 0) + WORK_HOURS_PER_DAY;
            }
            currentDate.add(1, 'day');
        }
        monthsList.push(startMonthKey);
        
        // 2. Handle FULL Months (Using Cache)
        currentMonth = currentMonth.add(1, 'month').startOf('month');
        
        while (currentMonth.isSameOrBefore(end, 'month') && currentMonth.format('MMM-YY') !== endMonthKey) {
            const monthKey = currentMonth.format('MMM-YY');
            const hours = getCachedMonthlyWorkHours(currentMonth.year(), currentMonth.month());
            
            totalWorkHours += hours;
            monthlyHourCount[monthKey] = (monthlyHourCount[monthKey] || 0) + hours;
            monthsList.push(monthKey);
            
            currentMonth.add(1, 'month');
        }
        
        // 3. Handle PARTIAL End Month (If different from start month)
        if (startMonthKey !== endMonthKey) {
            
            let endMonthStart = moment(end).startOf('month');
            currentDate = endMonthStart.clone(); 
            
            while (currentDate.isSameOrBefore(end, 'day')) {
                if (currentDate.isBefore(start, 'day')) {
                    currentDate.add(1, 'day');
                    continue;
                }

                const dayOfWeek = currentDate.day(); 
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; 
                const isHoliday = HD.isHoliday(currentDate.toDate()); 
                
                if (!isWeekend && !isHoliday) {
                    const hours = WORK_HOURS_PER_DAY;
                    totalWorkHours += hours;
                    monthlyHourCount[endMonthKey] = (monthlyHourCount[endMonthKey] || 0) + hours;
                }
                currentDate.add(1, 'day');
            }
            if (!monthsList.includes(endMonthKey)) {
                monthsList.push(endMonthKey);
            }
        }
        // Deduplicate month list and ensure correct chronological sorting
        const uniqueMonthsList = [...new Set(monthsList)].sort((a, b) => moment(a, 'MMM-YY').valueOf() - moment(b, 'MMM-YY').valueOf());


        // 4. Distribute Weighted Value
        const monthlyDistribution = {};
        if (totalWorkHours > 0) {
            const hourlyRate = weightedValue / totalWorkHours;
            
            for (const monthKey of uniqueMonthsList) {
                const hours = monthlyHourCount[monthKey] || 0;
                const calculatedValue = hours * hourlyRate;
                monthlyDistribution[monthKey] = Math.round(calculatedValue * 100) / 100;
            }
        }
        
        const finalWeightedValue = Math.round(weightedValue * 100) / 100;

        return { 
            monthlyDistribution, 
            monthsList: uniqueMonthsList, 
            totalHours: totalWorkHours, 
            weightedValue: finalWeightedValue 
        };
    } catch (error) {
         throw new Error(`Date Assembly Error: ${error.message}`);
    }
};
// ---------------------------------

const Opportunities = ({ fullApiResponse }) => {
    
    const [rawData, setRawData] = useState(null); 
    const [opportunityData, setOpportunityData] = useState([]); 
    const [isImporting, setIsImporting] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false); 
    const [dynamicHeaders, setDynamicHeaders] = useState(BASE_HEADERS);
    
    const [calculationState, setCalculationState] = useState({
        results: [],
        skipped: 0,
        total: 0,
        allMonths: new Set(),
        currentIndex: 0
    });

    const fileInputRef = useRef(null);

    // --- RECURSIVE BATCH PROCESSOR ---
    const processBatch = useCallback((data, state) => {
        if (state.currentIndex >= data.length) {
            // Calculation finished
            const { results, skipped, total, allMonths } = state;
            
            if (results.length === 0) {
                alert(`Calculation failed: All ${total} rows skipped.`);
                setDynamicHeaders(BASE_HEADERS);
            } else {
                if (skipped > 0) {
                    alert(`Calculation complete, but ${skipped} of ${total} rows were skipped due to errors. Check console for details.`);
                } else {
                    alert(`Calculation successful for ${results.length} opportunities.`);
                }
                
                setOpportunityData(results);
                const sortedMonths = Array.from(allMonths).sort((a, b) => moment(a, 'MMM-YY').valueOf() - moment(b, 'MMM-YY').valueOf());
                setDynamicHeaders([...BASE_HEADERS, 'Weighted Value', 'Total Hrs.', ...sortedMonths]); 
            }
            
            setRawData(null); 
            setIsCalculating(false);
            return;
        }

        const batchEndIndex = Math.min(state.currentIndex + BATCH_SIZE, data.length);
        const newResults = [...state.results];
        let newSkipped = state.skipped;
        const newMonths = new Set(state.allMonths);

        for (let i = state.currentIndex; i < batchEndIndex; i++) {
            const rowData = data[i];
            const rowNumber = rowData.originalRow;
            
            try {
                const { monthlyDistribution, monthsList, weightedValue, totalHours } = calculateMonthlyDistribution(rowData);
                
                rowData.weightedValue = weightedValue;
                rowData.totalWorkHours = totalHours; 
                rowData.monthlyDistribution = monthlyDistribution;
                
                monthsList.forEach(month => newMonths.add(month));
                newResults.push(rowData);
            } catch (error) {
                console.error(`Row ${rowNumber} skipped due to fatal calculation error: ${error.message}`, rowData);
                newSkipped++;
            }
        }

        const nextState = {
            results: newResults,
            skipped: newSkipped,
            total: state.total,
            allMonths: newMonths,
            currentIndex: batchEndIndex
        };
        
        setCalculationState(nextState);
        
        setTimeout(() => processBatch(data, nextState), 10); 

    }, []);
    // --- END RECURSIVE BATCH PROCESSOR ---


    // --- EFFECT: Triggers Calculation when Raw Data is Ready ---
    useEffect(() => {
        if (!rawData) return;
        
        setIsCalculating(true);
        setOpportunityData([]); 
        
        const initialState = {
            results: [],
            skipped: 0,
            total: rawData.length,
            allMonths: new Set(),
            currentIndex: 0
        };
        setCalculationState(initialState);

        setTimeout(() => processBatch(rawData, initialState), 50);

    }, [rawData, processBatch]); 
    

    // --- EXPORT HANDLER ---
    const handleExportToExcel = () => {
        if (opportunityData.length === 0) {
            alert("No data available to export.");
            return;
        }

        const dataToExport = [];
        const monthlyHeaders = dynamicHeaders.slice(BASE_HEADERS.length + 2); // Get Month-YY headers

        // 1. Create Data Rows
        opportunityData.forEach(opp => {
            const row = {};
            
            // Add static headers
            EXPECTED_COLUMNS.forEach(col => {
                let value = opp[col.field];
                
                if (col.field === 'winProbability') {
                    // FIX: Multiply by 100 and format as percentage string (e.g., 99.00%)
                    const winPercent = parseFloat(value) * 100;
                    value = `${winPercent.toFixed(2)}%`; 
                } else if ((col.field === 'startDate' || col.field === 'endDate') && typeof value === 'number') {
                     const date = XLSX.SSF.parse_date_code(value);
                     value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                }
                row[col.header] = value;
            });

            // Add Weighted Value and Total Hours
            row['Weighted Value'] = opp.weightedValue;
            row['Total Hrs.'] = opp.totalWorkHours; // Value is a clean number

            // Add dynamic monthly values
            monthlyHeaders.forEach(monthKey => {
                row[monthKey] = opp.monthlyDistribution[monthKey] || 0.00; 
            });
            
            dataToExport.push(row);
        });

        // 2. Create Workbook
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        // --- Apply Excel Formatting ---
        
        dataToExport.forEach((row, rowIndex) => {
            const excelRowIndex = rowIndex + 2; 
            
            // 1. Set format for Total Hrs. column
            const totalHrsCellRef = XLSX.utils.encode_cell({c: BASE_HEADERS.length + 1, r: excelRowIndex - 1}); // Total Hrs is Column Index 7 (H)
             if (ws[totalHrsCellRef]) {
                ws[totalHrsCellRef].z = '0'; // Basic integer format (removes $ and decimals)
            }
            
            // 2. Set format for Weighted Value (Column Index 6, G)
            const weightedValueCellRef = XLSX.utils.encode_cell({c: 6, r: excelRowIndex - 1});
            if (ws[weightedValueCellRef]) {
                ws[weightedValueCellRef].z = '$#,##0.00'; 
            }
            
            // 3. Set format for Monthly Distribution columns (Starting after Total Hrs.)
            monthlyHeaders.forEach((header, colIndex) => {
                const cellRef = XLSX.utils.encode_cell({c: BASE_HEADERS.length + 2 + colIndex, r: excelRowIndex - 1});
                if (ws[cellRef]) {
                    ws[cellRef].z = '$#,##0.00';
                }
            });
        });


        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TimePhasedOpportunities");

        // 3. Trigger Download
        XLSX.writeFile(wb, `TimePhasedOpportunities_${moment().format('YYYYMMDD_HHmm')}.xlsx`);
    };


    // --- UTILITIES & HANDLERS ---
    
    const formatValue = (field, value) => {
        const num = parseFloat(value);
        const currencyOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

        // 1. Check for Currency Fields
        if (field === 'fundingAmount' || field === 'weightedValue' || field.includes('monthlyDistribution')) {
            if (!isNaN(num)) {
                return `$${num.toLocaleString(undefined, currencyOptions)}`;
            }
        }
        
        // 2. Check for Hours Field (Return raw number without $)
        if (field === 'totalWorkHours') {
            return !isNaN(num) ? num.toFixed(0) : value; 
        }

        // 3. Check for Percentage Field
        if (field === 'winProbability') {
            if (!isNaN(num)) return `${(num * 100).toFixed(0)}%`;
        }
        
        // 4. Check for Date Fields
        if ((field === 'startDate' || field === 'endDate') && typeof value === 'number') {
             const date = XLSX.SSF.parse_date_code(value);
             return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
        
        return value ?? '-';
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = null; 
            fileInputRef.current.click();
        }
    };

    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // 1. Read Raw XLSX Data using ArrayBuffer (Stable)
                const arrayBuffer = e.target.result; 
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' }); 
                const importedData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true });

                if (importedData.length < 4) {
                    alert("Import failed: Insufficient data rows found after skipping 3 header rows.");
                    setIsImporting(false);
                    return;
                }
                
                // 2. Extract Data Rows (Skipping first 3 rows)
                const dataRows = importedData.slice(3); 
                const tempRawData = [];
                
                // 3. Map Raw Data (Fast Operation)
                dataRows.forEach((row, index) => {
                    const rowNumber = index + 4; 
                    const rowData = { id: Date.now() + index, originalRow: rowNumber }; 
                    let isValidRow = false;

                    EXPECTED_COLUMNS.forEach(col => {
                        const value = row[col.index];
                        if (value !== undefined) {
                            rowData[col.field] = value;
                        }
                        if (col.field === 'projectId' || col.field === 'name') {
                            if (value) isValidRow = true;
                        }
                    });
                    if (isValidRow) tempRawData.push(rowData);
                });
                
                if (tempRawData.length === 0) {
                     alert("Import failed: No valid project rows found.");
                     setIsImporting(false);
                     return;
                }

                // 4. Trigger Calculation (Asynchronous/Batching)
                setRawData(tempRawData); 
                
            } catch (error) {
                console.error("General Error during file read/parse:", error);
                alert("Import failed during file parsing. Please check file format.");
            } finally {
                setIsImporting(false); 
            }
        };

        reader.readAsArrayBuffer(file);
    }, []);
    
    const handleDownloadTemplate = () => {
        alert("Template download initiated. Ensure data fields match the required column indices (A, B, I, K, L, N, P) in your Excel file.");
    };

    const getFieldKey = (header) => {
        const fixedCol = EXPECTED_COLUMNS.find(c => c.header === header);
        if (fixedCol) return fixedCol.field;
        
        if (header === 'Weighted Value') return 'weightedValue';
        if (header === 'Total Hrs.') return 'totalWorkHours';
        
        return `monthlyDistribution.${header}`;
    };

    const isLoading = isImporting || isCalculating;

    return (
        <div className="p-8 space-y-8 max-w-full mx-auto bg-gray-50/70 backdrop-blur-sm min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-900 border-b-2 border-blue-500 pb-4">✨ Optimized Hourly Time-Phased Opportunities Viewer</h1>
            
            {/* --- Import Panel --- */}
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 flex justify-between items-center exclude-pdf">
                <div className="flex items-center space-x-4">
                    <FaFileExcel className="w-8 h-8 text-green-600" />
                    <span className="text-lg font-semibold text-gray-700">
                        {isCalculating 
                            ? `Calculating Forecast Distribution (${calculationState.currentIndex} / ${calculationState.total} rows processed)...`
                            : "Upload and Export Time-Phased Opportunities"}
                    </span>
                </div>

                <div className="flex space-x-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        disabled={isLoading}
                    />
                    
                    {/* --- EXPORT BUTTON --- */}
                    <button
                        onClick={handleExportToExcel}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 border border-gray-300 disabled:opacity-50"
                        disabled={isLoading || opportunityData.length === 0}
                        title="Export Processed Data to Excel"
                    >
                        <FaFileExport className="w-4 h-4 text-blue-600" /> Export Data
                    </button>

                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                {isImporting ? 'Reading File...' : 'Calculating...'}
                            </>
                        ) : (
                            <>
                                <FaFileImport className="w-5 h-5" /> Import Excel
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* --- Dynamic Table Display (The Time-Phased Viewer) --- */}
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><FaTable className="w-6 h-6 mr-3 text-red-600" /> Hourly Forecast Distribution ({opportunityData.length} records)</h2>
                
                {(isCalculating || opportunityData.length === 0) ? (
                    <div className="text-center py-20 text-xl text-gray-500 bg-gray-50 rounded-lg border-dashed border-2 border-gray-300">
                        {isCalculating 
                            ? <><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div> Processing Row {calculationState.currentIndex} of {calculationState.total}...</>
                            : 'Upload an Excel file to view the work-hour based forecast distribution here.'
                        }
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-inner max-h-[70vh]">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0 z-10 shadow-md">
                                <tr>
                                    {dynamicHeaders.map((header) => (
                                        <th key={header} className={`px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap ${BASE_HEADERS.includes(header) || header === 'Weighted Value' || header === 'Total Hrs.' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {opportunityData.map((opp, index) => (
                                    <tr key={opp.id || index} className="hover:bg-blue-50/50 transition duration-100">
                                        {dynamicHeaders.map((header, colIndex) => {
                                            const fieldKey = getFieldKey(header);
                                            let value = opp[fieldKey];
                                            
                                            if (fieldKey.startsWith('monthlyDistribution.')) {
                                                const month = header;
                                                value = opp.monthlyDistribution[month] || 0;
                                            }
                                            
                                            return (
                                                <td key={colIndex} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100">
                                                    <span className={header === 'Weighted Value' ? 'font-bold text-blue-700' : (header === 'Total Hrs.' ? 'font-medium text-gray-700' : '')}>
                                                        {formatValue(fieldKey, value)}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Opportunities;