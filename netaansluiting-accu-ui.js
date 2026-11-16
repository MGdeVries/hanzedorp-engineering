/* =====================================================================
   netaansluiting-accu-ui.js – winterbijkoop en accugrootte (window.NAC)
   Vereist: hanzedorp-data.js, hanzedorp-lib.js (HZ), netaansluiting-accu.js (HANZEDORP_ACCU, gegenereerd door bouwaccu.js)
   ===================================================================== */
(function () {
  const A = window.HANZEDORP_ACCU, D = window.HANZEDORP_DATA, K = D.net.accuKeuze, nl = HZ.nl;
  const MND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const annuiteit = (r, n) => r / (1 - Math.pow(1 + r, -n));
  const eur = v => (v < 0 ? "− € " : "€ ") + nl(Math.round(Math.abs(v)));

  /* winter: dagopwek (wind + zon, gestapeld) tegen verbruik, bijkoop per dag als staven op de rechteras */
  function winterChart(el, wi, strat) {
    const W = A.winters[wi], n = W.dagen.length, Wd = 580, H = 260, L = 44, R = 46, T = 16, B = 30, pw = Wd - L - R, ph = H - T - B;
    const opw = W.dagen.map(d => (d[0] + d[1]) / 1000), maxL = Math.ceil(Math.max(...opw, ...W.dagen.map(d => d[2] / 1000)) / 0.5) * 0.5;
    const ki = strat === "dal" ? 3 : 4, maxR = Math.max(100, Math.ceil(Math.max(...A.winters.flatMap(w => w.dagen.map(d => Math.max(d[3], d[4])))) / 50) * 50) * 1.6;
    const x = i => L + pw * (i + 0.5) / n, yL = v => T + ph - ph * v / maxL, yR = v => T + ph - ph * v / maxR;
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Winter ${W.naam}: opwek en verbruik per dag en bijkoop uit het net">`;
    for (let i = 0; i <= 4; i++) { const v = maxL * i / 4, y = yL(v); s += `<line x1="${L}" x2="${Wd - R}" y1="${y}" y2="${y}" style="stroke:var(--grid)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" class="sm mono">${nl(v, 1)}</text><text x="${Wd - R + 6}" y="${yR(maxR * i / 4) + 4}" class="sm mono" style="fill:var(--warn)">${nl(maxR * i / 4)}</text>`; }
    s += `<text x="${L}" y="${T - 4}" class="sm">MWh per dag</text><text x="${Wd - R}" y="${T - 4}" text-anchor="end" class="sm" style="fill:var(--warn)">bijkoop kWh</text>`;
    const area = (f, g) => { let p = ""; for (let i = 0; i < n; i++) p += (i ? " L" : "M") + x(i) + "," + yL(f(i)); for (let i = n - 1; i >= 0; i--) p += " L" + x(i) + "," + yL(g(i)); return p + " Z"; };
    s += `<path d="${area(i => W.dagen[i][1] / 1000, () => 0)}" style="fill:var(--water);opacity:.45"/>`;
    s += `<path d="${area(i => (W.dagen[i][0] + W.dagen[i][1]) / 1000, i => W.dagen[i][1] / 1000)}" style="fill:var(--gold);opacity:.55"/>`;
    const bw = Math.max(1, pw / n - 0.6);
    W.dagen.forEach((d, i) => { if (d[ki] > 0.5) s += `<rect x="${x(i) - bw / 2}" y="${yR(d[ki])}" width="${bw}" height="${T + ph - yR(d[ki])}" style="fill:var(--warn)"><title>${dagNaam(W, i)}: ${nl(d[ki])} kWh bijgekocht</title></rect>`; });
    s += `<polyline points="${W.dagen.map((d, i) => x(i) + "," + yL(d[2] / 1000)).join(" ")}" style="fill:none;stroke:var(--ink);stroke-width:1.6"/>`;
    W.dagen.forEach((d, i) => { const t = datum(W, i); if (t.getUTCDate() === 1) s += `<line x1="${x(i)}" x2="${x(i)}" y1="${T + ph}" y2="${T + ph + 4}" style="stroke:var(--muted)"/><text x="${x(i) + 3}" y="${H - 10}" class="sm">${MND[t.getUTCMonth()]}</text>`; });
    W.dagen.forEach((d, i) => { s += `<rect x="${x(i) - pw / n / 2}" y="${T}" width="${pw / n}" height="${ph}" style="fill:transparent"><title>${dagNaam(W, i)}: zon ${nl(d[0] / 1000, 2)} MWh, wind ${nl(d[1] / 1000, 2)} MWh, verbruik ${nl(d[2] / 1000, 2)} MWh, bijkoop ${nl(d[ki])} kWh</title></rect>`; });
    el.innerHTML = s + "</svg>";
  }
  const datum = (W, i) => new Date(Date.parse(W.start + "T00:00:00Z") + i * 864e5);
  const dagNaam = (W, i) => { const t = datum(W, i); return t.getUTCDate() + " " + MND[t.getUTCMonth()] + " " + t.getUTCFullYear(); };

  function uurChart(el, wi) {
    const W = A.winters[wi];
    HZ.bars(el, { labels: Array.from({ length: 24 }, (_, h) => String(h)), labelEvery: 3, unit: "kWh per uur van de dag (hele winter)", height: 200,
      series: [{ name: "zonder voorspelling", values: W.reactief.uur, color: "var(--line)", unit: "kWh" }, { name: "gestuurd op dalprijs", values: W.dal.uur, color: "var(--warn)", unit: "kWh" }] });
  }

  function winterTabel(tb) {
    tb.innerHTML = A.winters.flatMap(W => [["Zonder voorspelling (accu terug naar de reserve)", W.reactief], ["Gestuurd: inkopen in de dalmomenten", W.dal]].map(([n, x], j) =>
      `<tr${j ? ' class="best"' : ""}><td>${j ? "" : "<b>" + W.naam + "</b>"}</td><td>${n}</td><td class="num">${nl(x.uren)}</td><td class="num">${nl(x.dagen)}</td><td class="num">${nl(x.imp / 1000, 1)}</td><td class="num">€ ${nl(x.gemPrijs, 3)}</td><td class="num">${eur(x.beurs)}</td><td class="num">${nl(x.nacht * 100)} %</td></tr>`)).join("");
  }

  /* accugrootte: eisen en kosten-baten t.o.v. de kleinste accu die aan de leveringseis voldoet */
  function rekenGrootte(prijs) {
    const af = annuiteit(K.rente, K.jaren), ok = A.groottes.filter(g => g.cap > 0 && g.reactief.tekU === 0 && g.dal.tekU === 0), basis = ok[0];
    return { basis, af, rijen: A.groottes.filter(g => g.cap > 0).map(g => {
      const bes = g.dal.nettoP - basis.dal.nettoP, kost = (g.cap - basis.cap) * prijs * af, krit = K.kritiekKW;
      return { g, bes, kost, saldo: bes - kost, eilandVol: g.cap * 0.9 / krit, eilandRes: g.cap * D.net.reserve * 0.9 / krit, cRate: Math.min(150, g.cap) / Math.max(1, g.cap) };
    }) };
  }
  function grootteTabel(tb, prijs, technisch) {
    const { basis, rijen } = rekenGrootte(prijs);
    tb.innerHTML = rijen.map(({ g, bes, kost, saldo, eilandVol, eilandRes, cRate }) => {
      const tek = s => s.tekU > 0 ? `<span style="color:var(--warn)">${nl(s.tekU, 1)} u/jr (${s.tekJaren} jr)</span>` : "0";
      const cls = g.cap === A.besluitKWh ? ' class="best"' : "";
      return `<tr${cls}><td>${nl(g.cap)} kWh${g.cap === A.besluitKWh ? " (huidig)" : ""}</td><td class="num">${tek(g.dal)}</td><td class="num">${tek(g.reactief)}</td><td class="num">${nl(g.dal.imp / 1000, 1)}</td><td class="num">${nl(g.dal.impU)}</td>` +
        (technisch ? `<td class="num">${nl(cRate, 2)}C</td><td class="num">${nl(g.dal.cycli)}</td>` : "") +
        `<td class="num">${nl(eilandVol)} / ${nl(eilandRes)} h</td><td class="num">${g.cap < basis.cap ? "–" : eur(bes)}</td><td class="num">${g.cap < basis.cap ? "–" : eur(kost)}</td><td class="num"${saldo < 0 && g.cap > basis.cap ? ' style="color:var(--warn)"' : ""}>${g.cap < basis.cap ? "–" : eur(saldo)}</td></tr>`;
    }).join("");
    return rekenGrootte(prijs);
  }
  function blokTabel(tb) {
    tb.innerHTML = A.blokken.map(b => `<tr${b.nb === 3 && b.kb === 150 ? ' class="best"' : ""}><td>${b.nb} × ${b.kb} kWh = ${nl(b.cap)} kWh</td><td class="num">${nl(b.restCap)} kWh / ${nl(b.restKW)} kW</td><td class="num">${b.tekU > 0 ? `<span style="color:var(--warn)">${nl(b.tekU, 1)} u/jr in ${b.tekJaren} van ${A.jaren} jaar (max. ${nl(b.tekMax)} kW)</span>` : "0"}</td></tr>`).join("");
  }
  function gevoelTabel(tb) {
    tb.innerHTML = A.gevoel.map(v => `<tr><td>${v.naam}</td>${v.rij.map(x => `<td class="num">${x.tekU > 0 ? `<span style="color:var(--warn)">${nl(x.tekU, 1)}</span>` : "0"}</td><td class="num">${nl(x.impU)}</td><td class="num">${eur(x.nettoP)}</td>`).join("")}</tr>`).join("");
  }

  /* gespiegelde dagbalans: boven de as waar de stroom vandaan komt (zon, wind, net), onder de as waar hij heen gaat (warmtepomp, rest woning, gemeenschappelijk, auto's) */
  const KLEUR = { zon: "var(--gold)", wind: "var(--water)", net: "var(--warn)", wp: "#8B4A9C", woning: "var(--sage)", gemeen: "var(--muted)", ev: "var(--rain)", snel: "var(--line)" };
  function balansChart(el, wi, modus) {
    const W = A.winters[wi], n = W.dagen.length, Wd = 600, H = 330, L = 46, R = 10, T = 20, B = 34, pw = Wd - L - R, ph = H - T - B;
    const ki = modus === "reactief" ? 4 : modus === "snel" ? 9 : 3;
    const boven = W.dagen.map(d => [["zon", d[0]], ["wind", d[1]], ["net", d[ki]]]);
    const onder = W.dagen.map(d => [["wp", d[5]], ["woning", d[6]], ["gemeen", d[8]], ["ev", modus === "snel" ? Math.max(0, d[7] - d[10]) : d[7]], ["snel", modus === "snel" ? d[10] : 0]]);
    const mB = Math.max(...boven.map(b => b.reduce((a, x) => a + x[1], 0))) / 1000, mO = Math.max(...onder.map(b => b.reduce((a, x) => a + x[1], 0))) / 1000;
    const st = 0.25, tB = Math.ceil(mB / st) * st, tO = Math.ceil(mO / st) * st, k = ph / (tB + tO), y0 = T + tB * k;
    const x = i => L + pw * i / n, bw = Math.max(1, pw / n - 0.5);
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Winter ${W.naam}: herkomst en gebruik van stroom per dag">`;
    for (let v = -tO; v <= tB + 1e-9; v += st) { const y = y0 - v * k; s += `<line x1="${L}" x2="${Wd - R}" y1="${y}" y2="${y}" style="stroke:var(--grid)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" class="sm mono">${nl(Math.abs(v), 2)}</text>`; }
    s += `<text x="${L}" y="${T - 5}" class="sm">↑ opwek en bijkoop (MWh per dag)</text><text x="${L}" y="${H - 4}" class="sm">↓ verbruik (MWh per dag)</text>`;
    W.dagen.forEach((d, i) => {
      let yb = y0; boven[i].forEach(([c, v]) => { const h = v / 1000 * k; if (h > 0.05) { yb -= h; s += `<rect x="${x(i)}" y="${yb}" width="${bw}" height="${h}" style="fill:${KLEUR[c]}"/>`; } });
      let yo = y0; onder[i].forEach(([c, v]) => { const h = v / 1000 * k; if (h > 0.05) { s += `<rect x="${x(i)}" y="${yo}" width="${bw}" height="${h}" style="fill:${KLEUR[c]}"/>`; yo += h; } });
      const t = datum(W, i); if (t.getUTCDate() === 1) s += `<line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${T + ph}" style="stroke:var(--grid);stroke-dasharray:2 3"/><text x="${x(i) + 3}" y="${T + ph + 12}" class="sm">${MND[t.getUTCMonth()]}</text>`;
      s += `<rect x="${x(i)}" y="${T}" width="${pw / n}" height="${ph}" style="fill:transparent"><title>${dagNaam(W, i)}\nzon ${nl(d[0])} · wind ${nl(d[1])} · bijkoop ${nl(d[ki])} kWh\nwarmtepomp ${nl(d[5])} · rest woningen ${nl(d[6])} · gemeenschappelijk ${nl(d[8])} · auto's ${nl(d[7])} kWh${modus === "snel" ? ", waarvan " + nl(d[10]) + " bij een snellader" : ""}</title></rect>`;
    });
    s += `<line x1="${L}" x2="${Wd - R}" y1="${y0}" y2="${y0}" style="stroke:var(--fg);stroke-width:1"/>`;
    el.innerHTML = s + "</svg>";
  }
  const legenda = () => [["zon", "zon (alle panelen)"], ["wind", "wind (2 erfmolens)"], ["net", "bijkoop net"], ["wp", "warmtepomp (verwarming + warm water)"], ["woning", "rest van de woningen"], ["gemeen", "gemeenschappelijk (buurthuis, cellen, werkplaats)"], ["ev", "auto's en e-fietsen"], ["snel", "auto's geladen bij snellader (buiten het dorp)"]]
    .map(([k, t]) => `<span style="white-space:nowrap"><span style="color:${KLEUR[k]}">■</span> ${t}</span>`).join(" &nbsp; ");

  function mixTabel(tb, perWoning) {
    const nw = A.nW, rij = (naam, k, sub) => `<tr${sub ? ' class="note"' : ""}><td>${sub ? "&nbsp;&nbsp;– " : ""}${naam}</td>${A.winters.map(W => { const v = typeof k === "function" ? k(W.som) : W.som[k]; const tot = W.som.wp + W.som.woning + W.som.ev + W.som.gemeen;
      return `<td class="num">${nl(v / 1000, 1)}</td><td class="num">${sub ? "" : nl(v / tot * 100) + " %"}</td>${perWoning ? `<td class="num">${k === "gemeen" ? "–" : nl(v / nw)}</td>` : ""}`; }).join("")}</tr>`;
    tb.innerHTML = rij("Warmtepomp", "wp") + rij("ruimteverwarming", "verw", 1) + rij("warm tapwater", s => s.wp - s.verw, 1) + rij("Rest van de woning (apparaten, koken, wassen, koelen, ventilatie)", "woning") +
      rij("Auto's en e-fietsen", "ev") + rij("Gemeenschappelijk (buurthuis, keuken, cellen, werkplaats, akker)", "gemeen") +
      `<tr style="font-weight:600"><td>Totaal verbruik</td>${A.winters.map(W => { const t = W.som.wp + W.som.woning + W.som.ev + W.som.gemeen; return `<td class="num">${nl(t / 1000, 1)}</td><td></td>${perWoning ? "<td></td>" : ""}`; }).join("")}</tr>` +
      `<tr><td>Opwek zon + wind</td>${A.winters.map(W => `<td class="num">${nl((W.som.zon + W.som.wind) / 1000, 1)}</td><td></td>${perWoning ? "<td></td>" : ""}`).join("")}</tr>`;
  }
  function snelTabel(tb, prijsSnel) {
    const inkoop = A.winters.map(W => (W.dal.gemPrijs + D.net.opslagIn + D.net.eb[0].t) * (1 + D.net.btw));
    tb.innerHTML = A.snellader.flatMap(x => A.winters.map((W, j) => { const w = +W.naam.slice(0, 4), a = x.zonder.win[w], b = x.met.win[w], kWh = b.snel;
      return `<tr${x.cap === A.besluitKWh ? ' class="best"' : ""}><td>${j ? "" : nl(x.cap) + " kWh"}</td><td>${W.naam}</td><td class="num">${nl(a.uren)} → ${nl(b.uren)}</td><td class="num">${nl(a.imp / 1000, 1)} → ${nl(b.imp / 1000, 1)}</td><td class="num">${nl(kWh)} kWh op ${b.snelDagen} dagen</td><td class="num">± ${nl(Math.ceil(kWh / 40))}</td><td class="num">${eur(kWh * prijsSnel - (a.imp - b.imp) * inkoop[j])}</td></tr>`; })).join("");
  }
  window.NAC = { balansChart, legenda, mixTabel, snelTabel, A, K, annuiteit, eur, winterChart, uurChart, winterTabel, rekenGrootte, grootteTabel, blokTabel, gevoelTabel };
})();
