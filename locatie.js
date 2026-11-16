/* =====================================================================
   locatie.js – project kiezen, zoekgebied en weerstations op een OpenStreetMap-kaart (Leaflet),
   perceel intekenen, oppervlak berekenen en bewaren (localStorage, per project; export/import GeoJSON).
   Oppervlak: polygoon in lokale meters (equirectangulaire projectie rond het zwaartepunt), schoenveterformule;
   afwijking < 0,1 % voor percelen van enkele hectaren.
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, HP = window.HZPROJECT, P = D.project, nl = HZ.nl, $ = id => document.getElementById(id);
  HZ.bindAll({}); HZ.renderBronnen($("bronnen"), [173]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const opslag = { get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
                   set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const KEY = HP.perceelKey, aanwezig = (HANZEDORP_PROJECTEN.stations || []).map(s => String(s.id));

  /* projectkeuze */
  $("selProj").innerHTML = HP.lijst.map((p, i) => `<option value="${esc(p.id)}"${p.id === P.id ? " selected" : ""}>${i + 1}. ${esc(p.naam)}</option>`).join("");
  $("selProj").onchange = e => HP.kies(e.target.value);
  if (HP.editie) $("selProj").disabled = true;
  $("projInfo").textContent = `Project ${P.nr}: ${P.omschrijving || ""} Gemeente: ${P.gemeente}. Klimaat: ${P.stationNaam}${P.klimaatVoorlopig ? " (voorlopig)" : ""}.`;
  $("rNodig").textContent = nl(P.benodigdM2) + " m²";

  /* KNMI-stations met uurdata in en rond het zoekgebied (coördinaten KNMI) */
  const ST = [
    { id: "278", naam: "Heino", lat: 52.435, lon: 6.259, waar: "midden in het zoekgebied" },
    { id: "273", naam: "Marknesse", lat: 52.703, lon: 5.888, waar: "Noordoostpolder, noordwest van Zwolle" },
    { id: "279", naam: "Hoogeveen", lat: 52.750, lon: 6.574, waar: "Drenthe, noordoost van Dalfsen" },
    { id: "290", naam: "Twenthe", lat: 52.274, lon: 6.891, waar: "Twente, oost van het zoekgebied" },
    { id: "269", naam: "Lelystad", lat: 52.458, lon: 5.520, waar: "Flevoland, richting Nunspeet" },
    { id: "275", naam: "Deelen", lat: 52.056, lon: 5.873, waar: "Veluwe, richting Apeldoorn" }
  ];
  const PLAATS = { Zwolle: [52.5168, 6.0830], Dalfsen: [52.5100, 6.2600], Wijhe: [52.3870, 6.1350], Nunspeet: [52.3790, 5.7850], Apeldoorn: [52.2112, 5.9699] };

  const R = 6371008.8, rad = d => d * Math.PI / 180;
  const afstand = (a, b) => { const dl = rad(b[0] - a[0]), dn = rad(b[1] - a[1]), h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  function oppervlak(pts) {
    if (pts.length < 3) return 0;
    const lat0 = pts.reduce((a, p) => a + p[0], 0) / pts.length, lon0 = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const xy = pts.map(p => [rad(p[1] - lon0) * R * Math.cos(rad(lat0)), rad(p[0] - lat0) * R]);
    let s = 0; for (let i = 0; i < xy.length; i++) { const a = xy[i], b = xy[(i + 1) % xy.length]; s += a[0] * b[1] - b[0] * a[1]; }
    return Math.abs(s) / 2;
  }
  const midden = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  /* zoekgebied: omhullende van cirkels met straal r rond de drie plaatsen */
  function buffer(plaatsen, r) {
    const pts = []; plaatsen.forEach(c => { for (let k = 0; k < 48; k++) { const t = k / 48 * 2 * Math.PI; pts.push([c[0] + (r / R) * 180 / Math.PI * Math.sin(t), c[1] + (r / R) * 180 / Math.PI * Math.cos(t) / Math.cos(rad(c[0]))]); } });
    pts.sort((a, b) => a[1] - b[1] || a[0] - b[0]); const kr = (o, a, b) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
    const lo = [], hi = []; for (const p of pts) { while (lo.length >= 2 && kr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (hi.length >= 2 && kr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }

  if (!window.L) { $("kaart").innerHTML = '<p class="note" style="padding:16px">De kaart kon niet laden (geen internet of geblokkeerd). Tekenen is dan niet mogelijk; importeren van een perceelbestand werkt wel.</p>'; }
  const map = window.L ? L.map("kaart", { scrollWheelZoom: false }).setView([52.40, 6.05], 10) : null;
  if (map) {
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap-bijdragers" }).addTo(map);
    const drie = [PLAATS.Zwolle, PLAATS.Dalfsen, PLAATS.Wijhe];
    L.polygon(buffer(drie, 15000), { color: "#1F4A3D", weight: 2, fillColor: "#5A9E7A", fillOpacity: 0.08 }).addTo(map).bindTooltip("Zoekgebied: Zwolle – Dalfsen – Wijhe + 15 km (voorlopig)");
    L.polygon(drie, { color: "#1F4A3D", weight: 1, dashArray: "4 4", fill: false }).addTo(map);
    L.polygon(buffer([PLAATS.Nunspeet, PLAATS.Apeldoorn], 10000), { color: "#9A6F1A", weight: 1.5, dashArray: "6 6", fillOpacity: 0.03 }).addTo(map).bindTooltip("Wens: uitbreiden richting Nunspeet en Apeldoorn");
    Object.entries(PLAATS).forEach(([n, c]) => L.circleMarker(c, { radius: 4, color: "#36217A", fillOpacity: 1 }).addTo(map).bindTooltip(n, { permanent: true, direction: "right", className: "" }));
    ST.forEach(s => L.marker([s.lat, s.lon], { title: "KNMI " + s.id + " " + s.naam }).addTo(map).bindPopup(`<b>KNMI ${s.id} ${esc(s.naam)}</b><br>${esc(s.waar)}<br>${aanwezig.includes(s.id) ? "in het rekenmodel" : "nog niet in het model"}`));
  }

  /* perceel tekenen */
  let pts = [], tekenen = false, laag = null, lijn = null, opgeslagen = opslag.get(KEY);
  function teken() {
    if (!map) return;
    if (laag) map.removeLayer(laag); if (lijn) map.removeLayer(lijn); laag = lijn = null;
    if (pts.length >= 3 && !tekenen) laag = L.polygon(pts, { color: "#9A6F1A", weight: 3, fillColor: "#E0AB17", fillOpacity: 0.25 }).addTo(map);
    else if (pts.length) lijn = L.polyline(pts, { color: "#9A6F1A", weight: 3, dashArray: "4 4" }).addTo(map);
  }
  function uitkomst() {
    const m2 = !tekenen && pts.length >= 3 ? oppervlak(pts) : 0;
    $("rOpp").textContent = m2 ? nl(Math.round(m2)) + " m² (" + nl(m2 / 1e4, 2) + " ha)" : "–";
    const nodig = P.benodigdM2, akker = P.akkerPlanM2 || 0;
    $("rToets").textContent = !m2 ? "–" : m2 >= nodig ? "past" : m2 >= nodig - akker ? "past met kleinere akker" : "past niet (" + nl(Math.round(nodig - m2)) + " m² te weinig)";
    $("rToets").style.color = !m2 ? "" : m2 >= nodig ? "var(--green)" : "var(--warn)";
    const c = m2 ? midden(pts) : null, rij = ST.map(s => ({ s, d: c ? afstand(c, [s.lat, s.lon]) : null })).sort((a, b) => (a.d || 0) - (b.d || 0));
    $("tblSt").querySelector("tbody").innerHTML = rij.map(({ s, d }) => `<tr><td>KNMI ${s.id} ${esc(s.naam)}</td><td>${esc(s.waar)}</td><td class="num">${d == null ? "–" : nl(d / 1000, 1) + " km"}</td><td>${aanwezig.includes(s.id) ? "ja" : "nog aanleveren"}</td></tr>`).join("");
    if (c) { const b = rij[0]; $("rStation").textContent = "KNMI " + b.s.id + " " + b.s.naam + " (" + nl(b.d / 1000, 1) + " km)";
      $("stNoot").textContent = aanwezig.includes(b.s.id) ? "Het dichtstbijzijnde station zit al in het model." : `Het dichtstbijzijnde station (${b.s.naam}) zit nog niet in het model. Tot de bestanden er zijn, rekent het model met Heino. Lever uurgegevens (FH, T, Q) en daggegevens (RH, EV24) 1994–2025 aan in hetzelfde KNMI-formaat.`; }
    else { $("rStation").textContent = "–"; $("stNoot").textContent = ""; }
    return m2;
  }
  function bewaar() {
    const m2 = uitkomst();
    if (m2) opslag.set(KEY, { m2: Math.round(m2), punten: pts, midden: midden(pts), gebruik: $("cGebruik").checked, datum: new Date().toISOString().slice(0, 10) });
    else opslag.del(KEY);
  }
  if (opgeslagen && opgeslagen.punten) { pts = opgeslagen.punten; $("cGebruik").checked = opgeslagen.gebruik !== false; }
  teken(); uitkomst();
  if (map && pts.length >= 3) map.fitBounds(L.polygon(pts).getBounds(), { maxZoom: 17, padding: [30, 30] });

  const knop = () => { $("bKlaar").disabled = !tekenen || pts.length < 3; $("bTerug").disabled = !tekenen || !pts.length; $("bTeken").disabled = tekenen; if (map) map.getContainer().style.cursor = tekenen ? "crosshair" : ""; };
  $("bTeken").onclick = () => { tekenen = true; pts = []; teken(); uitkomst(); knop(); if (map) map.doubleClickZoom.disable(); };
  $("bKlaar").onclick = () => { tekenen = false; teken(); bewaar(); knop(); if (map) map.doubleClickZoom.enable(); };
  $("bTerug").onclick = () => { pts.pop(); teken(); knop(); };
  $("bWis").onclick = () => { tekenen = false; pts = []; teken(); bewaar(); knop(); };
  $("cGebruik").onchange = bewaar;
  if (map) map.on("click", e => { if (!tekenen) return; pts.push([+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]); teken(); knop(); });
  $("bExport").onclick = () => {
    if (pts.length < 3) return;
    const gj = { type: "Feature", properties: { project: P.id, naam: P.naam, m2: Math.round(oppervlak(pts)) }, geometry: { type: "Polygon", coordinates: [pts.concat([pts[0]]).map(p => [p[1], p[0]])] } };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(gj, null, 1)], { type: "application/geo+json" })); a.download = "perceel-" + P.id + ".geojson"; a.click();
  };
  $("fImport").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { try { let g = JSON.parse(t); if (g.type === "FeatureCollection") g = g.features[0]; const geo = g.geometry || g;
      const ring = geo.type === "MultiPolygon" ? geo.coordinates[0][0] : geo.coordinates[0];
      pts = ring.slice(0, -1).map(c => [c[1], c[0]]); tekenen = false; teken(); bewaar(); knop(); if (map) map.fitBounds(L.polygon(pts).getBounds(), { maxZoom: 17 }); }
      catch (err) { $("stNoot").textContent = "Dit bestand is geen geldig perceel (GeoJSON-polygoon)."; } });
  };
  knop();
})();
