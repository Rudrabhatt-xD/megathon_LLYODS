"""My home / What-if: choose measures or ask in plain English. The engines recompute; the explanation follows."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import plotly.graph_objects as go  # noqa: E402
import streamlit as st  # noqa: E402

from app.common import (card, SUITABILITY_TONE, THEME, explanation_panel, fuel_chart, home_header, package_metrics, page_footer, page_setup,  # noqa: E402
                        pill, property_picker, safe, score_headline, style_fig, value_panel)
from greenhome.schemas import ScenarioResult  # noqa: E402

svc = page_setup("What-if", picker=True)
pid = property_picker(svc)

baseline = safe(svc.assess, pid, doing="assessing this home")
home_header(svc, pid, baseline)
if baseline is None:
    page_footer(svc)
    st.stop()
st.markdown('<div class="gh-small" style="margin-bottom:10px">Every what-if reruns the feasibility, savings, carbon, rating and value calculations. '
            'The explanation only describes those results.</div>', unsafe_allow_html=True)
recommended = list(baseline.package.measures)
catalogue = svc.cfg.catalogue


def show(result: ScenarioResult) -> None:
    if result.message:
        st.info(result.message)
    for warning in result.warnings:
        st.warning(warning)
    if result.excluded:
        st.markdown("**Requested but not applied**")
        for status in result.excluded:
            st.markdown(f"- **{status.name}**: {status.reason} ({status.status.replace('_', ' ')})")
    sc = result.scenario
    if sc.energy.saving is None:
        st.warning(f"Savings are not available: {sc.energy.reason}. No numbers are invented.")
        return
    st.markdown("**Applied, in installation order:** " + (" ".join(
        pill(f"{catalogue[m].name}: {sc.suitability[m]}", SUITABILITY_TONE[sc.suitability[m]]) for m in result.applied) or "none"),
        unsafe_allow_html=True)
    package_metrics(sc.energy, sc.carbon, sc.improvement_pct)
    left, right = st.columns(2)
    with left:
        with card("fuel"):
            st.markdown("**Purchased energy per year: current vs this scenario**")
            st.plotly_chart(fuel_chart(sc.energy, "This scenario"), key=f"fuel_{result.scenario_id}")
    with right:
        rec = baseline.package
        if rec.saving is not None:
            fig = go.Figure()
            labels = ["Gas saving", "Electricity saving", "Net purchased-energy saving"]
            fig.add_bar(x=labels, y=[rec.saving.gas_kwh, rec.saving.elec_import_kwh, rec.saving.net_purchased_kwh],
                        name="Recommended package (estimate)", marker_color=THEME["neutral"])
            fig.add_bar(x=labels, y=[sc.energy.saving.gas_kwh, sc.energy.saving.elec_import_kwh, sc.energy.saving.net_purchased_kwh],
                        name="This scenario (estimate)", marker_color=THEME["green"])
            style_fig(fig, 340)
            fig.update_layout(barmode="group", yaxis_title="kWh per year (negative = increase)")
            fig.update_xaxes(showgrid=False)
            with card("compare"):
                st.markdown("**Compared with the recommended package**")
                st.plotly_chart(fig, key=f"compare_{result.scenario_id}")
    m1, m2, m3 = st.columns(3)
    number, caption = score_headline(baseline.score)
    m1.metric("Score today", number)
    m1.caption(caption)
    if sc.projected_score is not None:
        number, caption = score_headline(sc.projected_score)
        m2.metric("Projected score", number)
        m2.caption(caption)
    if sc.projected_band:
        m3.metric("Projected rating band", f"{sc.projected_band} (projected)")
    value_panel(sc.value)
    st.caption(f"Scenario id {result.scenario_id}. The same request always gives the same id and numbers.")


tab_pick, tab_ask = st.tabs(["Choose measures", "Ask a question"])
with tab_pick:
    with st.form("scenario_form"):
        st.write("Tick the measures to include. The recommended package is pre-ticked.")
        cols = st.columns(2)
        chosen = [m for i, (m, measure) in enumerate(catalogue.items())
                  if cols[i % 2].checkbox(measure.name, value=m in recommended, key=f"measure_{m}")]
        with st.expander("Correct the description of the home for this scenario (optional)"):
            glazing = st.selectbox("Glazing", ["(as recorded)", "single", "secondary", "double_pre2002", "double_post2002", "triple"])
            outdoor = st.selectbox("Outdoor space for a heat pump unit", ["(as recorded)", "yes", "no"])
        run = st.form_submit_button("Run scenario", type="primary")
    if run:
        overrides = {}
        if glazing != "(as recorded)":
            overrides["glazing"] = glazing
        if outdoor != "(as recorded)":
            overrides["has_outdoor_space"] = outdoor == "yes"
        with st.spinner("Recalculating..."):
            st.session_state["scenario"] = safe(svc.simulate, {"property_id": pid, "measures": chosen, "overrides": overrides},
                                                doing="running the scenario")
        st.session_state.pop("scenario_explanation", None)
    result = st.session_state.get("scenario")
    if result is not None and result.property_id == pid:
        show(result)
        if st.button("Explain this scenario", key="explain_scenario", icon=":material/auto_awesome:"):
            with st.spinner("Writing a grounded explanation..."):
                st.session_state["scenario_explanation"] = safe(svc.explain, None, None, None, None, None, result, doing="explaining the scenario")
        explanation_panel(st.session_state.get("scenario_explanation"))

with tab_ask:
    question = st.text_input("Your question", placeholder="What if I skip the heat pump and add solar?", key="whatif_question")
    if st.button("Ask", type="primary", key="ask_button") and question.strip():
        with st.spinner("Recalculating and explaining..."):
            st.session_state["whatif"] = {"pid": pid, "out": safe(svc.whatif, pid, question, doing="answering the what-if")}
    asked = st.session_state.get("whatif")
    if asked and asked["pid"] == pid and asked["out"] is not None:
        out = asked["out"]
        parsed = out["parsed_request"]
        st.caption(f"Understood as: add {parsed.get('add') or []}, remove {parsed.get('remove') or []}, "
                   f"only {parsed.get('measures')} (parser: {parsed.get('parser')})")
        if out["scenario"] is not None:
            show(out["scenario"])
        explanation_panel(out["explanation"])
page_footer(svc)
