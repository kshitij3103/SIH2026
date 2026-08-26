# AI-Powered Continuous Cyber Risk Quantification Platform

This repository contains the foundational dataset and codebase for building an AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform (SIH Problem Statement 26105).

## Dataset Description

The `data/` directory contains a simulated, relational dataset representing the technical telemetry and business context required to model cyber risk financially. It consists of 5 interconnected CSV files:

### 1. `assets.csv` (Business Context)
The core inventory of the organization's infrastructure.
- **Key Fields**: `asset_id`, `business_unit`, `criticality` (1-5), `data_sensitivity_tier`, `financial_value_usd`, `downtime_cost_per_hour_usd`.
- **Purpose**: Defines the intrinsic value and potential loss magnitude (in USD) if an asset is compromised.

### 2. `vulnerabilities.csv` (Weaknesses)
The vulnerabilities present on the assets.
- **Key Fields**: `vuln_id`, `asset_id` (foreign key), `cve_id`, `cvss_score`, `epss_score` (exploit probability), `severity`.
- **Purpose**: Feeds the "Likelihood" calculation. The EPSS score provides a realistic probability of exploitation, avoiding guesswork.

### 3. `threat_events.csv` (Historical Incident Data)
Simulated parsed SIEM alerts (inspired by Splunk Attack Data). 
- **Key Fields**: `event_id`, `asset_id`, `mitre_technique_id`, `severity`, `action_taken` (Blocked/Allowed), `downtime_hours_caused`.
- **Purpose**: Acts as historical training data for the Machine Learning model to calculate attack frequency and historical success rates against specific assets.

### 4. `controls.csv` (Mitigation Strategies)
The catalog of available security defenses (e.g., MFA, EDR, Network Segmentation).
- **Key Fields**: `control_id`, `name`, `risk_reduction_pct`, `cost_usd`.
- **Purpose**: Provides the cost-benefit inputs for the Knapsack optimization algorithm to recommend the best security investments under a specific budget constraint.

### 5. `asset_controls.csv` (Deployed Defenses)
The mapping table showing which controls are currently active on which assets.
- **Key Fields**: `mapping_id`, `asset_id`, `control_id`, `status`.
- **Purpose**: Essential for calculating "Residual Risk." By knowing what is already deployed, the Risk Engine can calculate the current Expected Annual Loss (EAL) versus the projected EAL if a new control is purchased.

## Data Generation
To regenerate the dataset with different parameters, run:
```bash
python scripts/generate_dataset.py
```
