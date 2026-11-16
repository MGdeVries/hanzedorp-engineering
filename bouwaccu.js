/* =====================================================================
   bouwaccu.js – genereert netaansluiting-accu.js (window.HANZEDORP_ACCU)
   Gebruik:  node bouwaccu.js            (in de map van de site)
   Waarom vooraf berekend: 31 jaar × 8.760 uur × 8 accugroottes × 2 strategieën is te zwaar om bij het laden
   van de pagina in de browser te rekenen. De invoer komt uit dezelfde databron (hanzedorp-data.js + actief project).
   Strategieën (3 × 25 A ≈ 17,25 kW, eilandreserve r·C):
     'reactief': tekort → accu tot reserve → net (≤ P_net) → accu onder reserve; accu onder reserve direct terugladen uit het net.
     'dal'     : als reactief, plus bijladen tot S* = r·C + Σ tekort(t..t+H)/η½ in de goedkoopste uren van [t, t+H] (H = 36 h).
   Prijzen alleen 2023–2025 (EPEX); in andere jaren vlakke prijs (dal = direct bijladen).
   ===================================================================== */
const B = __dirname + "/";
global.window = global;
["hanzedorp-data.js", "hanzedorp-projecten.js", "hanzedorp-project.js", "hanzedorp-dagbalans.js", "hanzedorp-weer.js", "hanzedorp-zon.js", "hanzedorp-wind.js",
  "hanzedorp-model.js", "hanzedorp-lib.js", "hanzedorp-voorraad.js", "hanzedorp-energie.js", "hanzedorp-prijs.js", "hanzedorp-net.js"].forEach(f => require(B + f));
const D = HANZEDORP_DATA, N = D.net, C = D.energie.scenarioC;
const jaren = []; for (let y = 1994; y <= 2025; y++) if (y !== 1998) jaren.push(y);
const r = HE.simuleer({ accu: 0, accuKW: 0, pvExtra: 0, pvVlakken: C.vlakken, kWpDakType: C.kWpDakType, uurJaren: jaren });
const R = r.reeks, n = R.vraag.length, t0 = Date.UTC(1994, 0, 1);
R.jaar = R.dag.map(d => new Date(t0 + d * 864e5).getUTCFullYear());
R.mnd = R.dag.map(d => new Date(t0 + d * 864e5).getUTCMonth());
R.prijs = R.dag.map((d, i) => HN.prijs(d, R.uur[i]));
const PN = 3 * 230 * 25 / 1000, EB = N.eb[0].t, BTW = N.btw, PRIJSJAREN = [2023, 2024, 2025];
let maxTek = 0, maxVraag = 0; for (let i = 0; i < n; i++) { maxVraag = Math.max(maxVraag, R.vraag[i]); maxTek = Math.max(maxTek, R.vraag[i] - R.aanbod[i]); }

