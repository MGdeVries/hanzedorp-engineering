/* =====================================================================
   hanzedorp-voorraad.js – oogst, veldbuffer, voorraad en koel-/vriescellen per week (window.HV)
   Vereist: hanzedorp-data.js, hanzedorp-wind.js (TG voor buitenluchtkoeling)
   Weekmodel (52 weken, 2 jaar doorgerekend; het 2e jaar is de evenwichtssituatie):
     1. Rijping: jaarproductie per gewas gelijk verdeeld over de weken van zijn oogstmaanden.
     2. Gewassen die mogen blijven staan (vt) blijven op het veld tot ze nodig zijn of tot maand vt;
        overige gewassen moeten worden geoogst als ze rijp zijn.
     3. Eten: eerst vers geoogst, dan van het veld (per gewas max. 3× zijn aandeel in de weekvraag),
        daarna uit de voorraad (naar rato van wat er ligt).
     4. Wat over is gaat naar de opslag volgens 'op': koelcel ±2 °C (k2), koelcel ±10 °C (k8), vriescel (v),
        kast (b: weck, blik, droog, pekel); wat niet bewaard kan worden is verlies (compost).
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, V = D.voedsel, VR = V.voorraad, WI = window.HANZEDORP_WIND;
  const CAT = ["k2", "k8", "v", "b"], NAAM = { k2: "Koelcel ±2 °C", k8: "Koelcel ±10 °C", v: "Vriescel", b: "Kast (weck, blik, droog)", veld: "Op het veld" };
  const NW = 52, mnd = w => Math.min(11, Math.floor(w * 12 / NW));

  /* buitentemperatuur: gemiddelde per kalendermaand over 1994–2025 (excl. 1998) */
  const tMaand = (() => { const s = Array(12).fill(0), c = Array(12).fill(0); for (let i = 0; i < WI.n; i++) if (WI.Y[i] !== 1998) { s[WI.M[i]] += WI.TG[i]; c[WI.M[i]]++; } return s.map((v, m) => v / c[m]); })();

  function staatWindow(g) {           // maanden (0-11) waarin het gewas op het veld mag staan
    if (!g.vt) return null; const set = new Set(); let m = g.o[0] - 1;
    for (let k = 0; k < 12; k++) { set.add(m); if (m === g.vt - 1) break; m = (m + 1) % 12; }
    return set;
  }

  function simuleer(o = {}) {
    const monden = o.monden != null ? o.monden : V.monden, verlies = V.verlies;
    const A = o.akkerM2 != null ? o.akkerM2 : D.akker.maxM2;
    // productie uit het akkeroppervlak, verdeeld groente/fruit zoals de behoefteberekening (m²G : m²F, zie voedsel-technisch)
    const fG = (V.groenteGpd / V.opbrGroente) / (V.groenteGpd / V.opbrGroente + V.fruitGpd / V.opbrFruit);
    const prodG = A * fG * V.opbrGroente * (1 - verlies), prodF = A * (1 - fG) * V.opbrFruit * (1 - verlies);   // kg/jr netto beschikbaar
    const vraag = { groente: monden * V.groenteGpd * 7 / 1000, fruit: monden * V.fruitGpd * 7 / 1000 };       // kg/week
    const G = V.gewassen.map(g => {
      const weken = []; for (let w = 0; w < NW; w++) if (g.o.includes(mnd(w) + 1)) weken.push(w);
      return { ...g, weken, prod: (g.g === "fruit" ? prodF : prodG) * g.a, staat: staatWindow(g), veld: 0 };
    });
    const S = { groente: { k2: 0, k8: 0, v: 0, b: 0 }, fruit: { k2: 0, k8: 0, v: 0, b: 0 } };
    let rec = null;
    for (let jaar = 0; jaar < 2; jaar++) {
      const R = { oogst: [], vers: [], veldEten: [], uitVoorraad: [], tekort: [], compost: [], over: [], inOpslag: [], voorraad: { k2: [], k8: [], v: [], b: [], veld: [] },
        verwerk: { k2: [], k8: [], v: [], b: [] }, perGewas: {} };
      for (let w = 0; w < NW; w++) {
        const m = mnd(w); let oogst = 0, vers = 0, veldEten = 0, uit = 0, tekort = 0, compost = 0, over = 0;
        const inw = { k2: 0, k8: 0, v: 0, b: 0 };
        const naarOpslag = (g, kg) => {
          // niet meer opslaan dan ± maxWeken vraag van de groep; de rest is overschot (weggeven, ruilen, verkopen)
          const ruimte = Math.max(0, VR.maxWekenVoorraad * vraag[g.g] - CAT.reduce((a, c) => a + S[g.g][c], 0));
          const opslaan = Math.min(kg * CAT.reduce((a, c) => a + (g.op[c] || 0), 0), ruimte), f = kg > 0 ? opslaan / kg : 0, fop = CAT.reduce((a, c) => a + (g.op[c] || 0), 0) || 1;
          CAT.forEach(c => { const q = kg * f * (g.op[c] || 0) / fop; S[g.g][c] += q; inw[c] += q; });
          const nietBewaarbaar = kg * (1 - CAT.reduce((a, c) => a + (g.op[c] || 0), 0));
          compost += Math.max(0, nietBewaarbaar); over += Math.max(0, kg - opslaan - nietBewaarbaar);
        };
        // 1. rijping
        const geplukt = new Map();
        G.forEach(g => { if (!g.weken.includes(w)) return; const r = g.prod / g.weken.length; oogst += r;
          if (g.staat && g.staat.has(m)) g.veld += r; else geplukt.set(g, (geplukt.get(g) || 0) + r); });
        // veld leeghalen aan het eind van het staanvenster
        G.forEach(g => { if (g.veld > 0 && (!g.staat || !g.staat.has(m))) { geplukt.set(g, (geplukt.get(g) || 0) + g.veld); g.veld = 0; } });
        // 2. eten per groep
        ["groente", "fruit"].forEach(grp => {
          let Dg = vraag[grp];
          const cap = g => VR.versMaxFactor * g.a * vraag[grp];
          G.filter(g => g.g === grp && geplukt.has(g)).forEach(g => { const q = Math.min(geplukt.get(g), cap(g), Dg); geplukt.set(g, geplukt.get(g) - q); Dg -= q; vers += q; });
          G.filter(g => g.g === grp && g.veld > 0).forEach(g => { const q = Math.min(g.veld, cap(g), Dg); g.veld -= q; Dg -= q; veldEten += q; });
          const tot = CAT.reduce((a, c) => a + S[grp][c], 0);
          if (Dg > 0 && tot > 0) { const q = Math.min(Dg, tot); CAT.forEach(c => S[grp][c] -= q * S[grp][c] / tot); Dg -= q; uit += q; }
          tekort += Math.max(0, Dg);
        });
        // 3. rest van het geplukte naar de opslag
        geplukt.forEach((kg, g) => { if (kg > 1e-9) naarOpslag(g, kg); });
        R.oogst.push(oogst); R.vers.push(vers); R.veldEten.push(veldEten); R.uitVoorraad.push(uit); R.tekort.push(tekort); R.compost.push(compost); R.over.push(over);
        CAT.forEach(c => { R.voorraad[c].push(S.groente[c] + S.fruit[c]); R.verwerk[c].push(inw[c]); });
        R.voorraad.veld.push(G.reduce((a, g) => a + g.veld, 0));
      }
      rec = R;
    }
    const som = a => a.reduce((x, y) => x + y, 0), max = a => Math.max(...a);
    const piek = {}; CAT.concat("veld").forEach(c => { const a = rec.voorraad[c]; piek[c] = { kg: max(a), week: a.indexOf(max(a)) }; });
    return { monden, A, prodG, prodF, vraag, R: rec, piek, tekortJr: som(rec.tekort), compostJr: som(rec.compost), overJr: som(rec.over), oogstJr: som(rec.oogst),
      versJr: som(rec.vers) + som(rec.veldEten), uitJr: som(rec.uitVoorraad), verwerkJr: Object.fromEntries(CAT.map(c => [c, som(rec.verwerk[c])])) };
  }

  /* celmaat uit piekvoorraad */
  function celMaat(kg, c) {
    const netL = kg / VR.dichtheid[c], bruto = netL / 1000 / VR.benutting, h = VR.celHoogte;
    const vloer = bruto / h, b = Math.max(1.2, Math.sqrt(vloer)), d = Math.max(1.2, vloer / b);
    return { netL, bruto: b * d * h, b, d, h, vloer: b * d };
  }

  /* energie per cel per week, met isolatiedikte t (m) */
  function celEnergie(c, maat, voorraadW, inW, t, pcm) {
    const dik = t != null ? t : VR.dikte[c], U = VR.lambda * VR.koudebrug / dik;
    const bo = maat.b + dik, dd = maat.d + dik, ho = maat.h + dik, A = 2 * (bo * dd + bo * ho + dd * ho);
    const Tc = VR.temp[c], cop = VR.cop[c], weken = [];
    for (let w = 0; w < NW; w++) {
      const m = mnd(w), dT = Math.max(0, VR.ruimteT - Tc);
      const trans = U * A * dT;                                                                  // W
      const deur = VR.bezoekenPerWeek * VR.deurM3 * 1.2 * (1.0 * dT + (c === "v" ? 12 : 4)) * 1000 / (7 * 24 * 3600);   // W, voelbaar + latent (N)
      const adem = (VR.ademhaling[c] || 0) * voorraadW[w];
      const product = c === "v" ? inW[w] * 330e3 / (7 * 24 * 3600) : inW[w] * 3.6e3 * Math.max(0, 15 - Tc) / (7 * 24 * 3600);   // W (invriezen 330 kJ/kg; inkoelen van 15 °C)
      const qth = trans + deur + adem + product;                                                 // W thermisch
      const vrij = c === "k8" && VR.buitenluchtK8 && tMaand[m] < Tc - 3;                              // buitenluchtkoeling
      const uit = voorraadW[w] < VR.uitOnderKg && inW[w] < VR.uitOnderKg;                       // lege cel gaat uit (deur open, droog)
      let el = uit ? 0 : vrij ? VR.ventilator[c] : qth / cop * (1 + (c === "v" ? VR.ontdooi : 0)) + VR.ventilator[c] * 1.3 * Math.min(1, qth / cop / 300);
      // buffer: massa voorraad × cp × bandbreedte
      const cp = c === "v" ? 1.8e3 : 3.6e3, band = VR.band[c][1] - VR.band[c][0];
      const bufTh = voorraadW[w] * cp * band / 3.6e6 + (pcm || 0);                               // kWh thermisch (+ PCM)
      weken.push({ qth: uit ? 0 : qth, trans, deur, adem, product, el, vrij, uit, bufTh, bufEl: vrij || uit ? 0 : bufTh / cop, rustUur: !uit && qth > 0 ? bufTh * 1000 / qth : null });
    }
    const kWh = weken.reduce((a, x) => a + x.el * 168 / 1000, 0), A_ = A;
    return { U, A: A_, weken, kWh };
  }

  function ontwerp(o = {}) {
    const s = simuleer(o), cel = {}; let kWh = 0;
    const pcm = o.pcm != null ? o.pcm : VR.pcmKWh;
    ["k2", "k8", "v"].forEach(c => { const m = celMaat(s.piek[c].kg, c); const e = celEnergie(c, m, s.R.voorraad[c], s.R.verwerk[c], o.dikte ? o.dikte[c] : null, pcm[c]); cel[c] = { maat: m, ...e }; kWh += e.kWh; });
    const warm = ["k2", "k8", "v"].reduce((a, c) => a + cel[c].weken.reduce((x, w) => x + (w.vrij || w.uit ? 0 : (w.qth + w.el) * 0.168), 0), 0);   // kWh/jr condensorwarmte
    const perWeek = Array.from({ length: NW }, (_, w) => ({ elW: ["k2", "k8", "v"].reduce((a, c) => a + cel[c].weken[w].el, 0), bufEl: ["k2", "k8", "v"].reduce((a, c) => a + cel[c].weken[w].bufEl, 0) }));
    const kast = { netL: s.piek.b.kg / VR.dichtheid.b, potten: s.piek.b.kg / V.weckKg };
    // thuis: 1 week grijpvoorraad per woning (gemiddeld huishouden), uit koelcel en vriescel in de wintermaanden
    const nW = D.energie ? Object.values(D.energie.mix).reduce((a, b) => a + b, 0) : 15;
    const weekKg = (s.vraag.groente + s.vraag.fruit) / nW * VR.weekThuis, frac = c => { const r = s.R; const tot = r.voorraad.k2[0] + r.voorraad.k8[0] + r.voorraad.v[0] + r.voorraad.b[0] || 1; return r.voorraad[c][0] / tot; };
    const thuisKoelL = weekKg * (frac("k2") + frac("k8")) / 0.3, thuisVriesL = weekKg * frac("v") / 0.4;
    return { s, cel, kWh, warm, perWeek, kast, thuis: { weekKg, koelL: thuisKoelL, vriesL: thuisVriesL } };
  }

  /* gevoeligheid isolatiedikte */
  function dikteReeks(c, diktes, o = {}) {
    const s = simuleer(o), m = celMaat(s.piek[c].kg, c);
    return diktes.map(t => ({ t, ...celEnergie(c, m, s.R.voorraad[c], s.R.verwerk[c], t) }));
  }

  window.HV = { CAT, NAAM, NW, mnd, tMaand, simuleer, celMaat, celEnergie, ontwerp, dikteReeks };
})();
