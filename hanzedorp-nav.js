/* hanzedorp-nav.js – vaste index links, zoekfunctie, inhoudsopgave van de pagina en 'werkstand'
   (instellingen van werkpagina's onthouden in deze browser, uitkomsten doorgeven aan het rapport).
   Gebruik: <nav class="top" id="nav" aria-label="Pagina's"></nav> + dit script als laatste. */
(function () {
  "use strict";
  const START = [["index.html", "Start"]];
    /* volgorde naar logica van opbouw: wie wonen er → grond → wonen binnen en buiten → water → land, voedsel en dieren → energie → verbindingen → gezondheid → veiligheid → eigendom → onderhoud → financiën */
  const WERK = [
    ["bewoners.html", "Bewoners & comfort", "bewoners-technisch.html"],
    ["bouwen.html", "Bouwen & kavelpaspoort", "bouwen-technisch.html"],
    ["grond.html", "Grond & kosten", "grond-technisch.html"],
    ["biofilisch.html", "Biofilisch inrichten", "biofilisch-technisch.html"],
    ["natuur.html", "Natuurinclusief wonen", "natuur-technisch.html"],
    ["water.html", "Water in de woning", "water-technisch.html"],
    ["hemelwater.html", "Kratten & wadi's", "hemelwater-technisch.html"],
    ["tuinwater.html", "Zwemvijver & tuinwater", "tuinwater-technisch.html"],
    ["akker.html", "Akker: water en panelen", "akker-technisch.html"],
    ["voedsel.html", "Tuinderij: zaaien en oogsten", "voedsel-technisch.html"],
    ["erfdieren.html", "Dieren op het erf", "erfdieren-technisch.html"],
    ["opslag.html", "Voorraad & koelcellen", "opslag-technisch.html"],
    ["energie.html", "Energieopwek", "energie-technisch.html"],
    ["erfmolen.html", "Erfmolen", "erfmolen-technisch.html"],
    ["mobiliteit.html", "Mobiliteit & laden", "mobiliteit-technisch.html"],
    ["netaansluiting.html", "Netaansluiting & handel", "netaansluiting-technisch.html"],
    ["digitale-infrastructuur.html", "Digitale infrastructuur", "digitale-infrastructuur-technisch.html"],
    ["gezondheid.html", "Gezondheid", "gezondheid-technisch.html"],
    ["veiligheid.html", "Veiligheid", "veiligheid-technisch.html"],
    ["eigendom.html", "Eigendom", "eigendom-technisch.html"],
    ["onderhoud.html", "Onderhoud & vervanging", "onderhoud-technisch.html"],
    ["financien.html", "Financiële planning", "financien-technisch.html"]
  ];
  const INVOER = [["inventarisatie.html", "Inventarisatie per woning"]];
  const DOSSIER = [["dossier.html", "Dossier en voortgang"], ["ketenpartners.html", "Ketenpartners"]];
  const SLOT = [["rapport.html", "Conclusie & rapport"]];
  const OVER = [["juridisch.html", "Juridisch & colofon"]];
  const HP = window.HZPROJECT || null, EDITIE = !!(HP && HP.editie), INTERN = HP ? HP.intern : [];
  if (EDITIE) [WERK, INVOER, DOSSIER].forEach(l => { for (let i = l.length - 1; i >= 0; i--) if (INTERN.includes(l[i][0])) l.splice(i, 1); });
  const LOCATIE = [["locatie.html", "Locatie & perceel"]];
  if (!EDITIE) LOCATIE.push(["projecten.html", "Projecten (beheer)"]);
  window.HZNAV = { WERK };

  const hier = (decodeURIComponent(location.pathname.split("/").pop()) || "index.html");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const opslag = {
    get(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  window.HZOPSLAG = opslag;

  /* ---------- inhoudsopgave van deze pagina ---------- */
  function paginaIndex() {
    const hs = [...document.querySelectorAll(".wrap h2[id]")].filter(h => !h.closest("aside"));
    if (!hs.length) return "";
    return '<ol class="toc">' + hs.map(h => `<li><a href="#${h.id}">${esc(h.textContent.trim())}</a></li>`).join("") + "</ol>";
  }

  function link([b, n, t], isWerk) {
    const cur = hier === b || hier === t;
    let s = `<li${cur ? ' class="cur"' : ""}><a href="${b}"${hier === b ? ' aria-current="page"' : ""}>${esc(n)}</a>`;
    if (cur) {
      if (t) s += `<div class="sw"><a href="${b}"${hier === b ? ' aria-current="page"' : ""}>basis</a><a href="${t}"${hier === t ? ' aria-current="page"' : ""}>technisch</a></div>`;
      s += paginaIndex();
    }
    return s + "</li>";
  }
  const groep = (titel, lijst) => `<div class="grp"><h2 class="gh">${titel}</h2><ol class="pl">${lijst.map(link).join("")}</ol></div>`;

  /* ---------- actief project ---------- */
  function projectBlok() {
    if (!HP) return "";
    const D = window.HANZEDORP_DATA, pr = D.project, nl = v => Math.round(v).toLocaleString("nl-NL");
    const toets = pr.toets === "past" ? "✓ past op het terrein" : pr.toets === "onbekend" ? "terrein nog onbekend" : "⚠ " + pr.toets;
    const sel = EDITIE ? "" : `<label for="hzp" class="vh">Project kiezen</label><select id="hzp">${HP.lijst.map((p, i) => `<option value="${esc(p.id)}"${p.id === pr.id ? " selected" : ""}>${i + 1}. ${esc(p.naam)}</option>`).join("")}</select>`;
    const nr = pr.nr || 1, pc = pr.perceel;
    return `<div class="sproj"><span class="spk">Variabel · locatie</span>` +
      `<div class="spnr"><span class="spbadge" aria-hidden="true">P${nr}</span><span><span class="vh">Project ${nr}: </span>${sel || `<b>${esc(pr.naam)}</b>`}</span></div>` +
      `<span class="spm">Gemeente ${esc(pr.gemeente)} · klimaat ${esc(pr.stationNaam)}${pr.klimaatVoorlopig ? " (voorlopig)" : ""}</span>` +
      `<span class="spm">${pc ? "Perceel getekend: " + nl(pc.m2) + " m²" : "Nog geen perceel gekozen"}</span>` +
      `<span class="spm spt-${pr.toets === "past" ? "ok" : pr.toets === "onbekend" ? "nb" : "nok"}">${toets}${pr.terreinM2 ? `<br>nodig ${nl(pr.benodigdM2)} m², terrein ${nl(pr.terreinM2)} m²` : ""}</span>` +
      `<a class="spbtn" href="locatie.html">Locatie en perceel kiezen →</a></div>`;
  }
  const oud = document.getElementById("nav");
  const aside = document.createElement("aside");
  aside.className = "side"; aside.id = "side"; aside.setAttribute("aria-label", "Index");
  aside.innerHTML =
    `<div class="sbrand"><a href="index.html"><img src="hanzedorp-logo.png" alt="" width="40" height="47"><div>Hanzedorp<span>Engineering</span></div></a></div>` +
    `<div class="zoek" role="search"><label for="zq" class="vh">Zoeken in alle pagina's</label>` +
    `<input id="zq" type="search" placeholder="Zoeken…  ( / )" autocomplete="off" aria-controls="zres"><div id="zres" class="zres" hidden></div></div>` +
    projectBlok() +
    `<div class="sidx">` + groep("Begin", START) + groep("Vast · werkpagina's (wat we bouwen)", WERK) + groep("Variabel · locatie (waar we bouwen)", LOCATIE) + (INVOER.length ? groep("Invoer", INVOER) : "") + groep("Haalbaarheid & vergunning", DOSSIER) + groep("Uitkomst", SLOT) + groep("Over dit document", OVER) +
    `<div id="stand" class="stand" hidden></div></div>`;
  document.body.insertBefore(aside, document.body.firstChild);
  if (oud) oud.remove();
  document.body.classList.add("met-side");
  const hzp = document.getElementById("hzp"); if (hzp) hzp.onchange = () => HP.kies(hzp.value);
  if (EDITIE) document.querySelectorAll("[data-intern]").forEach(e => e.remove());

  const bar = document.createElement("div");
  bar.className = "sbar";
  bar.innerHTML = `<button type="button" id="sbtn" aria-controls="side" aria-expanded="false">☰ Index</button><a href="index.html" class="sbn"><img src="hanzedorp-logo.png" alt="" width="26" height="31">Hanzedorp Engineering</a><button type="button" id="sbz" aria-label="Zoeken">⌕</button>`;
  document.body.insertBefore(bar, aside);
  const scrim = document.createElement("div"); scrim.className = "scrim"; scrim.hidden = true; document.body.appendChild(scrim);
  function open(o) { document.body.classList.toggle("side-open", o); scrim.hidden = !o; document.getElementById("sbtn").setAttribute("aria-expanded", o); }
  document.getElementById("sbtn").onclick = () => open(!document.body.classList.contains("side-open"));
  document.getElementById("sbz").onclick = () => { open(true); setTimeout(() => zq.focus(), 50); };
  scrim.onclick = () => open(false);
  aside.addEventListener("click", e => { if (e.target.closest("a") && innerWidth < 1100) open(false); });

  /* actieve sectie markeren */
  const tocA = [...aside.querySelectorAll(".toc a")];
  if (tocA.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) tocA.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-10% 0px -75% 0px" });
    tocA.forEach(a => { const h = document.getElementById(a.getAttribute("href").slice(1)); if (h) io.observe(h); });
  }

  /* ---------- zoeken (index uit hanzedorp-zoek.js, vooraf gebouwd) ---------- */
  const zq = document.getElementById("zq"), zres = document.getElementById("zres");
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let IDX = null;
  function laadIndex(cb) {
    if (IDX) return cb();
    if (window.HZ_ZOEK) { IDX = prep(window.HZ_ZOEK); return cb(); }
    const s = document.createElement("script"); s.src = "hanzedorp-zoek.js";
    s.onload = () => { IDX = prep(window.HZ_ZOEK || []); cb(); };
    s.onerror = () => { zres.hidden = false; zres.innerHTML = '<p class="zl">Zoekindex niet gevonden.</p>'; };
    document.head.appendChild(s);
  }
  function prep(arr) { return arr.map(r => Object.assign({}, r, { n: norm(r.p + " " + r.h + " " + r.x), nh: norm(r.p + " " + r.h) })); }
  function snip(x, terms) {
    const n = norm(x); let i = -1;
    for (const t of terms) { i = n.indexOf(t); if (i >= 0) break; }
    const a = Math.max(0, i - 60), b = Math.min(x.length, (i < 0 ? 0 : i) + 140);
    let s = (a > 0 ? "…" : "") + x.slice(a, b) + (b < x.length ? "…" : "");
    s = esc(s);
    terms.forEach(t => {
      if (t.length < 2) return;
      const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split("").map(c => c + "[\\u0300-\\u036f]?").join("") + ")", "gi");
      s = s.replace(re, "<mark>$1</mark>");
    });
    return s;
  }
  let kies = -1;
  function zoek() {
    const q = zq.value.trim();
    if (q.length < 2) { zres.hidden = true; zres.innerHTML = ""; return; }
    laadIndex(() => {
      const terms = norm(q).split(/\s+/).filter(Boolean);
      const hits = IDX.filter(r => terms.every(t => r.n.includes(t)))
        .map(r => ({ r, sc: terms.reduce((s, t) => s + (r.nh.includes(t) ? 5 : 0) + (r.n.split(t).length - 1), 0) + (r.u.includes("technisch") ? 0 : 0.5) }))
        .sort((a, b) => b.sc - a.sc).slice(0, 25);
      kies = -1;
      zres.hidden = false;
      zres.innerHTML = hits.length
        ? `<p class="zl">${hits.length === 25 ? "25+" : hits.length} treffer${hits.length === 1 ? "" : "s"}</p><ol>` + hits.map(({ r }) =>
          `<li><a href="${r.u}${r.id ? "#" + r.id : ""}"><b>${esc(r.p)}</b>${r.h ? " › " + esc(r.h) : ""}<span>${snip(r.x, terms)}</span></a></li>`).join("") + "</ol>"
        : '<p class="zl">Geen treffers. Probeer een ander woord.</p>';
    });
  }
  let zt; zq.addEventListener("input", () => { clearTimeout(zt); zt = setTimeout(zoek, 120); });
  zq.addEventListener("keydown", e => {
    const as = [...zres.querySelectorAll("a")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); if (!as.length) return;
      kies = (kies + (e.key === "ArrowDown" ? 1 : -1) + as.length) % as.length;
      as.forEach((a, i) => a.classList.toggle("k", i === kies)); as[kies].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && as.length) { e.preventDefault(); location.href = as[Math.max(0, kies)].href; }
    else if (e.key === "Escape") { zq.value = ""; zoek(); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); if (innerWidth < 1100) open(true); zq.focus(); }
  });

  /* ---------- werkstand: instellingen onthouden + uitkomsten voor het rapport ---------- */
  const isWerk = WERK.some(([b]) => b === hier);
  if (!isWerk) return;
  const KEY = HP ? HP.key(hier) : "hz-stand:" + hier;
  const ctlIn = () => [...document.querySelectorAll(".wrap .ctl input, .wrap .ctl select")].filter(el => el.id || el.name);
  const sleutel = el => el.type === "radio" ? "r:" + el.name : (el.id ? "i:" + el.id : null);
  function lees() {
    const v = {};
    ctlIn().forEach(el => {
      const k = sleutel(el); if (!k) return;
      if (el.type === "radio") { if (el.checked) v[k] = el.value; }
      else if (el.type === "checkbox") v[k] = el.checked;
      else v[k] = el.value;
    });
    return v;
  }
  function omschrijf() {
    const out = [];
    document.querySelectorAll(".wrap .ctl").forEach(c => {
      if (c.hidden || c.closest("[hidden]")) return;
      const lg = c.querySelector("legend");
      if (lg) {
        const r = c.querySelector("input[type=radio]:checked");
        if (r) { const l = c.querySelector(`label[for="${r.id}"]`); out.push([lg.textContent.trim(), (l ? l.textContent : r.value).trim()]); }
        return;
      }
      const lb = c.querySelector("label"), inp = c.querySelector("input,select");
      if (!lb || !inp) return;
      if (inp.type === "range") { const t = lb.textContent.replace(/\s+/g, " ").trim(); const i = t.indexOf(":"); out.push(i > 0 ? [t.slice(0, i), t.slice(i + 1).trim()] : [t, inp.value]); }
      else if (inp.type === "checkbox") out.push([lb.textContent.trim(), inp.checked ? "ja" : "nee"]);
      else if (inp.tagName === "SELECT") out.push([lb.textContent.trim(), inp.options[inp.selectedIndex] ? inp.options[inp.selectedIndex].text : ""]);
      else if (inp.value !== "") out.push([lb.textContent.trim(), inp.value]);
    });
    return out;
  }
  function uitkomsten() {
    const out = [];
    document.querySelectorAll(".wrap .result").forEach(r => {
      if (r.closest("[hidden]")) return;
      const sec = r.closest("section"), h = sec && sec.querySelector("h2");
      let h3 = null; for (let n = r.previousElementSibling; n; n = n.previousElementSibling) if (/^H[34]$/.test(n.tagName)) { h3 = n; break; }
      const rij = [...r.children].map(d => { const b = d.querySelector("b"), s = d.querySelector("span"); return b && s && b.textContent.trim() ? [b.textContent.trim(), s.textContent.trim()] : null; }).filter(Boolean);
      if (rij.length) out.push({ kop: (h3 ? h3.textContent : h ? h.textContent : "").trim(), rij });
    });
    return out;
  }
  const standaard = lees();
  const naam = (WERK.find(([b]) => b === hier) || [])[1];
  function bewaar() {
    const v = lees();
    const afw = Object.keys(v).filter(k => v[k] !== standaard[k]);
    const rec = { pagina: hier, naam, tijd: new Date().toISOString(), waarden: v, afwijkend: afw, instellingen: omschrijf(), uitkomsten: uitkomsten() };
    opslag.set(KEY, rec);
    /* in een frame van het rapport: ook rechtstreeks doorgeven (bij file:// delen browsers de opslag niet altijd tussen bestanden) */
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ hzStand: rec }, "*"); } catch (e) {}
    toonStand(afw.length);
  }
  function toonStand(n) {
    const el = document.getElementById("stand");
    el.hidden = false;
    el.innerHTML = n
      ? `<p><b>${n}</b> instelling${n === 1 ? "" : "en"} afwijkend van de standaard. Ze worden onthouden in deze browser en gaan mee naar het rapport.</p><button type="button" id="standReset">Standaard herstellen</button>`
      : `<p>Standaardinstellingen. Wijzigingen worden onthouden in deze browser en gaan mee naar het rapport.</p>`;
    const b = document.getElementById("standReset");
    if (b) b.onclick = () => { opslag.set(KEY, { reset: true }); location.reload(); };
  }
  function zet(v) {
    ctlIn().forEach(el => {
      const k = sleutel(el); if (!k || !(k in v)) return;
      let veranderd = false;
      if (el.type === "radio") { if (el.value === v[k] && !el.checked) { el.checked = true; veranderd = true; } }
      else if (el.type === "checkbox") { if (el.checked !== v[k]) { el.checked = v[k]; veranderd = true; } }
      else if (el.value !== v[k]) { el.value = v[k]; veranderd = true; }
      if (veranderd) { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    });
  }
  const oudSt = opslag.get(KEY);
  if (oudSt && oudSt.waarden && !/[?&]standaard/.test(location.search)) zet(oudSt.waarden);
  let bt;
  const plan = (ms) => { clearTimeout(bt); bt = setTimeout(bewaar, ms); };
  document.addEventListener("input", e => { if (e.target.closest(".wrap .ctl")) plan(900); });
  document.addEventListener("change", e => { if (e.target.closest(".wrap .ctl")) plan(900); });
  /* eerste opslag pas als de pagina klaar is met rekenen */
  if (document.readyState === "complete") plan(700); else addEventListener("load", () => plan(700));
})();
