/* =====================================================================
   bouwnetbeheerder.js – genereert netbeheerder-data.js (window.HANZEDORP_NETBEHEERDER)
   Gebruik:  node bouwnetbeheerder.js   (opnieuw draaien na model- of datawijziging)
   Wat: uursimulatie over alle weerjaren (KNMI Heino) met een aansluiting van 3 × 25 A, begrensd in
   afname én teruglevering; per scenario de afname, teruglevering, afgeschakelde opwek, piekvermogens en
   tekorturen; plus een uurreeks van het jaar met de meeste afname (voor controle door de netbeheerder).
   Besluit 18-11-2026 [202]: pagina 'Wat vragen we van de netbeheerder?'.
   ===================================================================== */
const B = __dirname + "/";
global.window = global;
["hanzedorp-data.js", "hanzedorp-projecten.js", "hanzedorp-project.js", "hanzedorp-dagbalans.js", "hanzedorp-weer.js", "hanzedorp-zon.js", "hanzedorp-wind.js",
  "hanzedorp-model.js", "hanzedorp-lib.js", "hanzedorp-voorraad.js", "hanzedorp-energie.js"].forEach(f => require(B + f));
const D = HANZEDORP_DATA, E = D.energie;
const A = 25, kW = 3 * 230 * A / 1000;                                   // 17,25 kW
const C = { kWpDakType: E.scenarioC.kWpDakType, pvVlakken: E.scenarioC.vlakken, accuKW: 150, reserve: 0.3, accu: 600 };   // zelfde opzet als de stresstest op netaansluiting.html
const V = [
  ["std", "Normaal (bij de start)", {}],
  ["max", "Maximaal aantal bewoners", { levensfase: "max" }],
  ["thuis", "Maximaal, iedereen werkt thuis", { levensfase: "max", thuiswerk: "alles" }],
  ["wind0", "Maximaal, zonder erfmolen", { levensfase: "max", wind: 0 }],
  ["blok", "Maximaal, één accukast uitgevallen (2 × 200 kWh)", { levensfase: "max", accu: 400, accuKW: 100 }],
  ["uit", "Maximaal, hele buurtaccu uitgevallen", { levensfase: "max", accu: 0, accuKW: 0 }]
];
const r1 = v => Math.round(v * 10) / 10;
const CR = D.ems.congestieregel, KD = CR.duursteUren, KG = CR.goedkoopsteUren;
/* congestie-uren uit de EPEX day-ahead-prijzen [206]/[207]: per dag de KD duurste uren (afname geblokkeerd) en de KG goedkoopste uren (injectie geblokkeerd).
   Dagen zonder prijsreeks (vóór 2023): gemiddeld prijsprofiel per kalendermaand (2023–2026) als benadering. */
require(B + "hanzedorp-prijs.js");
const PR = HANZEDORP_PRIJS, P0 = Date.UTC(2023, 0, 1), T0 = Date.UTC(1994, 0, 1), OFF = Math.round((P0 - T0) / 864e5), ND = Math.floor(PR.p.length / 24);
const rang = arr => arr.map((v, h) => [v, h]).sort((x, y) => y[0] - x[0]).map(x => x[1]);
const mSom = Array.from({ length: 12 }, () => Array(24).fill(0)), mN = Array.from({ length: 12 }, () => Array(24).fill(0));
const dagDuur = [], dagGoed = [];
for (let d = 0; d < ND; d++) { const m = new Date(P0 + d * 864e5).getUTCMonth(), p = [];
  for (let h = 0; h < 24; h++) { const v = PR.p[d * 24 + h]; p.push(v == null ? null : v / 1e5); if (v != null) { mSom[m][h] += v / 1e5; mN[m][h]++; } }
  if (p.some(v => v == null)) { dagDuur.push(null); dagGoed.push(null); continue; }
  const r = rang(p); dagDuur.push(new Set(r.slice(0, KD))); dagGoed.push(new Set(r.slice(24 - KG))); }
const mProf = mSom.map((s, m) => s.map((v, h) => v / mN[m][h])), mDuur = mProf.map(p => new Set(rang(p).slice(0, KD))), mGoed = mProf.map(p => new Set(rang(p).slice(24 - KG)));
const maandVan = i => new Date(T0 + i * 864e5).getUTCMonth();
const isDuur = (i, h) => { const d = i - OFF; return (d >= 0 && d < ND && dagDuur[d]) ? dagDuur[d].has(h) : mDuur[maandVan(i)].has(h); };
const isGoed = (i, h) => { const d = i - OFF; return (d >= 0 && d < ND && dagGoed[d]) ? dagGoed[d].has(h) : mGoed[maandVan(i)].has(h); };
const prijsUur = (i, h) => { const d = i - OFF; if (d < 0 || d >= ND) return null; const v = PR.p[d * 24 + h]; return v == null ? null : v / 1e5; };
const injBlok = CR.injectie === "duurste" ? isDuur : isGoed;
/* hoe vaak valt het duurste uur in 16–21 uur? (laat zien dat het tijdstip per dag verschuift) */
let nDag = 0, inAvond = 0; const telUur = Array(24).fill(0);
dagDuur.forEach(s => { if (!s) return; nDag++; let k = 0; s.forEach(h => { telUur[h]++; if (h >= 16 && h < 21) k++; }); inAvond += k / KD; });
const winter = [10, 11, 0, 1], gemW = hs => { let s = 0, n = 0; winter.forEach(m => hs.forEach(h => { s += mProf[m][h]; n++; })); return s / n; };
const prijs = { uur: mProf.map(p => p.map(v => Math.round(v * 10000) / 10000)), avond: gemW([16, 17, 18, 19, 20]), nacht: gemW([0, 1, 2, 3, 4, 5]), periode: "nov–feb, " + PR.d0.slice(0, 4) + "–2026",
  pctDuurInAvond: Math.round(inAvond / nDag * 100), duurUurVerdeling: telUur, nDagen: nDag };
