/* digitaal-gedeeld.js – rekenmodel digitale infrastructuur (window.DI); invoer uit hanzedorp-data.js → digitaal */
(function () {
  const D = window.HANZEDORP_DATA, G = D.digitaal, E = D.energie;
  const nStd = E.mix.gezin + E.mix.senior + E.mix.junior, nBasis = G.basisWoningen || nStd;
  /* o: { nW, lijn2: "res"|"lite"|"geen", cam, beweging, dagen, alarm } */
  function rekenen(o = {}) {
    const nW = o.nW != null ? o.nW : nStd, f = nW / nBasis;
    const cam = o.cam != null ? o.cam : G.camAantal, alarm = o.alarm != null ? o.alarm : 3;
    let eenmalig = 0; const regels = [];
    G.stuk.forEach(r => {
      let eur = r.eur;
      if (r.perWoning) eur = r.eur * f;                                   // per woning lineair
      if (r.cat.startsWith("Glasvezel")) eur = r.eur * (0.3 + 0.7 * f);     // N: 70 % van de glaskosten schaalt met het aantal woningen
      if (r.cat.startsWith("Camera")) eur = 449 + 800 + (r.eur - 1249) * cam / G.camAantal;   // recorder + schijven vast, camera's per stuk
      if (r.cat.startsWith("Personen")) eur = r.eur / 3 * alarm;
      if (r.cat.startsWith("Internet") && o.lijn2 === "geen") eur = r.eur - 373;               // zonder Starlink-kit en -router
      eenmalig += eur; regels.push(Object.assign({}, r, { eur }));
    });
    let maand = 0, alarmMnd = 0;
    G.maand.forEach(m => {
      if (m.basis) {
        let eur = m.eur;
        if (m.post.startsWith("Starlink")) eur = o.lijn2 === "geen" ? 0 : o.lijn2 === "lite" ? m.lite : m.eur;
        maand += eur;
      } else alarmMnd = m.eur / 3 * alarm;
    });
    const afschr = eenmalig / (G.levensduur * 12);
    const nu = G.nuPerHuishouden * nW, doel = nu * (1 - G.doelBesparing);
    const dagen = o.dagen != null ? o.dagen : G.bewaarDagen, bew = o.beweging === false ? 1 : G.bewegingFactor;
    const TB = cam * G.camBitrate / 8 * 86400 * dagen * bew / 1e6;           // Mbit/s → TB
    return { nW, eenmalig, perWoning: eenmalig / nW, regels, maand, perHuisMaand: maand / nW, nu, doel, besparing: 1 - maand / nu,
      afschr, totaalMaand: maand + afschr + alarmMnd, totaalPerHuis: (maand + afschr + alarmMnd) / nW, alarmMnd, TB, TBok: TB <= G.nvrTB, cam, dagen };
  }
  window.DI = { rekenen, nStd };
})();
