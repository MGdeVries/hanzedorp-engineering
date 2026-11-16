/* =====================================================================
   energie-gedeeld.js – standaardresultaten en bindings voor bewoners-, energie- en mobiliteitspagina's (window.EG)
   ===================================================================== */
(function () {
  const { D, nl, bindAll } = HZ, E = D.energie, MOB = D.mobiliteit;
  const inv = window.HI ? HI.lees() : null, heeftInv = !!(inv && inv.woningen.length);
  const MW = v => nl(v / 1000, v < 10000 ? 1 : 0);
  const r10 = v => nl(Math.round(v / 10) * 10), r100 = v => nl(Math.round(v / 100) * 100);
  let _std = null; const std = () => _std || (_std = HE.simuleer({}));
  let _mol = null;
  const molens = () => _mol || (_mol = [0, 1].map(n => ({ n, s: HE.simuleer({ wind: n }) })));   // besluit 16-11-2026 [173]: 0 of 1 erfmolen
  /* aantal molens waarbij de winter (nov–feb) energetisch rond is: lineair geïnterpoleerd, afgerond (tolerantie 0,1 molen) */
  function molensVoorWinter() {
    const m = molens();
    for (let i = 0; i < m.length; i++) if (m[i].s.winterDekking >= 1) return m[i].n;
    return "meer dan 1";
  }
  function bind(extra = {}) {
    const s = std(), d = s.d, w20 = HE.warmte(20), wT = HE.warmte(E.tin), ws = HE.windStat(), c = HE.cellen();
    const p0 = HE.dorp({ levensfase: "start" }).pers, p10 = HE.dorp({ levensfase: "p10" }).pers, p20 = HE.dorp({ levensfase: "p20" }).pers;
    const thuisSom = E.koel.thuisGroot.koel + E.koel.thuisGroot.vries, celE = d.cel ? d.cel.e : HE.dorp({ koel: "centraal" }).cel.e, celW = d.cel && d.cel.hv ? d.cel.hv.warm : c.warm;
    const koelThuis = d.nW * (thuisSom + E.koel.extraWinterThuis), koelCentr = d.nW * thuisSom + celE;
    bindAll(Object.assign({
      nW: nl(d.nW), pers0: nl(p0), pers10: nl(p10), pers20: nl(p20), mixG: nl(E.mix.gezin), mixS: nl(E.mix.senior), mixJ: nl(E.mix.junior),
      tin: nl(E.tin), qh20: nl(E.qh20), qhTin: nl(wT.q, 1), ehTin: nl(wT.e, 1), qhPct: nl((wT.q / w20.q - 1) * 100), scop: nl(wT.scop, 1), dTint: nl(E.dTint),
      oppG: nl(E.opp.gezin), oppS: nl(E.opp.senior), oppJ: nl(E.opp.junior),
      totG: r100(d.per.gezin.huis), totS: r100(d.per.senior.huis), totJ: r100(d.per.junior.huis),
      mobG: r100(d.per.gezin.mob), mobS: r100(d.per.senior.mob), mobJ: r100(d.per.junior.mob),
      verwG: r10(d.per.gezin.verw), verwS: r10(d.per.senior.verw), verwJ: r10(d.per.junior.verw),
      dorpHuis: MW(d.huis), dorpMob: MW(d.mob), dorpVraag: MW(s.vraag), opwek: MW(s.opwek), dekking: nl(s.dekking * 100), zelf: nl(s.zelf * 100),
      imp: MW(s.imp), exp: MW(s.exp), impMax: MW(s.impMax), pImp: nl(s.pImp), pExp: nl(s.pExp),
      zonMWh: MW(s.zon), agriMWh: MW(s.agri), windMWh: MW(s.wind), kWpDak: nl(s.kWpDak), kWpAgri: nl(s.kWpAgri, 1), pvExtra: nl(E.pvExtraKWp),
      nWind: nl(s.nWind), windTxt: s.nWind ? (s.nWind === 1 ? "één erfmolen" : nl(s.nWind) + " erfmolens") : "zonder erfmolen",
      winterTxt: molens()[0].s.winterDekking >= 1 ? "Ook zonder erfmolen is de winter energetisch rond (" + nl(molens()[0].s.winterDekking * 100) + " %)." : "Zonder erfmolen dekken we de winter voor " + nl(molens()[0].s.winterDekking * 100) + " %, met één erfmolen voor " + nl(molens()[1].s.winterDekking * 100) + " %.",
      accu: nl(E.accu.kWh), accuKW: nl(E.accu.kW),
      winterDekking: nl(s.winterDekking * 100), winterZelf: nl(s.winterZelf * 100), molensWinter: String(molensVoorWinter()),
      windGem: MW(ws.gem), windMin: MW(ws.min), windMinJ: ws.minJaar, windMax: MW(ws.max), windMaxJ: ws.maxJaar, windCf: nl(ws.cf * 100),
      windVoor: MW(ws.voor2010), windNa: MW(ws.vanaf2010), fabMin: MW(E.wind.fabrikantMin), fabMax: MW(E.wind.fabrikantMax),
      windPct: nl(ws.gem / ((E.wind.fabrikantMin + E.wind.fabrikantMax) / 2) * 100),
      celE: r10(celE), celWarm: r100(celW), celPct: nl(s.cel ? (1 - s.celGedwongen / s.cel) * 100 : 0), extraWinter: nl(E.koel.extraWinterThuis), celLit: r100(c.lit), celL: nl(c.nuttigL), koelThuis: r100(koelThuis), koelCentr: r100(koelCentr), koelWinst: r100(koelThuis - koelCentr),
      koelGroot: nl(thuisSom), koelKlein: nl(E.koel.thuisKlein),
      evMWh: MW(s.ev), evZon: nl((1 - s.evGedwongen / s.ev) * 100), pLaad: nl(s.pLaad), nZappi: nl(MOB.zappi.n), zappiKW: nl(MOB.zappi.kW), autoAC: nl(MOB.zappi.autoAC),
      slechtst: MW(s.slechtst.kWh), slechtstDatum: s.slechtst.start.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
      invStatus: heeftInv ? `${inv.woningen.length} woningen ingevuld` : "nog niet ingevuld"
    }, extra));
  }
  /* horizontale staven met waardelabel; items: [label, waarde, kleur?] */
  function hbars(el, items, { unit = "", dec = 0, color = "var(--water)", max } = {}) {
    const W = 580, L = 150, R = 70, rh = 26, H = items.length * rh + 8, m = max || Math.max(...items.map(i => i[1]), 1e-9);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
    items.forEach(([lb, v, c], i) => { const y = 4 + i * rh, w = Math.max(0, (W - L - R) * v / m);
      s += `<text x="${L - 8}" y="${y + 16}" text-anchor="end" class="sm">${lb}</text><rect x="${L}" y="${y + 4}" width="${w}" height="${rh - 9}" rx="2" style="fill:${c || color}"><title>${lb}: ${nl(v, dec)} ${unit}</title></rect>` +
           `<text x="${L + w + 6}" y="${y + 16}" class="sm mono">${nl(v, dec)} ${unit}</text>`; });
    el.innerHTML = s + "</svg>";
  }
  window.EG = { hbars, std, molens, molensVoorWinter, bind, inv: heeftInv ? inv : null, MW };
})();
