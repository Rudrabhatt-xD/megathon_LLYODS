import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  assessRecommendations,
  buildFactSheet,
  calculateScores,
  detectIssues,
  EMISSION_FACTORS,
  ENERGY_PRICES,
  runFullAssessment,
  SCORE_WEIGHTS,
} from './src/engine/scoring';
import { getPropertyById, loadAllProperties } from './src/engine/data';
import { CustomerMemoryEvent, PropertyProfile } from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory Customer Memory storage
const customerMemoryStore: Record<string, CustomerMemoryEvent[]> = {};

// Optional Gemini client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI();
    console.log('Gemini AI engine initialized successfully.');
  } catch (err) {
    console.warn('Failed to initialize Gemini AI client:', err);
  }
}

// ---------------------------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    factor_set: 'DESNZ_2026',
    price_set: 'OFGEM_2026Q4',
    llm_provider: geminiClient ? 'gemini-3.8-flash' : 'template',
    model_versions: {
      energy_elec: 'v1.0-synthetic',
      energy_gas: 'v1.0-synthetic',
      rating: 'v1.0-ordinal',
      value: 'v1.0-hedonic-range',
    },
    dataset_properties: loadAllProperties().length,
  });
});

app.get('/api/assumptions', (req: Request, res: Response) => {
  res.json({
    weights: SCORE_WEIGHTS,
    classification: [
      { min: 80, label: 'Highly efficient' },
      { min: 65, label: 'Good' },
      { min: 50, label: 'Moderate' },
      { min: 30, label: 'Poor' },
      { min: 0, label: 'Very poor' },
    ],
    emission_factors: EMISSION_FACTORS.DESNZ_2026,
    energy_prices: ENERGY_PRICES.OFGEM_2026Q4,
    catalogue: [
      { stage: 1, id: 'loft_insulation', name: 'Loft insulation (top-up to 270 mm)', cost: '£400 - £1,000' },
      { stage: 2, id: 'cavity_wall_insulation', name: 'Cavity wall insulation', cost: '£1,000 - £3,000' },
      { stage: 2, id: 'solid_wall_insulation', name: 'Solid wall insulation', cost: '£8,000 - £20,000' },
      { stage: 3, id: 'double_glazing', name: 'Double glazing', cost: '£5,000 - £12,000' },
      { stage: 4, id: 'smart_thermostat', name: 'Smart thermostat', cost: '£150 - £300' },
      { stage: 5, id: 'air_source_heat_pump', name: 'Air-source heat pump', cost: '£10,000 - £15,000' },
      { stage: 6, id: 'solar_pv', name: 'Solar PV', cost: '£5,000 - £8,000' },
    ],
  });
});

app.get('/api/portfolio/summary', (req: Request, res: Response) => {
  const properties = loadAllProperties();
  const n = properties.length;
  const flagged = properties.filter((p) => p.classification === 'Poor' || p.classification === 'Very poor');

  const scores = properties.map((p) => p.score || 50).sort((a, b) => a - b);
  const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 50;

  const classCounts: Record<string, number> = {
    'Highly efficient': 0,
    Good: 0,
    Moderate: 0,
    Poor: 0,
    'Very poor': 0,
  };
  for (const p of properties) {
    if (p.classification && classCounts[p.classification] !== undefined) {
      classCounts[p.classification]++;
    }
  }

  // Estimate portfolio total carbon reduction
  const totalCarbonReductionKg = properties.slice(0, 1000).reduce((acc, p) => {
    const { package: pkg } = assessRecommendations(p);
    return acc + pkg.carbon_reduction_kg;
  }, 0) * (n / Math.min(1000, n));

  res.json({
    n_properties: n,
    flagged_count: flagged.length,
    flagged_share: Number((flagged.length / Math.max(1, n)).toFixed(3)),
    median_score: medianScore,
    total_carbon_reduction_t: Math.round(totalCarbonReductionKg / 1000),
    class_counts: classCounts,
  });
});

