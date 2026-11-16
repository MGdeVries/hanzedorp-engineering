/* =====================================================================
   hanzedorp-model.js – live rekenmodel (dagbalans) op de KNMI-dagreeks Heino
   Vereist: hanzedorp-data.js, hanzedorp-weer.js
   Onderdelen:
     vraag()      – watervraag per woningtype uit levensfase, thuiswerk en urinoir
     tank()       – regenwatertanks harde dakdelen → toilet (+ wasmachine)
     zwemvijver() – peilverloop zwemvijver (alleen regen + evt. overloop regenwatertanks)
     tuinvijver() – groendak (+ evt. straatwater via helofytenfilter) → tuinen en akker
   Alle balansen: tijdstap 1 dag, 1994-01-01 t/m 2025-12-31; statistiek over 31 jaren (excl. 1998).
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, W = window.HANZEDORP_WEER, B = D.bewoners;
  const nW = D.woningen.reduce((a, w) => a + w.n, 0);
  const dakTot = D.woningen.reduce((a, w) => a + w.n * w.dak, 0);
  const typeKey = { Gezinswoning: "gezin", Seniorenwoning: "senior", Jongerenwoning: "junior" };

  /* ---------- 1. Watervraag ---------- */
  /* p̄ = gemiddelde aanwezigheid overdag over de week (weekend = thuis) */
  function pGem(rol, thuisDagen) {
    if (rol === "pensioen") return 1;
    if (rol === "school") return 2 / 7;
    return (thuisDagen + 2) / 7;
  }
  /* factoren 'gemiddeld in NL' (CBS [7]) t.o.v. het referentiehuishouden (N: schaalaanname) */
  const lppRef = D.meting.lpd / D.meting.personen;
  const tlRef = (D.meting.toilet.kleinDag * D.meting.toilet.lKlein + D.meting.toilet.grootDag * D.meting.toilet.lGroot) / D.meting.personen;
  const kCbs = { tot: D.cbs.pp4 / lppRef, toilet: D.cbs.aandeel.toilet * D.cbs.pp4 / tlRef, was: D.cbs.aandeel.wasmachine * D.cbs.pp4 / B.wasLpp };   // vierpersoonshuishouden CBS vs referentie
  function persoon(rol, thuisDagen, urinoir, cbs) {
    const p = pGem(rol, thuisDagen), f = B.vakantie, k = cbs ? kCbs : { tot: 1, toilet: 1, was: 1 };
    const toegang = (1 - B.fDag) + B.fDag * p;                     // deel van de toiletbezoeken thuis
    const klein = B.kleinVol * toegang * f, groot = B.grootVol * toegang * f;
    const u = urinoir ? B.urinoirAandeel : 0;
    const vKlein = D.meting.toilet.lKlein * k.toilet, vGroot = D.meting.toilet.lGroot * k.toilet;
    const toiletZonder = klein * vKlein + groot * vGroot;
    const toilet = toiletZonder - klein * u * Math.max(0, vKlein - B.urinoirL);
    const totaal = (B.lBasis + B.lDag * p) * f * k.tot - (toiletZonder - toilet);
    return { p, totaal, toilet, toiletZonder, was: B.wasLpp * k.was, klein, groot };
  }
  function vraag(o = {}) {
    const lf = D.levensfase.find(x => x.id === (o.levensfase || "start"));
    const tw = D.thuiswerk.find(x => x.id === (o.thuiswerk || "ref"));
    const types = D.woningen.map(w => {
      const k = typeKey[w.type], rollen = lf[k];
      let werkIdx = 0;
      const pers = rollen.map(r => {
        const td = r === "werkend" ? (k === "gezin" ? tw.gezin[Math.min(werkIdx++, 1)] : tw.junior) : 0;
        return Object.assign({ rol: r, thuisDagen: td }, persoon(r, td, !!o.urinoir, !!o.cbs));
      });
      const som = key => pers.reduce((a, x) => a + x[key], 0);
      return { type: w.type, key: k, n: w.n, dak: w.dak, personen: pers.length, pers,
        lpd: som("totaal"), toilet: som("toilet"), was: som("was"), p: som("p") };
    });
    const tot = key => types.reduce((a, t) => a + t.n * t[key], 0);
    const bewoners = types.reduce((a, t) => a + t.n * t.personen, 0);
    return { levensfase: lf, thuiswerk: tw, urinoir: !!o.urinoir, types, bewoners,
      lpdTot: tot("lpd"), toiletTot: tot("toilet"), wasTot: tot("was"),
      m3Jaar: tot("lpd") * 365 / 1000,
      regenvraag: (toep) => (tot("toilet") + (toep === "toiletWas" ? tot("was") : 0)) / 1000 };  // m³/d
  }

  /* ---------- statistiek per jaar ---------- */
  function stats(perJaar) {
    const srt = [...perJaar].sort((a, b) => a - b);
    let mi = 0; perJaar.forEach((v, i) => { if (v < perJaar[mi]) mi = i; });
    return { gem: perJaar.reduce((a, b) => a + b, 0) / perJaar.length, p10: srt[3], min: perJaar[mi], minJaar: W.jaren[mi] };
  }
  const gemJ = (obj, key) => W.jaren.reduce((a, y) => a + obj[y][key], 0) / W.jaren.length;

  /* ---------- 2. Regenwatertanks (harde dakdelen) ----------
     S_t = S_t−1 + A·C·P_t/1000 − V ; tekort → drinkwater ; boven S_max → overloop */
  function tank(o) {
    const AC = o.AC != null ? o.AC : dakTot * (1 - D.dak.aandeelGroen) * D.dak.cHard;
    const V = o.vraag, Smax = nW * o.tankPW;
    let s = Smax / 2; const yr = {}, ov = new Float64Array(W.n);
    for (let i = 0; i < W.n; i++) {
      const y = W.Y[i], r = yr[y] || (yr[y] = { v: 0, b: 0, o: 0, a: 0 });
      let x = s + AC * W.P[i] / 1000 - V; r.v += V; r.a += AC * W.P[i] / 1000;
      if (x < 0) { r.b += -x; x = 0; }
      if (x > Smax) { ov[i] = x - Smax; r.o += ov[i]; x = Smax; }
      s = x;
    }
    const perJaar = W.jaren.map(y => 100 * (1 - yr[y].b / yr[y].v));
    return Object.assign(stats(perJaar), { perJaar, AC, vraagJ: V * 365, aanvulling: gemJ(yr, "b"), overloop: gemJ(yr, "o"),
      dakafvoer: gemJ(yr, "a"), overloopDag: ov, n99: perJaar.filter(v => v >= 99).length });
  }

  /* ---------- 3. Zwemvijver (Pagan Butler: alleen regen en dakwater) ----------
     h_t = min(0, h_t−1 + (P_t − f_ow·E_t)/1000 + O_t/A_p)   [m t.o.v. overloopniveau] */
  function zwemvijver(o) {
    const A = o.A, fow = D.zwemvijver.fOpenWater, ov = o.overloopDag || null;
    let h = 0; const yr = {}; const peil2018 = [];
    for (let i = 0; i < W.n; i++) {
      const y = W.Y[i], r = yr[y] || (yr[y] = { min: 0, d3: 0, d5: 0, in: 0 });
      const inTank = ov ? ov[i] : 0;
      h += (W.P[i] - fow * W.E[i]) / 1000 + inTank / A; r.in += inTank;
      if (h > 0) h = 0;
      if (h < r.min) r.min = h;
      if (h < -D.zwemvijver.reserveBoek) r.d3++;
      if (h < -D.zwemvijver.reserveKeuze) r.d5++;
      if (y === 2018) peil2018.push(h);
    }
    const daling = W.jaren.map(y => -yr[y].min);
    const srt = [...daling].sort((a, b) => a - b);
    let mi = 0; daling.forEach((v, i) => { if (v > daling[mi]) mi = i; });
    return { daling, gem: daling.reduce((a, b) => a + b, 0) / daling.length, p90: srt[srt.length - 4], max: daling[mi], maxJaar: W.jaren[mi],
      jarenBoven3: daling.filter(v => v > D.zwemvijver.reserveBoek).length, jarenBoven5: daling.filter(v => v > D.zwemvijver.reserveKeuze).length,
      dagen3: gemJ(yr, "d3"), dagen5: gemJ(yr, "d5"), tankwater: gemJ(yr, "in"), peil2018 };
  }

  /* ---------- 4. Tuinvijver: groendak (+ straat) → privétuinen en akker ---------- */
  let gdCache = null;
  function groendakEnBodem() {
    if (gdCache) return gdCache;
    const T = D.tuinvijver, qg = new Float64Array(W.n), dt = new Float64Array(W.n);
    let S = T.smax / 2, G = 0;
    for (let i = 0; i < W.n; i++) {
      S += W.P[i]; const et = Math.min(S, W.E[i] * S / T.smax); S -= et;
      if (S > T.smax) { qg[i] = S - T.smax; S = T.smax; }
      G += W.P[i] - T.kc * W.E[i]; if (G > T.raw) G = T.raw;
      if (G < 0) { dt[i] = -G; G = 0; }
    }
    return (gdCache = { qg, dt });
  }
  function tuinvijver(o) {
    const T = D.tuinvijver, { qg, dt } = groendakEnBodem();
    const Av = o.A, Wmax = Av * o.h + nW * o.ibc * T.ibcM3;
    const Atuin = nW * (o.tuinPW != null ? o.tuinPW : T.tuinPerWoning) * o.f, Aakker = (o.akkerHa || 0) * 10000;
    const AVC = o.straat ? D.verhard.perWoningM2 * nW * D.verhard.cStraat : 0;
    let s = Wmax; const yr = {}, peil2018 = [];
    for (let i = 0; i < W.n; i++) {
      const y = W.Y[i], r = yr[y] || (yr[y] = { vt: 0, va: 0, lt: 0, la: 0, ov: 0, gd: 0, st: 0, rg: 0, ev: 0, leeg: 0 });
      const gd = T.groendakM2 * qg[i] / 1000, st = AVC * W.P[i] / 1000, rg = Av * W.P[i] / 1000, ev = Av * T.fOpenWater * W.E[i] / 1000;
      r.gd += gd; r.st += st; r.rg += rg; r.ev += ev;
      s += gd + st + rg - ev; if (s < 0) s = 0;
      const vt = Atuin * dt[i] / 1000, va = Aakker * dt[i] / 1000;   // privétuinen eerst
      const lt = Math.min(vt, s); s -= lt; const la = Math.min(va, s); s -= la;
      r.vt += vt; r.va += va; r.lt += lt; r.la += la;
      if (s > Wmax) { r.ov += s - Wmax; s = Wmax; }
      if (s <= 1e-9) r.leeg++;
      if (y === 2018) peil2018.push(s);
    }
    const pjT = W.jaren.map(y => yr[y].vt > 0 ? 100 * yr[y].lt / yr[y].vt : 100);
    const pjA = W.jaren.map(y => yr[y].va > 0 ? 100 * yr[y].la / yr[y].va : 100);
    return { tuin: Object.assign(stats(pjT), { perJaar: pjT }), akker: Object.assign(stats(pjA), { perJaar: pjA }),
      voorraad: Wmax, vraagTuin: gemJ(yr, "vt"), vraagAkker: gemJ(yr, "va"), overloop: gemJ(yr, "ov"), dagenLeeg: gemJ(yr, "leeg"),
      groendak: gemJ(yr, "gd"), straat: gemJ(yr, "st"), regen: gemJ(yr, "rg"), verdamping: gemJ(yr, "ev"), peil2018 };
  }

  /* maandgemiddelden (mm): neerslag, verdamping, groendakafvoer, beregeningsbehoefte */
  function maandMm() {
    const { qg, dt } = groendakEnBodem(), m = Array.from({ length: 12 }, () => [0, 0, 0, 0]);
    for (let i = 0; i < W.n; i++) { if (W.Y[i] === 1998) continue; const a = m[W.M[i]]; a[0] += W.P[i]; a[1] += W.E[i]; a[2] += qg[i]; a[3] += dt[i]; }
    return m.map(a => a.map(v => v / W.jaren.length));
  }
  function jaarMm() { const s = {}; for (let i = 0; i < W.n; i++) s[W.Y[i]] = (s[W.Y[i]] || 0) + W.P[i]; return W.jaren.map(y => s[y]); }

  window.HM = { kCbs, vraag, persoon, pGem, tank, zwemvijver, tuinvijver, maandMm, jaarMm, nW, dakTot, W };
})();

