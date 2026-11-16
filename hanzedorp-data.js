/* =====================================================================
   HANZEDORP_DATA – centrale databron voor de themapagina's
   Alle cijfers op de basis- én technische pagina komen hieruit.
   Pas een waarde hier aan en beide pagina's rekenen opnieuw.

   Status per getal:  G = GEMETEN   A = AFGELEID   N = AANNAME   S = SCHATTING
   bron: verwijst naar HANZEDORP_DATA.bronnen[id]
   ===================================================================== */
/* BASISDATA – gedeeld door alle projectkavels: woningen, bewoners, auto's, installaties, ontwerpkeuzes, landelijke regels en tarieven.
   Locatiespecifieke gegevens (klimaat, waterschap, netbeheerder, waterbedrijf, grondprijs, terrein) staan per project in hanzedorp-projecten.js. */
window.HANZEDORP_DATA = {
  versie: "0.21",
  datum: "16-11-2026",
  auteur: "Melvin de Vries",

  /* ---------- Woningprogramma [9] ----------
     12 woningen (besluit Melvin de Vries 27-10-2026 [81]; aangescherpt 04-11-2026 [171]: grens 11 of 12 woningen om als CPO gezien te worden; bij 13 en meer ziet de gemeente het als commerciële ontwikkeling – dat willen we niet), verdeling 6/3/3 (N; eerder 15 woningen 9/3/3);
     dakoppervlak per type opgegeven; bewoners per type: AANNAME */
  woningen: [
    { type: "Gezinswoning",   n: 6, pers: 4, dak: 75 },
    { type: "Seniorenwoning", n: 3, pers: 2, dak: 60 },
    { type: "Jongerenwoning", n: 3, pers: 1, dak: 40 }
  ],
  tankPerWoning: 2,         // BESLUIT [81]: tank per woning (eenvoudigst); 2 m³ (groter levert geen extra dekking op, A)

  /* ---------- Daken [9][13] ----------
     Hard dak C = 0,8 (N); groendak C ≈ 0,5 op basis van circa 50 % jaarlijkse retentie (S [13]).
     Daktype: ongeveer de helft groendak (opgave [9]). */
  dak: { cHard: 0.8, cGroen: 0.5, aandeelGroen: 0.5 },
  daktypes: [
    { id: "half",     naam: "Half groendak, opvang van het hele dak", kort: "Half groen",   C: 0.65 },
    { id: "halfHard", naam: "Half groendak, alleen opvang van het harde deel", kort: "Alleen hard deel", C: 0.4, standaard: true },
    { id: "groen",    naam: "Alles groendak", kort: "Alles groen", C: 0.5 },
    { id: "hard",     naam: "Alles hard dak", kort: "Alles hard",   C: 0.8 }
  ],

  /* ---------- Hemelwatertoepassing (besluit 23-10-2026: alleen harde dakdelen, geen bruin water) ---------- */
  toepassingen: [
    { id: "toilet",          naam: "Alleen toilet" },
    { id: "toiletWas",       naam: "Toilet en wasmachine", standaard: true },
    { id: "toiletWasStraat", naam: "Toilet en wasmachine, plus straatwater (VERVALLEN 27-10-2026, alleen in technische vergelijking)", vergelijking: true }
  ],
  verhard: { perWoningM2: 100, cStraat: 0.8 },   // vervangen door afgeleide waarde uit kavels (post-proces onderaan, [119]); was opgave ± 100 m² [9]; C straat: N

  /* ---------- Kosten buffer [17] (prijsindicaties 5.000 L, niet geverifieerd) ---------- */
  kosten: [
    { id: "zak",   naam: "Regenwaterzak in kruipruimte", min: 4500, max: 5500, noot: "compleet systeem met filter en pompunit; kruipruimte ≥ 50 cm hoog en droog" },
    { id: "tank",  naam: "Ondergrondse tank in de tuin", min: 4500, max: 7500, noot: "inclusief graafwerk, pomp, filters en aansluiten" },
    { id: "centraal", naam: "Centrale tank bij het buurthuis", min: null, max: null, noot: "kosten nog onbekend; vul zelf een totaalbedrag in" }
  ],


  /* ---------- Tuinderij [10][11] ---------- */
  tuinderij: { ha: 1 },     // [10] circa 1 ha; neerslagtekort uit hanzedorp-dagbalans.js (tekort)



  /* ---------- Meetdata referentiewoning Zwolle ---------- */
  meting: {
    periode: "24-10-2025 t/m 23-10-2026", interval: "15 minuten", dagen: 364.5,
    personen: 4,                     // G
    lpd: 312,                        // G [1] liter per dag, heel huishouden
    m3jaar: 114,                     // G [1]
    piek15: 141,                     // G [1] hoogste kwartierwaarde (L)
    nacht: 5.7,                      // G [1] mediaan 02–05 u (L)
    dagMin: 0, dagMediaan: 296, dagP75: 391, dagMax: 855,          // G [1]
    weekdag: [279, 266, 281, 303, 337, 328, 388],                  // G [1] ma..zo, L/dag
    maandLpd: [333, 291, 327, 341, 295, 359, 175, 335, 285, 317, 360, 323], // G [1] jan..dec
    uurL: [2.9,1.7,2.2,3.0,4.0,3.5,4.8,14.7,23.5,26.7,24.2,21.0,16.2,14.7,13.6,13.0,11.4,14.2,17.8,16.1,16.7,19.5,18.9,7.2], // G [1]
    opschoning: { nulwaarden: 48, gatenGroterDan15min: 2, langsteGat: "1 u 15 min" },
    wasmachine: { cycli: 228, lPerCyclus: 60, lBandLaag: 50, lBandHoog: 75, kwhPerCyclus: 0.85, nNacht: 28 }, // A [1][2]
    vaatwasser: { cycli: 351, lPerCyclus: 12.5, kwhPerCyclus: 1.47, nNacht: 154 },                          // A [1][2]
    toilet: { lKlein: 4.5, lGroot: 11,                         // G [4] spoelvolumes
              kleinDag: 10, grootDag: 4 },                     // G [4] spoelingen per dag, heel huishouden
    warmwaterKwhDag: 1.9,            // A [3] zomermaanden lucht-waterwarmtepomp referentiewoning, alleen tapwater
    /* weer tijdens de meetperiode [12], 24-10-2025 t/m 21-10-2026 (363 dagen) */
    weer: { neerslagMm: 570, aprilMm: 6, verdampingMm: 660, warmeDagen: 38,
            lpdWarm: 365, lpdOverig: 322, corrTx: 0.01 }   // A; warme dag = TX ≥ 25 °C, afwezigheidsdagen (< 100 L) uitgesloten
  },

  /* ---------- Bewonersmodel: aanwezigheid, levensfase, urinoir [1][4][29] ----------
     Afgeleid uit de meetdata (alleen aanwezigheidsdagen ≥ 40 L): werkdag gem. 304,9 L/d,
     weekend gem. 373,9 L/d. Aanwezigheid overdag (9–16 u) op werkdagen in het meetjaar:
     volwassene 1: 4 van 5 dagen, volwassene 2: 2 van 5, kinderen 0 (school) → 1,2 persoon; weekend 4.
     Verschil 69,0 L / 2,8 persoon = 24,6 L per persoon per dag overdag thuis (A).
     Persoon heel de dag thuis: 373,9 / 4 = 93,5 L/d (A) → basis (overdag weg) 68,8 L/d (A).
     Afwezigheid (vakantie, < 40 L): 14 dagen; jaarfactor 311,7 / 324,2 = 0,961 (G).
     Toilet: 10 kleine en 4 grote spoelingen per dag voor het huishouden [4]; aanname: aantal
     toiletbezoeken evenredig met wakkere uren thuis; overdag 9–16 u = 7 van 16 wakkere uren. */
  bewoners: {
    lBasis: 68.8, lDag: 24.6, vakantie: 0.961,           // A [1][29]
    werkdagThuisRef: 304.9, weekendRef: 373.9,           // A [1]
    weekdagThuis: [284.5, 277.1, 292.2, 315.9, 354.9, 335.3, 412.4],   // G [1] ma..zo, L/d, alleen aanwezigheidsdagen
    fDag: 0.4375,                                        // N 7/16 wakkere uren
    kleinVol: 3.2, grootVol: 1.28,                       // A spoelingen pp per dag bij volledig thuis
    urinoirL: 0.5,                                       // N opgave Melvin [29]
    urinoirAandeel: 0.5,                                 // N aandeel kleine spoelingen via urinoir (≈ aandeel mannen)
    wasLpp: 9.4,                                         // A 13,7 m³ / 4 pers / 365 d, onafhankelijk van aanwezigheid (N)
    spoelHerkend: { klein: 8.8, groot: 2.3 }             // A kwartieren met 3,5–5,5 L resp. 9,5–12,5 L per dag (indicatief)
  },
  /* rollen: thuisdagen = werkdagen overdag thuis (van 5); weekend altijd thuis (N) */
  levensfase: [
    { id: "start", naam: "Bij de start", toelichting: "gezinnen 40–50 jaar met schoolgaande kinderen, jongeren 20–30, senioren 60–70 (gepensioneerd)",
      gezin: ["werkend", "werkend", "school", "school"], senior: ["pensioen", "pensioen"], junior: ["werkend"] },
    { id: "p10", naam: "Over 10 jaar", toelichting: "kinderen uit huis; ouders 50–60 werkend; nieuwe jongeren 20–30 (doorstroom); senioren 70–80",
      gezin: ["werkend", "werkend"], senior: ["pensioen", "pensioen"], junior: ["werkend"] },
    { id: "p20", naam: "Over 20 jaar", toelichting: "ouders 60–70 gepensioneerd; jongeren 20–30; senioren 80–90 (huishoudgrootte gelijk gehouden)",
      gezin: ["pensioen", "pensioen"], senior: ["pensioen", "pensioen"], junior: ["werkend"] },
    { id: "max", naam: "Theoretisch maximum", toelichting: "elk huis zo vol als redelijk kan: gezinnen met vier kinderen, senioren met z'n tweeën, jongeren met partner en een kind (ontwerpwaarde: zo komt er in geen enkel jaar een tekort)",
      gezin: ["werkend", "werkend", "school", "school", "school", "school"], senior: ["pensioen", "pensioen"], junior: ["werkend", "werkend", "school"], ontwerp: true }
  ],
  /* levensloop (opgave Melvin 27-10-2026 [68]): bewoners verhuizen naar en uit Hanzedorp, kinderen worden geboren, relaties beginnen en
     eindigen, er overlijdt af en toe iemand. Het aantal bewoners is dus niet vast; de fasen hierboven zijn momentopnamen en het
     'theoretisch maximum' is de ontwerpwaarde voor installaties (opgave [80]: gezin met vier kinderen = 6, senior 2, jongere met partner en kind = 3). */
  thuiswerk: [
    { id: "geen", naam: "Niemand werkt thuis", gezin: [0, 0], junior: 0 },
    { id: "ref", naam: "Zoals ons gezin nu", gezin: [4, 2], junior: 1, standaard: true },   // junior 1 dag: N
    { id: "alles", naam: "Iedereen werkt thuis", gezin: [5, 5], junior: 5 }
  ],

  /* ---------- Digitale infrastructuur (besluiten Melvin de Vries 26–27-10-2026 [74]; stuklijst Hanzedorp-stuklijst-netwerk.xlsx) ---------- */
  digitaal: {
    basisWoningen: 15,          // stuklijst opgesteld voor 15 woningen; model schaalt naar het actuele aantal
    nuPerHuishouden: 52.5,      // G opgave [74]: KPN SuperFiber 1000 per huishouden per maand
    doelBesparing: 0.6,         // G opgave [74]
    levensduur: 7,              // N jaar, afschrijving apparatuur
    camBitrate: 4,              // N Mbit/s per camera (1080p–4K H.265)
    camAantal: 12,              // G besluit [74]: hoofdingang, serverruimtes, accuruimte, carport (10) + 2 PTZ akker
    bewaarDagen: 28,            // A AP-richtlijn: in de regel maximaal 4 weken [79]
    bewegingFactor: 1 / 3,      // N opname op beweging t.o.v. continu
    nvrTB: 24,                  // A 4 × 8 TB RAID 5 netto
    // eenmalig per categorie (€) – stuklijst 27-10-2026; status: B = prijs leverancier, S = schatting/aanname
    stuk: [
      { cat: "Internet (twee lijnen + 5G)", eur: 1900, st: "B", wat: "2 gateways/firewalls (redundant), Starlink-kit + router, 5G-router" },
      { cat: "Kern in het buurthuis", eur: 4177, st: "B/S", wat: "2 core-switches (glas), PoE-switch, 2 wifi-punten, rack en glasvezelverdeler" },
      { cat: "Per woning", eur: 7785, st: "B", wat: "15 × switch met glas-uplink, wifi-punt en 2 optische modules", perWoning: true },
      { cat: "Glasvezel in de sleuf", eur: 7350, st: "S", wat: "± 3 km buitenkabel, lassen en afmonteren, modules naar schuur, carport, accu, akker" },
      { cat: "Buitenterrein en akker", eur: 1547, st: "B", wat: "3 switches (carport, schuur, nutsgebouw akker), 4 wifi-punten buiten" },
      { cat: "Camera's", eur: 2937, st: "B/S", wat: "10 camera's zonder geluid, 2 draai-/zoomcamera's akker, videorecorder met 4 × 8 TB" },
      { cat: "Servers en back-up", eur: 3100, st: "S", wat: "2 servers (buurthuis + schuur) + derde stem, offsite back-up" },
      { cat: "Noodstroom (UPS)", eur: 3148, st: "B", wat: "online-UPS buurthuis en schuur" },
      { cat: "Sensoren (LoRaWAN)", eur: 1180, st: "B", wat: "gateway + 8 bodemvocht-/EC-sensoren akker" },
      { cat: "Personenalarmering", eur: 368, st: "B", wat: "aansluiting voor 3 seniorenwoningen" },
      { cat: "Installatie en configuratie", eur: 3200, st: "S", wat: "40 uur zzp'er" }
    ],
    // maandelijks (€)
    maand: [
      { post: "Zakelijke glasvezel met vaste IP-adressen", eur: 190, st: "N", basis: true },
      { post: "Starlink Residential (tweede lijn)", eur: 50, st: "B", basis: true, lite: 35 },
      { post: "5G-simkaart (derde lijn)", eur: 20, st: "S", basis: true },
      { post: "Beheer door zzp'er, 1 uur op afstand", eur: 80, st: "N", basis: true },
      { post: "Offsite back-up", eur: 10, st: "S", basis: true },
      { post: "Personenalarmering met zorgcentrale (3 woningen)", eur: 202.26, st: "B" }
    ],
    vlans: [
      ["Woning 1 t/m 15", "Eén eigen netwerk per woning; woningen zien elkaar niet", "internet"],
      ["Beheer", "Switches, wifi-punten, gateways; alleen voor de beheerder (MFA)", "geen"],
      ["Servers", "EMS, Home Assistant, back-up, videorecorder", "beperkt"],
      ["OT / energie", "Accu, omvormers, laadpalen, MID-meters, koelcellen, pomp", "geen – werkt zonder internet"],
      ["Camera's", "Camera's en videorecorder; beelden blijven lokaal", "geen"],
      ["Sensoren (LoRaWAN)", "Bodemsensoren, later watermeters", "beperkt"],
      ["Gasten / IoT", "Bezoek, slimme apparaten van bewoners", "internet, afgeschermd"],
      ["Buurthuis", "Gedeelde ruimten, keuken, wasruimte, werkplaats", "internet"]
    ]
  },

  /* ---------- Grond & kosten (v0.15, opgave Melvin de Vries 27-10-2026 [82]; bedragen excl. btw tenzij vermeld)
     status: G = gemeten/opgave of officieel tarief, A = afgeleid, N = aanname, S = schatting (bandbreedte, te vervangen door offerte) ---------- */
  grond: {
    // ruimteprogramma (m²); woningkavel = bebouwd + privétuin + verharding rond de woning
    bebouwd: { gezin: 150, senior: 85, junior: 55 },
    accuAfstand: 13,              // N afstand buurtaccu ↔ carport/gebouwen: RIVM indicatief brandscenario tot 13 m per module (gifwolk ≤ 24 m, explosie 57 m, overschat) [120]; te bevestigen Veiligheidsregio
    kavel: { gezin: 500, senior: 300, junior: 120 },        // G opgave Melvin 27-10-2026 18:20 [119]: kavelgrootte per woningtype
    aandeelTuin: 0.75,                                      // G opgave 27-10-2026 18:24 [119]: kavel minus bebouwd = 75 % privétuin, 25 % verharding        // N bruto footprint bij gelijkvloers (gebruiksoppervlak + wanden)
    gemeenschappelijk: [
      ["Buurthuis met erf", 250, "N"], ["Twee schuren (werkplaats, opslag, server 2)", 300, "N"], ["Overdekte parkeerplaats (20 plekken van 2,75 × 8 m) met rijbaan aan de noordkant", 770, "A"],
      ["Buurtaccu: 3 blokken in stalen brandveilige behuizing (± 10 m²) met vrije werkruimte en aanrijdbeveiliging", 60, "G/N"],
      ["Groepenkast- en omvormerbehuizing naast de accu (kabels naar de woningen en het buurthuis)", 20, "N"],
      ["Zwemvijver met oever", 250, "A"], ["Tuinvijver", 500, "A"],
      ["Gezamenlijk groen met wadi's", 3000, "N"],
      ["Rondweg 4,5 m breed (± 290 m; hulpdiensten rijden om de carport heen), incl. opstelplaatsen", 1300, "S"], ["Paden en plein", 400, "N"],
      ["Kippenhok en ren", 180, "A"], ["Nutsgebouw en bassin akker", 250, "N"], ["Akker voor de tuinderij, met agri-PV", 5000, "N"]
    ],
    // Ruimteprogramma per doel (opgave 04-11-2026 [161]). KEUZE = zelf te kiezen; GEVOLG = volgt uit keuzes (schaalt mee); NORM = volgt uit een regel.
    ruimte: {
      wegBreedte: 4.5,          // G rondweg: bruidsschat art. 22.14 ≥ 4,5 m breed, ≥ 3,25 m verhard en dragend [110]
      wegGesloten: 2.5, wegGrastegel: 1.0, grastegelFactor: 0.5,   // G opgave [164]: 2,5 m gesloten + 2 × 1,0 m grastegels; N grastegels tellen voor afstroming/berging voor de helft als verhard (waterschap te bevestigen)
      rondwegRefM: 290,         // S lengte rondweg bij het referentieprogramma (kern ± kernRefM2); schaalt met √(oppervlak kern)
      kernRefM2: 8370,          // A oppervlak woonkern (kavels + gebouwen + carport + vijvers + groen) van het referentieprogramma, waarmee 290 m is geschat
      bermBreedte: 1.0,         // N berm per zijde van de rondweg (afwatering naar wadi, infrasleuf, sneeuw/onderhoud); 2 zijden
      padenPerWoning: 25,       // N voetpaden per woning (kavel → rondweg, buurthuis, carport)
      pleinM2: 100,             // N ontmoetingsplein bij het buurthuis
      groenM2: 2000,            // N gezamenlijk speel-, natuur- en ontmoetingsgroen (excl. wadi's, bermen, singel)
      wadiTalud: 1.3,           // N bruto/netto: taluds 1:3 rond de wadibodem
      singelBreedte: 4,         // N houtsingel/erfbeplanting langs de buitengrens (landschappelijke inpassing; eis provincie/gemeente te verifiëren)
      vormfactor: 4.24,         // A omtrek = 4,24 · √A voor een rechthoek 1:2 (vorm van het terrein onbekend)
      buurthuis: { gebouw: 120, erf: 130 },   // N buurthuis ± 120 m² footprint (dak hard → zwemvijver) + erf/terras
      schuren: { aantal: 2, gebouw: 100, erf: 50 },   // N schuren (werkplaats, opslag, server 2)
      zwemOever: 100,           // N oever, steiger en ligweide rond de zwemvijver (water: zwemvijver.oppStd)
      tuinvijverM2: 500,        // A tuinvijver (tuinwater-technisch)
      accuM2: 60, verdeelM2: 20, afvalM2: 20,   // G/N accuterrein, groepenkast-/omvormerbehuizing; N afvalcontainerplek
      nutsgebouwM2: 25, nutsVerhardM2: 25,      // N nutsgebouw akker (pomp, filters, bemesting) + opstelplaats
      erfmolenM2: 50            // S per erfmolen: fundering ± 5 × 5 m + onderhoudsstrook
    },
    obGrond: 0.104,               // G overdrachtsbelasting 2026 onbebouwde grond / andere onroerende zaken 10,4 % [88]
    onvoorzien: 0.10,             // N
    // posten: [groep, omschrijving, aantal-functie sleutel, eenheidsprijs min, max, eenheid, status, bron]
    posten: [
      ["Grondverwerving", "Notaris, kadaster, taxatie, hypotheekakte", "vast", 4000, 8000, "totaal", "S"],
      ["Plan en vergunning", "Wijziging omgevingsplan en ruimtelijke onderbouwing (adviseur)", "vast", 15000, 40000, "totaal", "S"],
      ["Plan en vergunning", "Kostenverhaal gemeente (anterieure overeenkomst) en planschaderisico", "vast", 10000, 50000, "totaal", "S"],
      ["Plan en vergunning", "Leges omgevingsvergunning bouwen (± 2–3 % van de bouwkosten)", "bouwsom", 0.02, 0.03, "× bouwsom", "S"],
      ["Onderzoeken", "Verkennend bodemonderzoek + asbest in bodem (NEN 5740 / NEN 5707), incl. PFAS", "ha", 3000, 6000, "per ha", "S"],
      ["Onderzoeken", "Geohydrologisch onderzoek en grondwaterstand (GHG), doorlatendheid (k)", "vast", 3000, 8000, "totaal", "S"],
      ["Onderzoeken", "Sonderingen voor de fundering", "sondering", 400, 800, "per sondering", "S"],
      ["Onderzoeken", "Quickscan flora en fauna (+ eventueel nader onderzoek)", "vast", 1500, 8000, "totaal", "S"],
      ["Onderzoeken", "Archeologie: bureauonderzoek (+ eventueel booronderzoek)", "vast", 1500, 6000, "totaal", "S"],
      ["Onderzoeken", "Stikstofberekening AERIUS (bouw- en gebruiksfase)", "vast", 1500, 4000, "totaal", "S"],
      ["Onderzoeken", "Overig: watertoets, geluid, externe veiligheid (accu), verkeer", "vast", 2000, 8000, "totaal", "S"],
      ["Bouwrijp maken", "Grondwerk, bouwweg, ontwatering", "m2plan", 5, 15, "per m² plangebied (excl. akker)", "S"],
      ["Bouwrijp maken", "Infrasleuf met mantelbuizen (stroom, data, drinkwater), riool en inspectieputten", "m_sleuf", 150, 350, "per m sleuf", "S"],
      ["Aansluitingen", "Netaansluiting 3 × 25 A (Liander, eenmalig)", "vast", 1662, 1662, "totaal", "G"],
      ["Aansluitingen", "Drinkwateraansluiting (waterbedrijf)", "vast", 1500, 5000, "totaal", "S"],
      ["Aansluitingen", "Aansluiting gemeentelijk riool", "vast", 2000, 10000, "totaal", "S"],
      ["Woonrijp maken", "Wegen en paden (half verhard / klinkers)", "m2weg", 50, 100, "per m²", "S"],
      ["Woonrijp maken", "Beplanting, verlichting, hekwerk, kleine inrichting", "m2groen", 5, 15, "per m² groen", "S"],
      ["Organisatie", "Oprichten vereniging/coöperatie, statuten, notaris", "vast", 1000, 3000, "totaal", "S"],
      ["Organisatie", "CPO-begeleiding en projectmanagement", "bouwsom", 0.01, 0.03, "× bouwsom", "S"],
      ["Organisatie", "Juridisch en fiscaal advies (energie, drinkwater, structuur)", "vast", 10000, 25000, "totaal", "S"],
      ["Organisatie", "Verzekeringen (CAR) en bankkosten", "bouwsom", 0.003, 0.008, "× bouwsom", "S"]
    ],
    bouwsomPerM2: 2500,           // S bouwkosten passiefhuis CLT per m² gebruiksoppervlak (alleen als grondslag voor leges/begeleiding; bouwkosten zelf in thema Bouwen)
    sonderingen: 20,              // N ± 1 per woning + gemeenschappelijke gebouwen
    sleufM: 600,                  // N lengte infrasleuf langs de wegen
    planfase: [0.05, 0.10]        // G Rabobank: planfase (architect, constructeur, adviseur, leges) meestal 5–10 % van de woningprijs [89]
  },

  /* ---------- Natuurinclusief wonen, biofilisch inrichten, dieren op het erf (v0.15, opgave [91]) ---------- */
  natuur: {
    // puntensysteem naar voorbeeld van de beleidsregel van Meppel [92]; minimaal 10 punten per woning (N: als richtwaarde overgenomen)
    minPunten: 10,
    maatregelen: [
      ["huismus", "Nestgelegenheid huismus (2 stuks, ingang noord/oost, > 3 m hoog)", 5, true],
      ["gierzwaluw", "Nestgelegenheid gierzwaluw (2 stuks, > 6 m hoog, vrije uitvlieg 3 m)", 5, false],
      ["vide", "Vogelvide onder de onderste rij dakpannen", 5, false],
      ["vleermuis", "Vleermuisinbouwkast (zuidwest, > 4 m, niet verlicht)", 7, true],
      ["groendak", "Groen dak op het hoofdgebouw (streekeigen soorten)", 7, true],
      ["gevel", "Groene gevel (streekeigen klimplanten)", 5, false],
      ["bijgebouw", "Groen dak op een bijgebouw (schuur, berging)", 5, false],
      ["insect", "Insectenvoorziening in de gevel (50 × 50 cm, zuidwest)", 3, true],
      ["overig", "Overige maatregel met aantoonbare waarde (ecologisch oordeel)", 3, false]
    ],
    erf: [
      "Hagen van inheemse soorten in plaats van schuttingen (meidoorn, sleedoorn, hazelaar, veldesdoorn)",
      "Egeldoorgangen van ± 13 × 13 cm in elke erfafscheiding",
      "Bloemrijk grasland in het gezamenlijk groen, 1–2 keer per jaar maaien en afvoeren",
      "Hoogstam-boomgaard en kleinfruit op de akker",
      "Takkenrillen en stapels stenen of hout als schuilplek",
      "Tuinvijver met flauwe oever voor amfibieën; wadi's met natte ruigte",
      "Geen bestrijdingsmiddelen en geen kunstmest",
      "Donker terrein: weinig buitenlicht, warm-wit of amber, op bewegingsmelder"
    ]
  },
  biofilisch: {
    // 14 patronen (Browning, Ryan & Clancy 2014; 15e patroon 'ontzag' in de editie 2024) [93]
    patronen: [
      ["Natuur in de ruimte", "Zichtbare verbinding met de natuur", "Uitzicht op akker, vijver en bomen vanuit woonkamer en keuken"],
      ["Natuur in de ruimte", "Niet-visuele verbinding met de natuur", "Vogels en wind horen, kruiden ruiken, hout voelen"],
      ["Natuur in de ruimte", "Niet-ritmische prikkels", "Bewegende bladeren, wolken, insecten bij het raam"],
      ["Natuur in de ruimte", "Variatie in warmte en luchtstroom", "Veranda en serre als overgang; ramen die open kunnen"],
      ["Natuur in de ruimte", "Aanwezigheid van water", "Zicht op of geluid van vijver en wadi"],
      ["Natuur in de ruimte", "Dynamisch en diffuus licht", "Daglicht van meerdere kanten, lichtkoepel, dimbaar warm licht 's avonds"],
      ["Natuur in de ruimte", "Verbinding met natuurlijke systemen", "Seizoenen zien op de akker; regenwater zichtbaar opgevangen"],
      ["Natuurlijke analogieën", "Biomorfe vormen en patronen", "Ronde vormen, houtnerf, bladmotieven"],
      ["Natuurlijke analogieën", "Natuurlijke materialen", "CLT en hout in het zicht, leem, wol, kurk, natuursteen"],
      ["Natuurlijke analogieën", "Complexiteit en orde", "Rustige basis met natuurlijke variatie (houtnerf, groen)"],
      ["Aard van de ruimte", "Vergezicht (prospect)", "Lange zichtlijnen naar buiten"],
      ["Aard van de ruimte", "Schuilplek (refuge)", "Beschutte zithoek, nis, veranda met overstek"],
      ["Aard van de ruimte", "Mysterie", "Kronkelende paden, een hoek die je nieuwsgierig maakt"],
      ["Aard van de ruimte", "Spanning (risico)", "Boomhut, uitkijkpunt, trapjes over water – veilig maar spannend"],
      ["Aard van de ruimte", "Ontzag (2024)", "Sterrenhemel zonder lichtvervuiling, grote boom, weids uitzicht"]
    ]
  },
  erfdieren: {
    eierenPPweek: 3,           // N eieren per persoon per week (vraag)
    eierenPerKip: 200,         // G Leefmilieu Brussel [100]; LICG: ± 200 in het eerste legjaar [106]
    voerG: 100,                // G LICG 30–100 g per kip per dag [106] (Brussel: 150–200 g [100]); bovenkant LICG
    hokM2: 0.5,                // G 1 m² per 2 kippen [100]
    renM2: 5,                  // G minimaal 5 m² ren per kip [100]
    waterL: 0.25,              // S liter drinkwater per kip per dag
    reserve: 0.2,              // N extra kippen voor rui, broedsheid, leeftijd
    legjaren: 3                // G leg neemt af na 3–4 jaar [100]
  },

  /* ---------- Zwemvijver volgens Pagan Butler [22] en tuinvijver [18][29] ---------- */
  zwemvijver: { minM2: 120, plantenzone: 0.5, zwemDiepte: 3.0, oppStd: 150, dakCarport: 440, dakBuurthuis: 120,   // BESLUIT [82]: 3 m diep, kleiner oppervlak; dakwater carport (± 275 m², A uit 55 kWp / 0,2) + buurthuis (± 120 m² incl. overstek, N)
                  reserveBoek: 0.3, reserveKeuze: 0.5, fOpenWater: 1.25 },
  tuinvijver: { groendakM2: 487.5, smax: 30, raw: 25, kc: 1.0, fOpenWater: 1.25, tuinPerWoning: 200, ibcM3: 1.0 },

  /* ---------- Akker: irrigatie, put, pomp, bassin, agri-PV [30]–[36] ---------- */
  akker: {
    maxM2: 5000, startM2: 2500,                 // G max. streefgrootte [31]; start: N (kleiner, nog onbekend)
    kc: 1.0, raw: 25, eta: 0.9,                 // N gewasfactor; N RAW (mm) [20]; N efficiëntie druppelirrigatie
    putMaxM3h: 10, putDiepteMax: 50,            // G regels/keuze [31]
    pompP1: 2.7, pompQvul: 8, pompQirr: 6,      // G P1 DAB Jet 300 M [32]; N debiet vullen (lage druk) / irrigatie (± 2 bar)
    zuighoogteMax: 7,                           // N praktische max. aanzuighoogte zelfaanzuigende pomp
    bassinM2: 200, bassinH: 1.0, fOpenWater: 1.25,   // N bassin (keuze Melvin: open bassin); bruikbare diepte
    druppel: { lph: 2.0, afstand: 0.30, rij: 0.75 }, // N druppelslang 2 L/h per 30 cm, rijafstand 0,75 m
    ijzerKlasse: { licht: 0.1, ernstig: 1.5 },        // G Fe mg/l verstoppingsrisico [33]
    // agri-PV: rijen noord–zuid, verticale bifaciale panelen (oost–west), onderrand ≥ 2 m (opgave [31])
    pv: { rijen: 7, rijLengte: 30, rijAfstand: 10, paneelB: 2.28, paneelH: 1.13, wp: 580, bifaciaal: 0.9, achterZicht: 0.72, pr: 0.80, albedo: 0.2, lat: 52.435, lon: 6.259 },
    dorpOverschotWm2: 300                        // N proxy: rond de middag levert de rest van het dorp overschot bij GHI ≥ 300 W/m²
  },

  /* ---------- Voedsel: behoefte, opbrengst, voorraad [34]–[36] ---------- */
  voedsel: {
    groenteGpd: 250, fruitGpd: 200,             // G advies volwassenen Voedingscentrum [34]
    verlies: 0.15,                              // N oogst-, bewaar- en verwerkingsverlies
    opbrGroente: 2.0, opbrFruit: 1.5,           // N kg/m²·jr incl. paden (± 50 % van beroepsteelt [35]); fruit: N
    oogstWeken: 40, rustWeken: 12,              // G opgave Melvin [31]
    monden: 45, mondenMax: 400,                 // standaard: Hanzedorp (45 bewoners); schuif [31]
    // voorraadverdeling over bewaarmethoden (N, illustratief) en kg per eenheid (N)
    bewaarVerdeling: [["Koel bewaren (kelder, kuil)", 0.35], ["Wecken en inblikken", 0.25], ["Invriezen", 0.20], ["Drogen", 0.10], ["Pekelen en fermenteren", 0.10]],
    weckKg: 0.5, vriesKgPerL: 0.5,
    /* voorraad en cellen (opgave Melvin 26-10-2026 [56]): koelcel ±2 °C (groente, fruit), koelcel ±10 °C (aardappel, pompoen, ui; opgave ±8 °C, verhoogd i.v.m. pompoen [57]),
       vriescel; thuis per woning een manshoge koelkast en vriezer voor 1 week grijpvoorraad.
       Per gewas: a = aandeel in de groente- of fruitproductie (N), op = verdeling van wat in de opslag gaat (N),
       vt = laatste maand dat het gewas op het veld kan blijven staan (N). */
    voorraad: {
      versMaxFactor: 3,             // N per week eet je van één gewas hooguit 3× zijn aandeel (variatie)
      maxWekenVoorraad: 40,         // N niet meer opslaan dan 40 weken vraag per groep; meer = overschot (weggeven/verkopen)
      dichtheid: { k2: 0.45, k8: 0.6, v: 0.5, b: 0.6 },   // N kg per liter netto opslag (kratten, zakken, potten)
      benutting: 0.40,              // N netto opslagvolume / bruto celvolume (stellingen, gangpad, luchtcirculatie)
      celHoogte: 2.2,               // N binnenhoogte cel (m)
      weekThuis: 1,                 // G opgave: 1 week grijpvoorraad thuis
      temp: { k2: 2, k8: 10, v: -20 },                    // G/N gemiddelde celtemperatuur (°C); k8 op 10 °C i.v.m. pompoen (10–13 °C [57])
      band: { k2: [1, 4], k8: [8, 12], v: [-24, -18] },   // G opgave (k2, v); N k8
      ruimteT: 15,                  // N temperatuur van de zelfgebouwde ruimte rond de cellen (onverwarmd deel buurthuis)
      lambda: 0.022, koudebrug: 1.15,                     // N PIR λ (W/m·K); toeslag koudebruggen/naden
      dikte: { k2: 0.30, k8: 0.20, v: 0.40 },             // N isolatiedikte (m); 'zo dik als zinvol' → zie gevoeligheid
      cop: { k2: 3.0, k8: 3.5, v: 1.6 },                  // N seizoensgemiddelde COP koelmachine
      ventilator: { k2: 15, k8: 10, v: 20 },              // N W verdamperventilator (EC), draait mee met de compressor (+30 %)
      ontdooi: 0.10,                // N extra energie vriescel voor ontdooien (fractie)
      bezoekenPerWeek: 30, deurM3: 1.5,                   // N deuropeningen per cel per week; luchtwissel per opening (sluis/stroken)
      ademhaling: { k2: 0.012, k8: 0.006 },               // N W per kg (ademhalingswarmte bewaarde groente/fruit)
      buitenluchtK8: true,          // N koelcel 10 °C koelt met buitenlucht als het maandgemiddelde buiten ≥ 3 K kouder is
      thuis: { koelL: 350, vriesL: 250 },                 // N manshoge koelkast resp. vriezer (netto liters)
      uitOnderKg: 5,                // N cel gaat uit als hij (bijna) leeg is
      pcmKWh: { k2: 0, k8: 0, v: 0 },                     // N extra koudebuffer (eutectische platen), kWh thermisch; optie
      pcmOptie: { k2: 2, k8: 0, v: 4 },                   // N variant 'met koudebuffer'
      pMax: 2.0                     // N elektrisch vermogen koelmachines samen (kW) bij voorkoelen op overschot
    },
    /* zaaiplan (N: indicatief, algemene teeltkennis NL buitenteelt; te toetsen met teler/zaaikalender)
       zb = zaaien binnen, zp = zaaien of planten buiten, o = oogst, m = bewaarmethoden */
    gewassen: [
      { n: "Peen", a: 0.1, op: { k2: 0.8, v: 0.1, b: 0.1 }, vt: 11, g: "groente", zp: [3,4,5,6], o: [6,7,8,9,10,11], m: ["koel","wecken","invriezen"] },
      { n: "Pastinaak", a: 0.03, op: { k2: 1.0 }, vt: 3, g: "groente", zp: [3,4,5], o: [10,11,12], m: ["koel","veld"] },
      { n: "Ui", a: 0.07, op: { k8: 0.9, b: 0.1 }, g: "groente", zp: [3,4], o: [7,8], m: ["drogen","pekelen"] },
      { n: "Prei", a: 0.05, op: { v: 1.0 }, vt: 3, g: "groente", zb: [2,3], zp: [5,6,7], o: [9,10,11,12], m: ["veld","invriezen"] },
      { n: "Boerenkool", a: 0.03, op: { v: 1.0 }, vt: 2, g: "groente", zb: [4], zp: [6,7], o: [10,11,12], m: ["veld","invriezen"] },
      { n: "Spruitkool", a: 0.03, op: { v: 1.0 }, vt: 1, g: "groente", zb: [3,4], zp: [5,6], o: [10,11,12], m: ["veld","invriezen"] },
      { n: "Witte en rode kool", a: 0.07, op: { k2: 0.7, b: 0.3 }, vt: 11, g: "groente", zb: [3,4], zp: [5,6], o: [8,9,10,11], m: ["koel","pekelen","wecken"] },
      { n: "Bloemkool, broccoli", a: 0.06, op: { v: 1.0 }, g: "groente", zb: [3,4], zp: [5,6,7], o: [7,8,9,10], m: ["invriezen"] },
      { n: "Aardappel", a: 0.1, op: { k8: 1.0 }, g: "groente", zp: [4], o: [7,8,9], m: ["koel"] },
      { n: "Tomaat", a: 0.08, op: { b: 0.8, v: 0.2 }, g: "groente", zb: [3], zp: [5], o: [7,8,9,10], m: ["inblikken","drogen","wecken"] },
      { n: "Courgette", a: 0.05, op: { v: 0.6, b: 0.4 }, g: "groente", zb: [4], zp: [5,6], o: [7,8,9], m: ["invriezen","wecken"] },
      { n: "Pompoen", a: 0.05, op: { k8: 1.0 }, g: "groente", zb: [4], zp: [5,6], o: [9,10], m: ["koel","inblikken"] },
      { n: "Sperzieboon", a: 0.06, op: { v: 0.5, b: 0.5 }, g: "groente", zp: [5,6,7], o: [7,8,9], m: ["wecken","invriezen","pekelen"] },
      { n: "Droge bonen, kapucijners", a: 0.03, op: { b: 1.0 }, g: "groente", zp: [5], o: [8,9], m: ["drogen"] },
      { n: "Erwten, peulen", a: 0.03, op: { v: 1.0 }, g: "groente", zp: [3,4,5], o: [6,7], m: ["invriezen"] },
      { n: "Rode biet", a: 0.04, op: { k2: 0.6, b: 0.4 }, vt: 10, g: "groente", zp: [4,5,6], o: [7,8,9,10], m: ["koel","wecken"] },
      { n: "Knolselderij", a: 0.03, op: { k2: 1.0 }, vt: 11, g: "groente", zb: [3], zp: [5], o: [10,11], m: ["koel"] },
      { n: "Spinazie", a: 0.03, op: { v: 1.0 }, g: "groente", zp: [3,4,8,9], o: [4,5,6,9,10,11], m: ["invriezen"] },
      { n: "Sla, andijvie", a: 0.04, op: {  }, g: "groente", zp: [3,4,5,6,7,8], o: [5,6,7,8,9,10], m: ["vers","invriezen"] },
      { n: "Veldsla, winterpostelein", a: 0.01, op: {  }, vt: 2, g: "groente", zp: [8,9], o: [10,11,12], m: ["vers","veld"] },
      { n: "Kruiden", a: 0.01, op: { b: 1.0 }, g: "groente", zp: [4,5], o: [6,7,8,9], m: ["drogen"] },
      { n: "Aardbei", a: 0.15, op: { v: 0.7, b: 0.3 }, g: "fruit", zp: [8], o: [6,7], m: ["invriezen","wecken"] },
      { n: "Bessen, framboos, braam", a: 0.2, op: { v: 0.5, b: 0.5 }, g: "fruit", zp: [11,12], o: [7,8,9], m: ["wecken","invriezen"] },
      { n: "Appel", a: 0.4, op: { k2: 0.85, b: 0.15 }, g: "fruit", zp: [11,12], o: [8,9,10], m: ["koel","drogen","wecken"] },
      { n: "Peer", a: 0.15, op: { k2: 0.8, b: 0.2 }, g: "fruit", zp: [11,12], o: [8,9,10], m: ["koel","wecken"] },
      { n: "Pruim", a: 0.1, op: { b: 0.7, v: 0.3 }, g: "fruit", zp: [11,12], o: [8,9], m: ["wecken","drogen"] }
    ],
    commercieel: [["Winterpeen", 72.1], ["Waspeen", 54.9], ["Witte kool", 95.9], ["Rode kool", 79.8], ["Rode biet", 73.2], ["Knolselderij", 53.5],
                  ["Prei", 41.0], ["Andijvie", 37.9], ["IJsbergsla", 34.5], ["Courgette", 32.9], ["Aardbei", 29.5], ["Spruitkool", 25.1],
                  ["Bloemkool", 20.2], ["Spinazie", 18.1], ["Sperzieboon", 13.1], ["Broccoli", 11.2]]   // t/ha, CBS 2025 [35]
  },

  /* ---------- Energie: bewoners, comfort, dorpsbalans [1][8][42]–[51] ---------- */
  energie: {
    mix: { gezin: 6, senior: 3, junior: 3 },              // BESLUIT [81]: 12 woningen (CPO); verdeling 6/3/3 N
    pers: { gezin: 4, senior: 2, junior: 1 },             // N (zie woningen)
    opp: { gezin: 130, senior: 70, junior: 45 },          // N gebruiksoppervlak m² (nog niet vastgesteld)
    kWpDak: { gezin: 7.5, senior: 6, junior: 4 },         // N ± helft van het dak PV (0,2 kWp/m²), rest groendak
    pvDakPR: 0.85,                                        // N plat/oost-west op (groen)dak: opbrengst = GHI × PR
    pvExtraKWp: 30,
    // Scenario C (BESLUIT Melvin 26-10-2026): woningdak ± 60 % PV (sedum buitenrand), 2 grote schuren, buurthuis, carport; waar mogelijk verticaal
    scenarioC: { kWpDakType: { gezin: 9, senior: 7.2, junior: 4.8 },   // N 0,2 kWp/m² × 60 % dak
      vlakken: [ { naam: "Schuur 1 dak zuid 35°", b: 35, a: 180, kWp: 10 }, { naam: "Schuur 1 dak noord 35°", b: 35, a: 0, kWp: 10 }, { naam: "Schuur 1 zuidgevel", b: 90, a: 180, kWp: 5 },
        { naam: "Schuur 2 dak zuid 35°", b: 35, a: 180, kWp: 10 }, { naam: "Schuur 2 dak noord 35°", b: 35, a: 0, kWp: 10 }, { naam: "Schuur 2 zuidgevel", b: 90, a: 180, kWp: 5 },
        { naam: "Buurthuis dak zuid 35°", b: 35, a: 180, kWp: 12 }, { naam: "Buurthuis dak noord 35°", b: 35, a: 0, kWp: 12 }, { naam: "Buurthuis zuidgevel", b: 90, a: 180, kWp: 3 },
        { naam: "Carport dak zuid 10° (144 × 600 Wp)", b: 10, a: 180, kWp: 86.4 }, { naam: "Carport zuidwand verticaal (72 × 600 Wp)", b: 90, a: 180, kWp: 43.2 } ] },                                       // N daken buurthuis, schuren, overkapping laadplein
    // passiefhuis: ≤ 15 kWh/m²·jr bij 20 °C (PHPP) [8]; graaddagenmodel met stookgrens T_in − ΔT_int
    qh20: 15, dTint: 8,                                   // G eis [8]; N interne + zonnewinst als temperatuurverhoging (K)
    tin: 22, tinMin: 19, tinMax: 24,                      // N comfort voor bewoners van 70+ (opgave [50], [51])
    cop: { a: 2.8, b: 0.07, min: 2.0, max: 4.5 },         // N COP ventilatieluchtwarmtepomp (compactunit) ruimteverwarming = a + b·T_buiten (°C), begrensd; getoetst aan PHI-certificaat (afwijking 1–3 %) [150]
    wwKWhPP: 175,                                         // A 700 kWh/jr warm tapwater (WP-app) / 4 personen [1]
    wtwWm2: 0.25,                                         // N ventilator WTW, W per m² continu
    // apparaten excl. koelen/vriezen/wassen/drogen/afwassen: a + b·personen (kWh/jr)
    app: { a: 800, b: 380 },                              // A uit Nibud/CBS 2025 [45] minus witgoed (N)
    appGemetenFactor: 2.26,                               // S referentie: 5.251 kWh rest / 2.320 (4 pers) [1][2]
    thuisDagKWh: 0.6,                                     // N extra kWh per persoon per dag overdag thuis zonder kantoorwerk (pensioen)
    quookerKWh: 300,                                      // G opgave [104]: kokendwaterkraan ± 300 kWh/jr per woning; tank (110 °C) verschuifbaar naar overschot
    thuiswerkKWh: 1.5,                                    // G opgave Melvin 27-10-2026 [68]: scherm, laptop en dock ± 1,5 kWh per thuiswerkdag
    werkplaats: { pers: 4, dagen: 220, kWhPersDag: 4, van: 8, tot: 17, pPiek: 20, verwarmKWh: 1700,   // opgave [68][80]: 3–4 mensen; lasapparatuur, draaibank, zaagtafel, afzuiging, verwarming, evt. autobrug
                  machines: [["Lasapparaat (MIG/MAG, 3-fase)", 8], ["Draaibank", 3], ["Zaagtafel", 3], ["Afzuiging", 2.2], ["Autobrug (2-koloms, kort)", 3], ["Verwarming schuur (warmtepomp)", 2]] },   // S kW elektrisch per machine; piek gelijktijdig ± 20 kW (S); verwarming ± 100 m² geïsoleerd, ± 50 kWh/m² th / COP 3 (S)
    vat: { gezin: 300, senior: 175, junior: 150 },
    // Warmte-opwekker per woning (opgave 04-11-2026 [157]): ventilatieluchtwarmtepomp (VLWP) als compactunit met balansventilatie-WTW en tapwatervoorraadvat
    wpKeuze: {
      type: "ventilatieluchtwarmtepomp (compactunit)",
      copRef: [[-7, 2.28], [2, 2.86], [7, 3.25]],   // G ruimteverwarming, gecertificeerde compactunit (PHI-certificaat Stiebel Eltron LWZ 304 SOL) [150]; model COP = a + b·T sluit hierop aan
      spfRef: 2.8,                                  // G seizoensprestatiefactor compactunit volgens certificaat [150]
      copWWRef: [2.28, 3.70],                       // G tapwater, bandbreedte -7…20 °C [150]
      ontwerpWm2: 10, ontwerpWm2Cert: 12,           // G passiefhuis ± 10 W/m² [73]; certificaatbasis 12 W/m² bij 160–230 m³/h, toevoerlucht max 35 °C [150]
      bodemEur: [8500, 16500], bodemWpJaar: 15, bodemBronJaar: [25, 35],   // G factsheet bodemwarmtepomp (verticaal, incl. installatie) [152]
      lwKleinsteKW: 4,                              // S kleinste gangbare lucht-water-buitenunits ± 4 kW nominaal (fabrikantgegevens, te verifiëren)
      geluidDb: 40,                                 // G buitenunit max 40 dB op perceelgrens buren / te openen raam (Bbl 4.107 lid 2, 4.108 lid 3) [154]
      interneWinstPersoon: 1200, interneWinstApparaten: 2900   // G kWh/a voorbeeld Göteborg, Passiefhuizen in NL [73]
    },        // L tapwatervat; G opgave [68] gezin 300, senior 150–200; junior N
    droogRuimte: { restvocht: 0.53, kgWas: 4, latent: 0.628, stookAandeel: 0.6, cop: 3.5 },   // A drogen aan het rek in de technische ruimte: EU-centrifugeklasse B (45–54 %), 2,26 MJ/kg; N stookseizoen, COP
    wit: { wasKWh: 0.85, wasPP: 57, vaatKWh: 1.47, vaatPP: 88, droogKWh: 2.2, droogPP: 0 },   // G/A referentie [2]; BESLUIT [68]: geen droger in de woningen (droogPP 0; referentie had 25 beurten p.p.)
    koelStd: "centraal",                                // G besluit 26-10-2026 [56]: centrale cellen + manshoge koelkast/vriezer thuis
    koel: {
      thuisGroot: { koel: 150, vries: 250 },              // N energielabel-ordegrootte manshoge koelkast + manshoge vriezer
      gemeten: { koel: 116, vries: 330 },                 // G/A referentie (garage, 2 maanden geëxtrapoleerd) [2]
      thuisKlein: 100,                                    // N (vervallen v0.11) kleine koelkast bij centrale cellen
      extraWinterThuis: 200,                              // N variant 'alles thuis': extra vrieskist + koele kast voor wintervoorraad per woning
      cel: { koelT: 2, vriesT: -20, ruimteT: 18, Ukoel: 0.20, Uvries: 0.14, b: 2.0, d: 2.0, h: 2.2,
             extra: 2.0, copKoel: 3.0, copVries: 1.5, hulp: 1.3 },   // N fysisch model koel-/vriescel (PIR-panelen)
      literatuurKWhDag: { koel: 20.7, vries: 24.9 }       // A walk-in 6×8 ft, VS-praktijk [46]
    },
    buurthuisKWh: 2500,                                   // N verlichting, ICT, ventilatie, gedeelde keuken basis
    keuken: { pottenPP: 22, kWhPot: 0.15, droogKgPP: 5, kWhDroog: 1.0 },   // N wecken/inblikken en drogen
    wasseretteBesparing: 0,                               // VERVALLEN [159]: geen gedeelde wasruimte in het buurthuis (was 0,5 N)
    vijverPompW: 100,                                     // N circulatiepomp zwemvijver apr–sep
    // erfmolen Ecoways EAZ-13.2 [43][44]; vermogenscurve in hanzedorp-wind.js
    wind: { n: 2, P: 15, D: 13.2, as: 15, fabrikantMin: 25000, fabrikantMax: 45000, z0: 0.1, cp: 0.35 },
    accu: { kWh: 600, kW: 150, eta: 0.90, segmenten: 3, kWhSegment: 200 },   // BESLUIT [104]: LFP 3 × 200 kWh (redundantie), PCS ± 150 kW
    // dagprofiel huishoudelijk verbruik (aandeel per uur, N: typisch woonprofiel)
    profiel: [0.55,0.5,0.48,0.48,0.5,0.6,0.9,1.15,1.05,0.95,0.95,1.0,1.1,1.0,0.95,0.95,1.1,1.45,1.75,1.65,1.45,1.25,0.95,0.7],
    wwUren: [11, 12, 13, 14]                              // N warm tapwater bij voorkeur midden op de dag (zonnestroom)
  },

  /* ---------- Elektromagnetische velden (gezondheid) – opgave 04-11-2026 [148] ---------- */
  emv: {
    voorzorgMuT: 0.4,              // G jaargemiddeld magneetveld, voorzorgsbeleid bovengrondse hoogspanningslijnen; GGD/RIVM gebruiken het als referentie [63][139]
    publiekMuT: 100,               // G referentieniveau 50 Hz publiek (EU 1999/519/EG, ICNIRP 1998) [63]
    rfLimietWm2: 10,               // G ICNIRP 2020: 2–300 GHz, gemiddeld over 30 min, publiek [142]
    sbm: { magNT: [20, 100, 500], rfMuWm2: [0.1, 10, 1000] },   // G bouwbiologische richtwaarden slaapplek (voorzorg, geen gezondheidsnorm) [145]
    wifi: [ ["2,4 GHz (wettelijk maximum)", 100], ["5 GHz binnen (wettelijk maximum)", 200], ["5 GHz 5470–5725 MHz (maximum met vermogensregeling)", 1000], ["Hanzedorp-instelling 'laag' (voorstel)", 25] ],   // mW EIRP; G CEPT ERC/REC 70-03 annex 3 [147] (te verifiëren in actuele NL-regeling); N instelling
    kabels: [ ["Hoofdkabel accu → verdeelkast, piek (150 kW)", 217, 0.03], ["Hoofdkabel accu → verdeelkast, gemiddeld dorp (± 11 kW)", 16, 0.03], ["Kabel naar een woning, piek inductie + warmtepomp (± 11 kW)", 16, 0.015], ["Kabel naar een woning, gemiddeld (± 0,5 kW)", 0.8, 0.015] ],   // A I = P/(√3·400 V); s = hartafstand aders (N)
    zwerfA: 5                      // N voorbeeld nettostroom (zwerfstroom) bij gecombineerde nul/aarde (PEN)
  },

  /* ---------- Onderhoud en vervanging gedeelde voorzieningen (MJOP) – opgave 04-11-2026 [165] ----------
     Alleen gedeelde voorzieningen (mandelig); woningen zijn privé; alle opwek (ook PV en omvormers op de woningdaken, besluit 04-11-2026 [171]) en de laadpalen op het laadplein [169] zijn gezamenlijk bezit. Grondkosten en bouw-/woonrijp maken staan in grond.
     [id, naam, groep, hoeveelheid (sleutel), eenheid, prijs min, prijs max (€ per eenheid, excl. btw), levensduur (jaar), onderhoud (% van investering per jaar), onderhoud vast (€/jaar), status, bron] */
  /* ---------- Bouwen en kavelpaspoort – besluiten 04-11-2026 16:10 [172] ---------- */
  bouwen: {
    lat: 52.435,                                         // G breedtegraad referentie (KNMI Heino)
    declinatie: -23.44,                                  // G zonsdeclinatie 21 december
    venster: { std: 2, opties: [[0, "alleen 12:00"], [1, "11:00–13:00"], [2, "10:00–14:00"]] },   // N uren zonnetijd zonder schaduw (hele dag is fysisch onmogelijk)
    type: {                                              // N maten voor de schaduwberekening; B bouwlagen en max. goothoogte
      gezin:  { lagen: 2, goot: 6.0, diepte: 9, breedte: 9, helling: 35, kavelB: 18, kavelD: 28 },
      senior: { lagen: 1, goot: 3.0, diepte: 8, breedte: 10, helling: 35, kavelB: 15, kavelD: 20 },
      junior: { lagen: 1, goot: 3.0, diepte: 7, breedte: 7, helling: 35, kavelB: 10, kavelD: 12 }
    },
    ontvanger: 0,                                        // B 'geen schaduw op een andere woning': gemeten tot maaiveld aan de zuidgevel (streng)
    randBinnen: 2, randBuiten: 3, doorwaadbaar: 2,       // B voorstel werkdocument [170], aanpasbaar
    installatieruimte: { min: 4, gezin: 5 },             // B 'mee eens, liefst iets groter': minimaal 4 m², gezin 5 m² (was voorstel 3 m²)
    natuurPunten: 10,                                    // B natuur.html: ≥ 10 punten per woning
    passief: { verwarming: 15, primair: 120, n50: 0.6, oververhitting: 5 },   // G Praktijkboek Passiefhuis §2; oververhitting doel < 5 % uren > 25 °C
    materialen: [                                        // B werkdocument [170] bijlage natuurlijke bouwmaterialen; voorkeur = eis, negatief alleen met motivering
      ["Dragende delen", "hout (ook CLT), bamboe", "kalkzandsteen, baksteen", "beton"],
      ["Tussenwanden", "hout, leem, OSB", "gips en metal stud", "cellenbeton (Ytong), gipsblokken"],
      ["Isolatie", "stro, vlas, hennep, wol, cellulose", "steenwol", "glaswol, EPS/PIR (behalve waar technisch noodzakelijk)"],
      ["Vloeren", "hout, OSB", "–", "beton (kanaalplaat, breedplaat)"],
      ["Gevelbekleding", "ongeverfd hout, onbekante planken", "–", "Trespa, steenstrips, gevelpleister 'betonlook'"],
      ["Dakbedekking", "dakpannen, riet, groendak", "houten shingles", "bitumen, EPDM, zink (EPDM alleen onder groendak, met motivering)"]
    ],
    toetsing: [                                          // B opgave Melvin 04-11-2026 [172]
      ["PHPP-berekening per woning", "Clarence Rose – Azimut Bouwbureau", "https://www.azimutbouwbureau.nl/"],
      ["Luchtdichtheidsmeting (blowerdoortest) bij oplevering", "Olaf Heinen – Franck (waarschijnlijk)", "https://franck.nl/"]
    ]
  },
  /* ---------- Ketenpartners (BESLUIT 04-11-2026 [171]) ----------
     [id, partner (rol), sleutel in project.partijen of null, fase (0–3), eigenaar in het team, wat beoordeelt of beslist deze partij,
      wat leveren wij aan (pagina's), onze concrete vraag, dossierhoofdstukken] */
  ketenpartners: [
    ["gemeente", "Gemeente – ruimtelijke ordening en bestuur", "gemeente", 0, "Nick",
      "Past het plan in de omgevingsvisie en het omgevingsplan? Woningbouwprogramma en ladder duurzame verstedelijking, CPO-categorie (Bkl 5.161c), kostenverhaal (Ow 13.11), parkeernorm, beeldkwaliteit, participatie.",
      ["dossier.html", "grond.html", "eigendom.html", "natuur.html", "biofilisch.html", "veiligheid.html", "financien.html"],
      "Vooroverleg: is een CPO-dorp van 12 woningen kansrijk, via welke route (erf met sloop, kernrand of gemeentegrond)? Wil de gemeente de CPO-categorie opnemen en afzien van (een deel van) het kostenverhaal? Welke parkeernorm geldt?",
      ["H1", "H2", "V1", "V2", "V6", "V7"]],
    ["vergunning", "Gemeente – vergunningverlening en welstand", "gemeente", 2, "Douwe",
      "Omgevingsplanactiviteit en bouwactiviteit; beeldkwaliteit (welstand); BENG via gelijkwaardigheid voor passiefhuizen; milieuprestatie (MPG).",
      ["bouwen.html", "bewoners.html", "veiligheid.html", "gezondheid.html"],
      "Welke stukken wil de vergunningverlener vooraf zien (kavelpaspoort, beeldkwaliteitsplan, gelijkwaardigheid BENG)?",
      ["V4", "V7"]],
    ["provincie", "Provincie", "provincie", 0, "Nick",
      "Omgevingsverordening buitengebied (o.a. kwaliteitsimpuls groene omgeving, energieparagraaf), natuur (Wet natuurbescherming/Omgevingswet, houtopstanden), stikstof.",
      ["grond.html", "natuur.html", "energie.html", "netaansluiting.html"],
      "Past een CPO-erftransformatie met kwaliteitsimpuls hier? Welke eisen gelden voor landschappelijke inpassing (houtwal) en voor de energieparagraaf?",
      ["V2", "V3"]],
    ["waterschap", "Waterschap", "waterschap", 2, "Melvin",
      "Watertoets: compensatie verharding, afvoer, ontwerpgrondwaterstand; melding of vergunning grondwateronttrekking (put).",
      ["hemelwater.html", "tuinwater.html", "akker.html", "water.html"],
      "Akkoord met berging in wadi's en kratten volgens de richtlijn? Telt een groendak mee? Is de put meldingsplichtig of vergunningplichtig?",
      ["V3", "V5"]],
    ["netbeheerder", "Netbeheerder (elektriciteit)", "netbeheerder", 1, "Melvin",
      "Aansluiting en capaciteit, teruglevering, eilandbedrijf achter de meter, congestie.",
      ["netaansluiting.html", "energie.html", "mobiliteit.html"],
      "Is een aansluiting van 3 × 25 A met een privénet, buurtaccu en eilandbedrijf mogelijk, en wat zijn de eisen (EN 50549-1, beveiliging)? Is er congestie op deze plek?",
      ["V5"]],
    ["waterbedrijf", "Waterbedrijf (drinkwater)", "waterbedrijf", 1, "Melvin",
      "Hoofdaansluiting, leveringsdruk, collectieve installatie achter de meter, terugstroombeveiliging.",
      ["water.html", "gezondheid.html"],
      "Is een hoofdaansluiting van 10 m³/h met eigen dorpsleiding en submeters per woning mogelijk? Wat is de leveringsdruk?",
      ["V5"]],
    ["veiligheidsregio", "Veiligheidsregio (brandweer)", "veiligheidsregio", 2, "Nick",
      "Bereikbaarheid, bluswater, buurtaccu en laadplein (PGS 37-1), opstelplaatsen.",
      ["veiligheid.html", "mobiliteit.html", "netaansluiting.html"],
      "Akkoord met een rondweg van 4,5 m (2,5 m gesloten + grastegels), aanzuigpunten bij de vijvers en de plaats van de buurtaccu (± 13 m vrij)?",
      ["V5"]],
    ["omgevingsdienst", "Omgevingsdienst", "omgevingsdienst", 2, "Nick",
      "Milieuregels (Bal): zwemvijver, energieopslag, bodem, lozingen, grondwater.",
      ["tuinwater.html", "gezondheid.html", "veiligheid.html"],
      "Valt de gedeelde zwemvijver onder Bal afdeling 15.2? Wat is nodig voor de buurtaccu (melding)?",
      ["V3", "V5"]],
    ["phpp", "Bouwfysisch adviseur passiefhuis (PHPP)", null, 2, "Douwe",
      "Energiebalans per woning volgens PHPP: verwarming ≤ 15 kWh/m²·jr, primair ≤ 120 kWh/m²·jr, oververhitting, koudebruggen; basis voor BENG-gelijkwaardigheid.",
      ["bouwen.html", "bewoners.html"],
      "PHPP-berekening per woningtype (gezin, senior, jongere) met compactunit, en advies over de oriëntatie en de schaduwregel. (Beoogd: Clarence Rose, Azimut Bouwbureau.)",
      ["V4"]],
    ["blowerdoor", "Luchtdichtheidsmeting (blowerdoortest)", null, 3, "Douwe",
      "Meting n50 ≤ 0,6 h⁻¹ tijdens de bouw (na de luchtdichte laag) en bij oplevering.",
      ["bouwen.html"],
      "Twee metingen per woning (tussentijds en oplevering) en een prijs voor 12 woningen. (Beoogd: Olaf Heinen, Franck.)",
      ["V4"]],
    ["kwaliteitsborger", "Kwaliteitsborger (Wkb)", null, 3, "Douwe",
      "Borgingsplan en toetsing bouwtechniek per woning en gedeeld gebouw (gevolgklasse 1).",
      ["bewoners.html", "veiligheid.html"],
      "Kan één kwaliteitsborger alle woningen en de gedeelde gebouwen begeleiden, ook bij prefab strobouw of CLT?",
      ["V4"]],
    ["bank", "Bank en taxateur", null, 1, "Melvin",
      "Financierbaarheid: individuele koop- en aanneemovereenkomst, achtervang, afbouwgarantie, CAR; waardering van het aandeel in gedeeld bezit; executiewaarde bij kettingbeding.",
      ["financien.html", "eigendom.html", "onderhoud.html"],
      "Financiert u een woning met een aandeel in mandelig bezit en een vaste maandbijdrage? Hoe weegt de taxateur dat aandeel?",
      ["H3", "H4", "H5"]],
    ["notaris", "Notaris", null, 1, "Nick",
      "Mandeligheid, recht van opstal voor panelen op woningdaken, kettingbeding, erfdienstbaarheden, statuten beheerentiteit.",
      ["eigendom.html", "onderhoud.html"],
      "Hoe leggen we mandelig eigendom van installaties (ook op woningdaken) en de bijdrageplicht vast, zodat de beheerentiteit geen eigenaar wordt?",
      ["H6"]],
    ["fiscalist", "Fiscalist en Belastingdienst", null, 1, "Melvin",
      "Energiebelasting over interne stroom, btw op gedeelde voorzieningen, vooroverleg.",
      ["eigendom.html", "netaansluiting.html", "financien.html"],
      "Is gezamenlijk eigendom van alle opwek (Hof Den Bosch 2025) in deze opzet geen levering? Kan de beheerder btw-ondernemer zijn?",
      ["H5", "H6"]],
    ["cpo", "CPO-begeleider", null, 1, "Nick",
      "Groepsvorming, planning, contracten, eisen van banken.",
      ["dossier.html", "financien.html"],
      "Wilt u ons begeleiden van haalbaarheid tot oplevering, en wat kost dat per woning?",
      ["H6", "H7", "H8"]],
    ["bouwer", "Architect en bouwer (prefab hout, stro, CLT)", null, 2, "Douwe",
      "Woningontwerp binnen het kavelpaspoort, passiefhuis (PHPP), prefab, bouwkosten.",
      ["bouwen.html", "bewoners.html", "grond.html", "gezondheid.html"],
      "Wat kost een passiefhuis van 130 / 70 / 45 m² in prefab hout of stro, inclusief compactunit?",
      ["H2", "H3"]],
    ["grondeigenaar", "Grondeigenaar", null, 1, "Nick",
      "Verkoop of gefaseerde overdracht van grond of erf.",
      ["grond.html", "financien.html"],
      "Bent u bereid tot een optie of koop onder voorbehoud, eventueel gefaseerd?",
      ["H1", "H3"]],
    ["tuinder", "Tuinder", null, 1, "nog toe te wijzen",
      "Teeltplan, inzet, vergoeding; eerst voor bewoners, bij voldoende grond ook voor niet-bewoners.",
      ["akker.html", "voedsel.html", "opslag.html"],
      "Wilt u de tuinderij leiden: in dienst, als zelfstandige met gebruiksovereenkomst, of als begeleider van bewoners?",
      ["H2", "H4"]],
    ["omwonenden", "Omwonenden en dorp", null, 0, "iedereen",
      "Draagvlak, landschap, verkeer, geluid; meedoen met de tuinderij.",
      ["natuur.html", "biofilisch.html", "voedsel.html", "veiligheid.html"],
      "Wat vindt u belangrijk? Wilt u op de hoogte blijven of meedoen met de tuinderij?",
      ["V6"]],
    ["leveranciers", "Leveranciers (accu, erfmolen, compactunit, laders)", null, 3, "Melvin",
      "Offertes, certificaten (CE, PGS 37-1, PHI), garanties, onderhoud.",
      ["netaansluiting.html", "energie.html", "bewoners.html", "onderhoud.html"],
      "Offerte volgens onze eisen, met certificaten, levensduur en onderhoudsprijs.",
      ["H3"]]
  ],
  cpo: { maxWoningen: 12, grensCommercieel: 13 },   // BESLUIT 04-11-2026 [171]: 11 of 12 woningen = CPO; ≥ 13 commercieel
  beheer: {
    startJaar: 2030, horizon: 30, inflatie: 0.025, renteFonds: 0.015, bufferEur: 25000,   // N planjaren, prijsstijging, rente reservefonds, minimale buffer
    drinkM: 200,                                       // S lengte dorpsleiding drinkwater (water.html § Drinkwater)
    inGrond: ["weg", "gras", "paden", "hek"],          // aanleg al begroot in Grond & kosten (woonrijp maken) → niet dubbel in de investering, wel in de vervanging
    componenten: [
      ["pv", "Zonnepanelen en montage (buurthuis, schuren, carport, akker)", "Energie", "pvKWp", "kWp", 340, 400, 30, 0.010, 0, "A", "opgave ± € 0,45/Wp all-in, minus omvormers [opgave PV-kosten]"],
      ["pvdak", "Zonnepanelen op de woningdaken (gezamenlijk bezit, recht van opstal)", "Energie", "pvDakKWp", "kWp", 340, 400, 30, 0.010, 0, "S", "besluit [171]; prijs als overige PV"],
      ["omv", "Omvormers zonnepanelen (incl. woningdaken)", "Energie", "pvOmvKWp", "kWp", 60, 100, 13, 0.0, 0, "S", ""],
      ["accu", "Buurtaccu met omvormer (PCS), behuizing en EMS-hardware", "Energie", "accuKWh", "kWh", 350, 550, 15, 0.010, 0, "S", "[130]"],
      ["molen", "Erfmolens", "Energie", "molens", "stuk", 45000, 60000, 20, 0.020, 0, "S", "± € 50.000 per molen [166]"],
      ["verdeel", "Groepenkast-/omvormerbehuizing en hoofdverdeling dorpsnet", "Energie", "vast", "post", 20000, 40000, 30, 0.010, 0, "S", ""],
      ["kabel", "Kabels dorpsnet in de infrasleuf (sleuf zelf: Grond & kosten)", "Energie", "sleufM", "m", 40, 80, 40, 0.002, 0, "S", ""],
      ["laders", "Laadpalen laadplein (AC, OCPP, MID-meter, V2G-gereed), incl. bekabeling vanaf de verdeling", "Energie", "laadpalen", "stuk", 1500, 3000, 12, 0.020, 0, "S", "besluit [169]; meerprijs t.o.v. gedeelde laders ± € 1.000/paal [opgave 27-10-2026]"],
      ["net", "Glasvezel, switches, wifi, servers, UPS en camera's", "Digitaal", "digitaal", "post", 1, 1, 7, 0.0, 0, "B/S", "stuklijst digitale infrastructuur [74]"],
      ["buurthuis", "Buurthuis (gebouw)", "Gebouwen", "buurthuisM2", "m²", 2000, 2800, 50, 0.015, 0, "S", ""],
      ["schuren", "Schuren (werkplaats, opslag)", "Gebouwen", "schurenM2", "m²", 800, 1400, 40, 0.010, 0, "S", ""],
      ["carport", "Carportconstructie (zonder panelen)", "Gebouwen", "carportDakM2", "m²", 150, 300, 40, 0.005, 0, "S", ""],
      ["cellen", "Koel- en vriescellen (panelen, deuren)", "Voedsel", "vast", "post", 15000, 30000, 25, 0.010, 0, "S", ""],
      ["koelm", "Koelmachines cellen (natuurlijk koudemiddel)", "Voedsel", "vast", "post", 8000, 15000, 15, 0.020, 0, "S", ""],
      ["put", "Grondwaterput (boring)", "Akker", "vast", "post", 4000, 10000, 30, 0.010, 0, "S", ""],
      ["pomp", "Pomp, filters en bemesting", "Akker", "vast", "post", 2000, 4000, 10, 0.020, 0, "S", ""],
      ["irr", "Druppelirrigatie en zones (akker in teelt)", "Akker", "akkerM2", "m²", 1.5, 3, 8, 0.030, 0, "S", ""],
      ["bassin", "Bassin akker", "Akker", "vast", "post", 5000, 10000, 30, 0.010, 0, "S", ""],
      ["nuts", "Nutsgebouw akker", "Akker", "vast", "post", 10000, 20000, 40, 0.010, 0, "S", ""],
      ["zwem", "Zwemvijver (water- en plantenzone, techniek)", "Water", "zwemM2", "m²", 200, 400, 30, 0.020, 0, "S", "€ 100–650/m² [167]"],
      ["tuinv", "Tuinvijver", "Water", "tuinvijverM2", "m²", 30, 60, 30, 0.010, 0, "S", ""],
      ["wadi", "Wadi's", "Water", "wadiM2", "m²", 15, 30, 40, 0.0, 0.5, "S", "onderhoud € 0,50/m² per jaar (maaien, slib)"],
      ["drink", "Drinkwaterleiding dorp", "Water", "drinkM", "m", 60, 120, 50, 0.002, 0, "S", ""],
      ["meters", "Submeters drinkwater per woning", "Water", "woningen", "stuk", 457.8, 457.8, 10, 0.0, 0, "G", "Vitens 2026 [124]"],
      ["blus", "Bluswater-aanzuigpunten bij de vijvers", "Water", "vast", "post", 4000, 10000, 30, 0.010, 0, "S", ""],
      ["weg", "Rondweg: gesloten verharding", "Terrein", "wegM2", "m²", 50, 100, 30, 0.005, 0, "S", ""],
      ["gras", "Rondweg: grastegelstroken", "Terrein", "grasM2", "m²", 40, 70, 25, 0.010, 0, "S", ""],
      ["paden", "Paden en plein", "Terrein", "padenM2", "m²", 50, 80, 30, 0.005, 0, "S", ""],
      ["hek", "Hek of pollers, terreinverlichting, bewegwijzering", "Terrein", "vast", "post", 10000, 25000, 15, 0.020, 0, "S", ""],
      ["groen", "Groenbeheer (gezamenlijk groen, bermen, houtsingel)", "Terrein", "groenM2", "m²", 0, 0, 0, 0, 0.6, "S", "€ 0,30–1,00/m² per jaar; aanleg in Grond & kosten"],
      ["keur", "Keuringen en inspecties (NEN 3140, accu, blusmiddelen, legionella)", "Keuringen", "vast", "post", 0, 0, 0, 0, 3500, "S", "NEN 3140 periodiek, PGS 37-1, legionella-beheersplan"]
    ]
  },
  /* ---------- Financiële planning gedeelde voorzieningen – opgave 04-11-2026 [165] ---------- */
  financien: {
    eigenInbreng: 0.3, renteLening: 0.045, looptijd: 25,       // N financiering via de beheervereniging (alternatief: per woning in de hypotheek)
    verzekeringPct: 0.0015,                                    // S opstal- en aansprakelijkheidsverzekering gedeelde voorzieningen (% van investering per jaar)
    administratie: 1500,                                       // S boekhouding, bankkosten, ledenadministratie per jaar
    drinkwaterVast: 250,                                       // S vastrecht hoofdaansluiting drinkwater per jaar
    netSaldo: 570,                                             // A saldo stroom (export − inkoop − netwerk − vast + vermindering) bij 3 × 25 A, handel uit (netaansluiting, 27-10-2026)
    tuinder: { aan: false, eur: 27500, groenteKgPPD: 0.45, eurKg: 2.5 },   // S tuinder ± 0,5 fte; N waarde eigen groente en fruit (kg p.p.p.d. × €/kg)
    btw: 0.21, btwAftrek: false,                               // G btw op gedeelde voorzieningen; aftrek alleen als de beheerder btw-ondernemer is (bv. energiecoöperatie) – te toetsen
    financiering: "hypotheek",                                 // N "hypotheek" = ieder financiert zijn aandeel mee in de eigen hypotheek; "vereniging" = lening op naam van de beheervereniging
    vraagMWh: 99, importMWh: 2.3,                              // A uursimulatie dorp, scenario C (netaansluiting, 27-10-2026)
    stroomprijs: 0.25                                          // G opgave: netstroom ± € 0,25/kWh incl. belastingen (vermeden kosten)
  },

  /* ---------- Mobiliteit en laadplein [1][47]–[50] ---------- */
  net: {
    // Netaansluiting en handel (opgave Melvin 27-10-2026; Liander 2026 [60]; energievergelijk.nl [61]; Alliander/KIVI [62])
    eb: [ { tot: 10000, t: 0.09161 }, { tot: 50000, t: 0.06671 }, { tot: 1e12, t: 0.06671 } ],   // G EB 2026 excl. btw [61]; schijf > 50 MWh niet gevonden → N gelijk aan schijf 2
    vermindering: 628.96,                                      // G belastingvermindering per aansluiting met verblijfsfunctie, incl. btw [61]
    btw: 0.21,
    opslagIn: 0.02, opslagUit: 0.02, vastLevering: 6,          // N leveranciersopslag €/kWh excl. btw en vaste leveringskosten €/mnd (dynamisch contract)
    accu: 600, accuKW: 150, reserve: 0.3, slijtage: 0.03,      // BESLUIT [104]: 3 × 200 kWh, eilandreserve 30 %, slijtage €/kWh doorzet (tot offerte)
    accuKeuze: { eurKWhLaag: 150, eurKWhHoog: 250, eurKWhStd: 200, jaren: 15, rente: 0.03, blokKWh: 150, kritiekKW: 8 },   // S meerprijs per extra kWh opslag (hardware, grootschalige inkoop 2026 € 130–200/kWh [130]); N levensduur, rente; advies 29-10-2026 [131]
    verkoopDrempel: 0.20, horizon: 24,                         // N verkoop uit accu vanaf € 0,20/kWh beurs; vooruitkijken 24 h (day-ahead + weersverwachting)
    ontwerpKVAperWoning: 1.1,                                  // G LS-net ontworpen op ± 1,1 kVA per woning [62]
    huisPVdirect: 0.30,                                        // N deel woningverbruik direct uit eigen dak-PV (scenario met woningaansluitingen)
    jaren: [2023, 2024, 2025]                                  // overlap prijsdata [59] en KNMI-reeks
  },
  mobiliteit: {
    snellader: { eurKWh: 0.45, kWhSessie: 40 },          // S openbaar snelladen (bv. Tesla Supercharger, ook voor andere merken) € 0,35–0,55/kWh, wisselt per locatie en tijd [132]; N ± 40 kWh per laadbeurt
    km: { gezin: 21000, senior: 9000, junior: 8000 },     // G referentie (gezin) [1]; N senior/junior
    kWh100: 18,                                           // A 15 netto + laadverlies [1]
    deelFactor: 0.85,                                     // N minder km bij deelauto's (gedragseffect)
    autos: { gezin: 1.5, senior: 1, junior: 0.7 },        // N auto's per woning bij eigen bezit
    deelAutos: 6,                                         // N deelauto's bij gedeeld bezit
    efietsKmPP: 2000, efietsKWh100: 1.0,                  // N e-fiets
    emotor: { aandeel: 0.2, km: 4000, kWh100: 6 },        // N e-motor/scooter: deel van de woningen
    carport: { plekken: 14, deelauto: 2,   // BESLUIT [109]: 12 vaste plekken + 2 deelauto's
               breedte: 2.75, diepte: 8.0, vrijeHoogte: 3.2, ingang: "noord", dakHelling: 10, plint: 0.4,   // BESLUIT [91][104]: plekken = 1 per woning + deelauto's (naar wens bewoners); overal ± 3,2 m vrij;: lange zijde oost-west aan de zuidkant van het terrein; inrijden vanaf het noorden
               paneel: { Wp: 600, l: 2.278, b: 1.134 }, wandRijen: 3, wandPerVijf: 18, wandWpPerPlek: 1800,   // BESLUIT [109]: 1.800 Wp (3 × 600 Wp) per parkeerplaats op de zuidgevel          // G opgave: 600 Wp, 2278 × 1134 mm; zuidwand 3 panelen hoog liggend op staanders, 18 panelen per 5 plekken = 10,8 kWp
               dakM2: 440, dakPanelen: 144, dakKWp: 86.4, wandPanelen: 72, wandKWp: 43.2 },    // A 20 × 2,75 × 8 m; dak 48 × 3 panelen (staand, 1134 mm langs de gevel); wand 4 × 18
    zappi: { n: 20, kW: 22, autoAC: 11 },                 // BESLUIT 27-10-2026: centraal laadplein, elke parkeerplaats (20) een eigen laadpunt, ≥ 1 per woning; 22 kW AC [47]; N meeste auto's laden AC max. 11 kW
    laadplein: { plekken: 20, meerprijsPaal: 1000, kabelMM2: 6, kabelL: 15, rhoCu: 0.0225, afstandWoning: 150, duMax: 0.03 },  // opgave Melvin 27-10-2026 (meerprijs € 1.000/paal, 6 mm²); N afstanden, ρ Cu bij 70 °C, ontwerpgrens spanningsval 3 %
    flexDagen: 2,                                         // N laadvraag mag tot 2 dagen schuiven
    netLimietKW: 0,                                       // 0 = geen begrenzing in het model
    laadverlies: 0.175, laadverliesMin: 0.15, laadverliesMax: 0.20,   // N opgave Melvin 15–20 % [53]
    /* top 5 per segment: volgorde naar registraties NL 2025 (RAI via Autozine [54]); verbruik = EV Database
       'Average' (kWh/100 km, praktijkverbruik zonder laadverlies) [55]. Hyundai Inster en Kia Niro EV staan niet
       in het EV Database-overzicht en zijn vervangen door het eerstvolgende model dat er wel in staat (MG4 resp. Renault 4). */
    voertuigen: [
      { seg: "Klein", modellen: [["Renault 5 E-Tech 52 kWh", 15.1], ["Peugeot e-208 54 kWh", 15.2], ["Citroën ë-C3 44 kWh", 17.2], ["Mini Aceman E", 16.7], ["Renault 4 E-Tech 52 kWh", 16.3]] },
      { seg: "Compact", modellen: [["Volkswagen ID.3 58 kWh", 15.9], ["Renault Mégane E-Tech 67 kWh", 16.0], ["Cupra Born 58 kWh", 16.1], ["Hyundai Kona Electric 65 kWh", 16.8], ["MG4 Long Range", 16.5]] },
      { seg: "Compacte SUV", modellen: [["Škoda Elroq 85", 17.1], ["Kia EV3 Long Range", 17.1], ["Volvo EX30", 17.8], ["BMW iX1 eDrive20", 16.3], ["Ford Explorer Extended Range RWD", 17.6]] },
      { seg: "Middenklasse", modellen: [["Tesla Model 3 RWD", 13.0], ["Volkswagen ID.7 77 kWh", 16.2], ["BMW i4 eDrive40", 15.5], ["Polestar 2 Long Range Single Motor", 16.6], ["BMW i5 eDrive40 Sedan", 16.9]] },
      { seg: "Grote SUV", modellen: [["Tesla Model Y RWD", 15.8], ["Audi Q4 e-tron", 17.4], ["Volkswagen ID.4 Pro", 17.2], ["Škoda Enyaq 85", 16.7], ["Audi Q6 e-tron", 19.2]] },
      { seg: "Bus / MPV", modellen: [["Volkswagen ID. Buzz Pro", 21.6], ["Volkswagen e-Transporter Kombi L1", 25.3], ["Ford e-Transit Custom Kombi L1", 26.3], ["Opel Vivaro Combi Electric 75 kWh", 26.5], ["Mercedes-Benz eVito Tourer 60 kWh", 27.3]] }
    ],
    /* motoren en scooters: S – verbruik afgeleid uit fabrikantopgave accu/actieradius, nog te verifiëren */
    motoren: [
      { seg: "Scooter / motor", modellen: [["E-scooter 45 km/h (bv. NIU)", 3.5], ["Lichte e-motor (bv. Kawasaki Ninja e-1)", 5.0], ["Maxi-scooter (bv. BMW CE 04)", 7.7], ["Naked / sport (bv. Zero SR/F)", 9.0], ["Toermotor (bv. Energica Experia)", 9.5]] }
    ],
    kmStd: { auto: 12000, motor: 4000 }                   // N standaard jaarkilometrage bij een nieuwe regel
  },

  /* ---------- Hemelwater rond woningen en in het groen: kratten en wadi's [15][52] ---------- */
  hemelwater: {
    kratVerhardPW: 50,                 // afgeleid uit kavels (post-proces, [119]); was N 50 m² verharding rond de woning (oprit, terras, paden) → infiltratiekrat
    kratPorositeit: 0.95, kratElementM3: 0.3,   // N infiltratiekrat (holle ruimte ± 95 %)
    kratHoogte: 0.5,                   // N hoogte kratpakket (m) → bodemoppervlak = volume / hoogte
    groenM2: 3000,                     // N gezamenlijk groen dat naar wadi's afwatert
    cGroen: 0.15,                      // N afvoercoëfficiënt gras/beplanting
    gemVerhardM2: 750,                 // afgeleid uit grond (rondweg + paden, post-proces); was N 750 m² weg en plein → wadi's
    cVerhard: 0.8,
    kDag: 0.5,                         // N doorlatendheid bodem (m/dag); zand 1–5, lemig zand 0,2–1
    wadiDiepte: 0.3,                   // N max. waterdiepte wadi (m)
    wadiAantal: 3,
    leegUren: 48                       // N wadi binnen 48 uur leeg (gangbare ontwerpregel; met WDOD af te stemmen)
  },

  /* ---------- CBS Watergebruik Thuis 2021 [7] ---------- */
  cbs: {
    lppd: 129, pp4: 112,
    huishouden: { 1: 186, 2: 260, 3: 336, 4: 446 },
    aandeel: { toilet: 0.236, douche: 0.361, bad: 0.041, wasmachine: 0.137,
               vaatwasser: 0.030, wastafel: 0.068, overig: 0.127, buiten: 0.007 }
  },

  /* ---------- Passiefhuis [8] ---------- */
  passiefhuis: { ruimteverwarmingMax: 15, primairMax: 120, n50: 0.6,
                 tapTempMin: 55, tapTempMax: 60, tapWachttijdMax: 120 },

  /* ---------- Bronnen (document – auteur) ---------- */
  veiligheid: {
    waterLpppd: 3, dagenOverheid: 3, dagenHanzedorp: 7,   // G Denk Vooruit [112][117]: 72 uur, 3 L drinkwater p.p.p.d.; BESLUIT [115] 1 week
    kcalPPD: 2000,                                        // N energiebehoefte volwassene ± 2.000 kcal/dag (Voedingscentrum-ordegrootte)
    weg: { breedte: 4.5, verharding: 3.25, hoogte: 4.2, massa: 14600, toegangZonderWeg: 10 },   // G Bruidsschat art. 22.14 [110]
    wegProfiel: { gesloten: 2.5, grastegel: 1.0 },          // G opgave [164]: middelste 2,5 m gesloten verharding, 1,0 m per zijde waterdoorlatende grastegels (dragend)
    bluswater: { primM3h: 60, primAfstand: 40, secM3h: 90, secUur: 4, secAfstand: 200, openOpstel: 2, zuighoogte: 8, minDiepte: 0.5,   // G voorbeeld regionaal modelbeleid (VR Limburg-Noord 2017, op basis van Handreiking Brandweer NL 2012) [162]; IJsselland te verifiëren
                 zwemVolM3: 260, tuinVolM3: 500 },          // S zwemvijver 150 m²: ± 75 m² × 3 m + 75 m² × 0,5 m; tuinvijver 500 m² × 1 m (lager in droge zomers)
    kritiekKW: 8                                          // S kritieke last bij storing: koelcellen, koelkasten/vriezers, verlichting, netwerk, pompen (± 8 kW gemiddeld)
  },
  eigendom: {
    objecten: [
      ["Zonnepanelen en omvormers op de woningdaken", "alle bewoners samen", "gezamenlijk; recht van opstal op het dak van de woning (besluit 04-11-2026 [171])"],
      ["Zonnepanelen buurthuis, schuren, carport, akker", "alle bewoners samen", "mandelig (BW 5:60)"],
      ["Erfmolens", "alle bewoners samen", "mandelig"],
      ["Buurtaccu (3 × 200 kWh) en omvormers", "alle bewoners samen", "mandelig"],
      ["Dorpsnet: kabels, verdeelkasten, meters", "alle bewoners samen", "mandelig"],
      ["Laadpalen op het laadplein (iedere woning een vaste plek met paal)", "alle bewoners samen", "mandelig; vaste plek en paal in gebruik per woning (besluit 04-11-2026)"],
      ["Buurthuis, schuren, carport", "alle bewoners samen", "mandelig"],
      ["Koel- en vriescellen, gedeelde keuken", "alle bewoners samen", "mandelig"],
      ["Put, pomp en beregening akker", "alle bewoners samen", "mandelig"],
      ["Glasvezel, servers, netwerk", "alle bewoners samen", "mandelig"]
    ]
  },
  /* ---------- Drinkwater: inkoop, aansluiting en debiet (opgave 27-10-2026 23:46 [126]) ---------- */
  drinkwater: {
    mmvWoning: { laag: 0.30, hoog: 0.44 },                     // G maximaal momentaan verbruik koud per woning (l/s), standaard – standaard-plus (KWR 06.104, tabel 7) [125]
    mmvDorp: { laag: [0.36, 0.030], hoog: [0.70, 0.090] },     // A collectieve leiding < 15 woningen: MMV = a + b·n (l/s); laagste en hoogste woningcategorie (KWR 06.104; toewijzing formule te verifiëren in origineel) [125]
    tappunt: { douche: 0.12, keuken: 0.167, wastafel: 0.083, toilet: 0.042, wasmachine: 0.167 },   // G l/s bij 10 °C (ISSO 30 via KWR 06.104) [125]
    buurthuisM3Dag: 0.3,                                       // S buurthuis: gedeelde keuken, wasserette, toiletten (± 300 L/d gemiddeld)
    vMax: 1.5,                                                 // N maximale stroomsnelheid in de dorpsleiding (m/s), gangbare ontwerpwaarde
    leidingL: 200                                              // S lengte dorpsleiding buurthuis → verste woning (m), langs de rondweg
  },
  /* ---------- Dossier: haalbaarheid (projectontwikkelaar) en vergunning (bevoegd gezag) – structuur 27-10-2026 23:23 [122] ----------
     status: open | deels | beantwoord | getoetst ; fase: poort waarvoor het antwoord compleet moet zijn ; waar: pagina waar het antwoord staat */
  dossier: {
    statussen: [["open", "open"], ["deels", "deels"], ["beantwoord", "beantwoord, met bron"], ["getoetst", "getoetst door derde"]],
    fasen: [
      [0, "Initiatief", "Vooroverleg met de gemeente: is het plan kansrijk?"],
      [1, "Haalbaarheid", "Locatie, begroting en financiering rond; CPO-groep compleet"],
      [2, "Omgevingsplan", "Aanvraag omgevingsplanactiviteit (bestemming wonen) met onderzoeken"],
      [3, "Bouw", "Bouwactiviteit, kwaliteitsborger, aanbesteding, start bouw"]
    ],
    hoofdstukken: [
      ["H1", "O", "Locatie en locatiekeuze"], ["H2", "O", "Programma en ontwerp"], ["H3", "O", "Investering per woning"],
      ["H4", "O", "Maandlasten en beheer"], ["H5", "O", "Financiering"], ["H6", "O", "Organisatie en eigendom"],
      ["H7", "O", "Planning en fasering"], ["H8", "O", "Risico's en beslismomenten"],
      ["V1", "A", "Samenvatting en tekeningen"], ["V2", "A", "Ruimtelijke onderbouwing"], ["V3", "A", "Omgevingsonderzoeken"],
      ["V4", "A", "Bouwtechniek en kwaliteitsborging"], ["V5", "A", "Nutsvoorzieningen en veiligheid"], ["V6", "A", "Participatie"],
      ["V7", "A", "Aanvraag en procedure"]
    ],
    // [id, hoofdstuk, vraag, fase, status, waar beantwoord, eigenaar, afhankelijk van]
    items: [
      ["H1.1", "H1", "In welke gemeente en provincie zoeken we, met welke criteria (grootte, prijs, bereikbaarheid, natuur, net, water)?", 0, "deels", "https://github.com/vollebergh/hanzedorp", "Nick + Melvin", ""],
      ["H1.2", "H1", "Welke kandidaatlocaties zijn er, en hoe scoren ze op de criteria?", 1, "open", "", "Nick + Melvin", ""],
      ["H1.4", "H1", "Welke route kiezen we: bestaand (voormalig) agrarisch erf met sloop en kwaliteitsimpuls, aansluiting op een kern/dorpsrand, of gemeentegrond via CPO-uitgifte? (een los cluster op onbebouwde landbouwgrond is in vrijwel alle onderzochte gemeenten kansarm)", 0, "deels", "https://github.com/vollebergh/hanzedorp", "Nick", ""],
      ["H1.3", "H1", "Is de grond beschikbaar en tegen welke prijs (optie, koopovereenkomst onder voorwaarden)?", 1, "open", "", "Melvin", "locatie"],
      ["H2.1", "H2", "Welke woningtypen, hoeveel en welke kavels?", 0, "beantwoord", "bewoners.html", "Melvin", ""],
      ["H2.2", "H2", "Welke gedeelde voorzieningen horen bij de kern (bij oplevering) en welke bij de schil (later)?", 0, "open", "", "Melvin", ""],
      ["H2.3", "H2", "Programma van eisen voor de architect (woning, buurthuis, terrein)", 1, "open", "", "Melvin + architect", ""],
      ["H2.5", "H2", "Hergebruik van bestaande erfbebouwing (stal → buurthuis, schuren, werkplaats, koelcellen) als de locatie een erf is", 1, "open", "", "Douwe + Melvin", "locatie"],
      ["H2.6", "H2", "Bouwsysteem: CLT, houtskelet of (prefab) strobouw – kosten, MPG, brand, vocht, eigen inzet", 1, "open", "", "Douwe", ""],
      ["H2.4", "H2", "Schetsplattegrond van het terrein met maten (rondweg, kavels, carport, accu, akker, vijvers)", 0, "open", "", "Melvin + architect", "locatie"],
      ["H3.1", "H3", "Grond en bouwrijp maken", 1, "deels", "grond.html", "Claude", "locatie"],
      ["H3.2", "H3", "Bouwkosten per woningtype (passiefhuis, CLT, biobased)", 1, "open", "", "Douwe + architect", ""],
      ["H3.6", "H3", "Installatiebegroting per woning (warmtepomp, ventilatie, elektra, water, PV) en voor het dorp (dorpsnet, accu, laadplein, drinkwaterleiding)", 1, "open", "", "Douwe", ""],
      ["H3.7", "H3", "Eigen inzet (zelfbouwuren) en collectieve inkoop: wat leveren ze op, en welke risico's (garantie, Wkb, verzekering)?", 1, "open", "", "Douwe", ""],
      ["H3.3", "H3", "Gedeelde voorzieningen: accu, PV, carport, buurthuis, schuren, vijvers, cellen, put, wegen, netwerk", 1, "deels", "energie.html", "Claude", ""],
      ["H3.4", "H3", "Bijkomende kosten: architect, adviseurs, constructeur, kwaliteitsborger, leges, notaris, rente, onvoorzien", 1, "open", "", "Douwe + Claude", ""],
      ["H3.5", "H3", "Totale investering en koopsom per woningtype", 1, "open", "", "Claude", "H3.1–H3.4"],
      ["H4.1", "H4", "Jaarlijkse kosten gedeelde voorzieningen: onderhoud, vervanging (MJOP), verzekering, beheer", 1, "open", "", "Claude", ""],
      ["H4.2", "H4", "Opbrengsten en besparingen: stroom, water, internet, eten", 1, "deels", "netaansluiting.html", "Claude", ""],
      ["H4.3", "H4", "Maandlasten per woningtype (hypotheek + bijdrage vereniging + energie)", 1, "open", "", "Claude", "H3.5, H4.1"],
      ["H5.1", "H5", "Wie financiert de voorbereiding tot de vergunning, en wat als het niet doorgaat?", 0, "open", "", "initiatiefnemers", ""],
      ["H5.2", "H5", "Hypotheek op een woning met mandelig eigendom en eigen dorpsnet: wat zeggen bank en taxateur?", 1, "open", "", "extern: bank", ""],
      ["H5.3", "H5", "Bouwkrediet voor de CPO-vereniging, subsidies en regelingen", 1, "open", "", "extern", ""],
      ["H6.1", "H6", "Rechtsvorm CPO-groep en beheerder; KvK", 0, "open", "eigendom.html", "Nick + notaris", ""],
      ["H6.5", "H6", "Intentieovereenkomst tussen deelnemers: inleg voorbereidingskosten, uittreden, besluitvorming; selectie van bewoners zonder strijd met gelijke-behandelingswetgeving", 0, "open", "", "Nick", ""],
      ["H6.2", "H6", "Eigendom gedeelde voorzieningen (mandelig) en energiebelasting", 1, "deels", "eigendom.html", "notaris + fiscalist", ""],
      ["H6.3", "H6", "Besluitvorming, toetreden, uittreden, doorverkoop en ballotage (kettingbeding, zelfbewoningsplicht)", 1, "open", "", "Nick + CPO-groep", ""],
      ["H6.4", "H6", "Werving van bewoners: hoeveel deelnemers zijn er nu, wie ontbreekt nog?", 1, "open", "", "Melvin", ""],
      ["H7.1", "H7", "Planning met kritisch pad van initiatief tot oplevering (± 2030)", 0, "open", "", "Claude", ""],
      ["H7.2", "H7", "Fasering: wat bouwen we eerst, wat later (kern/schil, akker groeit mee)", 1, "open", "", "Melvin", "H2.2"],
      ["H8.1", "H8", "Top 10 projectrisico's met maatregel en eigenaar", 0, "deels", "rapport.html", "Claude", ""],
      ["H8.2", "H8", "Beslismomenten (go/no-go) per fase met criteria", 0, "open", "", "initiatiefnemers", ""],
      ["V1.1", "V1", "Samenvatting van het plan op één A4", 0, "open", "", "Claude", ""],
      ["V1.2", "V1", "Situatietekening, doorsneden en beelden", 2, "open", "", "architect", "locatie"],
      ["V2.1", "V2", "Ladder voor duurzame verstedelijking (Bkl art. 5.129g): behoefte en locatie buiten stedelijk gebied", 2, "open", "", "Nick", "locatie"],
      ["V2.5", "V2", "11 of 12 woningen? Vanaf 12 woningen in principe ladderplichtig; gemeenten als Oldebroek rekenen tot en met 11 als kleinschalig", 0, "open", "", "Nick + Melvin", ""],
      ["V2.6", "V2", "Energieparagraaf voor de provincie (Overijssel art. 4.125: effect op het energiesysteem en netcongestie)", 2, "deels", "netaansluiting-technisch.html", "Melvin", ""],
      ["V2.2", "V2", "Past het plan in het beleid van gemeente (woonvisie, omgevingsvisie) en provincie (omgevingsverordening, kwaliteitsimpuls buitengebied)?", 0, "deels", "https://github.com/vollebergh/hanzedorp", "Nick", "locatie"],
      ["V2.3", "V2", "Evenwichtige toedeling van functies: wat levert het plan op voor landschap, natuur, water en de buurt?", 2, "deels", "natuur.html", "Claude", ""],
      ["V2.4", "V2", "Betaalbaarheid en doelgroepen (starters, senioren) tegenover de woningbouwopgave van de gemeente", 0, "open", "", "Melvin + gemeente", ""],
      ["V3.1", "V3", "Bodem (NEN 5740) en grondwater", 2, "open", "", "extern: adviesbureau", "locatie"],
      ["V3.2", "V3", "Archeologie", 2, "open", "", "extern", "locatie"],
      ["V3.3", "V3", "Flora en fauna (quickscan, zo nodig vervolg)", 2, "open", "natuur.html", "extern: ecoloog", "locatie"],
      ["V3.4", "V3", "Stikstof bouw- en gebruiksfase (AERIUS)", 2, "open", "", "extern", "locatie"],
      ["V3.5", "V3", "Geluid, geur en milieuzonering omliggende bedrijven", 2, "open", "", "extern", "locatie"],
      ["V3.6", "V3", "Externe veiligheid: buurtaccu (PGS 37-1), afstanden", 2, "deels", "veiligheid-technisch.html", "Claude + Veiligheidsregio", ""],
      ["V3.7", "V3", "Watertoets en waterparagraaf (berging, infiltratie, put)", 2, "deels", "hemelwater-technisch.html", "Claude + waterschap", "locatie"],
      ["V3.8", "V3", "Verkeer, ontsluiting en parkeren", 2, "deels", "mobiliteit.html", "Claude", "locatie"],
      ["V3.9", "V3", "Erfmolens: geluid, slagschaduw, landschap", 2, "deels", "energie-technisch.html", "Claude", "locatie"],
      ["V4.1", "V4", "BENG en TOjuli per woning", 3, "open", "", "extern: adviseur", ""],
      ["V4.2", "V4", "MPG-score (biobased, CLT)", 3, "open", "", "extern", ""],
      ["V4.3", "V4", "Brandveiligheid CLT, constructie, thuislift", 3, "open", "", "constructeur", ""],
      ["V4.4", "V4", "Kwaliteitsborger (Wkb) gekozen; borgingsplan", 3, "open", "", "Douwe", ""],
      ["V4.5", "V4", "Eigen laagspanningsnet: ontwerp, beveiliging, aarding, selectiviteit, keuring (NEN 1010, NEN 3140) en wie is installatieverantwoordelijke", 3, "open", "", "Douwe + erkend installateur", ""],
      ["V5.1", "V5", "Netbeheerder: één aansluiting 3 × 25 A achter een eigen dorpsnet", 1, "deels", "netaansluiting.html", "extern: netbeheerder", "locatie"],
      ["V5.2", "V5", "Waterbedrijf: één drinkwateraansluiting met watermeters per woning", 1, "deels", "water-technisch.html", "extern: waterbedrijf", "locatie"],
      ["V5.3", "V5", "Gemeente: aansluiting op het riool", 1, "open", "", "extern: gemeente", "locatie"],
      ["V5.4", "V5", "Veiligheidsregio: rondweg, bluswater, accu, laadplein", 2, "deels", "veiligheid.html", "extern: Veiligheidsregio", "locatie"],
      ["V6.1", "V6", "Participatieplan: wie betrekken we (buren, dorp, belangenclubs) en hoe? (sommige gemeenten verplichten participatie bij elke afwijking van het omgevingsplan)", 0, "open", "", "Nick", "locatie"],
      ["V6.2", "V6", "Verslag van de participatie en wat we ermee doen", 2, "open", "", "Melvin", "V6.1"],
      ["V7.1", "V7", "Welke vergunningen en meldingen zijn nodig (omgevingsplanactiviteit, bouw, accu, lozing, put, uitrit, kap)?", 0, "open", "", "Nick + Claude", ""],
      ["V7.4", "V7", "Wat publiceren we op de website en wat bespreken we alleen in vooroverleg (fiscale en juridische analyses)?", 0, "open", "", "Nick", ""],
      ["V7.2", "V7", "Verslag vooroverleg met gemeente", 0, "open", "", "Nick", "V1.1"],
      ["V7.3", "V7", "Volledigheid aanvraag: indieningsvereisten Omgevingsloket", 2, "open", "", "Claude", ""]
    ]
  },
  bronnen: {
    1: { titel: "Meetdata waterverbruik referentiewoning Zwolle, 24-10-2025 t/m 23-10-2026, 15-minutendata (cumulatieve meterstand in dl)", auteur: "Melvin de Vries", soort: "eigen meetdata" },
    2: { titel: "Meetdata stroomverbruik vaatwasser, wasmachine en wasdroger referentiewoning, 24-10-2025 t/m 23-10-2026, 15-minutendata", auteur: "Melvin de Vries", soort: "eigen meetdata" },
    3: { titel: "Maandverbruik warmtepomp referentiewoning (Daikin 8 kW), 2025–2026, schermafbeeldingen Daikin-app", auteur: "Melvin de Vries", soort: "eigen meetdata" },
    4: { titel: "Opgave spoelvolumes en spoelfrequentie toiletten (2× Rapowash) referentiewoning, 23-10-2026", auteur: "Melvin de Vries", soort: "eigen opgave" },
    5: { titel: "Klimaatnormalen 1991–2020, station Heino, neerslag per maand", auteur: "KNMI", soort: "externe data", url: "https://en.wikipedia.org/wiki/Heino,_Netherlands", noot: "overgenomen via klimaattabel Wikipedia; te verifiëren in KNMI Data Platform" },
    6: { titel: "Weerstatistieken Heino, neerslagsom 2018 t/m 22 oktober", auteur: "weerstatistieken.nl (op basis van KNMI-data)", soort: "externe data", url: "https://weerstatistieken.nl/heino" },
    7: { titel: "Watergebruik Thuis (WGT) 2021, hoofdstuk 4 Totaal watergebruik", auteur: "J. Bakker, F. van der Mooren, H.J. Boonstra – CBS, in opdracht van Vewin", soort: "externe publicatie", url: "https://www.cbs.nl/nl-nl/longread/aanvullende-statistische-diensten/2022/watergebruik-thuis--wgt---2021/4-totaal-watergebruik" },
    8: { titel: "Praktijkboek Passiefhuis, §2 Passiefhuisconcept en §5.3 Tapwater- en ruimteverwarming", auteur: "SBRCURnet / Stichting PassiefBouwen.nl (C. Boonstra, R. Geerligs, A. Laane, H. Valk)", soort: "vakliteratuur" },
    9: { titel: "Projectprompt Hanzedorp themapagina's V3 – woningprogramma (destijds max. 15 woningen, 9/3/3; sinds 27-10-2026: 12 woningen), dakoppervlak, daktype, alleen opvang harde dakdelen, ± 100 m² verharding per woning, drinkwaterprijs", auteur: "Melvin de Vries", soort: "eigen document" },
    10: { titel: "Hanzedorp – Natuurinclusief, klimaatadaptief en energiepositief wonen (website)", auteur: "Hanzedorp", soort: "website", url: "https://hanzedorp.nl" },
    11: { titel: "Dagwaarden van weerstations, station 278 Heino, etmaalsom neerslag (RH, 0,1 mm), 1992-01-01 t/m 2026-10-21, opgehaald 23-10-2026", auteur: "KNMI", soort: "externe data", url: "https://daggegevens.knmi.nl/klimatologie/daggegevens", noot: "door KNMI aangemerkt als niet-gehomogeniseerde reeks; geschikt voor waterbalans, niet voor trendanalyse" },
    12: { titel: "KNMI-daggegevens station 278 Heino, alle variabelen, 24-10-2025 t/m 21-10-2026 (bestand weerresult2.txt)", auteur: "KNMI; opgehaald en aangeleverd door Melvin de Vries", soort: "externe data" },
    13: { titel: "Individual NWRM – Green roofs (U1), o.a. Stovin et al.: circa 50 % cumulatieve jaarlijkse neerslagretentie", auteur: "NWRM-project (OIEau e.a.) voor DG Environment, Europese Commissie", soort: "externe publicatie", url: "https://www.nwrm.eu/sites/default/files/nwrm_ressources/u1_-_green_roofs.pdf" },
    15: { titel: "Actualisatie richtlijn 'bergingsopgave nieuwe ontwikkelingen' (24-10-2025): 92 mm per m² toename verhard oppervlak, toetsbui 109 mm in 24 uur", auteur: "Waterschap Drents Overijsselse Delta", soort: "beleid", url: "https://www.wdodelta.nl/actualisatie-richtlijn-bergingsopgave-nieuwe-ontwikkelingen" },
    16: { titel: "Hoe gaan waterschappen om met waterberging op groene daken? (H2O, 23-11-2016)", auteur: "T. Koorn", soort: "vakartikel", url: "https://www.h2owaternetwerk.nl/vakartikelen/hoe-gaan-waterschappen-om-met-waterberging-op-groene-daken" },
    17: { titel: "Prijsindicaties regenwatersystemen 5.000 L (ondergrondse tank, regenwaterzak), prijsonderzoek 23-10-2026", auteur: "Melvin de Vries", soort: "eigen opgave, niet geverifieerd" },
    18: { titel: "Besluiten waterstromen en zwemvijver (23-10-2026): groendakwater en straatwater (via straatkolken en ondergrondse berging) via voorzuivering naar één natuurlijke zwemvijver; peildaling zomer max. 0,5 m boven minimale zwemdiepte; tuinirrigatie uit de vijver via IBC-containers; privétuin ± 200 m² per woning", auteur: "Melvin de Vries", soort: "eigen opgave" },
    19: { titel: "Dagwaarden van weerstations, station 278 Heino, referentiegewasverdamping volgens Makkink (EV24, 0,1 mm) en neerslag (RH), 1993-01-01 t/m 2026-10-21, opgehaald 23-10-2026", auteur: "KNMI", soort: "externe data", url: "https://daggegevens.knmi.nl/klimatologie/daggegevens" },
    20: { titel: "Crop evapotranspiration – Guidelines for computing crop water requirements (FAO Irrigation and Drainage Paper 56), hoofdstuk 8, tabel 22 (p voor gras 0,40–0,50) en vgl. 82 (TAW, lemig zand ± 90 mm/m)", auteur: "R.G. Allen, L.S. Pereira, D. Raes, M. Smith – FAO, 1998", soort: "vakliteratuur", url: "https://www.fao.org/4/X0490e/x0490e0e.htm" },
    21: { titel: "Verdamping in Nederland (achtergrond: Makkink-referentiegewasverdamping, gewasfactoren, verdamping van vijvers)", auteur: "KNMI", soort: "website", url: "https://www.knmi.nl/kennis-en-datacentrum/achtergrond/verdamping-in-nederland", noot: "geeft geen openwaterfactor; factor 1,25 is een aanname die nog met literatuur (bv. gewasfactoren Feddes 1987) moet worden onderbouwd" },
    22: { titel: "Organic Pools DIY Manual (Full Version): o.a. The Structure of an Organic Pool (zwem- en regeneratiezone, plantenzone ≥ 50 %, minimaal 120 m²), Organic Pools save water (2,3 m diep voor 2,0 m zwemdiepte), Phosphorous in the pool (geen afstromend water, regen- en dakwater)", auteur: "David Pagan Butler – OrganicPools.co.uk, 2013", soort: "vakliteratuur (praktijkhandboek)", noot: "aangeleverd door Melvin de Vries" },
    23: { titel: "Besluit activiteiten leefomgeving (Bal), afdeling 15.2, paragraaf 15.2.2 Zwemvijvers, art. 15.30 Toepassingsbereik (kwaliteitseisen o.a. helofytenfilter, regelmatige waterkwaliteitscontrole)", auteur: "Informatiepunt Leefomgeving (IPLO), Rijksoverheid", soort: "regelgeving (toelichting)", url: "https://iplo.nl/regelgeving/regels-voor-activiteiten/gelegenheid-bieden-zwemmen-baden/rijksregels/afdeling-15-2-bal-inhoudelijke-regels/zwemvijvers/artikel-15-30-toepassingsbereik/" },
    24: { titel: "Besluit activiteiten leefomgeving (Bal), art. 15.1 lid 2 Uitzonderingen (o.a. zwemmen bij een huishouden valt buiten 'gelegenheid bieden tot zwemmen of baden')", auteur: "Informatiepunt Leefomgeving (IPLO), Rijksoverheid", soort: "regelgeving (toelichting)", url: "https://iplo.nl/regelgeving/regels-voor-activiteiten/gelegenheid-bieden-zwemmen-baden/rijksregels/afdeling-15-1-bal-algemene-regels/artikel-15-1-2-uitzonderingen/", noot: "gedeeld gebruik door meerdere huishoudens wordt niet expliciet behandeld; juridisch na te gaan" },
    25: { titel: "Ter visie: milieuhygiënisch functioneren van infiltratievoorzieningen (o.a. database kwaliteit afstromend hemelwater, 1.742 monsters, 191 locaties, 1986–2020; categorie-indeling; ophoping zware metalen in wadibodems; autowassen als aandachtspunt)", auteur: "M. Langevoort, R. Wentink – Stichting RIONED en STOWA, 2025", soort: "onderzoeksrapport (concept ter visie)", url: "https://www.riool.net/media/cnlnu2dh/ter-visie-milieuhygienisch-functioneren-infiltratievoorzieningen.pdf" },
    26: { titel: "National Pollutant Removal Performance Database for Stormwater Treatment Practices, 2nd edition, tabel 1 (mediane verwijdering stormwater wetlands: TSS 76 %, totaal-P 49 %, opgelost P 35 %, Cu 40 %, Zn 44 %)", auteur: "Center for Watershed Protection", soort: "database / onderzoeksrapport", url: "https://www.stormwatercenter.net/Library/STP%20Database%20Article.pdf" },
    27: { titel: "Heavy Metal Contamination of Vegetables Irrigated by Urban Stormwater: A Matter of Time? PLoS ONE 9(11): e112441", auteur: "M. Tom, T.D. Fletcher, D.T. McCarthy, 2014", soort: "peer-reviewed artikel", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4245087" },
    28: { titel: "Mag je je auto op straat wassen? (gemeentelijk geregeld in de APV; bij gescheiden stelsel komt het sop ongezuiverd in grond- of oppervlaktewater)", auteur: "ANWB", soort: "website", url: "https://www.anwb.nl/auto/onderhoud-en-reparatie/wassen/mag-je-je-auto-op-straat-wassen" },
    29: { titel: "Opgave aanwezigheid huishouden in het meetjaar (volwassene 1: 4 dagen thuiswerk, volwassene 2: 2 dagen thuis, kinderen 5 dagen school, weekenden meestal thuis), verwachte levensfase bewoners per woningtype en urinoir 0,5 L per spoeling (24-10-2026)", auteur: "Melvin de Vries", soort: "eigen opgave" },
    30: { titel: "Dagwaarden van weerstations, station 278 Heino, globale straling (Q, J/cm²), 1994-01-01 t/m 2025-12-31, opgehaald 26-10-2026", auteur: "KNMI", soort: "externe data", url: "https://daggegevens.knmi.nl/klimatologie/daggegevens" },
    31: { titel: "Opgave akker en irrigatie (26-10-2026): grondwaterput max. 50 m diep, max. 10 m³/uur, pomp ± 3 kW; akker max. 5.000 m² (start kleiner) in delen irrigeren met één pomp en driewegkleppen; sturing op bodemsensoren en meteo/AI; pomp op zonne-overschot met buurtaccu; open bassin als buffer; nutsgebouwtje met bemesting; agri-PV: rijen ± 30 m lang, om de ± 10 m, 7 rijen, verticaal bifaciaal noord–zuid (oost–west gericht), ≥ 2 m hoog, landscape; 40 weken oogst, 12 weken niets; voorraad door wecken, drogen, pekelen, invriezen, inblikken", auteur: "Melvin de Vries", soort: "eigen opgave" },
    32: { titel: "DAB JET 200/300 M – technische gegevens (JET 300 M: P1 2,7 kW; P2 2,2 kW; 230 V; 12 A)", auteur: "DAB Pumps (datasheet via Lenntech)", soort: "fabrikantgegevens", url: "https://www.lenntech.com/Data-sheets/DAB-JET-JETINOX-JETCOM-ITA-L.pdf" },
    33: { titel: "Filtration, Treatment, and Maintenance Considerations for Micro-Irrigation Systems, tabel 1 (verstoppingsrisico: Fe en Mn < 0,1 licht, 0,1–1,5 matig, > 1,5 mg/l ernstig); filters 200 mesh voor grondwater", auteur: "J. Shortridge, B. Benham – Virginia Cooperative Extension, publ. 442-757, 2018", soort: "vakpublicatie", url: "https://www.pubs.ext.vt.edu/content/dam/pubs_ext_vt_edu/442/442-757/BSE-222.pdf" },
    34: { titel: "Factsheet Groente (02/2024): advies 250 g groente en 200 g fruit per dag voor volwassenen; werkelijke inname 165 g groente (VCP 2019–2021)", auteur: "Voedingscentrum (S.E. van der Krieken e.a.)", soort: "factsheet", url: "https://www.voedingscentrum.nl/Assets/Uploads/voedingscentrum/Documents/Professionals/Pers/Factsheets/Factsheet%20Groente1.pdf" },
    35: { titel: "Groenteteelt; oogst en teeltoppervlakte per groentesoort, 2025 (StatLine 37738)", auteur: "CBS", soort: "statistiek", url: "https://www.cbs.nl/nl-nl/cijfers/detail/37738" },
    36: { titel: "Solar fence – FAQ (oost–west verticaal ± 5 % meer dan verticaal zuid; achterzijde iets meer dan 90 % van voorzijde; twee pieken ochtend en avond)", auteur: "Next2Sun GmbH", soort: "fabrikantinformatie", url: "https://next2sun.com/en/solar-fence/solar-fence-faqs/" },
    37: { titel: "Verordening voor de fysieke leefomgeving Overijssel, art. 4.5 (vrijstelling ≤ 10 m³/uur en ≤ 5.000 m³/kwartaal; vergunning bij onttrekking dieper dan 50 m in aangewezen gebied) – versie 2007, actualiteit onder Omgevingswet te controleren", auteur: "Provincie Overijssel", soort: "regelgeving", url: "https://www.inview.nl/openCitation/id6d1f8dc61cfd87f7d41feaaf795d06ef/verordening-voor-de-fysieke-leefomgeving-overijssel-artikel-4-5" },
    38: { titel: "Agrarische nieuwsbrief: grondwateronttrekkingen 10–60 m³/uur melden, > 60 m³/uur vergunning; in bepaalde natuurgebieden max. 10 m³/uur; bestaande putten registreren", auteur: "Waterschap Drents Overijsselse Delta", soort: "nieuwsbrief (z.j.)", url: "https://www.wdodelta.nl/_flysystem/media/agrarische-nieuwsbrief-toegankelijke-versie.pdf" },
    39: { titel: "Natural swimming ponds – FLL-richtwaarden vulwater (P-totaal ≤ 0,03 mg/l; Fe ≤ 0,2; Mn ≤ 0,05; NO3 ≤ 50; NH4 ≤ 0,5) uit FLL-Richtlinien Schwimm- und Badeteiche 2017", auteur: "Lovibond / FLL", soort: "vakinformatie", url: "https://lovibond.com/water-testing/support-service/knowledge-base/pool/natural-swimming-ponds" },
    40: { titel: "Beregening met ijzerhoudend grondwater (LMM e-nieuws, september 2024): ijzeroxidatie legt opgelost fosfaat vast", auteur: "B. van der Grift (KWR) – RIVM", soort: "nieuwsbrief onderzoek", url: "https://www.rivm.nl/landelijk-meetnet-effecten-mestbeleid/nieuwsbrieven/beregening-met-ijzerhoudend-grondwater" },
    41: { titel: "Estimation of the diffuse radiation fraction for hourly, daily and monthly-average global radiation. Solar Energy 28(4): 293–302 (daggemiddelde diffuse fractie)", auteur: "D.G. Erbs, S.A. Klein, J.A. Duffie, 1982", soort: "peer-reviewed artikel" },
    42: { titel: "Uurwaarden van weerstations, station 278 Heino: windsnelheid (FH, 10 m), globale straling (Q) en temperatuur (T), 1994–2025, opgehaald 26-10-2026", auteur: "KNMI", soort: "externe data", url: "https://daggegevens.knmi.nl/klimatologie/uurgegevens" },
    43: { titel: "Kleine windmolen – EAZ-erfmolen: 15 kW, ashoogte 15 m, rotordiameter 13,2 m, tiphoogte 21,6 m, 25.000–45.000 kWh/jaar, slagschaduwafstand 12 × D", auteur: "Ecoways", soort: "fabrikantgegevens", url: "https://ecoways.com/nl/kleine-windmolen" },
    44: { titel: "EAZ Wind EAZ-Twelve – technische gegevens (15 kW, inschakelsnelheid 2,5 m/s, nominaal 8,5 m/s, uitschakel 20 m/s; rotor 12 m)", auteur: "wind-turbine-models.com", soort: "database", url: "https://en.wind-turbine-models.com/turbines/2044-eaz-wind-eaz-twelve" },
    45: { titel: "Gemiddeld stroom- en gasverbruik 2025 per huishoudgrootte (1 pers. 1.640 · 2 pers. 2.550 · 3 pers. 3.080 · 4 pers. 3.600 kWh/jr)", auteur: "ANWB, op basis van Nibud en CBS", soort: "website", url: "https://www.anwb.nl/energie/energieverbruik" },
    46: { titel: "Walk-in cooler and freezer FAQs (energieverbruik per celgrootte, 16 resp. 18 bedrijfsuren per dag)", auteur: "Foodservice Equipment & Supplies (FES), gesponsorde bijdrage", soort: "vakblad (VS)", url: "https://fesmag.com/sponsored/21824-walk-in-cooler-and-freezer-faqs" },
    47: { titel: "zappi v2.1 Datasheet rev. 2.1.4 (7 kW 1-fase / 22 kW 3-fase; modi Fast, Eco, Eco+; dynamische load balancing; meetnauwkeurigheid klasse B EN 50470)", auteur: "myenergi, juni 2022", soort: "fabrikantgegevens", url: "https://myenergi.com/wp-content/uploads/2022/07/zappi-v2.1-Datasheet-Rev-2.1.4-June-2022-ENGLISH.pdf" },
    48: { titel: "ZAPPI-2H22TB 3-fasen type 2 met 6,5 meter kabel", auteur: "myenergi (webshop)", soort: "productpagina", url: "https://shop.zappi.info/nl/zappi-2h22tb-3-fasen-type-2-met-650-meter-kabel.html" },
    49: { titel: "Wie betaalt de stroom van een zakelijke laadpaal thuis? (integrale kosten per kWh, registratie kWh per auto, standpunt Kennisgroep 2026)", auteur: "DeZaak.nl, 05-10-2026 (bijgewerkt 23-10-2026)", soort: "artikel", url: "https://www.dezaak.nl/vaste-lasten/tanken/wie-betaalt-de-stroom-van-een-zakelijke-laadpaal-thuis/" },
    50: { titel: "Opgave bewoners, comfort, energie en mobiliteit (26-10-2026): passiefhuizen; comfort geschikt voor bewoners van 70+; grote koelkast en vriezer per huishouden en/of koel-/vriescel in het buurthuis (beide doorrekenen); buurtaccu, deelauto's/laadplein, gedeelde keuken, wasserette met grote machine voor dekbedden; erfmolen type Ecoways (mogelijk twee); iedereen elektrische auto/motor/fiets, thuis laden; 5 Zappi's 22 kW met load balancing; vaste parkeerplaatsen met laadpaal op naam als de Belastingdienst dat eist; water rond woningen naar infiltratiekratten, gezamenlijk groen naar wadi's", auteur: "Melvin de Vries", soort: "eigen opgave" },
    51: { titel: "WHO Housing and health guidelines (2018), hoofdstuk 4: binnentemperatuur in het koude seizoen (≥ 18 °C; hoger voor ouderen en kwetsbare groepen)", auteur: "World Health Organization", soort: "richtlijn", url: "https://www.who.int/publications/i/item/9789241550376" },
    57: { titel: "Produce Storage Guide (aanbevolen bewaartemperatuur en ademhalingsklasse per product; o.a. late aardappel 4–10 °C, winterpompoen 10–13 °C, ui droog 0 °C, peen/kool/biet/pastinaak 0 °C, appel 0–4 °C; appel produceert ethyleen)", auteur: "Canadian Produce Marketing Association (CPMA), op basis van UC Davis (2001) en USDA Agriculture Handbook 66", soort: "branchegids", url: "https://cpma.ca/docs/default-source/education/2022/cpma_2022_storage-guide.pdf" },
    58: { titel: "New F-Gas Regulation (EU) 2024/573 (o.a. zelfstandige koelapparatuur vanaf 2025 met natuurlijk koudemiddel GWP < 150; koudemiddelen GWP > 750 verboden vanaf 2032)", auteur: "BINDER GmbH (samenvatting fabrikant, 20-05-2024)", soort: "brancheinformatie", url: "https://binder-world.com/us-en/company/news/detail/new-f-gas-regulation-eu-2024-573" },
    59: { titel: "Prijsarchief EPEX day-ahead stroomprijzen Nederland, uurprijzen 2023-01-01 t/m 2026-10-26 (kale beursprijs €/kWh; via publieke prijs-API EnergyZero; ook ENTSO-E Transparency, EU 543/2013)", auteur: "Salderingswijzer; aangeleverd door Melvin de Vries, 27-10-2026", soort: "dataset", url: "https://www.salderingswijzer.nl/prijsarchief" },
    60: { titel: "Jaarlijkse netwerkkosten stroom 2026 (kleinverbruik, capaciteitstarief incl. vastrecht en meterhuur) en Eenmalige tarieven stroom 2026 (aansluiten, verzwaren)", auteur: "Liander", soort: "tarievenblad", url: "https://www.liander.nl/-/media/files/tarieven/consument/2026/jaarlijkse-netwerkkosten-stroom-2026-v10.pdf" },
    61: { titel: "Energiebelasting 2026 (stroom € 0,09161/kWh excl. btw tot 10.000 kWh, € 0,06671 tot 50.000 kWh; belastingvermindering € 519,80 excl. / € 628,96 incl. btw per aansluiting met verblijfsfunctie)", auteur: "Energievergelijk.nl", soort: "website", url: "https://www.energievergelijk.nl/onderwerpen/energiebelasting" },
    62: { titel: "Presentatie netimpact (LS-net uitgelegd op ca. 1,1 kVA per woning; 400 kVA-trafo voor 300 woningen ≈ 1,3 kVA/woning)", auteur: "Sjef Cobben, Alliander (KIVI)", soort: "presentatie", url: "https://kivi.nl/_Resources/Persistent/4/a/7/5/4a75bb9c7e9df482f5f22616d60c3a1e8d3a84b8/Presentatie%20Sjef%20Cobben%20ALLIANDER.pdf" },
    63: { titel: "GGD-richtlijn medische milieukunde: EMV en gezondheid (ELF: voorzorg jaargemiddeld < 0,4 µT bij langdurig verblijf; RF: geen consistent bewijs van effecten onder ICNIRP/EU-limieten 1999/519/EG; elektrogevoeligheid: klachten serieus nemen, proportionele maatregelen)", auteur: "RIVM / GGD GHOR Nederland", soort: "richtlijn", url: "https://www.rivm.nl/ggd-richtlijn-medische-milieukunde-emv-en-gezondheid" },
    64: { titel: "Kennisplatform Elektromagnetische Velden en Gezondheid (informatie voor burgers en professionals)", auteur: "Kennisplatform EMV (RIVM, TNO, GGD, KIWA, Agentschap Telecom e.a.)", soort: "kennisplatform", url: "https://www.kennisplatform.nl/english/" },
    65: { titel: "Legionella voorkomen (warmwater ≥ 60 °C; wekelijks doorspoelen; zorgplicht eigenaar volgens NEN 1006 en Drinkwaterbesluit; risicoanalyse/beheersplan via BRL 6010 bij prioritaire locaties)", auteur: "Kiwa", soort: "kennisartikel", url: "https://www.kiwa.com/nl/nl/specials/legionella/legionellapreventie/legionella-voorkomen/" },
    66: { titel: "Moestuinonderzoek PFAS (Dordrecht 2018, Helmond 2019): worst-case dagelijkse consumptie uit eigen tuin; advies 'met mate' alleen binnen 1 km van de bron", auteur: "RIVM", soort: "onderzoeksoverzicht", url: "https://www.rivm.nl/pfas/moestuinonderzoek" },
    68: { titel: "Opgave bewoners, levensloop en huishoudelijk verbruik (27-10-2026): dynamisch rekenen met levensloop (verhuizingen, geboorte, relaties, overlijden) en naar een theoretisch maximum; levensloopbestendig bouwen (gelijkvloers, thuislift die niet onder de jaarlijkse keuringsplicht valt, of alle voorzieningen op de begane grond); warmtepomp gedimensioneerd voor een passiefhuis; per woning manshoge koelkast en manshoge vriezer (minimaal een week voorraad; vlees per dier geslacht, ± 400 kg per rund over alle vriezers); eigen wasmachine en geen droger in gezins- en seniorenwoningen, jongeren kunnen de was uitbesteden aan de centrale ruimte; drogen in de ruimte van de verwarming; tapwatervat gezin ± 300 L, senioren 150–200 L; thuiswerken ± 1,5 kWh per dag (scherm, laptop, dock); werkplaats voor 3–4 mensen in een schuur; gedeelde keuken in het buurthuis ook voor feesten; regenwater ook voor de wasmachine (zacht water)", auteur: "Melvin de Vries", soort: "eigen opgave" },
    69: { titel: "Certificatieschema liften en liftinstallaties (CSL-NL 2023): installaties volgens de Machinerichtlijn (nominale snelheid ≤ 0,15 m/s) – geen keuringsplicht door een NL-CBI voorgeschreven; inspectie vanuit zorgplicht", auteur: "Liftinstituut", soort: "certificatieschema", url: "https://www.liftinstituut.nl/wp-content/uploads/CSL-NL-2023.pdf" },
    70: { titel: "7 veelgestelde vragen over douche-wtw (warmteterugwinning) beantwoord – met cijfers van Milieu Centraal: tot 50 % minder energie voor douchen; met warmtepomp ± € 55–80 per jaar; douchepijp-wtw € 600–800, douchebak/-goot-wtw € 2.000–3.000; levensduur ± 30 jaar", auteur: "ID.nl (4-3-2024), met cijfers van Milieu Centraal", soort: "artikel", url: "https://id.nl/energie-en-klimaat/elektriciteit/energiezuinigheid/7-veelgestelde-vragen-over-douche-wtw-warmteterugwinning-beantwoord" },
    71: { titel: "Gedelegeerde Verordening (EU) nr. 812/2013, bijlage II: energie-efficiëntieklassen warmwatertanks op basis van stilstandsverlies S (klasse A: S < 8,5 + 4,25·V^0,4 W)", auteur: "Europese Commissie", soort: "regelgeving" },
    72: { titel: "Hoeveel vlees levert een rund? (slachtgewicht gemiddeld ± 350 kg met bot; verkoopbaar vlees ± 200–290 kg; indicatief, bronnen lopen uiteen)", auteur: "Webwoordenboek Kenniscentrum (secundaire bron)", soort: "artikel", url: "https://webwoordenboek.nl/kenniscentrum/hoeveel-hamburgers-maakt-een-koe" },
    73: { titel: "Passiefhuizen in Nederland, H10 Installaties verwarming en warm tapwater (max. warmtevraag ± 10 W/m², 'het vermogen van een strijkijzer'; installatiekeuze gedomineerd door warm tapwater; tabel 10: referentiewoning EPC 0,8 ruimteverwarming 5.558 kWh tegen passiefhuis 1.853 kWh, warm tapwater beide 3.000 kWh, 123,5 m²)", auteur: "SenterNovem / Stichting PassiefBouwen.nl (uitgever en jaar te verifiëren)", soort: "vakliteratuur" },
    74: { titel: "Opgave digitale infrastructuur (26–27-10-2026): buurthuis centraal; twee verbindingen naar buiten; glasvezel in ster naar iedere woning, eigen VLAN per woning; één merk met centraal beheer door een zzp'er; geen eigen abonnementen of apparatuur per woning ('netwerk zoals in een fabriek'); camera's zonder microfoon op hoofdingang, serverruimtes, accuruimte en carport, beelden alleen bij incident door twee personen tegelijk; twee servers waarop ook het EMS draait; UPS; ouderenalarmering, LoRaWAN, wifi en camera's op de akker; budget nu € 52,50 per huishouden per maand, doel −60 %", auteur: "Melvin de Vries", soort: "eigen opgave" },
    75: { titel: "Hanzedorp – stuklijst netwerk, bewaking, sensoren en ouderen (Hanzedorp-stuklijst-netwerk.xlsx, 27-10-2026; prijzen Ubiquiti Store Europe, Selectra/Starlink, ARP/Eaton, Domadoo/Milesight, Invibit/Dragino, Laurens prijslijst 2026)", auteur: "Melvin de Vries / Claude", soort: "eigen document" },
    76: { titel: "Registratieplicht aanbieders elektronische communicatienetwerken en -diensten (alleen voor openbare netwerken en diensten; wifi uitsluitend voor eigen hotelgasten is geen openbaar aanbod)", auteur: "Autoriteit Consument & Markt (ACM)", soort: "toezichthouder", url: "https://www.acm.nl/nl/telecom/registratie-als-telecomaanbieder" },
    77: { titel: "Starlink in Nederland: Residential Lite € 35/mnd, Residential € 50/mnd, kit € 233", auteur: "Selectra (27-10-2026)", soort: "prijsvergelijker", url: "https://selectra.nl/telecom/telecomaanbieder/starlink" },
    78: { titel: "Wetboek van Strafrecht art. 139a–139c (opnemen van gesprekken met een technisch hulpmiddel)", auteur: "Rijksoverheid (wetten.overheid.nl)", soort: "wet" },
    79: { titel: "Cameratoezicht door particulieren en organisaties: alleen eigen terrein, belangenafweging, informatieplicht, bewaartermijn in de regel maximaal 4 weken; DPIA bij systematisch toezicht", auteur: "Autoriteit Persoonsgegevens", soort: "toezichthouder", url: "https://www.autoriteitpersoonsgegevens.nl/themas/camera-s" },
    80: { titel: "Antwoorden open vragen (27-10-2026): theoretisch maximum – een gezin kan vier kinderen hebben, een jongere kan een kind krijgen; werkplaats met lasapparatuur, draaibank, zaagtafel, afzuiging, verwarming en mogelijk een autobrug; woningtypologie (gelijkvloers/lift/alles beneden) ligt nog niet vast", auteur: "Melvin de Vries", soort: "eigen opgave" },
    81: { titel: "Besluiten open vragen (27-10-2026 12:33): 12 woningen (gemeente: CPO; 20 woningen = commercieel project); regenwatertank per woning; urinoir ja; extra hard dakwater (carport) naar zwemvijver; tuinwater van schuur- of huisdak; laders met V2G (ISO 15118-20), load balancing en OCPP; camera-inzage door twee bestuursleden, vervanger beheerder; licentie Creative Commons pas bij livegang; AI-vermelding in colofon; dimensioneren op theoretisch maximum; handelen in stroom wordt minder interessant (meer spelers, kleinere prijsverschillen) → focus op eilandbedrijf en goedkoop opwekken en verbruiken; Hanzedorp = Douwe Kunst, Nick Vollebergh, Melvin de Vries", auteur: "Melvin de Vries", soort: "eigen opgave" },
    82: { titel: "Besluiten 27-10-2026 13:08: e-mail Hanzedorp info@hanzedorp.nl; zwemvijver krijgt ook dakwater van het buurthuis (naast de carport) en wordt ± 3 m diep (meer inhoud bij kleiner oppervlak, minder verdamping); vraag of 3×25A volstaat bij tekort; onderzoek energiebelasting interne levering; pagina Grond & kosten", auteur: "Melvin de Vries", soort: "eigen opgave" },
    83: { titel: "Gerechtshof Amsterdam 13-05-2025, ECLI:NL:GHAMS:2025:1419 (hoger beroep op Rechtbank Den Haag 04-07-2024, ECLI:NL:RBDHA:2024:10729): VvE recreatiepark met één aansluiting en eigen net levert zelf opgewekte zonnestroom aan 98 woningen; dat is levering waarover energiebelasting verschuldigd is; VvE is belastingplichtig als leverancier; geen recht op belastingvermindering", auteur: "Gerechtshof Amsterdam (samenvatting V-N Vandaag 2025/1164, TaxLive)", soort: "jurisprudentie", url: "https://www.taxlive.nl/nl/documenten/vn-vandaag/exploitant-levert-met-zonnepanelen-elektriciteit-aan-recreatiewoningen/" },
    84: { titel: "Wet belastingen op milieugrondslag, art. 50 (lid 1 levering via aansluiting; lid 3a levering anders dan via een aansluiting; lid 4 doorlevering; lid 5 verhuurder levert duurzame stroom van installatie op/aan het gebouw aan huurder van een woning – geen heffing; lid 6 vrijstelling verbruik zelf opgewekte duurzame elektriciteit)", auteur: "Rijksoverheid (via PONT Omgeving)", soort: "wet", url: "https://omgevingsweb.nl/wetgeving/wet-belastingen-op-milieugrondslag/hoofdstuk-vi-energiebelasting/afdeling-2-grondslag-en-belastingplicht/artikel-50/" },
    85: { titel: "Beleidsregel teruggaaf energiebelasting meerdere zelfstandige onroerende zaken achter één aansluiting (belastingvermindering per onroerende zaak, op verzoek, per kalenderjaar)", auteur: "Belastingdienst / Ministerie van Financiën (via PONT Omgeving)", soort: "beleidsregel", url: "https://omgevingsweb.nl/wetgeving/belastingen-op-milieugrondslag/4-energiebelasting/4-3-teruggaaf-energiebelasting-meerdere-onroerende-zaken-achter-een-aansluiting/4-3-teruggaaf-energiebelasting-meerdere-onroerende-zaken-achter-een-aansluiting-2/" },
    86: { titel: "Actief deelnemen aan de energietransitie onder de Energiewet: actieve afnemer, energiedelen (administratief, binnen één leverancier), energiegemeenschap levert zonder winstoogmerk aan leden met uitzondering op vergunningplicht", auteur: "PONT Omgeving / Omgevingsweb", soort: "vakartikel", url: "https://omgevingsweb.nl/nieuws/actief-deelnemen-aan-de-energietransitie-onder-de-energiewet/" },
    87: { titel: "Prijs agrarische grond gestegen in tweede kwartaal 2026: gemiddeld € 108.500 per hectare (akkerbouw ± € 123.000, grasland ± € 94.500)", auteur: "Kadaster en Wageningen University & Research (via ANP / Welingelichte Kringen)", soort: "statistiek", url: "https://www.welingelichtekringen.nl/economie/prijs-agrarische-grond-gestegen-in-tweede-kwartaal-HgF2oU" },
    88: { titel: "Tarieven overdrachtsbelasting 2026: eigen woning 2 %, woning niet als hoofdverblijf 8 %, andere onroerende zaken (o.a. percelen onbebouwde grond) 10,4 %", auteur: "Belastingdienst", soort: "officieel tarief", url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/overdrachtsbelasting/tarieven_overdrachtsbelasting" },
    89: { titel: "Financier je CPO-project: voorbereidingsfase, planfase (architect, constructeur, adviseur, leges; meestal 5–10 % van de woningprijs, voor te financieren) en bouwfase; dubbele lasten 6–12 maanden", auteur: "Rabobank", soort: "bankinformatie", url: "https://www.rabobank.nl/particulieren/hypotheek/samen-zelfbouwen/financier-je-cpo-project" },
    90: { titel: "Presentatie collectief particulier opdrachtgeverschap Loo: opbouw stichtingskosten (grond, realisatie, bouw, financiering, overig) en fasering ± 2 jaar", auteur: "Gemeente Deventer", soort: "presentatie", url: "https://www.deventer.nl/woningbouw-1/woningbouw-loo/presentatie-collectief-particulier-opdrachtgeverschap-loo.pdf" },
    91: { titel: "Opgave carport en eigen woning (27-10-2026 13:43): carport aan de zuidkant in de breedte, inrijden vanaf het noorden; parkeerplaats 2,75 m breed, 8 m diep, vrije hoogte ± 3,2 m (bestelbus, camper); zuidzijde een wand van 600 Wp-panelen (2278 × 1134 mm) liggend, drie hoog, op staanders met bakstenen plint, 18 panelen per 5 plaatsen = 10,8 kWp; dak ook vol panelen; dakwater carport en buurthuis naar de zwemvijver; eigen woning: lager zuidelijk zadeldak, oost/west-daken oplopend van laag (zuid) naar hoog (noord) voor minder schaduw op de panelen", auteur: "Melvin de Vries", soort: "eigen opgave" },
    92: { titel: "Beleidsregel Natuurinclusief bouwen Danninge Erve Zuid, fase 2, deelgebied 3 (puntensysteem: minimaal 10 punten per woning; o.a. huismus 5, gierzwaluw 5, vogelvide 5, vleermuis 7, groen dak 7, groene gevel 5, insectenvoorziening 3)", auteur: "Gemeente Meppel (Gemeenteblad 2026, 70660, 17-02-2026)", soort: "beleidsregel", url: "https://zoek.officielebekendmakingen.nl/gmb-2026-70660.html" },
    93: { titel: "14 Patterns of Biophilic Design: Improving Health and Well-Being in the Built Environment (2014; 10th Anniversary Edition 2024 met 15e patroon 'Awe')", auteur: "W.D. Browning, C.O. Ryan, J.O. Clancy – Terrapin Bright Green", soort: "vakpublicatie", url: "https://www.terrapinbrightgreen.com/14-patterns/" },
    94: { titel: "View through a window may influence recovery from surgery. Science 224 (4647): 420–421 (patiënten met uitzicht op bomen: kortere opnameduur en minder sterke pijnstillers dan met uitzicht op een bakstenen muur)", auteur: "R.S. Ulrich (1984)", soort: "wetenschappelijk artikel", url: "https://www.wrrc.arizona.edu/sites/default/files/ulrich-view%20through%20a%20window.pdf" },
    95: { titel: "The Experience of Nature: A Psychological Perspective (Attention Restoration Theory)", auteur: "R. Kaplan & S. Kaplan (1989), Cambridge University Press", soort: "wetenschappelijk boek" },
    96: { titel: "Potted plants do not improve indoor air quality: a review and analysis of reported VOC removal efficiencies. Journal of Exposure Science & Environmental Epidemiology 30: 253–261 (10–1.000 planten per m² nodig om het effect van ventilatie te evenaren)", auteur: "B.E. Cummings & M.S. Waring (2019/2020)", soort: "wetenschappelijk artikel" },
    97: { titel: "25 Richtlijnen van de bouwbiologie (binnenklimaat, bouwmaterialen, ontwerp, milieu, eco-sociale leefomgeving), vertaling P. Hennipman", auteur: "Institut für Baubiologie + Nachhaltigkeit (IBN)", soort: "richtlijn (in projectmap)" },
    98: { titel: "CLT-handleiding voor architecten en bouwkundigen (leefcomfort: hout reguleert warmte en vocht, zeker in het zicht; vochtgevoeligheid > 20 % houtvochtgehalte)", auteur: "INBO", soort: "vakpublicatie (in projectmap)" },
    99: { titel: "Verordening (EG) nr. 1069/2009 (dierlijke bijproducten), art. 11 lid 1 onder b: verbod op het voederen van landbouwhuisdieren, met uitzondering van pelsdieren, met keuken- en etensresten", auteur: "Europees Parlement en Raad", soort: "regelgeving", url: "https://gesetze.legal/eu/vo_eg_2009_1069/11" },
    100: { titel: "Infofiche 'Mijn kippen in de stad' (legkippen ± 200 eieren per jaar; 150–200 g voer per kip per dag; hok 1 m² per 2 kippen; ren minimaal 5 m² per kip; leg neemt af na 3–4 jaar)", auteur: "Leefmilieu Brussel / Apis Bruoc Sella (2018)", soort: "voorlichting", url: "https://document.environnement.brussels/opac_css/elecfile/IF_Potager_Poulesurbaines_Kippeninstad_NL" },
    101: { titel: "Maatregelen tegen vogelgriep (afschermplicht voor hobbyhouders van hoenderachtigen, watervogels en loopvogels bij een uitbraak; geen evenementen met risicovogels)", auteur: "Rijksoverheid", soort: "overheidsinformatie", url: "https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/vogelgriep/maatregelen-tegen-vogelgriep" },
    102: { titel: "UBN voor gehouden vogels en pluimvee (bedrijfsmatig vanaf 250 dieren; UBN via Avined nodig bij vervoer binnen de EU)", auteur: "Rijksdienst voor Ondernemend Nederland (RVO)", soort: "overheidsinformatie", url: "https://www.rvo.nl/onderwerpen/identificatie-en-registratie-dieren/ubn-gehouden-vogels-pluimvee" },
    103: { titel: "Opgave natuurinclusief wonen, biofilisch inrichten en nutdieren (27-10-2026): kippen voor eieren en om etensresten weg te werken; biofilisch = 'liefde voor het leven', natuurlijk licht, uitzicht, natuurlijke materialen, planten, organische vormen, natuurlijke kleuren; bronnen o.a. DGBC-woordenboek en ORGA architect", auteur: "Melvin de Vries", soort: "eigen opgave" },
    104: { titel: "Opgave 27-10-2026 14:38: kokendwaterkraan (Quooker) ± 300 kWh/jr, te laten draaien bij zon-/windoverschot of lage tarieven; koelkast/vriezer thuis voor wekelijkse boodschappen, persoonlijke items en samen gekocht/geslacht vlees, koel-/vriescel voor de akkervoorraad; koken op inductie; buurtaccu in drie segmenten van 200 kWh (redundantie); bewoners zijn eigenaar van installatie en net en gebruiken hun eigen stroom; carport overal ± 3,2 m vrije hoogte, 1–2 deelauto's, aantal plekken naar wens van bewoners, ideaal één laadpaal per woning op het laadplein, auto die niet hoeft te laden staat bij het huis", auteur: "Melvin de Vries", soort: "eigen opgave" },
    105: { titel: "Gerechtshof 's-Hertogenbosch 27-08-2025, ECLI:NL:GHSHE:2025:2327: zonne-installatie en experimentnet in mandelig eigendom van de appartementseigenaren; VvE alleen beheerder zonder beschikkingsmacht over de stroom → geen levering, geen EB/ODE over de zonnestroom (ook niet voor gemeenschappelijke ruimten); EB wel over netstroom die de VvE doorlevert", auteur: "Gerechtshof 's-Hertogenbosch (samenvatting TaxLive/VN Vandaag 2025/2001; SRA 04-11-2025)", soort: "jurisprudentie", url: "https://www.taxlive.nl/nl/documenten/vn-vandaag/geen-eb-en-ode-bij-zonnestroom-in-mandelig-eigendom/" },
    106: { titel: "Kip (houderij): voeren van keukenafval bij wet verboden, ook voor particulier/hobbymatig gehouden kippen; onbewerkte plantaardige producten 'rechtstreeks van de snijplank' wel; volwassen kippen eten 30–100 g voer per dag; verwijzing RIVM-advies geen eieren van hobbykippen", auteur: "Landelijk InformatieCentrum Gezelschapsdieren (LICG)", soort: "voorlichting", url: "https://www.licg.nl/vogels/kip/" },
    107: { titel: "RIVM: eet geen eieren van hobbykippen (landelijk advies 15-04-2025; 60 locaties; op ruim de helft van de plekken bij < 1 ei per week al te veel PFAS); 16-03-2026: wormen belangrijkste bron, advies ongewijzigd", auteur: "RIVM (via NOS 15-04-2025 en 16-03-2026)", soort: "overheidsadvies", url: "https://nos.nl/artikel/2606549-wormen-blijken-belangrijkste-oorzaak-van-pfas-in-eieren-van-hobbykip" },
    108: { titel: "Voedingscentrum duidt: kun je eieren van eigen kippen eten vanwege PFAS? (16-03-2026: wie het risico wil beperken eet geen eieren van eigen kippen; meten geeft geen garantie)", auteur: "Voedingscentrum", soort: "voorlichting", url: "https://www.voedingscentrum.nl/nl/nieuws/voedingscentrum-duidt-kun-je-eieren-van-eigen-kippen-eten-vanwege-pfas-.aspx" },
    109: { titel: "Besluiten 27-10-2026 14:53: eieren van eigen kippen worden gegeten (bewuste keuze, RIVM-advies bekend); carport 14 plekken (12 vaste, 1 per woning, + 2 deelauto's), 1.800 Wp per parkeerplaats op de zuidgevel en een dak vol panelen; afschakelen is goedkoper dan bijkopen: eigen stroom ± € 0,03/kWh tegen gemiddeld ± € 0,25/kWh ingekocht (factor ± 8)", auteur: "Melvin de Vries", soort: "eigen opgave" },
    110: { titel: "Bruidsschat omgevingsplan art. 22.14 Bereikbaarheid bouwwerk voor hulpverleningsdiensten: verbindingsweg tussen openbare weg en toegang (niet nodig als toegang ≤ 10 m van openbare weg), breedte ≥ 4,5 m, verharding ≥ 3,25 m geschikt voor voertuigen ≥ 14.600 kg, vrije hoogte ≥ 4,2 m, doeltreffende afwatering; afsluitend hekwerk snel en gemakkelijk te openen door hulpdiensten of met systeem in overleg met bevoegd gezag (lid 5)", auteur: "Rijksoverheid – Bruidsschat omgevingsplan (geldend vanaf 01-01-2024), via InView", soort: "regelgeving", url: "https://inview.nl/openCitation/ide3cadc9534bb481e8c3e65cb5eec03a0/bruidsschat-omgevingsplan-tijdelijk-deel-van-het-omgevingsplan-artikel-22-14" },
    111: { titel: "Besluit bouwwerken leefomgeving (Bbl) § 4.2.16 Inbraakwerendheid, art. 4.100: bereikbare gevelelementen (deuren, ramen, kozijnen) van een woonfunctie inbraakwerend weerstandsklasse 2 volgens NEN 5096, bereikbaarheid volgens NEN 5087; rookmelders volgens NEN 2555", auteur: "Rijksoverheid (wetten.overheid.nl)", soort: "regelgeving", url: "https://wetten.overheid.nl/BWBR0041297/" },
    112: { titel: "Denk Vooruit – bereid je voor op een noodsituatie: wees 72 uur zelfredzaam (noodpakket met o.a. drinkwater, houdbaar eten, radio op batterijen, zaklamp, EHBO, contant geld; maak een noodplan; help elkaar), campagne 09-10-2025", auteur: "Rijksoverheid / Nationaal Coördinator Terrorismebestrijding en Veiligheid", soort: "overheidsinformatie", url: "https://www.denkvooruit.nl/" },
    113: { titel: "Burgerlijk Wetboek Boek 5, titel 5 Mandeligheid (art. 5:60–5:69): mandeligheid ontstaat door notariële akte en inschrijving in de openbare registers; het aandeel is onlosmakelijk verbonden met het erf (5:63); kosten van onderhoud voor gezamenlijke rekening (5:65); opheffing alleen met instemming", auteur: "Rijksoverheid (wetten.overheid.nl)", soort: "regelgeving", url: "https://wetten.overheid.nl/BWBR0005288/" },
    114: { titel: "Verordening (EU) 2017/745 betreffende medische hulpmiddelen (MDR): software met een medisch doel (bv. bewaken van fysiologische processen, detectie van een val ter voorkoming van letsel) kan een medisch hulpmiddel zijn met CE-markering en conformiteitsbeoordeling (art. 2, bijlage VIII regel 11)", auteur: "Europees Parlement en Raad van de EU", soort: "regelgeving", url: "https://eur-lex.europa.eu/eli/reg/2017/745/oj" },
    115: { titel: "Opgave 27-10-2026 18:08: pagina Veiligheid (sociale controle, inbraakveiligheid, brandpreventie, voedselvoorraad van een week bij storing in de logistieke keten, toegang hulpdiensten, draaicirkels, bewegwijzering, afspraken met de veiligheidsdriehoek over de buurtaccu, idee seniorenbewaking met eigen app, sensor op het lijf en plaatsbepaling, hek of pollers met toegangscode of beeldherkenning voor hulpdiensten); eigendom: bewoners zijn eigenaar van installatie en buurtgebouwen, geen heffingen over eigen stroom; pagina Energie hernoemen naar Energieopwek; auto's vragen de meeste stroom; noodoplossing snellader; zoveel mogelijk panelen loodrecht; panelen schuin op daken, loodrecht op de akker, tegen gevels en op/aan de carport", auteur: "Melvin de Vries", soort: "eigen opgave" },
    117: { titel: "Vraag en antwoord eerste 72 uur (Denk Vooruit): noodpakket met genoeg water, 3 liter per persoon per dag; houdbaar eten; contant geld ± € 70 per volwassene en € 30 per kind", auteur: "Veiligheidsregio Midden- en West-Brabant", soort: "overheidsinformatie", url: "https://www.vrmwb.nl/wees-voorbereid/denk-vooruit/vraag-en-antwoord-eerste-72-uur" },
    118: { titel: "PGS 37-1 Energieopslagsystemen (EOS): richtlijn voor veilige opslag van elektriciteit in gekoppelde lithiumbatterijen, o.a. buurtbatterijen (hoofdrisico thermal runaway); vastgesteld door het BOb december 2023; aanwijzing in het Bal als milieubelastende activiteit naar verwachting in de loop van 2028; tot dan via zorgplicht en maatwerkvoorschrift (bruidsschat art. 22.44/22.45 of Bal art. 2.11/2.13) of regels in het omgevingsplan", auteur: "Informatiepunt Leefomgeving (IPLO)", soort: "overheidsinformatie", url: "https://iplo.nl/thema/externe-veiligheid/pgs-37-1-37-2-houden-wijziging-bal" },
    119: { titel: "Opgave 27-10-2026 18:20/18:24: kavelgrootte 500 m² (gezinswoning), 300 m² (seniorenwoning), 120 m² (jongerenwoning); kavel minus woning verdeeld als 75 % privétuin en 25 % verharding; zoekgebied uitbreiden richting Nunspeet en Apeldoorn met 2–3 extra meetstations", auteur: "Melvin de Vries", soort: "eigen opgave" },
    120: { titel: "RIVM pleit voor veilige afstand grootschalige batterijen tot huizen (28-03-2024): eerste indicatieve berekeningen voor energieopslag ≥ 20 kWh – brand tot 13 m per batterijmodule, gifwolk tot 24 m in worst case, explosie 57 m (conservatief, waarschijnlijk overschat); afstanden sterk afhankelijk van modulegrootte; vervolgonderzoek naar rekenvoorschrift", auteur: "Solar Magazine, over onderzoek RIVM in opdracht van IenW", soort: "artikel", url: "https://solarmagazine.nl/nieuws-zonne-energie/i37047/rivm-pleit-voor-veilige-afstand-grootschalige-batterijen-tot-huizen" },
    121: { titel: "Opgave 27-10-2026 19:17: geen weg onder de carport, hulpdiensten rijden er net als bewoners omheen; buurtaccu naast de carport in stalen brandveilige behuizing (± 10 m²), met voldoende ruimte eromheen, ver genoeg van de carport voor brandveiligheid en dicht genoeg om dikke kabels te vermijden; ernaast de groepenkast-/omvormerbehuizing met kabels naar de woningen en de verbinding naar het buurthuis met de netaansluiting 3 × 25 A; in het buurthuis komt de drinkwateraansluiting binnen, technische ruimte met een watermeter per woning, netwerk-uplink en de eerste server", auteur: "Melvin de Vries", soort: "eigen opgave" },
    122: { titel: "Opgave 27-10-2026 23:23: de rollen projectontwikkelaar en ambtenaar (bevoegd gezag) uitwerken in het plan, met een structuur waarin hun vragen beantwoord kunnen worden zodat de informatie op enig moment compleet te noemen is", auteur: "Melvin de Vries", soort: "eigen opgave" },
    123: { titel: "Wonen en Ladder voor duurzame verstedelijking: woningbouw vanaf 12 woningen in principe ladderplichtige nieuwe stedelijke ontwikkeling (jurisprudentie ABRvS); motivering behoefte en, buiten bestaand stedelijk gebied, waarom niet binnen stedelijk gebied (Bkl art. 5.129g)", auteur: "Informatiepunt Leefomgeving (IPLO)", soort: "overheidsinformatie", url: "https://iplo.nl/thema/ruimtelijke-ontwikkelingen/bijzondere-onderwerpen/ladder/wonen/" },
    124: { titel: "Vitens Tarieven 2026 Consument: standaardaansluiting met watermeter Q3 2,5 (nominaal 1,5 m³/h, wettelijk minimum 1 m³/h); € 1,34 per m³; vastrecht € 56,68 per jaar; belasting op leidingwater € 0,477 per m³; nieuwe standaardaansluiting € 1.874,80; hoofdaansluiting appartementengebouw max. 4/6/10/16 m³/h € 2.507/3.488/4.796/6.322; appartementswatermeter € 457,80 (alle bedragen incl. 9 % btw)", auteur: "Vitens", soort: "tarievenblad", url: "https://www.vitens.nl/-/media/Project/Vitens/VitensNl/Tarieven/Documenten-tarieven-2026/050004-31_Vitens-Tarieven-2026-Consument.pdf" },
    125: { titel: "KWR 06.104 Rekenregels voor dimensionering van leidingwaterinstallaties (maximaal momentaan verbruik per woning en voor collectieve leidingen, tappuntdebieten ISSO 30), maart 2007", auteur: "E.J.M. Blokker – Kiwa Water Research, in opdracht van Uneto-VNI en TVVL", soort: "onderzoeksrapport", url: "https://api.kwrwater.nl//uploads/2019/05/KWR-06.104-Rekenregels-dimensionering-leidingwaterinstallaties.pdf" },
    126: { titel: "Opgave 27-10-2026 23:46: aantonen dat 12 woningen met één drinkwateraansluiting kunnen; wanneer kopen we hoeveel water in, debiet standaardaansluiting, m³ per dag, grafiek tekort regenwater (bijkoop) en verbruik koken/douchen, tijdstippen, technische maatregelen voor druk en debiet; op de pagina Water in de woning", auteur: "Melvin de Vries", soort: "eigen opgave" },
    127: { titel: "Vitens aansluitvoorwaarden drinkwater 2024 (o.a. 1.2.1 aansluiting incl. meter, keerklep, begrenzer; 3.3.4 bescherming tegen bevriezing en opwarming boven 25 °C; 4.2.1 installatietekening bij > 0,5 l/s; 4.2.3 drukverhoging en terugstroombeveiliging op tekening; 5.1.3 installaties op verschillende aansluitingen niet koppelen)", auteur: "Vitens", soort: "voorwaarden", url: "https://vitens.nl/-/media/Project/Vitens/VitensNl/Voorwaarden/Documenten-voorwaarden/Vitens-aansluitvoorwaarden-drinkwater-2024-(002).pdf" },
    128: { titel: "Het team achter Hanzedorp: Nick Vollebergh (voorzitter; overheidsjurist; juridische voorbereiding en extern contact), Douwe Kunst (secretaris; calculator bij een installatiebedrijf; bouw), Melvin de Vries (penningmeester; zelfstandig business analist; energie)", auteur: "Hanzedorp", soort: "website", url: "https://hanzedorp.nl/team/" },
    129: { titel: "Hanzedorp – beleidsonderzoek agrarische grond naar woningbouw (CPO, 10-12 woningen): provinciale kaders Overijssel en Gelderland en beleidsinventarisaties van 17 gemeenten (o.a. Zwolle, Dalfsen, Olst-Wijhe, Raalte, Deventer, Nunspeet, Ermelo, Elburg), elk met twee kernvragen; stand 27-10-2026", auteur: "Nick Vollebergh", soort: "onderzoeksrepository", url: "https://github.com/vollebergh/hanzedorp" },
    130: { titel: "How Much Does a C&I BESS Really Cost in 2026? Europe Total Installed Cost Guide (juni 2026): totale geïnstalleerde kosten € 460–720/kWh (241 kWh), € 400–610/kWh (422 kWh), € 330–530/kWh (1 MWh); kernhardware (cellen, kast, PCS, basis-EMS) ± € 140–200/kWh, bij ≥ 1 MWh € 130–170/kWh", auteur: "PVB", soort: "marktartikel", url: "https://www.pvb.com/?p=20453" },
    131: { titel: "Opgave 29-10-2026: simulatie winteropwek (erfmolens, verticale panelen) tegen verbruik en bijkoop bij 3 × 25 A in de dalmomenten; berekenen of 600 kWh de optimale accugrootte is", auteur: "Melvin de Vries", soort: "eigen opgave" },
    132: { titel: "Tesla verlaagt de prijzen aan de Supercharger deels tot onder € 0,40 per kWh (variabele tarieven per locatie en tijdstip); Superchargers in Nederland open voor niet-Tesla's", auteur: "Shop4Tesla; AutoRAI", soort: "nieuwsartikel (indicatief)", url: "https://www.shop4tesla.com/nl/blogs/news/tesla-senkt-die-preise-am-eigenen-tesla-supercharger-teils-massiv-auf-unter-0-40-pro-kwh" },
    133: { titel: "Opgave 29-10-2026 23:13: in de visualisatie zichtbaar maken welke verbruikers (woning, warmtepomp, auto) en welke opwek (panelen, erfmolens, bijkoop); auto's kunnen bij tekort naar een snellader (bv. Tesla); prioriteit bij de woningen, die kunnen nergens anders aan energie komen; hoeveel verbruikt de warmtepomp in de winter en hoeveel de rest van de woning", auteur: "Melvin de Vries", soort: "eigen opgave" },
    134: { titel: "Wetenschap – overzicht van studies naar earthing/grounding (o.a. Ghaly & Teplitz 2004; Chevalier e.a. 2010, 2012; Brown e.a. 2015; Müller e.a. 2019); verkoper van aardingsproducten", auteur: "Earthing Nederland", soort: "website (commercieel)", url: "https://www.earthingnederland.nl/wetenschap" },
    135: { titel: "Effectiveness of grounded sleeping on recovery after intensive eccentric muscle loading. Frontiers in Physiology 10:35 – gerandomiseerd, drievoudig geblindeerd, n = 22 (12 geaard, 10 sham); minder daling sprongkracht en kleinere CK-stijging, geen verschil in spierpijn (VAS); bloedanalyse n = 4", auteur: "Müller E., Pröller P., Ferreira-Briza F., Aglas L., Stöggl T. (2019)", soort: "wetenschappelijk artikel (RCT)", url: "https://www.frontiersin.org/articles/10.3389/fphys.2019.00035/full" },
    136: { titel: "Earthing: health implications of reconnecting the human body to the Earth's surface electrons. Journal of Environmental and Public Health 2012:291541 (overzichtsartikel van eigen en verwante pilotstudies)", auteur: "Chevalier G., Sinatra S.T., Oschman J.L., Sokal K., Sokal P. (2012)", soort: "wetenschappelijk overzichtsartikel", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3265077" },
    137: { titel: "Barefoot in Sedona: bogus claims about grounding your feet to Earth promote medical pseudoscience (kritiek: kleine, vaak ongecontroleerde studies; auteurs Chevalier, Sinatra en Oschman volgens de auteur contractant en aandeelhouder van een earthing-bedrijf; fysische onderbouwing ontbreekt)", auteur: "Hall H. – Skeptic (15-12-2012)", soort: "kritische beschouwing", url: "https://www.skeptic.com/article/barefoot-in-sedona-bogus-claims-about-grounding-your-feet-to-earth-promote-medical-pseudoscience/" },
    138: { titel: "Grounding (earthing) as related to electromagnetic hygiene: an integrative review. Biomedical Journal (2022), doi 10.1016/j.bj.2022.11.005", auteur: "Jamieson I.A. (2022)", soort: "wetenschappelijk overzichtsartikel", url: "https://qigonginstitute.org/abstract-print/18001" },
    139: { titel: "Verkenning van extreem laagfrequente (ELF) magneetvelden bij verschillende bronnen. Briefrapport 2018-0015 (omvormer woning tot 70 µT aan het apparaat, < 0,4 µT op 0,2–1 m; zonnepark: omvormer ± 1 m, schakelkast/transformator 0,3–6 m; middenspanningskabel max 0,8 µT op 1 m hoogte, strook > 0,4 µT ≤ 3 m; opladers < 0,4 µT binnen enkele cm)", auteur: "Dusseldorp A., Pruppers M.J.M., van Putten E.M. – RIVM (2018)", soort: "rapport", url: "https://www.rivm.nl/publicaties/verkenning-van-extreem-laagfrequente-elf-magneetvelden-bij-verschillende-bronnen" },
    140: { titel: "Electromagnetic fields associated with commercial solar photovoltaic electric power generating facilities. Journal of Occupational and Environmental Hygiene (2015), doi 10.1080/15459624.2015.1047021 (hoogste velden direct bij omvormer/transformator, onder ICNIRP-publieksgrens, op 30 cm van transformator ± 5× lager)", auteur: "Tell R.A. e.a. (2015)", soort: "wetenschappelijk artikel", url: "https://www.arpansa.gov.au/electromagnetic-fields-associated-commercial-solar-photovoltaic-electric-power-generating-facilities" },
    141: { titel: "Measuring electromagnetic fields (EMF) around wind turbines in Canada: is there a human health concern? Environmental Health 13:9 (magneetveld aan de voet van draaiende turbines gemiddeld ± 0,1 µT, binnen 2 m gelijk aan achtergrond)", auteur: "McCallum L.C., Whitfield Aslund M.L., Knopper L.D., Ferguson G.M., Ollson C.A. (2014)", soort: "wetenschappelijk artikel", url: "https://ehjournal.biomedcentral.com/articles/10.1186/1476-069X-13-9" },
    142: { titel: "Guidelines for limiting exposure to electromagnetic fields (100 kHz to 300 GHz). Health Physics 118(5):483–524 (publiek, 2–300 GHz: 10 W/m² gemiddeld over 30 min)", auteur: "ICNIRP (2020)", soort: "internationale richtlijn", url: "https://www.icnirp.org/en/publications/article/rf-guidelines-2020.html" },
    143: { titel: "Agentschap Telecom actualiseert ICNIRP-stralingsnormen (vanaf 2021 meten in W/m², 30-minutengemiddelde; limietwaarden ongewijzigd)", auteur: "Telecompaper (23-04-2021)", soort: "nieuwsartikel", url: "https://www.telecompaper.com/news/agentschap-telecom-actualiseert-icnirp-stralingsnormen--1380675" },
    144: { titel: "Vermeidung vagabundierender Ströme in Niederspannungs-Schaltanlagen (PEN/TN-C-S veroorzaakt zwerfstromen → storende magneetvelden, corrosie, EMC; maatregel TN-S met één centraal aardpunt; DIN VDE 0100-444 / HD 60364-4-444)", auteur: "ZVEI – Fachverband Automation (december 2017)", soort: "vakpublicatie", url: "https://www.zvei.org/fileadmin/user_upload/Presse_und_Medien/Publikationen/2017/Dezember/Vermeidung_vagabundierender_Stroeme_in_Niederspannungsschaltanlagen/Vermeidung_vagabundierrender_Stro__me_Einzel.pdf" },
    145: { titel: "Building Biology Evaluation Guidelines for Sleeping Areas SBM-2015 (supplement bij Standard der baubiologischen Messtechnik; voorzorgswaarden, uitdrukkelijk geen wettelijke of wetenschappelijke grenswaarden)", auteur: "Baubiologie Maes / Institut für Baubiologie + Nachhaltigkeit IBN (2015)", soort: "richtwaarden (voorzorg)", url: "https://static1.squarespace.com/static/55517edbe4b0b260d3936ec1/t/5e3ca9927d681d130c3c0364/1581033875399/SBM-2015_Building_Biology_Evaluation_Guideline_Values.PDF" },
    146: { titel: "Wi-Fi in schools measurement study (typische wifi-blootstelling in klaslokalen ± 0,0002 % van de publieksgrens)", auteur: "ARPANSA (Australian Radiation Protection and Nuclear Safety Agency)", soort: "meetstudie", url: "https://www.arpansa.gov.au/research/surveys/wi-fi-in-schools-measurement-study" },
    147: { titel: "ERC Recommendation 70-03, Annex 3 – Wideband data transmission systems (RLAN: 2400–2483,5 MHz 100 mW e.i.r.p.; 5150–5350 MHz 200 mW binnen; 5470–5725 MHz 1 W met TPC/DFS); in NL uitgewerkt in de Regeling gebruik van frequentieruimte zonder vergunning en zonder meldingsplicht – actuele versie te verifiëren", auteur: "CEPT/ECC", soort: "regelgeving (aanbeveling)", url: "https://docdb.cept.org/document/845" },
    148: { titel: "Opgave 04-11-2026: pagina Gezondheid – straling aanvullen: wat is gezond, afstanden, maximale sterkte van antennes, aarding; startpunt earthingnederland.nl/wetenschap, wetenschappelijke studies als bron opnemen", auteur: "Melvin de Vries", soort: "eigen opgave" },
    149: { titel: "Compact HVAC systems / compact heat pump unit (ventilatie met WTW, warmtepomp op de afvoerlucht na de warmtewisselaar, verwarming van toevoerlucht en tapwater; geschikt waar de warmtevraag vrijwel geheel via de hygiënisch nodige ventilatielucht kan worden geleverd; concept Feist 1995)", auteur: "Passipedia – Passive House Institute", soort: "vakencyclopedie", url: "https://passipedia.org/planning/building_services/compact_hvac_systems" },
    150: { titel: "Certificaat passiefhuiscomponent compactunit Stiebel Eltron LWZ 304 SOL (WTW 87 %; COP verwarming 2,28 / 2,86 / 3,25 bij −7 / 2 / 7 °C; verwarmingsvermogen 2,7–4,8 kW; tapwater COP 2,28–3,70; ontwerpbasis 12 W/m² bij 160–230 m³/h; toevoerlucht max 35 °C uit de warmtepomp; SPF 2,8)", auteur: "Passive House Institute (Passivhaus Institut)", soort: "productcertificaat", url: "https://passiv.de/alte_komponentendatenbank/files/pdf/zertifikate/zd_stiebeleltron_lwz304_en.pdf" },
    151: { titel: "Frisse lucht en verwarming combineren met de ventilatiewarmtepomp (gangbare ventilatiewarmtepomp vervangt de afzuigbox van ventilatiesysteem C; niet geschikt voor balansventilatie met WTW; hybride (met cv-ketel) of all-electric; ± € 2.500–5.000)", auteur: "Schoofs D. – ID.nl (19-09-2023)", soort: "vakartikel", url: "https://id.nl/energie-en-klimaat/klimaat-en-luchtkwaliteit/klimaatbeheersing/frisse-lucht-en-verwarming-combineren-met-de-ventilatiewarmtepomp" },
    152: { titel: "Factsheet bodemwarmtepomp (verticaal, incl. installatie € 8.500–16.500; warmtepomp ± 15 jaar, bodemwarmtewisselaar 25–35 jaar; rendement ruimteverwarming 450–550 %, tapwater 275–375 %; bronnen o.a. Milieu Centraal, BDH)", auteur: "CE Delft (uitgave), met cijfers van Milieu Centraal en BDH", soort: "factsheet", url: "https://ce.nl/wp-content/uploads/2021/04/05_Factsheet-Bodemwarmtepomp_DEF.pdf" },
    153: { titel: "Factsheet wijziging gasaansluitplicht per 1 juli 2018 (nieuwbouw in principe geen gasaansluiting; Gaswet art. 10 lid 6 en 7)", auteur: "Ministeries van BZK en EZK", soort: "factsheet", url: "https://www.rvo.nl/files/file/2018/07/Factsheet-gasaansluitplicht-vanaf-1-juli-2018-02.pdf" },
    154: { titel: "Aanscherping geluidseisen voor warmtepompen en airco's: buitenunit max 40 dB op de perceelgrens van een aangrenzend perceel met woonfunctie en bij een te openen raam of deur (sinds 1-4-2021; nu Bbl art. 4.107 lid 2 en 4.108 lid 3)", auteur: "Omgevingsweb", soort: "vakartikel", url: "https://omgevingsweb.nl/nieuws/duurzamere-temperatuurregulering-minder-geluid-aanscherping-geluidseisen-voor-warmtepompen-en-aircos/" },
    155: { titel: "Flyer F-gassenverordening (EU) 2024/573: o.a. split lucht-water ≤ 12 kW max GWP 150 vanaf 2027; split lucht-lucht ≤ 12 kW max GWP 150 vanaf 2029; splits ≤ 12 kW zonder F-gassen vanaf 2035; monoblok ≤ 12 kW zonder F-gassen vanaf 2032", auteur: "NVKL", soort: "brancheuitgave", url: "https://www.nvkl.nl/wp-content/uploads/2024/04/Flyer-F-gassenverordening-V20260203.pdf" },
    156: { titel: "Summer comfort: oververhittingsfrequentie (uren > 25 °C) ≤ 10 % nog acceptabel, ontwerpdoel < 5 %; zonwering en nachtventilatie; actieve koeling niet altijd nodig", auteur: "Passipedia – Passive House Institute", soort: "vakencyclopedie", url: "https://passipedia.org/planning/summer_comfort" },
    157: { titel: "Opgave 04-11-2026 10:49: terminologie warmtepompen; ventilatieluchtwarmtepomp in de woning (vooral warm tapwater; warmte veelal van bewoners, apparaten en restwarmte; opgesteld in de installatieruimte met kanaal naar de WTW); waarom geen water-water (geringe warmtevraag, aanlegkosten, levensduur), geen hybride (gasloos), geen lucht-water (overcapaciteit) en geen lucht-lucht (zomer niet te warm; winterpiek stroomvraag); terminologie gelijktrekken met vakliteratuur", auteur: "Melvin de Vries", soort: "eigen opgave" },
    158: { titel: "Factsheet warmtepomp (typen: lucht-lucht geen tapwater; lucht-water met buitenunit die geluid maakt; water-water met bodembron, hoog rendement maar relatief hoge investering)", auteur: "Omgevingsdienst Zuid-Holland Zuid / Regionaal Energieloket", soort: "factsheet", url: "https://www.ozhz.nl/wp-content/uploads/factsheet-warmtepomp.pdf" },
    159: { titel: "Opgave 04-11-2026 10:54: geen gezamenlijke wasruimte in het buurthuis (onduidelijk eigenaarschap leidt tot verwaarlozing); dus ook geen wasmachine in het buurthuis voor de jongerenwoningen", auteur: "Melvin de Vries", soort: "eigen opgave" },
    160: { titel: "Opgave 04-11-2026 11:18: Hanzedorp heeft een akker; op de akker maken we een tuinderij die professioneel geleid wordt om een rijke oogst te bewerkstelligen; grond waarop (nog) geen voedsel groeit is in het begin weiland, die wordt omgezet tot akker; begrippen coherent maken in alle pagina's", auteur: "Melvin de Vries", soort: "eigen opgave" },
    161: { titel: "Opgave 04-11-2026 11:09: op de grondpagina een overzicht van de vierkante meters per doel (huis, groendak, gewoon dak, schuur, weg, vijver, akker, wadi, tuin, berm, enz.), zo specifiek mogelijk; naburige delen schalen mee met de keuzedelen (een grotere kavel geeft bijvoorbeeld meer berm); zoals een projectontwikkelaar en ambtenaar het willen zien", auteur: "Melvin de Vries", soort: "eigen opgave" },
    162: { titel: "Regionaal modelbeleid bluswater en bereikbaarheid, versie 1.0 (primair: brandkraan of geboorde put 60 m³/h binnen 40 m van het object; secundair: 90 m³/h, open water ≥ 4 uur, binnen 200 m, opstelplaats ≤ 2 m van het water, zuighoogte ≤ 8 m, waterdiepte ≥ 0,5 m; tertiair 240 m³/h; droge blusleiding bij inzetdiepte > 60 m; opstelplaats tankautospuit ≥ 4 × 10 m; verbindingsweg 4,5 / 3,25 m, 14.600 kg)", auteur: "Veiligheidsregio Limburg-Noord (31-03-2017), op basis van Handreiking bluswater en bereikbaarheid (Brandweer Nederland, 2012)", soort: "beleidsregel (voorbeeld; IJsselland te verifiëren)", url: "https://cuatro.sim-cdn.nl/leudal/uploads/regionaal_modelbeleid_bluswater_en_bereikbaarheid_2017.pdf" },
    163: { titel: "Richtlijn 2200 – Ontwerp, realisatie en oplevering, beheer en onderhoud van geboorde brandputten, versie 2.1.1", auteur: "SIKB", soort: "richtlijn", url: "https://sikb.nl/doc/richtlijn2200/Richtlijn 2200 Ontwerp realisatie en oplevering beheer en onderhoud van geboorde brandputten versie 2.1.1.pdf" },
    164: { titel: "Opgave 04-11-2026 13:51: rondweg 4,5 m met alleen de middelste 2,5 m gesloten verharding en 1,0 m per zijde hemelwaterdoorlatende stenen waar gras doorheen groeit (smaller en groener ogen); vraag of een blusleiding met koppelpunten op diverse plekken verstandig is (tankwagen aankoppelen, water naar een uitgang verderop pompen)", auteur: "Melvin de Vries", soort: "eigen opgave" },
    165: { titel: "Opgave 04-11-2026 14:15: rollen onderhoudsmanager (onderhouds- en kostenplanning van de gedeelde voorzieningen, niet de woningen) en finance manager/controller (financieel gezond, liquide en solvabel); pagina's onderhoud en financiële planning; juridisch: ook wát Hanzedorp is", auteur: "Melvin de Vries", soort: "eigen opgave" },
    166: { titel: "Kleine, houten windmolen uit Groningen ongekend populair (kosten molen ± € 50.000; bij goed onderhoud tientallen jaren; terugverdientijd 7–10 jaar bij agrarisch gebruik)", auteur: "IO+ (28-05-2021)", soort: "nieuwsartikel", url: "https://ioplus.nl/archive/nl/kleine-houten-windmolen-uit-groningen-ongekend-populair-boeren-uit-de-straat-willen-er-ook-een/" },
    167: { titel: "Zwemvijver kosten (aanleg € 100–650 per m² incl. arbeid en btw; onderhoud: jaarlijks snoeien, slib ± eens per 3 jaar)", auteur: "Homedeal (bijgewerkt 23-06-2026)", soort: "kostenindicatie", url: "https://www.homedeal.nl/wellness/zwemvijver-kosten/" },
    168: { titel: "Moet een vve geld reserveren voor groot onderhoud? (jaarlijks reserveren; op basis van een meerjarenonderhoudsplan voor de komende 10 jaar, of zonder MJOP minimaal 0,5 % van de herbouwwaarde; aparte rekening)", auteur: "Rijksoverheid", soort: "overheidsinformatie", url: "https://www.rijksoverheid.nl/vraag-en-antwoord/huis-kopen/vve-geld-reserveren-groot-onderhoud" },
    169: { titel: "Opgave 04-11-2026 14:55: laadpalen worden als gezamenlijk bezit ingebracht in de beheerentiteit; ze staan op het laadplein en iedere woning heeft een eigen parkeerplaats met laadpaal", auteur: "Melvin de Vries", soort: "eigen opgave" },
    170: { titel: "Hanzedorp – Duurzaam wonen op z'n Sallands! Werkdocument/brochure versie 2 (januari 2025): concept, woningen, wijk, tuinderij, energie, organisatie, financiering, bijlagen", auteur: "Nick Vollebergh, Melvin de Vries, Douwe Kunst – Stichting Hanzedorp", soort: "eigen document" },
    171: { titel: "Besluiten 04-11-2026 15:34: app is leidend boven het werkdocument (de aantallen in de app zijn versie 2); eigendom zo inrichten dat er geen belasting over eigen opgewekte stroom wordt betaald – zo nodig worden ook panelen en omvormers op de woningen gezamenlijk bezit van de beheerentiteit; tuinderij eerst voor bewoners en bij voldoende grond ook voor niet-bewoners; ketenpartner-module bouwen; grens 11 of 12 woningen voor CPO, 13 en meer = commercieel", auteur: "Melvin de Vries", soort: "eigen opgave" },
    172: { titel: "Besluiten 04-11-2026 16:10 thema Bouwen: bouwsysteem vrij mits passiefhuisnorm, ecologische materialen hebben de voorkeur (ecodorp); senioren- en jongerenwoning 1 bouwlaag, gezinswoning 2 bouwlagen met goothoogte max. 6 m, zo geplaatst dat er ook op 21 december geen schaduw op een andere woning valt; vrije kavelrand 2 m / 3 m en doorwaadbare zone 2 m als aanpasbaar voorstel; materialenlijst werkdocument als eis; dakindeling (sedum rand, PV binnenzijde) alleen voor de eigen woning van Melvin – andere ontwerpen mogen anders, mits voldoende panelen op het dak of elders op het terrein, bij voorkeur loodrecht op het zuiden (wintermaximalisatie); installatieruimte liefst groter dan 3 m²; PHPP door Clarence Rose (Azimut Bouwbureau), blowerdoortest waarschijnlijk door Olaf Heinen (Franck); typologie 6/3/3 en 130/70/45 m² als rekenbasis; dakvorm: aangezicht telt, passiefbouweisen altijd leidend", auteur: "Melvin de Vries", soort: "eigen opgave" },
    116: { titel: "Politiekeurmerk Veilig Wonen (PKVW): keurmerk voor inbraakpreventie en sociale veiligheid van woning en woonomgeving (eisen aan hang- en sluitwerk, verlichting, zichtlijnen, overzichtelijke inrichting)", auteur: "Centrum voor Criminaliteitspreventie en Veiligheid (CCV)", soort: "keurmerk", url: "https://www.politiekeurmerk.nl/" },
    67: { titel: "Inmaken en fermenteren (Voedingscentrum raadt thuiswecken af vanwege botulisme; inmaken van zuur fruit wel veilig; fermenteren met 2 % zout)", auteur: "MAX Vandaag, met verwijzing naar Voedingscentrum (secundaire bron; primaire bron Voedingscentrum te raadplegen)", soort: "artikel", url: "https://www.maxvandaag.nl/?p=117360" },
    56: { titel: "Opgave voorraad en koeling (26-10-2026): voedsel van het veld halen wanneer het kan en nodig is, de rest laten staan waar mogelijk, de rest opslaan voor de winter; centrale voorraad in koel- en vriescellen (twee koelcellen: ±2 °C en ±8 °C) die zelf worden gebouwd en extreem geïsoleerd, koeling ingekocht; per woning een manshoge koelkast en vriezer voor 1 week grijpvoorraad; koelen vooral bij overschot of lage stroomprijs, rusten op piekmomenten; temperatuur vriescel −24 tot −18 °C, koelcel 1 tot 4 °C", auteur: "Melvin de Vries", soort: "eigen opgave" },
    53: { titel: "Opgave inventarisatie mobiliteit en bewoners (26-10-2026): per woning voertuigen (auto, motor; fiets niet nodig) uit de top 5 per segment, referentieverbruik + 15–20 % laadverlies; per persoon leeftijd en thuiswerkdagen", auteur: "Melvin de Vries", soort: "eigen opgave" },
    54: { titel: "Verkoop top-100 2025 (kentekenregistraties RAI-datacentrum; 383.352 registraties)", auteur: "Autozine", soort: "website", url: "https://www.autozine.nl/verkoop-top-100/2025" },
    55: { titel: "Energy consumption of full electric vehicles – cheatsheet ('Average', praktijkverbruik in Wh/km), geraadpleegd 26-10-2026", auteur: "EV Database (Electric Vehicle Database)", soort: "database", url: "https://ev-database.org/cheatsheet/energy-consumption-electric-car" },
    52: { titel: "Ontwerpkeuze hemelwater (26-10-2026): water rond de woning (ook van autowassen) naar ondergrondse infiltratiekratten; water in gezamenlijke groenruimtes naar wadi's", auteur: "Melvin de Vries", soort: "eigen opgave" },
    14: { titel: "Uitgangspunten Wateradvies – Weging Waterbelang, versie 2024", auteur: "Waterschap Drents Overijsselse Delta (gepubliceerd via bestuurlijke informatie gemeente Midden-Drenthe)", soort: "beleidsdocument", url: "https://middendrenthe.bestuurlijkeinformatie.nl/Document/View/f47d7dd6-1b38-4b01-9028-16890bec8b91" }
  }
};

/* Afgeleide waarden: aangeroepen door hanzedorp-project.js NADAT de locatiegegevens van het actieve project zijn samengevoegd.
   carport (v0.15, [91][104]): aantal plekken bepaalt dak, zuidwand, PV en dakwater */
/* Ruimteprogramma per doel [161]: geeft alle onderdelen met categorie (functie), eigendom, soort (keuze/gevolg/norm), m² en uitleg.
   o (optioneel): { kavel:{gezin,senior,junior}, mix, aandeelTuin, groendak, akkerM2, akkerStartM2, groenM2, singelBreedte, bermBreedte, zwemM2, tuinvijverM2 } */
window.HZ_RUIMTE = function (D, o = {}) {
  const G = D.grond, R = Object.assign({}, G.ruimte, o), T3 = ["gezin", "senior", "junior"], NAAM = { gezin: "gezinswoning", senior: "seniorenwoning", junior: "jongerenwoning" };
  const mix = o.mix || D.energie.mix, nW = T3.reduce((a, t) => a + (mix[t] || 0), 0);
  const kavel = Object.assign({}, G.kavel, o.kavel || {}), aT = o.aandeelTuin != null ? o.aandeelTuin : G.aandeelTuin, gd = o.groendak != null ? o.groendak : D.dak.aandeelGroen;
  const c = D.mobiliteit.carport, plekken = c.plekken, carportL = plekken * c.breedte, carportM2 = Math.round(carportL * (c.diepte + 6)), carportDak = Math.round(carportL * c.diepte);
  const ED = D.erfdieren, pers = D.woningen.reduce((a, w) => a + w.n * w.pers, 0), kippen = Math.ceil(pers * ED.eierenPPweek * 52 / ED.eierenPerKip * (1 + ED.reserve)), kipM2 = Math.round(kippen * (ED.renM2 + ED.hokM2));
  const zwem = o.zwemM2 != null ? o.zwemM2 : D.zwemvijver.oppStd, tv = o.tuinvijverM2 != null ? o.tuinvijverM2 : R.tuinvijverM2;
  const akMax = o.akkerM2 != null ? o.akkerM2 : D.akker.maxM2, akStart = Math.min(akMax, o.akkerStartM2 != null ? o.akkerStartM2 : D.akker.startM2);
  const nMolen = D.energie.wind ? D.energie.wind.n : 0, ws = D.waterschap || {}, H = D.hemelwater || {};
  const it = []; const add = (id, naam, cat, eig, soort, m2, st, uitleg) => it.push({ id, naam, cat, eig, soort, m2: Math.round(m2), st, uitleg });
  // kavels
  T3.forEach(t => { const n = mix[t] || 0; if (!n) return; const b = G.bebouwd[t], rest = Math.max(0, kavel[t] - b);
    add("woning-" + t, `Woning (footprint), ${n} × ${NAAM[t]} van ${b} m²`, "Wonen – bebouwd", "privé (kavel)", "keuze", n * b, "N", "bruto footprint gelijkvloers");
    add("tuin-" + t, `Privétuin, ${n} × ${Math.round(rest * aT)} m²`, "Wonen – tuin", "privé (kavel)", "gevolg", n * rest * aT, "A", `(kavel ${kavel[t]} − woning ${b}) × ${Math.round(aT * 100)} %`);
    add("erf-" + t, `Erfverharding (oprit, terras, berging, paden), ${n} × ${Math.round(rest * (1 - aT))} m²`, "Wonen – erfverharding", "privé (kavel)", "gevolg", n * rest * (1 - aT), "A", `(kavel − woning) × ${Math.round((1 - aT) * 100)} %; afwatering naar infiltratiekrat`); });
  const kavelsM2 = T3.reduce((a, t) => a + (mix[t] || 0) * kavel[t], 0);
  // gemeenschappelijke gebouwen en voorzieningen
  add("buurthuis", "Buurthuis (gebouw)", "Maatschappelijk", "mandelig", "keuze", R.buurthuis.gebouw, "N", "gedeelde keuken, technische ruimte, ontmoeten");
  add("buurthuis-erf", "Erf en terras buurthuis", "Maatschappelijk", "mandelig", "keuze", R.buurthuis.erf, "N", "");
  add("schuren", `Schuren (${R.schuren.aantal} × ${R.schuren.gebouw} m²)`, "Nuts en bedrijf", "mandelig", "keuze", R.schuren.aantal * R.schuren.gebouw, "N", "werkplaats, opslag, tweede server");
  add("schuren-erf", "Voorterrein schuren", "Nuts en bedrijf", "mandelig", "keuze", R.schuren.aantal * R.schuren.erf, "N", "");
  add("carport", `Overdekte parkeerplaats (${plekken} plekken van ${String(c.breedte).replace(".", ",")} × ${c.diepte} m) met rijbaan`, "Verkeer", "mandelig", "gevolg", carportM2, "A", `${plekken} × ${String(c.breedte).replace(".", ",")} m × (${c.diepte} + 6 m rijbaan); plekken = woningen + deelauto's`);
  add("accu", "Buurtaccu (3 blokken) met werkruimte en aanrijdbeveiliging", "Nuts en bedrijf", "mandelig", "keuze", R.accuM2, "G/N", "");
  add("verdeel", "Groepenkast- en omvormerbehuizing", "Nuts en bedrijf", "mandelig", "keuze", R.verdeelM2, "N", "");
  add("afval", "Afvalcontainerplek", "Nuts en bedrijf", "mandelig", "keuze", R.afvalM2, "N", "bereikbaar voor de inzamelaar");
  add("kippen", `Kippenhok en ren (${kippen} kippen × ${String(ED.renM2 + ED.hokM2).replace(".", ",")} m²)`, "Agrarisch", "mandelig", "gevolg", kipM2, "A", "aantal kippen volgt uit het aantal bewoners en de eiervraag");
  // water
  add("zwem", "Zwemvijver (water)", "Water", "mandelig", "keuze", zwem, "G", "besluit 27-10-2026");
  add("zwem-oever", "Oever, steiger en ligweide zwemvijver", "Water", "mandelig", "keuze", R.zwemOever, "N", "");
  add("tuinvijver", "Tuinvijver (groendakwater voor de tuinen)", "Water", "mandelig", "keuze", tv, "A", "");
  // groen (keuze)
  add("groen", "Gezamenlijk groen (speel-, natuur- en ontmoetingsgroen)", "Groen", "mandelig", "keuze", R.groenM2, "N", "excl. wadi's, bermen en singel");
  // verkeer (gevolg): rondweg schaalt met de kern
  const kern = kavelsM2 + R.buurthuis.gebouw + R.buurthuis.erf + R.schuren.aantal * (R.schuren.gebouw + R.schuren.erf) + carportM2 + R.accuM2 + R.verdeelM2 + R.afvalM2 + kipM2 + zwem + R.zwemOever + tv + R.groenM2;
  const wegL = R.rondwegRefM * Math.sqrt(kern / R.kernRefM2);
  const gras = 2 * R.wegGrastegel, dicht = R.wegBreedte - gras;
  add("rondweg", `Rondweg: rijbaan gesloten verharding ${String(dicht).replace(".", ",")} m (± ${Math.round(wegL)} m, incl. opstelplaatsen hulpdiensten)`, "Verkeer", "mandelig", "gevolg", wegL * dicht, "S", `lengte = ${R.rondwegRefM} m × √(kern ${Math.round(kern)} / ${R.kernRefM2} m²): grotere kavels of meer voorzieningen → langere weg`);
  if (gras > 0) add("rondweg-gras", `Rondweg: grastegelstroken 2 × ${String(R.wegGrastegel).replace(".", ",")} m (dragend, waterdoorlatend)`, "Verkeer", "mandelig", "gevolg", wegL * gras, "S", "telt mee voor de brandweerbreedte van 4,5 m; grassen groeien erdoor, weg oogt smaller en groener");
  add("paden", `Paden en plein (${nW} × ${R.padenPerWoning} m² + plein ${R.pleinM2} m²)`, "Verkeer", "mandelig", "gevolg", nW * R.padenPerWoning + R.pleinM2, "N", "schaalt met het aantal woningen");
  add("berm", `Bermen langs de rondweg (2 × ${String(R.bermBreedte).replace(".", ",")} m)`, "Groen", "mandelig", "gevolg", 2 * wegL * R.bermBreedte, "N", "volgt uit de lengte van de rondweg; ruimte voor infrasleuf en afwatering");
  // wadi (norm): waterschapsregel en toetsbui
  const verhWeg = wegL * (dicht + gras * R.grastegelFactor) + nW * R.padenPerWoning + R.pleinM2, groenWadi = R.groenM2 + 2 * wegL * R.bermBreedte;
  const Vreq = Math.max((groenWadi * (H.cGroen || 0.15) + verhWeg * (H.cVerhard || 0.8)) * (ws.toetsbuiMm || 109) / 1000, verhWeg * (ws.bergingMm || 92) / 1000);
  const wadiBodem = Vreq / (H.wadiDiepte || 0.3);
  add("wadi", `Wadi's (${Math.round(Vreq)} m³ berging, ${String(H.wadiDiepte || 0.3).replace(".", ",")} m diep, incl. taluds)`, "Water", "mandelig", "norm", wadiBodem * R.wadiTalud, "A", `max(toetsbui ${ws.toetsbuiMm || 109} mm op weg/paden/groen, ${ws.bergingMm || 92} mm per m² nieuw verhard) / diepte × ${String(R.wadiTalud).replace(".", ",")} (taluds)`);
  // akker en tuinderij
  add("akker", "Akker in teelt (tuinderij), met agri-PV tussen de rijen", "Agrarisch", "mandelig", "keuze", akStart, "N", "startgrootte; de tuinderij teelt hier");
  if (akMax > akStart) add("weiland", "Weiland, reserve voor uitbreiding van de akker", "Agrarisch", "mandelig", "gevolg", akMax - akStart, "N", "blijft weiland tot de tuinderij het nodig heeft");
  add("bassin", `Bassin (ontijzering en buffer, ${D.akker.bassinM2} m² × ${String(D.akker.bassinH).replace(".", ",")} m)`, "Water", "mandelig", "keuze", D.akker.bassinM2, "N", "");
  add("nuts", "Nutsgebouw akker en opstelplaats", "Nuts en bedrijf", "mandelig", "keuze", R.nutsgebouwM2 + R.nutsVerhardM2, "N", "pomp, filters, bemesting, switch");
  if (nMolen) add("molens", `Erfmolens (${nMolen} × fundering en onderhoudsstrook)`, "Nuts en bedrijf", "mandelig", "keuze", nMolen * R.erfmolenM2, "S", "op de rand van akker of weiland; slagschaduwzone overlapt");
  // singel (gevolg): langs de buitengrens, iteratief (omtrek hangt af van het totaal)
  let A0 = it.reduce((a, x) => a + x.m2, 0), singel = 0;
  for (let k = 0; k < 6; k++) singel = R.vormfactor * Math.sqrt(A0 + singel) * R.singelBreedte;
  if (R.singelBreedte > 0) add("singel", `Houtsingel langs de buitengrens (${String(R.singelBreedte).replace(".", ",")} m breed, ± ${Math.round(singel / R.singelBreedte)} m)`, "Groen", "mandelig", "gevolg", singel, "N", "landschappelijke inpassing; omtrek = 4,24 · √(plangebied) (rechthoek 1:2)");
  const tot = it.reduce((a, x) => a + x.m2, 0), som = f => it.filter(f).reduce((a, x) => a + x.m2, 0);
  // daken (overlappend, telt niet extra mee)
  const daken = [];
  T3.forEach(t => { const n = mix[t] || 0; if (!n) return; const b = G.bebouwd[t];
    daken.push([`Groendak ${NAAM[t]} (${n} ×)`, n * b * gd, "N", "→ tuinvijver"]); daken.push([`Hard dak met zonnepanelen ${NAAM[t]} (${n} ×)`, n * b * (1 - gd), "N", "→ regenwatertank"]); });
  daken.push(["Dak buurthuis (hard, zonnepanelen)", R.buurthuis.gebouw, "N", "→ zwemvijver"], ["Daken schuren (hard, zonnepanelen)", R.schuren.aantal * R.schuren.gebouw, "N", "→ tuinvijver of wadi (open)"], ["Carportdak (zonnepanelen)", carportDak, "A", "→ zwemvijver"]);
  const overlap = [["Agri-PV-rijen op de akker", D.akker.pv.rijen * D.akker.pv.rijLengte * 1, "S", "± 1 m strook per rij, binnen de akker"],
    ["Veiligheidszone buurtaccu (indicatief " + G.accuAfstand + " m)", Math.PI * G.accuAfstand * G.accuAfstand, "N", "geen gebouwen; overlapt groen, weg en carport"],
    ["Infrasleuf (± " + G.sleufM + " m)", G.sleufM * 1, "N", "in de bermen en onder paden"]];
  const bebouwd = som(x => /^woning-|^buurthuis$|^schuren$|^nuts$|^verdeel$/.test(x.id)) + carportDak;
  const verhard = som(x => /^erf-|^rondweg$|^paden|^carport|^accu|^afval/.test(x.id)) + som(x => x.id === "rondweg-gras") * R.grastegelFactor + som(x => /^woning-|^buurthuis$|^schuren$/.test(x.id));
  const kpi = { totaal: tot, ha: tot / 1e4, nW, kavelsM2, uitgeefbaar: kavelsM2 / tot, mandelig: (tot - kavelsM2) / tot, bebouwd, gsi: bebouwd / tot,
    verhard, verhardPct: verhard / tot, groenWater: som(x => /^(Groen|Water)$/.test(x.cat)) / tot, akker: akStart, akkerMax: akMax,
    dichtheid: nW / (tot / 1e4), dichtheidZonderAkker: nW / ((tot - akMax) / 1e4), perWoning: tot / nW, wegL, kern, Vwadi: Vreq, singel, verhWeg, groenWadi };
  const kavelTabel = T3.map(t => ({ t, naam: NAAM[t], n: mix[t] || 0, kavel: kavel[t], woning: G.bebouwd[t], tuin: (kavel[t] - G.bebouwd[t]) * aT, erf: (kavel[t] - G.bebouwd[t]) * (1 - aT),
    groendak: G.bebouwd[t] * gd, pvdak: G.bebouwd[t] * (1 - gd), gsi: G.bebouwd[t] / kavel[t] }));
  // lijst voor kosten en ruimtetoets (zelfde opbouw als voorheen; namen met vaste beginwoorden)
  const g = id => (it.find(x => x.id === id) || { m2: 0 }).m2;
  const gemLijst = [["Buurthuis met erf", g("buurthuis") + g("buurthuis-erf"), "N"], ["Schuren met voorterrein", g("schuren") + g("schuren-erf"), "N"], ["Overdekte parkeerplaats (" + plekken + " plekken) met rijbaan", g("carport"), "A"],
    ["Buurtaccu, groepenkast en afvalplek", g("accu") + g("verdeel") + g("afval"), "N"], ["Zwemvijver met oever", g("zwem") + g("zwem-oever"), "A"], ["Tuinvijver", g("tuinvijver"), "A"],
    ["Gezamenlijk groen, bermen, houtsingel en wadi's", g("groen") + g("berm") + g("singel") + g("wadi"), "A"], ["Rondweg " + String(R.wegBreedte).replace(".", ",") + " m (± " + Math.round(wegL) + " m), waarvan grastegels", g("rondweg") + g("rondweg-gras"), "S"], ["Paden en plein", g("paden"), "N"],
    ["Kippenhok en ren (" + kippen + " kippen)", g("kippen"), "A"], ["Nutsgebouw, bassin en erfmolens", g("nuts") + g("bassin") + g("molens"), "N"], ["Akker voor de tuinderij, met agri-PV (deels nog weiland)", akMax, "N"]];
  return { items: it, daken, overlap, kpi, kavelTabel, gemLijst, kippen };
};

window.HZ_AFLEIDEN = function (D) {
  const c = D.mobiliteit && D.mobiliteit.carport; if (!c) return;
  const nW = D.woningen.reduce((a, w) => a + w.n, 0);
  c.plekken = Math.max(c.plekken, nW + (c.deelauto || 0));
  const L = c.plekken * c.breedte, p = c.paneel;
  c.dakM2 = Math.round(L * c.diepte);
  c.dakPanelen = Math.floor(L / p.b) * Math.floor(c.diepte / Math.cos(c.dakHelling * Math.PI / 180) / p.l);
  c.dakKWp = c.dakPanelen * p.Wp / 1000;
  c.wandPanelen = c.wandWpPerPlek ? Math.round(c.plekken * c.wandWpPerPlek / p.Wp) : Math.floor(L / p.l) * c.wandRijen;
  c.wandKWp = c.wandPanelen * p.Wp / 1000;
  const v = D.energie.scenarioC.vlakken;
  v.forEach(x => { if (/^Carport dak/.test(x.naam)) { x.kWp = c.dakKWp; x.naam = "Carport dak zuid 10° (" + c.dakPanelen + " × 600 Wp)"; }
                   if (/^Carport zuidwand/.test(x.naam)) { x.kWp = c.wandKWp; x.naam = "Carport zuidwand verticaal (" + c.wandPanelen + " × 600 Wp)"; } });
  if (D.zwemvijver) D.zwemvijver.dakCarport = c.dakM2;
  /* scenario C is de standaard in alle rekenmodellen (besluit 26-10-2026): woningdaken volgens C, extra vlakken in scenarioC.vlakken */
  D.energie.kWpDakOud = D.energie.kWpDak; D.energie.kWpDak = D.energie.scenarioC.kWpDakType; D.energie.pvExtraKWp = 0;
  if (D.mobiliteit.zappi) D.mobiliteit.zappi.n = c.plekken;
  /* kavels (besluit 27-10-2026 [119]): tuin en verharding per type = (kavel − bebouwd) × 75 % / 25 %; gemiddelde per woning volgt de mix */
  { const G = D.grond, mix = D.energie.mix, T3 = ["gezin", "senior", "junior"], nW = T3.reduce((a, t) => a + (mix[t] || 0), 0);
    G.tuinType = {}; G.verhardType = {};
    T3.forEach(t => { const rest = G.kavel[t] - G.bebouwd[t]; G.tuinType[t] = rest * G.aandeelTuin; G.verhardType[t] = rest * (1 - G.aandeelTuin); });
    D.tuinvijver.tuinPerWoningOud = D.tuinvijver.tuinPerWoning; D.verhard.perWoningM2Oud = D.verhard.perWoningM2;
    D.tuinvijver.tuinPerWoning = Math.round(T3.reduce((a, t) => a + mix[t] * G.tuinType[t], 0) / nW);
    D.verhard.perWoningM2 = Math.round(T3.reduce((a, t) => a + mix[t] * G.verhardType[t], 0) / nW);
    if (D.hemelwater) D.hemelwater.kratVerhardPW = D.verhard.perWoningM2;
    const ED = D.erfdieren, pers = D.woningen.reduce((a, w) => a + w.n * w.pers, 0);
    const kippen = Math.ceil(pers * ED.eierenPPweek * 52 / ED.eierenPerKip * (1 + ED.reserve));
    if (D.hemelwater) D.hemelwater.gemVerhardM2 = G.gemeenschappelijk.filter(g => /^(Rondweg|Paden)/.test(g[0])).reduce((x, g) => x + g[1], 0);   // weg + paden → wadi's
    G.gemeenschappelijk.forEach(g => { if (/^Kippenhok/.test(g[0])) { g[0] = "Kippenhok en ren (" + kippen + " kippen × " + (ED.renM2 + ED.hokM2) + " m²)"; g[1] = Math.round(kippen * (ED.renM2 + ED.hokM2)); } }); }
  if (D.grond) D.grond.gemeenschappelijk.forEach(g => { if (/parkeerplaats/i.test(g[0])) { g[0] = "Overdekte parkeerplaats (" + c.plekken + " plekken van 2,75 × 8 m) met rijbaan aan de noordkant"; g[1] = Math.round(L * (c.diepte + 6)); } });
  /* ruimteprogramma per doel [161]: vervangt de vaste lijst gezamenlijke voorzieningen; weg, paden en groen voeden het wadimodel */
  if (D.grond && D.grond.ruimte && window.HZ_RUIMTE) { const RR = window.HZ_RUIMTE(D); D.grond.gemeenschappelijk = RR.gemLijst; D.grond.ruimteR = RR;
    if (D.hemelwater) { D.hemelwater.gemVerhardM2 = Math.round(RR.kpi.verhWeg); D.hemelwater.groenM2 = Math.round(RR.kpi.groenWadi); } }
};
