/* =====================================================================
   hanzedorp-net.js – netaansluiting en stroomhandel (window.HN)
   Vereist: hanzedorp-data.js, hanzedorp-prijs.js, hanzedorp-energie.js (HE, met optie uurJaren)
   Tijdstap 1 uur, jaren met zowel KNMI-weer als EPEX-prijzen (2023–2025).
   Volgorde per uur (EMS-regels, zie technische pagina):
     1. eigen opwek → eigen vraag;
     2. overschot → accu → export (alleen bij positieve exportprijs, tot de aansluitwaarde) → rest afschakelen;
     3. tekort → accu tot de eilandreserve → net (tot de aansluitwaarde) → accu onder de reserve → tekort;
     4. handel: verkopen uit de accu boven het doelniveau als de beurs ≥ verkoopdrempel;
        bijladen uit het net tot het doelniveau in de goedkoopste uren van de komende horizon;
        bij een totaalprijs < 0 (beurs + opslag + EB) laden uit het net in plaats van uit eigen opwek.
     Doelniveau = eilandreserve + verwacht eigen tekort in de komende horizon (perfecte 24-uursvoorspelling,
     verdedigbaar omdat day-ahead-prijzen en weersverwachting een dag vooruit bekend zijn).
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, N = D.net, P = window.HANZEDORP_PRIJS, E = D.energie;
  const kW = A => 3 * 230 * A / 1000;                       // aansluitwaarde in kVA ≈ kW (cos φ ≈ 1)
  const d0 = Date.UTC(+P.d0.slice(0, 4), +P.d0.slice(5, 7) - 1, +P.d0.slice(8, 10));
  const lastSun = (y, m) => { const d = new Date(Date.UTC(y, m + 1, 0)); return d.getUTCDate() - d.getUTCDay(); };
  function zomertijd(t) { const y = new Date(t).getUTCFullYear(); return t >= Date.UTC(y, 2, lastSun(y, 2)) && t < Date.UTC(y, 9, lastSun(y, 9)); }
  /* model-uur = zonnetijd (lengte 6,26° O ≈ UT + 0,42 h); lokale klok = UT + 1 (winter) of + 2 (zomer) → afgerond +1 resp. +2 */
  function prijs(dag, h) {
    const t = Date.UTC(1994, 0, 1) + dag * 864e5; let hl = h + (zomertijd(t) ? 2 : 1), k = Math.round((t - d0) / 864e5);
    if (hl > 23) { hl -= 24; k++; }
    const i = k * 24 + hl; return i >= 0 && i < P.p.length ? P.p[i] / 1e5 : null;
  }
  const cache = {};
  let laatsteD = null;
  function reeks(o = {}) {
    const key = JSON.stringify(o); if (cache[key]) return cache[key];
    const C = E.scenarioC;
    const r = HE.simuleer(Object.assign({ accu: 0, accuKW: 0, pvExtra: 0, pvVlakken: C.vlakken, kWpDakType: C.kWpDakType, uurJaren: N.jaren }, o));
    const R = r.reeks;
    R.prijs = R.dag.map((d, i) => prijs(d, R.uur[i]));
    R.jaar = R.dag.map(d => new Date(Date.UTC(1994, 0, 1) + d * 864e5).getUTCFullYear());
    R.basis = r; laatsteD = r.d;
    return (cache[key] = R);
  }
  function eb(kWh) { let rest = kWh, vorige = 0, s = 0; for (const b of N.eb) { const q = Math.min(rest, b.tot - vorige); if (q <= 0) break; s += q * b.t; rest -= q; vorige = b.tot; } return s; }
  const ebMarg = N.eb[0].t;

  /* p: { A, accu, accuKW, reserve, opslagIn, opslagUit, verkoopDrempel, slijtage, handel, horizon, kostJr, model } */
  function sim(p) {
    const R = reeks(p.model || {}), n = R.vraag.length, Pn = kW(p.A), cap = p.accu, pk = p.accuKW, eta = Math.sqrt(0.9), res = cap * p.reserve, H = p.horizon || N.horizon;
    const def = new Float64Array(n + 1); for (let t = 0; t < n; t++) def[t + 1] = def[t] + Math.max(0, R.vraag[t] - R.aanbod[t]);
    const jr = {}; let soc = cap * 0.5;
    for (let t = 0; t < n; t++) {
      const y = R.jaar[t], J = jr[y] || (jr[y] = { imp: 0, impW: 0, exp: 0, expW: 0, afg: 0, afgW: 0, tekort: 0, doorzet: 0, netLaad: 0, verkocht: 0, uren: 0, pImp: 0, pExp: 0, vraag: 0, aanbod: 0, negLaad: 0 });
      const pr = R.prijs[t] != null ? R.prijs[t] : 0, pIn = pr + p.opslagIn, pUit = pr - p.opslagUit, allIn = (pIn + ebMarg) * (1 + N.btw);
      let net = R.aanbod[t] - R.vraag[t], imp = 0, exp = 0, afg = 0, pkVrij = pk;
      J.vraag += R.vraag[t]; J.aanbod += R.aanbod[t]; J.uren++;
      if (net >= 0) {
        let q = 0;
        if (allIn >= 0 || !p.handel) { q = Math.min(net, pkVrij, (cap - soc) / eta); soc += q * eta; pkVrij -= q; J.doorzet += q; }
        let rest = net - q;
        if (pUit > 0) { exp = Math.min(rest, Pn); rest -= exp; }
        afg = rest;
      } else {
        let need = -net;
        let q = Math.min(need, pkVrij, Math.max(0, soc - res) * eta); soc -= q / eta; pkVrij -= q; J.doorzet += q; need -= q;
        imp = Math.min(need, Pn); need -= imp;
        if (need > 0) { q = Math.min(need, pkVrij, soc * eta); soc -= q / eta; pkVrij -= q; J.doorzet += q; need -= q; }
        J.tekort += need;
      }
      const doel = Math.min(cap, res + (def[Math.min(n, t + H)] - def[t]) / eta);
      if (p.handel) {
        // verkopen boven het doelniveau bij een hoge beursprijs
        if (pr >= p.verkoopDrempel && imp === 0 && soc > doel && pkVrij > 0) {
          const q = Math.min(pkVrij, Pn - exp, (soc - doel) * eta); if (q > 0) { soc -= q / eta; pkVrij -= q; exp += q; J.verkocht += q; J.doorzet += q; }
        }
        // laden uit het net bij een negatieve totaalprijs (je krijgt geld toe)
        if (allIn < 0 && exp === 0 && soc < cap && pkVrij > 0) {
          const q = Math.min(pkVrij, Pn - imp, (cap - soc) / eta); if (q > 0) { soc += q * eta; pkVrij -= q; imp += q; J.negLaad += q; J.doorzet += q; }
        }
      }
      // bijladen tot het doelniveau in de goedkoopste uren van de horizon (ook zonder handel: winterreserve)
      if (soc < doel && imp < Pn && exp === 0 && pkVrij > 0) {
        const nodig = (doel - soc) / eta, uren = Math.ceil(nodig / Math.max(1e-6, Math.min(Pn, pk)));
        const venster = []; for (let k = t; k < Math.min(n, t + H); k++) venster.push(R.prijs[k] != null ? R.prijs[k] : 0);
        venster.sort((a, b) => a - b);
        if (pr <= venster[Math.min(venster.length - 1, Math.max(0, uren - 1))]) {
          const q = Math.min(pkVrij, Pn - imp, nodig); if (q > 0) { soc += q * eta; imp += q; J.netLaad += q; J.doorzet += q; }
        }
      }
      J.imp += imp; J.impW += imp * pIn; J.exp += exp; J.expW += exp * pUit; J.afg += afg; if (pr > 0) J.afgW += afg * pUit;
      if (imp > J.pImp) J.pImp = imp; if (exp > J.pExp) J.pExp = exp;
    }
    const jaren = Object.keys(jr).map(Number).filter(y => jr[y].uren > 8000);
    const per = jaren.map(y => {
      const J = jr[y], ebK = eb(J.imp);
      const inkoop = (J.impW + ebK) * (1 + N.btw), vast = N.vastLevering * 12 * (1 + N.btw), slijt = p.slijtage * J.doorzet;
      const saldo = J.expW - inkoop - vast - p.kostJr + N.vermindering - slijt;
      return Object.assign({ jaar: y, ebK, inkoop, vast, slijt, saldo }, J);
    });
    const gem = k => per.reduce((a, r) => a + r[k], 0) / per.length;
    const out = { A: p.A, kW: Pn, kostJr: p.kostJr, per };
    ["imp", "exp", "expW", "afg", "afgW", "tekort", "doorzet", "netLaad", "verkocht", "negLaad", "inkoop", "vast", "slijt", "saldo", "vraag", "aanbod", "ebK"].forEach(k => out[k] = gem(k));
    out.pImp = Math.max(...per.map(r => r.pImp)); out.pExp = Math.max(...per.map(r => r.pExp));
    return out;
  }

  /* vergelijking van alle aansluitwaarden met dezelfde instellingen */
  function vergelijk(p) { return N.aansl.map(a => sim(Object.assign({}, p, { A: a.A, kostJr: a.kostJr }))); }

  /* scenario woningaansluitingen: n_w × 3×25A + 1 collectieve aansluiting (A_coll). Het deel van het woningverbruik dat niet
     direct uit het eigen dak komt (1 − huisPVdirect) gaat via het openbare net van de collectieve aansluiting naar de woningen
     (energiedelen); daarover betalen de woningen beursprijs + opslag + EB + btw en ontvangt de collectieve aansluiting beurs − opslag. */
  function scenarioWoningen(p, rColl) {
    const R = reeks(p.model || {}), d = R.basis.d, nW = d.nW, gedeeld = d.huis * (1 - N.huisPVdirect);
    const pGem = (() => { let s = 0, c = 0; R.prijs.forEach(x => { if (x != null) { s += x; c++; } }); return s / c; })();
    const ebPerWoning = eb(gedeeld / nW) * (1 + N.btw) * nW;
    const deelKost = gedeeld * ((pGem + p.opslagIn) * (1 + N.btw) - (pGem - p.opslagUit)) + ebPerWoning;
    const aansl25 = N.aansl.find(a => a.A === 25).kostJr;
    const extra = nW * aansl25 + nW * N.vastLevering * 12 * (1 + N.btw) - nW * N.vermindering - N.vermindering;  // collectief: geen verblijfsfunctie → geen vermindering
    return { gedeeld, pGem, deelKost, extra, saldo: rColl.saldo - deelKost - extra, nW };
  }

  /* EB op interne levering (als de fiscus de levering binnen het privénet toch als levering via een aansluiting ziet) */
  /* v0.15: energiebelasting op levering binnen het privénet (art. 50 lid 3a Wbm; Hof Amsterdam 13-05-2025 [83]):
     belast = stroom aan woningen en hun laadpalen, minus het deel dat elke woning direct van het eigen dak verbruikt (lid 6a);
     eigen verbruik van de vereniging (buurthuis, cellen, pomp) uit eigen opwek is vrijgesteld. Schijf per woning (conservatief: tarief schijf 1). */
  function ebInternBasis(d) { return d ? d.huis * (1 - N.huisPVdirect) + d.mob : 0; }
  function ebIntern(r, d) { d = d || laatsteD; if (!d) { const intern = r.vraag - r.imp; return eb(intern) * (1 + N.btw); }
    return eb(ebInternBasis(d) / d.nW) * (1 + N.btw) * d.nW; }

  window.HN = { kW, prijs, reeks, sim, vergelijk, scenarioWoningen, ebIntern, ebInternBasis, eb, d: () => laatsteD };
})();
