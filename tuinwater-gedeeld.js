/* =====================================================================
   tuinwater-gedeeld.js – standaardvarianten, bindings en lijngrafiek voor
   tuinwater.html en tuinwater-technisch.html (zwemvijver + tuinvijver)
   Vereist: hanzedorp-data.js, hanzedorp-weer.js, hanzedorp-model.js, hanzedorp-lib.js
   ===================================================================== */
(function () {
  const { D, A, MND, nl, bindAll } = HZ;
  const W = HM.W, Z = D.zwemvijver, T = D.tuinvijver;

  /* keuzelijsten */
  const OPT = {
    zwemA: [120, 150, 200, 300, 400, 500, 750],
    dak: [...new Set([0, 120, 200, Z.dakCarport, Z.dakCarport + Z.dakBuurthuis, 750, 1000])].sort((a, b) => a - b),
    tuinA: [100, 200, 300, 500, 750, 1000, 1500, 2000],
    tuinH: [0.5, 1.0, 1.5],
    tuinF: [0.25, 0.5, 1.0],
    ibc: [0, 2, 4],
    akker: [0, 0.1, 0.25, 0.5, 1.0]
  };
  const STD = { zwemA: 150, dak: Z.dakCarport + Z.dakBuurthuis, tankOverloop: false, tuinA: 500, tuinH: 1.0, tuinF: 0.5, ibc: 2, straat: false, akker: 0 };   // straatwater vervallen (besluit 26-10-2026 [52])

  /* dakwater naar de zwemvijver: extra hard dakvlak (C = 0,8) en/of overloop regenwatertanks */
  let ovTankCache = null;
  function ovTank() {
    if (!ovTankCache) { const v = HM.vraag({}); ovTankCache = HM.tank({ vraag: v.regenvraag("toiletWas"), tankPW: D.tankPerWoning }).overloopDag; }
    return ovTankCache;
  }
  function zwem(o) {
    const ov = new Float64Array(W.n), dak = o.dak || 0, t = o.tankOverloop ? ovTank() : null;
    for (let i = 0; i < W.n; i++) ov[i] = dak * D.dak.cHard * W.P[i] / 1000 + (t ? t[i] : 0);
    return HM.zwemvijver({ A: o.zwemA, overloopDag: ov });
  }
  function tuin(o) { return HM.tuinvijver({ A: o.tuinA, h: o.tuinH, f: o.tuinF, ibc: o.ibc, straat: o.straat, akkerHa: o.akker, tuinPW: o.tuinPW }); }

  const z0 = zwem(Object.assign({}, STD, { dak: 0 })), zS = zwem(STD), zC = zwem(Object.assign({}, STD, { dak: Z.dakCarport })), z200 = zwem(Object.assign({}, STD, { zwemA: 300, dak: 200 })), z100 = zwem(Object.assign({}, STD, { dak: 100 }));
  const t0 = tuin(STD), tZonder = tuin(Object.assign({}, STD, { straat: false })), tMet = tuin(Object.assign({}, STD, { straat: true }));
  const tAkker = tuin(Object.assign({}, STD, { tuinA: 1000, tuinH: 1.5, akker: 0.25 }));
  const yi = W.jaren.indexOf(2018);
  const leeg18 = t0.peil2018.findIndex(v => v <= 1e-9);
  const datum = i => { const d = new Date(Date.UTC(2018, 0, 1 + i)); return d.getUTCDate() + " " + ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"][d.getUTCMonth()]; };
  const m = v => nl(v, 2).replace(/0$/, "");

  function bind(extra = {}) {
    bindAll(Object.assign({
      zA: nl(STD.zwemA), zGem: m(z0.gem), zP90: m(z0.p90), zMax: m(z0.max), zMaxJ: z0.maxJaar, zB3: nl(z0.jarenBoven3), zB5: nl(z0.jarenBoven5),
      zSGem: m(zS.gem), zSP90: m(zS.p90), zSMax: m(zS.max), zSMaxJ: zS.maxJaar, zSB3: nl(zS.jarenBoven3), zCMax: m(zC.max), zDak: nl(STD.dak), zDakC: nl(Z.dakCarport), zDakB: nl(Z.dakBuurthuis),
      z2Gem: m(z200.gem), z2P90: m(z200.p90), z2Max: m(z200.max), z2B3: nl(z200.jarenBoven3),
      z1Gem: m(z100.gem), z1P90: m(z100.p90), z1Max: m(z100.max), z1B3: nl(z100.jarenBoven3),
      zRes: nl(Z.reserveBoek, 1), zResK: nl(Z.reserveKeuze, 1), zDiep: nl(Z.zwemDiepte, 1), zMin: nl(Z.minM2), zFow: nl(Z.fOpenWater, 2),
      tA: nl(STD.tuinA), tH: nl(STD.tuinH, 1), tF: nl(STD.tuinF * 100), tIbc: nl(STD.ibc),
      tGem: nl(t0.tuin.gem), tP10: nl(t0.tuin.p10), tMin: nl(t0.tuin.min), tMinJ: t0.tuin.minJaar,
      tZGem: nl(tZonder.tuin.gem), tMGem: nl(tMet.tuin.gem), tZMin: nl(tZonder.tuin.min), tZMinJ: tZonder.tuin.minJaar,
      tGroen: nl(Math.round(t0.groendak / 5) * 5), tStraat: nl(Math.round(t0.straat / 5) * 5), tRegen: nl(Math.round(t0.regen / 5) * 5),
      tVerd: nl(Math.round(t0.verdamping / 5) * 5), tVraag: nl(Math.round(t0.vraagTuin / 5) * 5), tOver: nl(Math.round(t0.overloop / 5) * 5),
      tVoor: nl(t0.voorraad), tLeeg18: leeg18 >= 0 ? datum(leeg18) : "–", t18: nl(t0.tuin.perJaar[yi]),
      aGem: nl(tAkker.akker.gem), aMin: nl(tAkker.akker.min), aMinJ: tAkker.akker.minJaar, aTGem: nl(tAkker.tuin.gem), aVraag: nl(Math.round(tAkker.vraagAkker / 10) * 10),
      tuinPW: nl(T.tuinPerWoning), tuinTot: nl(T.tuinPerWoning * HM.nW), groenM2: nl(T.groendakM2, 1), smax: nl(T.smax), raw: nl(T.raw), kc: nl(T.kc, 1), tFow: nl(T.fOpenWater, 2),
      bergCmMin: nl(A.bergingMinM3 / STD.tuinA * 100), bergCm: nl(A.bergingMaxM3 / STD.tuinA * 100)
    }, extra));
  }

  /* lijngrafiek van een dagreeks over één jaar */
  function lijn(el, vals, { unit = "", min, max, ref, invert = false, kleur = "var(--water)", nul } = {}) {
    const Wd = 580, H = 220, L = 46, R = 10, Tp = 18, B = 28, pw = Wd - L - R, ph = H - Tp - B;
    const lo = min != null ? min : Math.min(...vals, 0), hi = max != null ? max : Math.max(...vals);
    const y = v => Tp + ph - ph * (v - lo) / ((hi - lo) || 1);
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img">`;
    for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4; s += `<line x1="${L}" x2="${Wd - R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="sm mono">${nl(v, Math.abs(hi - lo) < 3 ? 2 : 0)}</text>`; }
    s += `<text x="${L}" y="${Tp - 6}" class="sm">${unit}</text>`;
    let d = 0; for (let k = 0; k < 12; k++) { s += `<text x="${L + pw * (d + 15) / vals.length}" y="${H - 8}" text-anchor="middle" class="sm">${MND[k]}</text>`; d += HZ.DAGEN[k]; }
    if (ref != null) s += `<line x1="${L}" x2="${Wd - R}" y1="${y(ref)}" y2="${y(ref)}" style="stroke:var(--warn);stroke-dasharray:4 4"/>`;
    const pts = vals.map((v, i) => `${(L + pw * (i + 0.5) / vals.length).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    s += `<polyline points="${pts}" style="fill:none;stroke:${kleur};stroke-width:2"/>`;
    if (nul) vals.forEach((v, i) => { if (nul(v)) s += `<rect x="${(L + pw * i / vals.length).toFixed(1)}" y="${Tp + ph - 4}" width="${(pw / vals.length + 0.3).toFixed(1)}" height="4" style="fill:var(--warn)"/>`; });
    el.innerHTML = s + "</svg>";
  }

  window.TW = { OPT, STD, zwem, tuin, bind, lijn, z0, t0 };
})();
