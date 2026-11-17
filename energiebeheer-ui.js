/* energiebeheer-ui.js – weergave energiebeheer (EMS) en verbruiksbericht: verbruikersregister, klassen, codes,
   weekbericht (voorbeeld uit 2023–2025), codes per maand, scenario's en meetkosten.
   Invoer: HANZEDORP_DATA.ems (databron) en HANZEDORP_BERICHT (gegenereerd door bouwbericht.js). */
(function () {
  "use strict";
  const { D, nl } = window.HZ, E = D.ems, BR = window.HANZEDORP_BERICHT, T0 = Date.UTC(1994, 0, 1);
  const DAG = ["zo", "ma", "di", "wo", "do", "vr", "za"], MAAND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const code = c => E.codes[c];
  const datum = i => new Date(T0 + i * 864e5);
  const fmtD = i => { const d = datum(i); return `${DAG[d.getUTCDay()]} ${d.getUTCDate()} ${MAAND[d.getUTCMonth()]}`; };
  const iso = i => datum(i).toISOString().slice(0, 10);
  const tile = (c, t) => `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${code(c).kleur};color:#fff;font-weight:600;font-size:.85em;white-space:nowrap">${t || code(c).naam}</span>`;

  /* aantal stuks per regel */
  function aantal(a) {
    const mix = BR.mix, nW = mix.gezin + mix.senior + mix.junior;
    if (typeof a === "number") return a;
    if (a === "woningen") return nW;
    if (a === "plekken") return D.mobiliteit.carport.plekken;
    return mix[a] || 0;
  }
  /* kWh/jr voor het hele dorp */
  function kWhDorp(v) {
    const kw = v[6], mix = BR.mix;
    if (typeof kw === "string" && kw.startsWith("m:")) {
      const k = kw.slice(2);
      if (BR.mw.dorp[k] != null) return BR.mw.dorp[k];
      if (v[3] === "woningen") return ["gezin", "senior", "junior"].reduce((a, tp) => a + (BR.mw[tp][k] || 0) * mix[tp], 0);
      return (BR.mw.gezin[k] || 0) * aantal(v[3]);
    }
    if (v[0] === "laden") return BR.evJr;
    if (v[0] === "accu") return 0;
    return kw * aantal(v[3]);
  }
  function register(tbody, technisch) {
    const K = E.klassen;
    tbody.innerHTML = E.verbruikers.filter(v => aantal(v[3]) > 0).map(v => {
      const kl = K[v[7] - 1], kwh = kWhDorp(v), n = aantal(v[3]);
      return `<tr><td>${v[1]}</td><td>${v[2]}</td><td class="num">${n}</td><td class="num">${nl(v[4], v[4] < 1 ? 2 : 1)}${technisch ? " · " + v[5] + "f" : ""}</td>` +
        `<td class="num">${kwh ? nl(kwh / 1000, 1) : "–"}${technisch ? ` <span class="pill s-${v[10] === "G" ? "besloten" : v[10] === "A" ? "onderzocht" : "aanname"}" title="status">${v[10]}</span>` : ""}</td>` +
        `<td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${kl.kleur};margin-right:6px"></span>${kl.k} · ${kl.kort}</td>` +
        `<td>${v[8]}</td>${technisch ? `<td>${v[9]}</td>` : ""}</tr>`;
    }).join("");
  }
  function klassen(tbody) {
    tbody.innerHTML = E.klassen.map(k => `<tr><td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${k.kleur};margin-right:6px"></span><b>${k.k}. ${k.naam}</b></td><td>${k.uitleg}</td><td>${
      E.verbruikers.filter(v => v[7] === k.k && aantal(v[3]) > 0).map(v => v[1].replace(/ \(.*\)$/, "")).join(", ")}</td></tr>`).join("");
  }
  function codes(tbody) {
    tbody.innerHTML = E.codes.map((c, i) => `<tr><td>${tile(i)}</td><td><b>${c.kort}</b></td><td>${c.ems}</td><td>${c.jij}</td><td class="num">${nl(BR.gemC[i], 0)}</td></tr>`).join("");
  }

  /* ---------- weekbericht ---------- */
  const V = BR.voorbeeld, byI = {}; V.forEach((r, k) => byI[r[0]] = k);
  function slechtsteWeek(jaar) {
    let best = { s: -1, i: V[0][0] };
    for (let k = 0; k + 7 <= V.length; k++) { if (datum(V[k][0]).getUTCFullYear() !== jaar) continue; let s = 0; for (let j = 0; j < 7; j++) s += Math.max(0, V[k + j][1] - 2); if (s > best.s) best = { s, i: V[k][0] }; }
    return best.i;
  }
  function week(el, start) {
    const k0 = byI[start]; if (k0 == null) { el.innerHTML = "<p>Geen gegevens voor deze datum.</p>"; return; }
    const d7 = V.slice(k0, k0 + 7), c3 = Math.max(...d7.slice(0, 3).map(r => r[1])), cw = Math.max(...d7.map(r => r[1]));
    const kop = c3 >= 4 ? "Komende dagen weinig zon en wind. We kopen stroom bij en die is nu duur: kijk wat jouw keuzes kosten." : c3 === 3 ? "Minder zon en wind. Stroom is duurder; met een paar uur of een dag wachten bespaar je geld." :
      c3 === 2 ? "Genoeg voor de huizen. Auto's laden het voordeligst overdag." : d7[0][1] === 0 ? "Stroom over! Zet aan wat je kunt." : "Genoeg stroom voor iedereen.";
    const wacht = (() => { let n = 0; for (const r of d7) { if (r[1] <= 1) break; n++; } return n; })();
    const p = d7[0][4], snel = BR.snellader;
    const max = Math.max(...d7.map(r => Math.max(r[2], r[3] + BR.evJr / 365)));
    el.innerHTML = `<div class="bericht" style="border:2px solid ${code(c3).kleur};border-radius:12px;padding:14px 16px;display:grid;gap:10px">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><b style="font-size:1.1rem">Verbruiksbericht Hanzedorp · ${fmtD(start)}</b>${tile(c3, "Komende 3 dagen: " + code(c3).naam)}</div>
      <p style="margin:0;font-size:1.05rem">${kop}</p>
      <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">${d7.map(r => {
        const hA = Math.round(60 * r[2] / max), hV = Math.round(60 * r[3] / max);
        return `<div style="text-align:center;font-size:.8rem;display:grid;gap:3px"><span>${fmtD(r[0]).split(" ").slice(0, 2).join(" ")}</span>
          <div style="height:62px;display:flex;align-items:flex-end;justify-content:center;gap:3px" title="opwek ${nl(r[2])} kWh, vraag zonder auto's ${nl(r[3])} kWh"><span style="width:10px;height:${hA}px;background:var(--gold);border-radius:2px"></span><span style="width:10px;height:${hV}px;background:var(--muted);border-radius:2px"></span></div>
          <span style="height:8px;border-radius:4px;background:${code(r[1]).kleur}"></span><span>${code(r[1]).naam}</span></div>`; }).join("")}</div>
      <div class="sm" style="display:flex;gap:14px;flex-wrap:wrap"><span><span style="display:inline-block;width:10px;height:10px;background:var(--gold);border-radius:2px"></span> opwek (zon en wind)</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--muted);border-radius:2px"></span> verbruik zonder auto's</span></div>
      <ul style="margin:0;padding-left:1.1em;display:grid;gap:4px">
        <li><b>Wat het systeem doet:</b> ${code(c3).ems}.</li>
        <li><b>Wat jij kunt doen:</b> ${code(c3).jij}.</li>
        <li><b>Je auto:</b> ${c3 <= 1 ? "wordt vandaag geladen op zonnestroom." : wacht === 0 ? "wordt vandaag nog geladen op zonnestroom; daarna kan het een paar dagen duren." : wacht >= 7 ? "wordt waarschijnlijk pas over een week of later geladen. Geef in de app aan wanneer je moet rijden." : `wordt waarschijnlijk over ± ${wacht} ${wacht === 1 ? "dag" : "dagen"} geladen, als het weer zonniger of winderiger is.`}
          ${c3 >= 2 ? ` Moet je eerder weg? Thuis laden uit het net kost vandaag ± € ${nl(p, 2)} per kWh in de goedkoopste uren, een snellader ± € ${nl(snel, 2)}. <b>${p <= snel ? "Advies: laad vannacht thuis." : "Advies: laad onderweg bij een snellader."}</b>` : ""}</li>
      </ul></div>`;
  }
  function weekUI({ $, inp, uit, jaar }) {
    const min = V[0][0], maxI = V[V.length - 7][0];
    inp.min = iso(min); inp.max = iso(maxI);
    const zet = i => { inp.value = iso(i); week(uit, i); };
    inp.addEventListener("change", () => { const i = Math.round((Date.parse(inp.value + "T00:00:00Z") - T0) / 864e5); if (byI[i] != null && i <= maxI) week(uit, i); });
    zet(slechtsteWeek(jaar || 2024));
    return { zet, slechtsteWeek };
  }

  /* ---------- codes per maand (gestapelde staven, dagen) ---------- */
  function maandGrafiek(el) {
    const W = 580, H = 240, L = 34, Rr = 8, Tp = 16, Bm = 26, pw = W - L - Rr, ph = H - Tp - Bm, band = pw / 12, bw = band * 0.7;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gemiddeld aantal dagen per code per maand">`;
    for (let i = 0; i <= 5; i++) { const v = i * 6, y = Tp + ph - ph * v / 31; s += `<line x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}" style="stroke:var(--grid)"/><text x="${L - 5}" y="${y + 4}" text-anchor="end" class="sm mono">${v}</text>`; }
    s += `<text x="${L}" y="${Tp - 4}" class="sm">dagen per maand (gemiddeld ${BR.jaren} jaar)</text>`;
    BR.perMaand.forEach((m, k) => {
      let y = Tp + ph; const x = L + band * k + (band - bw) / 2;
      [4, 3, 2, 1, 0].forEach(c => { const h = ph * m[c] / 31; y -= h; if (h > 0.2) s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" style="fill:${code(c).kleur}"><title>${MAAND[k]} – ${code(c).naam}: ${nl(m[c], 1)} dagen</title></rect>`; });
      s += `<text x="${L + band * k + band / 2}" y="${H - 8}" text-anchor="middle" class="sm">${MAAND[k]}</text>`;
    });
    el.innerHTML = s + "</svg>" + `<div class="sm" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px">${E.codes.map((c, i) => `<span>${tile(i)}</span>`).join("")}</div>`;
  }

  /* ---------- meetkosten groepenkasten ---------- */
  /* Shelly Pro per set (prijzen incl. btw, webshop; arbeid S); aantallen: standaard = woningen − 1 (woning Melvin volledig) */
  function meetkosten() {
    const S = E.shelly, mix = BR.mix, nW = mix.gezin + mix.senior + mix.junior;
    const keer = { standaard: nW - 1, sauna: S.nSauna, melvin: 1, schuur: 1, dorp: 1 };
    const per = {}; let lo = 0, hi = 0, nDev = 0, nKan = 0;
    const kan = { pro4pm: 4, pro2pm: 2, pro1pm: 1, pro3em: 1, proEm50: 2, switchAddon: 0, pro2: 0, lan: 0, contactor3f: 0 };
    Object.entries(S.sets).forEach(([k, s]) => {
      const hw = s.items.reduce((a, [id, n]) => a + n * S.prijs[id], 0), dev = s.items.reduce((a, [id, n]) => a + (id === "contactor3f" ? 0 : n), 0);
      const ch = s.items.reduce((a, [id, n]) => a + n * kan[id], 0);
      per[k] = { titel: s.titel, hw, lo: hw + s.arbeid[0], hi: hw + s.arbeid[1], n: keer[k], dev, ch, items: s.items };
      lo += per[k].lo * keer[k]; hi += per[k].hi * keer[k]; nDev += dev * keer[k]; nKan += ch * keer[k];
    });
    const mid = [S.midDorp.n * S.midDorp.eur[0] * 1.21, S.midDorp.n * S.midDorp.eur[1] * 1.21];
    return { per, keer, shelly: [lo, hi], mid, totaal: [lo + mid[0], hi + mid[1]], nDev, nKan, nMid: S.midDorp.n };
  }
  function stuklijst(tbody) {
    const m = meetkosten(), S = E.shelly, eur = v => "€ " + nl(v);
    tbody.innerHTML = Object.values(m.per).map(p => `<tr><td><b>${p.titel}</b></td><td>${p.items.map(([id, n, w]) => `${n} × ${S.naam[id]}${w ? ` – <span class="sm">${w}</span>` : ""}`).join("<br>")}</td>` +
      `<td class="num">${eur(p.hw)}</td><td class="num">${eur(p.lo)}–${nl(p.hi)}</td><td class="num">${p.n}</td><td class="num">${eur(p.lo * p.n)}–${nl(p.hi * p.n)}</td></tr>`).join("") +
      `<tr><td><b>MID-meters dorpsniveau</b></td><td>${S.midDorp.n} × MID-meter 3-fase (per woningkabel en per gedeelde voorziening), voor kostenverdeling</td><td class="num">–</td><td class="num">–</td><td class="num">${S.midDorp.n}</td><td class="num">${eur(m.mid[0])}–${nl(m.mid[1])}</td></tr>` +
      `<tr><td colspan="5"><b>Totaal (incl. btw)</b></td><td class="num"><b>${eur(m.totaal[0])}–${nl(m.totaal[1])}</b></td></tr>`;
  }

  function scenarios(tbody) {
    const S = BR.scen, rij = (n, s, t) => `<tr><td>${n}</td><td class="num">${nl(s.imp / 1000, 1)}</td><td class="num">${nl(s.evGedw)}</td><td class="num">${nl(s.pVraag)}</td><td class="num">${s.tekU ? nl(s.tekU, 1) : "0"}</td><td>${t}</td></tr>`;
    tbody.innerHTML = rij("Laden mag 2 dagen schuiven (huidig model)", S.flex2, "–") +
      rij(`Verbruiksbericht: laden mag ${BR.flexDagen} dagen schuiven`, S.bericht7, `${nl((S.flex2.imp - S.bericht7.imp) / 1000, 1)} MWh/jr minder import`) +
      rij(`+ ${E.sauna.n} sauna's (${nl(E.sauna.kW)} kW), niet gestuurd`, S.saunaVrij, `sauna's ${nl(S.saunaVrij.saunaKWh / 1000, 1)} MWh/jr`) +
      rij(`+ ${E.sauna.n} sauna's, bewoners stellen uit bij oranje/rood`, S.saunaStuur, `${nl(S.saunaStuur.saunaGeblokt)} kWh/jr aan sessies vrijwillig verschoven`);
  }

  window.EBU = { register, klassen, codes, week, weekUI, maandGrafiek, meetkosten, stuklijst, scenarios, aantal, kWhDorp, tile, fmtD };
})();
