/* =====================================================================
   bijkoop-ui.js – bijkoopcalculator voor donkere, windstille dagen (‘dunkelflaute’) – window.BK
   Invoer: HANZEDORP_BIJKOOP (dagbalans 2023–2025, bouwbijkoop.js), HANZEDORP_PRIJS (EPEX day-ahead NL, uurprijzen), HANZEDORP_DATA.net.
   Methode (per gekozen periode van n dagen):
   - dagtekort d_i = verbruik_i + laadvraag_i − opwek_i (laadvraag weg als ‘auto's laden onderweg’);
   - benodigde inkoop Q = max_k Σ_{i≤k} d_i − accuvoorraad (grootste opgelopen tekort, min wat de accu aan het begin heeft), ≥ 0;
   - maximaal te kopen = P_net × 24 × n;
   - slim: Q in de goedkoopste uren van de periode (≤ P_net per uur); zonder sturing: tegen het tijdgewogen gemiddelde van alle uren;
     ongunstig: in de duurste uren;
   - prijs all-in = (beurs + opslag + energiebelasting) × (1 + btw).
   Vereenvoudiging: de volgorde binnen de periode (eerst kopen, dan gebruiken) wordt alleen via de accu bewaakt, niet per uur.
   ===================================================================== */
(function () {
  "use strict";
  const BKD = window.HANZEDORP_BIJKOOP, P = window.HANZEDORP_PRIJS, N = window.HANZEDORP_DATA.net, nl = window.HZ.nl;
  const P0 = Date.UTC(2023, 0, 1), iso = d => new Date(P0 + d * 864e5).toISOString().slice(0, 10);
  const DAG = ["zo", "ma", "di", "wo", "do", "vr", "za"], MND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const fmt = d => { const x = new Date(P0 + d * 864e5); return `${DAG[x.getUTCDay()]} ${x.getUTCDate()} ${MND[x.getUTCMonth()]} ${x.getUTCFullYear()}`; };
  const byD = {}; BKD.dagen.forEach(r => byD[r[0]] = r);
  const EB = N.eb[0].t, OPS = N.opslagIn, BTW = N.btw, allIn = p => (p + OPS + EB) * (1 + BTW);
  const prijs = (d, h) => { const i = d * 24 + h; return i >= 0 && i < P.p.length ? P.p[i] / 1e5 : null; };
  const jaarGem = y => { let s = 0, n = 0; for (let d = 0; d < P.p.length / 24; d++) { if (new Date(P0 + d * 864e5).getUTCFullYear() !== y) continue; for (let h = 0; h < 24; h++) { const p = prijs(d, h); if (p != null) { s += p; n++; } } } return n ? s / n : 0; };

  function reken({ start, n, netKW, accuKWh, onderweg }) {
    const rows = []; let cum = 0, maxCum = 0;
    for (let i = 0; i < n; i++) {
      const r = byD[start + i]; if (!r) break;
      const laden = onderweg ? 0 : BKD.evDag, d = r[2] + laden - r[1];
      cum += d; if (cum > maxCum) maxCum = cum;
      rows.push({ d: start + i, opwek: r[1], verbruik: r[2] + laden, tekort: d });
    }
    const Q = Math.max(0, maxCum - accuKWh), uren = [];
    rows.forEach(x => { for (let h = 0; h < 24; h++) { const p = prijs(x.d, h); if (p != null) uren.push({ d: x.d, h, p }); } });
    const maxKoop = netKW * uren.length, koop = Math.min(Q, maxKoop);
    const vul = lijst => { let rest = koop, kaal = 0, inc = 0, per = {}; for (const u of lijst) { if (rest <= 0) break; const q = Math.min(netKW, rest); rest -= q; kaal += q * u.p; inc += q * allIn(u.p); per[u.d] = (per[u.d] || 0) + q; } return { kaal, inc, per }; };
    const slim = vul(uren.slice().sort((a, b) => a.p - b.p)), duur = vul(uren.slice().sort((a, b) => b.p - a.p));
    const gemP = uren.reduce((s, u) => s + u.p, 0) / Math.max(1, uren.length);
    const dom = { kaal: koop * gemP, inc: koop * allIn(gemP) };
    const maxP = uren.reduce((m, u) => u.p > m.p ? u : m, { p: -1e9 });
    rows.forEach(x => { x.koop = slim.per[x.d] || 0; const pr = uren.filter(u => u.d === x.d).map(u => u.p); x.gemP = pr.reduce((a, b) => a + b, 0) / Math.max(1, pr.length); });
    return { rows, Q, koop, maxKoop, tekortRest: Math.max(0, Q - maxKoop), slim, dom, duur, gemP, maxP, uren: uren.length };
  }

  function ui(el) {
    const kast = window.HANZEDORP_DATA.energie.accu, accuStd = Math.round((kast.kWh || 600) * (1 - (N.reserve || 0.3)));
    const gem23 = jaarGem(2023), gem24 = jaarGem(2024), gem25 = jaarGem(2025);
    el.innerHTML = `
      <div class="controls">
        <div class="ctl"><label for="bkStart">Begindatum</label><input type="date" id="bkStart" min="2023-01-01" max="2025-12-25"></div>
        <div class="ctl"><label for="bkN">Aantal dagen: <output id="bkNO"></output></label><input type="range" id="bkN" min="1" max="21" step="1" value="7"></div>
        <div class="ctl"><label>Netaansluiting</label><div class="seg" id="bkNet"></div></div>
        <div class="ctl"><label for="bkAccu">Voorraad in de buurtaccu bij het begin: <output id="bkAccuO"></output> kWh</label><input type="range" id="bkAccu" min="0" max="840" step="20" value="${accuStd}"></div>
        <div class="ctl"><label><input type="checkbox" id="bkOnder"> Auto's laden in deze dagen onderweg (snellader)</label></div>
        <div class="ctl"><label>Zwaarste weken 2023–2025</label><div class="seg" id="bkTop"></div></div>
      </div>
      <div class="result" id="bkKpi" aria-live="polite" style="margin-top:10px"></div>
      <div id="bkChart" style="margin-top:8px"></div>
      <div class="note" style="display:flex;gap:14px;flex-wrap:wrap"><span><span style="display:inline-block;width:10px;height:10px;background:var(--gold)"></span> opwek zon en wind</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--water)"></span> verbruik</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--sage)"></span> slim gekocht (goedkoopste uren)</span><span><span style="display:inline-block;width:14px;height:2px;background:#b3261e;vertical-align:middle"></span> gemiddelde beursprijs</span></div>
      <details style="margin-top:6px"><summary>Per dag</summary><div class="scroll"><table><thead><tr><th>Dag</th><th class="num">Opwek (kWh)</th><th class="num">Verbruik (kWh)</th><th class="num">Tekort (kWh)</th><th class="num">Slim gekocht (kWh)</th><th class="num">Gem. beursprijs (ct/kWh)</th></tr></thead><tbody id="bkTbl"></tbody></table></div></details>
      <h3 style="margin-top:12px">Wat kost jouw keuze?</h3>
      <p class="note">Op de eerste dag van de gekozen periode, om 19:00 (avondpiek), tegenover het goedkoopste uur in de 3 dagen daarna. Prijzen all-in. Het verschil is wat je bespaart door te wachten; of dat het waard is, beslis jij.</p>
      <div class="scroll"><table><thead><tr><th>Keuze</th><th class="num">kWh</th><th class="num">Nu (19:00)</th><th class="num">Goedkoopste moment</th><th>Wanneer</th><th class="num">Verschil</th></tr></thead><tbody id="bkKeuze"></tbody></table></div>
      <p class="note">Ter vergelijking, gemiddelde beursprijs over het hele jaar: 2023 ${nl(gem23 * 100, 1)} ct, 2024 ${nl(gem24 * 100, 1)} ct, 2025 ${nl(gem25 * 100, 1)} ct per kWh (kaal). All-in = beursprijs + opslag € ${nl(OPS, 2)} + energiebelasting € ${nl(EB, 3)}, plus ${nl(BTW * 100)} % btw.</p>`;
    const $ = id => el.querySelector("#" + id);
    $("bkNet").innerHTML = [[17.25, "3 × 25 A"], [27.6, "3 × 40 A"], [34.5, "3 × 50 A"], [55.2, "3 × 80 A"]].map(([v, l], i) => `<input type="radio" name="bkNet" id="bkNet${i}" value="${v}"${i === 0 ? " checked" : ""}><label for="bkNet${i}">${l}</label>`).join("");
    $("bkTop").innerHTML = BKD.zwaarst.map(([d], i) => `<button type="button" data-d="${d}">${fmt(d).split(" ").slice(1).join(" ")}</button>`).join("");
    $("bkStart").value = iso(BKD.zwaarst[0][0]);
    function run() {
      const start = Math.round((Date.parse($("bkStart").value + "T00:00:00Z") - P0) / 864e5), n = +$("bkN").value;
      const netKW = +el.querySelector("input[name=bkNet]:checked").value, accuKWh = +$("bkAccu").value, onderweg = $("bkOnder").checked;
      $("bkNO").value = n; $("bkAccuO").value = nl(accuKWh);
      const R = reken({ start, n, netKW, accuKWh, onderweg }), eu = v => "€ " + nl(Math.round(v));
      const ct = (k, q) => q ? nl(k / q * 100, 1) + " ct/kWh" : "–";
      $("bkKpi").innerHTML = [
        [nl(Math.round(R.koop)) + " kWh", `bijkopen in ${R.rows.length} dagen (${nl(R.koop / Math.max(1, R.rows.length))} kWh per dag)`],
        [nl(Math.round(R.maxKoop)) + " kWh", `maximaal te kopen met ${nl(netKW, 2)} kW (${nl(netKW * 24)} kWh per dag)`],
        [R.tekortRest > 0 ? nl(Math.round(R.tekortRest)) + " kWh" : "geen", R.tekortRest > 0 ? "komt niet binnen: auto's laden dan onderweg" : "tekort: de aansluiting is ruim genoeg"],
        [eu(R.slim.inc), `kosten slim kopen (goedkoopste uren, all-in; gem. ${ct(R.slim.inc, R.koop)})`],
        [eu(R.dom.inc), `kosten zonder op de prijs te letten (all-in; ${ct(R.dom.inc, R.koop)})`],
        [eu(R.duur.inc), `kosten als je in de duurste uren koopt (${ct(R.duur.inc, R.koop)})`],
        [nl(R.maxP.p * 100, 1) + " ct", `duurste uur in deze periode (beurs, kaal; ${R.maxP.d != null ? fmt(R.maxP.d) + " " + R.maxP.h + ":00" : ""})`]
      ].map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join("");
      window.HZ.bars($("bkChart"), { labels: R.rows.map(x => fmt(x.d).split(" ").slice(1, 3).join(" ")), series: [
        { name: "opwek", values: R.rows.map(x => x.opwek), color: "var(--gold)", unit: "kWh" },
        { name: "verbruik", values: R.rows.map(x => x.verbruik), color: "var(--water)", unit: "kWh" },
        { name: "slim gekocht", values: R.rows.map(x => Math.round(x.koop)), color: "var(--sage)", unit: "kWh" }],
        line: { values: R.rows.map(x => +(x.gemP * 100).toFixed(1)), color: "#b3261e" }, unit: "kWh per dag", lineUnit: "gem. beursprijs (ct/kWh)", labelEvery: R.rows.length > 10 ? 2 : 1 });
      $("bkTbl").innerHTML = R.rows.map(x => `<tr><td>${fmt(x.d)}</td><td class="num">${nl(x.opwek)}</td><td class="num">${nl(x.verbruik)}</td><td class="num">${nl(Math.round(x.tekort))}</td><td class="num">${nl(Math.round(x.koop))}</td><td class="num">${nl(x.gemP * 100, 1)}</td></tr>`).join("");
      { const d0 = R.rows.length ? R.rows[0].d : null, KEUZE = [["Sauna (± 1,5 uur)", 10], ["Auto laden (± 200 km)", 40], ["Oven met pyrolyse", 3], ["Wasdroger", 2.5], ["Wasmachine 40 °C", 0.9]];
        if (d0 != null) {
          const nu = prijs(d0, 19); let best = { p: 1e9 };
          for (let dd = d0; dd < d0 + 4; dd++) for (let h = 0; h < 24; h++) { if (dd === d0 && h <= 19) continue; const p = prijs(dd, h); if (p != null && p < best.p) best = { p, d: dd, h }; }
          $("bkKeuze").innerHTML = KEUZE.map(([n, k]) => `<tr><td>${n}</td><td class="num">${nl(k, 1)}</td><td class="num">€ ${nl(k * allIn(nu), 2)}</td><td class="num">€ ${nl(k * allIn(best.p), 2)}</td><td>${fmt(best.d).split(" ").slice(0, 3).join(" ")} ${best.h}:00</td><td class="num">€ ${nl(k * (allIn(nu) - allIn(best.p)), 2)}</td></tr>`).join("");
        } }
      return R;
    }
    el.addEventListener("input", run); el.addEventListener("change", run);
    $("bkTop").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { $("bkStart").value = iso(+b.dataset.d); run(); } });
    return run();
  }
  window.BK = { reken, ui, fmt, iso };
})();
