/* =====================================================================
   hanzedorp-hemelwater.js – infiltratiekratten bij de woningen en wadi's in het gezamenlijk groen (window.HH)
   Vereist: hanzedorp-data.js, hanzedorp-weer.js
   Dagbalans 1994–2025 (31 jaren, excl. 1998) op KNMI Heino; ontwerpcontrole met de WDOD-toetsbui
   (T = 100: 109 mm in 24 uur; berging 92 mm per m² toename verhard oppervlak) [15].
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, H = D.hemelwater, W = window.HANZEDORP_WEER, WS = D.waterschap;
  const J = W.jaren, NJ = J.length;
  const bui = WS.toetsbuiMm, berg = WS.bergingMm;

  /* infiltratiekrat per woning */
  function krat(o = {}) {
    const A = o.verhard != null ? o.verhard : H.kratVerhardPW, k = o.k != null ? o.k : H.kDag, C = 0.8;
    const Vnet = o.V != null ? o.V : A * berg / 1000;                              // m³ netto berging (92 mm)
    const Vbruto = Vnet / H.kratPorositeit, nKrat = Math.ceil(Vbruto / H.kratElementM3);
    const Ab = Vbruto / H.kratHoogte;                                             // m² bodemoppervlak
    const inf = k * Ab;                                                           // m³/d infiltratiecapaciteit (alleen bodem)
    const leegUren = Vnet / inf * 24;
    let V = 0, overDagen = 0, maxV = 0, overM3 = 0, natDagen = 0; const yr = {};
    for (let i = 0; i < W.n; i++) {
      const y = W.Y[i]; const R = yr[y] || (yr[y] = { over: 0, dagen: 0 });
      // conservatief: de dagsom valt in één keer; daarna infiltreert de krat een etmaal lang
      V += Math.max(0, W.P[i]) * A * C / 1000;
      if (V > Vnet) { const o2 = V - Vnet; V = Vnet; if (y !== 1998) { overDagen++; overM3 += o2; } R.over += o2; R.dagen++; }
      if (y !== 1998) { if (V > maxV) maxV = V; if (V > 0.5 * Vnet) natDagen++; }
      V -= Math.min(V, inf);
    }
    // toetsbui: 109 mm in 24 uur, gelijktijdig infiltreren gedurende die 24 uur (N)
    const buiIn = A * C * bui / 1000, buiNa = Math.max(0, buiIn - inf);
    return { A, k, Vnet, Vbruto, nKrat, Ab, inf, leegUren, overDagenJr: overDagen / NJ, overM3Jr: overM3 / NJ, maxVulling: maxV / Vnet, vol50DagenJr: natDagen / NJ,
      buiIn, buiNa, buiOk: buiNa <= Vnet };
  }

  /* wadi's in het gezamenlijk groen */
  function wadi(o = {}) {
    const Ag = o.groen != null ? o.groen : H.groenM2, Av = o.verhard != null ? o.verhard : H.gemVerhardM2, k = o.k != null ? o.k : H.kDag;
    const d = o.diepte != null ? o.diepte : H.wadiDiepte, n = o.aantal || H.wadiAantal;
    const Ceq = Ag * H.cGroen + Av * H.cVerhard;                                   // m² equivalent verhard
    const Vbui = Ceq * bui / 1000, Vwdod = Av * berg / 1000;                      // m³
    const Vreq = Math.max(Vbui, Vwdod);
    const Aw = o.Aw != null ? o.Aw : Vreq / d;                                    // m² wadibodem (rechthoekig benaderd)
    const Vw = Aw * d, inf = k * Aw, leegUren = Vw / inf * 24;
    let V = 0, over = 0, overDagen = 0, natDagen = 0, maxV = 0, langst = 0, run = 0;
    for (let i = 0; i < W.n; i++) {
      const y = W.Y[i];
      V += Math.max(0, W.P[i]) * Ceq / 1000 + Math.max(0, W.P[i]) * Aw / 1000;   // afstroming + regen op de wadi zelf (dagsom in één keer)
      if (V > Vw) { if (y !== 1998) { over += V - Vw; overDagen++; } V = Vw; }
      if (y !== 1998) { if (V > maxV) maxV = V; if (V > 0.05 * Vw) natDagen++; }
      V -= Math.min(V, inf + W.E[i] * Aw / 1000);
      if (y !== 1998) { if (V > 0.01 * Vw) { run++; if (run > langst) langst = run; } else run = 0; }
    }
    return { Ag, Av, Ceq, Vbui, Vwdod, Vreq, Aw, Aper: Aw / n, n, d, Vw, inf, leegUren, leegOk: leegUren <= H.leegUren,
      overDagenJr: overDagen / NJ, overM3Jr: over / NJ, waterDagenJr: natDagen / NJ, langstNat: langst, maxVulling: maxV / Vw,
      aandeelGroen: Aw / Ag };
  }

  /* gevoeligheid voor de doorlatendheid */
  function kReeks(ks) { return ks.map(k => ({ k, krat: krat({ k }), wadi: wadi({ k }) })); }

  window.HH = { krat, wadi, kReeks };
})();