function sim(cap, o = {}) {
  const pk = o.pk != null ? o.pk : Math.min(150, cap), eta = Math.sqrt(0.9), res = cap * (o.reserve != null ? o.reserve : N.reserve), H = o.H || 36, ff = o.ff != null ? o.ff : 1, strat = o.strat || "dal";
  const ext = !!o.evExtern, def = new Float64Array(n + 1); for (let t = 0; t < n; t++) def[t + 1] = def[t] + Math.max(0, R.vraag[t] - (ext ? R.ev[t] : 0) - R.aanbod[t]);
  let soc = cap * 0.5; const J = {}, WW = {}, dagImp = o.dagen ? new Float64Array(r.dag.imp.length) : null, dagSnel = o.dagen ? new Float64Array(r.dag.imp.length) : null;
  for (let t = 0; t < n; t++) {
    const y = R.jaar[t], X = J[y] || (J[y] = { snel: 0, imp: 0, impK: 0, exp: 0, expW: 0, afg: 0, tek: 0, tekU: 0, tekMax: 0, door: 0, impU: 0 });
    const pr = R.prijs[t], p = pr == null ? 0 : pr; const net = R.aanbod[t] - R.vraag[t]; let imp = 0, exp = 0, pkv = pk, snel = 0;
    if (net >= 0) { const q = Math.min(net, pkv, (cap - soc) / eta); soc += q * eta; pkv -= q; X.door += q; let rest = net - q;
      if (pr == null || pr - N.opslagUit > 0) { exp = Math.min(rest, PN); rest -= exp; } X.afg += rest; }
    else { let need = -net; let q = Math.min(need, pkv, Math.max(0, soc - res) * eta); soc -= q / eta; pkv -= q; X.door += q; need -= q;
      if (ext && need > 0) { const sn = Math.min(need, R.ev[t]); need -= sn; snel = sn; X.snel += sn; }
      imp = Math.min(need, PN); need -= imp; if (need > 0) { q = Math.min(need, pkv, soc * eta); soc -= q / eta; pkv -= q; X.door += q; need -= q; }
      if (need > 1e-6) { X.tek += need; X.tekU++; if (need > X.tekMax) X.tekMax = need; } }
    if (cap > 0 && soc < res && imp < PN && exp === 0 && pkv > 0) { const q = Math.min(PN - imp, pkv, (res - soc) / eta); soc += q * eta; imp += q; pkv -= q; X.door += q; }
    if (strat === "dal" && cap > 0) { const doel = Math.min(cap, res + ff * (def[Math.min(n, t + H)] - def[t]) / eta);
      if (soc < doel && imp < PN && exp === 0 && pkv > 0) { const nodig = (doel - soc) / eta, uren = Math.ceil(nodig / Math.min(PN, pk));
        const v = []; for (let k = t; k < Math.min(n, t + H); k++) v.push(R.prijs[k] == null ? 0 : R.prijs[k]); v.sort((a, b) => a - b);
        if (p <= v[Math.min(v.length - 1, Math.max(0, uren - 1))]) { const q = Math.min(pkv, PN - imp, nodig); if (q > 0) { soc += q * eta; imp += q; X.door += q; } } } }
    const m = R.mnd[t];
    if (m >= 10 || m <= 2) { const wk = m >= 10 ? y : y - 1; const W = WW[wk] || (WW[wk] = { snel: 0, snelDag: new Set(), imp: 0, u: 0, k: 0, dag: new Set(), nacht: 0, vol: 0, uur: new Array(24).fill(0) });
      W.imp += imp; W.k += imp * p; W.snel += snel; if (snel > 0.01) W.snelDag.add(R.dag[t]); W.uur[R.uur[t]] += imp; if (imp > 0.01) { W.u++; W.dag.add(R.dag[t]); if (R.uur[t] < 6 || R.uur[t] >= 22) W.nacht += imp; if (imp > PN - 0.01) W.vol++; } }
    if (dagImp) { dagImp[R.dag[t]] += imp; dagSnel[R.dag[t]] += snel; }
    X.imp += imp; X.impK += imp * (p + N.opslagIn + EB) * (1 + BTW); X.exp += exp; X.expW += exp * Math.max(0, p - N.opslagUit);
    if (imp > 0.01) X.impU++;
  }
  const Y = Object.keys(J).map(Number), gem = (k, ys = Y) => ys.reduce((a, y) => a + J[y][k], 0) / ys.length;
  const win = {}; for (const w of [2023, 2024]) if (WW[w]) { const W = WW[w]; win[w] = { snel: W.snel, snelDagen: W.snelDag.size, imp: W.imp, uren: W.u, dagen: W.dag.size, gemPrijs: W.imp ? W.k / W.imp : 0, beurs: W.k, nacht: W.imp ? W.nacht / W.imp : 0, volUren: W.vol, uur: W.uur.map(v => +v.toFixed(1)) }; }
  return { cap, pk, strat, snel: gem("snel"), imp: gem("imp"), impU: gem("impU"), impUmax: Math.max(...Y.map(y => J[y].impU)), afg: gem("afg"), tek: gem("tek"), tekU: gem("tekU"),
    tekJaren: Y.filter(y => J[y].tekU > 0).length, tekUmax: Math.max(...Y.map(y => J[y].tekU)), tekMax: Math.max(...Y.map(y => J[y].tekMax)), cycli: gem("door") / Math.max(1, cap) / 2,
    impP: gem("imp", PRIJSJAREN), dagSnel, impKP: gem("impK", PRIJSJAREN), expP: gem("exp", PRIJSJAREN), expWP: gem("expW", PRIJSJAREN), nettoP: gem("expW", PRIJSJAREN) - gem("impK", PRIJSJAREN), win, dagImp };
}
const rnd = (o, d = 1) => JSON.parse(JSON.stringify(o, (k, v) => typeof v === "number" ? +v.toFixed(d) : v));
const GROOTTES = [0, 100, 200, 300, 400, 500, 600, 800, 1000, 1200];   // sets van 200 kWh, max 3 kasten × 400 kWh (16-11-2026)
const groottes = GROOTTES.map(c => { const a = sim(c), b = sim(c, { strat: "reactief" }); delete a.dagImp; delete b.dagImp; delete a.dagSnel; delete b.dagSnel; return { cap: c, dal: a, reactief: b }; });
const blokken = [[2, 200], [3, 150], [3, 200], [4, 150], [4, 200]].map(([nb, kb]) => { const s = sim((nb - 1) * kb, { pk: 150 * (nb - 1) / nb }); delete s.dagImp; delete s.dagSnel; return { nb, kb, cap: nb * kb, restCap: (nb - 1) * kb, restKW: 150 * (nb - 1) / nb, tekU: s.tekU, tekJaren: s.tekJaren, tekMax: s.tekMax, imp: s.imp }; });
const gevoel = [["H = 36 h, perfecte voorspelling", {}], ["H = 24 h", { H: 24 }], ["H = 12 h", { H: 12 }], ["voorspelling 30 % te laag", { ff: 0.7 }], ["voorspelling 50 % te laag", { ff: 0.5 }], ["reserve 15 %", { reserve: 0.15 }]]
  .map(([naam, o]) => ({ naam, rij: [300, 400, 600].map(c => { const s = sim(c, o); delete s.dagSnel; return { cap: c, tekU: s.tekU, tekJaren: s.tekJaren, imp: s.imp, impU: s.impU, nettoP: s.nettoP }; }) }));
