/* =====================================================================
   bouwbijkoop.js – genereert netaansluiting-bijkoop.js (window.HANZEDORP_BIJKOOP)
   Gebruik:  node bouwbijkoop.js   (opnieuw draaien na model- of datawijziging)
   Wat: dagbalans van het dorp (opwek zon + agri-PV + erfmolen tegen het verbruik, incl. auto's) voor 2023–2025,
   de jaren waarin zowel KNMI-weer (Heino) als EPEX day-ahead-prijzen beschikbaar zijn. De bijkoopcalculator op
   netaansluiting.html gebruikt deze dagen samen met de uurprijzen uit hanzedorp-prijs.js.
   Opgave Melvin de Vries 17-11-2026 [200].
   ===================================================================== */
const B = __dirname + "/";
global.window = global;
["hanzedorp-data.js", "hanzedorp-projecten.js", "hanzedorp-project.js", "hanzedorp-dagbalans.js", "hanzedorp-weer.js", "hanzedorp-zon.js", "hanzedorp-wind.js",
  "hanzedorp-model.js", "hanzedorp-lib.js", "hanzedorp-voorraad.js", "hanzedorp-energie.js"].forEach(f => require(B + f));
const D = HANZEDORP_DATA, C = D.energie.scenarioC;
const jaren = [2023, 2024, 2025];
const r = HE.simuleer({ accu: 0, accuKW: 0, pvExtra: 0, pvVlakken: C.vlakken, kWpDakType: C.kWpDakType, uurJaren: jaren });
const R = r.reeks, T0 = Date.UTC(1994, 0, 1), P0 = Date.UTC(2023, 0, 1);
const dag = {};
for (let t = 0; t < R.vraag.length; t++) {
  const pd = Math.round((T0 + R.dag[t] * 864e5 - P0) / 864e5);          // dagindex t.o.v. 2023-01-01 (zelfde als hanzedorp-prijs.js)
  const x = dag[pd] || (dag[pd] = [pd, 0, 0, 0]);
  x[1] += R.aanbod[t]; x[2] += R.vraag[t] - R.ev[t]; x[3] += R.ev[t];
}
const dagen = Object.values(dag).sort((a, b) => a[0] - b[0]).map(x => [x[0], Math.round(x[1]), Math.round(x[2]), Math.round(x[3])]);
const evDag = r.d.mob / 365;
/* zwaarste perioden: 7 dagen met het grootste tekort (vraag incl. gemiddelde laadvraag − opwek) */
const tekort7 = [];
for (let i = 0; i + 7 <= dagen.length; i++) { let s = 0; for (let j = 0; j < 7; j++) s += dagen[i + j][2] + evDag - dagen[i + j][1]; tekort7.push([dagen[i][0], s]); }
tekort7.sort((a, b) => b[1] - a[1]);
const top = []; for (const [d, s] of tekort7) { if (top.every(t => Math.abs(t[0] - d) >= 10)) top.push([d, Math.round(s)]); if (top.length >= 6) break; }
const uit = { gegenereerd: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", versie: D.versie, d0: "2023-01-01", evDag: Math.round(evDag), dagen, zwaarst: top };
require("fs").writeFileSync(B + "netaansluiting-bijkoop.js", "/* gegenereerd door bouwbijkoop.js – niet met de hand wijzigen. dagen: [dag t.o.v. 2023-01-01, opwek kWh, verbruik zonder laden kWh, laden kWh (model)] */\nwindow.HANZEDORP_BIJKOOP = " + JSON.stringify(uit) + ";\n");
console.log(dagen.length, "dagen; evDag", Math.round(evDag), "zwaarst", JSON.stringify(top.map(([d, s]) => [new Date(P0 + d * 864e5).toISOString().slice(0, 10), s])));
