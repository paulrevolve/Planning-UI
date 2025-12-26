import React, { useMemo, useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// --- CONFIGURATION IMPORT ---
// ⚠️ CRITICAL: Must be correctly set up in config.js
import { backendUrl } from "./config"; 

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- API CONSTANTS (UNCHANGED) ---
const ACTUAL_HOURS_API = "/api/ForecastReport/GetLabHSData"; 
const AVAILABLE_HOURS_API = "/Orgnization/RefreshWorkingDaysForDuration"; 

// --- COLOR CONSTANTS (UNCHANGED) ---
const PRIMARY_TEAL = '#00A389';
const SECONDARY_CORAL = '#FF7F50';
const PERFORMANCE_INDIGO = '#4B0082';

// --- HELPER FUNCTION: EXTRACT UNIQUE EMPLOYEE IDs (UNCHANGED) ---
const getUniqueEmployees = (apiData) => {
    if (!apiData || apiData.length === 0) {
        return ['All'];
    }
    const employees = new Set();
    apiData.forEach(item => {
        if (item.emplId) {
            employees.add(item.emplId);
        }
    });
    return ['All', ...Array.from(employees).sort()];
};

// --- DATA TRANSFORMATION AND CALCULATION (FINAL LOGIC) ---
const processData = (actualsData, capacityData, selectedEmployeeId) => {
    // 1. Map Capacity Data for quick lookup (Key: YYYY-MM)
    const capacityMap = new Map();
    capacityData.forEach(item => {
        const monthKey = `${item.year}-${String(item.monthNo).padStart(2, '0')}`;
        capacityMap.set(monthKey, item.workingHours); 
    });

    // 2. Map Actuals Data (prepare for employee filtering and aggregation)
    const mappedActuals = actualsData.map(item => {
        const actualHours = item.actHrs || 0;
        const dateObj = item.effectBillDt ? new Date(item.effectBillDt) : null;
        
        const dateLabel = dateObj && !isNaN(dateObj)
            ? dateObj.toLocaleDateString('en-US', {month: '2-digit', year: '2-digit'})
            : 'N/A';
            
        const capacityKey = dateObj && !isNaN(dateObj)
            ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
            : null;

        return {
            id: item.emplId,
            date: dateLabel, 
            direct: actualHours,       
            capacityKey: capacityKey 
        };
    }).filter(item => item.date !== 'N/A');

    // 3. Filter by selected Employee ID
    const filteredData = selectedEmployeeId === "All"
        ? mappedActuals
        : mappedActuals.filter(item => item.id === selectedEmployeeId);

    // 4. Aggregate data by Month/Year label (FIXED: Capacity not summed)
    const aggregatedDataMap = filteredData.reduce((acc, item) => {
        const date = item.date;
        const capacityKey = item.capacityKey;

        if (!acc[date]) {
            acc[date] = { 
                direct: 0, 
                capacity: 0, 
                capacityKey: capacityKey 
            };
        }
        
        acc[date].direct += item.direct;
        
        if (acc[date].capacityKey) {
             acc[date].capacity = capacityMap.get(acc[date].capacityKey) || 0;
        }

        return acc;
    }, {});
    
    // 5. Final calculation for chart arrays
    let labels = [];
    let directLabor = [];
    let totalCapacity = []; 
    let utilizationRate = []; 
    
    const processedDates = Object.keys(aggregatedDataMap).sort((a, b) => {
        const [aMonth, aYear] = a.split('/');
        const [bMonth, bYear] = b.split('/');
        return new Date(`20${aYear}-${aMonth}-01`) - new Date(`20${bYear}-${bMonth}-01`);
    });

    processedDates.forEach(date => {
        const item = aggregatedDataMap[date];

        labels.push(date);
        
        const direct = item.direct;
        const capacity = item.capacity; 

        directLabor.push(direct);
        totalCapacity.push(capacity); 
        
        const totalLaborForUtilization = capacity; 
        let utilization = 0;

        if (totalLaborForUtilization > 0) {
            utilization = (direct / totalLaborForUtilization) * 100;
        }
        
        utilizationRate.push(utilization); 
    });

    // --- LIMIT TO LAST 12 MONTHS (UNCHANGED) ---
    const FRAME_LIMIT = 12;

    labels = labels.slice(-FRAME_LIMIT);
    directLabor = directLabor.slice(-FRAME_LIMIT);
    totalCapacity = totalCapacity.slice(-FRAME_LIMIT); 
    utilizationRate = utilizationRate.slice(-FRAME_LIMIT);
    
    // Recalculate averages and axis max (UNCHANGED)
    const totalDirect = directLabor.reduce((sum, val) => sum + val, 0);
    const totalCapacitySum = totalCapacity.reduce((sum, val) => sum + val, 0);

    const dataPointsCount = labels.length;
    const avgDirect = dataPointsCount > 0 ? totalDirect / dataPointsCount : 0;
    const avgCapacity = dataPointsCount > 0 ? totalCapacitySum / dataPointsCount : 0;
    
    const avgUtilization = (totalCapacitySum > 0) ? (totalDirect / totalCapacitySum) * 100 : 0;

    const maxDirect = Math.max(...directLabor, 0);
    const maxCapacity = Math.max(...totalCapacity, 0);
    const maxCombined = Math.max(maxDirect, maxCapacity); 

    let hoursAxisMax = 250; 

    if (maxCombined > 0) {
        hoursAxisMax = Math.ceil(maxCombined * 1.10);
        hoursAxisMax = Math.ceil(hoursAxisMax / 10) * 10;
    }
    
    let utilAxisMin = 80; 
    let utilAxisMax = 100; 
    
    if (utilizationRate.length > 0) {
        const minVal = Math.min(...utilizationRate);
        const maxVal = Math.max(...utilizationRate);
        const buffer = 0.5;

        utilAxisMin = Math.max(80, minVal - buffer); 
        utilAxisMax = Math.min(100, maxVal + buffer); 
        
        if (utilAxisMax - utilAxisMin < 1.5) {
            const mean = (minVal + maxVal) / 2;
            utilAxisMin = Math.max(80, mean - 0.75);
            utilAxisMax = Math.min(100, mean + 0.75);
        }
    }
    
    return { labels, directLabor, totalCapacity, utilizationRate, utilAxisMin, utilAxisMax, avgDirect, avgCapacity, avgUtilization, hoursAxisMax };
};

// --- ROBUST HELPER TO GET DATE RANGE (UNCHANGED) ---
const getDateRange = (data) => {
    if (!data || data.length === 0) return { startDate: null, endDate: null };
    
    const validDates = data
        .map(item => {
            const date = new Date(item.effectBillDt);
            return isNaN(date) ? null : date.getTime();
        })
        .filter(time => time !== null);

    if (validDates.length === 0) return { startDate: null, endDate: null };

    const minTime = Math.min(...validDates);
    const maxTime = Math.max(...validDates);
    
    // Format to YYYY-MM-DD
    const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

    return {
        startDate: formatDate(minTime),
        endDate: formatDate(maxTime)
    };
};

// --- CHART OPTIONS and DATASET GENERATORS (FINALIZED FOR BAR/BAR PLOT) ---

const getUtilizationChartOptions = (utilAxisMin, utilAxisMax, hoursAxisMax) => ({
    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Actual Hours (Bar) vs. Capacity (Line) and Utilization Trend' }, tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.dataset.yAxisID === 'y1') { label += context.parsed.y.toFixed(2) + '%'; } else { const value = context.parsed.y; return label + value.toFixed(0) + ' Hrs'; } return label; } } } },
    scales: { y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Hours' }, beginAtZero: true, max: hoursAxisMax, grid: { drawOnChartArea: true }, ticks: { callback: function(value) { return value + ' Hrs'; } } }, y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Utilization (%)' }, min: utilAxisMin, max: utilAxisMax, grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return value.toFixed(2) + '%'; } } }, x: { title: { display: true, text: 'Fiscal Year Sub-Periods' } } }
});

