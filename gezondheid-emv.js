/* =====================================================================
   gezondheid-emv.js – rekenvoorbeelden elektromagnetische velden (window.GE)
   Vereist: hanzedorp-data.js, hanzedorp-lib.js (HZ)
   - Radiogolven (verre veld, vrije ruimte, zonder demping door wanden en zonder zendpauzes = bovengrens):
       S = P_eirp / (4 π r²)   [W/m²]
   - Magneetveld van een gebalanceerde driefasenkabel (benadering verre veld, hartafstand aders s ≪ r):
       B ≈ (µ0 / 2π) · √3 · I · s / r²  = 0,2 · √3 · I · s / r²   [µT; I in A, s en r in m]
   - Magneetveld van een nettostroom (zwerfstroom over aarde, leiding of PEN), enkele geleider:
       B = 0,2 · I_net / r   [µT]
   ===================================================================== */
(function () {
  const D = window.HANZEDORP_DATA, E = D.emv, nl = HZ.nl;
  const S = (mW, r) => mW / 1000 / (4 * Math.PI * r * r);                 // W/m²
  const Bkabel = (I, s, r) => 0.2 * Math.sqrt(3) * I * s / (r * r);       // µT
  const Bnet = (I, r) => 0.2 * I / r;                                      // µT
  const rKabel = (I, s, B) => Math.sqrt(0.2 * Math.sqrt(3) * I * s / B);  // m
  const rNet = (I, B) => 0.2 * I / B;
  const rRF = (mW, Sdoel) => Math.sqrt(mW / 1000 / (4 * Math.PI * Sdoel));
  const pct = v => v < 0.01 ? "< 0,01 %" : nl(v, v < 1 ? 2 : 1) + " %";

  function wifiTabel(tb, technisch) {
    const afst = [0.5, 1, 3];
    tb.innerHTML = E.wifi.map(([naam, mW]) => `<tr><td>${naam}</td><td class="num">${nl(mW)} mW</td>` +
      afst.map(r => { const s = S(mW, r); return `<td class="num">${technisch ? nl(s * 1e6) + " µW/m² · " : ""}${pct(s / E.rfLimietWm2 * 100)}</td>`; }).join("") +
      `<td class="num">${nl(rRF(mW, E.sbm.rfMuWm2[2] / 1e6), 1)} m</td></tr>`).join("");
  }
  function kabelTabel(tb, technisch) {
    const rows = E.kabels.map(([naam, I, s]) => `<tr><td>${naam}</td><td class="num">${nl(I, I < 2 ? 1 : 0)} A</td>${technisch ? `<td class="num">${nl(s * 1000)} mm</td>` : ""}<td class="num">${nl(Bkabel(I, s, 1), 2)} µT</td><td class="num">${nl(Bkabel(I, s, 3), 3)} µT</td><td class="num">${nl(rKabel(I, s, E.voorzorgMuT), 1)} m</td></tr>`);
    rows.push(`<tr style="color:var(--warn)"><td>Zwerfstroom van ${nl(E.zwerfA)} A over een waterleiding of PEN-geleider (komt niet voor bij een goed TN-S-net)</td><td class="num">${nl(E.zwerfA)} A</td>${technisch ? "<td class=\"num\">–</td>" : ""}<td class="num">${nl(Bnet(E.zwerfA, 1), 2)} µT</td><td class="num">${nl(Bnet(E.zwerfA, 3), 2)} µT</td><td class="num">${nl(rNet(E.zwerfA, E.voorzorgMuT), 1)} m</td></tr>`);
    tb.innerHTML = rows.join("");
  }
  window.GE = { S, Bkabel, Bnet, rKabel, rNet, rRF, wifiTabel, kabelTabel };
})();
