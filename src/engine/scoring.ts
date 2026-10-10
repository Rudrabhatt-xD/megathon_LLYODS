import {
  AssessmentResult,
  ComponentScore,
  CustomerMemoryEvent,
  GlazingType,
  HeatingType,
  IneligibleMeasure,
  IssueItem,
  PackageSummary,
  PropertyProfile,
  RecommendationItem,
  RoofType,
  ScoreClassification,
  ScoreResult,
  SmartControls,
  WallInsulation,
  WallType,
} from '../types';

export const SCORE_WEIGHTS = {
  energy_efficiency: 0.25,
  consumption_intensity: 0.20,
  insulation: 0.15,
  heating_system: 0.15,
  windows_glazing: 0.10,
  renewable_energy: 0.10,
  smart_energy_management: 0.05,
};

export const EPC_SCORES: Record<string, number> = {
  A: 96,
  B: 86,
  C: 75,
  D: 62,
  E: 47,
  F: 30,
  G: 11,
};

export const HEATING_SCORES: Record<HeatingType, number> = {
  air_source_heat_pump: 100,
  gas_condensing_boiler: 60,
  gas_noncondensing_boiler: 50,
  electric_storage: 35,
  electric_direct: 35,
  other_fuel: 40,
};

export const CONTROLS_SCORES: Record<SmartControls, number> = {
  smart_zoned: 100,
  smart_thermostat: 85,
  programmer_thermostat_trvs: 65,
  programmer_thermostat: 50,
  programmer_only: 25,
  none: 0,
};

export const GLAZING_U_VALUES: Record<GlazingType, number> = {
  single: 4.8,
  secondary: 2.9,
  double_pre2002: 2.8,
  double_post2002: 2.0,
  triple: 1.4,
};

export const EMISSION_FACTORS = {
  DESNZ_2026: {
    electricity: 0.14395, // Generation (0.13096) + T&D (0.01299) kg CO2e / kWh
    gas: 0.18231, // kg CO2e / kWh
  },
};

export const ENERGY_PRICES = {
  OFGEM_2026Q4: {
    electricity_gbp_per_kwh: 0.245,
    gas_gbp_per_kwh: 0.062,
  },
};

export function getWallUValue(type: WallType, insulation: WallInsulation, ageBand: string): number {
  if (type === 'cavity') {
    if (insulation === 'none') return 1.5;
    if (insulation === 'partial') return 1.0;
    if (ageBand === '2012_plus') return 0.28;
    if (ageBand === '1996_2011') return 0.45;
    return 0.55;
  }
  if (type === 'solid') {
    if (insulation === 'none') return 2.0;
    if (insulation === 'partial') return 1.0;
    return 0.35;
  }
  return 0.45;
}

export function getRoofUValue(roofType: RoofType, loftMm?: number, ageBand?: string): number {
  if (roofType === 'pitched_loft') {
    const mm = loftMm ?? 0;
    if (mm >= 300) return 0.14;
    if (mm >= 270) return 0.16;
    if (mm >= 200) return 0.21;
    if (mm >= 150) return 0.30;
    if (mm >= 100) return 0.40;
    if (mm >= 50) return 0.68;
    if (mm >= 25) return 1.0;
    return 2.3;
  }
  if (roofType === 'flat_roof') {
    if (ageBand === '2012_plus') return 0.18;
    if (ageBand === '1983_1995' || ageBand === '1996_2011') return 0.35;
    return 1.5;
  }
  // none_dwelling_above (mid flat)
  return 0.25;
}

export function classifyScore(score: number): ScoreClassification {
  if (score >= 80) return 'Highly efficient';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Poor';
  return 'Very poor';
}

