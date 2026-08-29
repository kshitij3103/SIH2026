import logging
from pathlib import Path

from .config import EngineConfig, DEFAULT_CONFIG
from .ingest import DataIngestor
from .likelihood import LikelihoodModel
from .frequency import FrequencyModel
from .loss_magnitude import LossMagnitudeModel
from .simulate import MonteCarloSimulator
from .aggregate import RiskAggregator
from .control_scenarios import ControlScenarios

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class RiskPipeline:
    """End-to-end orchestration of the Risk Quantification Engine."""
    
    def __init__(self, config: EngineConfig = DEFAULT_CONFIG):
        self.config = config
        
    def run_all(self):
        """Runs the complete FAIR-aligned risk quantification pipeline."""
        logger.info("Starting Cyber Risk Quantification Pipeline...")
        
        # 1. Ingest
        logger.info("Phase B: Ingesting and normalizing data...")
        ingestor = DataIngestor(self.config)
        raw_data = ingestor.load_data()
        base_df = ingestor.build_asset_risk_base(raw_data)
        
        # 2. Likelihood
        logger.info("Phase C: Calculating vulnerabilities (EPSS/CVSS)...")
        likelihood = LikelihoodModel(self.config)
        df = likelihood.apply_to_dataframe(base_df)
        
        # 3. Frequency
        logger.info("Phase D: Estimating Threat Event Frequencies...")
        frequency = FrequencyModel(self.config)
        df = frequency.apply_to_dataframe(df)
        
        # 4. Loss Magnitude
        logger.info("Phase E: Calculating Loss Magnitudes...")
        loss_mag = LossMagnitudeModel(self.config)
        df = loss_mag.apply_to_dataframe(df)
        
        # 5. Monte Carlo Simulation
        logger.info(f"Phase F: Running Monte Carlo Simulation ({self.config.n_simulations} iterations per asset)...")
        simulator = MonteCarloSimulator(self.config)
        df = simulator.apply_to_dataframe(df)
        
        # 6. Aggregation
        logger.info("Phase G: Aggregating risk metrics...")
        aggregator = RiskAggregator(self.config)
        aggregates = aggregator.aggregate(df)
        
        # 7. Control Scenarios
        logger.info("Phase H: Evaluating Control Scenarios and ROSI...")
        scenarios = ControlScenarios(self.config)
        controls_df = raw_data["controls"]
        scenario_results = scenarios.evaluate_scenarios(df, controls_df)
        
        # 8. Save Outputs
        logger.info("Saving results to parquet...")
        out_dir = self.config.output_dir
        out_dir.mkdir(parents=True, exist_ok=True)
        
        # Drop complex structures for parquet serialization where necessary
        asset_summary = aggregates["asset_risk_summary"].copy()
        asset_summary["LEC_points"] = asset_summary["LEC_points"].apply(list)
        
        asset_summary.to_parquet(out_dir / "asset_risk_summary.parquet", index=False)
        aggregates["business_unit_risk_summary"].to_parquet(out_dir / "business_unit_risk_summary.parquet", index=False)
        aggregates["org_risk_summary"].to_parquet(out_dir / "org_risk_summary.parquet", index=False)
        scenario_results.to_parquet(out_dir / "control_scenario_results.parquet", index=False)
        
        # For full traceability, optionally save the complete df
        # df.to_parquet(out_dir / "full_simulation_base.parquet", index=False)
        
        logger.info("Pipeline completed successfully!")
        
if __name__ == "__main__":
    pipeline = RiskPipeline()
    pipeline.run_all()
