/* Hanzedorp – drinkwater: dagelijkse inkoop (basis + bijkoop regenwatertekort), uurprofiel en aansluitcapaciteit (window.WD) */
(function () {
  const D = HANZEDORP_DATA, W = HANZEDORP_WEER, DW = D.drinkwater, nW = HM.nW;
  const MND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  /* o: { levensfase, thuiswerk, urinoir, tankPW, buurthuis } → per dag: basis (douchen, koken, wastafel, vaatwasser), bijkoop (toilet + wasmachine bij lege tank) in m³ */
  function reeks(o = {}) {
    const q = HM.vraag({ levensfase: o.levensfase || "start", thuiswerk: o.thuiswerk, urinoir: o.urinoir !== false });
    const regenVraag = q.regenvraag("toiletWas");                          // m³/d toilet + wasmachine
    const basis = q.lpdTot / 1000 - regenVraag + (o.buurthuis === false ? 0 : DW.buurthuisM3Dag);
    const AC = HM.dakTot * (1 - D.dak.aandeelGroen) * D.dak.cHard, Smax = nW * (o.tankPW != null ? o.tankPW : D.tankPerWoning);
    let s = Smax / 2; const bij = new Float64Array(W.n);
    for (let i = 0; i < W.n; i++) {
      let x = s + AC * W.P[i] / 1000 - regenVraag;
      if (x < 0) { bij[i] = -x; x = 0; }
      s = Math.min(x, Smax);
    }
    // per jaar en per maand (gemiddeld over de 31 geldige jaren)
    const jaren = W.jaren, pj = {}, pm = Array.from({ length: 12 }, () => ({ bij: 0, dagen: 0 }));
    let maxBij = 0;
    for (let i = 0; i < W.n; i++) { const y = W.Y[i]; if (!jaren.includes(y)) continue;
      (pj[y] = pj[y] || { bij: 0, dagen: 0, tekortDagen: 0 }); pj[y].bij += bij[i]; pj[y].dagen++; if (bij[i] > 0) pj[y].tekortDagen++;
      pm[W.M[i]].bij += bij[i]; pm[W.M[i]].dagen++; if (bij[i] > maxBij) maxBij = bij[i]; }
    const perJaar = jaren.map(y => ({ jaar: y, bij: pj[y].bij, tekortDagen: pj[y].tekortDagen, totaal: pj[y].bij + basis * pj[y].dagen }));
    const maand = pm.map((m, k) => ({ mnd: MND[k], basis, bij: m.bij / m.dagen, totaal: basis + m.bij / m.dagen }));
    const droog = perJaar.reduce((a, b) => (b.bij > a.bij ? b : a));
    return { q, regenVraag, basis, bij, AC, Smax, perJaar, maand, droog, maxDag: basis + maxBij, maxBij,
      gemJaar: perJaar.reduce((a, b) => a + b.totaal, 0) / perJaar.length, gemBij: perJaar.reduce((a, b) => a + b.bij, 0) / perJaar.length };
  }
  /* dagreeks voor één jaar: [{d, basis, bij}] */
  function jaar(r, y) { const out = []; for (let i = 0; i < W.n; i++) if (W.Y[i] === y) out.push({ m: W.M[i], basis: r.basis, bij: r.bij[i] }); return out; }
  /* uurprofiel (m³/h) op een gemiddelde dag en op de drukste dag, met de vorm van de referentiewoning [1] */
  function uur(r, dagM3) {
    const u = D.meting.uurL, s = u.reduce((a, b) => a + b, 0);
    return u.map(v => v / s * dagM3);
  }
  /* momentaan ontwerpdebiet dorp (l/s) volgens KWR 06.104 [125] */
  function piek(n = nW) {
    const f = ([a, b]) => a + b * n;
    return { laag: f(DW.mmvDorp.laag), hoog: f(DW.mmvDorp.hoog), woningLaag: DW.mmvWoning.laag, woningHoog: DW.mmvWoning.hoog };
  }
  /* binnendiameter (mm) nodig voor debiet Q (l/s) bij v ≤ vMax */
  const diam = (q, v = DW.vMax) => Math.sqrt(4 * q / 1000 / (Math.PI * v)) * 1000;
  /* drukverlies Darcy-Weisbach (kPa) met Swamee-Jain, PE-ruwheid 0,007 mm, water 10 °C */
  function dp(q, dI, L = DW.leidingL) {
    const A = Math.PI * (dI / 1000) ** 2 / 4, v = q / 1000 / A, Re = v * dI / 1000 / 1.31e-6;
    const f = 0.25 / Math.log10(0.007 / 3.7 / dI + 5.74 / Re ** 0.9) ** 2;
    return { v, kPa: f * L / (dI / 1000) * v * v / 2 * 1000 / 1000 };
  }
  window.WD = { reeks, jaar, uur, piek, diam, dp, MND };
})();
