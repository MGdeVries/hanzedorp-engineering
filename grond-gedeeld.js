/* grond-gedeeld.js – ruimtebehoefte en kosten grond & voorbereiding (window.GK); invoer: hanzedorp-data.js → grond */
(function () {
  const D = window.HANZEDORP_DATA, G = D.grond, E = D.energie, T = D.tuinvijver;
  const TYPES = ["gezin", "senior", "junior"];
  /* o: { mix, tuinPW, verhardPW, akkerM2, prijsLandHa, bouwgrondM2, aandeelBouwgrond, onvoorzien, scen: "min"|"std"|"max", verdeling } */
  function rekenen(o = {}) {
    const mix = o.mix || E.mix, nW = TYPES.reduce((a, t) => a + (mix[t] || 0), 0);
    const tuin = o.tuinPW != null ? o.tuinPW : T.tuinPerWoning, verh = o.verhardPW != null ? o.verhardPW : D.verhard.perWoningM2;
    // per type uit kavels [119]; schuif tuinPW/verhardPW schaalt de verhouding t.o.v. het gemiddelde
    const fT = T.tuinPerWoning ? tuin / T.tuinPerWoning : 1, fV = D.verhard.perWoningM2 ? verh / D.verhard.perWoningM2 : 1;
    const kavel = {}; TYPES.forEach(t => kavel[t] = G.bebouwd[t] + (G.tuinType ? G.tuinType[t] * fT : tuin) + (G.verhardType ? G.verhardType[t] * fV : verh));
    if (o.R) TYPES.forEach(t => kavel[t] = o.R.kavelTabel.find(k => k.t === t).kavel);   // ruimteprogramma per doel [161]
    const kavelsM2 = TYPES.reduce((a, t) => a + (mix[t] || 0) * kavel[t], 0);
    const gem = (o.R ? o.R.gemLijst : G.gemeenschappelijk).map(([n, m2, st]) => [n, n.startsWith("Akker") && o.akkerM2 != null ? o.akkerM2 : m2, st]);
    const gemM2 = gem.reduce((a, g) => a + g[1], 0);
    const totaalM2 = kavelsM2 + gemM2, ha = totaalM2 / 1e4;
    const akker = gem.find(g => g[0].startsWith("Akker"))[1], groen = gem.find(g => g[0].startsWith("Gezamenlijk groen"))[1], weg = gem.filter(g => /^(Rondweg|Paden|Wegen)/.test(g[0])).reduce((a, g) => a + g[1], 0);
    // grond
    const pLand = o.prijsLandHa != null ? o.prijsLandHa : G.landbouwgrondHa, pBouw = o.bouwgrondM2 != null ? o.bouwgrondM2 : G.bouwgrondM2;
    const fB = o.aandeelBouwgrond != null ? o.aandeelBouwgrond : G.aandeelBouwgrond;
    const grondKoop = (totaalM2 - fB * kavelsM2) / 1e4 * pLand + fB * kavelsM2 * pBouw;
    const ob = grondKoop * G.obGrond;
    // posten
    const bouwsom = TYPES.reduce((a, t) => a + (mix[t] || 0) * E.opp[t], 0) * G.bouwsomPerM2;
    const qty = { vast: 1, ha, sondering: G.sonderingen, m2plan: totaalM2 - akker, m_sleuf: G.sleufM, m2weg: weg, m2groen: groen, bouwsom };
    const scen = o.scen || "std";
    const regels = G.posten.map(([groep, post, sleutel, min, max, eenheid, st]) => {
      const p = scen === "min" ? min : scen === "max" ? max : (min + max) / 2, q = qty[sleutel];
      return { groep, post, eenheid, st, min: min * q, max: max * q, eur: p * q };
    });
    regels.unshift({ groep: "Grondverwerving", post: "Overdrachtsbelasting " + (G.obGrond * 100).toLocaleString("nl-NL") + " % (onbebouwde grond)", eenheid: "", st: "G", min: ob, max: ob, eur: ob });
    regels.unshift({ groep: "Grondverwerving", post: "Koopsom grond (" + (ha).toLocaleString("nl-NL", { maximumFractionDigits: 2 }) + " ha)", eenheid: "", st: fB ? "S" : "G", min: grondKoop, max: grondKoop, eur: grondKoop });
    const sub = regels.reduce((a, r) => a + r.eur, 0), onv = (o.onvoorzien != null ? o.onvoorzien : G.onvoorzien) * sub, totaal = sub + onv;
    const groepen = {}; regels.forEach(r => groepen[r.groep] = (groepen[r.groep] || 0) + r.eur);
    // verdeling per woning
    const verdeling = o.verdeling || "kavel", aandeel = {};
    TYPES.forEach(t => {
      aandeel[t] = verdeling === "gelijk" ? 1 / nW : verdeling === "woning" ? E.opp[t] / TYPES.reduce((a, u) => a + (mix[u] || 0) * E.opp[u], 0) : kavel[t] / kavelsM2;
    });
    const perWoning = {}; TYPES.forEach(t => perWoning[t] = totaal * aandeel[t]);
    return { nW, mix, kavel, kavelsM2, gem, gemM2, totaalM2, ha, regels, groepen, sub, onv, totaal, perWoning, gemPerWoning: totaal / nW, bouwsom, grondKoop, pLand, fB };
  }
  window.GK = { rekenen, TYPES, NAAM: { gezin: "Gezinswoning", senior: "Seniorenwoning", junior: "Jongerenwoning" } };
})();
