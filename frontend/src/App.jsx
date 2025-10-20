import { useState, useEffect } from 'react';
import './App.css';
import { GetCashData, GetBankData } from "../wailsjs/go/main/App";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const colorPalette = [
    'rgba(255, 99, 132, 0.6)',  // Red
    'rgba(54, 162, 235, 0.6)', // Blue
    'rgba(255, 206, 86, 0.6)', // Yellow
    'rgba(75, 192, 192, 0.6)', // Green
    'rgba(153, 102, 255, 0.6)',// Purple
    'rgba(255, 159, 64, 0.6)', // Orange
    'rgba(99, 255, 132, 0.6)', // Lime
    'rgba(235, 54, 162, 0.6)', // Pink
];

function App() {
    const [cashChartData, setCashChartData] = useState(null);
    const [bankChartData, setBankChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        const fetchData = (isInitialLoad = false) => {
            if (isInitialLoad) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            Promise.all([GetCashData(), GetBankData()])
                .then(([cashData, bankData]) => {
                    // Process cash data
                    if (cashData) {
                        const cashBackgroundColors = cashData.map((_, index) => colorPalette[index % colorPalette.length]);
                        const cashBorderColors = cashBackgroundColors.map(color => color.replace('0.6', '1'));
                        const cashChart = {
                            labels: cashData.map(s => s.cash_register_name),
                            datasets: [{
                                label: 'Cash Balance',
                                data: cashData.map(s => s.sum),
                                backgroundColor: cashBackgroundColors,
                                borderColor: cashBorderColors,
                                borderWidth: 1,
                            }, ],
                        };
                        setCashChartData(cashChart);
                    } else {
                        setCashChartData(null);
                    }

                    // Process bank data
                    if (bankData) {
                        const bankBackgroundColors = bankData.map((_, index) => colorPalette[(index + 2) % colorPalette.length]); // Offset colors
                        const bankBorderColors = bankBackgroundColors.map(color => color.replace('0.6', '1'));
                        const bankChart = {
                            labels: bankData.map(s => s.cash_register_name),
                            datasets: [{
                                label: 'Bank Balance',
                                data: bankData.map(s => s.sum),
                                backgroundColor: bankBackgroundColors,
                                borderColor: bankBorderColors,
                                borderWidth: 1,
                            }, ],
                        };
                        setBankChartData(bankChart);
                    }
                     else {
                        setBankChartData(null);
                    }

                    setLastUpdated(new Date());
                    setError(null); // Clear previous errors on successful fetch
                })
                .catch(err => {
                    console.error(err);
                    const errorMessage = err.message || "An unknown error occurred.";
                    setError(`Failed to fetch data: ${errorMessage}`);
                })
                .finally(() => {
                    if (isInitialLoad) {
                        setLoading(false);
                    } else {
                        setRefreshing(false);
                    }
                });
        };

        fetchData(true); // Initial fetch
        const intervalId = setInterval(fetchData, 60000); // Fetch every 60 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
        },
    };

    return (
        <div id="App">
            <h1>Dashboard</h1>
            <div className="header-info">
                {lastUpdated && <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>}
                {refreshing && <p className="refreshing-indicator">Updating...</p>}
            </div>
            <div className="charts-wrapper">
                <div className="chart-container">
                    <h2>Cash Balances</h2>
                    {loading && <p>Loading data...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {cashChartData && !loading && !error && (
                        <Doughnut options={options} data={cashChartData} />
                    )}
                    {!cashChartData && !loading && !error && (
                        <p>No cash data to display.</p>
                    )}
                </div>
                <div className="chart-container">
                    <h2>Bank Balances</h2>
                    {loading && <p>Loading data...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {bankChartData && !loading && !error && (
                        <Doughnut options={options} data={bankChartData} />
                    )}
                    {!bankChartData && !loading && !error && (
                        <p>No bank data to display.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App
