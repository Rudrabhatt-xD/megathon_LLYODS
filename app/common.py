"""Shared dashboard helpers (Section R): cached service, "greenhome" theme, navigation, cards, charts, error panel.
The dashboard calls greenhome.service in-process; every number shown comes from formatting.py."""
from __future__ import annotations

import html
import sys
import uuid
from pathlib import Path
from typing import Any, Callable, Optional

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import plotly.graph_objects as go  # noqa: E402
import streamlit as st  # noqa: E402

from greenhome import formatting as F  # noqa: E402
from greenhome.provenance import log_event  # noqa: E402
from greenhome.schemas import AssessmentResult, Explanation, PackageResult, RecommendationItem, ScoreResult  # noqa: E402
from greenhome.service import GreenHomeService, get_service  # noqa: E402

# Theme "greenhome" (mirrors .streamlit/config.toml, refined institutional palette)
THEME = {"green": "#059669", "green_dark": "#047857", "green_soft": "#ECFDF5", "ink": "#0F172A", "muted": "#64748B",
         "border": "#E2E8F0", "bg": "#F8FAFC", "grid": "#F1F5F9", "neutral": "#CBD5E1", "amber": "#D97706", "amber_soft": "#FFFBEB",
         "danger": "#DC2626"}
CLASS_COLOURS = {"Highly efficient": "#047857", "Good": "#059669", "Moderate": "#10B981", "Poor": "#D97706",
                 "Very poor": "#EA580C", "Insufficient data": "#94A3B8"}
FUEL_COLOURS = {"electricity": THEME["green"], "gas": THEME["amber"]}
SUITABILITY_COLOURS = {"High": "green", "Medium": "orange", "Low": "gray"}
SUITABILITY_TONE = {"High": "good", "Medium": "warn", "Low": "neutral"}
COMPONENT_LABELS = {"energy_efficiency": "Energy efficiency (rating)", "consumption_intensity": "Consumption intensity",
                    "insulation": "Insulation", "heating_system": "Heating system", "windows_glazing": "Windows and glazing",
                    "renewable_energy": "Renewable energy", "smart_energy_management": "Smart energy management"}
SHORT_LABELS = {"energy_efficiency": "Energy rating", "consumption_intensity": "Energy consumption", "insulation": "Insulation",
                "heating_system": "Heating system", "windows_glazing": "Glazing", "renewable_energy": "Renewable energy",
                "smart_energy_management": "Smart controls"}
EDITABLE = {
    "glazing": ["single", "secondary", "double_pre2002", "double_post2002", "triple"],
    "wall_insulation": ["none", "partial", "insulated"],
    "heating_type": ["gas_condensing_boiler", "gas_noncondensing_boiler", "electric_storage", "electric_direct", "air_source_heat_pump", "other_fuel"],
    "smart_controls": ["none", "programmer_only", "programmer_thermostat", "programmer_thermostat_trvs", "smart_thermostat", "smart_zoned"],
    "energy_rating": ["A", "B", "C", "D", "E", "F", "G"],
    "roof_orientation": ["S", "SE", "SW", "E", "W", "N"],
}
UNKNOWN = "(unknown)"
TEMPLATE_NOTE = "Explanations are generated from a template (no LLM key configured); all numbers come from the calculation engines either way."
AGE_TEXT = {"pre_1919": "Built before 1919", "1919_1944": "Built 1919–1944", "1945_1964": "Built 1945–1964",
            "1965_1982": "Built 1965–1982", "1983_1995": "Built 1983–1995", "1996_2011": "Built 1996–2011",
            "2012_plus": "Built 2012 or later"}
MEASURE_TAGLINE = {
    "loft_insulation": "Keep more warmth where it belongs.", "cavity_wall_insulation": "Reduce heat loss through external walls.",
    "solid_wall_insulation": "Insulate solid walls, inside or out.", "double_glazing": "Lose less heat through your windows.",
    "smart_thermostat": "Heat your home only when you need to.", "air_source_heat_pump": "Swap your heating for an efficient heat pump.",
    "solar_pv": "Generate electricity from your rooftop.",
}
MEASURE_ICON = {"loft_insulation": "home", "cavity_wall_insulation": "layers", "solid_wall_insulation": "layers", "double_glazing": "window",
                "smart_thermostat": "sliders", "air_source_heat_pump": "wind", "solar_pv": "sun"}
PAGES = {"home": "pages/2_Property.py", "plan": "pages/3_Recommendations.py", "whatif": "pages/4_What_if.py",
         "portfolio": "pages/1_Portfolio.py", "assumptions": "pages/5_Assumptions_and_data.py", "memory": "pages/6_Memory.py", "about": "Home.py"}

_ICON_PATHS = {
    "leaf": '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c3-5 6-8 10-10"/>',
    "home": '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    "layers": '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
    "sliders": '<path d="M4 7h9"/><path d="M19 7h1"/><path d="M4 17h3"/><path d="M13 17h7"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/>',
    "wind": '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 15h15a3 3 0 1 1-3 3"/><path d="M3 12h8"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M5 5l1.5 1.5"/><path d="M17.5 17.5L19 19"/><path d="M5 19l1.5-1.5"/><path d="M17.5 6.5L19 5"/>',
    "window": '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18"/><path d="M4 12h16"/>',
    "bolt": '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    "building": '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h1"/><path d="M14 8h1"/><path d="M9 12h1"/><path d="M14 12h1"/><path d="M10 21v-4h4v4"/>',
    "pin": '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    "trend": '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    "shield": '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.500-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
}


