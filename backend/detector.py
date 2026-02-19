import pandas as pd
import networkx as nx
import time
import uuid
from datetime import timedelta


   # Inside detector.py update:
class MoneyMulingDetector:
    def __init__(self, df):
        self.df = df # Accepts the dataframe directly from the API
        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        # ... rest of the logic remains the same ...
        
        # Results storage
        self.suspicious_accounts = {} # account_id -> {score, patterns, ring_id}
        self.fraud_rings = [] # List of ring objects
        self.start_time = time.time()

    def build_graph(self):
        """Builds a directed graph where edges hold transaction metadata."""
        for _, row in self.df.iterrows():
            self.G.add_edge(
                row['sender_id'], 
                row['receiver_id'], 
                amount=row['amount'], 
                timestamp=row['timestamp'],
                tx_id=row['transaction_id']
            )

    def _add_suspicion(self, account_id, pattern, score_boost, ring_id):
        """Updates suspicion score and tracks patterns per account."""
        if account_id not in self.suspicious_accounts:
            self.suspicious_accounts[account_id] = {
                "account_id": account_id,
                "suspicion_score": 0.0,
                "detected_patterns": set(),
                "ring_id": ring_id
            }
        
        self.suspicious_accounts[account_id]["detected_patterns"].add(pattern)
        # Cap score at 100
        current_score = self.suspicious_accounts[account_id]["suspicion_score"]
        self.suspicious_accounts[account_id]["suspicion_score"] = min(100, current_score + score_boost)

    def detect_cycles(self):
        """Pattern 1: Circular Fund Routing (Length 3-5)."""
        # We use a limited depth search to find cycles of length 3 to 5
        # Simple cycles can be slow, so we filter by length
        cycles = list(nx.simple_cycles(self.G))
        for cycle in cycles:
            if 3 <= len(cycle) <= 5:
                ring_id = f"RING_CYC_{str(uuid.uuid4())[:6]}"
                
                for node in cycle:
                    self._add_suspicion(node, f"cycle_length_{len(cycle)}", 85.0, ring_id)
                
                self.fraud_rings.append({
                    "ring_id": ring_id,
                    "member_accounts": cycle,
                    "pattern_type": "cycle",
                    "risk_score": 90.0
                })

    def detect_smurfing(self):
        """Pattern 2: Fan-in / Fan-out with 72-hour window analysis."""
        # Fan-in Detection
        for node in self.G.nodes():
            in_edges = self.df[self.df['receiver_id'] == node]
            if len(in_edges) >= 10:
                # Check 72h window
                time_diff = in_edges['timestamp'].max() - in_edges['timestamp'].min()
                if time_diff <= timedelta(hours=72):
                    # Potential Smurfing / Aggregator
                    ring_id = f"RING_SMURF_{str(uuid.uuid4())[:6]}"
                    senders = in_edges['sender_id'].unique().tolist()
                    
                    self._add_suspicion(node, "high_velocity_aggregator", 75.0, ring_id)
                    for s in senders:
                        self._add_suspicion(s, "smurfing_sender", 60.0, ring_id)
                    
                    self.fraud_rings.append({
                        "ring_id": ring_id,
                        "member_accounts": [node] + senders,
                        "pattern_type": "smurfing_fan_in",
                        "risk_score": 80.0
                    })

    def detect_shell_networks(self):
        """Pattern 3: Layered Shell Networks (3+ hops, quiet intermediate nodes)."""
        # Identify "quiet" nodes (total degree 2-3)
        quiet_nodes = [n for n, d in self.G.degree() if 2 <= d <= 3]
        
        # Look for paths of length 3+ through quiet nodes
        for node in self.G.nodes():
            for target in self.G.nodes():
                if node == target: continue
                # Search for paths
                for path in nx.all_simple_paths(self.G, source=node, target=target, cutoff=4):
                    if len(path) >= 4: # 3+ hops means 4 nodes in path
                        # Check if intermediate nodes are 'quiet'
                        intermediates = path[1:-1]
                        if all(n in quiet_nodes for n in intermediates):
                            ring_id = f"RING_SHELL_{str(uuid.uuid4())[:6]}"
                            for n in path:
                                self._add_suspicion(n, "shell_network_hop", 70.0, ring_id)
                            
                            self.fraud_rings.append({
                                "ring_id": ring_id,
                                "member_accounts": path,
                                "pattern_type": "layered_shell",
                                "risk_score": 75.0
                            })
                            break # Avoid duplicate rings for same path

    def get_final_json(self):
        """Compiles results into the EXACT required format."""
        # Convert sets to lists for JSON serialization
        suspicious_list = []
        for acc_id in self.suspicious_accounts:
            acc = self.suspicious_accounts[acc_id]
            acc["detected_patterns"] = list(acc["detected_patterns"])
            suspicious_list.append(acc)
            
        # Sort descending by score
        suspicious_list.sort(key=lambda x: x['suspicion_score'], reverse=True)

        processing_time = round(time.time() - self.start_time, 2)
        
        return {
            "suspicious_accounts": suspicious_list,
            "fraud_rings": self.fraud_rings,
            "summary": {
                "total_accounts_analyzed": self.G.number_of_nodes(),
                "suspicious_accounts_flagged": len(suspicious_list),
                "fraud_rings_detected": len(self.fraud_rings),
                "processing_time_seconds": processing_time
            }
        }

# Usage Example:
# detector = MoneyMulingDetector('transactions.csv')
# detector.detect_cycles()
# detector.detect_smurfing()
# detector.detect_shell_networks()
# result_json = detector.get_final_json()
