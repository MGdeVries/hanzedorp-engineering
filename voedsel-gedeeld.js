/* =====================================================================
   voedsel-gedeeld.js – behoefte, oppervlak, voorraad en zaaiplan-grafiek
   voor voedsel.html en voedsel-technisch.html
   ===================================================================== */
(function () {
  const { D, MND, nl, bindAll } = HZ, V = D.voedsel, K = D.akker;
  function behoefte(monden, o = {}) {
    const og = o.opbrGroente || V.opbrGroente, of = o.opbrFruit || V.opbrFruit, verlies = o.verlies != null ? o.verlies : V.verlies;
    const eetG = monden * V.groenteGpd * 365 / 1000, eetF = monden * V.fruitGpd * 365 / 1000;        // kg/jr gegeten
    const prodG = eetG / (1 - verlies), prodF = eetF / (1 - verlies);                              // kg/jr te oogsten
    const m2G = prodG / og, m2F = prodF / of, m2 = m2G + m2F, m2pp = m2 / monden;
    const voorraadFrac = V.rustWeken / (V.oogstWeken + V.rustWeken);
    const voorraad = (eetG + eetF) * voorraadFrac / (1 - verlies);                                   // kg in te maken/bewaren
    return { monden, eetG, eetF, prodG, prodF, m2G, m2F, m2, m2pp, mondenMax: K.maxM2 / m2pp, voorraad, voorraadFrac,
      seizoensFactor: (V.oogstWeken + V.rustWeken) / V.oogstWeken, seizoensFactorBruto: (V.oogstWeken + V.rustWeken) / V.oogstWeken / (1 - verlies) };
  }
  const std = behoefte(V.monden), honderd = behoefte(100 * 4), honderd2 = behoefte(100 * 2.2);
  function bind(extra = {}) {
    bindAll(Object.assign({
      vGroente: nl(V.groenteGpd), vFruit: nl(V.fruitGpd), vVerlies: nl(V.verlies * 100), vOpbrG: nl(V.opbrGroente, 1), vOpbrF: nl(V.opbrFruit, 1),
      vMonden: nl(V.monden), vM2: nl(Math.round(std.m2 / 10) * 10), vM2pp: nl(std.m2pp), vMaxMonden: nl(Math.floor(std.mondenMax / 5) * 5),
      vEetG: nl(Math.round(std.eetG / 10) * 10), vEetF: nl(Math.round(std.eetF / 10) * 10), vVoorraad: nl(Math.round(std.voorraad / 10) * 10),
      vSeizoen: nl(std.seizoensFactor * 100), vSeizoenBruto: nl(std.seizoensFactorBruto * 100), vWeken: nl(V.oogstWeken), vRust: nl(V.rustWeken),
      v100m2: nl(Math.round(honderd.m2 / 100) * 100), v100m2b: nl(Math.round(honderd2.m2 / 100) * 100), aMax: nl(K.maxM2)
    }, extra));
  }
  /* zaaiplan als balkendiagram per gewas en maand */
  function zaaiplan(el) {
    const G = V.gewassen, L = 190, cw = 46, rh = 22, T = 30, W = L + cw * 12 + 10, H = T + rh * G.length + 10;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:${W}px" role="img" aria-label="Zaaiplan: per gewas de maanden voor binnen zaaien, buiten zaaien of planten en oogsten">`;
    MND.forEach((m, i) => s += `<text x="${L + cw * i + cw / 2}" y="18" text-anchor="middle" class="sm">${m}</text>`);
    G.forEach((g, r) => {
      const y = T + rh * r;
      s += `<text x="${L - 8}" y="${y + 15}" text-anchor="end" class="sm">${g.n}</text>`;
      s += `<rect x="${L}" y="${y + 2}" width="${cw * 12}" height="${rh - 4}" style="fill:${r % 2 ? "var(--surface)" : "color-mix(in srgb, var(--line) 30%, transparent)"}"/>`;
      const blok = (ms, kleur, y0, h) => (ms || []).forEach(m => s += `<rect x="${L + cw * (m - 1) + 1}" y="${y + y0}" width="${cw - 2}" height="${h}" rx="2" style="fill:${kleur}"><title>${g.n} – ${MND[m - 1]}</title></rect>`);
      blok(g.zb, "var(--rain)", 3, 6); blok(g.zp, "var(--green)", 9, 6); blok(g.o, g.g === "fruit" ? "var(--warn)" : "var(--clay)", 15, 5);
    });
    el.innerHTML = s + "</svg>";
  }
  /* verwerkingskalender: per maand gewassen die geoogst worden en een bewaarmethode hebben */
  const methNaam = { koel: "koel bewaren", wecken: "wecken", drogen: "drogen", pekelen: "pekelen", invriezen: "invriezen", inblikken: "inblikken", veld: "op het veld laten staan", vers: "vers eten" };
  function verwerking() {
    return MND.map((m, i) => {
      const lijst = V.gewassen.filter(g => g.o.includes(i + 1) && g.m.some(x => x !== "vers" && x !== "veld"));
      const meth = {}; lijst.forEach(g => g.m.forEach(x => { if (x !== "vers" && x !== "veld") meth[x] = (meth[x] || 0) + 1; }));
      return { maand: m, gewassen: lijst.map(g => g.n), methoden: Object.keys(meth).sort((a, b) => meth[b] - meth[a]).map(x => methNaam[x]) };
    });
  }
  window.VO = { behoefte, std, bind, zaaiplan, verwerking, methNaam };
})();