// winterreeks per dag voor de grafiek (accu = besluit, strategie dal en reactief)
const capB = N.accu, sd = sim(capB, { dagen: true }), sr = sim(capB, { strat: "reactief", dagen: true });
// verbruik per groep per dag (wp = warmtepomp verwarming + tapwater, woning = overig woningverbruik, ev = laden, gemeen = buurthuis, cellen, werkplaats, akker, vijver)
const nd = r.dag.imp.length, dg = { verw: new Float64Array(nd), wp: new Float64Array(nd), woning: new Float64Array(nd), ev: new Float64Array(nd), gemeen: new Float64Array(nd), zon: new Float64Array(nd), wind: new Float64Array(nd) };
for (let t = 0; t < n; t++) { const i = R.dag[t]; dg.verw[i] += R.verw[t]; dg.wp[i] += R.wp[t]; dg.woning[i] += R.woning[t]; dg.ev[i] += R.ev[t]; dg.gemeen[i] += R.vraag[t] - R.wp[t] - R.woning[t] - R.ev[t]; dg.zon[i] += R.zon[t]; dg.wind[i] += R.wind[t]; }
const sdE = sim(capB, { dagen: true, evExtern: true });
const snellader = [300, 450, 600].map(c => { const a = sim(c), b = sim(c, { evExtern: true }); delete a.dagSnel; delete b.dagSnel; delete a.dagImp; delete b.dagImp; return { cap: c, zonder: { imp: a.imp, impU: a.impU, tekU: a.tekU, win: a.win }, met: { imp: b.imp, impU: b.impU, tekU: b.tekU, snel: b.snel, win: b.win } }; });
snellader.forEach(x => { [x.zonder.win, x.met.win].forEach(w => Object.values(w).forEach(v => delete v.uur)); });
const winters = [2023, 2024].map(w => {
  const a = Math.round((Date.UTC(w, 10, 1) - t0) / 864e5), b = Math.round((Date.UTC(w + 1, 3, 1) - t0) / 864e5), dagen = [];
  const som = { verw: 0, wp: 0, woning: 0, ev: 0, gemeen: 0, zon: 0, wind: 0 };
  for (let i = a; i < b; i++) { dagen.push([+(r.dag.zon[i]).toFixed(0), +(r.dag.wind[i]).toFixed(0), +(r.dag.vraag[i]).toFixed(0), +(sd.dagImp[i]).toFixed(1), +(sr.dagImp[i]).toFixed(1), +dg.wp[i].toFixed(0), +dg.woning[i].toFixed(0), +dg.ev[i].toFixed(0), +dg.gemeen[i].toFixed(0), +(sdE.dagImp[i]).toFixed(1), +(sdE.dagSnel[i]).toFixed(1)]); for (const k in som) som[k] += dg[k][i]; }
  return { som, snel: sdE.win[w], naam: w + "/" + String(w + 1).slice(2), start: new Date(t0 + a * 864e5).toISOString().slice(0, 10), dagen, dal: sd.win[w], reactief: sr.win[w] };
});
const out = rnd({
  gegenereerd: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", versie: D.versie, project: D.project ? D.project.id : null,
  aansluitKW: PN, jaren: jaren.length, maxUurTekort: maxTek, maxUurVraag: maxVraag, vraagJr: R.vraag.reduce((a, b) => a + b, 0) / jaren.length, aanbodJr: R.aanbod.reduce((a, b) => a + b, 0) / jaren.length,
  besluitKWh: capB, nW: r.d.nW, pers: r.d.pers, snellader, groottes, blokken, gevoel, winters
}, 3);
require("fs").writeFileSync(B + "netaansluiting-accu.js", "/* gegenereerd door bouwaccu.js – niet met de hand wijzigen */\nwindow.HANZEDORP_ACCU = " + JSON.stringify(out) + ";\n");
console.log("netaansluiting-accu.js geschreven:", groottes.map(g => g.cap + ": dal tekU " + g.dal.tekU + ", netto " + Math.round(g.dal.nettoP)).join(" | "));
console.log("blokken", blokken.map(b => b.nb + "x" + b.kb + " → tekU " + b.tekU).join(" | "));
