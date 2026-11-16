/* =====================================================================
   hanzedorp-inventaris.js – inventarisatie bewoners en voertuigen (window.HI)
   Opslag: alleen in deze browser (localStorage), met export/import als JSON-bestand.
   Structuur: { laadverlies, woningen: [ { naam, type, personen: [{ leeftijd, thuis }], voertuigen: [{ soort, model, verbruik, km, plek, zakelijk }] } ] }
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, MOB = D.mobiliteit, SLEUTEL = "hanzedorp-inventaris";
  function leeg() { return { laadverlies: MOB.laadverlies, woningen: [], bijgewerkt: null }; }
  function lees() { try { const s = localStorage.getItem(SLEUTEL); if (s) { const o = JSON.parse(s); if (o && Array.isArray(o.woningen)) return o; } } catch (e) {} return leeg(); }
  function bewaar(inv) { inv.bijgewerkt = new Date().toISOString(); try { localStorage.setItem(SLEUTEL, JSON.stringify(inv)); return true; } catch (e) { return false; } }
  function wis() { try { localStorage.removeItem(SLEUTEL); } catch (e) {} }
  const lijst = soort => (soort === "motor" ? MOB.motoren : MOB.voertuigen);
  function verbruik(soort, model) { for (const g of lijst(soort)) for (const m of g.modellen) if (m[0] === model) return m[1]; return null; }
  function kWhVoertuig(v, laadverlies) { const vb = +v.verbruik || verbruik(v.soort, v.model) || 0; return (+v.km || 0) * vb / 100 * (1 + (laadverlies != null ? laadverlies : MOB.laadverlies)); }
  function kWhWoning(w, laadverlies) { return (w.voertuigen || []).reduce((a, v) => a + kWhVoertuig(v, laadverlies), 0); }
  /* voorbeeld: woningprogramma met levensfase 'bij de start' en een auto per woning */
  function voorbeeld() {
    const inv = leeg(), lf = D.levensfase[0], E = D.energie;
    const leeftijd = { werkend: 45, school: 12, pensioen: 67 }, thuis = { werkend: 2, school: 0, pensioen: 5 };
    const auto = { gezin: ["Compacte SUV", "Kia EV3 Long Range", 21000], senior: ["Compact", "Volkswagen ID.3 58 kWh", 9000], junior: ["Klein", "Renault 5 E-Tech 52 kWh", 8000] };
    let nr = 1;
    ["gezin", "senior", "junior"].forEach(t => { for (let k = 0; k < E.mix[t]; k++) {
      const leeftijdJunior = t === "junior" ? 25 : null;
      const personen = lf[t].map(rol => ({ leeftijd: leeftijdJunior || (t === "senior" ? 68 : leeftijd[rol]), thuis: thuis[rol] }));
      const [seg, model, km] = auto[t];
      inv.woningen.push({ naam: "Woning " + nr++, type: t, personen, voertuigen: [{ soort: "auto", model, verbruik: verbruik("auto", model), km, plek: "plein", zakelijk: false }] });
    } });
    return inv;
  }
  function samenvatting(inv) {
    const lv = inv.laadverlies != null ? inv.laadverlies : MOB.laadverlies;
    const r = { woningen: inv.woningen.length, pers: 0, autos: 0, motoren: 0, kWh: 0, kWhAuto: 0, kWhMotor: 0, km: 0, thuisDagen: 0, eigenPaal: 0, zakelijk: 0,
      leeftijd: { "0–17": 0, "18–39": 0, "40–66": 0, "67+": 0 }, perType: { gezin: 0, senior: 0, junior: 0 } };
    inv.woningen.forEach(w => {
      r.perType[w.type] = (r.perType[w.type] || 0) + 1;
      w.personen.forEach(p => { r.pers++; r.thuisDagen += +p.thuis || 0; const a = +p.leeftijd || 0; r.leeftijd[a < 18 ? "0–17" : a < 40 ? "18–39" : a < 67 ? "40–66" : "67+"]++; });
      (w.voertuigen || []).forEach(v => { const k = kWhVoertuig(v, lv); r.kWh += k; r.km += +v.km || 0; if (v.soort === "motor") { r.motoren++; r.kWhMotor += k; } else { r.autos++; r.kWhAuto += k; }
        if (v.plek === "eigen") r.eigenPaal++; if (v.zakelijk) r.zakelijk++; });
    });
    return r;
  }
  window.HI = { SLEUTEL, leeg, lees, bewaar, wis, verbruik, kWhVoertuig, kWhWoning, voorbeeld, samenvatting, lijst };
})();
