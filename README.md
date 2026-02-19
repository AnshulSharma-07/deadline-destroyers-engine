🕵️‍♂️ VIGILANCE: Graph-Based Financial Forensics Engine
RIFT 2026 Hackathon | Money Muling Detection Track

Team Name: Deadline Destroyers
Live Demo: [INSERT_YOUR_VERCEL_URL_HERE]
GitHub Repo: [INSERT_YOUR_GITHUB_URL_HERE]

🚀 Overview

VIGILANCE is a high-performance Financial Forensics Engine built to expose money muling networks. While traditional systems struggle with multi-hop transfers, our engine utilizes advanced Graph Theory to detect illicit fund layering, circular routing, and smurfing aggregators within seconds.

🛠 Tech Stack

Frontend: React 18, Tailwind CSS, Cytoscape.js

Backend: FastAPI (Python 3.10), NetworkX, Pandas

Deployment: Vercel (Frontend), Render/Railway (Backend)

🏗 System Architecture

Ingestion: CSV validator ensures compliance with RIFT mandatory schema.

Graph Mapping: Transactions are modeled as directed edges between account nodes.

Pattern Engine: Concurrent execution of Cycle Detection, Smurfing Analysis, and Shell Network pathfinding.

Reporting: Generation of interactive visualizations and standardized JSON exports.

🧠 Detection Logic & Algorithms
1. Circular Fund Routing (Cycles)

Algorithm: Depth-Limited Cycle Detection.

Logic: Identifies loops of length 3–5 where funds return to the origin, obfuscating the source.

2. Smurfing Patterns (Fan-in / Fan-out)

Logic: Detects nodes with 10+ inbound/outbound edges occurring within a 72-hour temporal window.

False Positive Control: Implements amount-variance checks to differentiate between payroll/merchants and illicit smurfing.

3. Layered Shell Networks

Logic: Identifies chains of 3+ hops involving "quiet" intermediate nodes (total degree ≤ 3) used as temporary staging for illicit funds.

⚖️ Suspicion Score Methodology

Accounts are ranked on a 0–100 scale using a weighted model:

Cycle Presence: 45% weight (High risk)

Temporal Velocity: 30% weight (Smurfing indicator)

Path Layering: 25% weight (Shell network indicator)

📖 Installation & Usage
Backend
code
Bash
download
content_copy
expand_less
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
Frontend
code
Bash
download
content_copy
expand_less
cd frontend
npm install
npm run start
✅ Mandatory Requirements Checklist

Live Web App: Deployed on Vercel/Render.

CSV Upload: Supports mandatory schema (transaction_id, sender_id, receiver_id, amount, timestamp).

Interactive Graph: Highlights suspicious nodes and muling rings.

JSON Export: Matches the EXACT specified format in the problem statement.

Performance: Optimized for datasets up to 10k transactions with < 30s processing time.

Deadline Destroyers | RIFT 2026