app.get('/api/portfolio', (req: Request, res: Response) => {
  const {
    classification,
    region,
    property_type,
    search,
    limit = '100',
    offset = '0',
    sort = 'improvement_potential',
  } = req.query;

  let properties = loadAllProperties();

  if (classification) {
    const classes = Array.isArray(classification) ? classification : [classification];
    properties = properties.filter((p) => classes.includes(p.classification as string));
  }

  if (region) {
    const regions = Array.isArray(region) ? region : [region];
    properties = properties.filter((p) => regions.includes(p.region));
  }

  if (property_type) {
    const types = Array.isArray(property_type) ? property_type : [property_type];
    properties = properties.filter((p) => types.includes(p.property_type));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    properties = properties.filter(
      (p) =>
        p.property_id.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.property_type.toLowerCase().includes(q)
    );
  }

  // Pre-calculate improvement potential for sorting if requested
  const items = properties.map((p) => {
    const { package: pkg } = assessRecommendations(p);
    return {
      property_id: p.property_id,
      property_type: p.property_type,
      region: p.region,
      score: p.score,
      classification: p.classification,
      energy_rating: p.energy_rating,
      floor_area_m2: p.floor_area_m2,
      current_value_estimate: p.current_value_estimate,
      improvement_potential_pct: pkg.saving_pct,
      delta_gas_kwh: pkg.saving_gas_kwh,
      delta_elec_import_kwh: pkg.saving_elec_kwh,
      carbon_reduction_kg: pkg.carbon_reduction_kg,
      top_issue: p.wall_insulation === 'none' ? 'Uninsulated walls' : p.glazing === 'single' ? 'Single glazing' : 'High energy intensity',
      status: 'confirmed',
    };
  });

  if (sort === 'improvement_potential') {
    items.sort((a, b) => b.improvement_potential_pct - a.improvement_potential_pct);
  } else if (sort === 'score_asc') {
    items.sort((a, b) => (a.score || 0) - (b.score || 0));
  } else if (sort === 'score_desc') {
    items.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const start = parseInt(offset as string, 10) || 0;
  const count = parseInt(limit as string, 10) || 100;
  const page = items.slice(start, start + count);

  res.json({
    total: items.length,
    offset: start,
    limit: count,
    items: page,
  });
});

app.get('/api/properties/:id', (req: Request, res: Response) => {
  const property = getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.json(property);
});

app.get('/api/properties/:id/assess', (req: Request, res: Response) => {
  const property = getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  const custId = property.customer_id || property.property_id;
  const memory = customerMemoryStore[custId] || [];
  const assessment = runFullAssessment(property, memory);
  res.json(assessment);
});

app.post('/api/properties/:id/scenario', (req: Request, res: Response) => {
  const { edited_profile, selected_measures } = req.body;
  const baseProp = getPropertyById(req.params.id);
  if (!baseProp) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const profile: PropertyProfile = {
    ...baseProp,
    ...(edited_profile || {}),
  };

  const custId = profile.customer_id || profile.property_id;
  const memory = customerMemoryStore[custId] || [];
  const score = calculateScores(profile);
  const issues = detectIssues(profile, score);
  const { recommended, notSuitable, needsInformation, previouslyDeclined, package: pkg } =
    assessRecommendations(profile, memory, selected_measures);
  const factSheet = buildFactSheet(profile, score, recommended, pkg);

  res.json({
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
  });
});

// Customer Memory endpoints
app.get('/api/memory/:customerId', (req: Request, res: Response) => {
  const events = customerMemoryStore[req.params.customerId] || [];
  res.json(events);
});

app.post('/api/memory/:customerId/events', (req: Request, res: Response) => {
  const { property_id, type, payload } = req.body;
  const custId = req.params.customerId;
  if (!customerMemoryStore[custId]) {
    customerMemoryStore[custId] = [];
  }
  const event: CustomerMemoryEvent = {
    id: `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    customer_id: custId,
    property_id: property_id || '',
    created_utc: new Date().toISOString(),
    type,
    payload: payload || {},
  };
  customerMemoryStore[custId].push(event);
  res.json(event);
});

app.delete('/api/memory/:customerId/clear', (req: Request, res: Response) => {
  const custId = req.params.customerId;
  customerMemoryStore[custId] = [];
  res.json({ status: 'cleared', customer_id: custId });
});

// Grounded LLM Explanation endpoint (Core rule: models calculate, the LLM explains!)
app.post('/api/explain', async (req: Request, res: Response) => {
  const { fact_sheet, question } = req.body;
  if (!fact_sheet) {
    return res.status(400).json({ error: 'fact_sheet is required' });
  }

  // Format fact sheet text for model
  const factLines = Object.entries(fact_sheet)
    .map(([id, text]) => `[${id}]: ${text}`)
    .join('\n');

  const systemInstruction = `You are the GreenHome Retrofit Advisor for Lloyds Banking Group.
CRITICAL MANDATORY RULES:
1. "Models calculate, the LLM explains." You are an explainer, NOT a calculator.
2. Every numerical value or statistic you state MUST come directly from the provided Fact Sheet. NEVER invent or hallucinate any numbers.
3. You MUST cite the fact ID in brackets, e.g. "[F01]", "[F04]", whenever citing values from the fact sheet.
4. If a heat pump is recommended, explicitly explain that while gas consumption drops to zero or near-zero, electricity usage increases because heat pumps operate thermodynamically on electricity [F05].
5. Tone: professional, encouraging, transparent, and authoritative. Structure your response into clear sections with bullet points where appropriate.`;

  const userPrompt = `Here is the verified Fact Sheet for this property:
${factLines}

${
  question
    ? `Homeowner's question: "${question}". Provide a grounded answer citing the relevant facts.`
    : `Please explain this retrofit plan to the homeowner. Cover:
1. Current baseline performance and Green Home Score [F01, F02]
2. The recommended sequence of measures and why installation order matters [F03]
3. Energy and operational carbon savings, noting per-fuel electricity vs gas trade-offs [F04, F05, F06, F07]
4. Estimated capital cost range vs potential property value enhancement [F08, F09, F10]`
}`;

  if (geminiClient) {
    try {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      const explanation = response.text || '';
      return res.json({
        provider: 'gemini-3.8-flash',
        grounded: true,
        explanation,
        fact_sheet,
      });
    } catch (err) {
      console.error('Gemini API call failed, falling back to deterministic template:', err);
    }
  }

  // Fallback deterministic grounded explanation
  const templateExplanation = `### Home Assessment Summary
Based on your property records, this home currently holds a Green Home Score of **${fact_sheet.F02 || 'recorded score'}** [F02].

### Recommended Improvement Sequence
The engine has evaluated all fabric and heating options and prioritised the following feasible retrofits [F03]:
${fact_sheet.F03 || 'Feasible measures in sequence.'}

### Energy & Environmental Impact
- **Gas Reduction:** ${fact_sheet.F04 || 'Gas savings calculated'} [F04].
- **Electricity Dynamics:** ${fact_sheet.F05 || 'Electricity changes'} [F05]. Because heat pumps run thermodynamically on electricity, purchased electricity increases while gas demand is eliminated.
- **Net Energy & Carbon:** Overall energy demand decreases by ${fact_sheet.F06 || 'Net energy savings'} [F06], resulting in an operational carbon reduction of ${fact_sheet.F07 || 'Carbon reduction'} [F07] (evaluated using official UK DESNZ 2026 conversion factors).

### Financials & Property Value
- **Estimated Package Cost:** ${fact_sheet.F09 || 'Indicative cost'} [F09].
- **Annual Bill Saving:** ${fact_sheet.F10 || 'Bill savings'} [F10].
- **Indicative Value Impact:** Improving the home's thermal efficiency can enhance market desirability, with an estimated value increase of ${fact_sheet.F08 || 'Value impact'} [F08]. *(Note: Indicative estimate, not a formal RICS valuation).*`;

  return res.json({
    provider: 'template',
    grounded: true,
    explanation: templateExplanation,
    fact_sheet,
  });
});

// ---------------------------------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GreenHome Engine dev server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