export function calculateScores(p: PropertyProfile): ScoreResult {
  // 1. Energy Efficiency
  const epcBand = (p.energy_rating || 'D').toUpperCase();
  const s_ee = EPC_SCORES[epcBand] ?? 62;

  // 2. Consumption Intensity (EUI)
  const eui = p.eui ?? (p.purchased_energy && p.floor_area_m2 ? p.purchased_energy / p.floor_area_m2 : 140);
  let s_ci = 100;
  if (eui >= 300) s_ci = 0;
  else if (eui <= 40) s_ci = 100;
  else s_ci = Math.round(100 - ((eui - 40) / (300 - 40)) * 100);

  // 3. Insulation
  const wall_u = p.wall_u ?? getWallUValue(p.wall_type, p.wall_insulation, p.age_band);
  const roof_u = p.roof_u ?? getRoofUValue(p.roof_type, p.loft_insulation_mm, p.age_band);
  const s_wall = Math.min(100, Math.round((100 * 0.28) / Math.max(0.1, wall_u)));
  const s_roof = Math.min(100, Math.round((100 * 0.16) / Math.max(0.1, roof_u)));
  const s_ins = Math.round(0.55 * s_wall + 0.45 * s_roof);

  // 4. Heating System
  const s_heat = HEATING_SCORES[p.heating_type] ?? 50;

  // 5. Windows & Glazing
  const win_u = p.window_u ?? (GLAZING_U_VALUES[p.glazing] || 2.8);
  const s_glz = Math.min(100, Math.round((100 * 1.4) / Math.max(0.5, win_u)));

  // 6. Renewable Energy
  const s_ren = p.solar_pv ? Math.min(100, Math.round(25 * (p.solar_kwp || 3.5))) : 0;

  // 7. Smart Controls
  const s_sm = CONTROLS_SCORES[p.smart_controls] ?? 25;

  const components: ComponentScore[] = [
    {
      key: 'energy_efficiency',
      label: 'Energy efficiency (EPC rating)',
      short_label: 'EPC Rating',
      weight: SCORE_WEIGHTS.energy_efficiency,
      score: s_ee,
      weighted_score: Number((s_ee * SCORE_WEIGHTS.energy_efficiency).toFixed(1)),
      provenance: p.energy_rating ? 'measured' : 'default',
      hint: 'A new energy assessment after improvements updates the recorded EPC band.',
    },
    {
      key: 'consumption_intensity',
      label: 'Consumption intensity',
      short_label: 'Energy Intensity',
      weight: SCORE_WEIGHTS.consumption_intensity,
      score: s_ci,
      weighted_score: Number((s_ci * SCORE_WEIGHTS.consumption_intensity).toFixed(1)),
      provenance: p.elec_status === 'measured' ? 'measured' : 'estimated',
      hint: `Current EUI is ${Math.round(eui)} kWh/m²/yr (benchmark: 40 best, 300 worst).`,
    },
    {
      key: 'insulation',
      label: 'Building fabric & insulation',
      short_label: 'Insulation',
      weight: SCORE_WEIGHTS.insulation,
      score: s_ins,
      weighted_score: Number((s_ins * SCORE_WEIGHTS.insulation).toFixed(1)),
      provenance: 'measured',
      hint: `Wall U-value: ${wall_u.toFixed(2)}, Roof U-value: ${roof_u.toFixed(2)} W/m²K.`,
    },
    {
      key: 'heating_system',
      label: 'Heating system efficiency',
      short_label: 'Heating System',
      weight: SCORE_WEIGHTS.heating_system,
      score: s_heat,
      weighted_score: Number((s_heat * SCORE_WEIGHTS.heating_system).toFixed(1)),
      provenance: 'measured',
      hint: 'Heat pumps achieve 100/100; gas condensing boilers score 60.',
    },
    {
      key: 'windows_glazing',
      label: 'Windows and glazing',
      short_label: 'Glazing',
      weight: SCORE_WEIGHTS.windows_glazing,
      score: s_glz,
      weighted_score: Number((s_glz * SCORE_WEIGHTS.windows_glazing).toFixed(1)),
      provenance: 'measured',
      hint: `Glazing type is ${p.glazing.replace('_', ' ')} (U-value: ${win_u.toFixed(1)} W/m²K).`,
    },
    {
      key: 'renewable_energy',
      label: 'On-site renewable energy',
      short_label: 'Renewables',
      weight: SCORE_WEIGHTS.renewable_energy,
      score: s_ren,
      weighted_score: Number((s_ren * SCORE_WEIGHTS.renewable_energy).toFixed(1)),
      provenance: p.solar_pv ? 'measured' : 'default',
      hint: p.solar_pv ? `${p.solar_kwp || 3.5} kWp rooftop solar PV installed.` : 'No solar PV installed.',
    },
    {
      key: 'smart_energy_management',
      label: 'Smart energy controls',
      short_label: 'Smart Controls',
      weight: SCORE_WEIGHTS.smart_energy_management,
      score: s_sm,
      weighted_score: Number((s_sm * SCORE_WEIGHTS.smart_energy_management).toFixed(1)),
      provenance: 'measured',
      hint: `Heating controls: ${p.smart_controls.replace(/_/g, ' ')}.`,
    },
  ];

  const totalScore = Math.round(
    components.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  return {
    score: totalScore,
    classification: classifyScore(totalScore),
    status: 'confirmed',
    range_low: Math.max(0, totalScore - 3),
    range_high: Math.min(100, totalScore + 3),
    components,
    completeness: 1.0,
  };
}

export function detectIssues(p: PropertyProfile, score: ScoreResult): IssueItem[] {
  const issues: IssueItem[] = [];

  if (p.wall_insulation === 'none' || p.wall_insulation === 'partial') {
    issues.push({
      code: 'UNINSULATED_WALL',
      text: p.wall_type === 'cavity' ? 'Uninsulated cavity walls' : 'Uninsulated solid walls',
      evidence: `External walls have ${p.wall_insulation} insulation (U-value ~${(p.wall_u || 1.5).toFixed(2)} W/m²K), causing substantial heat loss.`,
      severity: 'high',
    });
  }

  if (p.roof_type === 'pitched_loft' && (p.loft_insulation_mm || 0) < 150) {
    issues.push({
      code: 'INADEQUATE_LOFT_INSULATION',
      text: 'Sub-standard loft insulation',
      evidence: `Loft insulation depth is only ${p.loft_insulation_mm || 0} mm (recommended standard is 270 mm).`,
      severity: 'high',
    });
  }

  if (p.glazing === 'single') {
    issues.push({
      code: 'SINGLE_GLAZING',
      text: 'Single-glazed windows',
      evidence: 'Single glazing has very high thermal transmittance (U-value ~4.8 W/m²K), leading to drafts and heat waste.',
      severity: 'medium',
    });
  } else if (p.glazing === 'double_pre2002' || p.glazing === 'secondary') {
    issues.push({
      code: 'AGED_GLAZING',
      text: 'Aged glazing performance',
      evidence: 'Windows are early double glazing or secondary glazing with modest insulating performance.',
      severity: 'low',
    });
  }

  if (p.heating_type === 'gas_noncondensing_boiler') {
    issues.push({
      code: 'OLD_BOILER',
      text: 'Inefficient non-condensing gas boiler',
      evidence: 'Older non-condensing boilers operate at ~70-75% efficiency compared to >90% for modern units or >280% for heat pumps.',
      severity: 'high',
    });
  }

  if (p.smart_controls === 'none' || p.smart_controls === 'programmer_only') {
    issues.push({
      code: 'POOR_CONTROLS',
      text: 'Lack of automated heating controls',
      evidence: `Basic controls (${p.smart_controls.replace(/_/g, ' ')}) prevent scheduling and responsive room-by-room modulation.`,
      severity: 'medium',
    });
  }

  const eui = p.eui ?? (p.purchased_energy && p.floor_area_m2 ? p.purchased_energy / p.floor_area_m2 : 140);
  if (eui > 200) {
    issues.push({
      code: 'HIGH_EUI',
      text: 'High energy consumption per square metre',
      evidence: `Energy use intensity is ${Math.round(eui)} kWh/m²/yr, well above the national median for this archetype.`,
      severity: 'high',
    });
  }

  if (!p.solar_pv && p.property_type !== 'flat' && p.roof_orientation !== 'N') {
    issues.push({
      code: 'NO_SOLAR',
      text: 'Untapped rooftop solar generation potential',
      evidence: 'The property has an unshaded roof suitable for on-site renewable solar PV generation.',
      severity: 'low',
    });
  }

  return issues;
}

export function assessRecommendations(
  p: PropertyProfile,
  memoryEvents: CustomerMemoryEvent[] = [],
  selectedMeasuresOverride?: string[]
): {
  recommended: RecommendationItem[];
  notSuitable: IneligibleMeasure[];
  needsInformation: IneligibleMeasure[];
  previouslyDeclined: IneligibleMeasure[];
  package: PackageSummary;
} {
  const declinedSet = new Set(
    memoryEvents.filter((e) => e.type === 'declined').map((e) => e.payload.measure_id)
  );
  const completedSet = new Set(
    memoryEvents.filter((e) => e.type === 'completed_retrofit').map((e) => e.payload.measure_id)
  );
  const constraintExternal = memoryEvents.some(
    (e) => e.type === 'constraint' && e.payload.no_external_works
  );
  const budgetConstraint = memoryEvents.reduce(
    (min, e) => (e.type === 'constraint' && e.payload.budget_max_gbp ? Math.min(min, e.payload.budget_max_gbp) : min),
    Infinity
  );

  const recommended: RecommendationItem[] = [];
  const notSuitable: IneligibleMeasure[] = [];
  const needsInformation: IneligibleMeasure[] = [];
  const previouslyDeclined: IneligibleMeasure[] = [];

  // Annual baseline energy
  let baseGas = p.gas_annual ?? (p.has_gas_connection ? 12000 : 0);
  let baseElec = p.elec_import_annual ?? 3600;

  // Space heating share of gas: approx 80%
  const cookingGas = p.gas_cooking ? 300 : 0;
  let remainingSpaceHeat = Math.max(0, baseGas - cookingGas) * 0.85;

  let currentGas = baseGas;
  let currentElec = baseElec;

  // Measure 1: Loft insulation (Stage 1)
  const isLoftEligible = p.roof_type === 'pitched_loft' && (p.loft_insulation_mm || 0) < 200;
  if (completedSet.has('loft_insulation')) {
    notSuitable.push({ measure_id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', reason: 'Completed retrofit in customer memory', status: 'already_installed' });
  } else if (declinedSet.has('loft_insulation')) {
    previouslyDeclined.push({ measure_id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', reason: 'Declined by customer', status: 'previously_declined' });
  } else if (p.roof_type !== 'pitched_loft') {
    notSuitable.push({ measure_id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', reason: 'Property has flat roof or dwelling above', status: 'not_applicable' });
  } else if ((p.loft_insulation_mm || 0) >= 200) {
    notSuitable.push({ measure_id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', reason: `Already has ${p.loft_insulation_mm} mm loft insulation (sufficient)`, status: 'already_installed' });
  } else if (budgetConstraint < 1000) {
    notSuitable.push({ measure_id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', reason: 'Exceeds customer budget constraint', status: 'blocked' });
  } else {
    const loftFraction = (p.loft_insulation_mm || 0) === 0 ? 0.20 : (p.loft_insulation_mm || 0) < 100 ? 0.10 : 0.04;
    const gasSaved = Math.round(remainingSpaceHeat * loftFraction);
    recommended.push({
      sequence_position: 1,
      measure_id: 'loft_insulation',
      name: 'Loft insulation (top-up to 270 mm)',
      stage: 1,
      category: 'insulation',
      suitability: 'High',
      reason: 'Lofts are the largest source of fabric heat loss; topping up to 270 mm delivers immediate thermal retention.',
      cost_low_gbp: 400,
      cost_high_gbp: 1000,
      gas_saving_kwh: gasSaved,
      elec_saving_kwh: 0,
      net_saving_kwh: gasSaved,
      carbon_reduction_kg: Math.round(gasSaved * EMISSION_FACTORS.DESNZ_2026.gas),
      bill_saving_gbp: Math.round(gasSaved * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh),
    });
  }

  // Measure 2: Cavity wall insulation (Stage 2)
  if (p.wall_type === 'cavity') {
    if (completedSet.has('cavity_wall_insulation') || p.wall_insulation === 'insulated') {
      notSuitable.push({ measure_id: 'cavity_wall_insulation', name: 'Cavity wall insulation', reason: 'Walls already insulated', status: 'already_installed' });
    } else if (declinedSet.has('cavity_wall_insulation')) {
      previouslyDeclined.push({ measure_id: 'cavity_wall_insulation', name: 'Cavity wall insulation', reason: 'Declined by customer', status: 'previously_declined' });
    } else if (constraintExternal) {
      notSuitable.push({ measure_id: 'cavity_wall_insulation', name: 'Cavity wall insulation', reason: 'Blocked by no-external-works constraint', status: 'blocked' });
    } else if (budgetConstraint < 2000) {
      notSuitable.push({ measure_id: 'cavity_wall_insulation', name: 'Cavity wall insulation', reason: 'Exceeds customer budget constraint', status: 'blocked' });
    } else {
      const wallFraction = p.wall_insulation === 'none' ? 0.20 : 0.08;
      const gasSaved = Math.round(remainingSpaceHeat * wallFraction);
      recommended.push({
        sequence_position: 2,
        measure_id: 'cavity_wall_insulation',
        name: 'Cavity wall insulation',
        stage: 2,
        category: 'insulation',
        suitability: 'High',
        reason: 'Insulating uninsulated external cavity walls significantly reduces conduction losses throughout the property envelope.',
        cost_low_gbp: 1000,
        cost_high_gbp: 3000,
        gas_saving_kwh: gasSaved,
        elec_saving_kwh: 0,
        net_saving_kwh: gasSaved,
        carbon_reduction_kg: Math.round(gasSaved * EMISSION_FACTORS.DESNZ_2026.gas),
        bill_saving_gbp: Math.round(gasSaved * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh),
      });
    }
  }

  // Measure 3: Solid wall insulation (Stage 2)
  if (p.wall_type === 'solid') {
    if (completedSet.has('solid_wall_insulation') || p.wall_insulation === 'insulated') {
      notSuitable.push({ measure_id: 'solid_wall_insulation', name: 'Solid wall insulation', reason: 'Walls already insulated', status: 'already_installed' });
    } else if (declinedSet.has('solid_wall_insulation')) {
      previouslyDeclined.push({ measure_id: 'solid_wall_insulation', name: 'Solid wall insulation', reason: 'Declined by customer', status: 'previously_declined' });
    } else if (p.listed_building) {
      notSuitable.push({ measure_id: 'solid_wall_insulation', name: 'Solid wall insulation', reason: 'Listed building restrictions prevent external modification', status: 'blocked' });
    } else if (constraintExternal) {
      notSuitable.push({ measure_id: 'solid_wall_insulation', name: 'Solid wall insulation', reason: 'Blocked by no-external-works constraint', status: 'blocked' });
    } else if (budgetConstraint < 12000) {
      notSuitable.push({ measure_id: 'solid_wall_insulation', name: 'Solid wall insulation', reason: 'Exceeds customer budget constraint', status: 'blocked' });
    } else {
      const solidFraction = p.wall_insulation === 'none' ? 0.25 : 0.10;
      const gasSaved = Math.round(remainingSpaceHeat * solidFraction);
      recommended.push({
        sequence_position: 2,
        measure_id: 'solid_wall_insulation',
        name: 'Solid wall insulation',
        stage: 2,
        category: 'insulation',
        suitability: p.conservation_area ? 'Medium' : 'High',
        reason: 'Insulating uninsulated solid walls delivers superior envelope performance, keeping the interior warm for longer.',
        cost_low_gbp: 8000,
        cost_high_gbp: 20000,
        gas_saving_kwh: gasSaved,
        elec_saving_kwh: 0,
        net_saving_kwh: gasSaved,
        carbon_reduction_kg: Math.round(gasSaved * EMISSION_FACTORS.DESNZ_2026.gas),
        bill_saving_gbp: Math.round(gasSaved * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh),
      });
    }
  }

  // Measure 4: Double glazing (Stage 3)
  if (p.glazing === 'double_post2002' || p.glazing === 'triple') {
    notSuitable.push({ measure_id: 'double_glazing', name: 'Double glazing', reason: 'Modern high-performance glazing already installed', status: 'already_installed' });
  } else if (p.listed_building) {
    notSuitable.push({ measure_id: 'double_glazing', name: 'Double glazing', reason: 'Heritage/Listed building restrictions prevent window replacement', status: 'blocked' });
  } else if (declinedSet.has('double_glazing')) {
    previouslyDeclined.push({ measure_id: 'double_glazing', name: 'Double glazing', reason: 'Declined by customer', status: 'previously_declined' });
  } else if (budgetConstraint < 7000) {
    notSuitable.push({ measure_id: 'double_glazing', name: 'Double glazing', reason: 'Exceeds customer budget constraint', status: 'blocked' });
  } else {
    const glzFraction = p.glazing === 'single' ? 0.10 : p.glazing === 'secondary' ? 0.04 : 0.03;
    const gasSaved = Math.round(remainingSpaceHeat * glzFraction);
    recommended.push({
      sequence_position: 3,
      measure_id: 'double_glazing',
      name: 'Double glazing',
      stage: 3,
      category: 'glazing',
      suitability: p.glazing === 'single' ? 'High' : p.conservation_area ? 'Medium' : 'Low',
      reason: 'Replacing older drafty glazing with modern insulated double glazing reduces window heat conduction and drafts.',
      cost_low_gbp: 5000,
      cost_high_gbp: 12000,
      gas_saving_kwh: gasSaved,
      elec_saving_kwh: 0,
      net_saving_kwh: gasSaved,
      carbon_reduction_kg: Math.round(gasSaved * EMISSION_FACTORS.DESNZ_2026.gas),
      bill_saving_gbp: Math.round(gasSaved * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh),
    });
  }

  // Measure 5: Smart thermostat (Stage 4)
  if (p.smart_controls === 'smart_thermostat' || p.smart_controls === 'smart_zoned') {
    notSuitable.push({ measure_id: 'smart_thermostat', name: 'Smart thermostat', reason: 'Smart controls already present', status: 'already_installed' });
  } else if (p.heating_type === 'electric_storage' || p.heating_type === 'electric_direct') {
    notSuitable.push({ measure_id: 'smart_thermostat', name: 'Smart thermostat', reason: 'Not compatible with electric direct or storage heaters', status: 'not_applicable' });
  } else if (declinedSet.has('smart_thermostat')) {
    previouslyDeclined.push({ measure_id: 'smart_thermostat', name: 'Smart thermostat', reason: 'Declined by customer', status: 'previously_declined' });
  } else if (budgetConstraint < 200) {
    notSuitable.push({ measure_id: 'smart_thermostat', name: 'Smart thermostat', reason: 'Exceeds customer budget constraint', status: 'blocked' });
  } else {
    const smartFraction = p.smart_controls === 'none' ? 0.10 : p.smart_controls === 'programmer_only' ? 0.08 : 0.06;
    const gasSaved = Math.round(remainingSpaceHeat * smartFraction);
    recommended.push({
      sequence_position: 4,
      measure_id: 'smart_thermostat',
      name: 'Smart thermostat',
      stage: 4,
      category: 'smart_controls',
      suitability: 'High',
      reason: 'Automated temperature regulation and scheduling ensures rooms are only heated when occupied.',
      cost_low_gbp: 150,
      cost_high_gbp: 300,
      gas_saving_kwh: gasSaved,
      elec_saving_kwh: 0,
      net_saving_kwh: gasSaved,
      carbon_reduction_kg: Math.round(gasSaved * EMISSION_FACTORS.DESNZ_2026.gas),
      bill_saving_gbp: Math.round(gasSaved * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh),
    });
  }

  // Measure 6: Air-source heat pump (Stage 5)
  if (p.heating_type === 'air_source_heat_pump') {
    notSuitable.push({ measure_id: 'air_source_heat_pump', name: 'Air-source heat pump', reason: 'Heat pump already installed', status: 'already_installed' });
  } else if (!p.has_outdoor_space) {
    notSuitable.push({ measure_id: 'air_source_heat_pump', name: 'Air-source heat pump', reason: 'Requires outdoor space for external condenser unit', status: 'blocked' });
  } else if (declinedSet.has('air_source_heat_pump')) {
    previouslyDeclined.push({ measure_id: 'air_source_heat_pump', name: 'Air-source heat pump', reason: 'Declined by customer', status: 'previously_declined' });
  } else if (budgetConstraint < 12000) {
    notSuitable.push({ measure_id: 'air_source_heat_pump', name: 'Air-source heat pump', reason: 'Exceeds customer budget constraint', status: 'blocked' });
  } else {
    // Heat pump removes remaining gas heating and hot water, adds electricity via SCOP ~ 2.8
    const gasToReplace = Math.max(0, currentGas - cookingGas);
    const heatOutput = gasToReplace * 0.85; // Useful heat delivered by old boiler
    const hpElecAdded = Math.round(heatOutput / 2.8);
    const gasSaved = gasToReplace;
    const elecDelta = -hpElecAdded; // Negative means increased electricity usage!
    const netKwh = gasSaved + elecDelta;
    const carbonRed = Math.round(
      gasSaved * EMISSION_FACTORS.DESNZ_2026.gas - hpElecAdded * EMISSION_FACTORS.DESNZ_2026.electricity
    );
    const billDelta = Math.round(
      gasSaved * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh -
        hpElecAdded * ENERGY_PRICES.OFGEM_2026Q4.electricity_gbp_per_kwh
    );

    const fabricAdequate = p.fabric_adequate ?? (p.glazing !== 'single' && p.wall_insulation !== 'none');
    recommended.push({
      sequence_position: 5,
      measure_id: 'air_source_heat_pump',
      name: 'Air-source heat pump',
      stage: 5,
      category: 'heat_pump',
      suitability: fabricAdequate ? 'High' : 'Medium',
      reason: 'Replaces fossil fuel gas heating with ultra-efficient thermodynamic heat extraction (SCOP ~2.8).',
      cost_low_gbp: 10000,
      cost_high_gbp: 15000,
      gas_saving_kwh: gasSaved,
      elec_saving_kwh: elecDelta,
      net_saving_kwh: netKwh,
      carbon_reduction_kg: Math.max(0, carbonRed),
      bill_saving_gbp: billDelta,
    });
  }

  // Measure 7: Solar PV (Stage 6)
  if (p.solar_pv) {
    notSuitable.push({ measure_id: 'solar_pv', name: 'Solar PV', reason: 'Solar photovoltaic array already installed', status: 'already_installed' });
  } else if (p.property_type === 'flat' || p.roof_type === 'none_dwelling_above') {
    notSuitable.push({ measure_id: 'solar_pv', name: 'Solar PV', reason: 'Flat dwelling with shared roof ownership', status: 'not_applicable' });
  } else if (p.roof_orientation === 'N') {
    notSuitable.push({ measure_id: 'solar_pv', name: 'Solar PV', reason: 'North-facing roof receives insufficient solar irradiance', status: 'not_applicable' });
  } else if (p.roof_shading === 'heavy') {
    notSuitable.push({ measure_id: 'solar_pv', name: 'Solar PV', reason: 'Heavy tree or architectural shading severely impedes generation', status: 'blocked' });
  } else if (declinedSet.has('solar_pv')) {
    previouslyDeclined.push({ measure_id: 'solar_pv', name: 'Solar PV', reason: 'Declined by customer', status: 'previously_declined' });
  } else if (budgetConstraint < 6000) {
    notSuitable.push({ measure_id: 'solar_pv', name: 'Solar PV', reason: 'Exceeds customer budget constraint', status: 'blocked' });
  } else {
    const kwp = p.property_type === 'detached' ? 4.0 : p.property_type === 'mid_terrace' ? 3.0 : 3.5;
    const orientFactor = p.roof_orientation === 'S' ? 1.0 : p.roof_orientation === 'SE' || p.roof_orientation === 'SW' ? 0.95 : 0.8;
    const shadeFactor = p.roof_shading === 'some' ? 0.85 : 1.0;
    const annualGen = Math.round(kwp * 900 * orientFactor * shadeFactor);
    // 45% self-consumption directly reduces grid electricity import
    const elecSaved = Math.round(annualGen * 0.45);
    recommended.push({
      sequence_position: 6,
      measure_id: 'solar_pv',
      name: 'Solar PV',
      stage: 6,
      category: 'solar',
      suitability: p.conservation_area ? 'Medium' : 'High',
      reason: 'Generates clean on-site electricity, directly offsetting high-rate grid purchases during daylight hours.',
      cost_low_gbp: 5000,
      cost_high_gbp: 8000,
      gas_saving_kwh: 0,
      elec_saving_kwh: elecSaved,
      net_saving_kwh: elecSaved,
      carbon_reduction_kg: Math.round(elecSaved * EMISSION_FACTORS.DESNZ_2026.electricity),
      bill_saving_gbp: Math.round(elecSaved * ENERGY_PRICES.OFGEM_2026Q4.electricity_gbp_per_kwh),
    });
  }

  // Calculate Whole Package interactions
  const appliedMeasures = selectedMeasuresOverride
    ? recommended.filter((m) => selectedMeasuresOverride.includes(m.measure_id))
    : recommended;

  let pkgGas = baseGas;
  let pkgElec = baseElec;
  let pkgCostLow = 0;
  let pkgCostHigh = 0;

  let pkgSpaceHeat = remainingSpaceHeat;

  // 1. Fabric measures reduce space heat
  for (const m of appliedMeasures) {
    if (m.measure_id === 'loft_insulation') {
      const frac = (p.loft_insulation_mm || 0) === 0 ? 0.20 : (p.loft_insulation_mm || 0) < 100 ? 0.10 : 0.04;
      const saved = Math.round(pkgSpaceHeat * frac);
      pkgSpaceHeat = Math.max(0, pkgSpaceHeat - saved);
      pkgGas = Math.max(0, pkgGas - saved);
      pkgCostLow += m.cost_low_gbp;
      pkgCostHigh += m.cost_high_gbp;
    } else if (m.measure_id === 'cavity_wall_insulation') {
      const frac = p.wall_insulation === 'none' ? 0.20 : 0.08;
      const saved = Math.round(pkgSpaceHeat * frac);
      pkgSpaceHeat = Math.max(0, pkgSpaceHeat - saved);
      pkgGas = Math.max(0, pkgGas - saved);
      pkgCostLow += m.cost_low_gbp;
      pkgCostHigh += m.cost_high_gbp;
    } else if (m.measure_id === 'solid_wall_insulation') {
      const frac = p.wall_insulation === 'none' ? 0.25 : 0.10;
      const saved = Math.round(pkgSpaceHeat * frac);
      pkgSpaceHeat = Math.max(0, pkgSpaceHeat - saved);
      pkgGas = Math.max(0, pkgGas - saved);
      pkgCostLow += m.cost_low_gbp;
      pkgCostHigh += m.cost_high_gbp;
    } else if (m.measure_id === 'double_glazing') {
      const frac = p.glazing === 'single' ? 0.10 : 0.04;
      const saved = Math.round(pkgSpaceHeat * frac);
      pkgSpaceHeat = Math.max(0, pkgSpaceHeat - saved);
      pkgGas = Math.max(0, pkgGas - saved);
      pkgCostLow += m.cost_low_gbp;
      pkgCostHigh += m.cost_high_gbp;
    } else if (m.measure_id === 'smart_thermostat') {
      const frac = p.smart_controls === 'none' ? 0.10 : 0.06;
      const saved = Math.round(pkgSpaceHeat * frac);
      pkgSpaceHeat = Math.max(0, pkgSpaceHeat - saved);
      pkgGas = Math.max(0, pkgGas - saved);
      pkgCostLow += m.cost_low_gbp;
      pkgCostHigh += m.cost_high_gbp;
    }
  }

  // 2. Heat pump applied to REMAINING demand
  const hasHeatPump = appliedMeasures.some((m) => m.measure_id === 'air_source_heat_pump');
  if (hasHeatPump) {
    const hpMeasure = appliedMeasures.find((m) => m.measure_id === 'air_source_heat_pump')!;
    const gasReplaced = Math.max(0, pkgGas - cookingGas);
    const hpUsefulHeat = gasReplaced * 0.85;
    const hpElec = Math.round(hpUsefulHeat / 2.8);
    pkgGas = cookingGas;
    pkgElec += hpElec;
    pkgCostLow += hpMeasure.cost_low_gbp;
    pkgCostHigh += hpMeasure.cost_high_gbp;
  }

  // 3. Solar PV reduces electricity imports
  const hasSolar = appliedMeasures.some((m) => m.measure_id === 'solar_pv');
  if (hasSolar) {
    const solarMeasure = appliedMeasures.find((m) => m.measure_id === 'solar_pv')!;
    const kwp = p.property_type === 'detached' ? 4.0 : 3.5;
    const gen = Math.round(kwp * 900 * 0.95);
    const selfConsumed = Math.round(gen * 0.45);
    pkgElec = Math.max(800, pkgElec - selfConsumed);
    pkgCostLow += solarMeasure.cost_low_gbp;
    pkgCostHigh += solarMeasure.cost_high_gbp;
  }

  const savingGas = baseGas - pkgGas;
  const savingElec = baseElec - pkgElec; // Note: can be negative if heat pump installed!
  const currentTotal = baseGas + baseElec;
  const postTotal = pkgGas + pkgElec;
  const savingTotal = currentTotal - postTotal;
  const savingPct = currentTotal > 0 ? Number(((savingTotal / currentTotal) * 100).toFixed(1)) : 0;

  const currentCarbon = Math.round(
    baseElec * EMISSION_FACTORS.DESNZ_2026.electricity + baseGas * EMISSION_FACTORS.DESNZ_2026.gas
  );
  const postCarbon = Math.round(
    pkgElec * EMISSION_FACTORS.DESNZ_2026.electricity + pkgGas * EMISSION_FACTORS.DESNZ_2026.gas
  );
  const carbonRed = Math.max(0, currentCarbon - postCarbon);

  const currentBill = Math.round(
    baseElec * ENERGY_PRICES.OFGEM_2026Q4.electricity_gbp_per_kwh +
      baseGas * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh
  );
  const postBill = Math.round(
    pkgElec * ENERGY_PRICES.OFGEM_2026Q4.electricity_gbp_per_kwh +
      pkgGas * ENERGY_PRICES.OFGEM_2026Q4.gas_gbp_per_kwh
  );
  const billSaving = Math.max(0, currentBill - postBill);
  const avgCost = (pkgCostLow + pkgCostHigh) / 2;
  const simplePayback = billSaving > 0 ? Number((avgCost / billSaving).toFixed(1)) : undefined;

  // Projected score after package
  const currentScore = calculateScores(p);
  const projectedProfile: PropertyProfile = {
    ...p,
    loft_insulation_mm: appliedMeasures.some((m) => m.measure_id === 'loft_insulation')
      ? 270
      : p.loft_insulation_mm,
    wall_insulation: appliedMeasures.some(
      (m) => m.measure_id === 'cavity_wall_insulation' || m.measure_id === 'solid_wall_insulation'
    )
      ? 'insulated'
      : p.wall_insulation,
    glazing: appliedMeasures.some((m) => m.measure_id === 'double_glazing')
      ? 'double_post2002'
      : p.glazing,
    heating_type: hasHeatPump ? 'air_source_heat_pump' : p.heating_type,
    smart_controls: appliedMeasures.some((m) => m.measure_id === 'smart_thermostat')
      ? 'smart_thermostat'
      : p.smart_controls,
    solar_pv: hasSolar ? true : p.solar_pv,
    solar_kwp: hasSolar ? 3.5 : p.solar_kwp,
    purchased_energy: postTotal,
    eui: p.floor_area_m2 ? postTotal / p.floor_area_m2 : undefined,
  };
  const projectedScoreResult = calculateScores(projectedProfile);

  // Property value impact
  const currentValue = p.current_value_estimate || 350000;
  let valLowPct = 1.0;
  let valHighPct = 2.5;
  if (currentScore.score < 50) {
    valLowPct = 1.5;
    valHighPct = 4.0;
  } else if (currentScore.score < 65) {
    valLowPct = 1.0;
    valHighPct = 3.0;
  } else {
    valLowPct = 0.5;
    valHighPct = 1.5;
  }
  const valLowGbp = Math.round((currentValue * valLowPct) / 100);
  const valHighGbp = Math.round((currentValue * valHighPct) / 100);

  const packageSummary: PackageSummary = {
    measures: appliedMeasures.map((m) => m.measure_id),
    current_gas_kwh: baseGas,
    current_elec_kwh: baseElec,
    current_total_kwh: currentTotal,
    post_gas_kwh: pkgGas,
    post_elec_kwh: pkgElec,
    post_total_kwh: postTotal,
    saving_gas_kwh: savingGas,
    saving_elec_kwh: savingElec,
    saving_total_kwh: savingTotal,
    saving_pct: savingPct,
    current_carbon_kg: currentCarbon,
    post_carbon_kg: postCarbon,
    carbon_reduction_kg: carbonRed,
    cost_low_gbp: pkgCostLow,
    cost_high_gbp: pkgCostHigh,
    current_bill_gbp: currentBill,
    post_bill_gbp: postBill,
    bill_saving_gbp: billSaving,
    simple_payback_years: simplePayback,
    projected_score: projectedScoreResult.score,
    projected_classification: projectedScoreResult.classification,
    projected_rating: projectedScoreResult.score >= 80 ? 'B' : projectedScoreResult.score >= 65 ? 'C' : 'D',
    value_impact_low_pct: valLowPct,
    value_impact_high_pct: valHighPct,
    value_impact_low_gbp: valLowGbp,
    value_impact_high_gbp: valHighGbp,
  };

  return {
    recommended,
    notSuitable,
    needsInformation,
    previouslyDeclined,
    package: packageSummary,
  };
}

export function buildFactSheet(
  p: PropertyProfile,
  score: ScoreResult,
  recs: RecommendationItem[],
  pkg: PackageSummary
): Record<string, string> {
  const currentValue = p.current_value_estimate || 350000;
  return {
    F01: `Property: ${p.property_id}, Archetype: ${p.property_type.replace('_', ' ')}, Built: ${p.age_band.replace('_', ' ')}, Current EPC Band: ${p.energy_rating || 'D'}.`,
    F02: `Current Green Home Score: ${score.score} / 100 (${score.classification}), with ${score.components.find((c) => c.key === 'insulation')?.score}/100 fabric insulation and ${score.components.find((c) => c.key === 'heating_system')?.score}/100 heating system.`,
    F03: `Feasible measures in installation order (${recs.length}): ${recs.map((r, i) => `${i + 1}. ${r.name} (${r.suitability} suitability)`).join('; ')}.`,
    F04: `Annual Gas Reduction: ${pkg.saving_gas_kwh.toLocaleString()} kWh/yr (${Math.round((pkg.saving_gas_kwh / Math.max(1, pkg.current_gas_kwh)) * 100)}% of current gas usage).`,
    F05: `Annual Electricity Change: ${pkg.saving_elec_kwh >= 0 ? '+' : ''}${pkg.saving_elec_kwh.toLocaleString()} kWh/yr (${pkg.saving_elec_kwh < 0 ? 'net increase due to heat pump electrification' : 'reduction via solar generation'}).`,
    F06: `Net Total Energy Saved: ${pkg.saving_total_kwh.toLocaleString()} kWh/yr (${pkg.saving_pct}% overall reduction).`,
    F07: `Operational Carbon Reduction: ${pkg.carbon_reduction_kg.toLocaleString()} kg CO2e / yr (${(pkg.carbon_reduction_kg / 1000).toFixed(2)} tonnes CO2e / yr, based on DESNZ 2026 factors).`,
    F08: `Indicative Property Value Impact: +${pkg.value_impact_low_pct}% to +${pkg.value_impact_high_pct}% (+£${pkg.value_impact_low_gbp.toLocaleString()} to +£${pkg.value_impact_high_gbp.toLocaleString()}), based on baseline value £${currentValue.toLocaleString()}.`,
    F09: `Indicative Total Package Capital Cost: £${pkg.cost_low_gbp.toLocaleString()} to £${pkg.cost_high_gbp.toLocaleString()} (unverified indicative team estimate).`,
    F10: `Estimated Annual Energy Bill Saving: £${pkg.bill_saving_gbp.toLocaleString()} / year (based on Ofgem 2026Q4 price cap).`,
  };
}

export function runFullAssessment(
  profile: PropertyProfile,
  memoryEvents: CustomerMemoryEvent[] = []
): AssessmentResult {
  const score = calculateScores(profile);
  const issues = detectIssues(profile, score);
  const { recommended, notSuitable, needsInformation, previouslyDeclined, package: pkg } =
    assessRecommendations(profile, memoryEvents);
  const factSheet = buildFactSheet(profile, score, recommended, pkg);

  return {
    property_id: profile.property_id,
    profile,
    score,
    issues,
    recommendations: recommended,
    not_suitable: notSuitable,
    needs_information: needsInformation,
    previously_declined: previouslyDeclined,
    package: pkg,
    fact_sheet: factSheet,
    data_quality: {
      measured_count: 8,
      estimated_count: 2,
      missing_count: 0,
      flags: ['Verified synthetic baseline', 'DESNZ 2026 carbon methodology'],
    },
  };
}
