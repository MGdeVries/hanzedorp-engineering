/* =====================================================================
   hanzedorp-project.js – kiest het actieve project en legt de locatiegegevens over de basisdata.
   Volgorde op elke pagina: hanzedorp-data.js → hanzedorp-projecten.js → hanzedorp-project.js → weerbestanden → modellen.
   Actief project: ?project=<id> in de adresbalk (wordt onthouden), anders het laatst gekozen project, anders 'standaard'.
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, P = window.HANZEDORP_PROJECTEN;
  const opslag = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const vind = id => P.lijst.find(p => p.id === id);
  let id = P.editie;
  if (!id) {
    let q = null; try { q = new URLSearchParams(location.search).get("project"); } catch (e) {}
    if (q && vind(q)) opslag.set("hz-project", q);
    id = (q && vind(q)) ? q : opslag.get("hz-project");
    if (!vind(id)) id = P.standaard;
  }
  const proj = vind(id) || P.lijst[0];
  /* samenvoegen: objecten recursief, lijsten en waarden vervangen */
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  function merge(doel, bron) { for (const k of Object.keys(bron || {})) { if (isObj(bron[k]) && isObj(doel[k])) merge(doel[k], bron[k]); else doel[k] = JSON.parse(JSON.stringify(bron[k])); } return doel; }
  const keten = []; let p = proj; while (p) { keten.unshift(p); p = p.basisProject ? vind(p.basisProject) : null; }
  keten.forEach(x => merge(D, x.locatie || {}));
  D.project = { id: proj.id, naam: proj.naam, status: proj.status, gemeente: proj.gemeente, provincie: proj.provincie, omschrijving: proj.omschrijving,
                terreinM2: proj.terreinM2, bestaandeBebouwingM2: proj.bestaandeBebouwingM2 || 0, station: proj.station, stationNaam: proj.stationNaam,
                klimaatVoorlopig: !!proj.klimaatVoorlopig, partijen: proj.partijen || {}, vervang: proj.vervang || {} };
  if (window.HZ_AFLEIDEN) window.HZ_AFLEIDEN(D);
  /* ruimtetoets: benodigd oppervlak volgens het plan (kavels + gezamenlijke voorzieningen) tegenover het beschikbare terrein */
  if (D.grond && D.energie) {
    const mix = D.energie.mix, kav = ["gezin", "senior", "junior"].reduce((a, t) => a + (mix[t] || 0) * (D.grond.kavel[t] || 0), 0);
    const gem = D.grond.gemeenschappelijk.reduce((a, g) => a + g[1], 0), akker = (D.grond.gemeenschappelijk.find(g => /^Akker/.test(g[0])) || [0, 0])[1];
    const T = D.project.terreinM2;
    D.project.benodigdM2 = kav + gem; D.project.akkerPlanM2 = akker;
    D.project.toets = T == null ? "onbekend" : T >= kav + gem ? "past" : T >= kav + gem - akker ? "past met kleinere akker" : "past niet";
    D.project.akkerMogelijkM2 = T == null ? null : Math.max(0, Math.min(akker, T - (kav + gem - akker)));
  }
  window.HZPROJECT = {
    lijst: P.lijst, actief: proj, editie: P.editie,
    kies(nieuw) { opslag.set("hz-project", nieuw); const u = new URL(location.href); u.searchParams.set("project", nieuw); location.href = u.toString(); },
    key: pagina => "hz-stand:" + proj.id + ":" + pagina,              // werkstand per project
    weerPad: bestand => "weer/" + proj.station + "/" + bestand,
    intern: ["eigendom.html", "eigendom-technisch.html", "inventarisatie.html", "projecten.html", "ketenpartners.html"]   // niet in edities voor gemeenten en partijen
  };
  /* locatienamen in lopende tekst vervangen (niet in bronnenlijsten) */
  const V = D.project.vervang;
  if (Object.keys(V).length && typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest("ol.src, script, style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => { let t = n.nodeValue; for (const [a, b] of Object.entries(V)) t = t.split(a).join(b); if (t !== n.nodeValue) n.nodeValue = t; });
  });
})();
