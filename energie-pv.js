/* Hanzedorp – energieopwek: opbrengst per plek en verdeling van het gebruik (basis- en technische pagina) */
(function () {
  const PLEKKEN = [   // [naam, helling °, azimut ° (180 = zuid), bifaciaal-factor]
    ["Plat dak (0°)", 0, 180, 0], ["Dak zuid 35°", 35, 180, 0], ["Dak zuid 60°", 60, 180, 0], ["Dak oost-west 15° (oostzijde)", 15, 90, 0],
    ["Carportdak zuid 10°", 10, 180, 0], ["Gevel/wand zuid, loodrecht", 90, 180, 0], ["Akker loodrecht oost-west, dubbelzijdig", 90, 90, 0.7]];
  const WIN = [10, 11, 0, 1], ZOM = [4, 5, 6, 7];
  let _cache = null;
  function opbrengst() {
    if (_cache) return _cache;
    const W = HM.W, E = HANZEDORP_DATA.energie;
    let nj = 0; const jaren = new Set(); for (let i = 0; i < W.n; i++) if (W.Y[i] !== 1998) jaren.add(W.Y[i]); nj = jaren.size;
    return (_cache = PLEKKEN.map(([n, b, a, bif]) => {
      const v = HM.pvVlak(b, a, bif, E.pvDakPR || 0.85); let j = 0, w = 0, z = 0;
      for (let i = 0; i < W.n; i++) { if (W.Y[i] === 1998) continue; const d = v[i].reduce((x, y) => x + y, 0); j += d; if (WIN.includes(W.M[i])) w += d; if (ZOM.includes(W.M[i])) z += d; }
      return { n, b, a, bif, jaar: j / nj, winter: w / nj, zomer: z / nj };
    }));
  }
  function gebruik(s) {
    const d = s.d, rest = s.vraag - (d.mob + d.app + d.verw + d.ww + d.wit + d.koel + d.wtw + d.werkplaats + d.buurthuis);
    return [["Auto's", d.mob, "var(--clay)"], ["Apparaten, koken", d.app], ["Verwarming", d.verw], ["Wassen, afwassen", d.wit], ["Warm water", d.ww],
            ["Werkplaats", d.werkplaats], ["Koelen thuis", d.koel], ["Ventilatie (WTW)", d.wtw], ["Buurthuis", d.buurthuis], ["Overig", Math.max(0, rest)]];
  }
  function render({ D, nl, $, s, hbars }) {
    const c = D.mobiliteit.carport;
    if ($("kMob")) $("kMob").textContent = nl(s.d.mob / s.vraag * 100);
    if ($("cpDak")) $("cpDak").textContent = nl(c.dakKWp, 1);
    if ($("cpWand")) $("cpWand").textContent = nl(c.wandKWp, 1);
    if ($("vraagChart")) hbars($("vraagChart"), gebruik(s).map(([n, v, k]) => [n, v / 1000, k]), { unit: "MWh", dec: 1, color: "var(--muted)" });
    if ($("tblPV")) $("tblPV").querySelector("tbody").innerHTML = opbrengst().map(r =>
      `<tr><td>${r.n}</td><td class="num">${nl(r.jaar)}</td><td class="num">${nl(r.winter)}</td><td class="num">${nl(r.zomer)}</td><td class="num">${nl(r.winter / r.zomer * 100)} %</td></tr>`).join("");
  }
  window.EPV = { PLEKKEN, opbrengst, gebruik, render };
})();
