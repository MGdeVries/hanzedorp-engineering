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
const AR = D.ems.avondregel, AVOND = Array.from({ length: AR.tot - AR.van }, (_, i) => AR.van + i);                                       // congestie-uren 16–21 uur (RVO [204]); avondregel [206]
/* gemiddelde winterprijs (nov–feb) per uur van de dag uit de EPEX-reeks: avond tegenover nacht */
require(B + "hanzedorp-prijs.js");
const PR = HANZEDORP_PRIJS, P0 = Date.UTC(2023, 0, 1), ps = Array(24).fill(0), pn = Array(24).fill(0);
for (let i = 0; i < PR.p.length; i++) { const m = new Date(P0 + Math.floor(i / 24) * 864e5).getUTCMonth(); if ([10, 11, 0, 1].includes(m) && PR.p[i] != null) { ps[i % 24] += PR.p[i] / 1e5; pn[i % 24]++; } }
const pUur = ps.map((v, h) => v / pn[h]), gemP = hs => hs.reduce((a, h) => a + pUur[h], 0) / hs.length;
const prijs = { uur: pUur.map(v => Math.round(v * 10000) / 10000), avond: gemP(AVOND), nacht: gemP([0, 1, 2, 3, 4, 5]), dag: gemP([10, 11, 12, 13, 14]), periode: "nov–feb, " + PR.d0.slice(0, 4) + "–2026" };
const sc = V.map(([id, naam, o]) => {
  const s = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, meetUren: AVOND }, o));
  const a = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, blokUren: AVOND }, o));   // met avondregel: geen bijladen uit het net 16–21 uur
  const vrij = HE.simuleer(Object.assign({}, C, { netKW: kW }, o));      // teruglevering zonder begrenzing: hoeveel zou er het net op willen?
  return { id, naam, imp: Math.round(s.imp), exp: Math.round(s.exp), afg: Math.round(s.afgeschakeld), pImp: r1(s.pImp), pExp: r1(s.pExp), pExpVrij: r1(vrij.pExp),
    uImp: Math.round(s.uImp), uTek: Math.round(s.uTekort), pTek: r1(s.pTekort), impMax: Math.round(s.impMax), vraag: Math.round(s.vraag), opwek: Math.round(s.opwek),
    maand: s.maand.map(m => [Math.round(m.imp), Math.round(m.exp)]),
    avond: { impZonder: Math.round(s.impMeet), imp: Math.round(a.imp), impAvond: Math.round(a.impBlok), uAvond: r1(a.uBlok), uAvondMax: a.uBlokMax, uTek: r1(a.uTekort), uTekMax: Math.max(...a.perJaar.map(y => y.uTekort)) } };
});
/* standaardscenario: per jaar en uurreeks van het jaar met de meeste afname */
const S = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW }));
const perJaar = S.perJaar.filter(y => y.jaar !== 1998).map(y => [y.jaar, Math.round(y.imp), Math.round(y.exp), Math.round(y.afgeschakeld), r1(y.pImp), r1(y.pExp), y.uImp, y.uTekort]);
const zwaar = perJaar.slice().sort((a, b) => b[1] - a[1])[0][0];
const U = HE.simuleer(Object.assign({}, C, { netKW: kW, expKW: kW, uurJaar: zwaar })).uur;
const uur = U.imp.map((v, i) => [r1(v), r1(U.exp[i])]);
/* congestie-uren 16–21: kan de afname van elke dag buiten die uren vallen? (benadering: dagafname ≤ 19 h × aansluiting en avondafname ≤ bruikbare accu) */
const bruikbaar = C.accu * (1 - C.reserve); let maxDag = 0, maxAvond = 0, dagenAf = 0, dagenOk = 0;
for (let d = 0; d < uur.length / 24; d++) { let t = 0, e = 0; for (let h = 0; h < 24; h++) { const v = uur[d * 24 + h][0]; t += v; if (h >= 16 && h < 21) e += v; }
  if (t > 0.1) { dagenAf++; if (t <= kW * 19 && e <= bruikbaar) dagenOk++; } maxDag = Math.max(maxDag, t); maxAvond = Math.max(maxAvond, e); }
const opLimiet = uur.filter(u => u[0] >= kW - 0.05).length, opLimietExp = uur.filter(u => u[1] >= kW - 0.05).length;
const uitBron = { gegenereerd: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", versie: D.versie, aansluiting: { A, kW, fasen: 3 },
  opzet: { accuKWh: C.accu, pcsKW: C.accuKW, reserve: C.reserve, kWpTot: Math.round(S.kWpDak + S.kWpAgri + C.pvVlakken.reduce((a, v) => a + v.kWp, 0)), erfmolen: S.nWind },
  jaren: [perJaar[0][0], perJaar[perJaar.length - 1][0]], nJaren: perJaar.length, scenarios: sc, perJaar, zwaarsteJaar: zwaar, prijs, avondUren: AVOND, uurOpLimiet: opLimiet, avond: { maxDag: Math.round(maxDag), maxAvond: Math.round(maxAvond), ruimte19: Math.round(kW * 19), bruikbaar: Math.round(bruikbaar), dagenAf, dagenOk }, uurOpLimietExp: opLimietExp, uur };
require("fs").writeFileSync(B + "netbeheerder-data.js", "/* gegenereerd door bouwnetbeheerder.js – niet met de hand wijzigen. uur: [afname kW, teruglevering kW] per uur van het zwaarste jaar (standaardscenario) */\nwindow.HANZEDORP_NETBEHEERDER = " + JSON.stringify(uitBron) + ";\n");
console.log(JSON.stringify(sc.map(s => [s.id, s.imp, s.exp, s.afg, s.pImp, s.pExp, s.pExpVrij, s.uImp, s.uTek, s.pTek])), "zwaarste jaar", zwaar, "uren op limiet", opLimiet, opLimietExp, "kWp", uitBron.opzet.kWpTot);
