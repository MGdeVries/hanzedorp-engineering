/* Hanzedorp – drinkwater: grafieken en tabellen op water.html en water-technisch.html */
(function () {
  const { D, nl, bars } = HZ, DW = D.drinkwater, $ = id => document.getElementById(id);
  if (!$("dChart")) return;
  const W = HANZEDORP_WEER, prijs = DW.prijsM3 + DW.bolM3;
  /* lijngrafiek per dag: series [{v:[], color, name}] */
  function lijn(el, data, yMax) {
    const Wd = 720, H = 240, L = 40, R = 10, T = 10, B = 26, n = data[0].v.length, x = i => L + (Wd - L - R) * i / (n - 1), y = v => T + (H - T - B) * (1 - v / yMax);
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Drinkwater per dag">`;
    for (let k = 0; k <= 4; k++) { const v = yMax * k / 4; s += `<line x1="${L}" x2="${Wd - R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="sm mono">${nl(v, 1)}</text>`; }
    const mnd = data.mnd || []; let prev = -1;
    mnd.forEach((m, i) => { if (m !== prev) { s += `<text x="${x(i)}" y="${H - 8}" class="sm">${WD.MND[m]}</text>`; prev = m; } });
    data.forEach(d => { s += `<polyline fill="none" style="stroke:${d.color};stroke-width:${d.w || 1.6}" points="${d.v.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ")}"><title>${d.name}</title></polyline>`; });
    el.innerHTML = s + "</svg>";
  }
  const lf = () => (document.querySelector("input[name=dlf]:checked") || {}).value || "start";
  $("dLf").innerHTML = [["start", "Bij de start"], ["max", "Maximum (ontwerp)"]].map(([v, l], i) => `<input type="radio" name="dlf" id="dlf${i}" value="${v}"${i === 0 ? " checked" : ""}><label for="dlf${i}">${l}</label>`).join("");
  $("dStd").textContent = nl(DW.std.nominaal, 1); $("dPrijs").textContent = nl(prijs, 2);
  const p = WD.piek(); $("dPiekL").textContent = nl(p.laag * 3.6, 1); $("dPiekH").textContent = nl(p.hoog * 3.6, 1);
  $("dTbl").querySelector("tbody").innerHTML = [["Gewone woningaansluiting", DW.std.nominaal]].concat(DW.hoofd.map(([c]) => ["Hoofdaansluiting " + c + " m³/h", c]))
    .map(([n, c]) => { const ok = c >= p.hoog * 3.6 ? "ja" : c >= p.laag * 3.6 ? "alleen bij de lage schatting" : "nee";
      return `<tr><td>${n}</td><td class="num">${nl(c, 1)} m³/h</td><td class="${ok === "ja" ? "ok" : "nok"}">${ok}</td></tr>`; }).join("");
  let rC = {};
  const droogIdx = r => W.jaren.indexOf(r.droog.jaar);
  function run(init) {
    const k = lf(), r = rC[k] || (rC[k] = WD.reeks({ levensfase: k }));
    if (init) $("dJ").value = droogIdx(r);
    const y = W.jaren[+$("dJ").value]; $("dJO").value = y + (y === r.droog.jaar ? " (droogste)" : ""); $("dJT").textContent = y;
    $("rdBasis").textContent = nl(r.basis, 1) + " m³"; $("rdGem").textContent = nl(r.gemJaar / 365, 1) + " m³"; $("rdMax").textContent = nl(r.maxDag, 1) + " m³";
    $("rdJaar").textContent = nl(r.gemJaar) + " m³"; $("rdKost").textContent = "€ " + nl(Math.round(r.gemJaar * prijs / 10) * 10);
    $("rdPiek").textContent = nl(p.laag * 3.6, 1) + "–" + nl(p.hoog * 3.6, 1) + " m³/h";
    const dag = WD.jaar(r, y), tot = dag.map(d => d.basis + d.bij), yMax = Math.ceil(Math.max(r.maxDag, 1) + 0.5);
    const series = [{ name: "douchen en koken", v: dag.map(d => d.basis), color: "var(--muted)" }, { name: "bijkoop", v: dag.map(d => d.bij), color: "var(--clay)" }, { name: "totaal", v: tot, color: "var(--water)", w: 2 }];
    series.mnd = dag.map(d => d.m); lijn($("dChart"), series, yMax);
    const u = WD.uur(r, r.maxDag);
    bars($("dUur"), { labels: u.map((v, i) => String(i)), series: [{ name: "m³/h", values: u, color: "var(--water)", dec: 2, unit: "m³/h" }], unit: "m³/h", labelEvery: 3, height: 200 });
    bars($("dMnd"), { labels: WD.MND, series: [{ name: "douchen en koken", values: r.maand.map(m => m.basis), color: "var(--muted)", dec: 2, unit: "m³" }, { name: "bijkoop", values: r.maand.map(m => m.bij), color: "var(--clay)", dec: 2, unit: "m³" }], unit: "m³/d", height: 200 });
  }
  document.querySelectorAll("input[name=dlf]").forEach(i => i.addEventListener("change", () => run(true)));
  $("dJ").addEventListener("input", () => run(false));
  window.addEventListener("load", () => run(true));
})();
