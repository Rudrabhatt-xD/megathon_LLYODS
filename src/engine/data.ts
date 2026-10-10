import fs from 'fs';
import path from 'path';
import { PropertyProfile, ScoreClassification } from '../types';
import { calculateScores } from './scoring';

let cachedProperties: PropertyProfile[] | null = null;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function loadAllProperties(): PropertyProfile[] {
  if (cachedProperties) {
    return cachedProperties;
  }

  const csvPath = path.resolve(process.cwd(), 'data/processed/features.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn(`Features CSV not found at ${csvPath}, returning fallback demo properties.`);
    cachedProperties = getFallbackDemoProperties();
    return cachedProperties;
  }

  try {
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      cachedProperties = getFallbackDemoProperties();
      return cachedProperties;
    }

    const headers = parseCSVLine(lines[0]);
    const properties: PropertyProfile[] = [];

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j];
      }

      const prop: PropertyProfile = {
        property_id: row.property_id || `P${10000 + i}`,
        customer_id: row.customer_id,
        region: row.region || 'south_east',
        property_type: (row.property_type as any) || 'semi_detached',
        flat_position: row.flat_position || undefined,
        age_band: (row.age_band as any) || '1965_1982',
        floor_area_m2: parseFloat(row.floor_area_m2) || 90,
        bedrooms: parseFloat(row.bedrooms) || 3,
        energy_rating: row.energy_rating || 'D',
        energy_rating_points: parseFloat(row.energy_rating_points) || 60,
        wall_type: (row.wall_type as any) || 'cavity',
        wall_insulation: (row.wall_insulation as any) || 'none',
        roof_type: (row.roof_type as any) || 'pitched_loft',
        loft_insulation_mm: parseFloat(row.loft_insulation_mm) || 0,
        glazing: (row.glazing as any) || 'double_pre2002',
        heating_type: (row.heating_type as any) || 'gas_condensing_boiler',
        has_gas_connection: row.has_gas_connection === 'True' || row.has_gas_connection === 'true',
        gas_cooking: row.gas_cooking === 'True' || row.gas_cooking === 'true',
        solar_pv: row.solar_pv === 'True' || row.solar_pv === 'true',
        solar_kwp: parseFloat(row.solar_kwp) || 0,
        smart_controls: (row.smart_controls as any) || 'programmer_thermostat',
        roof_orientation: (row.roof_orientation as any) || 'S',
        roof_shading: (row.roof_shading as any) || 'none',
        has_outdoor_space: row.has_outdoor_space !== 'False' && row.has_outdoor_space !== 'false',
        listed_building: row.listed_building === 'True' || row.listed_building === 'true',
        conservation_area: row.conservation_area === 'True' || row.conservation_area === 'true',
        current_value_estimate: parseFloat(row.current_value_estimate) || 350000,
        elec_import_annual: parseFloat(row.elec_import_annual) || 3800,
        gas_annual: parseFloat(row.gas_annual) || 12000,
        elec_status: row.elec_status || 'measured',
        gas_status: row.gas_status || 'measured',
        purchased_energy: parseFloat(row.purchased_energy) || 15800,
        eui: parseFloat(row.eui) || 175,
        wall_u: parseFloat(row.wall_u) || undefined,
        roof_u: parseFloat(row.roof_u) || undefined,
        window_u: parseFloat(row.window_u) || undefined,
        fabric_adequate: row.fabric_adequate === 'True' || row.fabric_adequate === 'true',
        demo_seed: row.demo_seed === 'True' || row.demo_seed === 'true',
      };

      // Pre-calculate score
      const scoreResult = calculateScores(prop);
      prop.score = scoreResult.score;
      prop.classification = scoreResult.classification;

      properties.push(prop);
    }

    cachedProperties = properties;
    return cachedProperties;
  } catch (err) {
    console.error('Failed to parse features.csv:', err);
    cachedProperties = getFallbackDemoProperties();
    return cachedProperties;
  }
}

