/* =====================================================================
   hanzedorp-energie.js – bewoners, comfort en de energiebalans van het dorp (window.HE)
   Vereist: hanzedorp-data.js, hanzedorp-weer.js, hanzedorp-zon.js, hanzedorp-wind.js,
            hanzedorp-model.js (HM.pvReeks, HM.vraagMm)
   Tijdstap 1 uur, 1994-01-01 t/m 2025-12-31; statistiek over 31 jaren (excl. 1998).
     - zon: dagsom Q (KNMI) verdeeld over de uren (zie HM.pvReeks; Erbs e.a. 1982)
     - wind: dagopbrengst per erfmolen uit KNMI-uurwind (hanzedorp-wind.js), over de uren verdeeld met
       het gemiddelde dagverloop per maand (E.windUur)
     - warmte: graaddagenmodel per dag uit TG, gekalibreerd op 15 kWh/m² bij 20 °C binnen
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, E = D.energie, MOB = D.mobiliteit, W = window.HANZEDORP_WEER, WI = window.HANZEDORP_WIND;
  const TYPES = ["gezin", "senior", "junior"], NAAM = { gezin: "Gezinswoning", senior: "Seniorenwoning", junior: "Jongerenwoning" };
  const J = W.jaren, NJ = J.length, n = W.n;

  /* ---- warmtevraag: kalibratie UA (kWh per m² per K per uur) ---- */
  function graadUren(Tb) { let s = 0; for (let i = 0; i < n; i++) if (W.Y[i] !== 1998) s += Math.max(0, Tb - WI.TG[i]) * 24; return s / NJ; }
  const UA = E.qh20 / graadUren(20 - E.dTint);
  const cop = T => Math.max(E.cop.min, Math.min(E.cop.max, E.cop.a + E.cop.b * T));
  /* warmte (kWh/m²·jr) en elektriciteit (kWh/m²·jr) bij binnentemperatuur Tin */
  function warmte(Tin) {
    const Tb = Tin - E.dTint; let q = 0, e = 0;
    for (let i = 0; i < n; i++) if (W.Y[i] !== 1998) { const d = UA * Math.max(0, Tb - WI.TG[i]) * 24; q += d; e += d / cop(WI.TG[i]); }
    return { q: q / NJ, e: e / NJ, scop: q / e };
  }

  /* ---- bewoners: aantal en thuisdagen per woningtype ---- */
  function bewoners(o = {}) {
    const lf = D.levensfase.find(x => x.id === (o.levensfase || "start")), tw = D.thuiswerk.find(x => x.id === (o.thuiswerk || "ref"));
    const r = {};
    TYPES.forEach(t => {
      const rollen = lf[t]; let werk = 0, thuis = 0, thuiswerk = 0;
      rollen.forEach(rol => { if (rol === "pensioen") thuis += 5; else if (rol === "werkend") { const td = t === "gezin" ? tw.gezin[Math.min(werk++, 1)] || 0 : t === "junior" ? tw.junior : 0; thuis += td; thuiswerk += td; } });
      r[t] = { pers: rollen.length, thuisDagenWeek: thuis, thuiswerkDagenWeek: thuiswerk, rollen };
    });
    return r;
  }

  /* ---- jaarverbruik per woning (kWh) ---- */
  function woning(t, o = {}) {
    const b = (o.bew || bewoners(o))[t], p = b.pers, opp = E.opp[t];
    const Tin = o.tin != null ? o.tin : E.tin, wm = o.warmte || warmte(Tin);
    const verw = opp * wm.e;
    const ww = p * E.wwKWhPP;
    const wtw = opp * E.wtwWm2 * 8.76;
    // thuiswerken: ± 1,5 kWh per thuiswerkdag (scherm, laptop, dock) [68]; overige dagen thuis (pensioen) 0,6 kWh
    const tw = b.thuiswerkDagenWeek != null ? b.thuiswerkDagenWeek : b.thuisDagenWeek;
    const thuiswerk = tw * 52 * E.thuiswerkKWh + Math.max(0, b.thuisDagenWeek - tw) * 52 * E.thuisDagKWh;
    const quooker = o.quooker === false ? 0 : (E.quookerKWh || 0);   // kokendwaterkraan per woning [104]
    const app = (E.app.a + E.app.b * p) * (o.appScen === "gemeten" ? E.appGemetenFactor : 1) + thuiswerk + quooker;
    // rekenbasis [68]/[200]: drogen in de warme technische ruimte (eigen droger is een vrije keuze); verdampingswarmte in het stookseizoen uit de warmtepomp
    const dr = E.droogRuimte, nWas = p * E.wit.wasPP;
    const droog = p * E.wit.droogPP * E.wit.droogKWh + nWas * dr.kgWas * dr.restvocht * dr.latent * dr.stookAandeel / dr.cop;
    const wit = nWas * E.wit.wasKWh + p * E.wit.vaatPP * E.wit.vaatKWh + droog;
    const kv = o.koel || E.koelStd;
    // centraal: manshoge koelkast + vriezer thuis (grijpvoorraad) + cellen in het buurthuis; thuis: idem + extra wintervoorraad thuis
    const koel = kv === "gemeten" ? E.koel.gemeten.koel + E.koel.gemeten.vries : E.koel.thuisGroot.koel + E.koel.thuisGroot.vries + (kv === "thuis" ? E.koel.extraWinterThuis : 0);
    const deel = !!o.deelauto, kmF = deel ? MOB.deelFactor : 1;
    const auto = MOB.km[t] * kmF * MOB.kWh100 / 100;
    const fiets = p * MOB.efietsKmPP * MOB.efietsKWh100 / 100, motor = MOB.emotor.aandeel * MOB.emotor.km * MOB.emotor.kWh100 / 100;
    const huis = verw + ww + wtw + app + wit + koel;
    return { t, naam: NAAM[t], pers: p, opp, verw, ww, wtw, app, thuiswerk, quooker, wit, droog, koel, auto, fiets, motor, mob: auto + fiets + motor, huis, totaal: huis + auto + fiets + motor, kWp: (o.kWpDakType || E.kWpDak)[t] };
  }

  /* ---- centrale koel- en vriescel ---- */
  function cellen() {
    const c = E.koel.cel, A = 2 * (c.b * c.d + c.b * c.h + c.d * c.h), volL = c.b * c.d * c.h * 1000;
    const qk = c.Ukoel * A * (c.ruimteT - c.koelT) * c.extra, qv = c.Uvries * A * (c.ruimteT - c.vriesT) * c.extra;   // W thermisch
    const ek = qk / c.copKoel * c.hulp * 8.76, ev = qv / c.copVries * c.hulp * 8.76;                                    // kWh/jr
    const warm = (qk + qv) * 8.76 + ek + ev;                                                                          // kWh/jr restwarmte condensor
    return { A, volL, nuttigL: volL * 0.4, qk, qv, ek, ev, e: ek + ev, warm, lit: (E.koel.literatuurKWhDag.koel + E.koel.literatuurKWhDag.vries) * 365 };
  }

  /* cellen volgens het voorraadmodel (hanzedorp-voorraad.js) */
  let _hv = {};
  function celHV(o) { const k = JSON.stringify(o.pcm || null); if (!_hv[k]) { const r = HV.ontwerp({ pcm: o.pcm }); _hv[k] = { e: r.kWh, perWeek: r.perWeek, hv: r }; } return _hv[k]; }

  /* ---- dorp: alle woningen + gemeenschappelijk ----
     o.inv (optioneel): inventarisatie uit inventarisatie.html (HI.lees()); dan per woning rekenen met het
     opgegeven aantal personen, thuisdagen en voertuigen (kWh incl. laadverlies) in plaats van de standaardmix. */
  function dorp(o = {}) {
    const wm = warmte(o.tin != null ? o.tin : E.tin);
    const inv = o.inv && o.inv.woningen && o.inv.woningen.length ? o.inv : null;
    let lijst;
    if (inv) {
      lijst = inv.woningen.map(w => {
        const p = Math.max(1, w.personen.length), td = w.personen.reduce((a, q) => a + (+q.thuis || 0), 0);
        const r = woning(w.type, Object.assign({}, o, { warmte: wm, bew: { [w.type]: { pers: p, thuisDagenWeek: td } } }));
        const mobInv = window.HI ? HI.kWhWoning(w, inv.laadverlies) : 0;
        return Object.assign(r, { auto: mobInv, fiets: 0, motor: 0, mob: mobInv, totaal: r.huis + mobInv });
      });
    } else {
      const mix = o.mix || E.mix, bew = bewoners(o);
      lijst = [];
      TYPES.forEach(t => { const r = woning(t, Object.assign({}, o, { bew, warmte: wm })); for (let k = 0; k < (mix[t] || 0); k++) lijst.push(r); });
    }
    const mix = { gezin: 0, senior: 0, junior: 0 }; lijst.forEach(w => mix[w.t]++);
    const per = {}; TYPES.forEach(t => { const l = lijst.filter(w => w.t === t); if (l.length) per[t] = l[0]; else per[t] = woning(t, Object.assign({}, o, { warmte: wm })); });
    const som = k => lijst.reduce((a, w) => a + w[k], 0);
    const pers = som("pers"), nW = lijst.length;
    const cel = (o.koel || E.koelStd) === "centraal" ? (window.HV ? celHV(o) : cellen()) : null;
    const keuken = pers * (E.keuken.pottenPP * E.keuken.kWhPot + E.keuken.droogKgPP * E.keuken.kWhDroog);
    const vijver = E.vijverPompW * 24 * 183 / 1000;
    const WP = E.werkplaats, wpPers = o.werkplaats != null ? o.werkplaats : WP.pers, werkplaats = wpPers * WP.dagen * WP.kWhPersDag + (wpPers > 0 ? WP.verwarmKWh || 0 : 0);
    const akkerM2 = o.akkerM2 != null ? o.akkerM2 : D.akker.maxM2;
    return { mix, per, lijst, inv: !!inv, pers, nW, cel, keuken, vijver, werkplaats, wpPers, buurthuis: E.buurthuisKWh, akkerM2, warmte: wm,
      huis: som("huis"), mob: som("mob"), verw: som("verw"), ww: som("ww"), wtw: som("wtw"), app: som("app"), wit: som("wit"), koel: som("koel"),
      auto: som("auto"), kWpDak: som("kWp"), opp: som("opp") };
  }

  /* ---- uursimulatie van het dorp ---- */
  function simuleer(o = {}) {
    const d = dorp(o), r = HM.pvReeks(), K = D.akker;
    const nWind = o.wind != null ? o.wind : E.wind.n, kWpAgri = o.agri === false ? 0 : HM.pvAkker({ rijen: o.rijen }).kWp;
    const kWpDak = d.kWpDak + (o.pvExtra != null ? o.pvExtra : E.pvExtraKWp);
    const vlakken = (o.pvVlakken || (o.oudPV ? [] : E.scenarioC.vlakken)).map(v => ({ kWp: v.kWp, s: HM.pvVlak(v.b, v.a, v.bif || 0, v.pr || E.pvDakPR) }));
    const cap = o.accu != null ? o.accu : E.accu.kWh, pAcc = o.accuKW != null ? o.accuKW : E.accu.kW, eta = Math.sqrt(E.accu.eta);
    const nZ = o.zappi != null ? o.zappi : MOB.zappi.n, pLaad = nZ * Math.min(MOB.zappi.kW, MOB.zappi.autoAC);
    const Tin = o.tin != null ? o.tin : E.tin, Tb = Tin - E.dTint;
    const oppTot = d.opp;
    // jaarlijkse vaste posten (kWh/jr)
    const profiel = E.profiel, psom = profiel.reduce((a, b) => a + b, 0);
    const jrProf = d.app + d.wit + d.buurthuis + d.keuken;                       // met dagprofiel
    const jrVlak = d.wtw + d.koel + (d.cel && !d.cel.perWeek ? d.cel.e : 0);      // continu (cellen zonder weekprofiel ook continu)
    const celW = d.cel && d.cel.perWeek ? d.cel.perWeek : null, pCel = D.voedsel.voorraad.pMax;
    let koude = 0, doy = 0, yPrev = -1;
    const evDag = d.mob / 365, wwDag = d.ww / 365;
    const dt = HM.vraagMm(K.kc, K.raw), pompF = K.pompP1 * (1 / K.pompQirr + 1 / Math.min(K.pompQvul, K.putMaxM3h));
    const wuN = E.windUur.map(r => { const g = r.reduce((a, b) => a + b, 0) / 24; return r.map(v => v / g); });
    let soc = cap * 0.5, achter = 0;
    const netKW = o.netKW || 0, expKW = o.expKW != null ? o.expKW : null, reserve = o.reserve != null ? o.reserve : 0.5;
    const blok = o.blokUren ? new Set(o.blokUren) : null, bStart = blok ? Math.min(...o.blokUren) : 0, resVoor = o.reserveVoor != null ? o.reserveVoor : reserve, meet = o.meetUren ? new Set(o.meetUren) : null;   // 18-11-2026 [206]: geen afname in congestie-uren; accu vooraf bijladen tot resVoor
    const yr = {}, mnd = Array.from({ length: 12 }, () => ({ vraag: 0, zon: 0, agri: 0, wind: 0, imp: 0, exp: 0, verw: 0 }));
    const dImp = new Float64Array(n), dExp = new Float64Array(n), dZon = new Float64Array(n), dWind = new Float64Array(n), dVraag = new Float64Array(n);
    const uurJaar = o.uurJaar || null, uur = uurJaar ? { vraag: [], zon: [], wind: [], imp: [], exp: [], soc: [], ev: [] } : null;
    const uurJ = o.uurJaren || null, reeks = uurJ ? { vraag: [], aanbod: [], dag: [], uur: [], verw: [], wp: [], woning: [], ev: [], zon: [], wind: [] } : null;   // v0.18: verbruik per groep (wp = warmtepomp verwarming + tapwater; woning = overig woningverbruik; ev = laden; rest = gemeenschappelijk)   // ruwe uurreeks voor de handelssimulatie (hanzedorp-net.js)
    for (let i = 0; i < n; i++) {
      const y = W.Y[i], m = W.M[i], T = WI.TG[i];
      if (y !== yPrev) { doy = 0; yPrev = y; } else doy++;
      const wk = celW ? celW[Math.min(51, Math.floor(doy / 7))] : null;
      const R = yr[y] || (yr[y] = { impBlok: 0, uBlok: 0, impMeet: 0, vraag: 0, zon: 0, agri: 0, wind: 0, imp: 0, exp: 0, pImp: 0, pExp: 0, uImp: 0, verw: 0, ev: 0, evGedwongen: 0, pEv: 0, cel: 0, celGedwongen: 0, tekort: 0, pTekort: 0, uTekort: 0, netLaad: 0, afgeschakeld: 0 });
      const verwDag = oppTot * UA * Math.max(0, Tb - T) * 24 / cop(T);
      const pompDag = dt[i] * d.akkerM2 / 1000 / K.eta * pompF;
      const vijverH = (m >= 3 && m <= 8) ? E.vijverPompW / 1000 : 0;
      const dow = (i + 5) % 7, wpH = dow < 5 ? d.werkplaats / (261 * (E.werkplaats.tot - E.werkplaats.van)) : 0;   // ma–vr; 1994-01-01 = zaterdag
      achter += evDag;
      const wDag = WI.EW[i] / 24 * nWind, wu = wuN[m];
      for (let h = 0; h < 24; h++) {
        let zon = r.ghiUur[i][h] * E.pvDakPR * kWpDak; for (const v of vlakken) zon += v.s[i][h] * v.kWp;
        const agri = r.uurP[i][h] * kWpAgri;
        let vraag = jrProf / 365 * profiel[h] / psom + jrVlak / 8760 + verwDag / 24 + vijverH
          + (E.wwUren.includes(h) ? wwDag / E.wwUren.length : 0) + (h >= 10 && h < 17 ? pompDag / 7 : 0) + (h >= E.werkplaats.van && h < E.werkplaats.tot ? wpH : 0);
        const wind = wDag * wu[h];
        let aanbod = zon + agri + wind;
        // gedwongen laden als de achterstand groter is dan flexDagen × dagvraag
        let ev = 0, gedw = o.evDom ? (h >= 18 && h < 22 ? evDag / 4 : 0) : Math.max(0, achter - MOB.flexDagen * evDag);
        if (gedw > 0) { const q = o.evDom ? gedw : Math.min(pLaad, gedw); ev += q; achter -= q; vraag += q; R.evGedwongen += q; if (q > R.pEv) R.pEv = q; }
        let saldo = aanbod - vraag;
        if (!o.evDom && saldo > 0 && achter > 0) { const q = Math.min(saldo, pLaad - ev, achter); ev += q; achter -= q; vraag += q; saldo -= q; }
        if (ev > R.pEv) R.pEv = ev;
        if (wk) {           // koel-/vriescellen: koude als buffer; voorkoelen op overschot, rusten tot de buffer op is
          if (koude > wk.bufEl) koude = wk.bufEl;
          const nodig = wk.elW / 1000; koude -= nodig; let q = 0;
          if (saldo > 0) { q = Math.min(saldo, pCel, wk.bufEl - koude); if (q < 0) q = 0; koude += q; saldo -= q; vraag += q; }
          if (koude < 0) { const f = -koude; koude = 0; q += f; vraag += f; saldo -= f; R.celGedwongen += f; }
          R.cel += q;
        }
        let imp = 0, exp = 0;
        if (saldo > 0) { const q = Math.min(saldo, pAcc, (cap - soc) / eta); soc += q * eta; exp = saldo - q; }
        else if (saldo < 0) { const q = Math.min(-saldo, pAcc, soc * eta); soc -= q / eta; imp = -saldo - q; }
        // begrensde netaansluiting: import boven de limiet = tekort; accu bijladen uit het net tot de reservegrens (opgave Melvin)
        if (netKW) {
          if (imp > netKW) { R.tekort += imp - netKW; if (imp - netKW > R.pTekort) R.pTekort = imp - netKW; R.uTekort++; imp = netKW; }
          const inBlok = blok && blok.has(h), res = cap * (blok && !inBlok && h < bStart ? resVoor : reserve);
          if (inBlok && imp > 0.01) { R.impBlok += imp; R.uBlok++; }
          if (!inBlok && soc < res && imp < netKW) { const q = Math.min(netKW - imp, pAcc, (res - soc) / eta); soc += q * eta; imp += q; R.netLaad += q; }
        }
        if (meet && meet.has(h)) R.impMeet += imp;
        if (expKW != null && exp > expKW) { R.afgeschakeld += exp - expKW; exp = expKW; }
        R.vraag += vraag; R.zon += zon; R.agri += agri; R.wind += wind; R.imp += imp; R.exp += exp; R.ev += ev; R.verw += verwDag / 24;
        if (imp > R.pImp) R.pImp = imp; if (exp > R.pExp) R.pExp = exp; if (imp > 0.01) R.uImp++;
        dImp[i] += imp; dExp[i] += exp; dZon[i] += zon + agri; dWind[i] += wind; dVraag[i] += vraag;
        if (y !== 1998) { const M = mnd[m]; M.vraag += vraag / NJ; M.zon += zon / NJ; M.agri += agri / NJ; M.wind += wind / NJ; M.imp += imp / NJ; M.exp += exp / NJ; M.verw += verwDag / 24 / NJ; }
        if (reeks && uurJ.includes(y)) { reeks.vraag.push(vraag); reeks.aanbod.push(aanbod); reeks.dag.push(i); reeks.uur.push(h);
          reeks.verw.push(verwDag / 24); reeks.wp.push(verwDag / 24 + (E.wwUren.includes(h) ? wwDag / E.wwUren.length : 0)); reeks.woning.push((d.app + d.wit) / 365 * profiel[h] / psom + (d.wtw + d.koel) / 8760);
          reeks.ev.push(ev); reeks.zon.push(zon + agri); reeks.wind.push(wind); }
        if (uur && y === uurJaar) { uur.vraag.push(vraag); uur.zon.push(zon + agri); uur.wind.push(wind); uur.imp.push(imp); uur.exp.push(exp); uur.soc.push(soc); uur.ev.push(ev); }
      }
    }
    const gem = k => J.reduce((a, y) => a + yr[y][k], 0) / NJ, srt = k => J.map(y => yr[y][k]).sort((a, b) => a - b);
    // slechtste aaneengesloten 14 dagen (import)
    let slechtst = { kWh: 0, i: 0 }; let s14 = 0;
    for (let i = 0; i < n; i++) { s14 += dImp[i]; if (i >= 14) s14 -= dImp[i - 14]; if (W.Y[i] !== 1998 && s14 > slechtst.kWh) slechtst = { kWh: s14, i: i - 13 }; }
    const vraag = gem("vraag"), imp = gem("imp"), opwek = gem("zon") + gem("agri") + gem("wind");
    const winterM = [10, 11, 0, 1], winterVraag = winterM.reduce((a, m) => a + mnd[m].vraag, 0), winterOpwek = winterM.reduce((a, m) => a + mnd[m].zon + mnd[m].agri + mnd[m].wind, 0);
    const winterImp = winterM.reduce((a, m) => a + mnd[m].imp, 0);
    const datum = i => new Date(Date.UTC(1994, 0, 1) + i * 864e5);
    return { d, nWind, kWpDak, kWpAgri, cap, pLaad, vraag, opwek, imp, exp: gem("exp"), zon: gem("zon"), agri: gem("agri"), wind: gem("wind"),
      verw: gem("verw"), ev: gem("ev"), evGedwongen: gem("evGedwongen"), pEv: Math.max(...J.map(y => yr[y].pEv)), cel: gem("cel"), celGedwongen: gem("celGedwongen"), tekort: gem("tekort"), tekortMax: Math.max(...J.map(y => yr[y].tekort)), uTekort: gem("uTekort"), pTekort: Math.max(...J.map(y => yr[y].pTekort)), netLaad: gem("netLaad"), afgeschakeld: gem("afgeschakeld"), impBlok: gem("impBlok"), impMeet: gem("impMeet"), uBlok: gem("uBlok"), uBlokMax: Math.max(...J.map(y => yr[y].uBlok)),
      zelf: 1 - imp / vraag, dekking: opwek / vraag, impMax: srt("imp")[NJ - 1], impP90: srt("imp")[NJ - 4], pImp: Math.max(...J.map(y => yr[y].pImp)), pExp: Math.max(...J.map(y => yr[y].pExp)),
      uImp: gem("uImp"), winterDekking: winterOpwek / winterVraag, winterZelf: 1 - winterImp / winterVraag, winterImp,
      maand: mnd, perJaar: J.map(y => ({ jaar: y, ...yr[y] })), slechtst: { kWh: slechtst.kWh, start: datum(slechtst.i) },
      dag: { imp: dImp, exp: dExp, zon: dZon, wind: dWind, vraag: dVraag }, uur, reeks };
  }

  /* windopbrengst per erfmolen per jaar en per maand */
  function windStat() {
    const jr = {}, mnd = Array(12).fill(0);
    for (let i = 0; i < n; i++) { jr[WI.Y[i]] = (jr[WI.Y[i]] || 0) + WI.EW[i]; if (WI.Y[i] !== 1998) mnd[WI.M[i]] += WI.EW[i] / NJ; }
    const perJaar = J.map(y => jr[y]), s = [...perJaar].sort((a, b) => a - b);
    const gem = perJaar.reduce((a, b) => a + b, 0) / NJ;
    const eerste = J.filter(y => y <= 2009).map(y => jr[y]), laatste = J.filter(y => y >= 2010).map(y => jr[y]);
    const g = a => a.reduce((x, z) => x + z, 0) / a.length;
    return { gem, min: s[0], max: s[NJ - 1], p10: s[3], perJaar, maand: mnd, cf: gem / (E.wind.P * 8760), voor2010: g(eerste), vanaf2010: g(laatste),
      minJaar: J[perJaar.indexOf(s[0])], maxJaar: J[perJaar.indexOf(s[NJ - 1])] };
  }

  window.HE = { TYPES, NAAM, UA, cop, warmte, bewoners, woning, cellen, dorp, simuleer, windStat };
})();