const PJ = [2023, 2024, 2025];                                              // jaren met weer én prijzen
const pj = (s, k) => PJ.reduce((a, y) => a + (s.perJaar.find(r => r.jaar === y) || {})[k], 0) / PJ.length;
const sc = V.map(([id, naam, o]) => {
  const s = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, meetImp: isDuur, meetExp: injBlok, prijs: prijsUur }, o));
  const a = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, blokImp: isDuur, blokExp: injBlok, prijs: prijsUur }, o));   // met congestieregel
  const a2 = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, blokImp: isDuur, blokExp: CR.injectie === "duurste" ? isGoed : isDuur }, o));   // variant voor injectie
  const vrij = HE.simuleer(Object.assign({}, C, { netKW: kW }, o));      // teruglevering zonder begrenzing: hoeveel zou er het net op willen?
  return { id, naam, imp: Math.round(s.imp), exp: Math.round(s.exp), afg: Math.round(s.afgeschakeld), pImp: r1(s.pImp), pExp: r1(s.pExp), pExpVrij: r1(vrij.pExp),
    uImp: Math.round(s.uImp), uTek: Math.round(s.uTekort), pTek: r1(s.pTekort), impMax: Math.round(s.impMax), vraag: Math.round(s.vraag), opwek: Math.round(s.opwek),
    maand: s.maand.map(m => [Math.round(m.imp), Math.round(m.exp)]),
    cong: { impZonder: Math.round(s.impMeet), expZonder: Math.round(s.expMeet), imp: Math.round(a.imp), exp: Math.round(a.exp), afg: Math.round(a.afgeschakeld),
      impCong: Math.round(a.impBlok), uCong: r1(a.uBlok), uCongMax: a.uBlokMax, uTek: r1(a.uTekort), uTekMax: Math.max(...a.perJaar.map(y => y.uTekort)),
      kostZonder: Math.round(pj(s, "impKost")), kostMet: Math.round(pj(a, "impKost")), opbrZonder: Math.round(pj(s, "expOpbr")), opbrMet: Math.round(pj(a, "expOpbr")),
      variantExp: Math.round(a2.exp), variantAfg: Math.round(a2.afgeschakeld) } };
});
/* standaardscenario: per jaar en uurreeks van het jaar met de meeste afname */
const S = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW }));
const perJaar = S.perJaar.filter(y => y.jaar !== 1998).map(y => [y.jaar, Math.round(y.imp), Math.round(y.exp), Math.round(y.afgeschakeld), r1(y.pImp), r1(y.pExp), y.uImp, y.uTekort]);
const zwaar = perJaar.slice().sort((a, b) => b[1] - a[1])[0][0];
const U = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, uurJaar: zwaar })).uur;
const uur = U.imp.map((v, i) => [r1(v), r1(U.exp[i])]);
const opLimiet = uur.filter(u => u[0] >= kW - 0.05).length, opLimietExp = uur.filter(u => u[1] >= kW - 0.05).length;
const uitBron = { gegenereerd: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", versie: D.versie, aansluiting: { A, kW, fasen: 3 },
  opzet: { accuKWh: C.accu, pcsKW: C.accuKW, reserve: C.reserve, kWpTot: Math.round(S.kWpDak + S.kWpAgri + C.pvVlakken.reduce((a, v) => a + v.kWp, 0)), erfmolen: S.nWind },
  jaren: [perJaar[0][0], perJaar[perJaar.length - 1][0]], nJaren: perJaar.length, scenarios: sc, perJaar, zwaarsteJaar: zwaar, prijs, regel: CR, prijsJaren: PJ, uurOpLimiet: opLimiet, uurOpLimietExp: opLimietExp, uur };
require("fs").writeFileSync(B + "netbeheerder-data.js", "/* gegenereerd door bouwnetbeheerder.js – niet met de hand wijzigen. uur: [afname kW, teruglevering kW] per uur van het zwaarste jaar (standaardscenario) */\nwindow.HANZEDORP_NETBEHEERDER = " + JSON.stringify(uitBron) + ";\n");
console.log(JSON.stringify(sc.map(s => [s.id, s.imp, s.exp, s.afg, s.pImp, s.pExp, s.pExpVrij, s.uImp, s.uTek, s.pTek])), "zwaarste jaar", zwaar, "uren op limiet", opLimiet, opLimietExp, "kWp", uitBron.opzet.kWpTot);
