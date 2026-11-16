/* =====================================================================
   wp-keuze.js – keuze warmte-opwekker per woning (window.WPK)
   Vereist: hanzedorp-data.js, hanzedorp-lib.js (HZ), hanzedorp-energie.js (HE)
   Warmtevraag per woning: Q = A · q(T_in) (graaddagenmodel, HE.warmte); elektriciteit:
     compactunit (ventilatieluchtwarmtepomp):  E = A · e(T_in)  (COP(T) = a + b·T, getoetst aan PHI-certificaat [150])
     direct elektrisch (naverwarmer, COP 1):   E = Q
   Stilstandsverlies vat klasse A: S = 8,5 + 4,25·V^0,4 W  [71]
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, E = D.energie, K = E.wpKeuze, nl = HZ.nl;
  const vatVerlies = V => (8.5 + 4.25 * Math.pow(V, 0.4)) * 8.76;   // kWh/a, klasse-A-grens
  function perType() {
    const w = HE.warmte(E.tin);
    return ["gezin", "senior", "junior"].map(t => { const A = E.opp[t];
      return { t, A, Q: A * w.q, Ewp: A * w.e, Edir: A * w.q, P: A * K.ontwerpWm2 / 1000, vat: E.vat[t], vatV: vatVerlies(E.vat[t]), scop: w.scop }; });
  }
  const copModel = T => Math.max(E.cop.min, Math.min(E.cop.max, E.cop.a + E.cop.b * T));
  function bind() {
    const r = perType(), g = r[0], set = (k, v) => document.querySelectorAll(`[data-k=${k}]`).forEach(e => e.textContent = v);
    set("qhG", nl(Math.round(g.Q / 10) * 10)); set("elWpG", nl(Math.round(g.Ewp / 10) * 10)); set("elDirG", nl(Math.round(g.Edir / 10) * 10) + " kWh");
    set("vatVerl", nl(Math.round(g.vatV / 10) * 10)); set("bodemMin", nl(K.bodemEur[0])); set("bodemMax", nl(K.bodemEur[1]));
    set("bronJr", K.bodemBronJaar[0] + "–" + K.bodemBronJaar[1]); set("bodemWpJr", nl(K.bodemWpJaar)); set("lwKW", nl(K.lwKleinsteKW)); set("geluid", nl(K.geluidDb));
    set("vatG", nl(E.vat.gezin)); set("wpG", nl(g.P, 1)); set("spfRef", nl(K.spfRef, 1));
    const tb = document.querySelector("#tblWpType tbody");
    if (tb) tb.innerHTML = r.map(x => `<tr><td>${{ gezin: "Gezinswoning", senior: "Seniorenwoning", junior: "Jongerenwoning" }[x.t]}</td><td class="num">${nl(x.A)}</td><td class="num">${nl(x.P, 2)}</td><td class="num">${nl(x.Q)}</td><td class="num">${nl(x.Ewp)}</td><td class="num">${nl(x.Edir)}</td><td class="num">${nl(x.vatV)}</td></tr>`).join("");
    const tc = document.querySelector("#tblCop tbody");
    if (tc) tc.innerHTML = K.copRef.map(([T, c]) => `<tr><td class="num">${T} °C</td><td class="num">${nl(c, 2)}</td><td class="num">${nl(copModel(T), 2)}</td><td class="num">${nl((copModel(T) / c - 1) * 100)} %</td></tr>`).join("");
    const dorp = HE.dorp({}), dQ = dorp.opp * HE.warmte(E.tin).q;
    set("dorpQ", nl(dQ / 1000, 1)); set("dorpWp", nl(dorp.verw / 1000, 1)); set("dorpDir", nl(dQ / 1000, 1)); set("dorpExtra", nl((dQ - dorp.verw) / 1000, 1));
  }
  window.WPK = { perType, vatVerlies, copModel, bind };
})();
