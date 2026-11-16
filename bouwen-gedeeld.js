/* =====================================================================
   bouwen-gedeeld.js – zonnestand 21 december, schaduwafstand en kavelpaspoort (window.BW)
   Vereist: hanzedorp-data.js (bouwen, grond, energie, veiligheid)
   Zonnestand (zonnetijd, uurhoek H = 15°·(t − 12)):
     sin h = sin φ · sin δ + cos φ · cos δ · cos H
     cos A = (sin δ − sin h · sin φ) / (cos h · cos φ),  A gemeten vanaf noord; afwijking van zuid a = 180° − A
   Schaduw van een punt op hoogte z boven het ontvangstvlak: lengte L = z / tan h;
     noord-zuidcomponent L_NZ = z · cos a / tan h;  oost-westcomponent L_OW = z · sin a / tan h
   Nokhoogte (zadeldak, nok oost-west): z_nok = goot + (diepte / 2) · tan(helling)
   Vereiste vrije afstand tussen noordgevel van de zuidelijke woning en zuidgevel van de noordelijke woning:
     d = (z_nok − h_ontvanger) · k_NZ − diepte / 2,   k_NZ = max over het venster van cos a / tan h
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, B = D.bouwen, r = Math.PI / 180;
  function zon(uur, lat = B.lat, dec = B.declinatie) {
    const H = 15 * (uur - 12), phi = lat * r, d = dec * r;
    const sh = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H * r), h = Math.asin(sh);
    const cA = (Math.sin(d) - Math.sin(h) * Math.sin(phi)) / (Math.cos(h) * Math.cos(phi));
    const a = 180 - Math.acos(Math.max(-1, Math.min(1, cA))) / r;          // afwijking van zuid (°)
    return { uur, h: h / r, a, kNZ: Math.cos(a * r) / Math.tan(h), kOW: Math.sin(a * r) / Math.tan(h) };
  }
  const UREN = [[12], [11, 12, 13], [10, 11, 12, 13, 14]];
  function k(venster = B.venster.std) { return Math.max(...UREN[venster].map(u => zon(u).kNZ)); }
  function nok(t, o = {}) { const x = Object.assign({}, B.type[t], o); return x.goot + x.diepte / 2 * Math.tan(x.helling * r); }
  function afstand(t, o = {}) {
    const x = Object.assign({}, B.type[t], o), kk = k(o.venster != null ? o.venster : B.venster.std), z = nok(t, o) - (o.ontvanger != null ? o.ontvanger : B.ontvanger);
    return Math.max(0, z * kk - x.diepte / 2);
  }
  /* verkavelingsprincipe: hoge woningen (gezin) in de noordelijke rij, lage woningen (senior, jongere) zuidelijk;
     beschikbare tussenruimte = zuidtuin noordrij + wegzone + noordstrook zuidrij (woning zuidrij aan de zuidkant van de kavel) */
  function verkaveling(o = {}) {
    const G = B.type.gezin, rb = o.rand != null ? o.rand : B.randBinnen;
    const weg = D.veiligheid.weg.breedte + 2 * ((D.grond.ruimte || {}).bermBreedte || 1);
    const zuidtuinNoord = G.kavelD - rb - G.diepte;
    return ["senior", "junior"].map(t => { const T = B.type[t], nodig = afstand(t, o), beschikbaar = zuidtuinNoord + weg + (T.kavelD - rb - T.diepte);
      return { t, nodig, beschikbaar, past: beschikbaar >= nodig, zuidtuinNoord, weg, noordstrook: T.kavelD - rb - T.diepte }; })
      .concat([{ t: "gezin", nodig: afstand("gezin", o), beschikbaar: null, past: null }]);
  }
  function paspoort(t) {
    const T = B.type[t], G = D.grond, kavel = G.kavel[t], kWp = (D.energie.kWpDak || {})[t] || 0;
    const bouwvlak = Math.max(0, (T.kavelB - 2 * B.randBinnen) * (T.kavelD - 2 * B.randBinnen));
    return { t, kavel, maat: T.kavelB + " × " + T.kavelD + " m", bouwvlak, bebouwd: G.bebouwd[t], lagen: T.lagen, goot: T.goot, nok: nok(t), kWp,
      opp: D.energie.opp[t], installatie: t === "gezin" ? B.installatieruimte.gezin : B.installatieruimte.min, afstand: afstand(t) };
  }
  window.BW = { zon, k, nok, afstand, verkaveling, paspoort, UREN };
})();