def icon(name: str, size: int = 18) -> str:
    """Inline line icon (stroke follows the text colour)."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px">{_ICON_PATHS[name]}</svg>')


def get_css(theme: str = "light") -> str:
    is_dark = theme == "dark"
    bg_app = "#0B0F17" if is_dark else "#F8FAFC"
    text_main = "#F8FAFC" if is_dark else "#0F172A"
    text_muted = "#94A3B8" if is_dark else "#64748B"
    bg_sidebar = "#111827" if is_dark else "#FFFFFF"
    border_color = "#1F2937" if is_dark else "#E2E8F0"
    bg_card = "#111827" if is_dark else "#FFFFFF"
    bg_chip = "#0B0F17" if is_dark else "#F8FAFC"
    border_chip = "#1F2937" if is_dark else "#E2E8F0"
    nav_hover = "#1F2937" if is_dark else "#F1F5F9"
    nav_active_bg = "#064E3B" if is_dark else "#ECFDF5"
    nav_active_text = "#34D399" if is_dark else "#047857"
    nav_active_border = "#10B981" if is_dark else "#059669"

    df_filter = f"filter: invert(0.92) hue-rotate(180deg);" if is_dark else ""
    return f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {{
  --background-color: {bg_app} !important;
  --secondary-background-color: {bg_card} !important;
  --text-color: {text_main} !important;
  --primary-color: #059669 !important;
}}

html, body, .stApp, [data-testid="stSidebar"], .stMarkdown, button, input, textarea, select {{
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}}
.stApp {{
  background-color: {bg_app} !important;
  color: {text_main} !important;
}}
header[data-testid="stHeader"] {{
  background: transparent !important;
  height: 0 !important;
}}
.block-container {{
  padding-top: 1.5rem !important;
  padding-bottom: 4rem !important;
  max-width: 1240px !important;
}}

/* Headings with crisp letter-spacing */
h1, h2, h3, h4, h5 {{
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 700 !important;
  letter-spacing: -0.025em !important;
  color: {text_main} !important;
}}
h1 {{ font-size: 2.1rem !important; }}
h2 {{ font-size: 1.45rem !important; margin-top: 1.2rem !important; margin-bottom: 0.6rem !important; }}
h3 {{ font-size: 1.15rem !important; padding-top: 0.6rem !important; color: {text_main} !important; }}

/* Enhanced Modern Sidebar */
[data-testid="stSidebar"] {{
  background-color: {bg_sidebar} !important;
  border-right: 1px solid {border_color} !important;
}}
[data-testid="stSidebar"] [data-testid="stSidebarContent"] {{
  background-color: {bg_sidebar} !important;
  padding-top: 1rem !important;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}}
[data-testid="stSidebar"] [data-testid="stVerticalBlock"] {{
  gap: 0.45rem !important;
}}

/* Fix: Sidebar section labels with clean spacing to prevent overlap */
.gh-side-label {{
  display: block !important;
  font-size: 0.70rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.12em !important;
  color: {text_muted} !important;
  text-transform: uppercase !important;
  margin: 14px 0 6px 0 !important;
  padding: 0 4px !important;
  line-height: 1.4 !important;
  clear: both !important;
}}

.gh-theme-label {{
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  color: {text_muted} !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}}

[data-testid="stSidebar"] div[data-testid="stElementContainer"] {{
  margin-top: 0 !important;
  margin-bottom: 2px !important;
}}

[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] {{
  border-radius: 8px !important;
  padding: 9px 12px !important;
  background: transparent !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  transition: all 0.15s ease-in-out !important;
}}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] p {{
  color: {text_muted} !important;
  font-size: 0.88rem !important;
  font-weight: 500 !important;
  margin: 0 !important;
}}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"]:hover {{
  background: {nav_hover} !important;
}}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"]:hover p {{
  color: {text_main} !important;
}}
[data-testid="stSidebar"] .st-key-gh-nav-active {{
  margin: 2px 0 !important;
  padding: 0 !important;
}}
[data-testid="stSidebar"] .st-key-gh-nav-active [data-testid="stPageLink-NavLink"] {{
  background: {nav_active_bg} !important;
  border-left: 3px solid {nav_active_border} !important;
}}
[data-testid="stSidebar"] .st-key-gh-nav-active [data-testid="stPageLink-NavLink"] p,
[data-testid="stSidebar"] .st-key-gh-nav-active [data-testid="stPageLink-NavLink"] span {{
  color: {nav_active_text} !important;
  font-weight: 600 !important;
}}

/* Modern Tab links */
.block-container [data-testid="stPageLink-NavLink"] {{
  padding: 8px 14px 12px 14px !important;
  border-radius: 6px 6px 0 0 !important;
  background: transparent !important;
  border-bottom: 2px solid transparent !important;
  transition: all 0.15s ease !important;
}}
.block-container [data-testid="stPageLink-NavLink"] p {{
  color: {text_muted} !important;
  font-size: 0.92rem !important;
  font-weight: 500 !important;
  white-space: nowrap !important;
}}
.block-container [data-testid="stPageLink-NavLink"]:hover {{
  background: {nav_hover} !important;
}}
.block-container [data-testid="stPageLink-NavLink"]:hover p {{
  color: {text_main} !important;
}}
.block-container .st-key-gh-tab-active [data-testid="stPageLink-NavLink"] {{
  border-bottom: 2px solid {nav_active_border} !important;
  background: {bg_card} !important;
}}
.block-container .st-key-gh-tab-active [data-testid="stPageLink-NavLink"] p {{
  color: {nav_active_border} !important;
  font-weight: 600 !important;
}}

/* Stock metric styling */
[data-testid="stMetric"] {{
  background: {bg_card} !important;
  border: 1px solid {border_color} !important;
  border-radius: 12px !important;
  padding: 18px 20px !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04) !important;
}}
[data-testid="stMetricLabel"] p {{
  color: {text_muted} !important;
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}}
[data-testid="stMetricValue"] {{
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 1.65rem !important;
  font-weight: 600 !important;
  color: {text_main} !important;
  white-space: normal !important;
  line-height: 1.25 !important;
  letter-spacing: -0.02em !important;
}}

/* Card container */
[data-testid="stExpander"] {{
  border: 1px solid {border_color} !important;
  border-radius: 12px !important;
  background: {bg_card} !important;
}}
[class*="st-key-ghcard-"] {{
  border-radius: 12px !important;
  background: {bg_card} !important;
  border-color: {border_color} !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04) !important;
}}
[data-testid="stDataFrame"] {{
  border: 1px solid {border_color} !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  background: {bg_card} !important;
  {df_filter}
}}

/* All widget labels and form controls with crisp high contrast */
[data-testid="stWidgetLabel"] p,
[data-testid="stWidgetLabel"] label,
[data-testid="stWidgetLabel"] span,
label p,
label span,
.stCheckbox label p,
.stCheckbox label span,
.stNumberInput label p,
.stSelectbox label p {{
  color: {text_main} !important;
  font-weight: 600 !important;
  font-size: 0.88rem !important;
}}

/* Form inputs & Selectboxes */
[data-baseweb="select"] {{
  background-color: {bg_card} !important;
  border-radius: 8px !important;
}}
[data-baseweb="select"] > div {{
  background-color: {bg_card} !important;
  border: 1px solid {border_color} !important;
  border-radius: 8px !important;
  color: {text_main} !important;
}}
[data-baseweb="select"] * {{
  color: {text_main} !important;
}}
[data-baseweb="select"] svg {{
  fill: {text_muted} !important;
}}
[data-testid="stSidebar"] [data-baseweb="select"] > div {{
  background-color: {"#1A2234" if is_dark else "#FFFFFF"} !important;
  border: 1px solid {border_color} !important;
  color: {text_main} !important;
}}

[data-baseweb="input"] {{
  background-color: {bg_card} !important;
  border-radius: 8px !important;
}}
[data-baseweb="input"] > div {{
  background-color: {bg_card} !important;
  border: 1px solid {border_color} !important;
  border-radius: 8px !important;
  color: {text_main} !important;
}}
[data-baseweb="input"] input {{
  background-color: {bg_card} !important;
  color: {text_main} !important;
  font-size: 0.92rem !important;
}}
[data-testid="stNumberInput"] button {{
  background-color: {bg_card} !important;
  color: {text_main} !important;
  border-color: {border_color} !important;
}}
[data-testid="stNumberInput"] button:hover {{
  background-color: {nav_hover} !important;
}}
[data-testid="stNumberInput"] svg {{
  fill: {text_muted} !important;
  stroke: {text_muted} !important;
}}

/* Checkboxes */
[data-testid="stCheckbox"] {{
  color: {text_main} !important;
}}
[data-testid="stCheckbox"] span {{
  color: {text_main} !important;
  font-size: 0.90rem !important;
}}
[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child {{
  border-color: {border_color} !important;
  background-color: {bg_card} !important;
}}

/* Dropdown popover list */
ul[data-baseweb="menu"], [data-baseweb="popover"], div[role="listbox"] {{
  background-color: {bg_card} !important;
  border: 1px solid {border_color} !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.45) !important;
  border-radius: 8px !important;
}}
li[data-baseweb="menu-item"], [role="option"] {{
  background-color: {bg_card} !important;
  color: {text_main} !important;
}}
li[data-baseweb="menu-item"]:hover, [role="option"]:hover, [aria-selected="true"] {{
  background-color: {nav_hover} !important;
  color: {text_main} !important;
}}

/* Alerts & Notices */
[data-testid="stAlert"] {{
  border-radius: 10px !important;
  border: 1px solid {"rgba(59, 130, 246, 0.4)" if is_dark else "#BFDBFE"} !important;
  background-color: {"#0F1E36" if is_dark else "#EFF6FF"} !important;
  padding: 14px 18px !important;
}}
[data-testid="stAlert"] [data-testid="stMarkdownContainer"] p,
[data-testid="stAlert"] p {{
  color: {"#93C5FD" if is_dark else "#1E40AF"} !important;
  font-size: 0.92rem !important;
  font-weight: 500 !important;
  line-height: 1.5 !important;
}}

/* Standard HTML tables */
table {{
  width: 100% !important;
  border-collapse: collapse !important;
  color: {text_main} !important;
  background: {bg_card} !important;
}}
th {{
  background: {nav_hover} !important;
  color: {text_main} !important;
  font-weight: 600 !important;
  border-bottom: 2px solid {border_color} !important;
  padding: 8px 12px !important;
}}
td {{
  border-bottom: 1px solid {border_color} !important;
  color: {text_main} !important;
  padding: 8px 12px !important;
}}

/* Interactive elements */
.stButton > button, .stDownloadButton > button, [data-testid="stFormSubmitButton"] > button {{
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 0.88rem !important;
  padding: 8px 16px !important;
  transition: all 0.15s ease-in-out !important;
  background: {bg_card} !important;
  border: 1px solid {border_color} !important;
  color: {text_main} !important;
}}
.stButton > button:hover, .stDownloadButton > button:hover {{
  background: {nav_hover} !important;
  border-color: #059669 !important;
  color: {text_main} !important;
}}
.stButton > button[kind="primary"], [data-testid="stFormSubmitButton"] > button[kind="primary"] {{
  background: #059669 !important;
  border-color: #059669 !important;
  color: #FFFFFF !important;
  box-shadow: 0 1px 2px 0 rgba(5, 150, 105, 0.3) !important;
}}
.stButton > button[kind="primary"]:hover, [data-testid="stFormSubmitButton"] > button[kind="primary"]:hover {{
  background: #047857 !important;
  border-color: #047857 !important;
}}
hr {{ border-color: {border_color} !important; }}
input, textarea {{
  color: {text_main} !important;
}}

/* Custom Branding & Layout */
.gh-logo-row {{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px 14px 6px;
  border-bottom: 1px solid {border_color};
  margin-bottom: 12px;
}}
.gh-logo-mark {{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #FFFFFF;
  box-shadow: 0 2px 4px 0 rgba(5, 150, 105, 0.25);
}}
.gh-logo-text {{
  font-size: 1.35rem;
  font-weight: 700;
  color: {text_main};
  letter-spacing: -0.03em;
}}
.gh-logo-text span {{ color: #059669; }}

.gh-side-foot {{
  border-top: 1px solid {border_color};
  margin-top: 24px;
  padding: 16px 6px 0 6px;
  color: {text_muted};
  font-size: 0.78rem;
  line-height: 1.6;
}}
.gh-side-foot b {{ color: #059669; font-weight: 600; }}
.gh-ws {{
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  background: {bg_chip};
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid {border_color};
  color: {text_muted};
}}
.gh-ws-text {{ color: {text_main} !important; font-weight: 600; }}
.gh-ws-badge {{
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: {nav_active_bg};
  color: {nav_active_text};
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}}

/* Top bar with Breadcrumbs & Status */
.gh-topbar {{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0 16px 0;
  margin-bottom: 22px;
  border-bottom: 1px solid {border_color};
  color: {text_muted};
  font-size: 0.88rem;
}}
.gh-topbar .gh-crumb-now {{ color: {text_main}; font-weight: 600; }}
.gh-topbar .gh-right {{ margin-left: auto; display: flex; gap: 8px; align-items: center; }}

/* Page Header */
.gh-eyebrow {{
  color: #059669;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}}
.gh-title {{
  font-size: 1.95rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: {text_main};
  line-height: 1.2;
}}
.gh-sub {{
  color: {text_muted};
  font-size: 0.95rem;
  margin: 6px 0 18px 0;
  line-height: 1.5;
}}

/* Property Header Card */
.gh-prop {{
  display: flex;
  background: {bg_card};
  border: 1px solid {border_color};
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 18px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}}
.gh-prop-img {{
  flex: 0 0 140px;
  background: {"linear-gradient(135deg, #064E3B 0%, #065F46 100%)" if is_dark else "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: {"#34D399" if is_dark else "#059669"};
  border-right: 1px solid {border_color};
}}
.gh-prop-body {{ padding: 18px 24px; flex: 1; }}
.gh-prop-name {{ font-size: 1.25rem; font-weight: 700; color: {text_main}; }}
.gh-prop-loc {{ color: {text_muted}; font-size: 0.84rem; margin: 4px 0 14px 0; display: flex; align-items: center; gap: 4px; }}
.gh-facts {{ display: flex; flex-wrap: wrap; gap: 0; font-size: 0.84rem; color: {text_main}; }}
.gh-facts span {{ padding: 0 14px; border-left: 1px solid {border_color}; }}
.gh-facts span:first-child {{ padding-left: 0; border-left: none; }}

/* Enhanced Modern KPI Cards */
.gh-kpi {{
  background: {bg_card};
  border: 1px solid {border_color};
  border-radius: 14px;
  padding: 20px 22px;
  min-height: 184px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}}
.gh-kpi:hover {{
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);
}}
.gh-kpi-head {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.86rem;
  font-weight: 600;
  color: {text_muted};
  margin-bottom: 16px;
}}
.gh-kpi-icon {{
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: {nav_active_bg};
  color: {nav_active_text};
  display: flex;
  align-items: center;
  justify-content: center;
}}
.gh-kpi-num {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: {text_main};
  line-height: 1.1;
}}
.gh-kpi-unit {{
  font-size: 0.84rem;
  color: {text_muted};
  font-weight: 500;
  margin-left: 6px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}}
.gh-kpi-line {{
  font-size: 0.82rem;
  color: {"#34D399" if is_dark else "#059669"};
  font-weight: 600;
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}}
.gh-kpi-line .up {{ color: {"#FBBF24" if is_dark else "#D97706"}; }}
.gh-kpi-foot {{
  font-size: 0.74rem;
  color: {text_muted};
  margin-top: 16px;
  padding-top: 10px;
  border-top: 1px dashed {border_color};
}}

/* Green Gauge */
.gh-gauge-row {{ display: flex; flex-wrap: wrap; align-items: center; gap: 16px 22px; }}
.gh-gauge {{ position: relative; width: 124px; height: 80px; flex: 0 0 124px; display: block; }}
.gh-gauge svg {{ display: block; overflow: visible; }}

/* Rows and Path steps */
.gh-row {{ display: flex; align-items: center; gap: 14px; padding: 6px 0; }}
.gh-row-no {{ font-family: 'JetBrains Mono', monospace; font-size: 0.76rem; font-weight: 600; color: {text_muted}; width: 22px; }}
.gh-row-icon {{
  width: 36px; height: 36px;
  border-radius: 10px;
  background: {nav_active_bg};
  color: {nav_active_text};
  display: flex; align-items: center; justify-content: center;
  flex: 0 0 36px;
}}
.gh-row-title {{ font-size: 0.98rem; font-weight: 600; color: {text_main}; }}
.gh-row-sub {{ font-size: 0.8rem; color: {text_muted}; margin-top: 2px; }}

/* Progress bars */
.gh-bars {{ background: {bg_card}; border: 1px solid {border_color}; border-radius: 14px; padding: 20px 22px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03); }}
.gh-bar {{ margin-bottom: 16px; }}
.gh-bar-head {{ display: flex; justify-content: space-between; font-size: 0.84rem; font-weight: 500; color: {text_main}; margin-bottom: 6px; }}
.gh-bar-head span:last-child {{ color: {text_muted}; font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 0.8rem; }}
.gh-bar-track {{ height: 6px; background: {border_color}; border-radius: 9999px; overflow: hidden; }}
.gh-bar-fill {{ height: 6px; border-radius: 9999px; }}

/* Value card */
.gh-value {{
  background: {"linear-gradient(135deg, #064E3B 0%, #022C22 100%)" if is_dark else "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)"};
  border: 1px solid {"#047857" if is_dark else "#A7F3D0"};
  border-radius: 14px;
  padding: 22px 24px;
  margin-top: 14px;
  box-shadow: 0 1px 3px 0 rgba(5, 150, 105, 0.08);
}}
.gh-value-title {{ color: {"#A7F3D0" if is_dark else "#065F46"}; font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; }}
.gh-value-range {{
  font-family: 'JetBrains Mono', monospace;
  color: {"#34D399" if is_dark else "#047857"};
  font-size: 1.6rem;
  font-weight: 700;
  margin: 10px 0 8px 0;
}}

/* Recommendation card */
.gh-card {{
  display: flex;
  gap: 16px;
  padding: 20px 22px;
  margin-bottom: 14px;
  background: {bg_card};
  border: 1px solid {border_color};
  border-radius: 14px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}}
.gh-card:hover {{
  border-color: {"#374151" if is_dark else "#CBD5E1"};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);
}}
.gh-step {{
  flex: 0 0 38px;
  height: 38px;
  border-radius: 10px;
  background: {nav_active_bg};
  color: {nav_active_text};
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}}
.gh-card-body {{ flex: 1; min-width: 0; }}
.gh-card-head {{ display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 6px; }}
.gh-card-title {{ font-weight: 700; font-size: 1.1rem; color: {text_main}; }}
.gh-reason {{ color: {text_main}; font-size: 0.92rem; line-height: 1.5; margin-bottom: 14px; }}
.gh-chips {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 12px; }}
.gh-chip {{
  background: {bg_chip};
  border: 1px solid {border_chip};
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.92rem;
  font-weight: 600;
  color: {text_main};
  font-family: 'JetBrains Mono', monospace;
}}
.gh-chip b {{
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  color: {text_muted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin-bottom: 3px;
}}
.gh-chip.gh-up {{
  background: {"#451A03" if is_dark else "#FFFBEB"};
  border-color: {"#78350F" if is_dark else "#FDE68A"};
  color: {"#FBBF24" if is_dark else "#B45309"};
}}
.gh-chip.gh-quiet {{ background: {bg_card}; }}
.gh-small {{ color: {text_muted}; font-size: 0.8rem; line-height: 1.55; }}

/* Status tags & pills */
.gh-pill {{
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}}
.gh-pill.good {{
  background: {"#064E3B" if is_dark else "#ECFDF5"};
  color: {"#34D399" if is_dark else "#047857"};
  border: 1px solid {"#047857" if is_dark else "#A7F3D0"};
}}
.gh-pill.warn {{
  background: {"#451A03" if is_dark else "#FFFBEB"};
  color: {"#FBBF24" if is_dark else "#B45309"};
  border: 1px solid {"#78350F" if is_dark else "#FDE68A"};
}}
.gh-pill.bad {{
  background: {"#450A0A" if is_dark else "#FEF2F2"};
  color: {"#F87171" if is_dark else "#B91C1C"};
  border: 1px solid {"#7F1D1D" if is_dark else "#FECACA"};
}}
.gh-pill.neutral {{
  background: {"#1F2937" if is_dark else "#F1F5F9"};
  color: {"#94A3B8" if is_dark else "#475569"};
  border: 1px solid {"#374151" if is_dark else "#E2E8F0"};
}}
.gh-pill.info {{
  background: {"#1E3A8A" if is_dark else "#EFF6FF"};
  color: {"#93C5FD" if is_dark else "#1D4ED8"};
  border: 1px solid {"#1E40AF" if is_dark else "#BFDBFE"};
}}

/* Info Tile */
.gh-tile {{
  background: {bg_card};
  border: 1px solid {border_color};
  border-radius: 14px;
  padding: 20px 22px;
  min-height: 172px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}}
.gh-tile h4 {{ margin: 0 0 10px 0; font-size: 1.05rem; font-weight: 700; color: {text_main}; display: flex; align-items: center; }}
.gh-tile p {{ margin: 0; color: {text_muted}; font-size: 0.9rem; line-height: 1.55; }}
.gh-tile .gh-num {{
  display: inline-flex;
  width: 28px; height: 28px;
  border-radius: 8px;
  background: {nav_active_bg};
  color: {nav_active_text};
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.85rem;
  align-items: center; justify-content: center;
  margin-right: 10px;
}}

/* Footer */
.gh-footer {{
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: {text_muted};
  font-size: 0.78rem;
  margin-top: 40px;
  padding-top: 18px;
  border-top: 1px solid {border_color};
}}
</style>
"""

