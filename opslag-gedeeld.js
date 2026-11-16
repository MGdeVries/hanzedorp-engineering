/* =====================================================================
   opslag-gedeeld.js – bindings en grafieken voor opslag.html en opslag-technisch.html (window.OG)
   ===================================================================== */
(function () {
  const { D, nl, bindAll } = HZ, V = D.voedsel, VR = V.voorraad;
  const MNDL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  function weekTekst(w) { const d = new Date(Date.UTC(2025, 0, 1 + w * 7 + 3)), dag = d.getUTCDate(); return (dag <= 10 ? "begin " : dag <= 20 ? "half " : "eind ") + MNDL[d.getUTCMonth()]; }
  const r100 = v => nl(Math.round(v / 100) * 100), r10 = v => nl(Math.round(v / 10) * 10);
  const maatTxt = m => `${nl(m.b, 1)} × ${nl(m.d, 1)} × ${nl(m.h, 1)} m`;
  const rust = cel => { const r = cel.weken.filter(w => w.rustUur != null && !w.vrij).map(w => w.rustUur).sort((a, b) => a - b); return r.length ? { med: r[Math.floor(r.length / 2)], min: r[0] } : { med: 0, min: 0 }; };
  let _o = null; const std = () => _o || (_o = HV.ontwerp());
  let _e = null; const en = () => _e || (_e = window.HE ? { zonder: HE.simuleer({}), met: HE.simuleer({ pcm: VR.pcmOptie }) } : null);
  function bind(extra = {}) {
    const o = std(), s = o.s, R = s.R, som = a => a.reduce((x, y) => x + y, 0);
    const vers = som(R.vers) + som(R.veldEten), uit = som(R.uitVoorraad);
    const tekWeken = R.tekort.map((t, w) => t > 1 ? w : -1).filter(w => w >= 0);
    const e = en(), pct = r => r && r.cel ? nl((1 - r.celGedwongen / r.cel) * 100) : "–";
    bindAll(Object.assign({
      monden: nl(s.monden), akkerM2: nl(s.A), oogstKg: r100(s.oogstJr), versKg: r100(vers), uitKg: r100(uit), versPct: nl(vers / (vers + uit) * 100),
      k2Kg: r10(s.piek.k2.kg), k2Week: weekTekst(s.piek.k2.week), k8Kg: r10(s.piek.k8.kg), k8Week: weekTekst(s.piek.k8.week),
      vKg: r10(s.piek.v.kg), vWeek: weekTekst(s.piek.v.week), bKg: r10(s.piek.b.kg), bWeek: weekTekst(s.piek.b.week), potten: r100(o.kast.potten),
      veldKg: r10(s.piek.veld.kg), veldWeek: weekTekst(s.piek.veld.week),
      tekortKg: r10(s.tekortJr), tekortVan: tekWeken.length ? weekTekst(tekWeken[0]) : "–", tekortTot: tekWeken.length ? weekTekst(tekWeken[tekWeken.length - 1]) : "–", compostKg: r10(s.compostJr),
      k2Maat: maatTxt(o.cel.k2.maat), k8Maat: maatTxt(o.cel.k8.maat), vMaat: maatTxt(o.cel.v.maat),
      k2L: r100(o.cel.k2.maat.netL), k8L: r100(o.cel.k8.maat.netL), vL: r100(o.cel.v.maat.netL),
      k2KWh: r10(o.cel.k2.kWh), k8KWh: r10(o.cel.k8.kWh), vKWh: r10(o.cel.v.kWh), celKWh: r10(o.kWh), celKWhDag: nl(o.kWh / 365, 1),
      dk2: nl(VR.dikte.k2 * 100), dk8: nl(VR.dikte.k8 * 100), dv: nl(VR.dikte.v * 100),
      rustV: nl(rust(o.cel.v).med), rustVmin: nl(rust(o.cel.v).min), rustK2: nl(rust(o.cel.k2).med),
      celPct: pct(e && e.zonder), celPctPcm: pct(e && e.met), pcmV: nl(VR.pcmOptie.v), pcmK2: nl(VR.pcmOptie.k2),
      thuisKg: nl(o.thuis.weekKg, 1), thuisKoelL: r10(o.thuis.koelL), thuisVriesL: nl(o.thuis.vriesL), manKoelL: nl(VR.thuis.koelL), manVriesL: nl(VR.thuis.vriesL),
      celWarm: r100(o.warm), weekThuis: nl(VR.weekThuis), bandV: `${VR.band.v[0]} tot ${VR.band.v[1]}`, bandK2: `${VR.band.k2[0]} tot ${VR.band.k2[1]}`, bandK8: `${VR.band.k8[0]} tot ${VR.band.k8[1]}`
    }, extra));
  }
  /* gestapeld vlakdiagram per week; series: [{ naam, waarden, kleur }] */
  function stapel(el, series, { unit = "kg", height = 240 } = {}) {
    const W = 580, L = 50, Rm = 10, T = 18, B = 26, pw = W - L - Rm, ph = height - T - B, n = series[0].waarden.length;
    const cum = Array.from({ length: n }, (_, i) => series.reduce((a, s) => a + s.waarden[i], 0));
    const mx = Math.max(...cum, 1), p = Math.pow(10, Math.floor(Math.log10(mx))), q = mx / p, top = (q <= 1 ? 1 : q <= 2 ? 2 : q <= 4 ? 4 : q <= 5 ? 5 : q <= 8 ? 8 : 10) * p;
    const x = i => L + pw * i / (n - 1), y = v => T + ph - ph * v / top;
    let s = `<svg viewBox="0 0 ${W} ${height}" width="100%" role="img">`;
    for (let k = 0; k <= 4; k++) { const v = top * k / 4; s += `<line x1="${L}" x2="${W - Rm}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="sm mono">${nl(v)}</text>`; }
    s += `<text x="${L}" y="${T - 6}" class="sm">${unit}</text>`;
    const basis = Array(n).fill(0);
    series.forEach(se => {
      const boven = basis.map((b, i) => b + se.waarden[i]);
      const pts = boven.map((v, i) => `${x(i)},${y(v)}`).concat(basis.map((v, i) => `${x(i)},${y(v)}`).reverse());
      s += `<polygon points="${pts.join(" ")}" style="fill:${se.kleur};opacity:.85"><title>${se.naam}</title></polygon>`;
      boven.forEach((v, i) => basis[i] = v);
    });
    ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"].forEach((m, k) => { const w = Math.round(k * 52 / 12); s += `<text x="${x(w)}" y="${height - 8}" class="sm">${m}</text>`; });
    el.innerHTML = s + "</svg>";
  }
  const KLEUR = { veld: "var(--green)", k2: "var(--rain)", k8: "var(--clay)", v: "var(--water)", b: "var(--warn)" };
  window.OG = { std, en, bind, stapel, KLEUR, weekTekst, rust };
})();
