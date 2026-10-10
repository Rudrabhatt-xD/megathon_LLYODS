"""Optional extension: customer memory. Shows how recommendations change as memory builds up (O03)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

from app.common import card, page_footer, page_header, page_setup, property_picker, safe  # noqa: E402
from greenhome import formatting as F  # noqa: E402
from greenhome.service import GreenHomeService  # noqa: E402

svc = page_setup("Customer memory", picker=True)
pid = property_picker(svc)
page_header("Recommendations that remember", f"Customer memory: {pid}",
            "Memory records completed retrofits, constraints and declined measures. It only changes the property state or filters and "
            "reorders measures. Scores, savings, carbon and value are always recalculated by the engines.")

if svc.memory is None:
    st.warning("Customer memory is not enabled in this session.")
    st.stop()

customer = svc.store.customer_of(pid)
catalogue = svc.cfg.catalogue


@st.cache_resource
def plain_service(_svc: GreenHomeService) -> GreenHomeService:
    """Same models and data, without memory: the 'before' view."""
    return GreenHomeService(cfg=_svc.cfg, paths=_svc.paths, est=_svc.est, memory=None)


def record(event_type: str, payload: dict) -> None:
    if safe(svc.memory.add_event, customer, event_type, payload, svc.cfg, doing="saving the memory event") is not None:
        svc.invalidate()
        st.rerun()


c1, c2, c3 = st.columns(3)
with c1:
    with card("mem_completed"):
        st.markdown("**Completed retrofit**")
        done = st.selectbox("Measure completed", list(catalogue), format_func=lambda m: catalogue[m].name, key="memory_done")
        if st.button("Record as completed", key="memory_done_button"):
            record("completed_retrofit", {"property_id": pid, "measure_id": done})
with c2:
    with card("mem_constraint"):
        st.markdown("**Constraint**")
        no_external = st.checkbox("No external works", key="memory_no_external")
        budget = st.number_input("Budget per measure (GBP, 0 = no limit)", 0, 50000, 0, step=500, key="memory_budget")
        if st.button("Save constraint", key="memory_constraint_button"):
            payload = {"no_external_works": bool(no_external)}
            if budget > 0:
                payload["budget_max_gbp"] = float(budget)
            record("constraint", payload)
with c3:
    with card("mem_declined"):
        st.markdown("**Declined measure**")
        declined = st.selectbox("Measure declined", list(catalogue), format_func=lambda m: catalogue[m].name, key="memory_declined")
        if st.button("Record as declined", key="memory_declined_button"):
            record("declined", {"measure_id": declined})

events = safe(svc.memory.events, customer, doing="reading the memory") or []
st.subheader(f"Timeline for customer {customer} ({len(events)} events)")
if events:
    st.dataframe(pd.DataFrame([{"When (UTC)": e["created_utc"], "Type": e["type"].replace("_", " "), "Details": str(e["payload"])} for e in events]), hide_index=True)
    if st.button("Clear this customer's memory", key="memory_clear"):
        svc.memory.clear(customer)
        svc.invalidate()
        st.rerun()
else:
    st.info("No memory yet for this customer. Add an event above to see the recommendations adapt.")

before = safe(plain_service(svc).assess, pid, doing="assessing the home without memory")
after = safe(svc.assess, pid, doing="assessing the home with memory")
if before is None or after is None:
    st.stop()


def summary(result) -> pd.DataFrame:
    rows = [{"Order": i.sequence_position, "Measure": i.name, "Suitability": i.suitability,
             "Gas saving (est.)": F.fmt_signed_kwh(i.incremental_saving.gas_kwh),
             "Electricity saving (est.)": F.fmt_signed_kwh(i.incremental_saving.elec_import_kwh)} for i in result.recommendations.recommended]
    return pd.DataFrame(rows)


left, right = st.columns(2)
with left:
    st.subheader("Without memory")
    st.metric("Score", F.fmt_score(before.score.score))
    st.dataframe(summary(before), hide_index=True)
with right:
    st.subheader("With memory")
    st.metric("Score", F.fmt_score(after.score.score), help="Changes only when a completed retrofit changed the property state")
    st.dataframe(summary(after), hide_index=True)
    for status in after.recommendations.previously_declined:
        st.markdown(f"- Previously declined: **{status.name}**")
    for status in after.recommendations.not_suitable:
        if status.reason_code == "CUSTOMER_CONSTRAINT":
            st.markdown(f"- Blocked by your constraint: **{status.name}**")
    if after.package.baseline is not None and after.package.baseline.provenance != "measured":
        st.caption("A completed retrofit changed the home, so earlier meter data no longer apply; the baseline is estimated until new readings exist.")
page_footer(svc)