CSS = get_css("light")


@st.cache_resource(show_spinner="Loading models and data...")
def service() -> GreenHomeService:
    return get_service()


def pill(text: str, tone: str = "neutral") -> str:
    """Small status pill (HTML). Tones: good, warn, bad, neutral, info."""
    return f'<span class="gh-pill {tone}">{html.escape(text)}</span>'


def card(name: str) -> Any:
    """Bordered white card. Keyed (unique per run) so the theme can style it via the .st-key-ghcard-* class."""
    counts = st.session_state.setdefault("_gh_cards", {})
    counts[name] = counts.get(name, 0) + 1
    return st.container(border=True, key=f"ghcard-{name}-{counts[name]}")


def class_tone(classification: Optional[str]) -> str:
    return {"Highly efficient": "good", "Good": "good", "Moderate": "good", "Poor": "warn", "Very poor": "warn"}.get(classification or "", "neutral")


def nav_link(page: str, label: str, icon: str | None = None, container: Any = None) -> None:
    """Link to another page. Paths are relative to app/Home.py, so this degrades to plain text when a
    page is run on its own (for example in tests)."""
    target = container or st
    try:
        target.page_link(page, label=label, icon=icon)
    except Exception:  # noqa: BLE001
        target.caption(label)


def _sidebar(svc: GreenHomeService, title: str, picker: bool) -> None:
    side = st.sidebar
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"

    side.markdown(f'<div class="gh-logo-row"><span class="gh-logo-mark">{icon("leaf", 18)}</span>'
                  '<span class="gh-logo-text">greenhome<span>.</span></span></div>', unsafe_allow_html=True)

    # Theme Toggle in Sidebar
    tcol1, tcol2 = side.columns([3, 1], vertical_alignment="center")
    tcol1.markdown(f'<span class="gh-theme-label">{"🌙 Dark theme" if is_dark else "☀️ Light theme"}</span>', unsafe_allow_html=True)
    theme_toggle = tcol2.toggle("Theme", value=is_dark, key=f"theme_toggle_{title}", label_visibility="collapsed")
    if theme_toggle != is_dark:
        st.session_state["theme"] = "dark" if theme_toggle else "light"
        st.rerun()

    side.markdown('<div class="gh-side-label">Workspace</div>', unsafe_allow_html=True)
    active = {"My home": "home", "Retrofit plan": "home", "What-if": "home", "Portfolio": "portfolio",
              "Assumptions and data": "assumptions", "Customer memory": "memory", "About": "about"}.get(title)

    def link(key: str, label: str, material: str) -> None:
        # the active entry sits in a keyed container so the theme can highlight it (.st-key-gh-nav-active)
        nav_link(PAGES[key], label, material, side.container(key="gh-nav-active") if key == active else side)

    link("home", "My home", ":material/home:")
    link("portfolio", "Portfolio", ":material/apartment:")
    side.markdown('<div class="gh-side-label">Reference</div>', unsafe_allow_html=True)
    link("assumptions", "Assumptions and data", ":material/fact_check:")
    link("memory", "Customer memory", ":material/history:")
    link("about", "About", ":material/info:")
    if picker:
        side.markdown('<div class="gh-side-label">Property</div>', unsafe_allow_html=True)
        ids = svc.property_ids()
        current = st.session_state.get("pid", ids[0])
        choice = side.selectbox("Property", ids, index=ids.index(current) if current in ids else 0, key=f"picker_{title}",
                                label_visibility="collapsed", help="P10001 to P10005 are the seeded demo homes")
        st.session_state["pid"] = choice
    ws_title_color = "#F8FAFC" if is_dark else "#18201B"
    side.markdown(f'<div class="gh-side-foot">{icon("shield", 14)} <b>Thoughtfully greener.</b><br/>Better homes. A lighter footprint.'
                  f'<div class="gh-ws"><span class="gh-ws-badge">GH</span><span><span style="color:{ws_title_color};font-weight:600">Hackathon workspace</span><br/>'
                  'Lloyds &middot; Problem statement 2</span></div></div>', unsafe_allow_html=True)


