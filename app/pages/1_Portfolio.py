"""Portfolio (business view): KPI cards, class distribution and homes ranked by improvement potential."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd  # noqa: E402
import plotly.express as px  # noqa: E402
import streamlit as st  # noqa: E402

from app.common import CLASS_COLOURS, PAGES, card, kpi_card, page_footer, page_header, page_setup, pill, safe, style_fig  # noqa: E402
from greenhome import formatting as F  # noqa: E402

svc = page_setup("Portfolio")
head, tag = st.columns([5, 1])
with head:
    page_header("A bigger picture. A better footprint.", "Your property portfolio",
                "Find the homes where improvements could make the biggest difference.")
tag.markdown(f'<div style="text-align:right;padding-top:26px">{pill("Synthetic portfolio", "good")}</div>', unsafe_allow_html=True)

with st.spinner("Loading portfolio assessments..."):
    table = safe(svc.portfolio_table, doing="loading the portfolio")
    summary = safe(svc.portfolio_summary, doing="summarising the portfolio")

if table is None or summary is None or len(table) == 0:
    st.warning("No portfolio assessments are available. Run `python run.py portfolio` to precompute them.")
    page_footer(svc)
    st.stop()


def big(number: str, unit: str = "") -> str:
    return f'<div><span class="gh-kpi-num">{number}</span><span class="gh-kpi-unit">{unit}</span></div>'


median = F.fmt_score(int(summary.median_score)).split("/")[0] if summary.median_score is not None else "n/a"
carbon_total = f"{F.round_half_up(summary.total_carbon_reduction_t, 10):,.0f}"
k1, k2, k3, k4 = st.columns(4)
k1.markdown(kpi_card("Properties", "building", big(f"{summary.n_properties:,}"), "Synthetic properties only"), unsafe_allow_html=True)
k2.markdown(kpi_card("Homes needing attention", "home", big(f"{summary.flagged_count:,}", F.fmt_pct(100 * summary.flagged_share) + " of homes"),
                     "Poor and Very poor classifications"), unsafe_allow_html=True)
k3.markdown(kpi_card("Median score", "leaf", big(median, "/ 100"), "Green Home Score"), unsafe_allow_html=True)
k4.markdown(kpi_card("Carbon reduction potential", "wind", big(carbon_total, "t CO2e / year"), "Estimate · sum of every home's feasible package"),
            unsafe_allow_html=True)
st.write("")

chart_data = table.assign(classification=table["classification"].fillna("Insufficient data"))
fig = px.histogram(chart_data, x="score", color="classification", nbins=50, color_discrete_map=CLASS_COLOURS,
                   category_orders={"classification": list(CLASS_COLOURS)})
style_fig(fig, 300)
fig.update_layout(xaxis_title="Green Home Score", yaxis_title="Homes", bargap=0.06)
fig.update_xaxes(showgrid=False)
with card("histogram"):
    st.markdown("**Score distribution by class**")
    st.plotly_chart(fig)

title, show = st.columns([3, 1])
title.subheader("Homes at a glance")
view_choice = show.selectbox("Show", ["Homes needing attention", "All homes"], label_visibility="collapsed")
f1, f2, f3, f4 = st.columns(4)
default_classes = ["Poor", "Very poor"] if view_choice == "Homes needing attention" else []
classes = f1.multiselect("Classification", list(CLASS_COLOURS)[:5], default=default_classes)
regions = f2.multiselect("Region", sorted(table["region"].dropna().unique()))
types = f3.multiselect("Property type", sorted(table["property_type"].dropna().unique()))
statuses = f4.multiselect("Improvement-potential status", sorted(table["ip_status"].dropna().unique()))

rows = safe(svc.portfolio, limit=len(table), doing="ranking the portfolio") or []
ranked = pd.DataFrame(rows)
if len(ranked):
    for column, wanted in (("classification", classes), ("region", regions), ("property_type", types), ("ip_status", statuses)):
        if wanted:
            ranked = ranked[ranked[column].isin(wanted)]
    view = pd.DataFrame({
        "Property": ranked["property_id"],
        "Type": ranked["property_type"].fillna("").str.replace("_", "-").str.capitalize(),
        "Green score": ranked["score"],
        "Classification": ranked["classification"].fillna("Insufficient data"),
        "Score status": ranked["status"],
        "Improvement potential (est.)": [F.fmt_pct(v) if v is not None else "unavailable" for v in ranked["improvement_potential_pct"]],
        "Gas change (est.)": [F.fmt_signed_kwh(v) for v in ranked["delta_gas_kwh"]],
        "Electricity change (est.)": [F.fmt_signed_kwh(v) for v in ranked["delta_elec_import_kwh"]],
        "Carbon (est.)": [F.fmt_carbon_change(v) if v is not None else "n/a" for v in ranked["carbon_reduction_kg"]],
        "Top issue": ranked["top_issue"].fillna(""),
        "IP status": ranked["ip_status"],
    })
    st.markdown(f'<div class="gh-small">{len(view):,} homes match, ranked by improvement potential. Homes with an unavailable improvement '
                'potential are listed last. A negative change means an increase. Select a row to open the home.</div>', unsafe_allow_html=True)
    event = st.dataframe(view.head(500), hide_index=True, on_select="rerun", selection_mode="single-row", key="portfolio_table",
                         column_config={"Green score": st.column_config.ProgressColumn("Green score", min_value=0, max_value=100, format="%d / 100")})
    selected = event.selection.rows if event is not None and hasattr(event, "selection") else []
    if selected:
        st.session_state["pid"] = view.iloc[selected[0]]["Property"]
        st.switch_page(PAGES["home"])
else:
    st.info("No homes match these filters.")
page_footer(svc)
