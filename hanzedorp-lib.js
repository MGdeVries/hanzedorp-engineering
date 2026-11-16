/* =====================================================================
   hanzedorp-lib.js – rekenregels, opmaak en grafieken
   Gedeeld door water.html (basis) en water-technisch.html
   Vereist: hanzedorp-data.js en hanzedorp-dagbalans.js
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, G = window.HANZEDORP_DAGBALANS;
  const MND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const DAGEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const nl = (v, d = 0) => Number(v).toLocaleString("nl-NL", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtTank = t => nl(t, t % 1 ? 1 : 0);

  /* ---------- Afgeleide waarden ---------- */
  const M = D.meting, T = M.toilet, DB = D.dagbalans, W = D.waterschap;
  const lpp = M.lpd / M.personen;
  const mmNormaal = D.neerslag.mm.reduce((a, b) => a + b, 0);
  const dakTot = D.woningen.reduce((a, w) => a + w.n * w.dak, 0);
  const nWoningen = D.woningen.reduce((a, w) => a + w.n, 0);
  const nBewoners = D.woningen.reduce((a, w) => a + w.n * w.pers, 0);
  const tlLpd = T.kleinDag * T.lKlein + T.grootDag * T.lGroot;
  const wmM3 = M.wasmachine.cycli * M.wasmachine.lPerCyclus / 1000;
  const vwM3 = M.vaatwasser.cycli * M.vaatwasser.lPerCyclus / 1000;
  const tlM3 = tlLpd * 365 / 1000;
  const aandeelMeting = { toilet: tlLpd / M.lpd, wasmachine: wmM3 / M.m3jaar, buiten: D.cbs.aandeel.buiten };
  const normaalTm22okt = D.neerslag.mm.slice(0, 9).reduce((a, b) => a + b, 0) + D.neerslag.mm[9] * 22 / 31;
  const DT = Object.fromEntries(D.daktypes.map(d => [d.id, d]));
  const dtStd = D.daktypes.find(d => d.standaard);
  const A = {
    lpp, mmNormaal, dakTot, nWoningen, nBewoners, wmM3, vwM3, tlM3, tlLpd, normaalTm22okt, aandeelMeting,
    wmPct: wmM3 / M.m3jaar * 100, vwPct: vwM3 / M.m3jaar * 100, tlPct: tlLpd / M.lpd * 100,
    regenPct: (tlM3 + wmM3) / M.m3jaar * 100, wwKwhJaar: M.warmwaterKwhDag * 365,
    verhardStraat: nWoningen * D.verhard.perWoningM2,
    bergingMaxM3: (dakTot + nWoningen * D.verhard.perWoningM2) * W.bergingMm / 1000,
    bergingMinM3: (dakTot * (1 - D.dak.aandeelGroen) + nWoningen * D.verhard.perWoningM2) * W.bergingMm / 1000,
    bergingDakenM3: dakTot * W.bergingMm / 1000,
    tuinMediaanM3: G.tekort.mediaan * 10 * D.tuinderij.ha, tuinP90M3: G.tekort.p90 * 10 * D.tuinderij.ha, tuinMaxM3: G.tekort.max * 10 * D.tuinderij.ha
  };

  /* ---------- Dagbalans: opzoeken in het voorgerekende raster ---------- */
  const parse = s => s.split("|").map(r => r.split(",").map(Number));
  const RG = {};
  ["m", "c"].forEach(k => { RG[k] = {}; ["gem", "p10", "min", "a", "o"].forEach(f => RG[k][f] = parse(G[k][f])); });
  const PJ = {}; Object.keys(G.m.pj).forEach(c => PJ[c] = parse(G.m.pj[c]));
  const cKey = C => String(C);
  function dag(scen = "meting", tank = D.tankPerWoning, C = dtStd.C) {
    const k = scen === "meting" ? "m" : "c";
    const j = G.tanks.indexOf(tank), i = G.Cs.findIndex(c => Math.abs(c - C) < 1e-9);
    if (i < 0 || j < 0) throw new Error("Combinatie tank/C niet in raster");
    const pj = (k === "m" && PJ[cKey(C)]) ? PJ[cKey(C)][j] : null;
    let minJaar = null; if (pj) { const mn = Math.min(...pj); minJaar = G.years[pj.indexOf(mn)]; }
    const vraagJ = G.vraag[k] * 365;
    return { gem: RG[k].gem[i][j], p10: RG[k].p10[i][j], min: RG[k].min[i][j], aanv: RG[k].a[i][j], over: RG[k].o[i][j],
      perJaar: pj, minJaar, n99: pj ? pj.filter(v => v >= 99).length : null, vraagJ,
      bespaardM3: vraagJ * RG[k].gem[i][j] / 100 };
  }

  /* ---------- Dagbalans per toepassing (alleen harde dakdelen; optioneel straatwater) ---------- */
  const RT = {};
  Object.keys(G.toep).forEach(t => { RT[t] = {}; ["m", "c"].forEach(k => { RT[t][k] = {};
    Object.keys(G.toep[t][k]).forEach(f => RT[t][k][f] = f === "pj" ? parse(G.toep[t][k][f]) : G.toep[t][k][f].split(",").map(Number)); }); });
  function dagT(toep = "toiletWas", scen = "meting", tank = D.tankPerWoning) {
    if (window.HM && HM.tank && HM.vraag) {   // live (woningaantal uit de databron); raster alleen als terugval
      const v = HM.vraag({ cbs: scen === "cbs" }), straat = toep === "toiletWasStraat";
      const r = HM.tank({ vraag: v.regenvraag(straat ? "toiletWas" : toep), tankPW: tank, AC: straat ? G.toep.toiletWasStraat.AC : undefined });
      return Object.assign({}, r, { aanv: r.aanvulling, over: r.overloop, bespaardM3: r.vraagJ * r.gem / 100 });
    }
    const k = scen === "meting" ? "m" : "c", j = G.tanks.indexOf(tank), R = RT[toep][k];
    const pj = R.pj ? R.pj[j] : null;
    let minJaar = null; if (pj) { const mn = Math.min(...pj); minJaar = G.years[pj.indexOf(mn)]; }
    const v = G.toep[toep][k === "m" ? "vm" : "vc"], vraagJ = v * 365;
    return { gem: R.gem[j], p10: R.p10[j], min: R.min[j], aanv: R.a[j], over: R.o[j], perJaar: pj, minJaar,
      n99: pj ? pj.filter(x => x >= 99).length : null, vraagJ, bespaardM3: vraagJ * R.gem[j] / 100, AC: G.toep[toep].AC };
  }

  /* ---------- Maandbalans op klimaatnormalen (ter vergelijking) ---------- */
  function maandModel(o = {}) {
    const opt = Object.assign({ vraag: "meting", droog: false, tankPW: D.tankPerWoning, C: dtStd.C }, o);
    const aand = opt.vraag === "meting" ? aandeelMeting : D.cbs.aandeel;
    const aandeel = aand.toilet + aand.wasmachine;
    const Lpd = D.woningen.reduce((s, w) => s + w.n * (opt.vraag === "meting" ? w.pers * lpp : D.cbs.huishouden[w.pers]), 0);
    const tankTot = opt.tankPW * nWoningen, f = opt.droog ? D.neerslag.droogFactor : 1;
    const opbr = D.neerslag.mm.map(mm => dakTot * opt.C * mm * f / 1000);
    const vraag = DAGEN.map(d => Lpd * aandeel * d / 1000);
    let tank = tankTot / 2, res;
    for (let y = 0; y < 2; y++) {
      res = { tank: [], over: 0, aanv: 0 };
      for (let m = 0; m < 12; m++) {
        let t = tank + opbr[m] - vraag[m];
        if (t > tankTot) { res.over += t - tankTot; t = tankTot; }
        if (t < 0) { res.aanv += -t; t = 0; }
        tank = t; res.tank.push(t);
      }
    }
    const vraagJ = vraag.reduce((a, b) => a + b, 0);
    return { aandeel, Lpd, opbr, vraag, vraagJ, tank: res.tank, over: res.over, aanv: res.aanv, dek: vraagJ > 0 ? (vraagJ - res.aanv) / vraagJ : 0 };
  }

  /* ---------- Bindings: <x data-k="naam"> ---------- */
  function bindAll(extra = {}) {
    const s5 = dag("meting", 5), c5 = dag("cbs", 5), s0 = dag("meting", 0), s1 = dag("meting", 1), s10 = dag("meting", 10);
    const h5 = dag("meting", 5, DT.hard.C), hh5 = dag("meting", 5, DT.halfHard.C), g5 = dag("meting", 5, DT.groen.C);
    const opbrJaar = C => dakTot * C * DB.mmGemiddeld / 1000;
    const tw5 = dagT("toiletWas", "meting", 5), t5 = dagT("toilet", "meting", 5), ts5 = dagT("toiletWasStraat", "meting", 5);
    const b = Object.assign({
      versie: D.versie, datum: D.datum, auteur: D.auteur,
      lpd: nl(M.lpd), lpp: nl(lpp), cbs4: nl(D.cbs.pp4), m3jaar: nl(M.m3jaar), periode: M.periode,
      mmNormaal: nl(mmNormaal), dakTot: nl(dakTot), nWoningen: nl(nWoningen), nBewoners: nl(nBewoners),
      woningMix: D.woningen.map(w => w.n).join("/"),
      cHard: nl(D.dak.cHard, 2), cGroen: nl(D.dak.cGroen, 2), cStd: nl(dtStd.C, 2), dtStdNaam: dtStd.naam.toLowerCase(),
      cHalfHard: nl(DT.halfHard.C, 2),
      wmCycli: nl(M.wasmachine.cycli), wmL: nl(M.wasmachine.lPerCyclus), wmM3: nl(wmM3, 1), wmPct: nl(A.wmPct),
      wmBand: nl(M.wasmachine.lBandLaag) + "–" + nl(M.wasmachine.lBandHoog),
      vwCycli: nl(M.vaatwasser.cycli), vwL: nl(M.vaatwasser.lPerCyclus, 1), vwM3: nl(vwM3, 1), vwPct: nl(A.vwPct), vwNacht: nl(M.vaatwasser.nNacht),
      tlLKlein: nl(T.lKlein, 1), tlLGroot: nl(T.lGroot), tlKleinDag: nl(T.kleinDag), tlGrootDag: nl(T.grootDag),
      tlLpd: nl(tlLpd), tlPct: nl(A.tlPct), regenPct: nl(A.regenPct),
      wwKwhDag: nl(M.warmwaterKwhDag, 1), wwKwhJaar: nl(Math.round(A.wwKwhJaar / 50) * 50), phRv: nl(D.passiefhuis.ruimteverwarmingMax),
      droog2018: nl(D.neerslag.droog2018_tm22okt, 1), normaalTm22okt: nl(normaalTm22okt), droogPct: nl(D.neerslag.droogFactor * 100),
      nulwaarden: nl(M.opschoning.nulwaarden), gaten: nl(M.opschoning.gatenGroterDan15min), langsteGat: M.opschoning.langsteGat,
      dbStation: DB.station, dbCoord: DB.coord, dbReeks: DB.reeks, dbJaren: nl(DB.jaren), dbVan: DB.jaarVan, dbTot: DB.jaarTot,
      dbUitgesloten: DB.uitgesloten, dbMm: nl(DB.mmGemiddeld), dbVraagM: nl(G.vraag.m, 3), dbVraagC: nl(G.vraag.c, 3),
      droogDagen: nl(DB.langsteDroogte.dagen), droogJaar: DB.langsteDroogte.jaar, tankPW: fmtTank(D.tankPerWoning),
      d5gem: nl(s5.gem), d5p10: nl(s5.p10), d5min: nl(s5.min), d5minJaar: s5.minJaar, d5aanv: nl(s5.aanv), d5over: nl(s5.over), d5n99: nl(s5.n99),
      c5gem: nl(c5.gem), c5min: nl(c5.min),
      d0gem: nl(s0.gem), d1gem: nl(s1.gem), d10gem: nl(s10.gem),
      h5gem: nl(h5.gem), hh5gem: nl(hh5.gem), g5gem: nl(g5.gem),
      m0dek: nl(maandModel({ tankPW: 0 }).dek * 100),
      opbrStd: nl(opbrJaar(dtStd.C)), vraagRegenJ: nl(G.vraag.m * 365),
      prijs: nl(D.drinkwaterPrijs, 2), besparingTot: nl(s5.bespaardM3 * D.drinkwaterPrijs), besparingWoning: nl(s5.bespaardM3 * D.drinkwaterPrijs / nWoningen),
      bespaardM3Woning: nl(s5.bespaardM3 / nWoningen),
      tw5: nl(tw5.gem), tw5p10: nl(tw5.p10), tw5min: nl(tw5.min), tw5minJaar: tw5.minJaar, tw2: nl(dagT("toiletWas", "meting", 2).gem), tw5aanv: nl(tw5.aanv),
      t5: nl(t5.gem), t5p10: nl(t5.p10), t5min: nl(t5.min), t3: nl(dagT("toilet", "meting", 3).gem),
      ts5: nl(ts5.gem), ts25: nl(dagT("toiletWasStraat", "meting", 2.5).gem), ts5over: nl(ts5.over), tsAC: nl(G.toep.toiletWasStraat.AC),
      tw5c: nl(dagT("toiletWas", "cbs", 5).gem), t5c: nl(dagT("toilet", "cbs", 5).gem),
      acHard: nl(G.toep.toiletWas.AC), opbrHard: nl(G.toep.toiletWas.AC * DB.mmGemiddeld / 1000), vraagTW: nl(G.toep.toiletWas.vm * 365), vraagT: nl(G.toep.toilet.vm * 365),
      besTW: nl(tw5.bespaardM3 * D.drinkwaterPrijs / nWoningen), besT: nl(t5.bespaardM3 * D.drinkwaterPrijs / nWoningen), besTS: nl(ts5.bespaardM3 * D.drinkwaterPrijs / nWoningen),
      m3TW: nl(tw5.bespaardM3 / nWoningen), verhardStraat: nl(A.verhardStraat), cStraat: nl(D.verhard.cStraat, 2), verhardPW: nl(D.verhard.perWoningM2),
      bergMax: nl(A.bergingMaxM3), bergMin: nl(A.bergingMinM3), ws2024: nl(W.bergingMm2024),
      gdJa: nl(W.groendakLandelijk.ja), gdJaMits: nl(W.groendakLandelijk.jaMits), gdNeeTenzij: nl(W.groendakLandelijk.neeTenzij), gdNee: nl(W.groendakLandelijk.nee), gdN: nl(W.groendakLandelijk.n),
      kZak: "€ " + nl(D.kosten[0].min) + "–" + nl(D.kosten[0].max), kTank: "€ " + nl(D.kosten[1].min) + "–" + nl(D.kosten[1].max),
      tvMin: nl(D.kosten[0].min / (tw5.bespaardM3 * D.drinkwaterPrijs / nWoningen), 0), tvMax: nl(D.kosten[1].max / (tw5.bespaardM3 * D.drinkwaterPrijs / nWoningen), 0),
      wsDrempel: nl(W.drempelM2), wsBerging: nl(W.bergingMm), wsBui: nl(W.toetsbuiMm), wsBuiUur: nl(W.toetsbuiUur), wsAfvoer: nl(W.afvoerLsHa, 1),
      wsVloer: nl(W.vloerpeilBovenGhgCm), wsDrempelStraat: nl(W.drempelBovenStraatCm), bergingDaken: nl(A.bergingDakenM3),
      tuinHa: nl(D.tuinderij.ha), tekMed: nl(G.tekort.mediaan), tekP90: nl(G.tekort.p90), tekMax: nl(G.tekort.max), evGem: nl(G.tekort.evJaarGem),
      tuinMed: nl(A.tuinMediaanM3), tuinP90: nl(A.tuinP90M3), tuinMax: nl(A.tuinMaxM3), tuinFactor: nl(A.tuinMediaanM3 / opbrJaar(dtStd.C), 0),
      wRh: nl(M.weer.neerslagMm), wPct: nl(M.weer.neerslagMm / DB.mmGemiddeld * 100), wApril: nl(M.weer.aprilMm), wEv: nl(M.weer.verdampingMm),
      wWarm: nl(M.weer.warmeDagen), wLWarm: nl(M.weer.lpdWarm), wLOverig: nl(M.weer.lpdOverig),
      wWarmPct: nl((M.weer.lpdWarm / M.weer.lpdOverig - 1) * 100), wCorr: nl(M.weer.corrTx, 2)
    }, extra);
    document.querySelectorAll("[data-k]").forEach(el => { if (b[el.dataset.k] !== undefined) el.textContent = b[el.dataset.k]; });
  }

  /* ---------- Bronnenlijst ---------- */
  function bronItem(id) {
    const s = D.bronnen[id];
    const li = document.createElement("li"); li.id = "bron-" + id; li.value = +id;
    const t = document.createElement("i"); t.textContent = s.titel; li.appendChild(t);
    li.appendChild(document.createTextNode(" – " + s.auteur + "."));
    if (s.noot) li.appendChild(document.createTextNode(" " + s.noot.charAt(0).toUpperCase() + s.noot.slice(1) + "."));
    if (s.url) { li.appendChild(document.createTextNode(" ")); const a = document.createElement("a"); a.href = s.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = s.url.replace(/^https?:\/\//, "").slice(0, 70) + (s.url.length > 78 ? "…" : ""); li.appendChild(a); }
    return li;
  }
  function renderBronnen(el, ids) { (ids || Object.keys(D.bronnen)).forEach(id => el.appendChild(bronItem(id))); }

  /* ---------- Grafieken (SVG, zonder bibliotheek) ---------- */
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function bars(el, { labels, series, line, unit, lineUnit = "", height = 230, labelEvery = 1, yMax, ref }) {
    const W = 580, H = height, L = 46, R = line ? 50 : 10, Tp = 18, B = 28, pw = W - L - R, ph = H - Tp - B;
    const maxV = yMax || niceMax(Math.max(...series.flatMap(s => s.values)) * 1.05);
    const n = labels.length, band = pw / n, gw = band * 0.8, bw = gw / series.length;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
    for (let i = 0; i <= 4; i++) {
      const v = maxV * i / 4, y = Tp + ph - ph * i / 4;
      s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" style="stroke:var(--grid)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" class="sm mono">${nl(v, maxV < 2 ? 2 : maxV < 10 ? 1 : 0)}</text>`;
    }
    s += `<text x="${L}" y="${Tp - 6}" class="sm">${unit}</text>`;
    labels.forEach((lb, i) => {
      const x0 = L + band * i + (band - gw) / 2;
      series.forEach((se, j) => {
        const v = se.values[i], h = ph * Math.min(v, maxV) / maxV;
        const col = se.colorFn ? se.colorFn(v) : se.color;
        s += `<rect x="${x0 + bw * j}" y="${Tp + ph - h}" width="${Math.max(bw - 1.5, 1)}" height="${h}" rx="2" style="fill:${col}"><title>${lb} – ${se.name || ""}: ${nl(v, se.dec || 0)} ${se.unit || unit}</title></rect>`;
      });
      if (i % labelEvery === 0) s += `<text x="${L + band * i + band / 2}" y="${H - 8}" text-anchor="middle" class="sm">${lb}</text>`;
    });
    if (ref !== undefined) { const y = Tp + ph - ph * ref / maxV; s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" style="stroke:var(--muted);stroke-dasharray:4 4"/>`; }
    if (line) {
      const lm = line.max || niceMax(Math.max(...line.values, 1) * 1.05);
      for (let i = 0; i <= 4; i++) { const y = Tp + ph - ph * i / 4; s += `<text x="${W - R + 6}" y="${y + 4}" class="sm mono">${nl(lm * i / 4)}</text>`; }
      const pts = line.values.map((v, i) => [L + band * i + band / 2, Tp + ph - ph * v / lm]);
      s += `<polyline points="${pts.map(p => p.join(",")).join(" ")}" style="fill:none;stroke:${line.color};stroke-width:2;stroke-linejoin:round"/>`;
      pts.forEach((p, i) => s += `<circle cx="${p[0]}" cy="${p[1]}" r="3" style="fill:${line.color}"><title>${labels[i]}: ${nl(line.values[i], 1)} ${lineUnit}</title></circle>`);
      s += `<text x="${W - R}" y="${Tp - 6}" text-anchor="end" class="sm">${lineUnit}</text>`;
    }
    el.innerHTML = s + "</svg>";
  }

  window.HZ = { D, G, A, DT, dtStd, MND, DAGEN, nl, fmtTank, dag, dagT, maandModel, bindAll, renderBronnen, bars };
})();
