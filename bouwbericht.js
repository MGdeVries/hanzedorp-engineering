/* =====================================================================
   bouwbericht.js – genereert energiebeheer-bericht.js (window.HANZEDORP_BERICHT)
   Gebruik:  node bouwbericht.js            (in de map van de site; opnieuw draaien na model- of datawijziging)
   Wat: het 'verbruiksbericht' (opgave Melvin 15-11-2026 [190]) doorgerekend op 31 jaar KNMI-uurdata (Heino).
   - Dagcode uit de dagbalans opwek (zon + agri-PV + wind) tegen de vaste vraag (alles behalve auto's) en de laadvraag:
       overvloed : opwek ≥ f_over × (vaste vraag + laadvraag)
       groen     : opwek ≥ vaste vraag + laadvraag
       geel      : opwek ≥ vaste vraag (auto's alleen op zonuren / uitstellen)
       oranje    : opwek ≥ f_rood × vaste vraag (niet-essentiële verbruikers uit, laden alleen bij noodzaak)
       rood      : opwek < f_rood × vaste vraag (alleen essentieel)
     Perfecte voorspelling (bovengrens); echte weersverwachting heeft fouten (zie technische pagina).
   - Uursimulatie met accu (600 kWh / 150 kW, reserve 30 %) en netaansluiting 3 × 25 A (17,25 kW), reactief:
     overschot → accu → export; tekort → accu tot reserve → net → accu onder reserve; accu onder reserve terugladen uit het net.
     Scenario's laden: flex 2 dagen (huidig model) vs verbruiksbericht (flex 7 dagen); gedwongen laden altijd begrensd tot de beschikbare ruimte (opwek + accu boven reserve + net).
     Scenario sauna: n sauna's (3-fase), 2× per week 19–21 uur, ongestuurd vs geblokkeerd op oranje/rood.
   ===================================================================== */
const B = __dirname + "/";
global.window = global;
["hanzedorp-data.js", "hanzedorp-projecten.js", "hanzedorp-project.js", "hanzedorp-dagbalans.js", "hanzedorp-weer.js", "hanzedorp-zon.js", "hanzedorp-wind.js",
  "hanzedorp-model.js", "hanzedorp-lib.js", "hanzedorp-voorraad.js", "hanzedorp-energie.js", "hanzedorp-prijs.js", "hanzedorp-net.js"].forEach(f => require(B + f));
const D = HANZEDORP_DATA, C = D.energie.scenarioC, EM = D.ems, N = D.net;
const jaren = []; for (let y = 1994; y <= 2025; y++) if (y !== 1998) jaren.push(y);
const r = HE.simuleer({ accu: 0, accuKW: 0, pvExtra: 0, pvVlakken: C.vlakken, kWpDakType: C.kWpDakType, uurJaren: jaren });
const R = r.reeks, n = R.vraag.length, t0 = Date.UTC(1994, 0, 1);
const dagIdx = R.dag, jaar = dagIdx.map(d => new Date(t0 + d * 864e5).getUTCFullYear()), mnd = dagIdx.map(d => new Date(t0 + d * 864e5).getUTCMonth());
const evJr = r.d.mob, evDag = evJr / 365;
const vast = Float64Array.from(R.vraag, (v, i) => v - R.ev[i]);           // vraag zonder laden
const PN = 3 * 230 * 25 / 1000, CAP = N.accu, PK = N.accuKW, RES = N.reserve * CAP, ETA = Math.sqrt(D.energie.accu.eta), PL = D.mobiliteit.zappi.n * D.mobiliteit.zappi.autoAC;
const P = EM.bericht;

/* ---------- dagen en dagcodes ---------- */
const dagen = []; let cur = -1;
for (let t = 0; t < n; t++) {
  if (dagIdx[t] !== cur) { cur = dagIdx[t]; dagen.push({ i: cur, y: jaar[t], m: mnd[t], t0: t, A: 0, V: 0 }); }
  const x = dagen[dagen.length - 1]; x.A += R.aanbod[t]; x.V += vast[t];
}
const CODES = ["overvloed", "groen", "geel", "oranje", "rood"];
function code(A, V) {
  if (A >= P.fOver * (V + evDag)) return 0;
  if (A >= V + evDag) return 1;
  if (A >= V) return 2;
  if (A >= P.fRood * V) return 3;
  return 4;
}
dagen.forEach(x => x.c = code(x.A, x.V));

