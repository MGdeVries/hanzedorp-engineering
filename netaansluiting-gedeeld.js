/* netaansluiting-gedeeld.js – gedeelde functies voor netaansluiting.html en netaansluiting-technisch.html (window.NA) */
(function () {
  const D = window.HANZEDORP_DATA, N = D.net, nl = HZ.nl;
  const eur = v => (v < 0 ? "− € " : "€ ") + nl(Math.abs(Math.round(v)));
  const MWh = v => nl(v / 1000, 1);
  const naam = A => "3 × " + A + " A";
  function std() { return { accu: N.accu, accuKW: N.accuKW, reserve: N.reserve, opslagIn: N.opslagIn, opslagUit: N.opslagUit, verkoopDrempel: N.verkoopDrempel, verkoopFactor: N.verkoopFactor, slijtage: N.slijtage, handel: !!N.handel, ebIntern: false }; }   // besluit 27-10-2026: handel uit; geen EB intern bij mandelig eigendom bewoners (Hof Den Bosch 2025 [105]), risico zichtbaar via schakelaar
  /* alle aansluitwaarden; ebIntern = EB op levering binnen het privénet (fiscaal risico) */
  function rekenen(p) {
    const rs = HN.vergelijk(p).map(r => { const extra = p.ebIntern ? HN.ebIntern(r) : 0; return Object.assign(r, { ebInt: extra, netto: r.saldo - extra }); });
    // 3×35A en 3×40A kosten hetzelfde: 35A valt af als 40A beter of gelijk is
    let best = rs[0]; rs.forEach(r => { if (r.netto > best.netto) best = r; });
    return { rs, best };
  }
  function bind(map) { document.querySelectorAll("[data-k]").forEach(el => { const k = el.dataset.k; if (map[k] != null) el.textContent = map[k]; }); }
  window.NA = { std, rekenen, eur, MWh, naam, bind };
})();