export function getPropertyById(id: string): PropertyProfile | null {
  const all = loadAllProperties();
  const found = all.find((p) => p.property_id.toLowerCase() === id.toLowerCase());
  if (found) return found;
  // Return first demo home if not found
  return all[0] || null;
}

export function getFallbackDemoProperties(): PropertyProfile[] {
  return [
    {
      property_id: 'P10001',
      customer_id: 'C99999',
      region: 'east_of_england',
      property_type: 'semi_detached',
      age_band: '1919_1944',
      floor_area_m2: 95.0,
      bedrooms: 3.0,
      energy_rating: 'E',
      energy_rating_points: 47.0,
      wall_type: 'cavity',
      wall_insulation: 'none',
      roof_type: 'pitched_loft',
      loft_insulation_mm: 50.0,
      glazing: 'single',
      heating_type: 'gas_noncondensing_boiler',
      has_gas_connection: true,
      gas_cooking: true,
      solar_pv: false,
      solar_kwp: 0,
      smart_controls: 'programmer_thermostat',
      roof_orientation: 'S',
      roof_shading: 'none',
      has_outdoor_space: true,
      listed_building: false,
      conservation_area: false,
      current_value_estimate: 350000.0,
      elec_import_annual: 4800.0,
      gas_annual: 18000.0,
      elec_status: 'measured',
      gas_status: 'measured',
      purchased_energy: 22800.0,
      eui: 240.0,
      wall_u: 1.5,
      roof_u: 0.68,
      window_u: 4.8,
      fabric_adequate: false,
      demo_seed: true,
      score: 32,
      classification: 'Poor',
    },
    {
      property_id: 'P10002',
      customer_id: 'C99999',
      region: 'south_east',
      property_type: 'detached',
      age_band: '1983_1995',
      floor_area_m2: 140.0,
      bedrooms: 4.0,
      energy_rating: 'C',
      energy_rating_points: 75.0,
      wall_type: 'cavity',
      wall_insulation: 'insulated',
      roof_type: 'pitched_loft',
      loft_insulation_mm: 270.0,
      glazing: 'double_post2002',
      heating_type: 'gas_condensing_boiler',
      has_gas_connection: true,
      gas_cooking: true,
      solar_pv: false,
      solar_kwp: 0,
      smart_controls: 'smart_thermostat',
      roof_orientation: 'SE',
      roof_shading: 'none',
      has_outdoor_space: true,
      listed_building: false,
      conservation_area: false,
      current_value_estimate: 600000.0,
      elec_import_annual: 3200.0,
      gas_annual: 10500.0,
      elec_status: 'measured',
      gas_status: 'measured',
      purchased_energy: 13700.0,
      eui: 97.8,
      wall_u: 0.55,
      roof_u: 0.16,
      window_u: 2.0,
      fabric_adequate: true,
      demo_seed: true,
      score: 72,
      classification: 'Good',
    },
    {
      property_id: 'P10003',
      customer_id: 'C99999',
      region: 'london',
      property_type: 'flat',
      age_band: '1919_1944',
      floor_area_m2: 65.0,
      bedrooms: 2.0,
      energy_rating: 'B',
      energy_rating_points: 86.0,
      wall_type: 'solid',
      wall_insulation: 'insulated',
      roof_type: 'none_dwelling_above',
      glazing: 'double_post2002',
      heating_type: 'air_source_heat_pump',
      has_gas_connection: false,
      gas_cooking: false,
      solar_pv: false,
      solar_kwp: 0,
      smart_controls: 'smart_thermostat',
      roof_orientation: 'E',
      roof_shading: 'none',
      has_outdoor_space: true,
      listed_building: false,
      conservation_area: false,
      current_value_estimate: 450000.0,
      elec_import_annual: 3000.0,
      gas_annual: 0,
      elec_status: 'measured',
      gas_status: 'no_connection',
      purchased_energy: 3000.0,
      eui: 46.1,
      wall_u: 0.35,
      window_u: 2.0,
      fabric_adequate: true,
      demo_seed: true,
      score: 88,
      classification: 'Highly efficient',
    },
  ];
}
