"""About page (entry point): the four customer questions, the core rule and where to go."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st  # noqa: E402

from app.common import card, PAGES, nav_link, page_footer, page_header, page_setup, pill, safe  # noqa: E402

svc = page_setup("About")
page_header("Green Home Score and Retrofit Engine", "A credible answer to “how green is my home?”",
            "Many people want a more energy-efficient home but do not know where to start. This tool gives an explainable answer for "
            "one home, and helps a lender or landlord see where a portfolio of homes is least efficient.")

QUESTIONS = [
    ("How green is my home today?", "A Green Home Score from 0 to 100, with the contribution of each of seven components."),
    ("What should I improve?", "A prioritised list of feasible retrofits, in installation order, each with a reason."),
    ("How much energy and carbon could I save?", "Estimates per fuel, for each measure and for the whole package."),
    ("Could this increase my property's value?", "An indicative range based on rating and price relationships, never a single number."),
]
cols = st.columns(4)
for i, (col, (question, answer)) in enumerate(zip(cols, QUESTIONS), start=1):
    col.markdown(f'<div class="gh-tile"><h4><span class="gh-num">{i}</span>{question}</h4><p>{answer}</p></div>', unsafe_allow_html=True)

st.write("")
left, right = st.columns([3, 2])
with left:
    with card("where"):
        st.subheader("Where to go")
        nav_link(PAGES["home"], "My home: score, potential savings and the path of measures", ":material/home:")
        nav_link(PAGES["plan"], "Retrofit plan: per-fuel savings, carbon, value and explanation", ":material/checklist:")
        nav_link(PAGES["whatif"], "What-if: change the plan and see it recalculated", ":material/tune:")
        nav_link(PAGES["portfolio"], "Portfolio: homes ranked by improvement potential", ":material/apartment:")
        nav_link(PAGES["assumptions"], "Assumptions and data: catalogue, factors, evaluation", ":material/fact_check:")
with right:
    with card("rule"):
        st.subheader("Core rule")
        st.markdown(
            "**Models calculate, the LLM explains.** Every number comes from tested calculations. The language model only explains "
            "a fact sheet of computed values and must cite them; a validator rejects any explanation with a number that is not in "
            "the fact sheet."
        )
        st.markdown(f'{pill("Savings are estimates", "info")} {pill("Value impact is indicative", "info")} {pill("All data are synthetic", "neutral")}',
                    unsafe_allow_html=True)

health = safe(svc.health, doing="reading the system status")
if health:
    st.caption(f"Emission factor set: {health['factor_set']} | models: "
               f"{', '.join(f'{k} {v}' for k, v in health['model_versions'].items()) or 'not trained yet'} | "
               f"explanations: {health['llm_provider']}")
page_footer(svc)
