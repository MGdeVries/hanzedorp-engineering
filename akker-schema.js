/* =====================================================================
   akker-schema.js – schematisch overzicht: grondwaterput → pomp (nutsgebouw)
   → beluchting en bassin → filters → bemesting → zonekleppen → druppelslangen,
   met sensoren, besturing en energievoorziening. Gedeeld door akker.html en
   akker-technisch.html. Tekent in een element met id "akkerSchema".
   ===================================================================== */
(function () {
  const zones = [0, 1, 2, 3, 4, 5, 6, 7];
  const svg = `
<svg viewBox="0 0 1000 700" width="100%" style="min-width:780px" role="img" aria-labelledby="akSchemaT">
<title id="akSchemaT">Schema akkerirrigatie. Een grondwaterput van maximaal 50 meter diep levert water aan één pomp in een nutsgebouwtje. Twee driewegkleppen kiezen of de pomp uit de put of uit het bassin zuigt, en of hij naar het bassin of naar de akker perst. Putwater gaat via een beluchter naar het open bassin; daar slaat ijzer neer. Voor de akker gaat het water uit het bassin via een zandfilter, een schijffilter, een watermeter, een injectiepunt voor bemesting met keerklep en een drukregelaar naar acht zonekleppen en de druppelslangen. Bodemvochtsensoren, regenmeter, bassinpeil, druk- en debietmeters en het weerbericht gaan naar de besturing. De pomp krijgt stroom van de zonnepanelen op de akker, het dorpsnet met buurtaccu en de netaansluiting als reserve.</title>
<defs>
  <marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--water)"/></marker>
  <marker id="se" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--clay)"/></marker>
  <marker id="sd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker>
</defs>
<style>.bx{fill:var(--surface);stroke:var(--line);stroke-width:1.5}.bw{fill:var(--surface);stroke:var(--water);stroke-width:2}.be{fill:var(--surface);stroke:var(--clay);stroke-width:2}.bg{fill:var(--surface);stroke:var(--green);stroke-width:2}.tb{font-size:13px;font-weight:600;fill:var(--fg)}.ts{font-size:11px;fill:var(--muted)}.pw{fill:none;stroke:var(--water);stroke-width:3}.pe{fill:none;stroke:var(--clay);stroke-width:2;stroke-dasharray:6 4}.pd{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3}</style>

<!-- weer en AI -->
<rect x="130" y="30" width="200" height="50" rx="25" class="bx"/>
<text x="230" y="52" text-anchor="middle" class="tb">Weerbericht · AI</text><text x="230" y="68" text-anchor="middle" class="ts">regen, verdamping, zon (KNMI e.d.)</text>
<path d="M200 80 L200 162" class="pd" marker-end="url(#sd)"/>

<!-- energie -->
<rect x="500" y="20" width="490" height="110" rx="10" style="fill:color-mix(in srgb, var(--clay) 7%, transparent);stroke:var(--clay);stroke-dasharray:6 4"/>
<text x="512" y="40" class="tb">Energie: zon eerst, net als reserve</text>
<rect x="512" y="52" width="150" height="46" rx="6" class="be"/><text x="587" y="72" text-anchor="middle" class="tb">Agri-PV akker</text><text x="587" y="88" text-anchor="middle" class="ts">verticaal, oost–west</text>
<rect x="676" y="52" width="150" height="46" rx="6" class="be"/><text x="751" y="72" text-anchor="middle" class="tb">Dorpsnet</text><text x="751" y="88" text-anchor="middle" class="ts">daken, molens, buurtaccu</text>
<rect x="840" y="52" width="140" height="46" rx="6" class="be"/><text x="910" y="72" text-anchor="middle" class="tb">Netaansluiting</text><text x="910" y="88" text-anchor="middle" class="ts">reserve</text>
<path d="M512 110 C440 110 380 130 352 162" class="pe" marker-end="url(#se)"/>
<text x="378" y="122" class="ts">stroom + 'zonne-overschot'</text>

<!-- nutsgebouw -->
<rect x="120" y="150" width="360" height="170" rx="10" style="fill:color-mix(in srgb, var(--line) 25%, transparent);stroke:var(--muted);stroke-dasharray:6 4"/>
<text x="130" y="312" class="ts">Nutsgebouwtje: vorstvrij, geventileerd, lekbak, afsluitbaar</text>
<rect x="130" y="164" width="140" height="44" rx="6" class="bx"/><text x="200" y="183" text-anchor="middle" class="tb">Besturing</text><text x="200" y="199" text-anchor="middle" class="ts">controller + planning</text>
<rect x="282" y="164" width="90" height="44" rx="6" class="be"/><text x="327" y="183" text-anchor="middle" class="tb">Freq.-</text><text x="327" y="199" text-anchor="middle" class="ts">regelaar</text>
<rect x="384" y="164" width="88" height="44" rx="6" class="bg"/><text x="428" y="183" text-anchor="middle" class="tb">Bemesting</text><text x="428" y="199" text-anchor="middle" class="ts">voorraad + pomp</text>
<rect x="130" y="240" width="72" height="40" rx="6" class="bw"/><text x="166" y="258" text-anchor="middle" class="tb">3-weg</text><text x="166" y="273" text-anchor="middle" class="ts">zuigzijde</text>
<rect x="222" y="232" width="92" height="56" rx="28" class="bw"/><text x="268" y="256" text-anchor="middle" class="tb">Pomp</text><text x="268" y="272" text-anchor="middle" class="ts">P1 ± 2,7 kW</text>
<rect x="334" y="240" width="72" height="40" rx="6" class="bw"/><text x="370" y="258" text-anchor="middle" class="tb">3-weg</text><text x="370" y="273" text-anchor="middle" class="ts">perszijde</text>
<path d="M202 260 L220 260" class="pw" marker-end="url(#sa)"/><path d="M314 260 L332 260" class="pw" marker-end="url(#sa)"/>
<path d="M327 208 L300 230" class="pe" marker-end="url(#se)"/>

<!-- put -->
<line x1="10" y1="340" x2="110" y2="340" style="stroke:var(--clay);stroke-width:2"/><text x="14" y="334" class="ts">maaiveld</text>
<rect x="44" y="340" width="28" height="320" style="fill:color-mix(in srgb, var(--clay) 12%, var(--surface));stroke:var(--clay)"/>
<rect x="49" y="600" width="18" height="52" style="fill:var(--surface);stroke:var(--water);stroke-dasharray:3 2"/>
<text x="80" y="620" class="tb">Putfilter</text><text x="80" y="636" class="ts">max. 50 m diep</text>
<line x1="20" y1="410" x2="100" y2="410" style="stroke:var(--water);stroke-dasharray:6 4"/>
<text x="80" y="428" class="ts">grondwaterpeil:</text><text x="80" y="442" class="ts">≤ ± 7 m aanzuigen,</text><text x="80" y="456" class="ts">dieper: dompelpomp</text>
<path d="M58 340 L58 300 L100 300 L100 260 L128 260" class="pw" marker-end="url(#sa)"/>
<text x="80" y="356" class="ts">putkop, zuigkorf</text>

<!-- bassin -->
<path d="M370 280 L370 520 L292 520" class="pw" marker-end="url(#sa)"/>
<text x="378" y="420" class="ts">putwater</text><text x="378" y="434" class="ts">naar bassin</text>
<rect x="196" y="502" width="94" height="38" rx="6" class="bw"/><text x="243" y="519" text-anchor="middle" class="tb">Beluchter</text><text x="243" y="533" text-anchor="middle" class="ts">cascade/sproeier</text>
<path d="M243 540 L243 560" class="pw" marker-end="url(#sa)"/>
<path d="M140 566 Q243 660 346 566 Z" style="fill:color-mix(in srgb, var(--water) 18%, var(--surface));stroke:var(--water);stroke-width:2"/>
<text x="243" y="588" text-anchor="middle" class="tb">Open bassin</text><text x="243" y="603" text-anchor="middle" class="ts">buffer · ijzer bezinkt</text>
<text x="243" y="680" text-anchor="middle" class="ts">peilsensor, overloop naar berging</text>
<path d="M172 568 L180 568 L180 360 L166 360 L166 284" class="pw" marker-end="url(#sa)"/>
<text x="186" y="470" class="ts">bassin → pomp</text>

<!-- leiding naar akker -->
<path d="M406 260 L496 260" class="pw" marker-end="url(#sa)"/>
<rect x="498" y="240" width="86" height="40" rx="6" class="bw"/><text x="541" y="258" text-anchor="middle" class="tb">Zandfilter</text><text x="541" y="273" text-anchor="middle" class="ts">terugspoelen</text>
<path d="M584 260 L594 260" class="pw" marker-end="url(#sa)"/>
<rect x="596" y="240" width="86" height="40" rx="6" class="bw"/><text x="639" y="258" text-anchor="middle" class="tb">Schijffilter</text><text x="639" y="273" text-anchor="middle" class="ts">120–200 mesh</text>
<path d="M682 260 L692 260" class="pw" marker-end="url(#sa)"/>
<rect x="694" y="240" width="90" height="40" rx="6" class="bw"/><text x="739" y="258" text-anchor="middle" class="tb">Watermeter</text><text x="739" y="273" text-anchor="middle" class="ts">puls, ≤ 10 m³/h</text>
<path d="M784 260 L794 260" class="pw" marker-end="url(#sa)"/>
<rect x="796" y="240" width="86" height="40" rx="6" class="bg"/><text x="839" y="258" text-anchor="middle" class="tb">Injectie</text><text x="839" y="273" text-anchor="middle" class="ts">+ keerklep</text>
<path d="M882 260 L892 260" class="pw" marker-end="url(#sa)"/>
<rect x="894" y="240" width="96" height="40" rx="6" class="bw"/><text x="942" y="258" text-anchor="middle" class="tb">Drukregelaar</text><text x="942" y="273" text-anchor="middle" class="ts">± 1,5 bar</text>
<path d="M472 186 C620 150 780 170 839 236" class="pd" marker-end="url(#sd)"/>
<text x="560" y="160" class="ts">voeding (plantgroeimiddel), na de filters</text>
<path d="M942 280 L942 300 L520 300 L520 326" class="pw"/>
<text x="500" y="318" class="ts"></text>

<!-- zones -->
<text x="494" y="341" text-anchor="end" class="ts">8 zonekleppen</text>
${zones.map(z => { const x = 520 + z * 58; return `<path d="M${x} 300 L${x} 324" class="pw"/><rect x="${x - 22}" y="326" width="44" height="22" rx="4" class="bw"/><text x="${x}" y="341" text-anchor="middle" class="ts">Z${z + 1}</text><path d="M${x} 348 L${x} 380" class="pw" marker-end="url(#sa)"/>`; }).join("")}
<rect x="490" y="382" width="500" height="150" rx="10" class="bg"/>
<text x="502" y="402" class="tb">Akker, max. 5.000 m², zones van ± 675 m²</text>
${zones.map(z => `<line x1="${520 + z * 58}" y1="412" x2="${520 + z * 58}" y2="500" style="stroke:var(--water);stroke-width:2;stroke-dasharray:2 3"/><circle cx="${532 + z * 58}" cy="470" r="5" style="fill:var(--clay)"/>`).join("")}
<text x="502" y="516" class="ts">druppelslangen 2 L/h per 30 cm · spoelkraan aan het eind</text>
<text x="502" y="528" class="ts">● bodemvochtsensor per zone (15 en 30 cm)</text>

<!-- sensoren -->
<rect x="490" y="560" width="300" height="120" rx="8" class="bx"/>
<text x="502" y="580" class="tb">Sensoren en metingen</text>
<text x="502" y="598" class="ts">• bodemvocht per zone, regenmeter, weerstation</text>
<text x="502" y="614" class="ts">• druk vóór en na de filters (filter vol?)</text>
<text x="502" y="630" class="ts">• debiet en m³ (registratie, max. 10 m³/h)</text>
<text x="502" y="646" class="ts">• bassinpeil, pomp-kWh, storingsmelding</text>
<text x="502" y="662" class="ts">• periodiek: ijzer, mangaan, EC, pH van het water</text>
<path d="M490 600 C430 590 300 400 230 212" class="pd" marker-end="url(#sd)"/>
<rect x="810" y="560" width="180" height="120" rx="8" class="bx"/>
<text x="822" y="580" class="tb">Niet vergeten</text>
<text x="822" y="598" class="ts">• aftappen bij vorst</text>
<text x="822" y="614" class="ts">• overspanning/aarding</text>
<text x="822" y="630" class="ts">• terugstroombeveiliging put</text>
<text x="822" y="646" class="ts">• melden bij het waterschap</text>
<text x="822" y="662" class="ts">• hek/afdekking bassin</text>
</svg>`;
  window.tekenAkkerSchema = function (id) { const el = document.getElementById(id || "akkerSchema"); if (el) el.innerHTML = svg; };
})();
