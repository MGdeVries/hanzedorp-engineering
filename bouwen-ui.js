/* bouwen-ui.js – weergave thema Bouwen (window.BWU). Vereist: hanzedorp-lib.js (HZ), bouwen-gedeeld.js (BW) */
(function () {
  const D = window.HANZEDORP_DATA, B = D.bouwen, nl = HZ.nl;
  const NAAM = { gezin: "Gezinswoning", senior: "Seniorenwoning", junior: "Jongerenwoning" }, T = ["gezin", "senior", "junior"];
  const seg = (el, naam, opties, std) => { el.innerHTML = opties.map(([v, l], i) => `<input type="radio" name="${naam}" id="${naam}${i}" value="${v}"${String(v) === String(std) ? " checked" : ""}><label for="${naam}${i}">${l}</label>`).join(""); };
  const val = n => document.querySelector(`input[name=${n}]:checked`).value;

  function materialen(tb) { tb.innerHTML = B.materialen.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join(""); }

  function zonUI({ $, technisch }) {
    seg($("sVenster"), "zv", B.venster.opties.map(([v, l]) => [v, l]), B.venster.std);
    const std = { zGoot: B.type.gezin.goot, zHel: B.type.gezin.helling };
    const zet = () => Object.entries(std).forEach(([id, v]) => $(id).value = v);
    function run() {
      const v = +val("zv"), goot = +$("zGoot").value, hel = +$("zHel").value;
      $("zGootO").value = nl(goot, 1); $("zHelO").value = hel;
      const o = t => ({ venster: v, helling: hel, goot: t === "gezin" ? goot : B.type[t].goot });
      const uren = BW.UREN[v], zz = uren.map(u => BW.zon(u)), lo = zz.reduce((a, z) => z.h < a.h ? z : a);
      $("zKpi").innerHTML = [[nl(BW.zon(12).h, 1) + "°", "zonhoogte 21 december, 12:00 zonnetijd"], [nl(lo.h, 1) + "°", "laagste zonhoogte in het venster"],
        [nl(BW.k(v), 2) + " ×", "schaduw naar het noorden per meter hoogte"], [nl(BW.afstand("gezin", o("gezin")), 0) + " m", "schaduw achter een gezinswoning"],
        [nl(Math.max(BW.afstand("senior", o("senior")), BW.afstand("junior", o("junior"))), 0) + " m", "schaduw achter een lage woning"]]
        .map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join("");
      const vk = BW.verkaveling({ venster: v, helling: hel });
      $("tblZon").querySelector("tbody").innerHTML = T.map(t => { const d = BW.afstand(t, o(t));
        return `<tr><td>${NAAM[t]}</td><td class="num">${B.type[t].lagen}</td><td class="num">${nl(BW.nok(t, o(t)), 1)} m</td><td class="num">${nl(d, 1)} m</td>` +
          `<td>${t === "gezin" ? "noordelijke rij: op akker, weiland of houtsingel" : "op de tuinen en de weg tussen de rijen"}</td></tr>`; }).join("") +
        (technisch ? zz.map(z => `<tr class="note"><td colspan="5">${z.uur}:00 – zonhoogte ${nl(z.h, 2)}°, ${nl(z.a, 1)}° van het zuiden; NZ-factor ${nl(z.kNZ, 2)}, OW-factor ${nl(z.kOW, 2)}</td></tr>`).join("") : "");
      $("zToets").innerHTML = vk.filter(x => x.t !== "gezin").map(x => `<p class="${x.past ? "okbox" : "warnbox"}"><b>${NAAM[x.t]} in de zuidelijke rij:</b> nodig ${nl(x.nodig, 1)} m tussen de huizen, ` +
        `beschikbaar ${nl(x.beschikbaar, 1)} m (zuidtuin gezinswoning ${nl(x.zuidtuinNoord)} m + weg met bermen ${nl(x.weg, 1)} m + noordstrook eigen kavel ${nl(x.noordstrook)} m). ` +
        (x.past ? "Dat past." : "Dat past niet: kies een grotere afstand, een lagere nok of een andere plek.") + `</p>`).join("") +
        `<p class="read note">Aanname: de gezinswoning staat aan de noordkant van haar kavel, de lage woning aan de zuidkant van de hare. Bij een echte locatie maakt de stedenbouwkundige het plan; deze regel is daar een eis voor.</p>`;
    }
    zet(); $("zReset").addEventListener("click", () => { zet(); run(); });
    document.querySelectorAll("#sVenster input, #zGoot, #zHel").forEach(i => i.addEventListener("input", run)); run();
  }

  function paspoortUI({ $ }) {
    seg($("sType"), "pt", T.map(t => [t, NAAM[t]]), "gezin");
    function run() {
      const t = val("pt"), p = BW.paspoort(t);
      const rij = [
        ["Kavel", `± ${nl(p.kavel)} m² (voorbeeldmaat ${p.maat})`],
        ["Bebouwd oppervlak", `hooguit ${nl(p.bebouwd)} m² (woning en bijgebouw samen)`],
        ["Bouwvlak", `binnen ${B.randBinnen} m van de kavelgrens met een buurkavel en ${B.randBuiten} m van de buitengrens van Hanzedorp (bij de voorbeeldmaat ± ${nl(p.bouwvlak)} m²)`],
        ["Doorwaadbare zone", `strook van ${B.doorwaadbaar} m aan drie zijden, vrij toegankelijk voor de buren (recht van overpad)`],
        ["Bouwlagen en hoogte", `${p.lagen} bouwlaag${p.lagen > 1 ? "en" : ""}, goothoogte hooguit ${nl(p.goot, 1)} m; ligging zo dat er op 21 december tussen 10 en 14 uur geen schaduw op een andere woning valt (rekenwaarde nokhoogte ${nl(p.nok, 1)} m → ${nl(p.afstand, 0)} m schaduw)`],
        ["Dakaanzicht", "vanaf maaiveld een zadel-, wolfs- of schilddak, passend bij de omliggende boerderijen; een plat dak met schuine dakrand mag; passiefhuiseisen gaan voor"],
        ["Energieprestatie", `passiefhuis: verwarming ≤ ${B.passief.verwarming} kWh/m²·jr, primair ≤ ${B.passief.primair} kWh/m²·jr, n50 ≤ ${nl(B.passief.n50, 1)} h⁻¹, < ${B.passief.oververhitting} % uren > 25 °C; PHPP-berekening vooraf, blowerdoortest tijdens de bouw en bij oplevering; BENG via gelijkwaardigheid`],
        ["Installaties", `compactunit (balansventilatie met WTW, ventilatieluchtwarmtepomp, tapwatervat); geen gas; geen buitenunit; installatieruimte ≥ ${p.installatie} m², niet naast een slaapkamer`],
        ["Zonnepanelen", `ruimte voor ± ${nl(p.kWp, 1)} kWp op het eigen dak; anders elders op het terrein, bij voorkeur verticaal op het zuiden; panelen en omvormer zijn gezamenlijk bezit (recht van opstal)`],
        ["Materialen", "volgens de materialenlijst: hout, stro, vlas, hennep, leem bij voorkeur; beton, glaswol, bitumen en zink alleen met motivering"],
        ["Water", "regenwatertank 2 m³ voor toilet en wasmachine, urinoir; water rond de woning naar infiltratiekratten; waterdoorlatende verharding"],
        ["Aansluitingen", "stroom en glasvezel uit het dorpsnet, drinkwater met submeter, riool; leidingen via de infrasleuf (recht van leiding)"],
        ["Natuur", `minstens ${B.natuurPunten} natuurpunten (nestkasten, groendak, egeldoorgang, haag in plaats van schutting)`],
        ["Levensloop", p.lagen === 1 ? "gelijkvloers" : "alle voorzieningen op de begane grond of een thuislift mogelijk"],
        ["Erfdienstbaarheden", "overpad (doorwaadbare zone), weg (alleen nooddiensten en verhuizing), uitzicht en zon, afwatering, leidingen, opstal voor panelen"]
      ];
      $("pas").innerHTML = `<div class="eyebrow"><span>Kavelpaspoort</span><span>${NAAM[t]}</span><span>${D.project ? D.project.naam : ""}</span></div>` +
        `<dl>${rij.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl>` +
        `<p class="note">Voorstel, aan te passen in overleg (besluit 04-11-2026). Woonoppervlak rekenbasis ${nl(p.opp)} m².</p>` +
        `<div><button type="button" id="pasKnop" class="seg" style="padding:4px 10px">Afdrukken of opslaan als pdf</button></div>`;
      $("pasKnop").addEventListener("click", () => { document.body.classList.add("print-pas"); window.print(); setTimeout(() => document.body.classList.remove("print-pas"), 500); });
    }
    document.querySelectorAll("#sType input").forEach(i => i.addEventListener("change", run)); run();
  }
  window.BWU = { materialen, zonUI, paspoortUI };
})();
