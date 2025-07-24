import React, { useEffect, useState } from 'react';
import './App.css';
import GaugeChart from 'react-gauge-chart';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

function App() {
  const [gateway, setGateway] = useState('');
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [ping, setPing] = useState(null);
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanResults, setShowScanResults] = useState(true);
  const [hostCount, setHostCount] = useState(0);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    fetch('/speedtest/history')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistoryData(data);
        }
      })
      .catch((err) => console.error('Failed to load history:', err));
  }, []);

  useEffect(() => {
    fetch('/gateway')
      .then((res) => res.json())
      .then((data) => setGateway(data.gateway_ip || 'Unknown'))
      .catch(() => setGateway('Error'));
  }, []);

  useEffect(() => {
    runSpeedtest();
    const interval = setInterval(runSpeedtest, 120_000);
    return () => clearInterval(interval);
  }, []);

  const runSpeedtest = async () => {
    const res = await fetch('/speedtest');
    const data = await res.json();
    if (!data.error) {
      setDownloadSpeed(data.download_mbps);
      setUploadSpeed(data.upload_mbps);
      setPing(data.ping_ms);
    }
  };

  const runScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/scan');
      const data = await res.json();

      if (Array.isArray(data.results)) {
        setScanResults(data.results);
        setHostCount(data.host_count);
      } else {
        console.error('Invalid scan results format:', data);
        setScanResults([]);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      setScanResults([]);
    }
    setIsScanning(false);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
        },
      },
    },
    scales: {
      x: { ticks: { color: '#ccc' } },
      y: { ticks: { color: '#ccc' } },
    },
  };

  return (
    <div className='App'>
      <header className='header'>
        <img src='/logo.svg' alt='NetWatchdog Logo' className='logo' />
        <p>Default Gateway: {gateway}</p>
        <div className='button-group'>
          <button onClick={runSpeedtest}>Run Speedtest</button>
          <button onClick={runScan}>Scan Network</button>
        </div>
      </header>

      <main>
        <div className='gauges'>
          <div className='gauge-container'>
            <h3>Download</h3>
            <GaugeChart
              id='download-gauge'
              nrOfLevels={30}
              percent={(downloadSpeed || 0) / 1000}
              text={`${downloadSpeed ?? '--'} Mbps`}
              animate
              needleColor='#fff'
              colors={['#00ff99', '#0099ff']}
            />
          </div>
          <div className='gauge-container'>
            <h3>Upload</h3>
            <GaugeChart
              id='upload-gauge'
              nrOfLevels={30}
              percent={(uploadSpeed || 0) / 100}
              text={`${uploadSpeed ?? '--'} Mbps`}
              animate
              needleColor='#fff'
              colors={['#ffcc00', '#ff0066']}
            />
          </div>
          <div className='gauge-container'>
            <h3>Ping</h3>
            <GaugeChart
              id='ping-gauge'
              nrOfLevels={30}
              percent={(ping || 0) / 500}
              text={`${ping ?? '--'} ms`}
              animate
              needleColor='#fff'
              colors={['#cccccc', '#ff3333']}
            />
          </div>
        </div>

        <div className='charts-wrapper'>
          <div className='chart-container'>
            <h3>Download History</h3>
            <Line
              data={{
                labels: historyData.map((entry) =>
                  new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                ),
                datasets: [
                  {
                    label: 'Download (Mbps)',
                    data: historyData.map((entry) => entry.download_mbps),
                    borderColor: '#00ff99',
                    tension: 0.3,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>

          <div className='chart-container'>
            <h3>Upload History</h3>
            <Line
              data={{
                labels: historyData.map((entry) =>
                  new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                ),
                datasets: [
                  {
                    label: 'Upload (Mbps)',
                    data: historyData.map((entry) => entry.upload_mbps),
                    borderColor: '#ffcc00',
                    tension: 0.3,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>

          <div className='chart-container'>
            <h3>Ping History</h3>
            <Line
              data={{
                labels: historyData.map((entry) =>
                  new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                ),
                datasets: [
                  {
                    label: 'Ping (ms)',
                    data: historyData.map((entry) => entry.ping_ms),
                    borderColor: '#ff3333',
                    tension: 0.3,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        <div className='scan-section'>
          <div className='scan-header'>
            <h2>Scan Results</h2>
            <button onClick={() => setShowScanResults(!showScanResults)}>
              {showScanResults ? 'Hide' : 'Show'}
            </button>
          </div>
          {isScanning && <p>Scanning network...</p>}
          {showScanResults && !isScanning && (
            <div className='scan-results'>
              {scanResults.length === 0 ? (
                <p>No results yet.</p>
              ) : (
                scanResults.map((host, index) => (
                  <div className='scan-entry' key={index}>
                    <div className='scan-ip'>
                      <strong>{host.ip}</strong>
                    </div>
                    <div className='scan-ports'>Ports: {host.open_ports.join(', ') || 'None'}</div>
                  </div>
                ))
              )}
              <div className='scan-host-count'>
                <p>Hosts Scanned: {hostCount}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
