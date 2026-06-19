"""
Widget interactif des 4 rotations AVL, construit avec de vraies dates
issues de df_readings (format YYYY-MM-DD), affiché inline dans Jupyter.

Mémoire — Sujet 2, Partie I, section 1.3 — L'équilibrage AVL

Usage dans le notebook :
    from avl_widget import show_avl_rotations
    show_avl_rotations(df_readings)
"""

import math
from IPython.display import HTML, display
import pandas as pd

R = 34  # rayon des cercles (assez grand pour contenir "2023-09-01")


def _choisir_trois_dates(df_readings, colonne="timestamp_utc"):
    """
    Sélectionne 3 timestamps réels de df_readings, suffisamment espacés
    pour rester visuellement distincts une fois tronqués au jour
    (format YYYY-MM-DD), et les retourne triés du plus ancien au plus récent.
    """
    df_trie = df_readings.sort_values(colonne).reset_index(drop=True)
    n = len(df_trie)
    indices_espaces = sorted([0, n // 3, (2 * n) // 3])
    dates = sorted(df_trie.loc[indices_espaces, colonne].tolist())
    return [d.strftime("%Y-%m-%d") for d in dates]


def _noeud(cx, cy, classe, texte):
    return (
        f'<g class="{classe}">'
        f'<circle cx="{cx}" cy="{cy}" r="{R}" stroke-width="0.5"/>'
        f'<text class="th" x="{cx}" y="{cy}" text-anchor="middle" dominant-baseline="central">{texte}</text>'
        f"</g>"
    )


def _arete(x1, y1, x2, y2):
    """Arête parent-enfant, tracée de bord de cercle à bord de cercle."""
    dx, dy = x2 - x1, y2 - y1
    dist = math.hypot(dx, dy)
    ux, uy = dx / dist, dy / dist
    return (
        f'<line x1="{x1 + ux * R:.1f}" y1="{y1 + uy * R:.1f}" '
        f'x2="{x2 - ux * R:.1f}" y2="{y2 - uy * R:.1f}" '
        f'stroke="#888780" stroke-width="0.5"/>'
    )


def _fleche(x1, x2, y, marker_id, label, label_dy=-14):
    """Flèche horizontale de transition, avec son libellé au-dessus."""
    xm = (x1 + x2) / 2
    return (
        f'<text class="ts" x="{xm}" y="{y + label_dy}" text-anchor="middle">{label}</text>'
        f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#888780" '
        f'stroke-width="0.5" marker-end="url(#{marker_id})"/>'
    )


def _construire_html(date_x, date_y, date_z):
    """
    Reproduit le widget (boutons + 4 panneaux SVG), en remplaçant
    les lettres abstraites x, y, z par les trois dates réelles fournies.

    Convention : x < y < z (ordre chronologique), soit l'ordre
    d'insertion croissant naturel d'un système IoT.
    """

    # --- Panneau LL (rotation simple à droite) ----------------------------
    ll = f"""
<svg width="100%" viewBox="0 0 760 320" role="img">
<title>Rotation simple, cas gauche-gauche</title>
<desc>Insertion dans l'ordre chronologique décroissant {date_z}, {date_y}, {date_x}</desc>
<defs><marker id="arrow-ll" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
{_arete(150, 70, 110, 155)}
{_arete(110, 155, 70, 240)}
{_noeud(150, 70, "c-red", date_z)}
{_noeud(110, 155, "c-gray", date_y)}
{_noeud(70, 240, "c-gray", date_x)}
<text class="ts" x="110" y="295" text-anchor="middle">Cas gauche-gauche</text>
{_fleche(250, 470, 155, "arrow-ll", "Rotation simple")}
{_arete(610, 70, 560, 155)}
{_arete(610, 70, 660, 155)}
{_noeud(610, 70, "c-teal", date_y)}
{_noeud(560, 155, "c-gray", date_x)}
{_noeud(660, 155, "c-gray", date_z)}
<text class="ts" x="610" y="295" text-anchor="middle">Équilibre restauré</text>
</svg>"""

    # --- Panneau RR (rotation simple à gauche) ----------------------------
    rr = f"""
<svg width="100%" viewBox="0 0 760 320" role="img">
<title>Rotation simple, cas droite-droite</title>
<desc>Insertion dans l'ordre chronologique croissant {date_x}, {date_y}, {date_z}</desc>
<defs><marker id="arrow-rr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
{_arete(70, 70, 110, 155)}
{_arete(110, 155, 150, 240)}
{_noeud(70, 70, "c-red", date_x)}
{_noeud(110, 155, "c-gray", date_y)}
{_noeud(150, 240, "c-gray", date_z)}
<text class="ts" x="110" y="295" text-anchor="middle">Cas droite-droite</text>
{_fleche(250, 470, 155, "arrow-rr", "Rotation simple")}
{_arete(610, 70, 560, 155)}
{_arete(610, 70, 660, 155)}
{_noeud(610, 70, "c-teal", date_y)}
{_noeud(560, 155, "c-gray", date_x)}
{_noeud(660, 155, "c-gray", date_z)}
<text class="ts" x="610" y="295" text-anchor="middle">Équilibre restauré</text>
</svg>"""

    # --- Panneau LR (rotation double gauche-droite) -----------------------
    lr = f"""
<svg width="100%" viewBox="0 0 1040 320" role="img">
<title>Rotation double, cas gauche-droite</title>
<desc>Insertion {date_z}, {date_x}, {date_y}</desc>
<defs><marker id="arrow-lr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
{_arete(100, 70, 60, 155)}
{_arete(60, 155, 100, 240)}
{_noeud(100, 70, "c-red", date_z)}
{_noeud(60, 155, "c-gray", date_x)}
{_noeud(100, 240, "c-amber", date_y)}
<text class="ts" x="80" y="295" text-anchor="middle">Cas gauche-droite</text>
{_fleche(200, 380, 155, "arrow-lr", "1. Rotation sur x")}
{_arete(480, 70, 440, 155)}
{_arete(440, 155, 400, 240)}
{_noeud(480, 70, "c-red", date_z)}
{_noeud(440, 155, "c-amber", date_y)}
{_noeud(400, 240, "c-gray", date_x)}
<text class="ts" x="440" y="295" text-anchor="middle">Étape intermédiaire</text>
{_fleche(560, 740, 155, "arrow-lr", "2. Rotation sur z")}
{_arete(880, 70, 830, 155)}
{_arete(880, 70, 930, 155)}
{_noeud(880, 70, "c-teal", date_y)}
{_noeud(830, 155, "c-gray", date_x)}
{_noeud(930, 155, "c-gray", date_z)}
<text class="ts" x="880" y="295" text-anchor="middle">Équilibre restauré</text>
</svg>"""

    # --- Panneau RL (rotation double droite-gauche) -----------------------
    rl = f"""
<svg width="100%" viewBox="0 0 1040 320" role="img">
<title>Rotation double, cas droite-gauche</title>
<desc>Insertion {date_x}, {date_z}, {date_y}</desc>
<defs><marker id="arrow-rl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#888780" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
{_arete(60, 70, 100, 155)}
{_arete(100, 155, 60, 240)}
{_noeud(60, 70, "c-red", date_x)}
{_noeud(100, 155, "c-gray", date_z)}
{_noeud(60, 240, "c-amber", date_y)}
<text class="ts" x="80" y="295" text-anchor="middle">Cas droite-gauche</text>
{_fleche(200, 380, 155, "arrow-rl", "1. Rotation sur z")}
{_arete(400, 70, 440, 155)}
{_arete(440, 155, 480, 240)}
{_noeud(400, 70, "c-red", date_x)}
{_noeud(440, 155, "c-amber", date_y)}
{_noeud(480, 240, "c-gray", date_z)}
<text class="ts" x="440" y="295" text-anchor="middle">Étape intermédiaire</text>
{_fleche(560, 740, 155, "arrow-rl", "2. Rotation sur x")}
{_arete(880, 70, 830, 155)}
{_arete(880, 70, 930, 155)}
{_noeud(880, 70, "c-teal", date_y)}
{_noeud(830, 155, "c-gray", date_x)}
{_noeud(930, 155, "c-gray", date_z)}
<text class="ts" x="880" y="295" text-anchor="middle">Équilibre restauré</text>
</svg>"""

    return f"""
<div class="avl-widget">
<meta charset="utf-8">
<style>
  .avl-widget {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 1040px; }}
  .avl-widget .case-btn {{ padding: 8px 14px; border-radius: 10px; border: 1px solid #D3D1C7; background: transparent; color: #5F5E5A; font-size: 14px; cursor: pointer; margin: 0 8px 8px 0; }}
  .avl-widget .case-btn.active {{ background: #E6F1FB; color: #0C447C; border-color: transparent; }}
  .avl-widget .legend {{ font-size: 12px; color: #888780; margin: 0 0 16px; line-height: 1.5; }}
  .avl-widget .ts {{ font-size: 12px; fill: #5F5E5A; }}
  .avl-widget .th {{ font-size: 12px; font-weight: 600; }}
  .avl-widget .c-gray  circle {{ fill: #F1EFE8; stroke: #888780; }}
  .avl-widget .c-gray  text   {{ fill: #2C2C2A; }}
  .avl-widget .c-red   circle {{ fill: #FCEBEB; stroke: #A32D2D; }}
  .avl-widget .c-red   text   {{ fill: #501313; }}
  .avl-widget .c-teal  circle {{ fill: #E1F5EE; stroke: #0F6E56; }}
  .avl-widget .c-teal  text   {{ fill: #04342C; }}
  .avl-widget .c-amber circle {{ fill: #FAEEDA; stroke: #854F0B; }}
  .avl-widget .c-amber text   {{ fill: #412402; }}
  .avl-widget .panel {{ display: none; }}
  .avl-widget .panel.active {{ display: block; }}
</style>

<div>
  <button class="case-btn active" data-case="ll" onclick="avlSelectCase(this, 'll')">Gauche-Gauche</button>
  <button class="case-btn" data-case="rr" onclick="avlSelectCase(this, 'rr')">Droite-Droite</button>
  <button class="case-btn" data-case="lr" onclick="avlSelectCase(this, 'lr')">Gauche-Droite</button>
  <button class="case-btn" data-case="rl" onclick="avlSelectCase(this, 'rl')">Droite-Gauche</button>
</div>
<p class="legend">Trois relevés IoT réels — x = {date_x} (le plus ancien), y = {date_y}, z = {date_z} (le plus récent).<br>
Gauche-Gauche et Droite-Droite : rotation simple (1 étape). Gauche-Droite et Droite-Gauche : rotation double (2 étapes).</p>

<div id="avl-panels">
<div class="panel active" data-case="ll">{ll}</div>
<div class="panel" data-case="rr">{rr}</div>
<div class="panel" data-case="lr">{lr}</div>
<div class="panel" data-case="rl">{rl}</div>
</div>
</div>

<script>
function avlSelectCase(btn, name) {{
  var root = btn.closest('.avl-widget');
  root.querySelectorAll('.panel').forEach(function(p) {{
    p.classList.toggle('active', p.getAttribute('data-case') === name);
  }});
  root.querySelectorAll('.case-btn').forEach(function(b) {{
    b.classList.toggle('active', b.getAttribute('data-case') === name);
  }});
}}
</script>
"""


def show_avl_rotations(df_readings, colonne="timestamp_utc"):
    """
    Affiche le widget interactif des 4 cas de rotation AVL, construit à
    partir de 3 vrais timestamps de df_readings (format YYYY-MM-DD),
    dans la cellule Jupyter courante.
    """
    date_x, date_y, date_z = _choisir_trois_dates(df_readings, colonne)
    display(HTML(_construire_html(date_x, date_y, date_z)))


if __name__ == "__main__":
    dates_test = pd.date_range("2023-01-01", "2024-12-31", periods=1000)
    df_test = pd.DataFrame({"timestamp_utc": dates_test})
    show_avl_rotations(df_test)