/* ---------- uursimulatie ---------- */
function sim(o = {}) {
  const flex = o.flex || 2, bericht = !!o.bericht, nS = o.sauna || 0, saunaStuur = !!o.saunaStuur;
  let soc = CAP * 0.5, achter = 0; const J = {}; let pImp = 0, pVraag = 0, evGedw = 0, saunaGeblokt = 0, saunaKWh = 0, wacht = [], wachtNu = 0;
  let dagC = 1, dagNr = -1, dagTeller = 0;
  for (let t = 0; t < n; t++) {
    if (dagIdx[t] !== dagNr) {
      dagNr = dagIdx[t]; dagC = dagen[dagTeller++].c;
      // wachttijd laden: dagen sinds de laatste dag waarop de achterstand weg was
      if (achter < evDag * 0.5) { if (wachtNu) wacht.push(wachtNu); wachtNu = 0; } else wachtNu++;
    }
    const y = jaar[t], X = J[y] || (J[y] = { imp: 0, exp: 0, tek: 0, tekU: 0, netLaad: 0, ev: 0 });
    const h = R.uur[t], dow = (dagNr + 5) % 7;   // 1994-01-01 = zaterdag → dow 0 = maandag
    let v = vast[t];
    // sauna's: woensdag (2) en zaterdag (5), 19–21 uur, ± 1 uur vol vermogen + 1 uur half
    if (nS && (dow === 2 || dow === 5) && (h === 19 || h === 20)) {
      const p = nS * EM.sauna.kW * (h === 19 ? 1 : 0.5);
      if (saunaStuur && dagC >= 3) saunaGeblokt += p; else { v += p; saunaKWh += p; }
    }
    achter += evDag / 24;
    let ev = 0, saldo = R.aanbod[t] - v;
    // gedwongen laden: bij verbruiksbericht pas na 'flex' dagen, of eerder op een groene of overvloedige dag (accu en net vullen het aan)
    const grens = flex * evDag;
    let gedw = Math.max(0, achter - grens);
    // EMS laadt nooit meer dan er ruimte is: opwek + accu boven de reserve + vrije netcapaciteit (geen tekort door laden)
    const ruimte = Math.max(0, R.aanbod[t] + Math.min(PK, Math.max(0, soc - RES) * ETA) + PN - v);
    if (gedw > 0) { const q = Math.min(PL, gedw, ruimte); ev += q; achter -= q; saldo -= q; evGedw += q; }
    if (saldo > 0 && achter > 0) { const q = Math.min(saldo, PL - ev, achter); ev += q; achter -= q; saldo -= q; }
    X.ev += ev;
    let imp = 0, exp = 0;
    if (saldo > 0) { const q = Math.min(saldo, PK, (CAP - soc) / ETA); soc += q * ETA; exp = saldo - q; }
    else if (saldo < 0) {
      let tek = -saldo; const a1 = Math.min(tek, PK, Math.max(0, soc - RES) * ETA); soc -= a1 / ETA; tek -= a1;
      const nt = Math.min(tek, PN); imp += nt; tek -= nt;
      if (tek > 0) { const a2 = Math.min(tek, PK - a1, soc * ETA); soc -= a2 / ETA; tek -= a2; }
      if (tek > 1e-6) { X.tek += tek; X.tekU++; }
    }
    if (soc < RES && imp < PN) { const q = Math.min(PN - imp, PK, (RES - soc) / ETA); soc += q * ETA; imp += q; X.netLaad += q; }
    X.imp += imp; X.exp += exp; if (imp > pImp) pImp = imp; const vv = v + ev; if (vv > pVraag) pVraag = vv;
  }
  const gem = k => jaren.reduce((a, y) => a + J[y][k], 0) / jaren.length;
  wacht.sort((a, b) => a - b);
  return { imp: gem("imp"), exp: gem("exp"), tek: gem("tek"), tekU: gem("tekU"), netLaad: gem("netLaad"), ev: gem("ev"), pImp, pVraag,
    evGedw: evGedw / jaren.length, saunaKWh: saunaKWh / jaren.length, saunaGeblokt: saunaGeblokt / jaren.length,
    wachtMax: wacht.length ? wacht[wacht.length - 1] : 0, wachtP90: wacht.length ? wacht[Math.floor(wacht.length * 0.9)] : 0,
    perJaar: jaren.map(y => ({ jaar: y, imp: Math.round(J[y].imp), tek: Math.round(J[y].tek) })) };
}
const scen = {
  flex2: sim({ flex: 2 }),
  bericht7: sim({ flex: P.flexDagen, bericht: true }),
  saunaVrij: sim({ flex: P.flexDagen, bericht: true, sauna: EM.sauna.n }),
  saunaStuur: sim({ flex: P.flexDagen, bericht: true, sauna: EM.sauna.n, saunaStuur: true })
};

