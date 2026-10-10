# Green Home Score and Retrofit Engine

Lloyds Problem Statement 2, Megathon X: Singularity. Repository name: `green-home-engine`.

A homeowner (or a lender looking at many homes) gets answers to four questions:

1. **How green is my home today?** A Green Home Score (0 to 100) with the contribution of each of seven components.
2. **What should I improve?** A prioritised list of *feasible* retrofits, in installation order, each with suitability, saving and reason.
3. **How much energy and carbon could I save?** Estimates per fuel (electricity and gas separately), per measure and for the package.
4. **Could this increase my property's value?** An indicative range, never a single number.

**Core rule: models calculate, the LLM explains.** Every number comes from tested Python code. The language model only receives a
fact sheet of already-formatted values, must cite fact ids, and a validator rejects any explanation containing a number that is not in
the cited facts. Without an API key the app uses a deterministic template and says so on screen.

All data are synthetic. Savings are estimates, not guarantees. Value impact is indicative, not a valuation.

## Quick start

Python 3.11 or 3.12 (built and tested on 3.12.0, Windows 11).

```bash
python -m venv .venv
```

```bash
.venv\Scripts\python -m pip install -r requirements.txt
```

```bash
.venv\Scripts\python run.py all
```

```bash
.venv\Scripts\python run.py app
```

On Linux/macOS use `.venv/bin/python`. If `make` is installed, `make setup && make all && make app` does the same; `run.py` mirrors the
Makefile for machines without `make`.

`run.py all` regenerates everything from scratch: `data -> prepare -> train -> portfolio -> evaluate -> predict-test -> llm-eval -> test -> docs`.
The measured duration of the last full run is recorded in `docs/BUILD_STATUS.md`.

| Target | What it does | Main outputs |
|---|---|---|
| `data` | Generate the synthetic world (seed 42) | `data/synthetic/*.csv`, `data/synthetic/_truth/`, `reports/data_card.json` |
| `prepare` | Validate, clean, split by customer, annualise | `data/processed/`, `data/splits/`, `artifacts/profiles/`, `reports/validation_report.csv` |
| `train` | Train the three models and baselines | `artifacts/models/*.joblib`, `artifacts/manifest.json`, `reports/model_validation.json` |
| `portfolio` | Assess every property once for the dashboard | `data/processed/portfolio_assessments.csv` |
| `evaluate` | Validation metrics vs baselines and reference labels | `reports/validation_metrics.json`, `docs/MODEL_EVALUATION.md` |
| `predict-test` | Held-out test predictions and one-off test metrics | `outputs/test_predictions/`, `reports/test_metrics.json` |
| `llm-eval` | 40 held-out explanation scenarios | `tests/llm/scenarios.jsonl`, `reports/llm_eval.json` |
| `test` | `pytest -m "not live_llm"` | `reports/junit.xml` |
| `docs` | Render documents that contain measured numbers | `docs/MODEL_EVALUATION.md`, `docs/BUILD_STATUS.md` |
| `api` | FastAPI on http://localhost:8000 (`/docs` for the schema) | |
| `app` | Streamlit dashboard on http://localhost:8501 | |
| `clean` | Delete generated files | |

## API

`python run.py api`, then for example:

```bash
curl http://localhost:8000/properties/P10001/assessment
```

Endpoints: `/health`, `/properties`, `/properties/{id}`, `/properties/{id}/assessment`, `POST /assess`, `POST /scenario`,
`POST /explain`, `POST /whatif`, `/portfolio/summary`, `/config/assumptions`, `POST /customers/{id}/memory` (optional extension).
The API and the dashboard call the same `greenhome.service` functions. See `docs/ARCHITECTURE.md`.

## Environment variables

Copy `.env.example` to `.env` (never commit `.env`).

| Variable | Default | Meaning |
|---|---|---|
| `LLM_PROVIDER` | `template` | `template` (offline) or `anthropic` |
| `LLM_API_KEY` | empty | API key; without it the app stays in template mode |
| `LLM_MODEL` | empty | Model id; if empty with `anthropic`, `config/assumptions.yaml: llm.default_model` is used |
| `LLM_TIMEOUT_SECONDS`, `LLM_MAX_OUTPUT_TOKENS`, `LLM_EFFORT` | 15, 2000, low | Call settings |
| `GREENHOME_FACTOR_SET` | `DESNZ_2026` | Emission factor set from `config/emission_factors.csv` |
| `GREENHOME_PRICE_SET` | `OFGEM_2026Q4` | Price set for the optional bill view |
| `GREENHOME_MEMORY` | `1` | `0` disables the optional customer memory |

## Reproducibility

- One seed (`42`) for the generator, the splits and the models; pinned dependencies in `requirements.txt`.
- Every result carries a provenance block: input hash, config hash, model versions, factor set, code version, timestamp.
- `artifacts/manifest.json` records model versions, training-data hash, features and hyperparameters.
- No metric in any document is typed by hand: `scripts/render_docs.py` renders them from the JSON files that the scripts write.
- Tests: `python run.py test`. Status of every requirement: `docs/BUILD_STATUS.md`.

## Folder map

```
config/      weights, sub-score mappings, retrofit catalogue, emission factors, prices, assumptions, validation rules, generator
greenhome/   the package: data/ (generate, labels, validate, clean, annualise, splits), features, score, detector, feasibility,
             recommend, energy/ (baseline, measures, package), carbon, value, scenario, models/, llm/, memory, service
api/         FastAPI wrapper            app/        Streamlit dashboard
scripts/     generate_data, prepare_data, train_models, precompute_portfolio, evaluate, make_test_predictions, run_llm_eval, render_docs
tests/       unit, integration, scenarios (official scenario tests), llm, api, ui, fixtures (worked examples)
docs/        specification, architecture, data dictionary, scoring method, evaluation, LLM, assumptions, responsible AI, demo, checklist
data/        synthetic/ (observed tables), synthetic/_truth/ (hidden state and labels, evaluation only), processed/, splits/
artifacts/   trained models and fitted profiles      reports/   metrics and audits      outputs/   held-out test predictions
```

## Limitations (summary)

- All records are synthetic. Agreement with synthetic labels does not establish real-world predictive accuracy.
- Only grid electricity and mains gas are modelled; other heating fuels return "unsupported fuel".
- Retrofit costs and most engine parameters are unverified team assumptions (`docs/ASSUMPTIONS_AND_LIMITATIONS.md`).
- Emission factors are the DESNZ 2026 values, confirmed from secondary summaries only; the official file still needs to be checked.
- The live LLM path has not been exercised against a real API (no key was available during the build).

Public data: none is used. Sources of published figures are listed in `docs/ASSUMPTIONS_AND_LIMITATIONS.md`.