def page_setup(title: str, picker: bool = False) -> GreenHomeService:
    """Page config, theme, sidebar navigation and the breadcrumb bar."""
    st.set_page_config(page_title=f"{title} | greenhome", page_icon=":seedling:", layout="wide")
    st.session_state["_gh_page"] = title
    st.session_state["_gh_cards"] = {}
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    st.markdown(get_css(theme), unsafe_allow_html=True)
    svc = service()
    _sidebar(svc, title, picker)
    mode = pill("Template mode", "info") if svc.llm_provider() == "template" else pill("LLM explanations on", "info")
    theme_pill = pill("Dark mode", "neutral") if is_dark else pill("Light mode", "neutral")
    st.markdown(f'<div class="gh-topbar"><span>Workspace</span><span>/</span><span class="gh-crumb-now">{html.escape(title)}</span>'
                f'<span class="gh-right">{mode}{theme_pill}{pill("Demo workspace", "good")}</span></div>', unsafe_allow_html=True)
    return svc


def page_header(eyebrow: str, title: str, subtitle: str = "") -> None:
    sub = f'<div class="gh-sub">{html.escape(subtitle)}</div>' if subtitle else ""
    st.markdown(f'<div class="gh-eyebrow">{icon("leaf", 13)} {html.escape(eyebrow)}</div><div class="gh-title">{html.escape(title)}</div>{sub}',
                unsafe_allow_html=True)


