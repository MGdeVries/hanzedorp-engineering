/* erfdieren-gedeeld.js – rekenmodel kippen (window.ED); invoer hanzedorp-data.js → erfdieren; bewoners uit HE.dorp */
(function () {
  const D = window.HANZEDORP_DATA, K = D.erfdieren;
  function rekenen(o = {}) {
    const pers = window.HE ? HE.dorp({ levensfase: o.levensfase || "start" }).pers : 33;
    const epw = o.eieren != null ? o.eieren : K.eierenPPweek, renPK = o.renM2 || K.renM2;
    const eieren = pers * epw * 52;
    const kippen = epw > 0 ? Math.ceil(eieren / K.eierenPerKip * (1 + K.reserve)) : 0;
    return { pers, eieren, kippen, voerKg: kippen * K.voerG * 365 / 1000, hok: Math.ceil(kippen * K.hokM2), ren: kippen * renPK, water: kippen * K.waterL };
  }
  window.ED = { rekenen };
})();
