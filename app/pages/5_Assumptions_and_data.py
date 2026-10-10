"""Assumptions and data: weights, mappings, catalogue, factors, prices, data card, models, limitations."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from app.common import COMPONENT_LABELS, page_footer, page_header, page_setup, safe  # noqa: E402
from greenhome import formatting as F  # noqa: E402

svc = page_setup("Assumptions and data")
page_header("Nothing hidden", "Assumptions and data",
            "Weights, mappings, the retrofit catalogue, emission factors, the data card and the evaluation results.")
info = safe(svc.assumptions, doing="loading the assumptions")
if info is None:
    st.stop()


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


tabs = st.tabs(["Score", "Retrofit catalogue", "Carbon and prices", "Data", "Models and evaluation", "Limitations"])
with tabs[0]:
    st.subheader("Official weights (fixed)")
    st.dataframe(pd.DataFrame([{"Component": COMPONENT_LABELS[k], "Weight": F.fmt_pct(100 * v),
                                "Mapping rule": info["mappings"][k]["rule"]} for k, v in info["weights"].items()]), hide_index=True)
    st.subheader("Classification bands")
    st.dataframe(pd.DataFrame(info["classification"]).rename(columns={"min": "Score from", "label": "Class"}), hide_index=True)
    st.subheader("Sub-score tables (worst to best; monotonic)")
    c1, c2, c3 = st.columns(3)
    for column, name in ((c1, "energy_efficiency"), (c2, "heating_system"), (c3, "smart_energy_management")):
        table = info["mappings"][name]
        column.markdown(f"**{COMPONENT_LABELS[name]}**")
        column.dataframe(pd.DataFrame({"State": table["order"], "Sub-score": [table["scores"][s] for s in table["order"]]}), hide_index=True)
    st.caption("Insulation and glazing use s = min(100, 100 x U_ref / U); intensity is linear between 40 and 300 kWh/m²/yr; "
               "renewables use 25 points per kWp. Full derivations: docs/SCORING_METHOD.md.")
with tabs[1]:
    st.subheader("Retrofit catalogue (team catalogue; takes precedence over the brief's illustrative figures)")
    st.dataframe(pd.DataFrame([{
        "Stage": m["stage"], "Measure": m["name"], "Effect": m["effect_type"],
        "Indicative cost (unverified)": F.fmt_cost_range(m["cost_low_gbp"], m["cost_high_gbp"]),
        "Effect source": m["effect_source"], "Cost source": m["cost_source"], "Parameters": json.dumps(m["effect_params"]),
    } for m in info["catalogue"]]), hide_index=True)
    st.caption("All costs are indicative team assumptions and are unverified. Measures are applied in stage order to the remaining demand.")
with tabs[2]:
    st.subheader(f"Emission factors in use: {info['factor_set']}")
    st.dataframe(pd.DataFrame(info["emission_factors"])[["fuel", "component", "kg_co2e_per_kwh", "basis", "scope", "source", "source_url", "published", "verified_status"]], hide_index=True)
    used = info["factors_used"]
    st.write(f"Electricity factor used = generation + transmission and distribution = **{used['electricity']:.5f} kg CO2e/kWh**; "
             f"gas = **{used['gas']:.5f} kg CO2e/kWh** (gross CV).")
    st.caption("Boundary: operational, location-based, annual-average factors. Excludes well-to-tank, embodied, lifecycle and financed emissions. "
               "Status 'secondary_confirmed' means the values were matched across two secondary summaries of the official DESNZ file.")
    st.subheader(f"Energy prices (optional bill view): {info['price_set']}")
    st.dataframe(pd.DataFrame(info["prices"]), hide_index=True)
with tabs[3]:
    card = read_json(svc.paths.reports / "data_card.json")
    if card:
        st.warning(card["disclosure"])
        st.write(f"Seed {card['seed']}; generator config hash `{card['config_hash']}`; usage window {card['usage_window'][0]} to {card['usage_window'][1]}.")
        st.dataframe(pd.DataFrame([card["row_counts"]]), hide_index=True)
        st.subheader("Calibration targets")
        st.dataframe(pd.DataFrame([{"Target": k, **v} for k, v in card["calibration"].items()]), hide_index=True)
        st.subheader("Injected data-quality issues")
        st.dataframe(pd.DataFrame([card["injected_issue_counts"]]).T.rename(columns={0: "count"}))
    else:
        st.info("Data card not found. Run `python run.py data`.")
with tabs[4]:
    st.subheader("Model versions")
    st.json(info["versions"])
    metrics = read_json(svc.paths.reports / "validation_metrics.json") or read_json(svc.paths.reports / "model_validation.json")
    if metrics:
        st.caption("Validation-set metrics, read from the report files written by the training and evaluation scripts.")
        st.json(metrics, expanded=1)
    else:
        st.info("No evaluation report found. Run `python run.py train evaluate`.")
    llm = read_json(svc.paths.reports / "llm_eval.json")
    if llm:
        st.subheader("LLM explanation evaluation")
        st.json({k: v for k, v in llm.items() if k != "template_only"} | {"template_only": {k: v for k, v in llm["template_only"].items() if k != "by_category"}}, expanded=1)
with tabs[5]:
    for text in info["limitations"]:
        st.markdown(f"- {text}")
    st.markdown("- Outputs are decision support. Ask a qualified assessor or installer to survey the home before any work.")
    st.markdown("- The value impact is an association in a synthetic dataset; it is indicative, not a valuation and not causal proof.")
page_footer(svc)