def page_footer(svc: GreenHomeService) -> None:
    note = TEMPLATE_NOTE if svc.llm_provider() == "template" else "Explanations are written by a language model and checked against the fact sheet."
    st.markdown(f'<div class="gh-footer"><span>{icon("shield", 13)} Synthetic demo data. No real customer information. Savings are estimates; '
                f'value impact is indicative. {html.escape(note)}</span><span>Green Home Engine &middot; Lloyds PS2</span></div>', unsafe_allow_html=True)


def safe(fn: Callable[..., Any], *args: Any, doing: str = "loading this section", **kwargs: Any) -> Any:
    """Run a service call; on failure show an error panel with an error id and let the page continue (R.2)."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:  # noqa: BLE001 - the rest of the page must still render
        error_id = uuid.uuid4().hex[:10]
        log_event("ui_error", error_id=error_id, doing=doing, error=type(exc).__name__, message=str(exc)[:300])
        st.error(f"Something went wrong while {doing}: {type(exc).__name__}: {exc} (error id {error_id})")
        return None


def property_picker(svc: GreenHomeService, page: str = "") -> str:
    """The selected property id (the picker itself is drawn in the sidebar by page_setup(picker=True))."""
    return st.session_state.get("pid", svc.property_ids()[0])


def edits_for(pid: str) -> dict[str, Any]:
    return st.session_state.setdefault("edits", {}).get(pid, {})


def assess_current(svc: GreenHomeService, pid: str) -> Optional[AssessmentResult]:
    """Assessment of the selected home, including any details the user edited on the My home page."""
    edits = edits_for(pid)
    if not edits:
        return safe(svc.assess, pid, doing="assessing this home")
    stored = safe(svc.get_property, pid, doing="loading this home")
    if stored is None:
        return None
    profile = {**stored["profile"], **edits}
    return safe(svc.assess, None, profile, stored["monthly_usage"], doing="assessing the edited home")


def simulate_current(svc: GreenHomeService, pid: str, measures: list[str]) -> Any:
    """Scenario for the selected home (with any edited details) and an explicit set of measures."""
    edits = edits_for(pid)
    if not edits:
        return safe(svc.simulate, {"property_id": pid, "measures": measures}, doing="recalculating the selected plan")
    stored = safe(svc.get_property, pid, doing="loading this home")
    if stored is None:
        return None
    profile = {k: v for k, v in {**stored["profile"], **edits}.items()}
    return safe(svc.simulate, {"profile": profile, "monthly_usage": stored["monthly_usage"], "measures": measures},
                doing="recalculating the selected plan")


def score_headline(score: ScoreResult) -> tuple[str, str]:
    """(big number, caption) for a score card, respecting provisional and insufficient-data states."""
    if score.status == "insufficient_data":
        return "n/a", f"Insufficient data: possible range {score.range_low} to {score.range_high}"
    if score.status == "provisional":
        return F.fmt_score(score.score), f"{score.classification} (provisional), range {score.range_low} to {score.range_high}"
    if score.status == "projected":
        return F.fmt_score(score.score), f"{score.classification} (projected)"
    return F.fmt_score(score.score), f"{score.classification} (confirmed)"


# ----------------------------------------------------------------------------------- home header

def home_header(svc: GreenHomeService, pid: str, result: Optional[AssessmentResult], show_download: bool = False) -> None:
    """Eyebrow, title, property card and the Overview / Retrofit plan / What-if tab bar."""
    left, right = st.columns([4, 1.3], vertical_alignment="center")
    with left:
        page_header("Your home, a little greener", "A better future starts at home.", "Understand your home. Discover its potential. Make a difference.")
    if show_download and result is not None:
        right.download_button("Download report", data=result.model_dump_json(indent=2), file_name=f"{pid}_assessment.json",
                              mime="application/json", icon=":material/download:", key="download_report")
    profile = result.profile if result is not None else {}
    kind = str(profile.get("property_type") or "home").replace("_", "-").capitalize()
    region = str(profile.get("region") or "region not recorded").replace("_", " ").title().replace(" Of ", " of ")
    band = profile.get("energy_rating")
    band_html = (f'EPC <b style="color:{THEME["green"] if band in ("A", "B", "C") else THEME["amber"]}">{band}</b>' if band else "EPC not recorded")
    facts = [kind, f"{profile['floor_area_m2']:g} m²" if profile.get("floor_area_m2") else "Floor area not recorded",
             AGE_TEXT.get(profile.get("age_band"), "Age not recorded")]
    tag = pill("Demo home", "good") if profile.get("demo_seed") else pill("Synthetic property", "good")
    st.markdown(
        f'<div class="gh-prop"><div class="gh-prop-img">{icon("home", 64)}</div><div class="gh-prop-body">'
        f'<span class="gh-prop-name">Home {html.escape(pid)}</span> &nbsp;{tag}'
        f'<div class="gh-prop-loc">{icon("pin", 13)} {html.escape(region)}, United Kingdom</div>'
        f'<div class="gh-facts">{"".join(f"<span>{html.escape(f)}</span>" for f in facts)}<span>{band_html}</span></div></div></div>',
        unsafe_allow_html=True)
    tabs = st.columns([1.2, 1.6, 1.2, 6])
    current = st.session_state.get("_gh_page")
    for column, (key, label, page_title) in zip(tabs, (("home", "Overview", "My home"), ("plan", "Retrofit plan", "Retrofit plan"),
                                                       ("whatif", "What-if", "What-if"))):
        nav_link(PAGES[key], label, None, column.container(key="gh-tab-active") if page_title == current else column)
    st.markdown('<hr style="margin:-14px 0 18px 0"/>', unsafe_allow_html=True)


# --------------------------------------------------------------------------------------- KPI cards

def kpi_card(title: str, icon_name: str, body: str, foot: str) -> str:
    return (f'<div class="gh-kpi"><div class="gh-kpi-head"><span>{html.escape(title)}</span><span class="gh-kpi-icon">{icon(icon_name, 16)}</span></div>'
            f'{body}<div class="gh-kpi-foot">{html.escape(foot)}</div></div>')


def score_kpi(score: ScoreResult) -> str:
    """Green Home Score card: arc gauge, number, class pill and status."""
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    track_stroke = "#1F2937" if is_dark else "#E2E8F0"
    text_color = "#F8FAFC" if is_dark else "#0F172A"
    muted_color = "#94A3B8" if is_dark else "#64748B"

    number, caption = score_headline(score)
    colour = CLASS_COLOURS.get(score.classification or "Insufficient data", THEME["neutral"])
    shown = score.score if score.status != "insufficient_data" else 0
    big = str(score.score) if score.status != "insufficient_data" else "n/a"
    observed = sum(1 for c in score.components if c.input_provenance in ("measured", "user_provided"))

    arc = (f'<svg width="124" height="78" viewBox="0 0 124 78">'
           f'<path d="M 12 70 A 50 50 0 0 1 112 70" fill="none" stroke="{track_stroke}" stroke-width="7" stroke-linecap="round"/>'
           f'<path d="M 12 70 A 50 50 0 0 1 112 70" fill="none" stroke="{colour}" stroke-width="7" stroke-linecap="round" pathLength="100" '
           f'stroke-dasharray="{shown} 100"/>'
           f'<text x="62" y="55" text-anchor="middle" font-family="\'JetBrains Mono\', monospace" font-size="28" font-weight="700" fill="{text_color}">{big}</text>'
           f'<text x="62" y="69" text-anchor="middle" font-family="\'Plus Jakarta Sans\', sans-serif" font-size="9" font-weight="600" fill="{muted_color}" letter-spacing="0.5">OUT OF 100</text>'
           f'</svg>')
    body = (f'<div class="gh-gauge-row"><div class="gh-gauge">{arc}</div>'
            f'<div>{pill(caption, class_tone(score.classification) if score.status != "insufficient_data" else "neutral")}'
            f'<div class="gh-small" style="margin-top:10px">A little change can<br/>go a long way.</div></div></div>')
    return kpi_card("Green Home Score", "leaf", body, f"Score {number} · {observed} of {len(score.components)} weighted components observed")


def _split(text: str) -> tuple[str, str]:
    head, _, tail = text.partition(" ")
    return head, tail


def savings_kpi(package: PackageResult, label: str = "recommended package") -> str:
    if package.saving is None:
        body = f'<div class="gh-kpi-num" style="font-size:1.3rem">Not available</div><div class="gh-small" style="margin-top:8px">{html.escape(package.reason or "no valid energy baseline")}</div>'
        return kpi_card("Potential energy savings", "bolt", body, "No numbers are invented when data are missing")
    s = package.saving

    def line(value: float, fuel: str) -> str:
        amount = f"{abs(F.round_kwh(value)):,}"
        if F.round_kwh(value) < 0:
            return f'<span class="up">↑ {amount} {fuel} (increase)</span>'
        return f'<span>↓ {amount} {fuel}</span>'

    body = (f'<div><span class="gh-kpi-num">{F.round_kwh(s.net_purchased_kwh):,}</span><span class="gh-kpi-unit">kWh / year</span></div>'
            f'<div class="gh-kpi-line">{line(s.gas_kwh, "gas")}{line(s.elec_import_kwh, "electricity")}</div>')
    return kpi_card("Potential energy savings", "bolt", body, f"Estimate · {label} · {F.fmt_pct(s.net_pct)} of purchased energy")


def carbon_kpi(carbon: Any) -> str:
    if carbon.status != "ok":
        body = f'<div class="gh-kpi-num" style="font-size:1.3rem">Not available</div><div class="gh-small" style="margin-top:8px">{html.escape(carbon.reason)}</div>'
        return kpi_card("Potential carbon reduction", "wind", body, "Operational emissions only")
    number, unit = _split(F.fmt_tco2e(carbon.reduction_kg))
    word = "increase" if carbon.reduction_kg < 0 else "A smaller footprint, every year"
    title = "Potential carbon increase" if carbon.reduction_kg < 0 else "Potential carbon reduction"
    body = (f'<div><span class="gh-kpi-num">{number}</span><span class="gh-kpi-unit">{html.escape(unit.replace("t CO2e/yr", "tonnes CO2e / year").replace("kg CO2e/yr", "kg CO2e / year"))}</span></div>'
            f'<div class="gh-kpi-line"><span>{icon("leaf", 13)} {word}</span></div>')
    return kpi_card(title, "wind", body, f"Estimate · operational emissions only · {carbon.factor_set}")


def score_bars(score: ScoreResult) -> str:
    """'Behind your score': one progress bar per component (contribution out of its maximum)."""
    rows = []
    for c in score.components:
        colour = THEME["green"] if c.subscore >= 60 else THEME["amber"]
        tag = "" if c.input_provenance in ("measured", "user_provided") else f" ({c.input_provenance})"
        rows.append(f'<div class="gh-bar"><div class="gh-bar-head"><span>{SHORT_LABELS[c.name]}{html.escape(tag)}</span>'
                    f'<span>{F.fmt_points(c.contribution)} / {F.fmt_weight_points(c.weight)}</span></div>'
                    f'<div class="gh-bar-track"><div class="gh-bar-fill" style="width:{int(round(c.subscore))}%;background:{colour}"></div></div></div>')
    return (f'<div class="gh-bars">{"".join(rows)}<div class="gh-small">{icon("info", 13)} Each component contributes to your overall score. '
            'Bars show points earned out of the maximum for that component.</div></div>')


def value_teaser(value: Any) -> str:
    """Green value card of the overview. The full required wording is on the Retrofit plan tab."""
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    sub_color = "#94A3B8" if is_dark else "#3F5A49"
    if value.status in ("ok", "percent_only"):
        pounds = f" ({F.fmt_gbp_range(value.value_low, value.value_high)})" if value.status == "ok" else ""
        middle = f'<div class="gh-value-range">{F.fmt_uplift_range(value.uplift_pct_low, value.uplift_pct_high)}{html.escape(pounds)}</div>'
    elif value.status == "no_band_change":
        middle = '<div class="gh-value-range" style="font-size:1.05rem">No rating band change is predicted</div>'
    else:
        middle = f'<div class="gh-value-range" style="font-size:1.05rem">Not available: {html.escape(value.reason or value.status)}</div>'
    return (f'<div class="gh-value"><div class="gh-value-title">{icon("trend", 16)} A home with more potential</div>'
            f'<div class="gh-small" style="color:{sub_color};margin-top:8px">Energy improvements could also support your property\'s value.</div>'
            f'{middle}<div class="gh-small" style="color:{sub_color}">Indicative range only. Not a valuation or a guaranteed return.</div></div>')


def path_row(position: int, measure_id: str, name: str) -> str:
    return (f'<div class="gh-row"><span class="gh-row-no">{position:02d}</span><span class="gh-row-icon">{icon(MEASURE_ICON.get(measure_id, "leaf"), 17)}</span>'
            f'<span><div class="gh-row-title">{html.escape(name)}</div><div class="gh-row-sub">{html.escape(MEASURE_TAGLINE.get(measure_id, ""))}</div></span></div>')


# ------------------------------------------------------------------------------------------ charts

def style_fig(fig: go.Figure, height: int, legend: bool = True) -> go.Figure:
    """Apply the dashboard theme to a Plotly figure."""
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    template = "plotly_dark" if is_dark else "plotly_white"
    font_color = "#F8FAFC" if is_dark else THEME["ink"]
    grid_color = "#1F2937" if is_dark else THEME["grid"]
    border_color = "#374151" if is_dark else THEME["border"]

    fig.update_layout(
        template=template, height=height, margin=dict(l=14, r=14, t=28, b=14), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color=font_color, size=12, family="Plus Jakarta Sans, sans-serif"), showlegend=legend,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0, title_text="", font=dict(size=11, color=font_color)), bargap=0.28)
    fig.update_xaxes(gridcolor=grid_color, zerolinecolor=border_color, linecolor=border_color, tickfont=dict(size=11, color=font_color))
    fig.update_yaxes(gridcolor=grid_color, zerolinecolor=border_color, linecolor=border_color, tickfont=dict(size=11, color=font_color))
    return fig


def contribution_chart(score: ScoreResult) -> go.Figure:
    """Horizontal bars of w_k * s_k with ghost bars of w_k * 100 (I.9)."""
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    ghost_color = "#1F2937" if is_dark else THEME["grid"]
    names = [COMPONENT_LABELS[c.name] for c in score.components][::-1]
    values = [c.contribution for c in score.components][::-1]
    ghosts = [c.weight * 100 for c in score.components][::-1]
    tags = ["" if c.input_provenance in ("measured", "user_provided") else f" ({c.input_provenance})" for c in score.components][::-1]
    fig = go.Figure()
    fig.add_bar(y=names, x=ghosts, orientation="h", marker_color=ghost_color, name="Maximum possible", hoverinfo="skip")
    fig.add_bar(y=names, x=values, orientation="h", marker_color=THEME["green"], name="Contribution",
                text=[f"{F.fmt_points(v)}{t}" for v, t in zip(values, tags)], textposition="outside", cliponaxis=False)
    style_fig(fig, 340)
    fig.update_layout(barmode="overlay", xaxis_title="Points", bargap=0.35)
    fig.update_yaxes(showgrid=False)
    return fig


def fuel_chart(package: PackageResult, after_label: str = "After package") -> go.Figure:
    """Grouped bars, baseline vs after, per fuel. An increase is visible as a taller 'after' bar."""
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    current_color = "#475569" if is_dark else THEME["neutral"]
    fuels = ["Electricity (grid import)", "Gas"]
    before = [package.baseline.elec_import_kwh, package.baseline.gas_kwh]
    after = [package.after.elec_import_kwh, package.after.gas_kwh]
    fig = go.Figure()
    fig.add_bar(x=fuels, y=before, name="Current", marker_color=current_color, text=[F.fmt_kwh(v) for v in before], textposition="outside", cliponaxis=False)
    fig.add_bar(x=fuels, y=after, name=f"{after_label} (estimate)", marker_color=[FUEL_COLOURS["electricity"], FUEL_COLOURS["gas"]],
                text=[F.fmt_kwh(v) for v in after], textposition="outside", cliponaxis=False)
    style_fig(fig, 340)
    fig.update_layout(barmode="group", yaxis_title="kWh per year")
    fig.update_xaxes(showgrid=False)
    return fig


# ------------------------------------------------------------------------------------------ panels

def package_metrics(package: PackageResult, carbon: Any, improvement_pct: Optional[float]) -> None:
    if package.saving is None:
        st.warning(f"Savings are not available: {package.reason or 'no valid energy baseline'}. No numbers are invented.")
        return
    s = package.saving
    c1, c2 = st.columns(2)
    c1.metric("Gas saving (estimate)", F.fmt_signed_kwh(s.gas_kwh), help="Saving = current minus after, per year. Negative = increase.")
    c2.metric("Electricity saving (estimate)", F.fmt_signed_kwh(s.elec_import_kwh), help="Grid imports per year. Negative = increase.")
    c3, c4 = st.columns(2)
    c3.metric("Net purchased-energy saving (estimate)", F.fmt_signed_kwh(s.net_purchased_kwh),
              help=f"Range {F.fmt_kwh(package.range.get('net_purchased_low'))} to {F.fmt_kwh(package.range.get('net_purchased_high'))}")
    if carbon.status == "ok":
        word = "increase" if carbon.reduction_kg < 0 else "reduction"
        c4.metric(f"Carbon {word} (estimate)", F.fmt_tco2e(carbon.reduction_kg),
                  help=f"Factor set {carbon.factor_set}; electricity and gas counted separately")
    else:
        c4.metric("Carbon change", "not available", help=carbon.reason)
    if improvement_pct is not None:
        st.caption(f"Share of current purchased energy saved: {F.fmt_pct(improvement_pct)} (estimate, per year, current usage pattern). "
                   "A negative saving means an increase.")


def _chip(label: str, value: str, extra: str = "") -> str:
    return f'<span class="gh-chip {extra}"><b>{html.escape(label)}</b>{html.escape(value)}</span>'


def recommendation_card(item: RecommendationItem) -> None:
    """One recommended measure: step number, suitability pill, reason, per-fuel saving chips, cost, caveats."""
    inc, alone = item.incremental_saving, item.standalone_saving
    head = f'<span class="gh-card-title">{html.escape(item.name)}</span>{pill(item.suitability + " suitability", SUITABILITY_TONE[item.suitability])}'
    if item.optional:
        head += pill("optional", "neutral")
    chips = (_chip("Gas saving", F.fmt_signed_kwh(inc.gas_kwh), "gh-up" if inc.gas_kwh < 0 else "")
             + _chip("Electricity saving", F.fmt_signed_kwh(inc.elec_import_kwh), "gh-up" if inc.elec_import_kwh < 0 else "")
             + _chip("Carbon", F.fmt_carbon_change(item.carbon_saving_kg["incremental"]))
             + _chip("Indicative cost (unverified)", F.fmt_cost_range(item.cost_range_gbp["low"], item.cost_range_gbp["high"]), "gh-quiet"))
    notes = [f"Savings are estimates per year, in the package sequence. On its own this measure would save gas {F.fmt_signed_kwh(alone.gas_kwh)} "
             f"and electricity {F.fmt_signed_kwh(alone.elec_import_kwh)}; package figures differ because measures interact."]
    notes += list(item.caveats)
    st.markdown(
        f'<div class="gh-card"><div class="gh-step">{item.sequence_position:02d}</div><div class="gh-card-body">'
        f'<div class="gh-card-head">{head}</div><div class="gh-reason">{html.escape(item.reason.text)}</div>'
        f'<div class="gh-chips">{chips}</div><div class="gh-small">{"<br/>".join(html.escape(n) for n in notes)}</div></div></div>',
        unsafe_allow_html=True)


def value_panel(value: Any) -> None:
    st.subheader("Indicative property-value impact")
    with card("value"):
        if value.status == "ok":
            st.metric("Indicative potential value impact", F.fmt_uplift_range(value.uplift_pct_low, value.uplift_pct_high),
                      help="10th to 90th percentile across bootstrap replicates, model specifications and the projected band interval")
            st.write(f"Indicative value range: **{F.fmt_gbp_range(value.value_low, value.value_high)}** "
                     f"(current estimate {F.fmt_gbp(value.baseline_value)}, source: {value.value_source}). Not guaranteed.")
        elif value.status == "percent_only":
            st.metric("Indicative potential value impact", F.fmt_uplift_range(value.uplift_pct_low, value.uplift_pct_high))
            st.write("No current value estimate is recorded, so only percentages are shown.")
        elif value.status == "no_band_change":
            st.write("No rating band change is predicted, so no rating-related value change is estimated (0%).")
        else:
            st.warning(f"Value impact is not available: {value.reason or value.status}.")
        if value.band_before and value.band_after:
            tag = " (est.)" if value.band_before_provenance == "estimated" else ""
            st.caption(f"Rating band now: {value.band_before}{tag}. Projected band: {value.band_after} "
                       f"(interval: {', '.join(value.band_after_interval)}).")
        st.caption(value.method_note)


def explanation_panel(expl: Optional[Explanation]) -> None:
    if expl is None:
        return
    with card("explanation"):
        if expl.source == "template":
            st.caption(":material/description: Explanation generated from template (validator passed: "
                       f"{'yes' if expl.validation.get('ok') else 'no'})")
        else:
            st.caption(f":material/smart_toy: Explanation written by {expl.model}; validator passed, every number checked against the fact sheet")
        st.write(expl.summary)
        for title, items in (("", expl.points), ("Limitations", expl.limitations), ("Next steps", expl.next_steps)):
            if items and title:
                st.markdown(f"**{title}**")
            for item in items:
                cites = " ".join(f"`{f}`" for f in item.fact_ids)
                st.markdown(f"- {item.text} {cites}")


def chip_row(label: str, values: list[str], colour: str) -> None:
    theme = st.session_state.get("theme", "light")
    is_dark = theme == "dark"
    label_color = "#F8FAFC" if is_dark else "#18201B"
    tone = {"red": "bad", "orange": "warn", "blue": "info", "violet": "neutral"}.get(colour, "neutral")
    if values:
        st.markdown(f'<span class="gh-small" style="color:{label_color}">{html.escape(label)}:</span> '
                    + " ".join(pill(v.replace("_", " "), tone) for v in values), unsafe_allow_html=True)
