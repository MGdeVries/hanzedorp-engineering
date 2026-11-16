/* Hanzedorp – veiligheid: gedeelde rekenregels (basis- en technische pagina) */
(function () {
  const D = HANZEDORP_DATA, V = D.veiligheid;
  const TYPE = { Gezinswoning: "gezin", Seniorenwoning: "senior", Jongerenwoning: "junior" };
  function personen() {
    const r = {};
    (D.levensfase || []).forEach(f => { r[f.id] = D.woningen.reduce((s, w) => s + w.n * ((f[TYPE[w.type]] || []).length || w.pers), 0); });
    if (!r.start) r.start = D.woningen.reduce((s, w) => s + w.n * w.pers, 0);
    if (!r.max) r.max = r.start;
    return r;
  }
  function week(pers, dagen) {
    const accuKWh = (D.energie.accu || {}).kWh || 600;
    return { pers, dagen, water: pers * V.waterLpppd * dagen, maaltijden: pers * 3 * dagen, kcal: pers * V.kcalPPD * dagen,
             accuKWh, accuUur: Math.round(accuKWh * 0.9 / V.kritiekKW) };   // 90 % bruikbaar (N); geen zon of wind
  }
  window.VG = { personen, week };
})();