/* ---------- statistiek codes ---------- */
const perJaar = jaren.map(y => { const c = [0, 0, 0, 0, 0]; dagen.filter(x => x.y === y).forEach(x => c[x.c]++); return { jaar: y, c }; });
const gemC = [0, 1, 2, 3, 4].map(k => perJaar.reduce((a, p) => a + p.c[k], 0) / jaren.length);
const perMaand = Array.from({ length: 12 }, (_, m) => [0, 1, 2, 3, 4].map(k => dagen.filter(x => x.m === m && x.c === k).length / jaren.length));
// langste aaneengesloten reeks oranje + rood
let lang = { n: 0, start: null }, run = 0, rs = 0;
dagen.forEach((x, k) => { if (x.c >= 3) { if (!run) rs = k; run++; if (run > lang.n) lang = { n: run, start: dagen[rs].i }; } else run = 0; });
const iso = i => new Date(t0 + i * 864e5).toISOString().slice(0, 10);

/* ---------- laadadvies 2023–2025: thuis (net, goedkoopste uren) of snellader ---------- */
const EB = N.eb[0].t, BTW = N.btw;
const prijsDag = {};
for (let t = 0; t < n; t++) { const y = jaar[t]; if (y < 2023) continue; const d = dagIdx[t]; (prijsDag[d] || (prijsDag[d] = [])).push(HN.prijs(d, R.uur[t])); }
let adv = { dagen: 0, thuis: 0, snel: 0, thuisPrijs: 0 };
const voorbeeld = [];
dagen.filter(x => x.y >= 2023).forEach(x => {
  const pr = (prijsDag[x.i] || []).slice().sort((a, b) => a - b), p4 = pr.slice(0, 4).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(4, pr.length));
  const thuis = (p4 + N.opslagIn + EB) * (1 + BTW);
  x.thuis = thuis;
  if (x.c >= 3) { adv.dagen++; adv.thuisPrijs += thuis; if (thuis <= D.mobiliteit.snellader.eurKWh) adv.thuis++; else adv.snel++; }
  voorbeeld.push([x.i, x.c, Math.round(x.A), Math.round(x.V), Math.round(thuis * 1000) / 1000]);
});
adv.thuisPrijs = adv.dagen ? adv.thuisPrijs / adv.dagen : 0;

/* ---------- modelwaarden voor het verbruikersregister (kWh/jr per stuk) ---------- */
const mw = {}; HE.TYPES.forEach(tp => { const w = r.d.per[tp]; mw[tp] = {}; ["koel", "wtw", "verw", "ww", "quooker", "thuiswerk", "auto"].forEach(k => mw[tp][k] = Math.round(w[k] || 0)); });
mw.dorp = { cel: Math.round(r.d.cel ? r.d.cel.e : 0), keuken: Math.round(r.d.keuken), buurthuis: Math.round(r.d.buurthuis), werkplaats: Math.round(r.d.werkplaats), vijver: Math.round(r.d.vijver) };
const uit = {
  gegenereerd: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", versie: D.versie, project: (window.HZPROJECT && HZPROJECT.id) || "referentie",
  jaren: jaren.length, nW: r.d.nW, pers: r.d.pers, evJr: Math.round(evJr), vastJr: Math.round(dagen.reduce((a, x) => a + x.V, 0) / jaren.length), aanbodJr: Math.round(dagen.reduce((a, x) => a + x.A, 0) / jaren.length),
  aansluitKW: PN, accu: CAP, reserve: N.reserve, fOver: P.fOver, fRood: P.fRood, flexDagen: P.flexDagen,
  codes: CODES, mix: r.d.mix, mw, gemC, perMaand, perJaar, langst: { n: lang.n, start: lang.start != null ? iso(lang.start) : null },
  scen, advies: adv, snellader: D.mobiliteit.snellader.eurKWh,
  dag0: voorbeeld.length ? voorbeeld[0][0] : 0, voorbeeld   // [dagindex, code, opwek kWh, vaste vraag kWh, thuisladen €/kWh incl. btw]
};
require("fs").writeFileSync(B + "energiebeheer-bericht.js", "/* gegenereerd door bouwbericht.js – niet met de hand wijzigen */\nwindow.HANZEDORP_BERICHT = " + JSON.stringify(uit) + ";\n");
console.log(JSON.stringify({ gemC: gemC.map(v => +v.toFixed(1)), langst: uit.langst, evJr: uit.evJr, vastJr: uit.vastJr, aanbodJr: uit.aanbodJr, adv,
  scen: Object.fromEntries(Object.entries(scen).map(([k, s]) => [k, { imp: Math.round(s.imp), tek: Math.round(s.tek), tekU: +s.tekU.toFixed(1), pImp: +s.pImp.toFixed(1), pVraag: +s.pVraag.toFixed(1), evGedw: Math.round(s.evGedw), wachtMax: s.wachtMax, wachtP90: s.wachtP90, sauna: Math.round(s.saunaKWh), geblokt: Math.round(s.saunaGeblokt) }])) }, null, 1));
