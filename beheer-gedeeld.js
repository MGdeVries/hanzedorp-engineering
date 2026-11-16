/* =====================================================================
   beheer-gedeeld.js – meerjarenonderhoudsplan (MJOP) en financiële planning
   van de gedeelde voorzieningen (window.BH)
   Vereist: hanzedorp-data.js (beheer, financien, grond.ruimteR), hanzedorp-project.js
   Methode (alle bedragen excl. btw tenzij vermeld; prijspeil startjaar):
   - Investering I_c = hoeveelheid × eenheidsprijs (laag / midden / hoog).
   - Jaarlijks onderhoud O_c = I_c · p_c + vast_c · hoeveelheid, geïndexeerd met (1+i)^t.
   - Vervanging in jaar t = k·L_c (k ≥ 1, t ≤ horizon): I_c · (1+i)^t.
   - Reservefonds F_t = F_{t−1}·(1+r) + C·(1+i)^t − V_t, met F_0 = buffer.
     C = kleinste constante (geïndexeerde) jaarstorting waarbij F_t ≥ buffer voor alle t (bisectie).
   - Annuïteit A = L · r / (1 − (1+r)^−n).
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, B = D.beheer, F = D.financien;
  function hoeveelheden(o = {}) {
    const R = D.grond.ruimteR, m = id => R.items.filter(x => x.id === id).reduce((a, x) => a + x.m2, 0);
    const vl = (D.energie.scenarioC && D.energie.scenarioC.vlakken) || [];
    const pv = D.akker.pv, agri = pv.rijen * Math.floor(pv.rijLengte / pv.paneelB) * pv.wp / 1000;
    const nW = R.kpi.nW;
    return {
      vast: 1, woningen: nW, laadpalen: Math.max(nW, (D.mobiliteit && D.mobiliteit.carport && D.mobiliteit.carport.plekken) || nW),
      pvKWp: vl.reduce((a, v) => a + v.kWp, 0) + agri, pvAgri: agri,
      pvDakKWp: ["gezin", "senior", "junior"].reduce((a, t) => a + ((D.energie.mix || {})[t] || 0) * ((D.energie.kWpDak || {})[t] || 0), 0),
      accuKWh: o.accuKWh != null ? o.accuKWh : D.energie.accu.kWh,
      molens: o.molens != null ? o.molens : Math.round(m("molens") / D.grond.ruimte.erfmolenM2),
      sleufM: D.grond.sleufM, drinkM: B.drinkM,
      digitaal: D.digitaal.stuk.reduce((a, s) => a + s.eur, 0),
      buurthuisM2: m("buurthuis"), schurenM2: m("schuren"), carportDakM2: m("carport"),
      akkerM2: o.akkerM2 != null ? o.akkerM2 : D.akker.startM2,
      zwemM2: m("zwem"), tuinvijverM2: m("tuinvijver"), wadiM2: m("wadi"),
      wegM2: m("rondweg"), grasM2: m("rondweg-gras"), padenM2: m("paden"),
      groenM2: m("groen") + m("berm") + m("singel")
    };
  }
  const prijs = (min, max, scen) => scen === "min" ? min : scen === "max" ? max : (min + max) / 2;

  /* o: { scen, inflatie, renteFonds, buffer, horizon, levensduurFactor, accuKWh, molens, akkerM2, uit:[ids] } */
  function mjop(o = {}) {
    const q = hoeveelheden(o); q.pvOmvKWp = q.pvKWp + q.pvDakKWp; const scen = o.scen || "std", i = o.inflatie != null ? o.inflatie : B.inflatie, r = o.renteFonds != null ? o.renteFonds : B.renteFonds;
    const N = o.horizon || B.horizon, buf = o.buffer != null ? o.buffer : B.bufferEur, fL = o.levensduurFactor || 1, uit = o.uit || [];
    const comp = B.componenten.filter(c => !uit.includes(c[0])).map(([id, naam, groep, sl, eenh, pmin, pmax, L, pct, vast, st, bron]) => {
      const n = q[sl] || 0, inv = n * prijs(pmin, pmax, scen), Lx = L ? Math.max(1, Math.round(L * fL)) : 0;
      const ond = inv * pct + vast * n;
      const jaren = []; if (Lx) for (let t = Lx; t <= N; t += Lx) jaren.push(t);
      return { id, naam, groep, n, eenh, pmin, pmax, inv, L: Lx, pct, vast, ond, st, bron, jaren, inGrond: B.inGrond.includes(id), afschr: Lx ? inv / Lx : 0 };
    });
    const V = Array(N + 1).fill(0), O = Array(N + 1).fill(0);
    for (let t = 1; t <= N; t++) { const ix = Math.pow(1 + i, t);
      comp.forEach(c => { O[t] += c.ond * ix; if (c.jaren.includes(t)) V[t] += c.inv * ix; }); }
    const sim = C => { const Fd = [buf]; let min = buf;
      for (let t = 1; t <= N; t++) { Fd[t] = Fd[t - 1] * (1 + r) + C * Math.pow(1 + i, t) - V[t]; if (Fd[t] < min) min = Fd[t]; } return { Fd, min }; };
    let lo = 0, hi = Math.max(1, V.reduce((a, v) => a + v, 0)); for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (sim(mid).min >= buf) hi = mid; else lo = mid; }
    const C = hi, fonds = sim(C).Fd;
    const inv = comp.reduce((a, c) => a + c.inv, 0), invNieuw = comp.filter(c => !c.inGrond).reduce((a, c) => a + c.inv, 0);
    const afschr = comp.reduce((a, c) => a + c.afschr, 0), ondJaar = comp.reduce((a, c) => a + c.ond, 0);
    const groepen = {}; comp.forEach(c => { const g = groepen[c.groep] || (groepen[c.groep] = { inv: 0, ond: 0, afschr: 0 }); g.inv += c.inv; g.ond += c.ond; g.afschr += c.afschr; });
    const tienJaar = V.slice(1, 11).reduce((a, v) => a + v, 0);
    return { q, comp, V, O, fonds, C, inv, invNieuw, afschr, ondJaar, groepen, N, i, r, buf, tienJaar, nW: q.woningen,
      minVvE: 0.005 * inv, perWoningMnd: (C + ondJaar) / q.woningen / 12 };
  }

  /* financiële planning. o: mjop-opties + { financiering, eigenInbreng, renteLening, looptijd, btwAftrek, tuinder, grondTotaal } */
  function financien(o = {}) {
    const M = mjop(o), nW = M.nW, N = M.N, i = M.i;
    const btwF = (o.btwAftrek != null ? o.btwAftrek : F.btwAftrek) ? 1 : 1 + F.btw;
    const grond = o.grondTotaal != null ? o.grondTotaal : (window.GK ? GK.rekenen({ R: D.grond.ruimteR }).totaal : 0);
    const voorz = M.invNieuw * btwF, startFonds = M.buf, inv = grond + voorz + startFonds;
    const fin = o.financiering || F.financiering, ei = o.eigenInbreng != null ? o.eigenInbreng : F.eigenInbreng;
    const rl = o.renteLening != null ? o.renteLening : F.renteLening, n = o.looptijd || F.looptijd;
    const lening = fin === "vereniging" ? inv * (1 - ei) : 0, ann = lening ? lening * rl / (1 - Math.pow(1 + rl, -n)) : 0;
    const dig = D.digitaal.maand.filter(x => x.basis).reduce((a, x) => a + x.eur, 0) * 12;
    const tuin = o.tuinder != null ? o.tuinder : F.tuinder.aan;
    const vaste = [
      ["Onderhoud en keuringen (MJOP)", M.ondJaar * btwF, "A"],
      ["Storting reservefonds (vervangingen)", M.C * btwF, "A"],
      ["Internet, tweede lijn, back-up en netwerkbeheer", dig, "B/N"],
      ["Verzekering opstal en aansprakelijkheid", F.verzekeringPct * (voorz + grond * 0), "S"],
      ["Administratie, bank, ledenadministratie", F.administratie, "S"],
      ["Vastrecht drinkwater hoofdaansluiting", F.drinkwaterVast, "S"],
      ["Stroom: saldo netaansluiting 3 × 25 A (export − inkoop − netkosten)", -F.netSaldo, "A"]
    ];
    if (tuin) vaste.push(["Tuinder (± 0,5 fte, inhuur)", F.tuinder.eur, "S"]);
    if (ann) vaste.push(["Rente en aflossing lening vereniging (annuïteit)", ann, "A"]);
    const jaarlast = vaste.reduce((a, v) => a + v[1], 0);
    // kasstroom vereniging over de horizon: bijdragen dekken exploitatie (geïndexeerd) + storting + annuïteit
    const rows = []; let kas = 0.25 * (jaarlast - ann);   // N startkas: 3 maanden exploitatie
    const kas0 = kas;
    let restLening = lening;
    for (let t = 1; t <= N; t++) {
      const ix = Math.pow(1 + i, t - 1);
      const expl = (jaarlast - ann - M.C * btwF) * ix, stort = M.C * btwF * Math.pow(1 + i, t), a = t <= n ? ann : 0;
      const rente = restLening * rl, afl = a ? a - rente : 0; restLening = Math.max(0, restLening - afl);
      const bijdrage = expl + stort + a;
      const fonds = M.fonds[t] * btwF;
      rows.push({ t, jaar: B.startJaar + t, expl, stort, ann: a, rente, afl, bijdrage, fonds, vervanging: M.V[t] * btwF, kas, restLening,
        dscr: a ? (bijdrage - expl - stort) / a : null, perWoningMnd: bijdrage / nW / 12 });
    }
    const aandeel = inv / nW, leenDeel = aandeel * (1 - ei), annPW = leenDeel * rl / (1 - Math.pow(1 + rl, -n));
    const finPerWoningMnd = fin === "vereniging" ? ann / nW / 12 : annPW / 12;   // bij 'hypotheek' indicatief: buiten de vereniging, in de eigen woonlasten
    const fondsMin = Math.min(...M.fonds) * btwF;
    const zonderOns = F.vraagMWh * 1000 * F.stroomprijs;       // wat de bewoners zonder eigen opwek aan stroom zouden kopen
        return { M, nW, grond, voorz, startFonds, inv, fin, ei, lening, ann, rl, n, vaste, jaarlast, rows, kas0, perWoningMnd: jaarlast / nW / 12,
      perWoningInv: inv / nW, finPerWoningMnd, fondsMin, leenDeel, eigenPerWoning: inv * (fin === "vereniging" ? ei : 1) / nW, zonderOns, btwF, tuin,
      kpi: { liquiditeitMnd: kas0 / ((jaarlast - ann) / 12), dekking10: (M.fonds[0] + M.C * 10) / Math.max(1, M.tienJaar), schuldPerWoning: lening / nW,
        solvabiliteit: lening ? (M.buf * btwF) / (M.buf * btwF + lening) : 1, dscrMin: ann ? 1 : null } };
  }
  window.BH = { hoeveelheden, mjop, financien };
})();
