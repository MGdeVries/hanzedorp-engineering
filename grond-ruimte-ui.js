/* =====================================================================
   grond-ruimte-ui.js – ruimteprogramma per doel (window.GRU)
   Vereist: hanzedorp-data.js (HZ_RUIMTE), hanzedorp-lib.js (HZ)
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, nl = HZ.nl;
  const CATS = ["Wonen – bebouwd", "Wonen – tuin", "Wonen – erfverharding", "Maatschappelijk", "Nuts en bedrijf", "Verkeer", "Groen", "Water", "Agrarisch"];
  const KLEUR = { "Wonen – bebouwd": "#8B5A3C", "Wonen – tuin": "#9DB57A", "Wonen – erfverharding": "#B9B2A3", "Maatschappelijk": "#C98A3A", "Nuts en bedrijf": "#6E6E6E",
    "Verkeer": "#4A4A4A", "Groen": "var(--sage)", "Water": "var(--water)", "Agrarisch": "var(--gold)" };
  const PILL = { keuze: "s-besloten", gevolg: "s-onderzocht", norm: "s-aanname" };
  const pct = v => nl(v * 100, v < 0.1 ? 1 : 0) + " %";

  function tabel(tb, R, R0, technisch) {
    const ref = id => (R0.items.find(x => x.id === id) || { m2: 0 }).m2;
    let h = "";
    CATS.forEach(cat => {
      const rows = R.items.filter(x => x.cat === cat); if (!rows.length) return;
      const sub = rows.reduce((a, x) => a + x.m2, 0), sub0 = R0.items.filter(x => x.cat === cat).reduce((a, x) => a + x.m2, 0);
      h += `<tr class="cat"><td colspan="${technisch ? 7 : 6}"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${KLEUR[cat]};margin-right:6px"></span><b>${cat}</b></td></tr>`;
      rows.forEach(x => { const d = x.m2 - ref(x.id);
        h += `<tr><td>${x.naam}${technisch && x.uitleg ? `<br><span class="note">${x.uitleg}</span>` : ""}</td><td>${x.eig}</td><td><span class="pill ${PILL[x.soort]}">${x.soort}</span></td><td class="num">${nl(x.m2)}</td>` +
          `<td class="num"${d ? ' style="color:var(--warn)"' : ""}>${d ? (d > 0 ? "+" : "−") + nl(Math.abs(d)) : ""}</td>${technisch ? `<td>${x.st}</td>` : ""}<td class="num">${pct(x.m2 / R.kpi.totaal)}</td></tr>`; });
      const ds = sub - sub0;
      h += `<tr style="font-weight:600"><td>Subtotaal ${cat.toLowerCase()}</td><td></td><td></td><td class="num">${nl(sub)}</td><td class="num"${ds ? ' style="color:var(--warn)"' : ""}>${ds ? (ds > 0 ? "+" : "−") + nl(Math.abs(ds)) : ""}</td>${technisch ? "<td></td>" : ""}<td class="num">${pct(sub / R.kpi.totaal)}</td></tr>`;
    });
    const dt = R.kpi.totaal - R0.kpi.totaal;
    h += `<tr style="font-weight:700;border-top:2px solid var(--fg)"><td>Plangebied totaal</td><td></td><td></td><td class="num">${nl(R.kpi.totaal)}</td><td class="num"${dt ? ' style="color:var(--warn)"' : ""}>${dt ? (dt > 0 ? "+" : "−") + nl(Math.abs(dt)) : ""}</td>${technisch ? "<td></td>" : ""}<td class="num">${nl(R.kpi.ha, 2)} ha</td></tr>`;
    tb.innerHTML = h;
  }
  function balk(el, R) {
    const W = 600, H = 46; let x = 0, s = `<svg viewBox="0 0 ${W} ${H + 18}" width="100%" role="img" aria-label="Verdeling van het plangebied per functie">`;
    CATS.forEach(cat => { const m = R.items.filter(i => i.cat === cat).reduce((a, i) => a + i.m2, 0); if (!m) return; const w = W * m / R.kpi.totaal;
      s += `<rect x="${x}" y="0" width="${Math.max(0, w - 1)}" height="${H}" style="fill:${KLEUR[cat]}"><title>${cat}: ${nl(m)} m² (${pct(m / R.kpi.totaal)})</title></rect>`;
      if (w > 34) s += `<text x="${x + w / 2}" y="${H + 13}" text-anchor="middle" class="sm">${pct(m / R.kpi.totaal)}</text>`; x += w; });
    el.innerHTML = s + "</svg>" + `<p class="note" style="margin:4px 0 0">${CATS.map(c => `<span style="white-space:nowrap"><span style="color:${KLEUR[c]}">■</span> ${c}</span>`).join(" &nbsp; ")}</p>`;
  }
  function kavels(tb, R) {
    tb.innerHTML = R.kavelTabel.filter(k => k.n).map(k => `<tr><td>${k.n} × ${k.naam}</td><td class="num">${nl(k.kavel)}</td><td class="num">${nl(k.woning)}</td><td class="num">${nl(k.groendak)}</td><td class="num">${nl(k.pvdak)}</td><td class="num">${nl(k.tuin)}</td><td class="num">${nl(k.erf)}</td><td class="num">${pct(k.gsi)}</td></tr>`).join("");
  }
  function lijst(tb, rows) { tb.innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td class="num">${nl(Math.round(r[1]))}</td><td>${r[2]}</td><td>${r[3] || ""}</td></tr>`).join(""); }
  function kpis(el, R) {
    const k = R.kpi;
    el.innerHTML = [[nl(k.ha, 2) + " ha", "plangebied (bruto)"], [pct(k.uitgeefbaar), "uitgeefbaar (privékavels)"], [pct(k.mandelig), "gezamenlijk (mandelig)"],
      [nl(k.dichtheid, 1) + " /ha", "woningdichtheid bruto"], [nl(k.dichtheidZonderAkker, 1) + " /ha", "woningdichtheid zonder akker/weiland"],
      [pct(k.gsi), "bebouwd (incl. carport)"], [pct(k.verhardPct), "verhard (daken, wegen, erven)"], [pct(k.groenWater), "groen en water"], [nl(k.perWoning) + " m²", "grond per woning (bruto)"]]
      .map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join("");
  }
  window.GRU = { tabel, balk, kavels, lijst, kpis, CATS };
})();
