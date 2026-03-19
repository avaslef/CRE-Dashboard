from __future__ import annotations

import pandas as pd
import plotly.express as px
import streamlit as st

from config import MARKET_TIERS, COLORS, PLOTLY_TEMPLATE
from helpers import (
    fetch_fred_latest,
    fig_download_btn,
    load_css, render_sidebar, render_footer,
    FRED_KEY,
)

load_css()
render_sidebar()

# ── PAGE ─────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-header"><h1>🗺️ Interactive CRE Market Map</h1></div>',
            unsafe_allow_html=True)
st.markdown(
    "Geographic distribution of tracked markets by tier. "
    "Zoom into the Research Triangle for detailed local context."
)

try:
    import folium
    from streamlit_folium import st_folium
    _HAS_FOLIUM = True
except ImportError:
    _HAS_FOLIUM = False

if not _HAS_FOLIUM:
    st.warning(
        "Map requires `folium` and `streamlit-folium`. "
        "Install with: `pip install folium streamlit-folium`"
    )
    st.info("Showing Plotly geo fallback instead.")

    rows = []
    for tier_name, tier_data in MARKET_TIERS.items():
        for m in tier_data["markets"]:
            unemp = fetch_fred_latest(m["fred_unemp"]) if FRED_KEY else None
            rows.append({
                "Market": m["name"], "Tier": tier_name,
                "Lat": m["lat"], "Lon": m["lon"],
                "Unemp": unemp,
            })
    df_map = pd.DataFrame(rows)
    tier_colors = {
        "Gateway":           COLORS["gateway"],
        "Tier 1":            COLORS["tier1"],
        "Tier 2 / Emerging": COLORS["tier2"],
    }
    fig = px.scatter_geo(
        df_map, lat="Lat", lon="Lon",
        text="Market", color="Tier",
        color_discrete_map=tier_colors,
        hover_name="Market",
        hover_data={"Unemp": ":.1f", "Tier": True, "Lat": False, "Lon": False},
        scope="usa",
        title="U.S. CRE Markets by Tier",
        template=PLOTLY_TEMPLATE,
    )
    fig.update_traces(marker_size=12, textposition="top center")
    fig.update_layout(height=550, margin=dict(l=0, r=0, t=40, b=0))
    st.plotly_chart(fig, use_container_width=True)
    fig_download_btn(fig, "cre_market_map.png")
    st.stop()

# ── Full Folium Map ────────────────────────────────────────────────────────
col_map, col_ctrl = st.columns([3, 1])

with col_ctrl:
    default_zoom = st.selectbox("Default zoom", ["National", "Triangle NC", "Custom"])
    show_tiers   = st.multiselect("Show tiers",
                                  list(MARKET_TIERS.keys()),
                                  default=list(MARKET_TIERS.keys()))
    show_unemp   = st.checkbox("Show unemployment in popup", value=True)

if default_zoom == "Triangle NC":
    center, zoom = [35.85, -79.0], 9
else:
    center, zoom = [38.0, -96.0], 4

m = folium.Map(location=center, zoom_start=zoom, tiles="CartoDB dark_matter")

tier_icon_colors = {
    "Gateway":           "red",
    "Tier 1":            "orange",
    "Tier 2 / Emerging": "green",
}

for tier_name, tier_data in MARKET_TIERS.items():
    if tier_name not in show_tiers:
        continue
    icon_color = tier_icon_colors.get(tier_name, "blue")
    for mkt in tier_data["markets"]:
        unemp = fetch_fred_latest(mkt["fred_unemp"]) if (FRED_KEY and show_unemp) else None
        unemp_str = f"<b>Unemployment:</b> {unemp:.1f}%" if unemp else ""
        highlight = " ⭐ (Triangle Focus)" if mkt.get("highlight") else ""
        popup_html = f"""
<div style="font-family:sans-serif;min-width:180px">
  <b style="font-size:14px">{mkt['name']}{highlight}</b><br>
  <span style="color:gray">{tier_name}</span><br>
  {unemp_str}<br>
  <small>MSA: {mkt['msa']}</small>
</div>"""
        icon_name = "star" if mkt.get("highlight") else "home"
        folium.Marker(
            location=[mkt["lat"], mkt["lon"]],
            popup=folium.Popup(popup_html, max_width=250),
            tooltip=mkt["name"],
            icon=folium.Icon(color=icon_color, icon=icon_name, prefix="fa"),
        ).add_to(m)

if "Tier 2 / Emerging" in show_tiers:
    triangle_coords = [
        [35.7796, -78.6382],
        [35.9940, -78.8986],
        [35.9132, -79.0558],
    ]
    folium.Polygon(
        locations=triangle_coords,
        color="#8e44ad", weight=2, fill=True, fill_opacity=0.1,
        tooltip="Research Triangle",
    ).add_to(m)

legend_html = """
<div style="position:fixed;bottom:30px;left:30px;z-index:9999;background:rgba(0,0,0,0.8);
     padding:12px;border-radius:8px;font-family:sans-serif;color:white;font-size:13px">
  <b>Market Tiers</b><br>
  <span style="color:#e74c3c">●</span> Gateway<br>
  <span style="color:#f39c12">●</span> Tier 1<br>
  <span style="color:#2ecc71">●</span> Tier 2 / Emerging<br>
  <span style="color:#8e44ad">⭐</span> Triangle NC
</div>"""
m.get_root().html.add_child(folium.Element(legend_html))

with col_map:
    st_folium(m, width=900, height=550)

render_footer()
