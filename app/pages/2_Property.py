"""My home / Overview: score, potential savings and carbon, the path of measures, score breakdown, value, data quality."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from app.common import (card, COMPONENT_LABELS, EDITABLE, SUITABILITY_TONE, UNKNOWN, assess_current, carbon_kpi, chip_row, contribution_chart,  # noqa: E402
                        edits_for, home_header, nav_link, page_footer, page_setup, path_row, pill, property_picker, savings_kpi,
                        score_bars, score_kpi, simulate_current, value_teaser, PAGES)
from greenhome import formatting as F  # noqa: E402

svc = page_setup("My home", picker=True)
pid = property_picker(svc)

with st.spinner("Assessing the home..."):
    result = assess_current(svc, pid)

home_header(svc, pid, result, show_download=True)
if result is None:
    st.info("The assessment could not be loaded. The rest of the page is still available.")
    page_footer(svc)
    st.stop()

profile = result.profile
with st.expander("Edit details (corrects the description of the home; meter data stay as measured)", icon=":material/edit:"):
    with st.form("edit_form"):
        cols = st.columns(3)
        new_values = {}
        for i, (name, options) in enumerate(EDITABLE.items()):
            current = profile.get(name)
            choices = [UNKNOWN] + options
            new_values[name] = cols[i % 3].selectbox(name.replace("_", " ").capitalize(), choices,
                                                     index=choices.index(current) if current in choices else 0)
        loft = cols[0].number_input("Loft insulation (mm), if pitched loft", 0, 400, int(profile.get("loft_insulation_mm") or 0), step=10)
        area = cols[1].number_input("Floor area (m²), 0 = unknown", 0, 600, int(profile.get("floor_area_m2") or 0), step=5)
        submitted = st.form_submit_button("Apply changes")
        reset = st.form_submit_button("Reset to recorded details")
    if submitted:
        edits = {k: (None if v == UNKNOWN else v) for k, v in new_values.items()}
        edits["floor_area_m2"] = float(area) if area > 0 else None
        if profile.get("roof_type") == "pitched_loft":
            edits["loft_insulation_mm"] = float(loft)
        st.session_state.setdefault("edits", {})[pid] = edits
        st.rerun()
    if reset:
        st.session_state.setdefault("edits", {}).pop(pid, None)
        st.rerun()
if edits_for(pid):
    st.caption(":material/edit: Showing results for the edited description of this home.")

# selected path: all recommended measures by default; ticking boxes recalculates through the what-if engine
recommended = result.recommendations.recommended
selected = [i.measure_id for i in recommended if st.session_state.get(f"path_{pid}_{i.measure_id}", True)]
package, carbon, value, label = result.package, result.carbon, result.value, "recommended package"
if recommended and len(selected) != len(recommended):
    scenario = simulate_current(svc, pid, selected)
    if scenario is not None:
        package, carbon, value = scenario.scenario.energy, scenario.scenario.carbon, scenario.scenario.value
        label = "selected measures"

k1, k2, k3 = st.columns([1.05, 1, 1])
k1.markdown(score_kpi(result.score), unsafe_allow_html=True)
k2.markdown(savings_kpi(package, label), unsafe_allow_html=True)
k3.markdown(carbon_kpi(carbon), unsafe_allow_html=True)
st.write("")

left, right = st.columns([1.3, 1])
with left:
    head, count = st.columns([3, 1])
    head.subheader("Your path to a greener home")
    count.markdown(f'<div class="gh-small" style="text-align:right;padding-top:18px">{len(selected)} selected</div>', unsafe_allow_html=True)
    recs = result.recommendations
    if recs.status == "unavailable":
        st.warning(f"Savings cannot be estimated for this home: {recs.reason}. No numbers are invented.")
    elif not recommended:
        st.success("No feasible improvement measures were found: the main measures are already in place or not applicable.")
    else:
        with card("path"):
            for item in recommended:
                row, level, tick = st.columns([6, 1.3, 0.5], vertical_alignment="center")
                row.markdown(path_row(item.sequence_position, item.measure_id, item.name), unsafe_allow_html=True)
                level.markdown(pill(item.suitability, SUITABILITY_TONE[item.suitability]), unsafe_allow_html=True)
                tick.checkbox(item.name, value=True, key=f"path_{pid}_{item.measure_id}", label_visibility="collapsed")
    note, link = st.columns([2, 1])
    note.markdown('<div class="gh-small">Applied in installation order. Estimates are not guarantees.</div>', unsafe_allow_html=True)
    nav_link(PAGES["plan"], "Explain my plan →", None, link)
    if recs.needs_information:
        st.markdown('<div class="gh-small" style="margin-top:8px">We need more information for: '
                    + "; ".join(f"{s.name} ({s.reason})" for s in recs.needs_information) + "</div>", unsafe_allow_html=True)

    st.subheader("Key issues")
    if result.detector.top_issues:
        with card("issues"):
            for issue in result.detector.top_issues:
                st.markdown(f":material/priority_high: **{issue.text}**  \n<span class='gh-small'>{issue.evidence}</span>", unsafe_allow_html=True)
    else:
        st.write("No key issues were found.")
with right:
    st.subheader("Behind your score")
    st.markdown(score_bars(result.score), unsafe_allow_html=True)
    st.markdown(value_teaser(value), unsafe_allow_html=True)
    flag_text, flag_tone = {"flagged": ("Flagged: poorly performing home", "warn"), "not_flagged": ("Not flagged", "good"),
                            "flag_unknown": ("Flag unknown: insufficient data", "neutral")}[result.detector.flag_status]
    ip = result.improvement_potential
    potential = f"Improvement potential {F.fmt_pct(ip.pct)} (estimate)" if ip.pct is not None else f"Improvement potential unavailable: {ip.reason}"
    st.markdown(f'<div style="margin-top:12px">{pill(flag_text, flag_tone)} {pill("Observed inputs " + F.fmt_pct(100 * result.score.completeness), "neutral")}</div>'
                f'<div class="gh-small" style="margin-top:8px">{potential}</div>', unsafe_allow_html=True)

with st.expander("Score details: every component, its input and where it came from"):
    table = pd.DataFrame([{
        "Component": COMPONENT_LABELS[c.name], "Weight": F.fmt_pct(100 * c.weight), "Sub-score": F.fmt_points(c.subscore),
        "Contribution": F.fmt_points(c.contribution), "Input used": c.input_used,
        "Input source": c.input_provenance.replace("_", " ") + ("" if c.input_provenance in ("measured", "user_provided") else " (est.)"),
    } for c in result.score.components])
    st.dataframe(table, hide_index=True)
    st.plotly_chart(contribution_chart(result.score))
    st.caption("Contributions are shown to one decimal; the score is the rounded sum of the unrounded contributions. "
               "Grey bars show the maximum each component can contribute.")

st.subheader("Data quality")
dq = result.data_quality
q1, q2, q3 = st.columns(3)
q1.metric("Data completeness", F.fmt_pct(100 * dq.completeness_score))
q2.metric("Electricity meter data", dq.usage_status_elec.replace("_", " "), help=f"{dq.months_valid_elec} valid months in the current-state window")
q3.metric("Gas meter data", dq.usage_status_gas.replace("_", " "), help=f"{dq.months_valid_gas} valid months in the current-state window")
if dq.usage_status_elec in ("missing", "insufficient_months"):
    st.info("No usable usage data: estimates use typical consumption for similar homes and are labelled as estimated.")
chip_row("Missing", dq.fields_missing, "red")
chip_row("Estimated (est.)", dq.fields_estimated, "orange")
chip_row("Default assumed", dq.fields_default, "blue")
chip_row("Uncertain", dq.fields_uncertain, "violet")
for warning in dq.warnings[:8]:
    (st.warning if warning.severity != "info" else st.info)(f"{warning.rule_id}: {warning.message}")
est = result.estimates
if est.get("rating_band_est"):
    st.caption(f"Rating-model estimate from the home's features: band {est['rating_band_est']} "
               f"({F.fmt_sap(est['rating_points_est'])} points, est.). The score always uses the recorded rating when one exists.")

with st.expander("Provenance of this result"):
    st.json(result.provenance)
page_footer(svc)
