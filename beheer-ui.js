/* =====================================================================
   beheer-ui.js – weergave onderhoud (MJOP) en financiële planning (window.BHU)
   Vereist: hanzedorp-lib.js (HZ), beheer-gedeeld.js (BH)
   ===================================================================== */
(function () {
  const nl = HZ.nl, k = v => nl(Math.round(v / 1000)), e = v => "€ " + nl(Math.abs(v) < 5000 ? Math.round(v / 5) * 5 : Math.round(v / 100) * 100);
  const seg = (el, naam, opties, std) => { el.innerHTML = opties.map(([v, l], i) => `<input type="radio" name="${naam}" id="${naam}${i}" value="${v}"${v === std ? " checked" : ""}><label for="${naam}${i}">${l}</label>`).join(""); };
  const val = n => { const x = document.querySelector(`input[name=${n}]:checked`); return x ? x.value : null; };

  /* vervangingen per jaar (staven, k€) + reservefonds (lijn, k€) */
  function chartMjop(el, M, btwF = 1) {
    const labels = [], v = [], f = [];
    for (let t = 1; t <= M.N; t++) { labels.push(String(window.HANZEDORP_DATA.beheer.startJaar + t)); v.push(M.V[t] * btwF / 1000); f.push(M.fonds[t] * btwF / 1000); }
    HZ.bars(el, { labels, series: [{ name: "vervangingen", values: v, color: "var(--gold)", unit: "k€" }], line: { values: f, color: "var(--water)" }, unit: "vervangingen (k€)", lineUnit: "reservefonds (k€)", labelEvery: 5 });
  }
  function tabelGroep(tb, M, btwF = 1) {
    const rows = Object.entries(M.groepen);
    tb.innerHTML = rows.map(([g, x]) => `<tr><td>${g}</td><td class="num">${k(x.inv * btwF)}</td><td class="num">${k(x.ond * btwF)}</td><td class="num">${k(x.afschr * btwF)}</td></tr>`).join("") +
      `<tr style="font-weight:600"><td>Totaal</td><td class="num">${k(M.inv * btwF)}</td><td class="num">${k(M.ondJaar * btwF)}</td><td class="num">${k(M.afschr * btwF)}</td></tr>`;
  }
  function tabelComp(tb, M, technisch, btwF = 1) {
    tb.innerHTML = M.comp.map(c => `<tr><td>${c.naam}${c.inGrond ? ' <span class="note">(aanleg in Grond &amp; kosten)</span>' : ""}</td><td>${c.groep}</td>` +
      (technisch ? `<td class="num">${nl(c.n, c.n < 10 ? 1 : 0)} ${c.eenh}</td><td class="num">${nl(c.pmin, c.pmin < 10 ? 1 : 0)}–${nl(c.pmax, c.pmax < 10 ? 1 : 0)}</td>` : "") +
      `<td class="num">${c.inv ? k(c.inv * btwF) : "–"}</td><td class="num">${c.L || "–"}</td><td class="num">${nl(Math.round(c.ond * btwF))}</td><td>${c.jaren.length ? c.jaren.map(t => window.HANZEDORP_DATA.beheer.startJaar + t).join(", ") : "–"}</td>` +
      (technisch ? `<td>${c.st}</td><td class="note">${c.bron || ""}</td>` : "") + `</tr>`).join("");
  }
  function kpiMjop(el, M, btwF = 1) {
    el.innerHTML = [[e(M.inv * btwF), "vervangingswaarde gedeelde voorzieningen"], [e(M.ondJaar * btwF) + " /jr", "onderhoud en keuringen"],
      [e(M.C * btwF) + " /jr", "storting reservefonds (startjaar)"], [e(M.perWoningMnd * btwF) + " /mnd", "per woning: onderhoud + reservering"],
      [e(M.tienJaar * btwF), "vervangingen in de eerste 10 jaar"], [e(M.minVvE * btwF) + " /jr", "ter vergelijking: VvE-minimum 0,5 % van de waarde"]]
      .map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join("");
  }
  function chartFin(el, Fi) {
    HZ.bars(el, { labels: Fi.rows.map(r => String(r.jaar)), series: [{ name: "bijdrage per woning", values: Fi.rows.map(r => r.perWoningMnd), color: "var(--sage)", unit: "€/mnd" }],
      line: { values: Fi.rows.map(r => r.fonds / 1000), color: "var(--water)" }, unit: "bijdrage per woning (€/mnd)", lineUnit: "reservefonds (k€)", labelEvery: 5 });
  }
  function tabelLasten(tb, Fi) {
    tb.innerHTML = Fi.vaste.map(([n, v, st]) => `<tr><td>${n}</td><td class="num">${nl(Math.round(v))}</td><td class="num">${nl(Math.round(v / Fi.nW / 12))}</td><td>${st}</td></tr>`).join("") +
      `<tr style="font-weight:600"><td>Totaal</td><td class="num">${nl(Math.round(Fi.jaarlast))}</td><td class="num">${nl(Math.round(Fi.perWoningMnd))}</td><td></td></tr>`;
  }
  function tabelKas(tb, Fi) {
    tb.innerHTML = Fi.rows.filter(r => r.t === 1 || r.t % 5 === 0 || r.vervanging > 100000).map(r => `<tr><td>${r.jaar}</td><td class="num">${k(r.expl)}</td><td class="num">${k(r.stort)}</td><td class="num">${k(r.ann)}</td><td class="num">${k(r.bijdrage)}</td><td class="num">${nl(Math.round(r.perWoningMnd))}</td><td class="num">${k(r.vervanging)}</td><td class="num">${k(r.fonds)}</td><td class="num">${k(r.restLening)}</td></tr>`).join("");
  }
  window.BHU = { seg, val, chartMjop, tabelGroep, tabelComp, kpiMjop, chartFin, tabelLasten, tabelKas, e, k };
})();
