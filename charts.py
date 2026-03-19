# charts.py — Reusable Plotly chart builders (polished edition)
# -------------------------------------------------------------
from __future__ import annotations
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from config import COLORS

# ── UNC Carolina Blue color scheme ────────────────────────────────────────────
CAROLINA_BLUE = "#4B9CD3"
CAROLINA_NAVY = "#13294B"
CAROLINA_WHITE = "#FFFFFF"

# ── Shared layout defaults ────────────────────────────────────────────────────
_FONT = dict(family="Inter, Segoe UI, Roboto, sans-serif", color="#c8d0dc")
_TITLE_FONT = dict(family="Inter, Segoe UI, Roboto, sans-serif",
                    size=15, color="#4B9CD3")  # Carolina Blue chart titles
_AXIS_COMMON = dict(
    gridcolor="rgba(75,156,211,0.08)",
    zerolinecolor="rgba(75,156,211,0.12)",
    tickfont=dict(size=11, color="#7BAFD4"),   # light Carolina Blue axis ticks
    title_font=dict(size=12, color="#7BAFD4"),  # light Carolina Blue axis titles
)
_LEGEND = dict(
    orientation="h",
    yanchor="top",
    y=-0.28,          # pushed well below x-axis label so nothing overlaps
    xanchor="center",
    x=0.5,
    font=dict(size=11, color="#e2e8f0"),
    bgcolor="rgba(0,0,0,0)",
    itemwidth=40,
    tracegroupgap=16,
    itemsizing="constant",
    valign="middle",
)
_MARGIN = dict(l=48, r=16, t=56, b=120)  # tall bottom margin for legend + axis label
_BG = "rgba(0,0,0,0)"
_PAPER = "rgba(0,0,0,0)"

# UNC-themed palette: Carolina Blue first, then complementary colors
PALETTE = [CAROLINA_BLUE, "#34d399", "#fbbf24", "#f87171", "#a78bfa",
           "#fb923c", "#2dd4bf", "#e879f9", "#38bdf8", "#4ade80"]


def _base_layout(title: str, ylabel: str = "", height: int = 400) -> dict:
    """Return a standard layout dict for all charts."""
    return dict(
        title=dict(text=title, font=_TITLE_FONT, x=0, xanchor="left", pad=dict(l=4)),
        font=_FONT,
        paper_bgcolor=_PAPER,
        plot_bgcolor=_BG,
        xaxis=dict(**_AXIS_COMMON),
        yaxis=dict(title=ylabel, **_AXIS_COMMON),
        legend=_LEGEND,
        margin=_MARGIN,
        height=height,
        hovermode="x unified",
        hoverlabel=dict(bgcolor="#1e293b", bordercolor="#334155",
                        font=dict(size=12, color="#e2e8f0")),
    )


# ── Line Chart ────────────────────────────────────────────────────────────────
def line_chart(
    df: pd.DataFrame,
    x: str,
    y: str | list,
    title: str,
    ylabel: str = "",
    color_map: dict = None,
    height: int = 400,
) -> go.Figure:
    fig = go.Figure()
    if isinstance(y, list):
        for i, col in enumerate(y):
            if col in df.columns:
                color = (color_map or {}).get(col, PALETTE[i % len(PALETTE)])
                fig.add_trace(go.Scatter(
                    x=df[x], y=df[col], name=col, mode="lines",
                    line=dict(width=2.2, color=color),
                    hovertemplate="%{y:.2f}<extra></extra>",
                ))
    else:
        color = PALETTE[0]
        fig.add_trace(go.Scatter(
            x=df[x], y=df[y], name=y, mode="lines",
            line=dict(width=2.2, color=color),
            hovertemplate="%{y:.2f}<extra></extra>",
        ))
    fig.update_layout(**_base_layout(title, ylabel, height))
    return fig