const getHoursChartOptions = (hoursAxisMax) => ({
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
        legend: { position: 'bottom' }, 
        title: { display: true, text: 'Actual Hours vs. Available Hours (Capacity)' }, 
        tooltip: { 
            callbacks: { 
                label: function(context) { 
                    let label = context.dataset.label || ''; 
                    if (label) { label += ': '; } 
                    const value = context.parsed.y; 
                    return label + value.toFixed(0) + ' Hrs'; 
                } 
            } 
        } 
    }, 
    scales: { 
        y: { 
            type: 'linear', 
            display: true, 
            position: 'left', 
            title: { display: true, text: 'Labor Units (Hrs)' }, 
            beginAtZero: true, 
            max: hoursAxisMax, 
            ticks: { callback: function(value) { return value + ' Hrs'; } } 
        }, 
        x: { 
            title: { display: true, text: 'Fiscal Year Sub-Periods' } 
        } 
    },
    // IMPORTANT: Stacks are used here to group bars side-by-side (Grouped Bar Chart)
    datasets: {
        bar: {
            stack: 'combined', 
            barPercentage: 0.9,
            categoryPercentage: 0.8
        }
    }
});

const getUtilizationChartData = (labels, directLabor, totalCapacity, utilizationRate, avgUtilization) => {
    const avgUtilData = labels.map(() => avgUtilization); return { labels, datasets: [ 
        { label: `Avg Utilization (${avgUtilization.toFixed(2)}%)`, borderColor: PERFORMANCE_INDIGO, data: avgUtilData, borderDash: [5, 5], yAxisID: 'y1', type: 'line', tension: 0, pointRadius: 0, fill: false, order: 0, }, 
        { label: 'Utilization (%)', borderColor: PERFORMANCE_INDIGO, backgroundColor: 'rgba(75, 0, 130, 0.2)', data: utilizationRate, yAxisID: 'y1', type: 'line', tension: 0.4, pointStyle: 'diamond', pointRadius: 6, fill: false, order: 1, }, 
        { label: 'Actual Hours (Hrs)', data: directLabor, backgroundColor: PRIMARY_TEAL, yAxisID: 'y', type: 'bar', order: 2 }, 
        { label: 'Available Hours (Capacity)', data: totalCapacity, borderColor: SECONDARY_CORAL, yAxisID: 'y', type: 'line', pointRadius: 4, pointStyle: 'circle', tension: 0.1, order: 1 }, 
    ], };
};

