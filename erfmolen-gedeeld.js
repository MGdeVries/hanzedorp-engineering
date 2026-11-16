/* =====================================================================
   erfmolen-gedeeld.js – vergelijking zonder / met één erfmolen (window.EM)
   Vereist: hanzedorp-data.js, hanzedorp-energie.js (HE), hanzedorp-lib.js (HZ), energie-gedeeld.js (EG)
   Methode:
   - Twee uursimulaties van het dorp over 31 jaar (HE.simuleer): wind = 0 en wind = f, met
     f = 1 (molenopbrengst volgens KNMI-uurwind Heino) of f = E_ecoways / E_model (opbrengst volgens Ecoways).
   - Besparing B = ΔImport · p_in + ΔExport · p_uit   (Δ = met − zonder; ΔImport < 0 is besparing)
   - Jaarkosten K = A(I − S) + O, met annuïteit A(x) = x · r / (1 − (1 + r)^−n), n = levensduur, r = rente
   - Saldo = B − K; eenvoudige terugverdientijd T = (I − S) / (B − O); kostprijs molenstroom = K / E_molen
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, E = D.energie, W = E.wind, nl = HZ.nl;
  const molen = (D.beheer.componenten.find(c => c[0] === "molen") || []);
  const rotor = D.beheer.componenten.find(c => c[0] === "rotor");
  const STD = { opbr: "model", inv: Math.round((((molen[5] || 45000) + (molen[6] || 60000)) / 2 + (rotor ? (rotor[5] + rotor[6]) / 2 : 0)) / 1000) * 1000, sub: Math.round((E.wind.isdeEurM2 || 0) * Math.PI * (E.wind.D / 2) ** 2 / 100) * 100 + 5300, ond: 1000, prijs: D.financien ? D.financien.stroomprijs : 0.25, exp: 0.03,
                jaren: molen[7] || 20, rente: (D.net && D.net.accuKeuze && D.net.accuKeuze.rente) || 0.03 };
  const eur = v => (v < 0 ? "− € " : "€ ") + nl(Math.round(Math.abs(v) / 10) * 10);
  const MW = v => nl(v / 1000, 1);
  let s0 = null; const cache = {};
  const sim0 = () => s0 || (s0 = HE.simuleer({ wind: 0 }));
  function sim1(f) { const k = f.toFixed(3); return cache[k] || (cache[k] = HE.simuleer({ wind: f })); }
  const modelKWh = () => HE.windStat().gem;
  function factor(opbr) { return opbr === "ecoways" ? W.ecowaysKWh / modelKWh() : opbr === "fabrikant" ? (W.fabrikantMin + W.fabrikantMax) / 2 / modelKWh() : 1; }
  const ann = (x, r, n) => r ? x * r / (1 - Math.pow(1 + r, -n)) : x / n;

  function reken(o) {
    const a = sim0(), f = factor(o.opbr), b = sim1(f);
    const dImp = b.imp - a.imp, dExp = b.exp - a.exp, besp = -dImp * o.prijs + dExp * o.exp;
    const netto = Math.max(0, o.inv - o.sub), kost = ann(netto, o.rente, o.jaren) + o.ond;
    return { a, b, f, dImp, dExp, besp, kost, saldo: besp - kost, tvt: besp - o.ond > 0 ? netto / (besp - o.ond) : Infinity, lcoe: b.wind > 0 ? kost / b.wind : Infinity, netto };
  }

  function grafiekMaand(el, a, b) {
    const Wd = 600, H = 200, L = 36, B = 22, max = Math.max(...a.maand.map(m => m.imp), ...b.maand.map(m => m.imp), 1), bw = (Wd - L - 8) / 12;
    const y = v => H - B - (H - B - 8) * v / max, M = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Bijkoop per maand zonder en met erfmolen">`;
    [0, 0.5, 1].forEach(t => { const v = max * t; s += `<line x1="${L}" x2="${Wd - 4}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 4}" y="${y(v) + 4}" text-anchor="end" class="sm mono">${nl(v / 1000, 1)}</text>`; });
    a.maand.forEach((m, i) => { const x = L + i * bw + 3, w = (bw - 8) / 2;
      s += `<rect x="${x}" y="${y(m.imp)}" width="${w}" height="${H - B - y(m.imp)}" style="fill:var(--rain)"><title>${M[i]} zonder molen: ${nl(m.imp / 1000, 2)} MWh</title></rect>`;
      s += `<rect x="${x + w + 1}" y="${y(b.maand[i].imp)}" width="${w}" height="${H - B - y(b.maand[i].imp)}" style="fill:var(--water)"><title>${M[i]} met molen: ${nl(b.maand[i].imp / 1000, 2)} MWh</title></rect>`;
      s += `<text x="${x + w}" y="${H - 6}" text-anchor="middle" class="sm">${M[i]}</text>`; });
    el.innerHTML = s + "</svg>";
  }
  function grafiekJaar(el) {
    const ws = HE.windStat(), pj = ws.perJaar, Wd = 600, H = 190, L = 36, B = 22, eco = W.ecowaysKWh, max = Math.max(eco, ...pj) * 1.1;
    const JR = []; for (let j = 1994; JR.length < pj.length; j++) if (j !== 1998) JR.push(j);
    const val = p => p, jrI = i => JR[i];
    const bw = (Wd - L - 8) / pj.length, y = v => H - B - (H - B - 8) * v / max;
    let s = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Berekende molenopbrengst per jaar">`;
    [0, 0.5, 1].forEach(t => { const v = max * t; s += `<text x="${L - 4}" y="${y(v) + 4}" text-anchor="end" class="sm mono">${nl(v / 1000)}</text><line x1="${L}" x2="${Wd - 4}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>`; });
    pj.forEach((p, i) => { const x = L + i * bw + 1; s += `<rect x="${x}" y="${y(val(p))}" width="${bw - 2}" height="${H - B - y(val(p))}" style="fill:var(--sage)"><title>${jrI(i)}: ${nl(val(p) / 1000, 1)} MWh</title></rect>`;
      if (i % 5 === 0) s += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" class="sm">${jrI(i)}</text>`; });
    s += `<line x1="${L}" x2="${Wd - 4}" y1="${y(eco)}" y2="${y(eco)}" stroke="var(--straw-deep)" stroke-width="2" stroke-dasharray="6 4"/><text x="${Wd - 6}" y="${y(eco) - 5}" text-anchor="end" class="sm">Ecoways ${nl(eco / 1000)} MWh</text>`;
    el.innerHTML = s + "</svg>";
  }

  function init({ $, bindAll, technisch }) {
    const seg = (el, name, opts, std) => { $(el).innerHTML = opts.map(([v, l], i) => `<input type="radio" name="${name}" id="${name}${i}" value="${v}"${v === std ? " checked" : ""}><label for="${name}${i}">${l}</label>`).join(""); };
    seg("sOpbr", "op", [["model", "Onze berekening (KNMI Heino)"], ["ecoways", "Schatting Ecoways (" + nl(W.ecowaysKWh / 1000) + " MWh)"], ["fabrikant", "Midden fabrikant (" + nl((W.fabrikantMin + W.fabrikantMax) / 2000) + " MWh)"]], STD.opbr);
    $("mInv").value = STD.inv; $("mSub").value = STD.sub; $("mOnd").value = STD.ond; $("mPrijs").value = STD.prijs; $("mExp").value = STD.exp;
    if ($("windJaar")) grafiekJaar($("windJaar"));
    const lees = () => ({ opbr: document.querySelector("input[name=op]:checked").value, inv: +$("mInv").value, sub: +$("mSub").value, ond: +$("mOnd").value, prijs: +$("mPrijs").value, exp: +$("mExp").value, jaren: STD.jaren, rente: STD.rente });
    let t = null;
    function run() {
      const o = lees();
      $("mInvO").value = eur(o.inv); $("mSubO").value = eur(o.sub); $("mOndO").value = eur(o.ond); $("mPrijsO").value = "€ " + nl(o.prijs, 2) + "/kWh"; $("mExpO").value = "€ " + nl(o.exp, 2) + "/kWh";
      clearTimeout(t); t = setTimeout(() => {
        const r = reken(o), a = r.a, b = r.b, wi = (s, k) => [10, 11, 0, 1].reduce((x, m) => x + s.maand[m][k], 0);
        $("rBesp").textContent = eur(r.besp); $("rKost").textContent = eur(r.kost); $("rSaldo").textContent = eur(r.saldo);
        $("rSaldo").style.color = r.saldo >= 0 ? "var(--green)" : "var(--warn)";
        $("rTvt").textContent = isFinite(r.tvt) ? nl(r.tvt, 1) + " jaar" : "niet terug te verdienen";
        $("rLcoe").textContent = isFinite(r.lcoe) ? "€ " + nl(r.lcoe, 2) + "/kWh" : "–";
        const rij = (n, x, y, f, d = 1) => `<tr><td>${n}</td><td class="num">${f(x)}</td><td class="num">${f(y)}</td><td class="num">${f(y - x)}</td></tr>`;
        const mw = v => nl(v / 1000, 1), pc = v => nl(v * 100), pcd = v => (v >= 0 ? "+" : "") + nl(v * 100);
        $("tblVgl").querySelector("tbody").innerHTML =
          rij("Opwek molen (MWh/jaar)", a.wind, b.wind, mw) + rij("Opwek totaal (MWh/jaar)", a.opwek, b.opwek, mw) +
          `<tr><td>Winter gedekt (nov–feb)</td><td class="num">${pc(a.winterDekking)} %</td><td class="num">${pc(b.winterDekking)} %</td><td class="num">${pcd(b.winterDekking - a.winterDekking)} %-punt</td></tr>` +
          rij("Bijkoop van het net (MWh/jaar)", a.imp, b.imp, mw) + rij("Bijkoop in de winter nov–feb (MWh)", wi(a, "imp"), wi(b, "imp"), mw) +
          rij("Terug naar het net (MWh/jaar)", a.exp, b.exp, mw) + rij("Afgeschakeld bij overschot (MWh/jaar)", a.afgeschakeld || 0, b.afgeschakeld || 0, mw) +
          `<tr><td>Eigen stroom gebruikt</td><td class="num">${pc(a.zelf)} %</td><td class="num">${pc(b.zelf)} %</td><td class="num">${pcd(b.zelf - a.zelf)} %-punt</td></tr>`;
        if ($("mndImp")) grafiekMaand($("mndImp"), a, b);
        bindAll({ w0: pc(a.winterDekking), w1: pc(b.winterDekking), imp0: mw(a.imp), imp1: mw(b.imp), dImp: mw(a.imp - b.imp), dImpW: mw(wi(a, "imp") - wi(b, "imp")),
          besp: eur(r.besp), kost: eur(r.kost), saldoTxt: r.saldo >= 0 ? eur(r.saldo) + " per jaar voordeel" : eur(-r.saldo) + " per jaar duurder dan zonder molen",
          ecoMWh: nl(W.ecowaysKWh / 1000), modelMWh: mw(modelKWh()), jaren: nl(o.jaren), factor: nl(r.f, 2), netto: eur(r.netto) });
        if (technisch) technisch(r, o);
      }, 30);
    }
    document.querySelectorAll(".controls input").forEach(i => i.addEventListener(i.type === "range" ? "input" : "change", run)); run();
  }
  window.EM = { STD, reken, factor, modelKWh, init, ann };
})();
