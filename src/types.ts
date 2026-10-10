export type PropertyType = 'detached' | 'semi_detached' | 'end_terrace' | 'mid_terrace' | 'bungalow' | 'flat';

export type AgeBand =
  | 'pre_1919'
  | '1919_1944'
  | '1945_1964'
  | '1965_1982'
  | '1983_1995'
  | '1996_2011'
  | '2012_plus';

export type GlazingType = 'single' | 'secondary' | 'double_pre2002' | 'double_post2002' | 'triple';

export type WallType = 'cavity' | 'solid' | 'timber_system';
export type WallInsulation = 'none' | 'partial' | 'insulated';
export type RoofType = 'pitched_loft' | 'flat_roof' | 'none_dwelling_above';

export type HeatingType =
  | 'gas_condensing_boiler'
  | 'gas_noncondensing_boiler'
  | 'air_source_heat_pump'
  | 'electric_storage'
  | 'electric_direct'
  | 'other_fuel';

export type SmartControls =
  | 'none'
  | 'programmer_only'
  | 'programmer_thermostat'
  | 'programmer_thermostat_trvs'
  | 'smart_thermostat'
  | 'smart_zoned';

export type RoofOrientation = 'S' | 'SE' | 'SW' | 'E' | 'W' | 'N';
export type RoofShading = 'none' | 'some' | 'heavy';

export type ScoreClassification =
  | 'Highly efficient'
  | 'Good'
  | 'Moderate'
  | 'Poor'
  | 'Very poor'
  | 'Insufficient data';

export interface PropertyProfile {
  property_id: string;
  customer_id?: string;
  region: string;
  property_type: PropertyType;
  flat_position?: string;
  age_band: AgeBand;
  floor_area_m2: number;
  bedrooms: number;
  energy_rating: string;
  energy_rating_points: number;
  wall_type: WallType;
  wall_insulation: WallInsulation;
  roof_type: RoofType;
  loft_insulation_mm?: number;
  glazing: GlazingType;
  heating_type: HeatingType;
  has_gas_connection: boolean;
  gas_cooking?: boolean;
  solar_pv: boolean;
  solar_kwp?: number;
  smart_controls: SmartControls;
  roof_orientation?: RoofOrientation;
  roof_shading?: RoofShading;
  has_outdoor_space: boolean;
  listed_building: boolean;
  conservation_area: boolean;
  current_value_estimate: number;
  elec_import_annual?: number;
  gas_annual?: number;
  elec_status?: string;
  gas_status?: string;
  purchased_energy?: number;
  eui?: number;
  wall_u?: number;
  roof_u?: number;
  window_u?: number;
  fabric_adequate?: boolean;
  demo_seed?: boolean;
  score?: number;
  classification?: ScoreClassification;
}

export interface ComponentScore {
  key: string;
  label: string;
  short_label: string;
  weight: number;
  score: number;
  weighted_score: number;
  provenance: 'measured' | 'user_provided' | 'estimated' | 'default';
  hint: string;
}

export interface ScoreResult {
  score: number;
  classification: ScoreClassification;
  status: 'confirmed' | 'provisional' | 'insufficient_data' | 'projected';
  range_low: number;
  range_high: number;
  components: ComponentScore[];
  completeness: number;
}

export interface IssueItem {
  code: string;
  text: string;
  evidence: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RecommendationItem {
  sequence_position: number;
  measure_id: string;
  name: string;
  stage: number;
  category: string;
  suitability: 'High' | 'Medium' | 'Low';
  reason: string;
  cost_low_gbp: number;
  cost_high_gbp: number;
  gas_saving_kwh: number;
  elec_saving_kwh: number; // Note: negative means electricity use increases (e.g. heat pump)
  net_saving_kwh: number;
  carbon_reduction_kg: number;
  bill_saving_gbp: number;
}

export interface IneligibleMeasure {
  measure_id: string;
  name: string;
  reason: string;
  status: 'already_installed' | 'not_applicable' | 'blocked' | 'needs_information' | 'previously_declined';
}

export interface PackageSummary {
  measures: string[];
  current_gas_kwh: number;
  current_elec_kwh: number;
  current_total_kwh: number;
  post_gas_kwh: number;
  post_elec_kwh: number;
  post_total_kwh: number;
  saving_gas_kwh: number;
  saving_elec_kwh: number;
  saving_total_kwh: number;
  saving_pct: number;
  current_carbon_kg: number;
  post_carbon_kg: number;
  carbon_reduction_kg: number;
  cost_low_gbp: number;
  cost_high_gbp: number;
  current_bill_gbp: number;
  post_bill_gbp: number;
  bill_saving_gbp: number;
  simple_payback_years?: number;
  projected_score: number;
  projected_classification: ScoreClassification;
  projected_rating: string;
  value_impact_low_pct: number;
  value_impact_high_pct: number;
  value_impact_low_gbp: number;
  value_impact_high_gbp: number;
}

export interface AssessmentResult {
  property_id: string;
  profile: PropertyProfile;
  score: ScoreResult;
  issues: IssueItem[];
  recommendations: RecommendationItem[];
  not_suitable: IneligibleMeasure[];
  needs_information: IneligibleMeasure[];
  previously_declined: IneligibleMeasure[];
  package: PackageSummary;
  fact_sheet: Record<string, string>;
  data_quality: {
    measured_count: number;
    estimated_count: number;
    missing_count: number;
    flags: string[];
  };
}

export interface CustomerMemoryEvent {
  id: string;
  customer_id: string;
  property_id: string;
  created_utc: string;
  type: 'completed_retrofit' | 'constraint' | 'declined';
  payload: Record<string, any>;
}

export interface PortfolioSummaryStats {
  n_properties: number;
  flagged_count: number;
  flagged_share: number;
  median_score: number;
  total_carbon_reduction_t: number;
  class_counts: Record<string, number>;
}