const getHoursChartData = (labels, directLabor, totalCapacity, avgDirect, avgCapacity) => {
    const avgDirectData = labels.map(() => avgDirect); 
    const avgCapacityData = labels.map(() => avgCapacity);
    
    return { labels, datasets: [ 
        { 
            label: 'Actual Hours', 
            data: directLabor, 
            backgroundColor: PRIMARY_TEAL, 
            yAxisID: 'y', 
            type: 'bar', 
            order: 2,
            stack: 'actual_capacity_group' // Group bars side-by-side
        }, 
        { 
            label: 'Available Hours (Capacity)', 
            data: totalCapacity, 
            backgroundColor: SECONDARY_CORAL, 
            yAxisID: 'y', 
            type: 'bar', 
            order: 2,
            stack: 'actual_capacity_group' // Group bars side-by-side
        },
        { 
            label: `Avg Available Hours (${avgCapacity.toFixed(0)} Hrs)`, 
            borderColor: SECONDARY_CORAL, 
            data: avgCapacityData, 
            borderDash: [5, 5], 
            yAxisID: 'y', 
            type: 'line', 
            tension: 0, 
            pointRadius: 0, 
            fill: false, 
            order: 1,
        }, 
        { 
            label: `Avg Actual Hours (${avgDirect.toFixed(0)} Hrs)`, 
            borderColor: PRIMARY_TEAL, 
            data: avgDirectData, 
            borderDash: [5, 5], 
            yAxisID: 'y', 
            type: 'line', 
            tension: 0, 
            pointRadius: 0, 
            fill: false, 
            order: 1, 
        }, 
    ], };
};

const NoDataMessage = ({ isLoading, error }) => {
    let message = 'No data available for this chart.';
    if (isLoading) message = 'Loading chart data...';
    if (error) message = error;

    return (
        <div className="flex items-center justify-center h-full text-gray-500">
            {message}
        </div>
    );
};

