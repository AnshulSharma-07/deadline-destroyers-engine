import React, { useState, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Upload, Download, AlertTriangle, Activity, Database, Users } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // 1. Handle File Upload to FastAPI
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Error processing file. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Prepare Graph Data (Nodes and Edges)
  const elements = useCallback(() => {
    if (!data) return [];
    
    const nodes = data.summary.total_accounts_analyzed > 0 ? [] : []; // Placeholder logic
    const edges = [];
    
    // Create a set of suspicious account IDs for quick lookup
    const suspiciousIds = new Set(data.suspicious_accounts.map(a => a.account_id));

    // Map suspicious accounts to nodes
    data.suspicious_accounts.forEach(acc => {
      nodes.push({
        data: { 
          id: acc.account_id, 
          label: acc.account_id, 
          score: acc.suspicion_score,
          patterns: acc.detected_patterns,
          isSuspicious: true 
        }
      });
    });

    // In a real scenario, you'd also pass edges from the backend. 
    // For this UI, we link members of the same rings.
    data.fraud_rings.forEach(ring => {
        for(let i=0; i < ring.member_accounts.length - 1; i++) {
            edges.push({
                data: { source: ring.member_accounts[i], target: ring.member_accounts[i+1] }
            });
        }
    });

    return [...nodes, ...edges];
  }, [data]);

  // 3. JSON Download Handler (Exact format requirement)
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'muling_analysis_report.json';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-400">FINANCIAL FORENSICS ENGINE</h1>
          <p className="text-slate-400 mt-1">RIFT 2026 Hackathon | Team: Deadline Destroyers</p>
        </div>
        
        <div className="flex gap-4">
          <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition px-4 py-2 rounded-lg cursor-pointer font-semibold">
            <Upload size={18} />
            Upload Transactions CSV
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
          </label>
          
          {data && (
            <button onClick={downloadJSON} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition font-semibold">
              <Download size={18} />
              Export JSON
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl">
          <Activity className="animate-spin text-emerald-500 mb-4" size={48} />
          <p className="text-xl font-medium">Analyzing Multi-hop Networks...</p>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-12 gap-6">
          
          {/* Stats Summary Panel */}
          <div className="col-span-12 grid grid-cols-4 gap-4 mb-2">
            <StatCard icon={<Database size={20}/>} label="Accounts Analyzed" value={data.summary.total_accounts_analyzed} color="blue" />
            <StatCard icon={<AlertTriangle size={20}/>} label="Suspicious Flagged" value={data.summary.suspicious_accounts_flagged} color="red" />
            <StatCard icon={<Users size={20}/>} label="Fraud Rings" value={data.summary.fraud_rings_detected} color="orange" />
            <StatCard icon={<Activity size={20}/>} label="Processing Time" value={`${data.summary.processing_time_seconds}s`} color="emerald" />
          </div>

          {/* Main Graph Visualization */}
          <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-2xl h-[600px] overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 bg-slate-950/80 p-3 rounded-md text-xs border border-slate-700">
                <p className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Suspicious Node</p>
                <p className="flex items-center gap-2 mt-1"><span className="w-3 h-3 bg-slate-500 rounded-full"></span> Normal Node</p>
            </div>
            <CytoscapeComponent
              elements={elements()}
              style={{ width: '100%', height: '100%' }}
              stylesheet={[
                {
                  selector: 'node',
                  style: {
                    'background-color': '#ef4444',
                    'label': 'data(id)',
                    'color': '#fff',
                    'font-size': '10px',
                    'width': '30px',
                    'height': '30px',
                    'border-width': 2,
                    'border-color': '#fff'
                  }
                },
                {
                  selector: 'edge',
                  style: {
                    'width': 2,
                    'line-color': '#334155',
                    'target-arrow-color': '#334155',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                  }
                }
              ]}
              layout={{ name: 'cose' }}
            />
          </div>

          {/* Side Details Panel */}
          <div className="col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" /> Top Suspicious Accounts
            </h2>
            <div className="space-y-4">
              {data.suspicious_accounts.slice(0, 10).map((acc) => (
                <div key={acc.account_id} className="p-4 bg-slate-950 rounded-xl border-l-4 border-red-500">
                  <p className="text-sm text-slate-400">Account ID</p>
                  <p className="font-mono font-bold text-lg">{acc.account_id}</p>
                  <div className="mt-2 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-slate-500 uppercase">Patterns</p>
                        <div className="flex gap-1 mt-1">
                            {acc.detected_patterns.map(p => (
                                <span key={p} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">{p}</span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase">Risk Score</p>
                        <p className="text-xl font-bold text-red-500">{acc.suspicion_score}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Table: Fraud Ring Summary */}
          <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Fraud Ring Summary Table</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-3 px-2">Ring ID</th>
                  <th className="pb-3 px-2">Pattern Type</th>
                  <th className="pb-3 px-2">Member Count</th>
                  <th className="pb-3 px-2">Risk Score</th>
                  <th className="pb-3 px-2">Member Account IDs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.fraud_rings.map((ring) => (
                  <tr key={ring.ring_id} className="hover:bg-slate-800/50 transition">
                    <td className="py-4 px-2 font-mono text-emerald-400">{ring.ring_id}</td>
                    <td className="py-4 px-2 capitalize">{ring.pattern_type}</td>
                    <td className="py-4 px-2">{ring.member_accounts.length}</td>
                    <td className="py-4 px-2 font-bold">{ring.risk_score}</td>
                    <td className="py-4 px-2 text-xs text-slate-400">{ring.member_accounts.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-400/10',
        red: 'text-red-400 bg-red-400/10',
        orange: 'text-orange-400 bg-orange-400/10',
        emerald: 'text-emerald-400 bg-emerald-400/10'
    };
    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-slate-400 text-xs uppercase font-semibold">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
};

export default Dashboard;
