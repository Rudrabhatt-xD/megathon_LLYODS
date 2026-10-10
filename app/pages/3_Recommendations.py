"""My home / Retrofit plan: feasible measures in installation order, per-fuel savings, package, carbon, value, explanation."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import streamlit as st  # noqa: E402

from app.common import (assess_current, card, explanation_panel, fuel_chart, home_header, package_metrics, page_footer, page_setup,  # noqa: E402
                        property_picker, recommendation_card, safe, score_headline, value_panel)
from greenhome import formatting as F  # noqa: E402

svc = page_setup("Retrofit plan", picker=True)
pid = property_picker(svc)

with st.spinner("Working out feasible improvements..."):
    result = assess_current(svc, pid)
home_header(svc, pid, result)
if result is None:
    st.info("The assessment could not be loaded.")
    page_footer(svc)
    st.stop()

recs = result.recommendations
for warning in recs.warnings:
    st.warning(warning)

st.subheader("Recommended improvements, in installation order")
if recs.status == "unavailable":
    st.warning(f"Savings cannot be estimated for this home: {recs.reason}. Feasibility is still shown below; no numbers are invented.")
elif not recs.recommended:
    st.success("No feasible improvement measures were found: the main measures are already in place or not applicable.")
by_saving = st.toggle("Sort by estimated saving instead of installation order", value=False)
items = sorted(recs.recommended, key=lambda i: -i.standalone_saving.purchased_kwh) if by_saving else recs.recommended
for item in items:
    recommendation_card(item)

if recs.not_suitable:
    with st.expander(f"Not suitable for this home ({len(recs.not_suitable)})"):
        for status in recs.not_suitable:
            st.markdown(f"- **{status.name}**: {status.reason} ({status.status.replace('_', ' ')})")
if recs.needs_information:
    with st.expander(f"We need more information ({len(recs.needs_information)})", expanded=True):
        for status in recs.needs_information:
            st.markdown(f"- **{status.name}**: {status.reason}")
if recs.previously_declined:
    with st.expander(f"Previously declined ({len(recs.previously_declined)})"):
        for status in recs.previously_declined:
            st.markdown(f"- **{status.name}**: {status.reason}")

st.subheader("Whole package")
package = result.package
package_metrics(package, result.carbon, result.improvement_potential.pct)
if package.saving is not None:
    left, right = st.columns([3, 2])
    with left:
        with card("fuel"):
            st.markdown("**Purchased energy per year: current vs after the package**")
            st.plotly_chart(fuel_chart(package))
            if package.saving.elec_import_kwh < 0:
                st.caption("Electricity use rises because the heat pump runs on electricity; this is shown as a negative saving.")
    with right:
        if result.projected_score is not None:
            number, caption = score_headline(result.projected_score)
            st.metric("Projected score with the package", number, help="Uses the engine's projected energy use and the rating model's projected band")
            st.caption(caption)
        bill = result.bill
        if bill.status == "ok" and bill.saving_gbp and bill.saving_gbp > 0:
            st.metric("Bill saving (estimate, secondary)", F.fmt_bill(bill.saving_gbp),
                      help=f"Capped unit rates for {bill.period}; standing charges excluded")
            if bill.simple_payback_years:
                st.caption(f"Simple payback about {F.round_half_up(bill.simple_payback_years):.0f} years on unverified indicative costs; "
                           "ignores price changes and grants.")
        if package.solar_export_kwh:
            st.caption(f"Estimated solar export {F.fmt_kwh(package.solar_export_kwh)}: reported for information, never counted as a saving.")
value_panel(result.value)

st.subheader("Explain these results")
question = st.text_input("Optional question", placeholder="Why is the heat pump after insulation?", key="explain_question")
if st.button("Explain my plan", type="primary", key="explain_button", icon=":material/auto_awesome:"):
    with st.spinner("Writing a grounded explanation..."):
        edited = st.session_state.get("edits", {}).get(pid)
        if edited:
            stored = svc.get_property(pid)
            expl = safe(svc.explain, None, None, question or None, {**stored["profile"], **edited}, stored["monthly_usage"], doing="explaining the results")
        else:
            expl = safe(svc.explain, pid, None, question or None, doing="explaining the results")
    st.session_state["explanation"] = {"pid": pid, "value": expl}
stored_expl = st.session_state.get("explanation")
if stored_expl and stored_expl["pid"] == pid:
    explanation_panel(stored_expl["value"])
page_footer(svc)