// --- MAIN UTILIZATION CHART COMPONENT ---
const UtilizationChart = () => {
    const [activeTab, setActiveTab] = useState('actualAvailable'); 
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('All'); 
    
    const [actualsData, setActualsData] = useState([]);
    const [capacityData, setCapacityData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch Actual Hours Data
    useEffect(() => {
        const fetchActuals = async () => {
            setIsLoading(true);
            setError(null);
            
            let actualsUrl;
            try {
                // --- CRITICAL CHANGE: USE DYNAMIC BACKEND URL ---
                actualsUrl = `${backendUrl}${ACTUAL_HOURS_API}`;
            } catch (e) {
                setError("Configuration Error: The 'backendUrl' variable is missing or invalid in config.js. Check file setup.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(actualsUrl); 
                if (!response.ok) { throw new Error(`Actuals HTTP error! status: ${response.status}`); }
                const data = await response.json();
                
                setActualsData(Array.isArray(data) ? data : []);
                
            } catch (err) {
                setError(`Failed to load Actual Hours: ${err.message}. Check API URL: ${actualsUrl}`);
                console.error("Error fetching Actuals data:", err);
                setActualsData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActuals();
    }, []); 
    
    // 2. Fetch Available Hours (Capacity) Data using the date range from Actuals
    useEffect(() => {
        if (actualsData.length === 0) return;

        const { startDate, endDate } = getDateRange(actualsData);
        if (!startDate || !endDate) {
            console.warn("Could not determine a valid date range from actuals data.");
            return;
        }

        const fetchCapacity = async () => {
            let capacityUrl;
            try {
                capacityUrl = `${backendUrl}${AVAILABLE_HOURS_API}/${startDate}/${endDate}`;
            } catch (e) {
                return;
            }
            
            try {
                const response = await fetch(capacityUrl); 
                if (!response.ok) { throw new Error(`Capacity HTTP error! status: ${response.status}`); }
                const data = await response.json();
                
                setCapacityData(Array.isArray(data) ? data : []);
                
            } catch (err) {
                console.error("Error fetching Capacity data:", err);
                setCapacityData([]); 
            }
        };

        fetchCapacity();
    }, [actualsData]); 

    // 3. Generate unique Employee IDs based on fetched data
    const uniqueEmployees = useMemo(() => getUniqueEmployees(actualsData), [actualsData]);

    // 4. Process Data 
    const { 
        labels, 
        directLabor, 
        totalCapacity, 
        utilizationRate, 
        utilAxisMin, 
        utilAxisMax,
        avgDirect,
        avgCapacity, 
        avgUtilization,
        hoursAxisMax 
    } = useMemo(() => {
        if (selectedEmployeeId !== 'All' && !uniqueEmployees.includes(selectedEmployeeId)) {
            setSelectedEmployeeId('All'); 
        }
        return processData(actualsData, capacityData, selectedEmployeeId); 
    }, [actualsData, capacityData, selectedEmployeeId, uniqueEmployees]); 

    // 5. Prepare Chart Data and Options (Memoized for performance)
    const utilizationChartOptions = useMemo(() => 
        getUtilizationChartOptions(utilAxisMin, utilAxisMax, hoursAxisMax), 
        [utilAxisMin, utilAxisMax, hoursAxisMax]
    );
    const hoursChartOptions = useMemo(() => getHoursChartOptions(hoursAxisMax), [hoursAxisMax]); 

    const utilizationChartData = useMemo(() => 
        getUtilizationChartData(labels, directLabor, totalCapacity, utilizationRate, avgUtilization), 
        [labels, directLabor, totalCapacity, utilizationRate, avgUtilization]
    );

    const hoursChartData = useMemo(() => 
        getHoursChartData(labels, directLabor, totalCapacity, avgDirect, avgCapacity), 
        [labels, directLabor, totalCapacity, avgDirect, avgCapacity]
    );

    // 6. Conditional Rendering Logic
    const ChartToDisplay = useMemo(() => {
        if (isLoading || error) {
            return <NoDataMessage isLoading={isLoading} error={error} />;
        }
        
        if (actualsData.length === 0 || labels.length === 0) {
             const message = actualsData.length === 0 
                ? "No Actual Hours data loaded from API."
                : "No valid data to display after processing (check filter or dates).";

             return <NoDataMessage isLoading={false} error={message} />;
        }
        
        if (activeTab === 'costUtilization') {
            return <Bar options={utilizationChartOptions} data={utilizationChartData} />;
        } else if (activeTab === 'actualAvailable') {
            return <Bar options={hoursChartOptions} data={hoursChartData} />;
        }
        return <NoDataMessage />;
    }, [activeTab, isLoading, error, labels, utilizationChartOptions, utilizationChartData, hoursChartOptions, hoursChartData, actualsData, capacityData]);

    const getTabClasses = (tabName) => 
        `px-4 py-2 font-semibold border-b-2 cursor-pointer transition-colors duration-200 ${
            activeTab === tabName 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
        }`;

    return (
        <div className="p-4 bg-white rounded-lg shadow w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Labor Analysis Dashboard
            </h2>

            {/* Employee Filter */}
            <div className="flex items-center space-x-4 mb-6">
                <label htmlFor="employee-filter" className="font-semibold text-gray-700">
                    Employee Filter:
                </label>
                <select
                    id="employee-filter"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading || error || actualsData.length === 0}
                >
                    {uniqueEmployees.map(id => (
                        <option key={id} value={id}>
                            {id === "All" ? "All Employees" : `${id}`}
                        </option>
                    ))}
                </select>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b mb-6">
                <div 
                    className={getTabClasses('costUtilization')} 
                    onClick={() => setActiveTab('costUtilization')}
                >
                    Labor Cost & Utilization (Actual Bar & Capacity Line)
                </div>
                <div 
                    className={getTabClasses('actualAvailable')} 
                    onClick={() => setActiveTab('actualAvailable')}
                >
                    Actual Bar vs. Available Hours Bar
                </div>
            </div>

            {/* Chart Container */}
            <div id="labor-chart-container" style={{ height: '500px', width: '100%' }}>
                {ChartToDisplay}
            </div>

            <p className="text-sm text-gray-600 mt-4 pt-2 border-t">
                Current Hours Y-axis Max: {hoursAxisMax.toFixed(0)} Hrs. Data is filtered to the last 12 periods.
            </p>
        </div>
    );
};

export default UtilizationChart;