/* =====================================================================
   Akker: agri-PV (verticaal bifaciaal, oost–west), put + pomp + bassin + druppelirrigatie
   Vereist daarnaast hanzedorp-zon.js
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, W = window.HANZEDORP_WEER, Z = window.HANZEDORP_ZON, K = D.akker, PV = K.pv;
  const rad = Math.PI / 180, phi = PV.lat * rad, Isc = 1.367;   // kW/m²
  /* zonnestand per uur (zonnetijd; middag = 12 u) */
  function zonUren(doy) {
    const decl = 23.45 * rad * Math.sin(2 * Math.PI * (284 + doy) / 365), E0 = 1 + 0.033 * Math.cos(2 * Math.PI * doy / 365);
    const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(decl))));
    const H0 = 24 / Math.PI * Isc * E0 * (Math.cos(phi) * Math.cos(decl) * Math.sin(ws) + ws * Math.sin(phi) * Math.sin(decl));   // kWh/m²·d
    const uren = [];
    for (let h = 0; h < 24; h++) {
      const w = (h + 0.5 - 12) * 15 * rad;
      const cz = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(w);
      if (cz <= 0.01) { uren.push(null); continue; }
      const sz = Math.sqrt(1 - cz * cz);
      // azimut vanaf het noorden, oost positief: sinA = −cosδ·sinω / sinθz
      const sinA = -Math.cos(decl) * Math.sin(w) / sz, cosA = (Math.sin(decl) - cz * Math.sin(phi)) / (sz * Math.cos(phi));
      const az = Math.atan2(sinA, cosA);   // rad, 0 = noord, +π/2 = oost
      uren.push({ h, cz, sz, az, g0: Isc * E0 * cz });
    }
    return { H0, uren };
  }
  /* dagwaarde → uurwaarden; diffuse fractie volgens Erbs e.a. (1982), isotroop model; verticale vlakken oost en west */
  let pvCache = null;
  function pvReeks() {
    if (pvCache) return pvCache;
    const n = W.n, kWh = new Float64Array(n), uurP = new Array(n), ghiUur = new Array(n);   // per kWp
    let d = new Date(Date.UTC(1994, 0, 1));
    for (let i = 0; i < n; i++) {
      const doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1, zu = zonUren(doy);
      const H = Z.Q[i], Kt = Math.min(0.85, H / zu.H0);
      const fd = Kt <= 0.722 ? 1 - 0.2727 * Kt + 2.4495 * Kt * Kt - 11.9514 * Kt ** 3 + 9.3879 * Kt ** 4 : 0.143;
      const som0 = zu.uren.reduce((a, u) => a + (u ? u.g0 : 0), 0);
      const p = new Float64Array(24), g = new Float64Array(24); let e = 0;
      zu.uren.forEach((u, h) => {
        if (!u) return;
        const ghi = H * u.g0 / som0, dh = ghi * fd, bh = ghi - dh, bn = bh / Math.max(u.cz, 0.087);
        const vlak = azp => bn * Math.max(0, u.sz * Math.cos(u.az - azp)) + dh * 0.5 + ghi * PV.albedo * 0.5;
        const voor = vlak(90 * rad), achter = vlak(-90 * rad);
        const geff = Math.max(voor, achter) + PV.bifaciaal * PV.achterZicht * Math.min(voor, achter);   // zonzijde = voorzijde; achterZicht: N (constructie, rijafstand)
        p[h] = geff * PV.pr; g[h] = ghi; e += p[h];
      });
      kWh[i] = e; uurP[i] = p; ghiUur[i] = g;
      d = new Date(d.getTime() + 864e5);
    }
    return (pvCache = { kWh, uurP, ghiUur });
  }
  /* uurreeks (kWh per kWp) voor een willekeurig vlak: helling b (°), azimut a (° vanaf noord, oost +; zuid = 180),
     bif = bifaciale factor achterzijde (0 = monofaciaal). Isotrope diffuus (Liu & Jordan), albedo 0,2. */
  const vlakCache = {};
  function pvVlak(b, a, bif = 0, pr = 0.85) {
    const key = [b, a, bif, pr].join("|"); if (vlakCache[key]) return vlakCache[key];
    const B = b * rad, A0 = (a - 180) * rad, n = W.n, uurP = new Array(n);   // az in zonUren: 0 = noord; omrekenen
    let d = new Date(Date.UTC(1994, 0, 1));
    for (let i = 0; i < n; i++) {
      const doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1, zu = zonUren(doy);
      const H = Z.Q[i], Kt = Math.min(0.85, H / zu.H0);
      const fd = Kt <= 0.722 ? 1 - 0.2727 * Kt + 2.4495 * Kt * Kt - 11.9514 * Kt ** 3 + 9.3879 * Kt ** 4 : 0.143;
      const som0 = zu.uren.reduce((s, u) => s + (u ? u.g0 : 0), 0), p = new Float64Array(24);
      zu.uren.forEach((u, h) => {
        if (!u) return;
        const ghi = H * u.g0 / som0, dh = ghi * fd, bn = (ghi - dh) / Math.max(u.cz, 0.087);
        const pl = (bb, aa) => bn * Math.max(0, u.cz * Math.cos(bb) + u.sz * Math.sin(bb) * Math.cos(u.az - aa)) + dh * (1 + Math.cos(bb)) / 2 + ghi * PV.albedo * (1 - Math.cos(bb)) / 2;
        const az = A0 + Math.PI, v = pl(B, az), r = bif ? pl(Math.PI - B, az + Math.PI) : 0;
        p[h] = (Math.max(v, r) + bif * PV.achterZicht * Math.min(v, r)) * pr;
      });
      uurP[i] = p; d = new Date(d.getTime() + 864e5);
    }
    return (vlakCache[key] = uurP);
  }
  function pvAkker(o = {}) {
    const rijen = o.rijen != null ? o.rijen : PV.rijen, perRij = Math.floor(PV.rijLengte / PV.paneelB);
    const kWp = rijen * perRij * PV.wp / 1000, r = pvReeks();
    const jr = {}, mnd = Array(12).fill(0);
    for (let i = 0; i < W.n; i++) { jr[W.Y[i]] = (jr[W.Y[i]] || 0) + r.kWh[i] * kWp; if (W.Y[i] !== 1998) mnd[W.M[i]] += r.kWh[i] * kWp / W.jaren.length; }
    const perJaar = W.jaren.map(y => jr[y]); const gem = perJaar.reduce((a, b) => a + b, 0) / perJaar.length;
    return { kWp, panelen: rijen * perRij, perRij, gem, specifiek: gem / kWp, perJaar, maand: mnd };
  }
  /* gemiddeld uurprofiel (kW per kWp) voor een maand */
  function pvProfiel(maand) {
    const r = pvReeks(), p = new Float64Array(24), g = new Float64Array(24); let n = 0;
    for (let i = 0; i < W.n; i++) if (W.M[i] === maand && W.Y[i] !== 1998) { n++; for (let h = 0; h < 24; h++) { p[h] += r.uurP[i][h]; g[h] += r.ghiUur[i][h]; } }
    return { pv: Array.from(p, v => v / n), ghi: Array.from(g, v => v / n) };
  }

  /* bodemvochtbalans → beregeningsbehoefte (mm/d), met gewasfactor */
  function vraagMm(kc, raw) {
    const dt = new Float64Array(W.n); let G = 0;
    for (let i = 0; i < W.n; i++) { G += W.P[i] - kc * W.E[i]; if (G > raw) G = raw; if (G < 0) { dt[i] = -G; G = 0; } }
    return dt;
  }

  /* akkerbalans: put → bassin (alleen in zonne-uren, ≤ 10 m³/h) → druppelirrigatie (zelfde pomp, driewegkleppen) */
  function akker(o = {}) {
    const A = o.A || K.maxM2, kc = o.kc || K.kc, Ab = o.bassinM2 != null ? o.bassinM2 : K.bassinM2, hb = o.bassinH || K.bassinH;
    const kWp = pvAkker({ rijen: o.rijen }).kWp, r = pvReeks(), dt = vraagMm(kc, K.raw);
    const Qv = Math.min(K.pompQvul, K.putMaxM3h), Qi = K.pompQirr, P1 = K.pompP1, Vmax = Ab * hb;
    let V = Vmax; const yr = {}, mnd = Array.from({ length: 12 }, () => ({ irr: 0, put: 0, dagen: 0 })), yrM = {};
    const jaarDagen = {};
    for (let i = 0; i < W.n; i++) {
      const y = W.Y[i], R = yr[y] || (yr[y] = { irr: 0, put: 0, putNacht: 0, hZon: 0, hNacht: 0, dagen: 0, eerste: null, laatste: null, ev: 0 });
      // uren waarin de pomp op zonnestroom mag draaien: eigen agri-PV ≥ P1, of dorpsoverschot (GHI ≥ drempel)
      let zonUren = 0; for (let h = 0; h < 24; h++) if (r.uurP[i][h] * kWp >= P1 || r.ghiUur[i][h] * 1000 >= D.akker.dorpOverschotWm2) zonUren++;
      V += Ab * (W.P[i] - K.fOpenWater * W.E[i]) / 1000; if (V < 0) V = 0; R.ev += Ab * K.fOpenWater * W.E[i] / 1000;
      const irr = A * dt[i] / 1000 / K.eta;              // m³ bruto
      const hIrr = irr / Qi;
      // irrigatie bij voorkeur in zonne-uren; vullen in de resterende zonne-uren
      const hZonIrr = Math.min(hIrr, zonUren), hZonVul = Math.max(0, zonUren - hZonIrr);
      let vul = Math.min(Qv * hZonVul, Math.max(0, Vmax - V + irr)); V += vul;
      let nacht = 0; if (V < irr) { nacht = irr - V; V += nacht; }     // plan altijd halen: bijpompen op buurtaccu/net
      V -= irr; if (V > Vmax) V = Vmax;
      R.irr += irr; R.put += vul + nacht; R.putNacht += nacht; (yrM[y] || (yrM[y] = Array(12).fill(0)))[W.M[i]] += vul + nacht;
      R.hZon += hZonIrr + vul / Qv; R.hNacht += (hIrr - hZonIrr) + nacht / Qv;
      if (irr > 0) { R.dagen++; const doy = Math.floor((Date.UTC(y, W.M[i], 1) - Date.UTC(y, 0, 1)) / 864e5); if (R.eerste == null) R.eerste = i; R.laatste = i; }
      if (y !== 1998) { const m = mnd[W.M[i]]; m.irr += irr / W.jaren.length; m.put += (vul + nacht) / W.jaren.length; if (irr > 0) m.dagen += 1 / W.jaren.length; }
    }
    const J = W.jaren, gem = k => J.reduce((a, y) => a + yr[y][k], 0) / J.length, srt = k => J.map(y => yr[y][k]).sort((a, b) => a - b);
    const datum = i => { const d0 = new Date(Date.UTC(1994, 0, 1) + i * 864e5); return { d: d0.getUTCDate(), m: d0.getUTCMonth() }; };
    const piekMm = Math.max(...Array.from(dt)) / K.eta;
    const zoneM2 = Qi * 1000 / (K.druppel.lph / (K.druppel.afstand * K.druppel.rij));   // m² per zone
    const zones = Math.ceil(A / zoneM2), mmPerH = K.druppel.lph / (K.druppel.afstand * K.druppel.rij);
    const eKWh = (gem("hZon") + gem("hNacht")) * P1;
    return { A, kWp, irr: gem("irr"), put: gem("put"), putP90: srt("put")[J.length - 4], putMax: srt("put")[J.length - 1],
      putNacht: gem("putNacht"), uren: gem("hZon") + gem("hNacht"), urenZon: gem("hZon"), eKWh, zonAandeel: gem("hZon") / (gem("hZon") + gem("hNacht") || 1),
      eNacht: gem("hNacht") * P1, dagen: gem("dagen"), verdamping: gem("ev"), perJaar: J.map(y => yr[y].put), irrPerJaar: J.map(y => yr[y].irr),
      maand: mnd, maandPerJaar: yrM, piekMm, piekM3: piekMm * A / 1000, zoneM2, zones, mmPerH, minPerZonePiek: piekMm / mmPerH * 60,
      eerste: J.map(y => yr[y].eerste != null ? datum(yr[y].eerste) : null), laatste: J.map(y => yr[y].laatste != null ? datum(yr[y].laatste) : null), Vmax };
  }

  Object.assign(window.HM, { pvAkker, pvProfiel, akker, vraagMm, pvReeks, pvVlak });
})();
