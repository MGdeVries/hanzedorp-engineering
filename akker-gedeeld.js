/* =====================================================================
   akker-gedeeld.js – standaardvariant, keuzelijsten en bindings voor
   akker.html en akker-technisch.html
   ===================================================================== */
(function () {
  const { D, nl, bindAll } = HZ, K = D.akker;
  const OPT = { A: [500, 1000, 2000, 3000, 4000, 5000], B: [50, 100, 200, 300, 500] };
  const std = HM.akker({ A: K.maxM2 }), pv = HM.pvAkker(), start = HM.akker({ A: K.startM2 });
  const jaar2018 = a => a.maandPerJaar[2018];
  const datumTxt = o => o ? o.d + " " + HZ.MND[o.m] : "–";
  const mediaanDag = arr => { const v = arr.filter(Boolean).map(o => o.m * 31 + o.d).sort((a, b) => a - b); const x = v[Math.floor(v.length / 2)]; return { m: Math.floor(x / 31), d: x % 31 || 1 }; };
  function bind(extra = {}) {
    bindAll(Object.assign({
      aMax: nl(K.maxM2), aStart: nl(K.startM2), aPut: nl(Math.round(std.put / 10) * 10), aPutP90: nl(Math.round(std.putP90 / 10) * 10), aPutMax: nl(Math.round(std.putMax / 10) * 10),
      aIrr: nl(Math.round(std.irr / 10) * 10), aKWh: nl(Math.round(std.eKWh / 10) * 10), aUren: nl(std.uren), aZon: nl(std.zonAandeel * 100), aDagen: nl(std.dagen),
      aZones: nl(std.zones), aZoneM2: nl(Math.round(std.zoneM2 / 5) * 5), aMinZone: nl(std.minPerZonePiek), aPiekMm: nl(std.piekMm, 1), aPiekM3: nl(std.piekM3),
      aMmH: nl(std.mmPerH, 1), aEv: nl(std.verdamping), aVmax: nl(std.Vmax),
      sPut: nl(Math.round(start.put / 10) * 10), sKWh: nl(Math.round(start.eKWh / 10) * 10),
      aEerste: datumTxt(mediaanDag(std.eerste)), aLaatste: datumTxt(mediaanDag(std.laatste)),
      pvRijen: nl(K.pv.rijen), pvKWp: nl(pv.kWp), pvPan: nl(pv.panelen), pvMWh: nl(pv.gem / 1000), pvSpec: nl(pv.specifiek), pvPerRij: nl(pv.perRij),
      pvDec: nl(pv.maand[11]), pvFactor: nl(Math.round(pv.gem / std.eKWh / 5) * 5), pvJun: nl(pv.maand[5]), pompAandeel: nl(std.eKWh / pv.gem * 100, 1),
      pompP1: nl(K.pompP1, 1), qVul: nl(K.pompQvul), qIrr: nl(K.pompQirr)
    }, extra));
  }
  window.AK = { OPT, std, pv, start, bind, jaar2018 };
})();
