import json
import random
import uuid
import datetime
from pathlib import Path

# Goal: Create a compiled dataset that a Risk Quantification Engine can ingest.
# This simulates the processed output of raw SIEM logs (like those from splunk/attack_data)
# augmented with business context (assets, vulnerabilities, controls).

def generate_assets(num_assets=50):
    assets = []
    business_units = ["Finance", "HR", "Engineering", "Sales", "Operations"]
    for i in range(num_assets):
        criticality = random.choices([1, 2, 3, 4, 5], weights=[10, 20, 40, 20, 10])[0]
        # Financial impact if asset is compromised (in USD)
        value = criticality * random.randint(10000, 100000)
        downtime_cost = criticality * random.randint(1000, 5000)
        assets.append({
            "asset_id": f"AST-{1000+i}",
            "hostname": f"host-{random.randint(10,99)}-{business_units[random.randint(0,4)].lower()}.internal",
            "business_unit": random.choice(business_units),
            "criticality": criticality,
            "financial_value_usd": value,
            "downtime_cost_per_hour_usd": downtime_cost,
            "regulatory_penalty_potential_usd": random.choice([0, 50000, 250000, 1000000]) if criticality >= 4 else 0,
            "os": random.choice(["Windows Server 2019", "Ubuntu 22.04", "RHEL 8", "Windows 10"])
        })
    return assets

def generate_vulnerabilities(assets, num_vulns=100):
    vulns = []
    cve_list = ["CVE-2021-44228", "CVE-2023-23397", "CVE-2020-1472", "CVE-2019-0708", "CVE-2022-26134"]
    for i in range(num_vulns):
        cve = random.choice(cve_list)
        cvss = round(random.uniform(2.0, 10.0), 1)
        
        if cvss < 4.0: severity = "Low"
        elif cvss < 7.0: severity = "Medium"
        elif cvss < 9.0: severity = "High"
        else: severity = "Critical"
        
        vulns.append({
            "vuln_id": f"VULN-{uuid.uuid4().hex[:8]}",
            "asset_id": random.choice(assets)["asset_id"],
            "cve_id": cve,
            "cvss_score": cvss,
            "severity": severity,
            "status": random.choice(["Open", "In Progress", "Risk Accepted"]),
            "discovery_date": (datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 100))).isoformat()
        })
    return vulns

def generate_threat_events(assets, num_events=200):
    """
    Simulates parsed events from datasets like splunk/attack_data.
    Instead of raw logs, these are the aggregated 'alerts' or 'threats' detected.
    """
    events = []
    attack_types = [
        ("T1059.001", "PowerShell Execution", "Medium"),
        ("T1110.001", "Password Guessing", "Low"),
        ("T1003.001", "LSASS Memory Credential Dumping", "High"),
        ("T1486", "Data Encrypted for Impact (Ransomware)", "Critical"),
        ("T1078", "Valid Accounts", "Medium")
    ]
    for i in range(num_events):
        attack = random.choice(attack_types)
        action = random.choice(["Blocked", "Allowed", "Alerted"])
        
        # Simulate financial impact variables if the attack succeeded
        downtime_hours = 0
        records_compromised = 0
        if action == "Allowed":
            if attack[2] == "Critical":
                downtime_hours = random.randint(4, 72)
            elif attack[2] == "High":
                records_compromised = random.randint(100, 50000)
                
        events.append({
            "event_id": f"EVT-{uuid.uuid4().hex[:8]}",
            "timestamp": (datetime.datetime.now() - datetime.timedelta(hours=random.randint(1, 720))).isoformat(),
            "asset_id": random.choice(assets)["asset_id"],
            "mitre_technique_id": attack[0],
            "description": attack[1],
            "severity": attack[2],
            "source_ip": f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
            "action_taken": action,
            "downtime_hours_caused": downtime_hours,
            "records_compromised": records_compromised
        })
    return events

def generate_controls():
    return [
        {"control_id": "CTRL-01", "name": "Endpoint Detection & Response (EDR)", "effectiveness": 0.85, "cost_usd": 50000},
        {"control_id": "CTRL-02", "name": "Multi-Factor Authentication (MFA)", "effectiveness": 0.95, "cost_usd": 20000},
        {"control_id": "CTRL-03", "name": "Network Segmentation", "effectiveness": 0.70, "cost_usd": 80000},
        {"control_id": "CTRL-04", "name": "Regular Patching Program", "effectiveness": 0.80, "cost_usd": 30000},
    ]

def main():
    assets = generate_assets(50)
    vulns = generate_vulnerabilities(assets, 120)
    events = generate_threat_events(assets, 300)
    controls = generate_controls()

    dataset = {
        "metadata": {
            "generated_at": datetime.datetime.now().isoformat(),
            "description": "Compiled cyber risk dataset simulating augmented Splunk Attack Data for Risk Quantification"
        },
        "assets": assets,
        "vulnerabilities": vulns,
        "threat_events": events,
        "controls": controls
    }

    output_dir = Path("c:/Users/Kshitij/Desktop/SIH/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    import csv
    
    def write_csv(filename, data_list):
        if not data_list: return
        file_path = output_dir / filename
        with open(file_path, "w", newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data_list[0].keys())
            writer.writeheader()
            writer.writerows(data_list)
            
    write_csv("assets.csv", assets)
    write_csv("vulnerabilities.csv", vulns)
    write_csv("threat_events.csv", events)
    write_csv("controls.csv", controls)
        
    print(f"Dataset successfully compiled and saved as CSV files in {output_dir}")
    print(f"Total Assets: {len(assets)}")
    print(f"Total Vulnerabilities: {len(vulns)}")
    print(f"Total Threat Events: {len(events)}")
    print(f"Total Controls: {len(controls)}")

if __name__ == "__main__":
    main()