# ── Bar Chart ─────────────────────────────────────────────────────────────────
def bar_chart(
    df: pd.DataFrame,
    x: str,
    y: str,
    title: str,
    color: str = None,
    color_discrete_map: dict = None,
    orientation: str = "v",
    height: int = 420,
) -> go.Figure:
    kwargs = dict(x=x, y=y, title=title, orientation=orientation)
    if color:
        kwargs["color"] = color
    if color_discrete_map:
        kwargs["color_discrete_map"] = color_discrete_map
    fig = px.bar(df, **kwargs)
    fig.update_layout(**_base_layout(title, height=height))
    fig.update_traces(marker_line_width=0, opacity=0.92)
    if not color:
        fig.update_traces(marker_color=PALETTE[0])
    return fig


# ── Scatter Chart ─────────────────────────────────────────────────────────────
def scatter_chart(
    df: pd.DataFrame,
    x: str,
    y: str,
    title: str,
    color: str = None,
    size: str = None,
    hover_name: str = None,
    text: str = None,
    height: int = 420,
) -> go.Figure:
    fig = px.scatter(
        df, x=x, y=y, title=title,
        color=color, size=size, hover_name=hover_name, text=text,
    )
    fig.update_traces(textposition="top center")
    fig.update_layout(**_base_layout(title, height=height))
    return fig


# ── Area Chart ────────────────────────────────────────────────────────────────
def area_chart(df: pd.DataFrame, x: str, y: list, title: str,
               ylabel: str = "", height: int = 400) -> go.Figure:
    fig = go.Figure()
    for i, col in enumerate(y):
        if col in df.columns:
            fig.add_trace(go.Scatter(
                x=df[x], y=df[col], name=col,
                mode="lines", fill="tozeroy" if i == 0 else "tonexty",
                line=dict(width=1.5, color=PALETTE[i % len(PALETTE)]),
                opacity=0.75,
                hovertemplate="%{y:,.1f}<extra></extra>",
            ))
    fig.update_layout(**_base_layout(title, ylabel, height))
    return fig


# ── Gauge Chart ───────────────────────────────────────────────────────────────
def gauge_chart(value: float, title: str, min_val: float = 0, max_val: float = 10,
                thresholds: list = None) -> go.Figure:
    thresholds = thresholds or [max_val * 0.33, max_val * 0.66]
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value,
        title={"text": title, "font": {"size": 13, "color": "#8899aa"}},
        number={"font": {"size": 28, "color": "#e2e8f0"}},
        gauge={
            "axis": {"range": [min_val, max_val], "tickfont": {"size": 10, "color": "#667"}},
            "bar":  {"color": PALETTE[0]},
            "bgcolor": "#1a2035",
            "borderwidth": 0,
            "steps": [
                {"range": [min_val, thresholds[0]],  "color": "rgba(46,204,113,0.2)"},
                {"range": [thresholds[0], thresholds[1]], "color": "rgba(243,156,18,0.2)"},
                {"range": [thresholds[1], max_val],  "color": "rgba(231,76,60,0.2)"},
            ],
        },
    ))
    fig.update_layout(
        paper_bgcolor=_PAPER, plot_bgcolor=_BG,
        font=_FONT, height=200,
        margin=dict(l=16, r=16, t=36, b=8),
    )
    return fig


# ── Waterfall Chart ───────────────────────────────────────────────────────────
def waterfall_chart(categories: list, values: list, title: str) -> go.Figure:
    fig = go.Figure(go.Waterfall(
        x=categories, y=values,
        connector={"line": {"color": "rgba(255,255,255,0.15)"}},
        decreasing={"marker": {"color": "#f87171"}},
        increasing={"marker": {"color": "#34d399"}},
        totals={"marker": {"color": "#60a5fa"}},
    ))
    fig.update_layout(**_base_layout(title))
    return fig


# ── Heatmap Chart ─────────────────────────────────────────────────────────────
def heatmap_chart(df: pd.DataFrame, title: str) -> go.Figure:
    fig = px.imshow(
        df, title=title, color_continuous_scale="RdYlGn_r", aspect="auto",
    )
    fig.update_layout(**_base_layout(title))
    return fig


# ── Box Plot ──────────────────────────────────────────────────────────────────
def box_chart(df_long: pd.DataFrame, x: str, y: str, color: str,
              title: str, height: int = 420) -> go.Figure:
    fig = px.box(df_long, x=x, y=y, color=color, title=title)
    fig.update_layout(**_base_layout(title, height=height))
    return fig
